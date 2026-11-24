import { useQuery } from "@tanstack/react-query";
import { auditApi } from "./auditApi";
import type { AuditListParams, AuditNotificationListParams } from "../types/audit";

// Backend bungkus paginator di dalam {success,data:...} - res.data SAJA
// masih {success,data:paginator}, perlu .data SEKALI LAGI supaya
// AuditPage.tsx yang baca data.data (array) dan data.total langsung dari
// level teratas benar-benar dapat paginatornya.
export function useAuditLogins(params: AuditListParams) {
  return useQuery({
    queryKey: ["auditLogins", params] as const,
    queryFn: () => auditApi.logins(params).then(r => r.data.data),
    placeholderData: (p) => p,
  });
}

export function useAuditDataChanges(params: AuditListParams) {
  return useQuery({
    queryKey: ["auditDataChanges", params] as const,
    queryFn: () => auditApi.dataChanges(params).then(r => r.data.data),
    placeholderData: (p) => p,
  });
}

export function useAuditPermissions(params: AuditListParams) {
  return useQuery({
    queryKey: ["auditPermissions", params] as const,
    queryFn: () => auditApi.permissions(params).then(r => r.data.data),
    placeholderData: (p) => p,
  });
}

export function useAuditNotifications(params: AuditNotificationListParams) {
  return useQuery({
    queryKey: ["auditNotifications", params] as const,
    queryFn: () => auditApi.notifications(params).then(r => r.data.data),
    placeholderData: (p) => p,
  });
}
