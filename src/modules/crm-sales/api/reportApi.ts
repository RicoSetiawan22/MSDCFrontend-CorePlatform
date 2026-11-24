import { apiClient } from "@shared/lib/api-client";
import type {
  CrmKpis, WinLossReport, SalesPerformanceReport, QuotationSummaryReport,
  ExpiredQuotationsReport, ContractAgingReport, CustomerRevenueReport, CrmReportFilters,
} from "../types/report";

const BASE = "/v1/crm-sales";

export const reportApi = {
  saveSalesTarget(values: { sales_id: number; period_start: string; period_end: string; target_won_count: number; target_amount: number }) {
    return apiClient.post(`${BASE}/reports/sales-target`, values);
  },
  kpis(filters: CrmReportFilters) {
    return apiClient.get(`${BASE}/reports/kpis`, { params: filters }) as ReturnType<typeof apiClient.get<{ data: CrmKpis }>>;
  },
  winLoss(filters: CrmReportFilters) {
    return apiClient.get(`${BASE}/reports/win-loss`, { params: filters }) as ReturnType<typeof apiClient.get<{ data: WinLossReport }>>;
  },
  salesPerformance(filters: CrmReportFilters) {
    return apiClient.get(`${BASE}/reports/sales-performance`, { params: filters }) as ReturnType<typeof apiClient.get<{ data: SalesPerformanceReport }>>;
  },
  quotationSummary(filters: CrmReportFilters) {
    return apiClient.get(`${BASE}/reports/quotation-summary`, { params: filters }) as ReturnType<typeof apiClient.get<{ data: QuotationSummaryReport }>>;
  },
  expiredQuotations(filters: CrmReportFilters) {
    return apiClient.get(`${BASE}/reports/expired-quotations`, { params: filters }) as ReturnType<typeof apiClient.get<{ data: ExpiredQuotationsReport }>>;
  },
  contractAging(filters: CrmReportFilters) {
    return apiClient.get(`${BASE}/reports/contract-aging`, { params: filters }) as ReturnType<typeof apiClient.get<{ data: ContractAgingReport }>>;
  },
  customerRevenue(filters: CrmReportFilters) {
    return apiClient.get(`${BASE}/reports/customer-revenue`, { params: filters }) as ReturnType<typeof apiClient.get<{ data: CustomerRevenueReport }>>;
  },
};
