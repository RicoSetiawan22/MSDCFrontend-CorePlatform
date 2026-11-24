import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { rackApi } from "./rackApi";
import type { RackListParams, RackDetail } from "../types/rack";

const rackKeys = {
  all: ["dcRacks"] as const,
  list: (params: RackListParams) => [...rackKeys.all, "list", params] as const,
  detail: (id: number) => [...rackKeys.all, "detail", id] as const,
};

export function useRackList(params: RackListParams) {
  return useQuery({
    queryKey: rackKeys.list(params),
    queryFn: () => rackApi.list(params).then(r => r.data),
    placeholderData: prev => prev,
  });
}

export function useRack(id: number | undefined) {
  return useQuery({
    queryKey: rackKeys.detail(id ?? 0),
    queryFn: () => rackApi.show(id!).then(r => r.data.data as RackDetail),
    enabled: !!id,
  });
}

export function useCreateRack() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (values: Parameters<typeof rackApi.create>[0]) =>
      rackApi.create(values).then(r => r.data.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: rackKeys.all });
      qc.invalidateQueries({ queryKey: ["dcRooms"] });
      qc.invalidateQueries({ queryKey: ["dcSites"] });
    },
  });
}

export function useRackOccupancy(rackId: number | undefined) {
  return useQuery({
    queryKey: [...rackKeys.all, "occupancy", rackId ?? 0] as const,
    queryFn: () => rackApi.occupancy(rackId!).then(r => r.data.data),
    enabled: !!rackId,
  });
}

/** Slot rack yang sudah dikunci/dipesan untuk 1 contract - dipakai
 * DeviceFormModal supaya device yang ditautkan ke contract cuma bisa
 * ditempatkan di slot yang memang sudah dipesan contract itu. */
export function useContractRackAllocations(contractId: number | undefined) {
  return useQuery({
    queryKey: [...rackKeys.all, "contract-allocations", contractId ?? 0] as const,
    queryFn: () => rackApi.allocationsForContract(contractId!).then(r => r.data.data),
    enabled: !!contractId,
  });
}

export function useAllocateRackSlots(rackId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (values: Parameters<typeof rackApi.allocate>[1]) => rackApi.allocate(rackId, values).then(r => r.data.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [...rackKeys.all, "occupancy", rackId] });
      qc.invalidateQueries({ queryKey: rackKeys.all });
    },
  });
}

export function useReleaseRackAllocation(rackId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (allocationId: number) => rackApi.releaseAllocation(allocationId).then(r => r.data.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [...rackKeys.all, "occupancy", rackId] });
      qc.invalidateQueries({ queryKey: rackKeys.all });
    },
  });
}

export function useRequestReleaseAllocation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ allocationId, reason }: { allocationId: number; reason?: string }) =>
      rackApi.requestReleaseAllocation(allocationId, reason).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: rackKeys.all }),
  });
}

export function useRequestMoveAllocation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ allocationId, targetRackId, targetStartU, reason }: { allocationId: number; targetRackId: number; targetStartU: number; reason?: string }) =>
      rackApi.requestMoveAllocation(allocationId, targetRackId, targetStartU, reason).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: rackKeys.all }),
  });
}

export function useCompleteRelease() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (allocationId: number) => rackApi.completeRelease(allocationId).then(r => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: rackKeys.all }),
  });
}

export function useDeleteRack() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => rackApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: rackKeys.all });
      qc.invalidateQueries({ queryKey: ["dcRooms"] });
      qc.invalidateQueries({ queryKey: ["dcSites"] });
    },
  });
}
