import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { paymentRequestApi } from "./paymentRequestApi";
import type { PaymentRequestListParams } from "../types/paymentRequest";

const paymentRequestKeys = {
  all: ["paymentRequests"] as const,
  list: (p: PaymentRequestListParams) => [...paymentRequestKeys.all, "list", p] as const,
};

export function usePaymentRequestList(params: PaymentRequestListParams) {
  return useQuery({
    queryKey: paymentRequestKeys.list(params),
    queryFn: () => paymentRequestApi.list(params).then((r) => r.data),
    placeholderData: (prev) => prev,
  });
}

export function useCreatePaymentRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (values: Parameters<typeof paymentRequestApi.create>[0]) =>
      paymentRequestApi.create(values).then((r) => (r.data as { data?: unknown }).data ?? r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: paymentRequestKeys.all }),
  });
}

export function useSubmitPaymentRequest(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => paymentRequestApi.submit(id).then((r) => (r.data as { data?: unknown }).data ?? r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: paymentRequestKeys.all }),
  });
}

export function useCancelPaymentRequest(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => paymentRequestApi.cancel(id).then((r) => (r.data as { data?: unknown }).data ?? r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: paymentRequestKeys.all }),
  });
}

export function usePostAdvance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, bankAccountId }: { id: number; bankAccountId: number }) =>
      paymentRequestApi.postAdvance(id, bankAccountId).then((r) => (r.data as { data?: unknown }).data ?? r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: paymentRequestKeys.all }),
  });
}
