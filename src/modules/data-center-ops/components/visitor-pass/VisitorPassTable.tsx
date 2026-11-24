import React from "react";
import {
  QrCode,
  Eye,
  LogOut,
  XCircle,
  Building2,
  Server,
  Calendar,
  ExternalLink,
  CheckCircle2,
} from "lucide-react";
import type { VisitorPass, VisitorPassStatus } from "../../types/visitorPass";
import { VisitorPassTablePagination } from "./VisitorPassTablePagination";

export interface VisitorPassTableProps {
  passes: VisitorPass[];
  isLoading?: boolean;
  onViewDetail: (pass: VisitorPass) => void;
  onViewQR: (pass: VisitorPass) => void;
  onApprove?: (pass: VisitorPass) => void;
  onCheckOut: (pass: VisitorPass) => void;
  onCancel: (pass: VisitorPass) => void;
  currentPage?: number;
  totalPages?: number;
  perPage?: number;
  total?: number;
  onPageChange?: (page: number) => void;
  onPerPageChange?: (perPage: number) => void;
  perPageOptions?: number[];
}

const STATUS_CONFIG: Record<
  VisitorPassStatus,
  { label: string; bg: string; text: string; border: string; dot: string; pulse?: boolean }
> = {
  pending_registration: {
    label: "Menunggu Registrasi",
    bg: "bg-purple-50",
    text: "text-purple-700",
    border: "border-purple-200",
    dot: "bg-purple-500",
  },
  scheduled: {
    label: "Terjadwal",
    bg: "bg-blue-50",
    text: "text-blue-700",
    border: "border-blue-200",
    dot: "bg-blue-500",
  },
  registered: {
    label: "Menunggu Persetujuan",
    bg: "bg-amber-50",
    text: "text-amber-800 font-bold",
    border: "border-amber-300",
    dot: "bg-amber-500",
    pulse: true,
  },
  approved: {
    label: "Disetujui",
    bg: "bg-teal-50",
    text: "text-teal-700",
    border: "border-teal-200",
    dot: "bg-teal-500",
  },
  active_in_facility: {
    label: "Di Fasilitas",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
    dot: "bg-emerald-500",
    pulse: true,
  },
  overstayed: {
    label: "OVERSTAY ALERT",
    bg: "bg-rose-100",
    text: "text-rose-800 font-extrabold",
    border: "border-rose-400",
    dot: "bg-rose-600",
    pulse: true,
  },
  completed: {
    label: "Selesai",
    bg: "bg-slate-100",
    text: "text-slate-700",
    border: "border-slate-200",
    dot: "bg-slate-400",
  },
  expired: {
    label: "Kedaluwarsa",
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
    dot: "bg-amber-500",
  },
  cancelled: {
    label: "Dibatalkan",
    bg: "bg-rose-50",
    text: "text-rose-700",
    border: "border-rose-200",
    dot: "bg-rose-500",
  },
  denied: {
    label: "Ditolak",
    bg: "bg-red-50",
    text: "text-red-700",
    border: "border-red-200",
    dot: "bg-red-500",
  },
};

