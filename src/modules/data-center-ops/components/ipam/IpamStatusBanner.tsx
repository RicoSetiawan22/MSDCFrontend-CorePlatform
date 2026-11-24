import React from "react";
import { DashboardStatusBanner } from "../common/DashboardStatusBanner";

export interface IpamStatusBannerProps {
  isOperational?: boolean;
  lastUpdated?: string;
  statusMessage?: string;
}

export const IpamStatusBanner: React.FC<IpamStatusBannerProps> = ({
  isOperational = true,
  lastUpdated,
  statusMessage,
}) => {
  return (
    <DashboardStatusBanner
      isOperational={isOperational}
      statusTitle="ALL SYSTEMS OPERATIONAL"
      attentionTitle="SYSTEM ATTENTION REQUIRED"
      subtitle={
        statusMessage ||
        (isOperational
          ? "Semua sistem berjalan normal"
          : "Perlu perhatian teknis pada beberapa subnet")
      }
      lastUpdated={lastUpdated}
    />
  );
};

export default IpamStatusBanner;
