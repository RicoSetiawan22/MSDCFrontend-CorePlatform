import { useState } from "react";
// SESUDAH
import { Search, Plus, Clock, Users, CalendarDays, Pencil, LogIn, LogOut, X, FileDown, Settings, Flame, AlertTriangle, Sun, Moon, AlarmClock, ArrowLeftRight, Save } from "lucide-react";
import { PageHeader } from "@shared/components/PageHeader";
import { EmptyState } from "@shared/components/EmptyState";
import { LoadingState } from "@shared/components/LoadingState";
import { Pagination } from "@shared/components/Pagination";
import { Modal } from "@shared/components/Modal";
import { LetterheadPdfModal } from "@shared/components/LetterheadPdfModal";
import { useAuth } from "@shared/lib/auth-context";
import { formatDate, formatTime } from "@shared/lib/format";
import { extractErrorMessage } from "@shared/types/api";
import {
  useShifts, useCreateShift, useUpdateShift, useAttendances, useCheckIn, useCheckOut, useDownloadAttendancePdf,
  useWorkHourPolicy, useUpdateWorkHourPolicy,
} from "../api/useShifts";
import { EmployeePicker, type EmployeePickerResult } from "../components/EmployeePicker";
import { ShiftScheduleBoard } from "./ShiftScheduleBoard";
import { PERMISSION_REQUEST_TYPE_LABELS } from "../types/permission";
import type { PermissionRequestType } from "../types/permission";
import type { Shift, Attendance, ShiftType } from "../types/shift";

type Tab = "shifts" | "schedules" | "attendance";


const SHIFT_TYPES = [
  { value: "regular", label: "Regular", icon: "☀️", color: "#3b82f6" },
  { value: "night", label: "Malam", icon: "🌙", color: "#6366f1" },
  { value: "flexible", label: "Fleksibel", icon: "⏰", color: "#8b5cf6" },
  { value: "split", label: "Split", icon: "🔀", color: "#f59e0b" },
];

const PRESET_TIMES = [
  { label: "Pagi 07:00–15:00", start: "07:00", end: "15:00" },
  { label: "Siang 08:00–16:00", start: "08:00", end: "16:00" },
  { label: "Sore 14:00–22:00", start: "14:00", end: "22:00" },
  { label: "Malam 22:00–06:00", start: "22:00", end: "06:00" },
  { label: "Libur 00:00–00:00", start: "00:00", end: "00:00" },
];

