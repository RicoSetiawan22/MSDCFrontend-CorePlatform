import React from "react";
import {
  X,
  User,
  Building2,
  Server,
  Calendar,
  QrCode,
  LogOut,
  XCircle,
  FileText,
  Activity,
  ShieldCheck,
} from "lucide-react";
import type { VisitorPass } from "../../types/visitorPass";

interface VisitorPassDetailModalProps {
  pass: VisitorPass | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenQR: (pass: VisitorPass) => void;
  onCheckOut: (pass: VisitorPass) => void;
  onCancel: (pass: VisitorPass) => void;
}

export const VisitorPassDetailModal: React.FC<VisitorPassDetailModalProps> = ({
  pass,
  isOpen,
  onClose,
  onOpenQR,
  onCheckOut,
  onCancel,
}) => {
  if (!isOpen || !pass) return null;

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

  const formatVerificationMethod = (method?: string | null) => {
    if (!method) return "-";
    const m = String(method).toLowerCase().trim();
    if (m === "webcam_guard" || m === "webcam") {
      return "Kamera Pemindai (Webcam / Browser)";
    }
    if (m === "usb_scanner") {
      return "Scanner Barcode USB";
    }
    if (m === "manual_override" || m === "manual") {
      return "Input Manual";
    }
    if (m === "turnstile_gate") {
      return "Turnstile Gate Otomatis";
    }
    return method.replace(/_/g, " ");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200/80 w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-8">
        {/* Header Modal */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
              <ShieldCheck size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-slate-800 font-mono">
                  {pass.pass_number}
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[0.68rem] font-bold uppercase bg-amber-100 text-amber-800">
                  {pass.status.replace(/_/g, " ")}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Detail tiket izin kunjungan & log audit pergerakan fisik
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup detail modal"
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 flex flex-col gap-5 max-h-[75vh] overflow-y-auto">
          {/* Identitas Tamu & Penjamin */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Box Tamu */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/60 flex flex-col gap-2">
              <span className="text-[0.68rem] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <User size={13} className="text-amber-500" />
                Informasi Pengunjung
              </span>
              <div>
                <h4 className="text-sm font-extrabold text-slate-800">
                  {pass.visitor_name}
                </h4>
                <p className="text-xs text-slate-500">
                  {pass.visitor_company || "Tamu Mandiri / Perorangan"}
                </p>
              </div>
              <div className="pt-2 border-t border-slate-200/50 text-xs flex flex-col gap-1 text-slate-600">
                <div>
                  <span className="text-slate-400">No. Identitas:</span>{" "}
                  <strong className="font-mono text-slate-700">{pass.visitor_id_card}</strong>
                </div>
                <div>
                  <span className="text-slate-400">Email:</span> {pass.visitor_email}
                </div>
                {pass.visitor_phone && (
                  <div>
                    <span className="text-slate-400">No. Telepon:</span> {pass.visitor_phone}
                  </div>
                )}
              </div>
            </div>

            {/* Box Penjamin & Lokasi */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/60 flex flex-col gap-2">
              <span className="text-[0.68rem] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Building2 size={13} className="text-amber-500" />
                Pelanggan & Lokasi Tujuan
              </span>
              <div>
                <h4 className="text-sm font-bold text-slate-800">
                  {pass.customer?.company_name || pass.customer?.name || "Customer CRM"}
                </h4>
                <p className="text-xs text-slate-500">
                  Site: <strong>{pass.site?.site_name || pass.site?.name || "Site MSDC Surabaya"}</strong>
                </p>
              </div>
              <div className="pt-2 border-t border-slate-200/50 text-xs flex flex-col gap-1 text-slate-600">
                <div className="flex items-center gap-1.5">
                  <Server size={13} className="text-slate-400" />
                  <span>
                    Ruang: <strong>{pass.room?.room_name || pass.room?.name || "Seluruh Ruangan"}</strong>
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Server size={13} className="text-slate-400" />
                  <span>
                    Rak Terdaftar:{" "}
                    <strong>{pass.rack?.code ? `Rak ${pass.rack.code}` : "Tidak Terbatas Rak"}</strong>
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Keperluan & Jadwal */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-amber-50/40 p-4 rounded-xl border border-amber-200/50 flex flex-col gap-1.5">
              <span className="text-[0.68rem] font-bold text-amber-700 uppercase tracking-wider flex items-center gap-1.5">
                <FileText size={13} />
                Keperluan Kunjungan
              </span>
              <p className="text-xs font-semibold text-slate-800">
                "{pass.purpose}"
              </p>
              {pass.notes && (
                <p className="text-[0.72rem] text-slate-600 mt-1 italic">
                  Catatan: {pass.notes}
                </p>
              )}
            </div>

            <div className="bg-blue-50/40 p-4 rounded-xl border border-blue-200/50 flex flex-col gap-1.5 text-xs">
              <span className="text-[0.68rem] font-bold text-blue-700 uppercase tracking-wider flex items-center gap-1.5">
                <Calendar size={13} />
                Masa Berlaku Izin
              </span>
              <div className="flex justify-between">
                <span className="text-slate-500">Mulai:</span>
                <span className="font-semibold text-slate-800">
                  {formatDateTime(pass.planned_check_in_at || pass.valid_from)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Berakhir:</span>
                <span className="font-semibold text-slate-800">
                  {formatDateTime(pass.planned_check_out_at || pass.valid_until || pass.valid_to)}
                </span>
              </div>
              <div className="flex justify-between pt-1 border-t border-blue-200/40">
                <span className="text-slate-500">Jam Check-In:</span>
                <span className="font-bold text-emerald-700">{formatDateTime(pass.check_in_at)}</span>
              </div>
              {pass.check_in_method && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Metode Verifikasi:</span>
                  <span className="font-semibold text-slate-800">
                    {formatVerificationMethod(pass.check_in_method)}
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-slate-500">Jam Check-Out:</span>
                <span className="font-bold text-slate-700">{formatDateTime(pass.check_out_at)}</span>
              </div>
            </div>
          </div>

          {/* Audit Trail Log Aktivitas Kunjungan */}
          <div className="flex flex-col gap-2.5">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Activity size={14} className="text-amber-500" />
              Log Audit Pergerakan Tamu
            </span>

            {(!pass.access_logs || pass.access_logs.length === 0) ? (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60 text-center text-xs text-slate-400">
                Belum ada aktivitas scan atau perubahan status tercatat.
              </div>
            ) : (
              <div className="border border-slate-200/80 rounded-xl overflow-hidden divide-y divide-slate-100 bg-white">
                {pass.access_logs.map((log, idx) => {
                  const rawAction =
                    log?.action ||
                    (log as any)?.event ||
                    (log as any)?.type ||
                    "Aktivitas Akses";
                  const displayAction =
                    typeof rawAction === "string"
                      ? rawAction.replace(/_/g, " ")
                      : String(rawAction);
                  return (
                    <div key={log?.id ?? idx} className="p-3 flex items-start justify-between text-xs hover:bg-slate-50/50">
                      <div className="flex items-start gap-2.5">
                        <div className="w-2 h-2 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                        <div>
                          <div className="font-bold text-slate-800 capitalize">
                            {displayAction}
                          </div>
                          <div className="text-[0.72rem] text-slate-500">
                            Lokasi: {log?.scanner_location || "Pos Jaga / Resepsionis"}
                            {log?.actor_name && ` • Petugas: ${log.actor_name}`}
                          </div>
                          {log?.notes && (
                            <div className="text-[0.7rem] text-slate-600 mt-0.5 italic">
                              {log.notes}
                            </div>
                          )}
                        </div>
                      </div>
                      <span className="text-[0.7rem] font-mono text-slate-400 shrink-0">
                        {formatDateTime(log?.created_at)}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <button
            type="button"
            onClick={() => onOpenQR(pass)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200/80 rounded-lg transition-colors cursor-pointer"
          >
            <QrCode size={15} />
            <span>Lihat QR Code</span>
          </button>

          <div className="flex items-center gap-2">
            {pass.status === "active_in_facility" && (
              <button
                type="button"
                onClick={() => onCheckOut(pass)}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-sm transition-colors cursor-pointer"
              >
                <LogOut size={15} />
                <span>Check-Out Sekarang</span>
              </button>
            )}

            {(pass.status === "registered" || pass.status === "approved") && (
              <button
                type="button"
                onClick={() => onCancel(pass)}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg transition-colors cursor-pointer"
              >
                <XCircle size={15} />
                <span>Batalkan Izin</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200/50 rounded-lg transition-colors cursor-pointer"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
