import React, { useState, useEffect, useMemo } from "react";
import { useParams } from "react-router-dom";
import { AlertTriangle } from "lucide-react";
import { usePublicVisitorPass } from "../api/useVisitorPass";
import { VisitorPassTicket } from "../components/visitor-pass/VisitorPassTicket";
import { renderQrPngDataUri } from "../utils/qrEncoder";
import { resolveVisitorQrState } from "../utils/visitorPassQr";

// Status yang masih bisa berubah karena aksi pos jaga (check-in / check-out) - di-refresh berkala
// agar QR langsung hilang setelah dipindai dan tiket tampil hangus setelah check-out.
const LIVE_STATUSES = new Set(["scheduled", "active_in_facility", "overstayed"]);
const LIVE_REFRESH_MS = 30_000;

export const PublicVisitorPassPage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const { data: passData, isLoading, error } = usePublicVisitorPass(token, {
    refetchInterval: (query) =>
      LIVE_STATUSES.has(String(query.state.data?.status ?? "")) ? LIVE_REFRESH_MS : false,
  });

  const [timeLeftString, setTimeLeftString] = useState("");

  const pass = passData;

  // Dievaluasi ulang tiap render (timer countdown me-render ulang tiap detik), sehingga QR
  // otomatis hilang begitu valid_until terlewati walau data belum di-refresh dari server.
  const qrState = resolveVisitorQrState(pass);
  const qrPayload = qrState.kind === "active" ? qrState.payload : null;

  // QR dirender LOKAL & sinkron di browser: token akses fisik tidak pernah dikirim ke layanan pihak
  // ketiga, dan halaman publik ini tidak memanggil generator CorePlatform (butuh login -> 401 untuk tamu).
  const qrDataUri = useMemo(() => {
    if (!qrPayload) return null;
    try {
      return renderQrPngDataUri(qrPayload, { size: 280 });
    } catch (err) {
      console.error("Gagal merender QR Code E-Badge:", err);
      return null;
    }
  }, [qrPayload]);

  // Countdown timer
  const updateTimer = () => {
    if (pass?.status === "pending_registration") {
      setTimeLeftString("Menunggu Registrasi");
      return;
    }

    const validToDateStr =
      pass?.valid_until || pass?.valid_to || (pass as any)?.planned_check_out_at;
    if (!validToDateStr) {
      setTimeLeftString("Masa berlaku habis");
      return;
    }
    const now = Date.now();
    const end = new Date(validToDateStr).getTime();
    if (isNaN(end) || end <= now) {
      setTimeLeftString("Masa berlaku habis");
      return;
    }
    const diff = end - now;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    setTimeLeftString(
      `${String(hours).padStart(2, "0")}j ${String(minutes).padStart(2, "0")}m ${String(seconds).padStart(2, "0")}d lagi`
    );
  };

  useEffect(() => {
    if (!pass) return;
    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [pass?.valid_to, pass?.valid_until, pass?.status]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 border-3 border-amber-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-slate-400 text-xs mt-3">Memuat tiket digital tamu...</span>
      </div>
    );
  }

  if (error || !pass) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 text-center">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-500 flex items-center justify-center mx-auto mb-3">
          <AlertTriangle size={32} />
        </div>
        <h2 className="text-lg font-bold text-white mb-1">
          Tiket Kunjungan Tidak Ditemukan
        </h2>
        <p className="text-xs text-slate-400 max-w-xs mb-4">
          Tautan tiket mungkin sudah kedaluwarsa, dibatalkan, atau URL token tidak sesuai.
        </p>
      </div>
    );
  }


  const handleDownload = () => {
    if (!qrDataUri || qrState.kind !== "active") return;
    const link = document.createElement("a");
    link.href = qrDataUri;
    link.download = `visitor-pass-${pass.pass_number}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-dvh bg-[#071A34] text-white flex flex-col justify-center p-4 lg:p-6 font-sans">
      <VisitorPassTicket
        className="my-auto"
        pass={pass}
        qrDataUri={qrDataUri}
        timeLeftString={timeLeftString}
        onRefreshTime={updateTimer}
        onCancel={() => window.history.length > 1 ? window.history.back() : window.close()}
        onDownload={handleDownload}
      />
    </div>
  );
};

