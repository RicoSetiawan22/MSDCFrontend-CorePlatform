import { apiClient } from "@shared/lib/api-client";
import type { ApiMessageResponse } from "@shared/types/api";

const BASE = "/v1/hr-service-support";

/** level HANYA 4 nilai ini di backend (hr_position.level enum) - dropdown
 * yang dulu menawarkan intern/senior/assistant_manager/director/vp akan
 * selalu gagal 422 kalau benar-benar dipilih & disimpan. */
export type PositionLevel = "staff" | "supervisor" | "manager" | "senior_manager";

/** "field" = posisi lapangan DC Ops (bisa dirotasi antar site lewat papan
 * Jadwal Shift), "office" = posisi kantor biasa. Independen dari site_id -
 * posisi field yang rotasi antar site TIDAK punya satu site_id tetap. */
export type WorkLocation = "office" | "field";

/** Katalog metrik KPI yang bisa dihitung otomatis dari sistem (lintas
 * modul CRM/DataCenterOps/HR) - lihat KpiMetricCatalog di backend. Dipakai
 * combobox pilih target KPI di form Position. */
export interface KpiMetric {
  key: string;
  label: string;
  module: string;
}

export interface PositionKpiTargetValue {
  metric_key: string;
  target_value: number;
  metric_label?: string;
}

export interface Position {
  id: number;
  position_code: string;
  position_title: string;
  department_id: number | null;
  department_name?: string;
  site_id: number | null;
  site?: { id: number; site_name: string; site_code: string } | null;
  work_location: WorkLocation;
  level: PositionLevel;
  /** Approver Ijin (PermissionRequest) untuk semua employee di posisi ini -
   * lihat PermissionRequestController::store(). Wajib punya akun User
   * tertaut supaya bisa nerima approval di "My Approvals". */
  head_employee_id: number | null;
  head?: { id: number; full_name: string } | null;
  employees_count?: number;
  kpi_targets?: PositionKpiTargetValue[];
  created_at: string;
}

/** position_code TIDAK ADA di sini - auto-generated dari Number Sequence
 * terpusat (Master Data > Number Sequence, module_code='position'), bukan
 * diketik manual. Lihat EmployeeService::createPosition() backend. */
export interface PositionValues {
  position_title: string;
  department_id?: number;
  site_id?: number;
  work_location?: WorkLocation;
  level?: PositionLevel;
  head_employee_id?: number | null;
  kpi_targets?: { metric_key: string; target_value: number }[];
}

export const positionApi = {
  list() {
    return apiClient.get<{ data: Position[] }>(`${BASE}/positions`);
  },
  create(values: PositionValues) {
    return apiClient.post<ApiMessageResponse<Position>>(`${BASE}/positions`, values);
  },
  update(id: number, values: PositionValues) {
    return apiClient.put<ApiMessageResponse<Position>>(`${BASE}/positions/${id}`, values);
  },
  kpiMetrics() {
    return apiClient.get<{ data: KpiMetric[] }>(`${BASE}/kpi-metrics`);
  },
};
