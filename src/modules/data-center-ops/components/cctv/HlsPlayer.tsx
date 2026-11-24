import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  Volume2,
  VolumeX,
  Maximize2,
  RotateCw,
  AlertCircle,
  Loader2,
  Play,
  Pause,
} from "lucide-react";
import type Hls from "hls.js";
import type { ErrorData } from "hls.js";

/** Jeda retry bertahap untuk error jaringan fatal sebelum player menyerah. */
const RETRY_DELAYS_MS = [1000, 2000, 4000];

/** Selisih (detik) dari ujung siaran sebelum player dianggap tertinggal dari live. */
const BEHIND_LIVE_THRESHOLD_S = 10;

/**
 * Alasan pemutaran pasti diblokir browser sebelum mencoba memuat:
 * halaman https:// tidak boleh memuat stream http:// (mixed content).
 */
function getBlockedPlaybackReason(playbackUrl: string): string | null {
  if (typeof window === "undefined") return null;
  if (window.location.protocol === "https:" && playbackUrl.trim().toLowerCase().startsWith("http://")) {
    return "Browser memblokir stream http:// pada halaman https:// (mixed content). Minta alamat HLS https:// dari server CCTV.";
  }
  return null;
}

/** Pesan error jaringan fatal hls.js. Status 0 = request diblokir browser (umumnya CORS). */
function describeNetworkError(data: Pick<ErrorData, "response">): string {
  const code = data?.response?.code;
  if (code === 0) {
    return "Browser tidak diizinkan mengakses feed ini (CORS). Server CCTV perlu mengizinkan domain ERP (Access-Control-Allow-Origin).";
  }
  if (code === 401 || code === 403) {
    return "Server CCTV menolak akses ke feed ini. Periksa token pada alamat stream.";
  }
  if (code === 404) {
    return "Playlist / segmen tidak ditemukan. Pastikan kamera sedang streaming.";
  }
  return "Gagal memuat feed HLS setelah beberapa kali mencoba. Periksa koneksi ke server CCTV lalu coba lagi.";
}

export interface HlsPlayerProps {
  playbackUrl?: string | null;
  cameraName?: string;
  autoPlay?: boolean;
  muted?: boolean;
  controls?: boolean;
  className?: string;
  onFullscreen?: () => void;
  showLiveBadge?: boolean;
}

