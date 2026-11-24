import { useState } from "react";
import { Search, Mail, Clock, CheckCircle2, FileText, Eye, Trash2, LayoutGrid, List, Upload, ChevronDown } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { extractErrorMessage } from "@shared/types/api";
import { LoadingState } from "@shared/components/LoadingState";
import { Pagination } from "@shared/components/Pagination";
import { formatDate } from "@shared/lib/format";
import { useDocumentList, useDocumentTypes } from "../api/useDocuments";
import { documentApi } from "../api/documentApi";
import { QuickUploadDocumentModal } from "../components/QuickUploadDocumentModal";
import { DocumentDetailModal } from "../components/DocumentDetailModal";
import { DocumentGalleryCard } from "../components/DocumentGalleryCard";
import { DOCUMENT_STATUS_LABELS, DOCUMENT_STATUS_COLORS } from "../types/document";
import type { DocumentStatus, DocumentListItem } from "../types/document";
import { PageHeader } from "@shared/components/PageHeader";

export function SuratMasukListPage() {
  const [page, setPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<DocumentStatus | "">("");
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [isDownloadingGuide, setIsDownloadingGuide] = useState(false);
  
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [detailId, setDetailId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const qc = useQueryClient();

  async function handleDelete(doc: DocumentListItem) {
    if (!window.confirm(`Hapus surat ${doc.document_number} (${doc.title})?`)) return;
    try {
      setDeletingId(doc.id);
      await documentApi.delete(doc.id);
      await qc.invalidateQueries({ queryKey: ["documents"] });
      refetch();
    } catch (err) {
      alert(extractErrorMessage(err));
    } finally {
      setDeletingId(null);
    }
  }

  async function handleDownloadGuide() {
    try {
      setIsDownloadingGuide(true);
      const res = await documentApi.incomingGuidePdf();
      const blob = new Blob([res.data], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");
    } catch (err) {
      console.error("Gagal membuka petunjuk persuratan:", err);
      alert("Gagal mengunduh buku petunjuk persuratan.");
    } finally {
      setIsDownloadingGuide(false);
    }
  }

  const { data: types } = useDocumentTypes();
  const { data, isLoading, refetch } = useDocumentList({
    direction: "masuk", 
    page, 
    per_page: 24,
    document_type: typeFilter || undefined,
    status: statusFilter || undefined,
    search: search || undefined,
  });

  const availableTypes = types?.filter(t => t.meta.direction === "masuk") || types;
  // Metrik KPI ala DataOps
  const totalCount = data?.total ?? data?.data?.length ?? 0;
  const pendingCount = data?.data?.filter(d => d.status === "pending_approval" || d.status === "draft").length ?? 0;
  const completedCount = data?.data?.filter(d => d.status === "approved").length ?? 0;
  const archivedCount = data?.data?.filter(d => d.status === "archived").length ?? 0;

  return (
    <main className="w-full bg-slate-50 min-h-screen font-sans">
      <PageHeader 
        title="Surat Masuk" 
        subtitle="Surat/dokumen yang diterima dari pihak luar — dicatat, diberi nomor agenda resmi, dan diarsipkan secara digital." 
      />

      <div className="px-7 py-5 space-y-6">
        {/* Grid 4 Kotak Kartu Metrik ala DataOps */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 1. Total Surat */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-[0_2px_8px_rgba(0,0,0,0.04)] flex flex-col justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Mail size={18} />
              </div>
              <span className="text-[11px] font-bold text-slate-400 tracking-wider uppercase">TOTAL SURAT</span>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-extrabold text-slate-800">{totalCount}</div>
              <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-500 font-medium">
                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                <span>Keseluruhan Tercatat</span>
              </div>
            </div>
          </div>

          {/* 2. Perlu Tindakan */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-[0_2px_8px_rgba(0,0,0,0.04)] flex flex-col justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Clock size={18} />
              </div>
              <span className="text-[11px] font-bold text-slate-400 tracking-wider uppercase">PERLU TINDAKAN</span>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-extrabold text-slate-800">{pendingCount}</div>
              <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-500 font-medium">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                <span>Menunggu Verifikasi</span>
              </div>
            </div>
          </div>

          {/* 3. Terdisposisi */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-[0_2px_8px_rgba(0,0,0,0.04)] flex flex-col justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 size={18} />
              </div>
              <span className="text-[11px] font-bold text-slate-400 tracking-wider uppercase">TERDISPOSISI</span>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-extrabold text-slate-800">{completedCount}</div>
              <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-500 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span>Tindak Lanjut Selesai</span>
              </div>
            </div>
          </div>

          {/* 4. Arsip Berkas */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-[0_2px_8px_rgba(0,0,0,0.04)] flex flex-col justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <FileText size={18} />
              </div>
              <span className="text-[11px] font-bold text-slate-400 tracking-wider uppercase">ARSIP BERKAS</span>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-extrabold text-slate-800">{archivedCount}</div>
              <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-500 font-medium">
                <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                <span>Tersimpan di Dokumen</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Card Container */}
        <section className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          {/* Filter & Action Toolbar */}
          <div className="p-4 md:p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex flex-1 flex-col sm:flex-row items-center gap-3">
              {/* Dropdown Filter Jenis */}
              <div className="relative min-w-[200px] w-full sm:w-auto">
                <select 
                  className="w-full bg-white border border-slate-300 text-slate-700 text-xs font-medium rounded-lg px-3.5 py-2.5 pr-8 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 appearance-none cursor-pointer shadow-2xs"
                  value={typeFilter}
                  onChange={e => { setTypeFilter(e.target.value); setPage(1); }}
                >
                  <option value="">Semua Jenis Surat</option>
                  {availableTypes?.map(t => <option key={t.code} value={t.code}>{t.label}</option>)}
                </select>
                <ChevronDown size={15} className="text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              {/* Dropdown Filter Status */}
              <div className="relative min-w-[170px] w-full sm:w-auto">
                <select 
                  className="w-full bg-white border border-slate-300 text-slate-700 text-xs font-medium rounded-lg px-3.5 py-2.5 pr-8 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 appearance-none cursor-pointer shadow-2xs"
                  value={statusFilter}
                  onChange={e => { setStatusFilter(e.target.value as DocumentStatus | ""); setPage(1); }}
                >
                  <option value="">Semua Status</option>
                  {Object.entries(DOCUMENT_STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
                <ChevronDown size={15} className="text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              {/* Search Input */}
              <div className="relative flex-1 max-w-md w-full sm:w-auto">
                <Search size={15} className="text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input 
                  type="text"
                  className="w-full bg-slate-50/70 border border-slate-200 text-slate-700 text-xs rounded-lg pl-9 pr-4 py-2.5 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 placeholder-slate-400 transition" 
                  placeholder="Cari nomor surat, perihal, atau pengirim..." 
                  value={search}
                  onChange={e => { setSearch(e.target.value); setPage(1); }}
                />
              </div>
            </div>
            
            <div className="flex items-center gap-2 self-end md:self-auto">
              {/* View Mode Switcher */}
              <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 shadow-2xs">
                <button
                  type="button"
                  onClick={() => setViewMode("grid")}
                  className={`p-1.5 rounded-md text-xs transition flex items-center gap-1.5 ${
                    viewMode === "grid"
                      ? "bg-white text-amber-600 shadow-xs font-bold"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                  title="Mode Galeri Card (ala Manajemen Gambar)"
                >
                  <LayoutGrid size={15} />
                  <span className="text-[11px]">Galeri</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("table")}
                  className={`p-1.5 rounded-md text-xs transition flex items-center gap-1.5 ${
                    viewMode === "table"
                      ? "bg-white text-amber-600 shadow-xs font-bold"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                  title="Mode Tabel Data"
                >
                  <List size={15} />
                  <span className="text-[11px]">Tabel</span>
                </button>
              </div>

              <button
                onClick={handleDownloadGuide}
                disabled={isDownloadingGuide}
                className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-medium text-xs shadow-2xs transition disabled:opacity-50"
                type="button"
                title="Unduh Buku Petunjuk Persuratan PDF"
              >
                <FileText className="w-3.5 h-3.5 text-amber-500" />
                <span className="hidden sm:inline">{isDownloadingGuide ? "Membuka..." : "Buku Petunjuk"}</span>
              </button>

              <button 
                onClick={() => { setSearch(""); setTypeFilter(""); setStatusFilter(""); setPage(1); refetch(); }} 
                className="p-2 text-slate-400 hover:text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-2xs" 
                title="Reset / Refresh"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                </svg>
              </button>

              {/* Tombol Upload Surat Masuk Simpel */}
              <button 
                onClick={() => setShowUploadModal(true)} 
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white text-xs font-semibold rounded-lg shadow-sm hover:shadow transition-all duration-150" 
                type="button"
              >
                <Upload className="w-4 h-4" />
                <span>Upload Surat Masuk</span>
              </button>
            </div>
          </div>

          {isLoading && <LoadingState />}

          {!isLoading && (data?.data.length ?? 0) === 0 && (
            <div className="p-12 text-center border-2 border-dashed border-slate-200 rounded-2xl m-6 bg-slate-50/50">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-3 shadow-xs">
                <Mail size={24} />
              </div>
              <h3 className="text-sm font-bold text-slate-800 mb-1">Belum Ada Surat Masuk</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mb-5">
                Belum ada surat masuk yang sesuai filter. Unggah berkas scan PDF atau gambar surat masuk dengan cepat.
              </p>
              <button 
                onClick={() => setShowUploadModal(true)} 
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-amber-500 hover:bg-amber-600 rounded-lg shadow-sm transition" 
                type="button"
              >
                <Upload className="w-4 h-4" />
                <span>Upload Surat Masuk Sekarang</span>
              </button>
            </div>
          )}

          {!isLoading && (data?.data.length ?? 0) > 0 && (
            <>
              {/* ===== VIEW MODE 1: GRID GALERI CARD (ALA IMAGE MANAGEMENT) ===== */}
              {viewMode === "grid" ? (
                <div className="p-5 md:p-6 bg-slate-50/30">
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                    {data!.data.map(doc => (
                      <DocumentGalleryCard
                        key={doc.id}
                        doc={doc}
                        onView={() => setDetailId(doc.id)}
                        onDelete={() => handleDelete(doc)}
                        isDeleting={deletingId === doc.id}
                      />
                    ))}
                  </div>
                </div>
              ) : (
                /* ===== VIEW MODE 2: TABEL DATA LIST ===== */
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50/75 border-b border-slate-200 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                        <th className="py-3.5 px-6">NO. SURAT</th>
                        <th className="py-3.5 px-4">JUDUL</th>
                        <th className="py-3.5 px-4">TUJUAN</th>
                        <th className="py-3.5 px-4">TANGGAL</th>
                        <th className="py-3.5 px-4">STATUS</th>
                        <th className="py-3.5 px-6 text-right">AKSI</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                      {data!.data.map(doc => (
                        <tr key={doc.id} className="hover:bg-slate-50/80 transition-colors group">
                          <td className="py-4 px-6 font-mono text-slate-600 tracking-tight whitespace-nowrap">
                            <span className="bg-slate-100 px-2 py-0.5 rounded border border-slate-200 text-[11px]">
                              {doc.document_number}
                            </span>
                          </td>
                          <td className="py-4 px-4 font-semibold text-slate-900 group-hover:text-amber-600 transition-colors">
                            {doc.title}
                          </td>
                          <td className="py-4 px-4 text-slate-600 whitespace-nowrap">{doc.issued_to_name ?? "—"}</td>
                          <td className="py-4 px-4 text-slate-500 whitespace-nowrap">{doc.issued_date ? formatDate(doc.issued_date) : "—"}</td>
                          <td className="py-4 px-4 whitespace-nowrap">
                            <span 
                              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border border-slate-200/60 shadow-2xs"
                              style={{ 
                                background: DOCUMENT_STATUS_COLORS[doc.status]?.bg ?? "#f1f5f9", 
                                color: DOCUMENT_STATUS_COLORS[doc.status]?.color ?? "#475569" 
                              }}
                            >
                              <span 
                                className="w-1.5 h-1.5 rounded-full" 
                                style={{ background: DOCUMENT_STATUS_COLORS[doc.status]?.color ?? "#475569" }}
                              />
                              {DOCUMENT_STATUS_LABELS[doc.status] ?? doc.status}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5">
                              <button onClick={() => setDetailId(doc.id)} className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded transition-colors" title="Detail Surat">
                                <Eye size={16} />
                              </button>
                              <button
                                onClick={() => handleDelete(doc)}
                                disabled={deletingId === doc.id}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                                title="Hapus Surat"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="p-4 bg-white border-t border-slate-100 flex justify-center">
                <Pagination currentPage={data!.current_page} lastPage={data!.last_page} total={data!.total} onPageChange={setPage} />
              </div>
            </>
          )}
        </section>
      </div>

      {showUploadModal && (
        <QuickUploadDocumentModal
          defaultDirection="masuk"
          onClose={() => setShowUploadModal(false)}
          onCreated={doc => { 
            setShowUploadModal(false); 
            if (doc?.id) setDetailId(doc.id); 
          }}
        />
      )}

      {detailId && <DocumentDetailModal documentId={detailId} onClose={() => setDetailId(null)} />}
    </main>
  );
}
