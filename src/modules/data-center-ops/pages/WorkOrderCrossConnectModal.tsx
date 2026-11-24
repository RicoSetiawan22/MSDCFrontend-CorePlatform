import { useState, useEffect } from "react";
import {
  Network,
  X,
  Loader2,
  AlertCircle,
  Search,
  Check,
  Cable,
  MapPin,
  Barcode,
} from "lucide-react";
import { useOtbList, useOtbPorts } from "../api/useOtb";
import { useCreateCrossConnect } from "../api/useCrossConnects";
import { extractErrorMessage } from "@shared/types/api";
import type { CableType } from "../types/crossConnect";

const CABLE_TYPE_LABEL: Record<CableType, string> = {
  cat5e: "Cat5e",
  cat6: "Cat6",
  cat6a: "Cat6a",
  multimode_fiber: "Fiber Multimode",
  singlemode_fiber: "Fiber Singlemode",
  coaxial: "Coaxial",
  other: "Lainnya",
};

export interface WorkOrderCrossConnectModalProps {
  contractId: number;
  customerId: number | null | undefined;
  contractServiceId: number;
  onClose: () => void;
  onSaved: () => void;
}

/**
 * Modal Pasang Cross-Connect LANGSUNG dari Perintah Kerja (Work Order).
 * Menghubungkan titik asal (rack/perangkat) ke port OTB data center atau carrier pihak ketiga.
 */
