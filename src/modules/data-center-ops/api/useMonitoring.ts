import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { monitoringApi } from "./monitoringApi";
import type { MetricReadingListParams, RecordReadingValues } from "../types/monitoring";

const monitoringKeys = {
  all: ["dcMonitoring"] as const,
  readings: (params: MetricReadingListParams) => [...monitoringKeys.all, "readings", params] as const,
  alarms: (params: Record<string, unknown>) => [...monitoringKeys.all, "alarms", params] as const,
};

/** Polling tiap 15 detik - pembacaan sensor IoT masuk lewat HTTP dari LUAR
 * aplikasi (bukan lewat mutation React Query di tab ini), jadi tidak ada
 * cara React Query tahu ada data baru KECUALI di-polling. Tombol "Catat"
 * manual kelihatan langsung update karena useRecordReading() sengaja
 * invalidateQueries() setelah submit - itu jalan pintas TAMBAHAN, bukan
 * satu-satunya sumber refresh (sebelumnya di sini TIDAK ada
 * refetchInterval sama sekali, jadi update dari sensor beneran tidak
 * pernah muncul sampai halaman di-reload manual). */
export function useMetricReadingList(params: MetricReadingListParams) {
  return useQuery({
    queryKey: monitoringKeys.readings(params),
    queryFn: () => monitoringApi.listReadings(params).then(r => r.data),
    placeholderData: prev => prev,
    refetchInterval: 15_000,
  });
}

export function useRecordReading() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (values: RecordReadingValues) => monitoringApi.recordReading(values).then(r => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: monitoringKeys.all }),
  });
}

export function useSetThreshold() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (values: Parameters<typeof monitoringApi.setThreshold>[0]) =>
      monitoringApi.setThreshold(values).then(r => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: monitoringKeys.all }),
  });
}

export function useAlarmList(params: { rack_id?: number; status?: string; severity?: string; per_page?: number }) {
  return useQuery({
    queryKey: monitoringKeys.alarms(params),
    queryFn: () => monitoringApi.listAlarms(params).then(r => r.data),
    placeholderData: prev => prev,
    // Sama alasannya dengan useMetricReadingList - alarm bisa terbentuk
    // otomatis dari pembacaan sensor eksternal, jangan sampai baru
    // kelihatan setelah reload manual.
    refetchInterval: 15_000,
  });
}

export function useAcknowledgeAlarm() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => monitoringApi.acknowledgeAlarm(id).then(r => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: monitoringKeys.all }),
  });
}

export function useResolveAlarm() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, notes }: { id: number; notes?: string }) => monitoringApi.resolveAlarm(id, notes).then(r => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: monitoringKeys.all }),
  });
}

/**
 * Hook Agregasi Telemetri Makro Seluruh Rak (All Racks Matrix & Heatmap).
 * Polling otomatis setiap 15 detik untuk memantau status Normal/Warning/Critical di layar NOC.
 */
export function useAllRacksTelemetrySummary(params?: {
  site_id?: number;
  site_room_id?: number;
  status?: string;
  only_monitored?: boolean;
}) {
  return useQuery({
    queryKey: [...monitoringKeys.all, "allRacksSummary", params],
    queryFn: () => monitoringApi.getAllRacksTelemetrySummary(params).then(r => r.data),
    placeholderData: prev => prev,
    refetchInterval: 15_000,
  });
}

