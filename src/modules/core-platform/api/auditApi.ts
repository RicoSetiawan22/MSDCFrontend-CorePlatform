import { apiClient } from "@shared/lib/api-client";
import type { PaginatedResponse } from "@shared/types/api";
import type { AuditLoginEntry, AuditDataChangeEntry, AuditPermissionEntry, AuditNotificationEntry, AuditListParams, AuditNotificationListParams } from "../types/audit";

const BASE = "/v1/core-platform/audit";

/** Backend bungkus paginator di dalam {success,data:...} (lihat
 * AuditLoginController/AuditDataChangeController::index) - res.data ITU
 * SENDIRI bukan paginatornya, tapi {success,data:paginator}. Lihat
 * catatan lengkap di PaginatedResponse (shared/types/api.ts). */
export const auditApi = {
  logins(params: AuditListParams) {
    return apiClient.get<{ success?: boolean; data: PaginatedResponse<AuditLoginEntry> }>(`${BASE}/logins`, { params });
  },
  dataChanges(params: AuditListParams) {
    return apiClient.get<{ success?: boolean; data: PaginatedResponse<AuditDataChangeEntry> }>(`${BASE}/data-changes`, { params });
  },
  dataChangeShow(id: number) {
    return apiClient.get<{ data: AuditDataChangeEntry }>(`${BASE}/data-changes/${id}`);
  },
  permissions(params: AuditListParams) {
    return apiClient.get<{ success?: boolean; data: PaginatedResponse<AuditPermissionEntry> }>(`${BASE}/permissions`, { params });
  },
  /** "Terkirim ke mana" - audit trail semua notifikasi (email/WA/in-app/dst)
   * yang pernah dikirim sistem, lihat AuditNotificationController.php. */
  notifications(params: AuditNotificationListParams) {
    return apiClient.get<{ success?: boolean; data: PaginatedResponse<AuditNotificationEntry> }>(`${BASE}/notifications`, { params });
  },
};
