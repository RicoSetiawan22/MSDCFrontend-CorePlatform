import { apiClient } from "@shared/lib/api-client";
import type { PaginatedResponse, ApiMessageResponse } from "@shared/types/api";
import type { Branch, BusinessUnit, Department } from "../types/organization";

const BASE = "/v1/core-platform";

/**
 * companyApi (GET /companies dkk) SUDAH DIHAPUS - endpoint-nya tidak
 * pernah benar-benar terdaftar di backend (404 dari awal), dan
 * modelnya (cp_md_company) duplikat konsep dari Organization yang
 * dipakai menu "Organization". Lihat catatan di OrganizationStructurePage.tsx.
 */
export const orgStructureApi = {
  // Backend bungkus paginator di dalam {success,data:...} - res.data ITU
  // SENDIRI bukan paginatornya, tapi {success,data:paginator}. Lihat
  // catatan lengkap di PaginatedResponse (shared/types/api.ts).
  branches() {
    return apiClient.get<{ success?: boolean; data: PaginatedResponse<Branch> }>(`${BASE}/branches`);
  },
  businessUnits() {
    return apiClient.get<{ success?: boolean; data: PaginatedResponse<BusinessUnit> }>(`${BASE}/business-units`);
  },
  createBranch(values: { organization_id: number; code: string; name: string; address?: string; phone?: string }) {
    return apiClient.post<ApiMessageResponse<Branch>>(`${BASE}/branches`, values);
  },
  updateBranch(id: number, values: { code?: string; name?: string; address?: string; phone?: string; is_active?: boolean }) {
    return apiClient.put<ApiMessageResponse<Branch>>(`${BASE}/branches/${id}`, values);
  },
  deleteBranch(id: number) {
    return apiClient.delete<ApiMessageResponse<unknown>>(`${BASE}/branches/${id}`);
  },
  createBusinessUnit(values: { organization_id: number; code: string; name: string }) {
    return apiClient.post<ApiMessageResponse<BusinessUnit>>(`${BASE}/business-units`, values);
  },
  updateBusinessUnit(id: number, values: { code?: string; name?: string; is_active?: boolean }) {
    return apiClient.put<ApiMessageResponse<BusinessUnit>>(`${BASE}/business-units/${id}`, values);
  },
  deleteBusinessUnit(id: number) {
    return apiClient.delete<ApiMessageResponse<unknown>>(`${BASE}/business-units/${id}`);
  },
  departments(params?: { per_page?: number }) {
    return apiClient.get<{ success?: boolean; data: PaginatedResponse<Department> }>(`${BASE}/departments`, { params });
  },
  createDepartment(values: {
    organization_id: number;
    code: string;
    name: string;
    business_unit_id?: number;
    parent_id?: number;
  }) {
    return apiClient.post<ApiMessageResponse<Department>>(`${BASE}/departments`, values);
  },
  updateDepartment(id: number, values: {
    code?: string; name?: string; business_unit_id?: number;
    parent_id?: number; is_active?: boolean;
  }) {
    return apiClient.put<ApiMessageResponse<Department>>(`${BASE}/departments/${id}`, values);
  },
  deleteDepartment(id: number) {
    return apiClient.delete<ApiMessageResponse<unknown>>(`${BASE}/departments/${id}`);
  },
  tree(params?: { organization_id?: number }) {
    return apiClient.get<{ success?: boolean; data: any[] }>(`${BASE}/organization-structure/tree`, { params });
  },
};
