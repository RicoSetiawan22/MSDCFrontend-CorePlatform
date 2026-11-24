import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { cctvApi } from "./cctvApi";
import type {
  CctvFilterParams,
  CreateCctvPayload,
  UpdateCctvPayload,
} from "../types/cctv";

export const cctvKeys = {
  all: ["cctvCameras"] as const,
  lists: () => [...cctvKeys.all, "list"] as const,
  list: (params?: CctvFilterParams) => [...cctvKeys.lists(), params] as const,
  details: () => [...cctvKeys.all, "detail"] as const,
  detail: (id: number) => [...cctvKeys.details(), id] as const,
};

/**
 * Mengambil daftar kamera CCTV dengan auto-refetch status kesehatan tiap 30 detik
 */
export function useCctvCameras(params?: CctvFilterParams, enabled = true) {
  return useQuery({
    queryKey: cctvKeys.list(params),
    queryFn: () => cctvApi.list(params).then((r) => r.data),
    enabled,
    refetchInterval: 30_000,
    placeholderData: (prev) => prev,
  });
}

/**
 * Mengambil detail kamera CCTV berdasarkan ID
 */
export function useCctvCamera(id: number | undefined) {
  return useQuery({
    queryKey: cctvKeys.detail(id ?? 0),
    queryFn: () => cctvApi.get(id!).then((r) => r.data.data),
    enabled: Boolean(id),
  });
}

/**
 * Mendaftarkan kamera CCTV baru
 */
export function useCreateCctvCamera() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateCctvPayload) =>
      cctvApi.create(payload).then((r) => r.data.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: cctvKeys.all });
    },
  });
}

/**
 * Memperbarui data kamera CCTV yang sudah terdaftar
 */
export function useUpdateCctvCamera() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateCctvPayload }) =>
      cctvApi.update(id, data).then((r) => r.data.data),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: cctvKeys.all });
      qc.invalidateQueries({ queryKey: cctvKeys.detail(vars.id) });
    },
  });
}

/**
 * Menghapus kamera CCTV dari sistem
 */
export function useDeleteCctvCamera() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => cctvApi.delete(id).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: cctvKeys.all });
    },
  });
}

/**
 * Menguji konektivitas alamat stream sebelum disimpan ke DB
 */
export function useTestCctvStream() {
  return useMutation({
    mutationFn: (payload: { source_url: string }) =>
      cctvApi.test(payload).then((r) => r.data),
  });
}

/**
 * Memeriksa ulang konektivitas kamera tersimpan dan mengupdate statusnya
 */
export function useCheckCctvCamera() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => cctvApi.check(id).then((r) => r.data),
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: cctvKeys.all });
      qc.invalidateQueries({ queryKey: cctvKeys.detail(id) });
    },
  });
}

