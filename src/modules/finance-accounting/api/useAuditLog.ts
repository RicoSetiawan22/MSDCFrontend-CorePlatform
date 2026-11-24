import { useMutation, useQuery } from "@tanstack/react-query";
import { apiClient } from "@shared/lib/api-client";
import { normalizeBlobError } from "@shared/lib/downloadFile";
import { useActiveOrgId } from "@shared/lib/organization-context";

export interface AuditLogEntry {
  id: number;
  occurred_at: string;
  user_id: number;
  user_name: string;
  user_email: string;
  module: string;
  entity_type: string;
  entity_id: string | number | null;
  action: "created" | "updated" | "deleted" | "posted" | "reversed" | "voided" | "approved" | "rejected" | "imported" | "exported" | string;
  before_summary: string | null;
  after_summary: string | null;
  ip_address: string | null;
  /** Alasan/notes yang diisi user saat approve/reject/reversal */
  reason?: string;
}

export interface AuditLogResponse {
  data: AuditLogEntry[];
  total: number;
  page: number;
  per_page: number;
  last_page?: number;
  current_page?: number;
  from?: number;
  to?: number;
}

export interface AuditLogParams {
  page?: number;
  per_page?: number;
  entity_type?: string;
  action?: string;
  user_id?: number;
  date_from?: string;
  date_to?: string;
  module?: string;
}

const BASE_PATH = "/v1/finance-accounting/audit-log";

const auditLogKeys = {
  all: ["finance-audit-log"] as const,
  list: (activeOrgId: number, params: AuditLogParams) =>
    [...auditLogKeys.all, activeOrgId, "list", params] as const,
};

export function useAuditLog(params: AuditLogParams) {
  const activeOrgId = useActiveOrgId();
  return useQuery({
    queryKey: auditLogKeys.list(activeOrgId, params),
    queryFn: () =>
      apiClient
        .get<AuditLogResponse>(BASE_PATH, { params })
        .then((res) => res.data),
    placeholderData: (previousData) => previousData,
  });
}

export function useAuditLogSummary() {
  const activeOrgId = useActiveOrgId();
  return useQuery({
    queryKey: [...auditLogKeys.all, activeOrgId, "summary"],
    queryFn: () =>
      apiClient
        .get<{
          today_changes: number;
          week_changes: number;
          month_changes: number;
          top_user: string | null;
          action_breakdown: { action: string; count: number }[];
          entity_breakdown: { entity_type: string; label: string; count: number }[];
        }>(`${BASE_PATH}/summary`)
        .then((res) => res.data),
  });
}

export function useDownloadAuditLogPdf() {
  return useMutation({
    mutationFn: async (params: { organizationId: number; entity_type?: string; action?: string; date_from?: string; date_to?: string }) => {
      try {
        const res = await apiClient.get<Blob>(`${BASE_PATH}/print-pdf`, {
          params: { organization_id: params.organizationId, entity_type: params.entity_type, action: params.action, date_from: params.date_from, date_to: params.date_to },
          responseType: "blob",
        });
        return res.data;
      } catch (err) {
        await normalizeBlobError(err);
      }
    },
  });
}
