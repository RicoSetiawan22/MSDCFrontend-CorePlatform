import { useState, useMemo, type FormEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Search,
  Plus,
  X,
  FileDown,
  Layers,
  Clock,
  CheckCircle2,
  Calendar,
  FilterX,
  UserCheck,
  PackageCheck,
  AlertTriangle,
  RotateCcw,
} from "lucide-react";
import {
  useItemLoanList,
  useCreateItemLoan,
  useSubmitItemLoan,
  useCancelItemLoan,
  useMarkItemLoaned,
  useMarkItemReturned,
  useAvailableAssetsForLoan,
} from "../api/useItemLoan";
import { itemLoanApi } from "../api/itemLoanApi";
import { ProcurementFormModal } from "../components/ProcurementFormModal";
import { PdfPreviewModal } from "@shared/components/PdfPreviewModal";
import { ApprovalStepsList } from "@shared/components/ApprovalStepsList";
import { Pagination } from "@shared/components/Pagination";
import { PageHeader } from "@shared/components/PageHeader";
import { EmptyState } from "@shared/components/EmptyState";
import { LoadingState } from "@shared/components/LoadingState";
import { extractErrorMessage } from "@shared/types/api";
import { useActiveOrgId } from "@shared/lib/organization-context";
import { useAuth } from "@shared/lib/auth-context";
import { employeeApi } from "@modules/hr-service-support/api/employeeApi";
import type { Employee } from "@modules/hr-service-support/types/employee";
import type {
  ItemLoan,
  ItemLoanStatus,
  AvailableAssetForLoan,
} from "../types/itemLoan";

const STATUS_LABELS: Record<ItemLoanStatus, string> = {
  draft: "Draft",
  submitted: "Menunggu Approval",
  approved: "Disetujui",
  rejected: "Ditolak",
  on_loan: "Sedang Dipinjam",
  returned: "Sudah Dikembalikan",
  cancelled: "Dibatalkan",
};

const STATUS_BADGE_CLASSES: Record<ItemLoanStatus, string> = {
  draft: "bg-slate-100 text-slate-700 border-slate-200",
  submitted: "bg-amber-50 text-amber-700 border-amber-200/80",
  approved: "bg-emerald-50 text-emerald-700 border-emerald-200/80",
  rejected: "bg-rose-50 text-rose-700 border-rose-200/80",
  on_loan: "bg-blue-50 text-blue-700 border-blue-200/80",
  returned: "bg-indigo-50 text-indigo-700 border-indigo-200/80",
  cancelled: "bg-slate-100 text-slate-500 border-slate-200",
};

function isOverdue(loan: ItemLoan): boolean {
  return (
    loan.status === "on_loan" &&
    new Date(loan.expected_return_date) < new Date(new Date().toDateString())
  );
}

