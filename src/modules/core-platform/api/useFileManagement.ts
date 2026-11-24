import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fileApi, type FileListParams } from "@shared/api/fileApi";
import type { FileFolder, FileStorageConfig } from "@shared/types/file";

const fileKeys = {
  all: ["cpFiles"] as const,
  list: (params?: FileListParams) => [...fileKeys.all, "list", params] as const,
  folders: (params?: { parent_id?: number; root_only?: 1; module_code?: string }) => ["cpFileFolders", params] as const,
  storageConfigs: ["cpFileStorageConfigs"] as const,
};

export function useFileList(params?: FileListParams) {
  return useQuery({
    queryKey: fileKeys.list(params),
    queryFn: () => fileApi.list(params).then((r) => r.data.data),
  });
}

export function useDeleteFile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (fileId: number) => fileApi.destroy(fileId),
    onSuccess: () => qc.invalidateQueries({ queryKey: fileKeys.all }),
  });
}

export function useUploadImage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ file, moduleCode, folderId }: { file: File; moduleCode?: string; folderId?: number }) =>
      fileApi.upload(file, moduleCode, undefined, undefined, folderId),
    onSuccess: () => qc.invalidateQueries({ queryKey: fileKeys.all }),
  });
}

export function useFolderList(params?: { parent_id?: number; root_only?: 1; module_code?: string }) {
  return useQuery({
    queryKey: fileKeys.folders(params),
    queryFn: () => fileApi.folders.list(params).then((r) => r.data.data),
  });
}

export function useCreateFolder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (values: { name: string; parent_id?: number | null; module_code?: string | null }) => fileApi.folders.create(values),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["cpFileFolders"] }),
  });
}

export function useUpdateFolder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, values }: { id: number; values: { name?: string; is_active?: boolean } }) => fileApi.folders.update(id, values),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["cpFileFolders"] }),
  });
}

export function useDeleteFolder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => fileApi.folders.destroy(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cpFileFolders"] });
      qc.invalidateQueries({ queryKey: fileKeys.all });
    },
  });
}

export function useStorageConfigs() {
  return useQuery({
    queryKey: fileKeys.storageConfigs,
    queryFn: () => fileApi.storageConfigs.list().then((r) => r.data.data),
  });
}

export function useCreateStorageConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (values: { disk_name: string; driver: string; config?: Record<string, unknown> | null; is_default?: boolean }) =>
      fileApi.storageConfigs.create(values),
    onSuccess: () => qc.invalidateQueries({ queryKey: fileKeys.storageConfigs }),
  });
}

export function useUpdateStorageConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, values }: { id: number; values: { driver?: string; config?: Record<string, unknown> | null; is_default?: boolean; is_active?: boolean } }) =>
      fileApi.storageConfigs.update(id, values),
    onSuccess: () => qc.invalidateQueries({ queryKey: fileKeys.storageConfigs }),
  });
}

export function useDeleteStorageConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => fileApi.storageConfigs.destroy(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: fileKeys.storageConfigs }),
  });
}

export type { FileFolder, FileStorageConfig };
