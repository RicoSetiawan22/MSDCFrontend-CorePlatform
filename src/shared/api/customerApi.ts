import { apiClient } from "@shared/lib/api-client";
import type { PaginatedResponse } from "@shared/types/api";
import type { CustomerSummary } from "@shared/types/customer";

const BASE_PATH = "/v1/crm-sales/customers";

export const customerSearchApi = {
  /** search kosong = 25 customer TERBARU (bukan semua) - cukup untuk
   * kasus "baru buka pemilih, belum ketik apa-apa", tidak perlu tarik
   * seluruh data customer sekaligus. */
  search(query: string) {
    return apiClient.get<PaginatedResponse<CustomerSummary>>(BASE_PATH, { params: { search: query || undefined, per_page: 25 } });
  },
};
