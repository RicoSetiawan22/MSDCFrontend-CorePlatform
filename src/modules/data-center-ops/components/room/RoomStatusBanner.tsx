import React from "react";
import { DashboardStatusBanner } from "../common/DashboardStatusBanner";

export interface RoomStatusBannerProps {
  isOperational?: boolean;
  lastUpdated?: string;
  maintenanceRooms?: number;
  className?: string;
}

export const RoomStatusBanner: React.FC<RoomStatusBannerProps> = ({
  isOperational = true,
  lastUpdated,
  maintenanceRooms = 0,
  className = "",
}) => {
  const operational = isOperational && maintenanceRooms === 0;

  return (
    <DashboardStatusBanner
      isOperational={operational}
      statusTitle="ALL ROOMS OPERATIONAL"
      attentionTitle="ROOM ATTENTION REQUIRED"
      badge={
        operational ? (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
            Normal: Seluruh Ruangan Beroperasi Optimal
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
            Perhatian: Terdapat ruangan dalam perawatan
          </span>
        )
      }
      subtitle={
        operational
          ? "Semua ruangan data center beroperasi normal dan memenuhi standar lingkungan fisik."
          : `${maintenanceRooms} ruangan dalam status pemeliharaan / perlu perhatian.`
      }
      lastUpdated={lastUpdated}
      className={className}
    />
  );
};

export default RoomStatusBanner;
