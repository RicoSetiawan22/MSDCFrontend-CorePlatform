import { useState } from "react";
import {
  AlertCircle,
  Building2,
  X,
  UploadCloud,
  CheckCircle2,
  User,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  FileCheck2,
  Info,
} from "lucide-react";
import type {
  Vendor,
  VendorFormValues,
  VendorCategory,
  TaxStatus,
} from "../../types/vendor";

const CATEGORY_LABEL: Record<VendorCategory, string> = {
  hardware: "Hardware",
  service: "Jasa/Service",
  sparepart: "Sparepart",
  other: "Lainnya",
};

const PAYMENT_TERM_PRESETS = [
  { label: "COD (Cash on Delivery / 0 Hari)", value: 0 },
  { label: "Net 7 Hari", value: 7 },
  { label: "Net 14 Hari", value: 14 },
  { label: "Net 30 Hari (Default)", value: 30 },
  { label: "Net 45 Hari", value: 45 },
  { label: "Net 60 Hari", value: 60 },
  { label: "Net 90 Hari", value: 90 },
  { label: "Custom Hari...", value: -1 },
];

interface VendorFormModalProps {
  vendor?: Vendor | null;
  onClose: () => void;
  onSubmit: (values: VendorFormValues, file?: File | null) => void;
  isSaving?: boolean;
  error?: string | null;
  existingVendors?: Vendor[];
}

