import { useState, useMemo } from "react";
import {
  useVendorList,
  useCreateVendor,
  useUpdateVendor,
  useSetVendorStatus,
} from "../api/useVendors";
import { PageHeader } from "@shared/components/PageHeader";

import { VendorStatusBanner } from "../components/vendor/VendorStatusBanner";
import { VendorKPICards } from "../components/vendor/VendorKPICards";
import { VendorToolbar } from "../components/vendor/VendorToolbar";
import { VendorTable } from "../components/vendor/VendorTable";
import { VendorFormModal } from "../components/vendor/VendorFormModal";
// 1. Import Modal Detail
import { VendorDetailModal } from "../components/vendor/VendorDetailModal";

import { extractErrorMessage } from "@shared/types/api";
import type {
  Vendor,
  VendorStatus,
  TaxStatus,
  VendorFormValues,
  VendorKPIStats,
} from "../types/vendor";

export function VendorListPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<VendorStatus | "">("");
  const [taxFilter, setTaxFilter] = useState<TaxStatus | "">("");

  const [showFormModal, setShowFormModal] = useState(false);
  const [editVendor, setEditVendor] = useState<Vendor | null>(null);
  
  // 2. State untuk menyimpan data vendor yang akan ditinjau (read-only)
  const [detailVendor, setDetailVendor] = useState<Vendor | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);

  // ── Query Seluruh Vendor untuk KPI Metrik ──
  const { data: allVendorsData, isLoading: isAllVendorsLoading } =
    useVendorList({ per_page: 100 });

  // ── Query Paginasi Tabel dengan Filter & Search ──
  const { data: tableData, isLoading: isTableLoading } = useVendorList({
    page,
    per_page: 10,
    search: search || undefined,
    status: statusFilter || undefined,
    tax_status: taxFilter || undefined,
  });

  const createMutation = useCreateVendor();
  const updateMutation = useUpdateVendor();
  const statusMutation = useSetVendorStatus();

  // ── Komputasi Metrik KPI ──
  const stats: VendorKPIStats = useMemo(() => {
    const list = allVendorsData?.data ?? [];
    const totalVendors = allVendorsData?.total ?? list.length;
    const activeVendors = list.filter((v) => v?.status === "active").length;
    const inactiveVendors = list.filter((v) => v?.status === "inactive").length;
    const blacklistedVendors = list.filter(
      (v) => v?.status === "blacklisted",
    ).length;
    const pkpVendors = list.filter((v) => v?.tax_status === "pkp").length;
    const nonPkpVendors = list.filter(
      (v) => v?.tax_status === "non_pkp" || !v?.tax_status,
    ).length;

    return {
      totalVendors,
      activeVendors,
      inactiveVendors,
      blacklistedVendors,
      pkpVendors,
      nonPkpVendors,
    };
  }, [allVendorsData]);

  const pkpPercentage = useMemo(() => {
    if (!stats.totalVendors || stats.totalVendors === 0) return 0;
    return Math.round((stats.pkpVendors / stats.totalVendors) * 100);
  }, [stats]);

  // ── Penyaringan Data Tabel ──
  const filteredVendors = useMemo(() => {
    let rawList = tableData?.data ?? [];

    if (statusFilter) {
      rawList = rawList.filter((v) => v.status === statusFilter);
    }

    if (taxFilter) {
      if (taxFilter === "non_pkp") {
        rawList = rawList.filter(
          (v) => v.tax_status === "non_pkp" || !v.tax_status,
        );
      } else {
        rawList = rawList.filter((v) => v.tax_status === taxFilter);
      }
    }

    return rawList;
  }, [tableData, statusFilter, taxFilter]);

  async function handleFormSubmit(values: VendorFormValues) {
    setModalError(null);
    try {
      if (editVendor) {
        await updateMutation.mutateAsync({ id: editVendor.id, values });
        setEditVendor(null);
      } else {
        await createMutation.mutateAsync(values);
        setShowFormModal(false);
      }
    } catch (err) {
      setModalError(extractErrorMessage(err));
    }
  }

  async function handleToggleStatus(vendor: Vendor) {
    const nextStatus: VendorStatus =
      vendor.status === "blacklisted" ? "active" : "blacklisted";
    if (
      !confirm(
        `${nextStatus === "blacklisted" ? "Blacklist" : "Aktifkan kembali"} vendor "${vendor.vendor_name}"?`,
      )
    )
      return;
    try {
      await statusMutation.mutateAsync({ id: vendor.id, status: nextStatus });
    } catch (err) {
      alert(extractErrorMessage(err));
    }
  }

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="min-h-screen bg-[#F5F7FA] pb-16">
      {/* ── Page Header ── */}
      <PageHeader
        title="Vendor Manager"
        subtitle="Kelola data vendor, status keaktifan, dan konfigurasi perpajakan (PKP/PPN)"
        containerClassName="px-7 pt-5 pb-2"
      />

      {/* ── Konten Utama ── */}
      <div className="flex flex-col gap-6 px-7 py-5">
        {/* Top Overview Card: Banner & KPI Cards */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm flex flex-col gap-5">
          <VendorStatusBanner pkpPercentage={pkpPercentage} />

          <VendorKPICards
            stats={stats}
            isLoading={isAllVendorsLoading && !allVendorsData}
            activeStatusFilter={statusFilter}
            activeTaxFilter={taxFilter}
            onStatusFilterChange={(st) => {
              setStatusFilter(st);
              setPage(1);
            }}
            onTaxFilterChange={(tx) => {
              setTaxFilter(tx);
              setPage(1);
            }}
          />
        </div>

        {/* Table Card: Toolbar & Table */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm flex flex-col gap-4">
          <VendorToolbar
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
            taxFilter={taxFilter}
            onTaxFilterChange={(val) => {
              setTaxFilter(val);
              setPage(1);
            }}
            onAddVendor={() => {
              setModalError(null);
              setShowFormModal(true);
            }}
            totalDisplayCount={filteredVendors.length}
          />

          <VendorTable
            vendors={filteredVendors}
            isLoading={isTableLoading && !tableData}
            onViewDetail={(vendor) => setDetailVendor(vendor)}
            onEdit={(vendor) => {
              setModalError(null);
              setEditVendor(vendor);
            }}
            onToggleStatus={handleToggleStatus}
            isStatusPending={statusMutation.isPending}
            currentPage={tableData?.current_page ?? 1}
            lastPage={tableData?.last_page ?? 1}
            total={
              statusFilter || taxFilter
                ? filteredVendors.length
                : (tableData?.total ?? 0)
            }
            onPageChange={(p) => setPage(p)}
          />
        </div>
      </div>

      {/* ── Modals ── */}
      {showFormModal && (
        <VendorFormModal
          onClose={() => setShowFormModal(false)}
          onSubmit={handleFormSubmit}
          isSaving={isSaving}
          error={modalError}
          existingVendors={allVendorsData?.data ?? []}
        />
      )}

      {editVendor && (
        <VendorFormModal
          vendor={editVendor}
          onClose={() => setEditVendor(null)}
          onSubmit={handleFormSubmit}
          isSaving={isSaving}
          error={modalError}
          existingVendors={allVendorsData?.data ?? []}
        />
      )}

      {/* 4. Render VendorDetailModal jika detailVendor terisi */}
      {detailVendor && (
        <VendorDetailModal
          vendor={detailVendor}
          onClose={() => setDetailVendor(null)}
        />
      )}
    </div>
  );
}

export default VendorListPage;