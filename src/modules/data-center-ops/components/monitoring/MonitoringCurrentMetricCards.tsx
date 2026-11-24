import React from "react";
import { Thermometer, Droplets, Radio, Edit3 } from "lucide-react";
import type { MetricReading } from "../../types/monitoring";
import {
  evaluateMetricThreshold,
  parseMetricValue,
  formatMonitoringTimestamp,
} from "./metricThresholdEvaluator";

interface MonitoringCurrentMetricCardsProps {
  latestTemperature?: MetricReading | null;
  latestHumidity?: MetricReading | null;
  rackCode?: string;
}

export const MonitoringCurrentMetricCards: React.FC<MonitoringCurrentMetricCardsProps> = React.memo(({
  latestTemperature,
  latestHumidity,
  rackCode = "R03",
}) => {
  const tempVal = latestTemperature ? parseMetricValue(latestTemperature.value) : null;
  const humVal = latestHumidity ? parseMetricValue(latestHumidity.value) : null;

  const tempEval = tempVal != null ? evaluateMetricThreshold(tempVal, "temperature") : null;
  const humEval = humVal != null ? evaluateMetricThreshold(humVal, "humidity") : null;

  // Temperature bar calculation (Range 15°C - 35°C)
  const tempPercent = tempVal != null ? Math.min(Math.max(((tempVal - 15) / (35 - 15)) * 100, 5), 100) : 0;
  // Humidity bar calculation (Range 0% - 100%)
  const humPercent = humVal != null ? Math.min(Math.max(humVal, 5), 100) : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* ── CARD 1: SUHU SAAT INI ── */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 flex flex-col justify-between hover:shadow-md transition-all">
        <div>
          {/* Header */}
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-orange-50 text-orange-600">
                <Thermometer className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Suhu Saat Ini
              </span>
            </div>

            {tempEval ? (
              <span
                style={{
                  backgroundColor: tempEval.badgeBg,
                  color: tempEval.badgeText,
                  borderColor: tempEval.badgeBorder,
                }}
                className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold border"
              >
                <span
                  style={{ backgroundColor: tempEval.dotColor }}
                  className="w-1.5 h-1.5 rounded-full animate-pulse"
                />
                {tempEval.detail}
              </span>
            ) : (
              <span className="text-xs text-slate-400 font-medium">Belum ada data</span>
            )}
          </div>

          {/* Big Metric Value */}
          <div className="flex items-baseline gap-1 my-2">
            <span className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#0A2140]">
              {tempVal != null ? tempVal.toFixed(2) : "—"}
            </span>
            <span className="text-lg font-bold text-slate-500">°C</span>
          </div>

          {/* Gauge / Range Bar */}
          <div className="mt-3">
            <div className="flex items-center justify-between text-[11px] font-medium text-slate-500 mb-1">
              <span>Batas ASHRAE Thermal (18-27°C)</span>
              <span className="font-semibold text-slate-600">Warning Threshold: 27.5 °C</span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden relative">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${tempPercent}%`,
                  background:
                    tempVal == null
                      ? "#cbd5e1"
                      : tempVal > 30
                      ? "#dc2626"
                      : tempVal > 27
                      ? "linear-gradient(90deg, #10b981 0%, #f59e0b 100%)"
                      : tempVal < 18
                      ? "#3b82f6"
                      : "#10b981",
                }}
              />
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-1.5 font-medium">
            {latestTemperature?.source === "sensor" ? (
              <>
                <Radio className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
                <span>Sumber: <strong className="text-slate-700">Sensor IoT ({rackCode})</strong></span>
              </>
            ) : latestTemperature ? (
              <>
                <Edit3 className="w-3.5 h-3.5 text-blue-600" />
                <span>Sumber: <strong className="text-slate-700">Inspeksi Manual</strong></span>
              </>
            ) : (
              <span>Belum ada data</span>
            )}
          </div>
          <span className="font-mono text-[11px] text-slate-400">
            {latestTemperature ? `${formatMonitoringTimestamp(latestTemperature.recorded_at)} WIB` : "—"}
          </span>
        </div>
      </div>

      {/* ── CARD 2: KELEMBAPAN UDARA ── */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 flex flex-col justify-between hover:shadow-md transition-all">
        <div>
          {/* Header */}
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-cyan-50 text-cyan-600">
                <Droplets className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Kelembapan Udara
              </span>
            </div>

            {humEval ? (
              <span
                style={{
                  backgroundColor: humEval.badgeBg,
                  color: humEval.badgeText,
                  borderColor: humEval.badgeBorder,
                }}
                className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold border"
              >
                <span
                  style={{ backgroundColor: humEval.dotColor }}
                  className="w-1.5 h-1.5 rounded-full animate-pulse"
                />
                {humEval.detail}
              </span>
            ) : (
              <span className="text-xs text-slate-400 font-medium">Belum ada data</span>
            )}
          </div>

          {/* Big Metric Value */}
          <div className="flex items-baseline gap-1 my-2">
            <span className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#0A2140]">
              {humVal != null ? humVal.toFixed(2) : "—"}
            </span>
            <span className="text-lg font-bold text-slate-500">%</span>
          </div>

          {/* Gauge / Range Bar */}
          <div className="mt-3">
            <div className="flex items-center justify-between text-[11px] font-medium text-slate-500 mb-1">
              <span>Rekomendasi Kelembapan Relatif (RH 40-60%)</span>
              <span className="font-semibold text-slate-600">
                {humVal != null && humVal > 70
                  ? "Kondensasi Bahaya"
                  : humVal != null && humVal > 60
                  ? `${humVal.toFixed(1)}% — Mendekati Kondensasi`
                  : humVal != null && humVal < 40
                  ? "Risiko ESD / Udara Kering"
                  : "Kondisi Optimal"}
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden relative">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${humPercent}%`,
                  background:
                    humVal == null
                      ? "#cbd5e1"
                      : humVal > 70
                      ? "#dc2626"
                      : humVal > 60
                      ? "linear-gradient(90deg, #06b6d4 0%, #f59e0b 100%)"
                      : humVal < 40
                      ? "#f59e0b"
                      : "#06b6d4",
                }}
              />
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-1.5 font-medium">
            {latestHumidity?.source === "sensor" ? (
              <>
                <Radio className="w-3.5 h-3.5 text-cyan-600 animate-pulse" />
                <span>Sumber: <strong className="text-slate-700">Sensor IoT ({rackCode})</strong></span>
              </>
            ) : latestHumidity ? (
              <>
                <Edit3 className="w-3.5 h-3.5 text-blue-600" />
                <span>Sumber: <strong className="text-slate-700">Inspeksi Manual</strong></span>
              </>
            ) : (
              <span>Belum ada data</span>
            )}
          </div>
          <span className="font-mono text-[11px] text-slate-400">
            {latestHumidity ? `${formatMonitoringTimestamp(latestHumidity.recorded_at)} WIB` : "—"}
          </span>
        </div>
      </div>
    </div>
  );
});

MonitoringCurrentMetricCards.displayName = "MonitoringCurrentMetricCards";
