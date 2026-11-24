import { useQuery } from "@tanstack/react-query";
import { reportApi } from "./reportApi";
import type { CrmReportFilters } from "../types/report";

const staleTime = 60_000;

export function useCrmKpis(filters: CrmReportFilters) {
  return useQuery({ queryKey: ["crmReports", "kpis", filters], queryFn: () => reportApi.kpis(filters).then((r) => r.data.data), staleTime });
}

export function useWinLossReport(enabled: boolean, filters: CrmReportFilters) {
  return useQuery({ queryKey: ["crmReports", "winLoss", filters], queryFn: () => reportApi.winLoss(filters).then((r) => r.data.data), staleTime, enabled });
}

export function useSalesPerformanceReport(enabled: boolean, filters: CrmReportFilters) {
  return useQuery({ queryKey: ["crmReports", "salesPerformance", filters], queryFn: () => reportApi.salesPerformance(filters).then((r) => r.data.data), staleTime, enabled });
}

export function useQuotationSummaryReport(enabled: boolean, filters: CrmReportFilters) {
  return useQuery({ queryKey: ["crmReports", "quotationSummary", filters], queryFn: () => reportApi.quotationSummary(filters).then((r) => r.data.data), staleTime, enabled });
}

export function useExpiredQuotationsReport(enabled: boolean, filters: CrmReportFilters) {
  return useQuery({ queryKey: ["crmReports", "expiredQuotations", filters], queryFn: () => reportApi.expiredQuotations(filters).then((r) => r.data.data), staleTime, enabled });
}

export function useContractAgingReport(enabled: boolean, filters: CrmReportFilters) {
  return useQuery({ queryKey: ["crmReports", "contractAging", filters], queryFn: () => reportApi.contractAging(filters).then((r) => r.data.data), staleTime, enabled });
}

export function useCustomerRevenueReport(enabled: boolean, filters: CrmReportFilters) {
  return useQuery({ queryKey: ["crmReports", "customerRevenue", filters], queryFn: () => reportApi.customerRevenue(filters).then((r) => r.data.data), staleTime, enabled });
}
