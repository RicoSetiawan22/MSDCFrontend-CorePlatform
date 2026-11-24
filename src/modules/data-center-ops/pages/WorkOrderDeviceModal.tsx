import { useState, useEffect } from "react";
import {
  Server,
  MapPin,
  Zap,
  Layers,
  X,
  Loader2,
  AlertCircle,
  AlertTriangle,
  Barcode,
  Check,
} from "lucide-react";
import { useContractRackAllocations } from "../api/useRacks";
import {
  useCreateDevice,
  useUpdateDevice,
  useMoveDevice,
  useSetDeviceStatus,
} from "../api/useDevices";
import { extractErrorMessage } from "@shared/types/api";
import { LoadingState } from "@shared/components/LoadingState";
import type { Device, DeviceType } from "../types/device";

export interface WorkOrderDeviceModalProps {
  contractId: number;
  customerId: number | null | undefined;
  contractServiceId: number;
  editingDevice?: Device | null;
  onClose: () => void;
  onSaved: () => void;
}

/**
 * Modal Pendaftaran & Pelengkapan Perangkat dari Perintah Kerja (Work Order).
 *
 * Dipakai baik untuk colocation (perangkat baru milik pelanggan) maupun
 * dedicated server / cloud (placeholder spare yang tinggal dilengkapi).
 * Slot rack wajib dipilih dari alokasi yang sudah dikunci oleh kontrak terkait.
 */
