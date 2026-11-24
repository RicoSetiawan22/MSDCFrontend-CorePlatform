import type { CctvCameraStatus, CctvSourceType } from "../types/cctv";

/**
 * Deteksi visual awal tipe alamat stream di form input.
 * Catatan: Keputusan akhir dan validasi definitif tetap dilakukan oleh probe backend.
 */
export function detectSourceType(url: string): CctvSourceType | "unknown" {
  if (!url) return "unknown";

  // Aturan sama dengan CctvStreamProbeService::detectType() di backend:
  // rtmp/rtmps → rtmp; http(s) dengan PATH berakhiran .m3u8 (query boleh) → hls.
  const trimmed = url.trim();

  // Dicek lewat regex: sebagian browser lama tidak mengisi URL.hostname untuk skema non-http.
  if (/^rtmps?:\/\/[^/\s?#]+/i.test(trimmed)) {
    return "rtmp";
  }

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return "unknown";
  }

  const isHttp = parsed.protocol === "http:" || parsed.protocol === "https:";
  if (isHttp && parsed.hostname && parsed.pathname.toLowerCase().endsWith(".m3u8")) {
    return "hls";
  }

  return "unknown";
}

export interface CctvStatusConfig {
  label: string;
  bg: string;
  text: string;
  border: string;
  dotColor: string;
  pulse: boolean;
  isRtmpUnplayable: boolean;
}

/**
 * Konfigurasi badge status visual kamera CCTV
 */
export function getCctvStatusConfig(
  status: CctvCameraStatus,
  playableInBrowser = false,
  sourceType: CctvSourceType = "hls"
): CctvStatusConfig {
  const isRtmpUnplayable = status === "online" && sourceType === "rtmp" && !playableInBrowser;

  switch (status) {
    case "online":
      return {
        label: isRtmpUnplayable ? "ONLINE (RTMP)" : "ONLINE",
        bg: "bg-emerald-50 text-emerald-700",
        text: "text-emerald-700",
        border: "border-emerald-200",
        dotColor: "bg-emerald-500",
        pulse: true,
        isRtmpUnplayable,
      };
    case "offline":
      return {
        label: "OFFLINE",
        bg: "bg-rose-50 text-rose-700",
        text: "text-rose-700",
        border: "border-rose-200",
        dotColor: "bg-rose-500",
        pulse: false,
        isRtmpUnplayable: false,
      };
    case "maintenance":
      return {
        label: "MAINTENANCE",
        bg: "bg-amber-50 text-amber-700",
        text: "text-amber-700",
        border: "border-amber-200",
        dotColor: "bg-amber-500",
        pulse: false,
        isRtmpUnplayable: false,
      };
    case "unknown":
    default:
      return {
        label: "BELUM DICEK",
        bg: "bg-slate-100 text-slate-600",
        text: "text-slate-600",
        border: "border-slate-200",
        dotColor: "bg-slate-400",
        pulse: false,
        isRtmpUnplayable: false,
      };
  }
}

/**
 * Format string resolusi video menjadi label yang mudah dibaca
 */
export function formatResolution(resolution?: string | null): string {
  if (!resolution) return "-";
  const trimmed = resolution.trim();
  if (trimmed === "1920x1080") return "1920×1080 (FHD 1080p)";
  if (trimmed === "1280x720") return "1280×720 (HD 720p)";
  if (trimmed === "3840x2160") return "3840×2160 (4K UHD)";
  if (trimmed === "2560x1440") return "2560×1440 (2K QHD)";
  if (trimmed === "640x480") return "640×480 (SD 480p)";
  return trimmed.replace("x", "×");
}

/**
 * Format nama codec video
 */
export function formatCodec(codec?: string | null): string {
  if (!codec) return "-";
  const lower = codec.toLowerCase();
  if (lower === "h264") return "H.264 (AVC)";
  if (lower === "h265" || lower === "hevc") return "H.265 (HEVC)";
  if (lower === "vp8") return "VP8";
  if (lower === "vp9") return "VP9";
  if (lower === "av1") return "AV1";
  return codec.toUpperCase();
}

/**
 * Format waktu relatif dalam bahasa Indonesia
 */
export function formatRelativeTime(dateStr?: string | null): string {
  if (!dateStr) return "Belum pernah dicek";
  try {
    const time = new Date(dateStr).getTime();
    if (isNaN(time)) return "-";
    const now = Date.now();
    const diffSec = Math.floor((now - time) / 1000);

    if (diffSec < 10) return "Baru saja";
    if (diffSec < 60) return `${diffSec} detik lalu`;
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin} menit lalu`;
    const diffHour = Math.floor(diffMin / 60);
    if (diffHour < 24) return `${diffHour} jam lalu`;
    const diffDay = Math.floor(diffHour / 24);
    if (diffDay < 30) return `${diffDay} hari lalu`;
    return new Date(dateStr).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "-";
  }
}

/**
 * Format tanggal dan waktu lengkap standar id-ID (WIB)
 */
export function formatDateTimeIndo(dateStr?: string | null): string {
  if (!dateStr) return "-";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "-";
    return (
      d.toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }) +
      " " +
      d.toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }) +
      " WIB"
    );
  } catch {
    return "-";
  }
}

