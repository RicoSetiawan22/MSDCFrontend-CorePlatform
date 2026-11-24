import { useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "@shared/components/PageHeader";
import { useRackList } from "../api/useRacks";
import { useSiteList } from "../api/useSites";
import { useMetricReadingList } from "../api/useMonitoring";
import {
  MonitoringDashboardStatusBanner,
  MonitoringDashboardKPICards,
  MonitoringDashboardToolbar,
  MonitoringDashboardGrid,
  type StatusConditionFilter,
  type RackTelemetryData,
} from "../components/monitoring-dashboard";
import type { Rack } from "../types/rack";
import type { MetricReading } from "../types/monitoring";

/**
 * RackMonitoringDashboardPage
 *
 * Halaman makro dashboard monitoring suhu & kelembapan seluruh rak data center.
 * Menampilkan status real-time, 4 kartu KPI beranimasi hover, toolbar pencarian & filter,
 * serta grid kartu rak modern dengan tombol CTA langsung ke telemetri rack terpilih.
 *
 * Arsitektur visual selaras 100% dengan SiteListPage & RackListPage (2 Container Kartu Putih).
 */
export function RackMonitoringDashboardPage() {
  const navigate = useNavigate();

  // State filter & search
  const [search, setSearch] = useState<string>("");
  const [siteFilter, setSiteFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<StatusConditionFilter>("all");

  // Query seluruh inventori rak (200 item)
  const {
    data: racksPage,
    isLoading: isLoadingRacks,
    isRefetching: isRefetchingRacks,
    isError: isErrorRacks,
    error: racksError,
    refetch: refetchRacks,
    dataUpdatedAt: racksUpdatedAt,
  } = useRackList({ per_page: 200 });

  // Query telemetri pembacaan sensor IoT terkini
  const {
    data: readingsPage,
    isRefetching: isRefetchingReadings,
    refetch: refetchReadings,
  } = useMetricReadingList({ per_page: 200 });

  // Query daftar site untuk opsi dropdown filter
  const {
    data: sitesPage,
    isRefetching: isRefetchingSites,
    refetch: refetchSites,
  } = useSiteList({ per_page: 100 });

  const rawRacks: Rack[] = useMemo(() => racksPage?.data ?? [], [racksPage?.data]);
  const rawReadings: MetricReading[] = useMemo(() => readingsPage?.data ?? [], [readingsPage?.data]);
  const sites = useMemo(() => sitesPage?.data ?? [], [sitesPage?.data]);

  // Map pembacaan terakhir per rack_id & evaluasi kondisi termal ASHRAE
  const telemetryByRack = useMemo(() => {
    const map = new Map<number, RackTelemetryData>();

    // Urutkan readings descending berdasarkan recorded_at
    const sortedReadings = [...rawReadings].sort(
      (a, b) => new Date(b.recorded_at).getTime() - new Date(a.recorded_at).getTime()
    );

    for (const r of sortedReadings) {
      if (!r.rack_id) continue;
      const current = map.get(r.rack_id) || {
        temperature: null,
        humidity: null,
        status: "unmonitored" as const,
        lastRecordedAt: null,
      };

      const val = typeof r.value === "string" ? parseFloat(r.value) : Number(r.value);

      if (r.metric_type === "temperature" && current.temperature === null && !isNaN(val)) {
        current.temperature = val;
        if (!current.lastRecordedAt) current.lastRecordedAt = r.recorded_at;
      }
      if (r.metric_type === "humidity" && current.humidity === null && !isNaN(val)) {
        current.humidity = val;
        if (!current.lastRecordedAt) current.lastRecordedAt = r.recorded_at;
      }

      map.set(r.rack_id, current);
    }

    // Evaluasi status ASHRAE TC 9.9 untuk rak yang memiliki data
    for (const [, data] of map.entries()) {
      if (data.temperature !== null || data.humidity !== null) {
        let status: "normal" | "warning" | "critical" = "normal";
        let reason: string | undefined = undefined;

        const temp = data.temperature;
        const hum = data.humidity;

        // Evaluasi Suhu ASHRAE TC 9.9: Kritis <15 atau >32, Warning <18 atau >27
        if (temp !== null) {
          if (temp > 32 || temp < 15) {
            status = "critical";
            reason = `Suhu kritis (${temp}°C)`;
          } else if (temp > 27 || temp < 18) {
            status = "warning";
            reason = `Suhu warning (${temp}°C)`;
          }
        }

        // Evaluasi Kelembapan ASHRAE TC 9.9: Kritis <30 atau >70, Warning <40 atau >60
        if (hum !== null && status !== "critical") {
          if (hum > 70 || hum < 30) {
            status = "critical";
            reason = `Kelembapan kritis (${hum}%)`;
          } else if ((hum > 60 || hum < 40) && status === "normal") {
            status = "warning";
            reason = `Kelembapan warning (${hum}%)`;
          }
        }

        data.status = status;
        data.breachReason = reason;
      }
    }

    return map;
  }, [rawReadings]);

  // Hitung statistik KPI untuk kartu ringkasan
  const stats = useMemo(() => {
    let monitoredCount = 0;
    let tempSum = 0;
    let tempCount = 0;
    let humSum = 0;
    let humCount = 0;
    let normalCount = 0;
    let warningCount = 0;
    let criticalCount = 0;

    for (const rack of rawRacks) {
      const telem = telemetryByRack.get(rack.id);
      if (telem && (telem.temperature !== null || telem.humidity !== null)) {
        monitoredCount++;
        if (telem.temperature !== null) {
          tempSum += telem.temperature;
          tempCount++;
        }
        if (telem.humidity !== null) {
          humSum += telem.humidity;
          humCount++;
        }
        if (telem.status === "normal") normalCount++;
        if (telem.status === "warning") warningCount++;
        if (telem.status === "critical") criticalCount++;
      }
    }

    return {
      totalRacks: rawRacks.length,
      monitoredCount,
      avgTemp: tempCount > 0 ? (tempSum / tempCount).toFixed(1) : null,
      avgHum: humCount > 0 ? (humSum / humCount).toFixed(1) : null,
      normalCount,
      warningCount,
      criticalCount,
    };
  }, [rawRacks, telemetryByRack]);

  // Filter rak berdasarkan site dan search query terlebih dahulu untuk menghitung conditionCounts
  const siteAndSearchFilteredRacks = useMemo(() => {
    return rawRacks.filter((rack) => {
      // Filter site
      if (siteFilter) {
        const rackSiteId = rack.site_room?.site?.id;
        if (rackSiteId !== undefined && rackSiteId !== null) {
          if (String(rackSiteId) !== siteFilter) return false;
        } else {
          return false;
        }
      }

      // Filter search
      if (search.trim()) {
        const q = search.toLowerCase().trim();
        const matchCode = rack.rack_code.toLowerCase().includes(q);
        const matchRoom = rack.site_room?.room_name?.toLowerCase().includes(q) ?? false;
        const matchSite = rack.site_room?.site?.site_name?.toLowerCase().includes(q) ?? false;
        if (!matchCode && !matchRoom && !matchSite) return false;
      }

      return true;
    });
  }, [rawRacks, siteFilter, search]);

  // Hitung badge counter untuk tombol pills filter (Semua, Normal, Warning, Critical)
  const conditionCounts = useMemo(() => {
    let normal = 0;
    let warning = 0;
    let critical = 0;

    for (const rack of siteAndSearchFilteredRacks) {
      const telem = telemetryByRack.get(rack.id);
      if (telem?.status === "normal") normal++;
      else if (telem?.status === "warning") warning++;
      else if (telem?.status === "critical") critical++;
    }

    return {
      all: siteAndSearchFilteredRacks.length,
      normal,
      warning,
      critical,
    };
  }, [siteAndSearchFilteredRacks, telemetryByRack]);

  // Filter akhir rak yang ditampilkan di grid sesuai statusFilter yang aktif
  const displayedRacks = useMemo(() => {
    if (statusFilter === "all") return siteAndSearchFilteredRacks;

    return siteAndSearchFilteredRacks.filter((rack) => {
      const telem = telemetryByRack.get(rack.id);
      return telem?.status === statusFilter;
    });
  }, [siteAndSearchFilteredRacks, statusFilter, telemetryByRack]);

  // Format last updated timestamp
  const lastUpdatedFormatted = useMemo(() => {
    if (!racksUpdatedAt) return undefined;
    return new Date(racksUpdatedAt)
      .toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      })
      .replace(/\./g, ":") + " WIB";
  }, [racksUpdatedAt]);

  const handleRefresh = useCallback(async () => {
    await Promise.all([refetchRacks(), refetchReadings(), refetchSites()]);
  }, [refetchRacks, refetchReadings, refetchSites]);

  const handleSelectRack = useCallback(
    (rackId: number) => {
      navigate(`/dc/monitoring?rack_id=${rackId}`);
    },
    [navigate]
  );

  const isRefreshing = isRefetchingRacks || isRefetchingReadings || isRefetchingSites;
  const isOperational = stats.criticalCount === 0;

  return (
    <div className="min-h-screen bg-[#F5F7FA] pb-16">
      {/* ── 1. Page Header (MSDC Official Navy & Gold) ── */}
      <PageHeader
        title="Dashboard Monitoring Seluruh Rak"
        subtitle="Pemantauan termal (suhu & kelembapan) terpusat seluruh rak data center secara real-time"
        containerClassName="px-7 pt-5 pb-2"
      />

      {/* ── 2. Konten Utama Dashboard (2 Container Putih Berherarki Selaras) ── */}
      <div className="flex flex-col gap-6 px-7 py-5">
        {/* ── Container 1: Overview Status Banner & 4 KPI Cards Beranimasi Hover ── */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm flex flex-col gap-5">
          <MonitoringDashboardStatusBanner
            isOperational={isOperational}
            lastUpdated={lastUpdatedFormatted}
            criticalCount={stats.criticalCount}
            monitoredCount={stats.monitoredCount}
          />

          <MonitoringDashboardKPICards
            stats={stats}
            isLoading={isLoadingRacks && rawRacks.length === 0}
          />
        </div>

        {/* ── Container 2: Toolbar Filter & Grid Kartu Rak Modern ── */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm flex flex-col gap-4">
          <MonitoringDashboardToolbar
            search={search}
            onSearchChange={setSearch}
            siteFilter={siteFilter}
            onSiteFilterChange={setSiteFilter}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            sites={sites}
            onRefresh={handleRefresh}
            isRefreshing={isRefreshing}
            lastUpdated={lastUpdatedFormatted}
            totalFilteredRacks={displayedRacks.length}
            conditionCounts={conditionCounts}
          />

          <MonitoringDashboardGrid
            racks={displayedRacks}
            telemetryByRack={telemetryByRack}
            isLoading={isLoadingRacks && rawRacks.length === 0}
            isError={isErrorRacks}
            errorMessage={racksError instanceof Error ? racksError.message : undefined}
            onSelectRack={handleSelectRack}
            onRefresh={handleRefresh}
          />
        </div>
      </div>
    </div>
  );
}

export default RackMonitoringDashboardPage;
