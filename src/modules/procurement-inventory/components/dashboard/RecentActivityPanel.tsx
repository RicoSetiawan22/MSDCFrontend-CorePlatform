import React from "react";
import { Link } from "react-router-dom";
import {
  Clock,
  FileText,
  ShoppingBag,
  Truck,
  Inbox,
  type LucideIcon,
} from "lucide-react";
import { formatCurrency, formatDate } from "@shared/lib/format";
import type { ActivityItem } from "../../types/dashboard";

const ACTIVITY_META: Record<
  ActivityItem["type"],
  { icon: LucideIcon; name: string; path: string; iconBg: string; iconColor: string }
> = {
  purchase_request: {
    icon: FileText,
    name: "Purchase Request",
    path: "/procurement-inventory/purchase-requests",
    iconBg: "bg-blue-50 border-blue-100",
    iconColor: "text-blue-600",
  },
  purchase_order: {
    icon: ShoppingBag,
    name: "Purchase Order",
    path: "/procurement-inventory/purchase-orders",
    iconBg: "bg-amber-50 border-amber-100",
    iconColor: "text-amber-600",
  },
  goods_receipt: {
    icon: Truck,
    name: "Goods Receipt",
    path: "/procurement-inventory/goods-receipts",
    iconBg: "bg-emerald-50 border-emerald-100",
    iconColor: "text-emerald-600",
  },
};

export const RecentActivityPanel: React.FC<{ activity: ActivityItem[] }> = ({
  activity,
}) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 flex flex-col">
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-amber-50 text-amber-600 rounded-xl border border-amber-100/80 shrink-0">
            <Clock size={16} />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider m-0">
              Aktivitas Terkini
            </h3>
            <span className="text-[11px] text-slate-400">Log transaksi pengadaan</span>
          </div>
        </div>
        <span className="text-[10px] font-semibold text-slate-400 bg-slate-50 border border-slate-200/70 px-2 py-0.5 rounded-md">
          Real-time
        </span>
      </div>

      {activity.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-slate-400 text-xs">
          <div className="w-10 h-10 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-center text-slate-400 mb-2">
            <Inbox size={20} />
          </div>
          <span>Belum ada transaksi terkini.</span>
        </div>
      ) : (
        <div className="flex flex-col gap-2 max-h-[440px] overflow-y-auto pr-1">
          {activity.map((item, idx) => {
            const meta = ACTIVITY_META[item.type] ?? {
              icon: FileText,
              name: "Transaksi",
              path: "#",
              iconBg: "bg-slate-50 border-slate-200",
              iconColor: "text-slate-600",
            };
            const Icon = meta.icon;

            return (
              <Link
                key={idx}
                to={meta.path}
                className="group block no-underline text-inherit transition-all duration-150"
              >
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50/70 border border-slate-100 group-hover:bg-amber-50/40 group-hover:border-amber-200/60 transition-all">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={`w-8 h-8 rounded-xl border flex items-center justify-center shadow-2xs shrink-0 ${meta.iconBg} ${meta.iconColor}`}
                    >
                      <Icon size={15} />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-900 font-mono truncate">
                        {item.label}
                      </div>
                      <div className="text-[11px] text-slate-500 truncate">
                        {meta.name} · {formatDate(item.created_at)}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    {item.amount !== undefined && (
                      <span className="text-xs font-mono font-bold text-slate-800">
                        {formatCurrency(item.amount)}
                      </span>
                    )}
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-600 uppercase tracking-wider">
                      {item.status}
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
};