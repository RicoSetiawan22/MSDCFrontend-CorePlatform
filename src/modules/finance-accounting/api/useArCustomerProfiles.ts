import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { arCustomerProfileApi } from "./arCustomerProfileApi";
import { normalizeBlobError } from "@shared/lib/downloadFile";
import type { ArCustomerProfileFormValues, ArCustomerProfileListParams } from "../types/arCustomerProfile";
import { useActiveOrgId } from "@shared/lib/organization-context";

const arCustomerKeys = {
  all: ["ar-customers"] as const,
  list: (activeOrgId: number, params: ArCustomerProfileListParams) => [...arCustomerKeys.all, activeOrgId, "list", params] as const,
  detail: (activeOrgId: number, customerId: number) => [...arCustomerKeys.all, activeOrgId, "detail", customerId] as const,
};

export function useArCustomerProfileList(params: ArCustomerProfileListParams) {
  const activeOrgId = useActiveOrgId();
  return useQuery({
    queryKey: arCustomerKeys.list(activeOrgId, params),
    queryFn: () => arCustomerProfileApi.list(params).then((res) => res.data),
    placeholderData: (previousData) => previousData,
  });
}

export function useArCustomerOutstanding(customerId: number | undefined) {
  const activeOrgId = useActiveOrgId();
  return useQuery({
    queryKey: arCustomerKeys.detail(activeOrgId, customerId ?? 0),
    queryFn: () => arCustomerProfileApi.show(customerId!).then((res) => res.data.data),
    enabled: !!customerId,
  });
}

export function useSaveArCustomerProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: ArCustomerProfileFormValues) => arCustomerProfileApi.save(values).then((res) => res.data.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: arCustomerKeys.all });
    },
  });
}

export function useDownloadArCustomersPdf() {
  return useMutation({
    mutationFn: async (organizationId: number) => {
      try {
        const res = await arCustomerProfileApi.printPdf(organizationId);
        return res.data;
      } catch (err) {
        await normalizeBlobError(err);
      }
    },
  });
}
