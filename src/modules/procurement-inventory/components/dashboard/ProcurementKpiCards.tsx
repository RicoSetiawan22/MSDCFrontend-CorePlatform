import React, { type ReactNode } from "react";
import { Link } from "react-router-dom";
import {
  FileText,
  FileCheck2,
  ShoppingBag,
  Truck,
  Boxes,
  Building2,
  Wrench,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  type LucideIcon,
} from "lucide-react";
import { formatNumber, formatCurrency } from "@shared/lib/format";
import type { DashboardSummary } from "../../types/dashboard";

interface ProcurementKpiCardsProps {
  summary: DashboardSummary | null;
}

export const ProcurementKpiCards: React.FC<ProcurementKpiCardsProps> = ({ summary }) => {
  const outOfStock = summary?.inventory.out_of_stock_count ?? 0;
  const lowStock = summary?.inventory.below_reorder_point ?? 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      <KpiCard
        title="Purchase Request"
        icon={FileText}
        color="text-blue-700"
        bgColor="bg-blue-50 text-blue-600 border-blue-100/90"
        linkTo="/procurement-inventory/purchase-requests"
      >
        <div className="grid grid-cols-2 gap-2 mt-1">
          <KpiMetric label="Total" value={summary?.purchase_requests.total ?? 0} color="text-slate-800" />
          <KpiMetric
            label="Menunggu Approval"
            value={summary?.purchase_requests.pending_approval_count ?? 0}
            color="text-amber-600"
            highlight={(summary?.purchase_requests.pending_approval_count ?? 0) > 0}
          />
        </div>
      </KpiCard>

      <KpiCard
        title="RFQ / Quotation"
        icon={FileCheck2}
        color="text-purple-700"
        bgColor="bg-purple-50 text-purple-600 border-purple-100/90"
        linkTo="/procurement-inventory/vendor-quotations"
      >
        <div className="mt-1">
          <KpiMetric
            label="Menunggu Approval EPM"
            value={summary?.rfq.pending_epm_approval ?? 0}
            color="text-purple-700"
            highlight={(summary?.rfq.pending_epm_approval ?? 0) > 0}
          />
        </div>
      </KpiCard>

      <KpiCard
        title="Purchase Order"
        icon={ShoppingBag}
        color="text-amber-700"
        bgColor="bg-amber-50 text-amber-600 border-amber-100/90"
        linkTo="/procurement-inventory/purchase-orders"
      >
        <div className="grid grid-cols-2 gap-2 mt-1">
          <KpiMetric label="Total" value={summary?.purchase_orders.total ?? 0} color="text-slate-800" />
          <KpiMetric
            label="Menunggu Approval"
            value={summary?.purchase_orders.pending_approval_count ?? 0}
            color="text-amber-600"
            highlight={(summary?.purchase_orders.pending_approval_count ?? 0) > 0}
          />
        </div>
        <div className="mt-3 pt-2.5 border-t border-slate-100 flex justify-between items-center text-xs">
          <span className="text-slate-400 font-medium">Nilai PO berjalan:</span>
          <span className="font-bold text-amber-700 font-mono">
            {formatCurrency(summary?.purchase_orders.open_value ?? 0)}
          </span>
        </div>
      </KpiCard>

      <KpiCard
        title="Goods Receipt"
        icon={Truck}
        color="text-emerald-700"
        bgColor="bg-emerald-50 text-emerald-600 border-emerald-100/90"
        linkTo="/procurement-inventory/goods-receipts"
      >
        <div className="grid grid-cols-2 gap-2 mt-1">
          <KpiMetric
            label="Draft (Belum Post)"
            value={summary?.goods_receipts.draft_count ?? 0}
            color="text-amber-600"
            highlight={(summary?.goods_receipts.draft_count ?? 0) > 0}
          />
          <KpiMetric
            label="Posted Bulan Ini"
            value={summary?.goods_receipts.posted_this_month_count ?? 0}
            color="text-emerald-700"
          />
        </div>
      </KpiCard>

      {/* Item & Inventory dengan Indikator Alert Kosong/Reorder Point */}
      <KpiCard
        title="Item & Inventory"
        icon={Boxes}
        color="text-slate-700"
        bgColor="bg-slate-100 text-slate-700 border-slate-200/90"
        linkTo="/procurement-inventory/items"
      >
        <div className="grid grid-cols-2 gap-2 mt-1">
          <KpiMetric label="Total Item" value={summary?.inventory.total_items ?? 0} color="text-slate-800" />
          <KpiMetric label="Warehouse" value={summary?.inventory.total_warehouses ?? 0} color="text-slate-800" />
        </div>
        <div className="mt-3 pt-2.5 border-t border-slate-100 text-xs">
          {outOfStock > 0 ? (
            <span className="text-rose-600 font-bold flex items-center gap-1.5">
              <AlertCircle size={13} className="shrink-0" />
              <span>{outOfStock} item stok kosong!</span>
            </span>
          ) : lowStock > 0 ? (
            <span className="text-amber-600 font-semibold flex items-center gap-1.5">
              <AlertTriangle size={13} className="shrink-0" />
              <span>{lowStock} item di bawah reorder point</span>
            </span>
          ) : (
            <span className="text-slate-400 flex items-center gap-1.5">
              <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
              <span>Semua stok item dalam kondisi aman</span>
            </span>
          )}
        </div>
      </KpiCard>

      <KpiCard
        title="Vendor"
        icon={Building2}
        color="text-indigo-700"
        bgColor="bg-indigo-50 text-indigo-600 border-indigo-100/90"
        linkTo="/procurement-inventory/vendors"
      >
        <div className="mt-1">
          <KpiMetric label="Vendor Aktif" value={summary?.vendors.total_active ?? 0} color="text-slate-800" />
        </div>
      </KpiCard>

      <KpiCard
        title="Asset Maintenance"
        icon={Wrench}
        color="text-rose-700"
        bgColor="bg-rose-50 text-rose-600 border-rose-100/90"
        linkTo="/procurement-inventory/maintenance"
      >
        <div className="grid grid-cols-2 gap-2 mt-1">
          <KpiMetric label="Total Asset" value={summary?.assets.total ?? 0} color="text-slate-800" />
          <KpiMetric
            label="Overdue Maintenance"
            value={summary?.assets.overdue_maintenance ?? 0}
            color="text-rose-600"
            highlight={(summary?.assets.overdue_maintenance ?? 0) > 0}
          />
        </div>
      </KpiCard>
    </div>
  );
};

