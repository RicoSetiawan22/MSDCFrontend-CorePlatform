import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apVendorProfileApi } from "./apVendorProfileApi";
import { normalizeBlobError } from "@shared/lib/downloadFile";
import type { ApVendorProfileFormValues, ApVendorProfileListParams } from "../types/apVendorProfile";
import { useActiveOrgId } from "@shared/lib/organization-context";

const apVendorKeys = {
  all: ["ap-vendors"] as const,
  list: (activeOrgId: number, params: ApVendorProfileListParams) => [...apVendorKeys.all, activeOrgId, "list", params] as const,
  detail: (activeOrgId: number, vendorId: number) => [...apVendorKeys.all, activeOrgId, "detail", vendorId] as const,
};

export function useApVendorProfileList(params: ApVendorProfileListParams) {
  const activeOrgId = useActiveOrgId();
  return useQuery({
    queryKey: apVendorKeys.list(activeOrgId, params),
    queryFn: () => apVendorProfileApi.list(params).then((res) => res.data),
    placeholderData: (previousData) => previousData,
  });
}

export function useApVendorOutstanding(vendorId: number | undefined) {
  const activeOrgId = useActiveOrgId();
  return useQuery({
    queryKey: apVendorKeys.detail(activeOrgId, vendorId ?? 0),
    queryFn: () => apVendorProfileApi.show(vendorId!).then((res) => res.data.data),
    enabled: !!vendorId,
  });
}

export function useSaveApVendorProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: ApVendorProfileFormValues) => apVendorProfileApi.save(values).then((res) => res.data.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: apVendorKeys.all });
    },
  });
}

export function useDownloadApVendorsPdf() {
  return useMutation({
    mutationFn: async (organizationId: number) => {
      try {
        const res = await apVendorProfileApi.printPdf(organizationId);
        return res.data;
      } catch (err) {
        await normalizeBlobError(err);
      }
    },
  });
}
