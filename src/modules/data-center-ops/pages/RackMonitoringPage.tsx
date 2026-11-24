import { useMemo, useState, useCallback, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@shared/components/PageHeader";
import { EmptyState } from "@shared/components/EmptyState";
import { useRackList } from "../api/useRacks";
import {
  useMetricReadingList,
  useAlarmList,
  useAcknowledgeAlarm,
  useResolveAlarm,
} from "../api/useMonitoring";
import {
  MonitoringRackSelector,
  MonitoringAlarmBanner,
  MonitoringCurrentMetricCards,
  MonitoringTrendCharts,
  MonitoringRecordManualCard,
  MonitoringThresholdCard,
  MonitoringHistoryTable,
  formatMonitoringTimestamp,
  type RangePeriod,
} from "../components/monitoring";
import type { MetricReading } from "../types/monitoring";

const RANGE_HOURS: Record<RangePeriod, number> = {
  "24h": 24,
  "3d": 72,
  "7d": 168,
};

/**
 * RackMonitoringPage - Dedicated Single-Rack Telemetry & Dual-Bound Threshold Configuration
 *
 * Formatted consistently with Site Manager & Data Center Overview:
 * - MSDC Official PageHeader (Navy & Gold banner)
 * - Containerized rounded-2xl cards on #F5F7FA surface
 * - URL search parameter sync (?rack_id=...) for deep linking from dashboard matrix
 * - 100% Data-Driven: No hardcoded rack IDs or static sensor assumptions
 * - Grouped by Room / Site hierarchically
 */
export function RackMonitoringPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const rackIdParam = searchParams.get("rack_id");
  const initialRackId = rackIdParam ? Number(rackIdParam) : null;

  const [rackId, setRackId] = useState<number | null>(
    initialRackId && !isNaN(initialRackId) ? initialRackId : null
  );
  const [lastUpdatedTime, setLastUpdatedTime] = useState<string | null>(null);
  const [activeSource, setActiveSource] = useState<"sensor" | "manual" | null>(null);

  const { data: racksPage, isLoading: loadingRacks } = useRackList({ per_page: 200 });

  const queryClient = useQueryClient();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleManualRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: ["dcMonitoring"] });
    setTimeout(() => setIsRefreshing(false), 600);
  }, [queryClient]);

  const racks = useMemo(() => racksPage?.data ?? [], [racksPage?.data]);
  const firstRackId = racksPage?.data?.[0]?.id;

  // Sync state with URL search param or fallback to first rack
  useEffect(() => {
    if (rackIdParam) {
      const parsed = Number(rackIdParam);
      if (!isNaN(parsed) && parsed !== rackId) {
        setRackId(parsed);
      }
    } else if (!rackId && firstRackId) {
      setRackId(firstRackId);
      setSearchParams({ rack_id: String(firstRackId) }, { replace: true });
    }
  }, [rackIdParam, firstRackId, rackId, setSearchParams]);

  const handleSelectRack = useCallback(
    (id: number | null) => {
      setRackId(id);
      if (id != null) {
        setSearchParams({ rack_id: String(id) }, { replace: true });
      } else {
        setSearchParams({}, { replace: true });
      }
      setLastUpdatedTime(null);
      setActiveSource(null);
    },
    [setSearchParams]
  );

  const selectedRack = racks.find((r) => r.id === rackId);

  return (
    <div className="min-h-screen bg-[#F5F7FA] pb-16">
      {/* ── 1. Header Banner Bergaya MSDC (Navy Blue & Gold Diagonal Accent) ── */}
      <PageHeader
        title="Rack Telemetry & Monitoring"
        subtitle="Pemantauan termal dan batas toleransi ambang batas per rak 24×7"
        containerClassName="px-7 pt-5 pb-2"
      >
      </PageHeader>

      {/* ── 2. Konten Utama Terbungkus Card Layout Konsisten ── */}
      <div className="flex flex-col gap-6 px-7 py-5">
        {/* Selector Rack Card */}
        <MonitoringRackSelector
          racks={racks}
          selectedRackId={rackId}
          onSelectRack={handleSelectRack}
          isLoadingRacks={loadingRacks}
          onManualRefresh={handleManualRefresh}
          isRefreshing={isRefreshing}
          lastUpdated={lastUpdatedTime}
          activeSource={activeSource}
        />

        {/* When no rack is selected */}
        {!rackId && !loadingRacks && (
          <div className="bg-white rounded-2xl border border-slate-200/80 p-8 shadow-sm">
            <EmptyState
              title="Pilih Rack untuk Memulai"
              subtitle="Pilih salah satu rack pada daftar di atas untuk melihat metrik telemetri suhu & kelembapan."
            />
          </div>
        )}

        {/* Main Monitoring Panel */}
        {rackId && (
          <RackMonitoringPanel
            rackId={rackId}
            rackCode={selectedRack?.rack_code ?? `Rack #${rackId}`}
            onLatestUpdate={setLastUpdatedTime}
            onActiveSource={setActiveSource}
          />
        )}
      </div>
    </div>
  );
}

