import { useState, useMemo } from "react";
import { PageHeader } from "@shared/components/PageHeader";
import { useUsageList } from "../api/useUsage";
import {
  UsageStatusBanner,
  UsageKPICards,
  UsageGenerateCard,
  UsageToolbar,
  UsageTable,
  UsageTablePagination,
  type UsageKPIMetrics,
} from "../components/usage";
import { BillRemoteHandsModal } from "./BillRemoteHandsModal";
import type { UsageRecord } from "../types/usage";

/**
 * Halaman Pengelolaan Usage Records & Billing Operasional Data Center.
 *
 * Menampilkan dan mengelola data agregasi konsumsi resource (Power, Bandwidth,
 * Rack Space) serta aktivitas teknis berbayar (Remote Hands) untuk penagihan Finance.
 *
 * Menggunakan standar tata letak MSDC (Banner, 4 KPI, Generate Card, Toolbar, Tabel #FEF9EE).
 */
export function UsageListPage() {
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  const [billingRecord, setBillingRecord] = useState<UsageRecord | null>(null);

  // ── 1. Fetch Seluruh Record Usage Data Center Ops ──
  const {
    data: usageResponse,
    isLoading,
    dataUpdatedAt,
    refetch,
  } = useUsageList({
    per_page: 500,
  });

  const allRecords = useMemo(() => usageResponse?.data ?? [], [usageResponse]);

  // ── 2. Format Timestamp Terakhir Diperbarui ──
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

  // ── 3. Kalkulasi 4 Metrik KPI Usage ──
  const metrics: UsageKPIMetrics = useMemo(() => {
    let draftCount = 0;
    let sentToFinanceCount = 0;
    let billedCount = 0;

    allRecords.forEach((rec) => {
      if (rec.status === "draft") {
        draftCount += 1;
      } else if (rec.status === "sent_to_finance") {
        sentToFinanceCount += 1;
      } else if (rec.status === "billed") {
        billedCount += 1;
      }
    });

    return {
      totalRecords: allRecords.length,
      draftCount,
      sentToFinanceCount,
      billedCount,
    };
  }, [allRecords]);

  // ── 4. Client-side Search, Filtering, dan Sorting ──
  const filteredRecords = useMemo(() => {
    const q = search.trim().toLowerCase();
    const tFilter = typeFilter.trim();
    const sFilter = statusFilter.trim();

    return allRecords.filter((rec) => {
      // Filter Tipe Penggunaan
      if (tFilter && rec.usage_type !== tFilter) {
        return false;
      }

      // Filter Status Tagihan
      if (sFilter && rec.status !== sFilter) {
        return false;
      }

      // Filter Pencarian (Customer ID, Customer Name, Periode)
      if (q) {
        const matchCust =
          rec.customer_id?.toString().includes(q) ||
          Boolean(rec.customer?.company_name?.toLowerCase().includes(q));
        const matchPeriod = `${rec.period_year}/${String(rec.period_month).padStart(2, "0")}`.includes(q);
        const matchType = rec.usage_type.toLowerCase().includes(q);
        if (!matchCust && !matchPeriod && !matchType) {
          return false;
        }
      }

      return true;
    });
  }, [allRecords, search, typeFilter, statusFilter]);

  // ── 5. Paginasi Hasil Filter ──
  const total = filteredRecords.length;
  const totalPages = Math.ceil(total / perPage) || 1;

  const paginatedRecords = useMemo(() => {
    const start = (page - 1) * perPage;
    return filteredRecords.slice(start, start + perPage);
  }, [filteredRecords, page, perPage]);

  return (
    <div className="min-h-screen bg-[#F5F7FA] pb-16">
      {/* ── 1. Header Halaman ── */}
      <PageHeader
        title="Usage Records & Billing"
        subtitle="Data pemakaian — konsumsi power, bandwidth, alokasi rack, dan penagihan remote hands untuk modul Finance."
        containerClassName="px-7 pt-5 pb-2"
      />

      <div className="mx-7 mt-3 flex flex-col gap-6">
        {/* ── 2. Overview Card: Status Banner & 4 KPI Cards ── */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm flex flex-col gap-5">
          <UsageStatusBanner
            isOperational={true}
            lastUpdated={lastUpdatedTime}
            draftCount={metrics.draftCount}
          />

          <UsageKPICards metrics={metrics} />
        </div>

        {/* ── 3. Panel Generate & Sinkronisasi Usage Bulanan ── */}
        <UsageGenerateCard onSuccess={() => refetch()} />

        {/* ── 4. Konten Utama: Toolbar, Tabel Usage & Paginasi ── */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm flex flex-col gap-4">
          <UsageToolbar
            search={search}
            onSearchChange={(val) => {
              setSearch(val);
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
            totalRecords={total}
          />

          <UsageTable
            records={paginatedRecords}
            isLoading={isLoading}
            onBillRemoteHands={(rec) => setBillingRecord(rec)}
          />

          {total > 0 && (
            <UsageTablePagination
              currentPage={page}
              totalPages={totalPages}
              perPage={perPage}
              onPageChange={setPage}
              onPerPageChange={(newPerPage) => {
                setPerPage(newPerPage);
                setPage(1);
              }}
            />
          )}
        </div>
      </div>

      {/* ── 5. Modal Penagihan Remote Hands ── */}
      {billingRecord && (
        <BillRemoteHandsModal
          record={billingRecord}
          onClose={() => {
            setBillingRecord(null);
            refetch();
          }}
        />
      )}
    </div>
  );
}

export default UsageListPage;
