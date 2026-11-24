import React from "react";
import { PageHeader } from "@shared/components/PageHeader";
import { VisitorScannerView } from "../components/visitor-scanner";

export const VisitorPassScannerPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#F5F7FA] pb-16">
      {/* ── 1. Page Header Bergaya MSDC ── */}
      <PageHeader
        title="Scanner Pos Jaga & Verifikasi Akses"
        subtitle="Stasiun kerja resepsionis/NOC: pemindaian QR Code live, otorisasi check-in/out instan, dan anti-replay guard"
        containerClassName="px-7 pt-5 pb-2"
      />

      {/* ── 2. Konten Scanner Viewport ── */}
      <div className="px-7 py-5">
        <VisitorScannerView />
      </div>
    </div>
  );
};
