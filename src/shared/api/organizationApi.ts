import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@shared/lib/api-client";
import type { PaginatedResponse, ApiMessageResponse } from "@shared/types/api";
import type { Organization, OrganizationFormValues, OrganizationListParams } from "@shared/types/organization";

const BASE_PATH = "/v1/core-platform/organizations";

export const organizationApi = {
  list(params: OrganizationListParams) {
    // Backend bungkus paginator di dalam {success,data:...} - res.data
    // ITU SENDIRI bukan paginatornya, tapi {success,data:paginator}. Lihat
    // catatan lengkap di PaginatedResponse (shared/types/api.ts).
    return apiClient.get<{ success?: boolean; data: PaginatedResponse<Organization> }>(BASE_PATH, { params });
  },
  create(values: OrganizationFormValues) {
    return apiClient.post<ApiMessageResponse<Organization>>(BASE_PATH, values);
  },
  update(id: number, values: Partial<OrganizationFormValues>) {
    return apiClient.put<ApiMessageResponse<Organization>>(`${BASE_PATH}/${id}`, values);
  },
  destroy(id: number) {
    return apiClient.delete<ApiMessageResponse<null>>(`${BASE_PATH}/${id}`);
  },
};

/** Dipakai modul manapun yang butuh pilih CABANG SENDIRI (mis. untuk kop
 * surat laporan PDF) - selalu type=internal, tidak pernah tampilkan
 * customer/vendor di pemilih semacam ini. */
export function useInternalOrganizations() {
  return useQuery({
    queryKey: ["organizations", "internal"],
    // res.data = {success,data:paginator}, res.data.data = paginator,
    // res.data.data.data = array asli (lihat catatan di list() di atas).
    queryFn: () => organizationApi.list({ type: "internal", per_page: 100 }).then((res) => res.data.data.data),
  });
}
