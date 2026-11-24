export type DocumentDirection = "masuk" | "keluar" | "internal";
export type DocumentStatus = "draft" | "pending_approval" | "approved" | "rejected" | "archived";

export interface DocumentTypeOption {
  id: number;
  code: string;
  label: string;
  is_active: boolean;
  meta: { direction: DocumentDirection; prefix: string; module?: string; workflow_template_code?: string; default_template_id?: number; requires_approval?: boolean };
}

/** Modul ERP yang bisa "memiliki" 1 jenis surat (document_type.meta.module) -
 * dipakai dropdown "Kelola Jenis Surat" dan label tampilan. Menambah modul
 * baru ke daftar ini TIDAK butuh migration - cuma penanda mana yang sudah
 * dikenal sistem supaya dropdown-nya rapi, bukan free-text rawan typo. */
export const MODULE_LABELS: Record<string, string> = {
  "core-platform": "Core Platform (Corporate Administration)",
  "hr-service-support": "HR & Service Support",
  "procurement-inventory": "Procurement & Inventory",
  "data-center-ops": "Data Center Operations",
  "general-affairs": "General Affairs",
  "legal": "Legal",
  "crm-sales": "CRM & Sales",
  "finance-accounting": "Finance & Accounting",
};

export interface DocumentFileSummary {
  id: number;
  original_name: string;
  is_signed: boolean;
  mime_type: string;
}

export interface DocumentListItem {
  id: number;
  document_number: string;
  document_type: string;
  direction: DocumentDirection;
  title: string;
  module_code: string;
  source_type: string | null;
  source_id: number | null;
  organization_id: number | null;
  organization?: { id: number; name: string } | null;
  issued_to_type: string | null;
  issued_to_ref: string | null;
  issued_to_name: string | null;
  status: DocumentStatus;
  file_id: number | null;
  file?: DocumentFileSummary | null;
  workflow_instance_id: number | null;
  issued_date: string | null;
  effective_date: string | null;
  expiry_date: string | null;
  created_by: number | null;
  created_at: string;
}

export interface DocumentDetail extends DocumentListItem {
  template_id: number | null;
  field_data: Record<string, string> | null;
  body_html: string;
  template?: { id: number; name: string; code: string } | null;
  creator?: { id: number; name: string } | null;
  /** Tanda tangan pembuat ("Dibuat oleh") - WAJIB terisi sebelum surat bisa
   * diajukan approval, lihat DocumentService::submitForApproval(). */
  creator_signed_at: string | null;
  /** Tanda tangan approver ("Mengetahui") - terisi OTOMATIS begitu approval
   * selesai, lihat SyncDocumentApprovalResult. */
  approver_signed_at: string | null;
  approver_user_id: number | null;
  approver?: { id: number; name: string } | null;
}

export interface DocumentRevisionItem {
  id: number;
  document_id: number;
  revision_number: number;
  body_html: string;
  file_id: number | null;
  changed_by: number | null;
  changed_by_relation?: { id: number; name: string } | null;
  change_note: string | null;
  created_at: string;
}

export interface DocumentListParams {
  document_type?: string;
  direction?: DocumentDirection;
  status?: DocumentStatus;
  module_code?: string;
  date_from?: string;
  date_to?: string;
  search?: string;
  page?: number;
  per_page?: number;
}

export interface DocumentCreatePayload {
  module_code?: string;
  document_type: string;
  title: string;
  template_id?: number;
  field_data?: Record<string, string>;
  body_html?: string;
  direction?: DocumentDirection;
  organization_id?: number;
  issued_to_type?: string;
  issued_to_ref?: string;
  issued_to_name?: string;
  issued_date?: string;
  effective_date?: string;
  expiry_date?: string;
  status?: DocumentStatus;
  is_legacy?: boolean;
}

export interface DocumentUpdatePayload {
  title?: string;
  template_id?: number;
  field_data?: Record<string, string>;
  body_html?: string;
  organization_id?: number;
  issued_to_type?: string;
  issued_to_ref?: string;
  issued_to_name?: string;
  issued_date?: string;
  effective_date?: string;
  expiry_date?: string;
  change_note?: string;
}

export const DOCUMENT_STATUS_LABELS: Record<DocumentStatus, string> = {
  draft: "Draft",
  pending_approval: "Menunggu Approval",
  approved: "Disetujui",
  rejected: "Ditolak",
  archived: "Diarsipkan",
};

export const DOCUMENT_STATUS_COLORS: Record<DocumentStatus, { bg: string; color: string }> = {
  draft: { bg: "#f3f4f6", color: "#6b7280" },
  pending_approval: { bg: "#fff7ed", color: "#c2410c" },
  approved: { bg: "#dcfce7", color: "#166534" },
  rejected: { bg: "#fee2e2", color: "#991b1b" },
  archived: { bg: "#eef2ff", color: "#4338ca" },
};
