import { useState, useRef } from "react";
import { Upload, FileText, X, AlertCircle, CheckCircle2, Loader2, Archive } from "lucide-react";
import { Modal } from "@shared/components/Modal";
import { useQueryClient } from "@tanstack/react-query";
import { extractErrorMessage } from "@shared/types/api";
import { useDocumentTypes } from "../api/useDocuments";
import { documentApi } from "../api/documentApi";
import type { DocumentDetail, DocumentDirection } from "../types/document";

function todayLocalDate(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

interface QuickUploadDocumentModalProps {
  defaultDirection?: DocumentDirection;
  onClose: () => void;
  onCreated: (doc: DocumentDetail) => void;
}

export function QuickUploadDocumentModal({
  defaultDirection = "masuk",
  onClose,
  onCreated,
}: QuickUploadDocumentModalProps) {
  const qc = useQueryClient();
  const { data: types, isLoading: loadingTypes } = useDocumentTypes();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form states — hanya 3 input esensial: File + Jenis + Keterangan/Judul
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState("");
  const [notes, setNotes] = useState("");
  const [direction, setDirection] = useState<DocumentDirection>(defaultDirection);
  
  // PR #3: Upload surat lama tanpa approval — langsung simpan sebagai arsip permanen
  const [isLegacy, setIsLegacy] = useState(true);

  const [isDragging, setIsDragging] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleFileSelection(file: File) {
    setSelectedFile(file);
    // Jika keterangan belum diisi, isi otomatis dengan nama file tanpa ekstensi
    if (!notes.trim()) {
      setNotes(file.name.replace(/\.[^/.]+$/, ""));
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFileSelection(file);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileSelection(file);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!documentType) {
      setError("Silakan pilih Jenis Surat terlebih dahulu.");
      return;
    }
    if (!notes.trim() && !selectedFile) {
      setError("Masukkan Keterangan / Perihal surat atau pilih berkas surat.");
      return;
    }

    setSubmitting(true);
    setError(null);

    const titleText = notes.trim() || selectedFile?.name.replace(/\.[^/.]+$/, "") || "Surat Dokumen Resmi";

    try {
      // 1. Buat record surat simpel (auto-fill nilai default)
      // PR #3: Jika surat lama / arsip fisik, set status langsung "archived" tanpa proses approval
      const res = await documentApi.create({
        document_type: documentType,
        title: titleText,
        direction,
        issued_to_name: "Internal / Terkait",
        issued_date: todayLocalDate(),
        body_html: notes ? `<p>${notes.replace(/\n/g, "<br/>")}</p>` : "<p>Dokumen arsip surat masuk/keluar.</p>",
        status: isLegacy ? "archived" : "draft",
        is_legacy: isLegacy,
      });

      const createdDoc = res.data?.data;

      // 2. Jika ada berkas file, langsung attach
      if (selectedFile && createdDoc?.id) {
        try {
          await documentApi.attachFile(createdDoc.id, selectedFile);
        } catch (attachErr) {
          console.error("Gagal melampirkan berkas ke surat:", attachErr);
        }
      }

      // 3. Refresh cache query dan tutup modal
      qc.invalidateQueries({ queryKey: ["documents"] });
      onCreated(createdDoc);
      onClose();
    } catch (err) {
      setError(extractErrorMessage(err));
      setSubmitting(false);
    }
  }

  return (
    <Modal title="Upload Surat Cepat" onClose={onClose} maxWidth={540}>
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {error && (
          <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 flex items-start gap-2">
            <AlertCircle size={15} className="shrink-0 mt-0.5 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {/* 1. AREA DRAG & DROP UPLOAD BERKAS */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            File Berkas Surat (PDF, JPG, PNG, DOCX) <span className="text-slate-400 font-normal">(Opsional / Dianjurkan)</span>
          </label>

          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
            onChange={handleFileChange}
            className="hidden"
          />

          {!selectedFile ? (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`p-6 border-2 border-dashed rounded-xl flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                isDragging
                  ? "border-amber-500 bg-amber-50/60"
                  : "border-slate-300 hover:border-amber-400 hover:bg-slate-50/80 bg-slate-50/40"
              }`}
            >
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-2.5 shadow-2xs">
                <Upload size={22} />
              </div>
              <div className="font-bold text-slate-800 text-xs">
                Klik atau Tarik (Drag & Drop) File Surat ke Sini
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                Format didukung: PDF, PNG, JPG, DOCX (Maksimal 10 MB)
              </div>
            </div>
          ) : (
            <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                  <FileText size={18} />
                </div>
                <div className="truncate max-w-[320px]">
                  <div className="font-bold text-slate-800 text-xs truncate" title={selectedFile.name}>
                    {selectedFile.name}
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                    {(selectedFile.size / 1024).toFixed(1)} KB
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedFile(null)}
                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                title="Hapus file"
              >
                <X size={15} />
              </button>
            </div>
          )}
        </div>

        {/* 2. PILIH JENIS SURAT */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            Jenis Surat <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <select
              required
              disabled={loadingTypes}
              value={documentType}
              onChange={(e) => setDocumentType(e.target.value)}
              className="w-full bg-white border border-slate-300 text-slate-800 rounded-lg py-2.5 pl-3 pr-8 text-xs font-medium focus:ring-2 focus:ring-amber-500 focus:border-amber-500 shadow-2xs cursor-pointer"
            >
              <option value="">-- Pilih Kategori / Jenis Surat --</option>
              {types?.map((t) => (
                <option key={t.code} value={t.code}>
                  {t.label} ({t.code.toUpperCase()})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 3. KETERANGAN / PERIHAL SURAT */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            Keterangan / Perihal Surat <span className="text-rose-500">*</span>
          </label>
          <textarea
            required
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Contoh: Surat Tugas Peninjauan Server Cibitung / Undangan Rapat Koordinasi..."
            className="w-full bg-white border border-slate-300 text-slate-800 rounded-lg p-3 text-xs focus:ring-2 focus:ring-amber-500 focus:border-amber-500 shadow-2xs placeholder-slate-400"
          />
        </div>

        {/* 4. PR #3: OPSI SURAT LAMA / ARSIP FISIK (TANPA APPROVAL) */}
        <div className="p-3 bg-purple-50/70 border border-purple-200/80 rounded-xl flex items-start gap-2.5">
          <input
            type="checkbox"
            id="isLegacyDoc"
            checked={isLegacy}
            onChange={(e) => setIsLegacy(e.target.checked)}
            className="w-4 h-4 text-purple-600 rounded border-slate-300 focus:ring-purple-400 mt-0.5 cursor-pointer accent-purple-600"
          />
          <label htmlFor="isLegacyDoc" className="text-xs text-slate-700 font-medium cursor-pointer select-none">
            <span className="font-bold text-purple-900 flex items-center gap-1.5">
              <Archive size={14} className="text-purple-600" />
              <span>Surat Lama / Arsip Fisik (Tanpa Approval)</span>
            </span>
            <span className="text-purple-700 block text-[11px] mt-0.5 leading-snug">
              Dokumen langsung tersimpan dengan status <strong>Diarsipkan</strong> permanen tanpa memerlukan approval atau tanda tangan atasan.
            </span>
          </label>
        </div>

        {/* TOGGLE ARAH SURAT (OPSIONAL) */}
        <div className="flex items-center gap-4 pt-1">
          <span className="text-xs text-slate-500 font-medium">Arah Dokumen:</span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setDirection("masuk")}
              className={`px-3 py-1 rounded-full text-xs font-bold border transition ${
                direction === "masuk"
                  ? "bg-blue-50 text-blue-700 border-blue-300"
                  : "bg-slate-100 text-slate-500 border-slate-200"
              }`}
            >
              Surat Masuk
            </button>
            <button
              type="button"
              onClick={() => setDirection("keluar")}
              className={`px-3 py-1 rounded-full text-xs font-bold border transition ${
                direction === "keluar"
                  ? "bg-purple-50 text-purple-700 border-purple-300"
                  : "bg-slate-100 text-slate-500 border-slate-200"
              }`}
            >
              Surat Keluar
            </button>
          </div>
        </div>

        {/* TOMBOL AKSI */}
        <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
          <button
            type="button"
            disabled={submitting}
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-5 py-2 text-xs font-bold text-white bg-amber-500 hover:bg-amber-600 active:bg-amber-700 rounded-lg shadow-sm transition inline-flex items-center gap-1.5 disabled:opacity-60"
          >
            {submitting ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                <span>Menyimpan Surat...</span>
              </>
            ) : (
              <>
                <CheckCircle2 size={14} />
                <span>Upload & Simpan Surat</span>
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}
