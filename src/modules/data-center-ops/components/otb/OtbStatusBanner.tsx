import React from "react";
import { DashboardStatusBanner } from "../common/DashboardStatusBanner";

export interface OtbStatusBannerProps {
  isOperational?: boolean;
  lastUpdated?: string;
  damagedPortsCount?: number;
}

export const OtbStatusBanner: React.FC<OtbStatusBannerProps> = ({
  isOperational = true,
  lastUpdated,
  damagedPortsCount = 0,
}) => {
  return (
    <DashboardStatusBanner
      isOperational={isOperational}
      statusTitle="ALL SYSTEMS OPERATIONAL"
      attentionTitle="SYSTEM ATTENTION REQUIRED"
      subtitle={
        isOperational
          ? "Semua sistem berjalan normal"
          : `${damagedPortsCount} port OTB dalam status rusak / perlu perhatian`
      }
      lastUpdated={lastUpdated}
    />
  );
};

export default OtbStatusBanner;