export const HlsPlayer: React.FC<HlsPlayerProps> = ({
  playbackUrl,
  cameraName = "Feed CCTV",
  autoPlay = true,
  muted = true,
  controls = true,
  className = "",
  onFullscreen,
  showLiveBadge = true,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hlsInstanceRef = useRef<Hls | null>(null);
  const retryCountRef = useRef(0);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Dinaikkan setiap inisialisasi/unmount: import hls.js yang selesai belakangan tidak
  // boleh membuat player untuk inisialisasi yang sudah usang.
  const generationRef = useRef(0);
  // Dibaca lewat ref supaya mengubah mute TIDAK memicu inisialisasi ulang player.
  const mutedRef = useRef(muted);

  const [isLoading, setIsLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(muted);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isBehindLive, setIsBehindLive] = useState(false);

  const teardown = useCallback(() => {
    // Membatalkan inisialisasi yang masih menunggu import hls.js.
    generationRef.current += 1;
    if (retryTimerRef.current) {
      clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
    }
    if (hlsInstanceRef.current) {
      hlsInstanceRef.current.destroy();
      hlsInstanceRef.current = null;
    }
  }, []);

  const initPlayer = useCallback(async () => {
    const video = videoRef.current;
    teardown();
    const generation = generationRef.current;

    if (!video || !playbackUrl) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    const blockedReason = getBlockedPlaybackReason(playbackUrl);
    if (blockedReason) {
      setErrorMessage(blockedReason);
      setIsLoading(false);
      return;
    }

    const startPlayback = () => {
      if (!autoPlay) return;
      video.muted = mutedRef.current;
      video
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => {
          // Autoplay ditolak browser: user bisa menekan tombol putar.
          setIsPlaying(false);
          setIsLoading(false);
        });
    };

    // 1. HLS native (Safari di iOS / macOS)
    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = playbackUrl;
      startPlayback();
      return;
    }

    // 2. hls.js dimuat hanya saat dibutuhkan
    try {
      const HlsModule = (await import("hls.js")).default;
      if (generation !== generationRef.current) return;

      if (!HlsModule.isSupported()) {
        setErrorMessage(
          "Browser Anda tidak mendukung pemutaran HLS. Silakan gunakan Chrome, Firefox, Safari, atau Edge versi modern."
        );
        setIsLoading(false);
        return;
      }

      const hls = new HlsModule({
        liveSyncDurationCount: 3,
        liveMaxLatencyDurationCount: 6,
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 60,
      });

      hlsInstanceRef.current = hls;
      hls.loadSource(playbackUrl);
      hls.attachMedia(video);

      hls.on(HlsModule.Events.MANIFEST_PARSED, () => {
        setIsLoading(false);
        startPlayback();
      });

      // Segmen berhasil dimuat = koneksi pulih, jatah retry dikembalikan.
      hls.on(HlsModule.Events.FRAG_LOADED, () => {
        retryCountRef.current = 0;
      });

      hls.on(HlsModule.Events.ERROR, (_event, data: ErrorData) => {
        if (!data.fatal) return;

        switch (data.type) {
          case HlsModule.ErrorTypes.NETWORK_ERROR: {
            const attempt = retryCountRef.current;
            if (attempt < RETRY_DELAYS_MS.length) {
              retryCountRef.current = attempt + 1;
              setIsLoading(true);
              retryTimerRef.current = setTimeout(() => {
                retryTimerRef.current = null;
                hls.startLoad();
              }, RETRY_DELAYS_MS[attempt]);
            } else {
              setErrorMessage(describeNetworkError(data));
              setIsLoading(false);
              teardown();
            }
            break;
          }
          case HlsModule.ErrorTypes.MEDIA_ERROR:
            hls.recoverMediaError();
            break;
          default:
            setErrorMessage("Terjadi kesalahan teknis saat memutar video stream CCTV.");
            setIsLoading(false);
            teardown();
            break;
        }
      });
    } catch (err) {
      console.error("Gagal mengimpor hls.js:", err);
      setErrorMessage("Gagal memuat modul pemutar video HLS.");
      setIsLoading(false);
    }
  }, [playbackUrl, autoPlay, teardown]);

  useEffect(() => {
    initPlayer();

    return () => teardown();
  }, [initPlayer, teardown]);

  // Error pada jalur HLS native (Safari) tidak lewat event hls.js.
  const handleNativeVideoError = () => {
    if (hlsInstanceRef.current) return;
    setErrorMessage(
      "Feed HLS tidak dapat diputar. Pastikan kamera sedang streaming dan server CCTV mengizinkan akses dari ERP."
    );
    setIsLoading(false);
  };

  /** Posisi siaran terkini: hls.js memberi liveSyncPosition, HLS native memakai ujung seekable. */
  const getLiveEdge = (): number | null => {
    const video = videoRef.current;
    if (!video) return null;
    const syncPosition = hlsInstanceRef.current?.liveSyncPosition;
    if (typeof syncPosition === "number" && Number.isFinite(syncPosition)) return syncPosition;
    if (video.seekable.length > 0) return video.seekable.end(video.seekable.length - 1);
    return null;
  };

  const handleTimeUpdate = () => {
    const video = videoRef.current;
    const edge = getLiveEdge();
    if (!video || edge === null) return;
    const behind = edge - video.currentTime > BEHIND_LIVE_THRESHOLD_S;
    setIsBehindLive((prev) => (prev === behind ? prev : behind));
  };

  const handleGoLive = () => {
    const video = videoRef.current;
    if (!video) return;
    const edge = getLiveEdge();
    if (edge !== null) video.currentTime = edge;
    setIsBehindLive(false);
    video.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
  };

  const handleTogglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      video.play().then(() => setIsPlaying(true));
    } else {
      video.pause();
      setIsPlaying(false);
    }
  };

  const handleToggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    const next = !isMuted;
    mutedRef.current = next;
    video.muted = next;
    setIsMuted(next);
  };

  const handleRetry = () => {
    retryCountRef.current = 0;
    initPlayer();
  };

  const handleInternalFullscreen = () => {
    if (onFullscreen) {
      onFullscreen();
      return;
    }
    const container = containerRef.current;
    if (!container) return;

    if (!document.fullscreenElement) {
      container.requestFullscreen().catch((err) => console.warn(err));
    } else {
      document.exitFullscreen().catch((err) => console.warn(err));
    }
  };

  return (
    <div
      ref={containerRef}
      className={`relative w-full aspect-video bg-slate-950 rounded-2xl overflow-hidden shadow-inner select-none group font-sans flex items-center justify-center ${className}`}
    >
      {/* Video Element */}
      <video
        ref={videoRef}
        playsInline
        muted={isMuted}
        onWaiting={() => setIsLoading(true)}
        onPlaying={() => {
          setIsLoading(false);
          setIsPlaying(true);
        }}
        onPause={() => setIsPlaying(false)}
        onTimeUpdate={handleTimeUpdate}
        onError={handleNativeVideoError}
        className="w-full h-full object-contain cursor-pointer"
        onClick={handleTogglePlay}
      />

      {/* Loading Overlay */}
      {isLoading && !errorMessage && (
        <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs flex flex-col items-center justify-center gap-2 text-white pointer-events-none z-10 animate-fade-in">
          <Loader2 size={32} className="animate-spin text-amber-400" />
          <span className="text-xs font-semibold tracking-wide text-slate-200">
            Menghubungkan Stream...
          </span>
        </div>
      )}

      {/* Error Overlay */}
      {errorMessage && (
        <div className="absolute inset-0 bg-slate-950/90 flex flex-col items-center justify-center p-6 text-center text-white z-20">
          <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center mb-2.5 border border-rose-500/30">
            <AlertCircle size={24} />
          </div>
          <h5 className="text-sm font-bold text-slate-100">Feed Video Tidak Dapat Dimuat</h5>
          <p className="text-xs text-slate-400 max-w-sm mt-1 leading-relaxed">{errorMessage}</p>
          <button
            type="button"
            onClick={handleRetry}
            className="mt-4 px-4 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
          >
            <RotateCw size={13} />
            <span>Coba Lagi</span>
          </button>
        </div>
      )}

      {/* Header Bar Overlay: Indikator LIVE & Judul Kamera */}
      <div className="absolute top-0 left-0 right-0 p-3 bg-gradient-to-b from-black/70 via-black/30 to-transparent flex items-center justify-between pointer-events-none z-10">
        <div className="flex items-center gap-2">
          {showLiveBadge && !errorMessage && (isPlaying && !isBehindLive ? (
            <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-rose-600 text-white font-black text-[0.65rem] tracking-wider uppercase shadow-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              <span>LIVE</span>
            </div>
          ) : (
            // Video dijeda / tertinggal dari siaran: status ditulis dengan teks, bukan hanya warna.
            <button
              type="button"
              onClick={handleGoLive}
              title="Lompat ke siaran terkini"
              className="pointer-events-auto flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-slate-600/90 hover:bg-rose-600 text-white font-black text-[0.65rem] tracking-wider uppercase shadow-xs transition-colors cursor-pointer"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
              <span>{isPlaying ? "Tertinggal" : "Dijeda"} · Kembali ke live</span>
            </button>
          ))}
          <span className="text-xs font-semibold text-white/90 drop-shadow-sm truncate max-w-[200px] sm:max-w-xs">
            {cameraName}
          </span>
        </div>
      </div>

      {/* Bottom Controls Bar Overlay */}
      {controls && !errorMessage && (
        <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleTogglePlay}
              aria-label={isPlaying ? "Jeda feed" : "Putar feed"}
              className="w-8 h-8 rounded-lg bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              {isPlaying ? <Pause size={15} /> : <Play size={15} />}
            </button>

            <button
              type="button"
              onClick={handleToggleMute}
              aria-label={isMuted ? "Aktifkan suara" : "Bisukan suara"}
              className="w-8 h-8 rounded-lg bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              {isMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleInternalFullscreen}
              aria-label="Layar penuh"
              className="w-8 h-8 rounded-lg bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              <Maximize2 size={15} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

