import React, { useState, useMemo } from "react";
import {
  ClipboardEdit,
  Thermometer,
  Droplets,
  CheckCircle2,
  AlertCircle,
  Plus,
  Minus,
  Info,
  ShieldCheck,
} from "lucide-react";
import { useRecordReading } from "../../api/useMonitoring";
import { extractErrorMessage } from "@shared/types/api";
import type { MetricType, MetricReading } from "../../types/monitoring";

interface MonitoringRecordManualCardProps {
  rackId: number;
  rackCode?: string;
  latestTemperature?: MetricReading | null;
  latestHumidity?: MetricReading | null;
  onSuccess?: () => void;
}

export const MonitoringRecordManualCard: React.FC<MonitoringRecordManualCardProps> = React.memo(({
  rackId,
  rackCode,
  latestTemperature,
  latestHumidity,
  onSuccess,
}) => {
  const [metricType, setMetricType] = useState<MetricType>("temperature");
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const record = useRecordReading();

  const isTemp = metricType === "temperature";
  const unit = isTemp ? "°C" : "%";

  // Preset rekomendasi sesuai ambang batas ideal ASHRAE
  const presets = isTemp
    ? [20.0, 22.0, 24.0, 26.0]
    : [45.0, 50.0, 55.0, 60.0];

  // Nilai sensor IoT terkini untuk pembanding
  const currentSensorReading = isTemp ? latestTemperature : latestHumidity;
  const currentSensorVal = currentSensorReading
    ? typeof currentSensorReading.value === "string"
      ? parseFloat(currentSensorReading.value)
      : Number(currentSensorReading.value)
    : null;

  // Hitung selisih/deviasi nilai manual terhadap sensor IoT
  const delta = useMemo(() => {
    if (currentSensorVal === null || !value || isNaN(Number(value))) return null;
    const diff = Number(value) - currentSensorVal;
    return diff;
  }, [currentSensorVal, value]);

  // Stepper increment / decrement
  const handleStep = (step: number) => {
    const current = Number(value) || (isTemp ? 24.0 : 50.0);
    const nextVal = Math.round((current + step) * 10) / 10;
    setValue(nextVal.toFixed(1));
    setError(null);
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!value.trim() || isNaN(Number(value))) {
      setError("Nilai wajib diisi dalam format angka valid.");
      return;
    }
    const num = Number(value);
    if (isTemp && (num < 0 || num > 80)) {
      setError("Nilai suhu di luar batas wajar operasional (0°C - 80°C).");
      return;
    }
    if (!isTemp && (num < 0 || num > 100)) {
      setError("Nilai kelembapan harus dalam rentang 0% - 100%.");
      return;
    }

    setError(null);
    setSuccessMsg(null);

    try {
      await record.mutateAsync({
        rack_id: rackId,
        metric_type: metricType,
        value: num,
        unit,
        source: "manual",
      });
      setValue("");
      setSuccessMsg(`Berhasil mencatat pembacaan manual ${isTemp ? "Suhu" : "Kelembapan"}.`);
      onSuccess?.();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 flex flex-col justify-between hover:shadow-md transition-all h-full">
      <div className="flex flex-col gap-4">
        {/* ── 1. Header & Badge Context ── */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-100/60 shadow-2xs">
              <ClipboardEdit className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-[#0A2140] tracking-tight uppercase">
                  Catat Pembacaan Manual
                </h3>
                {rackCode && (
                  <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-700">
                    {rackCode}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Input verifikasi offline saat audit fisik langsung oleh teknisi
              </p>
            </div>
          </div>

          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-700 bg-slate-100/90 border border-slate-200 px-2.5 py-1 rounded-lg shrink-0">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
            Audit Fisik
          </span>
        </div>

        {/* ── 2. Segmented Pill Tab (Suhu vs Kelembapan) ── */}
        <div className="flex items-center p-1 bg-slate-100/90 rounded-xl gap-1">
          <button
            type="button"
            onClick={() => {
              setMetricType("temperature");
              setValue("");
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
              setValue("");
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

        {/* ── 3. Sensor IoT Live Context & Live Delta Comparison ── */}
        <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-200/70 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 min-w-0">
            <span className="flex h-2 w-2 relative shrink-0">
              {currentSensorVal !== null ? (
                <>
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </>
              ) : (
                <span className="relative inline-flex rounded-full h-2 w-2 bg-slate-300" />
              )}
            </span>
            <div className="flex flex-col min-w-0">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                Sensor IoT Terkini
              </span>
              <span className="font-bold text-slate-800 truncate">
                {currentSensorVal !== null ? (
                  <span>
                    {currentSensorVal.toFixed(1)} {unit}
                    <span className="text-[10px] font-normal text-slate-400 ml-1.5 hidden sm:inline">
                      (Live Telemetry)
                    </span>
                  </span>
                ) : (
                  <span className="text-slate-400 font-normal italic">
                    Belum ada telemetri sensor
                  </span>
                )}
              </span>
            </div>
          </div>

          {/* Delta calculation badge when user enters a value */}
          {delta !== null && (
            <div
              className={`px-2.5 py-1 rounded-lg text-xs font-bold shrink-0 flex items-center gap-1 ${
                Math.abs(delta) <= (isTemp ? 1.5 : 5.0)
                  ? "bg-emerald-100/70 text-emerald-800 border border-emerald-200"
                  : "bg-amber-100/70 text-amber-800 border border-amber-200"
              }`}
            >
              <span className="text-[10px] font-medium text-slate-500">Selisih:</span>
              <span>{delta > 0 ? `+${delta.toFixed(1)}` : delta.toFixed(1)} {unit}</span>
            </div>
          )}
        </div>

        {/* ── 4. Main Numeric Input with Stepper & Quick Preset Chips ── */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                Nilai Hasil Pengukuran Manual
              </label>
              <span className="text-[10px] text-slate-400">
                Standar ASHRAE: {isTemp ? "18.0°C – 27.0°C" : "40.0% – 60.0%"}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {/* Stepper Down */}
              <button
                type="button"
                onClick={() => handleStep(isTemp ? -0.5 : -1.0)}
                className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 flex items-center justify-center shrink-0 transition-all font-bold cursor-pointer"
                title={`Turunkan ${isTemp ? "0.5°C" : "1%"}`}
              >
                <Minus className="w-4 h-4" />
              </button>

              {/* Main Input Field */}
              <div className="relative flex-1">
                <input
                  type="number"
                  step="0.01"
                  placeholder={isTemp ? "mis. 24.5" : "mis. 55.0"}
                  value={value}
                  onChange={(e) => {
                    setValue(e.target.value);
                    setError(null);
                  }}
                  className="w-full bg-slate-50/80 border border-slate-200 rounded-xl px-4 py-2.5 text-base font-bold text-slate-800 focus:bg-white focus:border-[#0A2140] focus:ring-2 focus:ring-[#0A2140]/10 outline-none transition-all pr-10 tracking-tight"
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-sm font-extrabold text-slate-400 pointer-events-none">
                  {unit}
                </span>
              </div>

              {/* Stepper Up */}
              <button
                type="button"
                onClick={() => handleStep(isTemp ? 0.5 : 1.0)}
                className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 flex items-center justify-center shrink-0 transition-all font-bold cursor-pointer"
                title={`Naikkan ${isTemp ? "0.5°C" : "1%"}`}
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Preset Chips */}
            <div className="flex items-center gap-1.5 mt-2.5 overflow-x-auto pb-0.5">
              <span className="text-[10px] font-bold text-slate-400 mr-0.5 shrink-0">Preset Cepat:</span>
              {presets.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => {
                    setValue(p.toFixed(1));
                    setError(null);
                  }}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all cursor-pointer ${
                    value === p.toFixed(1)
                      ? "bg-[#0A2140] text-white border-[#0A2140] shadow-2xs"
                      : "bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  {p.toFixed(1)}{unit}
                </button>
              ))}
            </div>
          </div>

          {/* ── 5. Standard SOP Guide Checklist Box (Natural & Meaningful Vertical Balance) ── */}
          <div className="p-3 rounded-xl bg-amber-50/60 border border-amber-200/70 flex items-start gap-2.5 text-xs text-amber-900 mt-1">
            <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="flex flex-col gap-0.5">
              <span className="font-bold text-[11px] uppercase tracking-wider text-amber-950">
                Panduan Pengukuran Fisik Standar TIA-942:
              </span>
              <p className="text-[11px] text-amber-900/90 leading-relaxed">
                {isTemp
                  ? "Posisikan probe termometer portabel pada sisi Cold Aisle (inlet udara depan) rak pada 3 titik elevasi (bawah, tengah, atas)."
                  : "Ukur kelembapan relatif (RH) pada jarak minimal 1m dari blower pendingin presisi untuk menghindari distorsi turbulensi lokal."}
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

          {successMsg && (
            <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span className="font-medium">{successMsg}</span>
            </div>
          )}

          {/* ── 6. Primary Submit Button ── */}
          <button
            type="submit"
            disabled={record.isPending}
            className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-[#0A2140] hover:bg-[#E59B00] hover:text-[#0A2140] active:scale-[0.99] transition-all shadow-xs cursor-pointer disabled:opacity-60 flex items-center justify-center gap-2 mt-1"
          >
            <span>{record.isPending ? "Menyimpan Data..." : `Simpan Catatan Audit ${isTemp ? "Suhu" : "Kelembapan"}`}</span>
          </button>
        </form>
      </div>
    </div>
  );
});

MonitoringRecordManualCard.displayName = "MonitoringRecordManualCard";
export default MonitoringRecordManualCard;
