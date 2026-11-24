import React from "react";
import {
  Barcode,
  Server,
  Layers,
  Building2,
  Box,
  Hash,
  Zap,
  Calendar,
  Clock,
  FileText,
  ShieldCheck,
  Info,
} from "lucide-react";
import type { Device } from "../../types/device";

export interface DeviceInfoCardProps {
  device: Device;
}

export const DeviceInfoCard: React.FC<DeviceInfoCardProps> = ({ device }) => {
  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return "—";
    try {
      return new Intl.DateTimeFormat("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date(dateStr));
    } catch {
      return dateStr;
    }
  };

  const statusConfig = {
    active: {
      label: "Aktif",
      bg: "bg-emerald-50",
      text: "text-emerald-700",
      border: "border-emerald-200/80",
      dot: "bg-emerald-500",
    },
    spare: {
      label: "Cadangan (Spare)",
      bg: "bg-sky-50",
      text: "text-sky-700",
      border: "border-sky-200/80",
      dot: "bg-sky-500",
    },
    maintenance: {
      label: "Dalam Perbaikan (Maintenance)",
      bg: "bg-amber-50",
      text: "text-amber-700",
      border: "border-amber-200/80",
      dot: "bg-amber-500",
    },
    decommissioned: {
      label: "Didecommission",
      bg: "bg-slate-100",
      text: "text-slate-600",
      border: "border-slate-200/80",
      dot: "bg-slate-400",
    },
  }[device.status] ?? {
    label: device.status,
    bg: "bg-slate-100",
    text: "text-slate-700",
    border: "border-slate-200",
    dot: "bg-slate-400",
  };

  const infoItems = [
    {
      label: "Kode Perangkat",
      value: device.device_code,
      icon: <Barcode size={18} className="text-blue-600" />,
      iconBg: "bg-blue-50",
      isMono: true,
      colSpan: "col-span-1",
    },
    {
      label: "Nama Perangkat",
      value: device.device_name,
      icon: <Server size={18} className="text-amber-600" />,
      iconBg: "bg-amber-50",
      colSpan: "col-span-1 sm:col-span-2 lg:col-span-1",
    },
    {
      label: "Status Operasional",
      value: (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border}`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dot}`} />
          <span>{statusConfig.label}</span>
        </span>
      ),
      icon: <ShieldCheck size={18} className="text-emerald-600" />,
      iconBg: "bg-emerald-50",
      colSpan: "col-span-1",
    },
    {
      label: "Tipe Perangkat",
      value: (device.device_type || "server").toUpperCase(),
      icon: <Layers size={18} className="text-indigo-600" />,
      iconBg: "bg-indigo-50",
      colSpan: "col-span-1",
    },
    {
      label: "Manufacturer / Vendor",
      value: device.manufacturer || "—",
      icon: <Building2 size={18} className="text-slate-600" />,
      iconBg: "bg-slate-100",
      colSpan: "col-span-1",
    },
    {
      label: "Model",
      value: device.model || "—",
      icon: <Box size={18} className="text-purple-600" />,
      iconBg: "bg-purple-50",
      colSpan: "col-span-1",
    },
    {
      label: "Serial Number (SN)",
      value: device.serial_number || "—",
      icon: <Hash size={18} className="text-slate-600" />,
      iconBg: "bg-slate-100",
      isMono: Boolean(device.serial_number),
      colSpan: "col-span-1",
    },
    {
      label: "Konsumsi Daya (Watt)",
      value:
        device.power_watt !== null && device.power_watt !== undefined
          ? `${Number(device.power_watt).toLocaleString("id-ID")} W`
          : "—",
      icon: <Zap size={18} className="text-amber-600" />,
      iconBg: "bg-amber-50",
      isHighlight: Boolean(device.power_watt),
      colSpan: "col-span-1",
    },
    {
      label: "Tanggal Pembelian",
      value: device.purchase_date ? formatDate(device.purchase_date) : "—",
      icon: <Calendar size={18} className="text-teal-600" />,
      iconBg: "bg-teal-50",
      colSpan: "col-span-1",
    },
    {
      label: "Garansi Berakhir",
      value: device.warranty_expiry ? formatDate(device.warranty_expiry) : "—",
      icon: <Clock size={18} className="text-rose-600" />,
      iconBg: "bg-rose-50",
      colSpan: "col-span-1",
    },
    {
      label: "Tanggal Didaftarkan",
      value: formatDate(device.created_at),
      icon: <Calendar size={18} className="text-slate-500" />,
      iconBg: "bg-slate-100",
      colSpan: "col-span-1",
    },
    {
      label: "Terakhir Diperbarui",
      value: formatDate(device.updated_at),
      icon: <Clock size={18} className="text-slate-500" />,
      iconBg: "bg-slate-100",
      colSpan: "col-span-1",
    },
    {
      label: "Catatan Operasional",
      value: device.notes || "Tidak ada catatan operasional khusus untuk perangkat ini.",
      icon: <FileText size={18} className="text-indigo-600" />,
      iconBg: "bg-indigo-50",
      colSpan: "col-span-1 sm:col-span-2 lg:col-span-3",
    },
  ];

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col">
      {/* ── Header Card Band Bergaya Kuning Emas Pastel Sesuai Desain ── */}
      <div className="bg-[#FDE8B3]/60 px-6 py-4 border-b border-amber-200/50 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-[#0A2140] flex items-center justify-center font-bold">
            <Info size={17} />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              Device Information
            </h2>
            <p className="text-[11px] text-slate-600 font-medium">
              Rincian profil perangkat keras, spesifikasi teknis, dan konsumsi daya
            </p>
          </div>
        </div>

        {/* Status Pill Badge di Pojok Kanan Header */}
        <span
          className={`hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border}`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dot}`} />
          <span>Status: {statusConfig.label}</span>
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
              <div
                className={`mt-0.5 text-slate-800 ${
                  item.isMono ? "font-mono font-bold text-slate-900 text-xs" : ""
                } ${item.isHighlight ? "font-bold text-amber-700 text-base" : "text-sm font-semibold"}`}
              >
                {item.value}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DeviceInfoCard;
