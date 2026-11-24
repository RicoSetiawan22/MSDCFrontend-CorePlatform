import React, { useMemo, useState, useCallback } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  CartesianGrid,
  Brush,
} from "recharts";
import {
  Activity,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Clock,
  Radio,
  Edit3,
} from "lucide-react";
import type { MetricReading } from "../../types/monitoring";
import {
  parseMetricValue,
  formatMonitoringTimestamp,
  evaluateMetricThreshold,
} from "./metricThresholdEvaluator";

export type RangePeriod = "24h" | "3d" | "7d";

interface MonitoringTrendChartsProps {
  temperatureReadings: MetricReading[];
  humidityReadings: MetricReading[];
  range: RangePeriod;
  onRangeChange: (r: RangePeriod) => void;
  isLoading?: boolean;
}

const RANGE_LABELS: { value: RangePeriod; label: string }[] = [
  { value: "24h", label: "24 Jam Terakhir" },
  { value: "3d", label: "3 Hari Terakhir" },
  { value: "7d", label: "7 Hari Terakhir" },
];

export const MonitoringTrendCharts: React.FC<MonitoringTrendChartsProps> = React.memo(({
  temperatureReadings,
  humidityReadings,
  range,
  onRangeChange,
  isLoading = false,
}) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm transition-all overflow-hidden">
      {/* Global Card Header */}
      <div className="p-5 sm:px-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/60">
        <div>
          <h2 className="text-sm sm:text-base font-bold text-[#0A2140] tracking-tight flex items-center gap-2 uppercase">
            <Activity className="w-4 h-4 text-[#E59B00]" />
            Grafik Tren Telemetri
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Histori pemantauan berkala dari sensor IoT &amp; audit fisik — dilengkapi fitur Zoom In/Out &amp; Timeline Slider
          </p>
        </div>

        {/* Range Period Dropdown */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="text-xs font-semibold text-slate-500">Rentang Waktu:</span>
          <select
            className="bg-white border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg px-3 py-1.5 focus:border-[#E59B00] outline-none shadow-xs cursor-pointer"
            value={range}
            onChange={(e) => onRangeChange(e.target.value as RangePeriod)}
          >
            {RANGE_LABELS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Vertical Stack: 2 Full-width Charts */}
      <div className="p-5 sm:p-7 flex flex-col gap-8 divide-y divide-slate-100">
        {/* ── 1. SUHU (°C) CHART (FULL WIDTH) ── */}
        <SingleTelemetryChart
          title="Suhu"
          metricType="temperature"
          color="#ef4444"
          gradientId="tempTrendGradient"
          unit="°C"
          upperThreshold={27.0}
          upperThresholdLabel="Batas Normal 27°C"
          lowerThreshold={18.0}
          lowerThresholdLabel="Batas Bawah 18°C"
          readings={temperatureReadings}
          isLoading={isLoading}
        />

        {/* ── 2. KELEMBAPAN (%) CHART (FULL WIDTH) ── */}
        <div className="pt-8">
          <SingleTelemetryChart
            title="Kelembapan"
            metricType="humidity"
            color="#0891b2"
            gradientId="humTrendGradient"
            unit="%"
            upperThreshold={60.0}
            upperThresholdLabel="Batas RH 60%"
            lowerThreshold={40.0}
            lowerThresholdLabel="Batas Bawah RH 40%"
            readings={humidityReadings}
            isLoading={isLoading}
          />
        </div>
      </div>
    </div>
  );
});

MonitoringTrendCharts.displayName = "MonitoringTrendCharts";

// ─────────────────────────────────────────────────────────────────────────────
// Sub-component: Single Full-width Telemetry Chart with Zoom & Brush Navigator
// ─────────────────────────────────────────────────────────────────────────────
interface SingleTelemetryChartProps {
  title: string;
  metricType: "temperature" | "humidity";
  color: string;
  gradientId: string;
  unit: string;
  upperThreshold?: number;
  upperThresholdLabel?: string;
  lowerThreshold?: number;
  lowerThresholdLabel?: string;
  referenceLineValue?: number;
  referenceLineLabel?: string;
  readings: MetricReading[];
  isLoading: boolean;
}

interface ChartItem {
  index: number;
  id: number;
  uniqueKey: string;
  time: string;
  fullTime: string;
  timestamp: number;
  rawTime: string;
  value: number;
  source: "manual" | "sensor";
  unit: string;
}

