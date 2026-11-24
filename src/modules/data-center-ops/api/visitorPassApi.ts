import { apiClient } from "@shared/lib/api-client";
import type { PaginatedResponse, ApiMessageResponse } from "@shared/types/api";
import type {
  VisitorPass,
  VisitorPassListParams,
  EligibleCustomer,
  CreateVisitorPassPayload,
  InviteVisitorPayload,
  SelfRegisterPayload,
  VisitorInvitationDetails,
  ScanVerifyPayload,
  ScanVerifyResult,
  PublicVisitorPassResponse,
} from "../types/visitorPass";

const BASE = "/v1/data-center-ops/visitor-passes";
const PUBLIC_BASE = "/v1/public/visitor-pass";
const PUBLIC_INVITATION_BASE = "/v1/public/visitor-invitation";

export const visitorPassApi = {
  /**
   * Mengambil daftar visitor pass dengan filter tab, status, tanggal, dan search
   */
  list(params?: VisitorPassListParams) {
    return apiClient.get<PaginatedResponse<VisitorPass>>(BASE, { params });
  },

  /**
   * Mengambil detail lengkap tiket visitor pass beserta log aktivitasnya
   */
  show(id: number) {
    return apiClient.get<{ data: VisitorPass }>(`${BASE}/${id}`);
  },

  /**
   * Mengambil daftar customer CRM yang memiliki kontrak aktif beserta alokasi rak/site
   */
  getEligibleCustomers() {
    return apiClient.get<{ data: EligibleCustomer[] }>(`${BASE}/eligible-customers`);
  },

  /**
   * Mengambil daftar pengunjung yang saat ini berstatus 'active_in_facility'
   */
  getActiveInFacility() {
    return apiClient.get<{ data: VisitorPass[] }>(`${BASE}/active-in-facility`);
  },

  /**
   * Mendaftarkan tiket pengunjung baru (trigger pengiriman email pass link)
   */
  create(payload: CreateVisitorPassPayload) {
    return apiClient.post<ApiMessageResponse<VisitorPass>>(BASE, payload);
  },

  /**
   * Endpoint verifikasi scanner pos jaga (Check-In otomatis & anti-replay validation)
   */
  scanVerify(payload: ScanVerifyPayload) {
    return apiClient.post<ScanVerifyResult>(`${BASE}/scan-verify`, payload);
  },

  /**
   * Check-Out pengunjung dari fasilitas data center
   */
  checkOut(id: number, notes?: string, exitGate?: string) {
    return apiClient.post<ApiMessageResponse<VisitorPass>>(`${BASE}/${id}/check-out`, {
      notes,
      exit_gate: exitGate,
    });
  },

  /**
   * Membatalkan izin kunjungan yang belum terpakai
   */
  cancel(id: number, reason?: string) {
    return apiClient.post<ApiMessageResponse<VisitorPass>>(`${BASE}/${id}/cancel`, {
      reason,
    });
  },

  /**
   * Menyetujui pendaftaran izin kunjungan tamu (operator approval)
   */
  approveVisitorPass(id: number, notes?: string) {
    return apiClient.post<ApiMessageResponse<VisitorPass>>(`${BASE}/${id}/approve`, { notes });
  },

  /**
   * Mengirim undangan akses ke PIC customer atau vendor untuk registrasi mandiri
   */
  invite(payload: InviteVisitorPayload) {
    return apiClient.post<ApiMessageResponse<VisitorPass>>(`${BASE}/invite`, payload);
  },

  /**
   * Endpoint publik (No-Auth) untuk mengambil detail undangan kunjungan sebelum tamu registrasi
   */
  getInvitation(token: string) {
    return apiClient.get<{ data: VisitorInvitationDetails }>(`${PUBLIC_INVITATION_BASE}/${token}`);
  },

  /**
   * Endpoint publik (No-Auth) bagi tamu untuk submit formulir registrasi mandiri
   */
  submitRegistration(token: string, payload: SelfRegisterPayload) {
    return apiClient.post<ApiMessageResponse<{ pass: VisitorPass; public_url_token: string }>>(
      `${PUBLIC_INVITATION_BASE}/${token}/register`,
      payload
    );
  },

  /**
   * Endpoint publik (No-Auth) untuk melihat badge e-pass di smartphone tamu
   */
  getPublicPass(publicUrlToken: string) {
    return apiClient.get<PublicVisitorPassResponse>(`${PUBLIC_BASE}/${publicUrlToken}`);
  },
};
