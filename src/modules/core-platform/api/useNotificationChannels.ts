import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { notificationChannelApi } from "./notificationChannelApi";
import type { NotificationChannelConfigUpdateValues } from "../types/notificationChannel";

const channelKeys = { all: ["notificationChannelConfigs"] as const };

export function useNotificationChannelList() {
  return useQuery({
    queryKey: channelKeys.all,
    queryFn: () => notificationChannelApi.list().then(r => r.data.data),
  });
}

export function useUpdateNotificationChannel(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (values: NotificationChannelConfigUpdateValues) =>
      notificationChannelApi.update(id, values).then(r => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: channelKeys.all }),
  });
}
