import { useMemo, useState } from "react";
import { Search, Eye, Users, AlertTriangle, CalendarX, UserCheck, FileText, FileCheck } from "lucide-react";
import { PageHeader } from "@shared/components/PageHeader";
import { EmptyState } from "@shared/components/EmptyState";
import { LoadingState } from "@shared/components/LoadingState";
import { formatDate } from "@shared/lib/format";
import { useEmployeeList } from "../api/useEmployees";
import { usePositions } from "../api/usePositions";
import type { PositionLevel } from "../api/positionApi";
import {
    NEAR_MONTHS, MONITORED, LEVEL_META, SORT_ORDER, STATE_META,   // RETIREMENT_AGE dihapus
    buildRow, remainingLabel, StateBadge, LevelPill, Avatar, Dash, type Row,
} from "./pensiunShared";
import { PensiunDetailView, type ExtensionForm } from "./PensiunDetailView";

type Filter = "all" | "near" | "active" | "retired" | "resigned";

// Ukuran font mengikuti token global.css: header 0.75rem (sama dengan .table th),
// teks utama .font-body-2 (15px), teks sekunder .font-caption (13px).
const thClass = "px-4 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide";
const tdClass = "px-4 py-4 align-middle";

// ─── Halaman utama ───────────────────────────────────────────────────────────
export function PensiunPage() {
    const [filter, setFilter] = useState<Filter>("all");
    const [search, setSearch] = useState("");
    const [selected, setSelected] = useState<Row | null>(null);
    const [extensions, setExtensions] = useState<Record<string, ExtensionForm>>({});

    const { data, isLoading } = useEmployeeList({ per_page: 200 });
    const { data: positions } = usePositions();
    const truncated = !!data && data.total > data.data.length;

    const levelByPositionId = useMemo(() => {
        const map = new Map<number, PositionLevel>();
        (positions ?? []).forEach(p => map.set(p.id, p.level));
        return map;
    }, [positions]);

    const allRows = useMemo(
        () => (data?.data ?? [])
            .filter(e => MONITORED.includes(e.employment_status))
            .map(e => buildRow(e, levelByPositionId))
            .sort((a, b) =>
                SORT_ORDER[a.state] - SORT_ORDER[b.state] ||
                (a.monthsLeft ?? 0) - (b.monthsLeft ?? 0) ||
                a.emp.full_name.localeCompare(b.emp.full_name)),
        [data, levelByPositionId],
    );

    const nearCount = allRows.filter(r => r.state === "near" || r.state === "due").length;
    const activeCount = allRows.filter(r => r.state === "far" || r.state === "unknown").length;
    const retiredCount = allRows.filter(r => r.state === "retired").length;
    const resignedCount = allRows.filter(r => r.state === "resigned").length;
    const hasAnyBirth = allRows.some(r => r.birthRaw);

    const rows = useMemo(() => {
        const q = search.trim().toLowerCase();
        return allRows.filter(r => {
            if (filter === "near" && r.state !== "near" && r.state !== "due") return false;
            if (filter === "active" && r.state !== "far" && r.state !== "unknown") return false;
            if (filter === "retired" && r.state !== "retired") return false;
            if (filter === "resigned" && r.state !== "resigned") return false;
            if (!q) return true;
            const levelLabel = r.level ? LEVEL_META[r.level].label : "";
            return [r.emp.full_name, r.emp.employee_number, r.position, r.department, levelLabel]
                .some(v => v.toLowerCase().includes(q));
        });
    }, [allRows, filter, search]);

    const filters: { key: Filter; label: string; count: number }[] = [
        { key: "all", label: "Semua", count: allRows.length },
        { key: "near", label: "Dekat pensiun", count: nearCount },
        { key: "active", label: "Aktif", count: activeCount },
        { key: "retired", label: "Pensiun", count: retiredCount },
        { key: "resigned", label: "Resign", count: resignedCount },
    ];

    if (selected) {
        const key = String(selected.emp.id);
        const approverName =
            positions?.find(p => p.id === selected.emp.position_id)?.head?.full_name ?? null;
        return (
            <PensiunDetailView
                row={selected}
                onBack={() => setSelected(null)}
                extension={extensions[key] ?? null}
                onExtensionChange={f => setExtensions(prev => ({ ...prev, [key]: f }))}
                approverName={approverName}
            />
        );
    }

    return (
        <div className="min-h-screen bg-[#F8FAFC] pb-16">
            <PageHeader
                title="Pensiun Karyawan"
                subtitle="Catatan karyawan yang akan pensiun, perkiraan waktunya, dan tindak lanjut perpanjangan kontrak."
            />

            <div className="px-7 py-5 flex flex-col gap-6">
                {/* Info banner */}
                <div className="bg-white border border-slate-200/80 border-l-4 border-l-[#F2A602] rounded-2xl p-4 shadow-sm flex items-start sm:items-center gap-3.5 text-xs text-slate-600">
                    <div className="p-2 rounded-xl bg-amber-50 text-[#F2A602] shrink-0">
                        <FileText size={18} />
                    </div>
                    <div className="leading-relaxed flex flex-col gap-1">
                        <p>
                            <strong className="text-slate-900 font-semibold">Catatan Karyawan Akan Pensiun:</strong> Halaman ini mencatat data employee yang akan pensiun berdasarkan usia dan batas pensiun sesuai level jabatan.
                        </p>
                        <p>
                            <strong className="text-slate-900 font-semibold">Alur Perpanjangan Kontrak:</strong> 1. Employee yang mendekati pensiun tercatat di halaman ini. ➔ 2. Perpanjangan kontrak diajukan melalui <span className="font-semibold text-slate-800">Divisi HR</span>. ➔ 3. HR meminta persetujuan <span className="font-semibold text-slate-800">Manajer atau pihak yang berwenang</span>. ➔ 4. Setelah disetujui, <span className="font-semibold text-slate-800">proses perpanjangan kontrak</span> dapat dilakukan.
                        </p>
                    </div>
                </div>

                {/* KPI cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm flex flex-col justify-between">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Karyawan</span>
                            <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-slate-100 text-slate-700"><Users size={16} /></div>
                        </div>
                        <div className="mt-3">
                            <span className="text-2xl font-bold text-slate-900 tracking-tight">{isLoading ? "—" : allRows.length}</span>
                            <p className="text-xs text-slate-500 mt-1">Karyawan terpantau</p>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm flex flex-col justify-between">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Dekat Pensiun</span>
                            <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-amber-50 text-amber-600"><AlertTriangle size={16} /></div>
                        </div>
                        <div className="mt-3">
                            <span className="text-2xl font-bold text-slate-900 tracking-tight">{hasAnyBirth ? nearCount : "-"}</span>
                            <p className="text-xs text-amber-600 font-medium mt-1">
                                {hasAnyBirth ? `Sisa waktu ≤ ${NEAR_MONTHS} bulan` : "Menunggu data tanggal lahir"}
                            </p>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm flex flex-col justify-between">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Kontrak Diperpanjang</span>
                            <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-blue-50 text-blue-600"><FileCheck size={16} /></div>
                        </div>
                        <div className="mt-3">
                            <span className="text-2xl font-bold text-slate-900 tracking-tight">-</span>
                            <p className="text-xs text-blue-600 font-medium mt-1">Menunggu fitur perpanjangan kontrak</p>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm flex flex-col justify-between">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Sudah Pensiun</span>
                            <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-emerald-50 text-emerald-600"><UserCheck size={16} /></div>
                        </div>
                        <div className="mt-3">
                            <span className="text-2xl font-bold text-slate-900 tracking-tight">{isLoading ? "—" : retiredCount}</span>
                            <p className="text-xs text-emerald-600 font-medium mt-1">Status kepegawaian Pensiun</p>
                        </div>
                    </div>
                </div>

                {/* Main card */}
                <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
                    {/* Chip filter */}
                    <div className="p-2.5 bg-slate-50/70 border-b border-slate-200/80 flex flex-wrap items-center gap-1.5">
                        {filters.map(f => {
                            const active = filter === f.key;
                            return (
                                <button
                                    key={f.key}
                                    onClick={() => setFilter(f.key)}
                                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${active
                                        ? "bg-white text-[#0A2140] shadow-sm border border-slate-200/80"
                                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/70"
                                        }`}
                                >
                                    {f.label}
                                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${active ? "bg-slate-100 text-[#0A2140]" : "bg-slate-200/60 text-slate-500"}`}>
                                        {f.count}
                                    </span>
                                </button>
                            );
                        })}
                    </div>

                    {/* Toolbar */}
                    <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
                        <div className="relative flex-1 min-w-[240px] max-w-sm">
                            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50/70 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0A2140]/10 focus:border-[#0A2140] transition-all"
                                placeholder="Cari nama, kode, jabatan, atau level..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                            />
                        </div>
                        <span className="text-xs text-slate-500">Batas pensiun mengikuti <strong className="text-slate-700">level jabatan</strong></span>
                    </div>

                    {!isLoading && allRows.length > 0 && !hasAnyBirth && (
                        <div className="mx-4 mt-4 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-xs text-slate-600 flex items-center gap-2">
                            <CalendarX size={14} className="shrink-0 text-slate-400" />
                            Tanggal lahir belum tersedia di data employee. Perkiraan pensiun ditampilkan "-" sampai backend menambahkan field tanggal lahir.
                        </div>
                    )}

                    {truncated && (
                        <div className="mx-4 mt-4 bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 text-xs text-amber-800 flex items-center gap-2">
                            <AlertTriangle size={14} className="shrink-0" />
                            Jumlah employee melebihi batas yang dimuat ({data?.data.length} dari {data?.total}), sebagian belum tampil.
                        </div>
                    )}

                    {isLoading && <LoadingState />}
                    {!isLoading && rows.length === 0 && (
                        <div className="p-8">
                            <EmptyState title="Karyawan Tidak Ditemukan" subtitle="Coba ubah filter atau kata kunci pencarian." />
                        </div>
                    )}
                    {rows.length > 0 && (
                        <>
                            <div className="overflow-x-auto">
                                {/* Lebar kolom data dibuat tetap (px) supaya jaraknya rapat;
                    kolom Aksi mengambil sisa lebar sehingga garis baris tetap penuh. */}
                                <table className="w-full min-w-[1130px] table-fixed text-left border-collapse">
                                    <colgroup>
                                        <col style={{ width: "26%" }} />
                                        <col style={{ width: "20%" }} />
                                        <col style={{ width: "15%" }} />
                                        <col style={{ width: "17%" }} />
                                        <col style={{ width: "11%" }} />
                                        <col style={{ width: "11%" }} />
                                    </colgroup>
                                    <thead>
                                        <tr className="bg-slate-50/80 border-b border-slate-200/80">
                                            <th className={thClass}>Karyawan</th>
                                            <th className={thClass}>Jabatan</th>
                                            <th className={thClass}>Tanggal Lahir</th>
                                            <th className={thClass}>Perkiraan Pensiun</th>
                                            <th className={thClass}>Status</th>
                                            <th className={`${thClass} text-right`}>Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {rows.map(r => (
                                            <tr key={r.emp.id} className="hover:bg-slate-50/60 transition-colors border-b border-slate-100">
                                                <td className={tdClass}>
                                                    <div className="flex items-center gap-3">
                                                        <Avatar photoFileId={r.emp.photo_file_id} name={r.emp.full_name} />
                                                        <div className="min-w-0">
                                                            <button onClick={() => setSelected(r)} className="font-body-2 font-semibold text-slate-900 hover:text-[#0A2140] text-left block max-w-full truncate transition-colors">
                                                                {r.emp.full_name}
                                                            </button>
                                                            <div className="font-caption font-mono text-slate-500 truncate">{r.emp.employee_number}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className={tdClass}>
                                                    <LevelPill level={r.level} />
                                                    <div className="font-caption text-slate-500 mt-1">
                                                        {r.position}{r.department !== "-" ? ` · ${r.department}` : ""}
                                                    </div>
                                                </td>
                                                <td className={tdClass}>
                                                    {r.birthRaw ? (
                                                        <>
                                                            <div className="font-body-2 font-medium text-slate-800">{formatDate(r.birthRaw)}</div>
                                                            <div className="font-caption text-slate-500">{r.age} tahun</div>
                                                        </>
                                                    ) : (
                                                        <span className="font-body-2 italic text-slate-400">Belum terisi</span>
                                                    )}
                                                </td>
                                                <td className={tdClass}>
                                                    {r.retireDate ? (
                                                        <>
                                                            <div className="font-body-2 font-medium text-slate-800">
                                                                {formatDate(r.retireDate.toISOString())}
                                                            </div>
                                                            {r.monthsLeft !== null && r.state !== "retired" && r.state !== "resigned" && (
                                                                <div className={`font-caption font-semibold ${STATE_META[r.state].text}`}>
                                                                    {remainingLabel(r.monthsLeft)}
                                                                </div>
                                                            )}
                                                        </>
                                                    ) : (
                                                        <Dash />
                                                    )}
                                                </td>
                                                <td className={tdClass}><StateBadge state={r.state} /></td>
                                                <td className={`${tdClass} text-right`}>
                                                    <button
                                                        onClick={() => setSelected(r)}
                                                        title="Lihat detail data pensiun"
                                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 font-caption font-medium text-[#0A2140] bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                                                    >
                                                        <Eye size={14} /> Detail Pensiun
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <div className="px-6 py-4 border-t border-slate-100 text-sm text-slate-500">
                                Menampilkan <strong className="text-slate-700">{rows.length}</strong> dari <strong className="text-slate-700">{allRows.length}</strong> karyawan
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}