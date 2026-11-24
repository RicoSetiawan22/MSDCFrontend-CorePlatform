import React from "react";
import { CheckCircle2, Circle, FlaskConical, Loader2, AlertCircle } from "lucide-react";
import { formatDateTime } from "@shared/lib/format";
import type { WorkOrderItem } from "../../types/workOrder";

export interface WorkOrderTestingCardProps {
  testingItem?: WorkOrderItem;
  onToggle: () => void;
  disabled?: boolean;
  isToggling?: boolean;
  canExecuteTesting?: boolean;
}

export const WorkOrderTestingCard: React.FC<WorkOrderTestingCardProps> = ({
  testingItem,
  onToggle,
  disabled = false,
  isToggling = false,
  canExecuteTesting = true,
}) => {
  if (!testingItem) return null;

  const isDone = testingItem.is_completed;
  const isLocked = !canExecuteTesting && !isDone;
  const isDisabled = disabled || isLocked;

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm flex flex-col gap-4">
      {/* ── Judul Card ── */}
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-slate-900 tracking-tight">
          Testing &amp; Commissioning
        </h2>
        {isDone && (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Pengujian Selesai
          </span>
        )}
      </div>

      {/* ── Checklist Testing Row ── */}
      <div
        className={`rounded-xl border transition-all duration-200 overflow-hidden ${
          isDone
            ? "border-emerald-300 bg-emerald-50/20 shadow-2xs"
            : isLocked
            ? "border-slate-200/70 bg-slate-50/50"
            : "border-slate-200/90 bg-white hover:border-slate-300"
        }`}
      >
        <div
          role="button"
          tabIndex={0}
          onClick={isDisabled ? undefined : onToggle}
          onKeyDown={(e) => {
            if ((e.key === "Enter" || e.key === " ") && !isDisabled) {
              e.preventDefault();
              onToggle();
            }
          }}
          className={`flex items-start gap-3.5 p-4 select-none transition-colors ${
            isDisabled
              ? "cursor-not-allowed opacity-75"
              : "cursor-pointer hover:bg-slate-50/50"
          }`}
        >
          {/* Checkbox Lingkaran */}
          <div className="pt-0.5 shrink-0 transition-transform active:scale-90">
            {isToggling ? (
              <Loader2 size={22} className="text-amber-500 animate-spin" />
            ) : isDone ? (
              <CheckCircle2 size={22} className="text-emerald-500 fill-emerald-50" />
            ) : (
              <Circle
                size={22}
                className={isLocked ? "text-slate-200" : "text-slate-300 hover:text-slate-400"}
              />
            )}
          </div>

          {/* Rincian Testing */}
          <div className="flex flex-col min-w-0 flex-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <FlaskConical size={17} className={isDone ? "text-emerald-600" : "text-purple-600"} />
              <span
                className={`text-sm font-bold tracking-tight transition-all ${
                  isDone ? "text-slate-400 line-through font-medium" : "text-slate-900"
                }`}
              >
                {testingItem.description ??
                  "Testing & commissioning - pastikan semua layanan di atas sudah aktif dan berfungsi normal."}
              </span>
            </div>

            {/* Helper notice jika layanan belum 100% selesai */}
            {isLocked && (
              <div className="flex items-center gap-1.5 text-xs text-amber-600 font-medium mt-2">
                <AlertCircle size={13} className="shrink-0" />
                <span>
                  Selesaikan seluruh item layanan fisik di atas terlebih dahulu untuk membuka tahap pengujian.
                </span>
              </div>
            )}

            {/* Timestamp Selesai */}
            {isDone && (
              <div className="text-xs text-emerald-700 font-semibold mt-1 flex items-center gap-1">
                <span>
                  ✓ Selesai{" "}
                  {testingItem.completed_at ? formatDateTime(testingItem.completed_at) : ""}
                  {testingItem.completed_by_user ? ` oleh ${testingItem.completed_by_user.name}` : ""}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkOrderTestingCard;
