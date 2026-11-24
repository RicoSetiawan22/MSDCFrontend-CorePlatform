import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { profitCenterApi } from "./profitCenterApi";
import { normalizeBlobError } from "@shared/lib/downloadFile";
import type { PcProfitCenterFormValues, PcProfitCenterListParams } from "../types/profitCenter";
import { useActiveOrgId } from "@shared/lib/organization-context";

const profitCenterKeys = {
  all: ["profit-centers"] as const,
  list: (activeOrgId: number, params: PcProfitCenterListParams) => [...profitCenterKeys.all, activeOrgId, "list", params] as const,
};

export function useProfitCenterList(params: PcProfitCenterListParams) {
  const activeOrgId = useActiveOrgId();
  return useQuery({
    queryKey: profitCenterKeys.list(activeOrgId, params),
    queryFn: () => profitCenterApi.list(params).then((res) => res.data.data),
  });
}

export function useCreateProfitCenter() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: PcProfitCenterFormValues) => profitCenterApi.create(values).then((res) => res.data.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: profitCenterKeys.all }),
  });
}

export function useProfitReport(profitCenterId: number | undefined, dateFrom?: string, dateTo?: string, includeDescendants = true) {
  const activeOrgId = useActiveOrgId();
  return useQuery({
    queryKey: ["profit-report", activeOrgId, profitCenterId, dateFrom, dateTo, includeDescendants],
    queryFn: () => profitCenterApi.report(profitCenterId!, dateFrom, dateTo, includeDescendants).then((res) => res.data.data),
    enabled: !!profitCenterId,
  });
}

export function useProfitComparison(dateFrom?: string, dateTo?: string) {
  const activeOrgId = useActiveOrgId();
  return useQuery({
    queryKey: ["profit-comparison", activeOrgId, dateFrom, dateTo],
    queryFn: () => profitCenterApi.comparison(dateFrom, dateTo).then((res) => res.data.data),
  });
}

export function useDownloadProfitCentersPdf() {
  return useMutation({
    mutationFn: async (organizationId: number) => {
      try {
        const res = await profitCenterApi.printPdf(organizationId);
        return res.data;
      } catch (err) {
        await normalizeBlobError(err);
      }
    },
  });
}

export function useDownloadProfitCenterReportPdf() {
  return useMutation({
    mutationFn: async (params: {
      organizationId: number;
      profitCenterId: number;
      date_from?: string;
      date_to?: string;
      include_descendants?: boolean;
    }) => {
      try {
        const res = await profitCenterApi.printProfitCenterReportPdf(params.profitCenterId, params);
        return res.data;
      } catch (err) {
        await normalizeBlobError(err);
      }
    },
  });
}

export function useDownloadProfitCenterComparisonPdf() {
  return useMutation({
    mutationFn: async (params: {
      organizationId: number;
      date_from?: string;
      date_to?: string;
    }) => {
      try {
        const res = await profitCenterApi.printComparisonPdf(params);
        return res.data;
      } catch (err) {
        await normalizeBlobError(err);
      }
    },
  });
}
