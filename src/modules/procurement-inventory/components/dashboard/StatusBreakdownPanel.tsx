import React from "react";
import { FileText, ShoppingBag } from "lucide-react";

const PR_STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  submitted: "Menunggu Approval",
  approved: "Disetujui",
  rejected: "Ditolak",
  cancelled: "Dibatalkan",
  converted_to_po: "Jadi PO",
};

const PO_STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  submitted: "Menunggu Approval",
  approved: "Disetujui",
  sent_to_vendor: "Menunggu Vendor",
  partially_received: "Sebagian Diterima",
  completed: "Selesai",
  cancelled: "Dibatalkan",
  rejected: "Ditolak",
};

const STATUS_COLOR_MAP: Record<string, string> = {
  draft: "bg-slate-400",
  submitted: "bg-amber-500",
  approved: "bg-emerald-500",
  sent_to_vendor: "bg-blue-500",
  partially_received: "bg-cyan-500",
  completed: "bg-emerald-600",
  converted_to_po: "bg-blue-600",
  rejected: "bg-rose-500",
  cancelled: "bg-rose-400",
};

interface StatusBreakdownPanelProps {
  prData: Record<string, number>;
  poData: Record<string, { count: number; value: number }>;
}

export const StatusBreakdownPanel: React.FC<StatusBreakdownPanelProps> = ({
  prData,
  poData,
}) => {
  const formattedPoData = Object.fromEntries(
    Object.entries(poData).map(([k, v]) => [k, v.count])
  );

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 flex flex-col gap-6">
      {/* PR Section */}
      <div>
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl border border-blue-100/80 shrink-0">
              <FileText size={16} />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider m-0">
                Status Purchase Request
              </h3>
              <span className="text-[11px] text-slate-400">Distribusi status pengajuan PR</span>
            </div>
          </div>
          <span className="text-[10px] bg-blue-50 text-blue-700 font-semibold px-2 py-0.5 rounded-md border border-blue-200/60">
            PR
          </span>
        </div>
        <StatusProgressBar data={prData} labels={PR_STATUS_LABELS} />
      </div>

      {/* PO Section */}
      <div>
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl border border-amber-100/80 shrink-0">
              <ShoppingBag size={16} />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider m-0">
                Status Purchase Order
              </h3>
              <span className="text-[11px] text-slate-400">Distribusi status kontrak PO</span>
            </div>
          </div>
          <span className="text-[10px] bg-amber-50 text-amber-700 font-semibold px-2 py-0.5 rounded-md border border-amber-200/60">
            PO
          </span>
        </div>
        <StatusProgressBar data={formattedPoData} labels={PO_STATUS_LABELS} />
      </div>
    </div>
  );
};

function StatusProgressBar({
  data,
  labels,
}: {
  data: Record<string, number>;
  labels: Record<string, string>;
}) {
  const total = Object.values(data).reduce((a, b) => a + b, 0);
  const entries = Object.entries(data).filter(([, v]) => v > 0);

  if (entries.length === 0) {
    return <div className="text-xs text-slate-400 py-3 italic">Belum ada data transaksi.</div>;
  }

  return (
    <div className="flex flex-col gap-3">
      {entries.map(([status, count]) => {
        const pct = total > 0 ? Math.round((count / total) * 100) : 0;
        const colorClass = STATUS_COLOR_MAP[status] ?? "bg-slate-400";

        return (
          <div key={status} className="flex flex-col gap-1.5">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-700 font-medium">{labels[status] ?? status}</span>
              <span className="font-mono font-bold text-slate-900">
                {count}{" "}
                <span className="text-slate-400 text-[11px] font-normal">({pct}%)</span>
              </span>
            </div>
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full ${colorClass} rounded-full transition-all duration-300`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}