export const VisitorPassTable: React.FC<VisitorPassTableProps> = ({
  passes,
  isLoading = false,
  onViewDetail,
  onViewQR,
  onApprove,
  onCheckOut,
  onCancel,
  currentPage,
  totalPages,
  perPage,
  total,
  onPageChange,
  onPerPageChange,
  perPageOptions,
}) => {
  if (isLoading) {
    return (
      <div className="border border-slate-200/80 rounded-xl overflow-hidden bg-white shadow-sm">
        <div className="p-6 flex flex-col gap-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-12 bg-slate-100 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (passes.length === 0) {
    return (
      <div className="border border-slate-200/80 rounded-xl bg-white shadow-sm p-12 text-center flex flex-col items-center justify-center">
        <div className="w-14 h-14 rounded-full bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-500 mb-3">
          <Calendar size={26} />
        </div>
        <h4 className="text-sm font-bold text-slate-800 mb-1">
          Tidak Ada Data Visitor Pass
        </h4>
        <p className="text-xs text-slate-500 max-w-sm mb-4">
          Belum ada izin kunjungan yang cocok dengan filter atau kata kunci pencarian yang dipilih.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="border border-slate-200/80 rounded-xl overflow-hidden bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
          {/* Header Strip Kuning Emas Pastel Sesuai Desain Room/Site */}
          <thead className="bg-[#FEF9EE] text-slate-800 font-bold border-b border-[#F3EDE0]">
            <tr>
              <th className="py-3.5 px-4 font-bold tracking-wider text-slate-700 min-w-[130px]">
                NO. TIKET
              </th>
              <th className="py-3.5 px-4 font-bold tracking-wider text-slate-700 min-w-[180px]">
                PENGUNJUNG
              </th>
              <th className="py-3.5 px-4 font-bold tracking-wider text-slate-700 min-w-[160px]">
                CUSTOMER CRM
              </th>
              <th className="py-3.5 px-4 font-bold tracking-wider text-slate-700 min-w-[160px]">
                LOKASI & RAK
              </th>
              <th className="py-3.5 px-4 font-bold tracking-wider text-slate-700 min-w-[175px]">
                WAKTU KUNJUNGAN
              </th>
              <th className="py-3.5 px-4 font-bold tracking-wider text-slate-700 text-center min-w-[120px]">
                STATUS
              </th>
              <th className="py-3.5 px-4 font-bold tracking-wider text-slate-700 text-center min-w-[130px]">
                AKSI
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {passes.map((pass) => {
              const isOverstayed =
                pass.status === "overstayed" ||
                (pass.status === "active_in_facility" &&
                  (pass.planned_check_out_at || pass.valid_until || pass.valid_to) &&
                  new Date((pass.planned_check_out_at || pass.valid_until || pass.valid_to)!).getTime() < Date.now());

              const statusCfg = isOverstayed
                ? STATUS_CONFIG.overstayed
                : (STATUS_CONFIG[pass.status] ?? STATUS_CONFIG.scheduled);

              const formatDateTime = (dateStr?: string | null) => {
                if (!dateStr) return "-";
                const d = new Date(dateStr);
                if (isNaN(d.getTime())) return "-";
                const dateFormatted = d.toLocaleDateString("id-ID", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                });
                const timeFormatted = d.toLocaleTimeString("id-ID", {
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: false,
                }).replace(".", ":");
                return `${dateFormatted}, ${timeFormatted} WIB`;
              };

              const customerDisplayName =
                pass.customer?.company_name || pass.customer?.name || "Customer CRM";
              const identityNumber =
                pass.visitor_identity_number || pass.visitor_id_card || "-";
              const identityType = (pass.visitor_identity_type || "KTP").toUpperCase();
              const siteDisplayName =
                pass.site?.site_name || pass.site?.name || "Site MSDC";
              const roomDisplayName =
                pass.room?.room_name || pass.room?.name || "Seluruh Fasilitas";

              return (
                <tr
                  key={pass.id}
                  className={`hover:bg-slate-50/70 transition-colors group ${
                    isOverstayed ? "bg-rose-50/40 border-l-4 border-l-rose-500" : ""
                  }`}
                >
                  {/* 1. No Tiket */}
                  <td className="py-3.5 px-4 align-top">
                    <div className="font-mono font-bold text-slate-900 flex items-center gap-1.5">
                      <span>{pass.pass_number}</span>
                    </div>
                    <span className="text-[0.7rem] text-slate-400">
                      ID: #{pass.id}
                    </span>
                  </td>

                  {/* 2. Pengunjung */}
                  <td className="py-3.5 px-4 align-top">
                    {pass.status === "pending_registration" ? (
                      <div>
                        <div className="font-semibold text-purple-700 text-[0.8rem] flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse" />
                          Menunggu Registrasi Tamu
                        </div>
                        <div className="text-[0.7rem] text-slate-500 mt-0.5">
                          Tujuan: {pass.recipient_email || pass.visitor_email || "Email Terundang"}
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="font-bold text-slate-800 text-[0.8rem]">
                          {pass.visitor_name}
                        </div>
                        {pass.visitor_company && (
                          <div className="text-[0.72rem] text-slate-600 font-medium">
                            {pass.visitor_company}
                          </div>
                        )}
                        <div className="text-[0.7rem] text-slate-500 mt-0.5 flex items-center gap-1 font-mono">
                          <span className="uppercase text-[0.62rem] font-bold px-1 py-0.2 bg-slate-100 text-slate-600 rounded">
                            {identityType}
                          </span>
                          <span>{identityNumber}</span>
                        </div>
                      </>
                    )}
                  </td>

                  {/* 3. Customer CRM */}
                  <td className="py-3.5 px-4 align-top">
                    <div className="font-semibold text-slate-800">
                      {customerDisplayName}
                    </div>
                    {pass.contract?.contract_number && (
                      <div className="text-[0.68rem] font-mono text-amber-700 font-medium">
                        {pass.contract.contract_number}
                      </div>
                    )}
                    <div
                      className="text-[0.7rem] text-slate-500 line-clamp-1 italic mt-0.5"
                      title={pass.purpose || undefined}
                    >
                      "{pass.purpose}"
                    </div>
                  </td>

                  {/* 4. Lokasi & Rak */}
                  <td className="py-3.5 px-4 align-top">
                    <div className="flex items-center gap-1 text-slate-700 font-semibold">
                      <Building2 size={13} className="text-slate-400 shrink-0" />
                      <span className="truncate">{siteDisplayName}</span>
                    </div>
                    <div className="flex items-center gap-1 text-[0.72rem] text-slate-500 mt-0.5">
                      <Server size={12} className="text-slate-400 shrink-0" />
                      <span>
                        {pass.rack?.code ? `Rak ${pass.rack.code}` : roomDisplayName}
                      </span>
                    </div>
                  </td>

                  {/* 5. Waktu Kunjungan */}
                  <td className="py-3.5 px-4 align-top">
                    <div className="text-[0.73rem] text-slate-700">
                      <span className="font-medium text-slate-500">Mulai:</span>{" "}
                      {formatDateTime(pass.planned_check_in_at || pass.valid_from)}
                    </div>
                    <div className="text-[0.73rem] text-slate-700 mt-0.5">
                      <span className="font-medium text-slate-500">Selesai:</span>{" "}
                      {formatDateTime(
                        pass.planned_check_out_at || pass.valid_until || pass.valid_to
                      )}
                    </div>
                    {pass.actual_check_in_at && (
                      <div className="text-[0.68rem] text-emerald-600 font-semibold mt-1">
                        In: {formatDateTime(pass.actual_check_in_at)}
                      </div>
                    )}
                  </td>

                  {/* 6. Status Badge */}
                  <td className="py-3.5 px-4 align-top text-center">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[0.7rem] font-bold border ${statusCfg.bg} ${statusCfg.text} ${statusCfg.border}`}
                    >
                      <span className="relative flex h-2 w-2">
                        {statusCfg.pulse && (
                          <span
                            className={`animate-ping absolute inline-flex h-full w-full rounded-full ${statusCfg.dot} opacity-75`}
                          />
                        )}
                        <span
                          className={`relative inline-flex rounded-full h-2 w-2 ${statusCfg.dot}`}
                        />
                      </span>
                      {statusCfg.label}
                    </span>
                  </td>

                  {/* 7. Aksi */}
                  <td className="py-3.5 px-4 align-top text-center">
                    <div className="inline-flex items-center justify-center gap-1.5">
                      {/* Tombol Setujui / Approve khusus status registered (Menunggu Persetujuan) */}
                      {pass.status === "registered" && onApprove && (
                        <button
                          type="button"
                          onClick={() => onApprove(pass)}
                          title="Setujui Izin Kunjungan Tamu"
                          aria-label={`Setujui Izin Kunjungan untuk ${pass.visitor_name}`}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[0.7rem] shadow-xs transition-colors cursor-pointer mr-0.5"
                        >
                          <CheckCircle2 size={13} className="stroke-[2.5]" />
                          <span>Setujui</span>
                        </button>
                      )}

                      {/* Tombol QR Code */}
                      <button
                        type="button"
                        onClick={() => onViewQR(pass)}
                        title={
                          pass.status === "pending_registration"
                            ? "Lihat Status Registrasi & Salin Tautan Tamu"
                            : "Lihat & Cetak QR Code Pass"
                        }
                        aria-label={`Lihat QR Code Pass untuk ${pass.visitor_name}`}
                        className={`p-1.5 rounded-md transition-colors cursor-pointer border ${
                          pass.status === "pending_registration"
                            ? "hover:bg-purple-50 text-purple-600 hover:text-purple-700 border-purple-200/60"
                            : "hover:bg-amber-50 text-slate-600 hover:text-amber-600 border-transparent hover:border-amber-200"
                        }`}
                      >
                        <QrCode size={15} />
                      </button>

                      {/* Tombol Detail */}
                      <button
                        type="button"
                        onClick={() => onViewDetail(pass)}
                        title="Buka Halaman Detail Tamu & CRM"
                        aria-label={`Buka Halaman Detail Tamu & CRM untuk ${pass.visitor_name}`}
                        className="p-1.5 rounded-md hover:bg-blue-50 text-slate-600 hover:text-blue-600 transition-colors cursor-pointer border border-transparent hover:border-blue-200"
                      >
                        <Eye size={15} />
                      </button>

                      {/* Tombol Check-Out jika sedang aktif di fasilitas */}
                      {pass.status === "active_in_facility" && (
                        <button
                          type="button"
                          onClick={() => onCheckOut(pass)}
                          title="Check-Out Pengunjung"
                          aria-label={`Check-Out Pengunjung ${pass.visitor_name}`}
                          className="p-1.5 rounded-md bg-emerald-50 hover:bg-emerald-100 text-emerald-700 transition-colors cursor-pointer border border-emerald-200"
                        >
                          <LogOut size={15} />
                        </button>
                      )}

                      {/* Tombol Batalkan jika belum digunakan */}
                      {(pass.status === "scheduled" ||
                        pass.status === "registered" ||
                        pass.status === "approved" ||
                        pass.status === "pending_registration") && (
                        <button
                          type="button"
                          onClick={() => onCancel(pass)}
                          title="Batalkan Tiket Izin Kunjungan"
                          aria-label={`Batalkan Tiket Izin ${pass.pass_number}`}
                          className="p-1.5 rounded-md hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer border border-transparent hover:border-rose-200"
                        >
                          <XCircle size={15} />
                        </button>
                      )}

                      {/* Link Registrasi Mandiri Tamu jika status pending_registration */}
                      {pass.status === "pending_registration" && pass.invitation_token && (
                        <a
                          href={`/visitor-registration/${pass.invitation_token}`}
                          target="_blank"
                          rel="noreferrer"
                          title="Buka Form Registrasi Mandiri Tamu"
                          aria-label={`Buka Form Registrasi Mandiri ${pass.pass_number}`}
                          className="p-1.5 rounded-md hover:bg-amber-50 text-amber-600 transition-colors cursor-pointer"
                        >
                          <ExternalLink size={14} />
                        </a>
                      )}

                      {/* Link Tiket Publik */}
                      {pass.public_url_token && (
                        <a
                          href={`/visitor-pass/${pass.public_url_token}`}
                          target="_blank"
                          rel="noreferrer"
                          title="Buka Badge Digital Publik Tamu"
                          aria-label={`Buka Badge Digital Publik untuk ${pass.visitor_name}`}
                          className="p-1.5 rounded-md hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                        >
                          <ExternalLink size={14} />
                        </a>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>

    {/* ── Kontrol Paginasi Terpusat Sesuai Standar MSDC ── */}
    {typeof total === "number" && total > 0 && currentPage && totalPages && onPageChange ? (
      <VisitorPassTablePagination
        currentPage={currentPage}
        totalPages={totalPages}
        perPage={perPage}
        onPageChange={onPageChange}
        onPerPageChange={onPerPageChange}
        perPageOptions={perPageOptions ?? [5, 10, 20, 50]}
      />
    ) : null}
  </div>
  );
};
