import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { PageHeader } from "@shared/components/PageHeader";
import type { Otb } from "../../types/otb";

export interface OtbDetailHeroProps {
  otb: Otb;
}

export const OtbDetailHero: React.FC<OtbDetailHeroProps> = ({ otb }) => {
  return (
    <div className="flex flex-col gap-4">
      {/* ── Breadcrumb ── */}
      <nav aria-label="Breadcrumb" className="px-7 pt-5 flex items-center gap-1.5 text-xs font-medium text-slate-500">
        <Link
          to="/dc/otbs"
          className="hover:text-amber-600 transition-colors"
        >
          OTB Inventory
        </Link>
        <ChevronRight size={13} className="text-slate-400" />
        <span className="text-slate-800 font-semibold">{otb.tag_number}</span>
      </nav>

      {/* ── Banner Header Standar MSDC ── */}
      <PageHeader
        title="OTB Inventory"
        subtitle="Pemantauan infrastruktur fisik & operasional 24×7"
        containerClassName="px-7 py-2"
      />

      {/* ── Hero Title Card Putih (Sesuai Gambar UI 1) ── */}
      <div className="mx-7 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {otb.tag_number}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
            {otb.location ?? "Lokasi belum diisi"} · {otb.port_count} Port
          </p>
        </div>

        {/* Tombol Kembali ke List OTB */}
        <Link
          to="/dc/otbs"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 text-xs font-semibold shadow-2xs hover:border-slate-300 transition-all cursor-pointer"
        >
          <ArrowLeft size={14} className="stroke-[2.2]" />
          <span>Kembali</span>
        </Link>
      </div>
    </div>
  );
};

export default OtbDetailHero;
