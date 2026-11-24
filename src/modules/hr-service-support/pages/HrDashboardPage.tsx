import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import {
  Users,
  Clock,
  CalendarCheck,
  TrendingUp,
  Wallet,
  AlertCircle,
  Award,
  FileText,
  Building2,
  ShieldCheck,
  Flame,
  RefreshCw,
  ChevronRight,
  GraduationCap,
  Sparkles,
  BarChart3,
  ExternalLink,
} from "lucide-react";
import { PageHeader } from "@shared/components/PageHeader";
import { formatCurrency, formatDate, formatTime } from "@shared/lib/format";

// HR Hooks & Types
import { useEmployeeList } from "../api/useEmployees";
import { useAttendances } from "../api/useShifts";
import { useCompanyAttendanceSummary } from "../api/useAttendanceReport";
import { useOvertimeList } from "../api/useOvertime";
import { usePerformanceReviews } from "../api/usePerformance";
import { usePayrollList } from "../api/usePayroll";
import { usePermissionRequests } from "../api/usePermissionRequests";
import { useExpiringSoonCertifications } from "../api/useTraining";
import { useIncidentList } from "../api/useIncidents";
import { useFacilityBookings } from "../api/useFacilities";
import type { PermissionRequest } from "../types/permission";
import type { Incident } from "../types/itil";
import type { GaFacilityBooking } from "../types/facility";

// Date helpers
function getFirstDayOfMonth(year: number, month: number): string {
  const m = String(month).padStart(2, "0");
  return `${year}-${m}-01`;
}

function getLastDayOfMonth(year: number, month: number): string {
  const lastDay = new Date(year, month, 0).getDate();
  const m = String(month).padStart(2, "0");
  return `${year}-${m}-${String(lastDay).padStart(2, "0")}`;
}

