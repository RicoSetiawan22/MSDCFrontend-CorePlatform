import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  X,
  Calendar,
  Wrench,
  CheckCircle2,
  Clock,
  DollarSign,
  FilterX,
  Coins,
  FileText,
  Building2,
  ArrowRight,
  Plus,
  Laptop,
  CheckCircle,
  User,
  ChevronRight,
} from "lucide-react";
import { useServiceLogList, useServiceLogSummary } from "../api/useServiceLog";
import { ServiceLogFormModal } from "../components/servicelog/ServiceLogFormModal";
import { ServiceLogDetailModal } from "../components/servicelog/ServiceLogDetailModal";
import { LinkAssetModal } from "../components/servicelog/LinkAssetModal";
import { Pagination } from "@shared/components/Pagination";
import { PageHeader } from "@shared/components/PageHeader";
import { EmptyState } from "@shared/components/EmptyState";
import { LoadingState } from "@shared/components/LoadingState";
import { formatDate, formatCurrency, formatNumber } from "@shared/lib/format";
import type {
  PoStatus,
} from "../types/po";
import {
  SERVICE_RESULT_LABELS,
  SERVICE_RESULT_BADGES,
  SERVICE_SLA_LABELS,
  SERVICE_SLA_BADGES,
  type ServiceLogLine,
  type ServiceSourceType,
  type ServiceSlaStatus,
  type ServiceResultStatus,
} from "../types/serviceLog";

const PO_STATUS_LABELS: Record<PoStatus, string> = {
  draft: "Draft",
  submitted: "Menunggu Approval",
  approved: "Disetujui",
  sent_to_vendor: "Menunggu Vendor",
  partially_received: "Sebagian Diterima",
  completed: "Selesai",
  cancelled: "Dibatalkan",
  rejected: "Ditolak",
};

