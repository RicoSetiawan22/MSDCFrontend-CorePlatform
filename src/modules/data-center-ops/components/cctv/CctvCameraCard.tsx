import React, { useEffect, useRef, useState } from "react";
import {
  MapPin,
  Server,
  Play,
  RotateCw,
  MoreVertical,
  Edit,
  Trash2,
  Tv,
  Film,
  Radio,
  ExternalLink,
} from "lucide-react";
import type { CctvCamera } from "../../types/cctv";
import { CctvStatusBadge } from "./CctvStatusBadge";
import { formatCodec, formatRelativeTime, formatResolution } from "../../utils/cctv";
import { HlsPlayer } from "./HlsPlayer";

export interface CctvCameraCardProps {
  camera: CctvCamera;
  canManage?: boolean;
  onOpenPlayer: (camera: CctvCamera) => void;
  onEdit?: (camera: CctvCamera) => void;
  onDelete?: (camera: CctvCamera) => void;
  onCheck?: (camera: CctvCamera) => Promise<void> | void;
  isChecking?: boolean;
  /**
   * Player inline dikendalikan halaman induk agar jumlah stream aktif bisa dibatasi.
   * Tanpa onPlayInline/onStopInline, kartu mengelola state-nya sendiri.
   */
  isPlayingInline?: boolean;
  onPlayInline?: (camera: CctvCamera) => void;
  onStopInline?: (camera: CctvCamera) => void;
}

