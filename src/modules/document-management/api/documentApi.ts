import { apiClient } from "@shared/lib/api-client";
import type { PaginatedResponse, ApiMessageResponse } from "@shared/types/api";
import type {
  DocumentDetail, DocumentListItem, DocumentListParams, DocumentCreatePayload, DocumentUpdatePayload,
  DocumentRevisionItem, DocumentTypeOption,
} from "../types/document";

const BASE = "/v1/core-platform/documents";

export const documentApi = {
  list(params: DocumentListParams) {
    return apiClient.get<PaginatedResponse<DocumentListItem>>(BASE, { params });
  },
  show(id: number) {
    return apiClient.get<{ success: boolean; data: DocumentDetail }>(`${BASE}/${id}`);
  },
  create(values: DocumentCreatePayload) {
    return apiClient.post<ApiMessageResponse<DocumentDetail>>(BASE, values);
  },
  update(id: number, values: DocumentUpdatePayload) {
    return apiClient.put<ApiMessageResponse<DocumentDetail>>(`${BASE}/${id}`, values);
  },
    delete(id: number) {
    return apiClient.delete<ApiMessageResponse<unknown>>(`${BASE}/${id}`);
  },
  submitForApproval(id: number) {
    return apiClient.post<ApiMessageResponse<DocumentDetail>>(`${BASE}/${id}/submit`, {});
  },
  archive(id: number) {
    return apiClient.post<ApiMessageResponse<DocumentDetail>>(`${BASE}/${id}/archive`, {});
  },
  revisions(id: number) {
    return apiClient.get<{ success: boolean; data: DocumentRevisionItem[] }>(`${BASE}/${id}/revisions`);
  },
  attachFile(id: number, file: File) {
    const form = new FormData();
    form.append("file", file);
    return apiClient.post<ApiMessageResponse<DocumentDetail>>(`${BASE}/${id}/attach-file`, form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
  documentTypes() {
    return apiClient.get<{ data: DocumentTypeOption[] }>("/v1/core-platform/lookups/document_type/values");
  },
  downloadFile(fileId: number) {
    return apiClient.get(`/v1/core-platform/files/${fileId}/download`, { responseType: "blob" });
  },
  signFile(fileId: number) {
    return apiClient.post<ApiMessageResponse<unknown>>(`/v1/core-platform/files/${fileId}/signatures`, {
      signature_type: "digital_certificate",
    });
  },
  /** BEDA dari signFile() di atas (generic, file_id apapun) - endpoint ini
   * tahu document_number-nya (buat stempel QR verifikasi) dan regenerate
   * PDF-nya supaya kelihatan sudah ditandatangani waktu di-print. Lihat
   * DocumentService::sign(). */
  sign(id: number) {
    return apiClient.post<ApiMessageResponse<DocumentDetail>>(`${BASE}/${id}/sign`, {});
  },
  /** PUBLIC - dipanggil dari halaman verifikasi (/verify) tanpa perlu
   * login, biasanya lewat scan QR di kertas cetakan surat. */
  verify(documentNumber: string) {
    return apiClient.get<{ success: boolean; message?: string; data?: DocumentVerifyResult }>(
      `${BASE}/verify`,
      { params: { number: documentNumber } }
    );
  },
  incomingGuidePdf() {
    return apiClient.get(`${BASE}/incoming/guide-pdf`, { responseType: "blob" });
  },
};

export interface DocumentVerifyResult {
  document_number: string;
  title: string;
  status: string;
  organization_name: string | null;
  is_signed: boolean;
  signed_by: string | null;
  signed_at: string | null;
}
