import React from "react";
import { Info } from "lucide-react";
import type { CctvCameraStatus, CctvSourceType } from "../../types/cctv";
import { getCctvStatusConfig } from "../../utils/cctv";

export interface CctvStatusBadgeProps {
  status: CctvCameraStatus;
  playableInBrowser?: boolean;
  sourceType?: CctvSourceType;
  className?: string;
  showUnplayableHint?: boolean;
}

export const CctvStatusBadge: React.FC<CctvStatusBadgeProps> = ({
  status,
  playableInBrowser = false,
  sourceType = "hls",
  className = "",
  showUnplayableHint = true,
}) => {
  const config = getCctvStatusConfig(status, playableInBrowser, sourceType);

  return (
    <div className={`inline-flex flex-wrap items-center gap-1.5 ${className}`}>
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border shadow-2xs ${config.bg} ${config.border}`}
      >
        <span className="relative flex h-2 w-2">
          {config.pulse && (
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${config.dotColor}`}
            />
          )}
          <span className={`relative inline-flex rounded-full h-2 w-2 ${config.dotColor}`} />
        </span>
        <span className="tracking-wide text-[0.72rem] uppercase font-bold">{config.label}</span>
      </span>

      {/* Indikator informatif khusus kamera RTMP yang belum ditranskodekan */}
      {config.isRtmpUnplayable && showUnplayableHint && (
        <span
          title="Stream RTMP aktif di NVR, namun browser memerlukan format HLS (.m3u8) untuk dapat memutar video langsung."
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[0.68rem] font-medium bg-amber-50 text-amber-700 border border-amber-200"
        >
          <Info size={11} className="shrink-0 text-amber-600" />
          <span>Butuh HLS</span>
        </span>
      )}
    </div>
  );
};

