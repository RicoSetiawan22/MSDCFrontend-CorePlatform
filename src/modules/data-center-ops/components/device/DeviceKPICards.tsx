import React from "react";
import { HardDrive, Activity, Boxes, Zap } from "lucide-react";

export interface DeviceKPIMetrics {
  totalDevices: number;
  activeDevices: number;
  spareDevices: number;
  maintenanceDevices: number;
  totalPowerWatt: number;
  serversCount: number;
  storageCount: number;
  networkCount: number;
  otherCount: number;
}

export interface DeviceKPICardsProps {
  metrics: DeviceKPIMetrics;
  selectedStatus?: string;
  onFilterStatus?: (status: string) => void;
}

export const DeviceKPICards: React.FC<DeviceKPICardsProps> = ({
  metrics,
  selectedStatus,
  onFilterStatus,
}) => {
  // Format ringkasan tipe perangkat untuk Card 1
  const typeSummaryParts: string[] = [];
  if (metrics.serversCount > 0) typeSummaryParts.push(`${metrics.serversCount} Server`);
  if (metrics.storageCount > 0) typeSummaryParts.push(`${metrics.storageCount} Storage`);
  if (metrics.networkCount > 0) typeSummaryParts.push(`${metrics.networkCount} Net`);
  if (metrics.otherCount > 0) typeSummaryParts.push(`${metrics.otherCount} Lain`);

  const typeSummaryCaption =
    typeSummaryParts.length > 0
      ? typeSummaryParts.join(" • ")
      : "Inventori Perangkat DC";

  // Format Total Konsumsi Daya (kW atau W)
  const powerDisplay = React.useMemo(() => {
    if (!metrics.totalPowerWatt || metrics.totalPowerWatt <= 0) return "0 W";
    if (metrics.totalPowerWatt >= 1000) {
      const kw = metrics.totalPowerWatt / 1000;
      return `${kw.toLocaleString("id-ID", { minimumFractionDigits: 1, maximumFractionDigits: 2 })} kW`;
    }
    return `${Math.round(metrics.totalPowerWatt).toLocaleString("id-ID")} W`;
  }, [metrics.totalPowerWatt]);

  const cards = [
    {
      id: "total_devices",
      statusValue: "",
      title: "TOTAL PERANGKAT",
      value: metrics.totalDevices,
      icon: <HardDrive size={20} />,
      iconBg: "bg-blue-50 text-blue-600",
      dotColor: "bg-blue-500",
      caption: typeSummaryCaption,
    },
    {
      id: "active_devices",
      statusValue: "active",
      title: "PERANGKAT AKTIF",
      value: metrics.activeDevices,
      icon: <Activity size={20} />,
      iconBg: "bg-emerald-50 text-emerald-600",
      dotColor: "bg-emerald-500",
      caption: "Beroperasi Normal di Rack",
    },
    {
      id: "spare_devices",
      statusValue: "spare",
      title: "CADANGAN / SPARE",
      value: metrics.spareDevices,
      icon: <Boxes size={20} />,
      iconBg: "bg-sky-50 text-sky-600",
      dotColor: "bg-sky-500",
      caption: "Siap Deployment / Gudang",
    },
    {
      id: "total_power",
      statusValue: "",
      title: "TOTAL KONSUMSI DAYA",
      value: powerDisplay,
      icon: <Zap size={20} />,
      iconBg: "bg-amber-50 text-amber-600",
      dotColor: "bg-amber-500",
      caption: "Akumulasi Beban Daya Aktif",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => {
        const isClickable = Boolean(card.statusValue && onFilterStatus);
        const isSelected = selectedStatus === card.statusValue && Boolean(card.statusValue);

        return (
          <div
            key={card.id}
            onClick={() => {
              if (isClickable && onFilterStatus) {
                onFilterStatus(isSelected ? "" : card.statusValue);
              }
            }}
            className={`group bg-white rounded-xl border p-5 shadow-sm transition-all duration-300 ease-out flex flex-col justify-between will-change-transform ${
              isClickable ? "cursor-pointer hover:-translate-y-1.5 hover:shadow-lg" : "hover:-translate-y-1 hover:shadow-md"
            } ${
              isSelected
                ? "border-amber-500 ring-2 ring-amber-500/20 shadow-md bg-amber-50/10"
                : "border-slate-200/80"
            }`}
          >
            {/* ── Baris Atas: Icon Bulat & Label ── */}
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300 ease-out ${card.iconBg}`}
              >
                {card.icon}
              </div>
              <span className="text-[0.75rem] font-bold text-slate-800 tracking-wider uppercase">
                {card.title}
              </span>
            </div>

            {/* ── Baris Tengah: Nilai Utama (Angka Besar) ── */}
            <div className="my-3 text-center">
              <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
                {card.value}
              </span>
            </div>

            {/* ── Baris Bawah: Indikator Titik & Keterangan ── */}
            <div className="flex items-center justify-center gap-2">
              <span
                className={`w-2 h-2 rounded-full flex-shrink-0 ${card.dotColor}`}
              />
              <span className="text-xs text-slate-500 font-medium truncate max-w-[200px]" title={card.caption}>
                {card.caption}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default DeviceKPICards;
