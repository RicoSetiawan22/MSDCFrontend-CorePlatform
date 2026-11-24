import { useState, useMemo, type FormEvent } from "react";
import {
  Search,
  Plus,
  X,
  FileDown,
  Paperclip,
  ShieldCheck,
  ShieldAlert,
  Clock,
  Send,
  CheckCircle2,
  Building2,
  FilterX,
  Upload,
} from "lucide-react";
import {
  useWarrantyClaimList,
  useCreateWarrantyClaim,
  useSubmitWarrantyClaim,
  useCancelWarrantyClaim,
  useMarkWarrantyClaimSentToVendor,
  useResolveWarrantyClaim,
  usePoReceiptItems,
  useAttachWarrantyClaimProof,
} from "../api/useWarrantyClaim";
import { warrantyClaimApi } from "../api/warrantyClaimApi";
import { usePoList } from "../api/usePo";
import { ProcurementFormModal } from "../components/ProcurementFormModal";
import { PdfPreviewModal } from "@shared/components/PdfPreviewModal";
import { ApprovalStepsList } from "@shared/components/ApprovalStepsList";
import { Pagination } from "@shared/components/Pagination";
import { PageHeader } from "@shared/components/PageHeader";
import { EmptyState } from "@shared/components/EmptyState";
import { LoadingState } from "@shared/components/LoadingState";
import { FileUploadField } from "@shared/components/FileUploadField";
import { fileApi } from "@shared/api/fileApi";
import { extractErrorMessage } from "@shared/types/api";
import { useActiveOrgId } from "@shared/lib/organization-context";
import { useAuth } from "@shared/lib/auth-context";
import type {
  WarrantyClaim,
  WarrantyClaimStatus,
  PoReceiptItem,
} from "../types/warrantyClaim";
import type { PurchaseOrder } from "../types/po";

const STATUS_LABELS: Record<WarrantyClaimStatus, string> = {
  draft: "Draft",
  submitted: "Menunggu Approval",
  approved: "Disetujui",
  rejected: "Ditolak",
  sent_to_vendor: "Terkirim ke Vendor",
  resolved: "Selesai",
  cancelled: "Dibatalkan",
};

const STATUS_BADGE_CLASSES: Record<WarrantyClaimStatus, string> = {
  draft: "bg-slate-100 text-slate-700 border-slate-200",
  submitted: "bg-amber-50 text-amber-700 border-amber-200/80",
  approved: "bg-emerald-50 text-emerald-700 border-emerald-200/80",
  rejected: "bg-rose-50 text-rose-700 border-rose-200/80",
  sent_to_vendor: "bg-blue-50 text-blue-700 border-blue-200/80",
  resolved: "bg-indigo-50 text-indigo-700 border-indigo-200/80",
  cancelled: "bg-slate-100 text-slate-500 border-slate-200",
};

