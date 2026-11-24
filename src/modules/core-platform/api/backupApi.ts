import { apiClient } from "@shared/lib/api-client";
import type { SystemBackup } from "../types/backup";

const BASE = "/v1/core-platform/system-backups";

interface BackupApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export const backupApi = {
  list() {
    return apiClient.get<BackupApiResponse<SystemBackup[]>>(BASE);
  },
  create() {
    return apiClient.post<BackupApiResponse<SystemBackup>>(BASE);
  },
  destroy(id: number) {
    return apiClient.delete<BackupApiResponse<null>>(`${BASE}/${id}`);
  },
  /** responseType 'blob' - endpoint butuh Bearer token, <a href="URL polos">
   * tidak bisa bawa header, sama pola dengan unduh PDF (lihat downloadFile.ts). */
  downloadBlob(id: number) {
    return apiClient.get<Blob>(`${BASE}/${id}/download`, { responseType: "blob" });
  },
  /** Operasi DESTRUKTIF - confirmation WAJIB persis sama dengan filename
   * backup yang direstore (dicek ulang di backend, bukan cuma validasi FE). */
  restore(id: number, confirmation: string) {
    return apiClient.post<BackupApiResponse<{ safety_backup: SystemBackup }>>(`${BASE}/${id}/restore`, { confirmation });
  },
};
