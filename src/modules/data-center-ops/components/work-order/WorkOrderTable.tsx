import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight, ClipboardList, Clock } from "lucide-react";
import { formatDate } from "@shared/lib/format";
import type { PendingSalesOrder, ServiceType } from "../../types/workOrder";

export interface WorkOrderTableProps {
  orders: PendingSalesOrder[];
  isLoading: boolean;
  onOpenOrder: (soId: number) => void;
}

const SERVICE_TAG_CONFIG: Record<
  ServiceType,
  { label: string; className: string }
> = {
  colocation: {
    label: "Colo Rack",
    className: "bg-blue-50 text-blue-700 border-blue-200/80",
  },
  bandwidth: {
    label: "Bandwidth",
    className: "bg-emerald-50 text-emerald-700 border-emerald-200/80",
  },
  cross_connect: {
    label: "Cross-Connect",
    className: "bg-purple-50 text-purple-700 border-purple-200/80",
  },
  dedicated_server: {
    label: "Dedicated",
    className: "bg-sky-50 text-sky-700 border-sky-200/80",
  },
  cloud: {
    label: "Cloud",
    className: "bg-indigo-50 text-indigo-700 border-indigo-200/80",
  },
  managed_service: {
    label: "Managed",
    className: "bg-amber-50 text-amber-700 border-amber-200/80",
  },
  other: {
    label: "Lainnya",
    className: "bg-slate-100 text-slate-700 border-slate-200/80",
  },
};

