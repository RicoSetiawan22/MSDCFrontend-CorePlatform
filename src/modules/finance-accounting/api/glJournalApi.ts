import { apiClient } from "@shared/lib/api-client";
import type { PaginatedResponse, ApiMessageResponse } from "@shared/types/api";
import type {
  GlJournalRow, GlJournalDetail, GlJournalFormValues, GlJournalListParams,
  AccountLedger, TrialBalance,
} from "../types/glJournal";

const BASE_PATH = "/v1/finance-accounting/gl";

export const glJournalApi = {
  list(params: GlJournalListParams) {
    return apiClient.get<PaginatedResponse<GlJournalRow>>(`${BASE_PATH}/journals`, { params });
  },
  show(journalNumber: string) {
    return apiClient.get<{ data: GlJournalDetail }>(`${BASE_PATH}/journals/${journalNumber}`);
  },
  create(values: GlJournalFormValues) {
    return apiClient.post<ApiMessageResponse<{ journal_number: string; status: string }>>(`${BASE_PATH}/journals`, values);
  },
  post(journalNumber: string) {
    return apiClient.post<ApiMessageResponse<unknown>>(`${BASE_PATH}/journals/${journalNumber}/post`);
  },
  reverse(journalNumber: string, reason?: string) {
    return apiClient.post<ApiMessageResponse<{ reversal_journal_number: string }>>(`${BASE_PATH}/journals/${journalNumber}/reverse`, { reason });
  },
  accountLedger(accountId: number, dateFrom?: string, dateTo?: string) {
    return apiClient.get<{ data: AccountLedger }>(`${BASE_PATH}/accounts/${accountId}/ledger`, { params: { date_from: dateFrom, date_to: dateTo } });
  },
  trialBalance(asOfDate?: string, dateFrom?: string, dateTo?: string) {
    return apiClient.get<{ data: TrialBalance }>(`${BASE_PATH}/trial-balance`, {
      params: { as_of_date: asOfDate, date_from: dateFrom, date_to: dateTo },
    });
  },
  /** responseType 'blob' WAJIB - respons ini file PDF biner, bukan JSON.
   * Lewat apiClient (bukan window.open/<a href> langsung) supaya header
   * Authorization Bearer TETAP terkirim - auth di app ini bukan cookie,
   * link/tab baru polos TIDAK akan bawa token. */
  generalJournalPdf(dateFrom: string, dateTo: string, organizationId: number, status?: string) {
    return apiClient.get<Blob>(`${BASE_PATH}/journals/print-pdf`, {
      params: { date_from: dateFrom, date_to: dateTo, organization_id: organizationId, status },
      responseType: "blob",
    });
  },

  trialBalancePdf(params: { asOfDate?: string; dateFrom?: string; dateTo?: string; organizationId: number }) {
    return apiClient.get<Blob>(`${BASE_PATH}/trial-balance/print-pdf`, {
      params: {
        organization_id: params.organizationId,
        as_of_date: params.asOfDate,
        date_from: params.dateFrom,
        date_to: params.dateTo,
      },
      responseType: "blob",
    });
  },

  /** Summary stats for ALL journals (not paginated) — for KPI display */
  journalSummary(dateFrom: string, dateTo: string) {
    return apiClient.get(`${BASE_PATH}/journals/summary`, {
      params: { date_from: dateFrom, date_to: dateTo },
    });
  },
};