function SingleTelemetryChart({
  title,
  metricType,
  color,
  gradientId,
  unit,
  upperThreshold,
  upperThresholdLabel,
  lowerThreshold,
  lowerThresholdLabel,
  referenceLineValue,
  referenceLineLabel,
  readings,
  isLoading,
}: SingleTelemetryChartProps) {
  const upperVal = upperThreshold ?? referenceLineValue ?? (metricType === "temperature" ? 27.0 : 60.0);
  const upperLabel = upperThresholdLabel ?? referenceLineLabel ?? (metricType === "temperature" ? "Batas Normal 27°C" : "Batas RH 60%");
  const lowerVal = lowerThreshold ?? (metricType === "temperature" ? 18.0 : 40.0);
  const lowerLabel = lowerThresholdLabel ?? (metricType === "temperature" ? "Batas Bawah 18°C" : "Batas Bawah RH 40%");
  // 1. Process and STRICTLY SORT data ascending by timestamp (oldest -> newest)
  // This eliminates the timestamp jump/bug where tooltip points to a mismatched time.
  const chartData: ChartItem[] = useMemo(() => {
    const valid = readings.filter(
      (r) => r.recorded_at && !isNaN(new Date(r.recorded_at).getTime())
    );

    const sorted = [...valid].sort((a, b) => {
      const tA = new Date(a.recorded_at).getTime();
      const tB = new Date(b.recorded_at).getTime();
      return tA - tB;
    });

    return sorted.map((r, idx) => {
      const d = new Date(r.recorded_at);
      const val = parseMetricValue(r.value);
      const timeStr = d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
      const fullDateStr = formatMonitoringTimestamp(r.recorded_at);

      return {
        index: idx,
        id: r.id,
        // Guarantee 100% unique key for every single point to prevent Recharts category collisions
        uniqueKey: `${r.id}_${idx}_${r.recorded_at}`,
        time: timeStr,
        fullTime: fullDateStr,
        timestamp: d.getTime(),
        rawTime: r.recorded_at,
        value: Number(val.toFixed(2)),
        source: r.source,
        unit: r.unit ?? unit,
      };
    });
  }, [readings, unit]);

  // Lookup map for fast XAxis tick formatting
  const dataMap = useMemo(() => {
    return new Map(chartData.map((d) => [d.uniqueKey, d]));
  }, [chartData]);

  // Derived peak, minimum, and latest
  const peakVal = useMemo(() => {
    if (!chartData.length) return null;
    return Math.max(...chartData.map((d) => d.value));
  }, [chartData]);

  const latestVal = useMemo(() => {
    if (!chartData.length) return null;
    return chartData[chartData.length - 1].value;
  }, [chartData]);

  // Dynamic Y-axis domain ensuring both lower and upper threshold lines fit comfortably
  const yDomain = useMemo(() => {
    if (!chartData.length) return ["dataMin - 1", "dataMax + 1"];
    const minVal = Math.min(...chartData.map((d) => d.value));
    const maxVal = Math.max(...chartData.map((d) => d.value));
    const effectiveMin = lowerVal != null ? Math.min(minVal, lowerVal) - 1 : minVal - 1;
    const effectiveMax = upperVal != null ? Math.max(maxVal, upperVal) + 1 : maxVal + 1;
    return [Math.floor(effectiveMin), Math.ceil(effectiveMax)];
  }, [chartData, lowerVal, upperVal]);

  // 2. Zoom & Pan State
  const [zoomRange, setZoomRange] = useState<{ start: number; end: number } | null>(null);

  const totalPoints = chartData.length;
  const effectiveStart = zoomRange ? Math.max(0, zoomRange.start) : 0;
  const effectiveEnd = zoomRange ? Math.min(totalPoints - 1, zoomRange.end) : Math.max(0, totalPoints - 1);
  const isZoomed = zoomRange != null && (effectiveStart > 0 || effectiveEnd < totalPoints - 1);

  // Zoom In Handler (Shrinks visible window by 40%)
  const handleZoomIn = useCallback(() => {
    if (totalPoints <= 6) return;
    const currentStart = zoomRange ? zoomRange.start : 0;
    const currentEnd = zoomRange ? zoomRange.end : totalPoints - 1;
    const span = currentEnd - currentStart;
    if (span <= 6) return; // Don't zoom smaller than 6 points

    const newSpan = Math.max(6, Math.floor(span * 0.6));
    // Zoom toward the right (latest data)
    const newStart = Math.max(0, currentEnd - newSpan);
    setZoomRange({ start: newStart, end: currentEnd });
  }, [zoomRange, totalPoints]);

  // Zoom Out Handler (Expands visible window by 60%)
  const handleZoomOut = useCallback(() => {
    if (totalPoints <= 1) return;
    const currentStart = zoomRange ? zoomRange.start : 0;
    const currentEnd = zoomRange ? zoomRange.end : totalPoints - 1;
    const span = currentEnd - currentStart;
    const newSpan = Math.min(totalPoints - 1, Math.floor(span * 1.6));

    if (newSpan >= totalPoints - 1) {
      setZoomRange(null);
      return;
    }
    const newStart = Math.max(0, currentEnd - newSpan);
    setZoomRange({ start: newStart, end: currentEnd });
  }, [zoomRange, totalPoints]);

  // Reset Zoom
  const handleResetZoom = useCallback(() => {
    setZoomRange(null);
  }, []);

  // Pan Left / Right
  const handlePan = useCallback(
    (direction: "left" | "right") => {
      if (totalPoints <= 1) return;
      const currentStart = zoomRange ? zoomRange.start : 0;
      const currentEnd = zoomRange ? zoomRange.end : totalPoints - 1;
      const span = currentEnd - currentStart;
      const step = Math.max(1, Math.floor(span * 0.25));

      if (direction === "left") {
        const newStart = Math.max(0, currentStart - step);
        const newEnd = Math.min(totalPoints - 1, newStart + span);
        setZoomRange({ start: newStart, end: newEnd });
      } else {
        const newEnd = Math.min(totalPoints - 1, currentEnd + step);
        const newStart = Math.max(0, newEnd - span);
        setZoomRange({ start: newStart, end: newEnd });
      }
    },
    [zoomRange, totalPoints]
  );

  // Preset Zoom
  const handlePresetZoom = useCallback(
    (multiplier: number) => {
      if (totalPoints <= 6) return;
      if (multiplier === 1) {
        setZoomRange(null);
        return;
      }
      const span = Math.max(6, Math.floor(totalPoints / multiplier));
      const start = Math.max(0, totalPoints - span);
      setZoomRange({ start, end: totalPoints - 1 });
    },
    [totalPoints]
  );

  // Calculate current zoom factor
  const zoomFactor = useMemo(() => {
    if (!isZoomed || totalPoints <= 0) return "1x";
    const currentSpan = effectiveEnd - effectiveStart + 1;
    const factor = totalPoints / Math.max(1, currentSpan);
    return `${factor.toFixed(1)}x`;
  }, [isZoomed, totalPoints, effectiveStart, effectiveEnd]);

  return (
    <div className="flex flex-col">
      {/* Chart Header Bar: Title, Metrics, & Zoom Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 mb-3">
        {/* Left: Metric Title & Badges */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span
              style={{ backgroundColor: color }}
              className="w-3 h-3 rounded-full shrink-0 shadow-xs"
            />
            <span className="text-sm font-extrabold uppercase tracking-wider text-[#0A2140]">
              {title} ({unit})
            </span>
          </div>

          {peakVal != null && (
            <span className="text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200/80 px-2.5 py-0.5 rounded-md">
              Puncak: {peakVal.toFixed(2)} {unit}
            </span>
          )}

          {latestVal != null && (
            <span className="text-xs font-bold text-cyan-800 bg-cyan-50 border border-cyan-200/80 px-2.5 py-0.5 rounded-md">
              Terkini: {latestVal.toFixed(2)} {unit}
            </span>
          )}

          {isZoomed && (
            <span className="text-[11px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
              Menampilkan {effectiveEnd - effectiveStart + 1} dari {totalPoints} titik
            </span>
          )}
        </div>

        {/* Right: Interactive Zoom & Pan Controls */}
        <div className="flex flex-wrap items-center gap-1.5 self-start lg:self-auto">
          {/* Preset Buttons */}
          <div className="inline-flex bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-[11px] font-semibold">
            <button
              type="button"
              onClick={() => handlePresetZoom(1)}
              className={`px-2 py-1 rounded transition-all cursor-pointer ${
                !isZoomed ? "bg-white text-slate-800 font-bold shadow-2xs" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Semua (1x)
            </button>
            <button
              type="button"
              onClick={() => handlePresetZoom(2)}
              className="px-2 py-1 rounded text-slate-500 hover:text-slate-800 transition-all cursor-pointer"
            >
              2x
            </button>
            <button
              type="button"
              onClick={() => handlePresetZoom(4)}
              className="px-2 py-1 rounded text-slate-500 hover:text-slate-800 transition-all cursor-pointer"
            >
              4x
            </button>
          </div>

          {/* Pan Left Button */}
          {isZoomed && (
            <button
              type="button"
              onClick={() => handlePan("left")}
              disabled={effectiveStart === 0}
              title="Geser timeline ke kiri (waktu lampau)"
              className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 active:scale-95 disabled:opacity-30 cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Zoom In Button */}
          <button
            type="button"
            onClick={handleZoomIn}
            disabled={effectiveEnd - effectiveStart <= 6}
            title="Perbesar / Zoom In tampilan grafik"
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 active:scale-95 transition-all shadow-2xs disabled:opacity-40 cursor-pointer"
          >
            <ZoomIn className="w-3.5 h-3.5 text-[#E59B00]" />
            <span>Zoom In</span>
          </button>

          {/* Zoom Out Button */}
          <button
            type="button"
            onClick={handleZoomOut}
            disabled={!isZoomed}
            title="Perkecil / Zoom Out tampilan grafik"
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 active:scale-95 transition-all shadow-2xs disabled:opacity-40 cursor-pointer"
          >
            <ZoomOut className="w-3.5 h-3.5 text-slate-500" />
            <span>Zoom Out</span>
          </button>

          {/* Pan Right Button */}
          {isZoomed && (
            <button
              type="button"
              onClick={() => handlePan("right")}
              disabled={effectiveEnd === totalPoints - 1}
              title="Geser timeline ke kanan (waktu terkini)"
              className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 active:scale-95 disabled:opacity-30 cursor-pointer"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Reset Zoom Button */}
          {isZoomed && (
            <button
              type="button"
              onClick={handleResetZoom}
              title="Kembalikan zoom ke skala normal (100%)"
              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg border border-amber-200 bg-amber-50 text-amber-800 text-xs font-bold hover:bg-amber-100 transition-all cursor-pointer"
            >
              <RotateCcw className="w-3 h-3 text-[#E59B00]" />
              <span>Reset ({zoomFactor})</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Area Chart Container */}
      <div className="h-[270px] w-full pt-1">
        {isLoading ? (
          <div className="h-full flex items-center justify-center text-xs text-slate-400">
            Memuat grafik {title.toLowerCase()}...
          </div>
        ) : chartData.length === 0 ? (
          <div className="h-full flex items-center justify-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl">
            Belum ada data {title.toLowerCase()} dalam periode ini.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 12, right: 15, left: -15, bottom: 0 }}>
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={color} stopOpacity={0.35} />
                  <stop offset="95%" stopColor={color} stopOpacity={0.0} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />

              {/* XAxis with 100% unique key and clean formatted tick */}
              <XAxis
                dataKey="uniqueKey"
                tickFormatter={(key: string) => {
                  const item = dataMap.get(key);
                  return item ? item.time : "";
                }}
                tick={{ fontSize: 10, fill: "#64748b" }}
                axisLine={{ stroke: "#e2e8f0" }}
                tickLine={false}
                interval="preserveStartEnd"
                minTickGap={35}
              />

              <YAxis
                domain={yDomain}
                tick={{ fontSize: 10, fill: "#64748b" }}
                axisLine={false}
                tickLine={false}
                unit={unit}
              />

              {/* Accurate Tooltip */}
              <Tooltip
                content={<CustomChartTooltip unit={unit} title={title} metricType={metricType} />}
                isAnimationActive={false}
              />

              {/* Garis Ambang Batas Atas (Upper Threshold) */}
              {upperVal != null && (
                <ReferenceLine
                  y={upperVal}
                  stroke="#f59e0b"
                  strokeDasharray="4 4"
                  label={{
                    value: upperLabel,
                    position: "insideTopRight",
                    fill: "#d97706",
                    fontSize: 10,
                    fontWeight: 700,
                  }}
                />
              )}

              {/* Garis Ambang Batas Bawah (Lower Threshold) */}
              {lowerVal != null && (
                <ReferenceLine
                  y={lowerVal}
                  stroke="#3b82f6"
                  strokeDasharray="4 4"
                  label={{
                    value: lowerLabel,
                    position: "insideBottomRight",
                    fill: "#2563eb",
                    fontSize: 10,
                    fontWeight: 700,
                  }}
                />
              )}

              <Area
                type="monotone"
                dataKey="value"
                stroke={color}
                strokeWidth={2}
                fillOpacity={1}
                fill={`url(#${gradientId})`}
                dot={
                  chartData.length <= 40
                    ? { r: 3, fill: color, strokeWidth: 1.5, stroke: "#fff" }
                    : false
                }
                activeDot={{ r: 5.5, fill: color, stroke: "#fff", strokeWidth: 2.5 }}
              />

              {/* Interactive Timeline Brush (Slider) */}
              <Brush
                dataKey="uniqueKey"
                height={26}
                stroke={color}
                fill="#f8fafc"
                travellerWidth={10}
                startIndex={effectiveStart}
                endIndex={effectiveEnd}
                onChange={(range: { startIndex?: number; endIndex?: number }) => {
                  if (range.startIndex != null && range.endIndex != null) {
                    setZoomRange({ start: range.startIndex, end: range.endIndex });
                  }
                }}
                tickFormatter={(key: string) => {
                  const item = dataMap.get(key);
                  return item ? item.time : "";
                }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
      <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1 px-1">
        <span>Gunakan tombol Zoom atau geser handle pada slider di atas untuk memperbesar interval waktu tertentu</span>
        {isZoomed && <span className="font-semibold text-amber-600">Zoom Aktif ({zoomFactor})</span>}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Custom Tooltip Component: Accurately reflects hovered point
// ─────────────────────────────────────────────────────────────────────────────
interface TooltipPayloadData {
  value: number;
  payload: ChartItem;
}

function CustomChartTooltip({
  active,
  payload,
  unit,
  title,
  metricType,
}: {
  active?: boolean;
  payload?: TooltipPayloadData[];
  unit: string;
  title: string;
  metricType: "temperature" | "humidity";
}) {
  if (!active || !payload || !payload.length) return null;
  const item = payload[0].payload;
  if (!item) return null;

  const evalStatus = evaluateMetricThreshold(item.value, metricType);

  return (
    <div className="bg-[#0A2140] text-white p-3.5 rounded-xl shadow-2xl border border-slate-700/80 text-xs min-w-[210px] pointer-events-none z-50">
      {/* Full Date & Status Header */}
      <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-2 mb-2">
        <span className="text-[11px] text-slate-300 font-mono flex items-center gap-1 font-semibold">
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          {item.fullTime} WIB
        </span>
        <span
          style={{
            backgroundColor: evalStatus.badgeBg,
            color: evalStatus.badgeText,
            borderColor: evalStatus.badgeBorder,
          }}
          className="px-2 py-0.5 rounded text-[10px] font-bold border"
        >
          {evalStatus.label}
        </span>
      </div>

      {/* Main Metric Value */}
      <div className="flex items-baseline justify-between gap-2 my-1">
        <span className="text-slate-300 text-xs font-semibold">{title}:</span>
        <span className="text-lg font-black text-amber-400 font-mono">
          {item.value} {unit}
        </span>
      </div>

      {/* Detail / Status guidance */}
      <div className="text-[10px] text-slate-300 mb-2 italic">
        {evalStatus.detail}
      </div>

      {/* Footer Info: Source and Point Index */}
      <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-400">
        <span className="flex items-center gap-1">
          {item.source === "sensor" ? (
            <>
              <Radio className="w-3 h-3 text-cyan-400" />
              <strong className="text-slate-200">Sensor IoT</strong>
            </>
          ) : (
            <>
              <Edit3 className="w-3 h-3 text-amber-400" />
              <strong className="text-slate-200">Manual</strong>
            </>
          )}
        </span>
        <span className="text-[10px] font-mono text-slate-400">
          ID #{item.id}
        </span>
      </div>
    </div>
  );
}
