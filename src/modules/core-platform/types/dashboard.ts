export interface CoreSystemStatus {
  is_healthy: boolean;
  status_label: string;
  last_backup_time: string | null;
  last_backup_size_mb: number | null;
  queue_pending_jobs: number;
  queue_failed_jobs: number;
  php_version: string;
  environment: string;
}

export interface CoreKpis {
  total_users: number;
  active_users: number;
  two_factor_users: number;
  two_factor_rate: number;

  pending_approvals: number;
  approved_approvals: number;
  rejected_approvals: number;
  overdue_approvals: number;

  documents_this_month: number;
  documents_signed: number;
  documents_draft: number;

  active_queue_jobs: number;
  failed_queue_jobs: number;
}

export interface WorkflowTrendItem {
  period: string;
  initiated: number;
  approved: number;
  rejected: number;
}

export interface ModuleDistributionItem {
  module: string;
  label: string;
  count: number;
}

export interface CoreCharts {
  workflow_trend: WorkflowTrendItem[];
  module_distribution: ModuleDistributionItem[];
}

export interface BottleneckItem {
  instance_id: number;
  reference_number: string;
  title: string;
  module_code: string;
  current_step: string;
  approver_name: string;
  approver_user_id: number | null;
  initiator_name: string;
  initiated_at: string | null;
  days_pending: number;
  is_overdue: boolean;
}

export interface RecentAuditItem {
  id: number;
  user_name: string;
  status: string;
  ip_address: string;
  device: string;
  created_at: string | null;
}

export interface CoreDashboardSummary {
  system_status: CoreSystemStatus;
  kpis: CoreKpis;
  charts: CoreCharts;
  bottlenecks: BottleneckItem[];
  recent_audits: RecentAuditItem[];
}
