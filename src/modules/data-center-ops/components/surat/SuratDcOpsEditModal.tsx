import React, { useState, useEffect, useMemo } from "react";
import {
  X,
  FileEdit,
  Save,
  Loader2,
  AlertCircle,
  Calendar,
  User,
  Layers,
  MessageSquare,
} from "lucide-react";
import { extractErrorMessage } from "@shared/types/api";
import {
  useDocument,
  useUpdateDocument,
  useDocumentTemplates,
} from "@modules/document-management/api/useDocuments";

export interface SuratDcOpsEditModalProps {
  documentId: number;
  isOpen?: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

function extractPlaceholders(content: string): string[] {
  const matches = content.matchAll(/\{\{\s*(\w+)\s*\}\}/g);
  const names = new Set<string>();
  for (const m of matches) {
    if (m[1] !== "nomor_surat") names.add(m[1]);
  }
  return Array.from(names);
}

export const SuratDcOpsEditModal: React.FC<SuratDcOpsEditModalProps> = ({
  documentId,
  isOpen = true,
  onClose,
  onSuccess,
}) => {
  if (!isOpen) return null;

  return (
    <SuratDcOpsEditModalContent
      key={documentId}
      documentId={documentId}
      onClose={onClose}
      onSuccess={onSuccess}
    />
  );
};

interface SuratDcOpsEditModalContentProps {
  documentId: number;
  onClose: () => void;
  onSuccess?: () => void;
}

function SuratDcOpsEditModalContent({
  documentId,
  onClose,
  onSuccess,
}: SuratDcOpsEditModalContentProps) {
  const { data: document, isLoading } = useDocument(documentId);
  const { data: templates } = useDocumentTemplates();
  const updateMutation = useUpdateDocument();

  // ── Form States ──
  const [title, setTitle] = useState("");
  const [issuedDate, setIssuedDate] = useState("");
  const [issuedToName, setIssuedToName] = useState("");
  const [fieldData, setFieldData] = useState<Record<string, string>>({});
  const [bodyHtml, setBodyHtml] = useState("");
  const [changeNote, setChangeNote] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Inisialisasi state saat data dokumen selesai dimuat
  useEffect(() => {
    if (document) {
      setTitle(document.title ?? "");
      setIssuedDate(document.issued_date ? document.issued_date.slice(0, 10) : "");
      setIssuedToName(document.issued_to_name ?? "");
      setFieldData(document.field_data ?? {});
      setBodyHtml(document.body_html ?? "");
      setChangeNote("");
    }
  }, [document]);

  // Handle tombol ESC untuk keluar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !updateMutation.isPending) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, updateMutation.isPending]);

  // Template variables detection
  const selectedTemplate = useMemo(() => {
    if (!document?.template_id || !templates) return null;
    return templates.find((t) => t.id === document.template_id);
  }, [document, templates]);

  const placeholders = useMemo(() => {
    return selectedTemplate ? extractPlaceholders(selectedTemplate.content) : [];
  }, [selectedTemplate]);

  // ── Submit Handler ──
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMessage("Judul / Perihal dokumen wajib diisi.");
      return;
    }

    setErrorMessage(null);

