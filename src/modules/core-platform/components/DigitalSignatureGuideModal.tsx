import { Modal } from "@shared/components/Modal";
import { useNavigate } from "react-router-dom";
import {
  ShieldCheck,
  QrCode,
  FileCheck2,
  ExternalLink,
  CheckCircle2,
  Scan,
  Hash,
} from "lucide-react";

interface DigitalSignatureGuideModalProps {
  onClose: () => void;
}

export function DigitalSignatureGuideModal({ onClose }: DigitalSignatureGuideModalProps) {
  const navigate = useNavigate();

  return (
    <Modal title="Spesifikasi Tanda Tangan Digital & Audit Trail" onClose={onClose}>
      <div className="space-y-6 max-w-2xl text-slate-800">
        {/* Banner Penjelasan Standar Keamanan */}
        <div className="p-4 bg-emerald-50/80 border border-emerald-200/90 rounded-2xl flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-sm">
            <ShieldCheck size={22} />
          </div>
          <div className="text-xs leading-relaxed text-emerald-950">
            <h4 className="font-bold text-sm text-emerald-900 mb-0.5">
              Standar Integritas Dokumen & QR Digital Stamp
            </h4>
            <p className="text-emerald-800">
              Setiap kali pejabat approver menyetujui dokumen (Surat, PO, Kontrak, atau Form Permohonan),
              sistem Core Platform secara otomatis membubuhkan stempel digital kriptografi berstandar audit ISO 27001.
            </p>
          </div>
        </div>

        {/* Visual Mockup Stempel QR Digital */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium">
            <span>Pratinjau Stempel Resmi pada Lembar Cetak PDF:</span>
            <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono">Mockup Visual</span>
          </div>

          <div className="p-5 bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl shadow-lg border border-slate-700 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
              <QrCode size={140} />
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-5 relative z-10">
              {/* Box QR Code Visual */}
              <div className="w-28 h-28 bg-white p-2.5 rounded-xl flex flex-col items-center justify-center shadow-md shrink-0">
                <QrCode size={80} className="text-slate-900" />
                <span className="text-[9px] font-extrabold text-slate-800 tracking-tighter mt-1 uppercase">
                  MSDC VERIFIED
                </span>
              </div>

              {/* Spesifikasi Dokumen */}
              <div className="space-y-1.5 text-center sm:text-left flex-1">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  <CheckCircle2 size={11} /> VALID DIGITAL CERTIFICATE
                </div>
                <h3 className="text-sm font-bold text-white tracking-wide">
                  PT MULTI SPASIAL DATA CENTER (MSDC)
                </h3>
                <p className="text-xs text-slate-300">
                  Otentikasi Kriptografi: <span className="font-mono text-amber-400 font-semibold">SHA-256 HMAC Hash</span>
                </p>
                <div className="text-[11px] text-slate-400 font-mono pt-1">
                  UUID: e9b4-82a1-msdc-7f09 • Timestamp Presisi UTC+7
                </div>
              </div>
            </div>
          </div>

          <p className="text-[11px] text-slate-500 italic">
            * QR Code asli yang scannable digenerate otomatis oleh sistem backend di lembar PDF surat ketika Anda menekan tombol Approve.
          </p>
        </div>

        {/* 3 Tahap Alur Verifikasi */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl space-y-1">
            <div className="flex items-center gap-2 text-amber-600 font-bold text-xs">
              <Hash size={14} />
              <span>1. Enkripsi Hash</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-normal">
              Data transaksi di-hash saat approval. Bila dokumen diubah 1 karakter saja, QR code otomatis menjadi invalid.
            </p>
          </div>

          <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl space-y-1">
            <div className="flex items-center gap-2 text-blue-600 font-bold text-xs">
              <Scan size={14} />
              <span>2. Scan Publik Bebas</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-normal">
              Pihak eksternal / klien dapat memindai stempel QR pada cetakan PDF menggunakan kamera smartphone tanpa perlu login.
            </p>
          </div>

          <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl space-y-1">
            <div className="flex items-center gap-2 text-emerald-600 font-bold text-xs">
              <FileCheck2 size={14} />
              <span>3. Legalitas Sah</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-normal">
              Halaman verifikasi resmi menampilkan nama penandatangan, jabatan, nomor surat, dan riwayat sah audit.
            </p>
          </div>
        </div>

        {/* Tombol Aksi Simulator */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-200">
          <span className="text-xs text-slate-500">
            Ingin menguji cara kerja sistem verifikasi publik?
          </span>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-initial px-3.5 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
            >
              Tutup
            </button>
            <button
              type="button"
              onClick={() => {
                onClose();
                navigate("/verify");
              }}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-sm transition"
            >
              <ExternalLink size={14} />
              <span>Uji Verifikasi Surat (/verify)</span>
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
