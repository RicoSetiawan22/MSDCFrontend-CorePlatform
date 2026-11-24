import { useState, useMemo } from "react";
import {
  Upload,
  X,
  FileCheck2,
  Paperclip,
  AlertTriangle,
} from "lucide-react";
import { Modal } from "@shared/components/Modal";
import { Button } from "@shared/components/Button";
import { useActiveOrgId } from "@shared/lib/organization-context";
import { extractErrorMessage } from "@shared/types/api";
import { documentApi } from "@modules/document-management/api/documentApi";
import { useDocumentTypes } from "@modules/document-management/api/useDocuments";
import type { DocumentDetail } from "@modules/document-management/types/document";

interface SuratProcurementFormModalProps {
  onClose: () => void;
  onCreated: (doc: DocumentDetail) => void;
}

const TEMPLATES: Record<string, string> = {
  surat_jalan: `<p>Bersama ini kami kirimkan barang/perlengkapan operasional dengan rincian sebagai berikut:</p>
<table border="1" style="width:100%; border-collapse: collapse; margin-top: 10px;">
  <thead>
    <tr style="background:#f1f5f9;">
      <th style="padding: 6px;">No</th>
      <th style="padding: 6px;">Nama Barang / Item</th>
      <th style="padding: 6px;">Qty</th>
      <th style="padding: 6px;">Satuan</th>
      <th style="padding: 6px;">Keterangan / Kondisi</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td style="padding: 6px; text-align: center;">1</td>
      <td style="padding: 6px;">[Nama Item 1]</td>
      <td style="padding: 6px; text-align: center;">1</td>
      <td style="padding: 6px; text-align: center;">Unit</td>
      <td style="padding: 6px;">Baik & Lengkap</td>
    </tr>
  </tbody>
</table>
<p style="margin-top: 15px;">Pengemudi / Kurir: [Nama Driver] | Kendaraan: [No. Polisi Kendaraan]</p>
<p>Mohon barang diperiksa dan ditandatangani saat diterima.</p>`,

  bast: `<p>Pada hari ini, telah dilakukan serah terima fisik barang hasil pengadaan antara pihak penyedia dan pihak penerima MSDC dengan kondisi baik, lengkap, dan sesuai spesifikasi teknis.</p>
<p>Catatan Pemeriksaan: Fisik utuh, segel aman, kelengkapan aksesoris terverifikasi.</p>`,

  permohonan: `<p>Sehubungan dengan kebutuhan operasional mendesak pada unit kerja kami, bersama surat ini kami mengajukan permohonan pengadaan barang/jasa khusus guna mendukung kelancaran siaran dan operasional studio.</p>
<p>Demikian permohonan ini kami sampaikan, atas perhatian dan persetujuannya kami ucapkan terima kasih.</p>`,
};

