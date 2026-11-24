import { apiClient } from "@shared/lib/api-client";
import type { PaginatedResponse, ApiMessageResponse } from "@shared/types/api";
import type {
  GaFacility, GaFacilityFormValues, GaFacilityBooking, GaFacilityBookingFormValues,
  GaBuildingAccessPermit, GaBuildingAccessPermitFormValues,
} from "../types/facility";

const BASE = "/v1/hr-service-support/ga";

function resolveOrgId(val?: number): number {
  if (val && val > 0) return val;
  const stored = localStorage.getItem("msdc_active_org_id");
  const parsed = stored ? Number(stored) : 0;
  return parsed > 0 ? parsed : 1;
}

export const facilityApi = {
  list(params?: { status?: string; type?: string }) {
    return apiClient.get<{ success: boolean; data: GaFacility[] }>(`${BASE}/facilities`, { params });
  },
  create(values: GaFacilityFormValues) {
    const orgId = resolveOrgId();
    return apiClient.post<ApiMessageResponse<GaFacility>>(`${BASE}/facilities`, {
      organization_id: orgId,
      ...values,
    });
  },
  update(id: number, values: Partial<GaFacilityFormValues>) {
    return apiClient.put<ApiMessageResponse<GaFacility>>(`${BASE}/facilities/${id}`, values);
  },
  delete(id: number) {
    return apiClient.delete<{ success: boolean; message: string }>(`${BASE}/facilities/${id}`);
  },
  bookings(params?: { status?: string; facility_id?: number; page?: number; per_page?: number }) {
    return apiClient.get<PaginatedResponse<GaFacilityBooking>>(`${BASE}/facility-bookings`, { params });
  },
  createBooking(values: GaFacilityBookingFormValues) {
    const orgId = resolveOrgId(values.organization_id);
    return apiClient.post<ApiMessageResponse<GaFacilityBooking>>(`${BASE}/facility-bookings`, {
      organization_id: orgId,
      ...values,
    });
  },
  accessPermits(params?: { status?: string; page?: number; per_page?: number }) {
    return apiClient.get<PaginatedResponse<GaBuildingAccessPermit>>(`${BASE}/building-access-permits`, { params });
  },
  createAccessPermit(values: GaBuildingAccessPermitFormValues) {
    const orgId = resolveOrgId(values.organization_id);
    return apiClient.post<ApiMessageResponse<GaBuildingAccessPermit>>(`${BASE}/building-access-permits`, {
      organization_id: orgId,
      ...values,
    });
  },
};
