import { useState } from "react";
import { Modal } from "@shared/components/Modal";
import { Button } from "@shared/components/Button";
import { useFilePreview } from "../api/useFilePreview";
import { 
  Building2, FileText, ShieldCheck, Layers, Image as ImageIcon 
} from "lucide-react";
import type { Organization } from "@shared/types/organization";

interface LetterheadPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  organizations: Organization[];
  onOpenUploadLogo: () => void;
}

function PreviewLogo({ fileId }: { fileId: number | null | undefined }) {
  const { url, isLoading } = useFilePreview(fileId);

  if (isLoading) {
    return (
      <div className="w-16 h-16 rounded-xl bg-slate-100 flex items-center justify-center text-[10px] text-slate-400 animate-pulse border border-slate-200">
        Memuat...
      </div>
    );
  }

  if (url) {
    return (
      <div className="w-16 h-16 flex items-center justify-center overflow-hidden">
        <img src={url} alt="Logo Kop Surat" className="max-w-full max-h-full object-contain" />
      </div>
    );
  }

  return (
    <div className="w-16 h-16 rounded-xl bg-amber-50 flex flex-col items-center justify-center text-amber-600 border border-amber-200 text-center p-1">
      <Building2 size={24} />
      <span className="text-[9px] font-bold mt-0.5">LOGO</span>
    </div>
  );
}