export function WorkOrderCrossConnectModal({
  contractId,
  customerId,
  contractServiceId,
  onClose,
  onSaved,
}: WorkOrderCrossConnectModalProps) {
  const [cableType, setCableType] = useState<CableType>("cat6");
  const [sourceLocation, setSourceLocation] = useState("");
  const [sourcePort, setSourcePort] = useState("");
  const [useOtbTarget, setUseOtbTarget] = useState(true);
  const [destLocation, setDestLocation] = useState("");
  const [destPort, setDestPort] = useState("");
  const [otbSearch, setOtbSearch] = useState("");
  const [otbId, setOtbId] = useState("");
  const [portId, setPortId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const { data: otbPage } = useOtbList({
    search: otbSearch || undefined,
    per_page: 10,
    status: "active",
  });
  const { data: portsPage, isLoading: loadingPorts } = useOtbPorts(
    otbId ? Number(otbId) : undefined,
    { status: "available", per_page: 100 }
  );

  const create = useCreateCrossConnect();

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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (useOtbTarget && !portId) {
      setError(
        "Pilih port OTB tujuan yang kosong, atau nonaktifkan opsi OTB untuk mengisi lokasi manual."
      );
      return;
    }
    if (!useOtbTarget && !destLocation.trim()) {
      setError("Isi lokasi tujuan (mis. carrier pihak ketiga).");
      return;
    }
    setError(null);
    setSaving(true);

    try {
      await create.mutateAsync({
        cable_type: cableType,
        source_location: sourceLocation || undefined,
        source_port: sourcePort || undefined,
        destination_location: useOtbTarget ? undefined : destLocation,
        destination_port: useOtbTarget ? undefined : destPort || undefined,
        destination_otb_port_id: useOtbTarget && portId ? Number(portId) : undefined,
        customer_id: customerId ?? undefined,
        contract_id: contractId,
        contract_service_id: contractServiceId,
        status: "active",
        installation_date: new Date().toISOString().slice(0, 10),
      });

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
        className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-[560px] overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="cross-connect-modal-title"
      >
        {/* ── Modal Header ── */}
        <div className="px-6 pt-5 pb-4 flex items-center justify-between border-b border-slate-100 bg-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-200/80 flex items-center justify-center text-purple-600 shrink-0">
              <Network size={20} />
            </div>
            <div>
              <h2
                id="cross-connect-modal-title"
                className="text-base font-bold text-[#0A2140] tracking-tight leading-tight"
              >
                Pasang Cross-Connect
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Konfigurasi kabel cross-connect dan tautkan ke port OTB tujuan
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

        {/* ── Modal Form Body ── */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="px-6 py-5 flex flex-col gap-5 overflow-y-auto">
            {/* Info Tag Number Auto */}
            <div className="p-3 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-xs text-slate-500 flex items-center gap-2">
              <Barcode size={15} className="text-slate-400" />
              <span>Tag number kabel akan di-generate otomatis oleh sistem</span>
            </div>

            {/* ── SEKSI 1: SPESIFIKASI KABEL & TITIK ASAL ── */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2 pb-1 border-b border-slate-100">
                <Cable size={14} className="text-purple-600" />
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  1. Tipe Kabel &amp; Titik Asal
                </span>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 mb-1.5 block">
                  Tipe Kabel <span className="text-rose-500">*</span>
                </label>
                <select
                  className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all cursor-pointer"
                  value={cableType}
                  onChange={(e) => setCableType(e.target.value as CableType)}
                >
                  {Object.entries(CABLE_TYPE_LABEL).map(([val, label]) => (
                    <option key={val} value={val}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 mb-1.5 block">
                    Lokasi Sumber / Asal
                  </label>
                  <input
                    type="text"
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                    placeholder="mis. Rack R01 U12"
                    value={sourceLocation}
                    onChange={(e) => setSourceLocation(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 mb-1.5 block">
                    Port Sumber
                  </label>
                  <input
                    type="text"
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                    placeholder="mis. Gi0/1 / Eth1"
                    value={sourcePort}
                    onChange={(e) => setSourcePort(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* ── SEKSI 2: TITIK TUJUAN (OTB / MANUAL) ── */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2 pb-1 border-b border-slate-100">
                <MapPin size={14} className="text-purple-600" />
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  2. Lokasi Tujuan &amp; Port OTB
                </span>
              </div>

              {/* Checkbox Tujuan OTB */}
              <label className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-200 bg-slate-50/60 cursor-pointer select-none hover:bg-slate-50 transition-colors">
                <input
                  type="checkbox"
                  checked={useOtbTarget}
                  onChange={(e) => setUseOtbTarget(e.target.checked)}
                  className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 cursor-pointer"
                />
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-slate-800">
                    Tujuan ke Port OTB Terdaftar
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Otomatis mengunci dan mencatat port OTB data center sebagai teralokasi
                  </span>
                </div>
              </label>

              {useOtbTarget ? (
                <div className="flex flex-col gap-3 p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl">
                  {/* Pencarian OTB */}
                  <div className="relative">
                    <input
                      type="text"
                      className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3.5 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                      placeholder="Cari OTB (tag atau lokasi)..."
                      value={otbSearch}
                      onChange={(e) => {
                        setOtbSearch(e.target.value);
                        setOtbId("");
                        setPortId("");
                      }}
                    />
                    <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  </div>

                  {/* Dropdown OTB */}
                  <div>
                    <label className="text-xs font-semibold text-slate-700 mb-1 block">
                      Pilih Perangkat OTB <span className="text-rose-500">*</span>
                    </label>
                    <select
                      className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all cursor-pointer"
                      value={otbId}
                      onChange={(e) => {
                        setOtbId(e.target.value);
                        setPortId("");
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

                  {/* Dropdown Port OTB */}
                  {otbId && (
                    <div>
                      <label className="text-xs font-semibold text-slate-700 mb-1 block">
                        Pilih Port OTB Kosong <span className="text-rose-500">*</span>
                      </label>
                      {loadingPorts ? (
                        <div className="text-xs text-slate-500 flex items-center gap-1.5 py-1">
                          <Loader2 size={13} className="animate-spin text-purple-600" />
                          <span>Memuat port yang tersedia...</span>
                        </div>
                      ) : (
                        <select
                          className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all cursor-pointer"
                          value={portId}
                          onChange={(e) => setPortId(e.target.value)}
                        >
                          <option value="">— Pilih Port Kosong —</option>
                          {(portsPage?.data ?? []).map((p) => (
                            <option key={p.id} value={p.id}>
                              Port {p.port_number} (Tersedia)
                            </option>
                          ))}
                          {(portsPage?.data ?? []).length === 0 && (
                            <option value="" disabled>
                              Tidak ada port kosong pada OTB ini
                            </option>
                          )}
                        </select>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 mb-1 block">
                      Lokasi Tujuan <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                      placeholder="mis. Carrier Telkom / OTB Eksternal"
                      value={destLocation}
                      onChange={(e) => setDestLocation(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700 mb-1 block">
                      Port Tujuan
                    </label>
                    <input
                      type="text"
                      className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                      placeholder="mis. Port 1 / Line A"
                      value={destPort}
                      onChange={(e) => setDestPort(e.target.value)}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Banner Error */}
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
                  <span>Pasang Cross-Connect</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default WorkOrderCrossConnectModal;
