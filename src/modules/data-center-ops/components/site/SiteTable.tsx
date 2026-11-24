import React, { useState } from "react";
import { MapPin, Zap, DoorOpen, Eye, Pencil, Trash2, AlertCircle, RotateCw, X } from "lucide-react";
import type { Site, SiteStatus } from "../../types/site";
import { useSetSiteStatus } from "../../api/useSites";
import { SiteTablePagination } from "./SiteTablePagination";
import { EmptyState } from "@shared/components/EmptyState";
import { LoadingState } from "@shared/components/LoadingState";
import { formatNumber } from "@shared/lib/format";
import { extractErrorMessage } from "@shared/types/api";

interface SiteTableProps {
  sites: Site[];
  isLoading: boolean;
  isError?: boolean;
  errorMessage?: string | null;
  onRetry?: () => void;
  onDetail: (siteId: number) => void;
  onEdit: (site: Site) => void;
  onDelete: (site: Site) => void;
  currentPage: number;
  lastPage: number;
  total: number;
  onPageChange: (page: number) => void;
}

export const SiteTable: React.FC<SiteTableProps> = ({
  sites,
  isLoading,
  isError,
  errorMessage,
  onRetry,
  onDetail,
  onEdit,
  onDelete,
  currentPage,
  lastPage,
  total,
  onPageChange,
}) => {
  const [statusError, setStatusError] = useState<string | null>(null);

  if (isLoading && sites.length === 0) {
    return (
      <div className="py-12">
        <LoadingState />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="py-12 px-4 flex flex-col items-center justify-center text-center">
        <div className="w-12 h-12 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mb-3">
          <AlertCircle size={24} />
        </div>
        <h3 className="text-sm font-bold text-slate-800 mb-1">Gagal Memuat Data</h3>
        <p className="text-xs text-slate-500 max-w-md mb-4 leading-relaxed">
          {errorMessage || "Terjadi kendala komunikasi dengan server. Periksa hak akses atau koneksi jaringan Anda."}
        </p>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-600 active:scale-95 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer"
          >
            <RotateCw size={13} />
            <span>Coba Muat Ulang</span>
          </button>
        )}
      </div>
    );
  }

  if (!isLoading && !isError && sites.length === 0) {
    return (
      <div className="py-8">
        <EmptyState
          title="Belum Ada Site"
          subtitle="Tambahkan site Data Center untuk mulai memantau infrastruktur."
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* ── Status Change Error Banner ── */}
      {statusError && (
        <div
          role="alert"
          className="bg-rose-50 border border-rose-200 rounded-xl p-3.5 flex items-start justify-between gap-3 text-xs text-rose-800 animate-in fade-in duration-150 shadow-xs"
        >
          <div className="flex items-start gap-2.5">
            <AlertCircle size={16} className="text-rose-600 shrink-0 mt-0.5" />
            <div className="flex-1 leading-relaxed">
              <strong className="font-semibold text-rose-900">Gagal Mengubah Status Site: </strong>
              <span>{statusError}</span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setStatusError(null)}
            className="text-rose-400 hover:text-rose-600 p-1 rounded-lg transition-colors cursor-pointer shrink-0"
            aria-label="Tutup pesan error"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* ── Table Container ── */}
      <div className="border border-slate-200/80 rounded-xl overflow-hidden bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FEF9EE] text-slate-800 font-bold border-b border-[#F3EDE0]">
              <tr>
                <th className="py-3.5 px-5 text-xs font-bold tracking-wider text-slate-700 w-[100px]">
                  KODE
                </th>
                <th className="py-3.5 px-5 text-xs font-bold tracking-wider text-slate-700 min-w-[180px]">
                  NAMA SITE
                </th>
                <th className="py-3.5 px-5 text-xs font-bold tracking-wider text-slate-700">
                  LOKASI
                </th>
                <th className="py-3.5 px-5 text-xs font-bold tracking-wider text-slate-700 text-right">
                  KAPASITAS DAYA
                </th>
                <th className="py-3.5 px-5 text-xs font-bold tracking-wider text-slate-700 text-center">
                  ROOMS
                </th>
                <th className="py-3.5 px-5 text-xs font-bold tracking-wider text-slate-700 text-center">
                  STATUS
                </th>
                <th className="py-3.5 px-5 text-xs font-bold tracking-wider text-slate-700 text-center min-w-[150px]">
                  AKSI
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sites.map((site) => (
                <SiteTableRow
                  key={site.id}
                  site={site}
                  onDetail={() => onDetail(site.id)}
                  onEdit={() => onEdit(site)}
                  onDelete={() => onDelete(site)}
                  onStatusError={setStatusError}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Pagination di Bagian Bawah (Centered Sesuai Desain RackTable) ── */}
      {total > 0 ? (
        <SiteTablePagination
          currentPage={currentPage}
          totalPages={lastPage}
          onPageChange={onPageChange}
        />
      ) : null}
    </div>
  );
};

