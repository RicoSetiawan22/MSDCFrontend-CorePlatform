import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Video,
  Plus,
  ExternalLink,
  Radio,
  Tv,
  Maximize2,
} from "lucide-react";
import { useAuth } from "@shared/lib/auth-context";
import { useCctvCameras } from "../../api/useCctv";
import { CctvStatusBadge } from "./CctvStatusBadge";
import { HlsPlayer } from "./HlsPlayer";
import { CctvPlayerModal } from "./CctvPlayerModal";
import type { CctvCamera } from "../../types/cctv";

export interface RackCctvWidgetProps {
  rackId: number;
  rackCode?: string;
}

export const RackCctvWidget: React.FC<RackCctvWidgetProps> = ({
  rackId,
  rackCode = "",
}) => {
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const canManage = hasPermission("cctv.manage");

  const [activeModalCamera, setActiveModalCamera] = useState<CctvCamera | null>(null);
  const [selectedCameraIndex, setSelectedCameraIndex] = useState(0);

  const { data: cameraResponse, isLoading } = useCctvCameras({
    rack_id: rackId,
    per_page: 10,
  });

  const cameras = cameraResponse?.data || [];
  const activeCamera = cameras[selectedCameraIndex] || cameras[0] || null;

  if (isLoading) {
    return (
      <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-2xs animate-pulse">
        <div className="h-4 bg-slate-200 rounded w-1/3 mb-4" />
        <div className="aspect-video bg-slate-100 rounded-2xl w-full" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-2xs flex flex-col gap-4 font-sans">
      {/* Header Widget */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
            <Video size={16} />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <span>Pengawasan CCTV Rak</span>
              {cameras.length > 0 && (
                <span className="px-2 py-0.2 rounded-full bg-slate-100 text-slate-700 text-[0.65rem] font-bold">
                  {cameras.length} Kamera
                </span>
              )}
            </h4>
            <span className="text-[0.68rem] text-slate-400">
              Sorotan visual langsung ke arah Rak {rackCode}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {cameras.length > 0 && (
            <button
              type="button"
              onClick={() => navigate(`/dc/cctv?rack_id=${rackId}`)}
              title="Lihat di halaman grid pemantauan"
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
            >
              <ExternalLink size={14} />
            </button>
          )}

          {canManage && (
            <button
              type="button"
              onClick={() => navigate("/dc/cctv/new")}
              title="Tambah kamera baru"
              className="p-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 transition-colors cursor-pointer"
            >
              <Plus size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Konten Widget: Kamera Terhubung atau Empty State */}
      {cameras.length === 0 ? (
        <div className="py-6 px-4 text-center rounded-2xl bg-slate-50 border border-dashed border-slate-200 flex flex-col items-center justify-center">
          <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center mb-2">
            <Radio size={20} />
          </div>
          <span className="text-xs font-bold text-slate-700">Tidak Ada CCTV Terhubung</span>
          <p className="text-[0.68rem] text-slate-400 max-w-xs mt-0.5 leading-relaxed">
            Belum ada kamera pengawas yang diarahkan secara spesifik ke rak server ini.
          </p>

          {canManage && (
            <button
              type="button"
              onClick={() => navigate("/dc/cctv/new")}
              className="mt-3 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer"
            >
              <Plus size={13} />
              <span>Tautkan Kamera Baru</span>
            </button>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {/* Tabs jika lebih dari 1 kamera */}
          {cameras.length > 1 && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {cameras.map((cam, idx) => (
                <button
                  key={cam.id}
                  type="button"
                  onClick={() => setSelectedCameraIndex(idx)}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                    selectedCameraIndex === idx
                      ? "bg-slate-900 text-white shadow-xs"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {cam.camera_name}
                </button>
              ))}
            </div>
          )}

          {/* Active Camera View */}
          {activeCamera && (
            <div className="flex flex-col gap-2.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-slate-800 truncate">
                  {activeCamera.camera_name}
                </span>

                <CctvStatusBadge
                  status={activeCamera.status}
                  playableInBrowser={activeCamera.playable_in_browser}
                  sourceType={activeCamera.source_type}
                />
              </div>

              {/* Player Area */}
              <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-slate-950 border border-slate-800">
                {activeCamera.playable_in_browser && activeCamera.playback_url ? (
                  <HlsPlayer
                    playbackUrl={activeCamera.playback_url}
                    cameraName={activeCamera.camera_name}
                    autoPlay={true}
                    muted={true}
                    onFullscreen={() => setActiveModalCamera(activeCamera)}
                    className="w-full h-full"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center text-slate-400">
                    <Tv size={24} className="mb-1 text-slate-500" />
                    <span className="text-xs font-bold text-slate-300">
                      Stream RTMP Aktif
                    </span>
                    <span className="text-[0.65rem] text-slate-400 mt-0.5">
                      Menunggu transkoder HLS browser
                    </span>
                  </div>
                )}
              </div>

              {/* Footer info ringkas */}
              <div className="flex items-center justify-between text-[0.68rem] text-slate-400 pt-1">
                <span className="font-mono truncate max-w-[200px]">
                  {activeCamera.source_url_masked}
                </span>

                {activeCamera.playable_in_browser && (
                  <button
                    type="button"
                    onClick={() => setActiveModalCamera(activeCamera)}
                    className="font-bold text-amber-600 hover:text-amber-700 flex items-center gap-1 cursor-pointer"
                  >
                    <Maximize2 size={11} />
                    <span>Perbesar</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal Player Fullscreen */}
      <CctvPlayerModal
        camera={activeModalCamera}
        isOpen={Boolean(activeModalCamera)}
        onClose={() => setActiveModalCamera(null)}
      />
    </div>
  );
};

