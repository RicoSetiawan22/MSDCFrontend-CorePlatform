import React, { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Building2,
  Users,
  Clock,
  Mail,
  Phone,
  UserRound,
  CircleUserRound,
  ArrowRight,
  RotateCw,
  type LucideIcon,
} from "lucide-react";
import { apiClient } from "@shared/lib/api-client";

// ============================================================================
// 1. TypeScript Interfaces
// ============================================================================

export interface OnDutyStaffItem {
  schedule_id: number;
  employee_id: number;
  employee_name: string;
  employee_number?: string;
  photo_file_id?: string | null;
  phone?: string | null;
  email: string;
  position_title: string;
  site_id: number;
  site_name: string;
  shift_code: string;
  shift_start: string;
  shift_end: string;
  status: string;
  skills?: string[];
  open_tickets_count?: number;
  shift_status?: ShiftProgressStatus;
}

export interface OnDutyMeta {
  generated_at?: string;
  date?: string;
}

export interface OnDutyApiResponse {
  data: OnDutyStaffItem[];
  meta?: OnDutyMeta;
}

export interface GroupedSiteStaff {
  site_id: number;
  site_name: string;
  staff: OnDutyStaffItem[];
}

interface StaffOnDutyProps {
  onViewProfile?: (employeeId: number) => void;
}

// ============================================================================
// 2. Helper Functions
// ============================================================================

/**
 * Mengambil inisial nama (maksimal 2 huruf kapital).
 * Contoh: "Ahmad firnanda.s" -> "AF", "Ali" -> "A", "Kirana Isna Dewi" -> "KI"
 */