export function LetterheadPreviewModal({
  isOpen,
  onClose,
  organizations,
  onOpenUploadLogo,
}: LetterheadPreviewModalProps) {
  const internalOrgs = organizations.filter((o) => o.type === "internal");
  const [selectedOrgId, setSelectedOrgId] = useState<number>(internalOrgs[0]?.id ?? 0);

  const currentOrg = internalOrgs.find((o) => o.id === selectedOrgId) ?? internalOrgs[0];

  if (!isOpen) return null;

  return (
    <Modal title="Konfigurasi & Pratinjau Format Dokumen PDF Resmi" onClose={onClose} maxWidth={800}>
      <div className="space-y-6">
        {/* Selector & Action Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80">
          <div className="flex items-center gap-2 flex-1">
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wide shrink-0">
              Pilih Cabang:
            </span>
            <select
              className="text-xs font-bold text-slate-800 bg-white border border-slate-300 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-xs cursor-pointer flex-1 max-w-xs"
              value={selectedOrgId}
              onChange={(e) => setSelectedOrgId(Number(e.target.value))}
            >
              {internalOrgs.map((org) => (
                <option key={org.id} value={org.id}>
                  {org.name} ({org.code})
                </option>
              ))}
            </select>
          </div>
          <button
            type="button"
            onClick={onOpenUploadLogo}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-bold text-amber-700 bg-amber-100/80 hover:bg-amber-200 rounded-xl transition cursor-pointer"
          >
            <ImageIcon size={14} /> Ganti Logo Cabang Ini
          </button>
        </div>

        {/* Live Simulated Paper (Kop Surat Resmi) */}
        <div className="bg-white border-2 border-slate-200/90 rounded-2xl p-6 sm:p-8 shadow-md relative overflow-hidden font-serif">
          {/* Watermark simulasi preview */}
          <div className="absolute right-4 top-4 select-none pointer-events-none opacity-20 rotate-[-12deg] text-amber-500 font-sans font-black text-xs border border-amber-500 px-2 py-0.5 rounded">
            PREVIEW FORMAT PDF
          </div>

          {/* KOP SURAT HEADER */}
          <div className="flex items-center gap-5 pb-3">
            <div className="shrink-0">
              <PreviewLogo fileId={currentOrg?.logo_file_id} />
            </div>
            <div className="flex-1 text-center pr-12">
              <h2 className="text-base sm:text-lg font-black tracking-wider text-slate-900 uppercase font-sans">
                {currentOrg?.name ?? "PT MULTIDAYA SOLUSI CORPORA"}
              </h2>
              <p className="text-[11.5px] text-slate-700 font-sans leading-tight mt-0.5">
                {currentOrg?.address_line_1 || "Gedung Cyber Data Center Lantai 3, Jl. Ahmad Yani No. 123"}
                {currentOrg?.address_line_2 ? `, ${currentOrg.address_line_2}` : ", Surabaya, Jawa Timur 60231"}
              </p>
              <p className="text-[11px] text-slate-600 font-sans leading-tight mt-0.5">
                {currentOrg?.pic_phone ? `Telp: ${currentOrg.pic_phone}` : "Telp: (031) 8472910"} |{" "}
                {currentOrg?.pic_email ? `Email: ${currentOrg.pic_email}` : "Email: sekretariat@msdc.co.id"}
                {currentOrg?.npwp && ` | NPWP: ${currentOrg.npwp}`}
              </p>
            </div>
          </div>

          {/* Garis Ganda Pemisah Khas Kop Surat Resmi */}
          <div className="border-b-[3px] border-slate-900 pb-0.5 mb-5">
            <div className="border-b border-slate-900"></div>
          </div>

          {/* DUMMY KONTEN DOKUMEN CETAK */}
          <div className="text-slate-800 text-xs font-sans space-y-3 leading-relaxed">
            <div className="flex justify-between text-[11px] font-medium text-slate-600">
              <div>
                <p>Nomor : 001/DIR-MSDC/X/2026</p>
                <p>Lampiran : 1 (satu) Berkas</p>
                <p>Perihal : Format Acuan Dokumen Ekosistem ERP</p>
              </div>
              <div className="text-right">
                <p>Surabaya, 19 Oktober 2026</p>
              </div>
            </div>

            <div className="pt-2">
              <p className="font-bold text-slate-900">Kepada Yth.</p>
              <p className="font-semibold text-slate-800">Seluruh Kepala Divisi &amp; Mitra Terkait</p>
              <p className="text-slate-600">di Tempat</p>
            </div>

            <p className="pt-2 text-justify">
              Dengan hormat, bersama dokumen ini disampaikan bahwa format kop surat resmi di atas secara otomatis diintegrasikan sebagai header resmi generator dokumen PDF pada ekosistem <strong>MSDC ERP Surabaya</strong>.
            </p>

            {/* Simulated Tanda Tangan */}
            <div className="pt-6 flex justify-end text-center font-sans">
              <div className="w-56 space-y-1">
                <p className="text-xs font-bold text-slate-700">Hormat kami,</p>
                <p className="text-[11px] text-slate-500 font-semibold">{currentOrg?.name}</p>
                <div className="h-16 flex items-center justify-center text-slate-300 italic text-[11px]">
                  [ Tanda Tangan &amp; Stempel Digital ]
                </div>
                <p className="text-xs font-bold text-slate-900 underline underline-offset-2">
                  {currentOrg?.pic_name || "Direktur Utama"}
                </p>
                <p className="text-[10px] text-slate-500">Pimpinan Cabang Operasional</p>
              </div>
            </div>
          </div>
        </div>

        {/* Info Integrasi Generator Dokumen di MSDC */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 font-sans">
          <div className="p-3 bg-amber-50/60 border border-amber-200/80 rounded-xl">
            <div className="flex items-center gap-2 text-amber-800 font-bold text-xs mb-1">
              <FileText size={15} className="text-amber-600" />
              <span>CRM &amp; Sales</span>
            </div>
            <p className="text-[11px] text-slate-600 leading-normal">
              Acuan kop surat resmi pada Cetak Surat Penawaran (Quotation) &amp; Nota Invoice tagihan pelanggan.
            </p>
          </div>

          <div className="p-3 bg-blue-50/60 border border-blue-200/80 rounded-xl">
            <div className="flex items-center gap-2 text-blue-800 font-bold text-xs mb-1">
              <Layers size={15} className="text-blue-600" />
              <span>Pengadaan &amp; Logistik</span>
            </div>
            <p className="text-[11px] text-slate-600 leading-normal">
              Acuan kop surat pada Purchase Order (PO), Surat Jalan, dan Dokumen Berita Acara Penerimaan Barang.
            </p>
          </div>

          <div className="p-3 bg-emerald-50/60 border border-emerald-200/80 rounded-xl">
            <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs mb-1">
              <ShieldCheck size={15} className="text-emerald-600" />
              <span>Surat &amp; Disposisi</span>
            </div>
            <p className="text-[11px] text-slate-600 leading-normal">
              Acuan resmi pada Buku Petunjuk PDF, Lembar Disposisi Surat Masuk, dan Surat Dinas Keluar.
            </p>
          </div>
        </div>

        {/* Modal Action Buttons */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 font-sans">
          <Button type="button" variant="secondary" onClick={onClose}>
            Tutup Pratinjau
          </Button>
        </div>
      </div>
    </Modal>
  );
}
