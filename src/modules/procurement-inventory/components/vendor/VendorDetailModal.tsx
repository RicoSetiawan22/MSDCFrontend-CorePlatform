import {
  Building2,
  FileSpreadsheet,
  CreditCard,
  FileText,
  ShieldCheck,
  ExternalLink,
  Landmark,
} from "lucide-react";
import { Modal } from "@shared/components/Modal";
import { Button } from "@shared/components/Button";
import type { Vendor, VendorCategory } from "../../types/vendor";

const CATEGORY_LABEL: Record<VendorCategory, string> = {
  hardware: "Hardware",
  service: "Jasa / Service",
  sparepart: "Sparepart",
  other: "Lainnya",
};

function formatNPWP(npwp: string): string {
  const clean = npwp.replace(/\D/g, "");
  if (clean.length === 15) {
    return clean.replace(
      /(\d{2})(\d{3})(\d{3})(\d{1})(\d{3})(\d{3})/,
      "$1.$2.$3.$4-$5.$6"
    );
  }
  return npwp;
}

interface VendorDetailModalProps {
  vendor: Vendor;
  onClose: () => void;
}

export function VendorDetailModal({ vendor, onClose }: VendorDetailModalProps) {
  return (
    <Modal title="Audit & Profil Detail Vendor" onClose={onClose} maxWidth={640}>
      <div className="flex flex-col gap-5 py-1">
        
        {/* Header Profil & Status Verifikasi Audit */}
        <div className="flex items-start justify-between bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-amber-600 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-md">
                {vendor.vendor_code}
              </span>
              {vendor.is_verified && (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                  <ShieldCheck size={13} /> Terverifikasi Audit
                </span>
              )}
            </div>
            <h3 className="text-lg font-bold text-slate-900 mt-2">
              {vendor.vendor_name}
            </h3>
            {vendor.legal_name && (
              <p className="text-xs text-slate-500 font-medium">
                {vendor.legal_name}
              </p>
            )}
          </div>
          <span
            className={`px-3 py-1 rounded-full text-xs font-medium border ${
              vendor.status === "active"
                ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                : vendor.status === "blacklisted"
                ? "bg-red-50 text-red-600 border-red-200"
                : "bg-slate-100 text-slate-600 border-slate-200"
            }`}
          >
            {vendor.status === "active"
              ? "Aktif"
              : vendor.status === "blacklisted"
              ? "Blacklist"
              : "Nonaktif"}
          </span>
        </div>

        {/* Informasi Utama Perpajakan & Pembayaran */}
        <div className="grid grid-cols-2 gap-3.5 text-sm">
          <div className="flex flex-col gap-1 p-3.5 bg-white border border-slate-200/80 rounded-xl">
            <span className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
              <FileSpreadsheet size={14} className="text-emerald-500" /> STATUS PAJAK
            </span>
            <span className="font-semibold text-slate-800">
              {vendor.tax_status === "pkp"
                ? "PKP (PPN 12%)"
                : vendor.tax_status === "pemungut"
                ? "Pemungut PPN Khusus"
                : "Non-PKP"}
            </span>
          </div>

          <div className="flex flex-col gap-1 p-3.5 bg-white border border-slate-200/80 rounded-xl">
            <span className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
              <Building2 size={14} className="text-blue-500" /> NOMOR NPWP
            </span>
            <span className="font-mono text-xs font-semibold text-slate-800">
              {vendor.npwp ? formatNPWP(vendor.npwp) : "Belum Diisi"}
            </span>
          </div>

          <div className="flex flex-col gap-1 p-3.5 bg-white border border-slate-200/80 rounded-xl">
            <span className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
              <CreditCard size={14} className="text-amber-500" /> PAYMENT TERM
            </span>
            <span className="font-semibold text-slate-800">
              Net {vendor.payment_term_days} hari
            </span>
          </div>

          <div className="flex flex-col gap-1 p-3.5 bg-white border border-slate-200/80 rounded-xl">
            <span className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
              <Building2 size={14} className="text-purple-500" /> KATEGORI
            </span>
            <span className="font-semibold text-slate-800">
              {CATEGORY_LABEL[vendor.category] ?? vendor.category}
            </span>
          </div>
        </div>

        {/* Seksi Rekening Pencairan AP Bill (Penting untuk Finance) */}
        <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl flex flex-col gap-2">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-600">
            <Landmark size={15} className="text-indigo-500" />
            <span>Rekening Bank Pencairan Tagihan (AP Bill)</span>
          </div>
          {vendor.bank_account_number ? (
            <div className="grid grid-cols-3 gap-2 mt-1 text-xs">
              <div>
                <span className="text-slate-400 block">Bank:</span>
                <span className="font-semibold text-slate-800">{vendor.bank_name ?? "-"}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Nomor Rekening:</span>
                <span className="font-mono font-semibold text-slate-800">{vendor.bank_account_number}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Atas Nama (A.N):</span>
                <span className="font-semibold text-slate-800">{vendor.bank_account_holder ?? "-"}</span>
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-400 italic mt-1">Data rekening bank belum dimasukkan.</p>
          )}
        </div>

        {/* Seksi Lampiran Berkas PDF Audit */}
        <div className="flex flex-col gap-2">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Dokumen Legalitas & Audit (PDF)
          </span>
          {vendor.documents && vendor.documents.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {vendor.documents.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-3 bg-white border border-slate-200/90 rounded-xl hover:border-amber-400 transition-all"
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <FileText size={18} className="text-amber-500 shrink-0" />
                    <div className="truncate">
                      <p className="text-xs font-medium text-slate-800 truncate">{doc.file_name}</p>
                      <p className="text-[10px] text-slate-400 uppercase">{doc.document_type.replace("_", " ")}</p>
                    </div>
                  </div>
                  <a
                    href={doc.file_url}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                    title="Buka / Download Dokumen"
                  >
                    <ExternalLink size={15} />
                  </a>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-3 bg-slate-50 border border-slate-200/60 rounded-xl text-center text-xs text-slate-400">
              Belum ada berkas PDF legalitas yang diunggah.
            </div>
          )}
        </div>

        {/* Catatan Internal */}
        <div className="flex flex-col gap-1 p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl">
          <span className="text-xs font-semibold text-slate-500 flex items-center gap-1.5 uppercase tracking-wider">
            Catatan Internal
          </span>
          <p className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed">
            {vendor.notes && vendor.notes.trim() !== ""
              ? vendor.notes
              : "Tidak ada catatan khusus."}
          </p>
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-2">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            className="px-5 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 font-medium text-sm"
          >
            Tutup
          </Button>
        </div>
      </div>
    </Modal>
  );
}