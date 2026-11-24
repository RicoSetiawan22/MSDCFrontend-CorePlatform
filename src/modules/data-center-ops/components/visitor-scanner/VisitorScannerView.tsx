import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Camera,
  CameraOff,
  QrCode,
  ScanLine,
  CheckCircle2,
  XCircle,
  X,
  Users,
  LogIn,
  LogOut,
  Server,
  RefreshCw,
  Volume2,
  VolumeX,
  Upload,
  MapPin,
  ChevronDown,
  ShieldCheck,
} from "lucide-react";
import jsQR from "jsqr";
import {
  useScanVerifyVisitorPass,
  useActiveInFacility,
  useCheckOutVisitorPass,
} from "../../api/useVisitorPass";
import { visitorPassApi } from "../../api/visitorPassApi";
import { useSiteList } from "../../api/useSites";
import { getApiErrorMessage } from "@shared/lib/api-client";
import { VisitorPassCheckOutModal } from "../visitor-pass/VisitorPassCheckOutModal";
import type { ScanVerifyResult, VisitorPass } from "../../types/visitorPass";

// Helper Audio Context Singleton untuk mencegah kebocoran resource Web Audio API
let sharedAudioCtx: AudioContext | null = null;
function getAudioContext(): AudioContext | null {
  try {
    if (!sharedAudioCtx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) sharedAudioCtx = new AudioCtx();
    }
    if (sharedAudioCtx && sharedAudioCtx.state === "suspended") {
      sharedAudioCtx.resume();
    }
    return sharedAudioCtx;
  } catch {
    return null;
  }
}

// Helper Audio Beep menggunakan Web Audio API
function playSound(type: "success" | "error" | "checkout" | "scanned") {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    if (type === "success") {
      // 2 Nada tinggi bersahabat (Access Granted)
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      osc.frequency.setValueAtTime(1200, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    } else if (type === "checkout") {
      // Nada checkout lembut
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(600, ctx.currentTime);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.2);
    } else if (type === "scanned") {
      // Nada pendek renyah saat QR tertangkap sensor (token ter-capture)
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      gain.gain.setValueAtTime(0.18, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.08);
    } else {
      // Nada rendah peringatan (Replay / Denied)
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(220, ctx.currentTime);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    }
  } catch (e) {
    console.debug("Audio API disabled or not allowed by browser", e);
  }
}

// Helper decoding QR dari HTMLImageElement dengan strategi multi-layer:
// Layer 1: Native BarcodeDetector (Chromium, Brave, Edge, Android) - Terakselerasi hardware, tahan gambar 12MP-50MP & rotasi
// Layer 2: Multi-Scale Adaptive Downsampling dengan jsQR - Bekerja optimal di rentang 500px - 1400px
async function decodeQrFromImage(img: HTMLImageElement): Promise<string | null> {
  // Layer 1: Coba BarcodeDetector bawaan browser jika ada
  const NativeBarcodeDetector = (
    window as unknown as {
      BarcodeDetector?: new (opts?: { formats: string[] }) => {
        detect: (src: CanvasImageSource) => Promise<Array<{ rawValue: string }>>;
      };
    }
  ).BarcodeDetector;

  if (typeof NativeBarcodeDetector === "function") {
    try {
      const detector = new NativeBarcodeDetector({ formats: ["qr_code"] });
      const results = await detector.detect(img);
      if (results && results.length > 0 && results[0].rawValue) {
        return results[0].rawValue;
      }
    } catch (err) {
      console.warn("Native BarcodeDetector gagal, beralih ke multi-scale jsQR:", err);
    }
  }

  // Layer 2: Multi-Scale Downsampling dengan jsQR
  const tryJsQRAtScale = (maxDim: number): string | null => {
    let w = img.naturalWidth || img.width;
    let h = img.naturalHeight || img.height;
    if (!w || !h) return null;

    if (maxDim > 0 && (w > maxDim || h > maxDim)) {
      if (w > h) {
        h = Math.round((h * maxDim) / w);
        w = maxDim;
      } else {
        w = Math.round((w * maxDim) / h);
        h = maxDim;
      }
    }

    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return null;

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(img, 0, 0, w, h);

    const imageData = ctx.getImageData(0, 0, w, h);
    const code = jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: "attemptBoth",
    });

    return code?.data || null;
  };

  // Coba ukuran optimal 1000px (sweet spot untuk foto smartphone)
  let found = tryJsQRAtScale(1000);
  if (found) return found;

  // Coba ukuran 600px (untuk foto agak blur / modul QR tebal)
  found = tryJsQRAtScale(600);
  if (found) return found;

  // Coba ukuran 1400px (untuk QR yang relatif kecil di dalam foto besar)
  found = tryJsQRAtScale(1400);
  if (found) return found;

  // Coba ukuran asli 1:1 jika belum pernah dicoba dan resolusi wajar (<2500px)
  const origMax = Math.max(img.naturalWidth || img.width, img.naturalHeight || img.height);
  if (origMax < 2500) {
    found = tryJsQRAtScale(0);
    if (found) return found;
  }

  return null;
}

