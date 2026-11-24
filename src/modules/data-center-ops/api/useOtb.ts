import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { otbApi } from "./otbApi";
import type { OtbFormValues, OtbListParams, OtbPortAllocateValues, OtbPortListParams } from "../types/otb";

const otbKeys = {
  all: ["dcOtbs"] as const,
  list: (params: OtbListParams) => [...otbKeys.all, "list", params] as const,
  detail: (id: number) => [...otbKeys.all, "detail", id] as const,
  ports: (otbId: number, params: OtbPortListParams) => [...otbKeys.all, "ports", otbId, params] as const,
};

export function useOtbList(params: OtbListParams) {
  return useQuery({
    queryKey: otbKeys.list(params),
    queryFn: () => otbApi.list(params).then((r) => r.data),
    placeholderData: (prev) => prev,
  });
}

export function useOtb(id: number | undefined) {
  return useQuery({
    queryKey: otbKeys.detail(id ?? 0),
    queryFn: () => otbApi.show(id!).then((r) => r.data.data),
    enabled: !!id,
  });
}

export function useOtbPorts(otbId: number | undefined, params: OtbPortListParams) {
  return useQuery({
    queryKey: otbKeys.ports(otbId ?? 0, params),
    queryFn: () => otbApi.ports(otbId!, params).then((r) => r.data),
    enabled: !!otbId,
    placeholderData: (prev) => prev,
  });
}

function invalidateAll(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: otbKeys.all });
}

export function useCreateOtb() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (values: OtbFormValues) => otbApi.create(values).then((r) => r.data.data),
    onSuccess: () => invalidateAll(qc),
  });
}

export function useUpdateOtb(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (values: Partial<OtbFormValues>) => otbApi.update(id, values).then((r) => r.data.data),
    onSuccess: () => invalidateAll(qc),
  });
}

export function useAllocateOtbPort() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ portId, values }: { portId: number; values: OtbPortAllocateValues }) => otbApi.allocatePort(portId, values).then((r) => r.data.data),
    onSuccess: () => invalidateAll(qc),
  });
}

export function useReleaseOtbPort() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (portId: number) => otbApi.releasePort(portId).then((r) => r.data.data),
    onSuccess: () => invalidateAll(qc),
  });
}

export function useMarkOtbPortDamaged() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (portId: number) => otbApi.markPortDamaged(portId).then((r) => r.data.data),
    onSuccess: () => invalidateAll(qc),
  });
}

export function useRepairOtbPort() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (portId: number) => otbApi.repairPort(portId).then((r) => r.data.data),
    onSuccess: () => invalidateAll(qc),
  });
}
