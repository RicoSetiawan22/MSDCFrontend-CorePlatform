import type { MetricType } from "../../types/monitoring";

export type ThresholdStatus = "normal" | "warning" | "critical";

export interface ThresholdEvaluation {
  status: ThresholdStatus;
  label: "Normal" | "Warning" | "Critical";
  detail: string;
  dotColor: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
}

export interface CustomThresholdConfig {
  warning_threshold?: number | null;
  critical_threshold?: number | null;
  comparison?: "above" | "below";
}

/**
 * Safely parses metric value string or number to a clean float
 */
export function parseMetricValue(value: number | string | null | undefined): number {
  if (value == null) return 0;
  if (typeof value === "number") return isNaN(value) ? 0 : value;
  const parsed = parseFloat(value);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Evaluates metric reading status based on ASHRAE TC 9.9 thermal/humidity guidelines
 * or custom defined thresholds.
 *
 * ASHRAE TC 9.9 Standard:
 * - Temperature (°C):
 *   - Normal (Recommended): 18.0°C - 27.0°C
 *   - Warning (Allowable): 27.1°C - 30.0°C or 15.0°C - 17.9°C
 *   - Critical: > 30.0°C or < 15.0°C
 *
 * - Humidity (% RH):
 *   - Normal (Recommended): 40.0% - 60.0%
 *   - Warning (Allowable): 60.1% - 70.0% or 20.0% - 39.9%
 *   - Critical: > 70.0% (Risk of condensation) or < 20.0% (Risk of ESD)
 */
export function evaluateMetricThreshold(
  rawVal: number | string,
  metricType: MetricType | string,
  customThreshold?: CustomThresholdConfig | null
): ThresholdEvaluation {
  const num = parseMetricValue(rawVal);

  // If custom threshold is set
  if (customThreshold && (customThreshold.warning_threshold != null || customThreshold.critical_threshold != null)) {
    const comp = customThreshold.comparison ?? "above";
    const warn = customThreshold.warning_threshold;
    const crit = customThreshold.critical_threshold;

    if (comp === "above") {
      if (crit != null && num >= crit) {
        return createEvaluation("critical", `Melebihi Limit Kritis (≥ ${crit})`);
      }
      if (warn != null && num >= warn) {
        return createEvaluation("warning", `Melebihi Ambang Warning (≥ ${warn})`);
      }
      return createEvaluation("normal", "Dalam Batas Aman");
    } else {
      if (crit != null && num <= crit) {
        return createEvaluation("critical", `Di Bawah Limit Kritis (≤ ${crit})`);
      }
      if (warn != null && num <= warn) {
        return createEvaluation("warning", `Di Bawah Ambang Warning (≤ ${warn})`);
      }
      return createEvaluation("normal", "Dalam Batas Aman");
    }
  }

  // ASHRAE TC 9.9 Default Guidelines
  if (metricType === "temperature") {
    if (num > 30.0) {
      return createEvaluation("critical", "Kritis: Suhu Berlebih (>30°C)");
    }
    if (num < 15.0) {
      return createEvaluation("critical", "Kritis: Suhu Terlalu Dingin (<15°C)");
    }
    if (num > 27.0) {
      return createEvaluation("warning", "Warning: Suhu Hangat (>27°C)");
    }
    if (num < 18.0) {
      return createEvaluation("warning", "Warning: Di Bawah Rekomendasi (<18°C)");
    }
    return createEvaluation("normal", "Normal ASHRAE");
  }

  if (metricType === "humidity") {
    if (num > 70.0) {
      return createEvaluation("critical", "Kritis: Risiko Kondensasi (>70%)");
    }
    if (num < 20.0) {
      return createEvaluation("critical", "Kritis: Risiko ESD / Kering (<20%)");
    }
    if (num > 60.0) {
      return createEvaluation("warning", "Warning High (>60%)");
    }
    if (num < 40.0) {
      return createEvaluation("warning", "Warning Low (<40%)");
    }
    return createEvaluation("normal", "Optimal (40-60%)");
  }

  return createEvaluation("normal", "Normal");
}

function createEvaluation(status: ThresholdStatus, detail: string): ThresholdEvaluation {
  switch (status) {
    case "critical":
      return {
        status: "critical",
        label: "Critical",
        detail,
        dotColor: "#dc2626", // Red-600
        badgeBg: "#fef2f2",  // Red-50
        badgeText: "#b91c1c", // Red-700
        badgeBorder: "#fecaca", // Red-200
      };
    case "warning":
      return {
        status: "warning",
        label: "Warning",
        detail,
        dotColor: "#d97706", // Amber-600
        badgeBg: "#fffbeb",  // Amber-50
        badgeText: "#b45309", // Amber-700
        badgeBorder: "#fde68a", // Amber-200
      };
    case "normal":
    default:
      return {
        status: "normal",
        label: "Normal",
        detail,
        dotColor: "#059669", // Emerald-600
        badgeBg: "#ecfdf5",  // Emerald-50
        badgeText: "#047857", // Emerald-700
        badgeBorder: "#a7f3d0", // Emerald-200
      };
  }
}

/**
 * Format timestamp into Indonesian human readable representation
 */
export function formatMonitoringTimestamp(isoDate: string): string {
  if (!isoDate) return "—";
  try {
    const d = new Date(isoDate);
    if (isNaN(d.getTime())) return isoDate.replace("T", " ").slice(0, 16);
    const yr = d.getFullYear();
    const mo = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const hr = String(d.getHours()).padStart(2, "0");
    const min = String(d.getMinutes()).padStart(2, "0");
    return `${yr}-${mo}-${day} ${hr}:${min}`;
  } catch {
    return isoDate.replace("T", " ").slice(0, 16);
  }
}
