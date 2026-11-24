import { apiClient } from "@shared/lib/api-client";
import type { NotificationChannelConfig, NotificationChannelConfigUpdateValues } from "../types/notificationChannel";

const BASE = "/v1/core-platform/notifications/channel-configs";

interface ChannelConfigResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export const notificationChannelApi = {
  list() {
    return apiClient.get<ChannelConfigResponse<NotificationChannelConfig[]>>(BASE);
  },
  update(id: number, values: NotificationChannelConfigUpdateValues) {
    return apiClient.put<ChannelConfigResponse<NotificationChannelConfig>>(`${BASE}/${id}`, values);
  },
};
