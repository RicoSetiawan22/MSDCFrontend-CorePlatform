/**
 * Data Center Operations - Dashboard Type Definitions
 * File: src/modules/data-center-ops/types/dashboard.ts
 *
 * Selaras dengan response API backend Laravel MSDC ERP
 * (/v1/data-center-ops/dashboard/*)
 */

import type { Rack } from "./rack";
import type { Ticket } from "./ticket";

// ─── 1. Literal Union Types ──────────────────────────────────────────────────

export type SystemOperationalStatus = "OPERATIONAL" | "DEGRADED" | "CRITICAL";

export type SeverityLevel = "critical" | "warning" | "info" | string;

export type RackOperationalStatus = "normal" | "warning" | "critical" | "maintenance" | string;

export type TicketPriority = "critical" | "high" | "medium" | "low" | string;

// ─── 2. Interface Ringkasan Metrik (KPI Summary) ──────────────────────────────

export interface SiteSummaryKPI {
  total: number;
  active: number;
  maintenance: number;
  decommissioned: number;
}

export interface RackSummaryKPI {
  total: number;
  active: number;
  total_u: number;
  used_u: number;
  free_u: number;
  utilization_pct: number;
}

export interface DeviceSummaryKPI {
  total: number;
  active: number;
  spare: number;
  maintenance: number;
  decommissioned?: number;
  warranty_expiring?: number;
  warranty_expiring_30d?: number;
  by_type?: Record<string, number>;
}

export interface CapacitySummaryKPI {
  total_power_capacity_kw: number;
  avg_power_consumption_kw: number;
  avg_temperature_celsius: number;
  temp_alarms_24h: number;
}

export interface IpamSummaryKPI {
  total_subnets: number;
  total_ips: number;
  allocated_ips: number;
  available_ips: number;
  reserved_ips: number;
  utilization_pct: number;
}

export interface TicketSummaryKPI {
  total: number;
  open: number;
  resolved: number;
  closed: number;
  response_overdue?: number;
  resolution_overdue?: number;
  overdue_sla?: number;
  created_7d: number;
  by_priority?: Record<string, number>;
}

export interface AlarmSummaryKPI {
  total?: number;
  open: number;
  open_critical: number;
  open_warning: number;
  triggered_24h?: number;
  unresolved_over_24h?: number;
  resolved_24h?: number;
}

export interface RemoteHandsSummaryKPI {
  total_hours_30d: number;
  total_tasks_30d: number;
  open_tickets: number;
}

// ─── 3. Interface Monitoring Rak & Alarm Detail ───────────────────────────────

export interface EmptyRackDetail {
  id: number;
  rack_code: string;
  total_u: number;
  power_watt: number | null;
  site: string;
  room: string;
  status: string;
}

export interface TopUsedRackDetail {
  id: number;
  rack_code: string;
  site: string;
  used_u: number;
  total_u?: number;
  free_u?: number;
}

export interface ActiveAlarmItem {
  id: number;
  severity: SeverityLevel;
  alarm_type: string;
  target?: string;
  object_name?: string;
  site?: string;
  site_name?: string;
  site_id?: number | null;
  device_id?: number | null;
  rack_id?: number | null;
  message: string;
  triggered_at: string;
  status?: string;
}

export interface RackMonitoringItem {
  id: number;
  rack_code: string;
  site_name: string;
  room_name: string;
  total_u: number;
  used_u: number;
  utilization_pct: number;
  power_kw: number;
  temperature_c: number;
  status: RackOperationalStatus;
}

export interface DashboardDetailsData {
  rack_details?: {
    empty_racks: EmptyRackDetail[];
    top_used: TopUsedRackDetail[];
    empty_count: number;
  };
  alarm_details?: {
    active_alarms: ActiveAlarmItem[];
    active_count: number;
  };
  ip_details?: {
    allocated_ips: Array<{ ip: string; id: number; owner: string; device: string; rack_id: number | null }>;
    by_customer: Array<{ customer_id: number; company_name: string; allocated_ips: number }>;
    allocated_count: number;
  };
  device_details?: {
    own_devices: Array<{ id: number; device_name: string; device_type: string; site: string; rack: string; rack_u: number | null; status: string }>;
    by_customer: Array<{ customer_id: number; company_name: string; device_count: number }>;
    unmounted: Array<{ id: number; device_name: string; device_type: string; site: string; status: string }>;
    own_count: number;
  };
  ticket_details?: {
    open_tickets: Array<{ id: number; status: string; priority: string; site: string; subject?: string; ticket_type?: string }>;
    remote_hands: Array<{ id: number; status: string; priority: string; site: string; ticket_type: string }>;
    open_count: number;
  };
  racks_monitoring?: RackMonitoringItem[];
  active_alarms?: ActiveAlarmItem[];
}