export function VendorFormModal({
  vendor,
  onClose,
  onSubmit,
  isSaving,
  error: externalError,
  existingVendors = [],
}: VendorFormModalProps) {
  const [activeTab, setActiveTab] = useState<"info" | "contact" | "tax" | "bank">("info");

  const [form, setForm] = useState<VendorFormValues>({
    vendor_name: vendor?.vendor_name ?? "",
    legal_name: vendor?.legal_name ?? "",
    npwp: vendor?.npwp ?? "",
    sppkp_number: vendor?.sppkp_number ?? "",
    tax_status: vendor?.tax_status ?? "non_pkp",
    category: vendor?.category ?? "other",
    categories: vendor?.categories ?? (vendor?.category ? [vendor.category] : ["other"]),
    category_other_detail: vendor?.category_other_detail ?? "",
    payment_term_days: vendor?.payment_term_days ?? 30,
    rating: vendor?.rating ?? undefined,
    notes: vendor?.notes ?? "",
    pic_name: vendor?.pic_name ?? "",
    pic_position: vendor?.pic_position ?? "",
    pic_phone: vendor?.pic_phone ?? "",
    pic_email: vendor?.pic_email ?? "",
    address: vendor?.address ?? "",
    city: vendor?.city ?? "",
    province: vendor?.province ?? "",
    postal_code: vendor?.postal_code ?? "",
    default_pph: vendor?.default_pph ?? "pph_23",
    currency: vendor?.currency ?? "IDR",
    credit_limit: vendor?.credit_limit ?? 0,
    nib_siup: vendor?.nib_siup ?? "",
    website: vendor?.website ?? "",
    bank_name: vendor?.bank_name ?? "",
    bank_account_number: vendor?.bank_account_number ?? "",
    bank_account_holder: vendor?.bank_account_holder ?? "",
  });

  const [isCustomPaymentTerm, setIsCustomPaymentTerm] = useState(
    !PAYMENT_TERM_PRESETS.some((p) => p.value === (vendor?.payment_term_days ?? 30) && p.value !== -1)
  );

  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    setLocalError(null);
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type !== "application/pdf") {
        setLocalError("Mohon unggah file format PDF!");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setLocalError("Ukuran file PDF tidak boleh melebihi 5MB.");
        return;
      }
      setPdfFile(file);
    }
  }

  function handleCategoryToggle(cat: VendorCategory) {
    const current = form.categories ?? [form.category];
    let updated: VendorCategory[];
    if (current.includes(cat)) {
      if (current.length === 1) return; // Keep at least one
      updated = current.filter((c) => c !== cat);
    } else {
      updated = [...current, cat];
    }
    setForm({
      ...form,
      category: updated[0],
      categories: updated,
    });
  }

  function validateForm(): string | null {
    // 1. Vendor Name
    if (!form.vendor_name || form.vendor_name.trim().length < 3) {
      return "Nama vendor minimal 3 karakter.";
    }

    // 2. Duplicate check
    const cleanName = form.vendor_name.trim().toLowerCase();
    const cleanLegal = (form.legal_name ?? "").trim().toLowerCase();
    const cleanNpwp = (form.npwp ?? "").replace(/\D/g, "");

    const isDuplicate = existingVendors.some((v) => {
      if (vendor && String(v.id) === String(vendor.id)) return false;
      const vName = v.vendor_name.toLowerCase();
      const vLegal = (v.legal_name ?? "").toLowerCase();
      const vNpwp = (v.npwp ?? "").replace(/\D/g, "");

      if (cleanNpwp && vNpwp && cleanNpwp === vNpwp) return true;
      if (cleanName === vName && cleanLegal && vLegal && cleanLegal === vLegal) return true;
      return false;
    });

    if (isDuplicate) {
      return "Peringatan duplikat: Vendor dengan NPWP atau Nama & Badan Hukum yang sama sudah terdaftar!";
    }

    // 3. Tax conditional
    if (form.tax_status === "pkp") {
      if (!cleanNpwp) {
        return "Untuk vendor berstatus PKP, Nomor NPWP wajib diisi.";
      }
      if (cleanNpwp.length !== 15 && cleanNpwp.length !== 16) {
        return "Format NPWP harus 15 digit (NPWP Lama) atau 16 digit (NPWP Baru berbasis NIK).";
      }
      if (!form.sppkp_number || form.sppkp_number.trim() === "") {
        return "Untuk status PKP, Nomor Surat Pengukuhan Pengusaha Kena Pajak (SPPKP) wajib diisi.";
      }
      if (!vendor && !pdfFile) {
        return "Untuk vendor PKP baru, lampiran bukti/dokumen SPPKP (PDF) wajib diunggah.";
      }
    } else if (cleanNpwp && cleanNpwp.length !== 15 && cleanNpwp.length !== 16) {
      return "Format NPWP harus 15 digit atau 16 digit.";
    }

    // 4. Payment Term
    if (form.payment_term_days < 0 || form.payment_term_days > 180) {
      return "Payment term harus bernilai antara 0 hingga 180 hari.";
    }

    // 5. PIC Contact
    if (!form.pic_name || form.pic_name.trim().length < 2) {
      return "Nama PIC vendor wajib diisi (minimal 2 karakter).";
    }
    if (!form.pic_phone || form.pic_phone.trim().length < 8) {
      return "Nomor telepon/WhatsApp PIC wajib diisi (minimal 8 digit).";
    }

    // 6. Address
    if (!form.address || form.address.trim().length < 5) {
      return "Alamat lengkap vendor wajib diisi (minimal 5 karakter).";
    }
    if (!form.city || form.city.trim().length < 2) {
      return "Kota vendor wajib diisi.";
    }

    // 7. Bank package validation (if one filled, all required)
    const hasAnyBank = Boolean(
      form.bank_name?.trim() ||
      form.bank_account_number?.trim() ||
      form.bank_account_holder?.trim()
    );

    if (hasAnyBank) {
      if (!form.bank_name?.trim()) return "Nama bank wajib diisi jika mengisi rekening.";
      if (!form.bank_account_number?.trim()) return "Nomor rekening bank wajib diisi.";
      if (!form.bank_account_holder?.trim()) return "Nama pemilik rekening (A.N.) wajib diisi.";
    }

    return null;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLocalError(null);

    const valErr = validateForm();
    if (valErr) {
      setLocalError(valErr);
      return;
    }

    onSubmit(form, pdfFile);
  }

  const activeError = localError || externalError;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="w-full max-w-[720px] bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-150 max-h-[92vh] flex flex-col my-auto">
        
        {/* Header Modal */}
        <div className="flex items-start justify-between p-6 pb-4 border-b border-slate-100 shrink-0 bg-slate-50/50">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-amber-500 text-white rounded-2xl shadow-sm shrink-0">
              <Building2 size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-slate-900">
                  {vendor ? "Edit Vendor Rekanan" : "Tambah Vendor Rekanan Baru"}
                </h3>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                  Master Data
                </span>
              </div>
              <p className="text-xs text-slate-500 font-normal mt-0.5">
                {vendor
                  ? `Perbarui informasi kontak, pajak, dan rekening vendor ${vendor.vendor_code}`
                  : "Lengkapi data legalitas, PIC, alamat, perpajakan, dan rekening AP"}
              </p>
            </div>
          </div>
          
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-200/60 transition-all cursor-pointer"
            title="Tutup"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 px-6 pt-3 border-b border-slate-100 shrink-0 bg-white">
          <button
            type="button"
            onClick={() => setActiveTab("info")}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === "info"
                ? "border-amber-500 text-amber-600"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Building2 size={14} />
            <span>Info & Kategori</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("contact")}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === "contact"
                ? "border-amber-500 text-amber-600"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <User size={14} />
            <span>Kontak PIC & Alamat</span>
            {(!form.pic_name || !form.address) && (
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("tax")}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === "tax"
                ? "border-amber-500 text-amber-600"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <FileCheck2 size={14} />
            <span>Pajak & Legalitas</span>
            {form.tax_status === "pkp" && !form.sppkp_number && (
              <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("bank")}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === "bank"
                ? "border-amber-500 text-amber-600"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <CreditCard size={14} />
            <span>Rekening & Keuangan</span>
          </button>
        </div>

        {/* Form Body (Scrollable) */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex flex-col gap-4">
          
          {/* TAB 1: INFORMASI UTAMA & KATEGORI */}
          {activeTab === "info" && (
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Nama Komersial Vendor <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all"
                    value={form.vendor_name}
                    onChange={(e) => setForm({ ...form, vendor_name: e.target.value })}
                    placeholder="mis. Toko Jaya Mandiri"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">Nama yang tampil pada PO, RFQ, dan filter.</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Nama Badan Hukum (Legal)
                  </label>
                  <input
                    type="text"
                    className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all"
                    value={form.legal_name ?? ""}
                    onChange={(e) => setForm({ ...form, legal_name: e.target.value })}
                    placeholder="mis. PT Jaya Mandiri Sejahtera"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">Untuk verifikasi rekening bank & faktur pajak.</p>
                </div>
              </div>

              {/* Multi-Select Kategori Vendor */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Kategori Vendor (Bisa Pilih Lebih dari 1) <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(Object.entries(CATEGORY_LABEL) as [VendorCategory, string][]).map(([key, label]) => {
                    const isSelected = (form.categories ?? [form.category]).includes(key);
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => handleCategoryToggle(key)}
                        className={`px-3 py-2 rounded-xl text-xs font-medium border text-left transition-all cursor-pointer flex items-center justify-between ${
                          isSelected
                            ? "bg-amber-50 border-amber-400 text-amber-800 font-semibold"
                            : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                        }`}
                      >
                        <span>{label}</span>
                        {isSelected && <CheckCircle2 size={14} className="text-amber-600 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Detail Kategori Jika Lainnya */}
              {(form.categories ?? [form.category]).includes("other") && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Detail Kategori Lainnya
                  </label>
                  <input
                    type="text"
                    className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all"
                    value={form.category_other_detail ?? ""}
                    onChange={(e) =>
                      setForm({ ...form, category_other_detail: e.target.value })
                    }
                    placeholder="mis. Katering, Sewa Alat, Transportasi Logistik"
                  />
                </div>
              )}

              {/* Payment Term dengan Preset & Batas Wajar (0 - 180 Hari) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2 border-t border-slate-100">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Ketentuan Pembayaran (Payment Term)
                  </label>
                  <select
                    className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:bg-white focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all"
                    value={isCustomPaymentTerm ? -1 : form.payment_term_days}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      if (val === -1) {
                        setIsCustomPaymentTerm(true);
                      } else {
                        setIsCustomPaymentTerm(false);
                        setForm({ ...form, payment_term_days: val });
                      }
                    }}
                  >
                    {PAYMENT_TERM_PRESETS.map((p) => (
                      <option key={p.value} value={p.value}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                </div>

                {isCustomPaymentTerm && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Jumlah Hari Custom (Maks. 180 Hari) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={180}
                      className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all"
                      value={form.payment_term_days}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          payment_term_days: Math.min(180, Math.max(0, Number(e.target.value))),
                        })
                      }
                      placeholder="Contoh: 45"
                    />
                  </div>
                )}
              </div>

              {/* Website & Catatan */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Website Vendor (Opsional)
                  </label>
                  <input
                    type="url"
                    className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-amber-500 transition-all"
                    value={form.website ?? ""}
                    onChange={(e) => setForm({ ...form, website: e.target.value })}
                    placeholder="https://www.vendor.co.id"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Catatan Internal / Riwayat Kerjasama
                  </label>
                  <input
                    type="text"
                    className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-amber-500 transition-all"
                    value={form.notes ?? ""}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    placeholder="mis. Vendor langganan maintenance AC cabang Surabaya"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: KONTAK PIC & ALAMAT LENGKAP */}
          {activeTab === "contact" && (
            <div className="flex flex-col gap-4">
              <div className="p-3 bg-amber-50/70 border border-amber-200/60 rounded-xl text-xs text-amber-900 flex items-start gap-2">
                <Info size={16} className="shrink-0 text-amber-600 mt-0.5" />
                <span>
                  Kontak PIC & alamat lengkap merupakan informasi wajib sebagai dasar penerbitan RFQ, Purchase Order resmi, dan koordinasi klaim garansi.
                </span>
              </div>

              {/* Data PIC Vendor */}
              <div className="bg-slate-50/60 p-4 rounded-2xl border border-slate-200/80 flex flex-col gap-3">
                <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <User size={15} className="text-amber-600" />
                  <span>Person in Charge (PIC) Vendor</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Nama Lengkap PIC <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-amber-500 transition-all"
                      value={form.pic_name ?? ""}
                      onChange={(e) => setForm({ ...form, pic_name: e.target.value })}
                      placeholder="mis. Budi Santoso"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Jabatan / Divisi
                    </label>
                    <input
                      type="text"
                      className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-amber-500 transition-all"
                      value={form.pic_position ?? ""}
                      onChange={(e) => setForm({ ...form, pic_position: e.target.value })}
                      placeholder="mis. Account Executive / Sales Manager"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      No. Telepon / WhatsApp <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Phone size={14} className="absolute left-3 top-3 text-slate-400" />
                      <input
                        type="tel"
                        required
                        className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-amber-500 transition-all font-mono"
                        value={form.pic_phone ?? ""}
                        onChange={(e) => setForm({ ...form, pic_phone: e.target.value })}
                        placeholder="081234567890"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Email PIC / Sales
                    </label>
                    <div className="relative">
                      <Mail size={14} className="absolute left-3 top-3 text-slate-400" />
                      <input
                        type="email"
                        className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-amber-500 transition-all"
                        value={form.pic_email ?? ""}
                        onChange={(e) => setForm({ ...form, pic_email: e.target.value })}
                        placeholder="sales@vendor.co.id"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Alamat Lengkap */}
              <div className="bg-slate-50/60 p-4 rounded-2xl border border-slate-200/80 flex flex-col gap-3">
                <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <MapPin size={15} className="text-amber-600" />
                  <span>Alamat Operasional & Pengiriman</span>
                </h4>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Alamat Jalan / Gedung / Ruko <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    rows={2}
                    required
                    className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-amber-500 transition-all resize-none"
                    value={form.address ?? ""}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                    placeholder="mis. Jl. Basuki Rahmat No. 128, Ruko Surya Perkasa Blok B-4"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Kota / Kabupaten <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-amber-500 transition-all"
                      value={form.city ?? ""}
                      onChange={(e) => setForm({ ...form, city: e.target.value })}
                      placeholder="mis. Surabaya"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Provinsi
                    </label>
                    <input
                      type="text"
                      className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-amber-500 transition-all"
                      value={form.province ?? ""}
                      onChange={(e) => setForm({ ...form, province: e.target.value })}
                      placeholder="mis. Jawa Timur"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Kode Pos
                    </label>
                    <input
                      type="text"
                      className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-amber-500 transition-all font-mono"
                      value={form.postal_code ?? ""}
                      onChange={(e) => setForm({ ...form, postal_code: e.target.value })}
                      placeholder="60271"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: PERPAJAKAN & LEGALITAS */}
          {activeTab === "tax" && (
            <div className="flex flex-col gap-4">
              {/* Status Pajak */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Status Perpajakan <span className="text-red-500">*</span>
                  </label>
                  <select
                    className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:bg-white focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all"
                    value={form.tax_status ?? "non_pkp"}
                    onChange={(e) =>
                      setForm({ ...form, tax_status: e.target.value as TaxStatus })
                    }
                  >
                    <option value="pkp">PKP (Pengusaha Kena Pajak — PPN 12%)</option>
                    <option value="non_pkp">Non-PKP (Bebas PPN / Usaha Kecil)</option>
                    <option value="pemungut">Pemungut Pajak / BUMN</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Nomor Pokok Wajib Pajak (NPWP){" "}
                    {form.tax_status === "pkp" && <span className="text-red-500">*</span>}
                  </label>
                  <input
                    type="text"
                    required={form.tax_status === "pkp"}
                    className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all font-mono"
                    value={form.npwp ?? ""}
                    onChange={(e) => {
                      // Terima 15 atau 16 digit format bebas atau bertitik
                      setForm({ ...form, npwp: e.target.value });
                    }}
                    placeholder="15 digit (Lama) / 16 digit (NIK Baru)"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    {form.tax_status === "pkp"
                      ? "Wajib untuk PKP (15 atau 16 digit)."
                      : "Opsional untuk Non-PKP."}
                  </p>
                </div>
              </div>

              {/* Jika PKP: No SPPKP & Upload Dokumen Wajib */}
              {form.tax_status === "pkp" && (
                <div className="p-4 bg-amber-50/50 border border-amber-200 rounded-2xl flex flex-col gap-3">
                  <div className="flex items-center gap-2">
                    <FileCheck2 size={16} className="text-amber-600" />
                    <span className="text-xs font-bold text-amber-900">
                      Kelengkapan Berkas PKP (Surat Pengukuhan Pengusaha Kena Pajak)
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Nomor SPPKP <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-amber-500 font-mono"
                      value={form.sppkp_number ?? ""}
                      onChange={(e) => setForm({ ...form, sppkp_number: e.target.value })}
                      placeholder="mis. S-1234PKP/WPJ.11/KP.0303/2024"
                    />
                  </div>
                </div>
              )}

              {/* Upload PDF Dokumen Legalitas / SPPKP / NPWP */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Unggah Dokumen SPPKP / Kartu NPWP / Legalitas (PDF{" "}
                  {form.tax_status === "pkp" && !vendor ? "Wajib" : "Opsional"})
                </label>
                <div className="relative border-2 border-dashed border-slate-200 hover:border-amber-400 rounded-2xl p-4 bg-slate-50/50 hover:bg-amber-50/20 transition-all text-center group cursor-pointer">
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={handleFileChange}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                  {pdfFile ? (
                    <div className="flex items-center justify-center gap-2 text-emerald-600 font-medium text-xs">
                      <CheckCircle2 size={18} />
                      <span className="truncate max-w-[280px]">{pdfFile.name}</span>
                      <span className="text-slate-400 text-[11px]">
                        ({(pdfFile.size / 1024 / 1024).toFixed(2)} MB)
                      </span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-1">
                      <UploadCloud size={24} className="text-slate-400 group-hover:text-amber-500 transition-colors" />
                      <p className="text-xs font-medium text-slate-600">
                        <span className="text-amber-600 font-semibold">Klik untuk upload</span> atau drag file PDF
                      </p>
                      <p className="text-[11px] text-slate-400">PDF Kartu NPWP / SK PKP / NIB (Maks. 5MB)</p>
                    </div>
                  )}
                </div>
              </div>

              {/* NIB / SIUP & PPh Default */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Nomor Induk Berusaha (NIB) / SIUP
                  </label>
                  <input
                    type="text"
                    className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-amber-500 transition-all font-mono"
                    value={form.nib_siup ?? ""}
                    onChange={(e) => setForm({ ...form, nib_siup: e.target.value })}
                    placeholder="mis. 9120001234567"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Jenis PPh Default (Otomatis Masuk di FPP)
                  </label>
                  <select
                    className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:bg-white focus:outline-none focus:border-amber-500 transition-all"
                    value={form.default_pph ?? "pph_23"}
                    onChange={(e) => setForm({ ...form, default_pph: e.target.value })}
                  >
                    <option value="none">Bebas PPh (0%)</option>
                    <option value="pph_23">PPh 23 — Jasa (2%)</option>
                    <option value="pph_22">PPh 22 — Pengadaan Barang (1.5%)</option>
                    <option value="pph_4_2">PPh 4(2) — Sewa Gedung / Konstruksi</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: REKENING & FINANSIAL */}
          {activeTab === "bank" && (
            <div className="flex flex-col gap-4">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 flex items-start gap-2">
                <Info size={16} className="shrink-0 text-slate-400 mt-0.5" />
                <span>
                  Informasi rekening digunakan oleh tim Finance saat approval FPP (Payment Request) dan pencairan AP Bill. Pengisian rekening dibuat satu paket (Nama Bank, Nomor, dan Atas Nama).
                </span>
              </div>

              {/* Rekening Bank Satu Paket */}
              <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-200/80 flex flex-col gap-3">
                <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <CreditCard size={15} className="text-amber-600" />
                  <span>Rekening Pencairan Tagihan (AP Vendor)</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Nama Bank
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-amber-500 transition-all"
                      value={form.bank_name ?? ""}
                      onChange={(e) => setForm({ ...form, bank_name: e.target.value })}
                      placeholder="mis. BCA / Mandiri / BNI"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Nomor Rekening
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-amber-500 transition-all font-mono"
                      value={form.bank_account_number ?? ""}
                      onChange={(e) => setForm({ ...form, bank_account_number: e.target.value })}
                      placeholder="mis. 8290123456"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Atas Nama (A.N.)
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-amber-500 transition-all"
                      value={form.bank_account_holder ?? ""}
                      onChange={(e) => setForm({ ...form, bank_account_holder: e.target.value })}
                      placeholder="Sesuai buku tabungan / legal"
                    />
                  </div>
                </div>

                {form.bank_account_holder && form.legal_name && (
                  <p className="text-[11px] text-slate-400">
                    💡 Rekomendasi audit: Atas nama rekening sebaiknya sesuai dengan nama badan hukum (
                    <span className="font-semibold text-slate-600">{form.legal_name}</span>).
                  </p>
                )}
              </div>

              {/* Pengaturan Mata Uang & Limit Kredit */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Mata Uang Transaksi
                  </label>
                  <select
                    className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:bg-white focus:outline-none focus:border-amber-500 transition-all"
                    value={form.currency ?? "IDR"}
                    onChange={(e) => setForm({ ...form, currency: e.target.value })}
                  >
                    <option value="IDR">IDR — Indonesian Rupiah</option>
                    <option value="USD">USD — US Dollar</option>
                    <option value="SGD">SGD — Singapore Dollar</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Limit Kredit / Plafon Utang PO (Rp)
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={1000000}
                    className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-amber-500 transition-all font-mono"
                    value={form.credit_limit ?? 0}
                    onChange={(e) => setForm({ ...form, credit_limit: Number(e.target.value) })}
                    placeholder="0 = Tanpa batas limit"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {activeError && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle size={16} className="shrink-0" />
              <span>{activeError}</span>
            </div>
          )}

          {/* Footer Buttons */}
          <div className="flex items-center justify-between pt-3 mt-1 shrink-0 border-t border-slate-100">
            <div className="text-xs text-slate-400">
              Bagian: <span className="font-semibold text-slate-700 capitalize">{activeTab}</span> (4 Tab)
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-medium text-sm transition-all cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-95 text-white font-medium text-sm shadow-sm transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? "Menyimpan..." : vendor ? "Perbarui Vendor" : "Simpan Vendor Baru"}
              </button>
            </div>
          </div>

        </form>
      </div>
    </div>
  );
}