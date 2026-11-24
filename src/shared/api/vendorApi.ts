import { apiClient } from "@shared/lib/api-client";
import type { PaginatedResponse } from "@shared/types/api";
import type { VendorSummary } from "@shared/types/vendor";

const BASE_PATH = "/v1/procurement-inventory/vendors";

export const vendorSearchApi = {
  search(query: string) {
    return apiClient.get<PaginatedResponse<VendorSummary>>(BASE_PATH, { params: { search: query || undefined, per_page: 25 } });
  },
};
