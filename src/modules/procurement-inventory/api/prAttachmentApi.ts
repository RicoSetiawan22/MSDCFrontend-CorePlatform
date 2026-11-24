import { apiClient } from "@shared/lib/api-client";

const BASE = "/v1/procurement-inventory";

export interface PrAttachment {
  id: number;
  purchase_request_id: number;
  uploaded_by: number | null;
  file_name: string;
  original_name: string;
  mime_type: string;
  file_size: number;
  category: string;
  description: string | null;
  url: string;
  is_pdf: boolean;
  is_image: boolean;
  created_at: string;
  uploader?: { id: number; name: string };
}

export const prAttachmentApi = {
  list(prId: number) {
    return apiClient.get<{ data: PrAttachment[] }>(`${BASE}/purchase-requests/${prId}/attachments`);
  },
  upload(prId: number, formData: FormData) {
    return apiClient.post(`${BASE}/purchase-requests/${prId}/attachments`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
  delete(attachmentId: number) {
    return apiClient.delete(`${BASE}/pr-attachments/${attachmentId}`);
  },
  downloadUrl(attachmentId: number) {
    return `${BASE}/pr-attachments/${attachmentId}/download`;
  },
};

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