export const WorkOrderTable: React.FC<WorkOrderTableProps> = ({
  orders,
  isLoading,
  onOpenOrder,
}) => {
  if (isLoading && orders.length === 0) {
    return (
      <div className="overflow-x-auto rounded-xl border border-slate-200/80 bg-white">
        <table className="w-full text-left border-collapse">
          <thead className="bg-[#FEF9EE] border-b border-amber-200/60 text-slate-700 uppercase tracking-wider text-[0.72rem] font-bold">
            <tr>
              <th className="px-4 py-3">NO. SO</th>
              <th className="px-4 py-3">CUSTOMER</th>
              <th className="px-4 py-3">KONTRAK</th>
              <th className="px-4 py-3">TGL ORDER</th>
              <th className="px-4 py-3">LAYANAN</th>
              <th className="px-4 py-3">PROGRES INSTALASI</th>
              <th className="px-4 py-3">STATUS</th>
              <th className="px-4 py-3 text-center">AKSI</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {Array.from({ length: 5 }).map((_, idx) => (
              <tr key={idx} className="animate-pulse">
                <td className="px-4 py-4">
                  <div className="h-4 w-28 bg-slate-100 rounded"></div>
                </td>
                <td className="px-4 py-4">
                  <div className="h-4 w-36 bg-slate-100 rounded"></div>
                </td>
                <td className="px-4 py-4">
                  <div className="h-4 w-28 bg-slate-100 rounded"></div>
                </td>
                <td className="px-4 py-4">
                  <div className="h-4 w-20 bg-slate-100 rounded"></div>
                </td>
                <td className="px-4 py-4">
                  <div className="h-5 w-24 bg-slate-100 rounded"></div>
                </td>
                <td className="px-4 py-4">
                  <div className="h-4 w-32 bg-slate-100 rounded"></div>
                </td>
                <td className="px-4 py-4">
                  <div className="h-5 w-20 bg-slate-100 rounded-full"></div>
                </td>
                <td className="px-4 py-4 text-center">
                  <div className="h-7 w-20 bg-slate-100 rounded-lg mx-auto"></div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-14 px-4 rounded-xl border border-dashed border-slate-200 bg-slate-50/50 text-center">
        <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 mb-3 shadow-2xs">
          <ClipboardList size={22} />
        </div>
        <h3 className="text-sm font-bold text-slate-800">
          Tidak Ada Perintah Kerja Tersisa
        </h3>
        <p className="text-xs text-slate-500 max-w-sm mt-1 leading-relaxed">
          Seluruh Sales Order aktif sudah selesai dipasang dan ditest, atau tidak
          ada perintah kerja yang cocok dengan filter pencarian saat ini.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200/80 bg-white">
      <table className="w-full text-left border-collapse">
        <thead className="bg-[#FEF9EE] border-b border-amber-200/60 text-slate-700 uppercase tracking-wider text-[0.72rem] font-bold">
          <tr>
            <th className="px-4 py-3">NO. SO</th>
            <th className="px-4 py-3">CUSTOMER</th>
            <th className="px-4 py-3">KONTRAK</th>
            <th className="px-4 py-3">TGL ORDER</th>
            <th className="px-4 py-3">LAYANAN</th>
            <th className="px-4 py-3">PROGRES INSTALASI</th>
            <th className="px-4 py-3">STATUS</th>
            <th className="px-4 py-3 text-center">AKSI</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 text-xs">
          {orders.map((so) => {
            const contract =
              so.source_contract ?? so.contracts?.[0] ?? null;
            const items = so.work_order?.items ?? [];
            const doneCount = items.filter((i) => i.is_completed).length;
            const totalCount = items.length;
            const pct =
              totalCount > 0
                ? Math.round((doneCount / totalCount) * 100)
                : 0;

            // Status Badge Calculation
            const serviceItems = items.filter((i) => i.item_type === "service");
            const allServicesDone =
              serviceItems.length > 0 &&
              serviceItems.every((i) => i.is_completed);

            let statusLabel = "Belum Dimulai";
            let statusBadgeClass =
              "bg-slate-100 text-slate-700 border-slate-200";

            if (totalCount === 0) {
              statusLabel = "Belum Dibuka";
              statusBadgeClass =
                "bg-slate-100 text-slate-600 border-slate-200";
            } else if (pct === 100) {
              statusLabel = "Selesai";
              statusBadgeClass =
                "bg-emerald-50 text-emerald-700 border-emerald-200/80";
            } else if (allServicesDone) {
              statusLabel = "Siap Testing";
              statusBadgeClass =
                "bg-purple-50 text-purple-700 border-purple-200/80";
            } else if (doneCount > 0) {
              statusLabel = "Dalam Pengerjaan";
              statusBadgeClass =
                "bg-amber-50 text-amber-700 border-amber-200/80";
            }

            // Distinct service tags
            const distinctServiceTypes = Array.from(
              new Set(
                items
                  .map((i) => i.service_type)
                  .filter((t): t is ServiceType => !!t)
              )
            );

            return (
              <tr
                key={so.id}
                className="hover:bg-slate-50/70 transition-colors group"
              >
                {/* ── No. SO ── */}
                <td className="px-4 py-3.5">
                  <button
                    type="button"
                    onClick={() => onOpenOrder(so.id)}
                    className="font-mono font-bold text-slate-900 group-hover:text-amber-600 transition-colors text-xs text-left cursor-pointer"
                  >
                    {so.so_number}
                  </button>
                </td>

                {/* ── Customer ── */}
                <td className="px-4 py-3.5 font-semibold text-slate-800">
                  {so.customer?.company_name ?? (
                    <span className="text-slate-400 font-normal">—</span>
                  )}
                </td>

                {/* ── Kontrak ── */}
                <td className="px-4 py-3.5 font-mono">
                  {contract ? (
                    <Link
                      to={`/crm-sales/contracts/${contract.id}`}
                      className="text-sky-600 hover:text-sky-700 hover:underline font-medium text-xs cursor-pointer"
                    >
                      {contract.contract_number}
                    </Link>
                  ) : (
                    <span className="text-slate-400">—</span>
                  )}
                </td>

                {/* ── Tanggal Order ── */}
                <td className="px-4 py-3.5 text-slate-600">
                  {formatDate(so.order_date)}
                </td>

                {/* ── Ringkasan Layanan ── */}
                <td className="px-4 py-3.5">
                  <div className="flex flex-wrap gap-1 max-w-[170px]">
                    {distinctServiceTypes.length > 0 ? (
                      distinctServiceTypes.map((st) => {
                        const conf = SERVICE_TAG_CONFIG[st] || {
                          label: st,
                          className: "bg-slate-50 text-slate-600 border-slate-200",
                        };
                        return (
                          <span
                            key={st}
                            className={`inline-block px-2 py-0.5 rounded text-[0.68rem] font-bold border ${conf.className}`}
                          >
                            {conf.label}
                          </span>
                        );
                      })
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </div>
                </td>

                {/* ── Progres Pengerjaan ── */}
                <td className="px-4 py-3.5 min-w-[150px]">
                  {totalCount > 0 ? (
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center justify-between text-[0.72rem]">
                        <span className="font-semibold text-slate-700">
                          {doneCount}/{totalCount} item
                        </span>
                        <span className="font-mono font-bold text-slate-800">
                          {pct}%
                        </span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 rounded-full ${
                            pct === 100
                              ? "bg-emerald-500"
                              : pct >= 50
                              ? "bg-[#E59B00]"
                              : "bg-amber-400"
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-slate-400 text-[0.72rem] italic">
                      <Clock size={12} />
                      <span>Belum dibuka</span>
                    </div>
                  )}
                </td>

                {/* ── Status Badge ── */}
                <td className="px-4 py-3.5">
                  <span
                    className={`inline-block px-2.5 py-0.5 rounded-full text-[0.7rem] font-bold border shadow-2xs whitespace-nowrap ${statusBadgeClass}`}
                  >
                    {statusLabel}
                  </span>
                </td>

                {/* ── Aksi ── */}
                <td className="px-4 py-3.5 text-center">
                  <button
                    type="button"
                    onClick={() => onOpenOrder(so.id)}
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-[#E59B00] hover:bg-[#D48F00] active:bg-[#c28100] text-white text-xs font-bold rounded-lg transition-all active:scale-[0.98] cursor-pointer shadow-xs whitespace-nowrap"
                  >
                    <span>{totalCount > 0 ? "Lanjutkan" : "Proses"}</span>
                    <ArrowRight size={12} />
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default WorkOrderTable;