export function ServiceLogPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [poStatus, setPoStatus] = useState<PoStatus | "">("");
  const [sourceType, setSourceType] = useState<ServiceSourceType | "all">("all");
  const [slaStatus, setSlaStatus] = useState<ServiceSlaStatus | "">("");
  const [serviceResult, setServiceResult] = useState<ServiceResultStatus | "">("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  // Modal States
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [detailItem, setDetailItem] = useState<ServiceLogLine | null>(null);
  const [linkingItem, setLinkingItem] = useState<ServiceLogLine | null>(null);

  // Toast feedback state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  function triggerToast(msg: string) {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  }

  const params = {
    page,
    per_page: 15,
    search: search || undefined,
    po_status: poStatus || undefined,
    source_type: sourceType,
    sla_status: slaStatus || undefined,
    service_result: serviceResult || undefined,
    date_from: dateFrom || undefined,
    date_to: dateTo || undefined,
  };

  const { data, isLoading } = useServiceLogList(params);
  const { data: summary } = useServiceLogSummary({
    date_from: dateFrom || undefined,
    date_to: dateTo || undefined,
  });

  // KPI Calculations
  const totalLines = summary?.total_lines ?? 0;
  const totalAmount = summary?.total_amount ?? 0;
  const receivedCount = summary?.received_count ?? 0;
  const pendingCount = Math.max(0, totalLines - receivedCount);

  const completionPercentage =
    totalLines > 0 ? Math.round((receivedCount / totalLines) * 100) : 100;

  const hasActiveFilters =
    Boolean(search) ||
    Boolean(poStatus) ||
    sourceType !== "all" ||
    Boolean(slaStatus) ||
    Boolean(serviceResult) ||
    Boolean(dateFrom) ||
    Boolean(dateTo);

  function resetFilters() {
    setSearch("");
    setPoStatus("");
    setSourceType("all");
    setSlaStatus("");
    setServiceResult("");
    setDateFrom("");
    setDateTo("");
    setPage(1);
  }

  const cardAnimationClass =
    "transition-all duration-200 ease-in-out cursor-pointer hover:-translate-y-1 active:scale-95 active:translate-y-0 select-none";

  return (
    <div className="min-h-screen bg-[#F5F7FA] pb-16">
      {/* ── Toast Notification Floating ── */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-2.5 bg-slate-900 text-white text-xs px-4 py-3 rounded-2xl shadow-xl border border-slate-700/80 animate-in fade-in slide-in-from-top-3 duration-300">
          <CheckCircle size={16} className="text-emerald-400 shrink-0" />
          <span className="font-medium">{toastMessage}</span>
        </div>
      )}

      {/* ── 1. PageHeader Banner (Navy Blue & Gold Diagonal) ── */}
      <PageHeader
        title="Service Log"
        subtitle="Laporan catatan pengadaan jasa, perbaikan, & pemeliharaan teknis — terhubung langsung ke inventaris aset, SLA, dan berita acara."
        containerClassName="px-7 pt-5 pb-2"
      >
        <button
          type="button"
          onClick={() => setIsFormModalOpen(true)}
          className="bg-white hover:bg-slate-50 text-slate-900 font-bold px-4 py-2.5 rounded-xl text-xs transition-all shadow-md active:scale-95 flex items-center gap-2 cursor-pointer border border-white/40"
        >
          <Plus size={16} className="text-amber-600 stroke-[3]" />
          <span>Catat Service Log</span>
        </button>
      </PageHeader>

      {/* ── 2. Pembungkus Konten Utama ── */}
      <div className="flex flex-col gap-6 px-7 py-5">
        {/* ── Top Overview Card: Banner & 4 KPI Cards ── */}
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
                    Status Operasional & Kepatuhan SLA Pengadaan Jasa
                  </h2>
                  <span
                    className={`text-[11px] font-bold font-mono ${
                      completionPercentage < 60 ? "text-amber-600" : "text-emerald-700"
                    }`}
                  >
                    {completionPercentage}% Selesai (GRN / BA Servis)
                  </span>
                </div>
                <div className="w-full bg-emerald-100/60 h-1.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      completionPercentage < 60 ? "bg-amber-500" : "bg-emerald-600"
                    }`}
                    style={{ width: `${completionPercentage}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-white px-4 py-2.5 rounded-xl border border-emerald-200/80 w-full sm:w-auto justify-between sm:justify-end shadow-xs shrink-0">
              <div className="flex items-center gap-2 text-slate-600 text-xs font-medium">
                <Coins size={15} className="text-amber-500" />
                <span>Total Belanja / Biaya Jasa:</span>
              </div>
              <span className="text-xs font-bold text-slate-800 font-mono">
                {formatCurrency(totalAmount)}
              </span>
            </div>
          </div>

          {/* 4 Kartu Statistik Interaktif */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Total Transaksi Jasa */}
            <button
              type="button"
              onClick={() => {
                setPoStatus("");
                setSourceType("all");
                setPage(1);
              }}
              className={`w-full text-left p-5 rounded-xl border bg-white shadow-sm flex items-center gap-4 focus:outline-none ${cardAnimationClass} ${
                poStatus === "" && sourceType === "all"
                  ? "border-blue-500 ring-2 ring-blue-500/20 shadow-md"
                  : "border-slate-200/80 hover:border-blue-300 hover:shadow-md"
              }`}
            >
              <div className="p-3 bg-blue-50 text-blue-600 rounded-xl shrink-0">
                <Wrench size={22} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide truncate">
                  Total Log Servis
                </p>
                <h3 className="text-2xl font-bold text-slate-800 mt-0.5">
                  {formatNumber(totalLines)}{" "}
                  <span className="text-xs font-normal text-slate-400">Transaksi</span>
                </h3>
              </div>
            </button>

            {/* Card 2: Sudah Selesai (GRN / BA) */}
            <button
              type="button"
              onClick={() => {
                setServiceResult("completed");
                setPage(1);
              }}
              className={`w-full text-left p-5 rounded-xl border bg-white shadow-sm flex items-center gap-4 focus:outline-none ${cardAnimationClass} ${
                serviceResult === "completed"
                  ? "border-emerald-500 ring-2 ring-emerald-500/20 shadow-md"
                  : "border-slate-200/80 hover:border-emerald-300 hover:shadow-md"
              }`}
            >
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl shrink-0">
                <CheckCircle2 size={22} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide truncate">
                  Selesai Normal (BA/GRN)
                </p>
                <h3 className="text-2xl font-bold text-slate-800 mt-0.5">
                  {formatNumber(receivedCount)}{" "}
                  <span className="text-xs font-normal text-slate-400">Tuntas</span>
                </h3>
              </div>
            </button>

            {/* Card 3: Menunggu / Dalam Pengerjaan */}
            <button
              type="button"
              onClick={() => {
                setServiceResult("in_progress");
                setPage(1);
              }}
              className={`w-full text-left p-5 rounded-xl border bg-white shadow-sm flex items-center gap-4 focus:outline-none ${cardAnimationClass} ${
                serviceResult === "in_progress"
                  ? "border-amber-500 ring-2 ring-amber-500/20 shadow-md"
                  : "border-slate-200/80 hover:border-amber-300 hover:shadow-md"
              }`}
            >
              <div className="p-3 bg-amber-50 text-amber-600 rounded-xl shrink-0">
                <Clock size={22} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide truncate">
                  Dalam Pengerjaan
                </p>
                <h3 className="text-2xl font-bold text-slate-800 mt-0.5">
                  {formatNumber(pendingCount)}{" "}
                  <span className="text-xs font-normal text-slate-400">Proses</span>
                </h3>
              </div>
            </button>

            {/* Card 4: Total Nilai Jasa */}
            <div
              className={`p-5 rounded-xl border bg-white shadow-sm flex items-center gap-4 border-slate-200/80`}
            >
              <div className="p-3 bg-purple-50 text-purple-600 rounded-xl shrink-0">
                <DollarSign size={22} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide truncate">
                  Total Nilai Belanja
                </p>
                <h3 className="text-xl font-bold text-slate-800 mt-0.5 truncate">
                  {formatCurrency(totalAmount)}
                </h3>
              </div>
            </div>
          </div>
        </div>

        {/* ── Main Data Card: Toolbar and Service Log Table ── */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm flex flex-col gap-5">
          {/* ── Toolbar: Search & Dynamic Filters ── */}
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              {/* Search Box */}
              <div className="relative flex-1 min-w-[280px]">
                <Search
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="text"
                  placeholder="Cari deskripsi jasa, teknisi, vendor, aset, atau nomor PO/BA..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  className="w-full pl-9 pr-9 py-2 bg-slate-50 border border-slate-200/90 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all placeholder:text-slate-400"
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

              {/* Quick Link to Purchase Orders */}
              <Link
                to="/procurement-inventory/purchase-orders"
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium px-3.5 py-2 rounded-xl text-sm transition-all border border-slate-200 active:scale-95 flex items-center gap-1.5 shrink-0"
              >
                <FileText size={15} />
                <span>Daftar Purchase Order</span>
                <ArrowRight size={13} className="text-slate-400" />
              </Link>
            </div>

            {/* Filter Baris Kedua: Sumber, Status PO, SLA, Tanggal */}
            <div className="flex flex-wrap items-center gap-2.5 pt-1 border-t border-slate-100">
              {/* Filter Sumber Servis */}
              <div className="flex items-center bg-slate-100/90 p-1 rounded-xl text-xs font-medium">
                <button
                  type="button"
                  onClick={() => {
                    setSourceType("all");
                    setPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    sourceType === "all"
                      ? "bg-white text-slate-800 shadow-xs font-bold"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Semua Sumber
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSourceType("po");
                    setPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    sourceType === "po"
                      ? "bg-white text-blue-700 shadow-xs font-bold"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  PO Rekanan Jasa
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSourceType("internal");
                    setPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    sourceType === "internal"
                      ? "bg-white text-purple-700 shadow-xs font-bold"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Servis Internal (Non-PO)
                </button>
              </div>

              {/* Status PO Filter */}
              <select
                value={poStatus}
                onChange={(e) => {
                  setPoStatus(e.target.value as PoStatus | "");
                  setPage(1);
                }}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200/90 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all font-medium"
              >
                <option value="">Semua Status PO</option>
                {Object.entries(PO_STATUS_LABELS).map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </select>

              {/* Status SLA Filter */}
              <select
                value={slaStatus}
                onChange={(e) => {
                  setSlaStatus(e.target.value as ServiceSlaStatus | "");
                  setPage(1);
                }}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200/90 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all font-medium"
              >
                <option value="">Semua Status SLA</option>
                {Object.entries(SERVICE_SLA_LABELS).map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </select>

              {/* Date Filter: From and To */}
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200/90 rounded-xl px-2.5 py-1 text-xs">
                <Calendar size={13} className="text-slate-400 shrink-0" />
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => {
                    setDateFrom(e.target.value);
                    setPage(1);
                  }}
                  className="bg-transparent text-xs text-slate-700 focus:outline-none font-mono"
                  title="Dari tanggal"
                />
                <span className="text-slate-300 text-xs">s/d</span>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => {
                    setDateTo(e.target.value);
                    setPage(1);
                  }}
                  className="bg-transparent text-xs text-slate-700 focus:outline-none font-mono"
                  title="Sampai tanggal"
                />
              </div>

              {/* Reset Filter Button */}
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="px-2.5 py-1.5 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition-all font-medium flex items-center gap-1 cursor-pointer"
                >
                  <FilterX size={13} />
                  <span>Reset Filter</span>
                </button>
              )}
            </div>
          </div>

          {/* ── Table Content ── */}
          {isLoading && <LoadingState />}

          {!isLoading && data && data.data.length === 0 && (
            <EmptyState
              title="Belum Ada Catatan Service Log"
              subtitle={
                hasActiveFilters
                  ? "Tidak ada transaksi atau log servis yang cocok dengan kriteria filter."
                  : "Baris PO bertipe 'Jasa' atau servis internal non-PO yang dicatat akan muncul di sini."
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
                        <th className="px-4 py-3 min-w-[200px]">Deskripsi Pekerjaan / Jasa</th>
                        <th className="px-4 py-3 min-w-[180px]">Aset Terkait</th>
                        <th className="px-4 py-3">No. PO / Ref</th>
                        <th className="px-4 py-3 min-w-[170px]">Teknisi / Vendor</th>
                        <th className="px-4 py-3 whitespace-nowrap">Tgl Servis</th>
                        <th className="px-4 py-3 text-right whitespace-nowrap">Kuantitas</th>
                        <th className="px-4 py-3 text-right whitespace-nowrap">Total Nilai</th>
                        <th className="px-4 py-3 min-w-[140px]">Hasil / BA Servis</th>
                        <th className="px-4 py-3 whitespace-nowrap">SLA</th>
                        <th className="px-3 py-3 text-center">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {data.data.map((line) => {
                        const grLine = line.goods_receipt_lines?.[0];
                        const grn = grLine?.goods_receipt;
                        const po = line.purchase_order;
                        const isInternal = line.source_type === "internal";

                        const resultStatus: ServiceResultStatus =
                          line.service_result ||
                          (grn?.status === "posted" ? "completed" : "in_progress");
                        const slaStat: ServiceSlaStatus =
                          line.sla_status ||
                          (resultStatus === "completed" ? "on_time" : "in_progress");

                        return (
                          <tr
                            key={line.id}
                            className="hover:bg-slate-50/60 transition-colors"
                          >
                            {/* 1. Deskripsi & Badge Sumber */}
                            <td className="px-4 py-3">
                              <div className="flex flex-col gap-1">
                                <div className="font-semibold text-slate-800 text-xs line-clamp-2">
                                  {line.description}
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <span
                                    className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                                      isInternal
                                        ? "bg-purple-50 text-purple-700 border-purple-200"
                                        : "bg-blue-50 text-blue-700 border-blue-200"
                                    }`}
                                  >
                                    {isInternal ? "Internal" : "PO Rekanan"}
                                  </span>
                                  {line.ba_file_name && (
                                    <span
                                      className="inline-flex items-center gap-0.5 text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200/80 font-medium"
                                      title={line.ba_file_name}
                                    >
                                      <FileText size={10} />
                                      <span>BA Terlampir</span>
                                    </span>
                                  )}
                                </div>
                              </div>
                            </td>

                            {/* 2. Penyambung ke Aset Terkait */}
                            <td className="px-4 py-3">
                              {line.asset ? (
                                <div className="flex flex-col gap-0.5 max-w-[200px]">
                                  <div className="flex items-center gap-1 font-semibold text-slate-800 text-xs truncate">
                                    <Laptop size={12} className="text-amber-500 shrink-0" />
                                    <span className="truncate">{line.asset.asset_name}</span>
                                  </div>
                                  <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-500">
                                    <span className="bg-slate-100 px-1 py-0.2 rounded border border-slate-200/60">
                                      {line.asset.asset_number}
                                    </span>
                                    {line.asset.category && (
                                      <span className="capitalize text-slate-400 truncate">
                                        • {line.asset.category}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => setLinkingItem(line)}
                                  className="inline-flex items-center gap-1 px-2 py-1 rounded-lg border border-dashed border-slate-300 hover:border-amber-400 bg-slate-50/60 hover:bg-amber-50/40 text-slate-500 hover:text-amber-800 text-xs font-medium transition-all cursor-pointer"
                                  title="Tautkan transaksi jasa ini ke aset inventaris spesifik"
                                >
                                  <Plus size={12} className="text-amber-600" />
                                  <span>+ Hubungkan Aset</span>
                                </button>
                              )}
                            </td>

                            {/* 3. No. PO / Ref */}
                            <td className="px-4 py-3 whitespace-nowrap text-xs font-mono">
                              {po ? (
                                <div className="flex flex-col">
                                  <Link
                                    to="/procurement-inventory/purchase-orders"
                                    className="text-blue-600 hover:text-blue-700 hover:underline font-semibold"
                                    title="Lihat detail Purchase Order"
                                  >
                                    {po.po_number}
                                  </Link>
                                  {po.purchase_request?.pr_number && (
                                    <span className="text-[10px] text-slate-400">
                                      PR: {po.purchase_request.pr_number}
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <span className="font-semibold text-slate-700">
                                  {line.service_number || `SRV-${line.id}`}
                                </span>
                              )}
                            </td>

                            {/* 4. Teknisi / Vendor */}
                            <td className="px-4 py-3 text-xs text-slate-700">
                              <div className="flex flex-col gap-0.5">
                                <div className="flex items-center gap-1.5 font-medium text-slate-800">
                                  {line.provider_type === "internal" ? (
                                    <User size={13} className="text-purple-500 shrink-0" />
                                  ) : (
                                    <Building2 size={13} className="text-blue-500 shrink-0" />
                                  )}
                                  <span className="truncate">
                                    {line.technician_name ||
                                      line.vendor_name ||
                                      po?.vendor?.vendor_name ||
                                      "—"}
                                  </span>
                                </div>
                                {line.vendor_name && line.technician_name && (
                                  <span className="text-[10px] text-slate-400 truncate">
                                    {line.vendor_name}
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* 5. Tanggal Pelaksanaan Servis */}
                            <td className="px-4 py-3 whitespace-nowrap text-xs text-slate-600">
                              {line.service_date ? (
                                <div className="flex items-center gap-1.5 font-mono">
                                  <Calendar size={13} className="text-slate-400" />
                                  <span>{formatDate(line.service_date)}</span>
                                </div>
                              ) : (
                                "—"
                              )}
                            </td>

                            {/* 6. Kuantitas (Satuan Dinamis: Paket, Jam, Hari, Kali, dsb.) */}
                            <td className="px-4 py-3 whitespace-nowrap text-right font-mono text-xs text-slate-700">
                              <span className="font-bold">{line.quantity}</span>{" "}
                              <span className="text-slate-500 lowercase">{line.uom}</span>
                            </td>

                            {/* 7. Total Nilai */}
                            <td className="px-4 py-3 whitespace-nowrap text-right font-mono font-bold text-xs text-slate-900">
                              {formatCurrency(line.amount)}
                            </td>

                            {/* 8. Hasil / BA Servis */}
                            <td className="px-4 py-3">
                              <div className="flex flex-col gap-1">
                                <span
                                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border w-fit ${
                                    SERVICE_RESULT_BADGES[resultStatus] ??
                                    "bg-slate-100 text-slate-700 border-slate-200"
                                  }`}
                                >
                                  <CheckCircle2 size={11} />
                                  <span>{SERVICE_RESULT_LABELS[resultStatus] ?? resultStatus}</span>
                                </span>
                                {(line.ba_number || grn?.grn_number) && (
                                  <span className="text-[10px] font-mono text-slate-500">
                                    {line.ba_number || `BAST-${grn?.grn_number}`}
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* 9. SLA */}
                            <td className="px-4 py-3 whitespace-nowrap">
                              <span
                                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                                  SERVICE_SLA_BADGES[slaStat] ??
                                  "bg-slate-100 text-slate-700 border-slate-200"
                                }`}
                              >
                                <Clock size={11} />
                                <span>{SERVICE_SLA_LABELS[slaStat] ?? slaStat}</span>
                              </span>
                            </td>

                            {/* 10. Aksi: Detail Modal */}
                            <td className="px-3 py-3 text-center whitespace-nowrap">
                              <button
                                type="button"
                                onClick={() => setDetailItem(line)}
                                className="px-2.5 py-1 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-all active:scale-95 inline-flex items-center gap-1 cursor-pointer"
                                title="Lihat detail lengkap Berita Acara & Servis"
                              >
                                <span>Detail</span>
                                <ChevronRight size={12} className="text-slate-400" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Pagination */}
              <Pagination
                currentPage={data.current_page}
                lastPage={data.last_page}
                total={data.total}
                onPageChange={setPage}
              />
            </>
          )}
        </div>
      </div>

      {/* ── Modals ── */}
      {/* 1. Modal Catat Service Log (Servis Internal) */}
      {isFormModalOpen && (
        <ServiceLogFormModal
          onClose={() => setIsFormModalOpen(false)}
          onSuccess={(msg) => triggerToast(msg)}
        />
      )}

      {/* 2. Modal Detail Service Log */}
      {detailItem && (
        <ServiceLogDetailModal
          item={detailItem}
          onClose={() => setDetailItem(null)}
          onLinkAssetClick={() => {
            const target = detailItem;
            setDetailItem(null);
            setLinkingItem(target);
          }}
        />
      )}

      {/* 3. Modal Hubungkan Aset */}
      {linkingItem && (
        <LinkAssetModal
          item={linkingItem}
          onClose={() => setLinkingItem(null)}
          onSuccess={(msg) => triggerToast(msg)}
        />
      )}
    </div>
  );
}