function RackMonitoringPanel({
  rackId,
  rackCode,
  onLatestUpdate,
  onActiveSource,
}: {
  rackId: number;
  rackCode: string;
  onLatestUpdate?: (timestamp: string | null) => void;
  onActiveSource?: (source: "sensor" | "manual" | null) => void;
}) {
  const [range, setRange] = useState<RangePeriod>("24h");
  const rangeHours = RANGE_HOURS[range];

  // date_from is calculated based on selected time window
  const dateFrom = useMemo(() => {
    const d = new Date();
    d.setHours(d.getHours() - rangeHours);
    return d.toISOString().slice(0, 10);
  }, [rangeHours]);

  // Primary data query for metric readings (single source of truth for cards, chart, and table)
  const { data: readingsPage, isLoading: loadingReadings, dataUpdatedAt } = useMetricReadingList({
    rack_id: rackId,
    date_from: dateFrom,
    per_page: 500,
  });

  // Query for open active alarms
  const { data: alarmsPage } = useAlarmList({
    rack_id: rackId,
    status: "open",
    per_page: 10,
  });

  const acknowledgeAlarm = useAcknowledgeAlarm();
  const resolveAlarm = useResolveAlarm();

  const readings = useMemo(() => readingsPage?.data ?? [], [readingsPage?.data]);

  // Filter latest readings by metric type
  const { latestTemp, latestHum, tempReadings, humReadings } = useMemo(() => {
    let latestT: MetricReading | null = null;
    let latestH: MetricReading | null = null;
    const tList: MetricReading[] = [];
    const hList: MetricReading[] = [];

    for (const r of readings) {
      if (r.metric_type === "temperature") {
        tList.push(r);
        if (!latestT || new Date(r.recorded_at) > new Date(latestT.recorded_at)) {
          latestT = r;
        }
      } else if (r.metric_type === "humidity") {
        hList.push(r);
        if (!latestH || new Date(r.recorded_at) > new Date(latestH.recorded_at)) {
          latestH = r;
        }
      }
    }

    return {
      latestTemp: latestT,
      latestHum: latestH,
      tempReadings: tList,
      humReadings: hList,
    };
  }, [readings]);

  // Propagate the latest update timestamp and source to parent selector
  useEffect(() => {
    const src = latestTemp?.source ?? latestHum?.source ?? null;
    onActiveSource?.(src);

    if (latestTemp?.recorded_at) {
      onLatestUpdate?.(`${formatMonitoringTimestamp(latestTemp.recorded_at)} WIB`);
    } else if (dataUpdatedAt) {
      const timeStr =
        new Date(dataUpdatedAt)
          .toLocaleTimeString("id-ID", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: false,
          })
          .replace(/\./g, ":") + " WIB";
      onLatestUpdate?.(timeStr);
    } else {
      onLatestUpdate?.(null);
    }
  }, [latestTemp?.recorded_at, latestTemp?.source, latestHum?.source, dataUpdatedAt, onLatestUpdate, onActiveSource]);

  const handleAcknowledge = useCallback(
    (id: number) => {
      acknowledgeAlarm.mutate(id);
    },
    [acknowledgeAlarm]
  );

  const handleResolve = useCallback(
    (id: number) => {
      resolveAlarm.mutate({ id });
    },
    [resolveAlarm]
  );

  return (
    <div className="flex flex-col gap-6">
      {/* Active Alarm Banner (if any open alarm exists) */}
      <MonitoringAlarmBanner
        alarms={alarmsPage?.data ?? []}
        onAcknowledge={handleAcknowledge}
        onResolve={handleResolve}
        isAckPending={acknowledgeAlarm.isPending}
        isResolvePending={resolveAlarm.isPending}
      />

      {/* Current Metric KPI Cards (Suhu Saat Ini & Kelembapan Udara) */}
      <MonitoringCurrentMetricCards
        latestTemperature={latestTemp}
        latestHumidity={latestHum}
        rackCode={rackCode}
      />

      {/* Telemetry Trend Charts (Recharts Dual Area, Vertically Stacked with Zoom) */}
      <MonitoringTrendCharts
        temperatureReadings={tempReadings}
        humidityReadings={humReadings}
        range={range}
        onRangeChange={setRange}
        isLoading={loadingReadings}
      />

      {/* Two Column Actions: Manual Record Reading & Threshold Configuration */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <MonitoringRecordManualCard
          rackId={rackId}
          rackCode={rackCode}
          latestTemperature={latestTemp}
          latestHumidity={latestHum}
        />
        <MonitoringThresholdCard rackId={rackId} rackCode={rackCode} />
      </div>

      {/* Historical Reading Table */}
      <MonitoringHistoryTable readings={readings} isLoading={loadingReadings} />
    </div>
  );
}
