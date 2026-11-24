import React from "react";
import { DashboardStatusBanner } from "../common/DashboardStatusBanner";

export interface DeviceStatusBannerProps {
  isOperational?: boolean;
  lastUpdated?: string;
  maintenanceDevices?: number;
}

export const DeviceStatusBanner: React.FC<DeviceStatusBannerProps> = ({
  isOperational = true,
  lastUpdated,
  maintenanceDevices = 0,
}) => {
  return (
    <DashboardStatusBanner
      isOperational={isOperational}
      statusTitle="ALL SYSTEMS OPERATIONAL"
      attentionTitle="SYSTEM ATTENTION REQUIRED"
      subtitle={
        isOperational
          ? "Semua sistem perangkat berjalan normal"
          : `${maintenanceDevices} perangkat dalam status pemeliharaan / perlu perhatian`
      }
      lastUpdated={lastUpdated}
    />
  );
};

export default DeviceStatusBanner;
