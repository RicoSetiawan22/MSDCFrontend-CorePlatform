import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { siteApi } from "./siteApi";
import type { SiteListParams } from "../types/site";

const siteKeys = {
  all: ["dcSites"] as const,
  list: (params: SiteListParams) => [...siteKeys.all, "list", params] as const,
};

export function useSiteList(params: SiteListParams) {
  return useQuery({
    queryKey: siteKeys.list(params),
    queryFn: () => siteApi.list(params).then(r => r.data),
    placeholderData: prev => prev,
  });
}

export function useSite(id: number | undefined) {
  return useQuery({
    queryKey: [...siteKeys.all, "detail", id ?? 0] as const,
    queryFn: () => siteApi.show(id!).then(r => r.data.data),
    enabled: !!id,
  });
}

export function useCreateSite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (values: Parameters<typeof siteApi.create>[0]) =>
      siteApi.create(values).then(r => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: siteKeys.all }),
  });
}

export function useUpdateSite(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (values: Parameters<typeof siteApi.update>[1]) =>
      siteApi.update(id, values).then(r => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: siteKeys.all }),
  });
}

export function useSetSiteStatus(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (status: string) => siteApi.setStatus(id, status).then(r => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: siteKeys.all }),
  });
}

export function useDeleteSite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => siteApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: siteKeys.all }),
  });
}
