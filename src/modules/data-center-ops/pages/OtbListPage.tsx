import { useState, useMemo } from "react";
import { PageHeader } from "@shared/components/PageHeader";
import { extractErrorMessage } from "@shared/types/api";
import { useOtbList } from "../api/useOtb";
import {
  OtbStatusBanner,
  OtbKPICards,
  OtbToolbar,
  OtbTable,
  type OtbKPIMetrics,
} from "../components/otb";
import { OtbFormModal } from "./OtbFormModal";
import type { OtbStatus } from "../types/otb";

export function OtbListPage() {
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [showForm, setShowForm] = useState(false);

  // ── 1. Fetch Seluruh OTB untuk Kalkulasi KPI Metrics ──
  const { data: allOtbsPage } = useOtbList({ per_page: 100 });
  const allOtbs = useMemo(() => allOtbsPage?.data ?? [], [allOtbsPage]);

  // ── 2. Fetch Data Tabel Terpaginasi & Filtered ──
  const {
    data: tableData,
    isLoading,
    isError,
    error,
    dataUpdatedAt,
    refetch,
  } = useOtbList({
    page,
    per_page: perPage,
    search: search.trim() || undefined,
    status: (statusFilter || undefined) as OtbStatus | undefined,
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
  const metrics: OtbKPIMetrics = useMemo(() => {
    const totalOtbs = allOtbsPage?.total ?? allOtbs.length;

    let totalPortCount = 0;
    let usedPorts = 0;
    let damagedPorts = 0;

    allOtbs.forEach((otb) => {
      totalPortCount += otb.port_count ?? 0;
      usedPorts += otb.allocated_ports_count ?? 0;
      damagedPorts += otb.damaged_ports_count ?? 0;
    });

    let capacityDisplay = "0";
    if (allOtbs.length > 0) {
      const firstCount = allOtbs[0].port_count;
      const isUniform = allOtbs.every((o) => o.port_count === firstCount);
      capacityDisplay = isUniform
        ? String(firstCount)
        : String(Math.round(totalPortCount / allOtbs.length));
    }

    return {
      totalOtbs,
      capacityDisplay,
      usedPorts,
      damagedPorts,
    };
  }, [allOtbs, allOtbsPage]);

  const isOperational = metrics.damagedPorts === 0;

  // ── 5. Hybrid Fallback Aman untuk Data & Metadata Paginasi ──
  const rawOtbs = useMemo(() => {
    if (Array.isArray(tableData)) return tableData;
    if (Array.isArray(tableData?.data)) return tableData.data;
    return [];
  }, [tableData]);

  const isServerPaginated = tableData?.total !== undefined;

  const fallbackFilteredOtbs = useMemo(() => {
    if (isServerPaginated) return rawOtbs;
    const q = search.trim().toLowerCase();
    return rawOtbs.filter((o) => {
      const matchSearch =
        !q ||
        o.tag_number?.toLowerCase().includes(q) ||
        o.location?.toLowerCase().includes(q);
      const matchStatus = !statusFilter || o.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [isServerPaginated, rawOtbs, search, statusFilter]);

  const total = isServerPaginated ? (tableData.total ?? 0) : fallbackFilteredOtbs.length;
  const totalPages = isServerPaginated
    ? (tableData?.last_page ?? (Math.ceil(total / perPage) || 1))
    : (Math.ceil(total / perPage) || 1);

  const paginatedOtbs = useMemo(() => {
    if (!isServerPaginated) {
      const start = (page - 1) * perPage;
      return fallbackFilteredOtbs.slice(start, start + perPage);
    }
    return rawOtbs;
  }, [isServerPaginated, fallbackFilteredOtbs, rawOtbs, page, perPage]);

  return (
    <div className="min-h-screen bg-[#F5F7FA] pb-16">
      {/* ── 1. Header Banner Bergaya MSDC ── */}
      <PageHeader
        title="OTB Inventory"
        subtitle="Pemantauan infrastruktur fisik & operasional 24×7"
        containerClassName="px-7 pt-5 pb-2"
      />

      {/* ── 2. Konten Utama ── */}
      <div className="flex flex-col gap-6 px-7 py-5">
        {/* ── Overview Card: Status Banner & 4 KPI Cards Sesuai Desain MSDC ── */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm flex flex-col gap-5">
          <OtbStatusBanner
            isOperational={isOperational}
            lastUpdated={lastUpdatedTime}
            damagedPortsCount={metrics.damagedPorts}
          />

          <OtbKPICards
            metrics={metrics}
            selectedStatus={statusFilter}
            onFilterStatus={(st) => {
              setStatusFilter(st);
              setPage(1);
            }}
          />
        </div>

        {/* ── Tabel OTB Container Card ── */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm flex flex-col gap-4">
          <OtbToolbar
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
            onAddOtb={() => setShowForm(true)}
            totalOtbs={total}
          />

          <OtbTable
            otbs={paginatedOtbs}
            isLoading={isLoading && !tableData}
            isError={isError}
            errorMessage={error ? extractErrorMessage(error) : null}
            onRetry={() => refetch()}
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

      {/* ── Modal Form Tambah OTB Baru ── */}
      {showForm && (
        <OtbFormModal
          onClose={() => setShowForm(false)}
          onSuccess={() => {
            refetch();
          }}
        />
      )}
    </div>
  );
}

export default OtbListPage;
