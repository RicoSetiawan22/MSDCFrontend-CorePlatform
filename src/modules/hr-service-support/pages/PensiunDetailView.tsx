import { useEffect, useState } from "react";
import {
    ArrowLeft, Mail, Phone, Building2, Hourglass, BadgeCheck, AlertTriangle, FileText,
    Send, CheckCircle2, FilePlus, History, Info, Pencil, X, Crown,
} from "lucide-react";
import { PageHeader } from "@shared/components/PageHeader";
import { formatDate } from "@shared/lib/format";
import {
    remainingLabel, StateBadge, LevelPill, Avatar, Dash, type Row,
} from "./pensiunShared";

// ─── Tipe & helper pengajuan perpanjangan kontrak ────────────────────────────
export type ExtensionStatus = "draft" | "submitted";
export interface ExtensionInput { startDate: string; durationMonths: number; reason: string }
export interface ExtensionForm extends ExtensionInput {
    status: ExtensionStatus;
    updatedAt: string;
    submittedAt?: string;
}

const DURATION_OPTIONS = [6, 12, 18, 24];


const pad = (n: number) => String(n).padStart(2, "0");
const toISODate = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const parseISODate = (s: string) => { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d); };

function calcEndDate(start: string, months: number) {
    if (!start) return "";
    const d = parseISODate(start);
    d.setMonth(d.getMonth() + months);
    d.setDate(d.getDate() - 1);
    return toISODate(d);
}

// ─── Komponen kecil untuk modal ──────────────────────────────────────────────
function Field({ label, hint, error, children }: {
    label: string; hint?: string; error?: string; children: React.ReactNode;
}) {
    return (
        <div>
            <label className="input-label">{label}</label>
            {children}
            {error
                ? <div className="input-error">{error}</div>
                : hint && <div className="text-xs text-slate-500 mt-1">{hint}</div>}
        </div>
    );
}

const roClass = "input bg-slate-50 text-slate-600 cursor-default";

