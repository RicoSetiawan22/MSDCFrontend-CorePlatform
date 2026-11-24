import { apiClient } from "@shared/lib/api-client";
import type { PaginatedResponse, ApiMessageResponse } from "@shared/types/api";
import type {
  WorkflowTemplate,
  WorkflowVersion,
  WorkflowLevel,
  WorkflowCondition,
  WorkflowAction,
  WorkflowTransition,
  WorkflowNotificationConfig,
  ApproverType,
  ConditionOperator,
  ActionTrigger,
  ActionType,
  NotificationChannel,
  NotificationRecipientType,
} from "../types/workflow";

const BASE = "/v1/core-platform/workflow";

export interface TemplateFormValues {
  code: string;
  name: string;
  module_code: string;
  description?: string;
}

export interface VersionFormValues {
  template_id: number;
  version_number: number;
  notes?: string;
}

export interface LevelFormValues {
  version_id: number;
  sequence: number;
  name: string;
  approver_type: ApproverType;
  approver_ref?: string;
  min_approval_count?: number;
  is_final?: boolean;
}

export interface ConditionFormValues {
  level_id: number;
  condition_group?: number;
  field: string;
  operator: ConditionOperator;
  value: string;
}

export interface ActionFormValues {
  level_id: number;
  trigger: ActionTrigger;
  action_type: ActionType;
  config?: Record<string, unknown>;
}

export interface TransitionFormValues {
  from_level_id: number;
  to_level_id?: number | null;
  event: string;
  condition?: { field: string; operator: ConditionOperator; value: string }[];
}

export interface NotificationFormValues {
  level_id: number;
  trigger: ActionTrigger;
  channel: NotificationChannel;
  template_code: string;
  recipient_type: NotificationRecipientType;
  recipient_ref?: string;
}

export const workflowDesignApi = {
  // ---- Template ----
  templates(params: { module_code?: string; per_page?: number; page?: number }) {
    return apiClient.get<ApiMessageResponse<PaginatedResponse<WorkflowTemplate>>>(`${BASE}/templates`, { params });
  },
  templateShow(id: number) {
    return apiClient.get<ApiMessageResponse<WorkflowTemplate>>(`${BASE}/templates/${id}`);
  },
  templateStore(payload: TemplateFormValues) {
    return apiClient.post<ApiMessageResponse<WorkflowTemplate>>(`${BASE}/templates`, payload);
  },
  templateUpdate(id: number, payload: Partial<TemplateFormValues> & { is_active?: boolean }) {
    return apiClient.put<ApiMessageResponse<WorkflowTemplate>>(`${BASE}/templates/${id}`, payload);
  },

  // ---- Version ----
  versionStore(payload: VersionFormValues) {
    return apiClient.post<ApiMessageResponse<WorkflowVersion>>(`${BASE}/versions`, payload);
  },
  versionPublish(id: number) {
    return apiClient.post<ApiMessageResponse<WorkflowVersion>>(`${BASE}/versions/${id}/publish`);
  },

  // ---- Level ----
  levelStore(payload: LevelFormValues) {
    return apiClient.post<ApiMessageResponse<WorkflowLevel>>(`${BASE}/levels`, payload);
  },
  levelUpdate(id: number, payload: Partial<LevelFormValues>) {
    return apiClient.put<ApiMessageResponse<WorkflowLevel>>(`${BASE}/levels/${id}`, payload);
  },
  levelDestroy(id: number) {
    return apiClient.delete<ApiMessageResponse<null>>(`${BASE}/levels/${id}`);
  },

  // ---- Condition ----
  conditionStore(payload: ConditionFormValues) {
    return apiClient.post<ApiMessageResponse<WorkflowCondition>>(`${BASE}/conditions`, payload);
  },
  conditionDestroy(id: number) {
    return apiClient.delete<ApiMessageResponse<null>>(`${BASE}/conditions/${id}`);
  },

  // ---- Action ----
  actionStore(payload: ActionFormValues) {
    return apiClient.post<ApiMessageResponse<WorkflowAction>>(`${BASE}/actions`, payload);
  },
  actionDestroy(id: number) {
    return apiClient.delete<ApiMessageResponse<null>>(`${BASE}/actions/${id}`);
  },

  // ---- Transition ----
  transitions(params: { from_level_id?: number }) {
    return apiClient.get<ApiMessageResponse<WorkflowTransition[]>>(`${BASE}/transitions`, { params });
  },
  transitionStore(payload: TransitionFormValues) {
    return apiClient.post<ApiMessageResponse<WorkflowTransition>>(`${BASE}/transitions`, payload);
  },
  transitionUpdate(id: number, payload: Partial<TransitionFormValues>) {
    return apiClient.put<ApiMessageResponse<WorkflowTransition>>(`${BASE}/transitions/${id}`, payload);
  },
  transitionDestroy(id: number) {
    return apiClient.delete<ApiMessageResponse<null>>(`${BASE}/transitions/${id}`);
  },

  // ---- Notification ----
  notifications(params: { level_id?: number }) {
    return apiClient.get<ApiMessageResponse<WorkflowNotificationConfig[]>>(`${BASE}/notifications`, { params });
  },
  notificationStore(payload: NotificationFormValues) {
    return apiClient.post<ApiMessageResponse<WorkflowNotificationConfig>>(`${BASE}/notifications`, payload);
  },
  notificationUpdate(id: number, payload: Partial<NotificationFormValues> & { is_active?: boolean }) {
    return apiClient.put<ApiMessageResponse<WorkflowNotificationConfig>>(`${BASE}/notifications/${id}`, payload);
  },
  notificationDestroy(id: number) {
    return apiClient.delete<ApiMessageResponse<null>>(`${BASE}/notifications/${id}`);
  },

  // ---- Guidelines & Documentation ----
  guidelines() {
    return apiClient.get<{ success: boolean; data: any }>(`${BASE}/guidelines`);
  },
};
