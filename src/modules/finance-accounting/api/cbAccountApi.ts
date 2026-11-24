import { apiClient } from "@shared/lib/api-client";
import type { ApiMessageResponse } from "@shared/types/api";
import type { CbAccount, CbAccountFormValues, CbAccountListParams } from "../types/cbAccount";
import type { CbAccountMutations, CbPendingReconciliationLine, CbReconcileResult } from "../types/cbReconciliation";
import type { CashFlowReport } from "../types/cashFlow";

const BASE_PATH = "/v1/finance-accounting/cb";

export const cbAccountApi = {
  list(params: CbAccountListParams) {
    return apiClient.get<{ data: CbAccount[] }>(`${BASE_PATH}/accounts`, { params });
  },
  create(values: CbAccountFormValues) {
    return apiClient.post<ApiMessageResponse<CbAccount>>(`${BASE_PATH}/accounts`, values);
  },
  mutations(accountId: number, dateFrom?: string, dateTo?: string) {
    return apiClient.get<{ data: CbAccountMutations }>(`${BASE_PATH}/accounts/${accountId}/mutations`, { params: { date_from: dateFrom, date_to: dateTo } });
  },
  pendingReconciliation(accountId: number, asOfDate?: string) {
    return apiClient.get<{ data: CbPendingReconciliationLine[] }>(`${BASE_PATH}/accounts/${accountId}/pending-reconciliation`, { params: { as_of_date: asOfDate } });
  },
  reconcile(accountId: number, statementDate: string, glJournalIds: number[], statementEndingBalance?: number) {
    return apiClient.post<ApiMessageResponse<CbReconcileResult>>(`${BASE_PATH}/accounts/${accountId}/reconcile`, {
      statement_date: statementDate,
      gl_journal_ids: glJournalIds,
      statement_ending_balance: statementEndingBalance,
    });
  },
  cashFlow(dateFrom?: string, dateTo?: string, accountId?: number) {
    return apiClient.get<{ data: CashFlowReport }>(`${BASE_PATH}/cash-flow`, { params: { date_from: dateFrom, date_to: dateTo, account_id: accountId } });
  },
  printPdf(organizationId: number) {
    return apiClient.get<Blob>(`${BASE_PATH}/accounts/print-pdf`, { params: { organization_id: organizationId }, responseType: "blob" });
  },
  printCashBookPdf(organizationId: number, params: { accountId: number; date_from?: string; date_to?: string }) {
    return apiClient.get<Blob>(`${BASE_PATH}/accounts/cash-book/print-pdf`, { params: { organization_id: organizationId, account_id: params.accountId, date_from: params.date_from, date_to: params.date_to }, responseType: "blob" });
  },
  printCashFlowPdf(organizationId: number, params: { date_from?: string; date_to?: string }) {
    return apiClient.get<Blob>(`${BASE_PATH}/cash-flow/print-pdf`, { params: { organization_id: organizationId, date_from: params.date_from, date_to: params.date_to }, responseType: "blob" });
  },
};