export function ShiftListPage() {
  const { hasPermission } = useAuth();
  const canManageAttendance = hasPermission("attendance.manage");

  const [tab, setTab] = useState<Tab>("shifts");
  const [attPage, setAttPage] = useState(1);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [attEmployee, setAttEmployee] = useState<EmployeePickerResult | null>(null);
  const [pickingAttEmployee, setPickingAttEmployee] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editShift, setEditShift] = useState<Shift | null>(null);
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [showAttPrintModal, setShowAttPrintModal] = useState(false);
  const [showPolicyModal, setShowPolicyModal] = useState(false);

  const { data: shifts, isLoading: shiftsLoading } = useShifts({ include_inactive: true });
  const { data: attendances, isLoading: attLoading } = useAttendances({
    employee_id: attEmployee?.id, date_from: dateFrom, date_to: dateTo, page: attPage, per_page: 20,
  });
  const checkOut = useCheckOut();
  const downloadAttPdf = useDownloadAttendancePdf();

  const totalShifts = shifts?.length ?? 0;
  const activeShifts = (shifts ?? []).filter(s => s.is_active !== false).length;
  const totalAttendances = attendances?.total ?? 0;

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-16">
      <PageHeader
        title="Shift & Attendance"
        subtitle="Pengaturan master shift kerja, roster jadwal operasional, dan rekonsiliasi data absensi pegawai."
      />

      <div className="px-7 py-5 flex flex-col gap-6">
        {/* Workflow Info Banner */}
        <div className="bg-white border border-slate-200/80 border-l-4 border-l-[#F2A602] rounded-2xl p-4 shadow-sm flex items-start sm:items-center gap-3.5 text-xs text-slate-600">
          <div className="p-2 rounded-xl bg-amber-50 text-[#F2A602] shrink-0">
            <Clock size={18} />
          </div>
          <div className="leading-relaxed">
            <strong className="text-slate-900 font-semibold">Alur Shift & Absensi:</strong> 1. Atur pola jam kerja di <span className="font-semibold text-slate-800">Master Shift</span> (pagi, siang, malam, fleksibel). ➔ 2. Susun jadwal kerja pegawai di <span className="font-semibold text-slate-800">Jadwal Shift</span> (drag & drop roster mingguan). ➔ 3. Monitoring riwayat masuk/pulang di <span className="font-semibold text-slate-800">Absensi</span> dengan deteksi otomatis jam lembur & keterlambatan.
          </div>
        </div>

        {/* KPI Stat Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Master Shift</span>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-blue-50 text-blue-600">
                <Clock size={16} />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-bold text-slate-900 tracking-tight">{totalShifts}</span>
              <p className="text-xs text-slate-500 mt-1">Pola waktu kerja terkonfigurasi</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Shift Aktif</span>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-emerald-50 text-emerald-600">
                <CalendarDays size={16} />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-bold text-slate-900 tracking-tight">{activeShifts}</span>
              <p className="text-xs text-emerald-600 font-medium mt-1">Siap dipakai pada roster jadwal</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Data Absensi</span>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-amber-50 text-[#F2A602]">
                <Users size={16} />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-bold text-slate-900 tracking-tight">{totalAttendances}</span>
              <p className="text-xs text-slate-500 mt-1">Catatan check-in/out terdata</p>
            </div>
          </div>
        </div>

        {/* Tab Switcher & Main Container */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          {/* Tab Navigation Bar */}
          <div className="p-2.5 bg-slate-50/70 border-b border-slate-200/80 flex items-center gap-1.5 overflow-x-auto">
            {([
              { key: "shifts" as Tab, label: "Master Shift", icon: <Clock size={15} />, count: totalShifts },
              { key: "schedules" as Tab, label: "Jadwal Shift (Roster)", icon: <CalendarDays size={15} />, count: undefined },
              { key: "attendance" as Tab, label: "Rekap Absensi", icon: <Users size={15} />, count: totalAttendances },
            ] as { key: Tab; label: string; icon: React.ReactNode; count?: number }[]).map(t => {
              const active = tab === t.key;
              return (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                    active
                      ? "bg-white text-[#0A2140] shadow-sm border border-slate-200/80"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/70"
                  }`}
                >
                  <span className={active ? "text-[#0A2140]" : "text-slate-400"}>{t.icon}</span>
                  {t.label}
                  {t.count !== undefined && (
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                      active ? "bg-slate-100 text-[#0A2140]" : "bg-slate-200/60 text-slate-500"
                    }`}>
                      {t.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Sub Toolbar for Current Tab */}
          <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-white">
            {tab === "attendance" && (
              <>
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-medium text-slate-500">Dari:</span>
                    <input
                      className="px-3 py-1.5 text-xs bg-slate-50/70 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-[#0A2140]"
                      type="date"
                      value={dateFrom}
                      onChange={e => { setDateFrom(e.target.value); setAttPage(1); }}
                    />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-medium text-slate-500">Sampai:</span>
                    <input
                      className="px-3 py-1.5 text-xs bg-slate-50/70 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-[#0A2140]"
                      type="date"
                      value={dateTo}
                      onChange={e => { setDateTo(e.target.value); setAttPage(1); }}
                    />
                  </div>
                  {!attEmployee && !pickingAttEmployee && (
                    <button
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all shadow-sm"
                      onClick={() => setPickingAttEmployee(true)}
                    >
                      <Search size={13} className="text-slate-400" /> Filter Employee
                    </button>
                  )}
                  {!attEmployee && pickingAttEmployee && (
                    <div style={{ minWidth: 260 }}>
                      <EmployeePicker
                        onSelect={(emp) => { setAttEmployee(emp); setPickingAttEmployee(false); setAttPage(1); }}
                        onCancel={() => setPickingAttEmployee(false)}
                      />
                    </div>
                  )}
                  {attEmployee && (
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-800 border border-blue-200/60 rounded-xl text-xs font-medium">
                      <span>{attEmployee.full_name}</span>
                      <button
                        type="button"
                        onClick={() => { setAttEmployee(null); setAttPage(1); }}
                        className="text-blue-500 hover:text-blue-800 transition-colors"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 ml-auto">
                  {canManageAttendance && (
                    <button
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all shadow-sm"
                      title="Pengaturan jam kerja standar (acuan overtime)"
                      onClick={() => setShowPolicyModal(true)}
                    >
                      <Settings size={13} className="text-slate-500" /> Kebijakan Jam Kerja
                    </button>
                  )}
                  <button
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all shadow-sm"
                    onClick={() => setShowAttPrintModal(true)}
                  >
                    <FileDown size={13} className="text-slate-500" /> Cetak PDF
                  </button>
                  {canManageAttendance && (
                    <button
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-[#f4ae3e] hover:bg-[#f7a41f] rounded-xl transition-all shadow-sm"
                      onClick={() => setShowCheckInModal(true)}
                    >
                      <LogIn size={13} /> Check-In Manual
                    </button>
                  )}
                </div>
              </>
            )}

            {tab === "shifts" && (
              <>
                <div className="relative flex-1 min-w-[240px] max-w-sm">
                  <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50/70 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0A2140]/10 focus:border-[#0A2140] transition-all"
                    placeholder="Cari master shift..."
                  />
                </div>
                <button
                  className="ml-auto inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-[#f4ae3e] hover:bg-[#f7a41f] rounded-xl transition-all shadow-sm"
                  onClick={() => setShowCreateModal(true)}
                >
                  <Plus size={15} /> Shift Baru
                </button>
              </>
            )}

            {tab === "schedules" && (
              <div className="text-xs text-slate-500 flex items-center gap-2">
                <CalendarDays size={14} className="text-slate-400" />
                Gunakan papan roster di bawah ini untuk mengatur shift mingguan secara drag-and-drop.
              </div>
            )}
          </div>

          {/* Tab: Master Shift Content */}
          {tab === "shifts" && (
            <div className="p-6">
              {shiftsLoading && <LoadingState />}
              {shifts && shifts.length === 0 && (
                <EmptyState title="Belum Ada Shift" subtitle="Daftarkan pola shift kerja baru untuk memulai." />
              )}
              {shifts && shifts.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {shifts.map(s => <ShiftCard key={s.id} shift={s} onEdit={() => setEditShift(s)} />)}
                </div>
              )}
            </div>
          )}

          {/* Tab: Jadwal Shift Board */}
          {tab === "schedules" && (
            <div className="p-6">
              <ShiftScheduleBoard />
            </div>
          )}

          {/* Tab: Absensi Table Content */}
          {tab === "attendance" && (
            <div>
              {attLoading && <LoadingState />}
              {attendances && attendances.data.length === 0 && (
                <div className="p-8">
                  <EmptyState title="Belum Ada Data Absensi" subtitle="Data absensi pegawai akan otomatis tercatat di sini." />
                </div>
              )}
              {attendances && attendances.data.length > 0 && (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50/80 border-b border-slate-200/80">
                          <th className="px-5 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Tanggal</th>
                          <th className="px-5 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Employee</th>
                          <th className="px-5 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Check In</th>
                          <th className="px-5 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Check Out</th>
                          <th className="px-5 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Status</th>
                          <th className="px-5 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Jam Kerja</th>
                          <th className="px-5 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Ijin / Cuti</th>
                          <th className="px-5 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Catatan</th>
                          {canManageAttendance && (
                            <th className="px-5 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-right">Aksi</th>
                          )}
                        </tr>
                      </thead>
                      <tbody>
                        {attendances.data.map(att => {
                          const isOutType = att.permission_request?.type === "izin_keluar";
                          const ijinTooltip = att.permission_request
                            ? att.permission_request.request_number + (isOutType && att.permission_request.out_start_time && att.permission_request.out_end_time
                                ? ` — keluar ${att.permission_request.out_start_time.substring(0, 5)}–${att.permission_request.out_end_time.substring(0, 5)}`
                                : "")
                            : undefined;
                          return (
                            <tr key={att.id} className="hover:bg-slate-50/60 transition-colors border-b border-slate-100">
                              <td className="px-5 py-3.5 font-mono text-xs text-slate-600">{formatDate(att.attendance_date)}</td>
                              <td className="px-5 py-3.5 text-sm font-semibold text-slate-900">{att.employee?.full_name ?? "—"}</td>
                              <td className="px-5 py-3.5 font-mono text-xs font-semibold text-emerald-600">
                                {formatTime(att.check_in_at) || "—"}
                              </td>
                              <td className="px-5 py-3.5 font-mono text-xs font-semibold text-rose-600">
                                {formatTime(att.check_out_at) || "—"}
                              </td>
                              <td className="px-5 py-3.5">
                                <AttendanceBadge status={att.status} />
                                <ScheduleWarnings check={att.schedule_check} status={att.status} />
                              </td>
                              <td className="px-5 py-3.5">
                                {att.work_hours ? (
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-mono text-xs font-bold text-slate-700">{att.work_hours.worked_hours}j</span>
                                    <span className="text-[11px] text-slate-400">/ std {att.work_hours.standard_hours}j</span>
                                    {att.work_hours.is_overtime && (
                                      <span
                                        className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200/60"
                                        title="Overtime berdasarkan Kebijakan Jam Kerja"
                                      >
                                        <Flame size={10} /> +{att.work_hours.overtime_hours}j
                                      </span>
                                    )}
                                  </div>
                                ) : "—"}
                              </td>
                              <td className="px-5 py-3.5">
                                {att.permission_request ? (
                                  <span
                                    className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-purple-50 text-purple-700 border border-purple-200/60"
                                    title={ijinTooltip}
                                  >
                                    {PERMISSION_REQUEST_TYPE_LABELS[att.permission_request.type as PermissionRequestType] ?? att.permission_request.type}
                                  </span>
                                ) : (
                                  <span className="text-slate-400 text-xs">—</span>
                                )}
                              </td>
                              <td className="px-5 py-3.5 text-xs text-slate-500 max-w-[160px] truncate">{att.notes ?? "—"}</td>
                              {canManageAttendance && (
                                <td className="px-5 py-3.5 text-right">
                                  {att.check_in_at && !att.check_out_at && (
                                    <button
                                      className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg border border-rose-200/60 transition-colors"
                                      disabled={checkOut.isPending}
                                      onClick={() => {
                                        checkOut.mutate(att.id, {
                                          onError: (e: Error) => alert("Gagal: " + extractErrorMessage(e)),
                                        });
                                      }}
                                    >
                                      <LogOut size={12} /> Check-Out
                                    </button>
                                  )}
                                </td>
                              )}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  <div className="px-6 py-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-white">
                    <span className="text-xs text-slate-500">
                      Menampilkan halaman <strong className="text-slate-700">{attendances.current_page}</strong> dari <strong className="text-slate-700">{attendances.last_page}</strong> (total {attendances.total} data absensi)
                    </span>
                    <Pagination currentPage={attendances.current_page} lastPage={attendances.last_page} total={attendances.total} onPageChange={setAttPage} />
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {showCreateModal && (
        <CreateShiftModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => setShowCreateModal(false)}
        />
      )}
      {editShift && (
        <EditShiftModal
          shift={editShift}
          onClose={() => setEditShift(null)}
        />
      )}
      {showCheckInModal && (
        <CheckInModal
          onClose={() => setShowCheckInModal(false)}
        />
      )}
      {showAttPrintModal && (
        <LetterheadPdfModal
          title="Cetak PDF — Rekap Absensi"
          onClose={() => setShowAttPrintModal(false)}
          onDownload={(organizationId) => downloadAttPdf.mutateAsync({
            organizationId,
            params: { employee_id: attEmployee?.id, date_from: dateFrom || undefined, date_to: dateTo || undefined },
          })}
        />
      )}
      {showPolicyModal && (
        <WorkHourPolicyModal
          onClose={() => setShowPolicyModal(false)}
        />
      )}
    </div>
  );
}


function CheckInModal({ onClose }: { onClose: () => void }) {
  const [employee, setEmployee] = useState<EmployeePickerResult | null>(null);
  const [pickingEmployee, setPickingEmployee] = useState(true);
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [checkInTime, setCheckInTime] = useState(() => new Date().toTimeString().slice(0, 5));
  const [checkOutTime, setCheckOutTime] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const checkIn = useCheckIn();

  function handleSubmit() {
    if (!employee) { setError("Pilih employee terlebih dahulu."); return; }
    if (!date || !checkInTime) { setError("Tanggal dan jam check-in wajib diisi."); return; }
    setError(null);
    checkIn.mutate({
      employeeId: employee.id,
      values: {
        attendance_date: date,
        check_in_at: checkInTime,
        check_out_at: checkOutTime || undefined,
        notes: notes || undefined,
      },
    }, {
      onSuccess: onClose,
      onError: (e: Error) => setError(extractErrorMessage(e)),
    });
  }

  return (
    <Modal title="Check-In Employee" onClose={onClose} maxWidth={460}>
      <div style={{ marginBottom: "1rem" }}>
        <label className="input-label">Employee</label>
        {!employee || pickingEmployee ? (
          <EmployeePicker
            onSelect={(emp) => { setEmployee(emp); setPickingEmployee(false); }}
            onCancel={() => setPickingEmployee(false)}
          />
        ) : (
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", padding: "0.5rem 0.7rem", background: "var(--bg-subtle)", borderRadius: 6 }}>
            <div style={{ flex: 1, fontSize: "0.85rem", fontWeight: 600 }}>{employee.full_name}</div>
            <button type="button" className="btn btn-secondary" style={{ fontSize: "0.78rem", padding: "0.3rem 0.6rem" }} onClick={() => setPickingEmployee(true)}>
              Ganti
            </button>
          </div>
        )}
      </div>

      <div style={{ marginBottom: "1rem" }}>
        <label className="input-label">Tanggal</label>
        <input className="input" type="date" style={{ width: "100%" }} value={date} onChange={e => setDate(e.target.value)} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "1rem" }}>
        <div>
          <label className="input-label">Jam Check-In</label>
          <input className="input" type="time" style={{ width: "100%" }} value={checkInTime} onChange={e => setCheckInTime(e.target.value)} />
        </div>
        <div>
          <label className="input-label">Jam Check-Out (opsional)</label>
          <input className="input" type="time" style={{ width: "100%" }} value={checkOutTime} onChange={e => setCheckOutTime(e.target.value)} />
        </div>
      </div>

      <div style={{ marginBottom: "1rem" }}>
        <label className="input-label">Catatan (opsional)</label>
        <input className="input" style={{ width: "100%" }} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Catatan check-in..." />
      </div>

      <div style={{
        fontSize: "0.75rem", color: "var(--grey)", background: "var(--bg-subtle)",
        borderRadius: 8, padding: "0.6rem 0.75rem", marginBottom: "1rem",
      }}>
        Karena tanggal & jam diinput manual, absensi ini akan disimpan dengan status <strong>Manual</strong> (bukan dihitung otomatis Hadir/Terlambat).
      </div>

      {error && <div className="input-error" style={{ marginBottom: "1rem" }}>{error}</div>}

      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
        <button type="button" className="btn btn-secondary" onClick={onClose}>Batal</button>
        <button className="btn btn-primary" disabled={checkIn.isPending || !employee} onClick={handleSubmit}>
          {checkIn.isPending ? "Menyimpan..." : "Check-In"}
        </button>
      </div>
    </Modal>
  );
}

function ShiftCard({ shift, onEdit }: { shift: Shift; onEdit: () => void }) {
  const isNight = shift.shift_type === "night" || shift.start_time >= "18:00" || shift.start_time <= "06:00";
  const typeInfo = SHIFT_TYPES.find(t => t.value === shift.shift_type) ?? SHIFT_TYPES[0];
  const duration = calculateDuration(shift.start_time, shift.end_time);
  const isArchived = shift.is_active === false;

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: "1rem",
      padding: "0.875rem 1rem",
      background: isArchived ? "#1e293b" : (isNight ? "linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)" : "linear-gradient(135deg, #1e3a5f 0%, #1e40af 100%)"),
      borderRadius: 14, cursor: "default",
      border: isArchived ? "1px dashed #475569" : "1px solid rgba(255,255,255,0.06)",
      boxShadow: isArchived ? "none" : "0 2px 8px rgba(0,0,0,0.3)",
      opacity: isArchived ? 0.6 : 1,
    }}>
      <div style={{
        width: 48, height: 48, borderRadius: 12,
        background: "rgba(255,255,255,0.12)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: "1.3rem", flexShrink: 0,
      }}>
        {isNight ? "🌙" : "☀️"}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontFamily: "monospace", fontSize: "0.78rem", color: "#60a5fa", background: "rgba(96,165,250,0.15)", padding: "0.1rem 0.4rem", borderRadius: 4 }}>
            {shift.shift_code}
          </span>
          <span style={{ fontWeight: 700, fontSize: "1rem", color: "#f1f5f9" }}>{shift.shift_name}</span>
          <span style={{
            fontSize: "0.7rem", padding: "0.15rem 0.5rem", borderRadius: 20,
            background: `${typeInfo.color}22`, color: typeInfo.color,
            border: `1px solid ${typeInfo.color}44`,
          }}>
            {typeInfo.icon} {typeInfo.label}
          </span>
          {isArchived && (
            <span style={{ fontSize: "0.7rem", padding: "0.15rem 0.5rem", borderRadius: 20, background: "rgba(148,163,184,0.15)", color: "#94a3b8", border: "1px solid rgba(148,163,184,0.3)" }}>
              Arsip
            </span>
          )}
        </div>
        <div style={{ display: "flex", gap: 16, marginTop: 4 }}>
          <span style={{ fontSize: "0.8rem", color: "#94a3b8" }}>
            🕐 {shift.start_time} – {shift.end_time}
          </span>
          <span style={{ fontSize: "0.8rem", color: "#60a5fa", fontWeight: 600 }}>
            ⏱ {duration}
          </span>
          {isArchived && (
            <span style={{ fontSize: "0.75rem", color: "#64748b", fontStyle: "italic" }}>
              Jam ini masih dipakai jadwal/absensi lama - tidak bisa diedit lagi
            </span>
          )}
        </div>
      </div>

      {!isArchived && (
        <button className="btn btn-secondary" style={{ padding: "0.4rem 0.6rem", flexShrink: 0 }} title="Edit Shift" onClick={onEdit}>
          <Pencil size={14} />
        </button>
      )}

      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
        <div style={{
          fontSize: "1.1rem", fontWeight: 800, color: "#f1f5f9",
          fontFamily: "monospace",
        }}>
          {duration}
        </div>
        <div style={{ width: 80, height: 4, background: "rgba(255,255,255,0.1)", borderRadius: 2 }}>
          <div style={{
            width: `${Math.min((parseDuration(duration) / 12) * 100, 100)}%`,
            height: "100%", background: "#60a5fa", borderRadius: 2,
          }} />
        </div>
      </div>
    </div>
  );
}

function AttendanceBadge({ status }: { status: string }) {
  const meta: Record<string, { bg: string; text: string; dot: string; label: string }> = {
    present: { bg: "bg-emerald-50 border-emerald-200/60", text: "text-emerald-700", dot: "bg-emerald-500", label: "Hadir" },
    late: { bg: "bg-amber-50 border-amber-200/60", text: "text-amber-700", dot: "bg-amber-500", label: "Terlambat" },
    absent: { bg: "bg-rose-50 border-rose-200/60", text: "text-rose-700", dot: "bg-rose-500", label: "Absen" },
    leave: { bg: "bg-blue-50 border-blue-200/60", text: "text-blue-700", dot: "bg-blue-500", label: "Cuti" },
    manual: { bg: "bg-purple-50 border-purple-200/60", text: "text-purple-700", dot: "bg-purple-500", label: "Manual" },
  };
  const item = meta[status] ?? { bg: "bg-slate-100 border-slate-200", text: "text-slate-600", dot: "bg-slate-400", label: status };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${item.bg} ${item.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${item.dot}`} />
      {item.label}
    </span>
  );
}

const SCHEDULE_WARNING_LABELS: Record<string, string> = {
  shift_tidak_cocok: "Shift tidak cocok",
  terlambat: "Terlambat vs jadwal",
  pulang_cepat: "Pulang cepat",
};

/** Warning tambahan di bawah badge Status kalau jam check-in/out TIDAK
 * cocok dengan jadwal shift-nya (lihat ShiftAttendanceService::
 * checkAgainstSchedule()) - paling relevan buat status 'manual' (entry
 * bebas dari HR/koreksi Ijin yang tidak lewat verifikasi otomatis
 * checkIn()), tapi juga jalan untuk status lain karena checkOut() pun
 * sebelumnya tidak pernah dibandingkan ke jadwal. Warning "terlambat"
 * disembunyikan kalau status sudah 'late' (sudah kelihatan di badge
 * Status, tidak perlu diulang). */
function ScheduleWarnings({ check, status }: { check?: Attendance["schedule_check"]; status: string }) {
  if (!check || check.warnings.length === 0) return null;
  const warnings = check.warnings.filter(w => !(w === "terlambat" && status === "late"));
  if (warnings.length === 0) return null;

  return (
    <div style={{ marginTop: 4, display: "flex", flexDirection: "column", gap: 2 }}>
      {warnings.map(w => (
        <span key={w} title={check.shift_name ? `Jadwal: ${check.shift_name} (${check.shift_start?.substring(0, 5)}–${check.shift_end?.substring(0, 5)})` : "Tidak ada jadwal shift untuk tanggal ini"}
          style={{ fontSize: "0.65rem", fontWeight: 700, color: "#c2410c", display: "flex", alignItems: "center", gap: 3 }}>
          <AlertTriangle size={10} /> {SCHEDULE_WARNING_LABELS[w] ?? w}
        </span>
      ))}
    </div>
  );
}

// ─── Create Shift Modal ──────────────────────────────────────────────────────────
// SESUDAH
const SHIFT_TYPE_UI: Record<string, { icon: React.ReactNode; desc: string }> = {
  regular: { icon: <Sun size={16} />, desc: "Jam kantor normal" },
  night: { icon: <Moon size={16} />, desc: "Lintas hari (graveyard)" },
  flexible: { icon: <AlarmClock size={16} />, desc: "Bebas durasi target" },
  split: { icon: <ArrowLeftRight size={16} />, desc: "2 interval terpisah" },
};

function CreateShiftModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [shiftName, setShiftName] = useState("");
  const [startTime, setStartTime] = useState("08:00");
  const [endTime, setEndTime] = useState("17:00");
  const [shiftType, setShiftType] = useState("regular");
  const createShift = useCreateShift();

  function applyPreset(p: typeof PRESET_TIMES[0]) {
    setStartTime(p.start);
    setEndTime(p.end);
    if (p.start >= "18:00" || p.start <= "06:00") setShiftType("night");
    else if (p.label.includes("Split")) setShiftType("split");
    else setShiftType("regular");
  }

  function handleReset() {
    setShiftName(""); setStartTime("08:00"); setEndTime("17:00"); setShiftType("regular");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!shiftName || !startTime || !endTime) {
      alert("Semua field wajib diisi."); return;
    }
    createShift.mutate({
      shift_name: shiftName,
      start_time: startTime, end_time: endTime, shift_type: shiftType as ShiftType,
    }, {
      onSuccess: () => { alert("Shift berhasil dibuat!"); onSuccess(); },
      onError: (e: Error) => alert("Gagal: " + e.message),
    });
  }

  const selectedType = SHIFT_TYPES.find(t => t.value === shiftType)!;
  const duration = calculateDuration(startTime, endTime);

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="form-modal" style={{ maxWidth: 560, borderRadius: 20 }}>
        <div className="form-modal__header">
          <div className="form-modal__title-row">
            <h2 className="form-modal__title">Shift Baru</h2>
            <span className="form-modal__badge">ERP Jadwal</span>
            <button type="button" className="form-modal__close" onClick={onClose} style={{ marginLeft: "auto" }}>✕</button>
          </div>
          <p className="form-modal__subtitle">Tambahkan jadwal shift baru untuk divisi dan operasional tim.</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", minHeight: 0, flex: 1 }}>
          <div className="form-modal__scroll">
            <div className="form-section" style={{ display: "flex", flexDirection: "column", gap: "1.1rem" }}>

              {/* Preview strip - tetap navy seperti desain */}
              <div style={{
                display: "flex", alignItems: "center", gap: "0.85rem", padding: "0.85rem 1rem",
                background: "var(--color-primary-navy)", borderRadius: 14,
              }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                  background: "rgba(242,166,2,0.15)", border: "1px solid rgba(242,166,2,0.4)",
                  color: "var(--color-primary-gold)", display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  {SHIFT_TYPE_UI[shiftType]?.icon}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.08em", color: "#8a99ad", textTransform: "uppercase" }}>
                    Preview Shift
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <span style={{ fontWeight: 700, fontSize: "0.95rem", color: "#fff" }}>{shiftName || "Nama shift"}</span>
                    <span style={{ fontFamily: "monospace", fontSize: "0.85rem", fontWeight: 700, color: "var(--color-primary-gold)" }}>
                      {startTime} – {endTime}
                    </span>
                    <span style={{ fontSize: "0.7rem", color: "#cbd5e1", background: "rgba(255,255,255,0.1)", padding: "0.1rem 0.4rem", borderRadius: 6 }}>
                      {duration}
                    </span>
                  </div>
                </div>
                <span style={{
                  fontSize: "0.72rem", fontWeight: 700, padding: "0.25rem 0.7rem", borderRadius: 999,
                  background: "var(--color-primary-gold)", color: "var(--color-primary-navy)",
                }}>
                  {selectedType.label}
                </span>
              </div>

              {/* Nama - kode shift auto-generated dari Number Sequence, tidak diketik manual */}
              <div>
                <label className="input-label">Nama Shift <span style={{ color: "var(--bad)" }}>*</span></label>
                <input className="input" value={shiftName} onChange={e => setShiftName(e.target.value)}
                  placeholder="Contoh: Shift Pagi" style={{ width: "100%" }} />
              </div>

              {/* Jam */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                <div>
                  <label className="input-label">Jam Mulai</label>
                  <input className="input" type="time" value={startTime} onChange={e => setStartTime(e.target.value)} style={{ width: "100%" }} />
                </div>
                <div>
                  <label className="input-label">Jam Selesai</label>
                  <input className="input" type="time" value={endTime} onChange={e => setEndTime(e.target.value)} style={{ width: "100%" }} />
                </div>
              </div>

              {/* Preset */}
              <div>
                <label className="input-label">Preset Waktu</label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {PRESET_TIMES.map(p => {
                    const active = startTime === p.start && endTime === p.end;
                    return (
                      <button type="button" key={p.label} onClick={() => applyPreset(p)}
                        style={{
                          padding: "0.35rem 0.7rem", borderRadius: 8, cursor: "pointer", fontSize: "0.75rem",
                          border: `1px solid ${active ? "var(--color-primary-gold)" : "var(--border)"}`,
                          background: active ? "var(--color-semantic-warning-bg)" : "#fff",
                          color: active ? "var(--color-semantic-warning-text)" : "var(--grey-dark)",
                          fontWeight: active ? 600 : 400,
                        }}>
                        {p.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Tipe Shift */}
              <div>
                <label className="input-label">Tipe Shift</label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  {SHIFT_TYPES.map(t => {
                    const active = shiftType === t.value;
                    return (
                      <button type="button" key={t.value} onClick={() => setShiftType(t.value)}
                        style={{
                          display: "flex", alignItems: "center", gap: 10, textAlign: "left", cursor: "pointer",
                          padding: "0.65rem 0.8rem", borderRadius: 12,
                          border: `2px solid ${active ? "var(--color-primary-gold)" : "var(--border)"}`,
                          background: active ? "var(--color-semantic-warning-bg)" : "#fff",
                        }}>
                        <span style={{
                          width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          background: "var(--bg-subtle)", color: active ? "var(--color-primary-gold)" : "var(--grey-dark)",
                        }}>
                          {SHIFT_TYPE_UI[t.value]?.icon}
                        </span>
                        <span>
                          <span style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, color: "#1c2333" }}>{t.label}</span>
                          <span style={{ display: "block", fontSize: "0.72rem", color: "var(--grey)" }}>{SHIFT_TYPE_UI[t.value]?.desc}</span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          <div className="form-modal__footer">
            <button type="button" className="btn btn-secondary" onClick={handleReset}>Reset Form</button>
            <div style={{ display: "flex", gap: 8 }}>
              <button type="button" className="btn btn-secondary" onClick={onClose}>Batal</button>
              <button type="submit" className="btn btn-accent" disabled={createShift.isPending}>
                <Save size={15} /> {createShift.isPending ? "Menyimpan..." : "Simpan Shift"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Edit Shift Modal ────────────────────────────────────────────────────────────
function EditShiftModal({ shift, onClose }: { shift: Shift; onClose: () => void }) {
  const [shiftName, setShiftName] = useState(shift.shift_name);
  const [startTime, setStartTime] = useState(shift.start_time.slice(0, 5));
  const [endTime, setEndTime] = useState(shift.end_time.slice(0, 5));
  const [error, setError] = useState<string | null>(null);
  const updateShift = useUpdateShift();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!shiftName || !startTime || !endTime) { setError("Semua field wajib diisi."); return; }
    setError(null);
    updateShift.mutate({
      id: shift.id,
      values: { shift_name: shiftName, start_time: startTime, end_time: endTime },
    }, {
      onSuccess: (res) => { alert(res.message); onClose(); },
      onError: (e: Error) => setError(extractErrorMessage(e)),
    });
  }

  // SESUDAH
  const duration = calculateDuration(startTime, endTime);

  function handleReset() {
    setShiftName(shift.shift_name);
    setStartTime(shift.start_time.slice(0, 5));
    setEndTime(shift.end_time.slice(0, 5));
    setError(null);
  }

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="form-modal" style={{ maxWidth: 520, borderRadius: 20 }}>
        <div className="form-modal__header">
          <div className="form-modal__title-row">
            <h2 className="form-modal__title">Edit Shift</h2>
            <button type="button" className="form-modal__close" onClick={onClose} style={{ marginLeft: "auto" }}>✕</button>
          </div>
          <p className="form-modal__subtitle" style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Clock size={13} /> {shift.start_time.slice(0, 5)} – {shift.end_time.slice(0, 5)} saat ini
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", minHeight: 0, flex: 1 }}>
          <div className="form-modal__scroll modal-scroll-hidden">
            <div className="form-section" style={{ display: "flex", flexDirection: "column", gap: "1.1rem" }}>

              <div style={{
                fontSize: "0.78rem", lineHeight: 1.55, color: "var(--color-semantic-info-text)",
                background: "var(--color-semantic-info-bg)", border: "1px solid rgba(26,115,232,0.2)",
                borderRadius: 12, padding: "0.7rem 0.85rem",
              }}>
                Kalau shift ini sudah pernah dipakai di jadwal, jam lama akan tetap tersimpan untuk jadwal/absensi yang sudah ada — sistem otomatis membuat shift baru dengan jam yang diedit, bukan mengubah jam yang lama.
              </div>

              <div>
                <label className="input-label">Kode Shift</label>
                <div style={{
                  padding: "0.55rem 0.75rem", background: "var(--bg-subtle)", border: "1px solid var(--border)",
                  borderRadius: "var(--radius)", fontFamily: "monospace", fontWeight: 700, color: "var(--grey-dark)", fontSize: "0.875rem",
                }}>
                  {shift.shift_code}
                </div>
                <div className="form-section__hint" style={{ marginTop: 4 }}>
                  Auto-generated - tidak bisa diubah. Kalau shift ini sudah dipakai jadwal, versi barunya dapat kode baru otomatis.
                </div>
              </div>

              <div>
                <label className="input-label">Nama Shift <span style={{ color: "var(--bad)" }}>*</span></label>
                <input className="input" value={shiftName} onChange={e => setShiftName(e.target.value)} style={{ width: "100%" }} />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                <div>
                  <label className="input-label">Jam Mulai</label>
                  <input className="input" type="time" value={startTime} onChange={e => setStartTime(e.target.value)} style={{ width: "100%" }} />
                </div>
                <div>
                  <label className="input-label">Jam Selesai</label>
                  <input className="input" type="time" value={endTime} onChange={e => setEndTime(e.target.value)} style={{ width: "100%" }} />
                </div>
              </div>

              <div style={{ fontSize: "0.82rem", color: "var(--color-primary-navy)", fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
                <Clock size={14} /> Durasi: {duration}
              </div>

              {error && <div className="input-error">{error}</div>}
            </div>
          </div>

          <div className="form-modal__footer">
            <button type="button" className="btn btn-secondary" onClick={handleReset}>Reset</button>
            <div style={{ display: "flex", gap: 8 }}>
              <button type="button" className="btn btn-secondary" onClick={onClose}>Batal</button>
              <button type="submit" className="btn btn-accent" disabled={updateShift.isPending}>
                <Save size={15} /> {updateShift.isPending ? "Menyimpan..." : "Simpan Perubahan"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Work Hour Policy Modal ──────────────────────────────────────────────────────
// Acuan jam kerja standar buat overtime (lihat ShiftAttendanceService::
// calculateOvertimeByPolicy() di backend) - kolom "Jam Kerja" di tab Absensi
// bandingkan jam kerja aktual (check-in ke check-out, aman buat shift lewat
// tengah malam) terhadap angka ini, weekday_hours dipakai Senin-Jumat,
// weekend_holiday_hours dipakai Sabtu/Minggu ATAU tanggal yang ada di
// kalender hari libur (Core Platform).
function WorkHourPolicyModal({ onClose }: { onClose: () => void }) {
  const { data: policy, isLoading } = useWorkHourPolicy();
  const [weekdayHours, setWeekdayHours] = useState("8");
  const [weekendHours, setWeekendHours] = useState("5");
  const [initialized, setInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const update = useUpdateWorkHourPolicy();

  if (policy && !initialized) {
    setWeekdayHours(String(policy.weekday_hours));
    setWeekendHours(String(policy.weekend_holiday_hours));
    setInitialized(true);
  }

  function handleSubmit() {
    const weekday = parseFloat(weekdayHours);
    const weekend = parseFloat(weekendHours);
    if (isNaN(weekday) || isNaN(weekend) || weekday < 0 || weekend < 0) {
      setError("Isi jam kerja dengan angka yang valid.");
      return;
    }
    setError(null);
    update.mutate({ weekday_hours: weekday, weekend_holiday_hours: weekend }, {
      onSuccess: onClose,
      onError: (e: Error) => setError(extractErrorMessage(e)),
    });
  }

  return (
    <Modal title="Pengaturan Jam Kerja" onClose={onClose} maxWidth={420}>
      <p style={{ fontSize: "0.82rem", color: "var(--grey)", marginBottom: "1rem" }}>
        Jam kerja standar ini dipakai sebagai acuan overtime/lembur - selisih jam kerja aktual (check-in ke check-out) di atas angka ini dianggap overtime, muncul di kolom "Jam Kerja" tab Absensi.
      </p>
      {isLoading ? <LoadingState /> : (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "1rem" }}>
            <div>
              <label className="input-label">Senin – Jumat (jam)</label>
              <input className="input" type="number" min={0} max={24} step={0.5} style={{ width: "100%" }}
                value={weekdayHours} onChange={e => setWeekdayHours(e.target.value)} />
            </div>
            <div>
              <label className="input-label">Sabtu/Minggu atau Hari Libur (jam)</label>
              <input className="input" type="number" min={0} max={24} step={0.5} style={{ width: "100%" }}
                value={weekendHours} onChange={e => setWeekendHours(e.target.value)} />
            </div>
          </div>
          <div style={{ fontSize: "0.75rem", color: "var(--grey)", background: "var(--bg-subtle)", borderRadius: 8, padding: "0.6rem 0.75rem", marginBottom: "1rem" }}>
            Hari libur diambil dari kalender Hari Libur (Core Platform) - tanggal merah tahunan otomatis ikut terhitung tiap tahun.
          </div>
          {error && <div className="input-error" style={{ marginBottom: "1rem" }}>{error}</div>}
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Batal</button>
            <button className="btn btn-primary" disabled={update.isPending} onClick={handleSubmit}>
              {update.isPending ? "Menyimpan..." : "Simpan"}
            </button>
          </div>
        </>
      )}
    </Modal>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────────
function calculateDuration(start: string, end: string): string {
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  let diff = (eh * 60 + em) - (sh * 60 + sm);
  if (diff < 0) diff += 24 * 60;
  if (diff === 0) return "0j";
  const h = Math.floor(diff / 60);
  const m = diff % 60;
  return m > 0 ? `${h}j ${m}m` : `${h}j`;
}

function parseDuration(dur: string): number {
  const match = dur.match(/(\d+)j/);
  return match ? parseInt(match[1]) : 0;
}
