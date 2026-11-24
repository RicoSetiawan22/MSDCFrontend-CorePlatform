import React from "react";
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  ShieldAlert,
  Tv,
  Film,
} from "lucide-react";
import type { CctvStreamTestResult as ICctvStreamTestResult } from "../../types/cctv";
import { formatCodec, formatResolution } from "../../utils/cctv";

export interface CctvStreamTestResultProps {
  result: ICctvStreamTestResult | null;
  isLoading?: boolean;
}

export const CctvStreamTestResult: React.FC<CctvStreamTestResultProps> = ({
  result,
  isLoading = false,
}) => {
  if (isLoading) {
    return (
      <div className="rounded-2xl border border-blue-200 bg-blue-50/70 p-4.5 flex items-center gap-3.5 text-blue-900 animate-pulse">
        <Loader2 size={20} className="animate-spin text-blue-600 shrink-0" />
        <div>
          <h4 className="text-sm font-bold text-blue-900">Menguji Koneksi Stream...</h4>
          <p className="text-xs text-blue-700 mt-0.5">
            Probe ffprobe sedang menghubungkan ke server CCTV untuk memeriksa codec, resolusi, dan kesehatan feed.
          </p>
        </div>
      </div>
    );
  }

  if (!result) return null;

  const isSuccess = Boolean(result.ok);

  return (
    <div
      className={`rounded-2xl border p-4.5 transition-all shadow-2xs ${
        isSuccess
          ? "border-emerald-200 bg-emerald-50/60 text-slate-800"
          : "border-rose-200 bg-rose-50/70 text-slate-800"
      }`}
    >
      {/* Header status utama */}
      <div className="flex items-start gap-3 py-2.5 px-2.5">
        {isSuccess ? (
          <CheckCircle2 size={22} className="text-emerald-600 shrink-0 mt-0.5" />
        ) : (
          <XCircle size={22} className="text-rose-600 shrink-0 mt-0.5" />
        )}

        <div className="flex-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h4
              className={`text-sm font-extrabold ${
                isSuccess ? "text-emerald-900" : "text-rose-900"
              }`}
            >
              {isSuccess ? "Stream CCTV Terverifikasi Aktif" : "Uji Koneksi Stream Gagal"}
            </h4>

            {result.source_type && (
              <span
                className={`px-2 py-0.5 rounded-md text-[0.68rem] font-bold uppercase tracking-wider ${
                  result.source_type === "hls"
                    ? "bg-sky-100 text-sky-800 border border-sky-200"
                    : "bg-purple-100 text-purple-800 border border-purple-200"
                }`}
              >
                {result.source_type.toUpperCase()}
              </span>
            )}
          </div>

          <p className="text-xs text-slate-600 mt-1 leading-relaxed">
            {result.message ||
              (isSuccess
                ? "Server berhasil terhubung ke stream kamera dan membaca metadata video."
                : "Tidak dapat membuka koneksi ke alamat stream. Pastikan NVR/server CCTV aktif dan port dapat dijangkau.")}
          </p>

          {/* Metadata Video (bila probe sukses) */}
          {isSuccess && (
            <div className="mt-3.5 grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
              <div className="bg-white/80 border border-emerald-100 rounded-xl p-2.5 flex items-center gap-2">
                <Film size={15} className="text-emerald-600 shrink-0" />
                <div className="truncate">
                  <span className="block text-[0.65rem] text-slate-400 uppercase font-semibold">Codec</span>
                  <span className="font-bold text-slate-700 truncate block">
                    {formatCodec(result.video_codec)}
                  </span>
                </div>
              </div>

              <div className="bg-white/80 border border-emerald-100 rounded-xl p-2.5 flex items-center gap-2">
                <Tv size={15} className="text-emerald-600 shrink-0" />
                <div className="truncate">
                  <span className="block text-[0.65rem] text-slate-400 uppercase font-semibold">Resolusi</span>
                  <span className="font-bold text-slate-700 truncate block">
                    {formatResolution(result.resolution)}
                  </span>
                </div>
              </div>

              <div className="col-span-2 sm:col-span-1 bg-white/80 border border-emerald-100 rounded-xl p-2.5 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                <div className="truncate">
                  <span className="block text-[0.65rem] text-slate-400 uppercase font-semibold">Browser</span>
                  <span className="font-bold text-slate-700 truncate block">
                    {result.playable_in_browser ? "HLS Playable" : "RTMP (Butuh HLS)"}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Peringatan Kepatuhan / Kompatibilitas Browser (Warnings) */}
          {result.warnings && result.warnings.length > 0 && (
            <div className="mt-3 space-y-1.5">
              {result.warnings.map((w, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-2.5 text-xs text-amber-800"
                >
                  <AlertTriangle size={15} className="text-amber-600 shrink-0 mt-0.5" />
                  <div className="leading-relaxed">
                    <strong className="font-bold mr-1">
                      {w.code === "HEVC_CODEC"
                        ? "Peringatan Codec H.265:"
                        : w.code === "INSECURE_HLS"
                        ? "Peringatan Mixed Content (HTTP):"
                        : `${w.code}:`}
                    </strong>
                    <span>{w.message}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Info Khusus bila RTMP Sukses tetapi Browser Tidak Bisa Memutar Langsung */}
          {isSuccess && !result.playable_in_browser && (
            <div className="mt-3 flex items-start gap-2 rounded-xl border border-sky-200 bg-sky-50/80 p-2.5 text-xs text-sky-800">
              <ShieldAlert size={15} className="text-sky-600 shrink-0 mt-0.5" />
              <div className="leading-relaxed">
                <strong className="font-bold">Info Pemutaran Browser:</strong> Alamat RTMP kantor valid dan statusnya
                akan dimonitor, namun browser memerlukan transkoder HLS (.m3u8) untuk dapat menampilkan video di layar.
              </div>
            </div>
          )}

          {/* Error detail bila gagal */}
          {!isSuccess && result.error_code && (
            <div className="mt-2 text-xs">
              <span className="inline-block px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 font-mono text-[0.7rem] font-semibold border border-rose-200">
                Kode Error: {result.error_code}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

