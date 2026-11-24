import React, { useEffect } from "react";
import { X, MapPin, Server, Radio, Info } from "lucide-react";
import type { CctvCamera } from "../../types/cctv";
import { HlsPlayer } from "./HlsPlayer";
import { CctvStatusBadge } from "./CctvStatusBadge";
import { formatCodec, formatResolution } from "../../utils/cctv";

export interface CctvPlayerModalProps {
  camera: CctvCamera | null;
  isOpen: boolean;
  onClose: () => void;
}

export const CctvPlayerModal: React.FC<CctvPlayerModalProps> = ({
  camera,
  isOpen,
  onClose,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !camera) return null;

  const siteName = camera.site?.site_name || "Data Center";
  const roomName = camera.site_room?.room_name || "-";
  const rackCode = camera.rack?.rack_code;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Live stream ${camera.camera_name}`}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-sm animate-fade-in"
    >
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
        {/* Header Modal */}
        <div className="p-4 sm:p-5 border-b border-slate-800/80 flex items-center justify-between gap-4 bg-slate-900/90">
          <div className="flex items-center gap-3 truncate">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
              <Radio size={20} />
            </div>
            <div className="truncate">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white truncate">{camera.camera_name}</h3>
                <CctvStatusBadge
                  status={camera.status}
                  playableInBrowser={camera.playable_in_browser}
                  sourceType={camera.source_type}
                />
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5">
                <span className="flex items-center gap-1 truncate">
                  <MapPin size={12} className="text-sky-400" />
                  {siteName} • {roomName}
                </span>
                {rackCode && (
                  <span className="flex items-center gap-1 text-amber-300/90 font-mono">
                    <Server size={12} />
                    Rak {rackCode}
                  </span>
                )}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup jendela pemutar"
            className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer shrink-0"
          >
            <X size={18} />
          </button>
        </div>

        {/* Video Player Area */}
        <div className="p-3 sm:p-5 bg-slate-950 flex flex-col items-center justify-center">
          {camera.playable_in_browser && camera.playback_url ? (
            <HlsPlayer
              playbackUrl={camera.playback_url}
              cameraName={camera.camera_name}
              autoPlay={true}
              muted={true}
              controls={true}
              className="w-full max-h-[65vh]"
            />
          ) : (
            <div className="w-full aspect-video rounded-2xl bg-slate-900 border border-slate-800 flex flex-col items-center justify-center p-6 text-center text-slate-400">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mb-3">
                <Info size={28} />
              </div>
              <h4 className="text-base font-bold text-slate-200">
                Stream RTMP Belum Dapat Diputar di Browser
              </h4>
              <p className="text-xs text-slate-400 max-w-md mt-1.5 leading-relaxed">
                Kamera ini menggunakan protokol <strong className="text-slate-300">RTMP</strong>. Browser membutuhkan
                layanan transkoding HLS (.m3u8) untuk menampilkan feed video langsung di layar.
              </p>
              <div className="mt-4 px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700/60 font-mono text-xs text-slate-300">
                Sumber Alamat: {camera.source_url_masked}
              </div>
            </div>
          )}
        </div>

        {/* Footer Info Strip */}
        <div className="px-5 py-3.5 bg-slate-900 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
          <div className="flex flex-wrap items-center gap-4">
            <span>
              <strong className="text-slate-300">Brand/Model:</strong>{" "}
              {camera.device_brand || "-"} {camera.model_series || ""}
            </span>
            <span>
              <strong className="text-slate-300">NVR:</strong> {camera.nvr_name || "-"}{" "}
              {camera.nvr_channel ? `(Ch. ${camera.nvr_channel})` : ""}
            </span>
            <span>
              <strong className="text-slate-300">Resolusi:</strong> {formatResolution(camera.resolution)}
            </span>
            <span>
              <strong className="text-slate-300">Codec:</strong> {formatCodec(camera.video_codec)}
            </span>
          </div>

          <div className="font-mono text-[0.7rem] text-slate-500">
            Masked Stream: {camera.source_url_masked}
          </div>
        </div>
      </div>
    </div>
  );
};

