import React, { useState, useEffect } from "react";
import { X, Cable, Server, ArrowRight, UserCheck, FileText, Loader2, AlertCircle } from "lucide-react";
import { useCreateCrossConnect, useUpdateCrossConnect } from "../api/useCrossConnects";
import { useOtbList, useOtbPorts } from "../api/useOtb";
import { useCustomerList } from "@modules/crm-sales/api/useCustomers";
import { useContractList } from "@modules/crm-sales/api/useContracts";
import { extractErrorMessage } from "@shared/types/api";
import { CABLE_TYPE_LABELS } from "../components/cross-connect/CrossConnectToolbar";
import type { CableType, CrossConnect, CrossConnectFormValues } from "../types/crossConnect";

export interface CrossConnectFormModalProps {
  item: CrossConnect | null;
  onClose: () => void;
  onSuccess?: () => void;
}

export function CrossConnectFormModal({
  item,
  onClose,
  onSuccess,
}: CrossConnectFormModalProps) {
  const isEdit = !!item;
  const createMutation = useCreateCrossConnect();
  const updateMutation = useUpdateCrossConnect(item?.id ?? 0);

  const { data: customerPage } = useCustomerList({ per_page: 100 });

  const [cableType, setCableType] = useState<CableType>(item?.cable_type ?? "cat6");
  const [sourceLocation, setSourceLocation] = useState(item?.source_location ?? "");
  const [sourcePort, setSourcePort] = useState(item?.source_port ?? "");
  const [destinationLocation, setDestinationLocation] = useState(item?.destination_location ?? "");
  const [destinationPort, setDestinationPort] = useState(item?.destination_port ?? "");
  const [destinationMode, setDestinationMode] = useState<"text" | "otb">(
    item?.destination_otb_port_id ? "otb" : "text"
  );
  const [destinationOtbId, setDestinationOtbId] = useState<string>(
    item?.destination_otb_port?.otb_id?.toString() ?? ""
  );
  const [destinationOtbPortId, setDestinationOtbPortId] = useState<string>(
    item?.destination_otb_port_id?.toString() ?? ""
  );
  const [customerId, setCustomerId] = useState<string>(item?.customer_id?.toString() ?? "");
  const [contractId, setContractId] = useState<string>(item?.contract_id?.toString() ?? "");
  const [notes, setNotes] = useState(item?.notes ?? "");
  const [error, setError] = useState<string | null>(null);

  const { data: contractPage } = useContractList({
    per_page: 100,
    customer_id: customerId ? Number(customerId) : undefined,
  });
  const { data: otbPage } = useOtbList({ per_page: 100, status: "active" });
  const { data: otbPortPage, isLoading: loadingPorts } = useOtbPorts(
    destinationOtbId ? Number(destinationOtbId) : undefined,
    { per_page: 1024, status: "available" }
  );

  const availablePorts = (otbPortPage?.data ?? []).filter((p) => p.status === "available");

  const saving = createMutation.isPending || updateMutation.isPending;

  // Tutup dengan tombol Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !saving) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, saving]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const payload: CrossConnectFormValues = {
      cable_type: cableType,
      source_location: sourceLocation.trim() || undefined,
      source_port: sourcePort.trim() || undefined,
      destination_location:
        destinationMode === "text" ? destinationLocation.trim() || undefined : undefined,
      destination_port:
        destinationMode === "text" ? destinationPort.trim() || undefined : undefined,
      destination_otb_port_id:
        destinationMode === "otb" ? (destinationOtbPortId ? Number(destinationOtbPortId) : null) : null,
      customer_id: customerId ? Number(customerId) : null,
      contract_id: contractId ? Number(contractId) : null,
      notes: notes.trim() || undefined,
    };

    try {
      if (isEdit) {
        await updateMutation.mutateAsync(payload);
      } else {
        await createMutation.mutateAsync(payload);
      }
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* ── Modal Header ── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-[#FEF9EE]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center">
              <Cable size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {isEdit ? `Edit Kabel — ${item.tag_number ?? `#${item.id}`}` : "Daftarkan Kabel Cross-Connect"}
              </h2>
              <p className="text-xs text-slate-500">
                {isEdit
                  ? "Perbarui rincian fisik, koneksi, atau kepemilikan kabel"
                  : "Tambahkan aset kabel baru ke inventori data center"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* ── Modal Body (Scrollable) ── */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 flex flex-col gap-5 text-sm">
          {error && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle size={16} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Section 1: Informasi Tag & Tipe Kabel */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Tag Number
              </label>
              {isEdit ? (
                <input
                  type="text"
                  value={item.tag_number ?? ""}
                  disabled
                  className="w-full px-3 py-2 text-xs font-mono font-bold bg-slate-100 border border-slate-200 rounded-lg text-slate-600 cursor-not-allowed"
                />
              ) : (
                <div className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-500 italic">
                  Auto-generated otomatis dari Number Sequence
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Tipe Kabel <span className="text-rose-500">*</span>
              </label>
              <select
                className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                value={cableType}
                onChange={(e) => setCableType(e.target.value as CableType)}
                required
              >
                {Object.entries(CABLE_TYPE_LABELS).map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Section 2: Titik A (Sumber) */}
          <div className="border border-slate-200/80 rounded-xl p-4 bg-slate-50/50">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wide mb-3">
              <Server size={14} className="text-amber-600" />
              <span>Titik A (Sumber)</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Lokasi Sumber
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  placeholder="mis. Rack R01-U10, Patch Panel A"
                  value={sourceLocation}
                  onChange={(e) => setSourceLocation(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Port Sumber
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  placeholder="mis. 5 atau Gi0/1"
                  value={sourcePort}
                  onChange={(e) => setSourcePort(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Section 3: Titik B (Tujuan) */}
          <div className="border border-slate-200/80 rounded-xl p-4 bg-slate-50/50">
            <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wide">
                <ArrowRight size={14} className="text-blue-600" />
                <span>Titik B (Tujuan)</span>
              </div>
              <div className="flex items-center gap-4 text-xs">
                <label className="inline-flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="destMode"
                    className="text-amber-500 focus:ring-amber-400"
                    checked={destinationMode === "text"}
                    onChange={() => setDestinationMode("text")}
                  />
                  <span className="text-slate-700">Lokasi Bebas (Carrier/Eksternal)</span>
                </label>
                <label className="inline-flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="destMode"
                    className="text-amber-500 focus:ring-amber-400"
                    checked={destinationMode === "otb"}
                    onChange={() => setDestinationMode("otb")}
                  />
                  <span className="text-slate-700">Colok ke OTB Terdaftar</span>
                </label>
              </div>
            </div>

            {destinationMode === "text" ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Lokasi Tujuan
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                    placeholder="mis. Meet-Me-Room A — Carrier XYZ"
                    value={destinationLocation}
                    onChange={(e) => setDestinationLocation(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Port Tujuan
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                    placeholder="mis. 12"
                    value={destinationPort}
                    onChange={(e) => setDestinationPort(e.target.value)}
                  />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Pilih OTB Terdaftar
                  </label>
                  <select
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                    value={destinationOtbId}
                    onChange={(e) => {
                      setDestinationOtbId(e.target.value);
                      setDestinationOtbPortId("");
                    }}
                  >
                    <option value="">— Pilih OTB —</option>
                    {(otbPage?.data ?? []).map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.tag_number} {o.location ? `— ${o.location}` : ""}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Pilih Port OTB (Available)
                  </label>
                  <select
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 disabled:opacity-50"
                    value={destinationOtbPortId}
                    onChange={(e) => setDestinationOtbPortId(e.target.value)}
                    disabled={!destinationOtbId || loadingPorts}
                  >
                    <option value="">— Pilih Port OTB —</option>
                    {item?.destination_otb_port &&
                      item.destination_otb_port_id &&
                      String(item.destination_otb_port.otb_id) === destinationOtbId &&
                      !availablePorts.some((p) => p.id === item.destination_otb_port_id) && (
                        <option key={item.destination_otb_port_id} value={item.destination_otb_port_id}>
                          Port {item.destination_otb_port.port_number} (Saat Ini)
                        </option>
                    )}
                    {availablePorts.map((p) => (
                      <option key={p.id} value={p.id}>
                        Port {p.port_number} (Tersedia)
                      </option>
                    ))}
                    {destinationOtbId && !loadingPorts && availablePorts.length === 0 && !destinationOtbPortId && (
                      <option value="" disabled>
                        Tidak ada port kosong pada OTB ini
                      </option>
                    )}
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Section 4: Kepemilikan CRM (Customer & Kontrak) */}
          <div className="border border-slate-200/80 rounded-xl p-4 bg-slate-50/50">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wide mb-3">
              <UserCheck size={14} className="text-emerald-600" />
              <span>Kepemilikan Layanan CRM (Opsional)</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Customer
                </label>
                <select
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  value={customerId}
                  onChange={(e) => {
                    setCustomerId(e.target.value);
                    setContractId("");
                  }}
                >
                  <option value="">— Belum Ditautkan —</option>
                  {(customerPage?.data ?? []).map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.company_name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Kontrak CRM
                </label>
                <select
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 disabled:opacity-50"
                  value={contractId}
                  onChange={(e) => setContractId(e.target.value)}
                  disabled={!customerId}
                >
                  <option value="">— Belum Ditautkan —</option>
                  {(contractPage?.data ?? []).map((ct) => (
                    <option key={ct.id} value={ct.id}>
                      {ct.contract_number}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Section 5: Catatan Tambahan */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <FileText size={13} className="text-slate-400" />
              <span>Catatan Tambahan</span>
            </label>
            <textarea
              rows={2}
              className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
              placeholder="Catatan teknis, spesifikasi kabel khusus, atau penomoran label lokal..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          {/* ── Modal Footer ── */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-1.5 px-5 py-2 bg-[#E59B00] hover:bg-[#D48F00] text-white text-xs font-semibold rounded-lg transition-all active:scale-[0.98] cursor-pointer shadow-xs disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 size={13} className="animate-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : isEdit ? (
                <span>Simpan Perubahan</span>
              ) : (
                <span>Daftarkan Kabel</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CrossConnectFormModal;
