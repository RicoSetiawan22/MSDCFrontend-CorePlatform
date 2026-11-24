import { useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Search,
  FileClock,
  FileText,
  Image as ImageIcon,
  Paperclip,
  Trophy,
  FileDown,
  CheckCircle2,
  Clock,
  XCircle,
  ShoppingBag,
  Layers,
  X,
  FilterX,
  Building2,
} from "lucide-react";
import type { PoStatus } from "../types/po";
import { usePoList } from "../api/usePo";
import { usePoHistory } from "../api/usePo";
import { prApi } from "../api/prApi";
import { poApi } from "../api/poApi";
import { paymentRequestApi } from "../api/paymentRequestApi";
import { apiClient } from "@shared/lib/api-client";
import { Button } from "@shared/components/Button";
import { Modal } from "@shared/components/Modal";
import { PageHeader } from "@shared/components/PageHeader";
import { EmptyState } from "@shared/components/EmptyState";
import { LoadingState } from "@shared/components/LoadingState";
import { PdfPreviewModal } from "@shared/components/PdfPreviewModal";
import { ImagePreviewModal } from "@shared/components/ImagePreviewModal";
import { ApprovalStepsList } from "@shared/components/ApprovalStepsList";
import { Pagination } from "@shared/components/Pagination";
import { extractErrorMessage } from "@shared/types/api";
import { useActiveOrgId } from "@shared/lib/organization-context";
import { formatDate, formatCurrency } from "@shared/lib/format";
import type {
  HistoryFile,
  HistoryLine,
  HistoryPaymentRequest,
} from "../types/poHistory";

const PR_STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  submitted: "Menunggu Approval",
  approved: "Disetujui",
  rejected: "Ditolak",
  cancelled: "Dibatalkan",
  converted_to_po: "Sudah Jadi PO",
};
const PO_STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  submitted: "Menunggu Approval",
  approved: "Disetujui",
  sent_to_vendor: "Terkirim ke Vendor",
  partially_received: "Sebagian Diterima",
  completed: "Selesai Diterima",
  cancelled: "Dibatalkan",
  rejected: "Ditolak",
};

const PO_STATUS_BADGE_CLASSES: Record<string, string> = {
  draft: "bg-slate-100 text-slate-700 border-slate-200",
  submitted: "bg-amber-50 text-amber-700 border-amber-200/80",
  approved: "bg-blue-50 text-blue-700 border-blue-200/80",
  sent_to_vendor: "bg-indigo-50 text-indigo-700 border-indigo-200/80",
  partially_received: "bg-yellow-50 text-yellow-700 border-yellow-200/80",
  completed: "bg-emerald-50 text-emerald-700 border-emerald-200/80",
  cancelled: "bg-rose-50 text-rose-700 border-rose-200/80",
  rejected: "bg-rose-50 text-rose-700 border-rose-200/80",
};

const PICKING_STATUS_LABELS: Record<string, string> = {
  pending_epm_approval: "Menunggu Approval",
  confirmed: "Disetujui",
  rejected: "Ditolak",
  cancelled: "Dibatalkan",
};
const PAYMENT_TYPE_LABELS: Record<string, string> = {
  dp: "DP (Uang Muka)",
  pelunasan: "Pelunasan",
  full: "Full (Lunas Sekaligus)",
};
const PAYMENT_STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  submitted: "Menunggu Approval",
  approved: "Disetujui",
  rejected: "Ditolak",
  posted: "Uang Muka Terposting",
  cancelled: "Dibatalkan",
};
const GRN_STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  posted: "Posted",
};

