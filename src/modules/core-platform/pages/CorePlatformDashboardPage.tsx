import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Users,
  Clock,
  CheckCircle2,
  FileText,
  Database,
  Activity,
  AlertTriangle,
  RefreshCw,
  ArrowRight,
  ShieldCheck,
  Send,
  Layers,
  ExternalLink,
  ChevronRight,
  BarChart3,
  PieChart as PieIcon,
  BellRing,
} from "lucide-react";
import { PageHeader } from "@shared/components/PageHeader";
import { LoadingState } from "@shared/components/LoadingState";
import { formatDate } from "@shared/lib/format";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { useCoreDashboardSummary, useRemindApprover } from "../api/useCoreDashboard";

const MODULE_COLORS = ["#0A2140", "#0284c7", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899"];

export function CorePlatformDashboardPage() {
  const { data: summary, isLoading, isError, refetch, isFetching } = useCoreDashboardSummary();
  const remindMutation = useRemindApprover();
  const [remindedIds, setRemindedIds] = useState<number[]>([]);

  function handleRemind(instanceId: number, approverUserId?: number | null) {
    remindMutation.mutate(
      { instanceId, approverUserId },
      {
        onSuccess: () => {
          setRemindedIds((prev) => [...prev, instanceId]);
        },
      }
    );
  }

  if (isLoading && !summary) {
    return (
      <div className="min-h-screen bg-[#F8FAFC]">
        <PageHeader
          title="Core Platform Overview"
          subtitle="Pusat kendali birokrasi, alur persetujuan, manajemen pengguna & integritas sistem"
        />
        <div className="px-6 py-12 max-w-7xl mx-auto">
          <LoadingState label="Memuat metrik dan ringkasan Core Platform..." />
        </div>
      </div>
    );
  }

  if (isError || !summary) {
    return (
      <div className="min-h-screen bg-[#F8FAFC]">
        <PageHeader
          title="Core Platform Overview"
          subtitle="Pusat kendali birokrasi, alur persetujuan, manajemen pengguna & integritas sistem"
        />
        <div className="px-6 py-12 max-w-7xl mx-auto">
          <div className="bg-white rounded-2xl border border-rose-200 p-8 text-center max-w-lg mx-auto shadow-sm">
            <AlertTriangle size={48} className="text-rose-500 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-800">Gagal Memuat Dashboard</h3>
            <p className="text-xs text-slate-500 mt-1 mb-5">
              Terjadi kendala saat menghubungkan ke endpoint ringkasan Core Platform.
            </p>
            <button
              onClick={() => refetch()}
              className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800 transition"
            >
              Coba Muat Ulang
            </button>
          </div>
        </div>
      </div>
    );
  }

  const { system_status, kpis, charts, bottlenecks, recent_audits } = summary;

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-16 font-sans text-slate-800">
      {/* ── 1. Page Header ── */}
      <PageHeader
        title="Core Platform Overview"
        subtitle="Pusat kendali birokrasi, alur persetujuan, manajemen pengguna & integritas sistem"
      />

      <div className="px-6 py-6 max-w-7xl mx-auto space-y-6">
        {/* ── 2. Top System Health Banner ── */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div
              className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${
                system_status.is_healthy
                  ? "bg-emerald-50 text-emerald-600 border border-emerald-200/60"
                  : "bg-amber-50 text-amber-600 border border-amber-200/60"
              }`}
            >
              <Activity size={22} className={system_status.is_healthy ? "animate-pulse" : ""} />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-slate-900">{system_status.status_label}</span>
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    system_status.is_healthy
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-amber-100 text-amber-800"
                  }`}
                >
                  {system_status.environment.toUpperCase()}
                </span>
              </div>
              <div className="text-xs text-slate-500 mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1">
                <span>
                  Backup:{" "}
                  <strong className="text-slate-700">
                    {system_status.last_backup_time ? formatDate(system_status.last_backup_time) : "Belum Ada"}
                  </strong>{" "}
                  {system_status.last_backup_size_mb ? `(${system_status.last_backup_size_mb} MB)` : ""}
                </span>
                <span>•</span>
                <span>
                  Worker Queue:{" "}
                  <strong className="text-slate-700">
                    {system_status.queue_pending_jobs} Job Antre, {system_status.queue_failed_jobs} Gagal
                  </strong>
                </span>
                <span>•</span>
                <span>PHP {system_status.php_version}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto">
            <button
              onClick={() => refetch()}
              disabled={isFetching}
              title="Perbarui data"
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition"
            >
              <RefreshCw size={13} className={isFetching ? "animate-spin" : ""} />
              <span>{isFetching ? "Menyinkronkan..." : "Sinkronkan"}</span>
            </button>
            <Link
              to="/core-platform/my-approvals"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-sm transition"
            >
              <span>Meja Approval</span>
              <ArrowRight size={13} />
            </Link>
          </div>
        </div>

        {/* ── 3. 6 KPI Cards Grid ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5">
          {/* Card 1: Pending Approvals */}
          <Link
            to="/core-platform/my-approvals"
            className="group bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm hover:shadow-md hover:border-amber-400 transition-all flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Antrean Approval</span>
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Clock size={16} />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-black text-slate-900 tracking-tight">{kpis.pending_approvals}</div>
              <div className="mt-1 text-[11px] font-medium">
                {kpis.overdue_approvals > 0 ? (
                  <span className="text-rose-600 font-semibold">{kpis.overdue_approvals} Melewati SLA (&gt;3h)</span>
                ) : (
                  <span className="text-emerald-600 font-semibold">Tepat Waktu (SLA Terjaga)</span>
                )}
              </div>
            </div>
          </Link>

          {/* Card 2: Approved Workflows */}
          <Link
            to="/core-platform/status-approval"
            className="group bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm hover:shadow-md hover:border-emerald-400 transition-all flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Selesai Disetujui</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                <CheckCircle2 size={16} />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-black text-slate-900 tracking-tight">{kpis.approved_approvals}</div>
              <div className="mt-1 text-[11px] font-medium text-slate-500">
                <span>{kpis.rejected_approvals} Dokumen Ditolak</span>
              </div>
            </div>
          </Link>

          {/* Card 3: Persuratan Bulan Ini */}
          <Link
            to="/core-platform/surat-keluar"
            className="group bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm hover:shadow-md hover:border-blue-400 transition-all flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Surat Bulan Ini</span>
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                <FileText size={16} />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-black text-slate-900 tracking-tight">{kpis.documents_this_month}</div>
              <div className="mt-1 text-[11px] font-medium text-blue-700">
                <span>{kpis.documents_signed} Sah Bertanda Tangan</span>
              </div>
            </div>
          </Link>

          {/* Card 4: User & Security 2FA */}
          <Link
            to="/core-platform/users"
            className="group bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm hover:shadow-md hover:border-indigo-400 transition-all flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Pengguna Aktif</span>
              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Users size={16} />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-black text-slate-900 tracking-tight">
                {kpis.active_users} <span className="text-xs text-slate-400 font-semibold">/ {kpis.total_users}</span>
              </div>
              <div className="mt-1 text-[11px] font-medium text-emerald-600 flex items-center gap-1">
                <ShieldCheck size={12} />
                <span>{kpis.two_factor_rate}% 2FA Aktif</span>
              </div>
            </div>
          </Link>

          {/* Card 5: Background Jobs Queue */}
          <Link
            to="/core-platform/queue"
            className="group bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm hover:shadow-md hover:border-purple-400 transition-all flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Queue Worker</span>
              <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Layers size={16} />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-black text-slate-900 tracking-tight">{kpis.active_queue_jobs}</div>
              <div className="mt-1 text-[11px] font-medium text-slate-500">
                {kpis.failed_queue_jobs === 0 ? (
                  <span className="text-emerald-600 font-semibold">0 Failed Jobs</span>
                ) : (
                  <span className="text-rose-600 font-semibold">{kpis.failed_queue_jobs} Gagal</span>
                )}
              </div>
            </div>
          </Link>

          {/* Card 6: Backup Snapshot */}
          <Link
            to="/core-platform/system-backups"
            className="group bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm hover:shadow-md hover:border-cyan-400 transition-all flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Snapshot Backup</span>
              <div className="w-8 h-8 rounded-lg bg-cyan-50 text-cyan-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Database size={16} />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-black text-slate-900 tracking-tight">
                {system_status.last_backup_size_mb ? `${system_status.last_backup_size_mb} MB` : "Ready"}
              </div>
              <div className="mt-1 text-[11px] font-medium text-cyan-700">
                <span>Database & File Storage</span>
              </div>
            </div>
          </Link>
        </div>

        {/* ── 4. Charts Section: Trend & Distribution ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Bar Chart: Workflow Volume Trend */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <BarChart3 size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Tren Volume Alur Kerja (Workflow)</h3>
                  <p className="text-[11px] text-slate-500">Volume pengajuan, persetujuan, dan penolakan 6 bulan terakhir</p>
                </div>
              </div>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={charts.workflow_trend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="period" tick={{ fontSize: 11, fill: "#64748B" }} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "#64748B" }} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0F172A",
                      borderColor: "#1E293B",
                      borderRadius: "12px",
                      color: "#FFFFFF",
                      fontSize: "12px",
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} />
                  <Bar dataKey="initiated" name="Diajukan" fill="#6366F1" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="approved" name="Disetujui" fill="#10B981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="rejected" name="Ditolak" fill="#F43F5E" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Pie Chart: Module Distribution */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2.5 mb-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <PieIcon size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Sebaran Alur per Modul</h3>
                  <p className="text-[11px] text-slate-500">Proporsi dokumen berdasarkan asal modul</p>
                </div>
              </div>

              <div className="h-48 w-full mt-2">
                {charts.module_distribution.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={charts.module_distribution}
                        dataKey="count"
                        nameKey="label"
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={70}
                        paddingAngle={3}
                      >
                        {charts.module_distribution.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={MODULE_COLORS[index % MODULE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#0F172A",
                          borderRadius: "10px",
                          fontSize: "11px",
                          color: "#fff",
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-xs text-slate-400">
                    Belum ada data distribusi alur kerja
                  </div>
                )}
              </div>
            </div>

            <div className="mt-3 space-y-1.5 pt-3 border-t border-slate-100">
              {charts.module_distribution.map((item, idx) => (
                <div key={item.module} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 truncate">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: MODULE_COLORS[idx % MODULE_COLORS.length] }}
                    />
                    <span className="text-slate-600 truncate">{item.label}</span>
                  </div>
                  <strong className="text-slate-900">{item.count}</strong>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── 5. Bottom Section: Approval Bottlenecks & Security Audits ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Panel Kiri: Approval Bottleneck & SLA Tracker */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
                  <BellRing size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Hambatan Antrean Persetujuan (Bottlenecks)</h3>
                  <p className="text-[11px] text-slate-500">Dokumen yang paling lama menunggu tindakan approver</p>
                </div>
              </div>
              <Link
                to="/core-platform/status-approval"
                className="text-xs font-semibold text-slate-600 hover:text-slate-900 inline-flex items-center gap-1 transition"
              >
                <span>Lihat Semua</span>
                <ChevronRight size={13} />
              </Link>
            </div>

            {bottlenecks.length === 0 ? (
              <div className="py-10 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl">
                <CheckCircle2 size={32} className="mx-auto text-emerald-500 mb-2" />
                <span>Luar biasa! Tidak ada dokumen yang tertahan atau macet di antrean.</span>
              </div>
            ) : (
              <div className="space-y-3">
                {bottlenecks.map((item) => {
                  const isReminded = remindedIds.includes(item.instance_id);
                  return (
                    <div
                      key={item.instance_id}
                      className="p-3.5 rounded-xl border border-slate-200/80 hover:border-slate-300 transition bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-xs font-bold text-slate-900">{item.reference_number}</span>
                          <span className="text-[10px] bg-slate-200/70 text-slate-700 px-2 py-0.5 rounded font-medium">
                            {item.module_code}
                          </span>
                          {item.is_overdue && (
                            <span className="text-[10px] bg-rose-100 text-rose-700 px-2 py-0.5 rounded font-bold">
                              {item.days_pending} Hari (SLA Warning)
                            </span>
                          )}
                        </div>
                        <div className="text-xs font-semibold text-slate-800 truncate">{item.title}</div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-2">
                          <span>
                            Menunggu: <strong className="text-slate-700">{item.approver_name}</strong>
                          </span>
                          <span>•</span>
                          <span>Tahap: {item.current_step}</span>
                        </div>
                      </div>

                      <div className="shrink-0 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleRemind(item.instance_id, item.approver_user_id)}
                          disabled={isReminded || remindMutation.isPending}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition shadow-sm ${
                            isReminded
                              ? "bg-emerald-100 text-emerald-800 cursor-default"
                              : "bg-amber-500 hover:bg-amber-600 text-white"
                          }`}
                        >
                          <Send size={12} />
                          <span>{isReminded ? "Tersenggol ✓" : "Senggol Approver"}</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Panel Kanan: Live Security & System Audit Feed */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <ShieldCheck size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Aktivitas Keamanan & Audit Terakhir</h3>
                  <p className="text-[11px] text-slate-500">Log otentikasi dan akses sistem paling baru</p>
                </div>
              </div>
              <Link
                to="/core-platform/audit/login"
                className="text-xs font-semibold text-slate-600 hover:text-slate-900 inline-flex items-center gap-1 transition"
              >
                <span>Lihat Audit</span>
                <ExternalLink size={12} />
              </Link>
            </div>

            {recent_audits.length === 0 ? (
              <div className="py-10 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl">
                <span>Belum ada rekaman log audit keamanan.</span>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {recent_audits.map((audit) => (
                  <div key={audit.id} className="py-2.5 flex items-center justify-between text-xs gap-3">
                    <div className="min-w-0">
                      <div className="font-semibold text-slate-800 truncate">{audit.user_name}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-2">
                        <span>IP: {audit.ip_address}</span>
                        <span>•</span>
                        <span className="truncate">{audit.device}</span>
                      </div>
                    </div>

                    <div className="shrink-0 text-right">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          audit.status === "success"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-rose-50 text-rose-700 border border-rose-200"
                        }`}
                      >
                        {audit.status.toUpperCase()}
                      </span>
                      <div className="text-[10px] text-slate-400 mt-1">
                        {audit.created_at ? formatDate(audit.created_at) : "—"}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
