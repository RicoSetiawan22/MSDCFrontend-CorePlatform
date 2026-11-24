import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import type { IpSubnet } from "../../types/ipam";

export interface IpSubnetHeroProps {
  subnet: IpSubnet;
}

export const IpSubnetHero: React.FC<IpSubnetHeroProps> = ({ subnet }) => {
  const subnetTypeLabel = subnet.subnet_type === "public" ? "Public" : "Private";
  const ipVersionLabel = (subnet.ip_version || "ipv4").toUpperCase();

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      {/* ── Subnet Title & Meta Info ── */}
      <div>
        <div className="flex items-center gap-3 flex-wrap">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-mono">
            {subnet.cidr}
          </h2>
          <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80 shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            AKTIF
          </span>
        </div>

        <p className="text-sm sm:text-base font-bold text-slate-800 mt-1">
          Gateway {subnet.gateway || "—"}
        </p>

        <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
          {subnetTypeLabel} · {ipVersionLabel}
        </p>
      </div>

      {/* ── Tombol Kembali ke IPAM ── */}
      <Link
        to="/dc/ipam"
        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg shadow-2xs transition-colors self-start sm:self-center"
      >
        <ArrowLeft size={14} />
        <span>Kembali</span>
      </Link>
    </div>
  );
};

export default IpSubnetHero;