// Helper masking token agar token asli tidak terekspos di UI / DOM
function maskToken(token: string): string {
  const BULLETS = "••••••••••"; // Tepat 10 bullet konstan agar panjang token tidak bocor
  if (token.length >= 12) {
    return `${token.slice(0, 6)}${BULLETS}${token.slice(-4)}`;
  }
  return `${token.slice(0, 2)}${BULLETS}`;
}

/* ───────────────────────── Konstanta & helper tampilan ───────────────────────── */

const SCANNER_LOCATIONS = [
  "Pos Resepsionis / Main Gate",
  "Pos Jaga Pintu Masuk Server",
  "NOC Room Desk Scanner",
  "Loading Dock Gate",
];

// Site pos jaga disimpan per perangkat (tablet/PC di gerbang), bukan per akun petugas.
const SCANNER_SITE_STORAGE_KEY = "msdc.dcOps.visitorScanner.siteId";

const readStoredScannerSiteId = (): number | null => {
  try {
    const value = Number(window.localStorage.getItem(SCANNER_SITE_STORAGE_KEY));
    return Number.isInteger(value) && value > 0 ? value : null;
  } catch {
    return null;
  }
};

const writeStoredScannerSiteId = (siteId: number | null) => {
  try {
    if (siteId) window.localStorage.setItem(SCANNER_SITE_STORAGE_KEY, String(siteId));
    else window.localStorage.removeItem(SCANNER_SITE_STORAGE_KEY);
  } catch {
    // Penyimpanan diblokir (mode privat) - pilihan tetap berlaku selama sesi halaman ini
  }
};

const GUARD_SOP = [
  "Cocokkan nama di layar dengan KTP fisik pengunjung.",
  "Berikan kalung kartu visitor fisik setelah scan check-in.",
  "Pastikan tamu hanya mengakses rak sesuai perizinan.",
  "Lakukan scan check-out saat tamu meninggalkan gedung.",
];

const SCAN_KEYFRAMES = `
@keyframes vp-scan-sweep {
  0%, 100% { top: 10%; }
  50% { top: 88%; }
}`;

const CARD =
  "rounded-2xl bg-white ring-1 ring-slate-200/80 shadow-[0_1px_2px_rgba(10,33,64,0.04)]";

const getInitials = (name?: string | null) =>
  (name || "?")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");

const Spinner: React.FC<{ className?: string }> = ({ className = "" }) => (
  <span
    className={`h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent ${className}`}
  />
);

/* ───────────────────────── Komponen ───────────────────────── */

