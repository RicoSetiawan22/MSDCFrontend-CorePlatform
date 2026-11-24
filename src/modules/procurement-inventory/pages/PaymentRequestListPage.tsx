import { useState, useMemo, useEffect, type FormEvent } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Search,
  Plus,
  X,
  FileDown,
  CheckCircle2,
  Clock,
  CreditCard,
  FilterX,
  Building2,
  FileText,
  Coins,
} from "lucide-react";
import {
  usePaymentRequestList,
  useCreatePaymentRequest,
  useSubmitPaymentRequest,
  useCancelPaymentRequest,
} from "../api/usePaymentRequest";
import { paymentRequestApi } from "../api/paymentRequestApi";
import { usePoList } from "../api/usePo";
import { ProcurementFormModal } from "../components/ProcurementFormModal";
import { PdfPreviewModal } from "@shared/components/PdfPreviewModal";
import { ApprovalStepsList } from "@shared/components/ApprovalStepsList";
import { Pagination } from "@shared/components/Pagination";
import { PageHeader } from "@shared/components/PageHeader";
import { EmptyState } from "@shared/components/EmptyState";
import { LoadingState } from "@shared/components/LoadingState";
import { CurrencyInput } from "@shared/components/CurrencyInput";
import { extractErrorMessage } from "@shared/types/api";
import { useActiveOrgId } from "@shared/lib/organization-context";
import { useAuth } from "@shared/lib/auth-context";
import { formatCurrency } from "@shared/lib/format";
import type {
  PaymentRequest,
  PaymentRequestStatus,
  PaymentRequestType,
} from "../types/paymentRequest";
import type { PurchaseOrder } from "../types/po";

const STATUS_LABELS: Record<PaymentRequestStatus, string> = {
  draft: "Draft",
  submitted: "Menunggu Approval",
  approved: "Disetujui",
  rejected: "Ditolak",
  posted: "Uang Muka Terposting",
  cancelled: "Dibatalkan",
};

const STATUS_BADGE_CLASSES: Record<PaymentRequestStatus, string> = {
  draft: "bg-slate-100 text-slate-700 border-slate-200",
  submitted: "bg-amber-50 text-amber-700 border-amber-200/80",
  approved: "bg-emerald-50 text-emerald-700 border-emerald-200/80",
  rejected: "bg-rose-50 text-rose-700 border-rose-200/80",
  posted: "bg-blue-50 text-blue-700 border-blue-200/80",
  cancelled: "bg-slate-100 text-slate-600 border-slate-200",
};

const PAYMENT_TYPE_LABELS: Record<PaymentRequestType, string> = {
  dp: "DP (Uang Muka)",
  pelunasan: "Pelunasan",
  full: "Full (Lunas Sekaligus)",
};

const PO_STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  submitted: "Menunggu Approval",
  approved: "Disetujui",
  sent_to_vendor: "Menunggu Vendor",
  partially_received: "Sebagian Diterima",
  completed: "Selesai",
  cancelled: "Dibatalkan",
  rejected: "Ditolak",
};

