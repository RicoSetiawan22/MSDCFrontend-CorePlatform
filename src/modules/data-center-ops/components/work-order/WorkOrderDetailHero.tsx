import React from "react";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import type { WorkOrder } from "../../types/workOrder";

export interface WorkOrderDetailHeroProps {
  workOrder: WorkOrder;
  onBack: () => void;
}

export const WorkOrderDetailHero: React.FC<WorkOrderDetailHeroProps> = ({
  workOrder,
  onBack,
}) => {
  const isCompleted = workOrder.status === "completed";
  const soNumber = workOrder.sales_order?.so_number || `SO-${workOrder.sales_order_id ?? workOrder.id}`;
  const companyName = workOrder.sales_order?.customer?.company_name || "—";
  const contractNumber = workOrder.contract?.contract_number || `CTR-${workOrder.contract_id}`;

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm flex flex-col gap-4">
      {/* ── Baris Atas: Judul, Status Pill, dan Tombol Kembali ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Perintah Kerja {soNumber}
            </h1>

            {/* Status Pill Badge */}
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border transition-colors ${
                isCompleted
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200/90 shadow-2xs"
                  : "bg-emerald-50 text-emerald-600 border-emerald-200/80"
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  isCompleted ? "bg-emerald-600" : "bg-emerald-500"
                }`}
              />
              <span>{isCompleted ? "SELESAI" : "AKTIF"}</span>
            </span>
          </div>

          {/* Subtitle Nama Perusahaan & Kontrak */}
          <div className="flex flex-col mt-1">
            <span className="text-base sm:text-lg font-bold text-slate-800 tracking-tight">
              {companyName}
            </span>
            <span className="text-xs sm:text-sm font-semibold text-slate-500 font-mono mt-0.5">
              Kontrak {contractNumber}
            </span>
          </div>
        </div>

        {/* Tombol Kembali */}
        <div className="self-start sm:self-center">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-all cursor-pointer shadow-2xs active:scale-95"
          >
            <ArrowLeft size={14} className="text-slate-500" />
            <span>Kembali</span>
          </button>
        </div>
      </div>

      {/* Banner Selesai jika Work Order status === completed */}
      {isCompleted && (
        <div className="mt-2 bg-emerald-50/80 border border-emerald-200 rounded-xl p-3.5 flex items-center gap-3 text-emerald-800 text-xs font-semibold">
          <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
          <span>
            Semua item checklist telah selesai dipasang dan melalui tahap pengujian — Perintah Kerja ini telah rampung.
          </span>
        </div>
      )}
    </div>
  );
};

export default WorkOrderDetailHero;