export const VisitorScannerView: React.FC = () => {
  const [manualToken, setManualToken] = useState("");
  const [scannerLocation, setScannerLocation] = useState("Pos Resepsionis / Main Gate");
  const [cameraActive, setCameraActive] = useState(false);
  const [isDecodingImage, setIsDecodingImage] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [lastResult, setLastResult] = useState<ScanVerifyResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [checkOutModalPass, setCheckOutModalPass] = useState<VisitorPass | null>(null);

  // State 2-Langkah: Token tersamar yang tertangkap sensor & menunggu konfirmasi manual
  const [pendingToken, setPendingToken] = useState<string | null>(null);
  const [pendingMethod, setPendingMethod] = useState<"webcam_guard" | "image_upload" | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const verifyButtonRef = useRef<HTMLButtonElement | null>(null);
  const expireTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Queries & Mutations
  const { data: activeVisitors = [], isLoading: isActiveLoading } = useActiveInFacility();
  const scanMutation = useScanVerifyVisitorPass();
  const checkOutMutation = useCheckOutVisitorPass();

  // Site pos jaga: dikirim sebagai site_id agar backend menolak tiket untuk site lain
  const [scannerSiteId, setScannerSiteId] = useState<number | null>(readStoredScannerSiteId);
  const { data: siteList, isLoading: isSitesLoading, isError: isSitesError } = useSiteList({ per_page: 100 });
  const scannerSites = (siteList?.data ?? []).filter((s) => s.status !== "decommissioned");
  const scannerSite = scannerSites.find((s) => s.id === scannerSiteId) ?? null;

  const handleScannerSiteChange = (siteId: number | null) => {
    setScannerSiteId(siteId);
    writeStoredScannerSiteId(siteId);
  };

  // Site tersimpan yang sudah dihapus / decommissioned -> lepas agar tidak mengirim site_id usang
  useEffect(() => {
    if (siteList && scannerSiteId && !scannerSite) {
      setScannerSiteId(null);
      writeStoredScannerSiteId(null);
    }
  }, [siteList, scannerSiteId, scannerSite]);

  const clearPendingToken = useCallback(() => {
    if (expireTimerRef.current) {
      clearTimeout(expireTimerRef.current);
      expireTimerRef.current = null;
    }
    setPendingToken(null);
    setPendingMethod(null);
  }, []);

  const captureToken = useCallback(
    (rawToken: string, method: "webcam_guard" | "image_upload") => {
      let clean = rawToken.trim();
      if (!clean) return;

      // Jika token berupa URL penuh (mis. https://msdc.jtv.co.id/visitor-pass/xxx), ekstrak tokennya
      if (clean.includes("/visitor-pass/")) {
        const parts = clean.split("/visitor-pass/");
        clean = parts[1].split("?")[0].split("#")[0].trim();
      }

      if (expireTimerRef.current) {
        clearTimeout(expireTimerRef.current);
      }

      setPendingToken(clean);
      setPendingMethod(method);
      setErrorMessage(null);
      setLastResult(null);

      if (soundEnabled) {
        playSound("scanned");
      }

      // Kedaluwarsa otomatis dalam 60 detik jika tidak segera diverifikasi
      expireTimerRef.current = setTimeout(() => {
        setPendingToken(null);
        setPendingMethod(null);
        setErrorMessage("Token kedaluwarsa, silakan pindai ulang.");
      }, 60000);

      // Fokuskan tombol Verifikasi agar petugas dapat langsung menekan [Enter]
      setTimeout(() => {
        verifyButtonRef.current?.focus();
      }, 60);
    },
    [soundEnabled]
  );

  // Memulai streaming kamera
  const startCamera = async () => {
    clearPendingToken();
    try {
      setErrorMessage(null);
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 }, height: { ideal: 720 } },
        });
      } catch {
        // Fallback untuk webcam tanpa filter constraint
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
        });
      }

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        try {
          await videoRef.current.play();
        } catch (playErr) {
          console.warn("Video play warning:", playErr);
        }
      }
      setCameraActive(true);

      // Decoding frame QR secara real-time menggunakan jsQR
      const scanCanvas = document.createElement("canvas");
      const scanCtx = scanCanvas.getContext("2d", { willReadFrequently: true });

      scanIntervalRef.current = setInterval(() => {
        if (!videoRef.current || videoRef.current.readyState < 2 || !scanCtx) return;
        const video = videoRef.current;
        if (video.videoWidth === 0 || video.videoHeight === 0) return;

        scanCanvas.width = video.videoWidth;
        scanCanvas.height = video.videoHeight;
        scanCtx.drawImage(video, 0, 0, scanCanvas.width, scanCanvas.height);

        const imageData = scanCtx.getImageData(0, 0, scanCanvas.width, scanCanvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: "attemptBoth",
        });

        if (code && code.data) {
          const detectedCode = code.data;
          stopCamera();
          captureToken(detectedCode, "webcam_guard");
        }
      }, 250);
    } catch (err: unknown) {
      console.warn("Gagal membuka kamera:", err);
      setErrorMessage(
        "Kamera tidak dapat diakses atau izin ditolak. Pastikan webcam terhubung dan izin kamera browser diizinkan, atau gunakan 'Unggah Foto QR' / input scanner USB di bawah."
      );
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  // Upload foto/gambar QR Code untuk decoding langsung
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    clearPendingToken();
    setErrorMessage(null);
    setIsDecodingImage(true);

    const objectUrl = URL.createObjectURL(file);
    try {
      const img = new Image();
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error("Gagal memuat berkas gambar."));
        img.src = objectUrl;
      });

      const qrText = await decodeQrFromImage(img);

      if (qrText) {
        captureToken(qrText, "image_upload");
      } else {
        setErrorMessage(
          "QR Code tidak terdeteksi pada gambar yang diunggah. Pastikan gambar memuat QR Code yang jelas, pencahayaan cukup, atau coba gunakan kamera langsung."
        );
        if (soundEnabled) playSound("error");
      }
    } catch (err: unknown) {
      console.error("Gagal memproses gambar QR:", err);
      setErrorMessage("Terjadi kesalahan saat memproses file gambar QR.");
      if (soundEnabled) playSound("error");
    } finally {
      URL.revokeObjectURL(objectUrl);
      setIsDecodingImage(false);
      e.target.value = "";
    }
  };

  useEffect(() => {
    return () => {
      stopCamera();
      if (expireTimerRef.current) {
        clearTimeout(expireTimerRef.current);
      }
    };
  }, []);

  // Autofocus input scanner jika tidak ada pendingToken dan kamera mati
  useEffect(() => {
    if (!cameraActive && !pendingToken) {
      inputRef.current?.focus();
    }
  }, [cameraActive, pendingToken, lastResult]);

  // Eksekusi verifikasi scan token
  const handleVerifyToken = async (
    tokenString: string,
    method: "webcam_guard" | "usb_scanner" | "manual_override" = "webcam_guard"
  ) => {
    let cleanToken = tokenString.trim();
    if (!cleanToken) return;

    // Jika token berupa URL penuh (mis. https://msdc.jtv.co.id/visitor-pass/xxx), ekstrak tokennya
    if (cleanToken.includes("/visitor-pass/")) {
      const parts = cleanToken.split("/visitor-pass/");
      cleanToken = parts[1].split("?")[0].split("#")[0].trim();
    }

    // Smart Resolver: Jika token berupa 64-hex public_url_token (bukan VPQR_), coba ambil qr_payload asli dari endpoint publik
    if (/^[a-f0-9]{64}$/i.test(cleanToken)) {
      try {
        const publicRes = await visitorPassApi.getPublicPass(cleanToken);
        if (publicRes.data?.data?.qr_payload) {
          cleanToken = publicRes.data.data.qr_payload;
        }
      } catch {
        // Abaikan jika bukan public pass URL, biarkan lanjut ke scan-verify
      }
    }

    setErrorMessage(null);

    try {
      const res = await scanMutation.mutateAsync({
        token: cleanToken,
        qr_token: cleanToken,
        scan_method: method,
        scanner_location: scannerLocation,
        site_id: scannerSite?.id,
      });

      const passData = res.visitor_pass || res.pass || (res as any).data;
      const normalizedResult: ScanVerifyResult = {
        ...res,
        access_granted: res.access_granted ?? res.success ?? true,
        status: res.status || "success",
        message: res.message || "Verifikasi berhasil.",
        success: res.access_granted ?? res.success ?? true,
        action: res.action || "check_in",
        pass: passData,
        visitor_pass: passData,
      };

      clearPendingToken();
      setLastResult(normalizedResult);
      setManualToken("");

      if (soundEnabled) {
        playSound(normalizedResult.action === "check_out" ? "checkout" : "success");
      }
    } catch (err: unknown) {
      clearPendingToken();
      const msg = getApiErrorMessage(
        err,
        "Gagal memverifikasi tiket pengunjung. Token tidak valid atau terjadi kesalahan."
      );
      setErrorMessage(msg);
      setLastResult(null);

      if (soundEnabled) {
        playSound("error");
      }
    } finally {
      inputRef.current?.focus();
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pendingToken) {
      if (expireTimerRef.current) {
        clearTimeout(expireTimerRef.current);
        expireTimerRef.current = null;
      }
      const method = pendingMethod === "webcam_guard" ? "webcam_guard" : "usb_scanner";
      handleVerifyToken(pendingToken, method);
    } else if (manualToken.trim()) {
      handleVerifyToken(manualToken.trim(), "usb_scanner");
    }
  };

  const handleQuickCheckOut = (pass: VisitorPass) => {
    setCheckOutModalPass(pass);
  };

  const isCheckIn = lastResult?.action === "check_in";

  /* Tombol unggah dipakai di dua posisi (tengah saat kamera mati, pojok saat kamera aktif) */
  const uploadButton = (variant: "solid" | "glass") => (
    <button
      type="button"
      onClick={() => {
        clearPendingToken();
        fileInputRef.current?.click();
      }}
      disabled={isDecodingImage}
      title="Unggah Foto QR Code untuk diverifikasi"
      className={`inline-flex items-center gap-2 rounded-xl text-sm font-semibold transition-colors cursor-pointer disabled:cursor-wait disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 ${
        variant === "solid"
          ? "bg-white/10 px-4 py-2.5 text-white ring-1 ring-inset ring-white/15 hover:bg-white/15"
          : "bg-black/40 px-3 py-2 text-white backdrop-blur-sm hover:bg-black/60"
      }`}
    >
      {isDecodingImage ? (
        <>
          <Spinner className="text-amber-400" />
          Membaca foto...
        </>
      ) : (
        <>
          <Upload size={15} />
          Unggah foto QR
        </>
      )}
    </button>
  );

  return (
    <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
      <style>{SCAN_KEYFRAMES}</style>

      {/* ── Kolom kiri: stasiun pemindaian ── */}
      <div className="flex flex-col gap-5 lg:col-span-8">
        <section className={`${CARD} flex flex-col gap-5 p-5 sm:p-6`}>
          {/* Header */}
          <header className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0A2140] text-amber-400">
                <ScanLine size={19} />
              </span>
              <div>
                <h3 className="text-base font-semibold text-[#0A2140]">Stasiun pemindaian pos jaga</h3>
                <p className="text-xs text-slate-500">
                  Verifikasi izin masuk fisik dengan validasi anti-replay
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Server
                  size={14}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <select
                  aria-label="Site Data Center Pos Jaga"
                  value={scannerSite?.id ?? ""}
                  onChange={(e) => handleScannerSiteChange(e.target.value ? Number(e.target.value) : null)}
                  disabled={isSitesLoading || isSitesError}
                  className={`cursor-pointer appearance-none rounded-xl border bg-white py-2 pl-8 pr-8 text-sm font-medium hover:border-slate-300 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 disabled:cursor-not-allowed disabled:opacity-60 ${
                    scannerSite ? "border-slate-200 text-slate-700" : "border-amber-300 text-amber-700"
                  }`}
                >
                  <option value="">{isSitesLoading ? "Memuat site..." : "Pilih site pos jaga"}</option>
                  {scannerSites.map((site) => (
                    <option key={site.id} value={site.id}>
                      {site.site_name}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={14}
                  className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400"
                />
              </div>

              <div className="relative">
                <MapPin
                  size={14}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <select
                  aria-label="Lokasi Gate / Pos Jaga"
                  value={scannerLocation}
                  onChange={(e) => setScannerLocation(e.target.value)}
                  className="cursor-pointer appearance-none rounded-xl border border-slate-200 bg-white py-2 pl-8 pr-8 text-sm font-medium text-slate-700 hover:border-slate-300 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                >
                  {SCANNER_LOCATIONS.map((loc) => (
                    <option key={loc} value={loc}>
                      {loc}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={14}
                  className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400"
                />
              </div>

              <button
                type="button"
                onClick={() => setSoundEnabled(!soundEnabled)}
                title={soundEnabled ? "Nonaktifkan Beep Audio" : "Aktifkan Beep Audio"}
                aria-label={soundEnabled ? "Nonaktifkan Beep Audio" : "Aktifkan Beep Audio"}
                aria-pressed={soundEnabled}
                className={`flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 ${
                  soundEnabled
                    ? "border-slate-200 bg-white text-[#0A2140] hover:bg-slate-50"
                    : "border-dashed border-slate-300 bg-slate-50 text-slate-400 hover:text-slate-600"
                }`}
              >
                {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
              </button>
            </div>
          </header>

          {/* Peringatan validasi lokasi nonaktif */}
          {!scannerSite && !isSitesLoading && (
            <p
              role="status"
              className="-mt-2 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800"
            >
              <MapPin size={14} className="mt-0.5 shrink-0 text-amber-600" />
              <span>
                {isSitesError
                  ? "Daftar site tidak dapat dimuat. Validasi lokasi nonaktif: tiket untuk site lain tidak akan ditolak di pos jaga ini."
                  : "Validasi lokasi nonaktif. Pilih site pos jaga agar tiket yang terdaftar untuk site lain otomatis ditolak. Pilihan disimpan di perangkat ini."}
              </span>
            </p>
          )}

          {/* Viewport kamera */}
          <div className="relative flex aspect-video min-h-[360px] w-full items-center justify-center overflow-hidden rounded-2xl bg-[#061528] sm:min-h-[420px]">
            {/* Video element selalu di DOM agar srcObject terikat langsung tanpa race condition */}
            <video
              ref={videoRef}
              playsInline
              muted
              autoPlay
              className={`h-full w-full object-cover transition-opacity duration-300 ${
                cameraActive ? "opacity-100" : "pointer-events-none absolute inset-0 opacity-0"
              }`}
            />

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageUpload}
            />

            {/* Lokasi pos aktif */}
            <span className="absolute left-3 top-3 z-20 inline-flex max-w-[60%] items-center gap-1.5 rounded-full bg-black/40 px-3 py-1.5 text-xs font-medium text-white/85 backdrop-blur-sm">
              <MapPin size={12} className="shrink-0" />
              <span className="truncate">
                {scannerSite ? `${scannerSite.site_name} · ${scannerLocation}` : scannerLocation}
              </span>
            </span>

            {cameraActive ? (
              <>
                {/* Bingkai bidik: area di luar bingkai digelapkan */}
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                  <div className="relative h-56 w-56 rounded-3xl shadow-[0_0_0_9999px_rgba(3,10,22,0.55)] sm:h-64 sm:w-64">
                    <span className="absolute left-0 top-0 h-9 w-9 rounded-tl-3xl border-l-[3px] border-t-[3px] border-white" />
                    <span className="absolute right-0 top-0 h-9 w-9 rounded-tr-3xl border-r-[3px] border-t-[3px] border-white" />
                    <span className="absolute bottom-0 left-0 h-9 w-9 rounded-bl-3xl border-b-[3px] border-l-[3px] border-white" />
                    <span className="absolute bottom-0 right-0 h-9 w-9 rounded-br-3xl border-b-[3px] border-r-[3px] border-white" />
                    <span className="absolute left-5 right-5 h-0.5 rounded-full bg-emerald-400 shadow-[0_0_14px_3px_rgba(52,211,153,0.55)] animate-[vp-scan-sweep_2.4s_ease-in-out_infinite] motion-reduce:hidden" />
                  </div>
                </div>

                {/* Kontrol saat kamera aktif */}
                <div className="absolute right-3 top-3 z-20 flex items-center gap-2">
                  {uploadButton("glass")}
                  <button
                    type="button"
                    onClick={stopCamera}
                    className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-rose-600 px-3 py-2 text-sm font-semibold text-white shadow-lg transition-colors hover:bg-rose-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-300"
                  >
                    <CameraOff size={15} />
                    Matikan kamera
                  </button>
                </div>

                <div className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2 whitespace-nowrap rounded-full bg-black/50 px-4 py-2 text-xs font-medium text-white backdrop-blur-sm">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75 motion-reduce:hidden" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
                  </span>
                  Arahkan QR tamu ke dalam bingkai
                </div>
              </>
            ) : (
              <div className="relative z-10 flex flex-col items-center gap-6 p-6 text-center">
                {/* Ikon QR dengan bingkai bidik */}
                <div className="relative flex h-24 w-24 items-center justify-center">
                  <span className="absolute left-0 top-0 h-6 w-6 rounded-tl-xl border-l-2 border-t-2 border-amber-400/80" />
                  <span className="absolute right-0 top-0 h-6 w-6 rounded-tr-xl border-r-2 border-t-2 border-amber-400/80" />
                  <span className="absolute bottom-0 left-0 h-6 w-6 rounded-bl-xl border-b-2 border-l-2 border-amber-400/80" />
                  <span className="absolute bottom-0 right-0 h-6 w-6 rounded-br-xl border-b-2 border-r-2 border-amber-400/80" />
                  <QrCode size={40} className="text-white/60" />
                </div>

                <div>
                  <h4 className="text-base font-semibold text-white">Kamera pemindai nonaktif</h4>
                  <p className="mx-auto mt-1.5 max-w-sm text-sm leading-relaxed text-white/55">
                    Nyalakan kamera untuk memindai QR di layar HP tamu, atau unggah foto QR jika
                    tamu mengirimkannya.
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={startCamera}
                    className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-semibold text-[#0A2140] shadow-lg shadow-amber-500/20 transition-colors hover:bg-amber-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#061528]"
                  >
                    <Camera size={16} />
                    Nyalakan kamera
                  </button>
                  {uploadButton("solid")}
                </div>
              </div>
            )}
          </div>

          {/* Hasil verifikasi: tampil tepat di bawah kamera agar langsung terlihat petugas */}
          {errorMessage && (
            <div
              role="alert"
              className="flex items-start gap-3 rounded-2xl bg-rose-50 p-4 ring-1 ring-inset ring-rose-200 animate-in fade-in"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-rose-100 text-rose-600">
                <XCircle size={18} />
              </span>
              <div className="min-w-0">
                <h4 className="text-sm font-semibold text-rose-900">Akses ditolak / tidak valid</h4>
                <p className="mt-0.5 text-sm leading-relaxed text-rose-700">{errorMessage}</p>
              </div>
            </div>
          )}

          {lastResult && (
            <div
              role="status"
              className={`overflow-hidden rounded-2xl ring-1 ring-inset animate-in fade-in ${
                isCheckIn ? "ring-emerald-200" : "ring-blue-200"
              }`}
            >
              <div
                className={`flex items-center justify-between gap-3 px-5 py-2.5 text-white ${
                  isCheckIn ? "bg-emerald-600" : "bg-blue-600"
                }`}
              >
                <span className="flex items-center gap-2 text-sm font-semibold">
                  {isCheckIn ? <LogIn size={16} /> : <LogOut size={16} />}
                  {isCheckIn ? "Check-in berhasil" : "Check-out selesai"}
                </span>
                <time className="text-xs tabular-nums text-white/80">
                  {new Date().toLocaleTimeString("id-ID")}
                </time>
              </div>

              <div className={`p-5 ${isCheckIn ? "bg-emerald-50/60" : "bg-blue-50/60"}`}>
                <div className="flex items-center gap-4">
                  <span
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-base font-bold ${
                      isCheckIn ? "bg-emerald-100 text-emerald-700" : "bg-blue-100 text-blue-700"
                    }`}
                  >
                    {getInitials(lastResult.pass.visitor_name)}
                  </span>
                  <div className="min-w-0">
                    <p className="font-mono text-xs font-semibold text-slate-500">
                      {lastResult.pass.pass_number}
                    </p>
                    <h4 className="break-words text-lg font-bold leading-tight text-[#0A2140]">
                      {lastResult.pass.visitor_name}
                    </h4>
                    {lastResult.pass.visitor_company && (
                      <p className="text-sm text-slate-600">{lastResult.pass.visitor_company}</p>
                    )}
                  </div>
                </div>

                <dl className="mt-4 grid grid-cols-1 gap-3 rounded-xl bg-white p-3.5 text-sm ring-1 ring-inset ring-slate-200/70 sm:grid-cols-3">
                  <div className="min-w-0">
                    <dt className="text-xs text-slate-500">Penjamin CRM</dt>
                    <dd className="mt-0.5 truncate font-semibold text-slate-900">
                      {lastResult.pass.customer?.name}
                    </dd>
                  </div>
                  <div className="min-w-0">
                    <dt className="text-xs text-slate-500">Site</dt>
                    <dd className="mt-0.5 truncate font-semibold text-slate-900">
                      {lastResult.pass.site?.name}
                    </dd>
                  </div>
                  <div className="min-w-0">
                    <dt className="text-xs text-slate-500">Akses rak</dt>
                    <dd className="mt-0.5 truncate font-semibold text-amber-700">
                      {lastResult.pass.rack?.code ? `Rak ${lastResult.pass.rack.code}` : "Semua Ruangan"}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>
          )}

          {/* Input token / scanner USB */}
          <form onSubmit={handleManualSubmit}>
            <div className="flex items-center justify-between">
              <label htmlFor="barcode-input" className="text-sm font-medium text-slate-700">
                Token QR atau scanner USB
              </label>
              {pendingToken && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-200 animate-in fade-in zoom-in-95 duration-150">
                  <CheckCircle2 size={13} className="text-emerald-600" />
                  {pendingMethod === "webcam_guard" ? "QR terbaca dari kamera" : "QR terbaca dari foto"}
                </span>
              )}
            </div>

            <div className="mt-2 flex flex-col gap-2 sm:flex-row">
              <div className="relative flex-1">
                <QrCode
                  size={17}
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  id="barcode-input"
                  ref={inputRef}
                  type="text"
                  readOnly={Boolean(pendingToken)}
                  placeholder={
                    pendingToken
                      ? "Token siap diverifikasi"
                      : "Tembak barcode atau tempel token tiket di sini"
                  }
                  value={pendingToken ? maskToken(pendingToken) : manualToken}
                  onChange={(e) => {
                    if (!pendingToken) {
                      setManualToken(e.target.value);
                    }
                  }}
                  disabled={scanMutation.isPending}
                  className={`w-full rounded-xl border py-3 pl-11 font-mono text-sm transition-colors focus:outline-none focus:ring-2 disabled:opacity-60 ${
                    pendingToken
                      ? "border-emerald-300 bg-emerald-50/30 pr-10 text-emerald-900 font-semibold focus:border-emerald-500 focus:ring-emerald-500/20"
                      : "border-slate-200 bg-slate-50 pr-4 text-slate-900 placeholder:font-sans placeholder:text-slate-400 focus:border-amber-500 focus:bg-white focus:ring-amber-500/20"
                  }`}
                />
                {pendingToken && (
                  <button
                    type="button"
                    onClick={() => {
                      clearPendingToken();
                      inputRef.current?.focus();
                    }}
                    title="Batalkan token"
                    aria-label="Batalkan token"
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>

              <button
                ref={verifyButtonRef}
                type="submit"
                disabled={
                  (!pendingToken && !manualToken.trim()) || scanMutation.isPending
                }
                className="inline-flex cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-[#0A2140] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#0A2140]/90 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2"
              >
                {scanMutation.isPending ? (
                  <>
                    <RefreshCw size={15} className="animate-spin" />
                    Memverifikasi...
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={16} />
                    Verifikasi
                  </>
                )}
              </button>
            </div>

            <p className="mt-2 text-xs text-slate-500">
              {pendingToken
                ? "Token terbaca. Periksa lokasi pos, lalu tekan Verifikasi."
                : "Scanner tembak USB otomatis memicu verifikasi begitu QR terbaca."}
            </p>
          </form>
        </section>
      </div>

      {/* ── Kolom kanan: tamu di fasilitas ── */}
      <div className="flex flex-col gap-5 lg:col-span-4">
        <section className={`${CARD} overflow-hidden`}>
          <header className="flex items-center justify-between gap-3 px-5 pt-5 pb-4">
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                <Users size={16} />
              </span>
              <div>
                <h3 className="text-[15px] font-semibold text-[#0A2140]">Sedang di fasilitas</h3>
                <p className="text-xs text-slate-500">Tamu yang sudah check-in</p>
              </div>
            </div>
            <span className="whitespace-nowrap rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold tabular-nums text-emerald-700 ring-1 ring-inset ring-emerald-200">
              {activeVisitors.length} tamu
            </span>
          </header>

          {isActiveLoading ? (
            <ul className="divide-y divide-slate-100 border-t border-slate-100">
              {[1, 2, 3].map((i) => (
                <li key={i} className="flex items-center gap-3 px-5 py-4">
                  <span className="h-10 w-10 shrink-0 animate-pulse rounded-full bg-slate-100" />
                  <span className="flex flex-1 flex-col gap-2">
                    <span className="h-3 w-2/3 animate-pulse rounded bg-slate-100" />
                    <span className="h-2.5 w-1/2 animate-pulse rounded bg-slate-100" />
                  </span>
                </li>
              ))}
            </ul>
          ) : activeVisitors.length === 0 ? (
            <div className="flex flex-col items-center border-t border-slate-100 px-5 py-10 text-center">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-50 text-slate-300">
                <Users size={20} />
              </span>
              <p className="mt-3 text-sm font-medium text-slate-700">Tidak ada tamu di dalam</p>
              <p className="mt-0.5 text-xs text-slate-500">
                Semua pengunjung terdaftar sudah check-out.
              </p>
            </div>
          ) : (
            <ul className="max-h-[520px] divide-y divide-slate-100 overflow-y-auto border-t border-slate-100">
              {activeVisitors.map((v) => (
                <li
                  key={v.id}
                  className="flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-slate-50/70"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#0A2140]/5 text-sm font-semibold text-[#0A2140]">
                    {getInitials(v.visitor_name)}
                  </span>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-900">{v.visitor_name}</p>
                    <p className="truncate text-xs text-slate-500">{v.customer?.name}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-xs">
                      <span className="font-mono font-medium text-amber-700">{v.pass_number}</span>
                      <span className="flex items-center gap-1 text-slate-500">
                        <Server size={11} className="shrink-0 text-slate-400" />
                        {v.rack?.code ? `Rak ${v.rack.code}` : "Site Utama"}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleQuickCheckOut(v)}
                    title="Check-Out Pengunjung Ini"
                    aria-label={`Check-Out Pengunjung ${v.visitor_name}`}
                    className="inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-600 ring-1 ring-inset ring-slate-200 transition-colors hover:bg-emerald-50 hover:text-emerald-700 hover:ring-emerald-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                  >
                    <LogOut size={13} />
                    Check-out
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* SOP pos jaga */}
        <aside className="rounded-2xl bg-amber-50 p-5 ring-1 ring-inset ring-amber-200/70">
          <p className="flex items-center gap-2 text-sm font-semibold text-amber-900">
            <ShieldCheck size={16} className="text-amber-600" />
            SOP verifikasi pos jaga
          </p>
          <ol className="mt-3 space-y-2.5 text-[13px] leading-relaxed text-amber-900/80">
            {GUARD_SOP.map((rule, i) => (
              <li key={rule} className="flex gap-2.5">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-200/70 text-[11px] font-semibold text-amber-800">
                  {i + 1}
                </span>
                {rule}
              </li>
            ))}
          </ol>
        </aside>
      </div>

      {/* Modal Konfirmasi Check-Out Tamu */}
      <VisitorPassCheckOutModal
        pass={checkOutModalPass}
        isOpen={!!checkOutModalPass}
        onClose={() => setCheckOutModalPass(null)}
        onConfirm={async (notes, exitGate) => {
          if (!checkOutModalPass) return;
          await checkOutMutation.mutateAsync({
            id: checkOutModalPass.id,
            notes: notes || `Check-out langsung dari Pos Jaga (${exitGate || scannerLocation})`,
          });
          if (soundEnabled) playSound("checkout");
          setCheckOutModalPass(null);
        }}
        isLoading={checkOutMutation.isPending}
        defaultGate={scannerLocation}
      />
    </div>
  );
};