// ─── Modal formulir perpanjangan kontrak (gaya sama dengan Tambah Employee) ──
// PENTING: dibiarkan di level atas file, jangan dipindah ke dalam PensiunDetailView
// (kalau di dalam, isian form akan ter-reset setiap kali mengetik).
function PerpanjanganKontrakModal({ row, initial, readOnly, approverName, onSaveDraft, onSubmit, onClose }: {
    row: Row;
    initial: ExtensionForm | null;
    readOnly: boolean;
    approverName: string | null;
    onSaveDraft: (v: ExtensionInput) => void;
    onSubmit: (v: ExtensionInput) => void;
    onClose: () => void;
}) {
    const { emp } = row;
    const defaultStart = row.retireDate
        ? toISODate(new Date(row.retireDate.getFullYear(), row.retireDate.getMonth(), row.retireDate.getDate() + 1))
        : "";

    const [startDate, setStartDate] = useState(initial?.startDate ?? defaultStart);
    const [duration, setDuration] = useState(initial?.durationMonths ?? 12);
    const [reason, setReason] = useState(initial?.reason ?? "");
    const [errors, setErrors] = useState<{ startDate?: string; reason?: string }>({});

    const endDate = calcEndDate(startDate, duration);
    const isSubmitted = initial?.status === "submitted";

    const values = (): ExtensionInput => ({ startDate, durationMonths: duration, reason: reason.trim() });

    function handleSubmit() {
        if (!approverName) return;
        const e: typeof errors = {};
        if (!startDate) e.startDate = "Tanggal mulai wajib diisi.";
        else if (row.retireDate && startDate <= toISODate(row.retireDate))
            e.startDate = "Harus setelah tanggal pensiun normal.";
        if (!reason.trim()) e.reason = "Alasan perpanjangan wajib diisi.";
        setErrors(e);
        if (Object.keys(e).length === 0) onSubmit(values());
    }

    return (
        <div className="modal-overlay">
            <div className="form-modal" role="dialog" aria-modal="true">
                <div className="form-modal__header">
                    <div className="flex items-start justify-between gap-3">
                        <div className="form-modal__title-row">
                            <h2 className="form-modal__title">Pengajuan Perpanjangan Kontrak</h2>
                            {isSubmitted
                                ? <span className="form-modal__badge" style={{ background: "#E6F7F0", color: "#00875A" }}>Diajukan</span>
                                : <span className="form-modal__badge">Draft</span>}
                        </div>
                        <button type="button" onClick={onClose} className="form-modal__close" aria-label="Tutup">
                            <X size={20} />
                        </button>
                    </div>
                    <p className="form-modal__subtitle">
                        {readOnly
                            ? "Formulir yang sudah diajukan. Data tidak dapat diubah."
                            : "Lengkapi durasi dan alasan perpanjangan kontrak karyawan."}
                    </p>
                </div>

                <div className="form-modal__scroll">
                    {/* 01 Informasi Karyawan */}
                    <div className="form-section">
                        <div className="form-section__label-row">
                            <span className="form-section__label">01 / Informasi Karyawan</span>
                            <span className="form-section__hint">Otomatis dari data karyawan</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Field label="Nama Karyawan"><input className={roClass} value={emp.full_name} readOnly /></Field>
                            <Field label="ID Karyawan"><input className={`${roClass} font-mono`} value={emp.employee_number} readOnly /></Field>
                            <Field label="Jabatan"><input className={roClass} value={row.position} readOnly /></Field>
                            <Field label="Usia Saat Ini"><input className={roClass} value={row.age !== null ? `${row.age} tahun` : "-"} readOnly /></Field>
                        </div>
                    </div>

                    {/* 02 Informasi Kontrak */}
                    <div className="form-section">
                        <div className="form-section__label-row">
                            <span className="form-section__label">02 / Informasi Kontrak</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Field label="Tanggal Pensiun Normal">
                                <input className={roClass} readOnly
                                    value={row.retireDate ? formatDate(row.retireDate.toISOString()) : "-"} />
                            </Field>
                            <Field label="Batas Usia Pensiun">
                                <input className={roClass} value={`${row.retireAge} tahun`} readOnly />
                            </Field>
                            <Field label="Tanggal Mulai Perpanjangan *" error={errors.startDate}>
                                <input type="date" className="input" value={startDate} disabled={readOnly}
                                    onChange={e => setStartDate(e.target.value)} />
                            </Field>
                            <Field label="Durasi Perpanjangan *">
                                <select className="input" value={duration} disabled={readOnly}
                                    onChange={e => setDuration(Number(e.target.value))}>
                                    {DURATION_OPTIONS.map(m => <option key={m} value={m}>{m} Bulan</option>)}
                                </select>
                            </Field>
                            <Field label="Tanggal Akhir Kontrak" hint="Dihitung otomatis dari tanggal mulai dan durasi">
                                <input className={roClass} readOnly value={endDate ? formatDate(endDate) : "-"} />
                            </Field>
                        </div>
                    </div>

                    {/* 03 Alasan */}
                    <div className="form-section">
                        <div className="form-section__label-row">
                            <span className="form-section__label">03 / Alasan Perpanjangan</span>
                        </div>
                        <Field label="Alasan *" error={errors.reason}>
                            <textarea
                                className="input resize-none" rows={4} value={reason} disabled={readOnly}
                                placeholder="mis. Kebutuhan operasional dan pengalaman karyawan masih dibutuhkan..."
                                onChange={e => setReason(e.target.value)}
                            />
                        </Field>
                    </div>

                    {/* 04 Persetujuan */}
                    <div className="form-section">
                        <div className="form-section__label-row">
                            <span className="form-section__label">04 / Persetujuan</span>
                            <span className="form-section__hint">Kepala posisi karyawan</span>
                        </div>
                        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5">
                            <div className="flex items-center justify-between gap-3">
                                <span className="text-xs text-slate-500">Pemberi persetujuan</span>
                                <LevelPill level={row.level} />
                            </div>
                            {approverName ? (
                                <div className="mt-1.5 flex items-center gap-1.5 font-body-2 font-semibold text-slate-900">
                                    <Crown size={14} className="text-amber-600" /> {approverName}
                                </div>
                            ) : (
                                <div className="mt-1.5 font-body-2 font-semibold text-rose-600">Belum ada Kepala posisi</div>
                            )}
                            <div className="font-caption text-slate-500 mt-0.5">Posisi: {row.position}</div>
                            <div className="font-caption text-slate-500">
                                Status: {isSubmitted
                                    ? `Menunggu persetujuan · diajukan ${initial?.submittedAt ? formatDate(initial.submittedAt) : ""}`
                                    : "Menunggu pengajuan"}
                            </div>
                        </div>
                        {!approverName && !readOnly && (
                            <div className="mt-3 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-xl px-3.5 py-3 leading-relaxed">
                                Pengajuan belum bisa dikirim karena posisi ini belum punya Kepala. Tetapkan dulu di menu Position / Jabatan. Draft tetap bisa disimpan.
                            </div>
                        )}
                        <p className="font-caption text-slate-500 mt-3">Contoh data dummy. Tombol di sini hanya menggambarkan rancangan interaksi.</p>
                    </div>
                </div>

                <div className="form-modal__footer">
                    <button type="button" onClick={onClose} className="btn btn-secondary">{readOnly ? "Tutup" : "Batal"}</button>
                    {!readOnly && (
                        <div className="flex items-center gap-2">
                            <button type="button" className="btn btn-secondary" onClick={() => onSaveDraft(values())}>Simpan Draft</button>
                            <button type="button" className="btn btn-accent" disabled={!approverName} onClick={handleSubmit}>Ajukan</button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// ─── Halaman detail data pensiun (full screen, 4 kartu seperti Detail Payroll) ─
const EMP_STATUS_LABELS: Record<string, string> = {
    active: "Aktif", probation: "Probation", on_leave: "Cuti",
    resigned: "Resign", terminated: "Terminated", retired: "Pensiun",
};

function SectionCard({ icon, iconTone, title, subtitle, children }: {
    icon: React.ReactNode; iconTone: string; title: string; subtitle: string; children: React.ReactNode;
}) {
    return (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 h-full">
            <div className="flex items-center gap-3 pb-4 mb-2 border-b border-slate-100">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${iconTone}`}>{icon}</div>
                <div>
                    <div className="text-sm font-bold text-slate-900">{title}</div>
                    <div className="text-xs text-slate-500">{subtitle}</div>
                </div>
            </div>
            {children}
        </div>
    );
}

function InfoLine({ label, hint, value }: { label: string; hint?: string; value: React.ReactNode }) {
    return (
        <div className="flex items-start justify-between gap-4 py-3 border-b border-slate-100 last:border-b-0">
            <div className="min-w-0">
                <div className="font-body-2 text-slate-700">{label}</div>
                {hint && <div className="font-caption text-slate-500">{hint}</div>}
            </div>
            <div className="font-body-2 font-semibold text-slate-900 text-right break-words max-w-[55%]">{value}</div>
        </div>
    );
}

export function PensiunDetailView({ row, onBack, extension, onExtensionChange, approverName }: {
    row: Row;
    onBack: () => void;
    extension: ExtensionForm | null;
    onExtensionChange: (f: ExtensionForm) => void;
    approverName: string | null;
}) {
    const { emp } = row;
    const [notice, setNotice] = useState<string | null>(null);
    const [flash, setFlash] = useState<string | null>(null);
    const [modalMode, setModalMode] = useState<"edit" | "view" | null>(null);

    // Escape: tutup modal dulu, baru kembali ke daftar
    useEffect(() => {
        function onKey(e: KeyboardEvent) {
            if (e.key !== "Escape") return;
            if (modalMode) setModalMode(null); else onBack();
        }
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [onBack, modalMode]);

    const extStatus = extension?.status ?? "none";
    const submittedExt = extension?.status === "submitted" ? extension : null;

    function handleSaveDraft(v: ExtensionInput) {
        onExtensionChange({ ...v, status: "draft", updatedAt: new Date().toISOString() });
        setModalMode(null);
        setFlash("Draft pengajuan tersimpan.");
    }

    function handleSubmit(v: ExtensionInput) {
        const now = new Date().toISOString();
        onExtensionChange({ ...v, status: "submitted", updatedAt: now, submittedAt: now });
        setModalMode(null);
        setFlash("Pengajuan perpanjangan kontrak berhasil diajukan.");
    }

    const ended = row.state === "retired" || row.state === "resigned";
    const showRemaining = row.monthsLeft !== null && !ended;
    const remainText = showRemaining ? remainingLabel(row.monthsLeft as number) : "-";
    const remainTone =
        row.state === "near" ? "text-amber-600" :
            row.state === "due" ? "text-rose-600" :
                row.state === "far" ? "text-emerald-600" : "text-slate-400";

    // Status proses pensiun: belum ada data di backend, jadi diturunkan dari status saja.
    const decision =
        row.state === "near" || row.state === "due" ? { label: "Belum diproses", cls: "bg-amber-50 text-amber-700 border-amber-200/60" } :
            row.state === "retired" ? { label: "Sudah pensiun", cls: "bg-slate-100 text-slate-600 border-slate-200/80" } :
                row.state === "resigned" ? { label: "Sudah resign", cls: "bg-rose-50 text-rose-700 border-rose-200/60" } :
                    { label: "Belum perlu tindakan", cls: "bg-emerald-50 text-emerald-700 border-emerald-200/60" };

    const missingBirth = !row.birthRaw && !ended;

    return (
        <div className="min-h-screen bg-[#F8FAFC] pb-16">
            <PageHeader
                title="Detail Pensiun"
                subtitle={`${emp.full_name} · ${emp.employee_number} · ${EMP_STATUS_LABELS[emp.employment_status] ?? emp.employment_status}`}
            >
                <StateBadge state={row.state} />
            </PageHeader>

            <div className="px-7 py-5 flex flex-col gap-6">
                {/* Info bar: kembali + kontak */}
                <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm px-4 py-3 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                        <button
                            type="button"
                            onClick={onBack}
                            className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                        >
                            <ArrowLeft size={14} /> Kembali ke Pensiun Karyawan
                        </button>
                        {emp.email && (
                            <span className="flex items-center gap-1"><Mail size={12} className="text-slate-400" />{emp.email}</span>
                        )}
                        {emp.phone && (
                            <>
                                <span className="text-slate-300">·</span>
                                <span className="flex items-center gap-1"><Phone size={12} className="text-slate-400" />{emp.phone}</span>
                            </>
                        )}
                        {row.department !== "-" && (
                            <>
                                <span className="text-slate-300">·</span>
                                <span className="flex items-center gap-1"><Building2 size={12} className="text-slate-400" />{row.department}</span>
                            </>
                        )}
                    </div>
                    <div className="text-xs text-slate-500">
                        <InfoLine label="Batas usia pensiun" value={`${row.retireAge} tahun`} />
                    </div>
                </div>

                {/* Banner alur perpanjangan kontrak */}
                <div className="bg-white border border-slate-200/80 border-l-4 border-l-[#F2A602] rounded-2xl p-4 shadow-sm flex items-start sm:items-center gap-3.5 text-xs text-slate-600">
                    <div className="p-2 rounded-xl bg-amber-50 text-[#F2A602] shrink-0">
                        <FileText size={18} />
                    </div>
                    <div className="leading-relaxed">
                        <strong className="text-slate-900 font-semibold">Alur Perpanjangan Kontrak:</strong> 1. HR meninjau data pensiun karyawan di halaman ini. ➔ 2. Perpanjangan kontrak diajukan melalui <span className="font-semibold text-slate-800">Divisi HR</span> dan meminta persetujuan <span className="font-semibold text-slate-800">Manajer atau pihak yang berwenang</span>. ➔ 3. Setelah disetujui, <span className="font-semibold text-slate-800">proses perpanjangan kontrak</span> dapat dilakukan.
                    </div>
                </div>

                {/* Peringatan data belum lengkap */}
                {missingBirth && (
                    <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 text-xs text-amber-800 flex items-center gap-2">
                        <AlertTriangle size={14} className="shrink-0" />
                        <span>
                            Data karyawan belum lengkap: <strong>Tanggal lahir</strong>. Usia dan perkiraan pensiun belum dapat dihitung sampai field tanggal lahir tersedia di data employee.
                        </span>
                    </div>
                )}

                {/* Kartu profil */}
                <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
                    <div className="h-1.5 bg-[#0A2140]" />
                    <div className="p-6 flex flex-wrap items-center justify-between gap-5">
                        <div className="flex items-center gap-4">
                            <Avatar photoFileId={emp.photo_file_id} name={emp.full_name} size={64} />
                            <div>
                                <div className="text-2xl font-bold text-slate-900 tracking-tight">{emp.full_name}</div>
                                <div className="flex flex-wrap items-center gap-2 mt-2">
                                    <span className="font-mono text-xs px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 font-semibold border border-slate-200">
                                        Kode: {emp.employee_number}
                                    </span>
                                    <StateBadge state={row.state} />
                                    <LevelPill level={row.level} />
                                </div>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Sisa Waktu Pensiun</div>
                            <div className={`text-2xl font-bold mt-1 ${remainTone}`}>{remainText}</div>
                            <div className="text-xs text-slate-500 mt-0.5">
                                {row.retireDate
                                    ? `Perkiraan pensiun ${formatDate(row.retireDate.toISOString())}`
                                    : ended ? "Tidak ada perkiraan pensiun" : "Menunggu data tanggal lahir"}
                            </div>
                        </div>
                    </div>
                </div>

                {/* 4 kartu: A, B / C, D */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* A. Informasi Karyawan */}
                    <SectionCard
                        icon={<BadgeCheck size={18} />} iconTone="bg-blue-50 text-blue-600"
                        title="A. Informasi Karyawan" subtitle="Identitas, jabatan, dan data pribadi"
                    >
                        <InfoLine label="Nama karyawan" value={emp.full_name} />
                        <InfoLine label="ID karyawan" value={<span className="font-mono">{emp.employee_number}</span>} />
                        <InfoLine label="Jabatan" value={row.position} />
                        <InfoLine label="Level" value={<LevelPill level={row.level} />} />
                        <InfoLine label="Departemen" value={row.department !== "-" ? row.department : <Dash />} />
                        <InfoLine
                            label="Tanggal lahir"
                            value={row.birthRaw ? formatDate(row.birthRaw) : <span className="italic text-slate-400 font-normal">Belum terisi</span>}
                        />
                        <InfoLine label="Usia saat ini" value={row.age !== null ? `${row.age} tahun` : <Dash />} />
                    </SectionCard>

                    {/* B. Informasi Pensiun */}
                    <SectionCard
                        icon={<Hourglass size={18} />} iconTone="bg-amber-50 text-amber-600"
                        title="B. Informasi Pensiun" subtitle="Batas usia, perkiraan, dan status proses pensiun"
                    >
                        <InfoLine
                            label="Batas usia pensiun"
                            hint="Berlaku untuk semua karyawan"
                            value={`${row.retireAge} tahun`}
                        />
                        <InfoLine label="Tanggal perkiraan pensiun" value={row.retireDate ? formatDate(row.retireDate.toISOString()) : <Dash />} />
                        <InfoLine label="Sisa waktu menuju pensiun" value={<span className={remainTone}>{remainText}</span>} />
                        <InfoLine
                            label="Status proses pensiun"
                            value={
                                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${decision.cls}`}>
                                    {decision.label}
                                </span>
                            }
                        />
                    </SectionCard>

                    {/* C. Riwayat dan Pengajuan */}
                    <SectionCard
                        icon={<FileText size={18} />} iconTone="bg-purple-50 text-purple-600"
                        title="C. Riwayat dan Pengajuan" subtitle="Perpanjangan kontrak dan keputusan persetujuan"
                    >
                        {/* TODO: ganti dengan data dari backend setelah fitur perpanjangan kontrak tersedia */}
                        <InfoLine
                            label="Riwayat perpanjangan kontrak"
                            value={submittedExt
                                ? <span className="text-emerald-600">Diajukan {formatDate(submittedExt.submittedAt!)}</span>
                                : extension
                                    ? <span className="text-amber-600">Draft tersimpan</span>
                                    : <span className="font-normal text-slate-400">Belum ada riwayat</span>}
                        />
                        <InfoLine
                            label="Tanggal mulai dan berakhir kontrak"
                            value={extension?.startDate
                                ? `${formatDate(extension.startDate)} – ${formatDate(calcEndDate(extension.startDate, extension.durationMonths))}`
                                : <Dash />}
                        />
                        <InfoLine label="Alasan perpanjangan" value={extension?.reason || <Dash />} />
                        <InfoLine
                            label="Nama pemberi persetujuan"
                            value={extension
                                ? (approverName ?? <span className="text-rose-600">Belum ada Kepala posisi</span>)
                                : <Dash />}
                        />
                        <InfoLine label="Catatan keputusan" value={<Dash />} />
                        <div className="mt-3 flex items-start gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-3 text-xs text-slate-500 leading-relaxed">
                            <Info size={14} className="shrink-0 mt-0.5 text-slate-400" />
                            Status persetujuan dan catatan keputusan menunggu fitur dari backend.
                        </div>
                    </SectionCard>

                    {/* D. Tindakan HR */}
                    <SectionCard
                        icon={<Send size={18} />} iconTone="bg-amber-50 text-amber-500"
                        title="D. Tindakan HR" subtitle="Proses pensiun, ajukan perpanjangan, atau lihat riwayat"
                    >
                        <div className="flex flex-col gap-3 pt-3">
                            {/* TODO: sambungkan ke API proses pensiun */}
                            <button
                                type="button"
                                disabled={ended}
                                onClick={() => { setFlash(null); setNotice("Proses Pensiun"); }}
                                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 font-caption font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-emerald-600"
                            >
                                <CheckCircle2 size={15} /> Proses Pensiun
                            </button>

                            {/* Buka formulir. Nonaktif jika sudah diajukan. */}
                            <button
                                type="button"
                                disabled={ended || extStatus === "submitted"}
                                onClick={() => { setFlash(null); setNotice(null); setModalMode("edit"); }}
                                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 font-caption font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <FilePlus size={15} className="text-slate-500" /> Ajukan Perpanjangan Kontrak
                            </button>

                            {/* Draft Pengajuan -> berubah jadi Lihat Riwayat setelah diajukan */}
                            {extStatus === "submitted" ? (
                                <button
                                    type="button"
                                    onClick={() => { setFlash(null); setNotice(null); setModalMode("view"); }}
                                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 font-caption font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl shadow-sm transition-colors"
                                >
                                    <History size={15} className="text-slate-500" /> Lihat Riwayat
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    disabled={extStatus === "none"}
                                    title={extStatus === "none" ? "Belum ada draft" : undefined}
                                    onClick={() => { setFlash(null); setNotice(null); setModalMode("edit"); }}
                                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 font-caption font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Pencil size={15} className="text-slate-500" /> Draft Pengajuan
                                </button>
                            )}
                        </div>

                        {ended && (
                            <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-4 text-center">
                                <CheckCircle2 size={18} className="mx-auto text-slate-400" />
                                <div className="font-body-2 font-semibold text-slate-600 mt-1.5">{decision.label}</div>
                                <div className="font-caption text-slate-500">Tidak ada tindakan yang diperlukan untuk karyawan ini.</div>
                            </div>
                        )}

                        {notice && !ended && (
                            <div className="mt-4 text-xs text-blue-800 bg-blue-50 border border-blue-200 rounded-xl px-3.5 py-3 leading-relaxed">
                                Fitur "{notice}" belum tersambung ke backend. Alurnya nanti: Divisi HR ➔ persetujuan Manajer atau pihak yang berwenang ➔ proses dijalankan.
                            </div>
                        )}

                        {flash && (
                            <div className="mt-4 text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-xl px-3.5 py-3 leading-relaxed">
                                {flash}
                            </div>
                        )}

                        <p className="font-caption text-slate-500 mt-4">
                            Tombol tindakan di atas merupakan contoh interaksi desain.
                        </p>
                    </SectionCard>
                </div>
            </div>

            {modalMode && (
                <PerpanjanganKontrakModal
                    row={row}
                    initial={extension}
                    readOnly={modalMode === "view"}
                    approverName={approverName}
                    onSaveDraft={handleSaveDraft}
                    onSubmit={handleSubmit}
                    onClose={() => setModalMode(null)}
                />
            )}
        </div>
    );
}