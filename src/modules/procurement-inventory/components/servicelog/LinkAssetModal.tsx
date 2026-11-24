import { useState, useId } from "react";
import type { FormEvent } from "react";
import { Laptop, AlertCircle, Sparkles } from "lucide-react";
import { ProcurementFormModal } from "../ProcurementFormModal";
import { useAssetList } from "../../api/useAsset";
import { useLinkAssetToServiceLineMutation } from "../../api/useServiceLog";
import type { ServiceLogLine, ServiceAssetInfo } from "../../types/serviceLog";

interface LinkAssetModalProps {
  item: ServiceLogLine;
  onClose: () => void;
  onSuccess: (msg: string) => void;
}

export function LinkAssetModal({ item, onClose, onSuccess }: LinkAssetModalProps) {
  const selectId = useId();
  const [assetId, setAssetId] = useState<number | "">("");
  const [error, setError] = useState<string | null>(null);

  const { data: assetData, isLoading } = useAssetList({ per_page: 100 });
  const assets = assetData?.data || [];
  const linkMutation = useLinkAssetToServiceLineMutation();

  const selectedAsset = assets.find((a) => a.id === Number(assetId));

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!assetId || !selectedAsset) {
      setError("Pilih salah satu aset yang akan ditautkan dengan jasa ini.");
      return;
    }

    const assetInfo: ServiceAssetInfo = {
      id: selectedAsset.id,
      asset_name: selectedAsset.asset_name,
      asset_number: selectedAsset.asset_number,
      category: selectedAsset.category,
      brand: selectedAsset.brand || null,
      model: selectedAsset.model || null,
      serial_number: selectedAsset.serial_number || null,
      specific_location: selectedAsset.specific_location || null,
      site_name: selectedAsset.site?.site_name || null,
    };

    try {
      await linkMutation.mutateAsync({
        lineId: item.id,
        assetInfo,
      });

      onSuccess(
        `Jasa "${item.description.slice(0, 30)}..." berhasil dihubungkan ke aset [${selectedAsset.asset_number}] ${selectedAsset.asset_name}.`
      );
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal menghubungkan aset.";
      setError(msg);
    }
  }

  return (
    <ProcurementFormModal
      title="Hubungkan Aset ke Service Log"
      subtitle="Tautkan transaksi jasa ini ke aset inventaris spesifik untuk pelacakan jejak pemeliharaan."
      icon={Laptop}
      onClose={onClose}
      maxWidth="max-w-[560px]"
      submitLabel={linkMutation.isPending ? "Menyimpan..." : "Tautkan Aset"}
      isSubmitting={linkMutation.isPending}
      onSubmit={handleSubmit}
    >
      {error && (
        <div className="flex items-center gap-2.5 p-3.5 bg-rose-50 border border-rose-200/80 rounded-xl text-xs font-medium text-rose-700">
          <AlertCircle size={16} className="shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Rincian Baris Jasa */}
      <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex flex-col gap-1.5 text-xs">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
          Baris Jasa yang Dipilih
        </span>
        <div className="font-bold text-slate-800 text-xs">{item.description}</div>
        <div className="text-[11px] text-slate-500 font-mono">
          Ref: {item.purchase_order?.po_number || item.service_number || `ID #${item.id}`} • Vendor:{" "}
          {item.vendor_name || item.purchase_order?.vendor?.vendor_name || "—"}
        </div>
      </div>

      {/* Dropdown Pilihan Aset */}
      <div>
        <label htmlFor={selectId} className="block text-xs font-semibold text-slate-700 mb-1">
          Pilih Aset Inventaris <span className="text-rose-500">*</span>
        </label>
        <select
          id={selectId}
          required
          value={assetId}
          onChange={(e) => setAssetId(e.target.value ? Number(e.target.value) : "")}
          disabled={isLoading}
          className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all font-medium disabled:bg-slate-100"
        >
          <option value="">-- Pilih Aset Terdaftar --</option>
          {assets.map((a) => (
            <option key={a.id} value={a.id}>
              [{a.asset_number}] {a.asset_name} ({a.category})
            </option>
          ))}
        </select>
      </div>

      {/* Preview Aset Terpilih */}
      {selectedAsset && (
        <div className="p-3.5 bg-amber-50/50 border border-amber-200/80 rounded-xl text-xs flex flex-col gap-1">
          <div className="flex items-center gap-1.5 font-bold text-amber-900">
            <Sparkles size={13} className="text-amber-600" />
            <span>{selectedAsset.asset_name}</span>
          </div>
          <div className="text-[11px] text-slate-600 flex flex-col gap-0.5 mt-0.5">
            <div>
              Nomor Aset: <span className="font-mono font-bold">{selectedAsset.asset_number}</span>
            </div>
            <div>
              Kategori: <span className="capitalize">{selectedAsset.category}</span>
              {selectedAsset.serial_number && (
                <span className="font-mono ml-2">SN: {selectedAsset.serial_number}</span>
              )}
            </div>
            {selectedAsset.specific_location && (
              <div>Lokasi: {selectedAsset.specific_location}</div>
            )}
          </div>
        </div>
      )}
    </ProcurementFormModal>
  );
}
