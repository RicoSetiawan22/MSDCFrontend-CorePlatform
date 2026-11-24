import React from "react";
import { DashboardStatusBanner } from "../common/DashboardStatusBanner";

export interface SuratDcOpsStatusBannerProps {
  isOperational?: boolean;
  lastUpdated?: string;
  pendingApprovalCount?: number;
}

export const SuratDcOpsStatusBanner: React.FC<SuratDcOpsStatusBannerProps> = ({
  isOperational = true,
  lastUpdated,
  pendingApprovalCount = 0,
}) => {
  return (
    <DashboardStatusBanner
      isOperational={isOperational}
      statusTitle="ALL SYSTEMS OPERATIONAL"
      attentionTitle="DOCUMENTS PENDING ATTENTION"
      badge={
        pendingApprovalCount > 0 ? (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
            {pendingApprovalCount} Butuh Persetujuan
          </span>
        ) : undefined
      }
      subtitle={
        pendingApprovalCount > 0
          ? `${pendingApprovalCount} surat & dokumen operasional menunggu persetujuan (approval).`
          : "Penerbitan berita acara instalasi, izin akses fasilitas DC, dan tata naskah dinas resmi berjalan normal."
      }
      lastUpdated={lastUpdated}
    />
  );
};

export default SuratDcOpsStatusBanner;
