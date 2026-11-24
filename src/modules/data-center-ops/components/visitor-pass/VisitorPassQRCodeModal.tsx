import React, { useState, useEffect } from "react";
import { X, Copy, Check, ExternalLink } from "lucide-react";
import { qrCodeApi } from "@shared/lib/qrCodeApi";
import { visitorPassApi } from "../../api/visitorPassApi";
import { VisitorPassTicket } from "./VisitorPassTicket";
import type { VisitorPass } from "../../types/visitorPass";
import { renderQrPngDataUri } from "../../utils/qrEncoder";
import { getVisitorQrInactiveReason, isVisitorQrToken } from "../../utils/visitorPassQr";

interface VisitorPassQRCodeModalProps {
  pass: VisitorPass | null;
  isOpen: boolean;
  onClose: () => void;
}

export const VisitorPassQRCodeModal: React.FC<VisitorPassQRCodeModalProps> = ({
  pass,
  isOpen,
  onClose,
}) => {
  const [qrDataUri, setQrDataUri] = useState<string | null>(null);
  const [isLoadingQr, setIsLoadingQr] = useState(false);
  const [timeLeftString, setTimeLeftString] = useState("");
  const [copied, setCopied] = useState(false);

  // ── 1. Resolve & Generate QR Code ──
  useEffect(() => {
    if (!isOpen || !pass) return;

    let isMounted = true;
    setQrDataUri(null);

    // QR hanya untuk tiket 'scheduled' yang belum dipindai & belum kedaluwarsa
    if (getVisitorQrInactiveReason(pass)) {
      setIsLoadingQr(false);
      return;
    }

    setIsLoadingQr(true);

    const resolveAndGenerate = async () => {
      let tokenToEncode = isVisitorQrToken(pass.raw_qr_token) ? pass.raw_qr_token : null;

      // Jika raw_qr_token belum ada di state, ambil decrypted qr_payload dari endpoint e-badge publik.
      // Backend hanya mengisi qr_payload untuk tiket aktif; TIDAK ADA fallback ke public_url_token/pass_number.
      if (!tokenToEncode && pass.public_url_token) {
        try {
          const res = await visitorPassApi.getPublicPass(pass.public_url_token);
          const payload = res.data?.data?.qr_payload;
          if (isVisitorQrToken(payload) && !getVisitorQrInactiveReason(res.data.data)) {
            tokenToEncode = payload;
          }
        } catch (err) {
          console.error("Gagal mengambil payload QR E-Badge:", err);
        }
      }

      if (!tokenToEncode) {
        if (isMounted) setIsLoadingQr(false);
        return;
      }

      try {
        // Generator CorePlatform (operator sudah login); bila gagal, render lokal di browser.
        // Token akses fisik TIDAK PERNAH dikirim ke layanan QR pihak ketiga.
        let uri: string;
        try {
          uri = await qrCodeApi.generateDataUri(tokenToEncode, { size: 300, format: "png" });
        } catch (err) {
          console.warn("Generator QR CorePlatform gagal, render lokal:", err);
          uri = renderQrPngDataUri(tokenToEncode, { size: 300 });
        }
        if (isMounted) setQrDataUri(uri);
      } catch (err) {
        console.error("Gagal merender QR Code:", err);
      } finally {
        if (isMounted) setIsLoadingQr(false);
      }
    };

    resolveAndGenerate();

    return () => {
      isMounted = false;
    };
  }, [isOpen, pass]);

  // ── 2. Countdown Timer ──
  const calculateTimeLeft = () => {
    if (pass?.status === "pending_registration") {
      setTimeLeftString("Menunggu Registrasi");
      return;
    }

    if (pass?.status === "registered") {
      setTimeLeftString("Menunggu Approval");
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
    if (!isOpen || !pass) return;
    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(interval);
  }, [isOpen, pass?.valid_until, pass?.valid_to, pass?.status]);

  if (!isOpen || !pass) return null;

  const isPendingRegistration = pass.status === "pending_registration";

  const registrationUrl = pass.invitation_token
    ? `${window.location.origin}/visitor-registration/${pass.invitation_token}`
    : "";

  const publicUrl = pass.public_url_token
    ? `${window.location.origin}/visitor-pass/${pass.public_url_token}`
    : "";

  const activeLink = isPendingRegistration ? registrationUrl : publicUrl;
  const activeLabel = isPendingRegistration
    ? "Link Formulir Registrasi Mandiri Tamu:"
    : "Tautan E-Badge Publik:";

  const handleCopyLink = () => {
    if (!activeLink) return;
    navigator.clipboard.writeText(activeLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownload = () => {
    if (!qrDataUri || getVisitorQrInactiveReason(pass)) return;
    const link = document.createElement("a");
    link.href = qrDataUri;
    link.download = `visitor-pass-${pass.pass_number}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 lg:p-6 bg-slate-950/80 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-sm lg:max-w-4xl xl:max-w-5xl my-auto">
        {/* Tombol Tutup Mengambang di Pojok Kanan Atas */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Tutup modal"
          className="absolute -top-3.5 -right-2.5 z-30 w-8 h-8 rounded-full bg-slate-800/90 hover:bg-slate-700 text-white border border-slate-600 flex items-center justify-center shadow-lg transition-all cursor-pointer"
        >
          <X size={16} />
        </button>

        {/* Komponen Tiket Sesuai Desain Mockup */}
        <VisitorPassTicket
          pass={pass}
          qrDataUri={qrDataUri}
          isLoadingQr={isLoadingQr}
          timeLeftString={timeLeftString}
          onRefreshTime={calculateTimeLeft}
          onCancel={onClose}
          onDownload={handleDownload}
        />

        {/* Quick Utility: Copy Link (Registrasi Mandiri untuk pending_registration atau E-Pass Publik) */}
        {activeLink && (
          <div
            className={`mt-2.5 flex items-center justify-between gap-2 px-4 py-2.5 rounded-2xl text-[0.72rem] backdrop-blur-xs border ${
              isPendingRegistration
                ? "bg-purple-950/70 border-purple-800/80 text-purple-200"
                : "bg-slate-900/90 border-slate-700/80 text-slate-300"
            }`}
          >
            <div className="flex flex-col truncate flex-1 min-w-0 pr-2">
              <span
                className={`text-[0.65rem] font-bold uppercase tracking-wider ${
                  isPendingRegistration ? "text-purple-300" : "text-slate-400"
                }`}
              >
                {activeLabel}
              </span>
              <span className="truncate font-mono text-[0.68rem] text-slate-300">
                {activeLink}
              </span>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={handleCopyLink}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 text-[0.7rem] font-semibold ${
                  isPendingRegistration
                    ? "bg-purple-700 hover:bg-purple-600 text-white shadow-xs"
                    : "bg-slate-800 hover:bg-slate-700 text-white"
                }`}
              >
                {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                <span>{copied ? "Tersalin!" : "Salin Link"}</span>
              </button>
              <a
                href={activeLink}
                target="_blank"
                rel="noreferrer"
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  isPendingRegistration
                    ? "bg-purple-900/80 hover:bg-purple-800 text-purple-200 hover:text-white"
                    : "bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white"
                }`}
                title="Buka Tautan di Tab Baru"
              >
                <ExternalLink size={13} />
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

