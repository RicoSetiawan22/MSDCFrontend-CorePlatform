import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { accountApi } from "./accountApi";
import { normalizeBlobError } from "@shared/lib/downloadFile";
import type { AccountFormValues, AccountListParams } from "../types/account";
import { useActiveOrgId } from "@shared/lib/organization-context";

const accountKeys = {
  all: ["accounts"] as const,
  list: (activeOrgId: number, params: AccountListParams) => [...accountKeys.all, activeOrgId, "list", params] as const,
};

export function useAccountList(params: AccountListParams) {
  const activeOrgId = useActiveOrgId();
  return useQuery({
    queryKey: accountKeys.list(activeOrgId, params),
    queryFn: () => accountApi.list(params).then((res) => res.data),
    placeholderData: (previousData) => previousData,
  });
}

export function useCreateAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: AccountFormValues) => accountApi.create(values).then((res) => res.data.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: accountKeys.all }),
  });
}

export function useActivateAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => accountApi.activate(id).then((res) => res.data.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: accountKeys.all }),
  });
}

export function useDownloadAccountsPdf() {
  return useMutation({
    mutationFn: async (organizationId: number) => {
      try {
        const res = await accountApi.printPdf(organizationId);
        return res.data; // Blob - pratinjau dulu, bukan langsung unduh
      } catch (err) {
        await normalizeBlobError(err);
      }
    },
  });
}
