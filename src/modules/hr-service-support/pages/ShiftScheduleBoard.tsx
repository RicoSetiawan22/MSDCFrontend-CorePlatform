import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, X, GripVertical } from "lucide-react";
import { useEmployeeList } from "../api/useEmployees";
import { useShifts, useShiftSchedules, useCreateSchedule, useMoveSchedule, useDeleteSchedule, useConfirmSchedule } from "../api/useShifts";
import { useSiteList } from "@modules/data-center-ops/api/useSites";
import { LoadingState } from "@shared/components/LoadingState";
import { extractErrorMessage } from "@shared/types/api";
import type { Shift, ShiftSchedule } from "../types/shift";
import type { Site } from "@modules/data-center-ops/types/site";

const DAY_LABELS = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];
const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

const CHIP_COLORS = [
  { bg: "#dbeafe", border: "#93c5fd", color: "#1d4ed8" },
  { bg: "#ede9fe", border: "#c4b5fd", color: "#6d28d9" },
  { bg: "#fef3c7", border: "#fcd34d", color: "#b45309" },
  { bg: "#dcfce7", border: "#86efac", color: "#15803d" },
  { bg: "#fce7f3", border: "#f9a8d4", color: "#be185d" },
  { bg: "#e0f2fe", border: "#7dd3fc", color: "#0369a1" },
];

function colorForShift(shiftId: number) {
  return CHIP_COLORS[shiftId % CHIP_COLORS.length];
}

/** Format tanggal LOKAL sebagai YYYY-MM-DD - JANGAN pakai toISOString()
 * (itu konversi ke UTC dulu, jadi tanggal-tengah-malam-lokal bisa mundur
 * satu hari untuk timezone di timur UTC, mis. WIB/GMT+7 - kolom "28 Agu"
 * akan diam-diam menyimpan/membaca data ke "27 Agu"). */
