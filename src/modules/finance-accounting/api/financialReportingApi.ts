import { apiClient } from "@shared/lib/api-client";
import type { BalanceSheet } from "../types/balanceSheet";
import type { ProfitLoss, ProfitLossParams } from "../types/profitLoss";

// CATATAN: modul ini SENGAJA cuma isi balanceSheet() & profitAndLoss() -
// 8 endpoint lain di FinancialReportingController (trialBalance, gl,
// cashFlow, agingAr/Ap, budgetVsActual, costCenterReport,
// profitCenterReport) CUMA memanggil ulang service yang SAMA dengan yang
// sudah dipakai halaman masing-masing modul (TrialBalancePage,
// AccountLedgerPage, CbCashFlowPage, dst) - datanya IDENTIK, jadi tidak
// perlu endpoint/hook terpisah di sini, cukup link ke halaman yang sudah
// ada (lihat FinancialReportsHubPage.tsx).
const BASE_PATH = "/v1/finance-accounting/financial-reports";

export const financialReportingApi = {
  balanceSheet(asOfDate: string) {
    return apiClient.get<{ data: BalanceSheet }>(`${BASE_PATH}/balance-sheet`, { params: { as_of_date: asOfDate } });
  },
  profitAndLoss(params: ProfitLossParams) {
    return apiClient.get<{ data: ProfitLoss }>(`${BASE_PATH}/profit-loss`, { params });
  },

  balanceSheetPdf(asOfDate: string, organizationId: number) {
    return apiClient.get<Blob>(`${BASE_PATH}/balance-sheet/print-pdf`, {
      params: { as_of_date: asOfDate, organization_id: organizationId },
      responseType: "blob",
    });
  },

  profitAndLossPdf(params: { date_from: string; date_to: string; organizationId: number; cost_center_id?: number; profit_center_id?: number }) {
    return apiClient.get<Blob>(`${BASE_PATH}/profit-loss/print-pdf`, {
      params: { date_from: params.date_from, date_to: params.date_to, organization_id: params.organizationId, cost_center_id: params.cost_center_id, profit_center_id: params.profit_center_id },
      responseType: "blob",
    });
  },
};
