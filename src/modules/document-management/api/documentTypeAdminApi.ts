import { apiClient } from "@shared/lib/api-client";
import type { DocumentTypeOption } from "../types/document";

/** "Kelola Jenis Surat" - TIDAK ada endpoint backend baru, murni pakai
 * Global Lookup Service yang SUDAH ADA (Modules\CorePlatform\Http\
 * Controllers\Api\V1\LookupController) - document_type cuma SATU dari
 * sekian LookupType yang dipakai lintas modul, jadi cukup upsert
 * LookupValue biasa. Lihat plan Phase 4 Sistem Surat. */

interface LookupTypeRow {
  id: number;
  code: string;
  name: string;
}

export const documentTypeAdminApi = {
  /** Cari id LookupType 'document_type' - dibutuhkan buat POST
   * lookups/{id}/values (route model binding by id, bukan code). */
  async findDocumentTypeLookupTypeId(): Promise<number> {
    const res = await apiClient.get<{ data: LookupTypeRow[] }>("/v1/core-platform/lookups");
    const found = res.data.data.find(t => t.code === "document_type");
    if (!found) throw new Error("LookupType 'document_type' belum ada - jalankan DocumentTypeLookupSeeder di backend.");
    return found.id;
  },
  list() {
    return apiClient.get<{ data: DocumentTypeOption[] }>("/v1/core-platform/lookups/document_type/values", {
      params: { include_inactive: 1 },
    });
  },
  /** Upsert by code - kirim code yang SUDAH ADA untuk edit, code baru untuk
   * jenis surat baru. Lihat LookupService::setValue(). */
  save(lookupTypeId: number, values: {
    code: string; label: string; sort_order?: number; is_active?: boolean;
    meta: { direction: string; prefix: string; module: string; workflow_template_code?: string };
  }) {
    return apiClient.post<{ data: DocumentTypeOption; message: string }>(
      `/v1/core-platform/lookups/${lookupTypeId}/values`, values
    );
  },
};
