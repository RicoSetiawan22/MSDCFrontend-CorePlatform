import { apiClient } from "@shared/lib/api-client";

const BASE = "/v1/core-platform/system-settings";

export interface TwoFactorPolicyData {
  required_roles: string[];
  available_roles: string[];
}

export const systemSettingApi = {
  twoFactorPolicy() {
    return apiClient.get<{ success: boolean; data: TwoFactorPolicyData }>(`${BASE}/two-factor-policy`);
  },
  updateTwoFactorPolicy(requiredRoles: string[]) {
    return apiClient.put<{ success: boolean; message: string; data: { required_roles: string[] } }>(
      `${BASE}/two-factor-policy`,
      { required_roles: requiredRoles }
    );
  },
};
