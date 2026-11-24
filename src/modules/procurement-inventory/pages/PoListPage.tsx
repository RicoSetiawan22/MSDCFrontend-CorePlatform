import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  Pencil,
  X,
  PackageCheck,
  Mail,
  FileDown,
  ShoppingBag,
  Clock,
  CheckCircle2,
  XCircle,
  Coins,
  FilterX,
  Info,
} from "lucide-react";
import {
  usePoList,
  useSendPoEmail,
  useCancelPo,
  useSubmitPo,
} from "../api/usePo";
import { poApi } from "../api/poApi";
import { ReceiveGoodsModal } from "../components/grn/ReceiveGoodsModal";
import { apiClient } from "@shared/lib/api-client";
import { Pagination } from "@shared/components/Pagination";
import { PageHeader } from "@shared/components/PageHeader";
import { EmptyState } from "@shared/components/EmptyState";
import { LoadingState } from "@shared/components/LoadingState";
import { Button } from "@shared/components/Button";
import { Modal } from "@shared/components/Modal";
import { PdfPreviewModal } from "@shared/components/PdfPreviewModal";
import { ApprovalStepsList } from "@shared/components/ApprovalStepsList";
import { InputField } from "@shared/components/InputField";
import { formatCurrency, formatDate } from "@shared/lib/format";
import { extractErrorMessage } from "@shared/types/api";
import { useActiveOrgId } from "@shared/lib/organization-context";
import { useQuery } from "@tanstack/react-query";
import type {
  PurchaseOrder,
  PurchaseOrderLine,
  PoStatus,
  PoLineType,
} from "../types/po";

const STATUS_LABELS: Record<PoStatus, string> = {
  draft: "Draft",
  submitted: "Menunggu Approval",
  approved: "Disetujui",
  sent_to_vendor: "Menunggu Dikerjakan Vendor",
  partially_received: "Sebagian Diterima",
  completed: "Selesai Diterima",
  cancelled: "Dibatalkan",
  rejected: "Ditolak",
};

