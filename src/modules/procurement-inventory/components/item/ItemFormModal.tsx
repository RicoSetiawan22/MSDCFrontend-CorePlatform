import { useState, type FormEvent } from "react";
import {
  Package,
  Info,
  Layers,
  Barcode,
  SlidersHorizontal,
  CheckCircle2,
  AlertCircle,
  Warehouse,
} from "lucide-react";
import { ProcurementFormModal } from "../ProcurementFormModal";
import type { Item, ItemType, TrackingType } from "../../types/item";

const TYPE_LABELS: Record<ItemType, string> = {
  sparepart: "Sparepart",
  consumable: "Consumable (Barang Habis Pakai)",
  asset: "Asset (Aset Tetap / Peralatan)",
  other: "Lainnya",
};

const MASTER_UOM_OPTIONS = [
  { value: "pcs", label: "pcs (Pieces - Satuan Bulat)" },
  { value: "unit", label: "unit (Unit - Satuan Bulat)" },
  { value: "box", label: "box (Kotak/Dus)" },
  { value: "roll", label: "roll (Gulung - Bisa Desimal)" },
  { value: "meter", label: "meter (Panjang - Bisa Desimal)" },
  { value: "kg", label: "kg (Kilogram - Bisa Desimal)" },
  { value: "liter", label: "liter (Volume - Bisa Desimal)" },
  { value: "pack", label: "pack (Pak)" },
  { value: "set", label: "set (Set Peralatan)" },
  { value: "rim", label: "rim (Rim Kertas)" },
  { value: "custom", label: "Lainnya (Input Manual)..." },
];

const ITEM_CATEGORIES = [
  "IT & Komputer",
  "Jaringan & Network",
  "Peralatan Siaran / Broadcast",
  "Elektronik & Kelistrikan",
  "Mekanikal & Pendingin (AC)",
  "ATK & Perlengkapan Kantor",
  "Cleaning & Konsumsi",
  "Lain-lain",
];

export interface ItemFormValues {
  item_name: string;
  item_type: ItemType;
  uom: string;
  reorder_point?: number | null;
  reorder_qty?: number | null;
  is_active: boolean;
  notes?: string;
  category?: string;
  sub_category?: string;
  description?: string;
  is_asset?: boolean;
  tracking_type?: TrackingType;
  sku?: string;
  standard_price?: number;
  default_warehouse?: string;
  rack_location?: string;
  max_stock?: number;
  lead_time_days?: number;
}

interface ItemFormModalProps {
  editingItem?: Item | null;
  onClose: () => void;
  onSubmit: (values: ItemFormValues) => Promise<void>;
  isSaving: boolean;
  error?: string | null;
  existingItems?: Item[];
}

