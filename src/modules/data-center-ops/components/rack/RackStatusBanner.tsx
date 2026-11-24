import React from "react";
import { DashboardStatusBanner } from "../common/DashboardStatusBanner";

export interface RackStatusBannerProps {
  isOperational?: boolean;
  lastUpdated?: string;
  maintenanceRacks?: number;
}

export const RackStatusBanner: React.FC<RackStatusBannerProps> = ({
  isOperational = true,
  lastUpdated,
  maintenanceRacks = 0,
}) => {
  return (
    <DashboardStatusBanner
      isOperational={isOperational}
      statusTitle="ALL SYSTEMS OPERATIONAL"
      attentionTitle="SYSTEM ATTENTION REQUIRED"
      subtitle={
        isOperational
          ? "Semua sistem berjalan normal"
          : `${maintenanceRacks} rack membutuhkan perhatian`
      }
      lastUpdated={lastUpdated}
    />
  );
};

export default RackStatusBanner;
