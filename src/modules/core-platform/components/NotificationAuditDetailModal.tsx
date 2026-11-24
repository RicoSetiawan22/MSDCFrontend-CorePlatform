import { useState, useEffect } from "react";
import { 
  X, BellRing, Mail, MessageCircle, Bell, 
  AlertCircle, Paperclip, RefreshCw
} from "lucide-react";
import { apiClient } from "@shared/lib/api-client";
import { formatDate } from "@shared/lib/format";
import { extractErrorMessage } from "@shared/types/api";
import type { AuditNotificationEntry } from "../types/audit";

interface NotificationAuditDetailModalProps {
  notificationId: number;
  initialData?: AuditNotificationEntry | null;
  onClose: () => void;
}

const CHANNEL_ICON: Record<string, React.ReactNode> = {
  email: <Mail size={14} />,
  whatsapp: <MessageCircle size={14} />,
  in_app: <Bell size={14} />,
};

const CHANNEL_STYLE: Record<string, string> = {
  email: "bg-blue-50 text-blue-700 border-blue-200",
  whatsapp: "bg-emerald-50 text-emerald-700 border-emerald-200",
  in_app: "bg-amber-50 text-amber-700 border-amber-200",
};

const STATUS_STYLE: Record<string, { bg: string; text: string; dot: string; label: string }> = {
  sent: { bg: "bg-emerald-50 border-emerald-200", text: "text-emerald-700", dot: "bg-emerald-500", label: "Terkirim (Sent)" },
  failed: { bg: "bg-rose-50 border-rose-200", text: "text-rose-700", dot: "bg-rose-500", label: "Gagal (Failed)" },
  pending: { bg: "bg-amber-50 border-amber-200", text: "text-amber-700", dot: "bg-amber-500", label: "Menunggu (Pending)" },
  scheduled: { bg: "bg-blue-50 border-blue-200", text: "text-blue-700", dot: "bg-blue-500", label: "Dijadwalkan (Scheduled)" },
  cancelled: { bg: "bg-slate-100 border-slate-200", text: "text-slate-600", dot: "bg-slate-400", label: "Dibatalkan" },
  skipped: { bg: "bg-slate-100 border-slate-200", text: "text-slate-600", dot: "bg-slate-400", label: "Dilewati" },
};

