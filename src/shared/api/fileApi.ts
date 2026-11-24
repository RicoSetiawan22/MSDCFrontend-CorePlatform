import { apiClient } from "@shared/lib/api-client";
import type { FileRecord, FileFolder, FileStorageConfig, PaginatedResponse } from "@shared/types/file";

const BASE_PATH = "/v1/core-platform/files";

export function createFileUploadIdempotencyKey(): string {
  return globalThis.crypto?.randomUUID?.()
    ?? `upload-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

/** FileController balas {success, data, message} - beda dari
 * ApiMessageResponse<T> ({message, data}) yang dipakai modul lain,
 * sengaja tipe terpisah, BUKAN salah ketik. */
interface FileApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface FileListParams {
  folder_id?: number;
  root_only?: 1;
  module_code?: string;
  type?: "image";
  search?: string;
  status?: string;
  page?: number;
  per_page?: number;
}

export const fileApi = {
  /** moduleCode/referenceType/referenceId OPSIONAL - kosongkan referenceId
   * kalau record induknya (mis. Organization baru) belum tersimpan saat
   * upload terjadi (pola umum: upload dulu berdiri sendiri, baru
   * tautkan file_id-nya ke record induk saat record itu disimpan). */
  upload(file: File, moduleCode?: string, referenceType?: string, referenceId?: number, folderId?: number, idempotencyKey?: string) {
    const formData = new FormData();
    formData.append("file", file);
    if (moduleCode) formData.append("module_code", moduleCode);
    if (referenceType) formData.append("reference_type", referenceType);
    if (referenceId) formData.append("reference_id", String(referenceId));
    if (folderId) formData.append("folder_id", String(folderId));

    return apiClient.post<FileApiResponse<FileRecord>>(`${BASE_PATH}/upload`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
        "Idempotency-Key": idempotencyKey ?? createFileUploadIdempotencyKey(),
      },
    });
  },
  show(fileId: number) {
    return apiClient.get<FileApiResponse<FileRecord>>(`${BASE_PATH}/${fileId}`);
  },
  /** Listing + filter (module_code, folder_id, type=image, search per nama
   * file, dll) - dipakai halaman Manajemen Gambar Core Platform. */
  list(params?: FileListParams) {
    return apiClient.get<FileApiResponse<PaginatedResponse<FileRecord>>>(`${BASE_PATH}`, { params });
  },
  destroy(fileId: number) {
    return apiClient.delete<FileApiResponse<null>>(`${BASE_PATH}/${fileId}`);
  },
  /** responseType 'blob' - dipakai bikin object URL untuk <img src> preview
   * (endpoint ini butuh Bearer token, <img src="URL biasa"> tidak bisa
   * bawa header, sama alasannya dengan unduh PDF - lihat downloadFile.ts). */
  previewBlob(fileId: number) {
    return apiClient.get<Blob>(`${BASE_PATH}/${fileId}/preview`, { responseType: "blob" });
  },
  /** Thumbnail hasil generate GD otomatis saat upload (size_label:
   * small/medium/large) - jauh lebih ringan dari preview full-size, dipakai
   * buat grid galeri gambar. */
  thumbnailBlob(fileId: number, sizeLabel: "small" | "medium" | "large" = "small") {
    return apiClient.get<Blob>(`${BASE_PATH}/${fileId}/thumbnails/${sizeLabel}`, { responseType: "blob" });
  },
  folders: {
    list(params?: { parent_id?: number; root_only?: 1; module_code?: string }) {
      return apiClient.get<FileApiResponse<FileFolder[]>>(`${BASE_PATH}/folders`, { params });
    },
    create(values: { name: string; parent_id?: number | null; module_code?: string | null }) {
      return apiClient.post<FileApiResponse<FileFolder>>(`${BASE_PATH}/folders`, values);
    },
    update(id: number, values: { name?: string; is_active?: boolean }) {
      return apiClient.put<FileApiResponse<FileFolder>>(`${BASE_PATH}/folders/${id}`, values);
    },
    destroy(id: number) {
      return apiClient.delete<FileApiResponse<null>>(`${BASE_PATH}/folders/${id}`);
    },
  },
  storageConfigs: {
    list() {
      return apiClient.get<FileApiResponse<FileStorageConfig[]>>(`${BASE_PATH}/storage-configs`);
    },
    create(values: { disk_name: string; driver: string; config?: Record<string, unknown> | null; is_default?: boolean }) {
      return apiClient.post<FileApiResponse<FileStorageConfig>>(`${BASE_PATH}/storage-configs`, values);
    },
    update(id: number, values: { driver?: string; config?: Record<string, unknown> | null; is_default?: boolean; is_active?: boolean }) {
      return apiClient.put<FileApiResponse<FileStorageConfig>>(`${BASE_PATH}/storage-configs/${id}`, values);
    },
    destroy(id: number) {
      return apiClient.delete<FileApiResponse<null>>(`${BASE_PATH}/storage-configs/${id}`);
    },
  },
};
