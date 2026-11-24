import React from "react";
import { DashboardStatusBanner } from "../common/DashboardStatusBanner";

export interface TicketStatusBannerProps {
  isOperational?: boolean;
  lastUpdated?: string;
  overdueCount?: number;
  openCount?: number;
}

export const TicketStatusBanner: React.FC<TicketStatusBannerProps> = ({
  isOperational = true,
  lastUpdated,
  overdueCount = 0,
}) => {
  return (
    <DashboardStatusBanner
      isOperational={isOperational}
      statusTitle="ALL SYSTEMS OPERATIONAL"
      attentionTitle="SYSTEM ATTENTION REQUIRED"
      subtitle={
        isOperational
          ? "Semua sistem berjalan normal"
          : `${overdueCount} tiket dalam status melewati target SLA / perlu perhatian`
      }
      lastUpdated={lastUpdated}
    />
  );
};

export default TicketStatusBanner;
