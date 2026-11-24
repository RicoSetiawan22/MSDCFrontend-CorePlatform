import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  QrCode,
  LogOut,
  LogIn,
  Building2,
  Briefcase,
  Clock,
  User,
  Activity,
  AlertCircle,
  ShieldCheck,
  ExternalLink,
  Ban,
  MapPin,
  Phone,
  Mail,
  DoorOpen,
  Server,
  CalendarClock,
  CheckCircle2,
  Copy,
  Check,
  Wrench,
  Users,
  UserCheck,
} from "lucide-react";
import { PageHeader } from "@shared/components/PageHeader";
import { getApiErrorMessage } from "@shared/lib/api-client";
import {
  useVisitorPass,
  useCheckOutVisitorPass,
  useCancelVisitorPass,
  useApproveVisitorPass,
} from "../api/useVisitorPass";
import {
  VisitorPassQRCodeModal,
  VisitorPassCheckOutModal,
  VisitorPassCancelModal,
  VisitorPassApproveModal,
} from "../components/visitor-pass";
import type { VisitorPassStatus } from "../types/visitorPass";

const STATUS_CONFIG: Record<
  VisitorPassStatus,
  { label: string; bg: string; text: string; border: string; dot: string; pulse?: boolean }
> = {
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
    text: "text-amber-800",
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
  completed: {
    label: "Selesai (Check-Out)",
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
  pending_registration: {
    label: "Menunggu Registrasi",
    bg: "bg-purple-50",
    text: "text-purple-700",
    border: "border-purple-200",
    dot: "bg-purple-500",
  },
  overstayed: {
    label: "Overstayed",
    bg: "bg-red-50",
    text: "text-red-700",
    border: "border-red-200",
    dot: "bg-red-500",
    pulse: true,
  },
};

const SOP_RULES = [
  "Tamu wajib mengenakan kartu identitas visitor selama di fasilitas.",
  "Dilarang menyentuh rak selain yang telah dialokasikan.",
  "Pengambilan foto/video di ruang server dilarang keras.",
];

/* ───────────────────────── Komponen presentasi ───────────────────────── */

const BTN =
  "inline-flex items-center justify-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-semibold transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";

const CARD =
  "rounded-2xl bg-white ring-1 ring-slate-200/80 shadow-[0_1px_2px_rgba(10,33,64,0.04)]";

const StatusPill: React.FC<{ cfg: (typeof STATUS_CONFIG)[VisitorPassStatus] }> = ({ cfg }) => (
  <span
    className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-semibold ${cfg.bg} ${cfg.text} ${cfg.border}`}
  >
    <span className="relative flex h-2 w-2">
      {cfg.pulse && (
        <span
          className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 motion-reduce:hidden ${cfg.dot}`}
        />
      )}
      <span className={`relative inline-flex h-2 w-2 rounded-full ${cfg.dot}`} />
    </span>
    {cfg.label}
  </span>
);

const Section: React.FC<{
  icon: React.ElementType;
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}> = ({ icon: Icon, title, action, children }) => (
  <section className={CARD}>
    <header className="flex flex-wrap items-center justify-between gap-3 px-6 pt-5 pb-4">
      <div className="flex items-center gap-2.5">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
          <Icon size={16} />
        </span>
        <h3 className="text-[15px] font-semibold text-[#0A2140]">{title}</h3>
      </div>
      {action}
    </header>
    <div className="px-6 pb-6">{children}</div>
  </section>
);

const Field: React.FC<{ label: string; className?: string; children: React.ReactNode }> = ({
  label,
  className = "",
  children,
}) => (
  <div className={`min-w-0 ${className}`}>
    <dt className="text-xs text-slate-500">{label}</dt>
    <dd className="mt-1 break-words text-sm font-medium text-slate-900">{children}</dd>
  </div>
);

const ZoneStep: React.FC<{
  icon: React.ElementType;
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  highlight?: boolean;
  last?: boolean;
  }> = ({ icon: Icon, label, value, sub, highlight, last }) => (
  <li className={`relative flex gap-3 ${last ? "" : "pb-5"}`}>
    {!last && <span aria-hidden className="absolute left-4 top-9 bottom-1 w-px bg-slate-200" />}
    <span
      className={`relative flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
        highlight ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-500"
      }`}
    >
      <Icon size={15} />
    </span>
    <div className="min-w-0 pt-0.5">
      <p className="text-xs text-slate-500">{label}</p>
      <p
        className={`mt-0.5 break-words text-sm font-semibold ${
          highlight ? "text-amber-700" : "text-slate-900"
        }`}
      >
        {value}
      </p>
      {sub && <p className="mt-0.5 text-xs leading-relaxed text-slate-500">{sub}</p>}
    </div>
  </li>
);