export function PaymentRequestListPage() {
  const { hasPermission } = useAuth();
  const canManage = hasPermission("payment-request.manage");
  const [searchParams] = useSearchParams();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<PaymentRequestStatus | "">("");
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (searchParams.get("action") === "create" || searchParams.get("create") === "true") {
      setShowModal(true);
    }
  }, [searchParams]);

  const { data, isLoading } = usePaymentRequestList({
    page,
    per_page: 20,
    status: statusFilter || undefined,
  });

  const prList = data?.data ?? [];
  const totalPr = data?.total ?? 0;

  // KPI Calculations
  const approvedCount = useMemo(
    () => prList.filter((p) => p.status === "approved" || p.status === "posted").length,
    [prList]
  );
  const submittedCount = useMemo(
    () => prList.filter((p) => p.status === "submitted").length,
    [prList]
  );
  const draftCount = useMemo(
    () => prList.filter((p) => p.status === "draft").length,
    [prList]
  );

  const totalDisbursed = useMemo(
    () => prList.reduce((acc, p) => acc + (Number(p.net_amount) || 0), 0),
    [prList]
  );

  const healthPercentage =
    totalPr > 0 ? Math.round((approvedCount / (totalPr || 1)) * 100) : 100;

  // Client-side search
  const filteredPrList = useMemo(() => {
    if (!search) return prList;
    const q = search.toLowerCase();
    return prList.filter((p) => {
      const matchFpp = p.payment_request_number?.toLowerCase().includes(q);
      const matchPo = p.purchase_order?.po_number?.toLowerCase().includes(q);
      const matchVendor = p.purchase_order?.vendor?.vendor_name?.toLowerCase().includes(q);
      return matchFpp || matchPo || matchVendor;
    });
  }, [prList, search]);

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
        title="Payment Request (FPP)"
        subtitle="Permintaan pembayaran DP / Pelunasan vendor untuk PO yang disetujui — integrasi persetujuan & pencatatan keuangan."
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
                    Status Approval & Realisasi Pembayaran FPP
                  </h2>
                  <span
                    className={`text-[11px] font-bold font-mono ${
                      healthPercentage < 50 ? "text-amber-600" : "text-emerald-700"
                    }`}
                  >
                    {healthPercentage}% Disetujui / Terposting
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
                <span>Total Nilai Permintaan:</span>
              </div>
              <span className="text-xs font-bold text-slate-800 font-mono">
                {formatCurrency(totalDisbursed)}
              </span>
            </div>
          </div>

          {/* 4 Kartu Statistik Interaktif */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Total FPP */}
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
                <CreditCard size={22} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide truncate">
                  Total Payment Request
                </p>
                <h3 className="text-2xl font-bold text-slate-800 mt-0.5">
                  {totalPr}{" "}
                  <span className="text-xs font-normal text-slate-400">Berkas</span>
                </h3>
              </div>
            </button>

            {/* Card 2: Disetujui / Posted */}
            <button
              type="button"
              onClick={() => {
                setStatusFilter(statusFilter === "approved" ? "" : "approved");
                setPage(1);
              }}
              className={`w-full text-left p-5 rounded-xl border bg-white shadow-sm flex items-center gap-4 focus:outline-none ${cardAnimationClass} ${
                statusFilter === "approved" || statusFilter === "posted"
                  ? "border-emerald-500 ring-2 ring-emerald-500/20 shadow-md"
                  : "border-slate-200/80 hover:border-emerald-300 hover:shadow-md"
              }`}
            >
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl shrink-0">
                <CheckCircle2 size={22} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide truncate">
                  Disetujui / Posted
                </p>
                <h3 className="text-2xl font-bold text-slate-800 mt-0.5">
                  {approvedCount}{" "}
                  <span className="text-xs font-normal text-slate-400">Selesai</span>
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
                <h3 className="text-2xl font-bold text-slate-800 mt-0.5">
                  {submittedCount}{" "}
                  <span className="text-xs font-normal text-slate-400">Menunggu</span>
                </h3>
              </div>
            </button>

            {/* Card 4: Draft / Batal */}
            <button
              type="button"
              onClick={() => {
                setStatusFilter(statusFilter === "draft" ? "" : "draft");
                setPage(1);
              }}
              className={`w-full text-left p-5 rounded-xl border bg-white shadow-sm flex items-center gap-4 focus:outline-none ${cardAnimationClass} ${
                statusFilter === "draft"
                  ? "border-purple-500 ring-2 ring-purple-500/20 shadow-md"
                  : "border-slate-200/80 hover:border-purple-300 hover:shadow-md"
              }`}
            >
              <div className="p-3 bg-purple-50 text-purple-600 rounded-xl shrink-0">
                <FileText size={22} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide truncate">
                  Draft Belum Ajukan
                </p>
                <h3 className="text-2xl font-bold text-slate-800 mt-0.5">
                  {draftCount}{" "}
                  <span className="text-xs font-normal text-slate-400">Draft</span>
                </h3>
              </div>
            </button>
          </div>
        </div>

        {/* ── Main Data Card: Toolbar & Payment Request Table ── */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm flex flex-col gap-5">
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
                  placeholder="Cari No. FPP, No. PO, atau Vendor..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-9 py-2 bg-slate-50 border border-slate-200/90 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all placeholder:text-slate-400"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch("")}
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
                  setStatusFilter(e.target.value as PaymentRequestStatus | "");
                  setPage(1);
                }}
              >
                <option value="">Semua Status FPP</option>
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

            {/* Amber Action Button: + FPP Baru */}
            {canManage && (
              <button
                type="button"
                onClick={() => setShowModal(true)}
                className="bg-amber-500 hover:bg-amber-600 active:scale-95 text-white font-medium px-4 py-2 rounded-xl text-sm transition-all shadow-xs flex items-center gap-2 shrink-0 self-start sm:self-auto"
              >
                <Plus size={16} />
                <span>FPP Baru</span>
              </button>
            )}
          </div>

          {/* Table Content */}
          {isLoading && <LoadingState />}

          {!isLoading && filteredPrList.length === 0 && (
            <EmptyState
              title="Belum Ada Payment Request"
              subtitle={
                hasActiveFilters
                  ? "Tidak ada Payment Request yang sesuai dengan kriteria filter."
                  : "FPP yang diajukan untuk PO yang disetujui akan tampil di sini untuk proses pembayaran."
              }
            />
          )}

          {!isLoading && filteredPrList.length > 0 && (
            <>
              <div className="border border-slate-200/90 rounded-xl overflow-hidden mt-1 shadow-2xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50/80 border-b border-slate-200/90 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      <tr>
                        <th className="px-4 py-3">No. FPP</th>
                        <th className="px-4 py-3">No. PO Terkait</th>
                        <th className="px-4 py-3">Vendor Rekanan</th>
                        <th className="px-4 py-3">Jenis Pembayaran</th>
                        <th className="px-4 py-3 text-right">Jumlah Bersih</th>
                        <th className="px-4 py-3">Status FPP</th>
                        <th className="px-4 py-3 text-center">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {filteredPrList.map((pr) => (
                        <PaymentRequestRow
                          key={pr.id}
                          pr={pr}
                          onRefresh={() => setPage(1)}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Pagination */}
              <div className="pt-2">
                <Pagination
                  currentPage={data?.current_page ?? 1}
                  lastPage={data?.last_page ?? 1}
                  total={data?.total ?? 0}
                  onPageChange={setPage}
                />
              </div>
            </>
          )}
        </div>
      </div>

      {showModal && (
        <PaymentRequestFormModal onClose={() => setShowModal(false)} />
      )}
    </div>
  );
}

