import { useState } from "react";
import { Lock, Unlock, User, Server } from "lucide-react";
import { useRackOccupancy, useAllocateRackSlots, useReleaseRackAllocation } from "../../api/useRacks";
import { LoadingState } from "@shared/components/LoadingState";
import { extractErrorMessage } from "@shared/types/api";
import type { RackSlot } from "../../types/rack";

export interface RackVisualPickerProps {
  rackId: number;
  customerId?: number | null;
  contractId?: number | null;
  salesOrderId?: number | null;
  allocationStatus?: "active" | "reserved";
  onAllocated?: (allocation: { id: number; start_u: number; end_u: number }) => void;
}

export function RackVisualPicker({
  rackId,
  customerId,
  contractId,
  salesOrderId,
  allocationStatus = "active",
  onAllocated,
}: RackVisualPickerProps) {
  const { data: occupancy, isLoading } = useRackOccupancy(rackId);
  const allocateMutation = useAllocateRackSlots(rackId);
  const releaseMutation = useReleaseRackAllocation(rackId);

  const [anchor, setAnchor] = useState<number | null>(null);
  const [rangeEnd, setRangeEnd] = useState<number | null>(null);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (isLoading) return <LoadingState />;
  if (!occupancy) return null;

  const selectedRange =
    anchor !== null && rangeEnd !== null
      ? ([Math.min(anchor, rangeEnd), Math.max(anchor, rangeEnd)] as const)
      : null;

  const rangeIsValid = (() => {
    if (!selectedRange) return false;
    const minU = Math.min(selectedRange[0], selectedRange[1]);
    const maxU = Math.max(selectedRange[0], selectedRange[1]);

    // Ambil seluruh slot fisik yang berada di dalam rentang
    const targetSlots = occupancy.slots.filter(
      (slot) => slot.u >= minU && slot.u <= maxU
    );

    // Rentang valid jika jumlah slot cocok dan semua berstatus available
    const expectedCount = maxU - minU + 1;
    return (
      targetSlots.length === expectedCount &&
      targetSlots.every((s) => s.status === "available")
    );
  })();

  function handleSlotClick(slot: RackSlot) {
    if (slot.status === "booked") return;
    setError(null);
    if (anchor === null) {
      setAnchor(slot.u);
      setRangeEnd(null);
    } else if (rangeEnd === null) {
      setRangeEnd(slot.u);
    } else {
      setAnchor(slot.u);
      setRangeEnd(null);
    }
  }

  function resetSelection() {
    setAnchor(null);
    setRangeEnd(null);
    setNotes("");
    setError(null);
  }

  async function handleConfirmLock() {
    if (!selectedRange || !rangeIsValid) return;
    setError(null);
    try {
      const allocation = await allocateMutation.mutateAsync({
        start_u: selectedRange[0],
        end_u: selectedRange[1],
        customer_id: customerId ?? undefined,
        contract_id: contractId ?? undefined,
        sales_order_id: salesOrderId ?? undefined,
        status: allocationStatus,
        notes: notes || undefined,
      });
      onAllocated?.({
        id: allocation.id,
        start_u: selectedRange[0],
        end_u: selectedRange[1],
      });
      resetSelection();
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  }

  async function handleRelease(allocationId: number) {
    if (
      !confirm(
        "Lepas alokasi slot ini? Slot akan kembali kosong dan bisa dipesan customer lain."
      )
    )
      return;
    try {
      await releaseMutation.mutateAsync(allocationId);
    } catch (err) {
      alert(extractErrorMessage(err));
    }
  }

  const isSelected = (u: number) => {
    if (!selectedRange) return false;
    const minU = Math.min(selectedRange[0], selectedRange[1]);
    const maxU = Math.max(selectedRange[0], selectedRange[1]);
    return u >= minU && u <= maxU;
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Sub-header: Kode Rak & Indikator Legend */}
      <div className="flex items-center justify-between">
        <span className="font-mono font-bold text-sm text-slate-800">
          {occupancy.rack_code}
        </span>
        <div className="flex items-center gap-3 text-xs text-slate-600">
          <span className="inline-flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded-xs border border-emerald-400 bg-emerald-50 inline-block" />
            <span>Kosong</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded-xs border border-rose-400 bg-rose-50 inline-block" />
            <span>Terisi</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded-xs border border-blue-400 bg-blue-50 inline-block" />
            <span>Dipilih</span>
          </span>
        </div>
      </div>

      {/* Daftar Slot 42U Vertikal (U-42 di atas, U-01 di bawah) */}
      <div className="flex flex-col-reverse gap-1.5 border border-slate-200/80 bg-slate-50/40 rounded-xl p-2.5 max-h-[360px] overflow-y-auto">
        {occupancy.slots.map((slot) => {
          const booked = slot.status === "booked";
          const selected = isSelected(slot.u);

          return (
            <button
              key={slot.u}
              type="button"
              disabled={booked}
              onClick={() => handleSlotClick(slot)}
              title={
                booked
                  ? `U-${String(slot.u).padStart(2, "0")} — ${
                      slot.device_name ?? slot.customer_name ?? "Terisi"
                    }`
                  : `U-${String(slot.u).padStart(2, "0")} — Kosong (Klik untuk memilih)`
              }
              className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg border text-xs font-mono transition-all text-left ${
                booked
                  ? "bg-[#FEF2F2] border-[#FCA5A5] text-slate-700 cursor-not-allowed opacity-90"
                  : selected
                  ? "bg-[#EFF6FF] border-2 border-[#3B82F6] text-blue-900 font-bold shadow-xs cursor-pointer"
                  : "bg-[#F0FDF4] border-[#86EFAC] text-slate-800 hover:bg-emerald-100/60 hover:border-emerald-400 cursor-pointer shadow-2xs active:scale-[0.99]"
              }`}
            >
              <span className="font-bold">U-{String(slot.u).padStart(2, "0")}</span>

              {booked ? (
                <div className="flex items-center gap-2 overflow-hidden text-right">
                  {slot.device_name ? (
                    <span className="inline-flex items-center gap-1 text-[11px] text-slate-600 truncate max-w-[200px]">
                      <Server size={11} className="shrink-0 text-slate-400" />
                      {slot.device_code} — {slot.device_name}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] text-slate-600 truncate max-w-[200px]">
                      <User size={11} className="shrink-0 text-slate-400" />
                      {slot.customer_name ?? "Terisi"}
                    </span>
                  )}
                  {slot.allocation_id ? (
                    <span
                      role="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRelease(slot.allocation_id!);
                      }}
                      className="text-rose-600 hover:text-rose-800 p-0.5 hover:bg-rose-100 rounded transition-colors cursor-pointer shrink-0"
                      title="Lepas alokasi slot ini"
                    >
                      <Unlock size={12} />
                    </span>
                  ) : null}
                </div>
              ) : selected ? (
                <span className="text-[11px] font-semibold text-blue-600">Dipilih</span>
              ) : null}
            </button>
          );
        })}
      </div>

      {/* Helper note */}
      {!selectedRange ? (
        <p className="text-xs text-slate-500 leading-relaxed pt-1">
          Klik 1 slot kosong untuk titik awal, lalu klik slot kedua untuk tentukan rentangnya - harus berurutan (kontigu) & semuanya kosong.
        </p>
      ) : null}

      {/* ── Panel Konfirmasi Penguncian Rentang Slot ── */}
      {selectedRange ? (
        <div className="mt-2 bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 animate-in fade-in duration-150">
          <div className="text-sm font-bold text-slate-900 mb-2">
            Rentang dipilih: U-{String(selectedRange[0]).padStart(2, "0")} — U-{String(selectedRange[1]).padStart(2, "0")}{" "}
            <span className="text-slate-500 font-semibold">
              ({selectedRange[1] - selectedRange[0] + 1}U)
            </span>
          </div>

          {!rangeIsValid ? (
            <div className="text-xs text-rose-600 font-semibold bg-rose-50 border border-rose-200 rounded-lg p-2.5 mb-2">
              Rentang ini bersinggungan dengan slot yang sudah terisi - silakan pilih ulang.
            </div>
          ) : (
            <div className="flex flex-col gap-2.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Catatan (opsional)
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="mis. perlu tray tambahan"
                />
              </div>

              {error ? (
                <div className="text-xs text-rose-600 font-medium">{error}</div>
              ) : null}

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleConfirmLock}
                  disabled={allocateMutation.isPending}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#E59B00] hover:bg-[#D48F00] text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-xs active:scale-98 disabled:opacity-50"
                >
                  <Lock size={13} />
                  <span>
                    {allocateMutation.isPending ? "Mengunci..." : "Kunci Slot Ini"}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={resetSelection}
                  className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl transition-all cursor-pointer"
                >
                  Batal
                </button>
              </div>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}

export default RackVisualPicker;
