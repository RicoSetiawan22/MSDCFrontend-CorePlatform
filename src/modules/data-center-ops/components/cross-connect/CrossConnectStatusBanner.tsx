import React from "react";
import { DashboardStatusBanner } from "../common/DashboardStatusBanner";

export interface CrossConnectStatusBannerProps {
  isOperational?: boolean;
  lastUpdated?: string;
  damagedCount?: number;
}

export const CrossConnectStatusBanner: React.FC<CrossConnectStatusBannerProps> = ({
  isOperational = true,
  lastUpdated,
  damagedCount = 0,
}) => {
  return (
    <DashboardStatusBanner
      isOperational={isOperational}
      statusTitle="ALL SYSTEMS OPERATIONAL"
      attentionTitle="SYSTEM ATTENTION REQUIRED"
      subtitle={
        isOperational
          ? "Semua sistem berjalan normal"
          : `${damagedCount} kabel cross-connect dalam status rusak / perlu perhatian`
      }
      lastUpdated={lastUpdated}
    />
  );
};

export default CrossConnectStatusBanner;
