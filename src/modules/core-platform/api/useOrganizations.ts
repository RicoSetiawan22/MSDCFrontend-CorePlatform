import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { organizationApi } from "@shared/api/organizationApi";
import type { OrganizationFormValues, OrganizationListParams } from "@shared/types/organization";

const organizationKeys = {
  all: ["organizations"] as const,
  list: (params: OrganizationListParams) => [...organizationKeys.all, "list", params] as const,
};

export function useOrganizationList(params: OrganizationListParams) {
  return useQuery({
    queryKey: organizationKeys.list(params),
    // Backend bungkus paginator LAGI di dalam {success,data:...} (lihat
    // OrganizationController::index) - res.data SAJA masih {success,data:
    // paginator}, bukan paginator-nya langsung. Perlu .data SEKALI LAGI
    // supaya cocok dengan OrganizationListPage.tsx yang baca data.data
    // (array) dan data.total langsung dari level teratas.
    queryFn: () => organizationApi.list(params).then((res) => res.data.data),
    placeholderData: (previousData) => previousData,
  });
}

export function useCreateOrganization() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: OrganizationFormValues) => organizationApi.create(values).then((res) => res.data.data),
    // "organizations" (tanpa embel-embel lain) itu query key yang dipakai
    // useInternalOrganizations() di @shared/api/organizationApi.ts -
    // ikut di-invalidate supaya dropdown pemilih cabang di modal cetak
    // PDF (Finance & Accounting) langsung lihat cabang baru tanpa refresh.
    onSuccess: () => queryClient.invalidateQueries({ queryKey: organizationKeys.all }),
  });
}

export function useUpdateOrganization() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, values }: { id: number; values: Partial<OrganizationFormValues> }) =>
      organizationApi.update(id, values).then((res) => res.data.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: organizationKeys.all }),
  });
}

export function useDeleteOrganization() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => organizationApi.destroy(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: organizationKeys.all }),
  });
}
