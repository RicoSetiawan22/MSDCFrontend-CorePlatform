import React, { useState, useEffect, useRef } from "react";
import { RotateCcw, Check } from "lucide-react";
import type {
  SystemOperationalStatus,
  DashboardSummaryData,
} from "../../types/dashboard";
import { KPICardGrid } from "./KPICardGrid";

interface SystemStatusBannerProps {
  status?: SystemOperationalStatus;
  lastSyncTime?: string;
  isRefetching: boolean;
  cooldownSeconds: number;
  onRefresh: () => void;
  onAddTicket?: () => void;
  autoRefreshIntervalSec?: number;
  summary?: DashboardSummaryData | null;
  activeCard?: string | null;
  onSelectCard?: (cardId: string) => void;
}

export const SystemStatusBanner: React.FC<SystemStatusBannerProps> = ({
  status = "OPERATIONAL",
  isRefetching,
  cooldownSeconds,
  onRefresh,
  summary,
  activeCard,
  onSelectCard,
}) => {
  // Sesuai permintaan desain Figma terbaru: default ke status normal (ALL SYSTEMS OPERATIONAL)
  const isOperational = status === "OPERATIONAL" || true;

  // ── 1. Waktu Terakhir Diperbarui & Alert Notifikasi Refresh ──
  const formatTime = (d: Date = new Date()): string => {
    return d
      .toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      })
      .replace(/\./g, ":");
  };

  const [lastUpdatedTime, setLastUpdatedTime] = useState<string>(() => formatTime());
  const [showToast, setShowToast] = useState<boolean>(false);
  const prevRefetchingRef = useRef<boolean>(false);

  // ── 2. Deteksi Selesai Refresh (True -> False) untuk Menampilkan Notifikasi ──
  useEffect(() => {
    if (prevRefetchingRef.current && !isRefetching) {
      setLastUpdatedTime(formatTime(new Date()));
      setShowToast(true);

      // Otomatis menghilang setelah 2.5 detik tanpa tombol
      const timer = setTimeout(() => {
        setShowToast(false);
      }, 2500);

      return () => clearTimeout(timer);
    }
    prevRefetchingRef.current = isRefetching;
  }, [isRefetching]);

  const handleManualRefresh = () => {
    if (isRefetching || cooldownSeconds > 0) return;
    onRefresh();
  };

  return (
    <>
      {/* ── NOTIFIKASI TOAST (Muncul saat data selesai di-refresh, hilang dalam 2.5s tanpa button) ── */}
      <div
        role="status"
        aria-live="polite"
        className={`fixed top-5 right-5 z-50 flex items-center gap-3 bg-white border border-emerald-200 px-4 py-3 rounded-xl shadow-lg transition-all duration-300 pointer-events-none ${
          showToast ? "translate-y-0 opacity-100 pointer-events-auto" : "-translate-y-4 opacity-0"
        }`}
      >
        <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
          <Check size={14} strokeWidth={2.8} />
        </div>
        <div>
          <div className="text-xs font-bold text-slate-900 leading-tight">
            Data Berhasil Diperbarui
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            Informasi dashboard telah disinkronkan dengan server.
          </div>
        </div>
      </div>

      {/* ── CARD UTAMA: Membungkus Status Banner & 6 Summary Card ── */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-2xs flex flex-col gap-5 w-full">
        {/* ── BARIS ATAS: Status Operasional & Tombol Refresh Manual ── */}
        <div className="flex items-center justify-between flex-wrap gap-4 w-full">
          {/* ── KOTAK KIRI: Status Operasional dengan Aksen Hijau Transparan & Jam Last Updated ── */}
          <div
            className={`rounded-xl px-4 py-3 flex items-center justify-between gap-6 flex-1 max-w-[480px] border shadow-2xs ${
              isOperational
                ? "bg-emerald-50/70 border-emerald-200/80"
                : "bg-amber-50/70 border-amber-200/80"
            }`}
          >
            {/* Kolom Status Sistem (Aksen Hijau) */}
            <div className="flex flex-col">
              <span
                className={`text-sm font-extrabold tracking-wide uppercase leading-tight ${
                  isOperational ? "text-emerald-800" : "text-amber-800"
                }`}
              >
                {isOperational ? "ALL SYSTEMS OPERATIONAL" : "SYSTEM DEGRADED"}
              </span>
              <span className="text-xs text-slate-500 font-normal mt-0.5">
                Semua sistem berjalan normal
              </span>
            </div>

            {/* Kolom Last Updated & Jam Statis */}
            <div className="flex flex-col items-end text-right">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider leading-tight">
                Last updated
              </span>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="font-mono text-xs font-bold text-slate-800 bg-white px-2 py-0.5 rounded-md border border-slate-200/60 shadow-2xs">
                  {lastUpdatedTime}
                </span>
                <button
                  type="button"
                  onClick={handleManualRefresh}
                  disabled={isRefetching || cooldownSeconds > 0}
                  className={`p-1 rounded-md text-emerald-600 hover:text-emerald-700 transition-colors ${
                    isRefetching || cooldownSeconds > 0 ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
                  }`}
                  title="Refresh manual data sekarang"
                >
                  <RotateCcw
                    size={14}
                    strokeWidth={2.2}
                    className={isRefetching ? "animate-spin" : ""}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* ── KOTAK KANAN: Tombol Manual Refresh ── */}
          <div>
            <button
              type="button"
              onClick={handleManualRefresh}
              disabled={isRefetching || cooldownSeconds > 0}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-2xs ${
                isRefetching || cooldownSeconds > 0
                  ? "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed"
                  : "bg-amber-500 hover:bg-amber-600 text-slate-950 cursor-pointer shadow-sm active:scale-98"
              }`}
              title={
                cooldownSeconds > 0
                  ? `Tunggu ${cooldownSeconds}s untuk refresh kembali`
                  : "Klik untuk menyinkronkan data dashboard terbaru"
              }
            >
              <RotateCcw
                size={14}
                strokeWidth={2.4}
                className={isRefetching ? "animate-spin" : ""}
              />
              <span>{isRefetching ? "Memperbarui..." : "Refresh Data"}</span>
              {cooldownSeconds > 0 && (
                <span className="bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold">
                  {cooldownSeconds}s
                </span>
              )}
            </button>
          </div>
        </div>

        {/* ── BARIS BAWAH: 6 Summary Cards (Site, Rack, IP Address, Device, Ticket, Alarm) ── */}
        {summary && (
          <KPICardGrid
            data={summary}
            activeCard={activeCard}
            onSelectCard={onSelectCard}
          />
        )}
      </div>
    </>
  );
};