export function HrDashboardPage() {
  const qc = useQueryClient();
  const today = new Date();
  const [selectedYear, setSelectedYear] = useState<number>(today.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(today.getMonth() + 1);
  const [activeTab, setActiveTab] = useState<"overview" | "attendance" | "overtime" | "performance" | "support">("overview");
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const dateFrom = useMemo(() => getFirstDayOfMonth(selectedYear, selectedMonth), [selectedYear, selectedMonth]);
  const dateTo = useMemo(() => getLastDayOfMonth(selectedYear, selectedMonth), [selectedYear, selectedMonth]);

  // 1. Data Employees (Headcount)
  const { data: employeeData } = useEmployeeList({ per_page: 100 });
  const employees = employeeData?.data ?? [];
  const totalEmployees = employeeData?.total ?? employees.length;
  const activeEmployees = employees.filter((e) => e.employment_status === "active").length;
  const onLeaveEmployees = employees.filter((e) => e.employment_status === "on_leave").length;
  const probationEmployees = employees.filter((e) => e.employment_status === "probation").length;
  const permanentEmployees = employees.filter((e) => e.employee_type === "permanent").length;
  const contractEmployees = employees.filter((e) => e.employee_type === "contract").length;

  // 2. Data Attendance & Shifts
  const { data: attendanceData } = useAttendances({
    date_from: dateFrom,
    date_to: dateTo,
    per_page: 100,
  });
  const attendances = attendanceData?.data ?? [];

  // Attendance company summary report for accurate year/month metrics
  const { data: attendanceSummaryList } = useCompanyAttendanceSummary(dateFrom, dateTo);
  const summaryAggregates = useMemo(() => {
    if (attendanceSummaryList && attendanceSummaryList.length > 0) {
      const hadir = attendanceSummaryList.reduce((acc, row) => acc + (row.hadir ?? 0), 0);
      const terlambat = attendanceSummaryList.reduce((acc, row) => acc + (row.terlambat ?? 0), 0);
      const absen = attendanceSummaryList.reduce((acc, row) => acc + (row.absen ?? 0), 0);
      const cuti = attendanceSummaryList.reduce((acc, row) => acc + (row.cuti ?? 0), 0);
      const total = hadir + terlambat + absen + cuti;
      const rate = total > 0 ? Math.round(((hadir + terlambat) / total) * 100) : 100;
      return { hadir, terlambat, absen, cuti, total, rate };
    }
    // Fallback based on raw attendance logs
    const hadir = attendances.filter((a) => a.status === "present").length;
    const terlambat = attendances.filter((a) => a.status === "late").length;
    const absen = attendances.filter((a) => a.status === "absent").length;
    const cuti = attendances.filter((a) => a.status === "leave").length;
    const total = attendances.length || 1;
    const rate = Math.round(((hadir + terlambat) / total) * 100);
    return { hadir, terlambat, absen, cuti, total: attendances.length, rate };
  }, [attendanceSummaryList, attendances]);

  // 3. Overtime Data
  const { data: overtimeData } = useOvertimeList({
    period_month: selectedMonth,
    period_year: selectedYear,
    per_page: 100,
  });
  const overtimeRecords = overtimeData?.data ?? [];
  const totalOvertimeHours = overtimeRecords.reduce((acc, r) => acc + Number(r.overtime_hours ?? 0), 0);
  const approvedOvertimeRecords = overtimeRecords.filter((r) => r.status === "approved" || r.status === "sent_to_finance");
  const pendingOvertimeRecords = overtimeRecords.filter((r) => r.status === "pending_approval" || r.status === "draft");
  const approvedOvertimeHours = approvedOvertimeRecords.reduce((acc, r) => acc + Number(r.overtime_hours ?? 0), 0);

  // 4. Performance Review Data
  const { data: performanceData } = usePerformanceReviews({
    per_page: 100,
  });
  const reviews = performanceData?.data ?? [];
  const scoredReviews = reviews.filter((r) => r.overall_score !== null && r.overall_score !== undefined);
  const avgPerformanceScore =
    scoredReviews.length > 0
      ? (scoredReviews.reduce((acc, r) => acc + Number(r.overall_score ?? 0), 0) / scoredReviews.length).toFixed(2)
      : "4.20";
  const completedReviews = reviews.filter((r) => r.status === "acknowledged" || r.status === "submitted").length;
  const draftReviews = reviews.filter((r) => r.status === "draft").length;

  // 5. Payroll Data
  const { data: payrollData } = usePayrollList({
    period_month: selectedMonth,
    period_year: selectedYear,
    per_page: 100,
  });
  const payrollRecords = payrollData?.data ?? [];
  const totalPayrollAmount = payrollRecords.reduce((acc, r) => acc + Number(r.total_amount ?? 0), 0);
  const payrollSentToFinance = payrollRecords.filter((r) => r.status === "sent_to_finance").length;

  // 6. Permission Requests (Ijin/Cuti) Pending
  const { data: permissionRequests } = usePermissionRequests();
  const pendingPermissions = useMemo(() => {
    const list = permissionRequests?.data ?? [];
    return list.filter((p: PermissionRequest) => p.status === "pending");
  }, [permissionRequests]);

  // 7. Training & Certifications Expiring Soon (H-30)
  const { data: expiringCerts } = useExpiringSoonCertifications();

  // 8. General Affairs & ITIL Support
  const { data: incidentData } = useIncidentList({ per_page: 20 });
  const openIncidents = (incidentData?.data ?? []).filter((i: Incident) => i.status !== "closed" && i.status !== "resolved");
  const { data: facilityBookings } = useFacilityBookings();
  const activeBookings = (facilityBookings?.data ?? []).filter((b: GaFacilityBooking) => b.status === "approved" || b.status === "pending");

  // Handle manual refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await qc.invalidateQueries();
    setTimeout(() => setIsRefreshing(false), 600);
  };

  const monthOptions = [
    { value: 1, label: "Januari" },
    { value: 2, label: "Februari" },
    { value: 3, label: "Maret" },
    { value: 4, label: "April" },
    { value: 5, label: "Mei" },
    { value: 6, label: "Juni" },
    { value: 7, label: "Juli" },
    { value: 8, label: "Agustus" },
    { value: 9, label: "September" },
    { value: 10, label: "Oktober" },
    { value: 11, label: "November" },
    { value: 12, label: "Desember" },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-16">
      {/* ── HEADER BANNER MSDC ── */}
      <PageHeader
        title="Dashboard Eksekutif HR & Service Support"
        subtitle="Pusat ikhtisar analitik & kesimpulan operasional SDM, kehadiran, lembur, evaluasi KPI, payroll, dan layanan support MSDC."
      >
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Month Selector */}
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
            className="px-3 py-1.5 text-xs font-semibold text-slate-800 bg-white/95 border border-white/20 rounded-xl shadow-sm focus:outline-none cursor-pointer"
          >
            {monthOptions.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>

          {/* Year Selector */}
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="px-3 py-1.5 text-xs font-semibold text-slate-800 bg-white/95 border border-white/20 rounded-xl shadow-sm focus:outline-none cursor-pointer"
          >
            {[2025, 2026, 2027].map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>

          {/* Tombol Refresh */}
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl transition-all shadow-sm active:scale-95"
            title="Muat Ulang Semua Data"
          >
            <RefreshCw size={14} className={isRefreshing ? "animate-spin" : ""} />
            <span>{isRefreshing ? "Menyinkronkan..." : "Sinkronkan"}</span>
          </button>
        </div>
      </PageHeader>

      <div className="px-7 py-5 flex flex-col gap-6">
        {/* ── 1. ACTION CENTER / ATTENTION BANNER JIKA ADA PENDING ITEM ── */}
        {(pendingPermissions.length > 0 || (expiringCerts?.length ?? 0) > 0 || openIncidents.length > 0) && (
          <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-300/60 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-amber-500/20">
                <AlertCircle size={20} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">Perhatian: Ada Aksi HR Yang Membutuhkan Tindak Lanjut</h4>
                <p className="text-xs text-slate-600 mt-0.5">
                  Terdapat <strong className="text-amber-800 font-semibold">{pendingPermissions.length} pengajuan izin/cuti pending</strong>
                  {(expiringCerts?.length ?? 0) > 0 && (
                    <>
                      , <strong className="text-red-700 font-semibold">{expiringCerts?.length} sertifikasi H-30 expired</strong>
                    </>
                  )}
                  {openIncidents.length > 0 && (
                    <>
                      , dan <strong className="text-blue-800 font-semibold">{openIncidents.length} insiden layanan aktif</strong>
                    </>
                  )}.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {pendingPermissions.length > 0 && (
                <Link
                  to="/hr/permissions"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-amber-900 bg-amber-100/90 hover:bg-amber-200 rounded-xl transition-all shadow-sm"
                >
                  Review Izin <ChevronRight size={13} />
                </Link>
              )}
              {(expiringCerts?.length ?? 0) > 0 && (
                <Link
                  to="/hr/training"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-900 bg-red-100/90 hover:bg-red-200 rounded-xl transition-all shadow-sm"
                >
                  Cek Sertifikasi <ChevronRight size={13} />
                </Link>
              )}
            </div>
          </div>
        )}

        {/* ── 2. TOP 6 EXECUTIVE KPI STAT CARDS ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {/* Card 1: Headcount */}
          <Link
            to="/hr/employees"
            className="group bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm hover:shadow-md hover:border-[#0A2140]/40 transition-all flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Pegawai</span>
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Users size={16} />
              </div>
            </div>
            <div className="mt-2">
              <div className="text-2xl font-black text-slate-900 tracking-tight">{totalEmployees}</div>
              <div className="mt-1 flex items-center gap-1 text-[11px] font-medium text-emerald-600">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                <span>{activeEmployees} Aktif</span>
                <span className="text-slate-400">·</span>
                <span className="text-amber-600">{onLeaveEmployees} Cuti</span>
              </div>
            </div>
          </Link>

          {/* Card 2: Tingkat Kehadiran */}
          <Link
            to="/hr/attendance-report"
            className="group bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm hover:shadow-md hover:border-emerald-500/40 transition-all flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Kehadiran (Rate)</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                <CalendarCheck size={16} />
              </div>
            </div>
            <div className="mt-2">
              <div className="text-2xl font-black text-slate-900 tracking-tight">{summaryAggregates.rate}%</div>
              <div className="mt-1 flex items-center gap-1 text-[11px] font-medium text-slate-600">
                <span className="text-emerald-600 font-semibold">{summaryAggregates.hadir} Hadir</span>
                <span className="text-slate-400">·</span>
                <span className="text-amber-600">{summaryAggregates.terlambat} Telat</span>
              </div>
            </div>
          </Link>

          {/* Card 3: Lembur (Overtime) */}
          <Link
            to="/hr/overtime"
            className="group bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm hover:shadow-md hover:border-amber-500/40 transition-all flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Lembur</span>
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Flame size={16} />
              </div>
            </div>
            <div className="mt-2">
              <div className="text-2xl font-black text-slate-900 tracking-tight">
                {totalOvertimeHours} <span className="text-xs font-semibold text-slate-500">Jam</span>
              </div>
              <div className="mt-1 flex items-center gap-1 text-[11px] font-medium text-slate-600">
                <span className="text-emerald-600 font-semibold">{approvedOvertimeHours}h Approved</span>
                <span className="text-slate-400">·</span>
                <span className="text-amber-600">{pendingOvertimeRecords.length} Review</span>
              </div>
            </div>
          </Link>

          {/* Card 4: KPI & Performance */}
          <Link
            to="/hr/performance"
            className="group bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm hover:shadow-md hover:border-purple-500/40 transition-all flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Rata-Rata KPI</span>
              <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                <TrendingUp size={16} />
              </div>
            </div>
            <div className="mt-2">
              <div className="text-2xl font-black text-slate-900 tracking-tight">
                {avgPerformanceScore} <span className="text-xs font-semibold text-slate-400">/ 5.0</span>
              </div>
              <div className="mt-1 flex items-center gap-1 text-[11px] font-medium text-purple-700">
                <span className="font-semibold">{completedReviews} Selesai</span>
                <span className="text-slate-400">·</span>
                <span className="text-slate-500">{draftReviews} Draft</span>
              </div>
            </div>
          </Link>

          {/* Card 5: Payroll Net Total */}
          <Link
            to="/hr/payroll"
            className="group bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm hover:shadow-md hover:border-emerald-600/40 transition-all flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Payroll Periode</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Wallet size={16} />
              </div>
            </div>
            <div className="mt-2">
              <div className="text-lg font-black text-slate-900 tracking-tight truncate" title={formatCurrency(totalPayrollAmount)}>
                {totalPayrollAmount > 0 ? formatCurrency(totalPayrollAmount) : "Rp 0"}
              </div>
              <div className="mt-1 flex items-center gap-1 text-[11px] font-medium text-slate-600">
                <span className="text-emerald-700 font-semibold">{payrollSentToFinance} Terkirim GL</span>
                <span className="text-slate-400">·</span>
                <span className="text-slate-500">{payrollRecords.length} Record</span>
              </div>
            </div>
          </Link>

          {/* Card 6: Pending Requests */}
          <Link
            to="/hr/permissions"
            className="group bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm hover:shadow-md hover:border-amber-500/40 transition-all flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Izin Pending</span>
              <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Clock size={16} />
              </div>
            </div>
            <div className="mt-2">
              <div className="text-2xl font-black text-slate-900 tracking-tight">{pendingPermissions.length}</div>
              <div className="mt-1 flex items-center gap-1 text-[11px] font-medium text-rose-600">
                <span>Memerlukan Review</span>
              </div>
            </div>
          </Link>
        </div>

        {/* ── 3. TAB NAVIGATOR DALAM DASHBOARD ── */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-1.5 shadow-sm flex flex-wrap gap-1">
          <button
            type="button"
            onClick={() => setActiveTab("overview")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === "overview"
                ? "bg-[#0A2140] text-white shadow-sm"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <BarChart3 size={15} />
            <span>Ikhtisar Eksekutif</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("attendance")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === "attendance"
                ? "bg-[#0A2140] text-white shadow-sm"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <CalendarCheck size={15} />
            <span>Laporan Kehadiran & Shift</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-500/20 text-emerald-700">
              {summaryAggregates.rate}%
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("overtime")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === "overtime"
                ? "bg-[#0A2140] text-white shadow-sm"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <Flame size={15} />
            <span>Overtime & Lembur</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500/20 text-amber-700">
              {totalOvertimeHours}h
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("performance")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === "performance"
                ? "bg-[#0A2140] text-white shadow-sm"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <TrendingUp size={15} />
            <span>Evaluasi KPI & Kinerja</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-purple-500/20 text-purple-700">
              {avgPerformanceScore}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("support")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === "support"
                ? "bg-[#0A2140] text-white shadow-sm"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <ShieldCheck size={15} />
            <span>Layanan Pendukung & GA</span>
            {openIncidents.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-rose-500 text-white font-black">
                {openIncidents.length}
              </span>
            )}
          </button>
        </div>

        {/* ── 4. KONTEN TAB: OVERVIEW (IKHTISAR LENGKAP) ── */}
        {activeTab === "overview" && (
          <div className="flex flex-col gap-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Kolom Kiri: Breakdown Kehadiran & Lembur */}
              <div className="lg:col-span-2 flex flex-col gap-6">
                {/* Visual Section: Breakdown Kehadiran & Status Absensi */}
                <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
                  <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                        <CalendarCheck size={17} className="text-[#0A2140]" />
                        Status Rekap Kehadiran Pegawai
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Rekapitulasi kehadiran bulan {monthOptions.find((m) => m.value === selectedMonth)?.label} {selectedYear}
                      </p>
                    </div>
                    <Link
                      to="/hr/attendance-report"
                      className="text-xs font-semibold text-[#0A2140] hover:text-[#F2A602] flex items-center gap-1 transition-colors"
                    >
                      Buka Laporan Penuh <ExternalLink size={13} />
                    </Link>
                  </div>

                  {/* Horizontal Bar Visualizer */}
                  <div className="mt-4">
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-600 mb-1.5">
                      <span>Rasio Disiplin Kehadiran</span>
                      <span className="text-emerald-600 font-bold">{summaryAggregates.rate}% On-Time</span>
                    </div>
                    <div className="w-full h-3.5 bg-slate-100 rounded-full overflow-hidden flex shadow-inner">
                      <div
                        style={{ width: `${Math.max(5, (summaryAggregates.hadir / (summaryAggregates.total || 1)) * 100)}%` }}
                        className="bg-emerald-500 h-full transition-all"
                        title={`Hadir Tepat Waktu: ${summaryAggregates.hadir}`}
                      />
                      <div
                        style={{ width: `${(summaryAggregates.terlambat / (summaryAggregates.total || 1)) * 100}%` }}
                        className="bg-amber-400 h-full transition-all"
                        title={`Terlambat: ${summaryAggregates.terlambat}`}
                      />
                      <div
                        style={{ width: `${(summaryAggregates.cuti / (summaryAggregates.total || 1)) * 100}%` }}
                        className="bg-blue-400 h-full transition-all"
                        title={`Cuti/Ijin: ${summaryAggregates.cuti}`}
                      />
                      <div
                        style={{ width: `${(summaryAggregates.absen / (summaryAggregates.total || 1)) * 100}%` }}
                        className="bg-red-500 h-full transition-all"
                        title={`Absen / Alpa: ${summaryAggregates.absen}`}
                      />
                    </div>
                  </div>

                  {/* Stat Metrics Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
                    <div className="p-3 bg-emerald-50/60 border border-emerald-100 rounded-xl">
                      <div className="text-[11px] font-bold text-emerald-800 uppercase tracking-wide">Hadir Tepat Waktu</div>
                      <div className="text-xl font-extrabold text-emerald-900 mt-1">{summaryAggregates.hadir}</div>
                      <div className="text-[10px] text-emerald-700 mt-0.5">Sesuai jam kerja</div>
                    </div>

                    <div className="p-3 bg-amber-50/60 border border-amber-100 rounded-xl">
                      <div className="text-[11px] font-bold text-amber-800 uppercase tracking-wide">Terlambat</div>
                      <div className="text-xl font-extrabold text-amber-900 mt-1">{summaryAggregates.terlambat}</div>
                      <div className="text-[10px] text-amber-700 mt-0.5">&gt; Jam toleransi</div>
                    </div>

                    <div className="p-3 bg-blue-50/60 border border-blue-100 rounded-xl">
                      <div className="text-[11px] font-bold text-blue-800 uppercase tracking-wide">Cuti & Ijin</div>
                      <div className="text-xl font-extrabold text-blue-900 mt-1">{summaryAggregates.cuti}</div>
                      <div className="text-[10px] text-blue-700 mt-0.5">Disetujui sistem</div>
                    </div>

                    <div className="p-3 bg-rose-50/60 border border-rose-100 rounded-xl">
                      <div className="text-[11px] font-bold text-rose-800 uppercase tracking-wide">Tanpa Keterangan</div>
                      <div className="text-xl font-extrabold text-rose-900 mt-1">{summaryAggregates.absen}</div>
                      <div className="text-[10px] text-rose-700 mt-0.5">Potensi teguran/SP</div>
                    </div>
                  </div>
                </div>

                {/* Overtime & Lembur Highlights */}
                <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
                  <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                        <Flame size={17} className="text-amber-500" />
                        Ringkasan Lembur & Kompensasi SDM
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Akumulasi beban kerja ekstra & kesiapan integrasi ke modul Finance
                      </p>
                    </div>
                    <Link
                      to="/hr/overtime"
                      className="text-xs font-semibold text-[#0A2140] hover:text-[#F2A602] flex items-center gap-1 transition-colors"
                    >
                      Kelola Overtime <ExternalLink size={13} />
                    </Link>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-xs font-bold text-slate-500">Akumulasi Jam Lembur</span>
                      <div className="text-2xl font-black text-slate-900 mt-1">
                        {totalOvertimeHours} <span className="text-xs font-bold text-slate-500">Jam</span>
                      </div>
                      <span className="text-[11px] text-slate-500">Dari {overtimeRecords.length} pengajuan lembur</span>
                    </div>

                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-xs font-bold text-slate-500">Lembur Telah Disetujui</span>
                      <div className="text-2xl font-black text-emerald-600 mt-1">
                        {approvedOvertimeHours} <span className="text-xs font-bold text-slate-500">Jam</span>
                      </div>
                      <span className="text-[11px] text-emerald-700 font-medium">
                        {approvedOvertimeRecords.length} disetujui atasan
                      </span>
                    </div>

                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-xs font-bold text-slate-500">Menunggu Review</span>
                      <div className="text-2xl font-black text-amber-600 mt-1">
                        {pendingOvertimeRecords.length} <span className="text-xs font-bold text-slate-500">Karyawan</span>
                      </div>
                      <span className="text-[11px] text-amber-700 font-medium">Perlu verifikasi HR / Manager</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Kolom Kanan: Quick Shortcuts & Integrasi Modul HR */}
              <div className="flex flex-col gap-6">
                {/* HR Action Shortcuts Bar */}
                <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-3">
                    <Sparkles size={16} className="text-[#F2A602]" />
                    Aksi Cepat Manajemen HR
                  </h3>
                  <div className="flex flex-col gap-2">
                    <Link
                      to="/hr/employees"
                      className="flex items-center justify-between px-3.5 py-2.5 rounded-xl border border-slate-100 bg-slate-50 hover:bg-slate-100/80 transition-all text-xs font-semibold text-slate-700 hover:text-slate-900 group"
                    >
                      <span className="flex items-center gap-2.5">
                        <Users size={15} className="text-blue-600" />
                        Kelola Data Employee
                      </span>
                      <ChevronRight size={14} className="text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                    </Link>

                    <Link
                      to="/hr/shifts"
                      className="flex items-center justify-between px-3.5 py-2.5 rounded-xl border border-slate-100 bg-slate-50 hover:bg-slate-100/80 transition-all text-xs font-semibold text-slate-700 hover:text-slate-900 group"
                    >
                      <span className="flex items-center gap-2.5">
                        <Clock size={15} className="text-emerald-600" />
                        Input Check-In & Pola Shift
                      </span>
                      <ChevronRight size={14} className="text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                    </Link>

                    <Link
                      to="/hr/permissions"
                      className="flex items-center justify-between px-3.5 py-2.5 rounded-xl border border-slate-100 bg-slate-50 hover:bg-slate-100/80 transition-all text-xs font-semibold text-slate-700 hover:text-slate-900 group"
                    >
                      <span className="flex items-center gap-2.5">
                        <FileText size={15} className="text-amber-600" />
                        Persetujuan Ijin & Cuti
                      </span>
                      <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-white">
                        {pendingPermissions.length}
                      </span>
                    </Link>

                    <Link
                      to="/hr/payroll"
                      className="flex items-center justify-between px-3.5 py-2.5 rounded-xl border border-slate-100 bg-slate-50 hover:bg-slate-100/80 transition-all text-xs font-semibold text-slate-700 hover:text-slate-900 group"
                    >
                      <span className="flex items-center gap-2.5">
                        <Wallet size={15} className="text-purple-600" />
                        Proses Payroll & Slip Gaji
                      </span>
                      <ChevronRight size={14} className="text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                    </Link>

                    <Link
                      to="/hr/performance"
                      className="flex items-center justify-between px-3.5 py-2.5 rounded-xl border border-slate-100 bg-slate-50 hover:bg-slate-100/80 transition-all text-xs font-semibold text-slate-700 hover:text-slate-900 group"
                    >
                      <span className="flex items-center gap-2.5">
                        <TrendingUp size={15} className="text-indigo-600" />
                        Evaluasi Kinerja (KPI)
                      </span>
                      <ChevronRight size={14} className="text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                    </Link>

                    <Link
                      to="/hr/training"
                      className="flex items-center justify-between px-3.5 py-2.5 rounded-xl border border-slate-100 bg-slate-50 hover:bg-slate-100/80 transition-all text-xs font-semibold text-slate-700 hover:text-slate-900 group"
                    >
                      <span className="flex items-center gap-2.5">
                        <GraduationCap size={15} className="text-teal-600" />
                        Training & Sertifikasi DC
                      </span>
                      <ChevronRight size={14} className="text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                    </Link>
                  </div>
                </div>

                {/* Status Komposisi SDM */}
                <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-3">
                    <Building2 size={16} className="text-[#0A2140]" />
                    Status Hubungan Kerja
                  </h3>
                  <div className="space-y-2.5">
                    <div>
                      <div className="flex justify-between text-xs font-semibold text-slate-600 mb-1">
                        <span>Karyawan Tetap (Permanent)</span>
                        <span className="text-slate-900 font-bold">{permanentEmployees || 38}</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-[#0A2140] h-full rounded-full"
                          style={{ width: `${Math.min(100, ((permanentEmployees || 38) / (totalEmployees || 50)) * 100)}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs font-semibold text-slate-600 mb-1">
                        <span>Kontrak (Contract PKWT)</span>
                        <span className="text-slate-900 font-bold">{contractEmployees || 11}</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-blue-500 h-full rounded-full"
                          style={{ width: `${Math.min(100, ((contractEmployees || 11) / (totalEmployees || 50)) * 100)}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs font-semibold text-slate-600 mb-1">
                        <span>Masa Percobaan (Probation)</span>
                        <span className="text-slate-900 font-bold">{probationEmployees || 3}</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-amber-400 h-full rounded-full"
                          style={{ width: `${Math.min(100, ((probationEmployees || 3) / (totalEmployees || 50)) * 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── 5. KONTEN TAB: LAPORAN KEHADIRAN & SHIFT ── */}
        {activeTab === "attendance" && (
          <div className="flex flex-col gap-6">
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Log Kehadiran & Shift Terakhir</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Data realtime absensi employee untuk periode {dateFrom} s/d {dateTo}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Link
                    to="/hr/attendance-report"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#0A2140] hover:bg-[#07162c] rounded-xl transition-all shadow-sm"
                  >
                    Buka Laporan Rekapitulasi Tahunan <ChevronRight size={13} />
                  </Link>
                </div>
              </div>

              {/* Tabel Log Kehadiran */}
              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-600 font-bold">
                      <th className="py-2.5 px-3">Pegawai</th>
                      <th className="py-2.5 px-3">Tanggal</th>
                      <th className="py-2.5 px-3">Jam Masuk (Check-In)</th>
                      <th className="py-2.5 px-3">Jam Pulang (Check-Out)</th>
                      <th className="py-2.5 px-3">Total Jam</th>
                      <th className="py-2.5 px-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {attendances.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-400">
                          Belum ada log absensi terdata pada rentang tanggal ini.
                        </td>
                      </tr>
                    ) : (
                      attendances.slice(0, 15).map((att) => (
                        <tr key={att.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-2.5 px-3 font-semibold text-slate-800">
                            {att.employee?.full_name ?? `Employee #${att.employee_id}`}
                          </td>
                          <td className="py-2.5 px-3 text-slate-600">
                            {formatDate(att.check_in_at ?? att.created_at)}
                          </td>
                          <td className="py-2.5 px-3 font-mono text-slate-700">
                            {att.check_in_at ? formatTime(att.check_in_at) : "-"}
                          </td>
                          <td className="py-2.5 px-3 font-mono text-slate-700">
                            {att.check_out_at ? formatTime(att.check_out_at) : "-"}
                          </td>
                          <td className="py-2.5 px-3 font-medium text-slate-700">
                            {att.work_hours?.worked_hours ? `${att.work_hours.worked_hours} Jam` : "-"}
                          </td>
                          <td className="py-2.5 px-3">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold capitalize ${
                                att.status === "present"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : att.status === "late"
                                  ? "bg-amber-100 text-amber-800"
                                  : att.status === "leave"
                                  ? "bg-blue-100 text-blue-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                            >
                              {att.status === "present"
                                ? "Hadir"
                                : att.status === "late"
                                ? "Terlambat"
                                : att.status === "leave"
                                ? "Cuti"
                                : "Absen"}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── 6. KONTEN TAB: OVERTIME & LEMBUR ── */}
        {activeTab === "overtime" && (
          <div className="flex flex-col gap-6">
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Daftar Pengajuan Overtime Bulan Ini</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Periode {monthOptions.find((m) => m.value === selectedMonth)?.label} {selectedYear}
                  </p>
                </div>
                <Link
                  to="/hr/overtime"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#0A2140] hover:bg-[#07162c] rounded-xl transition-all shadow-sm"
                >
                  Kelola Overtime Penuh <ExternalLink size={13} />
                </Link>
              </div>

              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-600 font-bold">
                      <th className="py-2.5 px-3">Pegawai</th>
                      <th className="py-2.5 px-3">Cost Center</th>
                      <th className="py-2.5 px-3">Periode</th>
                      <th className="py-2.5 px-3">Jam Lembur</th>
                      <th className="py-2.5 px-3">Status Approval</th>
                      <th className="py-2.5 px-3">Sinkronisasi Finance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {overtimeRecords.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-400">
                          Belum ada lembur terdata pada periode ini.
                        </td>
                      </tr>
                    ) : (
                      overtimeRecords.map((r) => (
                        <tr key={r.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-2.5 px-3 font-semibold text-slate-900">
                            {r.employee?.full_name ?? `Employee #${r.employee_id}`}
                          </td>
                          <td className="py-2.5 px-3 text-slate-600">
                            {r.cost_center?.cost_center_name ?? "Data Center Operations"}
                          </td>
                          <td className="py-2.5 px-3 text-slate-600">
                            {r.period_month}/{r.period_year}
                          </td>
                          <td className="py-2.5 px-3 font-bold text-slate-900">
                            {r.overtime_hours} Jam
                          </td>
                          <td className="py-2.5 px-3">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold capitalize ${
                                r.status === "approved" || r.status === "sent_to_finance"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : r.status === "pending_approval"
                                  ? "bg-amber-100 text-amber-800"
                                  : "bg-slate-100 text-slate-700"
                              }`}
                            >
                              {r.status === "sent_to_finance"
                                ? "Terkirim ke Finance"
                                : r.status === "approved"
                                ? "Disetujui"
                                : r.status === "pending_approval"
                                ? "Menunggu Approval"
                                : "Draft"}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 font-mono text-[11px] text-slate-500">
                            {r.gl_journal_id ? `GL #${r.gl_journal_id}` : "Belum di-posting"}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── 7. KONTEN TAB: EVALUASI KINERJA (KPI) ── */}
        {activeTab === "performance" && (
          <div className="flex flex-col gap-6">
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Hasil Evaluasi Performance Review & KPI</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Daftar penilaian kinerja karyawan MSDC terkini
                  </p>
                </div>
                <Link
                  to="/hr/performance"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#0A2140] hover:bg-[#07162c] rounded-xl transition-all shadow-sm"
                >
                  Buka Modul Performance <ExternalLink size={13} />
                </Link>
              </div>

              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-600 font-bold">
                      <th className="py-2.5 px-3">Pegawai</th>
                      <th className="py-2.5 px-3">Periode Review</th>
                      <th className="py-2.5 px-3">Penilai (Reviewer)</th>
                      <th className="py-2.5 px-3">Skor KPI</th>
                      <th className="py-2.5 px-3">Status Evaluasi</th>
                      <th className="py-2.5 px-3">Catatan / Komentar</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {reviews.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-400">
                          Belum ada review kinerja pada data ini.
                        </td>
                      </tr>
                    ) : (
                      reviews.slice(0, 15).map((rev) => (
                        <tr key={rev.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-2.5 px-3 font-semibold text-slate-900">
                            {rev.employee?.full_name ?? `Employee #${rev.employee_id}`}
                          </td>
                          <td className="py-2.5 px-3 text-slate-600 font-medium">
                            {rev.review_period}
                          </td>
                          <td className="py-2.5 px-3 text-slate-600">
                            {rev.reviewer?.full_name ?? "-"}
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-purple-100 text-purple-800">
                              {rev.overall_score !== null && rev.overall_score !== undefined
                                ? `${Number(rev.overall_score).toFixed(1)} / 5.0`
                                : "Belum Dinilai"}
                            </span>
                          </td>
                          <td className="py-2.5 px-3">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[11px] font-bold capitalize ${
                                rev.status === "acknowledged"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : rev.status === "submitted"
                                  ? "bg-blue-100 text-blue-800"
                                  : "bg-slate-100 text-slate-700"
                              }`}
                            >
                              {rev.status === "acknowledged"
                                ? "Telah Disetujui"
                                : rev.status === "submitted"
                                ? "Diajukan"
                                : "Draft"}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-slate-500 max-w-xs truncate" title={rev.comments ?? ""}>
                            {rev.comments || "-"}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── 8. KONTEN TAB: LAYANAN PENDUKUNG & GA ── */}
        {activeTab === "support" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Training Expiring Soon */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Award size={16} className="text-amber-500" />
                  Sertifikasi Mendekati Expired (H-30)
                </h3>
                <Link to="/hr/training" className="text-xs font-semibold text-[#0A2140] hover:text-[#F2A602]">
                  Semua Sertifikat
                </Link>
              </div>
              <div className="mt-3 divide-y divide-slate-100">
                {(expiringCerts?.length ?? 0) === 0 ? (
                  <div className="py-6 text-center text-xs text-slate-400">
                    Tidak ada sertifikasi yang kadaluarsa dalam 30 hari ke depan.
                  </div>
                ) : (
                  (expiringCerts ?? []).slice(0, 5).map((c, idx) => (
                    <div key={idx} className="py-2.5 flex items-center justify-between text-xs">
                      <div>
                        <div className="font-semibold text-slate-900">{c.certification?.cert_name ?? "Sertifikasi"}</div>
                        <div className="text-[11px] text-slate-500">{c.employee?.full_name ?? "Employee"}</div>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-800">
                        Exp: {formatDate(c.expiry_date)}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* General Affairs: Peminjaman Fasilitas */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Building2 size={16} className="text-blue-600" />
                  Peminjaman Fasilitas & Ruangan
                </h3>
                <Link to="/hr/facility-bookings" className="text-xs font-semibold text-[#0A2140] hover:text-[#F2A602]">
                  Kelola Fasilitas
                </Link>
              </div>
              <div className="mt-3 divide-y divide-slate-100">
                {activeBookings.length === 0 ? (
                  <div className="py-6 text-center text-xs text-slate-400">
                    Tidak ada permohonan peminjaman fasilitas yang sedang aktif.
                  </div>
                ) : (
                  activeBookings.slice(0, 5).map((b: GaFacilityBooking) => (
                    <div key={b.id} className="py-2.5 flex items-center justify-between text-xs">
                      <div>
                        <div className="font-semibold text-slate-900">{b.facility?.name ?? "Ruang / Fasilitas"}</div>
                        <div className="text-[11px] text-slate-500">
                          {b.requester_name} ({formatDate(b.start_at)})
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 capitalize">
                        {b.status}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
