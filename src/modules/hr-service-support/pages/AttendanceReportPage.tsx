import { PageHeader } from "@shared/components/PageHeader";
import { useState } from "react";

// SESUDAH
import { ArrowLeft, Search, User, Users, CheckCircle2, CalendarDays, AlertTriangle, Download, Printer, Clock } from "lucide-react";
import { EmptyState } from "@shared/components/EmptyState";
import { LoadingState } from "@shared/components/LoadingState";
import { formatDate, formatTime } from "@shared/lib/format";
import { useCompanyAttendanceSummary, useEmployeeAttendanceReport } from "../api/useAttendanceReport";
import { PERMISSION_REQUEST_TYPE_LABELS } from "../types/permission";
import type { PermissionRequestType } from "../types/permission";
import type { AttendanceReportRow } from "../types/attendanceReport";

const ATTENDANCE_STATUS_LABELS: Record<string, string> = {
  present: "Hadir", late: "Terlambat", absent: "Absen", leave: "Cuti", manual: "Manual",
};
const ATTENDANCE_STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  present: { bg: "#dcfce7", color: "#166534" },
  late: { bg: "#fff7ed", color: "#c2410c" },
  absent: { bg: "#fee2e2", color: "#991b1b" },
  leave: { bg: "#eff6ff", color: "#1e40af" },
  manual: { bg: "#f3e8ff", color: "#7e22ce" },
};

function firstOfYearIso() { return `${new Date().getFullYear()}-01-01`; }
function endOfYearIso() { return `${new Date().getFullYear()}-12-31`; }

