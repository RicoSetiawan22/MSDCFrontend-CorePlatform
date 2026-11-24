import React, { useState } from "react";
import {
  Sliders,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Thermometer,
  Droplets,
  Info,
} from "lucide-react";
import { useSetThreshold } from "../../api/useMonitoring";
import { extractErrorMessage } from "@shared/types/api";
import type { MetricType } from "../../types/monitoring";

interface MonitoringThresholdCardProps {
  rackId: number;
  rackCode?: string;
  onSuccess?: () => void;
}

export const MonitoringThresholdCard: React.FC<MonitoringThresholdCardProps> = React.memo(({
  rackId,
  rackCode = "Rack",
  onSuccess,
}) => {
  const [metricType, setMetricType] = useState<MetricType>("temperature");

  // Dual-bound Thresholds (Batas Bawah & Batas Atas)
  const [criticalLower, setCriticalLower] = useState("");
  const [warningLower, setWarningLower] = useState("");
  const [warningUpper, setWarningUpper] = useState("");
  const [criticalUpper, setCriticalUpper] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);

  const setThreshold = useSetThreshold();

  const isTemp = metricType === "temperature";
  const unit = isTemp ? "°C" : "%";

  // Preset Standar ASHRAE TC 9.9
  const applyAshraePreset = () => {
    if (isTemp) {
      setCriticalLower("15.0");
      setWarningLower("18.0");
      setWarningUpper("27.0");
      setCriticalUpper("32.0");
    } else {
      setCriticalLower("30.0");
      setWarningLower("40.0");
      setWarningUpper("60.0");
      setCriticalUpper("70.0");
    }
    setError(null);
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSavedMsg(null);

    const cLow = criticalLower ? Number(criticalLower) : undefined;
    const wLow = warningLower ? Number(warningLower) : undefined;
    const wHigh = warningUpper ? Number(warningUpper) : undefined;
    const cHigh = criticalUpper ? Number(criticalUpper) : undefined;

    // Validasi angka
    if (cLow != null && isNaN(cLow)) {
      setError("Ambang batas Critical Bawah harus berupa angka valid.");
      return;
    }
    if (wLow != null && isNaN(wLow)) {
      setError("Ambang batas Warning Bawah harus berupa angka valid.");
      return;
    }
    if (wHigh != null && isNaN(wHigh)) {
      setError("Ambang batas Warning Atas harus berupa angka valid.");
      return;
    }
    if (cHigh != null && isNaN(cHigh)) {
      setError("Ambang batas Critical Atas harus berupa angka valid.");
      return;
    }

    // Validasi urutan matematis
    if (cLow != null && wLow != null && cLow >= wLow) {
      setError(`Critical Bawah (${cLow}${unit}) harus lebih kecil dari Warning Bawah (${wLow}${unit}).`);
      return;
    }
    if (wLow != null && wHigh != null && wLow >= wHigh) {
      setError(`Warning Bawah (${wLow}${unit}) harus lebih kecil dari Warning Atas (${wHigh}${unit}).`);
      return;
    }
    if (wHigh != null && cHigh != null && wHigh >= cHigh) {
      setError(`Warning Atas (${wHigh}${unit}) harus lebih kecil dari Critical Atas (${cHigh}${unit}).`);
      return;
    }

    try {
      await setThreshold.mutateAsync({
        rack_id: rackId,
        metric_type: metricType,
        warning_lower_threshold: wLow,
        warning_upper_threshold: wHigh,
        critical_lower_threshold: cLow,
        critical_upper_threshold: cHigh,
        warning_threshold: wHigh,
        critical_threshold: cHigh,
        comparison: "above",
      });

      setSavedMsg(
        `Ambang batas ganda ${isTemp ? "Suhu" : "Kelembapan"} berhasil diperbarui.`
      );
      setCriticalLower("");
      setWarningLower("");
      setWarningUpper("");
      setCriticalUpper("");
      onSuccess?.();
      setTimeout(() => setSavedMsg(null), 4000);
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 flex flex-col justify-between hover:shadow-md transition-all h-full">
      <div className="flex flex-col gap-4">
        {/* ── 1. Header & Context ── */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600 border border-amber-100/60 shadow-2xs">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-[#0A2140] tracking-tight uppercase">
                  Atur Ambang Batas (Bawah & Atas)
                </h3>
                {rackCode && (
                  <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-700">
                    {rackCode}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Konfigurasi batas aman minimum dan maksimum termal untuk {rackCode}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={applyAshraePreset}
            className="inline-flex items-center gap-1.5 text-[11px] font-bold text-amber-900 bg-amber-100/80 hover:bg-amber-200/90 border border-amber-200 px-2.5 py-1 rounded-lg transition-all cursor-pointer shadow-2xs shrink-0"
            title="Isi otomatis dengan batas toleransi standar ASHRAE TC 9.9"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            Preset Standar
          </button>
        </div>

        {/* ── 2. Segmented Pill Tab (Suhu vs Kelembapan) - SAMA PERSIS dengan Card Manual ── */}
        <div className="flex items-center p-1 bg-slate-100/90 rounded-xl gap-1">
          <button
            type="button"
            onClick={() => {
              setMetricType("temperature");
              setError(null);
            }}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              isTemp
                ? "bg-white text-[#0A2140] shadow-2xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Thermometer className={`w-3.5 h-3.5 ${isTemp ? "text-rose-500" : "text-slate-400"}`} />
            <span>Suhu Ruang / Rak (°C)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setMetricType("humidity");
              setError(null);
            }}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              !isTemp
                ? "bg-white text-[#0A2140] shadow-2xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Droplets className={`w-3.5 h-3.5 ${!isTemp ? "text-cyan-500" : "text-slate-400"}`} />
            <span>Kelembapan Udara (%)</span>
          </button>
        </div>

        {/* ── 3. Grid Ambang Batas Bawah & Atas (Min Safe & Max Safe) ── */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Blok Ambang Batas Bawah */}
            <div className="p-3 rounded-xl bg-blue-50/50 border border-blue-100/80 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-blue-900 flex items-center gap-1">
                  Ambang Batas Bawah (Min Safe)
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-rose-700 uppercase mb-1">
                    Critical Bawah (&lt;)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.1"
                      placeholder={isTemp ? "15.0" : "30.0"}
                      value={criticalLower}
                      onChange={(e) => setCriticalLower(e.target.value)}
                      className="w-full bg-white border border-rose-200 rounded-xl pl-3 pr-7 py-2 text-xs font-bold text-slate-800 focus:border-rose-500 focus:ring-1 focus:ring-rose-200 outline-none transition-all"
                    />
                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] font-bold text-slate-400 pointer-events-none">
                      {unit}
                    </span>
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-amber-700 uppercase mb-1">
                    Warning Bawah (&lt;)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.1"
                      placeholder={isTemp ? "18.0" : "40.0"}
                      value={warningLower}
                      onChange={(e) => setWarningLower(e.target.value)}
                      className="w-full bg-white border border-amber-200 rounded-xl pl-3 pr-7 py-2 text-xs font-bold text-slate-800 focus:border-amber-500 focus:ring-1 focus:ring-amber-200 outline-none transition-all"
                    />
                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] font-bold text-slate-400 pointer-events-none">
                      {unit}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Blok Ambang Batas Atas */}
            <div className="p-3 rounded-xl bg-orange-50/50 border border-orange-100/80 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-orange-950 flex items-center gap-1">
                  Ambang Batas Atas (Max Safe)
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-amber-700 uppercase mb-1">
                    Warning Atas (&gt;)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.1"
                      placeholder={isTemp ? "27.0" : "60.0"}
                      value={warningUpper}
                      onChange={(e) => setWarningUpper(e.target.value)}
                      className="w-full bg-white border border-amber-200 rounded-xl pl-3 pr-7 py-2 text-xs font-bold text-slate-800 focus:border-amber-500 focus:ring-1 focus:ring-amber-200 outline-none transition-all"
                    />
                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] font-bold text-slate-400 pointer-events-none">
                      {unit}
                    </span>
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-rose-700 uppercase mb-1">
                    Critical Atas (&gt;)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.1"
                      placeholder={isTemp ? "32.0" : "70.0"}
                      value={criticalUpper}
                      onChange={(e) => setCriticalUpper(e.target.value)}
                      className="w-full bg-white border border-rose-200 rounded-xl pl-3 pr-7 py-2 text-xs font-bold text-slate-800 focus:border-rose-500 focus:ring-1 focus:ring-rose-200 outline-none transition-all"
                    />
                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] font-bold text-slate-400 pointer-events-none">
                      {unit}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── 4. Visualizer Pita Toleransi (Tolerance Spectrum Bar) ── */}
          <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-200/70">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-600 mb-1.5">
              <span>Visualisasi Spektrum Toleransi:</span>
              <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-[10px] font-bold">
                {isTemp ? "18°C - 27°C (Zona Aman ASHRAE)" : "40% - 60% (Zona Aman ASHRAE)"}
              </span>
            </div>
            <div className="grid grid-cols-5 text-center text-[10px] font-bold rounded-lg overflow-hidden border border-slate-200">
              <div className="bg-rose-100 text-rose-800 py-1.5 px-1 border-r border-rose-200">
                Kritis Bawah
                <div className="text-[9px] font-normal text-rose-700">&lt; {criticalLower || (isTemp ? "15" : "30")}{unit}</div>
              </div>
              <div className="bg-amber-100 text-amber-800 py-1.5 px-1 border-r border-amber-200">
                Peringatan Bawah
                <div className="text-[9px] font-normal text-amber-700">{criticalLower || (isTemp ? "15" : "30")}-{warningLower || (isTemp ? "18" : "40")}{unit}</div>
              </div>
              <div className="bg-emerald-500 text-white py-1.5 px-1 shadow-inner">
                NORMAL (IDEAL)
                <div className="text-[9px] font-medium text-emerald-100">{warningLower || (isTemp ? "18" : "40")}-{warningUpper || (isTemp ? "27" : "60")}{unit}</div>
              </div>
              <div className="bg-amber-100 text-amber-800 py-1.5 px-1 border-l border-amber-200">
                Peringatan Atas
                <div className="text-[9px] font-normal text-amber-700">{warningUpper || (isTemp ? "27" : "60")}-{criticalUpper || (isTemp ? "32" : "70")}{unit}</div>
              </div>
              <div className="bg-rose-100 text-rose-800 py-1.5 px-1 border-l border-rose-200">
                Kritis Atas
                <div className="text-[9px] font-normal text-rose-700">&gt; {criticalUpper || (isTemp ? "32" : "70")}{unit}</div>
              </div>
            </div>
          </div>

          {/* ── 5. Standard SOP Guide Checklist Box (Symmetrical dengan Card Manual) ── */}
          <div className="p-3 rounded-xl bg-amber-50/60 border border-amber-200/70 flex items-start gap-2.5 text-xs text-amber-900 mt-1">
            <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="flex flex-col gap-0.5">
              <span className="font-bold text-[11px] uppercase tracking-wider text-amber-950">
                Standar Ambang Batas Toleransi ASHRAE TC 9.9:
              </span>
              <p className="text-[11px] text-amber-900/90 leading-relaxed">
                {isTemp
                  ? "Suhu 18°C – 27°C disarankan untuk stabilitas server. Pelanggaran batas atas memicu alarm overheating, batas bawah memicu kondensasi."
                  : "Kelembapan 40% – 60% disarankan untuk mencegah muatan listrik statis (ESD) pada batas rendah dan korosi perangkat pada batas tinggi."}
              </p>
            </div>
          </div>

          {/* Feedback messages */}
          {error && (
            <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span className="font-medium">{error}</span>
            </div>
          )}

          {savedMsg && (
            <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span className="font-medium">{savedMsg}</span>
            </div>
          )}

          {/* ── 6. Primary Submit Button - SAMA PERSIS dengan Card Manual ── */}
          <button
            type="submit"
            disabled={setThreshold.isPending}
            className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-[#0A2140] hover:bg-[#E59B00] hover:text-[#0A2140] active:scale-[0.99] transition-all shadow-xs cursor-pointer disabled:opacity-60 flex items-center justify-center gap-2 mt-1"
          >
            <span>{setThreshold.isPending ? "Menyimpan Konfigurasi..." : `Simpan Ambang Batas ${isTemp ? "Suhu" : "Kelembapan"}`}</span>
          </button>
        </form>
      </div>
    </div>
  );
});

MonitoringThresholdCard.displayName = "MonitoringThresholdCard";
export default MonitoringThresholdCard;