    try {
      await updateMutation.mutateAsync({
        id: documentId,
        values: {
          title: title.trim(),
          issued_date: issuedDate || undefined,
          issued_to_name: issuedToName.trim() || undefined,
          field_data: Object.keys(fieldData).length > 0 ? fieldData : undefined,
          body_html: !document?.template_id ? bodyHtml : undefined,
          change_note: changeNote.trim() || "Pembaruan isi draf surat operasional DC.",
        },
      });

      onSuccess?.();
      onClose();
    } catch (err) {
      setErrorMessage(extractErrorMessage(err));
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs transition-opacity duration-200 animate-in fade-in"
      onClick={() => {
        if (!updateMutation.isPending) onClose();
      }}
    >
      <div
        className="relative w-full max-w-2xl bg-white rounded-2xl shadow-xl border border-slate-200/90 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Modal Header ── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold">
              <FileEdit size={18} />
            </div>
            <div className="flex flex-col">
              <h2 className="text-sm font-bold text-slate-900">
                Edit Surat & Dokumen Operasional
              </h2>
              <span className="text-xs text-slate-500 font-mono">
                {document ? document.document_number : `Dokumen #${documentId}`}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={updateMutation.isPending}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* ── Modal Body ── */}
        {isLoading ? (
          <div className="p-12 flex flex-col items-center justify-center gap-3 text-slate-400">
            <Loader2 size={24} className="animate-spin text-amber-500" />
            <span className="text-xs font-medium">Memuat data dokumen...</span>
          </div>
        ) : document && document.status !== "draft" ? (
          <div className="p-8 flex flex-col items-center justify-center gap-3 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center">
              <AlertCircle size={24} />
            </div>
            <span className="text-sm font-bold text-slate-800">
              Surat Tidak Dapat Diedit
            </span>
            <span className="text-xs text-slate-500 max-w-md">
              Hanya surat berstatus <strong>Draft</strong> yang dapat diperbarui. Dokumen ini
              telah berada pada status <strong>{document.status}</strong>.
            </span>
            <button
              type="button"
              onClick={onClose}
              className="mt-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl cursor-pointer"
            >
              Tutup
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
            <div className="p-6 overflow-y-auto flex flex-col gap-5 flex-1">
              {/* Alert Error Message */}
              {errorMessage && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2.5">
                  <AlertCircle size={16} className="text-rose-600 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Judul Dokumen */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700">
                  Perihal / Judul Dokumen <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Judul dokumen..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-amber-500 shadow-2xs"
                />
              </div>

              {/* Tanggal & Penerima */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Calendar size={13} className="text-slate-400" />
                    Tanggal Terbit
                  </label>
                  <input
                    type="date"
                    value={issuedDate}
                    onChange={(e) => setIssuedDate(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-amber-500 shadow-2xs"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <User size={13} className="text-slate-400" />
                    Pihak Tujuan / Penerima
                  </label>
                  <input
                    type="text"
                    placeholder="Nama PIC / Perusahaan / Vendor..."
                    value={issuedToName}
                    onChange={(e) => setIssuedToName(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-amber-500 shadow-2xs"
                  />
                </div>
              </div>

              {/* Parameter Template Dinamis */}
              {placeholders.length > 0 ? (
                <div className="flex flex-col gap-3 pt-3 border-t border-slate-100">
                  <div className="flex items-center gap-1.5">
                    <Layers size={14} className="text-amber-500" />
                    <span className="text-xs font-bold text-slate-800">
                      Variabel Template Dokumen
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {placeholders.map((key) => {
                      const label = key
                        .replace(/_/g, " ")
                        .replace(/\b\w/g, (c) => c.toUpperCase());

                      return (
                        <div key={key} className="flex flex-col gap-1">
                          <label className="text-[11px] font-semibold text-slate-600">
                            {label}
                          </label>
                          <input
                            type="text"
                            placeholder={`Isi ${label.toLowerCase()}...`}
                            value={fieldData[key] ?? ""}
                            onChange={(e) =>
                              setFieldData((prev) => ({
                                ...prev,
                                [key]: e.target.value,
                              }))
                            }
                            className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-amber-500 shadow-2xs"
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-1.5 pt-3 border-t border-slate-100">
                  <label className="text-xs font-bold text-slate-700">
                    Isi Naskah / Teks Dokumen (HTML / Manual)
                  </label>
                  <textarea
                    rows={5}
                    value={bodyHtml}
                    onChange={(e) => setBodyHtml(e.target.value)}
                    placeholder="Isi teks naskah dokumen dinas..."
                    className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-amber-500 shadow-2xs resize-y"
                  />
                </div>
              )}

              {/* Catatan Revisi (Audit Trail) */}
              <div className="flex flex-col gap-1.5 pt-3 border-t border-slate-100">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <MessageSquare size={13} className="text-slate-400" />
                  Catatan Perubahan (Audit Trail)
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Koreksi nomor rak dan spesifikasi server"
                  value={changeNote}
                  onChange={(e) => setChangeNote(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-amber-500 shadow-2xs"
                />
                <span className="text-[10px] text-slate-400">
                  Catatan ini akan tersimpan otomatis pada riwayat revisi dokumen sebagai bukti perubahan.
                </span>
              </div>
            </div>

            {/* ── Modal Footer ── */}
            <div className="px-6 py-3.5 border-t border-slate-200 bg-slate-50/80 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={onClose}
                disabled={updateMutation.isPending}
                className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Batal
              </button>

              <button
                type="submit"
                disabled={updateMutation.isPending}
                className="flex items-center gap-2 px-5 py-2 bg-[#E59B00] hover:bg-[#d48f00] text-white rounded-xl text-xs font-bold shadow-xs hover:shadow transition-all cursor-pointer active:scale-95 disabled:opacity-50"
              >
                {updateMutation.isPending ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>Menyimpan...</span>
                  </>
                ) : (
                  <>
                    <Save size={14} />
                    <span>Simpan Perubahan</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default SuratDcOpsEditModal;