export function SuratProcurementFormModal({
  onClose,
  onCreated,
}: SuratProcurementFormModalProps) {
  const orgId = useActiveOrgId();
  const { data: rawTypes } = useDocumentTypes();

  const types = useMemo(() => {
    const list = rawTypes ?? [];
    const proc = list.filter((t) => t.meta.module === "procurement-inventory");
    return proc.length > 0 ? proc : list;
  }, [rawTypes]);

  // Form states
  const [documentType, setDocumentType] = useState(types[0]?.code ?? "surat-jalan");
  const [urgency, setUrgency] = useState<"biasa" | "penting" | "segera">("biasa");
  const [refType, setRefType] = useState<"none" | "PO" | "GRN" | "FSTB">("none");
  const [refNumber, setRefNumber] = useState("");
  const [title, setTitle] = useState("");
  const [issuedTo, setIssuedTo] = useState("");
  const [issuedDate, setIssuedDate] = useState(new Date().toISOString().slice(0, 10));
  const [approverName, setApproverName] = useState("Kepala Divisi Procurement & Logistik");
  const [ccList, setCcList] = useState("");
  const [bodyText, setBodyText] = useState(TEMPLATES.surat_jalan);
  const [attachedFile, setAttachedFile] = useState<File | null>(null);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto preview nomor surat
  const previewDocNumber = useMemo(() => {
    const selected = types.find((t) => t.code === documentType);
    const prefix = selected?.meta.prefix || "PROC";
    const year = new Date(issuedDate || Date.now()).getFullYear();
    const refCode = refType !== "none" && refNumber ? `-${refType}` : "";
    return `SURAT/${prefix}/SBY/${year}/${refCode || "PREVIEW"}`;
  }, [documentType, types, issuedDate, refType, refNumber]);

  function handleTemplateChange(tplKey: string) {
    if (TEMPLATES[tplKey]) {
      setBodyText(TEMPLATES[tplKey]);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError("Perihal / Judul Surat wajib diisi.");
      return;
    }
    if (!issuedTo.trim()) {
      setError("Pihak yang dituju (Ditujukan Kepada) wajib diisi.");
      return;
    }
    if (!approverName.trim()) {
      setError("Pejabat penanda tangan / approver wajib diisi.");
      return;
    }

    setSaving(true);
    try {
      const selectedType = types.find((t) => t.code === documentType);
      const direction = selectedType?.meta.direction ?? "keluar";

      const auditFields: Record<string, string> = {
        sifat_surat: urgency,
        approver: approverName.trim(),
      };
      if (refType !== "none" && refNumber.trim()) {
        auditFields.referensi_transaksi = `${refType}: ${refNumber.trim()}`;
      }
      if (ccList.trim()) {
        auditFields.tembusan = ccList.trim();
      }

      const res = await documentApi.create({
        document_type: documentType,
        title: title.trim(),
        direction,
        organization_id: orgId ? Number(orgId) : undefined,
        issued_to_type: "external_vendor",
        issued_to_name: issuedTo.trim(),
        issued_date: issuedDate,
        body_html: bodyText,
        field_data: auditFields,
      });

      const doc = res.data.data;

      // Upload file if selected
      if (attachedFile && doc?.id) {
        try {
          await documentApi.attachFile(doc.id, attachedFile);
        } catch {
          // File attach failure shouldn't completely fail document creation
        }
      }

      onCreated(doc);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      title="Buat Surat Procurement Baru"
      onClose={onClose}
      maxWidth={800}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 py-1">
        {/* Preview Nomor Surat Otomatis */}
        <div className="p-3.5 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-200/80 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-500 text-white rounded-lg">
              <FileCheck2 size={18} />
            </div>
            <div>
              <span className="text-[11px] font-semibold text-amber-800 uppercase tracking-wide block">
                Preview Nomor Registrasi Surat Otomatis
              </span>
              <span className="text-sm font-bold font-mono text-slate-800">
                {previewDocNumber}
              </span>
            </div>
          </div>
          <span className="text-[11px] bg-white border border-amber-200 text-amber-700 px-2.5 py-1 rounded-md font-medium">
            Status: Draft / Menunggu Approval
          </span>
        </div>

        {/* Section 1: Jenis Surat, Sifat, Tanggal */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Jenis Surat Procurement *
            </label>
            <select
              value={documentType}
              onChange={(e) => setDocumentType(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-amber-500 transition-all font-medium"
            >
              {types.map((t) => (
                <option key={t.id} value={t.code}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Sifat / Prioritas Surat *
            </label>
            <select
              value={urgency}
              onChange={(e) => setUrgency(e.target.value as any)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-amber-500 transition-all font-medium"
            >
              <option value="biasa">Biasa / Rutin</option>
              <option value="penting">Penting (Operasional)</option>
              <option value="segera">Segera / Mendesak (Urgent)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Tanggal Penerbitan *
            </label>
            <input
              type="date"
              required
              value={issuedDate}
              onChange={(e) => setIssuedDate(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-amber-500 transition-all font-medium"
            />
          </div>
        </div>

        {/* Section 2: Referensi Dokumen Transaksi (PO / GRN / FSTB) */}
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="w-full sm:w-1/3">
            <label className="block text-[11px] font-semibold text-slate-700 uppercase mb-1">
              Tautkan Dokumen Transaksi
            </label>
            <select
              value={refType}
              onChange={(e) => setRefType(e.target.value as any)}
              className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-amber-500"
            >
              <option value="none">Tanpa Referensi (Surat Umum)</option>
              <option value="PO">Purchase Order (PO)</option>
              <option value="GRN">Goods Receipt (GRN)</option>
              <option value="FSTB">Serah Terima (FSTB)</option>
            </select>
          </div>
          {refType !== "none" && (
            <div className="flex-1">
              <label className="block text-[11px] font-semibold text-slate-700 uppercase mb-1">
                Nomor Referensi {refType} *
              </label>
              <input
                type="text"
                placeholder={`Contoh: ${
                  refType === "PO"
                    ? "PO-SBY-26.003-001"
                    : refType === "GRN"
                    ? "GRN-2026-001"
                    : "FSTB-2026-001"
                }`}
                value={refNumber}
                onChange={(e) => setRefNumber(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-amber-500 font-mono"
              />
            </div>
          )}
        </div>

        {/* Section 3: Perihal & Pihak Dituju */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Perihal / Judul Surat *
            </label>
            <input
              type="text"
              required
              placeholder="mis. Surat Jalan Pengiriman Perangkat Studio Surabaya"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-amber-500 transition-all placeholder:text-slate-400"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Ditujukan Kepada (Penerima) *
            </label>
            <input
              type="text"
              required
              placeholder="mis. PT. Mitra Rekanan Logistik / Kepala Stasiun"
              value={issuedTo}
              onChange={(e) => setIssuedTo(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-amber-500 transition-all placeholder:text-slate-400"
            />
          </div>
        </div>

        {/* Section 4: Penanda Tangan & Tembusan */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Pejabat Penanda Tangan / Approver *
            </label>
            <input
              type="text"
              required
              value={approverName}
              onChange={(e) => setApproverName(e.target.value)}
              placeholder="mis. Manager Procurement / General Manager"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-amber-500 transition-all font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Tembusan (CC) (opsional)
            </label>
            <input
              type="text"
              placeholder="mis. Finance Dept, General Affairs, Security Pos 1"
              value={ccList}
              onChange={(e) => setCcList(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-amber-500 transition-all placeholder:text-slate-400"
            />
          </div>
        </div>

        {/* Section 5: Isi Surat & Template */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-semibold text-slate-700">
              Isi Surat / Redaksi *
            </label>
            <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
              <span>Pakai Template:</span>
              <button
                type="button"
                onClick={() => handleTemplateChange("surat_jalan")}
                className="px-2 py-0.5 bg-slate-100 hover:bg-amber-100 text-slate-700 hover:text-amber-800 rounded font-medium transition-colors"
              >
                Surat Jalan
              </button>
              <button
                type="button"
                onClick={() => handleTemplateChange("bast")}
                className="px-2 py-0.5 bg-slate-100 hover:bg-amber-100 text-slate-700 hover:text-amber-800 rounded font-medium transition-colors"
              >
                BAST
              </button>
              <button
                type="button"
                onClick={() => handleTemplateChange("permohonan")}
                className="px-2 py-0.5 bg-slate-100 hover:bg-amber-100 text-slate-700 hover:text-amber-800 rounded font-medium transition-colors"
              >
                Permohonan
              </button>
            </div>
          </div>
          <textarea
            rows={5}
            required
            value={bodyText}
            onChange={(e) => setBodyText(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-amber-500 transition-all font-mono leading-relaxed resize-y"
          />
        </div>

        {/* Section 6: Upload Lampiran Dokumen */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Lampiran Dokumen / Berkas Fisik (PDF / Gambar)
          </label>
          {attachedFile ? (
            <div className="flex items-center justify-between p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-700 font-medium">
              <span className="flex items-center gap-1.5 truncate">
                <Paperclip size={14} /> {attachedFile.name} ({Math.ceil(attachedFile.size / 1024)} KB)
              </span>
              <button
                type="button"
                onClick={() => setAttachedFile(null)}
                className="text-rose-600 hover:text-rose-700 p-1 cursor-pointer"
              >
                <X size={15} />
              </button>
            </div>
          ) : (
            <label className="flex items-center gap-2 p-3 border border-dashed border-slate-300 rounded-xl cursor-pointer text-xs text-slate-500 hover:bg-slate-50 transition-all">
              <Upload size={15} className="text-slate-400" />
              <span>Pilih file lampiran surat (PDF, Scan Berkas, Gambar)</span>
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) setAttachedFile(f);
                }}
                className="hidden"
              />
            </label>
          )}
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200/80 rounded-xl text-xs font-medium text-rose-700 flex items-center gap-2">
            <AlertTriangle size={15} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 font-medium text-xs rounded-xl"
          >
            Batal
          </Button>
          <Button
            type="submit"
            disabled={saving}
            className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-white font-medium text-xs rounded-xl shadow-xs"
          >
            {saving ? "Menyimpan Dokumen..." : "Simpan Surat Procurement"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