const TIME_TONES = {
  blue: "bg-blue-50 text-blue-600",
  emerald: "bg-emerald-50 text-emerald-600",
  slate: "bg-slate-100 text-slate-600",
  teal: "bg-teal-50 text-teal-600",
} as const;

const TimeRow: React.FC<{
  icon: React.ElementType;
  label: string;
  value: string;
  done: boolean;
  tone: keyof typeof TIME_TONES;
  sub?: React.ReactNode;
}> = ({ icon: Icon, label, value, done, tone, sub }) => (
  <li className="flex items-center gap-3">
    <span
      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
        done ? TIME_TONES[tone] : "border border-dashed border-slate-300 text-slate-300"
      }`}
    >
      <Icon size={15} />
    </span>
    <div className="min-w-0">
      <p className="text-xs text-slate-500">{label}</p>
      <p
        className={`text-sm tabular-nums ${
          done ? "font-semibold text-slate-900" : "text-slate-400"
        }`}
      >
        {done ? value : "Belum tercatat"}
      </p>
      {sub && <div className="mt-0.5">{sub}</div>}
    </div>
  </li>
);

/* ───────────────────────── Halaman ───────────────────────── */

export const VisitorPassDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const passId = Number(id);

  const { data: pass, isLoading, error } = useVisitorPass(passId);
  const checkOutMutation = useCheckOutVisitorPass();
  const cancelMutation = useCancelVisitorPass();
  const approveMutation = useApproveVisitorPass();

  const [showQrModal, setShowQrModal] = useState(false);
  const [showCheckOutModal, setShowCheckOutModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [approveError, setApproveError] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  const openApproveModal = () => {
    setApproveError(null);
    setShowApproveModal(true);
  };

  const formatDateTime = (dateStr?: string | null) => {
    if (!dateStr) return "-";
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return String(dateStr);
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
    } catch {
      return String(dateStr);
    }
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

  const inviteUrl = pass?.public_url_token
    ? `${window.location.origin}/visitor-registration/${pass.public_url_token}`
    : "";

  const handleCopyInviteLink = async () => {
    if (!inviteUrl) return;
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      // fallback
    }
  };

  const handleConfirmApprove = async (notes?: string) => {
    if (!pass) return;
    setApproveError(null);
    try {
      await approveMutation.mutateAsync({ id: pass.id, notes });
      setShowApproveModal(false);
    } catch (err: unknown) {
      // Modal tetap terbuka agar operator membaca penyebab penolakan (mis. 422 jadwal lewat / kontrak habis)
      setApproveError(getApiErrorMessage(err, "Gagal menyetujui izin kunjungan."));
    }
  };

  /* ── Loading ── */
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F5F7FA] px-7 py-8">
        <div className="flex w-full flex-col gap-6">
          <div className="h-8 w-44 animate-pulse rounded-lg bg-slate-200" />
          <div className="h-48 animate-pulse rounded-2xl bg-slate-300/60" />
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="h-96 animate-pulse rounded-2xl bg-white ring-1 ring-slate-200 lg:col-span-2" />
            <div className="h-96 animate-pulse rounded-2xl bg-white ring-1 ring-slate-200" />
          </div>
        </div>
      </div>
    );
  }

  /* ── Error / tidak ditemukan ── */
  if (error || !pass) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#F5F7FA] p-8">
        <div className={`${CARD} max-w-md p-8 text-center`}>
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-50">
            <AlertCircle size={24} className="text-rose-500" />
          </span>
          <h3 className="mt-4 text-base font-semibold text-[#0A2140]">
            Tiket visitor pass tidak ditemukan
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            Data tiket dengan ID #{id} tidak tersedia atau telah dihapus.
          </p>
          <button
            type="button"
            onClick={() => navigate("/dc/visitor-passes")}
            className={`${BTN} mt-5 bg-[#0A2140] text-white hover:bg-[#0A2140]/90`}
          >
            <ArrowLeft size={16} />
            Kembali ke daftar
          </button>
        </div>
      </div>
    );
  }

  const statusCfg =
    STATUS_CONFIG[pass.status as VisitorPassStatus] ?? STATUS_CONFIG.scheduled;
  const customerName = pass.customer?.company_name || pass.customer?.name || "-";
  const identityType = (pass.visitor_identity_type || "KTP").toUpperCase();
  const identityNum = pass.visitor_identity_number || pass.visitor_id_card || "-";
  const siteName = pass.site?.site_name || pass.site?.name || "Site MSDC Surabaya";
  const roomName = pass.room?.room_name || pass.room?.name || "Seluruh Ruangan";
  const isPendingRegistration = pass.status === "pending_registration";
  const isRegistered = pass.status === "registered";
  const canCancel =
    pass.status === "scheduled" ||
    pass.status === "registered" ||
    pass.status === "approved" ||
    pass.status === "pending_registration";

  const validFrom = pass.valid_from || pass.planned_check_in_at;
  const validUntil = pass.valid_until || pass.valid_to || pass.planned_check_out_at;
  const plannedIn = pass.planned_check_in_at || pass.valid_from;
  const actualIn = pass.actual_check_in_at || pass.check_in_at;
  const actualOut = pass.actual_check_out_at || pass.check_out_at;

  const pageSubtitle = isPendingRegistration
    ? `Detail undangan registrasi mandiri tamu (${customerName})`
    : `Detail perizinan kunjungan data center atas nama ${pass.visitor_name} (${customerName})`;

  return (
    <div className="min-h-screen bg-[#F5F7FA] pb-16">
      <PageHeader
        title={`Tiket: ${pass.pass_number}`}
        subtitle={pageSubtitle}
        containerClassName="px-7 pt-5 pb-2"
      />

      <div className="flex w-full flex-col gap-6 px-7 py-5">
        {/* ── Toolbar ── */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => navigate("/dc/visitor-passes")}
            className={`${BTN} -ml-2 px-2 font-medium text-slate-600 hover:bg-white hover:text-[#0A2140]`}
          >
            <ArrowLeft size={16} />
            Kembali ke daftar visitor pass
          </button>

          <div className="flex flex-wrap items-center gap-2">
            {/* Contextual Action: Pending Registration */}
            {isPendingRegistration && (
              <button
                type="button"
                onClick={handleCopyInviteLink}
                className={`${BTN} bg-white text-amber-700 ring-1 ring-inset ring-amber-300 hover:bg-amber-50`}
              >
                {copiedLink ? <Check size={15} className="text-emerald-600" /> : <Copy size={15} />}
                {copiedLink ? "Tautan Tersalin!" : "Salin Tautan Registrasi"}
              </button>
            )}

            {/* Contextual Action: Registered (Awaiting Approval) */}
            {isRegistered && (
              <button
                type="button"
                onClick={openApproveModal}
                className={`${BTN} bg-emerald-600 text-white shadow-sm hover:bg-emerald-700`}
              >
                <CheckCircle2 size={15} />
                Setujui Izin Masuk
              </button>
            )}

            {/* Action: Buka badge HP tamu (hanya jika tiket sudah aktif/terjadwal/selesai) */}
            {pass.public_url_token && !isPendingRegistration && !isRegistered && (
              <a
                href={`/visitor-pass/${pass.public_url_token}`}
                target="_blank"
                rel="noreferrer"
                className={`${BTN} bg-white text-slate-700 ring-1 ring-inset ring-slate-200 hover:bg-slate-50 hover:text-[#0A2140]`}
              >
                <ExternalLink size={15} />
                Buka badge HP tamu
              </a>
            )}

            {/* Action: Batalkan izin */}
            {canCancel && (
              <button
                type="button"
                onClick={() => setShowCancelModal(true)}
                className={`${BTN} bg-white text-rose-600 ring-1 ring-inset ring-rose-200 hover:bg-rose-50`}
              >
                <Ban size={15} />
                Batalkan izin
              </button>
            )}

            {/* Action: Check-out pengunjung */}
            {pass.status === "active_in_facility" && (
              <button
                type="button"
                onClick={() => setShowCheckOutModal(true)}
                className={`${BTN} bg-emerald-600 text-white shadow-sm hover:bg-emerald-700`}
              >
                <LogOut size={15} />
                Check-out pengunjung
              </button>
            )}
          </div>
        </div>

        {/* ── Hero: tiket visitor pass adaptif ── */}
        <section className="relative overflow-hidden rounded-2xl bg-[#0A2140] text-white shadow-[0_16px_40px_-16px_rgba(10,33,64,0.5)]">
          <div className="grid md:grid-cols-[minmax(0,1fr)_19rem]">
            {/* Badan tiket */}
            <div className="p-6 md:p-7">
              {isPendingRegistration ? (
                <>
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="font-mono text-sm font-semibold tracking-wide text-amber-300">
                      {pass.pass_number}
                    </span>
                    <StatusPill cfg={statusCfg} />
                  </div>

                  <h2 className="mt-4 break-words text-2xl font-bold tracking-tight text-amber-300 md:text-[1.75rem]">
                    Menunggu Registrasi Mandiri Tamu
                  </h2>
                  <p className="mt-1 text-sm text-white/70">
                    Tautan pendaftaran telah dikirim ke:{" "}
                    <span className="font-semibold text-white">
                      {pass.invited_email || pass.visitor_email || pass.recipient_email || "-"}
                    </span>
                  </p>

                  <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-xs text-white/55">
                    <span className="flex items-center gap-1.5">
                      <Briefcase size={13} />
                      Penjamin: <span className="text-white/80">{customerName}</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Clock size={13} />
                      Undangan dibuat {formatDateTime(pass.created_at)}
                    </span>
                  </div>
                </>
              ) : isRegistered ? (
                <>
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="font-mono text-sm font-semibold tracking-wide text-amber-300">
                      {pass.pass_number}
                    </span>
                    <StatusPill cfg={statusCfg} />
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-400/20 px-2.5 py-0.5 text-xs font-semibold text-amber-300 ring-1 ring-inset ring-amber-400/30">
                      <Clock size={12} />
                      Menunggu Persetujuan Operator
                    </span>
                  </div>

                  <h2 className="mt-4 break-words text-2xl font-bold tracking-tight md:text-[1.75rem]">
                    {pass.visitor_name}
                  </h2>
                  <p className="mt-1 text-sm text-white/70">
                    {pass.visitor_company || "Tamu mandiri / perorangan"}
                  </p>

                  <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-xs text-white/55">
                    <span className="flex items-center gap-1.5">
                      <Briefcase size={13} />
                      Penjamin: <span className="text-white/80">{customerName}</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <CalendarClock size={13} />
                      Rencana Kunjungan:{" "}
                      <span className="text-white/80">
                        {formatDateTime(pass.planned_check_in_at || validFrom)}
                      </span>
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="font-mono text-sm font-semibold tracking-wide text-amber-300">
                      {pass.pass_number}
                    </span>
                    <StatusPill cfg={statusCfg} />
                  </div>

                  <h2 className="mt-4 break-words text-2xl font-bold tracking-tight md:text-[1.75rem]">
                    {pass.visitor_name}
                  </h2>
                  <p className="mt-1 text-sm text-white/70">
                    {pass.visitor_company || "Tamu mandiri / perorangan"}
                  </p>

                  <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-xs text-white/55">
                    <span className="flex items-center gap-1.5">
                      <Briefcase size={13} />
                      Penjamin: <span className="text-white/80">{customerName}</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Clock size={13} />
                      Terdaftar {formatDateTime(pass.created_at)}
                    </span>
                  </div>
                </>
              )}
            </div>

            {/* Sobekan tiket: masa berlaku / jadwal & aksi utama */}
            <div className="relative border-t border-dashed border-white/20 bg-white/[0.04] p-6 md:border-l md:border-t-0 md:p-7">
              <span
                aria-hidden
                className="absolute -top-2.5 -left-2.5 hidden h-5 w-5 rounded-full bg-[#F5F7FA] md:block"
              />
              <span
                aria-hidden
                className="absolute -bottom-2.5 -left-2.5 hidden h-5 w-5 rounded-full bg-[#F5F7FA] md:block"
              />

              {isRegistered ? (
                <>
                  <p className="text-xs text-white/55">Rencana Jadwal Tamu</p>
                  <dl className="mt-3 space-y-2.5 text-sm">
                    <div className="flex items-baseline justify-between gap-3">
                      <dt className="text-white/55">Rencana Masuk</dt>
                      <dd className="text-right font-semibold tabular-nums">
                        {formatDateTime(pass.planned_check_in_at)}
                      </dd>
                    </div>
                    <div className="flex items-baseline justify-between gap-3">
                      <dt className="text-white/55">Rencana Keluar</dt>
                      <dd className="text-right font-semibold tabular-nums">
                        {formatDateTime(pass.planned_check_out_at)}
                      </dd>
                    </div>
                  </dl>

                  <button
                    type="button"
                    onClick={openApproveModal}
                    className={`${BTN} mt-5 w-full rounded-xl bg-emerald-500 py-2.5 text-white shadow-sm hover:bg-emerald-400 focus-visible:ring-offset-[#0A2140]`}
                  >
                    <CheckCircle2 size={16} />
                    Verifikasi & Setujui Izin
                  </button>
                </>
              ) : isPendingRegistration ? (
                <>
                  <p className="text-xs text-white/55">Rentang Tanggal Diizinkan</p>
                  <dl className="mt-3 space-y-2.5 text-sm">
                    <div className="flex items-baseline justify-between gap-3">
                      <dt className="text-white/55">Mulai</dt>
                      <dd className="text-right font-semibold tabular-nums">
                        {formatDateTime(pass.allowed_start_date || pass.valid_from)}
                      </dd>
                    </div>
                    <div className="flex items-baseline justify-between gap-3">
                      <dt className="text-white/55">Sampai</dt>
                      <dd className="text-right font-semibold tabular-nums">
                        {formatDateTime(pass.allowed_end_date || pass.valid_until)}
                      </dd>
                    </div>
                  </dl>

                  <button
                    type="button"
                    onClick={handleCopyInviteLink}
                    className={`${BTN} mt-5 w-full rounded-xl bg-amber-500 py-2.5 text-[#0A2140] font-semibold hover:bg-amber-400 focus-visible:ring-offset-[#0A2140]`}
                  >
                    {copiedLink ? <Check size={16} /> : <Copy size={16} />}
                    {copiedLink ? "Tautan Tersalin!" : "Salin Tautan Undangan"}
                  </button>
                </>
              ) : (
                <>
                  <p className="text-xs text-white/55">Masa berlaku akses</p>
                  <dl className="mt-3 space-y-2.5 text-sm">
                    <div className="flex items-baseline justify-between gap-3">
                      <dt className="text-white/55">Mulai</dt>
                      <dd className="text-right font-semibold tabular-nums">
                        {formatDateTime(validFrom)}
                      </dd>
                    </div>
                    <div className="flex items-baseline justify-between gap-3">
                      <dt className="text-white/55">Berakhir</dt>
                      <dd className="text-right font-semibold tabular-nums">
                        {formatDateTime(validUntil)}
                      </dd>
                    </div>
                  </dl>

                  <button
                    type="button"
                    onClick={() => setShowQrModal(true)}
                    className={`${BTN} mt-5 w-full rounded-xl bg-amber-500 py-2.5 text-[#0A2140] hover:bg-amber-400 focus-visible:ring-offset-[#0A2140]`}
                  >
                    <QrCode size={16} />
                    Lihat & cetak QR e-badge
                  </button>
                </>
              )}
            </div>
          </div>
        </section>

        {/* ── Konten Grid ── */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Kolom kiri */}
          <div className="flex flex-col gap-6 lg:col-span-2">
            {/* Data diri pengunjung */}
            <Section
              icon={User}
              title="Data diri pengunjung"
              action={
                isPendingRegistration ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-purple-50 px-2.5 py-1 text-xs font-medium text-purple-700 ring-1 ring-inset ring-purple-200">
                    <Clock size={13} />
                    Menunggu pengisian formulir
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-200">
                    <ShieldCheck size={13} />
                    {identityType} terverifikasi
                  </span>
                )
              }
            >
              {isPendingRegistration ? (
                <div>
                  <div className="rounded-xl border border-dashed border-amber-300 bg-amber-50/50 p-6 text-center">
                    <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-700">
                      <AlertCircle size={24} />
                    </span>
                    <h4 className="mt-3 text-sm font-semibold text-[#0A2140]">
                      Tamu Belum Melengkapi Formulir Pendaftaran
                    </h4>
                    <p className="mx-auto mt-1.5 max-w-md text-xs leading-relaxed text-slate-600">
                      Tautan undangan aktif telah dikirimkan ke email terdaftar{" "}
                      <span className="font-semibold text-slate-800">
                        ({pass.invited_email || pass.visitor_email || pass.recipient_email || "-"})
                      </span>
                      . Data identitas KTP/SIM, nomor telepon, persetujuan K3 & NDA, serta daftar peralatan bawaan akan tampil otomatis setelah tamu mengisi formulir registrasi mandiri.
                    </p>
                    {pass.public_url_token && (
                      <button
                        type="button"
                        onClick={handleCopyInviteLink}
                        className={`${BTN} mt-4 bg-amber-500 text-[#0A2140] hover:bg-amber-400`}
                      >
                        {copiedLink ? <Check size={14} /> : <Copy size={14} />}
                        {copiedLink ? "Tautan Tersalin!" : "Salin Tautan Formulir Mandiri"}
                      </button>
                    )}
                  </div>

                  {pass.purpose && (
                    <div className="mt-6 border-t border-slate-100 pt-5">
                      <p className="text-xs text-slate-500">Tujuan & keperluan kunjungan (dari undangan)</p>
                      <blockquote className="mt-2 rounded-r-lg border-l-[3px] border-amber-400 bg-amber-50/60 px-4 py-3 text-sm leading-relaxed text-slate-800">
                        {pass.purpose}
                      </blockquote>
                    </div>
                  )}

                  {pass.notes && (
                    <div className="mt-4">
                      <p className="text-xs text-slate-500">Catatan khusus / instruksi internal</p>
                      <p className="mt-2 rounded-lg bg-slate-50 px-4 py-3 text-sm leading-relaxed text-slate-600">
                        {pass.notes}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <dl className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">
                    <Field label="Nama lengkap">{pass.visitor_name}</Field>
                    <Field label="Instansi / perusahaan">
                      {pass.visitor_company || "Tamu mandiri / perorangan"}
                    </Field>
                    <Field label={`Nomor identitas (${identityType})`}>
                      <span className="font-mono tracking-wide">{identityNum}</span>
                    </Field>
                    <Field label="Kontak">
                      <span className="flex flex-col gap-1">
                        <span className="flex items-center gap-2">
                          <Phone size={14} className="shrink-0 text-slate-400" />
                          {pass.visitor_phone || "-"}
                        </span>
                        <span className="flex min-w-0 items-center gap-2">
                          <Mail size={14} className="shrink-0 text-slate-400" />
                          <span className="truncate" title={pass.visitor_email || pass.invited_email || undefined}>
                            {pass.visitor_email || pass.invited_email || "-"}
                          </span>
                        </span>
                      </span>
                    </Field>
                  </dl>

                  {/* Peralatan / Material bawaan */}
                  {pass.equipment_brought_in && (
                    <div className="mt-6 border-t border-slate-100 pt-5">
                      <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                        <Wrench size={14} className="text-amber-600" />
                        Peralatan / Material yang Dibawa Masuk:
                      </div>
                      <p className="mt-2 rounded-lg bg-slate-50 px-4 py-3 font-mono text-xs leading-relaxed text-slate-700 whitespace-pre-wrap">
                        {pass.equipment_brought_in}
                      </p>
                    </div>
                  )}

                  {/* Rombongan / Tamu Pendamping */}
                  {pass.additional_visitors && pass.additional_visitors.length > 0 && (
                    <div className="mt-6 border-t border-slate-100 pt-5">
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                          <Users size={14} className="text-indigo-600" />
                          Daftar Rombongan / Tamu Pendamping:
                        </span>
                        <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-700">
                          {pass.additional_visitors.length} Orang
                        </span>
                      </div>
                      <div className="mt-2.5 divide-y divide-slate-100 rounded-xl border border-slate-200/80 bg-slate-50/50">
                        {pass.additional_visitors.map((v, i) => (
                          <div key={i} className="flex flex-wrap items-center justify-between gap-2 p-3 text-xs">
                            <div className="flex items-center gap-2.5">
                              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-100 text-xs font-semibold text-indigo-700">
                                {i + 1}
                              </span>
                              <div>
                                <p className="font-semibold text-slate-900">{v.name}</p>
                                <p className="text-slate-500">{v.company || "Instansi sama"}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-mono text-slate-700">{v.identity_number || "-"}</p>
                              {v.phone && <p className="text-slate-500">{v.phone}</p>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Persetujuan K3 & NDA */}
                  {pass.safety_nda_agreed_at && (
                    <div className="mt-6 border-t border-slate-100 pt-5">
                      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-emerald-50/80 p-3.5 text-xs ring-1 ring-inset ring-emerald-200/70">
                        <div className="flex items-center gap-2.5 font-medium text-emerald-800">
                          <ShieldCheck size={16} className="shrink-0 text-emerald-600" />
                          <span>Persetujuan K3 & NDA Fasilitas Data Center telah disepakati</span>
                        </div>
                        <div className="text-right text-[11px] text-emerald-700">
                          <span>{formatDateTime(pass.safety_nda_agreed_at)}</span>
                          {pass.safety_nda_ip && (
                            <span className="ml-1.5 font-mono text-emerald-600/80">
                              (IP: {pass.safety_nda_ip})
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="mt-6 border-t border-slate-100 pt-5">
                    <p className="text-xs text-slate-500">Tujuan & keperluan kunjungan</p>
                    <blockquote className="mt-2 rounded-r-lg border-l-[3px] border-amber-400 bg-amber-50/60 px-4 py-3 text-sm leading-relaxed text-slate-800">
                      {pass.purpose}
                    </blockquote>
                  </div>

                  {pass.notes && (
                    <div className="mt-4">
                      <p className="text-xs text-slate-500">Catatan khusus / instruksi SOP</p>
                      <p className="mt-2 rounded-lg bg-slate-50 px-4 py-3 text-sm leading-relaxed text-slate-600">
                        {pass.notes}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </Section>

            {/* Penjamin & kontrak */}
            <Section
              icon={Briefcase}
              title="Penjamin & kontrak CRM"
              action={
                pass.contract?.status && (
                  <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium capitalize text-emerald-700 ring-1 ring-inset ring-emerald-200">
                    Kontrak {pass.contract.status}
                  </span>
                )
              }
            >
              <dl className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">
                <Field label="Customer CRM">
                  {customerName}
                  {pass.customer?.customer_code && (
                    <span className="mt-0.5 block font-mono text-xs font-normal text-slate-500">
                      {pass.customer.customer_code}
                    </span>
                  )}
                </Field>

                <Field label="Nomor kontrak">
                  {pass.contract?.contract_number ? (
                    <span className="font-mono text-amber-700">
                      {pass.contract.contract_number}
                    </span>
                  ) : (
                    <span className="font-normal text-slate-500">
                      Tidak terkait kontrak khusus
                    </span>
                  )}
                  {pass.contract?.days_until_expiry !== undefined &&
                    pass.contract?.days_until_expiry !== null && (
                      <span className="mt-1.5 block w-fit rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                        Sisa masa kontrak {pass.contract.days_until_expiry} hari
                      </span>
                    )}
                </Field>

                {pass.contract?.start_date && (
                  <Field label="Periode kontrak" className="sm:col-span-2">
                    <span className="tabular-nums">
                      {formatDateTime(pass.contract.start_date)} –{" "}
                      {formatDateTime(pass.contract.end_date)}
                    </span>
                  </Field>
                )}
              </dl>
            </Section>

            {/* Log audit */}
            <Section
              icon={Activity}
              title="Log audit & rekam jejak akses"
              action={
                pass.access_logs && pass.access_logs.length > 0 ? (
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                    {pass.access_logs.length} entri
                  </span>
                ) : null
              }
            >
              {!pass.access_logs || pass.access_logs.length === 0 ? (
                <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-slate-200 px-4 py-8 text-center">
                  <Activity size={20} className="text-slate-300" />
                  <p className="text-sm text-slate-500">
                    Belum ada log pemindaian fisik untuk tiket ini.
                  </p>
                </div>
              ) : (
                <ol>
                  {pass.access_logs.map((log: any, idx: number) => {
                    const rawAction =
                      log?.action ||
                      (log as any)?.event ||
                      (log as any)?.type ||
                      (log as any)?.status ||
                      "Aktivitas Akses";
                    const displayAction =
                      typeof rawAction === "string"
                        ? rawAction.replace(/_/g, " ")
                        : String(rawAction);
                    const displayLocation =
                      log?.scanner_location ||
                      (log as any)?.location ||
                      "Pos Jaga / Main Gate";
                    const displayActor =
                      log?.actor_name ||
                      (log as any)?.user?.name ||
                      (log as any)?.actor?.name ||
                      null;
                    const displayNotes =
                      log?.notes || (log as any)?.description || null;
                    const displayTime =
                      log?.created_at || (log as any)?.timestamp || null;
                    const isLast = idx === (pass.access_logs?.length ?? 0) - 1;

                    return (
                      <li key={log?.id ?? idx} className={`relative flex gap-4 ${isLast ? "" : "pb-6"}`}>
                        {!isLast && (
                          <span
                            aria-hidden
                            className="absolute left-[7px] top-5 bottom-0 w-px bg-slate-200"
                          />
                        )}
                        <span className="relative mt-1 h-[15px] w-[15px] shrink-0 rounded-full border-[3px] border-white bg-amber-500 ring-1 ring-amber-300" />

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
                            <p className="text-sm font-semibold capitalize text-slate-900">
                              {displayAction}
                            </p>
                            <time className="text-xs tabular-nums text-slate-500">
                              {formatDateTime(displayTime)}
                            </time>
                          </div>
                          <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                            <span className="flex items-center gap-1">
                              <MapPin size={12} className="shrink-0" />
                              {displayLocation}
                            </span>
                            {displayActor && (
                              <span className="flex items-center gap-1">
                                <User size={12} className="shrink-0" />
                                {displayActor}
                              </span>
                            )}
                          </div>
                          {displayNotes && (
                            <p className="mt-2 rounded-lg bg-slate-50 px-3 py-2 text-xs leading-relaxed text-slate-600">
                              {displayNotes}
                            </p>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ol>
              )}
            </Section>
          </div>

          {/* Kolom kanan */}
          <div className="flex flex-col gap-6">
            {/* Zona akses */}
            <Section icon={MapPin} title="Zona akses fasilitas">
              <ol>
                <ZoneStep
                  icon={Building2}
                  label="Site data center"
                  value={siteName}
                  sub={pass.site?.address}
                />
                <ZoneStep
                  icon={DoorOpen}
                  label="Ruangan server"
                  value={roomName}
                  sub={pass.room?.floor ? `Lantai ${pass.room.floor}` : undefined}
                />
                <ZoneStep
                  icon={Server}
                  label="Rak yang diizinkan"
                  value={pass.rack?.code ? `Rak ${pass.rack.code}` : "Tidak terbatas rak tertentu"}
                  highlight={!!pass.rack?.code}
                  last
                />
              </ol>
            </Section>

            {/* Riwayat waktu fisik */}
            <Section icon={Clock} title="Riwayat waktu fisik">
              <ul className="space-y-4">
                <TimeRow
                  icon={CalendarClock}
                  label="Rencana kedatangan"
                  value={
                    pass.planned_check_in_at && pass.planned_check_out_at
                      ? `${formatDateTime(pass.planned_check_in_at)} s.d. ${formatDateTime(pass.planned_check_out_at)}`
                      : formatDateTime(plannedIn)
                  }
                  done={!!plannedIn}
                  tone="blue"
                />

                {pass.approved_at && (
                  <TimeRow
                    icon={UserCheck}
                    label="Persetujuan operator"
                    value={formatDateTime(pass.approved_at)}
                    done={true}
                    tone="teal"
                    sub={
                      <p className="text-xs text-slate-500">
                        Oleh:{" "}
                        <span className="font-medium text-slate-700">
                          {pass.approved_by_officer?.name || pass.approved_by || "Operator Data Center"}
                        </span>
                      </p>
                    }
                  />
                )}

                <TimeRow
                  icon={LogIn}
                  label="Aktual check-in"
                  value={formatDateTime(actualIn)}
                  done={!!actualIn}
                  tone="emerald"
                />
                <TimeRow
                  icon={LogOut}
                  label="Aktual check-out"
                  value={formatDateTime(actualOut)}
                  done={!!actualOut}
                  tone="slate"
                />
              </ul>

              {(pass.check_in_method || pass.check_in_officer) && (
                <dl className="mt-5 space-y-2 rounded-xl bg-slate-50 p-3.5 text-sm">
                  {pass.check_in_method && (
                    <div className="flex justify-between gap-3">
                      <dt className="text-slate-500">Metode verifikasi</dt>
                      <dd className="text-right font-medium text-slate-800">
                        {formatVerificationMethod(pass.check_in_method)}
                      </dd>
                    </div>
                  )}
                  {pass.check_in_officer && (
                    <div className="flex justify-between gap-3">
                      <dt className="text-slate-500">Petugas check-in</dt>
                      <dd className="text-right font-medium text-slate-800">
                        {pass.check_in_officer.name || "Petugas Pos Jaga"}
                      </dd>
                    </div>
                  )}
                </dl>
              )}
            </Section>

            {/* SOP */}
            <aside className="rounded-2xl bg-amber-50 p-5 ring-1 ring-inset ring-amber-200/70">
              <p className="flex items-center gap-2 text-sm font-semibold text-amber-900">
                <ShieldCheck size={16} className="text-amber-600" />
                SOP kunjungan fasilitas
              </p>
              <ul className="mt-3 space-y-2 text-[13px] leading-relaxed text-amber-900/80">
                {SOP_RULES.map((rule) => (
                  <li key={rule} className="flex gap-2.5">
                    <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                    {rule}
                  </li>
                ))}
              </ul>
            </aside>
          </div>
        </div>
      </div>

      {/* Modal QR Code */}
      <VisitorPassQRCodeModal
        pass={pass}
        isOpen={showQrModal}
        onClose={() => setShowQrModal(false)}
      />

      {/* Modal Persetujuan Izin Kunjungan (Approval) */}
      <VisitorPassApproveModal
        pass={pass}
        isOpen={showApproveModal}
        onClose={() => setShowApproveModal(false)}
        onConfirm={handleConfirmApprove}
        isLoading={approveMutation.isPending}
        errorMessage={approveError}
      />

      {/* Modal Konfirmasi Check-Out */}
      <VisitorPassCheckOutModal
        pass={pass}
        isOpen={showCheckOutModal}
        onClose={() => setShowCheckOutModal(false)}
        onConfirm={async (notes, exitGate) => {
          await checkOutMutation.mutateAsync({
            id: pass.id,
            notes: notes || (exitGate ? `Check-out dari ${exitGate}` : undefined),
          });
          setShowCheckOutModal(false);
        }}
        isLoading={checkOutMutation.isPending}
      />

      {/* Modal Konfirmasi Pembatalan Izin */}
      <VisitorPassCancelModal
        pass={pass}
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        onConfirm={async (reason) => {
          await cancelMutation.mutateAsync({ id: pass.id, reason });
          setShowCancelModal(false);
        }}
        isLoading={cancelMutation.isPending}
      />
    </div>
  );
};