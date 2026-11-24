import React from "react";
import { DashboardStatusBanner } from "../common/DashboardStatusBanner";

export interface WorkOrderStatusBannerProps {
  isOperational?: boolean;
  lastUpdated?: string;
  inProgressCount?: number;
}

export const WorkOrderStatusBanner: React.FC<WorkOrderStatusBannerProps> = ({
  isOperational = true,
  lastUpdated,
  inProgressCount = 0,
}) => {
  return (
    <DashboardStatusBanner
      isOperational={isOperational}
      statusTitle="ALL SYSTEMS OPERATIONAL"
      attentionTitle="WORK ORDERS PENDING ATTENTION"
      subtitle={
        inProgressCount > 0
          ? `${inProgressCount} perintah kerja aktif sedang dalam tahap instalasi fisik & pengujian.`
          : "Semua instalasi fisik Sales Order aktif berjalan normal sesuai jadwal."
      }
      lastUpdated={lastUpdated}
    />
  );
};

export default WorkOrderStatusBanner;
