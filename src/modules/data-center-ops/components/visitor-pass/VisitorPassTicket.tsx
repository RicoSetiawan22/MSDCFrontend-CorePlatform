import React from "react";
import {
  Clock,
  User,
  Briefcase,
  MapPin,
  Server,
  UserCheck,
  ShieldCheck,
  Download,
  RotateCw,
  Ticket,
  Lock,
  Ban,
  ShieldX,
  TimerOff,
  CircleCheckBig,
  AlertTriangle,
} from "lucide-react";
import type { VisitorPass, PublicVisitorPassResponse } from "../../types/visitorPass";
import {
  getVisitorQrInactiveReason,
  VISITOR_QR_INACTIVE_COPY,
  type VisitorQrInactiveReason,
} from "../../utils/visitorPassQr";

type TerminalQrReason = Exclude<VisitorQrInactiveReason, "pending_registration" | "registered">;

const TERMINAL_QR_STYLE: Record<TerminalQrReason, { icon: React.ElementType; box: string }> = {
  checked_in: { icon: UserCheck, box: "bg-emerald-50 text-emerald-600 ring-emerald-100/60" },
  completed: { icon: CircleCheckBig, box: "bg-slate-100 text-slate-500 ring-slate-200/60" },
  expired: { icon: TimerOff, box: "bg-amber-50 text-amber-600 ring-amber-100/60" },
  cancelled: { icon: Ban, box: "bg-rose-50 text-rose-600 ring-rose-100/60" },
  denied: { icon: ShieldX, box: "bg-red-50 text-red-600 ring-red-100/60" },
  unavailable: { icon: AlertTriangle, box: "bg-slate-100 text-slate-500 ring-slate-200/60" },
};

export type VisitorPassTicketData =
  | VisitorPass
  | PublicVisitorPassResponse["data"]
  | Record<string, any>;

export interface VisitorPassTicketProps {
  pass: VisitorPassTicketData;
  qrDataUri?: string | null;
  isLoadingQr?: boolean;
  timeLeftString?: string;
  onRefreshTime?: () => void;
  onCancel?: () => void;
  onDownload?: () => void;
  isDownloading?: boolean;
  className?: string;
}

