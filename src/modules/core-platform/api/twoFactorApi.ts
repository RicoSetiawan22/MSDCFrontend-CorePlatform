import { apiClient } from "@shared/lib/api-client";

const BASE = "/v1/core-platform/2fa";

export interface TwoFactorSetupData {
  secret: string;
  /** otpauth:// URI mentah - dipakai backend untuk render QR, jangan dipakai langsung sebagai <img src>. */
  qr_code_url: string;
  /** QR siap pakai (data:image/png;base64,...), dirender server lewat QrCodeService terpusat. Null kalau endroid/qr-code belum terpasang di server. */
  qr_code_data_uri: string | null;
}

export const twoFactorApi = {
  status() {
    return apiClient.get<{ data: { enabled: boolean } }>(`${BASE}/status`);
  },
  setup() {
    return apiClient.post<{ message: string; data: TwoFactorSetupData }>(`${BASE}/setup`);
  },
  confirm(code: string) {
    return apiClient.post<{ message: string; data: { recovery_codes: string[] } }>(`${BASE}/confirm`, { code });
  },
  disable() {
    return apiClient.post<{ message: string }>(`${BASE}/disable`);
  },
};
