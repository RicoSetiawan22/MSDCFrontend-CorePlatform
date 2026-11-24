import React from "react";
import { DashboardStatusBanner } from "../common/DashboardStatusBanner";

export interface MonitoringDashboardStatusBannerProps {
  isOperational?: boolean;
  lastUpdated?: string;
  criticalCount?: number;
  monitoredCount?: number;
}

export const MonitoringDashboardStatusBanner: React.FC<MonitoringDashboardStatusBannerProps> = ({
  isOperational = true,
  lastUpdated,
  criticalCount = 0,
  monitoredCount = 0,
}) => {
  return (
    <DashboardStatusBanner
      isOperational={isOperational}
      statusTitle="TELEMETRI RAK OPERASIONAL NORMAL"
      attentionTitle="PERINGATAN TERMAL TERDETEKSI"
      subtitle={
        isOperational
          ? `Seluruh sensor telemetri (${monitoredCount} unit terpasang) beroperasi dalam batas toleransi standar ASHRAE TC 9.9.`
          : `${criticalCount} unit rak melanggar batas toleransi kritis! Tindakan eskalasi segera diperlukan.`
      }
      lastUpdated={lastUpdated}
    />
  );
};

export default MonitoringDashboardStatusBanner;