export function ItemFormModal({
  editingItem,
  onClose,
  onSubmit,
  isSaving,
  error: externalError,
  existingItems = [],
}: ItemFormModalProps) {
  const [activeTab, setActiveTab] = useState<"spec" | "tracking" | "stock">("spec");

  const [form, setForm] = useState({
    item_name: editingItem?.item_name ?? "",
    item_type: editingItem?.item_type ?? ("sparepart" as ItemType),
    uom: editingItem?.uom ?? "pcs",
    category: editingItem?.category ?? "IT & Komputer",
    sub_category: editingItem?.sub_category ?? "",
    description: editingItem?.description ?? "",
    is_asset: editingItem?.is_asset ?? (editingItem?.item_type === "asset"),
    tracking_type: (editingItem?.tracking_type ?? (editingItem?.item_type === "asset" ? "serial_number" : "none")) as TrackingType,
    sku: editingItem?.sku ?? "",
    standard_price: editingItem?.standard_price ?? 0,
    default_warehouse: editingItem?.default_warehouse ?? "WH-Main",
    rack_location: editingItem?.rack_location ?? "",
    reorder_point:
      editingItem?.reorder_point !== undefined && editingItem?.reorder_point !== null
        ? String(editingItem.reorder_point)
        : "",
    reorder_qty:
      editingItem?.reorder_qty !== undefined && editingItem?.reorder_qty !== null
        ? String(editingItem.reorder_qty)
        : "",
    max_stock:
      editingItem?.max_stock !== undefined && editingItem?.max_stock !== null
        ? String(editingItem.max_stock)
        : "",
    lead_time_days: editingItem?.lead_time_days ?? 7,
    is_active: editingItem?.is_active ?? true,
    notes: editingItem?.notes ?? "",
  });

  const [isCustomUom, setIsCustomUom] = useState(
    !MASTER_UOM_OPTIONS.some((o) => o.value === (editingItem?.uom ?? "pcs") && o.value !== "custom")
  );
  const [customUomValue, setCustomUomValue] = useState(
    isCustomUom ? (editingItem?.uom ?? "") : ""
  );

  const [localError, setLocalError] = useState<string | null>(null);

  // Helper: check if UOM allows decimal
  const isDecimalAllowed = ["roll", "meter", "kg", "liter"].includes(
    isCustomUom ? customUomValue.toLowerCase() : form.uom.toLowerCase()
  );

  function validate(): string | null {
    // 1. Validasi Nama: minimal 3 karakter
    const trimmedName = form.item_name.trim();
    if (!trimmedName || trimmedName.length < 3) {
      return "Nama item minimal 3 karakter (nama seperti 'ac' atau 'pc' terlalu pendek).";
    }

    // 2. Deteksi Duplikat Nama
    const isDuplicate = existingItems.some((item) => {
      if (editingItem && item.id === editingItem.id) return false;
      return item.item_name.trim().toLowerCase() === trimmedName.toLowerCase();
    });

    if (isDuplicate) {
      return `Peringatan: Item dengan nama "${trimmedName}" sudah terdaftar di master data!`;
    }

    // 3. UOM check
    const effectiveUom = isCustomUom ? customUomValue.trim() : form.uom;
    if (!effectiveUom) {
      return "Unit of Measure (Satuan) wajib dipilih atau diisi.";
    }

    // 4. Validasi Stok Non-Asset
    if (form.item_type !== "asset") {
      const ropNum = form.reorder_point.trim() !== "" ? Number(form.reorder_point) : null;
      const roqNum = form.reorder_qty.trim() !== "" ? Number(form.reorder_qty) : null;
      const maxNum = form.max_stock.trim() !== "" ? Number(form.max_stock) : null;

      if (ropNum !== null && ropNum < 0) {
        return "Reorder point tidak boleh negatif.";
      }
      if (roqNum !== null && roqNum < 0) {
        return "Reorder quantity tidak boleh negatif.";
      }
      if (ropNum !== null && roqNum !== null && roqNum < ropNum && ropNum > 0) {
        return "Reorder Qty (rekomendasi beli) disarankan ≥ Reorder Point agar stok tidak langsung kritis lagi setelah pemesanan.";
      }
      if (maxNum !== null && ropNum !== null && maxNum < ropNum) {
        return "Kapasitas Maksimal Stok (Max Stock) harus lebih besar dari Reorder Point.";
      }

      // Desimal validation jika UOM bulat
      if (!isDecimalAllowed) {
        if (ropNum !== null && !Number.isInteger(ropNum)) {
          return `Satuan "${effectiveUom}" harus bernilai bilangan bulat (tanpa koma/desimal).`;
        }
        if (roqNum !== null && !Number.isInteger(roqNum)) {
          return `Satuan "${effectiveUom}" harus bernilai bilangan bulat (tanpa koma/desimal).`;
        }
      }
    }

    return null;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLocalError(null);

    const valErr = validate();
    if (valErr) {
      setLocalError(valErr);
      return;
    }

    const effectiveUom = isCustomUom ? customUomValue.trim().toLowerCase() : form.uom;

    let parsedRop: number | null = null;
    if (form.item_type !== "asset" && form.reorder_point.trim() !== "") {
      const num = Number(form.reorder_point);
      if (!isNaN(num)) parsedRop = num;
    }

    let parsedQty: number | null = null;
    if (form.item_type !== "asset" && form.reorder_qty.trim() !== "") {
      const num = Number(form.reorder_qty);
      if (!isNaN(num)) parsedQty = num;
    }

    let parsedMax: number | null = null;
    if (form.max_stock.trim() !== "") {
      const num = Number(form.max_stock);
      if (!isNaN(num)) parsedMax = num;
    }

    await onSubmit({
      item_name: form.item_name.trim(),
      item_type: form.item_type,
      uom: effectiveUom,
      reorder_point: parsedRop,
      reorder_qty: parsedQty,
      is_active: form.is_active,
      notes: form.notes || undefined,
      category: form.category,
      sub_category: form.sub_category || undefined,
      description: form.description || undefined,
      is_asset: form.is_asset || form.item_type === "asset",
      tracking_type: form.tracking_type,
      sku: form.sku || undefined,
      standard_price: form.standard_price || undefined,
      default_warehouse: form.default_warehouse || undefined,
      rack_location: form.rack_location || undefined,
      max_stock: parsedMax ?? undefined,
      lead_time_days: form.lead_time_days ? Number(form.lead_time_days) : undefined,
    });
  }

  const activeError = localError || externalError;

  return (
    <ProcurementFormModal
      title={editingItem ? "Edit Item Inventaris" : "Tambah Item Baru"}
      subtitle={
        editingItem
          ? `Perbarui spesifikasi & parameter stok item ${editingItem.item_code}`
          : "Master data barang, satuan baku, tracking aset, dan parameter pengadaan"
      }
      icon={Package}
      onClose={onClose}
      onSubmit={handleSubmit}
      submitLabel={editingItem ? "Simpan Perubahan" : "Simpan Item"}
      isSubmitting={isSaving}
      maxWidth="max-w-[640px]"
    >
      {/* Tab Navigasi */}
      <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab("spec")}
          className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === "spec"
              ? "bg-amber-100 text-amber-800"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          <Package size={14} />
          <span>Identitas & Satuan</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("tracking")}
          className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === "tracking"
              ? "bg-amber-100 text-amber-800"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          <Layers size={14} />
          <span>Tracking & Aset</span>
          {form.is_asset && (
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("stock")}
          className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === "stock"
              ? "bg-amber-100 text-amber-800"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          <SlidersHorizontal size={14} />
          <span>Parameter Stok & Gudang</span>
        </button>
      </div>

      {/* TAB 1: IDENTITAS & SATUAN */}
      {activeTab === "spec" && (
        <div className="flex flex-col gap-3.5">
          {editingItem ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Kode Item (Sistem)
                </label>
                <div className="px-3.5 py-2.5 bg-slate-100 border border-slate-200 rounded-xl font-mono text-xs font-bold text-slate-700">
                  {editingItem.item_code}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  SKU / Barcode Manual (Opsional)
                </label>
                <input
                  type="text"
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-mono text-slate-800 focus:outline-none focus:border-amber-500"
                  value={form.sku}
                  onChange={(e) => setForm({ ...form, sku: e.target.value })}
                  placeholder="mis. SKU-SW-24P-001"
                />
              </div>
            </div>
          ) : (
            <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/80 text-[11px] text-slate-500 flex items-center justify-between">
              <span>💡 Kode item internal akan di-generate otomatis oleh sistem (mis. ITM-000123).</span>
              <Barcode size={16} className="text-slate-400" />
            </div>
          )}

          {/* Nama Item */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Nama Item <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-amber-500"
              value={form.item_name}
              onChange={(e) => setForm({ ...form, item_name: e.target.value })}
              placeholder="mis. Switch Cisco Catalyst 24 Port Gigabit"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Nama deskriptif minimal 3 karakter untuk mencegah salah pesan pada PR & PO.
            </p>
          </div>

          {/* Row Kategori & Tipe */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Kategori Item <span className="text-red-500">*</span>
              </label>
              <select
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:bg-white focus:outline-none focus:border-amber-500"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              >
                {ITEM_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tipe Item
              </label>
              <select
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:bg-white focus:outline-none focus:border-amber-500 disabled:opacity-60"
                value={form.item_type}
                disabled={!!editingItem}
                onChange={(e) => {
                  const newType = e.target.value as ItemType;
                  const isNowAsset = newType === "asset";
                  setForm({
                    ...form,
                    item_type: newType,
                    is_asset: isNowAsset,
                    tracking_type: isNowAsset ? "serial_number" : form.tracking_type,
                    reorder_point: isNowAsset ? "" : form.reorder_point,
                    reorder_qty: isNowAsset ? "" : form.reorder_qty,
                  });
                }}
              >
                {Object.entries(TYPE_LABELS).map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Master Satuan (UOM) Dropdown */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Master Satuan (UOM) <span className="text-red-500">*</span>
              </label>
              <select
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:bg-white focus:outline-none focus:border-amber-500"
                value={isCustomUom ? "custom" : form.uom}
                onChange={(e) => {
                  if (e.target.value === "custom") {
                    setIsCustomUom(true);
                  } else {
                    setIsCustomUom(false);
                    setForm({ ...form, uom: e.target.value });
                  }
                }}
              >
                {MASTER_UOM_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-slate-400 mt-1">
                Dropdown baku mencegah kerancuan "pcs" vs "Pcs" vs "pieces".
              </p>
            </div>

            {isCustomUom && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Satuan Kustom Baru <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:border-amber-500"
                  value={customUomValue}
                  onChange={(e) => setCustomUomValue(e.target.value)}
                  placeholder="mis. tube, drum, galon"
                />
              </div>
            )}
          </div>

          {/* Spesifikasi / Deskripsi */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Deskripsi Teknis & Spesifikasi Lengkap
            </label>
            <textarea
              rows={2}
              className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-amber-500 resize-none"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="mis. 24 port 10/100/1000 Mbps, 4 SFP uplink ports, rackmount kit included..."
            />
          </div>
        </div>
      )}

      {/* TAB 2: TRACKING & ASET */}
      {activeTab === "tracking" && (
        <div className="flex flex-col gap-4">
          <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl text-xs text-amber-800 leading-relaxed flex items-start gap-2">
            <Info size={16} className="text-amber-600 shrink-0 mt-0.5" />
            <span>
              Pengaturan aset dan tracking type ini menentukan apakah checkbox <strong>"Beri Kode Barang"</strong> dan field input <strong>Serial Number</strong> wajib muncul saat Serah Terima Barang (FSTB) atau GRN.
            </span>
          </div>

          {/* Flag Dicatat Sebagai Aset */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-800">
                Item ini dicatat sebagai Aset Perusahaan?
              </p>
              <p className="text-[11px] text-slate-500">
                Aset akan otomatis memiliki label barcode dan tercatat pada modul Asset Maintenance.
              </p>
            </div>
            <input
              type="checkbox"
              id="is_asset_toggle"
              className="w-5 h-5 rounded border-slate-300 text-amber-500 focus:ring-amber-500 cursor-pointer"
              checked={form.is_asset}
              onChange={(e) => {
                const checked = e.target.checked;
                setForm({
                  ...form,
                  is_asset: checked,
                  tracking_type: checked ? "serial_number" : form.tracking_type,
                });
              }}
            />
          </div>

          {/* Tracking Type Dropdown */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Metode Pelacakan (Tracking Type) <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {[
                {
                  id: "none",
                  title: "Tanpa Tracking",
                  desc: "Barang bulk/konsumsi (kertas, baud)",
                },
                {
                  id: "serial_number",
                  title: "Serial Number (S/N)",
                  desc: "Unik per unit barang (PC, Laptop, Switch)",
                },
                {
                  id: "batch",
                  title: "Batch / Lot",
                  desc: "Pelacakan nomor batch & kedaluwarsa",
                },
              ].map((trk) => {
                const isSelected = form.tracking_type === trk.id;
                return (
                  <button
                    key={trk.id}
                    type="button"
                    onClick={() => setForm({ ...form, tracking_type: trk.id as TrackingType })}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col gap-1 ${
                      isSelected
                        ? "bg-amber-50 border-amber-400 text-amber-900 font-semibold shadow-xs"
                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs">{trk.title}</span>
                      {isSelected && <CheckCircle2 size={14} className="text-amber-600" />}
                    </div>
                    <span className="text-[10px] text-slate-400 font-normal">
                      {trk.desc}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Harga Standar Acuan Pembelian */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2 border-t border-slate-100">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Harga Standar Acuan Pembelian (Rp)
              </label>
              <input
                type="number"
                min={0}
                step={1000}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-mono text-slate-800 focus:outline-none focus:border-amber-500"
                value={form.standard_price || ""}
                onChange={(e) => setForm({ ...form, standard_price: Number(e.target.value) })}
                placeholder="mis. 1500000"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Estimasi harga default saat pembuatan baris PR.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Lead Time Pengadaan (Hari)
              </label>
              <input
                type="number"
                min={1}
                max={365}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:border-amber-500"
                value={form.lead_time_days}
                onChange={(e) => setForm({ ...form, lead_time_days: Number(e.target.value) })}
                placeholder="mis. 7 hari kerja"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Estimasi durasi dari PR diajukan hingga barang tiba.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: PARAMETER STOK & GUDANG */}
      {activeTab === "stock" && (
        <div className="flex flex-col gap-3.5">
          {form.item_type === "asset" ? (
            <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl text-xs text-amber-800 leading-relaxed flex items-start gap-2">
              <Info size={16} className="text-amber-600 shrink-0 mt-0.5" />
              <span>
                <strong>Barang Asset (AC, Server, Laptop, dll)</strong> diset tanpa batas minimum stok otomatis. Pengadaan dilakukan via <i>Purchase Request (FPR)</i> sesuai kebutuhan divisi.
              </span>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Reorder Point (Batas Minimum Stok)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step={isDecimalAllowed ? "any" : "1"}
                    className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:border-amber-500"
                    value={form.reorder_point}
                    onChange={(e) => setForm({ ...form, reorder_point: e.target.value })}
                    placeholder="Batas minimal stok"
                  />
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Trigger otomatis status Stok Kritis.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Reorder Qty (Rekomendasi Beli PR)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step={isDecimalAllowed ? "any" : "1"}
                    className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:border-amber-500"
                    value={form.reorder_qty}
                    onChange={(e) => setForm({ ...form, reorder_qty: e.target.value })}
                    placeholder="Jumlah order saat PR"
                  />
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Harus ≥ Reorder Point ({form.uom}).
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Kapasitas Maksimal Stok (Max Stock)
                </label>
                <input
                  type="number"
                  min="0"
                  step={isDecimalAllowed ? "any" : "1"}
                  className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:border-amber-500"
                  value={form.max_stock}
                  onChange={(e) => setForm({ ...form, max_stock: e.target.value })}
                  placeholder="Kapasitas simpan maksimal di rak gudang"
                />
              </div>
            </>
          )}

          {/* Default Warehouse & Lokasi Rak */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2 border-t border-slate-100">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <Warehouse size={13} className="text-amber-600" />
                <span>Gudang Default Penyimpanan</span>
              </label>
              <select
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:bg-white focus:outline-none focus:border-amber-500"
                value={form.default_warehouse}
                onChange={(e) => setForm({ ...form, default_warehouse: e.target.value })}
              >
                <option value="WH-Main">WH-Main — Gudang Utama MSDC Surabaya</option>
                <option value="WH-001">WH-001 — Gudang Sparepart IT</option>
                <option value="WH-JKT">WH-JKT — Gudang Transit Jakarta</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Lokasi Rak / Bin Gudang
              </label>
              <input
                type="text"
                className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:border-amber-500 font-mono"
                value={form.rack_location}
                onChange={(e) => setForm({ ...form, rack_location: e.target.value })}
                placeholder="mis. Rak A-02 / Bin 04"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Catatan Item
            </label>
            <input
              type="text"
              className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-amber-500"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Catatan penanganan atau garansi bawaan pabrik..."
            />
          </div>

          {editingItem && (
            <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer pt-2">
              <input
                type="checkbox"
                className="rounded border-slate-300 text-amber-500 focus:ring-amber-500 w-4 h-4 cursor-pointer"
                checked={form.is_active}
                onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
              />
              <span>Status Item Aktif (Dapat dipilih pada transaksi PR dan Transfer Stok)</span>
            </label>
          )}
        </div>
      )}

      {activeError && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs flex items-center gap-2 mt-2">
          <AlertCircle size={16} className="shrink-0" />
          <span>{activeError}</span>
        </div>
      )}
    </ProcurementFormModal>
  );
}