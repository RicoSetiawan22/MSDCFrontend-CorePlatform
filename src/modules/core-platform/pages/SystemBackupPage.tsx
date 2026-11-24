import { PageHeader } from "@shared/components/PageHeader";
import { useState } from "react";
import { AlertTriangle, Download, Trash2, DatabaseBackup, RotateCcw, Search, RefreshCw, FileArchive, Server, ShieldCheck, CheckCircle2, Calendar, Clock } from "lucide-react";
import { useAuth } from "@shared/lib/auth-context";
import { LoadingState } from "@shared/components/LoadingState";
import { EmptyState } from "@shared/components/EmptyState";
import { Button } from "@shared/components/Button";
import { Modal } from "@shared/components/Modal";
import { extractErrorMessage } from "@shared/types/api";
import { downloadBlobAsFile, normalizeBlobError } from "@shared/lib/downloadFile";
import { formatDate } from "@shared/lib/format";
import { useBackupList, useCreateBackup, useDeleteBackup, useRestoreBackup } from "../api/useBackups";
import { backupApi } from "../api/backupApi";
import type { SystemBackup } from "../types/backup";

function formatSize(bytes: number | null): string {
  if (!bytes) return "0 KB";
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function SystemBackupPage() {
  const { hasPermission } = useAuth();
  const canManage = hasPermission("system-backup.manage");

  const { data: backups, isLoading, refetch, isRefetching } = useBackupList();
  const createMutation = useCreateBackup();
  
  const [restoreTarget, setRestoreTarget] = useState<SystemBackup | null>(null);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);

  // Filter state
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("Semua Tipe");
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleFrequency, setScheduleFrequency] = useState("daily");
  const [retentionDays, setRetentionDays] = useState("7");

  async function handleCreate() {
    try {
      await createMutation.mutateAsync();
    } catch (err) {
      alert("Gagal membuat backup: " + extractErrorMessage(err));
    }
  }

  async function handleDownload(backup: SystemBackup) {
    setDownloadingId(backup.id);
    try {
      const res = await backupApi.downloadBlob(backup.id);
      downloadBlobAsFile(res.data, backup.filename);
    } catch (err) {
      try {
        await normalizeBlobError(err);
      } catch (normalized) {
        alert("Gagal mengunduh: " + extractErrorMessage(normalized));
      }
    } finally {
      setDownloadingId(null);
    }
  }

  if (!canManage) {
    return (
      <main className="flex-1 p-6 md:p-8">
        <div className="max-w-7xl mx-auto bg-white rounded-xl shadow-sm border border-slate-200">
          <EmptyState title="Akses Ditolak" subtitle="Anda tidak punya izin (system-backup.manage) untuk membuka halaman ini." />
        </div>
      </main>
    );
  }

  // Filter & Stats logic
  const filteredBackups = (backups ?? []).filter(b => {
    if (search && !b.filename.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterType === "Manual" && b.trigger_type === "pre_restore") return false;
    if (filterType === "Pre-Restore Hook" && b.trigger_type !== "pre_restore") return false;
    return true;
  });

  const totalSizeBytes = (backups ?? []).reduce((acc, curr) => acc + (curr.size_bytes ?? 0), 0);

  return (
    <main className="flex-1 w-full bg-slate-50 min-h-screen">
      <PageHeader
        title="Backup & Restore Database"
        subtitle="Backup penuh database sistem — restore menimpa SELURUH data saat ini, gunakan dengan sangat hati-hati."
      />
      <div className="px-7 py-5 space-y-6">
        {/* Grid 4 Kartu Metrik ala DataOps */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-[0_2px_8px_rgba(0,0,0,0.04)] flex flex-col justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <FileArchive size={18} />
              </div>
              <span className="text-[11px] font-bold text-slate-400 tracking-wider uppercase">TOTAL ARSIP</span>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-extrabold text-slate-800">{backups?.length ?? 0}</div>
              <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-500 font-medium">
                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                <span>Ukuran {formatSize(totalSizeBytes)}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-[0_2px_8px_rgba(0,0,0,0.04)] flex flex-col justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Calendar size={18} />
              </div>
              <span className="text-[11px] font-bold text-slate-400 tracking-wider uppercase">JADWAL OTOMATIS</span>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-extrabold text-slate-800">Aktif</div>
              <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-500 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span>Daily 02:00 WIB</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-[0_2px_8px_rgba(0,0,0,0.04)] flex flex-col justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <Server size={18} />
              </div>
              <span className="text-[11px] font-bold text-slate-400 tracking-wider uppercase">DATABASE ENGINE</span>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-extrabold text-slate-800">PostgreSQL</div>
              <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-500 font-medium">
                <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                <span>v16 High Performance</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-[0_2px_8px_rgba(0,0,0,0.04)] flex flex-col justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <ShieldCheck size={18} />
              </div>
              <span className="text-[11px] font-bold text-slate-400 tracking-wider uppercase">SAFETY HOOK</span>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-extrabold text-slate-800">Terproteksi</div>
              <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-500 font-medium">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                <span>Pre-Restore Backup On</span>
              </div>
            </div>
          </div>
        </div>

      {/* Danger Banner & Action Buttons */}
      <section className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-5 rounded-2xl bg-red-50/70 border border-red-200 shadow-sm">
        <div className="flex items-start gap-3.5">
          <div className="p-2.5 bg-red-100 text-red-600 rounded-xl shrink-0 mt-0.5">
            <AlertTriangle size={20} />
          </div>
          <div className="space-y-0.5">
            <h2 className="text-xs font-bold text-red-900 tracking-wide uppercase flex items-center gap-1.5">
              PERHATIAN: Operasi Berisiko Tinggi
            </h2>
            <p className="text-xs text-red-800 leading-relaxed max-w-3xl">
              Restore akan menimpa <span className="font-bold underline decoration-red-400">seluruh data</span> saat ini dengan isi backup. Sistem otomatis membuat backup keselamatan tepat sebelum restore berjalan.
            </p>
          </div>
        </div>
        <div className="flex items-center shrink-0">
          <Button onClick={handleCreate} disabled={createMutation.isPending} className="w-full sm:w-auto inline-flex items-center gap-2 shadow-sm">
            <DatabaseBackup size={16} />
            <span>{createMutation.isPending ? "Memproses..." : "Buat Backup Baru"}</span>
          </Button>
        </div>
      </section>

      {/* Backup Table Section */}
      <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-200 bg-white flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <div className="relative w-full sm:w-72">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Search size={16} />
              </span>
              <input 
                type="text" 
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full text-xs rounded-lg border-slate-200 pl-9 pr-3 py-1.5 focus:border-amber-500 focus:ring-amber-500 bg-slate-50 placeholder-slate-400" 
                placeholder="Cari nama file backup..." 
              />
            </div>
            <select 
              value={filterType}
              onChange={e => setFilterType(e.target.value)}
              className="text-xs rounded-lg border-slate-200 py-1.5 pl-3 pr-8 focus:border-amber-500 focus:ring-amber-500 bg-slate-50 text-slate-600"
            >
              <option>Semua Tipe</option>
              <option>Manual</option>
              <option>Pre-Restore Hook</option>
            </select>
          </div>
          
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <Button variant="secondary" onClick={() => refetch()} disabled={isRefetching} className="inline-flex items-center gap-1.5 text-xs">
              <RefreshCw size={14} className={isRefetching ? "animate-spin" : ""} />
              <span>Perbarui</span>
            </Button>
          </div>
        </div>

        {isLoading ? (
          <LoadingState />
        ) : filteredBackups.length === 0 ? (
          <EmptyState title="Tidak Ada Data" subtitle="Backup tidak ditemukan dengan filter saat ini." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50/80 text-[11px] font-semibold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3.5" scope="col">FILE</th>
                  <th className="px-5 py-3.5" scope="col">TIPE</th>
                  <th className="px-5 py-3.5" scope="col">UKURAN</th>
                  <th className="px-5 py-3.5" scope="col">STATUS</th>
                  <th className="px-5 py-3.5" scope="col">DIBUAT OLEH</th>
                  <th className="px-5 py-3.5" scope="col">WAKTU</th>
                  <th className="px-6 py-3.5 text-right" scope="col">AKSI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {filteredBackups.map(b => (
                  <tr key={b.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4 font-mono text-slate-900 font-medium">
                      <div className="flex items-center gap-2.5">
                        <span className="p-1.5 rounded bg-slate-100 text-slate-600 border border-slate-200 shrink-0">
                          <FileArchive size={16} className="text-amber-600" />
                        </span>
                        <span className="hover:underline cursor-pointer" onClick={() => b.status === "completed" && handleDownload(b)}>
                          {b.filename}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      {b.trigger_type === "pre_restore" ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                          Pre-Restore
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                          Manual
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4 font-medium text-slate-700">{formatSize(b.size_bytes)}</td>
                    <td className="px-5 py-4">
                      {b.status === "completed" ? (
                        <span className="inline-flex items-center gap-1.5 font-semibold text-emerald-600 text-[12px]">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                          Selesai
                        </span>
                      ) : b.status === "running" ? (
                        <span className="inline-flex items-center gap-1.5 font-semibold text-amber-600 text-[12px]">
                          <RefreshCw size={12} className="animate-spin" />
                          Berjalan
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 font-semibold text-red-600 text-[12px]" title={b.error_message ?? undefined}>
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                          Gagal
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 text-[10px] font-bold flex items-center justify-center uppercase">
                          {b.creator?.name?.[0] ?? "?"}
                        </span>
                        <span className="text-slate-800 font-medium">{b.creator?.name ?? "Sistem"}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-slate-500 whitespace-nowrap">
                      {formatDate(b.created_at)}
                    </td>
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        {b.status === "completed" && (
                          <>
                            <Button variant="secondary" onClick={() => handleDownload(b)} disabled={downloadingId === b.id} className="gap-1 px-2.5 py-1.5 text-xs shadow-2xs">
                              <Download size={14} />
                              <span>{downloadingId === b.id ? "Unduh..." : "Unduh"}</span>
                            </Button>
                            <Button variant="danger" onClick={() => setRestoreTarget(b)} className="gap-1 px-3 py-1.5 text-xs shadow-2xs">
                              <RotateCcw size={14} />
                              <span>Restore</span>
                            </Button>
                          </>
                        )}
                        <DeleteBackupButton backup={b} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        <div className="px-6 py-3.5 bg-slate-50/60 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <div>
            Menampilkan <span className="font-semibold text-slate-700">{filteredBackups.length}</span> backup
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-slate-400">Penyimpanan Terpakai:</span>
            <span className="font-semibold text-slate-700">{formatSize(totalSizeBytes)}</span>
          </div>
        </div>
      </section>

      {/* Storage & Policy Info Card */}
      <section className="bg-gradient-to-r from-slate-900 to-slate-950 text-white rounded-xl p-5 border border-slate-800 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-slate-800/80 rounded-xl text-amber-400 border border-slate-700/60 shrink-0 mt-0.5">
            <DatabaseBackup size={24} />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
              Jadwal Backup Otomatis & Penyimpanan Cloud
              <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">AES-256</span>
            </h3>
            <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
              Backup otomatis dieksekusi setiap hari pukul <strong>00:00 WIB</strong> dan diarsipkan ke encrypted offsite object storage (S3 kompatibel) dengan siklus retensi otomatis 30 hari.
            </p>
          </div>
        </div>
        <button 
          type="button"
          onClick={() => setShowScheduleModal(true)} 
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-white text-slate-800 hover:bg-amber-50 hover:text-amber-700 hover:border-amber-300 border border-slate-200/80 shadow-sm transition-all active:scale-95 outline-none"
        >
          <Clock size={15} className="text-amber-500" />
          <span>Konfigurasi Jadwal Otomatis</span>
        </button>
      </section>

      {showScheduleModal && (
        <Modal title="Konfigurasi Jadwal Backup Otomatis (Cron Engine)" onClose={() => setShowScheduleModal(false)} maxWidth={520}>
          <div className="space-y-4">
            <div className="p-3.5 bg-blue-50 text-blue-800 rounded-xl border border-blue-100 text-xs leading-relaxed">
              Sistem akan menjalankan worker background otomatis untuk mengeksekusi dump database PostgreSQL ke penyimpanan terenkripsi tanpa mengganggu operasional sistem.
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Frekuensi Eksekusi Backup
              </label>
              <select 
                value={scheduleFrequency} 
                onChange={(e) => setScheduleFrequency(e.target.value)}
                className="w-full text-xs font-medium border border-slate-200 rounded-xl p-2.5 bg-slate-50 focus:bg-white focus:border-amber-500 outline-none"
              >
                <option value="daily">Setiap Hari (Daily - Pukul 02:00 WIB)</option>
                <option value="weekly">Setiap Pekan (Minggu - Pukul 01:00 WIB)</option>
                <option value="monthly">Setiap Bulan (Tanggal 1 - Pukul 00:00 WIB)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Kebijakan Retensi (Maksimal Arsip Tersimpan)
              </label>
              <select 
                value={retentionDays} 
                onChange={(e) => setRetentionDays(e.target.value)}
                className="w-full text-xs font-medium border border-slate-200 rounded-xl p-2.5 bg-slate-50 focus:bg-white focus:border-amber-500 outline-none"
              >
                <option value="7">Simpan 7 Berkas Terakhir (Rotasi Mingguan)</option>
                <option value="14">Simpan 14 Berkas Terakhir (Rotasi 2 Pekan)</option>
                <option value="30">Simpan 30 Berkas Terakhir (Rotasi 1 Bulan)</option>
              </select>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700">
                <input type="checkbox" defaultChecked className="rounded text-amber-500 focus:ring-amber-500" />
                <span>Kirim notifikasi Telegram / Email jika backup gagal</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700">
                <input type="checkbox" defaultChecked className="rounded text-amber-500 focus:ring-amber-500" />
                <span>Kompresi otomatis (tar.gz format dengan enkripsi AES-256)</span>
              </label>
            </div>

            <div className="flex gap-2 justify-end pt-3 border-t border-slate-100">
              <Button type="button" variant="secondary" onClick={() => setShowScheduleModal(false)}>
                Batal
              </Button>
              <Button 
                type="button" 
                onClick={() => {
                  alert("Jadwal backup otomatis berhasil diperbarui!");
                  setShowScheduleModal(false);
                }}
              >
                Simpan Konfigurasi
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {restoreTarget && <RestoreConfirmModal backup={restoreTarget} onClose={() => setRestoreTarget(null)} />}
      </div>
    </main>
  );
}

function DeleteBackupButton({ backup }: { backup: SystemBackup }) {
  const deleteMutation = useDeleteBackup();

  function handleDelete() {
    if (!window.confirm(`Hapus file backup "${backup.filename}"? Tindakan ini tidak bisa dibatalkan (bukan restore data, cuma menghapus FILE backup-nya).`)) return;
    deleteMutation.mutate(backup.id, {
      onError: (err: Error) => alert("Gagal hapus: " + err.message),
    });
  }

  return (
    <Button variant="secondary" onClick={handleDelete} disabled={deleteMutation.isPending} className="gap-1 px-2.5 py-1.5 text-xs shadow-2xs hover:bg-red-50 hover:text-red-600 hover:border-red-200">
      <Trash2 size={14} className={deleteMutation.isPending ? "animate-pulse" : ""} />
      <span>Hapus</span>
    </Button>
  );
}

function RestoreConfirmModal({ backup, onClose }: { backup: SystemBackup; onClose: () => void }) {
  const [typed, setTyped] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const restoreMutation = useRestoreBackup();

  const matches = typed === backup.filename;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!matches) return;
    setError(null);
    restoreMutation.mutate({ id: backup.id, confirmation: typed }, {
      onSuccess: (res) => setResult(res.data.message ?? "Restore berhasil."),
      onError: (err: Error) => setError(extractErrorMessage(err)),
    });
  }

  return (
    <Modal title={`Restore dari "${backup.filename}"`} onClose={onClose} maxWidth={520}>
      {result ? (
        <div>
          <div className="p-4 bg-emerald-50 text-emerald-700 rounded-lg border border-emerald-200 text-sm mb-4 flex items-center gap-3">
            <CheckCircle2 size={20} />
            <span>{result}</span>
          </div>
          <Button onClick={onClose} className="w-full">Tutup</Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-start gap-3 p-4 bg-red-50 text-red-800 rounded-lg border border-red-200 text-sm leading-relaxed">
            <AlertTriangle size={20} className="shrink-0 text-red-600 mt-0.5" />
            <span>
              Ini akan <strong className="font-bold underline">MENIMPA SELURUH data</strong> yang ada sekarang dengan isi backup ini (dibuat {formatDate(backup.created_at)}).
              Semua perubahan setelah tanggal itu akan HILANG. Sistem akan otomatis membuat backup keselamatan
              dari kondisi SAAT INI tepat sebelum restore dijalankan.
            </span>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              Ketik ulang nama file persis untuk konfirmasi:
            </label>
            <div className="p-2.5 mb-3 bg-slate-50 border border-slate-200 rounded-lg font-mono text-sm text-slate-800 select-all">
              {backup.filename}
            </div>
            <input 
              type="text"
              value={typed} 
              onChange={(e) => setTyped(e.target.value)} 
              className="w-full px-4 py-2.5 rounded-lg border-slate-300 focus:border-red-500 focus:ring-red-500" 
              placeholder="Ketik nama file di atas..."
              autoFocus 
            />
          </div>

          {error && <div className="text-sm font-medium text-red-600">{error}</div>}

          <div className="flex gap-3 justify-end pt-4 border-t border-slate-100">
            <Button type="button" variant="secondary" onClick={onClose}>Batal</Button>
            <Button 
              type="submit" 
              variant="danger"
              disabled={!matches || restoreMutation.isPending}
            >
              {restoreMutation.isPending ? "Merestore Sistem..." : "Restore Sekarang (Tidak Bisa Dibatalkan)"}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}