import React from "react";
import {
  Calendar,
  Server,
  Zap,
  Activity,
  Wrench,
  Layers,
  ArrowRight,
} from "lucide-react";
import type { UsageRecord, UsageType, UsageStatus } from "../../types/usage";

export interface UsageTableProps {
  records: UsageRecord[];
  isLoading: boolean;
  onBillRemoteHands: (record: UsageRecord) => void;
}

const TYPE_CONFIG: Record<
  UsageType,
  { label: string; bg: string; text: string; border: string; icon: React.ReactNode }
> = {
  rack_space: {
    label: "Rack Space",
    bg: "bg-blue-50",
    text: "text-blue-700",
    border: "border-blue-200",
    icon: <Server size={13} />,
  },
  power: {
    label: "Power",
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
    icon: <Zap size={13} />,
  },
  bandwidth: {
    label: "Bandwidth",
    bg: "bg-indigo-50",
    text: "text-indigo-700",
    border: "border-indigo-200",
    icon: <Activity size={13} />,
  },
  remote_hands: {
    label: "Remote Hands",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
    icon: <Wrench size={13} />,
  },
};

const STATUS_CONFIG: Record<
  UsageStatus,
  { label: string; bg: string; text: string; border: string; dot: string }
> = {
  draft: {
    label: "Draft",
    bg: "bg-slate-100",
    text: "text-slate-600",
    border: "border-slate-200",
    dot: "bg-slate-400",
  },
  sent_to_finance: {
    label: "Sent to Finance",
    bg: "bg-sky-50",
    text: "text-sky-800",
    border: "border-sky-200",
    dot: "bg-sky-500",
  },
  billed: {
    label: "Sudah Ditagih",
    bg: "bg-emerald-50",
    text: "text-emerald-800",
    border: "border-emerald-200",
    dot: "bg-emerald-500",
  },
  waived: {
    label: "Dilepas (Waived)",
    bg: "bg-rose-50",
    text: "text-rose-800",
    border: "border-rose-200",
    dot: "bg-rose-500",
  },
};

