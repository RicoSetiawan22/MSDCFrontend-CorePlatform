import React, { useState, useMemo, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  FileText,
  Calendar,
  User,
  Layers,
  ArrowRightLeft,
  ChevronRight,
  ArrowLeft,
  Info,
  AlertCircle,
  Loader2,
  Plus,
} from "lucide-react";
import { PageHeader } from "@shared/components/PageHeader";
import { extractErrorMessage } from "@shared/types/api";
import { EmployeePicker, type EmployeePickerResult } from "@modules/hr-service-support/components/EmployeePicker";
import {
  useDocumentTypes,
  useDocumentTemplates,
  useCreateDocument,
} from "@modules/document-management/api/useDocuments";
import type { DocumentDirection } from "@modules/document-management/types/document";

function extractPlaceholders(content: string): string[] {
  const matches = content.matchAll(/\{\{\s*(\w+)\s*\}\}/g);
  const names = new Set<string>();
  for (const m of matches) {
    if (m[1] !== "nomor_surat") names.add(m[1]);
  }
  return Array.from(names);
}

function todayLocalDate(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

export function SuratDcOpsCreatePage() {
  const navigate = useNavigate();

  // ── Master Queries ──
  const { data: docTypes, isLoading: isTypesLoading } = useDocumentTypes();
  const { data: templates } = useDocumentTemplates();
  const createDocument = useCreateDocument();

  // Filter jenis surat untuk modul Data Center Ops
  const availableTypes = useMemo(() => {
    if (!docTypes) return [];
    const dcTypes = docTypes.filter((t) => t.meta.module === "data-center-ops");
    return dcTypes.length > 0 ? dcTypes : docTypes;
  }, [docTypes]);

  // ── Form States ──
  const [documentType, setDocumentType] = useState<string>("");
  const [title, setTitle] = useState("");
  const [issuedDate, setIssuedDate] = useState(todayLocalDate());
  const [direction, setDirection] = useState<DocumentDirection>("internal");

  // Mode Penerima: 'external' (Vendor/Client/Visitor) vs 'internal' (Employee)
  const [recipientMode, setRecipientMode] = useState<"external" | "internal">(
    "external"
  );
  const [issuedToName, setIssuedToName] = useState("");
  const [issuedToCompany, setIssuedToCompany] = useState("");
  const [employee, setEmployee] = useState<EmployeePickerResult | null>(null);
  const [isPickingEmployee, setIsPickingEmployee] = useState(false);

  // Variabel Template & Isi Manual
  const [templateId, setTemplateId] = useState<number | "">("");
  const [fieldData, setFieldData] = useState<Record<string, string>>({});
  const [manualBody, setManualBody] = useState("");

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Pilih tipe pertama secara otomatis saat master dimuat
  useEffect(() => {
    if (availableTypes.length > 0 && !documentType) {
      const defaultT = availableTypes[0];
      setDocumentType(defaultT.code);
      setDirection(defaultT.meta.direction ?? "internal");
    }
  }, [availableTypes, documentType]);

  const selectedType = useMemo(
    () => availableTypes.find((t) => t.code === documentType),
    [availableTypes, documentType]
  );

  // Perbarui template default saat tipe berubah
  useEffect(() => {
    if (selectedType) {
      setDirection(selectedType.meta.direction ?? "internal");
      setTemplateId(selectedType.meta.default_template_id ?? "");
      setFieldData({});
    }
  }, [selectedType]);

  const selectedTemplate = useMemo(
    () => templates?.find((t) => t.id === templateId),
    [templates, templateId]
  );

  const placeholders = useMemo(
    () => (selectedTemplate ? extractPlaceholders(selectedTemplate.content) : []),
    [selectedTemplate]
  );

  // ── Handler Submit ──
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!documentType) {
      setErrorMessage("Silakan pilih jenis dokumen operasional.");
      return;
    }
    if (!title.trim()) {
      setErrorMessage("Judul / Perihal surat wajib diisi.");
      return;
    }

    let finalRecipientName = "";
    let finalRecipientType = "external";
    let finalRecipientRef: string | undefined = undefined;

    if (recipientMode === "internal") {
      if (!employee) {
        setErrorMessage("Silakan pilih karyawan internal penerima tugas.");
        return;
      }
      finalRecipientName = employee.full_name;
      finalRecipientType = "employee";
      finalRecipientRef = String(employee.id);
    } else {
      if (!issuedToName.trim()) {
        setErrorMessage("Nama pihak penerima / kontak wajib diisi.");
        return;
      }
      finalRecipientName = issuedToCompany.trim()
        ? `${issuedToName.trim()} (${issuedToCompany.trim()})`
        : issuedToName.trim();
      finalRecipientType = "external";
    }

    setErrorMessage(null);

    createDocument.mutate(
      {
        module_code: "data-center-ops",
        document_type: documentType,
        title: title.trim(),
        direction,
        template_id: templateId || undefined,
        field_data: templateId
          ? {
              ...fieldData,
              ...(recipientMode === "internal" && employee
                ? { employee_name: employee.full_name }
                : { penerima: finalRecipientName }),
            }
          : undefined,
        body_html: !templateId ? manualBody : undefined,
        issued_to_type: finalRecipientType,
        issued_to_ref: finalRecipientRef,
        issued_to_name: finalRecipientName,
        issued_date: issuedDate || undefined,
      },
      {
        onSuccess: (createdDoc) => {
          navigate(`/dc/surat/${createdDoc.id}`);
        },
        onError: (err) => {
          setErrorMessage(extractErrorMessage(err));
        },
      }
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F7FA] pb-16">
      {/* ── 1. Breadcrumb Navigasi ── */}
      <nav
        aria-label="Breadcrumb"
        className="px-7 pt-4 pb-1 text-xs text-slate-500 font-medium flex items-center gap-1.5"
      >
        <Link
          to="/dc/surat"
          className="hover:text-amber-600 transition-colors cursor-pointer text-slate-600 font-semibold"
        >
          Surat & Dokumen Operasional
        </Link>
        <ChevronRight size={13} className="text-slate-400 shrink-0" />
        <span className="text-slate-900 font-bold">Buat Surat Baru</span>
      </nav>

      {/* ── 2. Header Banner MSDC ── */}
      <PageHeader
        title="Buat Surat & Dokumen Baru"
        subtitle="Penerbitan berita acara instalasi, izin masuk fasilitas DC, commissioning, dan surat tugas"
        containerClassName="px-7 pt-2 pb-2"
      />

      {/* ── 3. Formulir Utama ── */}
      <form onSubmit={handleSubmit} className="mx-7 mt-3 flex flex-col gap-6">
        {/* Banner Alert Pesan Error */}
        {errorMessage && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-center gap-2">
              <AlertCircle size={16} className="text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <button
              type="button"
              onClick={() => setErrorMessage(null)}
              className="text-rose-600 hover:text-rose-800 font-bold cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* ── Kolom Kiri (8 Kolom): Input Form ── */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            {/* Card 1: Klasifikasi & Identitas Dokumen */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm flex flex-col gap-5">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                  <FileText size={17} />
                </div>
                <div className="flex flex-col">
                  <h3 className="text-sm font-bold text-slate-900">
                    Klasifikasi & Identitas Dokumen
                  </h3>
                  <span className="text-xs text-slate-400">
                    Pilih jenis tata naskah dan beri judul perihal resmi dokumen
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Jenis Surat */}
                <div className="sm:col-span-2 flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-700">
                    Jenis Dokumen Operasional <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={documentType}
                    onChange={(e) => setDocumentType(e.target.value)}
                    disabled={isTypesLoading}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 font-medium focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer shadow-2xs"
                  >
                    {availableTypes.map((t) => (
                      <option key={t.code} value={t.code}>
                        {t.label} (Kode: {t.meta.prefix || t.code})
                      </option>
                    ))}
                  </select>
                  <span className="text-[11px] text-slate-400">
                    Nomor surat resmi akan digenerate secara otomatis oleh sistem saat disimpan.
                  </span>
                </div>

                {/* Judul / Perihal Surat */}
                <div className="sm:col-span-2 flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-700">
                    Perihal / Judul Dokumen <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Berita Acara Instalasi Server Rack A-04 Tenant PT Cloud"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-amber-500 shadow-2xs"
                  />
                </div>

                {/* Tanggal Surat */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-700">
                    Tanggal Terbit Dokumen
                  </label>
                  <div className="relative">
                    <Calendar
                      size={14}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                    />
                    <input
                      type="date"
                      value={issuedDate}
                      onChange={(e) => setIssuedDate(e.target.value)}
                      className="w-full pl-9 pr-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 font-medium focus:outline-none focus:ring-1 focus:ring-amber-500 shadow-2xs"
                    />
                  </div>
                </div>

                {/* Arah Dokumen */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-700">
                    Klasifikasi Arah Dokumen
                  </label>
                  <div className="relative">
                    <ArrowRightLeft
                      size={14}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                    />
                    <select
                      value={direction}
                      onChange={(e) => setDirection(e.target.value as DocumentDirection)}
                      className="w-full pl-9 pr-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 font-medium focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer shadow-2xs"
                    >
                      <option value="internal">Internal Data Center</option>
                      <option value="keluar">Keluar (Vendor / Customer / Tamu)</option>
                      <option value="masuk">Masuk (Instansi / Rekanan Luar)</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 2: Pihak Tujuan / Penerima Dokumen */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm flex flex-col gap-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                    <User size={17} />
                  </div>
                  <div className="flex flex-col">
                    <h3 className="text-sm font-bold text-slate-900">
                      Pihak Tujuan / Penerima
                    </h3>
                    <span className="text-xs text-slate-400">
                      Tentukan apakah dokumen ditujukan ke pihak eksternal atau karyawan internal
                    </span>
                  </div>
                </div>

                {/* Toggle Mode Penerima */}
                <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs">
                  <button
                    type="button"
                    onClick={() => setRecipientMode("external")}
                    className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                      recipientMode === "external"
                        ? "bg-white text-slate-900 shadow-2xs"
                        : "text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    Pihak Eksternal / Rekanan
                  </button>
                  <button
                    type="button"
                    onClick={() => setRecipientMode("internal")}
                    className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                      recipientMode === "internal"
                        ? "bg-white text-slate-900 shadow-2xs"
                        : "text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    Karyawan Internal
                  </button>
                </div>
              </div>

              {recipientMode === "external" ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Nama PIC / Penerima */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-700">
                      Nama Lengkap Penerima / PIC <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Contoh: Bpk. Budi Santoso"
                      value={issuedToName}
                      onChange={(e) => setIssuedToName(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-amber-500 shadow-2xs"
                    />
                  </div>

                  {/* Instansi / Vendor / Customer */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-700">
                      Perusahaan / Vendor / Instansi (Opsional)
                    </label>
                    <input
                      type="text"
                      placeholder="Contoh: PT Integrasi Network Solusindo"
                      value={issuedToCompany}
                      onChange={(e) => setIssuedToCompany(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-amber-500 shadow-2xs"
                    />
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  <label className="text-xs font-bold text-slate-700">
                    Pilih Karyawan Internal <span className="text-rose-500">*</span>
                  </label>

                  {employee && !isPickingEmployee ? (
                    <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/60 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">
                          {employee.full_name.charAt(0)}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-slate-900">
                            {employee.full_name}
                          </span>
                          <span className="text-[10px] text-emerald-700">
                            Karyawan Internal Terpilih
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setIsPickingEmployee(true)}
                        className="text-xs font-semibold text-slate-600 hover:text-slate-900 underline cursor-pointer"
                      >
                        Ganti Karyawan
                      </button>
                    </div>
                  ) : (
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                      <EmployeePicker
                        onSelect={(emp) => {
                          setEmployee(emp);
                          setIsPickingEmployee(false);
                        }}
                        onCancel={() => setIsPickingEmployee(false)}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Card 3: Variabel Template / Naskah Surat */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm flex flex-col gap-5">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                  <Layers size={17} />
                </div>
                <div className="flex flex-col">
                  <h3 className="text-sm font-bold text-slate-900">
                    {placeholders.length > 0
                      ? "Variabel Template Dokumen"
                      : "Isi Naskah Dokumen"}
                  </h3>
                  <span className="text-xs text-slate-400">
                    {placeholders.length > 0
                      ? `Lengkapi ${placeholders.length} parameter variabel untuk menyusun naskah dokumen resmi`
                      : "Tuliskan isi teks naskah dinas atau gunakan lampiran berkas resmi"}
                  </span>
                </div>
              </div>

              {placeholders.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {placeholders.map((name) => {
                    const formattedLabel = name
                      .replace(/_/g, " ")
                      .replace(/\b\w/g, (c) => c.toUpperCase());

                    return (
                      <div key={name} className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-slate-700">
                          {formattedLabel}
                        </label>
                        <input
                          type="text"
                          placeholder={`Isi ${formattedLabel.toLowerCase()}...`}
                          value={fieldData[name] ?? ""}
                          onChange={(e) =>
                            setFieldData((prev) => ({
                              ...prev,
                              [name]: e.target.value,
                            }))
                          }
                          className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-amber-500 shadow-2xs"
                        />
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-700">
                    Isi Naskah / Teks Dokumen
                  </label>
                  <textarea
                    rows={6}
                    placeholder="Tuliskan isi naskah dokumen, dasar pelaksanaan tugas, klausul berita acara, atau catatan teknis fasilitas DC..."
                    value={manualBody}
                    onChange={(e) => setManualBody(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl p-3.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-amber-500 shadow-2xs resize-y"
                  />
                </div>
              )}
            </div>
          </div>

          {/* ── Kolom Kanan (4 Kolom): Ringkasan & Tombol Aksi ── */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            {/* Ringkasan Dokumen Card */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm flex flex-col gap-4">
              <h3 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100">
                Ringkasan Penerbitan
              </h3>

              <div className="flex flex-col gap-3 text-xs">
                <div className="flex justify-between items-start gap-2">
                  <span className="text-slate-400 font-medium">Modul:</span>
                  <span className="font-bold text-slate-800 text-right">
                    Data Center Operations
                  </span>
                </div>

                <div className="flex justify-between items-start gap-2">
                  <span className="text-slate-400 font-medium">Jenis Surat:</span>
                  <span className="font-bold text-amber-700 text-right">
                    {selectedType?.label || "—"}
                  </span>
                </div>

                <div className="flex justify-between items-start gap-2">
                  <span className="text-slate-400 font-medium">Prefix Penomoran:</span>
                  <span className="font-mono font-bold text-slate-700 text-right">
                    {selectedType?.meta.prefix || "DC-OPS"}
                  </span>
                </div>

                <div className="flex justify-between items-start gap-2">
                  <span className="text-slate-400 font-medium">Alur Persetujuan:</span>
                  <span className="font-semibold text-slate-700 text-right">
                    {selectedType?.meta.requires_approval !== false
                      ? "Butuh Review Atasan"
                      : "Penerbitan Langsung"}
                  </span>
                </div>

                <div className="flex justify-between items-start gap-2">
                  <span className="text-slate-400 font-medium">Penerima Dokumen:</span>
                  <span className="font-bold text-slate-900 text-right truncate max-w-[180px]">
                    {recipientMode === "internal"
                      ? employee?.full_name || "Belum dipilih"
                      : issuedToName || "Belum diisi"}
                  </span>
                </div>
              </div>

              {/* Box Info Alur Kerja */}
              <div className="p-3.5 bg-amber-50/70 border border-amber-200/80 rounded-xl flex items-start gap-2.5 text-xs text-amber-800">
                <Info size={16} className="text-amber-600 shrink-0 mt-0.5" />
                <div className="flex flex-col gap-0.5">
                  <span className="font-bold">Verifikasi Legalitas</span>
                  <span className="text-[11px] leading-relaxed text-amber-900/80">
                    Setelah dibuat, surat akan tersimpan sebagai draf dan dapat ditandatangani digital sebelum diajukan ke atasan.
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-2.5 pt-2">
                <button
                  type="submit"
                  disabled={createDocument.isPending}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#E59B00] hover:bg-[#d48f00] text-white rounded-xl text-xs font-bold shadow-xs hover:shadow transition-all cursor-pointer active:scale-95 disabled:opacity-50"
                >
                  {createDocument.isPending ? (
                    <>
                      <Loader2 size={15} className="animate-spin" />
                      <span>Menyimpan Dokumen...</span>
                    </>
                  ) : (
                    <>
                      <Plus size={15} />
                      <span>Buat & Terbitkan Dokumen</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => navigate("/dc/surat")}
                  disabled={createDocument.isPending}
                  className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer active:scale-95"
                >
                  <ArrowLeft size={14} className="text-slate-500" />
                  <span>Batal & Kembali</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

export default SuratDcOpsCreatePage;
