import { apiClient } from "@shared/lib/api-client";
import type { PaginatedResponse, ApiMessageResponse } from "@shared/types/api";
import type { 
  Alarm, 
  MetricReading, 
  MetricReadingListParams, 
  RecordReadingValues, 
  MonitoringThreshold,
  AllRacksTelemetrySummaryResponse
} from "../types/monitoring";

const BASE = "/v1/data-center-ops";

export const monitoringApi = {
  listReadings(params: MetricReadingListParams) {
    return apiClient.get<PaginatedResponse<MetricReading>>(`${BASE}/metric-readings`, { params });
  },
  recordReading(values: RecordReadingValues) {
    return apiClient.post<ApiMessageResponse<MetricReading>>(`${BASE}/metric-readings`, values);
  },
  setThreshold(values: {
    metric_type: string;
    rack_id?: number;
    site_id?: number;
    device_id?: number;
    warning_threshold?: number;
    warning_lower_threshold?: number;
    warning_upper_threshold?: number;
    critical_threshold?: number;
    critical_lower_threshold?: number;
    critical_upper_threshold?: number;
    comparison?: "above" | "below";
  }) {
    return apiClient.post<ApiMessageResponse<MonitoringThreshold>>(`${BASE}/monitoring-thresholds`, values);
  },
  getAllRacksTelemetrySummary(params?: {
    site_id?: number;
    site_room_id?: number;
    status?: string;
    only_monitored?: boolean;
  }) {
    return apiClient.get<AllRacksTelemetrySummaryResponse>(`${BASE}/monitoring/racks/telemetry-summary`, { params });
  },
  listAlarms(params: { rack_id?: number; status?: string; severity?: string; per_page?: number }) {
    return apiClient.get<PaginatedResponse<Alarm>>(`${BASE}/alarms`, { params });
  },
  acknowledgeAlarm(id: number) {
    return apiClient.post<ApiMessageResponse<Alarm>>(`${BASE}/alarms/${id}/acknowledge`, {});
  },
  resolveAlarm(id: number, notes?: string) {
    return apiClient.post<ApiMessageResponse<Alarm>>(`${BASE}/alarms/${id}/resolve`, { notes });
  },
};