export const CctvCameraCard: React.FC<CctvCameraCardProps> = ({
  camera,
  canManage = false,
  onOpenPlayer,
  onEdit,
  onDelete,
  onCheck,
  isChecking = false,
  isPlayingInline,
  onPlayInline,
  onStopInline,
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [localPlaying, setLocalPlaying] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const isControlled = isPlayingInline !== undefined;
  const inlinePlaying = isControlled ? isPlayingInline : localPlaying;
  const startInline = () => (isControlled ? onPlayInline?.(camera) : setLocalPlaying(true));

  // Player yang keluar dari layar dihentikan supaya tidak terus mengunduh segmen.
  useEffect(() => {
    const node = cardRef.current;
    if (!inlinePlaying || !node || typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) {
          if (isControlled) onStopInline?.(camera);
          else setLocalPlaying(false);
        }
      },
      { threshold: 0 }
    );
    observer.observe(node);

    return () => observer.disconnect();
  }, [inlinePlaying, isControlled, onStopInline, camera]);

  const siteName = camera.site?.site_name || "Data Center";
  const roomName = camera.site_room?.room_name || "-";
  const rackCode = camera.rack?.rack_code;

  return (
    <div
      ref={cardRef}
      className="bg-white rounded-3xl border border-slate-200/90 shadow-xs hover:shadow-md transition-all overflow-hidden flex flex-col justify-between group"
    >
      {/* ── 1. Header Card ── */}
      <div className="p-4 sm:p-5 pb-3 flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 truncate">
          <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-100/80 shadow-2xs">
            <Radio size={20} className="stroke-[2.2]" />
          </div>

          <div className="truncate">
            <div className="flex items-center gap-2">
              <h3
                title={camera.camera_name}
                className="font-extrabold text-slate-900 text-sm sm:text-base leading-snug truncate"
              >
                {camera.camera_name}
              </h3>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
              <span className="flex items-center gap-1 truncate">
                <MapPin size={12} className="text-slate-400 shrink-0" />
                <span className="truncate">{siteName}</span>
                <span className="text-slate-300">•</span>
                <span className="truncate">{roomName}</span>
              </span>

              {rackCode && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-amber-50 text-amber-800 font-mono text-[0.68rem] font-bold border border-amber-200/80">
                  <Server size={10} />
                  <span>{rackCode}</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Action Menu (Edit / Delete) */}
        {canManage && (
          <div className="relative shrink-0">
            <button
              type="button"
              onClick={() => setShowMenu(!showMenu)}
              aria-label="Menu aksi kamera"
              className="w-8 h-8 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
            >
              <MoreVertical size={16} />
            </button>

            {showMenu && (
              <>
                <div
                  className="fixed inset-0 z-30"
                  onClick={() => setShowMenu(false)}
                />
                <div className="absolute right-0 top-9 z-40 w-36 bg-white rounded-2xl border border-slate-200 shadow-xl py-1.5 animate-in fade-in duration-100">
                  {onEdit && (
                    <button
                      type="button"
                      onClick={() => {
                        setShowMenu(false);
                        onEdit(camera);
                      }}
                      className="w-full px-3.5 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                    >
                      <Edit size={13} className="text-slate-400" />
                      <span>Ubah Kamera</span>
                    </button>
                  )}

                  {onDelete && (
                    <button
                      type="button"
                      onClick={() => {
                        setShowMenu(false);
                        onDelete(camera);
                      }}
                      className="w-full px-3.5 py-2 text-left text-xs font-semibold text-rose-600 hover:bg-rose-50 flex items-center gap-2 cursor-pointer border-t border-slate-100 mt-1"
                    >
                      <Trash2 size={13} className="text-rose-500" />
                      <span>Hapus</span>
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* ── 2. Badges Status Bar ── */}
      <div className="px-4 sm:px-5 pb-3 flex items-center justify-between gap-2">
        <CctvStatusBadge
          status={camera.status}
          playableInBrowser={camera.playable_in_browser}
          sourceType={camera.source_type}
        />

        <span
          className={`px-2 py-0.5 rounded-md text-[0.68rem] font-bold uppercase tracking-wider ${
            camera.source_type === "hls"
              ? "bg-sky-50 text-sky-700 border border-sky-200"
              : "bg-purple-50 text-purple-700 border border-purple-200"
          }`}
        >
          {camera.source_type.toUpperCase()}
        </span>
      </div>

      {/* ── 3. Area Video / Pratinjau ── */}
      <div className="px-4 sm:px-5 pb-3">
        {camera.playable_in_browser && camera.playback_url ? (
          <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-slate-950 border border-slate-900 group/player">
            {inlinePlaying ? (
              <HlsPlayer
                playbackUrl={camera.playback_url}
                cameraName={camera.camera_name}
                autoPlay={true}
                muted={true}
                onFullscreen={() => onOpenPlayer(camera)}
                className="w-full h-full"
              />
            ) : (
              <div
                onClick={startInline}
                className="w-full h-full flex flex-col items-center justify-center cursor-pointer bg-gradient-to-tr from-slate-950 via-slate-900 to-slate-950 text-white relative hover:opacity-95 transition-opacity"
              >
                {/* Subtle Grid Overlay */}
                <div className="absolute inset-0 bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:16px_16px] opacity-40" />

                <div className="w-12 h-12 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-400 flex items-center justify-center shadow-lg group-hover/player:scale-110 transition-transform z-10">
                  <Play size={20} className="ml-1 fill-amber-400 stroke-1" />
                </div>
                <span className="text-xs font-bold text-slate-200 mt-2 z-10 tracking-wide">
                  Putar Live Feed
                </span>
                <span className="text-[0.65rem] text-slate-400 z-10">Klik untuk streaming</span>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenPlayer(camera);
                  }}
                  title="Buka pemutar ukuran penuh"
                  className="absolute top-2.5 right-2.5 w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors z-20"
                >
                  <ExternalLink size={13} />
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="relative w-full aspect-video rounded-2xl bg-slate-900 border border-slate-800 flex flex-col items-center justify-center p-4 text-center text-slate-400">
            <div className="w-10 h-10 rounded-xl bg-slate-800 text-slate-400 flex items-center justify-center mb-1.5 border border-slate-700/60">
              <Tv size={20} />
            </div>
            <span className="text-xs font-bold text-slate-200">
              {camera.source_type === "rtmp" ? "Stream RTMP (NVR)" : "Stream Belum Tersedia"}
            </span>
            <p className="text-[0.68rem] text-slate-400 max-w-[210px] mt-0.5 leading-relaxed">
              {camera.source_type === "rtmp"
                ? "Feed aktif di jaringan lokal. Browser memerlukan alamat HLS untuk memutar."
                : "Belum ada feed HLS yang dapat diputar langsung di browser."}
            </p>
          </div>
        )}
      </div>

      {/* ── 4. Detail Teknis (NVR, Codec, Resolusi) ── */}
      <div className="px-4 sm:px-5 py-2.5 bg-slate-50/70 border-t border-slate-100 text-xs text-slate-600 flex items-center justify-between gap-2">
        <div className="truncate">
          <span className="font-semibold text-slate-700 truncate block">
            {camera.nvr_name || "NVR Kantor"}
            {camera.nvr_channel ? ` • Ch. ${camera.nvr_channel}` : ""}
          </span>
          <span className="text-[0.68rem] text-slate-400 font-mono truncate block">
            {camera.source_url_masked}
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0 text-[0.68rem] font-medium text-slate-500">
          <Film size={12} className="text-slate-400" />
          <span>{formatCodec(camera.video_codec)}</span>
          <span>•</span>
          <span>{formatResolution(camera.resolution).split(" ")[0]}</span>
        </div>
      </div>

      {/* ── 5. Footer & Tombol Aksi Cek Status ── */}
      <div className="p-4 sm:p-5 pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
        <div className="text-[0.68rem] text-slate-400 truncate">
          <span>Dicek: </span>
          <strong className="text-slate-600 font-semibold">
            {formatRelativeTime(camera.last_checked_at)}
          </strong>
        </div>

        <div className="flex items-center gap-2">
          {onCheck && (
            <button
              type="button"
              onClick={() => onCheck(camera)}
              disabled={isChecking}
              title="Cek konektivitas stream sekarang"
              className="px-3 py-1.5 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-2xs"
            >
              <RotateCw size={12} className={isChecking ? "animate-spin text-amber-500" : ""} />
              <span>{isChecking ? "Memeriksa..." : "Cek Ulang"}</span>
            </button>
          )}

          {camera.playable_in_browser && (
            <button
              type="button"
              onClick={() => onOpenPlayer(camera)}
              className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer"
            >
              <Play size={12} className="fill-white stroke-1" />
              <span>Buka</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

