import React from "react";
import { DashboardStatusBanner } from "../common/DashboardStatusBanner";

export interface SiteStatusBannerProps {
  isOperational?: boolean;
  lastUpdated?: string;
  totalSites?: number;
  maintenanceSites?: number;
}

export const SiteStatusBanner: React.FC<SiteStatusBannerProps> = ({
  isOperational = true,
  lastUpdated,
  maintenanceSites = 0,
}) => {
  return (
    <DashboardStatusBanner
      isOperational={isOperational}
      statusTitle="ALL SYSTEMS OPERATIONAL"
      attentionTitle="SYSTEM ATTENTION REQUIRED"
      subtitle={
        isOperational
          ? "Semua sistem berjalan normal"
          : `${maintenanceSites} site membutuhkan perhatian`
      }
      lastUpdated={lastUpdated}
    />
  );
};

export default SiteStatusBanner;
