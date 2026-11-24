import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { backupApi } from "./backupApi";

const backupKeys = { all: ["systemBackups"] as const };

export function useBackupList() {
  return useQuery({
    queryKey: backupKeys.all,
    queryFn: () => backupApi.list().then((r) => r.data.data),
    // Backup berjalan bisa makan waktu (mysqldump database besar) - poll
    // tiap 3 detik SELAMA ada baris berstatus 'running', supaya status
    // completed/failed otomatis muncul tanpa user manual refresh halaman.
    refetchInterval: (query) => {
      const data = query.state.data;
      return data?.some((b) => b.status === "running") ? 3000 : false;
    },
  });
}

export function useCreateBackup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => backupApi.create(),
    // onSettled (BUKAN cuma onSuccess) - backend TETAP menyimpan record
    // berstatus 'failed' + error_message walau request-nya balas HTTP 500
    // (lihat DatabaseBackupService::createBackup()), jadi list harus tetap
    // di-refresh biar user lihat kegagalannya, bukan seolah tidak terjadi apa-apa.
    onSettled: () => qc.invalidateQueries({ queryKey: backupKeys.all }),
  });
}

export function useDeleteBackup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => backupApi.destroy(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: backupKeys.all }),
  });
}

export function useRestoreBackup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, confirmation }: { id: number; confirmation: string }) => backupApi.restore(id, confirmation),
    onSuccess: () => qc.invalidateQueries({ queryKey: backupKeys.all }),
  });
}