export function NotificationAuditDetailModal({
  notificationId,
  initialData,
  onClose,
}: NotificationAuditDetailModalProps) {
  const [detail, setDetail] = useState<AuditNotificationEntry | null>(initialData ?? null);
  const [isLoading, setIsLoading] = useState(!initialData);
  const [error, setError] = useState<string | null>(null);

  // Ambil detail lengkap dari backend: GET /api/v1/core-platform/audit/notifications/{id}
  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    setError(null);

    apiClient
      .get<{ success?: boolean; data: AuditNotificationEntry }>(
        `/v1/core-platform/audit/notifications/${notificationId}`
      )
      .then((res) => {
        if (isMounted) {
          setDetail(res.data.data);
        }
      })
      .catch((err) => {
        if (isMounted) {
          if (!initialData) {
            setError(extractErrorMessage(err));
          }
        }
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [notificationId, initialData]);

  const statusInfo = detail ? (STATUS_STYLE[detail.status] ?? STATUS_STYLE.pending) : STATUS_STYLE.pending;
  const channelStyle = detail ? (CHANNEL_STYLE[detail.channel] ?? "bg-slate-100 text-slate-700 border-slate-200") : "";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden text-slate-800"
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER MODAL */}
        <div className="px-6 py-5 border-b border-slate-200 bg-gradient-to-r from-slate-900 via-slate-800 to-[#1e293b] text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
              <BellRing size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold tracking-tight text-white">Detail Audit Notifikasi</h2>
                <span className="font-mono text-[11px] px-2 py-0.5 rounded-md bg-white/10 text-slate-300 border border-white/10">
                  ID: #{notificationId}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Rekam jejak dispatch pesan sistem dan status pengiriman ke penerima.
              </p>
            </div>
          </div>

          <button 
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition-all cursor-pointer"
            title="Tutup"
          >
            <X size={18} />
          </button>
        </div>

        {/* MODAL CONTENT */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 text-xs text-slate-600 bg-slate-50/50">
          {isLoading && !detail && (
            <div className="py-12 text-center">
              <RefreshCw size={24} className="animate-spin text-amber-600 mx-auto mb-3" />
              <p className="font-medium text-slate-600">Memuat rincian notifikasi dari backend...</p>
            </div>
          )}

          {error && !detail && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 flex items-start gap-3">
              <AlertCircle size={18} className="shrink-0 mt-0.5" />
              <div>
                <strong className="block font-bold">Gagal memuat detail notifikasi</strong>
                <p className="mt-0.5">{error}</p>
              </div>
            </div>
          )}

          {detail && (
            <>
              {/* STATUS & CHANNEL BADGE HEADER */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Channel:</span>
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${channelStyle}`}>
                    {CHANNEL_ICON[detail.channel]}
                    <span className="capitalize">{detail.channel.replace("_", " ")}</span>
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Status:</span>
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${statusInfo.bg} ${statusInfo.text}`}>
                    <span className={`w-2 h-2 rounded-full ${statusInfo.dot}`}></span>
                    {statusInfo.label}
                  </span>
                </div>
              </div>

              {/* ALERT ERROR JIKA STATUS GAGAL */}
              {(detail.status === "failed" || detail.last_error) && (
                <div className="p-4 rounded-2xl bg-rose-50/80 border border-rose-200 text-rose-800 space-y-1.5">
                  <div className="flex items-center gap-2 font-bold text-xs text-rose-900">
                    <AlertCircle size={15} className="text-rose-600 shrink-0" />
                    <span>Penyebab Kegagalan (Last Error Message):</span>
                  </div>
                  <pre className="p-3 bg-white/80 border border-rose-200 rounded-xl font-mono text-[11px] text-rose-700 whitespace-pre-wrap break-all">
                    {detail.last_error || "Tidak ada rincian pesan error dari gateway."}
                  </pre>
                </div>
              )}

              {/* GRID INFO METADATA */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Penerima */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Tujuan Penerima</span>
                  <div className="font-bold text-slate-900 text-xs break-all">{detail.recipient_ref}</div>
                  <div className="text-[11px] text-slate-500 capitalize">
                    Tipe: <span className="font-semibold text-slate-700">{detail.recipient_type || "User"}</span>
                  </div>
                </div>

                {/* Pengirim */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Pengirim (Creator)</span>
                  <div className="font-bold text-slate-900 text-xs">
                    {detail.notification?.creator?.name ?? "— (Sistem Otomatis)"}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {detail.notification?.creator?.email ?? "system@internal.msdc"}
                  </div>
                </div>

                {/* Modul & Event */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Modul & Event Pemicu</span>
                  <div className="font-bold text-slate-900 text-xs capitalize">
                    {detail.notification?.module_code ?? "Core Platform"}
                  </div>
                  <div className="font-mono text-[11px] text-slate-500">
                    {detail.notification?.event_code ?? "general.notification"}
                  </div>
                </div>

                {/* Waktu Eksekusi */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Waktu Eksekusi</span>
                  <div className="font-semibold text-slate-800 text-xs">
                    {detail.sent_at ? formatDate(detail.sent_at) : (detail.scheduled_at ? `${formatDate(detail.scheduled_at)} (Jadwal)` : "Belum dieksekusi")}
                  </div>
                  <div className="text-[10px] text-slate-500">
                    Dibuat: {formatDate(detail.created_at)} • Percobaan: <strong>{detail.attempts}</strong>/{detail.max_attempts}x
                  </div>
                </div>
              </div>

              {/* ISI KONTEN NOTIFIKASI */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Judul Notifikasi</span>
                  <h3 className="font-bold text-slate-900 text-sm mt-0.5">
                    {detail.notification?.title || "—"}
                  </h3>
                </div>

                <div className="pt-3 border-t border-slate-100">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 block">Isi Pesan (Body)</span>
                  <div className="p-3.5 bg-slate-50 border border-slate-200/70 rounded-xl text-xs text-slate-700 font-sans leading-relaxed whitespace-pre-wrap">
                    {detail.notification?.body || "Tidak ada rincian isi teks notifikasi."}
                  </div>
                </div>

                {detail.attachment_name && (
                  <div className="pt-2 flex items-center gap-2 text-xs text-slate-600">
                    <Paperclip size={14} className="text-slate-400" />
                    <span>Lampiran:</span>
                    <span className="font-mono font-medium text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                      {detail.attachment_name}
                    </span>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* MODAL FOOTER */}
        <div className="px-6 py-4 border-t border-slate-200 bg-white flex items-center justify-between shrink-0">
          <span className="text-xs text-slate-400">
            Log Notifikasi • Core Platform MSDC ERP
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 active:scale-95 text-white font-bold text-xs rounded-xl transition-all cursor-pointer shadow-sm"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}