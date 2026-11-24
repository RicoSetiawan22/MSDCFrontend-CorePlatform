import { useQuery } from "@tanstack/react-query";
import { financialReportingApi } from "./financialReportingApi";
import type { ProfitLossParams } from "../types/profitLoss";
import { useActiveOrgId } from "@shared/lib/organization-context";

export function useBalanceSheet(asOfDate: string | undefined) {
  const activeOrgId = useActiveOrgId();
  return useQuery({
    queryKey: ["balance-sheet", activeOrgId, asOfDate],
    queryFn: () => financialReportingApi.balanceSheet(asOfDate!).then((res) => res.data.data),
    enabled: !!asOfDate,
  });
}

export function useProfitAndLoss(params: ProfitLossParams | undefined) {
  const activeOrgId = useActiveOrgId();
  return useQuery({
    queryKey: ["profit-loss", activeOrgId, params],
    queryFn: () => financialReportingApi.profitAndLoss(params!).then((res) => res.data.data),
    enabled: !!params?.date_from && !!params?.date_to,
  });
}

import { useMutation } from "@tanstack/react-query";
import { normalizeBlobError } from "@shared/lib/downloadFile";

export function useDownloadBalanceSheetPdf() {
  return useMutation({
    mutationFn: async (params: { asOfDate: string; organizationId: number }) => {
      try {
        const res = await financialReportingApi.balanceSheetPdf(params.asOfDate, params.organizationId);
        return res.data;
      } catch (err) {
        await normalizeBlobError(err);
      }
    },
  });
}

export function useDownloadProfitLossPdf() {
  return useMutation({
    mutationFn: async (params: { date_from: string; date_to: string; organizationId: number; cost_center_id?: number; profit_center_id?: number }) => {
      try {
        const res = await financialReportingApi.profitAndLossPdf(params);
        return res.data;
      } catch (err) {
        await normalizeBlobError(err);
      }
    },
  });
}
