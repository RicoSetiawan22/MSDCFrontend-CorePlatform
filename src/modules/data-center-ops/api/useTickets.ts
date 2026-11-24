import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ticketApi } from "./ticketApi";
import type { TicketListParams, TicketStatus } from "../types/ticket";

const ticketKeys = {
  all: ["dcTickets"] as const,
  list: (params: TicketListParams) => [...ticketKeys.all, "list", params] as const,
};

export function useTicketList(params: TicketListParams) {
  return useQuery({
    queryKey: ticketKeys.list(params),
    queryFn: () => ticketApi.list(params).then(r => r.data),
    placeholderData: prev => prev,
  });
}

export function useTicket(id: number | undefined) {
  return useQuery({
    queryKey: [...ticketKeys.all, "detail", id ?? 0] as const,
    queryFn: () => ticketApi.show(id!).then(r => r.data.data),
    enabled: !!id,
  });
}

export function useCreateTicket() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (values: Parameters<typeof ticketApi.create>[0]) =>
      ticketApi.create(values).then(r => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ticketKeys.all }),
  });
}

export function useUpdateTicketStatus(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ status, resolutionAction }: { status: TicketStatus; resolutionAction?: string }) =>
      ticketApi.updateStatus(id, status, resolutionAction).then(r => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ticketKeys.all }),
  });
}

export function useAssignTicket(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: number) =>
      ticketApi.assign(id, userId).then(r => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ticketKeys.all }),
  });
}

export function useLogTicketActivity(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: { activity_type?: string; description: string; duration_minutes?: number }) =>
      ticketApi.logActivity(id, payload).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ticketKeys.all }),
  });
}
