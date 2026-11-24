import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fixedAssetApi } from "./fixedAssetApi";
import { normalizeBlobError } from "@shared/lib/downloadFile";
import type { FaAssetFormValues, FaAssetListParams } from "../types/fixedAsset";
import { useActiveOrgId } from "@shared/lib/organization-context";

const assetKeys = {
  all: ["fixed-assets"] as const,
  list: (activeOrgId: number, params: FaAssetListParams) => [...assetKeys.all, activeOrgId, "list", params] as const,
  detail: (activeOrgId: number, id: number) => [...assetKeys.all, activeOrgId, "detail", id] as const,
  schedule: (activeOrgId: number, id: number) => [...assetKeys.all, activeOrgId, "schedule", id] as const,
};

export function useFixedAssetList(params: FaAssetListParams) {
  const activeOrgId = useActiveOrgId();
  return useQuery({
    queryKey: assetKeys.list(activeOrgId, params),
    queryFn: () => fixedAssetApi.list(params).then((res) => res.data),
    placeholderData: (previousData) => previousData,
  });
}

export function useFixedAsset(id: number | undefined) {
  const activeOrgId = useActiveOrgId();
  return useQuery({
    queryKey: assetKeys.detail(activeOrgId, id ?? 0),
    queryFn: () => fixedAssetApi.show(id!).then((res) => res.data.data),
    enabled: !!id,
  });
}

export function useDepreciationSchedule(id: number | undefined) {
  const activeOrgId = useActiveOrgId();
  return useQuery({
    queryKey: assetKeys.schedule(activeOrgId, id ?? 0),
    queryFn: () => fixedAssetApi.depreciationSchedule(id!).then((res) => res.data.data),
    enabled: !!id,
  });
}

export function useCreateFixedAsset() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: FaAssetFormValues) => fixedAssetApi.create(values).then((res) => res.data.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: assetKeys.all }),
  });
}

export function useRelocateAsset() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, toLocation, relocationDate, reason }: { id: number; toLocation: string; relocationDate?: string; reason?: string }) =>
      fixedAssetApi.relocate(id, toLocation, relocationDate, reason).then((res) => res.data.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: assetKeys.all }),
  });
}

export function useDisposeAsset() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, values }: { id: number; values: Parameters<typeof fixedAssetApi.dispose>[1] }) =>
      fixedAssetApi.dispose(id, values).then((res) => res.data.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: assetKeys.all });
    },
  });
}

export function useRunDepreciation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ periodDate, assetId }: { periodDate: string; assetId?: number }) =>
      fixedAssetApi.runDepreciation(periodDate, assetId).then((res) => res.data.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: assetKeys.all }),
  });
}

export function useDownloadFixedAssetsPdf() {
  return useMutation({
    mutationFn: async (params: { organizationId: number; asset_category?: string; status?: string; search?: string }) => {
      try {
        const res = await fixedAssetApi.printPdf(params.organizationId, params);
        return res.data;
      } catch (err) {
        await normalizeBlobError(err);
      }
    },
  });
}

export function useDownloadDepreciationSchedulePdf() {
  return useMutation({
    mutationFn: async (params: { organizationId: number; asset_category?: string; status?: string }) => {
      try {
        const res = await fixedAssetApi.printDepreciationSchedulePdf(params.organizationId, params);
        return res.data;
      } catch (err) {
        await normalizeBlobError(err);
      }
    },
  });
}
