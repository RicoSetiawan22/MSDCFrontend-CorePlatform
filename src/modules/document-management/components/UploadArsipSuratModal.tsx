import { useState, useRef } from "react";
import { Upload, FileText, X, AlertCircle, Calendar, User, Hash, Building2, Paperclip } from "lucide-react";
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

export function UploadArsipSuratModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (doc: DocumentDetail) => void;
}) {
  const qc = useQueryClient();
  const { data: types } = useDocumentTypes();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentNumber, setDocumentNumber] = useState("");
  const [title, setTitle] = useState("");
  const [direction, setDirection] = useState<DocumentDirection>("masuk");
  const [documentType, setDocumentType] = useState("");
  const [senderName, setSenderName] = useState("");
  const [issuedToName, setIssuedToName] = useState("");
  const [issuedDate, setIssuedDate] = useState(todayLocalDate());
  const [physicalLocation, setPhysicalLocation] = useState("");
  const [notes, setNotes] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      // Jika judul masih kosong, defaultkan nama berkas tanpa ekstensi
      if (!title) {
        setTitle(file.name.replace(/\.[^/.]+$/, ""));
      }
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      setError("Perihal / Judul surat wajib diisi.");
      return;
    }
    if (!documentType) {
      setError("Pilih kategori / jenis surat.");
      return;
    }
    if (!issuedToName.trim()) {
      setError("Tujuan surat / Kepada siapa wajib diisi.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      // Susun format ringkasan arsip fisik untuk body_html
      const compiledBodyHtml = `
        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px 16px; margin-bottom: 14px;">
          <div style="font-weight: 700; color: #1e293b; font-size: 13px; margin-bottom: 8px;">
            📦 ARSIP DOKUMEN FISIK / SURAT LAMA
          </div>
          <table style="width: 100%; font-size: 12px; border-collapse: collapse; line-height: 1.8;">
            ${documentNumber ? `<tr><td style="width: 140px; color: #64748b;">Nomor Surat Fisik</td><td style="font-weight: 600; color: #0f172a;">: ${documentNumber}</td></tr>` : ""}
            ${senderName ? `<tr><td style="color: #64748b;">Pengirim / Asal</td><td style="font-weight: 600; color: #0f172a;">: ${senderName}</td></tr>` : ""}
            <tr><td style="color: #64748b;">Ditujukan Kepada</td><td style="font-weight: 600; color: #0f172a;">: ${issuedToName}</td></tr>
            <tr><td style="color: #64748b;">Tanggal Surat</td><td style="font-weight: 600; color: #0f172a;">: ${issuedDate}</td></tr>
            ${physicalLocation ? `<tr><td style="color: #64748b;">Lokasi Fisik Binder</td><td style="font-weight: 600; color: #0f172a;">: ${physicalLocation}</td></tr>` : ""}
          </table>
        </div>
        ${notes ? `<div style="font-size: 13px; color: #334155; line-height: 1.6; white-space: pre-line;"><strong>Ringkasan / Catatan Isi Surat:</strong>\n${notes}</div>` : ""}
      `.trim();

      // 1. Simpan metadata arsip surat
      const res = await documentApi.create({
        document_type: documentType,
        title: title.trim(),
        direction,
        issued_to_name: issuedToName.trim(),
        issued_date: issuedDate,
        body_html: compiledBodyHtml,
        status: "archived",
        is_legacy: true,
      });

      const createdDoc = res.data?.data;

      // 2. Jika ada file scan yang dipilih, langsung attach file ke surat
      if (selectedFile && createdDoc?.id) {
        const attachRes = await documentApi.attachFile(createdDoc.id, selectedFile);
        qc.invalidateQueries({ queryKey: ["documents"] });
        onCreated(attachRes.data?.data ?? createdDoc);
      } else if (createdDoc) {
        qc.invalidateQueries({ queryKey: ["documents"] });
        onCreated(createdDoc);
      }
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal title="Upload Arsip Surat Lama / Fisik" onClose={onClose} maxWidth={640}>
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {/* Keterangan Singkat */}
        <div className="bg-amber-50/80 border border-amber-200/80 rounded-xl p-3 text-amber-800 text-[11px] leading-relaxed">
          Gunakan formulir ini untuk mengarsipkan surat fisik lama atau pindaian dokumen (scan). Dokumen akan langsung tercatat ke arsip digital MSDC beserta berkas lampirannya.
        </div>

        {/* Upload File Box */}
        <div>
          <label className="block text-slate-700 font-bold mb-1.5">Berkas Scan Surat (PDF / Gambar JPG / PNG)</label>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,image/*"
            className="hidden"
            onChange={handleFileChange}
          />
          {!selectedFile ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-300 hover:border-amber-500 rounded-xl p-4 text-center cursor-pointer transition-colors bg-slate-50 hover:bg-amber-50/30 flex flex-col items-center justify-center gap-1.5"
            >
              <div className="w-9 h-9 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center">
                <Upload size={18} />
              </div>
              <span className="font-semibold text-slate-700">Klik untuk memilih file scan surat</span>
              <span className="text-[11px] text-slate-400">Mendukung format PDF atau gambar (JPG, PNG) hingga 10MB</span>
            </div>
          ) : (
            <div className="border border-slate-200 rounded-xl p-3 bg-slate-50/80 flex items-center justify-between">
              <div className="flex items-center gap-2.5 overflow-hidden">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <FileText size={16} />
                </div>
                <div className="truncate">
                  <div className="font-semibold text-slate-800 truncate">{selectedFile.name}</div>
                  <div className="text-[10px] text-slate-400 font-mono">{(selectedFile.size / 1024).toFixed(1)} KB</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedFile(null)}
                className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                title="Hapus file"
              >
                <X size={16} />
              </button>
            </div>
          )}
        </div>

        {/* Baris 1: Perihal / Judul Surat */}
        <div>
          <label className="block text-slate-700 font-bold mb-1">
            Perihal / Judul Surat <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            required
            className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
            placeholder="mis. Surat Perjanjian Sewa Rack Data Center 2023"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        {/* Baris 2: Nomor Surat Fisik & Tanggal Surat */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-slate-700 font-bold mb-1 flex items-center gap-1">
              <Hash size={13} className="text-slate-400" />
              <span>Nomor Surat Asli / Fisik</span>
            </label>
            <input
              type="text"
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
              placeholder="mis. 045/DIR-MSDC/VIII/2023"
              value={documentNumber}
              onChange={(e) => setDocumentNumber(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-slate-700 font-bold mb-1 flex items-center gap-1">
              <Calendar size={13} className="text-slate-400" />
              <span>Tanggal Surat</span>
            </label>
            <input
              type="date"
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
              value={issuedDate}
              onChange={(e) => setIssuedDate(e.target.value)}
            />
          </div>
        </div>

        {/* Baris 3: Arah Surat & Jenis Surat */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-slate-700 font-bold mb-1">Arah Surat</label>
            <select
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              value={direction}
              onChange={(e) => setDirection(e.target.value as DocumentDirection)}
            >
              <option value="masuk">Surat Masuk (Eksternal ke MSDC)</option>
              <option value="keluar">Surat Keluar (MSDC ke Eksternal)</option>
              <option value="internal">Surat Internal (Antar Departemen)</option>
            </select>
          </div>
          <div>
            <label className="block text-slate-700 font-bold mb-1">
              Jenis Surat <span className="text-rose-500">*</span>
            </label>
            <select
              required
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              value={documentType}
              onChange={(e) => setDocumentType(e.target.value)}
            >
              <option value="">— Pilih Jenis Surat —</option>
              {types?.map((t) => (
                <option key={t.code} value={t.code}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Baris 4: Pengirim & Tujuan Surat */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-slate-700 font-bold mb-1 flex items-center gap-1">
              <Building2 size={13} className="text-slate-400" />
              <span>Pengirim / Asal Surat</span>
            </label>
            <input
              type="text"
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
              placeholder="mis. PT Solusi Vendor / Direktur Utama"
              value={senderName}
              onChange={(e) => setSenderName(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-slate-700 font-bold mb-1 flex items-center gap-1">
              <User size={13} className="text-slate-400" />
              <span>Tujuan Surat / Kepada Siapa <span className="text-rose-500">*</span></span>
            </label>
            <input
              type="text"
              required
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
              placeholder="mis. PT Telkom Indonesia / Bpk. Fajar"
              value={issuedToName}
              onChange={(e) => setIssuedToName(e.target.value)}
            />
          </div>
        </div>

        {/* Baris 5: Lokasi Fisik Binder (Opsional) */}
        <div>
          <label className="block text-slate-700 font-bold mb-1">Lokasi Fisik Binder / Lemari Arsip (Opsional)</label>
          <input
            type="text"
            className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
            placeholder="mis. Binder Map A-03, Lemari Arsip Lantai 2"
            value={physicalLocation}
            onChange={(e) => setPhysicalLocation(e.target.value)}
          />
        </div>

        {/* Baris 6: Ringkasan Catatan Arsip */}
        <div>
          <label className="block text-slate-700 font-bold mb-1">Ringkasan Isi / Catatan Arsip (Opsional)</label>
          <textarea
            rows={3}
            className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
            placeholder="Tuliskan pokok perihal atau poin penting dari surat lama ini..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        {error && (
          <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 flex items-center gap-2 text-[11px]">
            <AlertCircle size={15} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Tombol Aksi */}
        <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium transition-colors"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-lg shadow-sm transition-all disabled:opacity-50"
          >
            {submitting ? (
              <span>Menyimpan & Mengunggah...</span>
            ) : (
              <>
                <Paperclip size={14} />
                <span>Simpan ke Arsip</span>
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}