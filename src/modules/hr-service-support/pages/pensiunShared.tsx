import { useFilePreview } from "@modules/core-platform/api/useFilePreview";
import type { Employee } from "../types/employee";
import type { PositionLevel } from "../api/positionApi";

// ─── Aturan pensiun ──────────────────────────────────────────────────────────
// Batas usia pensiun per level jabatan. Ubah angkanya di sini kalau aturan berubah.
export const RETIREMENT_AGE_BY_LEVEL: Record<PositionLevel, number> = {
    staff: 50,
    supervisor: 55,       // ASUMSI, konfirmasi ke HR
    manager: 55,
    senior_manager: 55,   // ASUMSI, konfirmasi ke HR
};
// Dipakai kalau jabatan karyawan belum punya level
export const DEFAULT_RETIREMENT_AGE = 55;

export function getRetirementAge(level: PositionLevel | null): number {
    return level ? RETIREMENT_AGE_BY_LEVEL[level] : DEFAULT_RETIREMENT_AGE;
}
// Dianggap "dekat pensiun" kalau sisa waktu <= 24 bulan.
export const NEAR_MONTHS = 24;
// Status kepegawaian yang ditampilkan (terminated tidak ikut).
export const MONITORED = ["active", "probation", "on_leave", "retired", "resigned"];

// Level jabatan: label & warna mengikuti halaman Position / Jabatan.
export const LEVEL_META: Record<PositionLevel, { label: string; cls: string }> = {
    staff: { label: "Staff", cls: "bg-blue-50 text-blue-700 border-blue-200/60" },
    supervisor: { label: "Supervisor", cls: "bg-amber-50 text-amber-700 border-amber-200/60" },
    manager: { label: "Manager", cls: "bg-rose-50 text-rose-700 border-rose-200/60" },
    senior_manager: { label: "Sr. Manager", cls: "bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200/60" },
};

// "OFFICE" -> "Office". Teks yang sudah campuran huruf besar/kecil dibiarkan apa adanya.
function tidyTitle(s: string): string {
    if (s.length > 3 && s === s.toUpperCase() && /[A-Z]/.test(s)) {
        return s.toLowerCase().replace(/(^|[\s/-])([a-z])/g, (_, p: string, c: string) => p + c.toUpperCase());
    }
    return s;
}

// ─── Helper tanggal ──────────────────────────────────────────────────────────
function parseDate(s: string): Date | null {
    const d = new Date(s);
    return isNaN(d.getTime()) ? null : d;
}

function calcRetirement(birth: Date, retireAge: number, now = new Date()) {
    let age = now.getFullYear() - birth.getFullYear();
    const m = now.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;

    const retireDate = new Date(birth.getFullYear() + retireAge, birth.getMonth(), birth.getDate());
    let monthsLeft = (retireDate.getFullYear() - now.getFullYear()) * 12 + (retireDate.getMonth() - now.getMonth());
    if (now.getDate() > retireDate.getDate()) monthsLeft--;

    return { age, retireDate, monthsLeft };
}

export function remainingLabel(monthsLeft: number): string {
    if (monthsLeft < 0) {
        const over = Math.abs(monthsLeft);
        return over >= 12 ? `Lewat ${Math.floor(over / 12)} tahun` : `Lewat ${over} bulan`;
    }
    if (monthsLeft === 0) return "Bulan ini";
    if (monthsLeft < 12) return `${monthsLeft} bulan lagi`;
    const y = Math.floor(monthsLeft / 12);
    const mo = monthsLeft % 12;
    return mo ? `${y} tahun ${mo} bulan lagi` : `${y} tahun lagi`;
}

// ─── Model baris ─────────────────────────────────────────────────────────────
export type RetireState = "retired" | "resigned" | "near" | "due" | "far" | "unknown";

export interface Row {
    emp: Employee;
    birthRaw: string | null;
    age: number | null;
    retireDate: Date | null;
    monthsLeft: number | null;
    state: RetireState;
    position: string;
    level: PositionLevel | null;
    retireAge: number;
    department: string;
}

