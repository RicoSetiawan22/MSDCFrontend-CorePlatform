import { apiClient } from "@shared/lib/api-client";
import type { AuthUser } from "@shared/lib/auth-context";

const BASE = "/v1/core-platform/auth";

/**
 * Self-service akun sendiri - endpoint ini SENGAJA cuma terima field
 * terbatas (lihat AuthController::updateProfile - hanya "name") supaya
 * user tidak bisa naikkan privilege diri sendiri lewat body request.
 * Untuk ganti email/role/organization harus lewat menu User Management
 * (butuh permission user.update), bukan dari sini.
 */
export const profileApi = {
  updateName(name: string) {
    return apiClient.put<{ success: boolean; data: AuthUser; message: string }>(`${BASE}/profile`, { name });
  },
  changePassword(currentPassword: string, newPassword: string, newPasswordConfirmation: string) {
    return apiClient.put<{ success: boolean; message: string }>(`${BASE}/password/change`, {
      current_password: currentPassword,
      new_password: newPassword,
      new_password_confirmation: newPasswordConfirmation,
    });
  },
};
