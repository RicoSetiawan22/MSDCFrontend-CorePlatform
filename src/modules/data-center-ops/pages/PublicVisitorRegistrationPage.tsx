import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ShieldCheck,
  User,
  Building2,
  Calendar,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Phone,
  QrCode,
  Shield,
  Clock,
  Mail,
  Wrench,
  Users,
  Plus,
  Trash2,
  AlertTriangle,
  Server,
  Layers,
  Headphones,
} from "lucide-react";
import { useVisitorInvitation, useSubmitVisitorRegistration } from "../api/useVisitorPass";
import { getApiErrorMessage } from "@shared/lib/api-client";
import type { VisitorIdentityType, AdditionalVisitor } from "../types/visitorPass";

// Backoff polling saat menunggu persetujuan operator, berdasarkan jumlah fetch sukses:
// 12 x 5 dtk ≈ menit pertama, lalu 16 x 15 dtk ≈ s.d. menit ke-5, sesudahnya tiap 30 dtk.
const FAST_POLL_LIMIT = 12;
const MEDIUM_POLL_LIMIT = 28;

export const PublicVisitorRegistrationPage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();

  // 1. Taruh state ini DI ATAS sebelum useVisitorInvitation dipanggil untuk menghindari Temporal Dead Zone (TDZ)
  const [isSuccess, setIsSuccess] = useState(false);
  const [countdown, setCountdown] = useState<number>(5);
  const [isRedirectPaused, setIsRedirectPaused] = useState<boolean>(false);

  // 2. Hook data invitation dengan polling aktif saat status registered atau baru saja submit
  const {
    data: invitation,
    isLoading,
    isError,
    error: invitationError,
  } = useVisitorInvitation(token, {
    refetchInterval: (query) => {
      // Tautan dibatalkan / tidak valid (mis. 404): hentikan polling. Data lama ('registered')
      // tetap tersimpan di cache saat refetch gagal, jadi error harus dicek lebih dulu.
      if (query.state.error || query.state.status === "error") return false;

      const data = query.state.data;
      const status = data?.status;
      const isApproved =
        status === "approved" ||
        status === "scheduled" ||
        status === "active_in_facility" ||
        Boolean(data?.is_approved);

      if (isApproved) return false;
      if (status === "registered" || isSuccess) {
        const updateCount = query.state.dataUpdateCount ?? 0;
        if (updateCount > MEDIUM_POLL_LIMIT) return 30000;
        if (updateCount > FAST_POLL_LIMIT) return 15000;
        return 5000;
      }
      return false;
    },
  });
  const submitMutation = useSubmitVisitorRegistration(token || "");

  // Form states
  const [visitorName, setVisitorName] = useState("");
  const [identityType, setIdentityType] = useState<VisitorIdentityType>("ktp");
  const [identityNumber, setIdentityNumber] = useState("");
  const [visitorCompany, setVisitorCompany] = useState("");
  const [visitorPhone, setVisitorPhone] = useState("");
  const [visitorEmail, setVisitorEmail] = useState("");
  const [purpose, setPurpose] = useState("Maintenance / Kunjungan Teknis");
  const [equipmentBroughtIn, setEquipmentBroughtIn] = useState("");

  // Schedule states
  const [plannedCheckInAt, setPlannedCheckInAt] = useState("");
  const [plannedCheckOutAt, setPlannedCheckOutAt] = useState("");

  // Teknisi pendamping / rekan kerja
  const [additionalVisitors, setAdditionalVisitors] = useState<AdditionalVisitor[]>([]);

  // NDA & Error handling
  const [agreeRegulations, setAgreeRegulations] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Inisialisasi default schedule dan email saat data undangan termuat
  useEffect(() => {
    if (!invitation) return;

    if (invitation.recipient_email && !visitorEmail) {
      setVisitorEmail(invitation.recipient_email);
    }

    if (invitation.allowed_start_date) {
      // Tanggal lokal perangkat (bukan UTC dari toISOString) agar tamu yang mengisi dini hari WIB
      // tidak mendapat tanggal kemarin sebagai default.
      const now = new Date();
      const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(
        now.getDate()
      ).padStart(2, "0")}`;
      const targetDate =
        todayStr >= invitation.allowed_start_date && todayStr <= invitation.allowed_end_date
          ? todayStr
          : invitation.allowed_start_date;

      if (!plannedCheckInAt) {
        setPlannedCheckInAt(`${targetDate}T09:00`);
      }
      if (!plannedCheckOutAt) {
        setPlannedCheckOutAt(`${targetDate}T17:00`);
      }
    }
  }, [invitation]);

  // Tiket sudah disetujui operator -> token E-Badge tujuan auto-redirect (null bila belum siap)
  const isInvitationApproved = Boolean(
    invitation &&
      (invitation.status === "approved" ||
        invitation.status === "scheduled" ||
        invitation.status === "active_in_facility" ||
        Boolean((invitation as any)?.is_approved))
  );
  // Token E-Badge baru terbit setelah operator approve, dan sampai ke halaman ini lewat polling invitation
  const approvedBadgeToken = isInvitationApproved ? invitation?.public_url_token || null : null;
  const isCountdownDone = countdown === 0;

  // Timer countdown. Updater HARUS murni: StrictMode / concurrent rendering boleh menjalankannya
  // lebih dari sekali, jadi tidak ada navigate() atau efek samping lain di dalamnya.
  useEffect(() => {
    if (!approvedBadgeToken || isRedirectPaused || isCountdownDone) return;

    const timer = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [approvedBadgeToken, isRedirectPaused, isCountdownDone]);

  // Auto-redirect sebagai efek terpisah: berjalan sekali saat countdown mencapai 0
  const hasAutoRedirectedRef = useRef(false);
  useEffect(() => {
    if (isCountdownDone && approvedBadgeToken && !isRedirectPaused && !hasAutoRedirectedRef.current) {
      hasAutoRedirectedRef.current = true;
      navigate(`/visitor-pass/${approvedBadgeToken}`);
    }
  }, [isCountdownDone, approvedBadgeToken, isRedirectPaused, navigate]);

  // Batas rentang tanggal izin kunjungan
  const minDateTime = invitation?.allowed_start_date
    ? `${invitation.allowed_start_date}T00:00`
    : undefined;
  const maxDateTime = invitation?.allowed_end_date
    ? `${invitation.allowed_end_date}T23:59`
    : undefined;

  // Format tanggal Indonesia
  const formatIndoDate = (dateStr?: string | null) => {
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const formatIndoDateTime = (dateStr?: string | null) => {
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const dateFormatted = d.toLocaleDateString("id-ID", {
      day: "numeric",
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

  // Helper Teknisi Pendamping
  const handleAddVisitor = () => {
    setAdditionalVisitors((prev) => [
      ...prev,
      { name: "", identity_type: "ktp", identity_number: "", phone: "" },
    ]);
  };

  const handleRemoveVisitor = (index: number) => {
    setAdditionalVisitors((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpdateVisitor = (
    index: number,
    field: keyof AdditionalVisitor,
    value: string
  ) => {
    setAdditionalVisitors((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Validasi field utama
    if (!visitorName.trim()) {
      setErrorMessage("Nama lengkap pengunjung sesuai kartu identitas wajib diisi.");
      return;
    }
    if (!identityNumber.trim()) {
      setErrorMessage(`Nomor identitas (${identityType.toUpperCase()}) wajib diisi.`);
      return;
    }
    if (!visitorPhone.trim()) {
      setErrorMessage("Nomor HP / WhatsApp aktif wajib diisi.");
      return;
    }
    if (visitorEmail.trim() && !visitorEmail.includes("@")) {
      setErrorMessage("Format email pengunjung tidak valid.");
      return;
    }

    // Validasi jadwal kunjungan
    if (!plannedCheckInAt) {
      setErrorMessage("Tanggal dan jam rencana kedatangan wajib diisi.");
      return;
    }
    if (!plannedCheckOutAt) {
      setErrorMessage("Estimasi jam selesai kunjungan wajib diisi.");
      return;
    }
    if (new Date(plannedCheckOutAt) <= new Date(plannedCheckInAt)) {
      setErrorMessage("Estimasi jam selesai harus lebih lambat dari rencana jam kedatangan.");
      return;
    }
    if (minDateTime && plannedCheckInAt < minDateTime) {
      setErrorMessage(
        `Rencana kedatangan tidak boleh lebih awal dari jendela izin (${formatIndoDate(
          invitation?.allowed_start_date
        )}).`
      );
      return;
    }
    if (maxDateTime && plannedCheckOutAt > maxDateTime) {
      setErrorMessage(
        `Estimasi selesai tidak boleh melewati batas akhir izin (${formatIndoDate(
          invitation?.allowed_end_date
        )}).`
      );
      return;
    }

    // Validasi teknisi pendamping jika diisi sebagian
    for (let i = 0; i < additionalVisitors.length; i++) {
      const adv = additionalVisitors[i];
      if (!adv.name.trim() || !adv.identity_number.trim()) {
        setErrorMessage(
          `Mohon lengkapi Nama dan No Identitas untuk Teknisi Pendamping #${i + 1}.`
        );
        return;
      }
    }

    if (!agreeRegulations) {
      setErrorMessage("Anda harus menyetujui standar keamanan dan kerahasiaan data center (NDA).");
      return;
    }

    try {
      await submitMutation.mutateAsync({
        planned_check_in_at: new Date(plannedCheckInAt).toISOString(),
        planned_check_out_at: new Date(plannedCheckOutAt).toISOString(),
        visitor_name: visitorName.trim(),
        visitor_identity_type: identityType,
        visitor_identity_number: identityNumber.trim(),
        visitor_company: visitorCompany.trim() || undefined,
        visitor_phone: visitorPhone.trim(),
        visitor_email: visitorEmail.trim() || undefined,
        purpose: purpose.trim(),
        equipment_brought_in: equipmentBroughtIn.trim() || undefined,
        additional_visitors:
          additionalVisitors.length > 0
            ? additionalVisitors.map((v) => ({
                name: v.name.trim(),
                identity_type: v.identity_type,
                identity_number: v.identity_number.trim(),
                phone: v.phone?.trim() || undefined,
              }))
            : undefined,
        safety_nda_agreed: true,
      });

      // Status kini 'registered': token E-Badge belum terbit sampai operator approve (ditangkap lewat polling)
      setIsSuccess(true);
    } catch (err: any) {
      // Tampilkan pesan error asli dari backend jika tersedia
      const backendMessage =
        err?.response?.data?.message ||
        getApiErrorMessage(
          err,
          "Gagal melengkapi formulir registrasi. Silakan periksa kembali data Anda."
        );
      setErrorMessage(backendMessage);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 text-white font-sans">
        <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-semibold tracking-wide text-slate-300">
          Memuat Informasi Undangan Kunjungan Data Center...
        </p>
      </div>
    );
  }

  if (isError || !invitation) {
    const initialErrorMsg =
      (invitationError as any)?.response?.data?.message ||
      getApiErrorMessage(
        invitationError,
        "Tautan registrasi ini mungkin telah kedaluwarsa, telah dibatalkan oleh operator data center, atau nomor token salah."
      );

    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 text-white font-sans">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mb-4">
          <AlertCircle size={32} />
        </div>
        <h1 className="text-lg font-bold text-white mb-2">Tautan Undangan Tidak Valid</h1>
        <p className="text-xs text-slate-400 text-center max-w-md leading-relaxed mb-6">
          {initialErrorMsg}
        </p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-xs font-semibold rounded-xl border border-slate-700 transition-colors cursor-pointer"
        >
          Muat Ulang Halaman
        </button>
      </div>
    );
  }

  // ── 1. STATUS POLLING & EVALUASI STATUS APPROVAL ──
  const isAlreadyApproved = Boolean(
    invitation &&
      (invitation.status === "approved" ||
        invitation.status === "scheduled" ||
        invitation.status === "active_in_facility" ||
        Boolean((invitation as any)?.is_approved))
  );

  const isAwaitingApproval =
    !isAlreadyApproved && Boolean(isSuccess || invitation.status === "registered");

  // ── STATE 1: SUDAH DISETUJUI OPERATOR (APPROVED / SCHEDULED) ──
  if (isAlreadyApproved) {
    const publicUrlToken = invitation.public_url_token;

    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-between font-sans">
        {/* Sticky Brand Header */}
        <header className="lg:sticky lg:top-0 lg:z-30 bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80 px-4 sm:px-6 md:px-8 py-3.5 sm:py-4 shadow-lg shadow-black/20">
          <div className="w-full max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
            <div className="flex items-center gap-3.5">
              <img
                src="/images/logo.png"
                alt="MSDC Surabaya"
                className="h-9 sm:h-10 w-auto object-contain filter drop-shadow-sm"
              />
              <div>
                <h1 className="text-sm sm:text-base font-black text-white tracking-wide">
                  MICRO SCALE DATA CENTER
                </h1>
                <p className="text-xs text-slate-400">
                  Visitor Access Control & Physical Security Portal
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* Konten Sukses Disetujui */}
        <main className="flex-1 flex items-center justify-center p-4 sm:p-6 my-auto">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-7 sm:p-8 text-center shadow-2xl relative overflow-hidden">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto mb-4 shadow-sm">
              <CheckCircle2 size={36} />
            </div>

            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[0.68rem] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-400/30 mb-2">
              <CheckCircle2 size={13} className="text-emerald-400" />
              TERVERIFIKASI & DISETUJUI
            </span>

            <h2 className="text-xl font-black text-white tracking-tight">
              Izin Kunjungan Anda Telah Disetujui!
            </h2>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Izin akses fasilitas Anda telah disetujui oleh tim operasional Data Center MSDC Surabaya. Silakan buka E-Badge untuk verifikasi pos jaga.
            </p>

            {/* Ringkasan Tiket */}
            <div className="my-5 p-5 bg-slate-800/80 border border-slate-700/60 rounded-2xl text-left shadow-inner space-y-2">
              <div>
                <div className="text-[0.65rem] text-slate-400 font-bold uppercase tracking-wider">
                  Nomor Tiket Izin Kunjungan
                </div>
                <div className="text-base font-mono font-black text-amber-400 mt-0.5">
                  {invitation.pass_number}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-700/50 space-y-1.5 text-xs">
                <div className="flex justify-between items-start gap-2">
                  <span className="text-slate-400">Pengunjung:</span>
                  <span className="text-slate-200 font-semibold text-right">
                    {invitation.visitor_name || visitorName || "Tamu Terdaftar"}
                  </span>
                </div>
                <div className="flex justify-between items-start gap-2">
                  <span className="text-slate-400">Perusahaan:</span>
                  <span className="text-slate-300 text-right">
                    {invitation.visitor_company ||
                      visitorCompany ||
                      invitation.customer?.company_name ||
                      "-"}
                  </span>
                </div>
                <div className="flex justify-between items-start gap-2">
                  <span className="text-slate-400">Fasilitas:</span>
                  <span className="text-slate-300 text-right">
                    {invitation.site?.site_name || "Data Center MSDC Surabaya"}
                  </span>
                </div>
                {invitation.room?.room_name && (
                  <div className="flex justify-between items-start gap-2">
                    <span className="text-slate-400">Ruangan:</span>
                    <span className="text-slate-300 text-right font-medium">
                      {invitation.room.room_name}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {publicUrlToken ? (
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => navigate(`/visitor-pass/${publicUrlToken}`)}
                  className="w-full py-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold text-sm rounded-xl shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <QrCode size={18} />
                  <span>Buka E-Badge QR Code Saya</span>
                  <ArrowRight size={16} />
                </button>

                {!isRedirectPaused ? (
                  <div className="flex items-center justify-between px-3.5 py-2.5 bg-slate-950/70 border border-slate-800 rounded-xl text-[0.72rem] text-slate-400">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      Dialihkan otomatis dalam <strong className="text-amber-400 font-mono font-bold text-xs">{countdown}</strong> detik...
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsRedirectPaused(true)}
                      className="text-amber-400 hover:text-amber-300 underline font-medium text-[0.68rem] cursor-pointer"
                    >
                      Batal Pengalihan
                    </button>
                  </div>
                ) : (
                  <p className="text-[0.68rem] text-slate-500">
                    Pengalihan otomatis dijeda. Silakan klik tombol di atas untuk membuka tiket.
                  </p>
                )}
              </div>
            ) : (
              <div className="text-xs text-slate-400 italic">
                QR Code tiket telah dikirimkan ke email Anda. Silakan tunjukkan saat tiba di pos jaga.
              </div>
            )}
          </div>
        </main>

        <footer className="mt-8 text-center text-xs text-slate-500 font-sans pb-4">
          &copy; {new Date().getFullYear()} MICRO SCALE DATA CENTER. All access is logged and
          monitored 24/7 under ISO/IEC 27001 Compliance.
        </footer>
      </div>
    );
  }

  // ── STATE 2: MENUNGGU PERSETUJUAN OPERATOR (STATUS REGISTERED) ──
  if (isAwaitingApproval) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-between font-sans">
        {/* Sticky Brand Header */}
        <header className="lg:sticky lg:top-0 lg:z-30 bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80 px-4 sm:px-6 md:px-8 py-3.5 sm:py-4 shadow-lg shadow-black/20">
          <div className="w-full max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
            <div className="flex items-center gap-3.5">
              <img
                src="/images/logo.png"
                alt="MSDC Surabaya"
                className="h-9 sm:h-10 w-auto object-contain filter drop-shadow-sm"
              />
              <div>
                <h1 className="text-sm sm:text-base font-black text-white tracking-wide">
                  MICRO SCALE DATA CENTER
                </h1>
                <p className="text-xs text-slate-400">
                  Visitor Access Control & Physical Security Portal
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* Konten Menunggu Verifikasi */}
        <main className="flex-1 flex items-center justify-center p-4 sm:p-6 my-auto">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 text-center shadow-2xl relative overflow-hidden">
            {/* Ambient Glow Amber */}
            <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-48 h-48 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />

            {/* Ikon Jam / Verifikasi Animasi */}
            <div className="w-16 h-16 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto mb-4 shadow-sm relative">
              <Clock size={34} />
              <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-amber-500"></span>
              </span>
            </div>

            {/* Pesan Utama */}
            <h2 className="text-xl font-black text-white tracking-tight">
              {isSuccess
                ? "Pendaftaran Kunjungan Berhasil Dikirim"
                : "Pendaftaran Sedang Diverifikasi"}
            </h2>
            <p className="text-xs text-slate-300 mt-2.5 leading-relaxed font-normal">
              Pendaftaran Anda telah tersimpan dan sedang diverifikasi oleh petugas pos jaga data center. Halaman ini akan otomatis berganti ke QR Code setelah disetujui.
            </p>

            {/* Kartu Status Ringkas */}
            <div className="my-5 p-5 bg-slate-800/80 border border-slate-700/60 rounded-2xl text-left shadow-inner space-y-2.5">
              {/* Nomor Tiket Izin Kunjungan */}
              <div>
                <div className="text-[0.65rem] text-slate-400 font-bold uppercase tracking-wider">
                  Nomor Tiket Izin Kunjungan
                </div>
                <div className="text-base font-mono font-black text-amber-400 mt-0.5">
                  {invitation.pass_number}
                </div>
              </div>

              <div className="pt-2.5 border-t border-slate-700/50 space-y-2 text-xs">
                {/* Nama Tamu & Perusahaan */}
                <div className="flex justify-between items-start gap-2">
                  <span className="text-slate-400">Nama Pengunjung:</span>
                  <span className="text-slate-200 font-semibold text-right">
                    {invitation.visitor_name || visitorName || "Tamu Terdaftar"}
                  </span>
                </div>
                <div className="flex justify-between items-start gap-2">
                  <span className="text-slate-400">Instansi / Perusahaan:</span>
                  <span className="text-slate-300 text-right">
                    {invitation.visitor_company ||
                      visitorCompany ||
                      invitation.customer?.company_name ||
                      "-"}
                  </span>
                </div>

                {/* Fasilitas & Ruangan yang dituju */}
                <div className="flex justify-between items-start gap-2">
                  <span className="text-slate-400">Fasilitas Data Center:</span>
                  <span className="text-slate-300 text-right font-medium">
                    {invitation.site?.site_name || "Data Center MSDC Surabaya"}
                  </span>
                </div>
                <div className="flex justify-between items-start gap-2">
                  <span className="text-slate-400">Ruangan Dituju:</span>
                  <span className="text-slate-300 text-right font-medium">
                    {invitation.room?.room_name || (invitation as any)?.room_name || "Fasilitas Utama Data Center"}
                  </span>
                </div>

                {/* Waktu Rencana Kedatangan */}
                {(plannedCheckInAt || invitation.planned_check_in_at) && (
                  <div className="flex justify-between items-start gap-2">
                    <span className="text-slate-400">Rencana Kedatangan:</span>
                    <span className="text-slate-300 text-right font-medium">
                      {formatIndoDateTime(plannedCheckInAt || invitation.planned_check_in_at)}
                    </span>
                  </div>
                )}
              </div>

              {/* Status: Badge kuning berkedip "MENUNGGU PERSETUJUAN OPERATOR" */}
              <div className="pt-2.5 border-t border-slate-700/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span className="text-[0.7rem] text-slate-400 font-medium">Status Izin:</span>
                <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-300 border border-amber-400/30 w-fit">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                  MENUNGGU PERSETUJUAN OPERATOR
                </span>
              </div>

              {(visitorEmail || invitation.recipient_email) && (
                <div className="text-[0.7rem] text-slate-400 pt-1 flex items-center gap-1.5">
                  <Mail size={13} className="text-sky-400 shrink-0" />
                  <span className="truncate">
                    Email konfirmasi: <strong>{visitorEmail || invitation.recipient_email}</strong>
                  </span>
                </div>
              )}
            </div>

            {/* Realtime Polling Status Indicator */}
            <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl text-[0.7rem] text-slate-400 flex items-center justify-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>Memeriksa status persetujuan secara realtime...</span>
            </div>

            {/* Notifikasi Tambahan SOP */}
            <div className="mt-3 p-3 bg-slate-800/40 border border-slate-700/40 rounded-xl text-[0.7rem] text-slate-400 leading-relaxed text-left flex items-start gap-2">
              <ShieldCheck size={16} className="text-emerald-400 shrink-0 mt-0.5" />
              <span>
                Anda tidak perlu mendaftar ulang. Harap membawa kartu identitas asli (KTP/Passport) saat datang ke data center setelah tiket disetujui.
              </span>
            </div>
          </div>
        </main>

        <footer className="mt-8 text-center text-xs text-slate-500 font-sans pb-4">
          &copy; {new Date().getFullYear()} MICRO SCALE DATA CENTER. All access is logged and
          monitored 24/7 under ISO/IEC 27001 Compliance.
        </footer>
      </div>
    );
  }

  // Alokasi Rak String
  const rackDisplay =
    invitation.target_racks && invitation.target_racks.length > 0
      ? invitation.target_racks
          .map((r) => r.code || r.rack_code || r.rack_name || `Rak ${r.id}`)
          .join(", ")
      : invitation.target_rack_ids && invitation.target_rack_ids.length > 0
      ? `Rak ID: ${invitation.target_rack_ids.join(", ")}`
      : "Seluruh Ruangan";

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between font-sans">
      {/* Sticky Brand Header */}
      <header className="lg:sticky lg:top-0 lg:z-30 bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80 px-4 sm:px-6 md:px-8 py-3.5 sm:py-4 shadow-lg shadow-black/20">
        <div className="w-full max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-3.5">
            <img
              src="/images/logo.png"
              alt="MSDC Surabaya"
              className="h-9 sm:h-10 w-auto object-contain filter drop-shadow-sm"
            />
            <div>
              <h1 className="text-sm sm:text-base font-black text-white tracking-wide">
                MICRO SCALE DATA CENTER
              </h1>
              <p className="text-xs text-slate-400">
                Visitor Access Control & Physical Security Portal
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-6 sm:py-8 flex-1">
        {/* ── 2-COLUMN GRID LAYOUT (DESKTOP: 5 / 7) ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* ════ KOLOM KIRI (lg:col-span-5) - STICKY SUMMARY & CONTEXT ════ */}
          <div className="lg:col-span-5 lg:sticky lg:top-24 flex flex-col gap-5">
            {/* Kartu Informasi Undangan */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />

              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="inline-flex items-center gap-1.5 text-[0.7rem] font-bold text-amber-400 tracking-wider uppercase">
                  <Calendar size={13} />
                  <span>Undangan Akses Fisik</span>
                </span>
                <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-amber-300">
                  {invitation.pass_number}
                </span>
              </div>

              <h2 className="text-base sm:text-lg font-black text-white">
                Detail Izin Masuk Data Center
              </h2>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Perizinan kunjungan resmi telah dialokasikan oleh perusahaan penjamin Anda. Harap tinjau alokasi ruangan dan rak sebelum melengkapi data registrasi.
              </p>

              {/* Grid Detail Alokasi Fasilitas & Waktu Izin */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mt-5 pt-4 border-t border-slate-800 text-xs">
                <div>
                  <span className="text-[0.68rem] text-slate-400 uppercase font-semibold flex items-center gap-1.5">
                    <Building2 size={13} className="text-slate-500" />
                    <span>Perusahaan Penjamin</span>
                  </span>
                  <div className="font-bold text-slate-200 mt-1 break-words">
                    {invitation.customer?.company_name ||
                      invitation.customer?.name ||
                      "Customer CRM"}
                  </div>
                </div>

                <div>
                  <span className="text-[0.68rem] text-slate-400 uppercase font-semibold flex items-center gap-1.5">
                    <Layers size={13} className="text-slate-500" />
                    <span>Lokasi Fasilitas</span>
                  </span>
                  <div className="font-bold text-slate-200 mt-1 break-words">
                    {invitation.site?.site_name || "Data Center MSDC Surabaya"}
                  </div>
                </div>

                <div>
                  <span className="text-[0.68rem] text-slate-400 uppercase font-semibold flex items-center gap-1.5">
                    <Server size={13} className="text-slate-500" />
                    <span>Ruangan Server</span>
                  </span>
                  <div className="font-bold text-slate-200 mt-1 break-words">
                    {invitation.room?.room_name || "Ruang Server Utama"}
                  </div>
                </div>

                <div>
                  <span className="text-[0.68rem] text-slate-400 uppercase font-semibold flex items-center gap-1.5">
                    <Server size={13} className="text-amber-500" />
                    <span>Akses Rak Diizinkan</span>
                  </span>
                  <div className="mt-1">
                    <span className="inline-block px-2.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 font-bold font-mono text-amber-300 text-xs">
                      {rackDisplay}
                    </span>
                  </div>
                </div>

                <div className="sm:col-span-2 pt-2 border-t border-slate-800/60">
                  <span className="text-[0.68rem] text-slate-400 uppercase font-semibold flex items-center gap-1.5">
                    <Calendar size={13} className="text-sky-400" />
                    <span>Rentang Tanggal Izin Masuk</span>
                  </span>
                  <div className="font-bold text-slate-200 mt-1 text-xs">
                    {formatIndoDate(invitation.allowed_start_date)} s.d.{" "}
                    {formatIndoDate(invitation.allowed_end_date)}
                  </div>
                </div>
              </div>
            </div>

            {/* Box Instruksi K3 & Keamanan Fisik */}
            <div className="p-4 sm:p-5 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex flex-col gap-2.5 text-xs text-amber-200 shadow-sm">
              <div className="flex items-center gap-2 text-amber-300 font-bold text-xs uppercase tracking-wider">
                <AlertTriangle size={16} className="text-amber-400 shrink-0" />
                <span>Instruksi Khusus & Standar K3</span>
              </div>

              {invitation.operator_instructions && (
                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-[0.75rem] text-amber-100 leading-relaxed font-medium">
                  {invitation.operator_instructions}
                </div>
              )}

              <ul className="space-y-1.5 text-[0.73rem] text-amber-100/90 leading-relaxed list-disc list-inside">
                <li>Wajib mengenakan kartu identitas visitor pass & sepatu tertutup / safety.</li>
                <li>Dilarang menyentuh rak, server, atau kabel selain yang dialokasikan.</li>
                <li>Dilarang mengambil foto/video di ruang server tanpa izin tertulis.</li>
              </ul>
            </div>

            {/* Kartu Bantuan & Kontak Pos Jaga */}
            <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-between gap-3 shadow-md">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center shrink-0">
                  <Headphones size={18} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Butuh Bantuan Registrasi?</h4>
                  <p className="text-[0.7rem] text-slate-400 mt-0.5">
                    Hubungi Pos Jaga Keamanan / NOC MSDC (24/7)
                  </p>
                </div>
              </div>
              <a
                href="tel:+623112345678"
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-sky-400 border border-sky-500/30 rounded-lg text-xs font-semibold shrink-0 transition-colors"
              >
                Hubungi
              </a>
            </div>
          </div>

          {/* ════ KOLOM KANAN (lg:col-span-7) - FORMULIR REGISTRASI INTERAKTIF ════ */}
          <div className="lg:col-span-7">
            <form
              onSubmit={handleSubmit}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl flex flex-col gap-6"
            >
              <div className="pb-4 border-b border-slate-800">
                <h3 className="text-base sm:text-lg font-black text-white">
                  Formulir Registrasi Mandiri Tamu
                </h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Lengkapi data pengunjung sesuai identitas resmi Anda (KTP/SIM/Paspor). Data ini akan diverifikasi oleh petugas keamanan sebelum E-Badge QR diterbitkan.
                </p>
              </div>

              {errorMessage && (
                <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-start gap-2.5 text-rose-300 text-xs animate-in fade-in">
                  <AlertCircle size={16} className="text-rose-400 shrink-0 mt-0.5" />
                  <div className="flex-1 font-medium">{errorMessage}</div>
                </div>
              )}

              {/* ════ SEKSI 1: WAKTU & JADWAL KUNJUNGAN ════ */}
              <div className="flex flex-col gap-3.5 pb-6 border-b border-slate-800 text-xs">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider">
                  <Clock size={15} />
                  <span>1. Rencana Waktu Kunjungan</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Rencana Jam Masuk */}
                  <div className="flex flex-col gap-1.5">
                    <label className="font-bold text-slate-300">
                      Rencana Kedatangan <span className="text-amber-400">*</span>
                    </label>
                    <input
                      type="datetime-local"
                      required
                      min={minDateTime}
                      max={maxDateTime}
                      value={plannedCheckInAt}
                      onChange={(e) => setPlannedCheckInAt(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all font-sans"
                    />
                  </div>

                  {/* Estimasi Jam Selesai */}
                  <div className="flex flex-col gap-1.5">
                    <label className="font-bold text-slate-300">
                      Estimasi Selesai (Check-Out) <span className="text-amber-400">*</span>
                    </label>
                    <input
                      type="datetime-local"
                      required
                      min={minDateTime}
                      max={maxDateTime}
                      value={plannedCheckOutAt}
                      onChange={(e) => setPlannedCheckOutAt(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all font-sans"
                    />
                  </div>
                </div>
                <span className="text-[0.7rem] text-slate-400">
                  * Jam kunjungan wajib berada di antara rentang izin ({formatIndoDate(invitation.allowed_start_date)} s.d. {formatIndoDate(invitation.allowed_end_date)}).
                </span>
              </div>

              {/* ════ SEKSI 2: IDENTITAS PENGUNJUNG UTAMA ════ */}
              <div className="flex flex-col gap-4 pb-6 border-b border-slate-800 text-xs">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider">
                  <User size={15} />
                  <span>2. Identitas Pengunjung Utama</span>
                </div>

                {/* Nama Lengkap */}
                <div className="flex flex-col gap-1.5">
                  <label className="font-bold text-slate-300">
                    Nama Lengkap Sesuai Kartu Identitas <span className="text-amber-400">*</span>
                  </label>
                  <div className="relative">
                    <User
                      size={15}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"
                    />
                    <input
                      type="text"
                      required
                      value={visitorName}
                      onChange={(e) => setVisitorName(e.target.value)}
                      placeholder="Contoh: Budi Santoso"
                      className="w-full pl-10 pr-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all"
                    />
                  </div>
                </div>

                {/* Tipe & Nomor Identitas */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="font-bold text-slate-300">Tipe ID</label>
                    <select
                      value={identityType}
                      onChange={(e) => setIdentityType(e.target.value as VisitorIdentityType)}
                      className="w-full px-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 cursor-pointer"
                    >
                      <option value="ktp">KTP</option>
                      <option value="sim">SIM</option>
                      <option value="passport">Paspor</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5 sm:col-span-2">
                    <label className="font-bold text-slate-300">
                      Nomor ID (NIK / Paspor) <span className="text-amber-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={identityNumber}
                      onChange={(e) => setIdentityNumber(e.target.value)}
                      placeholder="3578012345670003"
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all font-mono"
                    />
                  </div>
                </div>

                {/* Asal Perusahaan Pengunjung */}
                <div className="flex flex-col gap-1.5">
                  <label className="font-bold text-slate-300">
                    Perusahaan / Instansi Pengunjung
                  </label>
                  <div className="relative">
                    <Building2
                      size={15}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"
                    />
                    <input
                      type="text"
                      value={visitorCompany}
                      onChange={(e) => setVisitorCompany(e.target.value)}
                      placeholder="Contoh: PT Mitra Server Solusindo"
                      className="w-full pl-10 pr-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all"
                    />
                  </div>
                </div>

                {/* Nomor HP / WhatsApp & Email */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="font-bold text-slate-300">
                      No HP / WhatsApp Aktif <span className="text-amber-400">*</span>
                    </label>
                    <div className="relative">
                      <Phone
                        size={15}
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"
                      />
                      <input
                        type="tel"
                        required
                        value={visitorPhone}
                        onChange={(e) => setVisitorPhone(e.target.value)}
                        placeholder="081234567890"
                        className="w-full pl-10 pr-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="font-bold text-slate-300">
                      Email Pribadi Pengunjung
                    </label>
                    <div className="relative">
                      <Mail
                        size={15}
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"
                      />
                      <input
                        type="email"
                        value={visitorEmail}
                        onChange={(e) => setVisitorEmail(e.target.value)}
                        placeholder="budi@example.com"
                        className="w-full pl-10 pr-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all"
                      />
                    </div>
                  </div>
                </div>

                {/* Keperluan */}
                <div className="flex flex-col gap-1.5">
                  <label className="font-bold text-slate-300">
                    Keperluan / Aktivitas Kerja <span className="text-amber-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={purpose}
                    onChange={(e) => setPurpose(e.target.value)}
                    placeholder="Contoh: Penggantian PSU di Rak Server Kolokasi"
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all"
                  />
                </div>
              </div>

              {/* ════ SEKSI 3: DAFTAR ALAT / BARANG BAWAAN ════ */}
              <div className="flex flex-col gap-2 pb-6 border-b border-slate-800 text-xs">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider">
                  <Wrench size={15} />
                  <span>3. Peralatan Bawaan (Opsional)</span>
                </div>
                <label className="font-medium text-slate-400">
                  Sebutkan perangkat keras, toolkit, atau material yang dibawa masuk ke ruang data center
                </label>
                <textarea
                  rows={2}
                  value={equipmentBroughtIn}
                  onChange={(e) => setEquipmentBroughtIn(e.target.value)}
                  placeholder="Contoh: 1 unit server rackmount 2U, 1 set obeng presisi, 1 unit laptop Dell, 2 pcs patch cord Cat6"
                  className="w-full p-3.5 bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all resize-none leading-relaxed"
                />
              </div>

              {/* ════ SEKSI 4: TEKNISI PENDAMPING / ROMBONGAN ════ */}
              <div className="flex flex-col gap-3.5 pb-6 border-b border-slate-800 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider">
                    <Users size={15} />
                    <span>4. Teknisi Pendamping / Rekan Kerja ({additionalVisitors.length})</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddVisitor}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-400 border border-amber-500/30 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                  >
                    <Plus size={14} />
                    <span>Tambah Rekan</span>
                  </button>
                </div>

                {additionalVisitors.length === 0 ? (
                  <p className="text-[0.73rem] text-slate-500 italic py-1">
                    Tidak ada rekan kerja tambahan. Klik tombol di atas jika Anda datang bersama teknisi pendamping.
                  </p>
                ) : (
                  <div className="flex flex-col gap-3 mt-1">
                    {additionalVisitors.map((v, idx) => (
                      <div
                        key={idx}
                        className="p-4 bg-slate-950 border border-slate-800 rounded-xl flex flex-col gap-3 relative shadow-inner"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[0.7rem] font-bold text-slate-400 uppercase">
                            Rekan Kerja #{idx + 1}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveVisitor(idx)}
                            className="text-rose-400 hover:text-rose-300 p-1.5 rounded-lg hover:bg-rose-500/10 transition-colors cursor-pointer"
                            title="Hapus rekan kerja"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <input
                            type="text"
                            placeholder="Nama Lengkap Sesuai ID *"
                            value={v.name}
                            onChange={(e) => handleUpdateVisitor(idx, "name", e.target.value)}
                            className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 text-xs focus:outline-none focus:border-amber-500"
                          />

                          <div className="grid grid-cols-3 gap-1.5">
                            <select
                              value={v.identity_type}
                              onChange={(e) =>
                                handleUpdateVisitor(
                                  idx,
                                  "identity_type",
                                  e.target.value as VisitorIdentityType
                                )
                              }
                              className="px-2 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-amber-500 cursor-pointer"
                            >
                              <option value="ktp">KTP</option>
                              <option value="sim">SIM</option>
                              <option value="passport">Paspor</option>
                            </select>
                            <input
                              type="text"
                              placeholder="No ID *"
                              value={v.identity_number}
                              onChange={(e) =>
                                handleUpdateVisitor(idx, "identity_number", e.target.value)
                              }
                              className="col-span-2 px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 font-mono text-xs focus:outline-none focus:border-amber-500"
                            />
                          </div>
                        </div>

                        <input
                          type="tel"
                          placeholder="Nomor HP / WhatsApp Rekan (Opsional)"
                          value={v.phone || ""}
                          onChange={(e) => handleUpdateVisitor(idx, "phone", e.target.value)}
                          className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 text-xs focus:outline-none focus:border-amber-500"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* ════ SEKSI 5: PERSETUJUAN NDA & REGULASI K3 ════ */}
              <div
                className={`p-4 bg-slate-950 border rounded-xl flex items-start gap-3 transition-colors ${
                  agreeRegulations
                    ? "border-amber-500/50 bg-amber-500/[0.03]"
                    : "border-slate-800 hover:border-slate-700"
                }`}
              >
                <input
                  type="checkbox"
                  id="agree"
                  checked={agreeRegulations}
                  onChange={(e) => setAgreeRegulations(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-700 text-amber-500 focus:ring-amber-500 mt-0.5 cursor-pointer"
                />
                <label
                  htmlFor="agree"
                  className="text-[0.73rem] text-slate-300 leading-relaxed cursor-pointer select-none"
                >
                  Saya menyatakan bahwa seluruh data yang diisikan adalah benar sesuai kartu identitas resmi, bersedia mematuhi seluruh SOP Keamanan Fisik Fasilitas Data Center MSDC, menjaga kerahasiaan seluruh perangkat/data klien lain (NDA), dan wajib melakukan Check-In serta Check-Out melalui Pos Jaga Keamanan.
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submitMutation.isPending}
                className="w-full py-3.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold text-sm rounded-xl shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer mt-1"
              >
                {submitMutation.isPending ? (
                  <span>Menyimpan & Memverifikasi Data...</span>
                ) : (
                  <>
                    <Shield size={16} />
                    <span>Kirim Pendaftaran Izin Masuk</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-12 text-center text-xs text-slate-500 font-sans pb-4">
        &copy; {new Date().getFullYear()} MICRO SCALE DATA CENTER. All access is logged and
        monitored 24/7 under ISO/IEC 27001 Compliance.
      </footer>
    </div>
  );
};
