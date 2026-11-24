import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queueApi } from "./queueApi";

const queueKeys = {
  status: ["queueStatus"] as const,
  pending: (params?: { per_page?: number; page?: number }) => ["queuePending", params] as const,
  failed: (params?: { per_page?: number; page?: number }) => ["queueFailed", params] as const,
};

// Status queue berubah dari luar (worker jalan di proses TERPISAH, bukan
// dari aksi di halaman ini) - poll berkala biar admin lihat progres tanpa
// manual refresh, BUKAN cuma sekali muat.
const POLL_INTERVAL = 5000;

export function useQueueStatus() {
  return useQuery({
    queryKey: queueKeys.status,
    queryFn: () => queueApi.status().then((r) => r.data.data),
    refetchInterval: POLL_INTERVAL,
  });
}

export function usePendingJobs(params?: { per_page?: number; page?: number }) {
  return useQuery({
    queryKey: queueKeys.pending(params),
    queryFn: () => queueApi.pendingJobs(params).then((r) => r.data),
    refetchInterval: POLL_INTERVAL,
  });
}

export function useFailedJobs(params?: { per_page?: number; page?: number }) {
  return useQuery({
    queryKey: queueKeys.failed(params),
    queryFn: () => queueApi.failedJobs(params).then((r) => r.data),
    refetchInterval: POLL_INTERVAL,
  });
}

function invalidateAll(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: queueKeys.status });
  qc.invalidateQueries({ queryKey: ["queuePending"] });
  qc.invalidateQueries({ queryKey: ["queueFailed"] });
}

export function useRetryJob() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (uuid: string) => queueApi.retry(uuid),
    onSuccess: () => invalidateAll(qc),
  });
}

export function useRetryAllJobs() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => queueApi.retryAll(),
    onSuccess: () => invalidateAll(qc),
  });
}

export function useForgetJob() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (uuid: string) => queueApi.forget(uuid),
    onSuccess: () => invalidateAll(qc),
  });
}

export function useFlushFailedJobs() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => queueApi.flushFailed(),
    onSuccess: () => invalidateAll(qc),
  });
}
