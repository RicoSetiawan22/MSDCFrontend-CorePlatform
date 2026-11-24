import { apiClient } from "@shared/lib/api-client";
import type { PaginatedResponse, ApiMessageResponse } from "@shared/types/api";
import type { User, UserFormValues, UserListParams } from "../types/user";

const BASE = "/v1/core-platform";

export const userApi = {
  list(params: UserListParams) {
    return apiClient.get<PaginatedResponse<User>>(`${BASE}/users`, { params });
  },
  show(id: number) {
    return apiClient.get<{ data: User }>(`${BASE}/users/${id}`);
  },
  create(values: UserFormValues) {
    return apiClient.post<ApiMessageResponse<User>>(`${BASE}/users`, values);
  },
  update(id: number, values: Partial<UserFormValues>) {
    return apiClient.put<ApiMessageResponse<User>>(`${BASE}/users/${id}`, values);
  },
  /** User TIDAK di-hard-delete (lihat UserController::destroy()) - endpoint
   * DELETE ini sekarang menonaktifkan (is_active=false), bisa diaktifkan
   * lagi lewat update() biasa. */
  setActive(id: number, isActive: boolean) {
    if (!isActive) {
      return apiClient.delete<ApiMessageResponse<unknown>>(`${BASE}/users/${id}`);
    }
    return apiClient.put<ApiMessageResponse<User>>(`${BASE}/users/${id}`, { is_active: true });
  },
  // cp_user_organization - organization yang BISA DIPILIH user ini di
  // layar login (lihat AuthController::login()/selectOrganization()).
  // MENGGANTI seluruh daftar lama, sama pola dengan roleApi.assignToUser.
  syncOrganizations(userId: number, organizationIds: number[]) {
    return apiClient.post<ApiMessageResponse<User>>(`${BASE}/users/${userId}/organizations`, { organization_ids: organizationIds });
  },
};
