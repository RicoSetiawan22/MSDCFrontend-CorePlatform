import React from "react";
import { FileText, Clock, CheckCircle2, FileEdit } from "lucide-react";

export interface SuratDcOpsKPIMetrics {
  totalDocuments: number;
  pendingApproval: number;
  approvedDocuments: number;
  draftDocuments: number;
}

export interface SuratDcOpsKPICardsProps {
  metrics: SuratDcOpsKPIMetrics;
  selectedStatus?: string;
  onFilterStatus?: (status: string) => void;
  isLoading?: boolean;
}

export const SuratDcOpsKPICards: React.FC<SuratDcOpsKPICardsProps> = ({
  metrics,
  selectedStatus,
  onFilterStatus,
  isLoading = false,
}) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-sm animate-pulse flex flex-col justify-between h-[150px]"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-slate-100" />
              <div className="h-4 bg-slate-100 rounded w-24" />
            </div>
            <div className="my-auto">
              <div className="h-8 bg-slate-100 rounded w-16" />
            </div>
            <div className="h-3 bg-slate-100 rounded w-28" />
          </div>
        ))}
      </div>
    );
  }

  const cards = [
    {
      id: "total_documents",
      statusValue: "",
      title: "TOTAL DOKUMEN",
      value: metrics.totalDocuments.toLocaleString("id-ID"),
      icon: <FileText size={20} />,
      iconBg: "bg-blue-50 text-blue-600",
      dotColor: "bg-blue-500",
      caption: "Dokumen Resmi DC Ops",
    },
    {
      id: "pending_approval",
      statusValue: "pending_approval",
      title: "MENUNGGU APPROVAL",
      value: metrics.pendingApproval.toLocaleString("id-ID"),
      icon: <Clock size={20} />,
      iconBg: "bg-amber-50 text-amber-600",
      dotColor: "bg-amber-500",
      caption: "Butuh Tanda Tangan Atasan",
    },
    {
      id: "approved_documents",
      statusValue: "approved",
      title: "DISETUJUI / RESMI",
      value: metrics.approvedDocuments.toLocaleString("id-ID"),
      icon: <CheckCircle2 size={20} />,
      iconBg: "bg-emerald-50 text-emerald-600",
      dotColor: "bg-emerald-500",
      caption: "Sah & Terverifikasi Digital",
    },
    {
      id: "draft_documents",
      statusValue: "draft",
      title: "DRAFT / PERSIAPAN",
      value: metrics.draftDocuments.toLocaleString("id-ID"),
      icon: <FileEdit size={20} />,
      iconBg: "bg-slate-100 text-slate-700",
      dotColor: "bg-slate-500",
      caption: "Sedang Disusun Staf",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => {
        const isClickable = Boolean(onFilterStatus);
        const isSelected =
          selectedStatus !== undefined &&
          (card.statusValue === ""
            ? selectedStatus === ""
            : selectedStatus === card.statusValue);

        return (
          <div
            key={card.id}
            onClick={() => {
              if (onFilterStatus) {
                if (selectedStatus === card.statusValue && card.statusValue !== "") {
                  onFilterStatus("");
                } else {
                  onFilterStatus(card.statusValue);
                }
              }
            }}
            role={isClickable ? "button" : undefined}
            tabIndex={isClickable ? 0 : undefined}
            onKeyDown={(e) => {
              if (isClickable && (e.key === "Enter" || e.key === " ")) {
                e.preventDefault();
                onFilterStatus?.(
                  selectedStatus === card.statusValue && card.statusValue !== ""
                    ? ""
                    : card.statusValue
                );
              }
            }}
            className={`group rounded-xl border p-5 shadow-sm transition-all duration-200 ease-out flex flex-col justify-between will-change-transform select-none ${
              isClickable ? "cursor-pointer" : ""
            } ${
              isSelected
                ? "bg-amber-50/40 border-amber-400 ring-2 ring-amber-400/50 shadow-md"
                : "bg-white border-slate-200/80 hover:-translate-y-1 hover:shadow-md hover:border-slate-300"
            }`}
          >
            {/* ── Baris Atas: Icon Bulat & Label ── */}
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300 ease-out ${card.iconBg}`}
              >
                {card.icon}
              </div>
              <span className="text-[0.75rem] font-bold text-slate-800 tracking-wider uppercase">
                {card.title}
              </span>
            </div>

            {/* ── Baris Tengah: Nilai Utama (Angka Besar Centered) ── */}
            <div className="my-3 text-center flex items-center justify-center gap-1.5">
              <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
                {card.value}
              </span>
            </div>

            {/* ── Baris Bawah: Indikator Titik & Keterangan (Centered) ── */}
            <div className="flex items-center justify-center gap-2">
              <span className={`w-2 h-2 rounded-full shrink-0 ${card.dotColor}`} />
              <span
                className="text-xs text-slate-500 font-medium truncate max-w-[200px]"
                title={card.caption}
              >
                {card.caption}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default SuratDcOpsKPICards;
