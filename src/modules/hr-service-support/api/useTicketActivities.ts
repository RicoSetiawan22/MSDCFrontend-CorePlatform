import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ticketApi, type TicketActivity } from "./ticketApi";

export function useTicketActivities(ticketId: number | null) {
  return useQuery({
    queryKey: ["ticketActivities", ticketId] as const,
    queryFn: () => ticketApi.show(ticketId!).then((r) => {
      const data = r.data as { data: { activities?: TicketActivity[] } };
      return data.data.activities ?? [];
    }),
    enabled: ticketId != null,
  });
}

export function useLogActivity(ticketId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (values: { description: string; activity_type?: string }) =>
      ticketApi.logActivity(ticketId, values),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ticketActivities", ticketId] });
      qc.invalidateQueries({ queryKey: ["hrTickets"] });
    },
  });
}