export function ItemLoanListPage() {
  const { hasPermission } = useAuth();
  const canManage = hasPermission("item-loan.manage");
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ItemLoanStatus | "">("");
  const [showModal, setShowModal] = useState(false);

  const { data, isLoading } = useItemLoanList({
    page,
    per_page: 20,
    status: statusFilter || undefined,
  });

  const loansList = useMemo(() => data?.data ?? [], [data]);

  // KPI Calculations
  const totalLoans = data?.total ?? 0;
  const onLoanCount = useMemo(
    () => loansList.filter((l) => l.status === "on_loan").length,
    [loansList]
  );
  const submittedCount = useMemo(
    () => loansList.filter((l) => l.status === "submitted").length,
    [loansList]
  );
  const returnedCount = useMemo(
    () => loansList.filter((l) => l.status === "returned").length,
    [loansList]
  );

  const returnPercentage =
    totalLoans > 0 ? Math.round((returnedCount / totalLoans) * 100) : 100;

  const filteredLoans = useMemo(() => {
    if (!search) return loansList;
    const q = search.toLowerCase();
    return loansList.filter(
      (l) =>
        l.loan_number.toLowerCase().includes(q) ||
        (l.asset?.asset_number && l.asset.asset_number.toLowerCase().includes(q)) ||
        (l.asset?.asset_name && l.asset.asset_name.toLowerCase().includes(q)) ||
        (l.borrower_employee?.full_name && l.borrower_employee.full_name.toLowerCase().includes(q))
    );
  }, [loansList, search]);

  const cardAnimationClass =
    "transition-all duration-200 ease-in-out cursor-pointer hover:-translate-y-1 active:scale-95 active:translate-y-0 select-none";

  return (
    <div className="min-h-screen bg-[#F5F7FA] pb-16">
      {/* ── 1. PageHeader Banner (Navy Blue & Gold Diagonal) ── */}
      <PageHeader
        title="Peminjaman Barang Gudang (FPBG)"
        subtitle="Pinjam alat/barang yang sudah terdaftar sebagai Aset (Asset Maintenance) ke employee (mis. untuk perbaikan) — perlu persetujuan Manager, aset yang sedang dipinjam tidak bisa dipinjam lagi sampai dikembalikan."
        containerClassName="px-7 pt-5 pb-2"
      />

      {/* ── 2. Pembungkus Konten Utama ── */}
      <div className="flex flex-col gap-6 px-7 py-5">
        {/* ── Top Overview Card: Banner & 4 KPI Cards (Persis Referensi) ── */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm flex flex-col gap-5">
          {/* Banner Status Health */}
          <div className="bg-emerald-50/60 rounded-xl p-4 border border-emerald-200/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
            <div className="flex items-center gap-3.5 flex-1 w-full sm:w-auto">
              <div className="p-2.5 bg-emerald-100 text-emerald-700 rounded-xl shrink-0">
                <CheckCircle2 size={22} />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <h2 className="text-xs font-bold text-emerald-800 tracking-wide uppercase">
                    Status Operasional Peminjaman Aset (FPBG)
                  </h2>
                  <span className="text-[11px] font-bold font-mono text-emerald-700">
                    {returnPercentage}% Aset Sudah Kembali
                  </span>
                </div>
                <div className="w-full bg-emerald-100/60 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-600 transition-all duration-300"
                    style={{ width: `${returnPercentage}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-white px-4 py-2.5 rounded-xl border border-emerald-200/80 w-full sm:w-auto justify-between sm:justify-end shadow-xs shrink-0">
              <div className="flex items-center gap-2 text-slate-600 text-xs font-medium">
                <Layers size={15} className="text-amber-500" />
                <span>Total Peminjaman:</span>
              </div>
              <span className="text-xs font-bold text-slate-800 font-mono">
                {totalLoans} Transaksi
              </span>
            </div>
          </div>

          {/* 4 Kartu Statistik Interaktif */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Total Peminjaman */}
            <button
              type="button"
              onClick={() => {
                setStatusFilter("");
                setPage(1);
              }}
              className={`w-full text-left p-5 rounded-xl border bg-white shadow-sm flex items-center gap-4 focus:outline-none ${cardAnimationClass} ${
                statusFilter === ""
                  ? "border-blue-500 ring-2 ring-blue-500/20 shadow-md"
                  : "border-slate-200/80 hover:border-blue-300 hover:shadow-md"
              }`}
            >
              <div className="p-3 bg-blue-50 text-blue-600 rounded-xl shrink-0">
                <Layers size={22} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide truncate">
                  Total Peminjaman
                </p>
                <h3 className="text-2xl font-bold text-slate-800 mt-0.5">
                  {totalLoans}{" "}
                  <span className="text-xs font-normal text-slate-400">FPBG</span>
                </h3>
              </div>
            </button>

            {/* Card 2: Sedang Dipinjam */}
            <button
              type="button"
              onClick={() => {
                setStatusFilter(statusFilter === "on_loan" ? "" : "on_loan");
                setPage(1);
              }}
              className={`w-full text-left p-5 rounded-xl border bg-white shadow-sm flex items-center gap-4 focus:outline-none ${cardAnimationClass} ${
                statusFilter === "on_loan"
                  ? "border-amber-500 ring-2 ring-amber-500/20 shadow-md"
                  : "border-slate-200/80 hover:border-amber-300 hover:shadow-md"
              }`}
            >
              <div className="p-3 bg-amber-50 text-amber-600 rounded-xl shrink-0">
                <PackageCheck size={22} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide truncate">
                  Sedang Dipinjam
                </p>
                <h3 className="text-2xl font-bold text-amber-600 mt-0.5">
                  {onLoanCount}{" "}
                  <span className="text-xs font-normal text-slate-400">Unit</span>
                </h3>
              </div>
            </button>

            {/* Card 3: Menunggu Approval */}
            <button
              type="button"
              onClick={() => {
                setStatusFilter(statusFilter === "submitted" ? "" : "submitted");
                setPage(1);
              }}
              className={`w-full text-left p-5 rounded-xl border bg-white shadow-sm flex items-center gap-4 focus:outline-none ${cardAnimationClass} ${
                statusFilter === "submitted"
                  ? "border-purple-500 ring-2 ring-purple-500/20 shadow-md"
                  : "border-slate-200/80 hover:border-purple-300 hover:shadow-md"
              }`}
            >
              <div className="p-3 bg-purple-50 text-purple-600 rounded-xl shrink-0">
                <Clock size={22} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide truncate">
                  Menunggu Approval
                </p>
                <h3 className="text-2xl font-bold text-purple-600 mt-0.5">
                  {submittedCount}{" "}
                  <span className="text-xs font-normal text-slate-400">Kasus</span>
                </h3>
              </div>
            </button>

            {/* Card 4: Sudah Dikembalikan */}
            <button
              type="button"
              onClick={() => {
                setStatusFilter(statusFilter === "returned" ? "" : "returned");
                setPage(1);
              }}
              className={`w-full text-left p-5 rounded-xl border bg-white shadow-sm flex items-center gap-4 focus:outline-none ${cardAnimationClass} ${
                statusFilter === "returned"
                  ? "border-emerald-500 ring-2 ring-emerald-500/20 shadow-md"
                  : "border-slate-200/80 hover:border-emerald-300 hover:shadow-md"
              }`}
            >
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl shrink-0">
                <RotateCcw size={22} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide truncate">
                  Sudah Kembali
                </p>
                <h3 className="text-2xl font-bold text-emerald-600 mt-0.5">
                  {returnedCount}{" "}
                  <span className="text-xs font-normal text-slate-400">Unit</span>
                </h3>
              </div>
            </button>
          </div>
        </div>

        {/* ── Main Table Card: Toolbar & Data Table ── */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm flex flex-col gap-4">
          {/* Toolbar Sesuai Referensi */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3 flex-1 flex-wrap">
              {/* Search input */}
              <div className="relative flex-1 min-w-[220px] max-w-sm">
                <Search
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="text"
                  placeholder="Cari No. FPBG / Kode Barang / Peminjam..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-amber-500 transition-all"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded-full cursor-pointer"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* Status Filter Dropdown */}
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value as ItemLoanStatus | "");
                  setPage(1);
                }}
                className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:bg-white focus:outline-none focus:border-amber-500 transition-all cursor-pointer"
              >
                <option value="">Semua Status</option>
                {Object.entries(STATUS_LABELS).map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </select>

              {statusFilter !== "" && (
                <button
                  type="button"
                  onClick={() => {
                    setStatusFilter("");
                    setPage(1);
                  }}
                  className="flex items-center gap-1.5 px-3 py-2 bg-rose-50 border border-rose-200/60 text-rose-600 rounded-xl text-xs font-semibold hover:bg-rose-100 transition-all cursor-pointer"
                >
                  <FilterX size={14} /> Reset Filter
                </button>
              )}
            </div>

            {/* Tombol Aksi Tambah (Kuning Emas Sesuai Referensi) */}
            {canManage && (
              <button
                type="button"
                onClick={() => setShowModal(true)}
                className="flex items-center justify-center gap-1.5 bg-amber-500 hover:bg-amber-600 active:scale-95 text-white font-medium px-4 py-2 rounded-xl text-sm transition-all shadow-xs cursor-pointer shrink-0"
              >
                <Plus size={16} />
                <span>Peminjaman Baru</span>
              </button>
            )}
          </div>

          {isLoading && <LoadingState />}
          {!isLoading && filteredLoans.length === 0 && (
            <EmptyState
              title="Belum Ada Peminjaman Barang"
              subtitle="Barang/alat yang dipinjamkan dari gudang ke employee akan muncul di sini."
            />
          )}

          {!isLoading && filteredLoans.length > 0 && (
            <div className="border border-slate-200/90 rounded-xl overflow-hidden mt-1">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-200/90 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      <th className="py-3.5 px-4">No FPBG</th>
                      <th className="py-3.5 px-4">Barang / Aset</th>
                      <th className="py-3.5 px-4">Peminjam</th>
                      <th className="py-3.5 px-4">Rencana Kembali</th>
                      <th className="py-3.5 px-4">Status & Alur</th>
                      <th className="py-3.5 px-4 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                    {filteredLoans.map((loan) => (
                      <ItemLoanRow key={loan.id} loan={loan} />
                    ))}
                  </tbody>
                </table>
              </div>
              {data && data.last_page > 1 && (
                <div className="p-4 border-t border-slate-100 bg-slate-50/40">
                  <Pagination
                    currentPage={data.current_page}
                    lastPage={data.last_page}
                    total={data.total}
                    onPageChange={setPage}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {showModal && <ItemLoanFormModal onClose={() => setShowModal(false)} />}
    </div>
  );
}

function ItemLoanRow({ loan }: { loan: ItemLoan }) {
  const { hasPermission } = useAuth();
  const canManage = hasPermission("item-loan.manage");
  const orgId = useActiveOrgId();
  const submitMutation = useSubmitItemLoan(loan.id);
  const cancelMutation = useCancelItemLoan(loan.id);
  const loanedMutation = useMarkItemLoaned(loan.id);
  const returnedMutation = useMarkItemReturned(loan.id);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [previewBlob, setPreviewBlob] = useState<Blob | null>(null);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const overdue = isOverdue(loan);

  async function handleSubmit() {
    if (!confirm(`Submit Peminjaman ${loan.loan_number} untuk approval?`)) return;
    try {
      await submitMutation.mutateAsync();
    } catch (err) {
      alert(extractErrorMessage(err));
    }
  }

  async function handleCancel() {
    if (!confirm(`Batalkan Peminjaman ${loan.loan_number}?`)) return;
    try {
      await cancelMutation.mutateAsync();
    } catch (err) {
      alert(extractErrorMessage(err));
    }
  }

  async function handleMarkLoaned() {
    if (
      !confirm(
        `Konfirmasi barang untuk FPBG ${loan.loan_number} SUDAH diserahkan ke peminjam?`
      )
    )
      return;
    try {
      await loanedMutation.mutateAsync();
    } catch (err) {
      alert(extractErrorMessage(err));
    }
  }

  async function handlePreviewPdf() {
    if (!orgId) return;
    setDownloadingPdf(true);
    try {
      const res = await itemLoanApi.downloadPdf(loan.id, orgId);
      setPreviewBlob(res.data);
    } catch (err) {
      alert(extractErrorMessage(err));
    } finally {
      setDownloadingPdf(false);
    }
  }

  return (
    <>
      <tr className="hover:bg-slate-50/60 transition-colors">
        <td className="py-3.5 px-4">
          <div className="font-mono text-xs font-bold text-slate-800">
            {loan.loan_number}
          </div>
          {loan.purpose && (
            <div className="text-[11px] text-slate-400 truncate max-w-xs mt-0.5">
              {loan.purpose}
            </div>
          )}
        </td>
        <td className="py-3.5 px-4 text-xs">
          <div className="font-medium text-slate-900">{loan.asset?.asset_name ?? "—"}</div>
          <div className="inline-flex items-center font-mono text-[11px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded mt-0.5">
            {loan.asset?.asset_number ?? "—"}
          </div>
        </td>
        <td className="py-3.5 px-4 text-xs font-medium text-slate-800">
          <div className="flex items-center gap-1.5">
            <UserCheck size={14} className="text-emerald-600 shrink-0" />
            <span>{loan.borrower_employee?.full_name ?? "—"}</span>
          </div>
        </td>
        <td className="py-3.5 px-4 text-xs text-slate-600 whitespace-nowrap">
          <div className="flex items-center gap-1.5">
            <Calendar size={13} className="text-slate-400 shrink-0" />
            <span>{new Date(loan.expected_return_date).toLocaleDateString("id-ID")}</span>
          </div>
          {overdue && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-600 border border-rose-200 mt-1">
              <AlertTriangle size={10} /> Terlambat
            </span>
          )}
        </td>
        <td className="py-3.5 px-4">
          <div className="flex flex-col gap-1.5 min-w-[160px]">
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border w-fit ${
                STATUS_BADGE_CLASSES[loan.status] ?? "bg-slate-100 text-slate-700 border-slate-200"
              }`}
            >
              {STATUS_LABELS[loan.status]}
            </span>
            {loan.status === "submitted" && (
              <div className="text-xs">
                <ApprovalStepsList workflowInstanceId={loan.workflow_instance_id} />
              </div>
            )}
          </div>
        </td>
        <td className="py-3.5 px-4 text-center">
          <div className="flex items-center justify-center gap-1.5 flex-wrap">
            {loan.status === "draft" && canManage && (
              <>
                <button
                  type="button"
                  disabled={submitMutation.isPending}
                  onClick={handleSubmit}
                  className="px-2.5 py-1 rounded-lg border border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100 text-xs font-medium transition-colors cursor-pointer"
                >
                  Submit
                </button>
                <button
                  type="button"
                  disabled={cancelMutation.isPending}
                  onClick={handleCancel}
                  className="px-2.5 py-1 rounded-lg border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 text-xs font-medium transition-colors cursor-pointer"
                >
                  Batal
                </button>
              </>
            )}
            {loan.status === "approved" && canManage && (
              <button
                type="button"
                disabled={loanedMutation.isPending}
                onClick={handleMarkLoaned}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-medium transition-colors cursor-pointer"
              >
                <PackageCheck size={12} />
                <span>Serahkan Barang</span>
              </button>
            )}
            {loan.status === "on_loan" && canManage && (
              <button
                type="button"
                onClick={() => setShowReturnModal(true)}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-xs font-medium transition-colors cursor-pointer"
              >
                <RotateCcw size={12} />
                <span>Kembalikan</span>
              </button>
            )}
            {loan.status !== "draft" && (
              <button
                type="button"
                disabled={downloadingPdf}
                onClick={handlePreviewPdf}
                title="Pratinjau PDF FPBG"
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 bg-white text-slate-600 hover:text-amber-600 hover:bg-amber-50 hover:border-amber-300 text-xs font-medium transition-all cursor-pointer disabled:opacity-50"
              >
                <FileDown size={12} className="text-amber-500" />
                <span>PDF</span>
              </button>
            )}
          </div>
        </td>
      </tr>
      {previewBlob && (
        <PdfPreviewModal
          title={`FPBG — ${loan.loan_number}`}
          blob={previewBlob}
          filename={`FPBG_${loan.loan_number}.pdf`}
          onClose={() => setPreviewBlob(null)}
        />
      )}
      {showReturnModal && (
        <ReturnLoanModal
          loanNumber={loan.loan_number}
          onClose={() => setShowReturnModal(false)}
          onSubmit={async (conditionIn) => {
            await returnedMutation.mutateAsync({
              condition_in: conditionIn || undefined,
            });
            setShowReturnModal(false);
          }}
        />
      )}
    </>
  );
}

function ReturnLoanModal({
  loanNumber,
  onClose,
  onSubmit,
}: {
  loanNumber: string;
  onClose: () => void;
  onSubmit: (conditionIn: string) => Promise<void>;
}) {
  const [conditionIn, setConditionIn] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await onSubmit(conditionIn);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <ProcurementFormModal
      title={`Kembalikan Barang — ${loanNumber}`}
      subtitle="Konfirmasi pengembalian barang pinjaman ke gudang penyimpanan"
      icon={RotateCcw}
      onClose={onClose}
      maxWidth="max-w-[460px]"
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
          >
            Batal
          </button>
          <button
            type="submit"
            form="return-loan-form"
            disabled={saving}
            className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-medium transition-all shadow-xs cursor-pointer disabled:opacity-50"
          >
            {saving ? "Menyimpan..." : "Konfirmasi Kembali"}
          </button>
        </>
      }
    >
      <form id="return-loan-form" onSubmit={handleSubmit} className="flex flex-col gap-4 py-1">
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">
            Kondisi Barang Saat Kembali (opsional)
          </label>
          <input
            type="text"
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-amber-500 transition-all placeholder:text-slate-400"
            value={conditionIn}
            onChange={(e) => setConditionIn(e.target.value)}
            placeholder="mis. Baik, tidak ada kerusakan"
          />
        </div>
        <div className="text-xs text-slate-400">
          Aset ini akan bisa dipinjamkan lagi setelah dikonfirmasi kembali ke gudang.
        </div>
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200/80 rounded-xl text-xs font-medium text-rose-700">
            {error}
          </div>
        )}
      </form>
    </ProcurementFormModal>
  );
}

