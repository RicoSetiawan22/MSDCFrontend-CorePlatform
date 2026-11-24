import { PageHeader } from "@shared/components/PageHeader";
import { useState, useEffect } from "react";
import { useAuth } from "@shared/lib/auth-context";
import { LoadingState } from "@shared/components/LoadingState";
import { EmptyState } from "@shared/components/EmptyState";
import { Modal } from "@shared/components/Modal";
import { Pagination } from "@shared/components/Pagination";
import { Button } from "@shared/components/Button";
import { extractErrorMessage } from "@shared/types/api";
import { 
  useQueueStatus, usePendingJobs, useFailedJobs, 
  useRetryJob, useRetryAllJobs, useForgetJob, useFlushFailedJobs 
} from "../api/useQueue";
import type { FailedJob } from "../types/queue";

// Helper Functions
const STALE_WARNING_SECONDS = 5 * 60; // 5 Menit

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds} detik`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} menit`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} jam ${minutes % 60} menit`;
  const days = Math.floor(hours / 24);
  return `${days} hari ${hours % 24} jam`;
}

function shortJobName(jobName: string | null): string {
  if (!jobName) return "—";
  const parts = jobName.split("\\");
  return parts[parts.length - 1];
}

type Tab = "pending" | "failed" | "completed";

export function QueueMonitorPage() {
  const { hasPermission } = useAuth();
  const canView = hasPermission("queue.view");
  const canManage = hasPermission("queue.manage");
  
  const [tab, setTab] = useState<Tab>("pending");
  const [page, setPage] = useState(1);
  const [detailJob, setDetailJob] = useState<FailedJob | null>(null);
  const [search, setSearch] = useState("");
  const [filterQueue, setFilterQueue] = useState("all");

  const { data: status, refetch: refetchStatus } = useQueueStatus();
  const { data: pending, isLoading: pendingLoading, refetch: refetchPending, isRefetching: refetchingP } = usePendingJobs({ per_page: 20, page: tab === "pending" ? page : 1 });
  const { data: failed, isLoading: failedLoading, refetch: refetchFailed, isRefetching: refetchingF } = useFailedJobs({ per_page: 20, page: tab === "failed" ? page : 1 });

  const retryAllMutation = useRetryAllJobs();
  const flushMutation = useFlushFailedJobs();

  // Auto-refresh timer state (10s)
  const [timer, setTimer] = useState(10);
  useEffect(() => {
    const interval = setInterval(() => {
      setTimer(prev => {
        if (prev <= 1) {
          handleRefresh();
          return 10;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [tab]); // eslint-disable-line

  function handleRefresh() {
    refetchStatus();
    if (tab === "pending") refetchPending();
    if (tab === "failed") refetchFailed();
    setTimer(10);
  }

  async function handleRetryAll() {
    if (!window.confirm("Jalankan / Retry ulang semua failed job?")) return;
    try {
      await retryAllMutation.mutateAsync();
      handleRefresh();
    } catch (err) {
      alert("Gagal retry semua: " + extractErrorMessage(err));
    }
  }

  async function handleFlush() {
    if (!window.confirm("PERINGATAN: Kosongkan permanen semua catatan failed job? Tindakan ini tidak bisa dibatalkan.")) return;
    try {
      await flushMutation.mutateAsync();
      handleRefresh();
    } catch (err) {
      alert("Gagal purge: " + extractErrorMessage(err));
    }
  }

  if (!canView) {
    return (
      <main className="p-8 max-w-7xl w-full mx-auto">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200">
          <EmptyState title="Akses Ditolak" subtitle="Anda tidak punya izin (queue.view) untuk membuka halaman ini." />
        </div>
      </main>
    );
  }

  // Cek apakah ada job yang nyangkut (Worker mati)
  const oldestPending = pending?.data?.[0];
  const isWorkerStuck = oldestPending && oldestPending.age_seconds > STALE_WARNING_SECONDS;

  // Cek jika filter diterapkan
  const filteredPending = pending?.data?.filter(j => 
    (filterQueue === "all" || j.queue === filterQueue) &&
    (search === "" || (j.job_name?.toLowerCase() || "").includes(search.toLowerCase()))
  ) || [];

  return (
    <main className="w-full bg-slate-50 min-h-screen">
      <PageHeader
        title="Queue Monitoring"
        subtitle="Pantau pipeline background job, daemon worker, status failed jobs, dan antrean pemrosesan."
      />
      <div className="px-7 py-5 space-y-6">
      {/* Dynamic Notification Bar / Quick Banner */}
      <div className="mb-6 bg-amber-50 rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shadow-sm border border-amber-100">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-orange-500 text-white flex items-center justify-center flex-shrink-0 shadow-sm font-bold">✓</div>
          <div>
            <p className="text-xs font-bold text-slate-800">Daemon Pipeline Aktif</p>
            <p className="text-[11px] text-slate-500 font-medium">Sistem auto-flush failed jobs disinkronkan otomatis sesuai jadwal cron server.</p>
          </div>
        </div>
        <div className="flex items-center gap-2 self-end md:self-auto">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-white text-slate-700 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Zero Error Threshold
          </span>
        </div>
      </div>

      {/* Header Section with Live Status & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 pb-6">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 font-headline">Queue Monitoring</h1>
            <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 font-bold text-[11px] px-2.5 py-0.5 rounded-full shadow-sm border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
              Live Worker Checked
            </span>
          </div>
          <p className="text-slate-500 text-xs max-w-2xl leading-relaxed">
            Pantau job antrean background — pending, gagal, dan status worker daemon terdistribusi secara real-time.
          </p>
        </div>
        
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl text-[11px] text-slate-500 font-medium shadow-sm border border-slate-200">
            <span>Auto-refresh <strong className="font-mono text-slate-800 font-semibold">{timer}s</strong></span>
          </div>
          <Button onClick={handleRefresh} disabled={refetchingP || refetchingF}>
            {refetchingP || refetchingF ? "Memperbarui..." : "Refresh Sekarang"}
          </Button>
        </div>
      </div>

      {/* KPI Metrics Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-3">Driver Queue</div>
          <div className="text-xl font-extrabold font-mono text-slate-800">database</div>
          <div className="text-[11px] text-slate-500 mt-1">SQL Engine via PostgreSQL</div>
        </div>

        <div className="bg-gradient-to-b from-white to-amber-50/30 rounded-2xl p-5 shadow-sm border border-amber-200 hover:shadow-md transition-shadow">
          <div className="text-[11px] font-bold uppercase tracking-wider text-amber-700 mb-3">Pending Jobs</div>
          <div className="text-3xl font-extrabold text-amber-600">{status?.pending_jobs ?? 0}</div>
          <div className="text-[11px] text-amber-700 font-medium mt-1">Antrean aktif tertahan</div>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-3">Failed Jobs</div>
          <div className="text-3xl font-extrabold text-emerald-600">{(status?.failed_jobs ?? 0)}</div>
          <div className="text-[11px] text-slate-500 font-medium mt-1">
            {(status?.failed_jobs ?? 0) === 0 ? "Normal / Bersih" : "Perlu Perhatian"}
          </div>
        </div>

        <div className={`bg-gradient-to-b from-white ${isWorkerStuck ? 'to-rose-50/30 border-rose-200' : 'to-emerald-50/30 border-emerald-200'} rounded-2xl p-5 shadow-sm border hover:shadow-md transition-shadow`}>
          <div className={`text-[11px] font-bold uppercase tracking-wider ${isWorkerStuck ? 'text-rose-600' : 'text-emerald-600'} mb-3`}>Status Worker</div>
          <div className={`text-xl font-extrabold flex items-center gap-2 ${isWorkerStuck ? 'text-rose-700' : 'text-emerald-700'}`}>
            {isWorkerStuck ? "Macet / Mati" : "Siap / Running"}
            <span className={`w-2.5 h-2.5 rounded-full ${isWorkerStuck ? 'bg-rose-500' : 'bg-emerald-500'}`}></span>
          </div>
          <div className="text-[11px] font-medium text-slate-500 mt-1">
            {isWorkerStuck ? "Worker tidak memproses job" : "Daemon process berjalan normal"}
          </div>
        </div>
      </div>

      {/* Warning Banner for Stuck Queue */}
      {isWorkerStuck && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50/60 p-5 shadow-sm mb-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="space-y-1">
                <h2 className="text-sm font-bold text-rose-900 flex items-center gap-1.5">
                  Worker queue kemungkinan macet / mati
                </h2>
                <p className="text-xs text-rose-700 leading-relaxed">
                  Job tertua sudah menunggu <strong className="font-bold text-rose-900">{formatDuration(oldestPending.age_seconds)}</strong> tanpa diambil. Pastikan proses <code className="font-mono bg-rose-100/90 text-rose-800 px-2 py-0.5 rounded text-[11px] border border-rose-200 font-semibold">php artisan queue:work</code> aktif dan berjalan di server.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Queue Jobs Management Section */}
      <div className="space-y-6">
        {/* Navigation Tabs */}
        <div className="bg-white rounded-2xl p-1.5 shadow-sm border border-slate-200 flex items-center gap-2">
          <button onClick={() => { setTab("pending"); setPage(1); }} className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl transition-all ${tab === "pending" ? "bg-orange-50/90 text-orange-600 shadow-sm border border-orange-100" : "text-slate-600 hover:bg-slate-100/70"}`}>
            <span>Pending</span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${tab === "pending" ? "bg-orange-500 text-white" : "bg-slate-200/80 text-slate-700"}`}>
              {status?.pending_jobs ?? 0}
            </span>
          </button>
          
          <button onClick={() => { setTab("failed"); setPage(1); }} className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl transition-all ${tab === "failed" ? "bg-orange-50/90 text-orange-600 shadow-sm border border-orange-100" : "text-slate-600 hover:bg-slate-100/70"}`}>
            <span>Failed Jobs</span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${tab === "failed" ? "bg-orange-500 text-white" : "bg-slate-200/80 text-slate-700"}`}>
              {status?.failed_jobs ?? 0}
            </span>
          </button>
        </div>

        {/* Content Area */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col">
          
          {/* Toolbar PENDING */}
          {tab === "pending" && (
            <div className="p-4 bg-slate-50/60 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex flex-1 items-center gap-3">
                <input type="text" placeholder="Cari job class..." value={search} onChange={e => setSearch(e.target.value)} className="w-full max-w-sm px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500" />
                <select value={filterQueue} onChange={e => setFilterQueue(e.target.value)} className="bg-white border border-slate-200 text-slate-700 text-xs rounded-lg py-1.5 px-2.5 focus:outline-none focus:border-orange-500">
                  <option value="all">Semua Queue</option>
                  <option value="default">default</option>
                  <option value="high">high</option>
                  <option value="low">low</option>
                </select>
              </div>
            </div>
          )}

          {/* Toolbar FAILED */}
          {tab === "failed" && canManage && (status?.failed_jobs ?? 0) > 0 && (
            <div className="p-4 bg-slate-50/60 border-b border-slate-200 flex flex-col md:flex-row items-center justify-end gap-3">
              <Button variant="secondary" onClick={handleRetryAll} disabled={retryAllMutation.isPending}>Jalankan / Retry Semua</Button>
              <Button variant="danger" onClick={handleFlush} disabled={flushMutation.isPending}>Purge / Kosongkan Hapus Semua</Button>
            </div>
          )}

          {/* Pending Table */}
          {tab === "pending" && (
            <div className="overflow-x-auto">
              {pendingLoading && <LoadingState />}
              {!pendingLoading && filteredPending.length === 0 && (
                <EmptyState title="Tidak Ada Pending Job" subtitle="Semua tugas berjalan dengan baik." />
              )}
              {!pendingLoading && filteredPending.length > 0 && (
                <>
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50/70 border-b border-slate-200 text-[11px] font-extrabold tracking-wider uppercase text-slate-500">
                      <tr>
                        <th className="py-3.5 px-6">DETAIL JOB</th>
                        <th className="py-3.5 px-4">QUEUE</th>
                        <th className="py-3.5 px-4">PERCOBAAN</th>
                        <th className="py-3.5 px-4">WAKTU TERTUNDA</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      {filteredPending.map(job => (
                        <tr key={job.id} className={job.age_seconds > STALE_WARNING_SECONDS ? "bg-rose-50/40" : "hover:bg-slate-50"}>
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-slate-900 text-xs">{shortJobName(job.job_name)}</span>
                            </div>
                            <div className="text-[11px] text-slate-500 font-mono mt-0.5">{job.job_name}</div>
                          </td>
                          <td className="py-4 px-4"><span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">{job.queue}</span></td>
                          <td className="py-4 px-4 font-semibold text-slate-700">{job.attempts}x</td>
                          <td className="py-4 px-4">
                            <span className={`inline-flex items-center font-bold px-2 py-1 rounded-md border ${job.age_seconds > STALE_WARNING_SECONDS ? "bg-rose-50 text-rose-600 border-rose-200" : "bg-slate-50 text-slate-600 border-slate-200"}`}>
                              {formatDuration(job.age_seconds)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <Pagination currentPage={pending!.current_page} lastPage={pending!.last_page} total={pending!.total} onPageChange={setPage} />
                </>
              )}
            </div>
          )}

          {/* Failed Table / Empty State Showcase */}
          {tab === "failed" && (
            <div className="overflow-x-auto">
              {failedLoading && <LoadingState />}
              {!failedLoading && (failed?.data?.length ?? 0) === 0 ? (
                /* Elegant Empty State (Dikutip penuh dari HTML Anda) */
                <div className="bg-white p-10 md:p-14 text-center relative overflow-hidden flex flex-col items-center">
                  <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 bg-gradient-to-b from-emerald-100/40 to-transparent rounded-full blur-3xl pointer-events-none"></div>
                  <div className="relative mb-6 z-10">
                    <div className="w-24 h-24 rounded-3xl bg-slate-50 flex items-center justify-center shadow-inner relative group border border-emerald-100">
                      <span className="text-4xl text-emerald-500 font-bold">✓</span>
                    </div>
                  </div>
                  <div className="max-w-xl mx-auto space-y-3 relative z-10">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 rounded-full text-[11px] font-bold text-emerald-600 uppercase tracking-wider border border-emerald-100">
                      Semua Job Berhasil & Bersih
                    </div>
                    <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight font-headline">Tidak Ada Failed Job</h2>
                    <p className="text-slate-500 text-xs md:text-sm leading-relaxed font-normal">
                      Semua antrean background dieksekusi tanpa kegagalan atau exception unhandled. Jika terdapat job yang gagal dieksekusi berulang kali melampaui batas toleransi (max-tries), log stack trace dan tombol retry manual akan muncul di sini.
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50/70 border-b border-slate-200 text-[11px] font-extrabold tracking-wider uppercase text-slate-500">
                      <tr>
                        <th className="py-3.5 px-6">JOB CLASS</th>
                        <th className="py-3.5 px-4">QUEUE</th>
                        <th className="py-3.5 px-4">ERROR / ROOT CAUSE</th>
                        <th className="py-3.5 px-4">WAKTU GAGAL</th>
                        <th className="py-3.5 px-6 text-right">AKSI</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      {failed?.data.map((job) => (
                        <FailedJobRow key={job.id} job={job} canManage={canManage} onViewDetail={() => setDetailJob(job)} onRefresh={handleRefresh} />
                      ))}
                    </tbody>
                  </table>
                  <Pagination currentPage={failed!.current_page} lastPage={failed!.last_page} total={failed!.total} onPageChange={setPage} />
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {detailJob && <ExceptionDetailModal job={detailJob} onClose={() => setDetailJob(null)} />}
      </div>
    </main>
  );
}

// Komponen Baris Failed Job - Menggunakan Global Button
function FailedJobRow({ job, canManage, onViewDetail, onRefresh }: { job: FailedJob; canManage: boolean; onViewDetail: () => void, onRefresh: () => void }) {
  const retryMutation = useRetryJob();
  const forgetMutation = useForgetJob();

  async function handleRetry() {
    try {
      await retryMutation.mutateAsync(job.uuid);
      onRefresh();
    } catch (err) {
      alert("Gagal retry: " + extractErrorMessage(err));
    }
  }

  async function handleForget() {
    if (!window.confirm("Hapus catatan failed job ini? Tidak bisa dibatalkan.")) return;
    try {
      await forgetMutation.mutateAsync(job.uuid);
      onRefresh();
    } catch (err) {
      alert("Gagal hapus: " + extractErrorMessage(err));
    }
  }

  return (
    <tr className="hover:bg-slate-50 transition-colors">
      <td className="py-4 px-6 font-mono font-bold text-slate-900 text-xs" title={job.job_name ?? undefined}>
        {shortJobName(job.job_name)}
        <div className="font-normal text-[10px] text-slate-400 mt-1 truncate max-w-xs">{job.job_name}</div>
      </td>
      <td className="py-4 px-4"><span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">{job.queue}</span></td>
      <td className="py-4 px-4">
        <span className="text-slate-600 font-medium truncate max-w-xs block" title={job.exception_summary ?? undefined}>
          {job.exception_summary ?? "—"}
        </span>
      </td>
      <td className="py-4 px-4 text-slate-500 font-mono text-[11px]">{job.failed_at}</td>
      <td className="py-4 px-6 text-right">
        <div className="inline-flex items-center justify-end gap-1.5">
          <Button variant="secondary" onClick={onViewDetail} className="text-[10px] px-2 py-1">Detail</Button>
          {canManage && (
            <>
              <Button variant="primary" onClick={handleRetry} disabled={retryMutation.isPending} className="text-[10px] px-2 py-1">Jalankan</Button>
              <Button variant="danger" onClick={handleForget} disabled={forgetMutation.isPending} className="text-[10px] px-2 py-1">Hapus</Button>
            </>
          )}
        </div>
      </td>
    </tr>
  );
}

function ExceptionDetailModal({ job, onClose }: { job: FailedJob; onClose: () => void }) {
  return (
    <Modal title={shortJobName(job.job_name)} onClose={onClose} maxWidth={800}>
      <div className="text-xs text-slate-500 mb-3 font-semibold bg-slate-50 px-3 py-2 rounded-lg border border-slate-200">
        Queue: <span className="text-slate-800">{job.queue}</span> — Gagal pada <span className="text-slate-800">{job.failed_at}</span>
      </div>
      <pre className="bg-slate-900 text-slate-300 p-4 rounded-xl text-[11px] max-h-96 overflow-auto whitespace-pre-wrap word-break-all shadow-inner">
        {job.exception}
      </pre>
      <div className="mt-4 flex justify-end">
        <Button variant="secondary" onClick={onClose}>Tutup Detail</Button>
      </div>
    </Modal>
  );
}