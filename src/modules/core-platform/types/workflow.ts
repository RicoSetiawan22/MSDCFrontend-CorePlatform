export type ApprovalStatus = "pending" | "approved" | "rejected" | "delegated" | "escalated" | "cancelled";
export type WorkflowStatus = "active" | "waiting" | "pending" | "completed" | "cancelled" | "rejected";

export interface WorkflowInstance {
  id: number;
  instance_id: string;
  workflow_name: string;
  document_type: string;
  document_number: string;
  current_step_name: string;
  status: WorkflowStatus;
  submitted_by_name: string | null;
  submitted_at: string;
  completed_at: string | null;
  created_at: string;
}

export interface WorkflowApproval {
  id: number;
  instance_id: string;
  step_name: string;
  approver_name: string;
  status: ApprovalStatus;
  action_at: string | null;
  notes: string | null;
}

/**
 * Bentuk 1 baris di My Approvals - dipetakan backend dari
 * WorkflowInstanceLevel (lihat WorkflowInstanceController::myApprovals()),
 * BUKAN row WorkflowInstance mentah. `id` = id WorkflowInstanceLevel (buat
 * React key), `instance_id` = id WorkflowInstance yang SEBENARNYA dipakai
 * untuk approve()/reject() - dua id ini BEDA, jangan tertukar.
 */
export interface MyApprovalItem {
  id: number;
  instance_id: number;
  workflow_name: string;
  module_code: string;
  document_type: string;
  /** id record asli yang diajukan (Document.id kalau document_type=='surat',
   * dst) - lihat WorkflowInstanceController::myApprovals(). */
  document_id: number;
  document_number: string;
  current_step_name: string;
  status: ApprovalStatus;
  submitted_by_name: string | null;
  submitted_at: string | null;
  min_approval_count: number;
  approved_vote_count: number;
  /** Snapshot data dokumen asli saat diajukan (bentuknya beda-beda per
   * document_type - lihat pemanggil submit() di modul masing-masing,
   * mis. quotationApi.submitApproval()). Render defensif di UI. */
  payload: Record<string, unknown> | null;
}

export interface WorkflowTemplate {
  id: number;
  code: string;
  name: string;
  module_code: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  published_version?: WorkflowVersion | null;
  versions?: WorkflowVersion[];
}

export type WorkflowVersionStatus = "draft" | "published" | "archived";

export interface WorkflowVersion {
  id: number;
  template_id: number;
  version_number: number;
  status: WorkflowVersionStatus;
  notes: string | null;
  published_at: string | null;
  created_at: string;
  levels?: WorkflowLevel[];
}

export type ApproverType = "role" | "user" | "department_head" | "dynamic_field" | "scoped_role";

export interface WorkflowLevel {
  id: number;
  version_id: number;
  sequence: number;
  name: string;
  approver_type: ApproverType;
  approver_ref: string | null;
  min_approval_count: number;
  is_final: boolean;
  conditions?: WorkflowCondition[];
  actions?: WorkflowAction[];
}

export type ConditionOperator = "=" | "!=" | ">" | ">=" | "<" | "<=" | "in" | "not_in" | "contains";

export interface WorkflowCondition {
  id: number;
  level_id: number;
  condition_group: number;
  field: string;
  operator: ConditionOperator;
  value: string;
}

export type ActionTrigger = "on_enter" | "on_approve" | "on_reject" | "on_escalate";
export type ActionType = "notify_email" | "notify_system" | "webhook" | "auto_approve" | "auto_reject";

export interface WorkflowAction {
  id: number;
  level_id: number;
  trigger: ActionTrigger;
  action_type: ActionType;
  config: Record<string, unknown> | null;
}

export interface WorkflowTransition {
  id: number;
  from_level_id: number;
  to_level_id: number | null;
  event: string;
  condition: { field: string; operator: ConditionOperator; value: string }[] | null;
  from_level?: { id: number; name: string };
  to_level?: { id: number; name: string } | null;
}

export type NotificationChannel = "email" | "wa" | "push" | "sms";
export type NotificationRecipientType = "approver" | "initiator" | "role" | "custom_user";

export interface WorkflowNotificationConfig {
  id: number;
  level_id: number;
  trigger: ActionTrigger;
  channel: NotificationChannel;
  template_code: string;
  recipient_type: NotificationRecipientType;
  recipient_ref: string | null;
  is_active: boolean;
  level?: { id: number; name: string };
}
