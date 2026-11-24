import { apiClient } from "@shared/lib/api-client";
import type { ApiMessageResponse } from "@shared/types/api";
import type { Role, Permission } from "../types/role";

const BASE = "/v1/core-platform";

export const roleApi = {
  list() {
    return apiClient.get<{ data: Role[] }>(`${BASE}/roles`);
  },
  create(values: { name: string; permissions?: string[]; sidebar_sections?: string[] | null }) {
    return apiClient.post<ApiMessageResponse<Role>>(`${BASE}/roles`, values);
  },
  // Backend pakai syncPermissions() - kirim SELURUH daftar permission yang
  // diinginkan role ini, bukan cuma yang baru dicentang. Kirim [] untuk
  // melepas semua permission dari role ini.
  updatePermissions(id: number, permissions: string[]) {
    return apiClient.put<ApiMessageResponse<Role>>(`${BASE}/roles/${id}`, { permissions });
  },
  // Field terpisah dari updatePermissions() - backend cuma sync field yang
  // BENAR-BENAR dikirim di body, jadi panggilan ini TIDAK menyentuh
  // permissions role sama sekali. null = lepas semua batasan (role lihat
  // semua section), array (termasuk []) = cuma section yang disebut.
  updateSidebarSections(id: number, sections: string[] | null) {
    return apiClient.put<ApiMessageResponse<Role>>(`${BASE}/roles/${id}`, { sidebar_sections: sections });
  },
  destroy(id: number) {
    return apiClient.delete<ApiMessageResponse<unknown>>(`${BASE}/roles/${id}`);
  },
  // Backend pakai syncRoles() - kirim SELURUH daftar role yang diinginkan
  // (nama role, bukan id), bukan cuma yang baru ditambah. Kirim [] untuk
  // melepas semua role dari user ini.
  assignToUser(userId: number, roleNames: string[]) {
    return apiClient.post<ApiMessageResponse<unknown>>(`${BASE}/users/${userId}/roles`, { roles: roleNames });
  },
  permissions() {
    return apiClient.get<{ data: Permission[] }>(`${BASE}/permissions`);
  },
};
