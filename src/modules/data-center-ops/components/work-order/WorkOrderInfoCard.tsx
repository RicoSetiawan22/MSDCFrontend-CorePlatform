import React from "react";
import { Link } from "react-router-dom";
import {
  Barcode,
  Building2,
  Calendar,
  Clock,
  FileText,
  ShieldCheck,
  Activity,
  Layers,
  Info,
  Server,
  Wifi,
  FlaskConical,
  ExternalLink,
} from "lucide-react";
import { formatDateTime } from "@shared/lib/format";
import type { WorkOrder } from "../../types/workOrder";

export interface WorkOrderInfoCardProps {
  workOrder: WorkOrder;
}

export const WorkOrderInfoCard: React.FC<WorkOrderInfoCardProps> = ({
  workOrder,
}) => {
  const isCompleted = workOrder.status === "completed";
  const so = workOrder.sales_order;
  const contract = workOrder.contract;

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return "—";
    try {
      return new Intl.DateTimeFormat("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }).format(new Date(dateStr));
    } catch {
      return dateStr;
    }
  };

  const doneCount = workOrder.items.filter((i) => i.is_completed).length;
  const totalCount = workOrder.items.length;
  const pct = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;

  const infoItems = [
    {
      label: "Nomor Sales Order",
      value: so?.so_number || `SO-${workOrder.sales_order_id ?? workOrder.id}`,
      icon: <Barcode size={18} className="text-blue-600" />,
      iconBg: "bg-blue-50",
      isMono: true,
      colSpan: "col-span-1",
    },
    {
      label: "Nama Pelanggan / Customer",
      value: so?.customer?.company_name || "—",
      icon: <Building2 size={18} className="text-amber-600" />,
      iconBg: "bg-amber-50",
      colSpan: "col-span-1",
    },
    {
      label: "Status Operasional",
      value: (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
            isCompleted
              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
              : "bg-blue-50 text-blue-700 border-blue-200"
          }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              isCompleted ? "bg-emerald-500" : "bg-blue-500"
            }`}
          />
          <span>{isCompleted ? "Selesai" : "Aktif"}</span>
        </span>
      ),
      icon: <ShieldCheck size={18} className="text-emerald-600" />,
      iconBg: "bg-emerald-50",
      colSpan: "col-span-1",
    },
    {
      label: "Nomor Kontrak CRM",
      value: (
        <div className="flex items-center gap-1.5">
          <span className="font-mono font-bold text-slate-900">
            {contract?.contract_number || `CTR-${workOrder.contract_id}`}
          </span>
          <Link
            to={`/crm-sales/contracts/${workOrder.contract_id}`}
            title="Lihat Detail Kontrak di CRM Sales"
            className="text-amber-600 hover:text-amber-700 inline-flex items-center transition-colors p-0.5 rounded hover:bg-amber-50"
          >
            <ExternalLink size={13} />
          </Link>
        </div>
      ),
      icon: <Layers size={18} className="text-indigo-600" />,
      iconBg: "bg-indigo-50",
      colSpan: "col-span-1",
    },
    {
      label: "Tanggal Sales Order",
      value: so?.order_date ? formatDate(so.order_date) : "—",
      icon: <Calendar size={18} className="text-teal-600" />,
      iconBg: "bg-teal-50",
      colSpan: "col-span-1",
    },
    {
      label: "Progres Pengerjaan",
      value: (
        <div className="flex flex-col gap-1.5 w-full max-w-[200px]">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-800">
              {doneCount}/{totalCount} item
            </span>
            <span className="font-bold text-amber-600">{pct}%</span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                pct === 100 ? "bg-emerald-500" : "bg-[#E59B00]"
              }`}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      ),
      icon: <Activity size={18} className="text-amber-600" />,
      iconBg: "bg-amber-50",
      colSpan: "col-span-1",
    },
    {
      label: "Tanggal Dibuat",
      value: workOrder.created_at ? formatDateTime(workOrder.created_at) : "—",
      icon: <Clock size={18} className="text-slate-500" />,
      iconBg: "bg-slate-100",
      colSpan: "col-span-1",
    },
    {
      label: "Terakhir Diperbarui",
      value: workOrder.updated_at ? formatDateTime(workOrder.updated_at) : "—",
      icon: <Clock size={18} className="text-slate-500" />,
      iconBg: "bg-slate-100",
      colSpan: "col-span-1",
    },
    {
      label: "Milestone Instalasi Kontrak",
      value:
        contract &&
        (contract.device_installed_at ||
          contract.internet_installed_at ||
          contract.testing_completed_at) ? (
          <div className="flex flex-wrap gap-2 mt-1">
            {contract.device_installed_at && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                <Server size={12} className="text-emerald-600" />
                <span>Perangkat: {formatDateTime(contract.device_installed_at)}</span>
              </span>
            )}
            {contract.internet_installed_at && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-800 border border-blue-200">
                <Wifi size={12} className="text-blue-600" />
                <span>Internet: {formatDateTime(contract.internet_installed_at)}</span>
              </span>
            )}
            {contract.testing_completed_at && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-800 border border-purple-200">
                <FlaskConical size={12} className="text-purple-600" />
                <span>Testing: {formatDateTime(contract.testing_completed_at)}</span>
              </span>
            )}
          </div>
        ) : (
          <span className="text-xs text-slate-500 font-medium">
            Belum ada milestone pemasangan fisik yang tercatat.
          </span>
        ),
      icon: <FileText size={18} className="text-indigo-600" />,
      iconBg: "bg-indigo-50",
      colSpan: "col-span-1 sm:col-span-2 lg:col-span-1",
    },
  ];

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col">
      {/* ── Header Card Band Bergaya Kuning Emas Pastel Sesuai Desain Device Inventory ── */}
      <div className="bg-[#FDE8B3]/60 px-6 py-4 border-b border-amber-200/50 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-[#0A2140] flex items-center justify-center font-bold">
            <Info size={17} />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              Informasi Perintah Kerja
            </h2>
            <p className="text-[11px] text-slate-600 font-medium">
              Rincian profil penugasan, data pelanggan CRM, nomor kontrak, dan progres operasional
            </p>
          </div>
        </div>

        {/* Status Pill Badge di Pojok Kanan Header */}
        <span
          className={`hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
            isCompleted
              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
              : "bg-emerald-50 text-emerald-700 border-emerald-200/80"
          }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              isCompleted ? "bg-emerald-600" : "bg-emerald-500"
            }`}
          />
          <span>Status: {isCompleted ? "Selesai" : "Aktif"}</span>
        </span>
      </div>

      {/* ── Grid Kartu Informasi Modern dengan Efek Hover Dashboard ── */}
      <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {infoItems.map((item) => (
          <div
            key={item.label}
            className={`group bg-white rounded-xl border border-slate-200/80 p-4 transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-md hover:border-slate-300 cursor-default select-none flex items-start gap-3.5 will-change-transform ${item.colSpan}`}
          >
            {/* ── Icon Bulat dengan Warna Pastel Khas ── */}
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110 ${item.iconBg}`}
            >
              {item.icon}
            </div>

            {/* ── Detail Label & Nilai ── */}
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                {item.label}
              </span>
              <div className="mt-0.5 text-slate-800 text-sm font-semibold">
                {item.value}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default WorkOrderInfoCard;