export const UsageTable: React.FC<UsageTableProps> = ({
  records,
  isLoading,
  onBillRemoteHands,
}) => {
  if (isLoading) {
    return (
      <div className="overflow-x-auto rounded-xl border border-slate-200/80 bg-white">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#FEF9EE] text-[#7A5800] border-b border-amber-200/60 font-bold uppercase text-[11px] tracking-wider">
            <tr>
              <th className="py-3.5 px-4">Periode</th>
              <th className="py-3.5 px-4">Tipe Penggunaan</th>
              <th className="py-3.5 px-4">Kuantitas</th>
              <th className="py-3.5 px-4">Satuan</th>
              <th className="py-3.5 px-4">Customer</th>
              <th className="py-3.5 px-4">Status Tagihan</th>
              <th className="py-3.5 px-4 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {Array.from({ length: 5 }).map((_, idx) => (
              <tr key={idx} className="animate-pulse">
                <td className="py-3.5 px-4">
                  <div className="h-4 w-20 bg-slate-100 rounded" />
                </td>
                <td className="py-3.5 px-4">
                  <div className="h-4 w-28 bg-slate-100 rounded" />
                </td>
                <td className="py-3.5 px-4">
                  <div className="h-4 w-16 bg-slate-100 rounded" />
                </td>
                <td className="py-3.5 px-4">
                  <div className="h-4 w-14 bg-slate-100 rounded" />
                </td>
                <td className="py-3.5 px-4">
                  <div className="h-4 w-24 bg-slate-100 rounded" />
                </td>
                <td className="py-3.5 px-4">
                  <div className="h-4 w-24 bg-slate-100 rounded" />
                </td>
                <td className="py-3.5 px-4 text-center">
                  <div className="h-6 w-16 bg-slate-100 rounded mx-auto" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (records.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200/80 bg-white p-12 flex flex-col items-center justify-center text-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400">
          <Layers size={24} />
        </div>
        <div className="flex flex-col gap-1 max-w-sm">
          <span className="text-sm font-bold text-slate-800">
            Belum Ada Usage Record
          </span>
          <span className="text-xs text-slate-500">
            Generate usage record terlebih dahulu untuk periode yang diinginkan melalui panel di atas atau sesuaikan filter pencarian Anda.
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200/80 bg-white shadow-2xs">
      <table className="w-full text-left text-xs">
        <thead className="bg-[#FEF9EE] text-[#7A5800] border-b border-amber-200/60 font-bold uppercase text-[11px] tracking-wider select-none">
          <tr>
            <th className="py-3.5 px-4">Periode</th>
            <th className="py-3.5 px-4">Tipe Penggunaan</th>
            <th className="py-3.5 px-4">Kuantitas</th>
            <th className="py-3.5 px-4">Satuan</th>
            <th className="py-3.5 px-4">Customer</th>
            <th className="py-3.5 px-4">Status Tagihan</th>
            <th className="py-3.5 px-4 text-center">Aksi</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 text-slate-700">
          {records.map((rec) => {
            const typeConfig = TYPE_CONFIG[rec.usage_type] ?? {
              label: rec.usage_type,
              bg: "bg-slate-50",
              text: "text-slate-700",
              border: "border-slate-200",
              icon: <Layers size={13} />,
            };

            const status = STATUS_CONFIG[rec.status] ?? STATUS_CONFIG.draft;
            const isRemoteHandsDraft =
              rec.usage_type === "remote_hands" && rec.status === "draft";

            return (
              <tr
                key={rec.id}
                className="hover:bg-slate-50/80 transition-colors group"
              >
                {/* Periode */}
                <td className="py-3 px-4">
                  <div className="flex items-center gap-1.5 font-mono font-bold text-slate-900">
                    <Calendar size={13} className="text-amber-500 shrink-0" />
                    <span>
                      {rec.period_year}/
                      {String(rec.period_month).padStart(2, "0")}
                    </span>
                  </div>
                </td>

                {/* Tipe Penggunaan */}
                <td className="py-3 px-4">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border ${typeConfig.bg} ${typeConfig.text} ${typeConfig.border}`}
                  >
                    {typeConfig.icon}
                    <span>{typeConfig.label}</span>
                  </span>
                </td>

                {/* Kuantitas */}
                <td className="py-3 px-4">
                  <span className="font-bold text-slate-900 text-sm">
                    {typeof rec.quantity === "number"
                      ? rec.quantity.toLocaleString("id-ID")
                      : rec.quantity}
                  </span>
                </td>

                {/* Satuan */}
                <td className="py-3 px-4">
                  <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200/60">
                    {rec.unit}
                  </span>
                </td>

                {/* Customer */}
                <td className="py-3 px-4">
                  <span className="font-semibold text-slate-800">
                    {rec.customer_id ? `#CUST-${rec.customer_id}` : "—"}
                  </span>
                </td>

                {/* Status Tagihan */}
                <td className="py-3 px-4">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${status.bg} ${status.text} ${status.border}`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                    <span>{status.label}</span>
                  </span>
                </td>

                {/* Aksi */}
                <td className="py-3 px-4 text-center">
                  {isRemoteHandsDraft ? (
                    <button
                      type="button"
                      onClick={() => onBillRemoteHands(rec)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#E59B00] hover:bg-[#D48F00] active:bg-[#C28100] text-white text-xs font-bold rounded-lg transition-all active:scale-95 cursor-pointer shadow-xs hover:shadow"
                    >
                      <span>Tagih</span>
                      <ArrowRight size={13} />
                    </button>
                  ) : rec.status === "sent_to_finance" ? (
                    <span className="text-[11px] font-medium text-sky-700">
                      Terkirim ke AR
                    </span>
                  ) : rec.status === "billed" ? (
                    <span className="text-[11px] font-medium text-emerald-700">
                      Invoice Terbit
                    </span>
                  ) : (
                    <span className="text-[11px] text-slate-400 font-medium">
                      Otomatis Kontrak
                    </span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default UsageTable;
