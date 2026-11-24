import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "@shared/components/PageHeader";
import { extractErrorMessage } from "@shared/types/api";
import { useDeviceList } from "../api/useDevices";
import { useSiteList } from "../api/useSites";
import { useRackList } from "../api/useRacks";
import {
  DeviceStatusBanner,
  DeviceKPICards,
  DeviceToolbar,
  DeviceTable,
  DeviceDeleteConfirmModal,
  type DeviceKPIMetrics,
} from "../components/device";
import { DeviceFormModal } from "./DeviceFormModal";
import { DeviceEditModal } from "./DeviceEditModal";
import { DeviceMoveModal } from "./DeviceMoveModal";
import type { Device, DeviceStatus, DeviceType } from "../types/device";

export function DeviceListPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [siteFilter, setSiteFilter] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editDevice, setEditDevice] = useState<Device | null>(null);
  const [moveDevice, setMoveDevice] = useState<Device | null>(null);
  const [deleteTargetDevice, setDeleteTargetDevice] = useState<Device | null>(null);

  // ── 1. Fetch Seluruh Device untuk Kalkulasi KPI Metrics, serta Master Site & Rack ──
  const { data: allDevicesData, dataUpdatedAt } = useDeviceList({ per_page: 100 });
  const { data: siteListPage } = useSiteList({ per_page: 100 });
  const { data: racksPage } = useRackList({ per_page: 100 });

  const allDevices = useMemo(() => allDevicesData?.data ?? [], [allDevicesData]);

  // ── 2. Query Paginasi untuk Tabel Device dengan Filter & Pencarian ──
  const {
    data: tableData,
    isLoading: isTableLoading,
    isError: isTableError,
    error: tableError,
    refetch,
  } = useDeviceList({
    page,
    per_page: perPage,
    search: search.trim() || undefined,
    status: (statusFilter || undefined) as DeviceStatus | undefined,
    device_type: (typeFilter || undefined) as DeviceType | undefined,
    site_id: siteFilter ? Number(siteFilter) : undefined,
  });

  // ── 3. Format Waktu Terakhir Diperbarui (Last Updated Timestamp) ──
  const lastUpdatedTime = useMemo(() => {
    if (!dataUpdatedAt) return undefined;
    return new Date(dataUpdatedAt)
      .toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      })
      .replace(/\./g, ":");
  }, [dataUpdatedAt]);

  // ── 4. Lookup Map untuk O(1) Akses Lokasi Site & Rack ──
  const sitesMap = useMemo(() => {
    const map = new Map<number, { site_name: string; site_code: string }>();
    (siteListPage?.data ?? []).forEach((s) => {
      map.set(s.id, { site_name: s.site_name, site_code: s.site_code });
    });
    return map;
  }, [siteListPage]);

  const racksMap = useMemo(() => {
    const map = new Map<number, { rack_name?: string; rack_code: string; site_room_id?: number }>();
    (racksPage?.data ?? []).forEach((r) => {
      map.set(r.id, {
        rack_name: r.rack_name ?? undefined,
        rack_code: r.rack_code,
        site_room_id: r.site_room_id ?? undefined,
      });
    });
    return map;
  }, [racksPage]);

  // Format Daftar Site untuk Dropdown Filter
  const sitesList = useMemo(() => {
    return (siteListPage?.data ?? []).map((s) => ({
      id: s.id,
      site_name: s.site_name,
      site_code: s.site_code,
    }));
  }, [siteListPage]);

  // ── 5. Kalkulasi Metrik KPI ──
  const metrics: DeviceKPIMetrics = useMemo(() => {
    let activeDevices = 0;
    let spareDevices = 0;
    let maintenanceDevices = 0;
    let totalPowerWatt = 0;
    let serversCount = 0;
    let storageCount = 0;
    let networkCount = 0;
    let otherCount = 0;

    allDevices.forEach((d) => {
      if (d.status === "active") activeDevices += 1;
      else if (d.status === "spare") spareDevices += 1;
      else if (d.status === "maintenance") maintenanceDevices += 1;

      if (d.power_watt !== null && d.power_watt !== undefined) {
        const watt = Number(d.power_watt);
        if (!isNaN(watt)) totalPowerWatt += watt;
      }

      if (d.device_type === "server") serversCount += 1;
      else if (d.device_type === "storage") storageCount += 1;
      else if (["switch", "router", "firewall"].includes(d.device_type)) networkCount += 1;
      else otherCount += 1;
    });

    const totalDevices = allDevicesData?.total ?? allDevices.length;

    return {
      totalDevices,
      activeDevices,
      spareDevices,
      maintenanceDevices,
      totalPowerWatt,
      serversCount,
      storageCount,
      networkCount,
      otherCount,
    };
  }, [allDevices, allDevicesData]);

  const isOperational = metrics.maintenanceDevices === 0;

  // ── 6. Hybrid Fallback Aman untuk Data & Metadata Paginasi ──
  const rawDevices = useMemo(() => {
    if (Array.isArray(tableData)) return tableData;
    if (Array.isArray(tableData?.data)) return tableData.data;
    return [];
  }, [tableData]);

  const isServerPaginated = tableData?.total !== undefined;

  const fallbackFilteredDevices = useMemo(() => {
    if (isServerPaginated) return rawDevices;
    const q = search.trim().toLowerCase();

    return rawDevices.filter((d) => {
      const siteObj = d.site_id ? sitesMap.get(d.site_id) : undefined;
      const rackObj = d.rack_id ? racksMap.get(d.rack_id) : undefined;

      const matchSearch =
        !q ||
        d.device_code?.toLowerCase().includes(q) ||
        d.device_name?.toLowerCase().includes(q) ||
        d.manufacturer?.toLowerCase().includes(q) ||
        d.model?.toLowerCase().includes(q) ||
        d.serial_number?.toLowerCase().includes(q) ||
        siteObj?.site_name?.toLowerCase().includes(q) ||
        siteObj?.site_code?.toLowerCase().includes(q) ||
        rackObj?.rack_code?.toLowerCase().includes(q) ||
        rackObj?.rack_name?.toLowerCase().includes(q);

      const matchSite = !siteFilter || String(d.site_id) === siteFilter;
      const matchType = !typeFilter || d.device_type === typeFilter;
      const matchStatus = !statusFilter || d.status === statusFilter;

      return matchSearch && matchSite && matchType && matchStatus;
    });
  }, [isServerPaginated, rawDevices, search, siteFilter, typeFilter, statusFilter, sitesMap, racksMap]);

  const total = isServerPaginated ? (tableData.total ?? 0) : fallbackFilteredDevices.length;
  const totalPages = isServerPaginated
    ? (tableData?.last_page ?? (Math.ceil(total / perPage) || 1))
    : (Math.ceil(total / perPage) || 1);

  const paginatedDevices = useMemo(() => {
    if (!isServerPaginated) {
      const start = (page - 1) * perPage;
      return fallbackFilteredDevices.slice(start, start + perPage);
    }
    return rawDevices;
  }, [isServerPaginated, fallbackFilteredDevices, rawDevices, page, perPage]);

  const handleDeviceDeleted = () => {
    if (paginatedDevices.length <= 1 && page > 1) {
      setPage((prev) => Math.max(1, prev - 1));
    }
    refetch();
  };

  return (
    <div className="min-h-screen bg-[#F5F7FA] pb-16">
      {/* ── 1. Header Banner Bergaya MSDC ── */}
      <PageHeader
        title="Device Inventory"
        subtitle="Server, storage, dan network device per rack — alokasi U dan daya."
        containerClassName="px-7 pt-5 pb-2"
      />

      {/* ── 2. Konten Utama ── */}
      <div className="flex flex-col gap-6 px-7 py-5">
        {/* ── Overview Card: Status Banner & 4 KPI Cards Sesuai Desain MSDC ── */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm flex flex-col gap-5">
          <DeviceStatusBanner
            isOperational={isOperational}
            lastUpdated={lastUpdatedTime}
            maintenanceDevices={metrics.maintenanceDevices}
          />

          <DeviceKPICards
            metrics={metrics}
            selectedStatus={statusFilter}
            onFilterStatus={(st) => {
              setStatusFilter(st);
              setPage(1);
            }}
          />
        </div>

        {/* ── Tabel Device Container Card ── */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm flex flex-col gap-4">
          <DeviceToolbar
            search={search}
            onSearchChange={(val) => {
              setSearch(val);
              setPage(1);
            }}
            siteFilter={siteFilter}
            onSiteFilterChange={(val) => {
              setSiteFilter(val);
              setPage(1);
            }}
            typeFilter={typeFilter}
            onTypeFilterChange={(val) => {
              setTypeFilter(val);
              setPage(1);
            }}
            statusFilter={statusFilter}
            onStatusFilterChange={(val) => {
              setStatusFilter(val);
              setPage(1);
            }}
            sites={sitesList}
            onAddDevice={() => setShowForm(true)}
            totalDevices={total}
          />

          <DeviceTable
            devices={paginatedDevices}
            isLoading={isTableLoading && !tableData}
            isError={isTableError}
            errorMessage={tableError ? extractErrorMessage(tableError) : null}
            onRetry={() => refetch()}
            sitesMap={sitesMap}
            racksMap={racksMap}
            onDetail={(device) => navigate(`/dc/devices/${device.id}`)}
            onEdit={(device) => setEditDevice(device)}
            onMove={(device) => setMoveDevice(device)}
            onDelete={(device) => setDeleteTargetDevice(device)}
            currentPage={page}
            totalPages={totalPages}
            perPage={perPage}
            total={total}
            onPageChange={(p) => setPage(p)}
            onPerPageChange={(pp) => {
              setPerPage(pp);
              setPage(1);
            }}
          />
        </div>
      </div>

      {/* ── 3. Modals & Dialogs ── */}
      {showForm ? (
        <DeviceFormModal
          onClose={() => setShowForm(false)}
          onSuccess={() => refetch()}
        />
      ) : null}

      {editDevice ? (
        <DeviceEditModal
          device={editDevice}
          onClose={() => setEditDevice(null)}
          onSuccess={() => refetch()}
        />
      ) : null}

      {moveDevice ? (
        <DeviceMoveModal
          device={moveDevice}
          onClose={() => setMoveDevice(null)}
          onSuccess={() => refetch()}
        />
      ) : null}

      {deleteTargetDevice ? (
        <DeviceDeleteConfirmModal
          device={deleteTargetDevice}
          siteName={
            deleteTargetDevice.site_id
              ? sitesMap.get(deleteTargetDevice.site_id)?.site_name
              : undefined
          }
          rackCode={
            deleteTargetDevice.rack_id
              ? racksMap.get(deleteTargetDevice.rack_id)?.rack_code
              : undefined
          }
          isOpen={Boolean(deleteTargetDevice)}
          onClose={() => setDeleteTargetDevice(null)}
          onSuccess={handleDeviceDeleted}
        />
      ) : null}
    </div>
  );
}

export default DeviceListPage;
