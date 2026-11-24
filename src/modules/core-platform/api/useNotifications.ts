import { useQuery } from "@tanstack/react-query";
import { notificationApi } from "./notificationApi";

/** Polling tiap 60 detik - CUKUP untuk badge lonceng (bukan kebutuhan
 * real-time genuine seperti dashboard monitoring alarm Team 3, yang kalau
 * nanti dibutuhkan baru layak pakai WebSocket/Laravel Echo - lihat
 * presentasi "Rekomendasi Arsitektur Frontend" bagian "Hindari Over-
 * Engineering"). */
export function useUnreadNotificationCount() {
  return useQuery({
    queryKey: ["notifications", "unread-count"],
    queryFn: () => notificationApi.unreadCount().then((res) => res.data.data.unread_count),
    refetchInterval: 60_000,
  });
}
