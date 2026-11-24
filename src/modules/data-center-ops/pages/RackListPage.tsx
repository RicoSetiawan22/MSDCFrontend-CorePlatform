import { useState, useMemo, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { PageHeader } from "@shared/components/PageHeader";
import { extractErrorMessage } from "@shared/types/api";
import { useRackList } from "../api/useRacks";
import { useSiteList } from "../api/useSites";
import {
  RackStatusBanner,
  RackKPICards,
  RackToolbar,
  RackTable,
  RackDeleteConfirmModal,
  RackVisualPickerModal,
  type RackKPIMetrics,
} from "../components/rack";
import { RackFormModal } from "./RackFormModal";
import type { Rack, RackStatus } from "../types/rack";

export function RackListPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const selectedRackParam = searchParams.get("selected");

  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [siteFilter, setSiteFilter] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [pickerRack, setPickerRack] = useState<Rack | null>(null);
  const [deleteTargetRack, setDeleteTargetRack] = useState<Rack | null>(null);

  useEffect(() => {
    if (selectedRackParam) {
      const parsedId = Number(selectedRackParam);
      if (!Number.isNaN(parsedId) && parsedId > 0) {
        navigate(`/dc/racks/${parsedId}`, { replace: true });
      }
    }
  }, [selectedRackParam, navigate]);

  // ── 1. Fetch Seluruh Rack untuk Metrik KPI (Sample 100) & Site Master ──
  const { data: allRacksPage, dataUpdatedAt } = useRackList({ per_page: 100 });
  const { data: siteListPage } = useSiteList({ per_page: 100 });

  // ── 2. Query Paginasi untuk Tabel Rack dengan Filter & Pencarian Server-Side ──
  const {
    data: tableData,
    isLoading: isTableLoading,
    isError,
    error,
    refetch,
  } = useRackList({
    page,
    per_page: perPage,
    search: search.trim() || undefined,
    status: (statusFilter || undefined) as RackStatus | undefined,
    site_id: siteFilter ? Number(siteFilter) : undefined,
  });

  const allRacks = useMemo(() => allRacksPage?.data ?? [], [allRacksPage]);

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

  // ── 4. Format Daftar Site untuk Dropdown ──
  const sitesList = useMemo(() => {
    return (siteListPage?.data ?? []).map((s) => ({
      id: s.id,
      site_name: s.site_name,
      site_code: s.site_code,
    }));
  }, [siteListPage]);

  // ── 5. Kalkulasi 4 KPI Metrics Secara Akurat ──
  const metrics: RackKPIMetrics = useMemo(() => {
    const siteIds = new Set<number>();
    const roomIds = new Set<number>();
    let activeRacks = 0;
    let freeU = 0;
    let totalU = 0;

    allRacks.forEach((r) => {
      if (r.site_room?.site?.id) siteIds.add(r.site_room.site.id);
      if (r.site_room_id) roomIds.add(r.site_room_id);
      if (r.status === "active") activeRacks += 1;
      freeU += r.free_u ?? 0;
      totalU += r.total_u ?? 0;
    });

    return {
      totalSites: siteIds.size > 0 ? siteIds.size : (siteListPage?.data?.length ?? 0),
      totalRooms: roomIds.size,
      activeRacks,
      totalRacks: allRacksPage?.total ?? (tableData?.total ?? allRacks.length),
      freeU,
      totalU,
    };
  }, [allRacks, allRacksPage, tableData?.total, siteListPage]);

  const maintenanceRacks = useMemo(() => {
    return allRacks.filter((r) => r.status === "maintenance").length;
  }, [allRacks]);

  const isOperational = maintenanceRacks === 0;

  // ── 6. Paginasi Server-side ──
  const racks = tableData?.data ?? [];
  const total = tableData?.total ?? 0;
  const totalPages = tableData?.last_page ?? 1;

  const handleRackDeleted = () => {
    if (racks.length <= 1 && page > 1) {
      setPage((prev) => Math.max(1, prev - 1));
    }
    refetch();
  };

  return (
    <div className="min-h-screen bg-[#F5F7FA] pb-16">
      {/* ── 1. Header Halaman Konsisten dengan SiteListPage & RoomListPage ── */}
      <PageHeader
        title="Rack Manager"
        subtitle="Rack inventory per site — kapasitas U dan daya."
        containerClassName="px-7 pt-5 pb-2"
      />

      {/* ── 2. Konten Utama ── */}
      <div className="flex flex-col gap-6 px-7 py-5">
        {/* ── Overview Card: Status Banner & 4 KPI Cards Sesuai Desain Gambar ── */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm flex flex-col gap-5">
          <RackStatusBanner
            isOperational={isOperational}
            lastUpdated={lastUpdatedTime}
            maintenanceRacks={maintenanceRacks}
          />

          <RackKPICards metrics={metrics} />
        </div>

        {/* ── Tabel Rack Container Card ── */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm flex flex-col gap-4">
          <RackToolbar
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
            statusFilter={statusFilter}
            onStatusFilterChange={(val) => {
              setStatusFilter(val);
              setPage(1);
            }}
            sites={sitesList}
            onAddRack={() => setShowForm(true)}
            totalRacks={total}
          />

          <RackTable
            racks={racks}
            isLoading={isTableLoading && !tableData}
            isError={isError}
            errorMessage={error ? extractErrorMessage(error) : null}
            onRetry={() => refetch()}
            onViewSlots={(rack) => setPickerRack(rack)}
            onDetail={(rack) => {
              navigate(`/dc/racks/${rack.id}`);
            }}
            onDelete={(rack) => setDeleteTargetRack(rack)}
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

      {/* ── 3. Modals & Dialogs (Backdrop blur) ── */}
      {showForm ? (
        <RackFormModal onClose={() => setShowForm(false)} />
      ) : null}

      {pickerRack ? (
        <RackVisualPickerModal
          rack={pickerRack}
          isOpen={Boolean(pickerRack)}
          onClose={() => setPickerRack(null)}
        />
      ) : null}

      {deleteTargetRack ? (
        <RackDeleteConfirmModal
          rack={deleteTargetRack}
          isOpen={Boolean(deleteTargetRack)}
          onClose={() => setDeleteTargetRack(null)}
          onSuccess={handleRackDeleted}
        />
      ) : null}
    </div>
  );
}

export default RackListPage;