function KpiCard({
  title,
  icon: Icon,
  color,
  bgColor,
  linkTo,
  children,
}: {
  title: string;
  icon: LucideIcon;
  color: string;
  bgColor: string;
  linkTo: string;
  children: ReactNode;
}) {
  return (
    <Link to={linkTo} className="no-underline text-inherit block h-full">
      <div className="bg-white rounded-2xl border border-slate-200/80 hover:border-slate-300 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 p-4 h-full flex flex-col justify-between group">
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className={`m-0 text-xs font-bold uppercase tracking-wider ${color} transition-colors`}>
              {title}
            </h3>
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center border shadow-2xs ${bgColor}`}>
              <Icon size={16} />
            </div>
          </div>
          {children}
        </div>
      </div>
    </Link>
  );
}

function KpiMetric({
  label,
  value,
  color,
  highlight,
}: {
  label: string;
  value: string | number;
  color: string;
  highlight?: boolean;
}) {
  return (
    <div className={`p-2.5 rounded-xl border ${highlight ? "bg-amber-50/80 border-amber-200/80" : "bg-slate-50/80 border-slate-100"}`}>
      <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider truncate mb-0.5">{label}</div>
      <div className={`text-lg font-bold font-mono ${highlight ? "text-rose-600" : color}`}>
        {typeof value === "number" ? formatNumber(value) : value}
      </div>
    </div>
  );
}