export function buildRow(emp: Employee, levelByPositionId: Map<number, PositionLevel>): Row {
    // Field tanggal lahir BELUM ada di backend. Dibaca sebagai `birth_date`,
    // otomatis terisi begitu backend menambahkannya ke response employee.
    const birthRaw = (emp as unknown as { birth_date?: string | null }).birth_date ?? null;
    const birth = birthRaw ? parseDate(birthRaw) : null;

    // Level dihitung lebih dulu karena batas pensiun tergantung level.
    const level =
        (emp.position_id ? levelByPositionId.get(emp.position_id) : undefined) ??
        (emp.position as unknown as { level?: PositionLevel } | null | undefined)?.level ??
        null;
    const retireAge = getRetirementAge(level);
    const calc = birth ? calcRetirement(birth, retireAge) : null;

    let state: RetireState;
    if (emp.employment_status === "retired") state = "retired";
    else if (emp.employment_status === "resigned") state = "resigned";
    else if (!calc) state = "unknown";
    else if (calc.monthsLeft < 0) state = "due";
    else if (calc.monthsLeft <= NEAR_MONTHS) state = "near";
    else state = "far";

    const dept = (emp as unknown as { department?: { name?: string } | null }).department?.name;

    return {
        emp,
        birthRaw: birth ? birthRaw : null,
        age: calc?.age ?? null,
        retireDate: calc?.retireDate ?? null,
        monthsLeft: calc?.monthsLeft ?? null,
        state,
        position: emp.position?.position_title ? tidyTitle(emp.position.position_title) : "-",
        level,
        retireAge,
        department: dept ?? "-",
    };
}

// label = status yang tampil di badge; text = warna teks "sisa waktu"
export const STATE_META: Record<RetireState, { label: string; badge: string; dot: string; text: string }> = {
    retired: { label: "Pensiun", badge: "bg-slate-100 text-slate-600 border-slate-200/80", dot: "bg-slate-400", text: "text-slate-400" },
    resigned: { label: "Resign", badge: "bg-rose-50 text-rose-700 border-rose-200/60", dot: "bg-rose-500", text: "text-slate-400" },
    near: { label: "Dekat pensiun", badge: "bg-amber-50 text-amber-700 border-amber-200/60", dot: "bg-amber-500", text: "text-amber-600" },
    due: { label: "Dekat pensiun", badge: "bg-amber-50 text-amber-700 border-amber-200/60", dot: "bg-amber-500", text: "text-rose-600" },
    far: { label: "Aktif", badge: "bg-emerald-50 text-emerald-700 border-emerald-200/60", dot: "bg-emerald-500", text: "text-slate-700" },
    unknown: { label: "Aktif", badge: "bg-emerald-50 text-emerald-700 border-emerald-200/60", dot: "bg-emerald-500", text: "text-slate-400" },
};

export const SORT_ORDER: Record<RetireState, number> = { due: 0, near: 1, far: 2, unknown: 3, resigned: 4, retired: 5 };

// ─── Komponen kecil yang dipakai halaman daftar & halaman detail ─────────────
export function StateBadge({ state }: { state: RetireState }) {
    const m = STATE_META[state];
    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border whitespace-nowrap ${m.badge}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${m.dot}`} />
            {m.label}
        </span>
    );
}

export function LevelPill({ level }: { level: PositionLevel | null }) {
    if (!level) return <span className="font-caption text-slate-400">Level belum diatur</span>;
    const m = LEVEL_META[level];
    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md font-caption font-semibold border ${m.cls}`}>
            {m.label}
        </span>
    );
}

export function Avatar({ photoFileId, name, size = 40 }: { photoFileId?: number | null; name: string; size?: number }) {
    const { url } = useFilePreview(photoFileId);
    const initials = name.trim().split(/\s+/).slice(0, 2).map(w => w[0]?.toUpperCase()).join("") || "?";
    if (url) {
        return <img src={url} alt={name} width={size} height={size} style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />;
    }
    return (
        <div style={{ width: size, height: size, fontSize: size * 0.4 }}
            className="rounded-full shrink-0 flex items-center justify-center font-bold bg-[#eaf4fb] text-[#1e88c7]">
            {initials}
        </div>
    );
}

export const Dash = () => <span className="text-slate-400">-</span>;