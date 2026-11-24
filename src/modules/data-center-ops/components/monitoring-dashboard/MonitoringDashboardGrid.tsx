import React from "react";
import { AlertTriangle, RefreshCw, SearchX } from "lucide-react";
import type { Rack } from "../../types/rack";
import { MonitoringDashboardCard, type RackTelemetryData } from "./MonitoringDashboardCard";

interface MonitoringDashboardGridProps {
  racks: Rack[];
  telemetryByRack: Map<number, RackTelemetryData>;
  isLoading: boolean;
  isError: boolean;
  errorMessage?: string;
  onSelectRack: (rackId: number) => void;
  onRefresh: () => void;
}

export const MonitoringDashboardGrid: React.FC<MonitoringDashboardGridProps> = ({
  racks,
  telemetryByRack,
  isLoading,
  isError,
  errorMessage,
  onSelectRack,
  onRefresh,
}) => {
  // Loading skeleton state
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {Array.from({ length: 10 }).map((_, idx) => (
          <div
            key={idx}
            className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-sm animate-pulse flex flex-col justify-between h-[230px]"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-slate-200" />
                  <div>
                    <div className="h-4 w-16 bg-slate-200 rounded mb-1" />
                    <div className="h-2.5 w-24 bg-slate-100 rounded" />
                  </div>
                </div>
                <div className="h-5 w-14 bg-slate-200 rounded-full" />
              </div>

              <div className="grid grid-cols-2 gap-2 my-4">
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 h-16 flex flex-col justify-center">
                  <div className="h-2 w-10 bg-slate-200 rounded mb-1.5" />
                  <div className="h-5 w-12 bg-slate-200 rounded" />
                </div>
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 h-16 flex flex-col justify-center">
                  <div className="h-2 w-10 bg-slate-200 rounded mb-1.5" />
                  <div className="h-5 w-12 bg-slate-200 rounded" />
                </div>
              </div>
            </div>

            <div className="h-8 bg-slate-100 rounded-lg w-full mt-2" />
          </div>
        ))}
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center rounded-xl border border-dashed border-rose-200 bg-rose-50/40">
        <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 mb-3 shadow-sm">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <h4 className="text-base font-bold text-slate-800 mb-1">Gagal Memuat Data Rak</h4>
        <p className="text-sm text-slate-500 max-w-md mb-4">
          {errorMessage || "Terjadi kesalahan saat mengambil daftar rak dan data telemetri sensor IoT. Silakan coba kembali."}
        </p>
        <button
          onClick={onRefresh}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#0A2140] hover:bg-[#081a33] shadow-sm transition-all"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Muat Ulang
        </button>
      </div>
    );
  }

  // Empty state
  if (racks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50">
        <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3 shadow-inner">
          <SearchX className="w-6 h-6" />
        </div>
        <h4 className="text-base font-bold text-slate-800 mb-1">Tidak Ada Rak Ditemukan</h4>
        <p className="text-xs text-slate-500 max-w-sm mb-4">
          Tidak ditemukan data rak yang cocok dengan filter lokasi, kondisi, atau kata kunci pencarian yang Anda masukkan.
        </p>
        <button
          onClick={onRefresh}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 shadow-sm transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Reset Filter / Refresh
        </button>
      </div>
    );
  }

  // Grid list of rack cards
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {racks.map((rack) => (
        <MonitoringDashboardCard
          key={rack.id}
          rack={rack}
          telemetry={telemetryByRack.get(rack.id)}
          onSelect={() => onSelectRack(rack.id)}
        />
      ))}
    </div>
  );
};