export const VisitorPassTicket: React.FC<VisitorPassTicketProps> = ({
  pass,
  qrDataUri,
  isLoadingQr = false,
  timeLeftString,
  onRefreshTime,
  onCancel,
  onDownload,
  isDownloading = false,
  className = "",
}) => {
  // ── 1. Data Normalization Helper ──
  const p = (pass || {}) as any;
  const currentStatus = (p.status as string) || "";
  const isPendingRegistration = currentStatus === "pending_registration";
  const isWaitingApproval = currentStatus === "registered";

  // QR hanya boleh tampil untuk tiket 'scheduled' yang belum dipindai & belum kedaluwarsa.
  // Tiket hangus (selesai/kedaluwarsa/dibatalkan/ditolak/sudah check-in) tampil TANPA QR.
  const statusQrReason = getVisitorQrInactiveReason(p);
  const terminalQrReason: TerminalQrReason | null =
    statusQrReason && statusQrReason !== "pending_registration" && statusQrReason !== "registered"
      ? statusQrReason
      : !statusQrReason && !isLoadingQr && !qrDataUri
      ? "unavailable"
      : null;
  const terminalQrCopy = terminalQrReason ? VISITOR_QR_INACTIVE_COPY[terminalQrReason] : null;
  const TerminalQrIcon = terminalQrReason ? TERMINAL_QR_STYLE[terminalQrReason].icon : null;
  const isQrUsable = !statusQrReason && !!qrDataUri;

  const passNumber = p.pass_number || "VP-000000-0000";
  const visitorName =
    p.visitor_name ||
    (isPendingRegistration
      ? "Menunggu Registrasi Tamu"
      : isWaitingApproval
      ? "Tamu Menunggu Approval"
      : "Nama Pengunjung");
  const visitorCompany = p.visitor_company || "";

  const customerName =
    p.customer_name ||
    p.customer?.company_name ||
    p.customer?.name ||
    p.company_name ||
    "-";

  const siteName =
    p.site_name ||
    p.site?.site_name ||
    p.site?.name ||
    "Data Center Surabaya 1";

  const roomName =
    p.room_name ||
    p.room?.room_name ||
    p.room?.name ||
    "";

  const rackCode =
    p.rack_code ||
    p.rack?.code ||
    p.rack?.rack_code;

  let rackDisplay = "Seluruh Ruangan";
  if (rackCode) {
    rackDisplay = String(rackCode).toLowerCase().startsWith("rak")
      ? String(rackCode)
      : `Rak ${rackCode}`;
  } else if (roomName) {
    rackDisplay = roomName;
  }

  const purpose = p.purpose || "-";

  // ── 2. Status Calculation & Badge Text (Harmonized with VisitorPassTable STATUS_CONFIG) ──
  const validUntilDate =
    p.valid_until || p.valid_to || p.planned_check_out_at;
  const isExpired =
    currentStatus === "expired" ||
    (!isPendingRegistration && !isWaitingApproval && validUntilDate
      ? new Date(validUntilDate).getTime() < Date.now()
      : false);

  let statusLabel = "SIAP CHECK-IN";
  let statusDotColor = "bg-emerald-400";
  let statusBadgeBg = "bg-emerald-500/10";
  let statusBadgeBorder = "border-emerald-400/30";
  let statusTextColor = "text-emerald-300";
  let statusPulse = false;

  if (isPendingRegistration) {
    statusLabel = "MENUNGGU REGISTRASI";
    statusDotColor = "bg-purple-400";
    statusBadgeBg = "bg-purple-500/10";
    statusBadgeBorder = "border-purple-400/30";
    statusTextColor = "text-purple-300";
  } else if (isWaitingApproval) {
    statusLabel = "MENUNGGU PERSETUJUAN";
    statusDotColor = "bg-amber-400";
    statusBadgeBg = "bg-amber-500/15";
    statusBadgeBorder = "border-amber-400/40";
    statusTextColor = "text-amber-300";
    statusPulse = true;
  } else if (currentStatus === "active_in_facility") {
    statusLabel = "DI FASILITAS";
    statusDotColor = "bg-emerald-400";
    statusBadgeBg = "bg-emerald-500/15";
    statusBadgeBorder = "border-emerald-400/40";
    statusTextColor = "text-emerald-300";
    statusPulse = true;
  } else if (currentStatus === "overstayed") {
    statusLabel = "OVERSTAY ALERT";
    statusDotColor = "bg-rose-500";
    statusBadgeBg = "bg-rose-500/20";
    statusBadgeBorder = "border-rose-400/50";
    statusTextColor = "text-rose-300";
    statusPulse = true;
  } else if (isExpired) {
    statusLabel = "TIKET KEDALUWARSA";
    statusDotColor = "bg-amber-400";
    statusBadgeBg = "bg-amber-500/10";
    statusBadgeBorder = "border-amber-400/30";
    statusTextColor = "text-amber-300";
  } else if (currentStatus === "scheduled") {
    statusLabel = "TERJADWAL";
    statusDotColor = "bg-blue-400";
    statusBadgeBg = "bg-blue-500/10";
    statusBadgeBorder = "border-blue-400/30";
    statusTextColor = "text-sky-300";
  } else if (currentStatus === "approved") {
    statusLabel = "DISETUJUI";
    statusDotColor = "bg-teal-400";
    statusBadgeBg = "bg-teal-500/10";
    statusBadgeBorder = "border-teal-400/30";
    statusTextColor = "text-teal-300";
  } else if (currentStatus === "completed") {
    statusLabel = "SELESAI";
    statusDotColor = "bg-slate-400";
    statusBadgeBg = "bg-slate-500/10";
    statusBadgeBorder = "border-slate-400/30";
    statusTextColor = "text-slate-300";
  } else if (currentStatus === "cancelled") {
    statusLabel = "DIBATALKAN";
    statusDotColor = "bg-rose-400";
    statusBadgeBg = "bg-rose-500/10";
    statusBadgeBorder = "border-rose-400/30";
    statusTextColor = "text-rose-300";
  } else if (currentStatus === "denied") {
    statusLabel = "DITOLAK";
    statusDotColor = "bg-red-500";
    statusBadgeBg = "bg-red-500/15";
    statusBadgeBorder = "border-red-400/40";
    statusTextColor = "text-red-300";
  }


  return (
    <div
      className={`w-full max-w-sm lg:max-w-4xl xl:max-w-5xl mx-auto bg-[#071A34] text-white rounded-[32px] p-4 sm:p-6 lg:p-6 xl:p-8 shadow-2xl relative select-none font-sans overflow-hidden border border-slate-800/80 ${className}`}
    >
      {/* ── Background Subtle Decorative Elements (Desktop & Mobile) ── */}
      {/* Subtle Dot Matrix Grid Pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(#1E3A8A_1px,transparent_1px)] [background-size:24px_24px] opacity-35 pointer-events-none" />

      {/* Ambient Gradient Glow Orbs */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="hidden lg:block absolute top-1/2 left-1/3 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* ═════════ MOBILE-ONLY HEADER (LAYAR < LG) ═════════ */}
      <div className="block lg:hidden w-full pt-1 pb-3 sm:pt-2 sm:pb-4 flex flex-col items-center text-center relative z-10">
        {/* Logo MSDC Surabaya di tengah atas */}
        <div className="h-12 sm:h-14 flex items-center justify-center mb-3">
          <img
            src="/images/logo.png"
            alt="MSDC Surabaya"
            className="h-10 sm:h-11 w-auto object-contain filter drop-shadow-sm"
          />
        </div>

        {/* Baris Judul: Icon Kotak Kuning + Title + 3 Garis Aksen */}
        <div className="w-full flex items-center justify-between gap-3 px-1">
          <div className="flex items-center gap-2.5">
            {/* Yellow Squircle Icon Badge */}
            <div className="w-8 h-8 rounded-xl bg-[#F59E0B] text-slate-950 flex items-center justify-center shrink-0 shadow-sm">
              <Ticket size={16} className="fill-slate-950 stroke-1" />
            </div>
            <div className="flex flex-col text-left">
              <span className="text-[0.6rem] font-bold tracking-widest text-sky-300 uppercase leading-none mb-0.5">
                DATA CENTER
              </span>
              <h2 className="text-sm sm:text-base font-extrabold text-white tracking-wider leading-none">
                VISITOR PASS
              </h2>
            </div>
          </div>

          {/* 3 Accent Stripes */}
          <div className="flex items-center gap-1 opacity-80 pr-1">
            <span className="w-1 h-4 bg-sky-400 rounded-full transform -skew-x-12" />
            <span className="w-1 h-4 bg-sky-400 rounded-full transform -skew-x-12" />
            <span className="w-1 h-4 bg-sky-400 rounded-full transform -skew-x-12" />
          </div>
        </div>

        {/* Baris ID Tiket & Badge Status */}
        <div className="w-full flex items-center justify-between gap-2 mt-3.5 px-1">
          <div className="px-3.5 py-1 rounded-full bg-[#031124] border border-amber-400/90 shadow-2xs">
            <span className="font-mono text-xs font-bold text-amber-400">
              {passNumber}
            </span>
          </div>

          <div
            className={`px-3 py-1 rounded-full ${statusBadgeBg} border ${statusBadgeBorder} backdrop-blur-xs flex items-center gap-1.5 shadow-2xs`}
          >
            <span className="relative flex h-1.5 w-1.5">
              {statusPulse && (
                <span
                  className={`animate-ping absolute inline-flex h-full w-full rounded-full ${statusDotColor} opacity-75`}
                />
              )}
              <span
                className={`relative inline-flex rounded-full h-1.5 w-1.5 ${statusDotColor}`}
              />
            </span>
            <span
              className={`text-[0.62rem] font-extrabold tracking-wider ${statusTextColor} uppercase`}
            >
              {statusLabel}
            </span>
          </div>
        </div>
      </div>

      {/* ═════════ MAIN RESPONSIVE CONTAINER (1 KOLOM MOBILE, 2 KOLOM DESKTOP) ═════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 xl:gap-12 items-center relative z-10">
        {/* ═════════ KOLOM KIRI (DESKTOP VIEW: BRANDING & INFO UMUM) ═════════ */}
        <div className="hidden lg:flex lg:col-span-6 xl:col-span-7 flex-col items-start text-left justify-center py-2 pr-2">
          {/* Logo MSDC Surabaya Rata Kiri */}
          <div className="h-14 xl:h-16 flex items-center justify-start mb-6">
            <img
              src="/images/logo.png"
              alt="MSDC Surabaya"
              className="h-12 xl:h-14 w-auto object-contain filter drop-shadow-md"
            />
          </div>

          {/* Baris Judul Besar & Aksen Garis */}
          <div className="flex items-center gap-3.5 mb-3.5">
            <div className="w-11 h-11 rounded-2xl bg-[#F59E0B] text-slate-950 flex items-center justify-center shrink-0 shadow-md">
              <Ticket size={22} className="fill-slate-950 stroke-1" />
            </div>
            <div className="flex flex-col">
              <span className="text-[0.7rem] font-bold tracking-widest text-sky-300 uppercase leading-none mb-1">
                DATA CENTER
              </span>
              <h1 className="text-xl xl:text-2xl font-black text-white tracking-wider leading-none">
                VISITOR PASS
              </h1>
            </div>
            <div className="flex items-center gap-1.5 opacity-80 pl-2">
              <span className="w-1.5 h-5 bg-sky-400 rounded-full transform -skew-x-12" />
              <span className="w-1.5 h-5 bg-sky-400 rounded-full transform -skew-x-12" />
              <span className="w-1.5 h-5 bg-sky-400 rounded-full transform -skew-x-12" />
            </div>
          </div>

          {/* Baris ID Tiket & Status Badge (Rata Kiri) */}
          <div className="flex flex-wrap items-center gap-3 mb-5">
            <div className="px-4 py-1.5 rounded-full bg-[#031124] border border-amber-400/90 shadow-sm">
              <span className="font-mono text-xs xl:text-sm font-bold text-amber-400">
                {passNumber}
              </span>
            </div>

            <div
              className={`px-3.5 py-1.5 rounded-full ${statusBadgeBg} border ${statusBadgeBorder} backdrop-blur-xs flex items-center gap-2 shadow-sm`}
            >
              <span className="relative flex h-2 w-2">
                {statusPulse && (
                  <span
                    className={`animate-ping absolute inline-flex h-full w-full rounded-full ${statusDotColor} opacity-75`}
                  />
                )}
                <span
                  className={`relative inline-flex rounded-full h-2 w-2 ${statusDotColor}`}
                />
              </span>
              <span
                className={`text-xs font-extrabold tracking-wider ${statusTextColor} uppercase`}
              >
                {statusLabel}
              </span>
            </div>
          </div>

          {/* Deskripsi Singkat Pengantar */}
          <p className="text-xs xl:text-sm text-slate-300/90 leading-relaxed mb-6 max-w-lg">
            Tiket digital resmi otentikasi perizinan akses masuk fasilitas Tier-3 Data Center MSDC Surabaya. Pindai kode QR pada turnstile atau pos jaga keamanan untuk verifikasi identitas dan log kunjungan.
          </p>

          {/* SOP Keselamatan Fasilitas (Dipindahkan ke Kolom Kiri di Desktop) */}
          <div className="w-full max-w-lg bg-slate-900/75 border border-sky-400/20 backdrop-blur-md rounded-2xl p-4.5 xl:p-5 shadow-xl text-left mb-6">
            <div className="flex items-center gap-2.5 text-sky-400 mb-3">
              <ShieldCheck size={18} className="shrink-0 stroke-[2.2]" />
              <h3 className="text-xs xl:text-sm font-bold text-white tracking-wide">
                SOP Keselamatan Fasilitas Data Center
              </h3>
            </div>
            <ul className="space-y-2 text-xs text-slate-300 leading-relaxed">
              <li className="flex items-start gap-2.5">
                <span className="text-sky-400 font-bold shrink-0 mt-0.5">•</span>
                <span>Wajib mengenakan kartu visitor fisik selama berada di dalam fasilitas.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-sky-400 font-bold shrink-0 mt-0.5">•</span>
                <span>Dilarang menyentuh kabel, PDU, atau perangkat selain rak tujuan yang diizinkan.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-sky-400 font-bold shrink-0 mt-0.5">•</span>
                <span>Dilarang mengambil foto atau dokumentasi tanpa izin resmi tertulis dari NOC.</span>
              </li>
            </ul>
          </div>

          {/* Footer Branding Desktop */}
          <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
            <MapPin size={14} className="text-sky-400 shrink-0" />
            <span>Micro Scale Data Center • Surabaya, Indonesia</span>
          </div>
        </div>

        {/* ═════════ KOLOM KANAN (KARTU TIKET PUTIH) ═════════ */}
        <div className="lg:col-span-6 xl:col-span-5 flex justify-center lg:justify-end w-full">
          <div className="relative w-full max-w-sm">
            {/* Ambient Radial Glow di Belakang Kartu (Desktop) */}
            <div className="hidden lg:block absolute -inset-3 bg-gradient-to-tr from-sky-600/25 via-amber-500/15 to-blue-500/25 rounded-[34px] blur-xl opacity-75 pointer-events-none" />

            {/* Container Kartu Putih Melengkung */}
            <div className="w-full bg-white text-slate-900 rounded-[28px] shadow-2xl relative z-10 overflow-hidden mt-1 lg:mt-0">
              {/* ── BAGIAN ATAS KARTU TIKET (KONTEN UTAMA) ── */}
              <div className="p-5 sm:p-6 lg:p-5 flex flex-col items-center">
                {/* ── Area QR Code dengan Frame Sudut Biru / Ungu / Kuning ── */}
                <div className="w-full flex items-center justify-center relative my-2 lg:my-0">
                  <div className="relative p-3.5 lg:p-3 bg-white flex items-center justify-center min-w-[200px] min-h-[200px] sm:min-w-[210px] sm:min-h-[210px] lg:min-w-[180px] lg:min-h-[180px]">
                    {/* 4 Corner Brackets (Biru / Ungu saat pending / Kuning saat waiting approval) */}
                    <div
                      className={`absolute top-0 left-0 w-6 h-6 border-t-[3px] border-l-[3px] ${
                        isPendingRegistration
                          ? "border-purple-300"
                          : isWaitingApproval
                          ? "border-amber-400"
                          : terminalQrCopy
                          ? "border-slate-300"
                          : "border-[#2563EB]"
                      } rounded-tl-lg pointer-events-none`}
                    />
                    <div
                      className={`absolute top-0 right-0 w-6 h-6 border-t-[3px] border-r-[3px] ${
                        isPendingRegistration
                          ? "border-purple-300"
                          : isWaitingApproval
                          ? "border-amber-400"
                          : terminalQrCopy
                          ? "border-slate-300"
                          : "border-[#2563EB]"
                      } rounded-tr-lg pointer-events-none`}
                    />
                    <div
                      className={`absolute bottom-0 left-0 w-6 h-6 border-b-[3px] border-l-[3px] ${
                        isPendingRegistration
                          ? "border-purple-300"
                          : isWaitingApproval
                          ? "border-amber-400"
                          : terminalQrCopy
                          ? "border-slate-300"
                          : "border-[#2563EB]"
                      } rounded-bl-lg pointer-events-none`}
                    />
                    <div
                      className={`absolute bottom-0 right-0 w-6 h-6 border-b-[3px] border-r-[3px] ${
                        isPendingRegistration
                          ? "border-purple-300"
                          : isWaitingApproval
                          ? "border-amber-400"
                          : terminalQrCopy
                          ? "border-slate-300"
                          : "border-[#2563EB]"
                      } rounded-br-lg pointer-events-none`}
                    />

                    {/* QR Image atau State Pending / Loading */}
                    {isPendingRegistration ? (
                      <div className="flex flex-col items-center justify-center text-center p-3 sm:p-4 my-2 lg:p-2 lg:my-0">
                        <div className="w-16 h-16 lg:w-12 lg:h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mb-3 lg:mb-2 ring-4 ring-purple-100/60 shadow-xs">
                          <Lock size={28} className="stroke-[2.2]" />
                        </div>
                        <span className="text-xs font-bold text-slate-800 tracking-wide uppercase">
                          QR Code Belum Terbit
                        </span>
                        <p className="text-[0.68rem] text-slate-500 max-w-[210px] mt-1.5 leading-relaxed font-normal">
                          QR Code akses akan terbit otomatis setelah tamu melengkapi formulir registrasi mandiri, persetujuan K3 & NDA.
                        </p>
                      </div>
                    ) : isWaitingApproval ? (
                      <div className="flex flex-col items-center justify-center text-center p-3 sm:p-4 my-2 lg:p-2 lg:my-0">
                        <div className="w-16 h-16 lg:w-12 lg:h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-3 lg:mb-2 ring-4 ring-amber-100/60 shadow-xs">
                          <Lock size={28} className="stroke-[2.2]" />
                        </div>
                        <span className="text-xs font-bold text-slate-800 tracking-wide uppercase">
                          Menunggu Persetujuan
                        </span>
                        <p className="text-[0.68rem] text-slate-500 max-w-[210px] mt-1.5 leading-relaxed font-normal">
                          Formulir registrasi telah diterima. QR Code akses akan aktif setelah diverifikasi dan disetujui petugas data center.
                        </p>
                      </div>
                    ) : terminalQrCopy && terminalQrReason && TerminalQrIcon ? (
                      <div
                        className="flex flex-col items-center justify-center text-center p-3 sm:p-4 my-2 lg:p-2 lg:my-0"
                        role="status"
                        data-qr-state={terminalQrReason}
                      >
                        <div
                          className={`w-16 h-16 lg:w-12 lg:h-12 rounded-2xl flex items-center justify-center mb-3 lg:mb-2 ring-4 shadow-xs ${TERMINAL_QR_STYLE[terminalQrReason].box}`}
                        >
                          <TerminalQrIcon size={28} className="stroke-[2.2]" />
                        </div>
                        <span className="text-xs font-bold text-slate-800 tracking-wide uppercase">
                          {terminalQrCopy.title}
                        </span>
                        <p className="text-[0.68rem] text-slate-500 max-w-[210px] mt-1.5 leading-relaxed font-normal">
                          {terminalQrCopy.description}
                        </p>
                      </div>
                    ) : isLoadingQr ? (
                      <div className="flex flex-col items-center justify-center gap-2 text-slate-400 py-10">
                        <div className="w-8 h-8 border-3 border-amber-500 border-t-transparent rounded-full animate-spin" />
                        <span className="text-xs">Memuat QR...</span>
                      </div>
                    ) : (
                      <img
                        src={qrDataUri ?? undefined}
                        alt={`QR Pass ${passNumber}`}
                        className="w-44 h-44 sm:w-48 sm:h-48 lg:w-40 lg:h-40 object-contain"
                      />
                    )}
                  </div>
                </div>

                {/* Teks Instruksi di Bawah QR */}
                <p className="text-[0.7rem] sm:text-[0.72rem] text-slate-500 text-center font-medium mt-1 mb-3.5 lg:mb-2.5 max-w-[260px] leading-relaxed">
                  {isPendingRegistration
                    ? "Tamu wajib mengisi data melalui tautan undangan sebelum jadwal kunjungan"
                    : isWaitingApproval
                    ? "Tiket QR resmi akan dikirimkan ke email tamu setelah disetujui petugas"
                    : terminalQrCopy
                    ? "Tiket ini tidak dapat digunakan untuk akses masuk fasilitas"
                    : "Tunjukkan QR Code ini ke petugas pemindai di pos jaga data center"}
                </p>

                {/* ── Status Banner (Kuning / Ungu saat pending registration / pending approval) ── */}
                {isPendingRegistration ? (
                  <div className="w-full bg-purple-50/80 border border-purple-200/90 rounded-2xl px-3.5 py-2.5 flex items-center justify-between text-xs mb-4 lg:mb-3 shadow-2xs">
                    <div className="flex items-center gap-2 text-purple-700 font-bold text-[0.72rem] sm:text-xs">
                      <Clock size={15} className="text-purple-600 shrink-0" />
                      <span>Status Registrasi:</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-purple-700 font-semibold text-[0.72rem] sm:text-xs">
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse mr-0.5" />
                      <span>Menunggu Formulir Tamu</span>
                    </div>
                  </div>
                ) : isWaitingApproval ? (
                  <div className="w-full bg-amber-50/80 border border-amber-200/90 rounded-2xl px-3.5 py-2.5 flex items-center justify-between text-xs mb-4 lg:mb-3 shadow-2xs">
                    <div className="flex items-center gap-2 text-amber-800 font-bold text-[0.72rem] sm:text-xs">
                      <Clock size={15} className="text-amber-600 shrink-0" />
                      <span>Status Verifikasi:</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-amber-800 font-semibold text-[0.72rem] sm:text-xs">
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse mr-0.5" />
                      <span>Menunggu Approval Operator</span>
                    </div>
                  </div>
                ) : currentStatus === "completed" || currentStatus === "cancelled" || currentStatus === "denied" ? null : (
                  <div className="w-full bg-[#FFFBEB] border border-[#FDE68A] rounded-2xl px-3.5 py-2.5 flex items-center justify-between text-xs mb-4 lg:mb-3 shadow-2xs">
                    <div className="flex items-center gap-2 text-[#B45309] font-bold text-[0.72rem] sm:text-xs">
                      <Clock size={15} className="text-[#D97706] shrink-0" />
                      <span>Sisa Waktu Berlaku:</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[#B45309] font-semibold text-[0.72rem] sm:text-xs">
                      <span>{timeLeftString || "Masa berlaku habis"}</span>
                      {onRefreshTime && (
                        <button
                          type="button"
                          onClick={onRefreshTime}
                          aria-label="Refresh sisa waktu"
                          className="p-1 hover:bg-amber-100 rounded-full text-[#B45309] transition-colors cursor-pointer"
                        >
                          <RotateCw size={12} />
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* ── Informasi Pengunjung ── */}
                <div className="w-full bg-[#F8FAFC] rounded-2xl p-4 sm:p-4.5 lg:p-3.5 border border-slate-100 flex flex-col gap-3 lg:gap-2.5 mb-4 lg:mb-0 shadow-2xs">
                  {/* Header Pengunjung: Avatar & Nama */}
                  <div className="flex items-center gap-3 pb-3 border-b border-slate-200/70">
                    <div className="w-10 h-10 rounded-full bg-[#1E5BF0] text-white flex items-center justify-center shrink-0 shadow-sm">
                      <User size={20} className="stroke-[2.2]" />
                    </div>
                    <div className="flex flex-col text-left overflow-hidden">
                      <span className="text-[0.62rem] font-bold text-slate-400 tracking-wider uppercase leading-none mb-1">
                        NAMA PENGUNJUNG
                      </span>
                      <h3 className="text-sm font-extrabold text-slate-900 leading-tight truncate">
                        {visitorName}
                      </h3>
                      {visitorCompany && (
                        <span className="text-xs text-slate-500 font-medium truncate mt-0.5">
                          {visitorCompany}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* List Detail (Flex / Grid Rapi) */}
                  <div className="flex flex-col gap-2.5 text-xs text-left">
                    {/* Customer Penjamin (CRM) */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 text-slate-500 shrink-0">
                        <Briefcase size={14} className="text-[#1E5BF0] shrink-0" />
                        <span className="text-[0.72rem] sm:text-xs">Customer Penjamin (CRM)</span>
                      </div>
                      <span className="font-bold text-slate-800 text-right truncate max-w-[170px] sm:max-w-[190px]">
                        {customerName}
                      </span>
                    </div>

                    {/* Lokasi */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 text-slate-500 shrink-0">
                        <MapPin size={14} className="text-[#1E5BF0] shrink-0" />
                        <span className="text-[0.72rem] sm:text-xs">Lokasi</span>
                      </div>
                      <span className="font-bold text-slate-800 text-right truncate max-w-[170px] sm:max-w-[190px]">
                        {siteName}
                      </span>
                    </div>

                    {/* Akses Rak - Teks Kuning / Oranye Tebal */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 text-slate-500 shrink-0">
                        <Server size={14} className="text-[#1E5BF0] shrink-0" />
                        <span className="text-[0.72rem] sm:text-xs">Akses Rak</span>
                      </div>
                      <span className="font-bold text-[#F59E0B] text-right truncate max-w-[170px] sm:max-w-[190px]">
                        {rackDisplay}
                      </span>
                    </div>

                    {/* Keperluan */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 text-slate-500 shrink-0">
                        <UserCheck size={14} className="text-[#1E5BF0] shrink-0" />
                        <span className="text-[0.72rem] sm:text-xs">Keperluan</span>
                      </div>
                      <span className="font-bold text-slate-800 text-right truncate max-w-[170px] sm:max-w-[190px]">
                        {purpose}
                      </span>
                    </div>
                  </div>
                </div>

                {/* ── SOP Keselamatan Fasilitas (Tampil di dalam kartu pada layar Mobile saja) ── */}
                <div className="block lg:hidden w-full bg-[#F0F7FF] border border-[#BFDBFE] rounded-2xl p-3.5 sm:p-4 text-left shadow-2xs">
                  <div className="flex items-center gap-2 text-[#1E5BF0] mb-2">
                    <ShieldCheck size={15} className="shrink-0 stroke-[2.2]" />
                    <h4 className="text-xs font-bold text-[#1E3A8A]">
                      SOP Keselamatan Fasilitas
                    </h4>
                  </div>
                  <ul className="space-y-1.5 text-[0.7rem] sm:text-[0.72rem] text-slate-600 leading-relaxed">
                    <li className="flex items-start gap-2">
                      <span className="text-[#1E5BF0] font-bold shrink-0 mt-0.5">•</span>
                      <span>Wajib mengenakan kartu visitor fisik selama berada di dalam.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-[#1E5BF0] font-bold shrink-0 mt-0.5">•</span>
                      <span>Dilarang menyentuh kabel/perangkat selain rak tujuan.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-[#1E5BF0] font-bold shrink-0 mt-0.5">•</span>
                      <span>Dilarang mengambil foto tanpa izin resmi tertulis dari NOC.</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* ═════════ TICKET NOTCHES & DASHED BORDER ═════════ */}
              <div className="relative py-2.5 -mx-1 overflow-hidden select-none">
                {/* Left Inward Semi-circle Cutout */}
                <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 w-7 h-7 rounded-full bg-[#071A34] shadow-inner z-20 pointer-events-none" />

                {/* Dashed Perforation Line */}
                <div className="border-t-2 border-dashed border-slate-300 w-full z-10" />

                {/* Right Inward Semi-circle Cutout */}
                <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-7 h-7 rounded-full bg-[#071A34] shadow-inner z-20 pointer-events-none" />
              </div>

              {/* ═════════ AREA FOOTER TIKET (BAWAH GARIS PUTUS-PUTUS) ═════════ */}
              <div className="px-5 pb-5 pt-2 sm:px-6 sm:pb-6 lg:pb-5">
                <div className="grid grid-cols-2 gap-3">
                  {/* Tombol Cancel */}
                  <button
                    type="button"
                    onClick={onCancel}
                    className="w-full py-3 lg:py-2.5 px-3 bg-white hover:bg-rose-50 text-rose-500 border border-rose-200 text-xs sm:text-sm font-bold rounded-xl transition-all shadow-2xs hover:border-rose-300 cursor-pointer text-center"
                  >
                    Cancel
                  </button>

                  {/* Tombol Download */}
                  <button
                    type="button"
                    onClick={onDownload}
                    disabled={isDownloading || !isQrUsable}
                    title={
                      isPendingRegistration
                        ? "QR Code belum tersedia karena tamu belum registrasi"
                        : isWaitingApproval
                        ? "QR Code belum aktif karena menunggu persetujuan operator"
                        : terminalQrCopy
                        ? terminalQrCopy.description
                        : "Download Tiket Pass"
                    }
                    className="w-full py-3 lg:py-2.5 px-3 bg-[#F59E0B] hover:bg-amber-600 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs sm:text-sm font-bold rounded-xl transition-all shadow-sm hover:shadow flex items-center justify-center gap-1.5 cursor-pointer text-center"
                  >
                    <Download size={15} className="stroke-[2.2]" />
                    <span>
                      {isPendingRegistration || isWaitingApproval
                        ? "QR Belum Terbit"
                        : terminalQrCopy
                        ? terminalQrCopy.buttonLabel
                        : "Download"}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ═════════ FOOTER BRANDING DI LUAR KARTU PUTIH (MOBILE ONLY) ═════════ */}
      <div className="block lg:hidden w-full pt-4 pb-1 text-center flex items-center justify-center gap-1 text-[0.68rem] text-slate-400 font-medium relative z-10">
        <MapPin size={12} className="text-slate-400 shrink-0" />
        <span>Micro Scale Data Center • Surabaya, Indonesia</span>
      </div>
    </div>
  );
};

