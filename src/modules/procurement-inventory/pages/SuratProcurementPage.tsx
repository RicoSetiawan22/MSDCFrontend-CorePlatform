import { useState, useMemo } from "react";
import {
  Search,
  Plus,
  X,
  FileText,
  Clock,
  CheckCircle2,
  Calendar,
  FilterX,
  Eye,
  FileCheck2,
  Archive,
} from "lucide-react";
import { useDocumentList, useDocumentTypes } from "@modules/document-management/api/useDocuments";
import { SuratProcurementFormModal } from "../components/SuratProcurementFormModal";
import { DocumentDetailModal } from "@modules/document-management/components/DocumentDetailModal";
import {
  DOCUMENT_STATUS_LABELS,
  type DocumentStatus,
} from "@modules/document-management/types/document";
import { PageHeader } from "@shared/components/PageHeader";
import { EmptyState } from "@shared/components/EmptyState";
import { LoadingState } from "@shared/components/LoadingState";
import { Pagination } from "@shared/components/Pagination";
import { useAuth } from "@shared/lib/auth-context";
import { formatDate } from "@shared/lib/format";

const STATUS_BADGE_CLASSES: Record<DocumentStatus, string> = {
  draft: "bg-slate-100 text-slate-700 border-slate-200",
  pending_approval: "bg-amber-50 text-amber-700 border-amber-200/80",
  approved: "bg-emerald-50 text-emerald-700 border-emerald-200/80",
  rejected: "bg-rose-50 text-rose-700 border-rose-200/80",
  archived: "bg-indigo-50 text-indigo-700 border-indigo-200/80",
};

