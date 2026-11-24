import React from "react";
import { DashboardStatusBanner } from "../common/DashboardStatusBanner";

export interface UsageStatusBannerProps {
  isOperational?: boolean;
  lastUpdated?: string;
  draftCount?: number;
}

export const UsageStatusBanner: React.FC<UsageStatusBannerProps> = ({
  isOperational = true,
  lastUpdated,
  draftCount = 0,
}) => {
  return (
    <DashboardStatusBanner
      isOperational={isOperational}
      statusTitle="ALL SYSTEMS OPERATIONAL"
      attentionTitle="USAGE RECORDS ATTENTION REQUIRED"
      badge={
        draftCount > 0 ? (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
            {draftCount} Perlu Ditagih / Draft
          </span>
        ) : undefined
      }
      subtitle={
        draftCount > 0
          ? `${draftCount} pencatatan pemakaian berstatus draft / perlu diproses untuk penagihan ke Finance.`
          : "Agregasi daya listrik, alokasi ruang rack, pemakaian bandwidth, dan remote hands billing berjalan normal."
      }
      lastUpdated={lastUpdated}
    />
  );
};

export default UsageStatusBanner;
