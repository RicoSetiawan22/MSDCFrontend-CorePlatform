import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { normalizeBlobError } from "@shared/lib/downloadFile";
import { permissionApi } from "./permissionApi";
import type { PermissionRequestListParams, PermissionRequestType } from "../types/permission";

const permissionKeys = {
  all: ["hrPermissionRequests"] as const,
  list: (p?: PermissionRequestListParams) => [...permissionKeys.all, "list", p ?? {}] as const,
  report: (from: string, to: string) => [...permissionKeys.all, "report", from, to] as const,
};

export function usePermissionRequests(params?: PermissionRequestListParams) {
  return useQuery({
    queryKey: permissionKeys.list(params),
    queryFn: () => permissionApi.list(params).then((r) => r.data.data),
    placeholderData: (prev) => prev,
  });
}

export function useSubmitPermissionRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: permissionApi.submit,
    onSuccess: () => qc.invalidateQueries({ queryKey: permissionKeys.all }),
  });
}

// TIDAK ADA useApprovePermissionRequest/useRejectPermissionRequest lagi -
// approval Ijin sekarang lewat Workflow Engine Core Platform ("My
// Approvals" Kepala Posisi terkait), lihat PermissionRequestController::
// store(). Approve/reject dari My Approvals sudah otomatis invalidate data
// terkait lewat SyncPermissionRequestApprovalResult di backend.

export function useCancelPermissionRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => permissionApi.cancel(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: permissionKeys.all }),
  });
}

export function usePermissionRequestReport(dateFrom: string, dateTo: string, enabled = true) {
  return useQuery({
    queryKey: permissionKeys.report(dateFrom, dateTo),
    queryFn: () => permissionApi.report(dateFrom, dateTo).then((r) => r.data.data),
    enabled: enabled && !!dateFrom && !!dateTo,
  });
}

export function useDownloadPermissionRequestsPdf() {
  return useMutation({
    mutationFn: async ({ organizationId, params }: { organizationId: number; params?: { date_from?: string; date_to?: string; type?: PermissionRequestType; status?: string; employee_id?: number } }) => {
      try {
        const res = await permissionApi.printPdf(organizationId, params);
        return res.data;
      } catch (err) {
        await normalizeBlobError(err);
      }
    },
  });
}
