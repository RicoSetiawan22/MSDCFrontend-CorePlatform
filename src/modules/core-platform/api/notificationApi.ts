import { apiClient } from "@shared/lib/api-client";

const BASE_PATH = "/v1/core-platform/notifications";

export const notificationApi = {
  unreadCount() {
    return apiClient.get<{ success: boolean; data: { unread_count: number } }>(`${BASE_PATH}/in-app/unread-count`);
  },
};
