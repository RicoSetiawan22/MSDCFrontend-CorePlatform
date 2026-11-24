import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Network, Copy, Check } from "lucide-react";
import type { IpSubnet } from "../../types/ipam";

export interface IpamTableProps {
  subnets: IpSubnet[];
  isLoading: boolean;
}

export const IpamTable: React.FC<IpamTableProps> = ({
  subnets,
  isLoading,
}) => {
  const [copiedCidr, setCopiedCidr] = useState<string | null>(null);

  const handleCopy = (cidr: string) => {
    navigator.clipboard.writeText(cidr);
    setCopiedCidr(cidr);
    setTimeout(() => {
      setCopiedCidr(null);
    }, 2000);
  };

  if (isLoading && subnets.length === 0) {
    return (
      <div className="py-16 flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 border-3 border-amber-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-xs text-slate-500 font-medium">Memuat data subnet...</span>
      </div>
    );
  }

  if (!isLoading && subnets.length === 0) {
    return (
      <div className="py-14 flex flex-col items-center justify-center text-center px-4">
        <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
          <Network size={24} />
        </div>
        <h4 className="text-sm font-bold text-slate-700 mb-1">Tidak Ada Subnet Ditemukan</h4>
        <p className="text-xs text-slate-500 max-w-sm">
          Belum ada subnet yang terdaftar atau tidak ada hasil yang cocok dengan filter pencarian.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto rounded-xl border border-slate-200/80 bg-white">
      <table className="w-full text-left border-collapse min-w-[700px]">
        {/* ── Table Header: Gold / Amber Tinted ── */}
        <thead>
          <tr className="bg-[#FEF9EE] border-b border-amber-200/60 text-[0.72rem] font-bold text-slate-700 uppercase tracking-wider">
            <th className="py-3 px-4">CIDR</th>
            <th className="py-3 px-4 text-center">IP Version</th>
            <th className="py-3 px-4 text-center">Type</th>
            <th className="py-3 px-4">Gateway</th>
            <th className="py-3 px-4">Description</th>
            <th className="py-3 px-4 text-right">Aksi</th>
          </tr>
        </thead>

        {/* ── Table Body ── */}
        <tbody className="divide-y divide-slate-100 text-xs">
          {subnets.map((sub) => {
            const isIpv4 = sub.ip_version?.toLowerCase() === "ipv4";
            const isPublic = sub.subnet_type?.toLowerCase() === "public";
            const isCopied = copiedCidr === sub.cidr;

            return (
              <tr
                key={sub.id}
                className="hover:bg-amber-50/20 transition-colors group"
              >
                {/* 1. CIDR */}
                <td className="py-3.5 px-4">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-slate-900 text-[0.85rem] tracking-tight">
                      {sub.cidr}
                    </span>
                  </div>
                </td>

                {/* 2. IP Version */}
                <td className="py-3.5 px-4 text-center">
                  <span
                    className={`inline-flex items-center justify-center px-2 py-0.5 rounded-md text-[0.7rem] font-bold uppercase tracking-wider ${
                      isIpv4
                        ? "bg-sky-50 text-sky-700 border border-sky-200/60"
                        : "bg-purple-50 text-purple-700 border border-purple-200/60"
                    }`}
                  >
                    {sub.ip_version}
                  </span>
                </td>

                {/* 3. Subnet Type */}
                <td className="py-3.5 px-4 text-center">
                  <span
                    className={`inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-[0.7rem] font-semibold capitalize ${
                      isPublic
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200/70"
                        : "bg-amber-50 text-amber-700 border border-amber-200/70"
                    }`}
                  >
                    {sub.subnet_type}
                  </span>
                </td>

                {/* 4. Gateway */}
                <td className="py-3.5 px-4 font-mono text-slate-600 text-[0.8rem]">
                  {sub.gateway ? sub.gateway : <span className="text-slate-300 font-sans">—</span>}
                </td>

                {/* 5. Description */}
                <td className="py-3.5 px-4 text-slate-600 max-w-[200px] truncate">
                  {sub.description ? sub.description : <span className="text-slate-300">—</span>}
                </td>

                {/* 6. Aksi dengan Tooltips */}
                <td className="py-3.5 px-4 text-right">
                  <div className="inline-flex items-center justify-end gap-1.5">
                    {/* Tooltip: Salin CIDR */}
                    <button
                      type="button"
                      onClick={() => handleCopy(sub.cidr)}
                      title={isCopied ? "CIDR berhasil disalin!" : "Salin CIDR"}
                      className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 text-slate-500 hover:text-slate-800 transition-all cursor-pointer relative group/tip"
                      aria-label="Salin CIDR"
                    >
                      {isCopied ? (
                        <Check size={13} className="text-emerald-600" />
                      ) : (
                        <Copy size={13} />
                      )}
                    </button>

                    {/* Tooltip: Kelola Alamat IP */}
                    <Link
                      to={`/dc/ipam/${sub.id}`}
                      title="Kelola & Alokasi Alamat IP"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 hover:border-amber-400 text-slate-700 hover:text-amber-700 text-xs font-semibold shadow-2xs transition-all cursor-pointer"
                    >
                      <Network size={13} className="text-[#E59B00]" />
                      <span className="hidden sm:inline">Kelola Alamat IP</span>
                    </Link>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default IpamTable;