function ItemLoanFormModal({ onClose }: { onClose: () => void }) {
  const [assetId, setAssetId] = useState<number | "">("");
  const [assetSearch, setAssetSearch] = useState("");
  const [selectedAsset, setSelectedAsset] = useState<AvailableAssetForLoan | null>(null);
  const [borrower, setBorrower] = useState<Employee | null>(null);
  const [borrowerPhone, setBorrowerPhone] = useState("");
  const [loanDate, setLoanDate] = useState(new Date().toISOString().slice(0, 10));
  const [expectedReturnDate, setExpectedReturnDate] = useState("");
  const [purpose, setPurpose] = useState("");
  const [usageLocation, setUsageLocation] = useState("");
  const [accessories, setAccessories] = useState("");
  const [conditionOut, setConditionOut] = useState("Baik (Normal & Lengkap)");
  const [error, setError] = useState<string | null>(null);
  const createMutation = useCreateItemLoan();

  const { data: availableAssets } = useAvailableAssetsForLoan(assetSearch);

  function selectAsset(a: AvailableAssetForLoan) {
    setAssetId(a.id);
    setSelectedAsset(a);
    setAssetSearch("");
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!assetId) {
      setError("Pilih barang/aset yang dipinjam.");
      return;
    }
    if (!borrower) {
      setError("Pilih employee peminjam dari daftar.");
      return;
    }
    if (!borrowerPhone.trim()) {
      setError("Nomor kontak / WhatsApp peminjam wajib diisi.");
      return;
    }
    if (!loanDate) {
      setError("Tanggal mulai pinjam wajib diisi.");
      return;
    }
    if (!expectedReturnDate) {
      setError("Rencana tanggal pengembalian wajib diisi.");
      return;
    }
    if (expectedReturnDate < loanDate) {
      setError("Rencana tanggal pengembalian tidak boleh mendahului tanggal mulai pinjam.");
      return;
    }
    if (!purpose.trim()) {
      setError("Keperluan peminjaman wajib diisi.");
      return;
    }

    try {
      const extraNotes = [
        `[Kontak: ${borrowerPhone.trim()}]`,
        `[Tgl Pinjam: ${loanDate}]`,
        usageLocation.trim() ? `[Lokasi: ${usageLocation.trim()}]` : null,
        accessories.trim() ? `[Aksesoris: ${accessories.trim()}]` : null,
      ]
        .filter(Boolean)
        .join(" ");

      await createMutation.mutateAsync({
        asset_id: assetId,
        borrower_employee_id: borrower.id,
        purpose: extraNotes ? `${purpose.trim()} — ${extraNotes}` : purpose.trim(),
        expected_return_date: expectedReturnDate,
        condition_out: conditionOut || undefined,
      });
      onClose();
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  }

  return (
    <ProcurementFormModal
      title="Peminjaman Barang Gudang (FPBG) Baru"
      subtitle="Pencatatan peminjaman alat kerja / perlengkapan gudang ke employee pemohon"
      icon={PackageCheck}
      onClose={onClose}
      maxWidth="max-w-[620px]"
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
          >
            Batal
          </button>
          <button
            type="submit"
            form="loan-form"
            disabled={createMutation.isPending}
            className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-medium transition-all shadow-xs cursor-pointer disabled:opacity-50"
          >
            {createMutation.isPending ? "Menyimpan..." : "Simpan Dokumen FPBG"}
          </button>
        </>
      }
    >
      <form id="loan-form" onSubmit={handleSubmit} className="flex flex-col gap-3.5 py-1">
        {/* Pilih Aset */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">
            Barang / Alat (Aset Terdaftar di Gudang) *
          </label>
          {selectedAsset ? (
            <div className="flex items-center justify-between gap-3 p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl text-sm">
              <div>
                <span className="font-bold text-amber-950 font-mono">
                  {selectedAsset.asset_name}
                </span>
                <span className="text-xs text-amber-700 block font-mono">
                  Kode: {selectedAsset.asset_number}
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedAsset(null);
                  setAssetId("");
                }}
                className="text-slate-400 hover:text-rose-600 p-1 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>
          ) : (
            <div className="relative">
              <div className="relative">
                <Search
                  size={15}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="text"
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-amber-500 transition-all placeholder:text-slate-400"
                  placeholder="Cari nama alat atau Kode Barang..."
                  value={assetSearch}
                  onChange={(e) => setAssetSearch(e.target.value)}
                />
              </div>
              {(availableAssets ?? []).length > 0 && (
                <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-48 overflow-y-auto divide-y divide-slate-100">
                  {(availableAssets ?? []).map((a) => (
                    <button
                      key={a.id}
                      type="button"
                      className="w-full p-2.5 text-left hover:bg-slate-50 text-xs text-slate-800 flex items-center justify-between transition-colors cursor-pointer"
                      onClick={() => selectAsset(a)}
                    >
                      <span className="font-semibold text-slate-900">{a.asset_name}</span>
                      <span className="text-[11px] font-mono text-slate-500 font-medium">({a.asset_number})</span>
                    </button>
                  ))}
                </div>
              )}
              {availableAssets && availableAssets.length === 0 && (
                <div className="text-xs text-slate-400 mt-1.5 italic">
                  Tidak ada aset aktif yang siap dipinjam (sedang dipinjam atau dalam perbaikan).
                </div>
              )}
            </div>
          )}
        </div>

        {/* Tanggal Pinjam & Rencana Kembali */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">
              Tanggal Pinjam (Mulai) *
            </label>
            <input
              type="date"
              required
              value={loanDate}
              onChange={(e) => setLoanDate(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-amber-500 transition-all font-medium"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">
              Rencana Tanggal Kembali *
            </label>
            <input
              type="date"
              required
              min={loanDate}
              value={expectedReturnDate}
              onChange={(e) => setExpectedReturnDate(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-amber-500 transition-all font-medium"
            />
          </div>
        </div>

        {/* Peminjam & Kontak */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">
              Peminjam (Employee Terdaftar) *
            </label>
            <EmployeePickerField
              employeeId={borrower?.id ?? ""}
              employeeName={borrower?.full_name ?? ""}
              onSelect={(emp) => {
                setBorrower(emp);
                if (emp && (emp as any).phone && !borrowerPhone) {
                  setBorrowerPhone((emp as any).phone);
                }
              }}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">
              No. Kontak / WhatsApp Peminjam *
            </label>
            <input
              type="text"
              placeholder="mis. 081234567890"
              value={borrowerPhone}
              onChange={(e) => setBorrowerPhone(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-amber-500 transition-all"
            />
          </div>
        </div>

        {/* Keperluan & Lokasi Penggunaan */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">
              Keperluan Peminjaman *
            </label>
            <input
              type="text"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-amber-500 transition-all placeholder:text-slate-400"
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              placeholder="mis. Liputan lapangan / Maintenance AC Presisi Site A"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">
              Lokasi Penggunaan Barang
            </label>
            <input
              type="text"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-amber-500 transition-all placeholder:text-slate-400"
              value={usageLocation}
              onChange={(e) => setUsageLocation(e.target.value)}
              placeholder="mis. Studio 2 / Gedung Pemancar Surabaya"
            />
          </div>
        </div>

        {/* Kondisi Awal & Aksesoris */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">
              Kondisi Fisik Saat Dipinjam *
            </label>
            <select
              value={conditionOut}
              onChange={(e) => setConditionOut(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-amber-500 transition-all font-medium"
            >
              <option value="Baik (Normal & Lengkap)">Baik (Normal &amp; Lengkap)</option>
              <option value="Baik (Lecet Pemakaian)">Baik (Lecet Pemakaian Wajar)</option>
              <option value="Fungsi Normal (Tanpa Box)">Fungsi Normal (Tanpa Kemasan Asli)</option>
              <option value="Ada Minus Kecil">Ada Minus Minor (Tercatat)</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">
              Aksesoris / Kelengkapan Ikut Serta
            </label>
            <input
              type="text"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-amber-500 transition-all placeholder:text-slate-400"
              value={accessories}
              onChange={(e) => setAccessories(e.target.value)}
              placeholder="mis. Kabel power, adaptor charger, tas ransel"
            />
          </div>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200/80 rounded-xl text-xs font-medium text-rose-700">
            {error}
          </div>
        )}
      </form>
    </ProcurementFormModal>
  );
}

function EmployeePickerField({
  employeeId,
  employeeName,
  onSelect,
}: {
  employeeId: number | "";
  employeeName: string;
  onSelect: (emp: Employee | null) => void;
}) {
  const [search, setSearch] = useState("");
  const { data: results } = useQuery({
    queryKey: ["employee-search", search],
    queryFn: () =>
      employeeApi.list({ search, per_page: 10 }).then((r) => r.data?.data ?? []),
    enabled: search.length >= 2,
  });

  if (employeeId) {
    return (
      <div className="flex items-center justify-between gap-3 p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl text-sm">
        <span className="font-semibold text-amber-900">{employeeName}</span>
        <button
          type="button"
          onClick={() => onSelect(null)}
          className="text-slate-400 hover:text-rose-600 p-1 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
        >
          <X size={15} />
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <input
        type="text"
        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:bg-white focus:outline-none focus:border-amber-500 transition-all placeholder:text-slate-400"
        placeholder="Ketik minimal 2 huruf untuk cari nama employee..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      {search.length >= 2 && results && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-48 overflow-y-auto divide-y divide-slate-100">
          {results.length === 0 && (
            <div className="p-3 text-xs text-slate-400">Tidak ditemukan.</div>
          )}
          {results.map((emp) => (
            <button
              key={emp.id}
              type="button"
              className="w-full p-2.5 text-left hover:bg-slate-50 text-xs text-slate-800 flex items-center justify-between transition-colors cursor-pointer"
              onClick={() => {
                onSelect(emp);
                setSearch("");
              }}
            >
              <span className="font-medium text-slate-900">{emp.full_name}</span>
              <span className="text-[11px] font-mono text-slate-400">({emp.employee_number})</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