export function getInitials(name: string): string {
  if (!name) return "";
  const parts = name.trim().split(/[\s._-]+/).filter(Boolean);
  if (parts.length === 0) return "";
  if (parts.length === 1) {
    return parts[0].substring(0, Math.min(2, parts[0].length)).toUpperCase();
  }
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

/**
 * Format tanggal dari meta.date (YYYY-MM-DD) ke format lokal Indonesia.
 * Contoh: "2026-09-19" -> "Sabtu, 19 September 2026"
 */
export function formatIndonesianDate(dateStr?: string): string {
  if (!dateStr) return "Hari ini";
  try {
    const parts = dateStr.split("-");
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const d = new Date(year, month, day);
      return d.toLocaleDateString("id-ID", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    }
    const d = new Date(dateStr);
    return d.toLocaleDateString("id-ID", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

/**
 * Format rentang jam shift: "06:00:00" -> "06:00"
 */
export function formatShiftTime(start: string, end: string): string {
  const s = start ? start.substring(0, 5) : "00:00";
  const e = end ? end.substring(0, 5) : "00:00";
  return `${s} - ${e}`;
}

/**
 * Mengambil tanggal lokal browser dalam format YYYY-MM-DD.
 * Menghindari bug pergeseran tanggal saat menggunakan toISOString() (UTC).
 */
export function getLocalDateString(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export type ShiftProgressStatus = "active" | "upcoming" | "completed";

export function getJakartaTime(serverGeneratedAt?: string): { hours: number; minutes: number } {
  try {
    const now = serverGeneratedAt ? new Date(serverGeneratedAt) : new Date();
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Jakarta",
      hour: "numeric",
      minute: "numeric",
      hour12: false,
    });
    const parts = formatter.formatToParts(now);
    const hours = Number(parts.find((p) => p.type === "hour")?.value ?? 0);
    const minutes = Number(parts.find((p) => p.type === "minute")?.value ?? 0);
    return { hours, minutes };
  } catch {
    const d = new Date();
    return { hours: d.getHours(), minutes: d.getMinutes() };
  }
}

/**
 * Mendeteksi progres shift terhadap jam kerja Jakarta (WIB):
 * - "active" : Jam saat ini berada di dalam rentang shift (petugas sedang bertugas)
 * - "upcoming" : Shift hari ini belum dimulai (misal shift siang / malam)
 * - "completed" : Shift hari ini sudah selesai
 */
export function getShiftProgressStatus(
  shiftStart?: string,
  shiftEnd?: string,
  referenceTime?: { hours: number; minutes: number }
): ShiftProgressStatus {
  if (!shiftStart || !shiftEnd) return "active";
  const ref = referenceTime ?? getJakartaTime();
  const currentMinutes = ref.hours * 60 + ref.minutes;

  const [startH, startM] = shiftStart.split(":").map(Number);
  const [endH, endM] = shiftEnd.split(":").map(Number);

  const startMinutes = (startH || 0) * 60 + (startM || 0);
  const endMinutes = (endH || 0) * 60 + (endM || 0);

  if (startMinutes <= endMinutes) {
    // Shift reguler dalam satu hari (misal 07:00 - 15:00 atau 14:00 - 22:00)
    if (currentMinutes < startMinutes) return "upcoming";
    if (currentMinutes >= endMinutes) return "completed";
    return "active";
  } else {
    // Shift lintas malam (misal 22:00 - 06:00)
    if (currentMinutes >= startMinutes || currentMinutes < endMinutes) return "active";
    return "upcoming";
  }
}

/**
 * Mengecek apakah shift petugas saat ini AKTIF / SEDANG BERJALAN.
 */
export function isShiftActiveNow(
  shiftStart?: string,
  shiftEnd?: string,
  referenceTime?: { hours: number; minutes: number }
): boolean {
  return getShiftProgressStatus(shiftStart, shiftEnd, referenceTime) === "active";
}

// ============================================================================
// 3. Sub-komponen Presentasi
// ============================================================================

/** Badge agregat di header kanan: "X Site", "Y Petugas" */
const CountBadge: React.FC<{ icon: LucideIcon; label: string }> = ({ icon: Icon, label }) => (
  <div
    className="flex items-center gap-1.5 rounded-md border border-[var(--color-border-main)] bg-white px-2.5 py-1 text-[11px] font-bold text-[var(--color-text-primary)]"
    style={{
      display: "inline-flex",
      alignItems: "center",
      gap: "0.35rem",
      borderRadius: "6px",
      border: "1px solid var(--color-border-main, #D9DEE5)",
      backgroundColor: "#FFFFFF",
      padding: "0.3rem 0.65rem",
      fontSize: "11px",
      fontWeight: 700,
      color: "var(--color-text-primary, #0A2140)",
      boxShadow: "0 1px 2px rgba(0,0,0,0.02)",
    }}
  >
    <Icon size={13} strokeWidth={2.2} style={{ color: "var(--color-text-secondary, #6B7280)" }} />
    <span>{label}</span>
  </div>
);

/** Baris info di dalam kartu: ikon + label kiri, nilai kanan */
const InfoRow: React.FC<{ icon: LucideIcon; label: string; value: React.ReactNode }> = ({
  icon: Icon,
  label,
  value,
}) => (
  <div
    className="flex w-full items-center justify-between gap-3 text-xs"
    style={{
      display: "flex",
      width: "100%",
      alignItems: "center",
      justifyContent: "space-between",
      gap: "0.75rem",
      fontSize: "12px",
    }}
  >
    <div
      className="flex shrink-0 items-center gap-1.5 text-[var(--color-text-secondary)]"
      style={{
        display: "flex",
        flexShrink: 0,
        alignItems: "center",
        gap: "0.35rem",
        color: "var(--color-text-secondary, #6B7280)",
      }}
    >
      <Icon size={13} strokeWidth={2} style={{ color: "var(--color-text-disabled, #A0A8B2)" }} />
      <span>{label}</span>
    </div>
    <span
      className="min-w-0 truncate text-right font-semibold text-[var(--color-text-primary)]"
      style={{
        minWidth: 0,
        textAlign: "right",
        fontWeight: 600,
        color: "var(--color-text-primary, #0A2140)",
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
      }}
    >
      {value}
    </span>
  </div>
);

// ============================================================================
// 4. Komponen Utama: StaffOnDuty (100% Real API Endpoint)
// ============================================================================

export const StaffOnDuty: React.FC<StaffOnDutyProps> = ({ onViewProfile }) => {
  const [filterMode, setFilterMode] = useState<"all" | "active">("all");
  const [currentTime, setCurrentTime] = useState(() => new Date());

  // Interval real-time: sinkronisasi status shift setiap 30 detik tanpa reload
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 30_000);
    return () => clearInterval(timer);
  }, []);

  // ── A. Fetching Murni dari Endpoint API /v1/data-center-ops/dashboard/on-duty-today ──
  const { data: apiResponse, isLoading, refetch, isRefetching } = useQuery<OnDutyApiResponse>({
    queryKey: ["dc-ops", "on-duty-today"],
    queryFn: async () => {
      const res = await apiClient.get<Record<string, unknown>>(
        "/v1/data-center-ops/dashboard/on-duty-today"
      );
      const payload = res.data;

      // Ekstraksi data riil dari response payload backend
      const rawList: OnDutyStaffItem[] =
        (payload?.data as OnDutyStaffItem[]) ??
        ((payload?.body as Record<string, unknown>)?.data as OnDutyStaffItem[]) ??
        (Array.isArray(payload) ? (payload as OnDutyStaffItem[]) : []);

      const meta: OnDutyMeta =
        (payload?.meta as OnDutyMeta) ??
        ((payload?.body as Record<string, unknown>)?.meta as OnDutyMeta) ?? {
          generated_at: new Date().toISOString(),
          date: getLocalDateString(),
        };

      return {
        data: rawList,
        meta,
      };
    },
    refetchInterval: 30_000, // Otomatis refresh berkala tiap 30 detik agar sinkron dengan perubahan di modul HR
    staleTime: 10_000,
  });

  const meta = apiResponse?.meta;

  // ── B. Status Shift Dinamis per Petugas (Aktif, Mendatang, Selesai) ──
  const allStaffWithStatus = useMemo(() => {
    const list = apiResponse?.data ?? [];
    const referenceTime = getJakartaTime(apiResponse?.meta?.generated_at);
    return list
      .map((staff) => ({
        ...staff,
        shift_status: getShiftProgressStatus(staff.shift_start, staff.shift_end, referenceTime),
      }))
      .sort((a, b) => {
        // Urutkan: Petugas aktif dulu, lalu upcoming, lalu completed
        const priority: Record<ShiftProgressStatus, number> = { active: 1, upcoming: 2, completed: 3 };
        const pA = priority[a.shift_status] ?? 2;
        const pB = priority[b.shift_status] ?? 2;
        if (pA !== pB) return pA - pB;
        return a.employee_name.localeCompare(b.employee_name);
      });
  }, [apiResponse?.data, apiResponse?.meta?.generated_at, currentTime]);

  // ── C. Filter berdasarkan pilihan tampilan: Semua Hari Ini vs Hanya Sedang Aktif ──
  const displayedStaff = useMemo(() => {
    if (filterMode === "active") {
      return allStaffWithStatus.filter((s) => s.shift_status === "active");
    }
    return allStaffWithStatus;
  }, [allStaffWithStatus, filterMode]);

  const activeStaffCount = useMemo(() => {
    return allStaffWithStatus.filter((s) => s.shift_status === "active").length;
  }, [allStaffWithStatus]);

  // ── D. Grouping Data Riil Berdasarkan site_name Menggunakan reduce ──
  const groupedSites: GroupedSiteStaff[] = useMemo(() => {
    const map = displayedStaff.reduce<Record<string, GroupedSiteStaff>>((acc, item) => {
      const siteKey = item.site_name || `Site-${item.site_id}`;
      if (!acc[siteKey]) {
        acc[siteKey] = {
          site_id: item.site_id,
          site_name: item.site_name,
          staff: [],
        };
      }
      acc[siteKey].staff.push(item);
      return acc;
    }, {});

    return Object.values(map);
  }, [displayedStaff]);

  const totalSites = groupedSites.length;
  const totalStaff = displayedStaff.length;
  const formattedDate = formatIndonesianDate(meta?.date || getLocalDateString());

  return (
    <section
      className="flex w-full flex-col gap-5 rounded-2xl border border-[var(--color-border-main)] bg-[var(--color-surface-card)] p-5 shadow-[var(--shadow-card)]"
      style={{
        display: "flex",
        width: "100%",
        flexDirection: "column",
        gap: "1.25rem",
        borderRadius: "16px",
        border: "1px solid var(--color-border-main, #D9DEE5)",
        backgroundColor: "var(--color-surface-card, #FFFFFF)",
        padding: "1.25rem 1.5rem",
        boxShadow: "var(--shadow-card, 0 1px 3px rgba(10,33,64,0.05))",
      }}
    >
      {/* ── 1. Header Section ── */}
      <div
        className="flex flex-wrap items-center justify-between gap-3"
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "0.75rem",
          width: "100%",
        }}
      >
        <div
          className="flex flex-wrap items-center gap-2.5"
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: "0.65rem",
          }}
        >
          {/* Ikon emas polos */}
          <UserRound
            size={18}
            strokeWidth={2.4}
            className="shrink-0 text-[var(--color-primary-gold)]"
            style={{ color: "var(--color-primary-gold, #F2A602)", flexShrink: 0 }}
          />
          <h2
            className="m-0 text-[15px] font-extrabold uppercase tracking-wide text-[var(--color-text-primary)]"
            style={{
              margin: 0,
              fontSize: "15px",
              fontWeight: 800,
              textTransform: "uppercase",
              letterSpacing: "0.02em",
              color: "var(--color-text-primary, #0A2140)",
            }}
          >
            Petugas Bertugas Hari Ini
          </h2>
          <span
            className="text-[11px] text-[var(--color-text-secondary)]"
            style={{
              fontSize: "11px",
              color: "var(--color-text-secondary, #6B7280)",
            }}
          >
            {formattedDate}
          </span>
        </div>

        <div
          className="flex flex-wrap items-center gap-2"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
          }}
        >
          {/* Filter toggle: Semua vs Sedang Aktif */}
          {allStaffWithStatus.length > 0 && (
            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-[11px] font-semibold">
              <button
                type="button"
                onClick={() => setFilterMode("all")}
                className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                  filterMode === "all"
                    ? "bg-white text-slate-900 shadow-2xs font-bold"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                Semua ({allStaffWithStatus.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterMode("active")}
                className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                  filterMode === "active"
                    ? "bg-white text-emerald-700 shadow-2xs font-bold"
                    : "text-slate-500 hover:text-emerald-700"
                }`}
              >
                Sedang Bertugas ({activeStaffCount})
              </button>
            </div>
          )}

          <CountBadge icon={Building2} label={`${totalSites} Site`} />
          <CountBadge icon={Users} label={`${totalStaff} Petugas`} />

          <button
            type="button"
            onClick={() => refetch()}
            disabled={isRefetching}
            title="Segarkan data petugas"
            className="p-1.5 rounded-md border border-[var(--color-border-main)] bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-all cursor-pointer disabled:opacity-50"
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: "6px",
              border: "1px solid var(--color-border-main, #D9DEE5)",
              backgroundColor: "#FFFFFF",
              padding: "0.35rem",
            }}
          >
            <RotateCw size={13} className={isRefetching ? "animate-spin text-amber-500" : ""} />
          </button>
        </div>
      </div>

      {/* ── 2. Kontainer per Site (Data Riil) ── */}
      {isLoading ? (
        <div
          style={{
            padding: "2rem",
            textAlign: "center",
            color: "#6B7280",
            fontSize: "0.85rem",
          }}
        >
          Memuat data petugas bertugas...
        </div>
      ) : allStaffWithStatus.length === 0 ? (
        /* Empty State Jika Memang Belum Ada Jadwal untuk Hari Ini */
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "2.5rem 1.5rem",
            backgroundColor: "#F8FAFC",
            borderRadius: "14px",
            border: "1px dashed #CBD5E1",
            textAlign: "center",
            gap: "0.4rem",
          }}
        >
          <Clock size={26} color="#94A3B8" />
          <p style={{ margin: 0, fontSize: "0.88rem", fontWeight: 700, color: "#0A2140" }}>
            Belum Ada Jadwal Petugas untuk Hari Ini
          </p>
          <span style={{ fontSize: "0.75rem", color: "#6B7280" }}>
            Jadwal shift diatur melalui modul HR (Shift Schedule Board) dengan memilih tab Lapangan &amp; Site Data Center.
          </span>
        </div>
      ) : groupedSites.length === 0 && filterMode === "active" ? (
        /* Empty State Khusus saat Filter "Sedang Aktif" Dipilih tapi Jam Shift Sedang Jeda */
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "2rem 1.5rem",
            backgroundColor: "#F8FAFC",
            borderRadius: "14px",
            border: "1px dashed #CBD5E1",
            textAlign: "center",
            gap: "0.4rem",
          }}
        >
          <Clock size={24} color="#94A3B8" />
          <p style={{ margin: 0, fontSize: "0.85rem", fontWeight: 700, color: "#0A2140" }}>
            Tidak Ada Petugas yang Sedang Aktif di Jam Ini
          </p>
          <span style={{ fontSize: "0.75rem", color: "#6B7280" }}>
            Terdapat {allStaffWithStatus.length} petugas terjadwal hari ini. Klik tombol &ldquo;Semua ({allStaffWithStatus.length})&rdquo; di atas untuk melihat seluruh jadwal.
          </span>
        </div>
      ) : (
        <div
          className="flex flex-col gap-4"
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "1rem",
            width: "100%",
          }}
        >
          {groupedSites.map((siteGroup) => (
            <div
              key={siteGroup.site_id}
              className="rounded-2xl border border-[var(--color-text-disabled)] bg-[var(--color-neutral-85)] p-4"
              style={{
                borderRadius: "16px",
                border: "1px solid #CBD5E1",
                backgroundColor: "#EEF2F6",
                padding: "1.25rem",
                display: "flex",
                flexDirection: "column",
                gap: "0.85rem",
                width: "100%",
              }}
            >
              {/* Header site */}
              <div
                className="mb-3.5 flex items-center gap-2"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  marginBottom: "0.85rem",
                }}
              >
                <Building2
                  size={16}
                  strokeWidth={2.4}
                  className="text-[var(--color-primary-gold)]"
                  style={{ color: "var(--color-primary-gold, #F2A602)" }}
                />
                <h3
                  className="m-0 text-[13px] font-bold text-[var(--color-text-primary)]"
                  style={{
                    margin: 0,
                    fontSize: "13px",
                    fontWeight: 700,
                    color: "var(--color-text-primary, #0A2140)",
                  }}
                >
                  {siteGroup.site_name}
                </h3>
                <span
                  className="rounded-full bg-[rgba(242,166,2,0.2)] px-2 py-0.5 text-[10px] font-semibold text-[var(--color-semantic-warning-text)]"
                  style={{
                    borderRadius: "9999px",
                    backgroundColor: "#FDE68A",
                    padding: "0.15rem 0.55rem",
                    fontSize: "10px",
                    fontWeight: 700,
                    color: "#92400E",
                  }}
                >
                  {siteGroup.staff.length} Petugas
                </span>
              </div>

              {/* ── Grid Kartu: Maksimal 2 Kolom, Jika Ganjil (Misal 1 atau 3) Kartu Terakhir Memanjang Full Width ── */}
              <div
                className="grid grid-cols-1 md:grid-cols-2 gap-4"
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                  gap: "1rem",
                  width: "100%",
                }}
              >
                {siteGroup.staff.map((staff, idx) => {
                  // Jika jumlah ganjil (1, 3, 5) dan ini adalah kartu terakhir -> memanjang horizontal full width (span 2)
                  const isOddCount = siteGroup.staff.length % 2 !== 0;
                  const isLastCard = idx === siteGroup.staff.length - 1;
                  const isFullWidth = isOddCount && isLastCard;

                  return (
                    <article
                      key={staff.schedule_id || staff.employee_id || idx}
                      className={`flex flex-col overflow-hidden rounded-xl bg-white shadow-sm transition-shadow duration-200 hover:shadow-md ${
                        isFullWidth ? "col-span-2 md:col-span-2" : "col-span-1"
                      }`}
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "space-between",
                        overflow: "hidden",
                        borderRadius: "14px",
                        backgroundColor: "#FFFFFF",
                        border: "1px solid #E2E8F0",
                        boxShadow: "0 1px 3px rgba(10, 33, 64, 0.04)",
                        gridColumn: isFullWidth ? "1 / -1" : "span 1",
                      }}
                    >
                      {/* Konten atas kartu */}
                      <div
                        style={{
                          flex: 1,
                          padding: "1.15rem 1.25rem 0.85rem",
                          display: "flex",
                          flexDirection: "column",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "flex-start",
                            justifyContent: "space-between",
                            gap: "0.75rem",
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "0.75rem",
                              minWidth: 0,
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                height: "42px",
                                width: "42px",
                                flexShrink: 0,
                                alignItems: "center",
                                justifyContent: "center",
                                borderRadius: "50%",
                                backgroundColor: "#FDE68A",
                                fontSize: "15px",
                                fontWeight: 800,
                                color: "#92400E",
                              }}
                            >
                              {getInitials(staff.employee_name)}
                            </div>
                            <div
                              style={{
                                display: "flex",
                                flexDirection: "column",
                                minWidth: 0,
                              }}
                            >
                              <span
                                style={{
                                  fontSize: "14px",
                                  fontWeight: 700,
                                  lineHeight: 1.2,
                                  color: "var(--color-text-primary, #0A2140)",
                                  whiteSpace: "nowrap",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                }}
                              >
                                {staff.employee_name}
                              </span>
                              <span
                                style={{
                                  fontSize: "11px",
                                  color: "var(--color-text-secondary, #6B7280)",
                                  marginTop: "0.15rem",
                                  whiteSpace: "nowrap",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                }}
                              >
                                {staff.position_title}
                              </span>
                            </div>
                          </div>

                          {/* Status pill dinamis berdasarkan progres shift */}
                          {staff.shift_status === "active" ? (
                            <span
                              style={{
                                display: "inline-flex",
                                flexShrink: 0,
                                alignItems: "center",
                                gap: "0.25rem",
                                borderRadius: "9999px",
                                backgroundColor: "var(--color-semantic-success-bg, #E6F7F0)",
                                padding: "0.18rem 0.55rem",
                                fontSize: "10px",
                                fontWeight: 800,
                                letterSpacing: "0.02em",
                                color: "var(--color-semantic-success-text, #00875A)",
                                border: "1px solid rgba(0, 176, 116, 0.2)",
                              }}
                            >
                              <span
                                style={{
                                  height: "5px",
                                  width: "5px",
                                  borderRadius: "50%",
                                  backgroundColor: "var(--color-semantic-success, #00B074)",
                                }}
                              />
                              BERTUGAS
                            </span>
                          ) : staff.shift_status === "upcoming" ? (
                            <span
                              style={{
                                display: "inline-flex",
                                flexShrink: 0,
                                alignItems: "center",
                                gap: "0.25rem",
                                borderRadius: "9999px",
                                backgroundColor: "#FEF3C7",
                                padding: "0.18rem 0.55rem",
                                fontSize: "10px",
                                fontWeight: 800,
                                letterSpacing: "0.02em",
                                color: "#92400E",
                                border: "1px solid #FDE68A",
                              }}
                            >
                              <Clock size={11} strokeWidth={2.4} style={{ color: "#D97706" }} />
                              MENDATANG
                            </span>
                          ) : (
                            <span
                              style={{
                                display: "inline-flex",
                                flexShrink: 0,
                                alignItems: "center",
                                gap: "0.25rem",
                                borderRadius: "9999px",
                                backgroundColor: "#F1F5F9",
                                padding: "0.18rem 0.55rem",
                                fontSize: "10px",
                                fontWeight: 700,
                                letterSpacing: "0.02em",
                                color: "#64748B",
                                border: "1px solid #CBD5E1",
                              }}
                            >
                              SELESAI
                            </span>
                          )}
                        </div>

                        <div
                          style={{
                            borderTop: "1px solid #E2E8F0",
                            margin: "0.85rem 0",
                            width: "100%",
                          }}
                        />

                        {/* Detail Shift, Email & Telp */}
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "0.45rem",
                            width: "100%",
                          }}
                        >
                          <InfoRow
                            icon={Clock}
                            label="Shift"
                            value={`${staff.shift_code} (${formatShiftTime(staff.shift_start, staff.shift_end)})`}
                          />
                          <InfoRow icon={Mail} label="Email" value={staff.email} />
                          {staff.phone && <InfoRow icon={Phone} label="Telp" value={staff.phone} />}
                        </div>
                      </div>

                      {/* Footer "Lihat profil" */}
                      <button
                        type="button"
                        onClick={() => onViewProfile?.(staff.employee_id)}
                        style={{
                          width: "100%",
                          backgroundColor: "#FDE68A",
                          color: "#78350F",
                          border: "none",
                          borderTop: "1px solid rgba(242, 166, 2, 0.3)",
                          padding: "0.6rem 1.25rem",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          fontSize: "12px",
                          fontWeight: 700,
                          cursor: "pointer",
                          transition: "background-color 0.15s ease",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = "#FCD34D";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = "#FDE68A";
                        }}
                      >
                        <span
                          style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
                        >
                          <CircleUserRound size={14} strokeWidth={2.2} />
                          Lihat profil
                        </span>
                        <ArrowRight size={13} strokeWidth={2.2} style={{ opacity: 0.7 }} />
                      </button>
                    </article>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

export default StaffOnDuty;
