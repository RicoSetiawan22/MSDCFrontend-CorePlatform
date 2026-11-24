export interface IncidentWorklog {
  id: number;
  incident_id: number;
  created_by: number | null;
  log_type: WorklogType;
  description: string;
  hours_spent: number | null;
  total_hours: number | null;
  created_at: string;
  creator?: { id: number; full_name: string };
}

export type WorklogType =
  | "progress_note"
  | "root_cause"
  | "workaround"
  | "resolution"
  | "internal_note"
  | "customer_update";

export type IncidentStatus = "new" | "assigned" | "in_progress" | "resolved" | "closed";

export type IncidentPriority = "low" | "medium" | "high" | "critical";

export interface Incident {
  id: number;
  incident_number: string;
  title: string;
  description: string;
  category: string | null;
  priority: IncidentPriority;
  impact?: "low" | "medium" | "high";
  urgency?: "low" | "medium" | "high";
  status: IncidentStatus;
  customer_id: number | null;
  assigned_to: number | null;
  assignee?: { id: number; full_name: string } | null;
  affected_device_id: number | null;
  affected_site_id: number | null;
  sla_response_due_at: string | null;
  sla_resolution_due_at: string | null;
  first_response_at: string | null;
  opened_at: string;
  resolved_at: string | null;
  closed_at: string | null;
  created_at: string;
}

export interface IncidentListParams {
  page?: number;
  per_page?: number;
  status?: IncidentStatus;
  priority?: IncidentPriority;
  search?: string;
}

export type ProblemStatus = "open" | "under_investigation" | "known_error" | "resolved" | "closed";
export type ChangeStatus = "draft" | "submitted" | "approved" | "scheduled" | "implemented" | "failed" | "closed";
export type ChangeImpact = "low" | "medium" | "high" | "critical";
export type ChangeRisk = "low" | "medium" | "high";
export type ChangeType = "standard" | "normal" | "emergency";

export interface Problem {
  id: number;
  problem_number: string;
  title: string;
  root_cause: string | null;
  status: ProblemStatus;
  assigned_to: number | null;
  created_at: string;
  updated_at: string;
  assignee?: { id: number; full_name: string };
  incidents_count?: number;
  incidents?: Incident[];
}

export interface ChangeRequest {
  id: number;
  change_number: string;
  title: string;
  description: string | null;
  change_type: ChangeType;
  risk_level: ChangeRisk;
  status: ChangeStatus;
  affected_device_id: number | null;
  requested_by: number | null;
  workflow_instance_id: number | null;
  scheduled_date: string | null;
  implemented_at: string | null;
  rollback_plan: string | null;
  created_at: string;
  updated_at: string;
  requester?: { id: number; full_name: string };
  affected_device?: { id: number; device_name: string };
}

export type ReviewStatus = "draft" | "submitted" | "acknowledged";
export type GoalStatus = "on_track" | "at_risk" | "achieved" | "missed";

export interface PerformanceReview {
  id: number;
  employee_id: number;
  reviewer_id: number | null;
  review_period: string;
  review_date: string;
  overall_score: number | null;
  comments: string | null;
  status: ReviewStatus;
  created_at: string;
  updated_at: string;
  employee?: { id: number; full_name: string };
  reviewer?: { id: number; full_name: string };
  goals?: PerformanceGoal[];
}

export interface PerformanceGoal {
  id: number;
  review_id: number | null;
  employee_id: number;
  goal_description: string;
  target_value: number | null;
  weight_pct: number | null;
  actual_value: number | null;
  status: GoalStatus;
  created_at: string;
  updated_at: string;
}

/** Data kinerja objektif employee dari modul lain (DataCenterOps, CrmSales)
 * - dijembatani lewat hr_employee.user_id, ditampilkan sebagai referensi
 * saat reviewer membuat review/goal. */
export interface CrossModuleMetrics {
  has_user_account: boolean;
  data_center_ops: { tickets_resolved: number; tickets_open: number };
  hr_service_support: { incidents_resolved: number };
  crm_sales: { deals_won: number; deals_won_value: number; deals_lost: number };
}

/** Target KPI posisi employee (dipilih manual di halaman Position) vs
 * angka aktual dihitung otomatis dari sistem - lihat
 * PerformanceService::positionKpiProgress(). achievement_pct null berarti
 * target_value 0 (persentase tidak bermakna). */
export interface KpiProgressEntry {
  metric_key: string;
  label: string;
  target_value: number;
  actual_value: number;
  achievement_pct: number | null;
}
