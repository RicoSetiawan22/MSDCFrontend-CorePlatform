import React from "react";
import { Link } from "react-router-dom";
import { Link2, Lock, Inbox } from "lucide-react";
import type { IpAddress, IpAddressStatus } from "../../types/ipam";

export interface IpAddressTableProps {
  addresses: IpAddress[];
  isLoading: boolean;
  onAllocate: (address: IpAddress) => void;
  onRelease: (address: IpAddress) => void;
  onGenerateClick?: () => void;
  canGenerate?: boolean;
}

const STATUS_BADGE_CONFIG: Record<
  IpAddressStatus,
  { label: string; className: string }
> = {
  available: {
    label: "Available",
    className: "bg-emerald-50 text-emerald-700 border border-emerald-200/80",
  },
  allocated: {
    label: "Allocated",
    className: "bg-blue-50 text-blue-700 border border-blue-200/80",
  },
  reserved: {
    label: "Reserved",
    className: "bg-amber-50 text-amber-700 border border-amber-200/80",
  },
  blocked: {
    label: "Blocked",
    className: "bg-rose-50 text-rose-700 border border-rose-200/80",
  },
};

export const IpAddressTable: React.FC<IpAddressTableProps> = ({
  addresses,
  isLoading,
  onAllocate,
  onRelease,
  onGenerateClick,
  canGenerate,
}) => {
  if (isLoading && addresses.length === 0) {
    return (
      <div className="overflow-x-auto rounded-xl border border-slate-200/80 bg-white">
        <table className="w-full text-left border-collapse">
          <thead className="bg-[#FEF9EE] border-b border-amber-200/60 text-slate-700 uppercase tracking-wider text-[0.72rem] font-bold">
            <tr>
              <th className="px-4 py-3">IP ADDRESS</th>
              <th className="px-4 py-3">STATUS</th>
              <th className="px-4 py-3">CUSTOMER</th>
              <th className="px-4 py-3">KONTRAK</th>
              <th className="px-4 py-3">TGL ALOKASI</th>
              <th className="px-4 py-3 text-center">AKSI</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {Array.from({ length: 5 }).map((_, idx) => (
              <tr key={idx} className="animate-pulse">
                <td className="px-4 py-3.5">
                  <div className="h-4 w-28 bg-slate-100 rounded"></div>
                </td>
                <td className="px-4 py-3.5">
                  <div className="h-5 w-20 bg-slate-100 rounded-md"></div>
                </td>
                <td className="px-4 py-3.5">
                  <div className="h-4 w-24 bg-slate-100 rounded"></div>
                </td>
                <td className="px-4 py-3.5">
                  <div className="h-4 w-20 bg-slate-100 rounded"></div>
                </td>
                <td className="px-4 py-3.5">
                  <div className="h-4 w-36 bg-slate-100 rounded"></div>
                </td>
                <td className="px-4 py-3.5 text-center">
                  <div className="h-7 w-7 bg-slate-100 rounded-lg mx-auto"></div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (addresses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 rounded-xl border border-dashed border-slate-200 bg-slate-50/50 text-center">
        <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 mb-3">
          <Inbox size={22} />
        </div>
        <h3 className="text-sm font-bold text-slate-800">
          Belum Ada Alamat IP
        </h3>
        <p className="text-xs text-slate-500 max-w-sm mt-1 mb-4 leading-relaxed">
          Alamat IP di subnet ini belum di-generate atau tidak ada yang sesuai dengan filter pencarian saat ini.
        </p>
        {canGenerate && onGenerateClick && (
          <button
            type="button"
            onClick={onGenerateClick}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#E59B00] hover:bg-[#D48F00] active:bg-[#c28100] text-white text-xs font-bold rounded-lg transition-all shadow-xs cursor-pointer"
          >
            <span>Generate Alamat IP Sekarang</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200/80 bg-white">
      <table className="w-full text-left border-collapse">
        <thead className="bg-[#FEF9EE] border-b border-amber-200/60 text-slate-700 uppercase tracking-wider text-[0.72rem] font-bold">
          <tr>
            <th className="px-4 py-3">IP ADDRESS</th>
            <th className="px-4 py-3">STATUS</th>
            <th className="px-4 py-3">CUSTOMER</th>
            <th className="px-4 py-3">KONTRAK</th>
            <th className="px-4 py-3">TGL ALOKASI</th>
            <th className="px-4 py-3 text-center">AKSI</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 text-xs">
          {addresses.map((addr) => {
            const statusConfig = STATUS_BADGE_CONFIG[addr.status] || {
              label: addr.status,
              className: "bg-slate-100 text-slate-700 border border-slate-200",
            };

            return (
              <tr
                key={addr.id}
                className="hover:bg-slate-50/70 transition-colors"
              >
                {/* ── IP Address ── */}
                <td className="px-4 py-3.5 font-mono font-bold text-slate-900 text-xs sm:text-sm">
                  {addr.ip_address}
                </td>

                {/* ── Status Badge ── */}
                <td className="px-4 py-3.5">
                  <span
                    className={`inline-block px-2.5 py-0.5 rounded-md text-[0.72rem] font-bold ${statusConfig.className}`}
                  >
                    {statusConfig.label}
                  </span>
                </td>

                {/* ── Customer ── */}
                <td className="px-4 py-3.5 font-semibold text-slate-800">
                  {addr.customer?.company_name ? (
                    addr.customer.company_name
                  ) : (
                    <span className="text-slate-400 font-normal">—</span>
                  )}
                </td>

                {/* ── Kontrak ── */}
                <td className="px-4 py-3.5">
                  {addr.contract_service ? (
                    <Link
                      to={`/crm-sales/contracts/${addr.contract_service.contract_id}`}
                      className="text-sky-600 hover:text-sky-700 hover:underline font-medium font-sans text-xs cursor-pointer"
                    >
                      Lihat Contract
                    </Link>
                  ) : (
                    <span className="text-slate-400">—</span>
                  )}
                </td>

                {/* ── Tgl Alokasi ── */}
                <td className="px-4 py-3.5 font-mono text-slate-600">
                  {addr.allocated_date || <span className="text-slate-400 font-sans">—</span>}
                </td>

                {/* ── Aksi ── */}
                <td className="px-4 py-3.5 text-center">
                  <div className="flex items-center justify-center gap-1.5">
                    {addr.status === "available" && (
                      <button
                        type="button"
                        onClick={() => onAllocate(addr)}
                        title="Alokasikan IP"
                        className="w-8 h-8 rounded-lg border border-slate-200 bg-white flex items-center justify-center text-slate-400 hover:text-amber-600 hover:border-amber-300 hover:bg-amber-50/60 transition-colors cursor-pointer shadow-2xs"
                      >
                        <Link2 size={13} />
                      </button>
                    )}

                    {addr.status === "allocated" && (
                      <button
                        type="button"
                        onClick={() => onRelease(addr)}
                        title="Lepas Alokasi IP"
                        className="w-8 h-8 rounded-lg border border-slate-200 bg-white flex items-center justify-center text-slate-400 hover:text-rose-600 hover:border-rose-300 hover:bg-rose-50/60 transition-colors cursor-pointer shadow-2xs"
                      >
                        <Lock size={13} />
                      </button>
                    )}

                    {addr.status !== "available" && addr.status !== "allocated" && (
                      <span className="text-slate-300 text-xs">—</span>
                    )}
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

export default IpAddressTable;
