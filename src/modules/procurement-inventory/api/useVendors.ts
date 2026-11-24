import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { vendorApi } from "./vendorApi";
import type { VendorFormValues, VendorListParams, VendorStatus } from "../types/vendor";

const vendorKeys = {
  all: ["vendors"] as const,
  list: (params: VendorListParams) => [...vendorKeys.all, "list", params] as const,
};

export function useVendorList(params: VendorListParams) {
  return useQuery({
    queryKey: vendorKeys.list(params),
    queryFn: () => vendorApi.list(params).then((res) => res.data),
    placeholderData: (previousData) => previousData,
  });
}

export function useCreateVendor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: VendorFormValues) => vendorApi.create(values).then((res) => res.data.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: vendorKeys.all }),
  });
}

export function useUpdateVendor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, values }: { id: number | string; values: Partial<VendorFormValues> }) =>
      vendorApi.update(id, values).then((res) => res.data.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: vendorKeys.all }),
  });
}

export function useSetVendorStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: number | string; status: VendorStatus }) => vendorApi.setStatus(id, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: vendorKeys.all }),
  });
}
