import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ticketApi } from "./ticketApi";
import type { SupportTicketListParams, TicketStatus } from "../types/ticket";

const tkKeys = {
  all: ["hrTickets"] as const,
  list: (p: SupportTicketListParams) => [...tkKeys.all, "list", p] as const,
};

export function useSupportTicketList(params: SupportTicketListParams) {
  return useQuery({
    queryKey: tkKeys.list(params),
    queryFn: () => ticketApi.list(params).then((r) => r.data),
    placeholderData: (prev) => prev,
  });
}

export function useSupportTicket(id: number | undefined) {
  return useQuery({
    queryKey: [...tkKeys.all, "detail", id ?? 0] as const,
    queryFn: () => ticketApi.show(id!).then((r) => r.data.data),
    enabled: !!id,
  });
}

export function useCreateSupportTicket() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ticketApi.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: tkKeys.all }),
  });
}

export function useUpdateSupportTicketStatus(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (status: TicketStatus) =>
      ticketApi.updateStatus(id, status).then((r) => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: tkKeys.all }),
  });
}

export function useAssignSupportTicket(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (employeeId: number) =>
      ticketApi.assign(id, employeeId).then((r) => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: tkKeys.all }),
  });
}
