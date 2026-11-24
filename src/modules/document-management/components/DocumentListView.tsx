import { useState } from "react";
import { Plus } from "lucide-react";
import { EmptyState } from "@shared/components/EmptyState";
import { LoadingState } from "@shared/components/LoadingState";
import { Pagination } from "@shared/components/Pagination";
import { Button } from "@shared/components/Button";
import { useAuth } from "@shared/lib/auth-context";
import { formatDate } from "@shared/lib/format";
import { useDocumentList, useDocumentTypes } from "../api/useDocuments";
import { DocumentFormModal } from "./DocumentFormModal";
import { DocumentDetailModal } from "./DocumentDetailModal";
import { DOCUMENT_STATUS_LABELS, DOCUMENT_STATUS_COLORS } from "../types/document";
import type { DocumentDirection, DocumentStatus } from "../types/document";

/** Satu tabel+filter dipakai ulang untuk Surat Masuk/Surat Keluar/Arsip
 * Surat/GA/Legal - beda cuma default filter yang dikirim. `direction`
 * filter longgar (mis. semua surat "keluar"); `documentType` KUNCI ke 1
 * jenis surat spesifik (dipakai halaman Legal - Legal Review/MoU/NDA/Legal
 * Document semua "internal"/"keluar" jadi tidak cukup dibedakan cuma
 * lewat direction) - saat dikunci, dropdown Jenis disembunyikan dan form
 * create langsung terkunci ke jenis itu (lihat DocumentFormModal.lockDocumentType). */
export function DocumentListView({ direction, documentType, moduleCode, employeeLinked, emptyTitle, emptySubtitle }: {
  direction?: DocumentDirection;
  documentType?: string;
  /** Filter berdasar Document.module_code (auto-tag dari document_type.meta.module
   * saat surat dibuat, lihat DocumentService::create()) - dipakai
   * ModuleSuratPage.tsx supaya 1 modul cuma lihat surat "miliknya", dan
   * dropdown Jenis Surat cuma nawarin jenis yang memang dikonfigurasi
   * untuk modul itu (lihat Core Platform > Kelola Jenis Surat). BEDA dari
   * `direction` (longgar, lintas modul) dan `documentType` (kunci ke 1
   * jenis persis). */
  moduleCode?: string;
  /** Diteruskan ke DocumentFormModal - lihat penjelasan lengkap di sana. */
  employeeLinked?: boolean;
  emptyTitle: string;
  emptySubtitle: string;
}) {
  const { hasPermission } = useAuth();
  const canManage = hasPermission("document.manage");

  const [page, setPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<DocumentStatus | "">("");
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [detailId, setDetailId] = useState<number | null>(null);

  const { data: types } = useDocumentTypes();
  const { data, isLoading } = useDocumentList({
    direction, module_code: moduleCode, page, per_page: 20,
    document_type: documentType || typeFilter || undefined,
    status: statusFilter || undefined,
    search: search || undefined,
  });

  const availableTypes = moduleCode
    ? types?.filter(t => t.meta.module === moduleCode)
    : direction
      ? types?.filter(t => t.meta.direction === direction)
      : types;

  return (
    <>
      <div className="toolbar">
        <input className="input" placeholder="Cari nomor/judul/tujuan..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
        {!documentType && (
          <select className="input" style={{ maxWidth: 200 }} value={typeFilter} onChange={e => { setTypeFilter(e.target.value); setPage(1); }}>
            <option value="">Semua Jenis</option>
            {availableTypes?.map(t => <option key={t.code} value={t.code}>{t.label}</option>)}
          </select>
        )}
        <select className="input" style={{ maxWidth: 180 }} value={statusFilter} onChange={e => { setStatusFilter(e.target.value as DocumentStatus | ""); setPage(1); }}>
          <option value="">Semua Status</option>
          {Object.entries(DOCUMENT_STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        {canManage && (
          <Button onClick={() => setShowForm(true)} style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 4 }}>
            <Plus size={14} /> Surat Baru
          </Button>
        )}
      </div>

      {isLoading && <LoadingState />}
      {data && data.data.length === 0 && <EmptyState title={emptyTitle} subtitle={emptySubtitle} />}

      {data && data.data.length > 0 && (
        <>
          <table className="table">
            <thead>
              <tr><th>No. Surat</th><th>Judul</th><th>Tujuan</th><th>Tanggal</th><th>Status</th><th></th></tr>
            </thead>
            <tbody>
              {data.data.map(doc => (
                <tr key={doc.id} style={{ cursor: "pointer" }} onClick={() => setDetailId(doc.id)}>
                  <td style={{ fontFamily: "monospace", fontSize: "0.78rem" }}>{doc.document_number}</td>
                  <td style={{ fontWeight: 600, fontSize: "0.85rem" }}>{doc.title}</td>
                  <td style={{ fontSize: "0.82rem" }}>{doc.issued_to_name ?? "—"}</td>
                  <td style={{ fontSize: "0.8rem" }}>{doc.issued_date ? formatDate(doc.issued_date) : "—"}</td>
                  <td>
                    <span style={{
                      fontSize: "0.72rem", fontWeight: 700, padding: "0.15rem 0.5rem", borderRadius: 4,
                      background: DOCUMENT_STATUS_COLORS[doc.status].bg, color: DOCUMENT_STATUS_COLORS[doc.status].color,
                    }}>
                      {DOCUMENT_STATUS_LABELS[doc.status]}
                    </span>
                  </td>
                  <td>
                    {doc.file?.is_signed && <span title="Sudah ditandatangani">✓</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ padding: "0 1.5rem" }}>
            <Pagination currentPage={data.current_page} lastPage={data.last_page} total={data.total} onPageChange={setPage} />
          </div>
        </>
      )}

      {showForm && (
        <DocumentFormModal
          defaultDirection={direction}
          moduleCode={moduleCode}
          lockDocumentType={documentType}
          employeeLinked={employeeLinked}
          onClose={() => setShowForm(false)}
          onCreated={doc => { setShowForm(false); setDetailId(doc.id); }}
        />
      )}
      {detailId && <DocumentDetailModal documentId={detailId} onClose={() => setDetailId(null)} />}
    </>
  );
}
