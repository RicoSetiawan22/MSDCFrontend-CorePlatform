import { useState, useId } from "react";
import type { FormEvent, ChangeEvent } from "react";
import {
  Wrench,
  Calendar,
  User,
  Building2,
  Clock,
  FileCheck,
  UploadCloud,
  FileText,
  AlertCircle,
  X,
  Sparkles,
} from "lucide-react";
import { ProcurementFormModal } from "../ProcurementFormModal";
import { useAssetList } from "../../api/useAsset";
import { useCreateInternalServiceLog } from "../../api/useServiceLog";
import {
  SERVICE_UOM_OPTIONS,
  type ServiceProviderType,
  type ServiceResultStatus,
  type ServiceSlaStatus,
  type ServiceAssetInfo,
} from "../../types/serviceLog";
import { formatCurrency } from "@shared/lib/format";

interface ServiceLogFormModalProps {
  onClose: () => void;
  onSuccess: (msg: string) => void;
}

export function ServiceLogFormModal({ onClose, onSuccess }: ServiceLogFormModalProps) {
  const assetSelectId = useId();
  const createMutation = useCreateInternalServiceLog();

  // Load assets from master aset
  const { data: assetData, isLoading: isLoadingAssets } = useAssetList({ per_page: 100 });
  const assets = assetData?.data || [];

  // Form State
  const [assetId, setAssetId] = useState<number | "">("");
  const [serviceDate, setServiceDate] = useState<string>(
    new Date().toISOString().slice(0, 10)
  );
  const [providerType, setProviderType] = useState<ServiceProviderType>("internal");
  const [technicianName, setTechnicianName] = useState("");
  const [vendorName, setVendorName] = useState("");
  const [description, setDescription] = useState("");
  const [quantity, setQuantity] = useState<number>(1);
  const [uom, setUom] = useState<string>("paket");
  const [unitPrice, setUnitPrice] = useState<number>(0);
  const [serviceResult, setServiceResult] = useState<ServiceResultStatus>("completed");
  const [serviceNotes, setServiceNotes] = useState("");
  const [baNumber, setBaNumber] = useState(
    `BA-SRV/${new Date().getFullYear()}/${String(Math.floor(Math.random() * 900) + 100)}`
  );
  const [slaTarget, setSlaTarget] = useState("≤ 24 Jam");
  const [slaStatus, setSlaStatus] = useState<ServiceSlaStatus>("on_time");

  // File Upload State
  const [baFileName, setBaFileName] = useState<string>("");
  const [fileError, setFileError] = useState<string | null>(null);

  // Error State
  const [error, setError] = useState<string | null>(null);

  // Total biaya terhitung otomatis
  const totalAmount = Math.max(0, quantity * unitPrice);

  const selectedAsset = assets.find((a) => a.id === Number(assetId));

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    setFileError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    // Validasi ukuran: max 5 MB
    const maxBytes = 5 * 1024 * 1024;
    if (file.size > maxBytes) {
      setFileError("Ukuran dokumen BA Servis maksimal 5 MB.");
      return;
    }

    // Validasi tipe
    const allowed = [
      "application/pdf",
      "image/jpeg",
      "image/png",
      "image/webp",
    ];
    if (!allowed.includes(file.type)) {
      setFileError("Format dokumen harus PDF, JPG, PNG, atau WEBP.");
      return;
    }

    setBaFileName(file.name);
  }

  function handleRemoveFile() {
    setBaFileName("");
    setFileError(null);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!assetId) {
      setError("Pilih aset terkait yang diservis.");
      return;
    }

    if (!description.trim() || description.trim().length < 5) {
      setError("Deskripsi pekerjaan jasa minimal 5 karakter.");
      return;
    }

    if (!technicianName.trim()) {
      setError("Nama teknisi atau pelaksana wajib diisi.");
      return;
    }

    if (quantity <= 0) {
      setError("Kuantitas pekerjaan harus lebih besar dari 0.");
      return;
    }

    if (unitPrice <= 0) {
      setError("Biaya servis wajib lebih besar dari Rp 0.");
      return;
    }

    const assetInfo: ServiceAssetInfo | null = selectedAsset
      ? {
          id: selectedAsset.id,
          asset_name: selectedAsset.asset_name,
          asset_number: selectedAsset.asset_number,
          category: selectedAsset.category,
          brand: selectedAsset.brand || null,
          model: selectedAsset.model || null,
          serial_number: selectedAsset.serial_number || null,
          specific_location: selectedAsset.specific_location || null,
          site_name: selectedAsset.site?.site_name || null,
        }
      : null;

    try {
      await createMutation.mutateAsync({
        input: {
          asset_id: Number(assetId),
          description: description.trim(),
          service_date: serviceDate,
          provider_type: providerType,
          technician_name: technicianName.trim(),
          vendor_name: providerType === "vendor" ? vendorName.trim() : undefined,
          quantity: Number(quantity),
          uom,
          unit_price: Number(unitPrice),
          amount: totalAmount,
          service_result: serviceResult,
          service_notes: serviceNotes.trim() || undefined,
          ba_number: baNumber.trim() || undefined,
          ba_file_name: baFileName || undefined,
          sla_target: slaTarget,
          sla_status: slaStatus,
        },
        assetInfo,
      });

      onSuccess(
        `Catatan servis internal untuk aset ${selectedAsset?.asset_name || "terpilih"} berhasil disimpan.`
      );
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Terjadi kesalahan saat menyimpan log servis.";
      setError(msg);
    }
  }

  return (
    <ProcurementFormModal
      title="Catat Service Log (Servis Internal / Non-PO)"
      subtitle="Catat perbaikan, pemeliharaan rutin, atau servis teknis yang dilakukan langsung tanpa melalui jalur PO rekanan."
      icon={Wrench}
      onClose={onClose}
      maxWidth="max-w-[700px]"
      submitLabel={createMutation.isPending ? "Menyimpan..." : "Simpan Service Log"}
      isSubmitting={createMutation.isPending}
      onSubmit={handleSubmit}
    >
      {error && (
        <div className="flex items-center gap-2.5 p-3.5 bg-rose-50 border border-rose-200/80 rounded-xl text-xs font-medium text-rose-700">
          <AlertCircle size={16} className="shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* ── Section 1: Aset Terkait & Tanggal Pelaksanaan ── */}
      <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200/80 flex flex-col gap-3.5">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider">
          <Sparkles size={14} className="text-amber-500" />
          <span>Aset Terkait & Jadwal Pelaksanaan</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {/* Pilih Aset Terkait */}
          <div>
            <label
              htmlFor={assetSelectId}
              className="block text-xs font-semibold text-slate-700 mb-1"
            >
              Aset yang Diservis <span className="text-rose-500">*</span>
            </label>
            <select
              id={assetSelectId}
              required
              value={assetId}
              onChange={(e) => setAssetId(e.target.value ? Number(e.target.value) : "")}
              disabled={isLoadingAssets}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all font-medium disabled:bg-slate-100"
            >
              <option value="">-- Pilih Aset Terdaftar --</option>
              {assets.map((a) => (
                <option key={a.id} value={a.id}>
                  [{a.asset_number}] {a.asset_name} ({a.category})
                </option>
              ))}
            </select>
            {selectedAsset && (
              <div className="mt-1.5 p-2 bg-white rounded-lg border border-slate-200/70 text-[11px] text-slate-500 flex flex-col gap-0.5">
                <div className="font-semibold text-slate-700">
                  {selectedAsset.asset_name}{" "}
                  {selectedAsset.serial_number && (
                    <span className="font-mono text-slate-400">
                      (SN: {selectedAsset.serial_number})
                    </span>
                  )}
                </div>
                <div>
                  Kategori: <span className="capitalize">{selectedAsset.category}</span>
                  {selectedAsset.specific_location && (
                    <span> • Lokasi: {selectedAsset.specific_location}</span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Tanggal Pelaksanaan Servis */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Tanggal Pelaksanaan Servis <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Calendar
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="date"
                required
                value={serviceDate}
                onChange={(e) => setServiceDate(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all font-mono"
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Tanggal aktual perbaikan / pemeliharaan dikerjakan.
            </p>
          </div>
        </div>
      </div>

      {/* ── Section 2: Pelaksana & Deskripsi Layanan ── */}
      <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200/80 flex flex-col gap-3.5">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider">
          <User size={14} className="text-blue-500" />
          <span>Pelaksana & Deskripsi Jasa</span>
        </div>

        {/* Toggle Tipe Pelaksana */}
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-slate-700">Jenis Pelaksana:</span>
          <div className="flex items-center bg-slate-200/70 p-0.5 rounded-xl text-xs font-medium">
            <button
              type="button"
              onClick={() => setProviderType("internal")}
              className={`px-3 py-1 rounded-lg transition-all ${
                providerType === "internal"
                  ? "bg-white text-blue-700 shadow-xs font-bold"
                  : "text-slate-600 hover:text-slate-800"
              }`}
            >
              Teknisi Internal MSDC
            </button>
            <button
              type="button"
              onClick={() => setProviderType("vendor")}
              className={`px-3 py-1 rounded-lg transition-all ${
                providerType === "vendor"
                  ? "bg-white text-indigo-700 shadow-xs font-bold"
                  : "text-slate-600 hover:text-slate-800"
              }`}
            >
              Vendor Non-PO / Eksternal
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {/* Nama Teknisi Pelaksana */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Nama Teknisi / Petugas Pelaksana <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <User
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                required
                placeholder="mis. Budi Santoso (Hardware Specialist)"
                value={technicianName}
                onChange={(e) => setTechnicianName(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all placeholder:text-slate-400"
              />
            </div>
          </div>

          {/* Nama Vendor (jika eksternal) */}
          {providerType === "vendor" && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nama Vendor Eksternal <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Building2
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="text"
                  required
                  placeholder="mis. PT Surya Teknika Solusi"
                  value={vendorName}
                  onChange={(e) => setVendorName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all placeholder:text-slate-400"
                />
              </div>
            </div>
          )}
        </div>

        {/* Deskripsi Pekerjaan */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Deskripsi Layanan / Pekerjaan Servis <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            required
            placeholder="mis. Pembersihan filter dan pengisian freon AC Precision Server Room B"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all placeholder:text-slate-400 font-medium"
          />
        </div>
      </div>

      {/* ── Section 3: Kuantitas, Satuan Dinamis & Biaya ── */}
      <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200/80 flex flex-col gap-3.5">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider">
          <Clock size={14} className="text-emerald-500" />
          <span>Kuantitas, Satuan Dinamis & Biaya</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          {/* Kuantitas */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Kuantitas <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              min="0.5"
              step="0.5"
              required
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all font-mono"
            />
          </div>

          {/* Satuan Dinamis (Requirement: Jasa tidak boleh tetap "pcs") */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Satuan Jasa <span className="text-rose-500">*</span>
            </label>
            <select
              value={uom}
              onChange={(e) => setUom(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all font-medium"
            >
              {SERVICE_UOM_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Biaya Satuan */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Biaya Satuan (Rp) <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              min="1"
              required
              value={unitPrice}
              onChange={(e) => setUnitPrice(Number(e.target.value))}
              placeholder="0"
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all font-mono font-bold"
            />
          </div>
        </div>

        {/* Ringkasan Total Biaya */}
        <div className="flex items-center justify-between p-3 bg-emerald-50/70 border border-emerald-200/80 rounded-xl text-xs">
          <span className="font-semibold text-emerald-800">
            Total Biaya Servis ({quantity} {uom}):
          </span>
          <span className="font-mono font-extrabold text-sm text-emerald-900">
            {formatCurrency(totalAmount)}
          </span>
        </div>
      </div>

      {/* ── Section 4: Hasil Servis, SLA & Berita Acara (BA) ── */}
      <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200/80 flex flex-col gap-3.5">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider">
          <FileCheck size={14} className="text-purple-500" />
          <span>Hasil Pekerjaan, SLA, & Berita Acara</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          {/* Hasil Servis */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Hasil / Status Servis <span className="text-rose-500">*</span>
            </label>
            <select
              value={serviceResult}
              onChange={(e) => setServiceResult(e.target.value as ServiceResultStatus)}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all font-medium"
            >
              <option value="completed">Selesai Normal</option>
              <option value="in_progress">Sedang Dikerjakan</option>
              <option value="pending_sparepart">Menunggu Sparepart</option>
              <option value="scheduled">Terjadwal</option>
            </select>
          </div>

          {/* Target SLA */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Target SLA Pengerjaan
            </label>
            <select
              value={slaTarget}
              onChange={(e) => setSlaTarget(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all font-medium"
            >
              <option value="≤ 4 Jam (Urgent)">≤ 4 Jam (Urgent)</option>
              <option value="≤ 24 Jam">≤ 24 Jam (Standar)</option>
              <option value="2-3 Hari Kerja">2-3 Hari Kerja</option>
              <option value="Sesuai Jadwal Rutin">Sesuai Jadwal Rutin</option>
            </select>
          </div>

          {/* Status SLA */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Kepatuhan SLA <span className="text-rose-500">*</span>
            </label>
            <select
              value={slaStatus}
              onChange={(e) => setSlaStatus(e.target.value as ServiceSlaStatus)}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all font-medium"
            >
              <option value="on_time">Sesuai SLA (On-Time)</option>
              <option value="within_sla">Dalam Batas SLA</option>
              <option value="overdue">Melebihi SLA (Overdue)</option>
              <option value="in_progress">Sedang Berjalan</option>
            </select>
          </div>
        </div>

        {/* No. Berita Acara Servis */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Nomor Berita Acara (BA / BAST Servis)
          </label>
          <input
            type="text"
            value={baNumber}
            onChange={(e) => setBaNumber(e.target.value)}
            placeholder="mis. BA-SRV/2026/10/012"
            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all font-mono font-medium"
          />
        </div>

        {/* Catatan / Tindakan Pengerjaan */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Catatan Tindakan & Temuan Servis
          </label>
          <textarea
            rows={2}
            value={serviceNotes}
            onChange={(e) => setServiceNotes(e.target.value)}
            placeholder="mis. Penggantian kapasitor fan outdoor dan pengujian temperatur kompresor pada 18°C stabil."
            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all placeholder:text-slate-400"
          />
        </div>

        {/* Upload Dokumen BA Servis */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Lampiran Dokumen BA Servis / BAST (PDF, JPG, PNG — maks 5 MB)
          </label>
          {baFileName ? (
            <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-200 text-xs">
              <div className="flex items-center gap-2 text-slate-700 font-medium truncate">
                <FileText size={16} className="text-amber-500 shrink-0" />
                <span className="truncate">{baFileName}</span>
              </div>
              <button
                type="button"
                onClick={handleRemoveFile}
                className="text-slate-400 hover:text-rose-600 p-1 rounded-md transition-colors"
                title="Hapus file"
              >
                <X size={14} />
              </button>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-slate-300 hover:border-amber-400 bg-white rounded-xl cursor-pointer transition-colors group">
              <UploadCloud
                size={22}
                className="text-slate-400 group-hover:text-amber-500 transition-colors"
              />
              <span className="text-xs font-medium text-slate-600 mt-1">
                Pilih atau seret dokumen Berita Acara Servis ke sini
              </span>
              <span className="text-[11px] text-slate-400 mt-0.5">
                Maksimal ukuran file 5 MB (PDF, JPG, PNG)
              </span>
              <input
                type="file"
                accept=".pdf,image/png,image/jpeg,image/webp"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
          )}
          {fileError && (
            <p className="text-[11px] text-rose-600 font-medium mt-1">{fileError}</p>
          )}
        </div>
      </div>
    </ProcurementFormModal>
  );
}