function PaymentRequestRow({
  pr,
  onRefresh,
}: {
  pr: PaymentRequest;
  onRefresh: () => void;
}) {
  const { hasPermission } = useAuth();
  const canManage = hasPermission("payment-request.manage");
  const orgId = useActiveOrgId();
  const submitMutation = useSubmitPaymentRequest(pr.id);
  const cancelMutation = useCancelPaymentRequest(pr.id);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [previewBlob, setPreviewBlob] = useState<Blob | null>(null);

  async function handleSubmit() {
    if (!confirm(`Submit FPP ${pr.payment_request_number} untuk approval?`))
      return;
    try {
      await submitMutation.mutateAsync();
      onRefresh();
    } catch (err) {
      alert(extractErrorMessage(err));
    }
  }

  async function handleCancel() {
    if (!confirm(`Batalkan FPP ${pr.payment_request_number}?`)) return;
    try {
      await cancelMutation.mutateAsync();
      onRefresh();
    } catch (err) {
      alert(extractErrorMessage(err));
    }
  }

  async function handlePreviewPdf() {
    if (!orgId) return;
    setDownloadingPdf(true);
    try {
      const res = await paymentRequestApi.downloadPdf(pr.id, orgId);
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
        <td className="px-4 py-3 whitespace-nowrap font-mono text-xs font-bold text-amber-600">
          {pr.payment_request_number}
        </td>
        <td className="px-4 py-3 whitespace-nowrap font-mono text-xs text-slate-600">
          {pr.purchase_order?.po_number ?? "—"}
        </td>
        <td className="px-4 py-3 whitespace-nowrap text-xs text-slate-800">
          <div className="flex items-center gap-1.5 font-medium">
            <Building2 size={13} className="text-slate-400" />
            <span>{pr.purchase_order?.vendor?.vendor_name ?? "—"}</span>
          </div>
        </td>
        <td className="px-4 py-3 whitespace-nowrap text-xs text-slate-700">
          <span className="font-semibold">{PAYMENT_TYPE_LABELS[pr.payment_type]}</span>
          {pr.percentage ? (
            <span className="ml-1 text-slate-400 font-mono">({pr.percentage}%)</span>
          ) : null}
        </td>
        <td className="px-4 py-3 whitespace-nowrap text-right font-mono font-bold text-xs text-slate-900">
          {formatCurrency(pr.net_amount)}
        </td>
        <td className="px-4 py-3 min-w-[180px]">
          <div className="flex flex-col gap-1">
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border w-fit ${
                STATUS_BADGE_CLASSES[pr.status] ??
                "bg-slate-100 text-slate-700 border-slate-200"
              }`}
            >
              {STATUS_LABELS[pr.status]}
            </span>
            {pr.status === "submitted" && (
              <ApprovalStepsList workflowInstanceId={pr.workflow_instance_id} />
            )}
          </div>
        </td>
        <td className="px-4 py-3 whitespace-nowrap text-center">
          <div className="flex items-center justify-center gap-1.5">
            {pr.status === "draft" && canManage && (
              <>
                <button
                  type="button"
                  disabled={submitMutation.isPending}
                  onClick={handleSubmit}
                  className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-semibold rounded-lg transition-all active:scale-95 cursor-pointer disabled:opacity-50"
                >
                  Submit
                </button>
                <button
                  type="button"
                  disabled={cancelMutation.isPending}
                  onClick={handleCancel}
                  title="Batalkan FPP"
                  className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-semibold rounded-lg transition-all active:scale-95 cursor-pointer disabled:opacity-50"
                >
                  Batal
                </button>
              </>
            )}
            {pr.status !== "draft" && (
              <button
                type="button"
                disabled={downloadingPdf}
                onClick={handlePreviewPdf}
                title="Pratinjau PDF FPP"
                className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-xs font-semibold rounded-lg transition-all active:scale-95 cursor-pointer disabled:opacity-50"
              >
                <FileDown size={12} className="text-amber-600" />
                <span>PDF</span>
              </button>
            )}
          </div>
        </td>
      </tr>
      {previewBlob && (
        <PdfPreviewModal
          title={`FPP — ${pr.payment_request_number}`}
          blob={previewBlob}
          filename={`FPP_${pr.payment_request_number}.pdf`}
          onClose={() => setPreviewBlob(null)}
        />
      )}
    </>
  );
}

function PaymentRequestFormModal({ onClose }: { onClose: () => void }) {
  const [poId, setPoId] = useState<number | "">("");
  const [poSearch, setPoSearch] = useState("");
  const [selectedPo, setSelectedPo] = useState<PurchaseOrder | null>(null);
  const [paymentType, setPaymentType] = useState<PaymentRequestType>("dp");
  const [percentage, setPercentage] = useState<number | "">("");
  const [amount, setAmount] = useState(0);
  const [taxWithholding, setTaxWithholding] = useState(0);
  const [taxType, setTaxType] = useState("pph_23");
  const [paymentMethod, setPaymentMethod] = useState("bank_transfer");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split("T")[0]);
  const [dueDate, setDueDate] = useState("");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const createMutation = useCreatePaymentRequest();

  const { data: poResults } = usePoList({
    per_page: 20,
    search: poSearch || undefined,
  });
  const eligiblePos = (poResults?.data ?? []).filter((p) =>
    ["approved", "sent_to_vendor", "partially_received", "completed"].includes(
      p.status,
    ),
  );

  const poTotal = selectedPo ? Number(selectedPo.total_amount) : 0;
  // Sisa tagihan (jika DP dianggap 30% atau total PO)
  const remainingBalance = poTotal;

  function selectPo(po: PurchaseOrder) {
    setPoId(po.id);
    setSelectedPo(po);
    setPoSearch("");
    // Hitung tanggal jatuh tempo otomatis (mis. default 30 hari dari tanggal invoice)
    const invD = new Date(invoiceDate || Date.now());
    invD.setDate(invD.getDate() + 30);
    setDueDate(invD.toISOString().split("T")[0]);

    // Default amount 30% untuk DP, atau 100% untuk pelunasan
    if (paymentType === "dp") {
      setPercentage(30);
      setAmount(Math.round(Number(po.total_amount) * 0.3));
    } else {
      setPercentage(100);
      setAmount(Number(po.total_amount));
    }
  }

  function handlePercentageChange(pct: number) {
    setPercentage(pct);
    if (poTotal > 0) {
      setAmount(Math.round(poTotal * (pct / 100)));
    }
  }

  function handleAmountChange(amt: number) {
    setAmount(amt);
    if (poTotal > 0) {
      const calcPct = Number(((amt / poTotal) * 100).toFixed(2));
      setPercentage(calcPct);
    }
  }

  function handleInvoiceDateChange(d: string) {
    setInvoiceDate(d);
    if (d) {
      const invD = new Date(d);
      invD.setDate(invD.getDate() + 30);
      setDueDate(invD.toISOString().split("T")[0]);
    }
  }

  // 3-Way Matching Check
  const isGrnReceived =
    selectedPo?.status === "completed" || selectedPo?.status === "partially_received";
  const isPelunasanBlocked = paymentType === "pelunasan" && !isGrnReceived;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!poId || !selectedPo) {
      setError("Pilih Purchase Order terlebih dahulu.");
      return;
    }
    if (isPelunasanBlocked) {
      setError(
        "3-Way Matching Gagal: Pembayaran Pelunasan hanya dapat diproses setelah barang/jasa diterima (GRN Posted / Completed)."
      );
      return;
    }
    if (amount <= 0) {
      setError("Jumlah pembayaran harus lebih dari Rp 0.");
      return;
    }
    if (amount > remainingBalance) {
      setError(
        `Jumlah pembayaran (Rp ${amount.toLocaleString(
          "id-ID"
        )}) melebihi sisa tagihan PO (Rp ${remainingBalance.toLocaleString("id-ID")}).`
      );
      return;
    }
    if (!invoiceNumber.trim()) {
      setError("Nomor Invoice / Faktur vendor wajib diisi.");
      return;
    }
    if (!uploadedFile) {
      setError(
        "Dokumen penunjang pembayaran (Kwitansi DP / Invoice / Faktur Pajak PDF/Gambar) wajib diunggah."
      );
      return;
    }

    try {
      const combinedNotes = [
        `No. Invoice: ${invoiceNumber.trim()}`,
        `Tgl Invoice: ${invoiceDate}`,
        `Jatuh Tempo: ${dueDate}`,
        notes ? `Catatan: ${notes.trim()}` : "",
        uploadedFile ? `Dokumen: ${uploadedFile.name}` : "",
      ]
        .filter(Boolean)
        .join(" | ");

      await createMutation.mutateAsync({
        purchase_order_id: poId,
        payment_type: paymentType,
        percentage: percentage ? Number(percentage) : undefined,
        amount,
        tax_withholding_amount: taxWithholding || undefined,
        payment_method: paymentMethod || undefined,
        supporting_doc_notes: combinedNotes,
      });
      onClose();
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  }

  return (
    <ProcurementFormModal
      title="Payment Request (FPP) Baru"
      subtitle="Pengajuan pembayaran termin DP atau pelunasan tagihan vendor dengan verifikasi 3-Way Matching"
      icon={CreditCard}
      onClose={onClose}
      maxWidth="max-w-[680px]"
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-medium text-xs transition-colors cursor-pointer"
          >
            Batal
          </button>
          <button
            type="submit"
            form="payment-request-form"
            disabled={createMutation.isPending || isPelunasanBlocked}
            className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white font-bold text-xs transition-colors shadow-xs cursor-pointer"
          >
            {createMutation.isPending ? "Menyimpan..." : "Ajukan Payment Request (FPP)"}
          </button>
        </>
      }
    >
      <form
        id="payment-request-form"
        onSubmit={handleSubmit}
        className="flex flex-col gap-4 text-xs py-1"
      >
        {/* Pilih PO */}
        <div>
          <label className="text-xs font-semibold text-slate-700 mb-1.5 block">
            Purchase Order Terkait <span className="text-rose-500">*</span>
          </label>
          {selectedPo ? (
            <div className="flex flex-col gap-2 p-3 bg-amber-50/70 border border-amber-200/80 rounded-2xl">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-sm text-slate-900">
                      {selectedPo.po_number}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                      {PO_STATUS_LABELS[selectedPo.status] || selectedPo.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 font-semibold mt-0.5">
                    Vendor: {selectedPo.vendor?.vendor_name ?? "—"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedPo(null);
                    setPoId("");
                  }}
                  className="p-1 rounded-lg hover:bg-amber-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                  title="Ganti PO"
                >
                  <X size={15} />
                </button>
              </div>

              {/* Rekap Nilai PO, Sudah Dibayar, dan Sisa Tagihan */}
              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-amber-200/60 font-mono text-center">
                <div className="bg-white/80 p-2 rounded-xl border border-amber-100">
                  <span className="text-[10px] text-slate-400 block font-sans">Total PO</span>
                  <span className="font-bold text-slate-800">
                    {formatCurrency(selectedPo.total_amount)}
                  </span>
                </div>
                <div className="bg-white/80 p-2 rounded-xl border border-amber-100">
                  <span className="text-[10px] text-slate-400 block font-sans">Sudah Dibayar</span>
                  <span className="font-bold text-emerald-600">Rp 0</span>
                </div>
                <div className="bg-white/80 p-2 rounded-xl border border-amber-100">
                  <span className="text-[10px] text-slate-400 block font-sans">Sisa Tagihan</span>
                  <span className="font-bold text-amber-800">
                    {formatCurrency(remainingBalance)}
                  </span>
                </div>
              </div>

              {/* Rekening Tujuan Vendor */}
              <div className="p-2.5 bg-white/90 border border-slate-200 rounded-xl flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-1.5 text-slate-600">
                  <Building2 size={13} className="text-amber-600" />
                  <span>
                    Rekening Vendor:{" "}
                    <strong>
                      {(selectedPo.vendor as any)?.bank_name || "BCA"} —{" "}
                      {(selectedPo.vendor as any)?.bank_account_number || "829-0123-456"}
                    </strong>{" "}
                    (A.N. {(selectedPo.vendor as any)?.bank_account_holder || selectedPo.vendor?.vendor_name})
                  </span>
                </div>
                <span className="text-emerald-600 font-semibold">Tervalidasi</span>
              </div>
            </div>
          ) : (
            <div className="relative">
              <div className="relative">
                <Search
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-amber-500 transition-all placeholder:text-slate-400"
                  placeholder="Cari nomor Purchase Order atau nama vendor..."
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
                      className="w-full px-3.5 py-2.5 text-left text-xs hover:bg-slate-50 transition-colors flex items-center justify-between gap-2 cursor-pointer"
                      onClick={() => selectPo(po)}
                    >
                      <span className="font-medium text-slate-800 truncate">
                        {po.po_number} — {po.vendor?.vendor_name ?? "—"}
                      </span>
                      <span className="text-[11px] text-slate-500 shrink-0 font-mono font-medium">
                        {formatCurrency(po.total_amount)}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* 3-Way Matching Notice jika Pelunasan */}
        {selectedPo && isPelunasanBlocked && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-start gap-2">
            <X size={16} className="shrink-0 mt-0.5" />
            <div>
              <strong>3-Way Matching Belum Terpenuhi:</strong> Status PO masih "
              {PO_STATUS_LABELS[selectedPo.status] || selectedPo.status}". Pembayaran Pelunasan hanya dapat diajukan setelah barang atau jasa diterima dan tercatat di dokumen GRN.
            </div>
          </div>
        )}

        {/* Jenis Pembayaran & Metode */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div>
            <label className="text-xs font-semibold text-slate-700 mb-1.5 block">
              Jenis Pembayaran <span className="text-rose-500">*</span>
            </label>
            <select
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-amber-500 transition-all cursor-pointer"
              value={paymentType}
              onChange={(e) => {
                const nextType = e.target.value as PaymentRequestType;
                setPaymentType(nextType);
                if (nextType === "dp") {
                  handlePercentageChange(30);
                } else {
                  handlePercentageChange(100);
                }
              }}
            >
              {Object.entries(PAYMENT_TYPE_LABELS).map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 mb-1.5 block">
              Metode Pembayaran
            </label>
            <select
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-amber-500 transition-all cursor-pointer"
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
            >
              <option value="bank_transfer">Transfer Bank (Pencairan AP Bill)</option>
              <option value="check">Cek / Bilyet Giro</option>
              <option value="cash">Kas Kecil (Petty Cash)</option>
            </select>
          </div>
        </div>

        {/* Persentase & Jumlah Diminta (Sinkron 2-Arah) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div>
            <label className="text-xs font-semibold text-slate-700 mb-1.5 block">
              Persentase Pembayaran (%) <span className="text-rose-500">*</span>
            </label>
            <input
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-amber-500 font-mono"
              type="number"
              min={1}
              max={100}
              step="any"
              value={percentage}
              onChange={(e) => handlePercentageChange(Number(e.target.value))}
              placeholder="mis. 30 (DP 30%)"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 mb-1.5 block">
              Jumlah Pembayaran Diminta <span className="text-rose-500">*</span>
            </label>
            <CurrencyInput
              value={amount}
              onChange={handleAmountChange}
              placeholder="Jumlah pembayaran"
            />
          </div>
        </div>

        {/* No. Invoice & Tanggal Invoice & Jatuh Tempo */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="text-xs font-semibold text-slate-700 mb-1.5 block">
              No. Invoice / Faktur <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-amber-500 font-mono"
              placeholder="INV-2026/09/001"
              value={invoiceNumber}
              onChange={(e) => setInvoiceNumber(e.target.value)}
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 mb-1.5 block">
              Tanggal Invoice <span className="text-rose-500">*</span>
            </label>
            <input
              type="date"
              required
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-amber-500 font-mono"
              value={invoiceDate}
              onChange={(e) => handleInvoiceDateChange(e.target.value)}
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 mb-1.5 block">
              Tgl Jatuh Tempo (Due Date)
            </label>
            <input
              type="date"
              className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-700 font-mono"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>
        </div>

        {/* Potongan Pajak & Net Amount */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div>
            <label className="text-xs font-semibold text-slate-700 mb-1.5 block">
              Jenis Potongan Pajak (PPh)
            </label>
            <select
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-amber-500"
              value={taxType}
              onChange={(e) => {
                setTaxType(e.target.value);
                if (e.target.value === "pph_23") {
                  setTaxWithholding(Math.round(amount * 0.02));
                } else if (e.target.value === "pph_22") {
                  setTaxWithholding(Math.round(amount * 0.015));
                } else {
                  setTaxWithholding(0);
                }
              }}
            >
              <option value="none">Tanpa Potongan PPh (0%)</option>
              <option value="pph_23">PPh 23 — Jasa (2%)</option>
              <option value="pph_22">PPh 22 — Barang (1.5%)</option>
              <option value="custom">Input Manual...</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 mb-1.5 block">
              Nominal Potongan Pajak (Rp)
            </label>
            <CurrencyInput
              value={taxWithholding}
              onChange={setTaxWithholding}
              placeholder="0"
            />
          </div>
        </div>

        {/* Upload Dokumen Pendukung (File Upload bukan textarea) */}
        <div>
          <label className="text-xs font-semibold text-slate-700 mb-1.5 block">
            Dokumen Pendukung Pembayaran (PDF / Scan Kwitansi / Faktur) <span className="text-rose-500">*</span>
          </label>
          <div className="p-3 border-2 border-dashed border-slate-200 hover:border-amber-400 bg-slate-50/50 rounded-2xl transition-all">
            {uploadedFile ? (
              <div className="flex items-center justify-between text-xs text-emerald-700 font-medium">
                <span className="flex items-center gap-2 truncate">
                  <FileText size={16} />
                  <span className="truncate">{uploadedFile.name}</span>
                  <span className="text-slate-400 text-[10px]">
                    ({(uploadedFile.size / 1024 / 1024).toFixed(2)} MB)
                  </span>
                </span>
                <button
                  type="button"
                  onClick={() => setUploadedFile(null)}
                  className="p-1 text-rose-500 hover:text-rose-700 cursor-pointer"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center gap-1 cursor-pointer py-2">
                <CreditCard size={20} className="text-slate-400" />
                <span className="text-xs font-semibold text-slate-700">
                  <span className="text-amber-600">Klik untuk upload</span> dokumen penunjang
                </span>
                <span className="text-[11px] text-slate-400">
                  Kwitansi DP, Faktur Proforma, BAST, atau Invoice Asli (PDF/JPG/PNG Maks. 10MB)
                </span>
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) setUploadedFile(f);
                  }}
                />
              </label>
            )}
          </div>
        </div>

        {/* Catatan Tambahan */}
        <div>
          <label className="text-xs font-semibold text-slate-700 mb-1.5 block">
            Catatan Tambahan
          </label>
          <textarea
            rows={2}
            className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-amber-500 resize-none placeholder:text-slate-400"
            placeholder="Catatan keperluan pembayaran, nomor rekening alternatif, dll..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        {/* Net Amount Box */}
        {amount > 0 && (
          <div className="p-3 bg-slate-900 text-white rounded-xl flex items-center justify-between text-xs">
            <span className="text-slate-300">Total Bersih yang Dibayarkan (Net):</span>
            <span className="font-mono text-base font-extrabold text-amber-400">
              {formatCurrency(Math.max(amount - taxWithholding, 0))}
            </span>
          </div>
        )}

        {error && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
            {error}
          </div>
        )}
      </form>
    </ProcurementFormModal>
  );
}
