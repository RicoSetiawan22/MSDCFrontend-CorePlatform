import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { costCenterApi } from "./costCenterApi";
import { normalizeBlobError } from "@shared/lib/downloadFile";
import type { CostCenterFormValues, CostCenterListParams } from "../types/costCenter";
import { useActiveOrgId } from "@shared/lib/organization-context";

const costCenterKeys = {
  all: ["cost-centers"] as const,
  list: (activeOrgId: number, params: CostCenterListParams) => [...costCenterKeys.all, activeOrgId, "list", params] as const,
};

export function useCostCenterList(params: CostCenterListParams) {
  const activeOrgId = useActiveOrgId();
  return useQuery({
    queryKey: costCenterKeys.list(activeOrgId, params),
    queryFn: () => costCenterApi.list(params).then((res) => res.data.data),
  });
}

export function useCreateCostCenter() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: CostCenterFormValues) => costCenterApi.create(values).then((res) => res.data.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: costCenterKeys.all }),
  });
}

export function useUpdateCostCenter() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, values }: { id: number; values: Omit<CostCenterFormValues, "code"> }) =>
      costCenterApi.update(id, values).then((res) => res.data.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: costCenterKeys.all }),
  });
}

export function useDeleteCostCenter() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => costCenterApi.delete(id).then((res) => res.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: costCenterKeys.all }),
  });
}

export function useCostReport(costCenterId: number | undefined, dateFrom?: string, dateTo?: string, includeDescendants = true) {
  const activeOrgId = useActiveOrgId();
  return useQuery({
    queryKey: ["cost-report", activeOrgId, costCenterId, dateFrom, dateTo, includeDescendants],
    queryFn: () => costCenterApi.costReport(costCenterId!, dateFrom, dateTo, includeDescendants).then((res) => res.data.data),
    enabled: !!costCenterId,
  });
}

export function useDownloadCostCentersPdf() {
  return useMutation({
    mutationFn: async (organizationId: number) => {
      try {
        const res = await costCenterApi.printPdf(organizationId);
        return res.data;
      } catch (err) {
        await normalizeBlobError(err);
      }
    },
  });
}

export function useDownloadCostCenterReportPdf() {
  return useMutation({
    mutationFn: async (params: {
      organizationId: number;
      costCenterId: number;
      date_from?: string;
      date_to?: string;
      include_descendants?: boolean;
    }) => {
      try {
        const res = await costCenterApi.printCostCenterReportPdf(params.costCenterId, params);
        return res.data;
      } catch (err) {
        await normalizeBlobError(err);
      }
    },
  });
}