export function WarrantyClaimListPage() {
  const { hasPermission } = useAuth();
  const canManage = hasPermission("warranty-claim.manage");
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<WarrantyClaimStatus | "">("");
  const [showModal, setShowModal] = useState(false);

  const { data, isLoading } = useWarrantyClaimList({
    page,
    per_page: 20,
    status: statusFilter || undefined,
  });

  const claimsList = useMemo(() => data?.data ?? [], [data]);

  // KPI Calculations
  const totalClaims = data?.total ?? 0;
  const submittedCount = useMemo(
    () => claimsList.filter((c) => c.status === "submitted").length,
    [claimsList]
  );
  const inVendorCount = useMemo(
    () => claimsList.filter((c) => c.status === "sent_to_vendor" || c.status === "approved").length,
    [claimsList]
  );
  const resolvedCount = useMemo(
    () => claimsList.filter((c) => c.status === "resolved").length,
    [claimsList]
  );

  const resolvePercentage =
    totalClaims > 0 ? Math.round((resolvedCount / totalClaims) * 100) : 100;

  // Filtered by Search on client side for responsive search
  const filteredClaims = useMemo(() => {
    if (!search) return claimsList;
    const q = search.toLowerCase();
    return claimsList.filter(
      (c) =>
        c.claim_number.toLowerCase().includes(q) ||
        (c.purchase_order?.po_number && c.purchase_order.po_number.toLowerCase().includes(q)) ||
        (c.vendor?.vendor_name && c.vendor.vendor_name.toLowerCase().includes(q)) ||
        c.item_description.toLowerCase().includes(q)
    );
  }, [claimsList, search]);

  const cardAnimationClass =
    "transition-all duration-200 ease-in-out cursor-pointer hover:-translate-y-1 active:scale-95 active:translate-y-0 select-none";

  return (
    <div className="min-h-screen bg-[#F5F7FA] pb-16">
      {/* ── 1. PageHeader Banner (Navy Blue & Gold Diagonal) ── */}
      <PageHeader
        title="Garansi Barang (FGBG)"
        subtitle="Klaim garansi atas barang yang sudah dibeli — perlu persetujuan Manager sebelum diajukan ke vendor."
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
                <ShieldCheck size={22} />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <h2 className="text-xs font-bold text-emerald-800 tracking-wide uppercase">
                    Status Operasional Garansi & Klaim Vendor
                  </h2>
                  <span className="text-[11px] font-bold font-mono text-emerald-700">
                    {resolvePercentage}% Terlayani Selesai
                  </span>
                </div>
                <div className="w-full bg-emerald-100/60 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-600 transition-all duration-300"
                    style={{ width: `${resolvePercentage}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-white px-4 py-2.5 rounded-xl border border-emerald-200/80 w-full sm:w-auto justify-between sm:justify-end shadow-xs shrink-0">
              <div className="flex items-center gap-2 text-slate-600 text-xs font-medium">
                <ShieldAlert size={15} className="text-amber-500" />
                <span>Total Klaim Garansi:</span>
              </div>
              <span className="text-xs font-bold text-slate-800 font-mono">
                {totalClaims} Kasus
              </span>
            </div>
          </div>

          {/* 4 Kartu Statistik Interaktif */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Total Klaim */}
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
                <ShieldAlert size={22} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide truncate">
                  Total Klaim
                </p>
                <h3 className="text-2xl font-bold text-slate-800 mt-0.5">
                  {totalClaims}{" "}
                  <span className="text-xs font-normal text-slate-400">Dokumen</span>
                </h3>
              </div>
            </button>

            {/* Card 2: Menunggu Approval */}
            <button
              type="button"
              onClick={() => {
                setStatusFilter(statusFilter === "submitted" ? "" : "submitted");
                setPage(1);
              }}
              className={`w-full text-left p-5 rounded-xl border bg-white shadow-sm flex items-center gap-4 focus:outline-none ${cardAnimationClass} ${
                statusFilter === "submitted"
                  ? "border-amber-500 ring-2 ring-amber-500/20 shadow-md"
                  : "border-slate-200/80 hover:border-amber-300 hover:shadow-md"
              }`}
            >
              <div className="p-3 bg-amber-50 text-amber-600 rounded-xl shrink-0">
                <Clock size={22} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide truncate">
                  Menunggu Approval
                </p>
                <h3 className="text-2xl font-bold text-amber-600 mt-0.5">
                  {submittedCount}{" "}
                  <span className="text-xs font-normal text-slate-400">Klaim</span>
                </h3>
              </div>
            </button>

            {/* Card 3: Proses Vendor */}
            <button
              type="button"
              onClick={() => {
                setStatusFilter(statusFilter === "sent_to_vendor" ? "" : "sent_to_vendor");
                setPage(1);
              }}
              className={`w-full text-left p-5 rounded-xl border bg-white shadow-sm flex items-center gap-4 focus:outline-none ${cardAnimationClass} ${
                statusFilter === "sent_to_vendor"
                  ? "border-blue-500 ring-2 ring-blue-500/20 shadow-md"
                  : "border-slate-200/80 hover:border-blue-300 hover:shadow-md"
              }`}
            >
              <div className="p-3 bg-blue-50 text-blue-600 rounded-xl shrink-0">
                <Send size={22} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide truncate">
                  Proses Vendor
                </p>
                <h3 className="text-2xl font-bold text-slate-800 mt-0.5">
                  {inVendorCount}{" "}
                  <span className="text-xs font-normal text-slate-400">Barang</span>
                </h3>
              </div>
            </button>

            {/* Card 4: Klaim Selesai */}
            <button
              type="button"
              onClick={() => {
                setStatusFilter(statusFilter === "resolved" ? "" : "resolved");
                setPage(1);
              }}
              className={`w-full text-left p-5 rounded-xl border bg-white shadow-sm flex items-center gap-4 focus:outline-none ${cardAnimationClass} ${
                statusFilter === "resolved"
                  ? "border-emerald-500 ring-2 ring-emerald-500/20 shadow-md"
                  : "border-slate-200/80 hover:border-emerald-300 hover:shadow-md"
              }`}
            >
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl shrink-0">
                <CheckCircle2 size={22} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide truncate">
                  Klaim Selesai
                </p>
                <h3 className="text-2xl font-bold text-emerald-600 mt-0.5">
                  {resolvedCount}{" "}
                  <span className="text-xs font-normal text-slate-400">Selesai</span>
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
                  placeholder="Cari No. Klaim / PO / Vendor / Barang..."
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
                  setStatusFilter(e.target.value as WarrantyClaimStatus | "");
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
                <span>Klaim Garansi Baru</span>
              </button>
            )}
          </div>

          {isLoading && <LoadingState />}
          {!isLoading && filteredClaims.length === 0 && (
            <EmptyState
              title="Belum Ada Klaim Garansi"
              subtitle="Klaim garansi atas barang yang sudah dibeli akan muncul di sini."
            />
          )}

          {!isLoading && filteredClaims.length > 0 && (
            <div className="border border-slate-200/90 rounded-xl overflow-hidden mt-1">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-200/90 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      <th className="py-3.5 px-4">No Klaim</th>
                      <th className="py-3.5 px-4">PO Terkait</th>
                      <th className="py-3.5 px-4">Vendor</th>
                      <th className="py-3.5 px-4">Deskripsi Barang</th>
                      <th className="py-3.5 px-4">Status & Alur</th>
                      <th className="py-3.5 px-4 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                    {filteredClaims.map((claim) => (
                      <WarrantyClaimRow key={claim.id} claim={claim} />
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

      {showModal && <WarrantyClaimFormModal onClose={() => setShowModal(false)} />}
    </div>
  );
}

function WarrantyClaimRow({ claim }: { claim: WarrantyClaim }) {
  const { hasPermission } = useAuth();
  const canManage = hasPermission("warranty-claim.manage");
  const orgId = useActiveOrgId();
  const submitMutation = useSubmitWarrantyClaim(claim.id);
  const cancelMutation = useCancelWarrantyClaim(claim.id);
  const sendMutation = useMarkWarrantyClaimSentToVendor(claim.id);
  const resolveMutation = useResolveWarrantyClaim(claim.id);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [previewBlob, setPreviewBlob] = useState<Blob | null>(null);
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [showProofModal, setShowProofModal] = useState(false);

  async function handleSubmit() {
    if (!confirm(`Submit Klaim Garansi ${claim.claim_number} untuk approval?`)) return;
    try {
      await submitMutation.mutateAsync();
    } catch (err) {
      alert(extractErrorMessage(err));
    }
  }

  async function handleCancel() {
    if (!confirm(`Batalkan Klaim Garansi ${claim.claim_number}?`)) return;
    try {
      await cancelMutation.mutateAsync();
    } catch (err) {
      alert(extractErrorMessage(err));
    }
  }

  async function handleSendToVendor() {
    if (!confirm(`Tandai Klaim Garansi ${claim.claim_number} sudah dikirim ke vendor?`)) return;
    try {
      await sendMutation.mutateAsync();
    } catch (err) {
      alert(extractErrorMessage(err));
    }
  }

  async function handlePreviewPdf() {
    if (!orgId) return;
    setDownloadingPdf(true);
    try {
      const res = await warrantyClaimApi.downloadPdf(claim.id, orgId);
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
            {claim.claim_number}
          </div>
          {claim.claim_date && (
            <div className="text-[11px] text-slate-400 mt-0.5">
              {new Date(claim.claim_date).toLocaleDateString("id-ID")}
            </div>
          )}
        </td>
        <td className="py-3.5 px-4 text-xs font-mono">
          <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium">
            {claim.purchase_order?.po_number ?? "—"}
          </span>
        </td>
        <td className="py-3.5 px-4 text-xs font-medium text-slate-700">
          <div className="flex items-center gap-1.5">
            <Building2 size={13} className="text-slate-400 shrink-0" />
            <span>{claim.vendor?.vendor_name ?? "—"}</span>
          </div>
        </td>
        <td className="py-3.5 px-4 text-xs text-slate-700">
          <div className="font-medium text-slate-900">{claim.item_description}</div>
          {claim.issue_description && (
            <div className="text-[11px] text-slate-400 truncate max-w-xs mt-0.5">
              {claim.issue_description}
            </div>
          )}
        </td>
        <td className="py-3.5 px-4">
          <div className="flex flex-col gap-1.5 min-w-[160px]">
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border w-fit ${
                STATUS_BADGE_CLASSES[claim.status] ?? "bg-slate-100 text-slate-700 border-slate-200"
              }`}
            >
              {STATUS_LABELS[claim.status]}
            </span>
            {claim.status === "submitted" && (
              <div className="text-xs">
                <ApprovalStepsList workflowInstanceId={claim.workflow_instance_id} />
              </div>
            )}
          </div>
        </td>
        <td className="py-3.5 px-4 text-center">
          <div className="flex items-center justify-center gap-1.5 flex-wrap">
            {claim.status === "draft" && canManage && (
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
            {claim.status === "approved" && canManage && (
              <button
                type="button"
                disabled={sendMutation.isPending}
                onClick={handleSendToVendor}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-medium transition-colors cursor-pointer"
              >
                <Send size={12} />
                <span>Kirim ke Vendor</span>
              </button>
            )}
            {(claim.status === "approved" || claim.status === "sent_to_vendor") && canManage && (
              <button
                type="button"
                onClick={() => setShowResolveModal(true)}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-xs font-medium transition-colors cursor-pointer"
              >
                <CheckCircle2 size={12} />
                <span>Barang Diterima</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => setShowProofModal(true)}
              title="Bukti serah terima ke toko/vendor garansi"
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs font-medium transition-colors cursor-pointer ${
                claim.proof_file_id
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              <Paperclip size={12} />
              <span>{claim.proof_file_id ? "Bukti Terlampir" : "Bukti"}</span>
            </button>
            {claim.status !== "draft" && (
              <button
                type="button"
                disabled={downloadingPdf}
                onClick={handlePreviewPdf}
                title="Pratinjau PDF FGBG"
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
          title={`FGBG — ${claim.claim_number}`}
          blob={previewBlob}
          filename={`FGBG_${claim.claim_number}.pdf`}
          onClose={() => setPreviewBlob(null)}
        />
      )}
      {showResolveModal && (
        <ResolveClaimModal
          claimNumber={claim.claim_number}
          onClose={() => setShowResolveModal(false)}
          onSubmit={async (notes, receivedDate) => {
            await resolveMutation.mutateAsync({
              resolution_notes: notes,
              resolved_date: receivedDate,
            });
            setShowResolveModal(false);
          }}
        />
      )}
      {showProofModal && (
        <ProofUploadModal claim={claim} onClose={() => setShowProofModal(false)} />
      )}
    </>
  );
}

function ProofUploadModal({
  claim,
  onClose,
}: {
  claim: WarrantyClaim;
  onClose: () => void;
}) {
  const attachMutation = useAttachWarrantyClaimProof(claim.id);
  const [error, setError] = useState<string | null>(null);

  async function handleUploaded(fileId: number) {
    setError(null);
    try {
      await attachMutation.mutateAsync(fileId);
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  }

  return (
    <ProcurementFormModal
      title={`Bukti Serah Terima — ${claim.claim_number}`}
      subtitle="Unggah bukti serah terima unit ke vendor untuk klaim garansi ini"
      icon={Paperclip}
      onClose={onClose}
      maxWidth="max-w-[480px]"
      footer={
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
        >
          Tutup
        </button>
      }
    >
      <div className="flex flex-col gap-4 py-1">
        <FileUploadField
          label="Bukti Serah Terima"
          currentFileId={claim.proof_file_id}
          moduleCode="ProcurementInventory"
          referenceType="WarrantyClaim"
          referenceId={claim.id}
          accept="image/*,.pdf"
          onUploaded={handleUploaded}
        />
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200/80 rounded-xl text-xs font-medium text-rose-700">
            {error}
          </div>
        )}
      </div>
    </ProcurementFormModal>
  );
}

function ResolveClaimModal({
  claimNumber,
  onClose,
  onSubmit,
}: {
  claimNumber: string;
  onClose: () => void;
  onSubmit: (notes: string, receivedDate: string) => Promise<void>;
}) {
  const [notes, setNotes] = useState("");
  const [receivedDate, setReceivedDate] = useState(new Date().toISOString().slice(0, 10));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await onSubmit(notes, receivedDate);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <ProcurementFormModal
      title={`Barang Diterima Kembali — ${claimNumber}`}
      subtitle="Konfirmasi barang sudah diambil kembali dari toko/vendor garansi"
      icon={CheckCircle2}
      onClose={onClose}
      maxWidth="max-w-[480px]"
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
            form="resolve-claim-form"
            disabled={saving}
            className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-medium transition-all shadow-xs cursor-pointer disabled:opacity-50"
          >
            {saving ? "Menyimpan..." : "Konfirmasi Diterima"}
          </button>
        </>
      }
    >
      <form id="resolve-claim-form" onSubmit={handleSubmit} className="flex flex-col gap-4 py-1">
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">
            Tanggal Barang Diterima *
          </label>
          <input
            type="date"
            required
            value={receivedDate}
            onChange={(e) => setReceivedDate(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-amber-500 transition-all"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">
            Catatan Penyelesaian (opsional)
          </label>
          <textarea
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="mis. Vendor mengganti unit baru / diperbaiki"
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-amber-500 transition-all resize-y"
          />
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

function WarrantyClaimFormModal({ onClose }: { onClose: () => void }) {
  const [poId, setPoId] = useState<number | "">("");
  const [poSearch, setPoSearch] = useState("");
  const [selectedPo, setSelectedPo] = useState<PurchaseOrder | null>(null);
  const [selectedItemLineId, setSelectedItemLineId] = useState<number | null>(null);
  const [assetId, setAssetId] = useState<number | undefined>(undefined);
  const [itemDescription, setItemDescription] = useState("");
  const [serialNumber, setSerialNumber] = useState("");
  const [issueDescription, setIssueDescription] = useState("");
  const [demandType, setDemandType] = useState<"repair" | "replacement" | "refund">("repair");
  const [purchaseDate, setPurchaseDate] = useState("");
  const [warrantyExpiry, setWarrantyExpiry] = useState("");
  const [claimDate, setClaimDate] = useState(new Date().toISOString().slice(0, 10));
  const [proofFile, setProofFile] = useState<{ id: number; name: string } | null>(null);
  const [uploadingProof, setUploadingProof] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createMutation = useCreateWarrantyClaim();

  // Filter PO: Selesai Diterima (completed) atau Sebagian Diterima (partially_received)
  const { data: poResults } = usePoList({ per_page: 20, search: poSearch || undefined });
  const eligiblePos = (poResults?.data ?? []).filter((p) =>
    ["completed", "partially_received"].includes(p.status)
  );

  const { data: receiptItems } = usePoReceiptItems(poId || undefined);

  // Status garansi aktif vs kedaluwarsa
  const isWarrantyExpired = useMemo(() => {
    if (!warrantyExpiry || !claimDate) return false;
    return claimDate > warrantyExpiry;
  }, [claimDate, warrantyExpiry]);

  function selectPo(po: PurchaseOrder) {
    setPoId(po.id);
    setSelectedPo(po);
    setPoSearch("");
    setSelectedItemLineId(null);
    setAssetId(undefined);
    setItemDescription("");
    setSerialNumber("");
    setPurchaseDate("");
    setWarrantyExpiry("");
  }

  function selectReceiptItem(item: PoReceiptItem) {
    setSelectedItemLineId(item.goods_receipt_line_id);
    setItemDescription(item.description ?? "");
    setSerialNumber(item.asset_number ?? "");
    setAssetId(item.asset_id ?? undefined);
    setPurchaseDate(item.receipt_date ?? "");
    setWarrantyExpiry(item.warranty_expiry ?? "");
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingProof(true);
    try {
      const res = await fileApi.upload(file, "ProcurementInventory", "WarrantyClaim");
      setProofFile({ id: res.data.data.id, name: res.data.data.original_name });
    } catch {
      setError("Gagal mengunggah bukti garansi/foto kerusakan.");
    } finally {
      setUploadingProof(false);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!poId) {
      setError("Pilih Purchase Order terlebih dahulu (hanya PO berstatus Selesai Diterima).");
      return;
    }
    if (!itemDescription.trim()) {
      setError("Isi/pilih deskripsi barang.");
      return;
    }
    if (!issueDescription.trim()) {
      setError("Isi kerusakan/masalah yang diklaim.");
      return;
    }
    if (isWarrantyExpired) {
      setError("Tanggal klaim tidak boleh melebihi tanggal kedaluwarsa garansi.");
      return;
    }

    try {
      const demandLabels = {
        repair: "Perbaikan (Service)",
        replacement: "Penggantian Unit Baru",
        refund: "Refund Dana",
      };
      const notes = [
        `[Tuntutan: ${demandLabels[demandType]}]`,
        serialNumber.trim() ? `[SN: ${serialNumber.trim()}]` : null,
      ]
        .filter(Boolean)
        .join(" ");

      const created = await createMutation.mutateAsync({
        purchase_order_id: poId,
        asset_id: assetId,
        item_description: itemDescription,
        issue_description: issueDescription,
        purchase_date: purchaseDate || undefined,
        warranty_expiry: warrantyExpiry || undefined,
        claim_date: claimDate || undefined,
        notes: notes || undefined,
      });

      if (proofFile && created?.id) {
        try {
          await warrantyClaimApi.attachProof(created.id, proofFile.id);
        } catch {
          // Non-blocking attachment
        }
      }

      onClose();
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  }

  return (
    <ProcurementFormModal
      title="Klaim Garansi Barang (FGBG) Baru"
      subtitle="Pengajuan klaim garansi produk rusak/bermasalah ke vendor"
      icon={ShieldAlert}
      onClose={onClose}
      maxWidth="max-w-[580px]"
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
            form="warranty-claim-form"
            disabled={createMutation.isPending}
            className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-medium transition-all shadow-xs cursor-pointer disabled:opacity-50"
          >
            {createMutation.isPending ? "Menyimpan..." : "Simpan Klaim"}
          </button>
        </>
      }
    >
      <form id="warranty-claim-form" onSubmit={handleSubmit} className="flex flex-col gap-4 py-1">
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">
            Purchase Order (barang yang dibeli) *
          </label>
          {selectedPo ? (
            <div className="flex items-center justify-between gap-3 p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl text-sm">
              <span className="font-semibold text-amber-900 font-mono">
                {selectedPo.po_number} — {selectedPo.vendor?.vendor_name}
              </span>
              <button
                type="button"
                onClick={() => {
                  setSelectedPo(null);
                  setPoId("");
                }}
                className="text-slate-400 hover:text-rose-600 p-1 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
              >
                <X size={15} />
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
                  placeholder="Cari No. PO atau vendor..."
                  value={poSearch}
                  onChange={(e) => setPoSearch(e.target.value)}
                />
              </div>
              {eligiblePos.length > 0 && (
                <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-48 overflow-y-auto divide-y divide-slate-100">
                  {eligiblePos.map((po) => (
                    <button
                      key={po.id}
                      type="button"
                      className="w-full p-2.5 text-left hover:bg-slate-50 text-xs text-slate-800 flex flex-col gap-0.5 transition-colors cursor-pointer"
                      onClick={() => selectPo(po)}
                    >
                      <span className="font-bold font-mono text-slate-900">{po.po_number}</span>
                      <span className="text-slate-500">{po.vendor?.vendor_name ?? "—"}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {selectedPo && receiptItems && receiptItems.length > 0 && (
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">
              Barang yang Diterima dari PO Ini (opsional — klik untuk mengisi otomatis)
            </label>
            <div className="flex flex-col gap-1.5 max-h-40 overflow-y-auto p-1">
              {receiptItems.map((item) => (
                <button
                  key={item.goods_receipt_line_id}
                  type="button"
                  onClick={() => selectReceiptItem(item)}
                  className={`text-left p-2.5 rounded-xl border text-xs transition-colors cursor-pointer ${
                    selectedItemLineId === item.goods_receipt_line_id
                      ? "border-amber-500 bg-amber-50/60 ring-1 ring-amber-500"
                      : "border-slate-200 bg-slate-50/50 hover:bg-slate-50"
                  }`}
                >
                  <div className="font-semibold text-slate-900">{item.description ?? "—"}</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    {item.asset_number ? `Kode Barang: ${item.asset_number}` : "Belum ada Kode Barang"}
                    {item.warranty_expiry ? ` · Garansi s.d. ${item.warranty_expiry}` : ""}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">
              Deskripsi Barang / Unit *
            </label>
            <input
              type="text"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-amber-500 transition-all placeholder:text-slate-400"
              value={itemDescription}
              onChange={(e) => setItemDescription(e.target.value)}
              placeholder="mis. Laptop Dell Latitude 5420"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">
              Serial Number (SN#)
            </label>
            <input
              type="text"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-amber-500 transition-all placeholder:text-slate-400 font-mono"
              value={serialNumber}
              onChange={(e) => setSerialNumber(e.target.value)}
              placeholder="mis. SN-8829103"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">
              Jenis Tuntutan Garansi *
            </label>
            <select
              value={demandType}
              onChange={(e) => setDemandType(e.target.value as any)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-amber-500 transition-all font-medium"
            >
              <option value="repair">Perbaikan (Service Reparasi)</option>
              <option value="replacement">Penggantian Unit Baru</option>
              <option value="refund">Refund / Ganti Rugi Dana</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">
              Tanggal Klaim *
            </label>
            <input
              type="date"
              required
              value={claimDate}
              onChange={(e) => setClaimDate(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-amber-500 transition-all"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">
            Kerusakan / Masalah yang Diklaim *
          </label>
          <textarea
            rows={3}
            value={issueDescription}
            onChange={(e) => setIssueDescription(e.target.value)}
            placeholder="Jelaskan detail gejala kerusakan, riwayat timbulnya kendala, dan kondisi fisik saat ini..."
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-amber-500 transition-all resize-y"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">
              Tanggal Pembelian (dari BAST)
            </label>
            <input
              type="date"
              value={purchaseDate}
              onChange={(e) => setPurchaseDate(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-amber-500 transition-all"
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide">
                Garansi s.d. (dari BAST)
              </label>
              {warrantyExpiry && (
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    isWarrantyExpired
                      ? "bg-rose-100 text-rose-700"
                      : "bg-emerald-100 text-emerald-700"
                  }`}
                >
                  {isWarrantyExpired ? "Kedaluwarsa" : "Garansi Aktif"}
                </span>
              )}
            </div>
            <input
              type="date"
              value={warrantyExpiry}
              onChange={(e) => setWarrantyExpiry(e.target.value)}
              className={`w-full px-3 py-2 border rounded-xl text-xs focus:outline-none transition-all ${
                isWarrantyExpired
                  ? "bg-rose-50 border-rose-300 text-rose-800"
                  : "bg-slate-50 border-slate-200 text-slate-800 focus:bg-white focus:border-amber-500"
              }`}
            />
          </div>
        </div>

        {/* Upload Bukti Langsung di Form */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">
            Unggah Dokumen Bukti (Foto Kerusakan, Kartu Garansi, atau Invoice)
          </label>
          {proofFile ? (
            <div className="flex items-center justify-between p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-700 font-medium">
              <span className="flex items-center gap-1.5 truncate">
                <Paperclip size={14} /> {proofFile.name}
              </span>
              <button
                type="button"
                onClick={() => setProofFile(null)}
                className="text-rose-600 hover:text-rose-700 p-1 cursor-pointer"
              >
                <X size={15} />
              </button>
            </div>
          ) : (
            <label className="flex items-center gap-2 p-3 border border-dashed border-slate-300 rounded-xl cursor-pointer text-xs text-slate-500 hover:bg-slate-50 transition-all">
              <Upload size={15} className="text-slate-400" />
              <span>
                {uploadingProof
                  ? "Mengunggah bukti..."
                  : "Pilih file foto atau scan PDF kartu garansi"}
              </span>
              <input
                type="file"
                accept="image/*,.pdf"
                onChange={handleFileUpload}
                disabled={uploadingProof}
                className="hidden"
              />
            </label>
          )}
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