export function AttendanceReportPage() {
  const [dateFrom, setDateFrom] = useState(firstOfYearIso());
  const [dateTo, setDateTo] = useState(endOfYearIso());
  const [selectedEmployee, setSelectedEmployee] = useState<{ id: number; full_name: string } | null>(null);

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-16">
      <PageHeader
        title="Laporan Absensi & Kuota Cuti"
        subtitle="Rekapitulasi lengkap kehadiran, rekap ijin/cuti, dan sisa saldo cuti tahunan per employee."
      >
        <div className="flex items-center gap-2">
          <button className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all shadow-sm">
            <Download size={15} className="text-slate-500" /> Export XLS
          </button>
          <button className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#0A2140] hover:bg-[#07162c] rounded-xl transition-all shadow-sm">
            <Printer size={15} /> Cetak Laporan
          </button>
        </div>
      </PageHeader>

      <div className="px-7 py-5 flex flex-col gap-6">
        {/* Date Filter Card */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            {selectedEmployee && (
              <button
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                onClick={() => setSelectedEmployee(null)}
              >
                <ArrowLeft size={14} /> Kembali ke Daftar
              </button>
            )}
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500">Rentang Periode:</span>
              <div className="flex items-center gap-1.5">
                <input
                  className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-[#0A2140]"
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                />
                <span className="text-slate-400 text-xs">—</span>
                <input
                  className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-[#0A2140]"
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                />
              </div>
            </div>
          </div>
          <div className="text-xs text-slate-500">
            {selectedEmployee ? (
              <span>Detail Pegawai: <strong className="text-slate-900">{selectedEmployee.full_name}</strong></span>
            ) : (
              <span>Mode: <strong>Ringkasan Seluruh Perusahaan</strong></span>
            )}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden p-6">
          {!selectedEmployee && <CompanySummaryTable dateFrom={dateFrom} dateTo={dateTo} onSelect={setSelectedEmployee} />}
          {selectedEmployee && <EmployeeDetail employeeId={selectedEmployee.id} employeeName={selectedEmployee.full_name} dateFrom={dateFrom} dateTo={dateTo} />}
        </div>
      </div>
    </div>
  );
}

function CompanySummaryTable({ dateFrom, dateTo, onSelect }: {
  dateFrom: string; dateTo: string; onSelect: (emp: { id: number; full_name: string }) => void;
}) {
  const [search, setSearch] = useState("");
  const [statusChip, setStatusChip] = useState<"all" | "has_leave" | "deficit">("all");
  const { data, isLoading } = useCompanyAttendanceSummary(dateFrom, dateTo);

  // SESUDAH
  const all = data ?? [];
  const hasLeaveCount = all.filter(r => r.cuti > 0).length;
  const deficitCount = all.filter(r => r.available_leave_days < 0).length;
  const employeeHadirCount = all.filter(r => r.hadir > 0).length;
  const employeeAbsenCount = all.filter(r => r.absen > 0).length;
  const employeeCutiCount = all.filter(r => r.cuti > 0).length;
  const employeeTerlambatCount = all.filter(r => r.terlambat > 0).length;

  const byStatus = all.filter(r => {
    if (statusChip === "has_leave") return r.cuti > 0;
    if (statusChip === "deficit") return r.available_leave_days < 0;
    return true;
  });
  const filtered = byStatus.filter((r) =>
    !search || r.employee_name.toLowerCase().includes(search.toLowerCase()) || r.employee_number.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-6">
      {/* 5 KPI Stat Cards Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        <div className="bg-slate-50/80 border border-slate-200/80 rounded-2xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Terdata</span>
            <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-slate-200/70 text-slate-700">
              <Users size={15} />
            </div>
          </div>
          <div className="mt-2.5">
            <span className="text-2xl font-bold text-slate-900 tracking-tight">{all.length}</span>
            <span className="text-xs text-slate-500 ml-1">orang</span>
          </div>
        </div>

        <div className="bg-emerald-50/50 border border-emerald-200/60 rounded-2xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-700">Total Hadir</span>
            <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-emerald-100 text-emerald-700">
              <CheckCircle2 size={15} />
            </div>
          </div>
          <div className="mt-2.5">
            <span className="text-2xl font-bold text-emerald-950 tracking-tight">{employeeHadirCount}</span>
            <span className="text-xs text-emerald-700 font-medium ml-1">orang</span>
          </div>
        </div>

        <div className="bg-amber-50/50 border border-amber-200/60 rounded-2xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-700">Terlambat</span>
            <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-amber-100 text-amber-700">
              <Clock size={15} />
            </div>
          </div>
          <div className="mt-2.5">
            <span className="text-2xl font-bold text-amber-950 tracking-tight">{employeeTerlambatCount}</span>
            <span className="text-xs text-amber-700 font-medium ml-1">orang</span>
          </div>
        </div>

        <div className="bg-rose-50/50 border border-rose-200/60 rounded-2xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-rose-700">Total Absen</span>
            <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-rose-100 text-rose-700">
              <AlertTriangle size={15} />
            </div>
          </div>
          <div className="mt-2.5">
            <span className="text-2xl font-bold text-rose-950 tracking-tight">{employeeAbsenCount}</span>
            <span className="text-xs text-rose-700 font-medium ml-1">orang</span>
          </div>
        </div>

        <div className="bg-blue-50/50 border border-blue-200/60 rounded-2xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-blue-700">Total Cuti</span>
            <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-blue-100 text-blue-700">
              <CalendarDays size={15} />
            </div>
          </div>
          <div className="mt-2.5">
            <span className="text-2xl font-bold text-blue-950 tracking-tight">{employeeCutiCount}</span>
            <span className="text-xs text-blue-700 font-medium ml-1">orang</span>
          </div>
        </div>
      </div>

      {/* Toolbar Search & Status Chips */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-slate-100">
        <div className="relative flex-1 min-w-[240px] max-w-sm">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50/70 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0A2140]/10 focus:border-[#0A2140] transition-all"
            placeholder="Cari nama atau NIK employee..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
          <button
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              statusChip === "all" ? "bg-white text-[#0A2140] shadow-sm" : "text-slate-600 hover:text-slate-900"
            }`}
            onClick={() => setStatusChip("all")}
          >
            Semua ({all.length})
          </button>
          <button
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              statusChip === "has_leave" ? "bg-white text-[#0A2140] shadow-sm" : "text-slate-600 hover:text-slate-900"
            }`}
            onClick={() => setStatusChip("has_leave")}
          >
            Ada Cuti ({hasLeaveCount})
          </button>
          <button
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              statusChip === "deficit" ? "bg-white text-rose-700 shadow-sm" : "text-slate-600 hover:text-slate-900"
            }`}
            onClick={() => setStatusChip("deficit")}
          >
            Saldo Minus ({deficitCount})
          </button>
        </div>
      </div>

      {isLoading && <LoadingState />}
      {!isLoading && filtered.length === 0 && (
        <div className="py-8">
          <EmptyState title="Tidak Ada Data" subtitle="Tidak ada employee aktif yang cocok dengan kriteria filter." />
        </div>
      )}
      {!isLoading && filtered.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80">
                <th className="px-5 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Employee</th>
                <th className="px-5 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Hadir</th>
                <th className="px-5 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Terlambat</th>
                <th className="px-5 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Absen</th>
                <th className="px-5 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Cuti</th>
                <th className="px-5 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Sisa Cuti Tahun Ini</th>
                <th className="px-5 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.employee_id} className="hover:bg-slate-50/60 transition-colors border-b border-slate-100">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-slate-900">{r.employee_name}</span>
                      {r.available_leave_days < 0 && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200/60">
                          Defisit Cuti
                        </span>
                      )}
                    </div>
                    <div className="font-mono text-xs text-slate-400 mt-0.5">{r.employee_number}</div>
                  </td>
                  <td className="px-5 py-3.5 font-mono text-xs font-semibold text-emerald-700">{r.hadir} hari</td>
                  <td className="px-5 py-3.5 font-mono text-xs font-semibold text-amber-700">{r.terlambat} hari</td>
                  <td className="px-5 py-3.5 font-mono text-xs font-semibold text-rose-700">{r.absen} hari</td>
                  <td className="px-5 py-3.5 font-mono text-xs font-semibold text-blue-700">{r.cuti} hari</td>
                  <td className="px-5 py-3.5">
                    <span className={`font-mono text-xs font-bold ${
                      r.available_leave_days <= 0 ? "text-rose-600" : "text-emerald-700"
                    }`}>
                      {r.available_leave_days} hari
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <button
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                      onClick={() => onSelect({ id: r.employee_id, full_name: r.employee_name })}
                    >
                      <User size={12} /> Detail
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function EmployeeDetail({ employeeId, employeeName, dateFrom, dateTo }: {
  employeeId: number; employeeName: string; dateFrom: string; dateTo: string;
}) {
  const { data: report, isLoading } = useEmployeeAttendanceReport(employeeId, dateFrom, dateTo);

  if (isLoading) return <LoadingState />;
  if (!report) return <EmptyState title="Data Tidak Ditemukan" subtitle="Gagal memuat laporan employee ini." />;

  const { summary, leave_balance, attendance, permission_requests } = report;
  const usedPct = leave_balance.quota_days > 0 ? Math.min(100, Math.round((leave_balance.used_days / leave_balance.quota_days) * 100)) : 0;

  return (
    <div style={{ padding: "0 1.5rem 1.5rem" }}>
      <div style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "1rem" }}>{employeeName}</div>

      {/* Stat cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "0.75rem", marginBottom: "1.5rem" }}>
        <StatCard label="Hadir" value={summary.hadir} color="#16a34a" />
        <StatCard label="Terlambat" value={summary.terlambat} color="#c2410c" />
        <StatCard label="Absen" value={summary.absen} color="#dc2626" />
        <StatCard label="Cuti" value={summary.cuti} color="#1e40af" />
        <StatCard label="Manual" value={summary.manual} color="#7e22ce" />
      </div>

      {/* Sisa Cuti */}
      <div style={{ marginBottom: "1.5rem" }}>
        <div style={{ fontWeight: 700, fontSize: "0.9rem", marginBottom: "0.6rem" }}>Cuti Tahunan {leave_balance.year}</div>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem", padding: "0.85rem 1rem", background: "var(--bg-subtle)", borderRadius: 10 }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.78rem", color: "var(--grey)", marginBottom: 4 }}>
              <span>Terpakai {leave_balance.used_days} dari {leave_balance.quota_days} hari</span>
              <span>{usedPct}%</span>
            </div>
            <div style={{ height: 10, background: "var(--border)", borderRadius: 6, overflow: "hidden" }}>
              <div style={{ width: `${usedPct}%`, height: "100%", background: usedPct >= 100 ? "var(--bad)" : "var(--accent)", borderRadius: 6, transition: "width 0.3s" }} />
            </div>
          </div>
          <div style={{ textAlign: "right", flexShrink: 0 }}>
            <div style={{ fontSize: "0.7rem", color: "var(--grey)", fontWeight: 600 }}>SISA CUTI</div>
            <div style={{ fontSize: "1.4rem", fontWeight: 800, color: leave_balance.available_days <= 0 ? "var(--bad)" : "var(--accent)" }}>
              {leave_balance.available_days} <span style={{ fontSize: "0.85rem", fontWeight: 600 }}>hari</span>
            </div>
          </div>
        </div>
      </div>

      {/* Riwayat Ijin */}
      <div style={{ marginBottom: "1.5rem" }}>
        <div style={{ fontWeight: 700, fontSize: "0.9rem", marginBottom: "0.6rem" }}>Riwayat Ijin ({permission_requests.length})</div>
        {permission_requests.length === 0 ? (
          <div style={{ fontSize: "0.82rem", color: "var(--grey)" }}>Tidak ada pengajuan ijin di periode ini.</div>
        ) : (
          <table className="table">
            <thead><tr><th>No. Ijin</th><th>Jenis</th><th>Tanggal</th><th>Total Hari</th><th>Status</th></tr></thead>
            <tbody>
              {permission_requests.map((pr) => (
                <tr key={pr.id}>
                  <td style={{ fontFamily: "monospace", fontSize: "0.78rem" }}>{pr.request_number}</td>
                  <td>{PERMISSION_REQUEST_TYPE_LABELS[pr.type as PermissionRequestType] ?? pr.type}
                    {pr.type === "izin_keluar" && pr.out_start_time && pr.out_end_time && (
                      <span style={{ color: "var(--grey)", fontSize: "0.75rem" }}> ({pr.out_start_time.substring(0, 5)}–{pr.out_end_time.substring(0, 5)})</span>
                    )}
                  </td>
                  <td style={{ fontFamily: "monospace", fontSize: "0.8rem" }}>
                    {pr.start_date === pr.end_date ? formatDate(pr.start_date) : `${formatDate(pr.start_date)} – ${formatDate(pr.end_date)}`}
                  </td>
                  <td>{pr.total_days}</td>
                  <td style={{ textTransform: "capitalize" }}>{pr.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Timeline Absensi */}
      <div>
        <div style={{ fontWeight: 700, fontSize: "0.9rem", marginBottom: "0.6rem" }}>Riwayat Absensi ({attendance.length})</div>
        {attendance.length === 0 ? (
          <EmptyState title="Belum Ada Data Absensi" subtitle="Tidak ada data absensi di periode ini." />
        ) : (
          <table className="table">
            <thead>
              <tr><th>Tanggal</th><th>Check In</th><th>Check Out</th><th>Status</th><th>Jam Kerja</th><th>Ijin</th><th>Catatan</th></tr>
            </thead>
            <tbody>
              {attendance.map((att: AttendanceReportRow) => (
                <tr key={att.id}>
                  <td style={{ fontFamily: "monospace", fontSize: "0.82rem" }}>{formatDate(att.attendance_date)}</td>
                  <td style={{ fontFamily: "monospace", fontSize: "0.82rem", color: "#16a34a" }}>{formatTime(att.check_in_at)}</td>
                  <td style={{ fontFamily: "monospace", fontSize: "0.82rem", color: "#dc2626" }}>{formatTime(att.check_out_at)}</td>
                  <td>
                    <span style={{ fontSize: "0.72rem", fontWeight: 700, padding: "0.15rem 0.5rem", borderRadius: 4, background: ATTENDANCE_STATUS_COLORS[att.status]?.bg, color: ATTENDANCE_STATUS_COLORS[att.status]?.color }}>
                      {ATTENDANCE_STATUS_LABELS[att.status] ?? att.status}
                    </span>
                  </td>
                  <td>
                    {att.work_hours ? (
                      <span style={{ fontFamily: "monospace", fontSize: "0.8rem" }}>
                        {att.work_hours.worked_hours}j
                        {att.work_hours.is_overtime && <span style={{ color: "#c2410c", fontWeight: 700 }}> (+{att.work_hours.overtime_hours}j)</span>}
                      </span>
                    ) : "—"}
                  </td>
                  <td>
                    {att.permission_request ? (
                      <span style={{ fontSize: "0.7rem", fontWeight: 700, padding: "0.15rem 0.5rem", borderRadius: 20, background: "#f3e8ff", color: "#7e22ce" }}>
                        {PERMISSION_REQUEST_TYPE_LABELS[att.permission_request.type as PermissionRequestType] ?? att.permission_request.type}
                      </span>
                    ) : "—"}
                  </td>
                  <td style={{ fontSize: "0.8rem", color: "var(--grey)", maxWidth: 160 }}>{att.notes ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div style={{
      padding: "0.85rem 1rem", borderRadius: 12, background: "var(--bg-subtle)",
      border: `1px solid ${color}33`, borderLeft: `4px solid ${color}`,
    }}>
      <div style={{ fontSize: "0.7rem", color: "var(--grey)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.02em" }}>{label}</div>
      <div style={{ fontSize: "1.4rem", fontWeight: 800, color, marginTop: 2 }}>{value}</div>
    </div>
  );
}
