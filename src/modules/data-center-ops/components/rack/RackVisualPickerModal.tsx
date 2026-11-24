import React, { useEffect } from "react";
import { Layers, X } from "lucide-react";
import { RackVisualPicker } from "./RackVisualPicker";
import type { Rack } from "../../types/rack";

export interface RackVisualPickerModalProps {
  rack: Rack | null;
  isOpen?: boolean;
  onClose: () => void;
  customerId?: number | null;
  contractId?: number | null;
  salesOrderId?: number | null;
  allocationStatus?: "active" | "reserved";
  onAllocated?: (allocation: { id: number; start_u: number; end_u: number }) => void;
}

export const RackVisualPickerModal: React.FC<RackVisualPickerModalProps> = ({
  rack,
  isOpen = true,
  onClose,
  customerId,
  contractId,
  salesOrderId,
  allocationStatus = "active",
  onAllocated,
}) => {
  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  if (!isOpen || !rack) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-[500px] p-6 relative animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#E59B00] flex items-center justify-center text-white shrink-0 shadow-xs">
              <Layers size={20} strokeWidth={2.2} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 leading-snug">
                Slot Rack — <span className="font-mono">{rack.rack_code}</span>
                {rack.site_room ? (
                  <span className="font-normal text-slate-500 text-xs ml-1.5">
                    ({rack.site_room.site?.site_code ?? ""} · {rack.site_room.room_code})
                  </span>
                ) : null}
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup modal"
            className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full p-1.5 transition-colors cursor-pointer disabled:opacity-40"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body: RackVisualPicker */}
        <div className="overflow-y-auto">
          <RackVisualPicker
            rackId={rack.id}
            customerId={customerId}
            contractId={contractId}
            salesOrderId={salesOrderId}
            allocationStatus={allocationStatus}
            onAllocated={onAllocated}
          />
        </div>
      </div>
    </div>
  );
};

export default RackVisualPickerModal;