function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Senin sebagai awal minggu (konvensi Indonesia), bukan Minggu. */
function startOfWeek(d: Date): Date {
  const copy = new Date(d);
  const day = copy.getDay(); // 0=Minggu, 1=Senin, ...
  const diff = day === 0 ? -6 : 1 - day;
  copy.setDate(copy.getDate() + diff);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function addDays(d: Date, n: number): Date {
  const copy = new Date(d);
  copy.setDate(copy.getDate() + n);
  return copy;
}

type DragPayload =
  | { type: "palette"; shiftId: number }
  | { type: "existing"; scheduleId: number };

/**
 * Board drag-and-drop untuk Jadwal Shift - employee jadi baris, hari jadi
 * kolom, drag chip shift dari palet ke sel untuk assign. Geser chip yang
 * sudah ada ke sel lain untuk pindah (UPDATE, bukan hapus+buat baru - lihat
 * useMoveSchedule/ShiftAttendanceService::moveSchedule()). Klik × untuk
 * hapus. 1 employee cuma boleh 1 shift per hari (unique constraint
 * backend) - drop ke sel yang sudah terisi akan MENGGANTI shift-nya
 * (dari palet) atau ditolak dengan pesan (dari chip lain).
 */
type PickerTarget = { employeeId: number; employeeName: string; date: string; existing?: ShiftSchedule; positionSiteId: number | null };

type ViewMode = "kantor" | "lapangan";

export function ShiftScheduleBoard() {
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));
  const [empSearch, setEmpSearch] = useState("");
  // Kantor/Lapangan dipisah EKSPLISIT (dulu satu dropdown site yang
  // implisit merangkap jadi toggle "semua employee" vs "employee lapangan"
  // - membingungkan karena tidak jelas kapan site_id-nya ke-set). Kantor:
  // tanpa konsep site sama sekali. Lapangan: WAJIB pilih site dulu supaya
  // board jadi roster site itu (siapa saja petugas lapangan yang biasanya
  // di site ini, lihat Position.site_id) - jadwal yang dibuat di sini
  // otomatis ditandai site_id-nya, jadi langsung terhitung di widget
  // "Petugas Bertugas Hari Ini" Dashboard DC Ops.
  const [viewMode, setViewMode] = useState<ViewMode>("kantor");
  const [siteId, setSiteId] = useState("");
  const [dragOverCell, setDragOverCell] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [pickerTarget, setPickerTarget] = useState<PickerTarget | null>(null);

  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart]);
  const dateFrom = toISODate(days[0]);
  const dateTo = toISODate(days[6]);

  const { data: shifts, isLoading: shiftsLoading } = useShifts();
  const { data: sitesPage } = useSiteList({ per_page: 100 });
  const { data: employeesPage, isLoading: empLoading } = useEmployeeList({
    per_page: 50, search: empSearch || undefined,
    work_location: viewMode === "lapangan" ? "field" : "office",
  });
  const { data: schedulesPage, isLoading: schedLoading } = useShiftSchedules({
    date_from: dateFrom, date_to: dateTo, per_page: 500,
    site_id: siteId ? Number(siteId) : undefined,
  });

  const createSchedule = useCreateSchedule();
  const moveSchedule = useMoveSchedule();
  const deleteSchedule = useDeleteSchedule();
  const confirmSchedule = useConfirmSchedule();

  const sites = useMemo(() => sitesPage?.data ?? [], [sitesPage]);
  const needsSitePick = viewMode === "lapangan" && !siteId;
  // Lapangan + site dipilih + tidak sedang cari nama -> persempit ke
  // petugas yang POSISINYA memang biasanya di site ini (Position.site_id),
  // supaya board langsung nunjukkin "tim site ini" bukan semua petugas
  // lapangan se-organisasi. Ketik nama tetap bisa cari siapa saja (buat
  // rotasi/pinjam dari site lain).
  const employees = useMemo(() => {
    const raw = employeesPage?.data ?? [];
    if (viewMode !== "lapangan" || !siteId || empSearch) return raw;
    return raw.filter(e => e.position?.site_id === Number(siteId));
  }, [employeesPage, viewMode, siteId, empSearch]);
  // Lookup nama site dari site_id jadwal - ditampilkan sebagai badge di chip
  // supaya kelihatan sekilas jadwal mana yang TIDAK punya site (dan karena
  // itu tidak akan muncul di widget "Petugas Bertugas Hari Ini" Dashboard
  // DC Ops, lihat DashboardService::onDutyToday() yang mensyaratkan site_id
  // terisi).
  const siteNameById = useMemo(() => {
    const map = new Map<number, string>();
    for (const s of sites) map.set(s.id, s.site_code);
    return map;
  }, [sites]);

  const scheduleMap = useMemo(() => {
    const map = new Map<string, ShiftSchedule>();
    for (const s of schedulesPage?.data ?? []) {
      map.set(`${s.employee_id}:${s.schedule_date.slice(0, 10)}`, s);
    }
    return map;
  }, [schedulesPage]);

  const isBusy = createSchedule.isPending || moveSchedule.isPending || deleteSchedule.isPending;

  function handlePaletteDragStart(e: React.DragEvent, shiftId: number) {
    e.dataTransfer.setData("text/plain", JSON.stringify({ type: "palette", shiftId } satisfies DragPayload));
    e.dataTransfer.effectAllowed = "copy";
  }

  function handleChipDragStart(e: React.DragEvent, scheduleId: number) {
    e.dataTransfer.setData("text/plain", JSON.stringify({ type: "existing", scheduleId } satisfies DragPayload));
    e.dataTransfer.effectAllowed = "move";
  }

  /** Assign/ganti shift di satu sel - dipakai baik oleh drag-drop dari
   * palet MAUPUN klik cell + pilih dari ShiftPickerModal (drag-and-drop
   * HTML5 native kadang tidak jalan mulus di sebagian browser/trackpad -
   * klik adalah jalur alternatif yang lebih pasti berhasil). siteOverride
   * datang dari pilihan eksplisit di ShiftPickerModal - kalau tidak diisi,
   * fallback ke filter site board (perilaku lama, drag-drop dari palet). */
  function assignShift(employeeId: number, date: string, shiftId: number, existing?: ShiftSchedule, siteOverride?: number | null) {
    setActionError(null);
    if (existing) {
      // Site cuma diikutkan kalau eksplisit dipilih dari ShiftPickerModal -
      // drag-drop dari palet buat GANTI shift di sel yang sudah terisi
      // TIDAK boleh diam-diam menimpa site_id yang sudah ada (fallback ke
      // filter board bisa NULL-kan site tanpa sengaja).
      const values: { shift_id: number; site_id?: number | null } = { shift_id: shiftId };
      if (siteOverride !== undefined) values.site_id = siteOverride;
      moveSchedule.mutate({ scheduleId: existing.id, values },
        { onError: (err) => setActionError(extractErrorMessage(err)) });
    } else {
      const resolvedSiteId = siteOverride !== undefined ? siteOverride : (siteId ? Number(siteId) : undefined);
      createSchedule.mutate({ employeeId, values: { shift_id: shiftId, schedule_date: date, site_id: resolvedSiteId ?? undefined } },
        { onError: (err) => setActionError(extractErrorMessage(err)) });
    }
  }

  function handleDrop(e: React.DragEvent, employeeId: number, date: string) {
    e.preventDefault();
    setDragOverCell(null);
    setActionError(null);

    if (date < toISODate(new Date())) {
      setActionError("Tanggal sudah lewat - jadwal hari yang sudah lalu tidak bisa diubah.");
      return;
    }

    let payload: DragPayload;
    try {
      payload = JSON.parse(e.dataTransfer.getData("text/plain"));
    } catch {
      return;
    }

    const existing = scheduleMap.get(`${employeeId}:${date}`);

    if (payload.type === "palette") {
      assignShift(employeeId, date, payload.shiftId, existing);
    } else {
      if (existing && existing.id !== payload.scheduleId) {
        setActionError("Sel ini sudah terisi jadwal lain - hapus dulu (×) sebelum menimpa dengan geser.");
        return;
      }
      moveSchedule.mutate({ scheduleId: payload.scheduleId, values: { employee_id: employeeId, schedule_date: date } },
        { onError: (err) => setActionError(extractErrorMessage(err)) });
    }
  }

  function handleDelete(scheduleId: number) {
    if (!confirm("Hapus jadwal ini?")) return;
    deleteSchedule.mutate(scheduleId, { onError: (err) => setActionError(extractErrorMessage(err)) });
  }

  const weekLabel = `${days[0].getDate()} ${MONTH_LABELS[days[0].getMonth()]} — ${days[6].getDate()} ${MONTH_LABELS[days[6].getMonth()]} ${days[6].getFullYear()}`;
  const todayISO = toISODate(new Date());

  return (
    <div>
      {/* Palet shift - drag dari sini ke sel jadwal */}
      <div style={{ marginBottom: "1rem" }}>
        <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--grey)", marginBottom: "0.4rem", textTransform: "uppercase" }}>
          Seret Shift ke Sel Jadwal
        </div>
        {shiftsLoading ? <LoadingState /> : (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
            {(shifts ?? []).length === 0 && (
              <div style={{ fontSize: "0.8rem", color: "var(--grey)" }}>Belum ada Master Shift - buat dulu di tab "Master Shift".</div>
            )}
            {(shifts ?? []).map((s: Shift) => {
              const c = colorForShift(s.id);
              return (
                <div key={s.id} draggable onDragStart={(e) => handlePaletteDragStart(e, s.id)}
                  style={{
                    display: "flex", alignItems: "center", gap: "0.3rem", cursor: "grab",
                    background: c.bg, border: `1.5px solid ${c.border}`, color: c.color,
                    borderRadius: 8, padding: "0.4rem 0.65rem", fontSize: "0.78rem", fontWeight: 700,
                  }}>
                  <GripVertical size={12} />
                  {s.shift_code}
                  <span style={{ fontWeight: 500, opacity: 0.85 }}>{s.start_time?.slice(0, 5)}–{s.end_time?.slice(0, 5)}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Kantor vs Lapangan - dipisah eksplisit supaya jelas kapan jadwal
          yang dibuat bakal punya site (dan karena itu terhitung di
          Dashboard DC Ops) vs tidak. */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
        <div style={{ display: "flex", border: "1px solid #cbd5e1", borderRadius: 8, overflow: "hidden" }}>
          <button type="button"
            onClick={() => { setViewMode("kantor"); setSiteId(""); }}
            style={{
              padding: "0.45rem 0.95rem", fontSize: "0.8rem", fontWeight: 700, border: "none", cursor: "pointer",
              background: viewMode === "kantor" ? "#F2A602" : "#ffffff",
              color: viewMode === "kantor" ? "#ffffff" : "#475569",
            }}>
            🏢 Kantor
          </button>
          <button type="button"
            onClick={() => setViewMode("lapangan")}
            style={{
              padding: "0.45rem 0.95rem", fontSize: "0.8rem", fontWeight: 700, border: "none", cursor: "pointer",
              background: viewMode === "lapangan" ? "#F2A602" : "#ffffff",
              color: viewMode === "lapangan" ? "#ffffff" : "#475569",
            }}>
            🏗️ Lapangan
          </button>
        </div>
        {viewMode === "lapangan" && (
          <select className="input" value={siteId} onChange={e => setSiteId(e.target.value)} style={{ maxWidth: 240 }}>
            <option value="">— Pilih site —</option>
            {sites.map(s => (
              <option key={s.id} value={s.id}>{s.site_code} — {s.site_name}</option>
            ))}
          </select>
        )}
      </div>

      {/* Navigasi minggu */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.75rem" }}>
        <button className="btn btn-secondary" style={{ padding: "0.3rem 0.5rem" }} onClick={() => setWeekStart(w => addDays(w, -7))}>
          <ChevronLeft size={16} />
        </button>
        <div style={{ fontWeight: 700, fontSize: "0.9rem", minWidth: 220, textAlign: "center" }}>{weekLabel}</div>
        <button className="btn btn-secondary" style={{ padding: "0.3rem 0.5rem" }} onClick={() => setWeekStart(w => addDays(w, 7))}>
          <ChevronRight size={16} />
        </button>
        <button className="btn btn-secondary" style={{ fontSize: "0.78rem" }} onClick={() => setWeekStart(startOfWeek(new Date()))}>
          Minggu Ini
        </button>
        <input className="input" placeholder="Cari employee..." value={empSearch}
          onChange={e => setEmpSearch(e.target.value)} style={{ marginLeft: "auto", maxWidth: 220 }} />
      </div>
      {viewMode === "lapangan" && siteId && !empSearch && (
        <div style={{ fontSize: "0.75rem", color: "var(--grey)", marginBottom: "0.75rem", marginTop: "-0.4rem" }}>
          Menampilkan petugas <strong>Lapangan</strong> yang posisinya biasanya di site ini — jadwal yang dibuat di sini otomatis ditandai untuk site ini. Ketik nama untuk cari/pindahkan petugas dari site lain.
        </div>
      )}

      {actionError && (
        <div className="input-error" style={{ marginBottom: "0.75rem" }}>{actionError}</div>
      )}

      {(empLoading || schedLoading) && <LoadingState />}

      {needsSitePick && (
        <div style={{ padding: "1.5rem", textAlign: "center", color: "var(--grey)", fontSize: "0.85rem" }}>
          Pilih site dulu untuk melihat petugas Lapangan di site tersebut.
        </div>
      )}

      {!empLoading && !needsSitePick && employees.length === 0 && (
        <div style={{ padding: "1.5rem", textAlign: "center", color: "var(--grey)", fontSize: "0.85rem" }}>
          {viewMode === "lapangan"
            ? "Belum ada petugas Lapangan yang posisinya diatur ke site ini. Cek Master Data Posisi, atau ketik nama untuk cari petugas dari site lain."
            : "Belum ada employee. Tambahkan dulu di halaman Employee."}
        </div>
      )}

      {!empLoading && !needsSitePick && employees.length > 0 && (
        <div style={{ overflowX: "auto", border: "1px solid var(--border)", borderRadius: 10 }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 820 }}>
            <thead>
              <tr>
                <th style={{ textAlign: "left", padding: "0.6rem 0.75rem", fontSize: "0.75rem", color: "var(--grey)", background: "var(--bg-subtle)", position: "sticky", left: 0, zIndex: 2, minWidth: 150 }}>
                  Employee
                </th>
                {days.map(d => {
                  const iso = toISODate(d);
                  const isToday = iso === todayISO;
                  const isPast = iso < todayISO;
                  return (
                    <th key={iso} style={{
                      padding: "0.6rem 0.5rem", fontSize: "0.75rem",
                      background: isPast ? "var(--bg-subtle)" : (isToday ? "var(--accent-light)" : "var(--bg-subtle)"),
                      color: isPast ? "var(--grey)" : (isToday ? "var(--accent)" : "var(--grey)"),
                      opacity: isPast ? 0.55 : 1,
                      minWidth: 110, textAlign: "center",
                    }}>
                      <div style={{ fontWeight: 700 }}>{DAY_LABELS[d.getDay() === 0 ? 6 : d.getDay() - 1]}</div>
                      <div>{d.getDate()} {MONTH_LABELS[d.getMonth()]}</div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {employees.map(emp => (
                <tr key={emp.id}>
                  <td style={{ padding: "0.5rem 0.75rem", fontWeight: 600, fontSize: "0.85rem", borderTop: "1px solid var(--border)", position: "sticky", left: 0, background: "var(--bg)", zIndex: 1 }}>
                    {emp.full_name}
                    <div style={{ fontSize: "0.68rem", color: "var(--grey)", fontFamily: "monospace" }}>{emp.employee_number}</div>
                  </td>
                  {days.map(d => {
                    const iso = toISODate(d);
                    const cellKey = `${emp.id}:${iso}`;
                    const schedule = scheduleMap.get(cellKey);
                    const isOver = dragOverCell === cellKey;
                    const isPast = iso < todayISO;

                    return (
                      <td key={cellKey}
                        onDragOver={(e) => { if (isPast) return; e.preventDefault(); if (dragOverCell !== cellKey) setDragOverCell(cellKey); }}
                        onDragLeave={() => setDragOverCell(prev => (prev === cellKey ? null : prev))}
                        onDrop={(e) => handleDrop(e, emp.id, iso)}
                        onClick={() => { if (!isPast) setPickerTarget({ employeeId: emp.id, employeeName: emp.full_name, date: iso, existing: schedule, positionSiteId: emp.position?.site_id ?? null }); }}
                        style={{
                          padding: "0.35rem", borderTop: "1px solid var(--border)", borderLeft: "1px solid var(--border)",
                          background: isPast ? "var(--bg-subtle)" : (isOver ? "var(--accent-light)" : undefined),
                          verticalAlign: "top",
                          opacity: isPast ? 0.55 : (isBusy ? 0.7 : 1),
                          cursor: isPast ? "not-allowed" : "pointer",
                        }}>
                        {schedule ? (
                          <ScheduleChip schedule={schedule} onDragStart={handleChipDragStart}
                            onDelete={() => handleDelete(schedule.id)}
                            onConfirm={() => confirmSchedule.mutate(schedule.id)}
                            siteName={schedule.site_id ? siteNameById.get(schedule.site_id) : undefined}
                            disabled={isPast} />
                        ) : (
                          <div title="Klik untuk pilih shift"
                            style={{ minHeight: 44, border: `1.5px dashed var(--border)`, borderRadius: 8 }} />
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {pickerTarget && (
        <ShiftPickerModal
          target={pickerTarget}
          shifts={shifts ?? []}
          sites={sites}
          defaultSiteId={pickerTarget.existing?.site_id ?? (siteId ? Number(siteId) : pickerTarget.positionSiteId)}
          onPick={(shiftId, pickedSiteId) => {
            assignShift(pickerTarget.employeeId, pickerTarget.date, shiftId, pickerTarget.existing, pickedSiteId);
            setPickerTarget(null);
          }}
          onClose={() => setPickerTarget(null)}
        />
      )}
    </div>
  );
}

// ─── Shift Picker Modal (klik sel -> pilih shift dari daftar) ──────────────
function ShiftPickerModal({ target, shifts, sites, defaultSiteId, onPick, onClose }: {
  target: PickerTarget; shifts: Shift[]; sites: Site[]; defaultSiteId: number | null;
  onPick: (shiftId: number, siteId: number | null) => void; onClose: () => void;
}) {
  const [pickSiteId, setPickSiteId] = useState(defaultSiteId ? String(defaultSiteId) : "");

  const dateLabel = (() => {
    const [y, m, d] = target.date.split("-").map(Number);
    const dt = new Date(y, m - 1, d);
    return `${DAY_LABELS[dt.getDay() === 0 ? 6 : dt.getDay() - 1]}, ${d} ${MONTH_LABELS[m - 1]} ${y}`;
  })();

  return (
    <div
      style={{
        position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
        background: "rgba(15,23,42,0.60)", backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)",
        zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem",
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 16, padding: "1.25rem",
        width: "100%", maxWidth: 360, boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.04)",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: "0.95rem", color: "#0f172a" }}>{target.employeeName}</div>
            <div style={{ fontSize: "0.78rem", color: "#64748b" }}>{dateLabel}</div>
          </div>
          <button onClick={onClose}
            style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer", fontSize: "1.1rem", padding: "0.15rem 0.4rem", lineHeight: 1 }}>
            ✕
          </button>
        </div>

        {shifts.length === 0 && (
          <div style={{ fontSize: "0.8rem", color: "#64748b" }}>Belum ada Master Shift - buat dulu di tab "Master Shift".</div>
        )}

        <div style={{ marginBottom: "0.85rem" }}>
          <label style={{ fontSize: "0.72rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Site (opsional)</label>
          <select className="input" value={pickSiteId} onChange={e => setPickSiteId(e.target.value)}
            style={{ width: "100%", marginTop: 4 }}>
            <option value="">— Tanpa site —</option>
            {sites.map(s => (
              <option key={s.id} value={s.id}>{s.site_code} — {s.site_name}</option>
            ))}
          </select>
          {!pickSiteId && (
            <div style={{ fontSize: "0.7rem", color: "#d97706", marginTop: 4 }}>
              Tanpa site, jadwal ini TIDAK akan muncul di "Petugas Bertugas Hari Ini" — Dashboard Data Center Operations.
            </div>
          )}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {shifts.map(s => {
            const c = colorForShift(s.id);
            const isCurrent = target.existing?.shift_id === s.id;
            return (
              <button key={s.id} type="button" onClick={() => onPick(s.id, pickSiteId ? Number(pickSiteId) : null)}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.5rem",
                  background: c.bg, border: `1.5px solid ${isCurrent ? "#16a34a" : c.border}`, color: c.color,
                  borderRadius: 10, padding: "0.6rem 0.75rem", fontSize: "0.85rem", fontWeight: 700, cursor: "pointer",
                  width: "100%", textAlign: "left",
                }}>
                <span>{s.shift_code}</span>
                <span style={{ fontWeight: 500, opacity: 0.85, fontSize: "0.78rem" }}>{s.start_time?.slice(0, 5)}–{s.end_time?.slice(0, 5)}</span>
                {isCurrent && <span style={{ fontSize: "0.7rem" }}>✓ sekarang</span>}
              </button>
            );
          })}
        </div>

        {target.existing && (
          <button type="button" onClick={onClose}
            style={{ marginTop: "0.75rem", width: "100%", fontSize: "0.78rem", color: "#64748b", background: "#ffffff", border: "1px solid #cbd5e1", borderRadius: 8, padding: "0.5rem", cursor: "pointer", fontWeight: 600 }}>
            Batal
          </button>
        )}
      </div>
    </div>
  );
}

function ScheduleChip({ schedule, onDragStart, onDelete, onConfirm, siteName, disabled }: {
  schedule: ShiftSchedule;
  onDragStart: (e: React.DragEvent, scheduleId: number) => void;
  onDelete: () => void;
  onConfirm: () => void;
  siteName?: string;
  disabled?: boolean;
}) {
  const shift = schedule.shift;
  const c = colorForShift(schedule.shift_id);
  const confirmed = schedule.status === "confirmed";

  return (
    <div draggable={!disabled} onDragStart={(e) => { if (disabled) { e.preventDefault(); return; } onDragStart(e, schedule.id); }}
      title={disabled ? "Jadwal hari yang sudah lewat - tidak bisa diubah" : (confirmed ? "Dikonfirmasi - seret untuk pindah" : "Klik ✓ untuk konfirmasi, seret untuk pindah")}
      style={{
        background: disabled ? "var(--bg-subtle)" : c.bg, border: `1.5px solid ${disabled ? "var(--border)" : (confirmed ? "#16a34a" : c.border)}`, borderRadius: 8,
        padding: "0.35rem 0.4rem", cursor: disabled ? "not-allowed" : "grab", position: "relative",
        opacity: disabled ? 0.7 : 1,
      }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.25rem" }}>
        <span style={{ fontWeight: 700, fontSize: "0.72rem", color: disabled ? "var(--grey)" : c.color }}>{shift?.shift_code ?? "?"}</span>
        {!disabled && (
          <button type="button" onClick={(e) => { e.stopPropagation(); onDelete(); }} title="Hapus"
            style={{ border: "none", background: "none", cursor: "pointer", color: c.color, padding: 0, lineHeight: 1, opacity: 0.7 }}>
            <X size={12} />
          </button>
        )}
      </div>
      <div style={{ fontSize: "0.65rem", color: disabled ? "var(--grey)" : c.color, opacity: 0.85 }}>
        {shift ? `${shift.start_time?.slice(0, 5)}–${shift.end_time?.slice(0, 5)}` : ""}
      </div>
      {/* Badge site - kalau tidak ada, jadwal ini TIDAK muncul di widget
          "Petugas Bertugas Hari Ini" Dashboard DC Ops (lihat DashboardService::
          onDutyToday() yang mensyaratkan site_id terisi). */}
      <div style={{ fontSize: "0.6rem", fontWeight: 700, marginTop: 2, color: siteName ? (disabled ? "var(--grey)" : c.color) : "#b45309", opacity: siteName ? 0.75 : 1 }}>
        {siteName ? `🏢 ${siteName}` : "⚠ tanpa site"}
      </div>
      {!disabled && !confirmed && (
        <button type="button" onClick={(e) => { e.stopPropagation(); onConfirm(); }}
          style={{ marginTop: 2, fontSize: "0.62rem", fontWeight: 700, border: "none", background: "none", color: "#15803d", cursor: "pointer", padding: 0 }}>
          ✓ Konfirmasi
        </button>
      )}
      {disabled && confirmed && (
        <div style={{ marginTop: 2, fontSize: "0.62rem", fontWeight: 700, color: "#15803d" }}>✓ Dikonfirmasi</div>
      )}
    </div>
  );
}