// ─── 4. Interface Seksi Baru (Petugas Bertugas, Alarms Table, Infra Status) ──

export type StaffDutyStatus = 'on_duty' | 'off_duty' | 'on_leave';
export type AlarmIncidentStatus = 'open' | 'acknowledged' | 'assigned' | 'investigating' | 'resolved';

export interface RawOnDutyStaffItem {
  schedule_id: number;
  employee_id: number;
  employee_name: string;
  employee_number: string;
  photo_file_id: number | null;
  phone: string | null;
  email: string;
  position_title: string;
  site_id: number;
  site_name: string;
  shift_code: string;
  shift_start: string;
  shift_end: string;
  status: string;
  skills: string[];
  open_tickets_count: number;
}

export interface OnDutyTodayApiResponse {
  status?: number;
  body?: {
    data: RawOnDutyStaffItem[];
    meta: {
      generated_at: string;
      date: string;
    };
  };
  data?: RawOnDutyStaffItem[];
  meta?: {
    generated_at: string;
    date: string;
  };
}

export interface IPaginationMeta {
  current_page: number;
  per_page: number;
  total_items: number;
  total_pages: number;
}

export interface IStaffMember {
  id: string | number;
  schedule_id?: number;
  employee_id?: number;
  name: string;
  employee_number?: string;
  role: string;
  avatar_initials: string;
  avatar_url?: string | null;
  shift: string;
  shift_code?: string;
  shift_start?: string;
  shift_end?: string;
  email: string;
  phone?: string | null;
  status: StaffDutyStatus;
  status_label: string;
  skills?: string[];
  open_tickets_count?: number;
  profile_url?: string;
}

export interface ISiteStaffGroup {
  site_id: string | number;
  site_name: string;
  total_on_duty: number;
  staff_members: IStaffMember[];
}

export interface IStaffDutySectionData {
  duty_date: string;
  duty_date_formatted: string;
  total_sites: number;
  total_staff_active: number;
  sites: ISiteStaffGroup[];
}

export interface IActiveAlarmTableItem {
  id: string | number;
  severity: SeverityLevel;
  object_name: string;
  problem: string;
  site_name: string;
  triggered_at: string;
  time_ago: string;
  status: AlarmIncidentStatus;
  status_label: string;
}

export interface IActiveAlarmsSectionData {
  total_active: number;
  alarms: IActiveAlarmTableItem[];
  pagination: IPaginationMeta;
}

export interface IInfraMetricBreakdown {
  count: number;
  percentage: number;
}

export interface IInfraStatusSectionData {
  last_updated: string;
  total_devices: number;
  healthy: IInfraMetricBreakdown;
  warning: IInfraMetricBreakdown;
  critical: IInfraMetricBreakdown;
}

// Objek Agregat Response dari GET /v1/data-center-ops/dashboard/summary
export interface DashboardSummaryData {
  system_status?: SystemOperationalStatus;
  last_sync_time?: string;
  sites?: SiteSummaryKPI;
  racks?: RackSummaryKPI;
  devices?: DeviceSummaryKPI;
  capacity?: CapacitySummaryKPI;
  ipam?: IpamSummaryKPI;
  tickets?: TicketSummaryKPI;
  alarms?: AlarmSummaryKPI;
  remote_hands?: RemoteHandsSummaryKPI;
  staff_on_duty?: IStaffDutySectionData;
  active_alarms_table?: IActiveAlarmsSectionData;
  infrastructure_status?: IInfraStatusSectionData;
  racks_list?: Rack[];
  tickets_list?: Ticket[];
}

// ─── 5. Kontrak Wrapper Response Standar API ─────────────────────────────────

export interface ApiResponse<T> {
  success?: boolean;
  message?: string;
  data: T;
}


