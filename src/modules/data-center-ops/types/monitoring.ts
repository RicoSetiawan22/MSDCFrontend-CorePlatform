export type AlarmStatus = "open" | "acknowledged" | "resolved";
export type AlarmSeverity = "info" | "warning" | "critical";
export type MetricType = "power_kw" | "voltage" | "temperature" | "humidity" | "cpu_pct" | "ram_pct" | "storage_pct" | "bandwidth_mbps" | "other";

export interface Alarm {
  id: number;
  site_id: number | null;
  device_id: number | null;
  rack_id: number | null;
  alarm_type: string;
  severity: AlarmSeverity;
  message: string;
  status: AlarmStatus;
  triggered_at: string;
  acknowledged_at: string | null;
  acknowledged_by: number | null;
  resolved_at: string | null;
  resolved_by: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface MetricReading {
  id: number;
  site_id: number | null;
  device_id: number | null;
  rack_id: number | null;
  metric_type: MetricType;
  value: number | string;
  unit: string | null;
  source: "manual" | "sensor";
  recorded_at: string;
  created_at: string;
}

export interface MonitoringThreshold {
  id: number;
  metric_type: MetricType;
  site_id: number | null;
  device_id: number | null;
  rack_id: number | null;
  warning_threshold: number | null;
  warning_lower_threshold?: number | null;
  warning_upper_threshold?: number | null;
  critical_threshold: number | null;
  critical_lower_threshold?: number | null;
  critical_upper_threshold?: number | null;
  comparison: "above" | "below";
  is_active: boolean;
  created_at: string;
}

export interface MetricReadingListParams {
  page?: number;
  per_page?: number;
  site_id?: number;
  device_id?: number;
  rack_id?: number;
  metric_type?: MetricType;
  date_from?: string;
  date_to?: string;
}

export interface RecordReadingValues {
  site_id?: number;
  device_id?: number;
  rack_id?: number;
  metric_type: MetricType;
  value: number;
  unit?: string;
  source?: "manual" | "sensor";
  recorded_at?: string;
}

export type RackTelemetryStatus = "normal" | "warning" | "critical" | "no_data" | "unmonitored";
export type SensorOnlineStatus = "online" | "offline" | "not_installed";

export interface RackTelemetrySummaryItem {
  rack_id: number;
  rack_code: string;
  site_id: number | null;
  site_name: string;
  site_room_id: number | null;
  room_name: string;
  temperature: number | null;
  humidity: number | null;
  status: RackTelemetryStatus;
  has_iot_sensor: boolean;
  sensor_status: SensorOnlineStatus;
  breach_reasons: string[];
  active_alarms_count: number;
  last_recorded_at: string | null;
}

export interface AllRacksTelemetrySummaryResponse {
  summary: {
    total_racks: number;
    monitored_racks_count: number;
    unmonitored_racks_count: number;
    normal_count: number;
    warning_count: number;
    critical_count: number;
    no_data_count: number;
    avg_temperature: number | null;
    avg_humidity: number | null;
  };
  racks: RackTelemetrySummaryItem[];
}