interface SiteTableRowProps {
  site: Site;
  onDetail: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onStatusError: (msg: string | null) => void;
}

const SiteTableRow: React.FC<SiteTableRowProps> = ({
  site,
  onDetail,
  onEdit,
  onDelete,
  onStatusError,
}) => {
  const setStatus = useSetSiteStatus(site.id);

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const next = e.target.value as SiteStatus;
    if (next === site.status) return;
    onStatusError(null);
    setStatus.mutate(next, {
      onError: (err) => {
        onStatusError("Gagal mengubah status site " + site.site_name + ": " + extractErrorMessage(err));
        e.target.value = site.status;
      },
      onSuccess: () => {
        onStatusError(null);
      },
    });
  };

  const getStatusColor = (status: SiteStatus) => {
    switch (status) {
      case "active":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "maintenance":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "decommissioned":
        return "bg-slate-100 text-slate-600 border-slate-200";
      default:
        return "bg-slate-50 text-slate-600 border-slate-200";
    }
  };

  return (
    <tr className="hover:bg-slate-50/70 transition-colors">
      {/* Kode Site */}
      <td className="py-3.5 px-5 font-mono text-xs font-bold text-slate-900">
        {site.site_code}
      </td>

      {/* Nama Site (Clickable) */}
      <td className="py-3.5 px-5">
        <button
          type="button"
          onClick={onDetail}
          className="font-bold text-sm text-[#0A2140] hover:text-blue-600 hover:underline transition-colors text-left flex items-center gap-1.5 cursor-pointer"
        >
          <span>{site.site_name}</span>
          <Eye size={13} className="text-slate-400 opacity-0 group-hover:opacity-100" />
        </button>
      </td>

      {/* Lokasi */}
      <td className="py-3.5 px-5 text-slate-600 text-xs">
        <div className="flex items-center gap-1">
          <MapPin size={13} className="text-slate-400 flex-shrink-0" />
          <span>
            {site.city ?? "—"}
            {site.province ? `, ${site.province}` : ""}
          </span>
        </div>
      </td>

      {/* Kapasitas Daya */}
      <td className="py-3.5 px-5 text-right text-xs font-semibold text-slate-700">
        {site.total_power_capacity_kw ? (
          <div className="inline-flex items-center gap-1 justify-end">
            <Zap size={13} className="text-amber-500" />
            <span>{formatNumber(Number(site.total_power_capacity_kw))} kW</span>
          </div>
        ) : (
          <span className="text-slate-400 font-normal">—</span>
        )}
      </td>

      {/* Rooms Count */}
      <td className="py-3.5 px-5 text-center">
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200/60">
          <DoorOpen size={12} className="text-slate-500" />
          <span>{site.rooms?.length ?? 0} room</span>
        </span>
      </td>

      {/* Status (Select Dropdown) */}
      <td className="py-3.5 px-5 text-center">
        <select
          value={site.status}
          disabled={setStatus.isPending}
          onChange={handleStatusChange}
          aria-label={`Ubah status ${site.site_name}`}
          className={`text-xs font-semibold px-2.5 py-1 rounded-full border cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all ${getStatusColor(
            site.status
          )}`}
        >
          <option value="active">Aktif</option>
          <option value="maintenance">Maintenance</option>
          <option value="decommissioned">Didecommission</option>
        </select>
      </td>

      {/* Aksi */}
      <td className="py-3.5 px-5 text-center">
        <div className="inline-flex items-center justify-center gap-1.5">
          {/* 1. Detail Site */}
          <div className="relative group/tooltip inline-flex items-center justify-center">
            <button
              type="button"
              onClick={onDetail}
              title="Detail Site"
              aria-label="Detail Site"
              className="w-7 h-7 inline-flex items-center justify-center rounded-lg text-blue-600 bg-blue-50 hover:bg-blue-100 hover:text-blue-700 border border-blue-200/80 transition-all cursor-pointer shadow-xs active:scale-95"
            >
              <Eye size={15} strokeWidth={2} />
            </button>
            <div className="absolute bottom-full mb-1.5 left-1/2 -translate-x-1/2 pointer-events-none opacity-0 group-hover/tooltip:opacity-100 transition-all duration-150 transform group-hover/tooltip:-translate-y-0.5 z-50">
              <div className="px-2 py-0.5 text-[11px] font-semibold text-white bg-slate-900 rounded-md shadow-lg whitespace-nowrap">
                Detail Site
              </div>
              <div className="w-1.5 h-1.5 bg-slate-900 rotate-45 mx-auto -mt-1" />
            </div>
          </div>

          {/* 2. Edit Site */}
          <div className="relative group/tooltip inline-flex items-center justify-center">
            <button
              type="button"
              onClick={onEdit}
              title="Edit Site"
              aria-label="Edit Site"
              className="w-7 h-7 inline-flex items-center justify-center rounded-lg text-amber-600 bg-amber-50 hover:bg-amber-100 hover:text-amber-700 border border-amber-200/80 transition-all cursor-pointer shadow-xs active:scale-95"
            >
              <Pencil size={13} strokeWidth={2.2} />
            </button>
            <div className="absolute bottom-full mb-1.5 left-1/2 -translate-x-1/2 pointer-events-none opacity-0 group-hover/tooltip:opacity-100 transition-all duration-150 transform group-hover/tooltip:-translate-y-0.5 z-50">
              <div className="px-2 py-0.5 text-[11px] font-semibold text-white bg-slate-900 rounded-md shadow-lg whitespace-nowrap">
                Edit Site
              </div>
              <div className="w-1.5 h-1.5 bg-slate-900 rotate-45 mx-auto -mt-1" />
            </div>
          </div>

          {/* 3. Hapus Site */}
          <div className="relative group/tooltip inline-flex items-center justify-center">
            <button
              type="button"
              onClick={onDelete}
              title="Hapus Site"
              aria-label="Hapus Site"
              className="w-7 h-7 inline-flex items-center justify-center rounded-lg text-rose-600 bg-rose-50 hover:bg-rose-100 hover:text-rose-700 border border-rose-200/80 transition-all cursor-pointer shadow-xs active:scale-95"
            >
              <Trash2 size={13} strokeWidth={2.2} />
            </button>
            <div className="absolute bottom-full mb-1.5 left-1/2 -translate-x-1/2 pointer-events-none opacity-0 group-hover/tooltip:opacity-100 transition-all duration-150 transform group-hover/tooltip:-translate-y-0.5 z-50">
              <div className="px-2 py-0.5 text-[11px] font-semibold text-white bg-slate-900 rounded-md shadow-lg whitespace-nowrap">
                Hapus Site
              </div>
              <div className="w-1.5 h-1.5 bg-slate-900 rotate-45 mx-auto -mt-1" />
            </div>
          </div>
        </div>
      </td>
    </tr>
  );
};