export function PoHistoryPage() {
  const [searchParams] = useSearchParams();
  const poParam = searchParams.get("po");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<PoStatus | "">("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [page, setPage] = useState(1);
  const [selectedPoId, setSelectedPoId] = useState<number | null>(
    poParam ? Number(poParam) : null,
  );

  const { data, isLoading } = usePoList({
    page,
    per_page: 50,
    search: search || undefined,
    status: statusFilter || undefined,
  });

  const rawPoList = data?.data ?? [];

  // Filter tambahan: rentang tanggal & search
  const poList = useMemo(() => {
    return rawPoList.filter((p) => {
      if (startDate && p.order_date && p.order_date < startDate) return false;
      if (endDate && p.order_date && p.order_date > endDate) return false;
      return true;
    });
  }, [rawPoList, startDate, endDate]);

  const totalPo = data?.total ?? poList.length;

  // KPI Calculations
  const completedCount = useMemo(
    () => poList.filter((p) => p.status === "completed").length,
    [poList]
  );
  const inProgressCount = useMemo(
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

  const healthPercentage =
    totalPo > 0 ? Math.round((completedCount / (totalPo || 1)) * 100) : 100;

  const hasActiveFilters = Boolean(search) || Boolean(statusFilter) || Boolean(startDate) || Boolean(endDate);

  function resetFilters() {
    setSearch("");
    setStatusFilter("");
    setStartDate("");
    setEndDate("");
    setPage(1);
  }

  function handleExportCsv() {
    if (poList.length === 0) {
      alert("Tidak ada data PO untuk diexport.");
      return;
    }
    const headers = ["No. PO", "No. PR", "Vendor Rekanan", "Tanggal Order", "Est Delivery", "Total Nilai (IDR)", "Status"];
    const rows = poList.map((p) => [
      `"${p.po_number}"`,
      `"${p.purchase_request?.pr_number ?? "-"}"`,
      `"${p.vendor?.vendor_name ?? "-"}"`,
      `"${p.order_date ?? "-"}"`,
      `"${p.expected_delivery_date ?? "-"}"`,
      `"${Number(p.total_amount || 0)}"`,
      `"${PO_STATUS_LABELS[p.status] ?? p.status}"`,
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Rekap_History_PO_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  const cardAnimationClass =
    "transition-all duration-200 ease-in-out cursor-pointer hover:-translate-y-1 active:scale-95 active:translate-y-0 select-none";

  return (
    <div className="min-h-screen bg-[#F5F7FA] pb-16">
      {/* ── 1. PageHeader Banner (Navy Blue & Gold Diagonal) ── */}
      <PageHeader
        title="History PO"
        subtitle="Jejak audit lengkap Purchase Order — runut mulai dari FPPBJ, komparasi RFQ vendor, kontrak PO, Goods Receipt, hingga Payment Request (FPP)."
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
                    Status Histori & Ketuntasan Pengadaan
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
                <Layers size={15} className="text-amber-500" />
                <span>Total PO Terdata:</span>
              </div>
              <span className="text-xs font-bold text-slate-800 font-mono">
                {totalPo} Purchase Order
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
                  Total Purchase Order
                </p>
                <h3 className="text-2xl font-bold text-slate-800 mt-0.5">
                  {totalPo}{" "}
                  <span className="text-xs font-normal text-slate-400">Order</span>
                </h3>
              </div>
            </button>

            {/* Card 2: Selesai (Completed) */}
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
                statusFilter === "sent_to_vendor"
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
                  {inProgressCount}{" "}
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
                statusFilter === "cancelled"
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

        {/* ── Main Data Card: Toolbar & History PO Table ── */}
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
                  placeholder="Cari No. PO, vendor rekanan, atau No. PR..."
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
                {Object.entries(PO_STATUS_LABELS).map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </select>

              {/* Date Range Filters */}
              <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200/90 px-3 py-1.5 rounded-xl text-xs text-slate-600">
                <span className="font-medium text-slate-400">Dari:</span>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    setPage(1);
                  }}
                  className="bg-transparent border-none text-xs text-slate-700 focus:outline-none"
                />
                <span className="font-medium text-slate-400">s/d:</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    setPage(1);
                  }}
                  className="bg-transparent border-none text-xs text-slate-700 focus:outline-none"
                />
              </div>

              {/* Export Rekap PO CSV */}
              <button
                type="button"
                onClick={handleExportCsv}
                className="inline-flex items-center gap-2 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
                title="Export seluruh data PO yang tampil ke format CSV"
              >
                <FileDown size={14} />
                <span>Export Rekap PO (.CSV)</span>
              </button>

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
                  : "Riwayat histori lengkap akan muncul begitu ada Purchase Order yang dibuat."
              }
            />
          )}

          {!isLoading && data && data.data.length > 0 && (
            <>
              <div className="border border-slate-200/90 rounded-xl overflow-hidden mt-1 shadow-2xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50/80 border-b border-slate-200/90 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      <tr>
                        <th className="px-4 py-3">No. PO</th>
                        <th className="px-4 py-3">No. PR (FPPBJ)</th>
                        <th className="px-4 py-3">Vendor Rekanan</th>
                        <th className="px-4 py-3 text-right">Total Nilai</th>
                        <th className="px-4 py-3">Status PO</th>
                        <th className="px-4 py-3 text-center">Aksi Histori</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {data.data.map((po) => (
                        <tr
                          key={po.id}
                          className="hover:bg-slate-50/60 transition-colors"
                        >
                          <td className="px-4 py-3 whitespace-nowrap font-mono text-xs font-bold text-amber-600">
                            {po.po_number}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap font-mono text-xs text-slate-500">
                            {po.purchase_request?.pr_number ?? "—"}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-xs text-slate-800">
                            <div className="flex items-center gap-1.5 font-medium">
                              <Building2 size={13} className="text-slate-400" />
                              <span>{po.vendor?.vendor_name ?? "—"}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-right font-mono font-bold text-xs text-slate-900">
                            {formatCurrency(Number(po.total_amount))}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                                PO_STATUS_BADGE_CLASSES[po.status] ??
                                "bg-slate-100 text-slate-700 border-slate-200"
                              }`}
                            >
                              {PO_STATUS_LABELS[po.status] ?? po.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-center">
                            <button
                              type="button"
                              onClick={() => setSelectedPoId(po.id)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 font-semibold text-xs rounded-xl transition-all border border-slate-200 cursor-pointer shadow-2xs"
                            >
                              <FileClock size={13} className="text-amber-600" />
                              <span>Lihat History</span>
                            </button>
                          </td>
                        </tr>
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

      {selectedPoId && (
        <PoHistoryModal
          poId={selectedPoId}
          onClose={() => setSelectedPoId(null)}
        />
      )}
    </div>
  );
}

// ─── History Detail Modal ───────────────────────────────────────────────────────
function PoHistoryModal({
  poId,
  onClose,
}: {
  poId: number;
  onClose: () => void;
}) {
  const orgId = useActiveOrgId();
  const { data, isLoading } = usePoHistory(poId);

  return (
    <Modal
      title={data ? `History — ${data.purchase_order.po_number}` : "History PO"}
      onClose={onClose}
      maxWidth={860}
    >
      {isLoading && <LoadingState />}
      {data && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "1.25rem",
            maxHeight: "75vh",
            overflowY: "auto",
            paddingRight: 4,
          }}
        >
          {/* ── 1. Purchase Request ── */}
          <TimelineSection
            step={1}
            title="Purchase Request (FPPBJ)"
            color="#0891b2"
          >
            {data.purchase_request ? (
              <>
                <SummaryGrid
                  items={[
                    ["No. PR", data.purchase_request.pr_number],
                    [
                      "Status",
                      PR_STATUS_LABELS[data.purchase_request.status] ??
                        data.purchase_request.status,
                    ],
                    ["Pemohon", data.purchase_request.requester_name ?? "—"],
                    ["Bagian", data.purchase_request.department ?? "—"],
                    ["Tanggal", formatDate(data.purchase_request.created_at)],
                  ]}
                />
                <div style={{ fontSize: "0.82rem", margin: "0.5rem 0" }}>
                  <strong>Tujuan:</strong>{" "}
                  {data.purchase_request.purpose ?? "—"}
                </div>
                <LinesTable
                  lines={data.purchase_request.lines}
                  priceKey="estimated_unit_price"
                />
                <ApprovalStepsList
                  workflowInstanceId={
                    data.purchase_request.workflow_instance_id
                  }
                />
                {orgId && (
                  <PreviewDocButton
                    label="Pratinjau PDF FPPBJ Resmi (+ Tanda Tangan)"
                    filename={`FPPBJ_${data.purchase_request.pr_number}.pdf`}
                    fetchBlob={() =>
                      prApi
                        .downloadPdf(data.purchase_request!.id, orgId)
                        .then((r) => r.data)
                    }
                  />
                )}
                <FileList
                  files={data.purchase_request.attachments}
                  emptyLabel="Tidak ada lampiran PR."
                />
              </>
            ) : (
              <div
                style={{
                  fontSize: "0.8rem",
                  color: "var(--grey)",
                  fontStyle: "italic",
                }}
              >
                PO ini tidak berasal dari Purchase Request (dibuat langsung).
              </div>
            )}
          </TimelineSection>

          {/* ── 2. RFQ / Perbandingan Vendor ── */}
          <TimelineSection
            step={2}
            title="RFQ — Perbandingan Vendor"
            color="#7c3aed"
          >
            {data.vendor_quotations.length === 0 ? (
              <div
                style={{
                  fontSize: "0.8rem",
                  color: "var(--grey)",
                  fontStyle: "italic",
                }}
              >
                Tidak ada data quotation vendor.
              </div>
            ) : (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.6rem",
                }}
              >
                {data.vendor_quotations.map((qt) => (
                  <div
                    key={qt.id}
                    style={{
                      border: `1px solid ${qt.is_winner ? "#7c3aed" : "var(--border)"}`,
                      borderRadius: 8,
                      padding: "0.6rem 0.8rem",
                      background: qt.is_winner ? "#faf5ff" : "white",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "0.3rem",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.4rem",
                        }}
                      >
                        <span style={{ fontWeight: 700, fontSize: "0.85rem" }}>
                          {qt.vendor_name ?? "—"}
                        </span>
                        {qt.is_winner && (
                          <span
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "0.2rem",
                              fontSize: "0.65rem",
                              fontWeight: 700,
                              background: "#7c3aed",
                              color: "#fff",
                              padding: "0.1rem 0.4rem",
                              borderRadius: 4,
                            }}
                          >
                            <Trophy size={10} /> PEMENANG
                          </span>
                        )}
                      </div>
                      <span
                        style={{
                          fontFamily: "monospace",
                          fontWeight: 700,
                          fontSize: "0.88rem",
                        }}
                      >
                        {formatCurrency(qt.total_amount)}
                      </span>
                    </div>
                    <div
                      style={{
                        fontSize: "0.75rem",
                        color: "var(--grey)",
                        marginBottom: "0.4rem",
                      }}
                    >
                      {qt.quotation_number} · Tanggal:{" "}
                      {qt.quotation_date ? formatDate(qt.quotation_date) : "—"}{" "}
                      · Berlaku s.d.:{" "}
                      {qt.valid_until ? formatDate(qt.valid_until) : "—"}
                    </div>
                    <FileList
                      files={qt.files}
                      emptyLabel="Tidak ada file penawaran diunggah."
                      compact
                    />
                  </div>
                ))}
              </div>
            )}
          </TimelineSection>

          {/* ── 3. Keputusan Vendor Pemenang ── */}
          {data.vendor_picking && (
            <TimelineSection
              step={3}
              title="Keputusan Vendor Pemenang"
              color="#7c3aed"
            >
              <SummaryGrid
                items={[
                  ["Vendor Terpilih", data.vendor_picking.vendor_name ?? "—"],
                  [
                    "No. Quotation",
                    data.vendor_picking.quotation_number ?? "—",
                  ],
                  [
                    "Status Approval",
                    PICKING_STATUS_LABELS[data.vendor_picking.status] ??
                      data.vendor_picking.status,
                  ],
                  ["Dipilih Oleh", data.vendor_picking.picked_by_name ?? "—"],
                  ["Tanggal", formatDate(data.vendor_picking.created_at)],
                ]}
              />
              {data.vendor_picking.notes && (
                <div style={{ fontSize: "0.8rem", marginTop: "0.4rem" }}>
                  <strong>Catatan:</strong> {data.vendor_picking.notes}
                </div>
              )}
              <ApprovalStepsList
                workflowInstanceId={data.vendor_picking.workflow_instance_id}
              />
            </TimelineSection>
          )}

          {/* ── 4. Purchase Order ── */}
          <TimelineSection
            step={4}
            title="Purchase Order (Surat Pesanan)"
            color="#15803d"
          >
            <SummaryGrid
              items={[
                ["No. PO", data.purchase_order.po_number],
                ["Vendor", data.purchase_order.vendor_name ?? "—"],
                [
                  "Status",
                  PO_STATUS_LABELS[data.purchase_order.status] ??
                    data.purchase_order.status,
                ],
                ["Tanggal Order", formatDate(data.purchase_order.order_date)],
                [
                  "Total Nilai",
                  formatCurrency(data.purchase_order.total_amount),
                ],
              ]}
            />
            <LinesTable
              lines={data.purchase_order.lines}
              priceKey="unit_price"
            />
            <ApprovalStepsList
              workflowInstanceId={data.purchase_order.workflow_instance_id}
            />
            {orgId && (
              <PreviewDocButton
                label="Pratinjau PDF Surat Pesanan Resmi (+ Tanda Tangan)"
                filename={`PO_${data.purchase_order.po_number}.pdf`}
                fetchBlob={() =>
                  poApi
                    .downloadPdf(data.purchase_order.id, orgId)
                    .then((r) => r.data)
                }
              />
            )}
            <FileList
              files={data.purchase_order.attachments}
              emptyLabel="Tidak ada lampiran PO."
            />
          </TimelineSection>

          {/* ── 5. Goods Receipt (BAST) ── */}
          <TimelineSection
            step={5}
            title="Goods Receipt (BAST)"
            color="#b45309"
          >
            {data.goods_receipts.length === 0 ? (
              <div
                style={{
                  fontSize: "0.8rem",
                  color: "var(--grey)",
                  fontStyle: "italic",
                }}
              >
                Barang/jasa belum diterima.
              </div>
            ) : (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.5rem",
                }}
              >
                {data.goods_receipts.map((grn) => (
                  <div
                    key={grn.id}
                    style={{
                      border: "1px solid var(--border)",
                      borderRadius: 8,
                      padding: "0.5rem 0.75rem",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        fontSize: "0.82rem",
                      }}
                    >
                      <span
                        style={{ fontFamily: "monospace", fontWeight: 700 }}
                      >
                        {grn.grn_number}
                      </span>
                      <span
                        className={`badge badge-${grn.status === "posted" ? "active" : "inactive"}`}
                      >
                        {GRN_STATUS_LABELS[grn.status] ?? grn.status}
                      </span>
                    </div>
                    <div
                      style={{
                        fontSize: "0.75rem",
                        color: "var(--grey)",
                        margin: "0.2rem 0",
                      }}
                    >
                      Diterima: {grn.received_by_name ?? "—"} · Tanggal:{" "}
                      {formatDate(grn.receipt_date)}
                    </div>
                    {grn.bast_file ? (
                      <FileList files={[grn.bast_file]} compact />
                    ) : (
                      <div
                        style={{
                          fontSize: "0.72rem",
                          color: "var(--grey)",
                          fontStyle: "italic",
                        }}
                      >
                        Tidak ada file BAST diunggah.
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </TimelineSection>

          {/* ── 6. Payment Request ── */}
          <TimelineSection
            step={6}
            title="Payment Request (FPP)"
            color="#1d4ed8"
          >
            <PaymentSummaryBar
              poTotal={data.purchase_order.total_amount}
              paymentRequests={data.payment_requests}
            />
            {data.payment_requests.length === 0 ? (
              <div
                style={{
                  fontSize: "0.8rem",
                  color: "var(--grey)",
                  fontStyle: "italic",
                }}
              >
                Belum ada Payment Request untuk PO ini.
              </div>
            ) : (
              <PaymentRequestCards
                poTotal={data.purchase_order.total_amount}
                paymentRequests={data.payment_requests}
                orgId={orgId}
              />
            )}
          </TimelineSection>

          <Button
            variant="secondary"
            onClick={onClose}
            style={{ alignSelf: "flex-end" }}
          >
            Tutup
          </Button>
        </div>
      )}
    </Modal>
  );
}

// ─── Shared bits ─────────────────────────────────────────────────────────────────
function TimelineSection({
  step,
  title,
  color,
  children,
}: {
  step: number;
  title: string;
  color: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ borderLeft: `3px solid ${color}`, paddingLeft: "0.9rem" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          marginBottom: "0.5rem",
        }}
      >
        <span
          style={{
            width: 20,
            height: 20,
            borderRadius: "50%",
            background: color,
            color: "#fff",
            fontSize: "0.7rem",
            fontWeight: 700,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          {step}
        </span>
        <h4 style={{ margin: 0, fontSize: "0.9rem" }}>{title}</h4>
      </div>
      {children}
    </div>
  );
}

function PreviewDocButton({
  label,
  filename,
  fetchBlob,
}: {
  label: string;
  filename: string;
  fetchBlob: () => Promise<Blob>;
}) {
  const [loading, setLoading] = useState(false);
  const [blob, setBlob] = useState<Blob | null>(null);

  async function handleClick() {
    setLoading(true);
    try {
      setBlob(await fetchBlob());
    } catch (err) {
      alert(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "0.3rem",
          fontSize: "0.72rem",
          fontWeight: 600,
          color: "var(--accent)",
          background: "var(--accent-light)",
          border: "1px solid var(--accent)",
          borderRadius: 6,
          padding: "0.35rem 0.65rem",
          cursor: loading ? "default" : "pointer",
          margin: "0.4rem 0",
        }}
      >
        <FileDown size={12} /> {loading ? "Memuat PDF..." : label}
      </button>
      {blob && (
        <PdfPreviewModal
          title={label}
          blob={blob}
          filename={filename}
          onClose={() => setBlob(null)}
        />
      )}
    </>
  );
}

const COUNTED_PAYMENT_STATUSES = ["approved", "posted"];

function sumCountedPayments(paymentRequests: HistoryPaymentRequest[]): number {
  return paymentRequests
    .filter((p) => COUNTED_PAYMENT_STATUSES.includes(p.status))
    .reduce((sum, p) => sum + p.net_amount, 0);
}

function PaymentSummaryBar({
  poTotal,
  paymentRequests,
}: {
  poTotal: number;
  paymentRequests: HistoryPaymentRequest[];
}) {
  const totalDibayar = sumCountedPayments(paymentRequests);
  const sisaBayar = Math.max(poTotal - totalDibayar, 0);
  const isLunas = sisaBayar <= 0 && totalDibayar > 0;

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
        gap: "0.5rem",
        padding: "0.6rem 0.8rem",
        background: "#eff6ff",
        border: "1px solid #bfdbfe",
        borderRadius: 8,
        marginBottom: "0.6rem",
      }}
    >
      <div>
        <div
          style={{
            fontSize: "0.65rem",
            color: "var(--grey)",
            fontWeight: 600,
            textTransform: "uppercase",
          }}
        >
          Total Nilai PO
        </div>
        <div
          style={{
            fontSize: "0.86rem",
            fontWeight: 700,
            fontFamily: "monospace",
          }}
        >
          {formatCurrency(poTotal)}
        </div>
      </div>
      <div>
        <div
          style={{
            fontSize: "0.65rem",
            color: "var(--grey)",
            fontWeight: 600,
            textTransform: "uppercase",
          }}
        >
          Sudah Dibayar
        </div>
        <div
          style={{
            fontSize: "0.86rem",
            fontWeight: 700,
            fontFamily: "monospace",
            color: "#15803d",
          }}
        >
          {formatCurrency(totalDibayar)}
        </div>
      </div>
      <div>
        <div
          style={{
            fontSize: "0.65rem",
            color: "var(--grey)",
            fontWeight: 600,
            textTransform: "uppercase",
          }}
        >
          Sisa Bayar
        </div>
        <div
          style={{
            fontSize: "0.86rem",
            fontWeight: 700,
            fontFamily: "monospace",
            color: isLunas ? "#15803d" : "#b45309",
          }}
        >
          {isLunas ? "LUNAS" : formatCurrency(sisaBayar)}
        </div>
      </div>
    </div>
  );
}

function PaymentRequestCards({
  poTotal,
  paymentRequests,
  orgId,
}: {
  poTotal: number;
  paymentRequests: HistoryPaymentRequest[];
  orgId: number;
}) {
  const sorted = [...paymentRequests].sort(
    (a, b) =>
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
  );
  let runningPaid = 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
      {sorted.map((pay) => {
        if (COUNTED_PAYMENT_STATUSES.includes(pay.status)) {
          runningPaid += pay.net_amount;
        }
        const sisaSetelahIni = Math.max(poTotal - runningPaid, 0);

        return (
          <div
            key={pay.id}
            style={{
              border: "1px solid var(--border)",
              borderRadius: 8,
              padding: "0.6rem 0.8rem",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "0.3rem",
              }}
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
              >
                <span
                  style={{
                    fontFamily: "monospace",
                    fontWeight: 700,
                    fontSize: "0.85rem",
                  }}
                >
                  {pay.payment_request_number}
                </span>
                <span
                  className="badge badge-inactive"
                  style={{ fontSize: "0.65rem" }}
                >
                  {PAYMENT_STATUS_LABELS[pay.status] ?? pay.status}
                </span>
              </div>
              <span
                style={{
                  fontFamily: "monospace",
                  fontWeight: 700,
                  fontSize: "0.88rem",
                }}
              >
                {formatCurrency(pay.net_amount)}
              </span>
            </div>
            <div
              style={{
                fontSize: "0.75rem",
                color: "var(--grey)",
                marginBottom: "0.4rem",
              }}
            >
              {PAYMENT_TYPE_LABELS[pay.payment_type] ?? pay.payment_type} ·
              Pemohon: {pay.employee_name ?? "—"} · {formatDate(pay.created_at)}
            </div>
            {COUNTED_PAYMENT_STATUSES.includes(pay.status) && (
              <div style={{ fontSize: "0.75rem", marginBottom: "0.4rem" }}>
                <strong>Sisa Bayar Setelah FPP Ini:</strong>{" "}
                <span
                  style={{
                    fontFamily: "monospace",
                    fontWeight: 700,
                    color: sisaSetelahIni <= 0 ? "#15803d" : "#b45309",
                  }}
                >
                  {sisaSetelahIni <= 0
                    ? "LUNAS"
                    : formatCurrency(sisaSetelahIni)}
                </span>
              </div>
            )}
            <ApprovalStepsList workflowInstanceId={pay.workflow_instance_id} />
            {orgId && (
              <PreviewDocButton
                label="Pratinjau PDF FPP Resmi (+ Tanda Tangan)"
                filename={`FPP_${pay.payment_request_number}.pdf`}
                fetchBlob={() =>
                  paymentRequestApi
                    .downloadPdf(pay.id, orgId)
                    .then((r) => r.data)
                }
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

function SummaryGrid({ items }: { items: [string, string][] }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
        gap: "0.5rem",
      }}
    >
      {items.map(([label, value]) => (
        <div key={label}>
          <div
            style={{
              fontSize: "0.65rem",
              color: "var(--grey)",
              fontWeight: 600,
              textTransform: "uppercase",
            }}
          >
            {label}
          </div>
          <div style={{ fontSize: "0.83rem", fontWeight: 600 }}>{value}</div>
        </div>
      ))}
    </div>
  );
}

function LinesTable({
  lines,
  priceKey,
}: {
  lines: HistoryLine[];
  priceKey: "estimated_unit_price" | "unit_price";
}) {
  if (!lines || lines.length === 0) return null;
  return (
    <table
      className="table"
      style={{ fontSize: "0.76rem", margin: "0.4rem 0" }}
    >
      <thead>
        <tr>
          <th>Deskripsi</th>
          <th>Qty</th>
          <th>Satuan</th>
          <th>Harga</th>
        </tr>
      </thead>
      <tbody>
        {lines.map((l) => (
          <tr key={l.id}>
            <td>{l.description}</td>
            <td>{String(l.quantity)}</td>
            <td>{l.uom}</td>
            <td style={{ fontFamily: "monospace" }}>
              {formatCurrency(Number(l[priceKey] ?? 0))}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function FileList({
  files,
  emptyLabel,
  compact,
}: {
  files: HistoryFile[];
  emptyLabel?: string;
  compact?: boolean;
}) {
  const [preview, setPreview] = useState<{
    blob: Blob;
    filename: string;
    isImage: boolean;
  } | null>(null);

  async function handleOpen(f: HistoryFile) {
    try {
      const res = await apiClient.get(
        `/v1/core-platform/files/${f.id}/download`,
        { responseType: "blob" },
      );
      const filename = f.original_name ?? "file";
      if (f.mime_type === "application/pdf") {
        setPreview({ blob: res.data, filename, isImage: false });
      } else if (f.mime_type?.startsWith("image/")) {
        setPreview({ blob: res.data, filename, isImage: true });
      } else {
        const { downloadBlobAsFile } = await import("@shared/lib/downloadFile");
        downloadBlobAsFile(res.data, filename);
      }
    } catch (err) {
      alert(extractErrorMessage(err));
    }
  }

  if (files.length === 0) {
    return emptyLabel ? (
      <div
        style={{
          fontSize: "0.72rem",
          color: "var(--grey)",
          fontStyle: "italic",
        }}
      >
        {emptyLabel}
      </div>
    ) : null;
  }

  return (
    <>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "0.3rem",
          marginTop: compact ? "0.3rem" : "0.5rem",
        }}
      >
        {files.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => handleOpen(f)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.4rem",
              padding: "0.3rem 0.5rem",
              background: "#f8fafc",
              border: "1px solid var(--border)",
              borderRadius: 6,
              fontSize: "0.75rem",
              color: "var(--accent)",
              cursor: "pointer",
              textAlign: "left",
            }}
          >
            {f.mime_type?.startsWith("image/") ? (
              <ImageIcon size={13} />
            ) : f.mime_type === "application/pdf" ? (
              <FileText size={13} />
            ) : (
              <Paperclip size={13} />
            )}
            <span
              style={{
                flex: 1,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {f.original_name}
            </span>
            {f.uploader?.name && (
              <span
                style={{
                  color: "var(--grey)",
                  fontSize: "0.68rem",
                  flexShrink: 0,
                }}
              >
                oleh {f.uploader.name}
              </span>
            )}
          </button>
        ))}
      </div>
      {preview && !preview.isImage && (
        <PdfPreviewModal
          title={preview.filename}
          blob={preview.blob}
          filename={preview.filename}
          onClose={() => setPreview(null)}
        />
      )}
      {preview && preview.isImage && (
        <ImagePreviewModal
          title={preview.filename}
          blob={preview.blob}
          filename={preview.filename}
          onClose={() => setPreview(null)}
        />
      )}
    </>
  );
}
