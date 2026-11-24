import { apiClient } from "@shared/lib/api-client";
import type { PaginatedResponse, ApiMessageResponse } from "@shared/types/api";
import type { WorkflowInstance, MyApprovalItem } from "../types/workflow";

const BASE = "/v1/core-platform/workflow";

export const workflowApi = {
  // Backend TIDAK mem-paginate endpoint ini (pendingFor() balikin
  // Collection biasa, bukan hasil ->paginate()) - jadi respons berupa
  // array flat, bukan PaginatedResponse. `status` di params INI dipakai
  // backend untuk filter.
  myApprovals(params: { status?: string }) {
    return apiClient.get<ApiMessageResponse<MyApprovalItem[]>>(`${BASE}/my-approvals`, { params });
  },
  instances(params: { page?: number; per_page?: number }) {
    return apiClient.get<PaginatedResponse<WorkflowInstance>>(`${BASE}/instances`, { params });
  },
  instanceShow(id: number) {
    return apiClient.get<{ data: MyApprovalItem }>(`${BASE}/instances/${id}`);
  },
  approve(instanceId: number, notes?: string) {
    return apiClient.post<ApiMessageResponse<unknown>>(`${BASE}/instances/${instanceId}/approve`, { comments: notes });
  },
  reject(instanceId: number, notes: string) {
    return apiClient.post<ApiMessageResponse<unknown>>(`${BASE}/instances/${instanceId}/reject`, { comments: notes });
  },
  reopen(instanceId: number, notes: string) {
    return apiClient.post<ApiMessageResponse<unknown>>(`${BASE}/instances/${instanceId}/reopen`, { notes });
  },
  remind(instanceId: number, data?: { approver_user_id?: number; level_id?: number }) {
    return apiClient.post<{ success: boolean; message: string }>(`${BASE}/instances/${instanceId}/remind`, data);
  },
  /** Detail 1 instance LENGKAP dengan seluruh level approval + status
   * masing-masing (pending/approved/rejected) + siapa approver-nya/siapa
   * saja yang sudah vote (level kuorum) - BEDA dari instanceShow() di atas
   * yang tipenya salah ketik (MyApprovalItem, bentuk flat "My Approvals").
   * Dipakai buat tampilkan breakdown step-by-step (mis. di History PO),
   * BUKAN cuma 1 status tunggal per dokumen. */
  instanceDetail(id: number) {
    return apiClient.get<{ success: boolean; data: WorkflowInstanceDetail }>(`${BASE}/instances/${id}`);
  },
  /** PUBLIC - dipanggil dari halaman verifikasi (/verify-approval) tanpa
   * login, lewat scan QR di 1 kolom tanda tangan PDF PO/PR/FPP (lihat
   * ResolvesApprovalSignatures di ProcurementInventory). */
  verifyApproval(type: "level" | "vote", id: number) {
    return apiClient.get<{ success: boolean; message?: string; data?: WorkflowApprovalVerifyResult }>(
      `${BASE}/verify-approval`,
      { params: { type, id } }
    );
  },
  getDelegations(params?: { mine?: number; per_page?: number }) {
    return apiClient.get<{ success: boolean; data: PaginatedResponse<WorkflowDelegation> }>(`${BASE}/delegations`, { params });
  },
  createDelegation(data: { delegate_user_id: number; start_date: string; end_date: string; reason?: string }) {
    return apiClient.post<{ success: boolean; data: WorkflowDelegation; message: string }>(`${BASE}/delegations`, data);
  },
  revokeDelegation(id: number) {
    return apiClient.post<{ success: boolean; message: string }>(`${BASE}/delegations/${id}/revoke`);
  },
};

export interface WorkflowDelegation {
  id: number;
  delegator_user_id: number;
  delegate_user_id: number;
  level_id: number | null;
  start_date: string;
  end_date: string;
  reason: string | null;
  is_active: boolean;
  delegator?: { id: number; name: string; email: string };
  delegate?: { id: number; name: string; email: string };
  level?: { id: number; name: string };
  created_at: string;
}

/** Bentuk NYATA respons WorkflowInstanceController::show() - 1 baris per
 * level approval (Kepala Posisi/EPM1/EPM2/dst), URUT sesuai sequence
 * (lihat WorkflowInstance::instanceLevels() relation). Key snake_case
 * ('instance_levels') karena Eloquent otomatis konversi nama relation
 * camelCase saat di-serialize ke JSON. */
export interface WorkflowInstanceLevelDetail {
  id: number;
  status: "pending" | "approved" | "rejected" | "skipped";
  acted_at: string | null;
  approver: { id: number; name: string } | null;
  level: {
    id: number;
    name: string;
    min_approval_count: number;
  } | null;
  votes: Array<{ user: { id: number; name: string } | null; decision: string }>;
}

export interface WorkflowInstanceDetail {
  id: number;
  status: string;
  instance_levels: WorkflowInstanceLevelDetail[];
}

export interface WorkflowApprovalVerifyResult {
  reference_number: string | null;
  module_code: string;
  document_type: string;
  level_name: string;
  signer_name: string;
  signer_jabatan: string;
  signed_at: string | null;
}
