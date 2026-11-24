import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "@shared/components/PageHeader";
import { useAuth } from "@shared/lib/auth-context";
import {
  useDocumentList,
  useDocumentTypes,
} from "@modules/document-management/api/useDocuments";
import {
  SuratDcOpsStatusBanner,
  SuratDcOpsKPICards,
  SuratDcOpsToolbar,
  SuratDcOpsTable,
  SuratDcOpsTablePagination,
  SuratDcOpsEditModal,
  type SuratDcOpsKPIMetrics,
} from "../components/surat";

/**
 * Halaman Surat & Dokumen Operasional Data Center Operations.
 *
 * Menampilkan dan mengelola dokumen resmi seperti Berita Acara Instalasi (BAI),
 * Surat Izin Masuk/Akses Fasilitas DC, Berita Acara Uji Terima (Commissioning),
 * dan tata naskah dinas teknis lainnya.
 *
 * Menggunakan standar tata letak dan estetika MSDC (Banner, 4 KPI, Toolbar, Tabel #FEF9EE).
 */
export function SuratDcOpsPage() {
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const canManage = hasPermission("document.manage");

  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [editDocId, setEditDocId] = useState<number | null>(null);

  // ── 1. Fetch Seluruh Surat Milik Modul Data Center Ops ──
  const {
    data: docsPage,
    isLoading,
    dataUpdatedAt,
    refetch,
  } = useDocumentList({
    module_code: "data-center-ops",
    per_page: 500,
  });

  const allDocs = useMemo(() => docsPage?.data ?? [], [docsPage]);

  // ── 2. Fetch Master Jenis Surat untuk Filter & Label ──
  const { data: docTypes } = useDocumentTypes();

  const availableTypes = useMemo(() => {
    if (!docTypes) return [];
    const dcTypes = docTypes.filter((t) => t.meta.module === "data-center-ops");
    // Jika belum ada jenis khusus bertag data-center-ops di database, fallback ke semua jenis aktif
    return dcTypes.length > 0 ? dcTypes : docTypes;
  }, [docTypes]);

  const documentTypeMap = useMemo(() => {
    const map: Record<string, string> = {};
    (docTypes ?? []).forEach((t) => {
      map[t.code] = t.label;
    });
    return map;
  }, [docTypes]);

  // ── 3. Format Waktu Terakhir Diperbarui ──
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

  // ── 4. Kalkulasi Metrik 4 KPI Surat ──
  const metrics: SuratDcOpsKPIMetrics = useMemo(() => {
    const totalDocuments = allDocs.length;
    let pendingApproval = 0;
    let approvedDocuments = 0;
    let draftDocuments = 0;

    allDocs.forEach((doc) => {
      if (doc.status === "pending_approval") {
        pendingApproval += 1;
      } else if (doc.status === "approved") {
        approvedDocuments += 1;
      } else if (doc.status === "draft") {
        draftDocuments += 1;
      }
    });

    return {
      totalDocuments,
      pendingApproval,
      approvedDocuments,
      draftDocuments,
    };
  }, [allDocs]);

  const isOperational = metrics.pendingApproval === 0;

  // ── 5. Client-side Search, Filtering, dan Relevance Sorting ──
  const filteredDocs = useMemo(() => {
    const q = search.trim().toLowerCase();
    const tFilter = typeFilter.trim();
    const sFilter = statusFilter.trim();

    const result = allDocs.filter((doc) => {
      // Filter Jenis Surat
      if (tFilter && doc.document_type !== tFilter) {
        return false;
      }

      // Filter Status Dokumen
      if (sFilter && doc.status !== sFilter) {
        return false;
      }

      // Filter Pencarian (No. Surat, Judul, Penerima)
      if (q) {
        const matchNum = doc.document_number?.toLowerCase().includes(q);
        const matchTitle = doc.title?.toLowerCase().includes(q);
        const matchTo = doc.issued_to_name?.toLowerCase().includes(q);
        if (!matchNum && !matchTitle && !matchTo) {
          return false;
        }
      }

      return true;
    });

    // Urutan Relevansi Pencarian
    if (q) {
      result.sort((a, b) => {
        const aNumStarts = a.document_number?.toLowerCase().startsWith(q) ? 1 : 0;
        const bNumStarts = b.document_number?.toLowerCase().startsWith(q) ? 1 : 0;
        if (aNumStarts !== bNumStarts) return bNumStarts - aNumStarts;

        const aTitleStarts = a.title?.toLowerCase().startsWith(q) ? 1 : 0;
        const bTitleStarts = b.title?.toLowerCase().startsWith(q) ? 1 : 0;
        if (aTitleStarts !== bTitleStarts) return bTitleStarts - aTitleStarts;

        return 0;
      });
    }

    return result;
  }, [allDocs, search, typeFilter, statusFilter]);

  // ── 6. Paginasi Hasil Filter ──
  const total = filteredDocs.length;
  const totalPages = Math.ceil(total / perPage) || 1;

  const paginatedDocs = useMemo(() => {
    const start = (page - 1) * perPage;
    return filteredDocs.slice(start, start + perPage);
  }, [filteredDocs, page, perPage]);

  return (
    <div className="min-h-screen bg-[#F5F7FA] pb-16">
      {/* ── 1. Header Banner Bergaya MSDC ── */}
      <PageHeader
        title="Surat & Dokumen Operasional"
        subtitle="Penerbitan berita acara instalasi, izin akses fasilitas DC, dan tata naskah dinas resmi"
        containerClassName="px-7 pt-5 pb-2"
      />

      <div className="mx-7 mt-3 flex flex-col gap-6">
        {/* ── 2. Overview Card: Status Banner & 4 KPI Cards ── */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm flex flex-col gap-5">
          <SuratDcOpsStatusBanner
            isOperational={isOperational}
            lastUpdated={lastUpdatedTime}
            pendingApprovalCount={metrics.pendingApproval}
          />

          <SuratDcOpsKPICards
            metrics={metrics}
            selectedStatus={statusFilter}
            onFilterStatus={(st) => {
              setStatusFilter(st);
              setPage(1);
            }}
            isLoading={isLoading && !docsPage}
          />
        </div>

        {/* ── 3. Konten Utama: Toolbar & Tabel Surat ── */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm flex flex-col gap-4">
          <SuratDcOpsToolbar
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
            availableTypes={availableTypes}
            totalDocuments={total}
            canCreate={canManage}
            onNewDocument={() => navigate("/dc/surat/create")}
          />

          <SuratDcOpsTable
            documents={paginatedDocs}
            isLoading={isLoading}
            onOpenDetail={(id) => navigate(`/dc/surat/${id}`)}
            onEditDocument={(id) => setEditDocId(id)}
            documentTypeMap={documentTypeMap}
          />

          {total > 0 && (
            <SuratDcOpsTablePagination
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

      {/* ── Modal Edit Dokumen Draf ── */}
      {editDocId && (
        <SuratDcOpsEditModal
          documentId={editDocId}
          onClose={() => setEditDocId(null)}
          onSuccess={() => {
            setEditDocId(null);
            refetch();
          }}
        />
      )}
    </div>
  );
}

export default SuratDcOpsPage;