export function WorkOrderDeviceModal({
  contractId,
  customerId,
  contractServiceId,
  editingDevice,
  onClose,
  onSaved,
}: WorkOrderDeviceModalProps) {
  const isEdit = !!editingDevice;
  const [form, setForm] = useState({
    device_name: editingDevice?.device_name ?? "",
    device_type: (editingDevice?.device_type ?? "server") as DeviceType,
    manufacturer: editingDevice?.manufacturer ?? "",
    model: editingDevice?.model ?? "",
    serial_number: editingDevice?.serial_number ?? "",
    power_watt: editingDevice?.power_watt != null ? String(editingDevice.power_watt) : "",
  });
  const [allocationId, setAllocationId] = useState("");
  const [positionU, setPositionU] = useState(
    editingDevice?.rack_position_u ? String(editingDevice.rack_position_u) : ""
  );
  const [positionUEnd, setPositionUEnd] = useState(
    editingDevice?.rack_position_u_end ? String(editingDevice.rack_position_u_end) : ""
  );
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Fetch alokasi rack terkunci milik kontrak ini
  const { data: allocations, isLoading: loadingAllocations } =
    useContractRackAllocations(contractId);
  const selectedAllocation = allocations?.find((a) => a.id === Number(allocationId));

  const create = useCreateDevice();
  const update = useUpdateDevice(editingDevice?.id ?? 0);
  const move = useMoveDevice(editingDevice?.id ?? 0);
  const setStatus = useSetDeviceStatus(editingDevice?.id ?? 0);

  // Tangani tombol ESC untuk menutup modal jika tidak sedang menyimpan
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !saving) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, saving]);

  function set(key: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function selectAllocation(value: string) {
    setAllocationId(value);
    const alloc = allocations?.find((a) => a.id === Number(value));
    if (alloc) {
      setPositionU(String(alloc.start_u));
      setPositionUEnd("");
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.device_name.trim()) {
      setError("Nama perangkat wajib diisi.");
      return;
    }
    if (!allocationId) {
      setError("Pilih slot rack yang sudah dikunci untuk kontrak ini.");
      return;
    }
    if (!positionU) {
      setError("Posisi U wajib diisi.");
      return;
    }

    const start = Number(positionU);
    const end = positionUEnd ? Number(positionUEnd) : start;

    if (
      selectedAllocation &&
      (start < selectedAllocation.start_u || end > selectedAllocation.end_u)
    ) {
      setError(
        `Posisi U${start}-U${end} berada di luar slot yang terkunci (U${selectedAllocation.start_u}-U${selectedAllocation.end_u}).`
      );
      return;
    }

    setError(null);
    setSaving(true);

    try {
      if (isEdit && editingDevice) {
        await update.mutateAsync({
          device_name: form.device_name.trim(),
          manufacturer: form.manufacturer || undefined,
          model: form.model || undefined,
          serial_number: form.serial_number || undefined,
          power_watt: form.power_watt ? Number(form.power_watt) : null,
          contract_service_id: contractServiceId,
        });

        await move.mutateAsync({
          site_id: selectedAllocation!.rack!.site_room!.site_id,
          site_room_id: selectedAllocation!.rack!.site_room_id,
          rack_id: selectedAllocation!.rack_id,
          rack_position_u: start,
          rack_position_u_end: end,
        });

        if (editingDevice.status === "spare") {
          await setStatus.mutateAsync("active");
        }
      } else {
        await create.mutateAsync({
          device_name: form.device_name.trim(),
          device_type: form.device_type,
          manufacturer: form.manufacturer || undefined,
          model: form.model || undefined,
          serial_number: form.serial_number || undefined,
          power_watt: form.power_watt ? Number(form.power_watt) : undefined,
          status: "active",
          site_id: selectedAllocation!.rack!.site_room!.site_id,
          site_room_id: selectedAllocation!.rack!.site_room_id,
          rack_id: selectedAllocation!.rack_id,
          rack_position_u: start,
          rack_position_u_end: end,
          customer_id: customerId ?? undefined,
          contract_id: contractId,
          contract_service_id: contractServiceId,
        });
      }

      onSaved();
      onClose();
    } catch (err) {
      setError(extractErrorMessage(err));
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={saving ? undefined : onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-[580px] overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="device-modal-title"
      >
        {/* ── Modal Header Bergaya MSDC ── */}
        <div className="px-6 pt-5 pb-4 flex items-center justify-between border-b border-slate-100 bg-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200/80 flex items-center justify-center text-amber-600 shrink-0">
              <Server size={20} />
            </div>
            <div>
              <h2
                id="device-modal-title"
                className="text-base font-bold text-[#0A2140] tracking-tight leading-tight"
              >
                {isEdit
                  ? `Lengkapi Perangkat — ${editingDevice!.device_code}`
                  : "Daftarkan Perangkat Baru"}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {isEdit
                  ? "Lengkapi spesifikasi teknis dan posisikan perangkat di slot rack terkunci"
                  : "Daftarkan perangkat fisik dan tentukan alokasi slot rack yang dikunci"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            aria-label="Tutup modal"
            className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full p-1.5 transition-colors cursor-pointer disabled:opacity-50"
          >
            <X size={18} />
          </button>
        </div>

        {/* ── Modal Form Scrollable ── */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="px-6 py-5 flex flex-col gap-5 overflow-y-auto">
            {/* ── SEKSI 1: ALOKASI SLOT RACK TERKUNCI ── */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2 pb-1 border-b border-slate-100">
                <MapPin size={14} className="text-amber-500" />
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  1. Alokasi Slot Rack Terkunci
                </span>
              </div>

              {loadingAllocations ? (
                <div className="py-4">
                  <LoadingState />
                </div>
              ) : (allocations ?? []).length === 0 ? (
                <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-start gap-2.5">
                  <AlertTriangle size={16} className="text-amber-600 shrink-0 mt-0.5" />
                  <span>
                    Kontrak ini belum memiliki alokasi rack yang dikunci. Harap kunci terlebih dahulu
                    melalui menu <strong>CRM Sales &gt; Kontrak &gt; Lokasi &amp; Kunci Resource</strong>.
                  </span>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 mb-1.5 block">
                      Pilih Slot Rack Terkunci <span className="text-rose-500">*</span>
                    </label>
                    <select
                      className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all cursor-pointer"
                      value={allocationId}
                      onChange={(e) => selectAllocation(e.target.value)}
                    >
                      <option value="">— Pilih Slot Rack —</option>
                      {(allocations ?? []).map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.rack?.site_room ? `${a.rack.site_room.room_code} — ` : ""}
                          {a.rack?.rack_code ?? `Rack #${a.rack_id}`} (Slot U{a.start_u} - U{a.end_u})
                        </option>
                      ))}
                    </select>
                  </div>

                  {allocationId && selectedAllocation && (
                    <div className="grid grid-cols-2 gap-3.5 p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl">
                      <div>
                        <label className="text-xs font-semibold text-slate-700 mb-1 block">
                          Posisi U Awal <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="number"
                          min={selectedAllocation.start_u}
                          max={selectedAllocation.end_u}
                          className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                          value={positionU}
                          onChange={(e) => setPositionU(e.target.value)}
                          placeholder={String(selectedAllocation.start_u)}
                        />
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-slate-700 mb-1 block">
                          s/d Posisi U Akhir
                        </label>
                        <input
                          type="number"
                          min={positionU ? Number(positionU) : selectedAllocation.start_u}
                          max={selectedAllocation.end_u}
                          className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                          placeholder={positionU || `U${selectedAllocation.end_u}`}
                          value={positionUEnd}
                          onChange={(e) => setPositionUEnd(e.target.value)}
                        />
                      </div>

                      <div className="col-span-2 text-[11px] text-slate-500 font-medium">
                        Rentang U yang diizinkan untuk slot ini:{" "}
                        <strong className="text-slate-800">
                          U{selectedAllocation.start_u} - U{selectedAllocation.end_u}
                        </strong>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* ── SEKSI 2: IDENTITAS PERANGKAT ── */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2 pb-1 border-b border-slate-100">
                <Layers size={14} className="text-amber-500" />
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  2. Identitas &amp; Jenis Perangkat
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="text-xs font-semibold text-slate-700 mb-1.5 block">
                    Kode Perangkat
                  </label>
                  {isEdit ? (
                    <div className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-mono font-bold text-slate-700">
                      {editingDevice!.device_code}
                    </div>
                  ) : (
                    <div className="w-full bg-slate-50 border border-dashed border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-500 flex items-center gap-2">
                      <Barcode size={15} className="text-slate-400" />
                      <span>Otomatis di-generate sistem</span>
                    </div>
                  )}
                </div>

                {!isEdit ? (
                  <div>
                    <label className="text-xs font-semibold text-slate-700 mb-1.5 block">
                      Tipe Perangkat <span className="text-rose-500">*</span>
                    </label>
                    <select
                      className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all cursor-pointer"
                      value={form.device_type}
                      onChange={(e) => set("device_type", e.target.value)}
                    >
                      <option value="server">Server</option>
                      <option value="switch">Switch</option>
                      <option value="router">Router</option>
                      <option value="firewall">Firewall</option>
                      <option value="ups">UPS</option>
                      <option value="pdu">PDU</option>
                      <option value="storage">Storage</option>
                      <option value="other">Lainnya</option>
                    </select>
                  </div>
                ) : (
                  <div>
                    <label className="text-xs font-semibold text-slate-700 mb-1.5 block">
                      Tipe Perangkat
                    </label>
                    <div className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-slate-700 uppercase">
                      {editingDevice?.device_type || "SERVER"}
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 mb-1.5 block">
                  Nama Perangkat <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                  value={form.device_name}
                  onChange={(e) => set("device_name", e.target.value)}
                  placeholder="mis. Dell PowerEdge R740 / Web Server Prod"
                />
              </div>
            </div>

            {/* ── SEKSI 3: SPESIFIKASI TEKNIS & DAYA ── */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2 pb-1 border-b border-slate-100">
                <Zap size={14} className="text-amber-500" />
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  3. Spesifikasi Teknis &amp; Konsumsi Daya
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 mb-1.5 block">
                    Manufacturer / Vendor
                  </label>
                  <input
                    type="text"
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                    value={form.manufacturer}
                    onChange={(e) => set("manufacturer", e.target.value)}
                    placeholder="mis. Dell / HPE"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 mb-1.5 block">
                    Model
                  </label>
                  <input
                    type="text"
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                    value={form.model}
                    onChange={(e) => set("model", e.target.value)}
                    placeholder="mis. R740 Gen10"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 mb-1.5 block">
                    Serial Number (SN)
                  </label>
                  <input
                    type="text"
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-800 font-mono placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                    value={form.serial_number}
                    onChange={(e) => set("serial_number", e.target.value)}
                    placeholder="mis. SGH1234XYZ"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 mb-1.5 block">
                  Konsumsi Daya (Watt)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    className="w-full bg-white border border-slate-200 rounded-xl pl-3.5 pr-9 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                    value={form.power_watt}
                    onChange={(e) => set("power_watt", e.target.value)}
                    placeholder="mis. 450"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                    W
                  </span>
                </div>
              </div>
            </div>

            {/* Banner Pesan Error */}
            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium flex items-center gap-2 animate-in fade-in duration-150">
                <AlertCircle size={15} className="text-rose-600 shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </div>

          {/* ── Modal Footer ── */}
          <div className="px-6 py-4 bg-slate-50/80 border-t border-slate-100 flex items-center justify-end gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs active:scale-95"
            >
              Batal
            </button>

            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 bg-[#E59B00] hover:bg-[#d48f00] text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 active:scale-95"
            >
              {saving ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <>
                  <Check size={14} />
                  <span>{isEdit ? "Simpan & Aktifkan" : "Daftarkan Perangkat"}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default WorkOrderDeviceModal;