export function SuratProcurementPage() {
  const { hasPermission } = useAuth();
  const canManage = hasPermission("document.manage");

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<DocumentStatus | "">("");
  const [showForm, setShowForm] = useState(false);
  const [detailId, setDetailId] = useState<number | null>(null);

  const { data: types } = useDocumentTypes();
  const availableTypes = useMemo(
    () => types?.filter((t) => t.meta.module === "procurement-inventory") ?? [],
    [types]
  );

  const { data, isLoading } = useDocumentList({
    module_code: "procurement-inventory",
    page,
    per_page: 20,
    document_type: typeFilter || undefined,
    status: statusFilter || undefined,
    search: search || undefined,
  });

  const documents = useMemo(() => data?.data ?? [], [data]);

  // KPI Calculations
  const totalDocuments = data?.total ?? 0;
  const pendingCount = useMemo(
    () => documents.filter((d) => d.status === "pending_approval").length,
    [documents]
  );
  const approvedCount = useMemo(
    () => documents.filter((d) => d.status === "approved").length,
    [documents]
  );
  const archivedCount = useMemo(
    () => documents.filter((d) => d.status === "archived").length,
    [documents]
  );

  const completionPercentage =
    totalDocuments > 0
      ? Math.round(((approvedCount + archivedCount) / totalDocuments) * 100)
      : 100;

  const cardAnimationClass =
    "transition-all duration-200 ease-in-out cursor-pointer hover:-translate-y-1 active:scale-95 active:translate-y-0 select-none";

  return (
    <div className="min-h-screen bg-[#F5F7FA] pb-16">
      {/* ── 1. PageHeader Banner (Navy Blue & Gold Diagonal) ── */}
      <PageHeader
        title="Surat Procurement"
        subtitle="Daftar surat resmi operasional Procurement & Inventory MSDC — surat jalan, serah terima, dan korespondensi logistik."
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
                    Status Dokumen Surat Procurement
                  </h2>
                  <span className="text-[11px] font-bold font-mono text-emerald-700">
                    {completionPercentage}% Disetujui / Selesai
                  </span>
                </div>
                <div className="w-full bg-emerald-100/60 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-600 transition-all duration-300"
                    style={{ width: `${completionPercentage}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-white px-4 py-2.5 rounded-xl border border-emerald-200/80 w-full sm:w-auto justify-between sm:justify-end shadow-xs shrink-0">
              <div className="flex items-center gap-2 text-slate-600 text-xs font-medium">
                <FileText size={15} className="text-amber-500" />
                <span>Total Surat:</span>
              </div>
              <span className="text-xs font-bold text-slate-800 font-mono">
                {totalDocuments} Berkas
              </span>
            </div>
          </div>

          {/* 4 Kartu Statistik Interaktif */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Total Dokumen */}
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
                <FileText size={22} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide truncate">
                  Total Surat
                </p>
                <h3 className="text-2xl font-bold text-slate-800 mt-0.5">
                  {totalDocuments}{" "}
                  <span className="text-xs font-normal text-slate-400">Berkas</span>
                </h3>
              </div>
            </button>

            {/* Card 2: Menunggu Approval */}
            <button
              type="button"
              onClick={() => {
                setStatusFilter(statusFilter === "pending_approval" ? "" : "pending_approval");
                setPage(1);
              }}
              className={`w-full text-left p-5 rounded-xl border bg-white shadow-sm flex items-center gap-4 focus:outline-none ${cardAnimationClass} ${
                statusFilter === "pending_approval"
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
                  {pendingCount}{" "}
                  <span className="text-xs font-normal text-slate-400">Surat</span>
                </h3>
              </div>
            </button>

            {/* Card 3: Disetujui */}
            <button
              type="button"
              onClick={() => {
                setStatusFilter(statusFilter === "approved" ? "" : "approved");
                setPage(1);
              }}
              className={`w-full text-left p-5 rounded-xl border bg-white shadow-sm flex items-center gap-4 focus:outline-none ${cardAnimationClass} ${
                statusFilter === "approved"
                  ? "border-emerald-500 ring-2 ring-emerald-500/20 shadow-md"
                  : "border-slate-200/80 hover:border-emerald-300 hover:shadow-md"
              }`}
            >
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl shrink-0">
                <CheckCircle2 size={22} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide truncate">
                  Disetujui
                </p>
                <h3 className="text-2xl font-bold text-emerald-600 mt-0.5">
                  {approvedCount}{" "}
                  <span className="text-xs font-normal text-slate-400">Dokumen</span>
                </h3>
              </div>
            </button>

            {/* Card 4: Diarsipkan */}
            <button
              type="button"
              onClick={() => {
                setStatusFilter(statusFilter === "archived" ? "" : "archived");
                setPage(1);
              }}
              className={`w-full text-left p-5 rounded-xl border bg-white shadow-sm flex items-center gap-4 focus:outline-none ${cardAnimationClass} ${
                statusFilter === "archived"
                  ? "border-purple-500 ring-2 ring-purple-500/20 shadow-md"
                  : "border-slate-200/80 hover:border-purple-300 hover:shadow-md"
              }`}
            >
              <div className="p-3 bg-purple-50 text-purple-600 rounded-xl shrink-0">
                <Archive size={22} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide truncate">
                  Diarsipkan
                </p>
                <h3 className="text-2xl font-bold text-purple-600 mt-0.5">
                  {archivedCount}{" "}
                  <span className="text-xs font-normal text-slate-400">Surat</span>
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
                  placeholder="Cari nomor surat, perihal, atau tujuan..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-amber-500 transition-all"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearch("");
                      setPage(1);
                    }}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded-full cursor-pointer"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* Jenis Surat Filter Dropdown */}
              {availableTypes.length > 0 && (
                <select
                  value={typeFilter}
                  onChange={(e) => {
                    setTypeFilter(e.target.value);
                    setPage(1);
                  }}
                  className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:bg-white focus:outline-none focus:border-amber-500 transition-all cursor-pointer"
                >
                  <option value="">Semua Jenis Surat</option>
                  {availableTypes.map((t) => (
                    <option key={t.code} value={t.code}>
                      {t.label}
                    </option>
                  ))}
                </select>
              )}

              {/* Status Filter Dropdown */}
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value as DocumentStatus | "");
                  setPage(1);
                }}
                className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:bg-white focus:outline-none focus:border-amber-500 transition-all cursor-pointer"
              >
                <option value="">Semua Status</option>
                {Object.entries(DOCUMENT_STATUS_LABELS).map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </select>

              {(typeFilter || statusFilter) && (
                <button
                  type="button"
                  onClick={() => {
                    setTypeFilter("");
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
                onClick={() => setShowForm(true)}
                className="flex items-center justify-center gap-1.5 bg-amber-500 hover:bg-amber-600 active:scale-95 text-white font-medium px-4 py-2 rounded-xl text-sm transition-all shadow-xs cursor-pointer shrink-0"
              >
                <Plus size={16} />
                <span>Surat Baru</span>
              </button>
            )}
          </div>

          {isLoading && <LoadingState />}
          {!isLoading && documents.length === 0 && (
            <EmptyState
              title="Belum Ada Surat Procurement"
              subtitle='Klik "Surat Baru" untuk membuat surat atau berkas operasional pertama.'
            />
          )}

          {!isLoading && documents.length > 0 && (
            <div className="border border-slate-200/90 rounded-xl overflow-hidden mt-1">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-200/90 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      <th className="py-3.5 px-4">No. Surat</th>
                      <th className="py-3.5 px-4">Perihal / Judul</th>
                      <th className="py-3.5 px-4">Tujuan</th>
                      <th className="py-3.5 px-4">Tanggal Terbit</th>
                      <th className="py-3.5 px-4">Status</th>
                      <th className="py-3.5 px-4 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                    {documents.map((doc) => (
                      <tr
                        key={doc.id}
                        onClick={() => setDetailId(doc.id)}
                        className="hover:bg-slate-50/60 transition-colors cursor-pointer"
                      >
                        <td className="py-3.5 px-4 font-mono text-xs font-bold text-slate-800">
                          {doc.document_number}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-medium text-slate-900">{doc.title}</div>
                          {doc.document_type && (
                            <span className="inline-block mt-0.5 text-[10px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                              {doc.document_type}
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-xs text-slate-700">
                          {doc.issued_to_name ?? "—"}
                        </td>
                        <td className="py-3.5 px-4 text-xs text-slate-600 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <Calendar size={13} className="text-slate-400 shrink-0" />
                            <span>{doc.issued_date ? formatDate(doc.issued_date) : "—"}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                                STATUS_BADGE_CLASSES[doc.status] ??
                                "bg-slate-100 text-slate-700 border-slate-200"
                              }`}
                            >
                              {DOCUMENT_STATUS_LABELS[doc.status]}
                            </span>
                            {doc.file?.is_signed && (
                              <span
                                title="Sudah ditandatangani"
                                className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-md"
                              >
                                <FileCheck2 size={12} />
                                <span>TTD</span>
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDetailId(doc.id);
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 bg-white text-slate-600 hover:text-amber-600 hover:bg-amber-50 hover:border-amber-300 text-xs font-medium transition-all cursor-pointer shadow-2xs"
                          >
                            <Eye size={13} className="text-amber-500" />
                            <span>Detail</span>
                          </button>
                        </td>
                      </tr>
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

      {showForm && (
        <SuratProcurementFormModal
          onClose={() => setShowForm(false)}
          onCreated={(doc) => {
            setShowForm(false);
            setDetailId(doc.id);
          }}
        />
      )}

      {detailId && (
        <DocumentDetailModal documentId={detailId} onClose={() => setDetailId(null)} />
      )}
    </div>
  );
}