export function PoListPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<PoStatus | "">("");

  const { data, isLoading, refetch } = usePoList({
    page,
    per_page: 20,
    search: search || undefined,
    status: statusFilter || undefined,
  });

  const poList = data?.data ?? [];
  const totalPo = data?.total ?? 0;

  // KPI Calculations
  const completedCount = useMemo(
    () => poList.filter((p) => p.status === "completed").length,
    [poList]
  );
  const pendingCount = useMemo(
    () =>
      poList.filter((p) =>
        ["submitted", "approved", "sent_to_vendor", "partially_received"].includes(p.status)
      ).length,
    [poList]
  );
  const cancelledCount = useMemo(
    () => poList.filter((p) => p.status === "cancelled" || p.status === "rejected").length,
    [poList]
  );
  const totalAmount = useMemo(
    () => poList.reduce((acc, p) => acc + (Number(p.total_amount) || 0), 0),
    [poList]
  );

  const healthPercentage =
    totalPo > 0 ? Math.round((completedCount / (totalPo || 1)) * 100) : 100;

  const hasActiveFilters = Boolean(search) || Boolean(statusFilter);

  function resetFilters() {
    setSearch("");
    setStatusFilter("");
    setPage(1);
  }

  const cardAnimationClass =
    "transition-all duration-200 ease-in-out cursor-pointer hover:-translate-y-1 active:scale-95 active:translate-y-0 select-none";

  return (
    <div className="min-h-screen bg-[#F5F7FA] pb-16">
      {/* ── 1. PageHeader Banner (Navy Blue & Gold Diagonal) ── */}
      <PageHeader
        title="Purchase Order (PO)"
        subtitle="Riwayat lengkap Purchase Request → RFQ → PO — pantau proses pengerjaan rekanan hingga serah terima fisik di gudang."
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
                    Status Operasional Kontrak Purchase Order
                  </h2>
                  <span
                    className={`text-[11px] font-bold font-mono ${
                      healthPercentage < 50 ? "text-amber-600" : "text-emerald-700"
                    }`}
                  >
                    {healthPercentage}% Selesai Diterima
                  </span>
                </div>
                <div className="w-full bg-emerald-100/60 h-1.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      healthPercentage < 50 ? "bg-amber-500" : "bg-emerald-600"
                    }`}
                    style={{ width: `${healthPercentage}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-white px-4 py-2.5 rounded-xl border border-emerald-200/80 w-full sm:w-auto justify-between sm:justify-end shadow-xs shrink-0">
              <div className="flex items-center gap-2 text-slate-600 text-xs font-medium">
                <Coins size={15} className="text-amber-500" />
                <span>Total Nilai PO:</span>
              </div>
              <span className="text-xs font-bold text-slate-800 font-mono">
                {formatCurrency(totalAmount)}
              </span>
            </div>
          </div>

          {/* 4 Kartu Statistik Interaktif */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Total PO */}
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
                <ShoppingBag size={22} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide truncate">
                  Total PO Terbit
                </p>
                <h3 className="text-2xl font-bold text-slate-800 mt-0.5">
                  {totalPo}{" "}
                  <span className="text-xs font-normal text-slate-400">Order</span>
                </h3>
              </div>
            </button>

            {/* Card 2: Selesai Diterima */}
            <button
              type="button"
              onClick={() => {
                setStatusFilter(statusFilter === "completed" ? "" : "completed");
                setPage(1);
              }}
              className={`w-full text-left p-5 rounded-xl border bg-white shadow-sm flex items-center gap-4 focus:outline-none ${cardAnimationClass} ${
                statusFilter === "completed"
                  ? "border-emerald-500 ring-2 ring-emerald-500/20 shadow-md"
                  : "border-slate-200/80 hover:border-emerald-300 hover:shadow-md"
              }`}
            >
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl shrink-0">
                <CheckCircle2 size={22} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide truncate">
                  Selesai Diterima
                </p>
                <h3 className="text-2xl font-bold text-slate-800 mt-0.5">
                  {completedCount}{" "}
                  <span className="text-xs font-normal text-slate-400">Tuntas</span>
                </h3>
              </div>
            </button>

            {/* Card 3: Dalam Proses / Vendor */}
            <button
              type="button"
              onClick={() => {
                setStatusFilter(statusFilter === "sent_to_vendor" ? "" : "sent_to_vendor");
                setPage(1);
              }}
              className={`w-full text-left p-5 rounded-xl border bg-white shadow-sm flex items-center gap-4 focus:outline-none ${cardAnimationClass} ${
                statusFilter === "sent_to_vendor" || statusFilter === "submitted" || statusFilter === "approved"
                  ? "border-amber-500 ring-2 ring-amber-500/20 shadow-md"
                  : "border-slate-200/80 hover:border-amber-300 hover:shadow-md"
              }`}
            >
              <div className="p-3 bg-amber-50 text-amber-600 rounded-xl shrink-0">
                <Clock size={22} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide truncate">
                  Dalam Proses / Vendor
                </p>
                <h3 className="text-2xl font-bold text-slate-800 mt-0.5">
                  {pendingCount}{" "}
                  <span className="text-xs font-normal text-slate-400">Proses</span>
                </h3>
              </div>
            </button>

            {/* Card 4: Dibatalkan / Ditolak */}
            <button
              type="button"
              onClick={() => {
                setStatusFilter(statusFilter === "cancelled" ? "" : "cancelled");
                setPage(1);
              }}
              className={`w-full text-left p-5 rounded-xl border bg-white shadow-sm flex items-center gap-4 focus:outline-none ${cardAnimationClass} ${
                statusFilter === "cancelled" || statusFilter === "rejected"
                  ? "border-rose-500 ring-2 ring-rose-500/20 shadow-md"
                  : "border-slate-200/80 hover:border-rose-300 hover:shadow-md"
              }`}
            >
              <div className="p-3 bg-rose-50 text-rose-600 rounded-xl shrink-0">
                <XCircle size={22} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide truncate">
                  Batal / Ditolak
                </p>
                <h3 className="text-2xl font-bold text-slate-800 mt-0.5">
                  {cancelledCount}{" "}
                  <span className="text-xs font-normal text-slate-400">Batal</span>
                </h3>
              </div>
            </button>
          </div>
        </div>

        {/* ── Main Data Card: Toolbar & PO Table ── */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm flex flex-col gap-5">
          {/* Info Box Alur RFQ */}
          <div className="bg-slate-50/80 p-3.5 rounded-xl border border-slate-200/70 flex items-start gap-2.5 text-xs text-slate-600 leading-relaxed">
            <Info size={16} className="text-amber-500 shrink-0 mt-0.5" />
            <span>
              Dokumen <strong>Purchase Order (PO)</strong> terbit otomatis dari modul{" "}
              <Link to="/procurement-inventory/vendor-quotations" className="text-amber-600 font-semibold hover:underline">
                RFQ / Vendor Quotation
              </Link>{" "}
              setelah proses komparasi penawaran harga selesai dan vendor pemenang disetujui.
            </span>
          </div>

          {/* Toolbar Filters */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3 flex-1">
              {/* Search Box */}
              <div className="relative flex-1 min-w-[240px]">
                <Search
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="text"
                  placeholder="Cari No. PO, vendor, atau No. PR..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  className="w-full pl-9 pr-9 py-2 bg-slate-50 border border-slate-200/90 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all placeholder:text-slate-400"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearch("");
                      setPage(1);
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* Status Select Filter */}
              <select
                className="px-3.5 py-2 bg-slate-50 border border-slate-200/90 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all font-medium"
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value as PoStatus | "");
                  setPage(1);
                }}
              >
                <option value="">Semua Status PO</option>
                {Object.entries(STATUS_LABELS).map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </select>

              {/* Reset Filters */}
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="px-3 py-2 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition-all font-medium flex items-center gap-1"
                >
                  <FilterX size={14} />
                  <span>Reset Filter</span>
                </button>
              )}
            </div>
          </div>

          {/* Table Content */}
          {isLoading && <LoadingState />}

          {!isLoading && data && data.data.length === 0 && (
            <EmptyState
              title="Belum Ada Purchase Order"
              subtitle={
                hasActiveFilters
                  ? "Tidak ada Purchase Order yang cocok dengan kriteria filter."
                  : "PO terbit otomatis dari halaman RFQ / Vendor Quotation setelah vendor pemenang disetujui."
              }
            />
          )}

          {!isLoading && data && data.data.length > 0 && (
            <>
              <div className="border border-slate-200/90 rounded-xl overflow-hidden mt-1 shadow-2xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-slate-600">
                    <thead className="bg-slate-50/80 text-slate-500 uppercase text-[11px] font-semibold tracking-wider border-b border-slate-200/90">
                      <tr>
                        <th className="py-3 px-4">No. PO</th>
                        <th className="py-3 px-4">Asal PR (RFQ)</th>
                        <th className="py-3 px-4">Vendor Rekanan</th>
                        <th className="py-3 px-4">Tanggal Order</th>
                        <th className="py-3 px-4">Est. Delivery</th>
                        <th className="py-3 px-4 text-right">Total Nilai</th>
                        <th className="py-3 px-4">Status PO</th>
                        <th className="py-3 px-4 text-center">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {data.data.map((po) => (
                        <PoRow key={po.id} po={po} onRefresh={() => refetch()} />
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Pagination */}
              <div className="pt-2">
                <Pagination
                  currentPage={data.current_page}
                  lastPage={data.last_page}
                  total={data.total}
                  onPageChange={setPage}
                />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function PoRow({
  po,
  onRefresh,
}: {
  po: PurchaseOrder;
  onRefresh: () => void;
}) {
  const orgId = useActiveOrgId();
  const submitMutation = useSubmitPo(po.id);
  const cancelMutation = useCancelPo(po.id);
  const [showEdit, setShowEdit] = useState(false);
  const [showReceive, setShowReceive] = useState(false);
  const [showSend, setShowSend] = useState(false);
  const [showCancel, setShowCancel] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [previewBlob, setPreviewBlob] = useState<Blob | null>(null);

  async function handleSubmit() {
    if (!confirm(`Ajukan PO ${po.po_number} untuk approval?`)) return;
    try {
      await submitMutation.mutateAsync();
      onRefresh();
    } catch (err) {
      alert(extractErrorMessage(err));
    }
  }

  async function handlePreviewPdf() {
    if (!orgId) return;
    setDownloadingPdf(true);
    try {
      const res = await poApi.downloadPdf(po.id, orgId);
      setPreviewBlob(res.data);
    } catch (err) {
      alert(extractErrorMessage(err));
    } finally {
      setDownloadingPdf(false);
    }
  }

  const cancelReason =
    po.notes?.includes("[Pembatalan]")
      ? po.notes
      : typeof window !== "undefined"
        ? localStorage.getItem(`po_cancel_reason_${po.id}`)
        : null;

  return (
    <>
      <tr className="hover:bg-slate-50/60 transition-colors">
        <td className="py-3 px-4 font-mono text-xs font-bold text-amber-600">
          {po.po_number}
        </td>
        <td className="py-3 px-4 text-xs font-mono">
          {po.purchase_request ? (
            <Link
              to={`/procurement-inventory/vendor-quotations?pr=${po.purchase_request.id}`}
              className="text-amber-600 hover:underline"
            >
              {po.purchase_request.pr_number}
            </Link>
          ) : (
            "—"
          )}
        </td>
        <td className="py-3 px-4 text-xs font-semibold text-slate-800">
          {po.vendor?.vendor_name ?? "—"}
        </td>
        <td className="py-3 px-4 text-xs">{formatDate(po.order_date)}</td>
        <td className="py-3 px-4 text-xs">
          {po.expected_delivery_date
            ? formatDate(po.expected_delivery_date)
            : "—"}
        </td>
        <td className="py-3 px-4 font-mono text-xs font-semibold text-slate-800">
          {formatCurrency(Number(po.total_amount))}
        </td>
        <td className="py-3 px-4">
          <span
            className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
              po.status === "completed"
                ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                : po.status === "cancelled" || po.status === "rejected"
                  ? "bg-rose-50 text-rose-600 border-rose-200"
                  : po.status === "approved" || po.status === "sent_to_vendor"
                    ? "bg-blue-50 text-blue-600 border-blue-200"
                    : "bg-amber-50 text-amber-600 border-amber-200"
            }`}
          >
            {STATUS_LABELS[po.status]}
          </span>
          {po.status === "cancelled" && (
            <div className="mt-1 text-[11px] text-rose-700 bg-rose-50/80 px-2 py-0.5 rounded border border-rose-200/60 max-w-[200px] truncate" title={cancelReason || "Dibatalkan oleh pemohon"}>
              Alasan: {cancelReason || "Dibatalkan oleh pemohon"}
            </div>
          )}
          {po.status === "submitted" && (
            <div className="mt-1">
              <ApprovalStepsList
                workflowInstanceId={po.workflow_instance_id}
              />
            </div>
          )}
        </td>
        <td className="py-3 px-4">
          <div className="flex items-center justify-center gap-1.5 flex-wrap">
            {po.status === "draft" && (
              <button
                className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-medium cursor-pointer shadow-xs transition-all"
                disabled={submitMutation.isPending}
                onClick={handleSubmit}
              >
                {submitMutation.isPending
                  ? "Mengajukan..."
                  : "Ajukan Approval"}
              </button>
            )}
            {po.status === "approved" && (
              <button
                className="px-2.5 py-1 bg-slate-100 hover:bg-amber-50 text-amber-700 border border-slate-200 rounded-lg text-xs font-medium flex items-center gap-1 cursor-pointer transition-all"
                onClick={() => setShowSend(true)}
              >
                <Mail size={12} /> Kirim ke Vendor
              </button>
            )}
            {po.status !== "draft" && (
              <button
                className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg cursor-pointer transition-all"
                disabled={downloadingPdf}
                onClick={handlePreviewPdf}
                title="Pratinjau PDF PO"
              >
                <FileDown size={14} />
              </button>
            )}
            {(po.status === "sent_to_vendor" ||
              po.status === "partially_received") && (
              <button
                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer transition-all shadow-xs"
                onClick={() => setShowReceive(true)}
              >
                <PackageCheck size={13} /> Terima Barang
              </button>
            )}
            {po.status === "draft" && (
              <button
                className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg cursor-pointer transition-all"
                onClick={() => setShowEdit(true)}
                title="Edit PO"
              >
                <Pencil size={14} />
              </button>
            )}
            {po.status === "draft" && (
              <button
                className="px-2 py-1 text-xs text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer transition-all"
                disabled={cancelMutation.isPending}
                onClick={() => setShowCancel(true)}
              >
                Batal
              </button>
            )}
          </div>
        </td>
      </tr>
      {showEdit && (
        <EditPoModal
          po={po}
          onClose={() => setShowEdit(false)}
          onSaved={onRefresh}
        />
      )}
      {showReceive && (
        <ReceiveGoodsModal
          po={po}
          onClose={() => setShowReceive(false)}
          onSaved={onRefresh}
        />
      )}
      {showSend && (
        <SendToVendorModal
          po={po}
          onClose={() => setShowSend(false)}
          onSaved={onRefresh}
        />
      )}
      {previewBlob && (
        <PdfPreviewModal
          title={`Purchase Order — ${po.po_number}`}
          blob={previewBlob}
          filename={`PO_${po.po_number}.pdf`}
          onClose={() => setPreviewBlob(null)}
        />
      )}
      {showCancel && (
        <CancelPoModal
          po={po}
          onClose={() => setShowCancel(false)}
          onSaved={() => {
            setShowCancel(false);
            onRefresh();
          }}
        />
      )}
    </>
  );
}

function CancelPoModal({
  po,
  onClose,
  onSaved,
}: {
  po: PurchaseOrder;
  onClose: () => void;
  onSaved: () => void;
}) {
  const cancelMutation = useCancelPo(po.id);
  const [reasonCategory, setReasonCategory] = useState("Spesifikasi barang/jasa tidak sesuai");
  const [reasonDetails, setReasonDetails] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!reasonDetails.trim() || reasonDetails.trim().length < 5) {
      setError("Alasan pembatalan PO wajib diisi minimal 5 karakter untuk audit internal.");
      return;
    }
    setError(null);
    setIsSubmitting(true);
    const fullReason = `[${reasonCategory}] ${reasonDetails.trim()}`;
    try {
      if (typeof window !== "undefined") {
        localStorage.setItem(`po_cancel_reason_${po.id}`, fullReason);
      }
      await cancelMutation.mutateAsync();
      onSaved();
      onClose();
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Modal title={`Batalkan Purchase Order — ${po.po_number}`} onClose={onClose} maxWidth={540}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3 py-1">
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 leading-relaxed">
          ⚠️ <strong>Peringatan Audit:</strong> Pembatalan PO bersifat permanen. Sesuai SOP procurement, setiap pembatalan PO wajib menyertakan justifikasi tertulis.
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Kategori Alasan Pembatalan <span className="text-red-500">*</span>
          </label>
          <select
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-rose-500 cursor-pointer"
            value={reasonCategory}
            onChange={(e) => setReasonCategory(e.target.value)}
          >
            <option value="Spesifikasi barang/jasa tidak sesuai">Spesifikasi barang/jasa tidak sesuai kebutuhan</option>
            <option value="Vendor tidak sanggup penuhi lead time">Vendor tidak sanggup memenuhi lead time / SLA</option>
            <option value="Perubahan harga sepihak">Perubahan harga sepihak oleh vendor</option>
            <option value="PR ditarik oleh pemohon">PR ditarik / dibatalkan oleh unit kerja pemohon</option>
            <option value="Duplikasi pembuatan dokumen">Duplikasi pembuatan dokumen PO</option>
            <option value="Lainnya">Lainnya</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Keterangan Rinci Alasan Pembatalan <span className="text-red-500">*</span>
          </label>
          <textarea
            rows={3}
            required
            className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-rose-500 resize-none"
            placeholder="Jelaskan alasan dan latar belakang pembatalan PO secara rinci..."
            value={reasonDetails}
            onChange={(e) => setReasonDetails(e.target.value)}
          />
        </div>

        {error && (
          <div className="p-2.5 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs">
            {error}
          </div>
        )}

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs hover:bg-slate-50 cursor-pointer"
          >
            Kembali
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold disabled:opacity-50 cursor-pointer"
          >
            {isSubmitting ? "Membatalkan..." : "Konfirmasi Pembatalan PO"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function SendToVendorModal({
  po,
  onClose,
  onSaved,
}: {
  po: PurchaseOrder;
  onClose: () => void;
  onSaved: () => void;
}) {
  const orgId = useActiveOrgId();
  const sendMutation = useSendPoEmail(po.id);

  const { data: fullPo, isLoading: loadingPo } = useQuery({
    queryKey: ["po-detail-for-send", po.id],
    queryFn: () =>
      apiClient
        .get<{
          data: PurchaseOrder;
        }>(`/v1/procurement-inventory/purchase-orders/${po.id}`)
        .then((r) => r.data.data),
  });

  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState(`Purchase Order ${po.po_number}`);
  const [message, setMessage] = useState(
    `Terlampir Purchase Order ${po.po_number} untuk diproses. Mohon konfirmasi penerimaan.`
  );
  const [error, setError] = useState<string | null>(null);
  const [prefilled, setPrefilled] = useState(false);

  if (fullPo && !prefilled) {
    const primaryContact =
      fullPo.vendor?.contacts?.find((c) => c.is_primary && c.email) ??
      fullPo.vendor?.contacts?.find((c) => c.email);
    if (primaryContact?.email) setEmail(primaryContact.email);
    setPrefilled(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!orgId) {
      setError("Organisasi aktif tidak ditemukan.");
      return;
    }
    if (!email.trim()) {
      setError("Email vendor wajib diisi.");
      return;
    }
    try {
      const result = await sendMutation.mutateAsync({
        organization_id: orgId,
        email: email.trim(),
        subject,
        message,
      });
      alert(
        (result as { message?: string }).message ??
          "Purchase Order berhasil dikirim ke vendor."
      );
      onSaved();
      onClose();
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  }

  return (
    <Modal
      title={`Kirim PO ke Vendor — ${po.po_number}`}
      onClose={onClose}
      maxWidth={520}
    >
      {loadingPo && <LoadingState />}
      {!loadingPo && (
        <form onSubmit={handleSubmit} className="flex flex-col gap-3 py-1">
          <div className="p-3 bg-amber-50 border border-amber-200/80 rounded-xl text-xs text-amber-800 leading-relaxed">
            PDF Purchase Order akan digenerate otomatis dan dilampirkan ke email
            ini. Status PO akan berubah menjadi{" "}
            <strong>"Menunggu Dikerjakan Vendor"</strong> setelah terkirim.
          </div>
          <InputField
            label="Email Vendor *"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="pic@vendor.com"
          />
          <InputField
            label="Subjek"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
          />
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Pesan
            </label>
            <textarea
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:bg-white focus:outline-none focus:border-amber-500 transition-all"
              rows={3}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 font-medium text-xs rounded-xl"
            >
              Batal
            </Button>
            <Button
              type="submit"
              disabled={sendMutation.isPending}
              className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-white font-medium text-xs rounded-xl shadow-xs"
            >
              {sendMutation.isPending ? "Mengirim..." : "Kirim ke Vendor"}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}



interface PoLineForm {
  id?: number;
  item_id: number | null;
  line_type: PoLineType;
  description: string;
  quantity: number;
  uom: string;
  unit_price: number;
  discount_pct: number;
  is_dc_asset: boolean;
}

function EditPoModal({
  po,
  onClose,
  onSaved,
}: {
  po: PurchaseOrder;
  onClose: () => void;
  onSaved: () => void;
}) {
  const orgId = useActiveOrgId();
  const [form, setForm] = useState({
    vendor_id: po.vendor_id ?? "",
    order_date: po.order_date ?? "",
    expected_delivery_date: po.expected_delivery_date ?? "",
    tax_amount: po.tax_amount ?? "0",
    notes: po.notes ?? "",
  });
  const [lines, setLines] = useState<PoLineForm[]>(
    (po.lines ?? []).map((l: PurchaseOrderLine) => ({
      id: l.id,
      item_id: l.item_id as number | null,
      line_type: l.line_type ?? "goods",
      description: l.description,
      quantity: l.quantity,
      uom: l.uom,
      unit_price: Number(l.unit_price ?? 0),
      discount_pct: Number(l.discount_pct ?? 0),
      is_dc_asset: l.is_dc_asset ?? false,
    }))
  );
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const { data: vendors } = useQuery({
    queryKey: ["vendors", orgId],
    queryFn: () =>
      apiClient
        .get<any>("/v1/procurement-inventory/vendors", {
          params: { organization_id: orgId },
        })
        .then((r) => r.data?.data ?? []),
  });

  function addLine() {
    setLines((prev) => [
      ...prev,
      {
        item_id: null,
        line_type: "goods",
        description: "",
        quantity: 1,
        uom: "pcs",
        unit_price: 0,
        discount_pct: 0,
        is_dc_asset: false,
      },
    ]);
  }

  function removeLine(idx: number) {
    setLines((prev) => prev.filter((_, i) => i !== idx));
  }

  function updateLine(idx: number, field: keyof PoLineForm, value: unknown) {
    setLines((prev) =>
      prev.map((l, i) => {
        if (i !== idx) return l;
        const u = { ...l, [field]: value };
        if (field === "line_type" && value === "service") u.item_id = null;
        return u;
      })
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!form.vendor_id) {
      setError("Vendor wajib dipilih.");
      return;
    }
    const validLines = lines.filter(
      (l) => l.description.trim() && l.quantity > 0
    );
    if (validLines.length === 0) {
      setError("Minimal 1 baris barang/jasa.");
      return;
    }
    setIsSaving(true);
    try {
      await apiClient.put(
        `/v1/procurement-inventory/purchase-orders/${po.id}`,
        {
          vendor_id: Number(form.vendor_id) || undefined,
          order_date: form.order_date || undefined,
          expected_delivery_date: form.expected_delivery_date || undefined,
          tax_amount: form.tax_amount ? Number(form.tax_amount) : undefined,
          notes: form.notes || undefined,
        }
      );
      await apiClient.put(
        `/v1/procurement-inventory/purchase-orders/${po.id}/lines`,
        {
          lines: validLines.map((l) => ({
            item_id:
              l.line_type === "service" ? undefined : (l.item_id ?? undefined),
            line_type: l.line_type,
            description: l.description.trim(),
            quantity: l.quantity,
            uom: l.uom,
            unit_price: l.unit_price,
            discount_pct: l.discount_pct,
            is_dc_asset: l.is_dc_asset,
          })),
        }
      );
      onSaved();
      onClose();
    } catch (err: any) {
      setError(extractErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Modal
      title={`Edit PO — ${po.po_number}`}
      onClose={onClose}
      maxWidth={800}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 py-1">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Vendor *
            </label>
            <select
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:bg-white focus:outline-none focus:border-amber-500 transition-all"
              value={form.vendor_id}
              onChange={(e) =>
                setForm((f) => ({ ...f, vendor_id: e.target.value }))
              }
            >
              <option value="">— Pilih Vendor —</option>
              {vendors?.map((v: any) => (
                <option key={v.id} value={v.id}>
                  {v.vendor_name}
                </option>
              ))}
            </select>
          </div>
          <InputField
            label="Tanggal PO"
            type="date"
            value={form.order_date}
            onChange={(e) =>
              setForm((f) => ({ ...f, order_date: e.target.value }))
            }
          />
          <InputField
            label="Est. Pengiriman"
            type="date"
            value={form.expected_delivery_date}
            onChange={(e) =>
              setForm((f) => ({ ...f, expected_delivery_date: e.target.value }))
            }
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <InputField
            label="PPN (Rp)"
            type="number"
            min={0}
            value={form.tax_amount}
            onChange={(e) =>
              setForm((f) => ({ ...f, tax_amount: e.target.value }))
            }
          />
          <InputField
            label="Catatan"
            value={form.notes}
            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
          />
        </div>

        <div className="border-t border-slate-100 pt-2 flex flex-col gap-3">
          <div className="flex justify-between items-center">
            <label className="text-xs font-semibold text-slate-700">
              Barang / Jasa *
            </label>
            <button
              type="button"
              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-lg transition-all"
              onClick={addLine}
            >
              + Tambah Baris
            </button>
          </div>

          <div className="flex flex-col gap-2 max-h-56 overflow-y-auto pr-1">
            {lines.map((line, idx) => (
              <div
                key={idx}
                className="flex flex-wrap sm:flex-nowrap items-center gap-2 p-2 border border-slate-200 rounded-xl text-xs bg-slate-50/30"
              >
                <select
                  className="px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                  value={line.line_type}
                  onChange={(e) =>
                    updateLine(idx, "line_type", e.target.value)
                  }
                >
                  <option value="goods">Barang</option>
                  <option value="service">Jasa</option>
                </select>
                <input
                  className="flex-1 px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs min-w-[120px]"
                  placeholder="Deskripsi..."
                  value={line.description}
                  onChange={(e) =>
                    updateLine(idx, "description", e.target.value)
                  }
                />
                <input
                  type="number"
                  className="w-16 px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                  placeholder="Qty"
                  value={line.quantity}
                  onChange={(e) =>
                    updateLine(idx, "quantity", Number(e.target.value))
                  }
                />
                <input
                  className="w-14 px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                  placeholder="Satuan"
                  value={line.uom}
                  onChange={(e) => updateLine(idx, "uom", e.target.value)}
                />
                <input
                  type="number"
                  className="w-24 px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                  placeholder="Harga"
                  value={line.unit_price}
                  onChange={(e) =>
                    updateLine(idx, "unit_price", Number(e.target.value))
                  }
                />
                <button
                  type="button"
                  onClick={() => removeLine(idx)}
                  disabled={lines.length <= 1}
                  className="text-rose-500 hover:text-rose-700 disabled:text-slate-300 cursor-pointer p-1"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs">
            {error}
          </div>
        )}

        <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 font-medium text-xs rounded-xl"
          >
            Batal
          </Button>
          <Button
            type="submit"
            disabled={isSaving}
            className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-white font-medium text-xs rounded-xl shadow-xs"
          >
            {isSaving ? "Menyimpan..." : "Simpan Perubahan"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}