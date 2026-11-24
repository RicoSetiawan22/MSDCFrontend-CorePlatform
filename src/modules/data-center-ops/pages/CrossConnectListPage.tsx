import { useState, useMemo } from "react";
import { PageHeader } from "@shared/components/PageHeader";
import {
  useCrossConnectList,
  useLockCrossConnect,
  useReleaseCrossConnect,
  useMarkCrossConnectDamaged,
  useRepairCrossConnect,
} from "../api/useCrossConnects";
import { extractErrorMessage } from "@shared/types/api";
import {
  CrossConnectStatusBanner,
  CrossConnectKPICards,
  CrossConnectToolbar,
  CrossConnectTable,
  CrossConnectLockModal,
  CrossConnectDamagedModal,
  type CrossConnectKPIMetrics,
} from "../components/cross-connect";
import { CrossConnectFormModal } from "./CrossConnectFormModal";
import type { CrossConnect, CrossConnectStatus, CableType } from "../types/crossConnect";

export function CrossConnectListPage() {
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [cableTypeFilter, setCableTypeFilter] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<CrossConnect | null>(null);

  // State untuk modal konfirmasi interaktif
  const [lockTarget, setLockTarget] = useState<CrossConnect | null>(null);
  const [damagedTarget, setDamagedTarget] = useState<CrossConnect | null>(null);

  // ── 1. Fetch Seluruh CrossConnect untuk Kalkulasi KPI Metrics ──
  const { data: allCablesPage } = useCrossConnectList({ per_page: 100 });
  const allCables = useMemo(() => allCablesPage?.data ?? [], [allCablesPage]);

  // ── 2. Fetch Data Tabel Terpaginasi & Filtered ──
  const {
    data: tableData,
    isLoading,
    isError,
    error,
    dataUpdatedAt,
    refetch,
  } = useCrossConnectList({
    page,
    per_page: perPage,
    search: search.trim() || undefined,
    status: (statusFilter || undefined) as CrossConnectStatus | undefined,
    cable_type: (cableTypeFilter || undefined) as CableType | undefined,
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

  // ── 4. Kalkulasi Metrik KPI ──
  const metrics: CrossConnectKPIMetrics = useMemo(() => {
    const totalCables = allCablesPage?.total ?? allCables.length;

    // Total Customer Unik
    const uniqueCustomerIds = new Set(
      allCables.map((c) => c.customer_id).filter(Boolean)
    );
    const totalCustomers = uniqueCustomerIds.size;

    // Kontrak Aktif: Kabel yang memiliki relasi kontrak CRM & statusnya tidak rusak
    const activeContracts = allCables.filter(
      (c) =>
        (c.contract_id !== null || c.contract_service_id !== null) &&
        c.status !== "damaged"
    ).length;

    // Kontrak Tidak Aktif: Kabel rusak atau kabel active yang belum ditautkan kontrak
    const inactiveContracts = allCables.filter(
      (c) =>
        c.status === "damaged" ||
        (!c.contract_id && !c.contract_service_id && c.status === "active")
    ).length;

    return {
      totalCables,
      totalCustomers,
      activeContracts,
      inactiveContracts,
    };
  }, [allCables, allCablesPage]);

  const damagedCount = useMemo(
    () => allCables.filter((c) => c.status === "damaged").length,
    [allCables]
  );
  const isOperational = damagedCount === 0;

  // ── 5. Hybrid Fallback Aman untuk Data & Metadata Paginasi ──
  const rawCables = useMemo(() => {
    if (Array.isArray(tableData)) return tableData;
    if (Array.isArray(tableData?.data)) return tableData.data;
    return [];
  }, [tableData]);

  const isServerPaginated = tableData?.total !== undefined;

  const fallbackFilteredCables = useMemo(() => {
    if (isServerPaginated) return rawCables;
    const q = search.trim().toLowerCase();
    return rawCables.filter((c) => {
      const matchSearch =
        !q ||
        c.tag_number?.toLowerCase().includes(q) ||
        c.source_location?.toLowerCase().includes(q) ||
        c.destination_location?.toLowerCase().includes(q);
      const matchStatus = !statusFilter || c.status === statusFilter;
      const matchType = !cableTypeFilter || c.cable_type === cableTypeFilter;
      return matchSearch && matchStatus && matchType;
    });
  }, [isServerPaginated, rawCables, search, statusFilter, cableTypeFilter]);

  const total = isServerPaginated ? (tableData.total ?? 0) : fallbackFilteredCables.length;
  const totalPages = isServerPaginated
    ? (tableData?.last_page ?? (Math.ceil(total / perPage) || 1))
    : (Math.ceil(total / perPage) || 1);

  const paginatedCables = useMemo(() => {
    if (!isServerPaginated) {
      const start = (page - 1) * perPage;
      return fallbackFilteredCables.slice(start, start + perPage);
    }
    return rawCables;
  }, [isServerPaginated, fallbackFilteredCables, rawCables, page, perPage]);

  // ── 6. Mutasi Aksi Kabel ──
  const lockMutation = useLockCrossConnect();
  const releaseMutation = useReleaseCrossConnect();
  const damagedMutation = useMarkCrossConnectDamaged();
  const repairMutation = useRepairCrossConnect();

  // Buka popup modal Lock
  function handleLock(cc: CrossConnect) {
    setLockTarget(cc);
  }

  // Eksekusi mutasi Pasang & Kunci Kabel
  async function confirmLock() {
    if (!lockTarget) return;
    try {
      await lockMutation.mutateAsync({ id: lockTarget.id });
      setLockTarget(null);
      refetch();
    } catch (err) {
      alert(extractErrorMessage(err));
    }
  }

  // Buka popup modal Tandai Rusak
  function handleMarkDamaged(cc: CrossConnect) {
    setDamagedTarget(cc);
  }

  // Eksekusi mutasi Tandai Kabel Rusak
  async function confirmMarkDamaged() {
    if (!damagedTarget) return;
    try {
      await damagedMutation.mutateAsync(damagedTarget.id);
      setDamagedTarget(null);
      refetch();
    } catch (err) {
      alert(extractErrorMessage(err));
    }
  }

  async function handleRelease(cc: CrossConnect) {
    if (
      !window.confirm(
        `Lepas kabel ${cc.tag_number ?? `#${cc.id}`}? Kabel akan kembali menjadi stok yang tersedia (Available).`
      )
    )
      return;
    try {
      await releaseMutation.mutateAsync(cc.id);
      refetch();
    } catch (err) {
      alert(extractErrorMessage(err));
    }
  }

  async function handleRepair(cc: CrossConnect) {
    if (
      !window.confirm(
        `Tandai kabel ${cc.tag_number ?? `#${cc.id}`} sudah diperbaiki? Status akan kembali menjadi Available.`
      )
    )
      return;
    try {
      await repairMutation.mutateAsync(cc.id);
      refetch();
    } catch (err) {
      alert(extractErrorMessage(err));
    }
  }

  return (
    <div className="min-h-screen bg-[#F5F7FA] pb-16">
      {/* ── 1. Header Banner Bergaya MSDC ── */}
      <PageHeader
        title="Cross Connect Inventory"
        subtitle="Pemantauan infrastruktur fisik & operasional 24×7"
        containerClassName="px-7 pt-5 pb-2"
      />

      {/* ── 2. Konten Utama ── */}
      <div className="flex flex-col gap-6 px-7 py-5">
        {/* ── Overview Card: Status Banner & 4 KPI Cards Sesuai Desain MSDC ── */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm flex flex-col gap-5">
          <CrossConnectStatusBanner
            isOperational={isOperational}
            lastUpdated={lastUpdatedTime}
            damagedCount={damagedCount}
          />

          <CrossConnectKPICards
            metrics={metrics}
            selectedStatus={statusFilter}
            onFilterStatus={(st) => {
              setStatusFilter(st);
              setPage(1);
            }}
          />
        </div>

        {/* ── Tabel Cross Connect Container Card ── */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm flex flex-col gap-4">
          <CrossConnectToolbar
            search={search}
            onSearchChange={(val) => {
              setSearch(val);
              setPage(1);
            }}
            statusFilter={statusFilter}
            onStatusFilterChange={(val) => {
              setStatusFilter(val);
              setPage(1);
            }}
            cableTypeFilter={cableTypeFilter}
            onCableTypeFilterChange={(val) => {
              setCableTypeFilter(val);
              setPage(1);
            }}
            onAddCable={() => {
              setEditItem(null);
              setShowForm(true);
            }}
            totalCables={total}
          />

          <CrossConnectTable
            cables={paginatedCables}
            isLoading={isLoading && !tableData}
            isError={isError}
            errorMessage={error ? extractErrorMessage(error) : null}
            onRetry={() => refetch()}
            onEdit={(cc) => {
              setEditItem(cc);
              setShowForm(true);
            }}
            onLock={handleLock}
            onRelease={handleRelease}
            onMarkDamaged={handleMarkDamaged}
            onRepair={handleRepair}
            currentPage={page}
            totalPages={totalPages}
            perPage={perPage}
            total={total}
            onPageChange={setPage}
            onPerPageChange={(newPerPage) => {
              setPerPage(newPerPage);
              setPage(1);
            }}
          />
        </div>
      </div>

      {/* ── Modal Form Tambah / Edit Cross Connect ── */}
      {showForm && (
        <CrossConnectFormModal
          item={editItem}
          onClose={() => {
            setShowForm(false);
            setEditItem(null);
          }}
          onSuccess={() => {
            refetch();
          }}
        />
      )}

      {/* ── Modal Popup Konfirmasi Pasang & Kunci Kabel (Sesuai Gambar UI 1) ── */}
      <CrossConnectLockModal
        cc={lockTarget}
        isOpen={Boolean(lockTarget)}
        onClose={() => setLockTarget(null)}
        onConfirm={confirmLock}
        isPending={lockMutation.isPending}
      />

      {/* ── Modal Popup Konfirmasi Tandai Kabel Rusak (Sesuai Gambar UI 2) ── */}
      <CrossConnectDamagedModal
        cc={damagedTarget}
        isOpen={Boolean(damagedTarget)}
        onClose={() => setDamagedTarget(null)}
        onConfirm={confirmMarkDamaged}
        isPending={damagedMutation.isPending}
      />
    </div>
  );
}

export default CrossConnectListPage;
