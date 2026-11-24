import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { deviceApi } from "./deviceApi";
import type { DeviceListParams } from "../types/device";

const deviceKeys = {
  all: ["dcDevices"] as const,
  list: (params: DeviceListParams) => [...deviceKeys.all, "list", params] as const,
};

export function useDeviceList(params: DeviceListParams) {
  return useQuery({
    queryKey: deviceKeys.list(params),
    queryFn: () => deviceApi.list(params).then(r => r.data),
    placeholderData: prev => prev,
  });
}

export function useDevice(id: number | undefined) {
  return useQuery({
    queryKey: [...deviceKeys.all, "detail", id ?? 0] as const,
    queryFn: () => deviceApi.show(id!).then(r => r.data.data),
    enabled: !!id,
  });
}

export function useCreateDevice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (values: Parameters<typeof deviceApi.create>[0]) =>
      deviceApi.create(values).then(r => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: deviceKeys.all }),
  });
}

export function useUpdateDevice(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (values: Parameters<typeof deviceApi.update>[1]) =>
      deviceApi.update(id, values).then(r => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: deviceKeys.all }),
  });
}

export function useMoveDevice(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (values: Parameters<typeof deviceApi.move>[1]) =>
      deviceApi.move(id, values).then(r => r.data.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: deviceKeys.all });
      qc.invalidateQueries({ queryKey: ["dcRacks"] });
      qc.invalidateQueries({ queryKey: ["dcSites"] });
    },
  });
}

export function useSetDeviceStatus(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (status: string) => deviceApi.setStatus(id, status).then(r => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: deviceKeys.all }),
  });
}

export function useDeleteDevice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deviceApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: deviceKeys.all }),
  });
}
