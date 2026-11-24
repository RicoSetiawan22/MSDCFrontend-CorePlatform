import React, { useState, useMemo, useCallback } from "react";
import { Search, Download, History, Radio, Edit3, ArrowLeft, ArrowRight } from "lucide-react";
import type { MetricReading } from "../../types/monitoring";
import {
  evaluateMetricThreshold,
  parseMetricValue,
  formatMonitoringTimestamp,
} from "./metricThresholdEvaluator";

interface MonitoringHistoryTableProps {
  readings: MetricReading[];
  isLoading?: boolean;
}

type SourceFilter = "all" | "sensor" | "manual";

const ITEMS_PER_PAGE = 15;

export const MonitoringHistoryTable: React.FC<MonitoringHistoryTableProps> = React.memo(({
  readings,
  isLoading = false,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>("all");
  const [currentPage, setCurrentPage] = useState(1);

  // Filter readings based on source and search term
  const filteredReadings = useMemo(() => {
    return readings.filter((r) => {
      // Source filter
      if (sourceFilter === "sensor" && r.source !== "sensor") return false;
      if (sourceFilter === "manual" && r.source !== "manual") return false;

      // Search term filter
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const metricName = r.metric_type === "temperature" ? "suhu temperature" : "kelembapan humidity";
        const valStr = String(r.value);
        const timeStr = r.recorded_at.toLowerCase();
        const sourceStr = r.source.toLowerCase();

        return (
          metricName.includes(query) ||
          valStr.includes(query) ||
          timeStr.includes(query) ||
          sourceStr.includes(query)
        );
      }

      return true;
    });
  }, [readings, sourceFilter, searchTerm]);

  // Reset page when filter changes
  const handleFilterChange = useCallback((filter: SourceFilter) => {
    setSourceFilter(filter);
    setCurrentPage(1);
  }, []);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  }, []);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredReadings.length / ITEMS_PER_PAGE));
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredReadings.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredReadings, currentPage]);

  // CSV Export
  const handleExportCSV = useCallback(() => {
    if (!filteredReadings.length) return;

    const headers = ["ID", "Metrik", "Nilai Terukur", "Satuan", "Sumber Data", "Status Batas", "Waktu (Timestamp)"];
    const rows = filteredReadings.map((r) => {
      const evaluation = evaluateMetricThreshold(r.value, r.metric_type);
      return [
        r.id,
        r.metric_type === "temperature" ? "Suhu" : "Kelembapan",
        r.value,
        r.unit ?? (r.metric_type === "temperature" ? "°C" : "%"),
        r.source === "sensor" ? "Sensor IoT" : "Manual",
        evaluation.label,
        r.recorded_at,
      ].map((field) => `"${String(field).replace(/"/g, '""')}"`);
    });

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `rack_monitoring_readings_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [filteredReadings]);

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm transition-all overflow-hidden">
      {/* Top Header & Search/Filter Controls */}
      <div className="p-4 sm:px-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-sm sm:text-base font-bold text-[#0A2140] tracking-tight flex items-center gap-2 uppercase">
            <History className="w-4 h-4 text-[#E59B00]" />
            Riwayat Pembacaan
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Log telemetri terperinci dari sensor IoT dan checklist pemeriksaan fisik ({filteredReadings.length} data)
          </p>
        </div>

        {/* Filter controls row */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Search Input */}
          <div className="relative min-w-[200px]">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Cari log..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-700 placeholder:text-slate-400 focus:border-[#E59B00] outline-none"
            />
          </div>

          {/* Segmented Source Tabs */}
          <div className="inline-flex bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs font-semibold">
            <button
              type="button"
              onClick={() => handleFilterChange("all")}
              className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                sourceFilter === "all"
                  ? "bg-white text-slate-800 shadow-xs font-bold"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Semua
            </button>
            <button
              type="button"
              onClick={() => handleFilterChange("sensor")}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                sourceFilter === "sensor"
                  ? "bg-white text-emerald-800 shadow-xs font-bold"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <Radio className="w-3 h-3" />
              Sistem IoT
            </button>
            <button
              type="button"
              onClick={() => handleFilterChange("manual")}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                sourceFilter === "manual"
                  ? "bg-white text-blue-800 shadow-xs font-bold"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <Edit3 className="w-3 h-3" />
              Manual
            </button>
          </div>

          {/* Export CSV Button */}
          <button
            type="button"
            onClick={handleExportCSV}
            disabled={filteredReadings.length === 0}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-[#E59B00] hover:bg-[#cf8c00] active:scale-95 transition-all shadow-xs cursor-pointer disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="bg-[#FDE8B3]/50 border-b border-[#FDE8B3] text-slate-800 font-extrabold uppercase tracking-wider text-[11px]">
              <th className="py-3 px-4 sm:px-6">Metrik</th>
              <th className="py-3 px-4">Nilai Terukur</th>
              <th className="py-3 px-4">Sumber Data</th>
              <th className="py-3 px-4">Status Batas</th>
              <th className="py-3 px-4 sm:px-6">Waktu (Timestamp)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {isLoading ? (
              <tr>
                <td colSpan={5} className="py-10 text-center text-slate-400">
                  Memuat riwayat pembacaan...
                </td>
              </tr>
            ) : paginatedData.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-10 text-center text-slate-400">
                  Tidak ada pembacaan ditemukan sesuai kriteria filter.
                </td>
              </tr>
            ) : (
              paginatedData.map((r) => {
                const isTemp = r.metric_type === "temperature";
                const valNum = parseMetricValue(r.value);
                const evaluation = evaluateMetricThreshold(valNum, r.metric_type);
                const unit = r.unit ?? (isTemp ? "°C" : "%");

                return (
                  <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Metrik with colored dot */}
                    <td className="py-3.5 px-4 sm:px-6 font-semibold">
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-2 h-2 rounded-full shrink-0 ${
                            isTemp ? "bg-rose-500" : "bg-cyan-600"
                          }`}
                        />
                        <span className="text-slate-800">
                          {isTemp ? "Suhu (°C)" : "Kelembapan (%)"}
                        </span>
                      </div>
                    </td>

                    {/* Nilai Terukur */}
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                      {typeof r.value === "string" ? r.value : valNum.toFixed(4)}
                      <span className="font-normal text-slate-500 ml-0.5">{unit}</span>
                    </td>

                    {/* Sumber Data */}
                    <td className="py-3.5 px-4">
                      {r.source === "sensor" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-cyan-50 text-cyan-800 border border-cyan-200">
                          <Radio className="w-3 h-3 text-cyan-600" />
                          Sensor IoT
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                          <Edit3 className="w-3 h-3 text-slate-500" />
                          Manual
                        </span>
                      )}
                    </td>

                    {/* Status Batas (Evaluated client-side from ASHRAE / custom thresholds) */}
                    <td className="py-3.5 px-4">
                      <span
                        style={{
                          backgroundColor: evaluation.badgeBg,
                          color: evaluation.badgeText,
                          borderColor: evaluation.badgeBorder,
                        }}
                        className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border"
                      >
                        <span
                          style={{ backgroundColor: evaluation.dotColor }}
                          className="w-1.5 h-1.5 rounded-full"
                        />
                        {evaluation.label}
                      </span>
                    </td>

                    {/* Timestamp */}
                    <td className="py-3.5 px-4 sm:px-6 font-mono text-[11px] text-slate-500">
                      {formatMonitoringTimestamp(r.recorded_at)}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div className="p-4 sm:px-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50/50">
          <span className="text-xs text-slate-500">
            Halaman <strong className="text-slate-800">{currentPage}</strong> dari{" "}
            <strong className="text-slate-800">{totalPages}</strong> (Total {filteredReadings.length} data)
          </span>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-md border border-slate-200 text-slate-600 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              title="Halaman Sebelumnya"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
            </button>

            {/* Display up to 5 page buttons */}
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum: number;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }

              const isActive = pageNum === currentPage;
              return (
                <button
                  key={pageNum}
                  type="button"
                  onClick={() => setCurrentPage(pageNum)}
                  className={`w-7 h-7 rounded-md text-xs font-bold transition-all cursor-pointer ${
                    isActive
                      ? "bg-[#E59B00] text-white shadow-xs"
                      : "border border-slate-200 text-slate-700 hover:bg-white"
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}

            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <span>Berikutnya</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
});

MonitoringHistoryTable.displayName = "MonitoringHistoryTable";
