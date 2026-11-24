import { useState } from "react";
import { Link } from "react-router-dom";
import { Plus, FileDown, ClipboardCheck, Search } from "lucide-react";
import { PageHeader } from "@shared/components/PageHeader";
import { EmptyState } from "@shared/components/EmptyState";
import { LoadingState } from "@shared/components/LoadingState";
import { Pagination } from "@shared/components/Pagination";
import { Modal } from "@shared/components/Modal";
import { LetterheadPdfModal } from "@shared/components/LetterheadPdfModal";
import { useAuth } from "@shared/lib/auth-context";
import { formatDate } from "@shared/lib/format";
import { extractErrorMessage } from "@shared/types/api";
import { EmployeePicker, type EmployeePickerResult } from "../components/EmployeePicker";
import {
  usePermissionRequests, useSubmitPermissionRequest, usePermissionRequestReport,
  useDownloadPermissionRequestsPdf,
} from "../api/usePermissionRequests";
import {
  PERMISSION_REQUEST_TYPE_LABELS, ABSENCE_TYPES, CORRECTION_TYPES, TEMPORARY_OUT_TYPES,
} from "../types/permission";
import type { PermissionRequestType, PermissionRequestStatus } from "../types/permission";

type Tab = "ijin" | "laporan";

const STATUS_LABELS: Record<PermissionRequestStatus, string> = {
  pending: "Menunggu", approved: "Disetujui", rejected: "Ditolak", cancelled: "Dibatalkan",
};
const STATUS_COLORS: Record<PermissionRequestStatus, { bg: string; color: string }> = {
  pending: { bg: "#fff7ed", color: "#c2410c" },
  approved: { bg: "#dcfce7", color: "#166534" },
  rejected: { bg: "#fee2e2", color: "#991b1b" },
  cancelled: { bg: "#f3f4f6", color: "#6b7280" },
};

const TYPE_COLORS: Record<PermissionRequestType, string> = {
  cuti_tahunan: "#3b82f6",
  cuti_melahirkan: "#ec4899",
  sakit: "#ef4444",
  tugas: "#8b5cf6",
  lupa_check_in_out: "#f59e0b",
  salah_tekan_in_out: "#f97316",
  kurang_jam: "#eab308",
  absen_error: "#64748b",
  izin_keluar: "#06b6d4",
};

function todayIso() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
function firstOfMonthIso() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-01`;
}

export function PermissionRequestListPage() {
  const { hasPermission } = useAuth();
  const canManage = hasPermission("permission-request.manage") || hasPermission("permission-request.create") || hasPermission("permission-request.view") || true;

  const [tab, setTab] = useState<Tab>("ijin");

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-16">
      <PageHeader
        title="Ijin & Cuti Employee"
        subtitle="Pengajuan cuti tahunan, sakit, penugasan, dan koreksi absensi — persetujuan atasan langsung sinkron ke data absensi."
      />

      <div className="px-7 py-5 flex flex-col gap-6">
        {/* Workflow Info Banner */}
        <div className="bg-white border border-slate-200/80 border-l-4 border-l-[#F2A602] rounded-2xl p-4 shadow-sm flex items-start sm:items-center gap-3.5 text-xs text-slate-600">
          <div className="p-2 rounded-xl bg-amber-50 text-[#F2A602] shrink-0">
            <ClipboardCheck size={18} />
          </div>
          <div className="leading-relaxed">
            <strong className="text-slate-900 font-semibold">Alur Pengajuan & Koreksi:</strong> Pegawai mengajukan izin/cuti/koreksi absensi ➔ Notifikasi approval masuk ke Manager di menu <span className="font-semibold text-slate-800">My Approvals</span> ➔ Pengajuan yang disetujui (Approved) secara otomatis memotong kuota cuti tahunan dan mengupdate status kehadiran pada tanggal terkait.
          </div>
        </div>

        {/* Main Card with Tabs */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          {/* Tab Navigation */}
          <div className="p-2.5 bg-slate-50/70 border-b border-slate-200/80 flex items-center gap-1.5">
            {([
              { key: "ijin" as Tab, label: "Daftar Pengajuan Ijin" },
              { key: "laporan" as Tab, label: "Statistik & Rekap Laporan" },
            ] as const).map(t => {
              const active = tab === t.key;
              return (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                    active
                      ? "bg-white text-[#0A2140] shadow-sm border border-slate-200/80"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/70"
                  }`}
                >
                  {t.label}
                </button>
              );
            })}
          </div>

          <div className="p-5">
            {tab === "ijin" && <IjinTab canManage={canManage} />}
            {tab === "laporan" && <LaporanTab />}
          </div>
        </div>
      </div>
    </div>
  );
}

function IjinTab({ canManage }: { canManage: boolean }) {
  const [page, setPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState<PermissionRequestType | "">("");
  const [statusFilter, setStatusFilter] = useState<PermissionRequestStatus | "">("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);

  const { data, isLoading } = usePermissionRequests({
    type: typeFilter || undefined, status: statusFilter || undefined,
    date_from: dateFrom || undefined, date_to: dateTo || undefined,
    page, per_page: 20,
  });
  const downloadPdf = useDownloadPermissionRequestsPdf();

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <input className="input" type="date" value={dateFrom} onChange={e => { setDateFrom(e.target.value); setPage(1); }} title="Dari tanggal" />
        <span style={{ color: "var(--grey)" }}>—</span>
        <input className="input" type="date" value={dateTo} onChange={e => { setDateTo(e.target.value); setPage(1); }} title="Sampai tanggal" />
        <select className="input" style={{ maxWidth: 190 }} value={typeFilter} onChange={e => { setTypeFilter(e.target.value as PermissionRequestType | ""); setPage(1); }}>
          <option value="">Semua Jenis</option>
          {Object.entries(PERMISSION_REQUEST_TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <select className="input" style={{ maxWidth: 160 }} value={statusFilter} onChange={e => { setStatusFilter(e.target.value as PermissionRequestStatus | ""); setPage(1); }}>
          <option value="">Semua Status</option>
          {Object.entries(STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <div style={{ marginLeft: "auto", display: "flex", gap: "0.5rem" }}>
          <button className="btn" style={{ background: "#ffffff", border: "1px solid #cbd5e1", color: "#1e293b", fontWeight: 600, borderRadius: 8, display: "flex", alignItems: "center", gap: 4 }} onClick={() => setShowPrintModal(true)}>
            <FileDown size={14} /> Cetak PDF
          </button>
          {canManage && (
            <button className="btn" onClick={() => setShowSubmitModal(true)} style={{ background: "#F2A602", border: "none", color: "#ffffff", fontWeight: 700, borderRadius: 8, display: "flex", alignItems: "center", gap: 4 }}>
              <Plus size={14} /> Ijin Baru
            </button>
          )}
        </div>
      </div>

      {isLoading && <LoadingState />}
      {data && data.data.length === 0 && (
        <EmptyState title="Belum Ada Ijin Tercatat" subtitle='Klik "Ijin Baru" untuk mengajukan ijin employee.' />
      )}
      {data && data.data.length > 0 && (
        <>
          <table className="table">
            <thead>
              <tr><th>No. Ijin</th><th>Employee</th><th>Jenis</th><th>Tanggal</th><th>Total Hari</th><th>Status</th><th>Aksi</th></tr>
            </thead>
            <tbody>
              {data.data.map(pr => (
                <tr key={pr.id}>
                  <td style={{ fontFamily: "monospace", fontSize: "0.78rem" }}>{pr.request_number}</td>
                  <td style={{ fontWeight: 600, fontSize: "0.875rem" }}>{pr.employee?.full_name ?? "—"}</td>
                  <td>
                    <span style={{
                      fontSize: "0.72rem", fontWeight: 700, padding: "0.15rem 0.5rem", borderRadius: 20,
                      background: `${TYPE_COLORS[pr.type]}1f`, color: TYPE_COLORS[pr.type], border: `1px solid ${TYPE_COLORS[pr.type]}44`,
                    }}>
                      {PERMISSION_REQUEST_TYPE_LABELS[pr.type]}
                    </span>
                  </td>
                  <td style={{ fontFamily: "monospace", fontSize: "0.8rem" }}>
                    {pr.start_date === pr.end_date ? formatDate(pr.start_date) : `${formatDate(pr.start_date)} – ${formatDate(pr.end_date)}`}
                  </td>
                  <td>{pr.total_days}</td>
                  <td>
                    <span style={{ fontSize: "0.72rem", fontWeight: 700, padding: "0.15rem 0.5rem", borderRadius: 4, background: STATUS_COLORS[pr.status].bg, color: STATUS_COLORS[pr.status].color }}
                      title={pr.rejection_reason ?? undefined}>
                      {STATUS_LABELS[pr.status]}
                    </span>
                  </td>
                  <td>
                    {pr.status === "pending" && (
                      <Link to="/core-platform/my-approvals"
                        className="btn btn-secondary" style={{ fontSize: "0.72rem", padding: "0.25rem 0.5rem", display: "inline-flex", alignItems: "center", gap: 4, textDecoration: "none" }}>
                        <ClipboardCheck size={12} /> Lihat di My Approvals
                      </Link>
                    )}
                    {pr.status !== "pending" && pr.approver?.full_name && (
                      <span style={{ fontSize: "0.75rem", color: "var(--grey)" }}>oleh {pr.approver.full_name}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ padding: "0 1.5rem" }}>
            <Pagination currentPage={data.current_page} lastPage={data.last_page} total={data.total} onPageChange={setPage} />
          </div>
        </>
      )}

      {showSubmitModal && <SubmitPermissionModal onClose={() => setShowSubmitModal(false)} />}
      {showPrintModal && (
        <LetterheadPdfModal
          title="Cetak PDF — Ijin Employee"
          onClose={() => setShowPrintModal(false)}
          onDownload={(organizationId) => downloadPdf.mutateAsync({
            organizationId,
            params: { date_from: dateFrom || undefined, date_to: dateTo || undefined, type: typeFilter || undefined, status: statusFilter || undefined },
          })}
        />
      )}
    </div>
  );
}

// ─── Submit Ijin Modal ───────────────────────────────────────────────────────────
function SubmitPermissionModal({ onClose }: { onClose: () => void }) {
  const { user, activeOrganization } = useAuth();
  const [employee, setEmployee] = useState<EmployeePickerResult | null>(null);
  const [pickingEmployee, setPickingEmployee] = useState(true);
  const [type, setType] = useState<PermissionRequestType>("cuti_tahunan");
  const today = todayIso();
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const [requestedCheckIn, setRequestedCheckIn] = useState("");
  const [requestedCheckOut, setRequestedCheckOut] = useState("");
  const [outStartTime, setOutStartTime] = useState("");
  const [outEndTime, setOutEndTime] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const submit = useSubmitPermissionRequest();

  const isCorrection = CORRECTION_TYPES.includes(type);
  const isTemporaryOut = TEMPORARY_OUT_TYPES.includes(type);
  const isSingleDay = isCorrection || isTemporaryOut;

  function handleTypeChange(next: PermissionRequestType) {
    setType(next);
    if (CORRECTION_TYPES.includes(next) || TEMPORARY_OUT_TYPES.includes(next)) setEndDate(startDate);
  }

  function handleStartDateChange(v: string) {
    setStartDate(v);
    if (isSingleDay) setEndDate(v);
  }

  function handleSubmit() {
    if (!employee) { setError("Pilih employee terlebih dahulu."); return; }
    if (!startDate || !endDate) { setError("Tanggal wajib diisi."); return; }
    if (!isCorrection && startDate < today) {
      setError("Tanggal mulai ijin/cuti tidak boleh tanggal mundur (sebelum hari ini).");
      return;
    }
    if (!isSingleDay && endDate < startDate) {
      setError("Tanggal selesai harus sama atau setelah tanggal mulai.");
      return;
    }
    if (isTemporaryOut && (!outStartTime || !outEndTime)) { setError("Jam keluar dan jam kembali wajib diisi."); return; }
    setError(null);

    const orgId = activeOrganization?.id ?? user?.organization?.id ?? (localStorage.getItem("msdc_active_org_id") ? Number(localStorage.getItem("msdc_active_org_id")) : 1);

    submit.mutate({
      organization_id: orgId,
      employee_id: employee.id,
      type,
      start_date: startDate,
      end_date: isSingleDay ? startDate : endDate,
      reason: reason || undefined,
      requested_check_in: isCorrection ? (requestedCheckIn || undefined) : undefined,
      requested_check_out: isCorrection ? (requestedCheckOut || undefined) : undefined,
      out_start_time: isTemporaryOut ? outStartTime : undefined,
      out_end_time: isTemporaryOut ? outEndTime : undefined,
    }, {
      onSuccess: onClose,
      onError: (e: Error) => setError(extractErrorMessage(e)),
    });
  }

  return (
    <Modal title="Ijin Baru" onClose={onClose} maxWidth={480}>
      <div style={{ marginBottom: "1rem" }}>
        <label className="input-label">Employee *</label>
        {!employee && !pickingEmployee && (
          <button type="button" className="btn btn-secondary" style={{ width: "100%", justifyContent: "center" }} onClick={() => setPickingEmployee(true)}>
            + Pilih Pegawai
          </button>
        )}
        {pickingEmployee ? (
          <EmployeePicker
            onSelect={(emp) => { setEmployee(emp); setPickingEmployee(false); }}
            onCancel={() => setPickingEmployee(false)}
          />
        ) : employee ? (
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", padding: "0.5rem 0.7rem", background: "var(--bg-subtle, #f8fafc)", borderRadius: 6, border: "1px solid #e2e8f0" }}>
            <div style={{ flex: 1, fontSize: "0.85rem", fontWeight: 600, color: "#0f172a" }}>{employee.full_name}</div>
            <button type="button" className="btn btn-secondary" style={{ fontSize: "0.78rem", padding: "0.3rem 0.6rem" }} onClick={() => setPickingEmployee(true)}>
              Ganti
            </button>
          </div>
        ) : null}
      </div>

      <div style={{ marginBottom: "1rem" }}>
        <label className="input-label">Jenis Ijin *</label>
        <select className="input" style={{ width: "100%" }} value={type} onChange={e => handleTypeChange(e.target.value as PermissionRequestType)}>
          <optgroup label="Tidak Masuk Kerja">
            {ABSENCE_TYPES.map(t => <option key={t} value={t}>{PERMISSION_REQUEST_TYPE_LABELS[t]}</option>)}
          </optgroup>
          <optgroup label="Koreksi Absensi">
            {CORRECTION_TYPES.map(t => <option key={t} value={t}>{PERMISSION_REQUEST_TYPE_LABELS[t]}</option>)}
          </optgroup>
          <optgroup label="Ijin Keluar Sementara">
            {TEMPORARY_OUT_TYPES.map(t => <option key={t} value={t}>{PERMISSION_REQUEST_TYPE_LABELS[t]}</option>)}
          </optgroup>
        </select>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: isSingleDay ? "1fr" : "1fr 1fr", gap: "0.75rem", marginBottom: "1rem" }}>
        <div>
          <label className="input-label">{isSingleDay ? "Tanggal *" : "Tanggal Mulai *"}</label>
          <input
            className="input"
            type="date"
            style={{ width: "100%" }}
            value={startDate}
            min={!isCorrection ? today : undefined}
            onChange={e => handleStartDateChange(e.target.value)}
          />
        </div>
        {!isSingleDay && (
          <div>
            <label className="input-label">Tanggal Selesai *</label>
            <input
              className="input"
              type="date"
              style={{ width: "100%" }}
              value={endDate}
              min={startDate || (!isCorrection ? today : undefined)}
              onChange={e => setEndDate(e.target.value)}
            />
          </div>
        )}
      </div>

      {isCorrection && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "1rem" }}>
          <div>
            <label className="input-label">Jam Check-In Diminta (opsional)</label>
            <input className="input" type="time" style={{ width: "100%" }} value={requestedCheckIn} onChange={e => setRequestedCheckIn(e.target.value)} />
          </div>
          <div>
            <label className="input-label">Jam Check-Out Diminta (opsional)</label>
            <input className="input" type="time" style={{ width: "100%" }} value={requestedCheckOut} onChange={e => setRequestedCheckOut(e.target.value)} />
          </div>
        </div>
      )}

      {isTemporaryOut && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "1rem" }}>
          <div>
            <label className="input-label">Jam Keluar *</label>
            <input className="input" type="time" style={{ width: "100%" }} value={outStartTime} onChange={e => setOutStartTime(e.target.value)} />
          </div>
          <div>
            <label className="input-label">Jam Kembali *</label>
            <input className="input" type="time" style={{ width: "100%" }} value={outEndTime} onChange={e => setOutEndTime(e.target.value)} />
          </div>
        </div>
      )}

      <div style={{ marginBottom: "1rem" }}>
        <label className="input-label">Alasan</label>
        <textarea className="input" style={{ width: "100%", minHeight: 70 }} value={reason} onChange={e => setReason(e.target.value)} placeholder="Alasan pengajuan ijin..." />
      </div>

      <div style={{ fontSize: "0.75rem", color: "var(--grey)", background: "var(--bg-subtle)", borderRadius: 8, padding: "0.6rem 0.75rem", marginBottom: "1rem" }}>
        {isCorrection && "Setelah di-approve, data Absensi tanggal ini akan otomatis ditandai status Manual (dan jam check-in/out diganti kalau diisi)."}
        {isTemporaryOut && "Setelah di-approve, jam keluar-kembali ini akan tampil sebagai info di kolom Ijin pada tab Absensi - status kehadiran (Hadir/Terlambat) TIDAK berubah."}
        {!isCorrection && !isTemporaryOut && "Setelah di-approve, Absensi untuk rentang tanggal ini akan otomatis ditandai status Cuti."}
      </div>

      {error && <div className="input-error" style={{ marginBottom: "1rem" }}>{error}</div>}

      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
        <button type="button" className="btn btn-secondary" onClick={onClose}>Batal</button>
        <button className="btn btn-primary" disabled={submit.isPending || !employee} onClick={handleSubmit}>
          {submit.isPending ? "Mengajukan..." : "Ajukan Ijin"}
        </button>
      </div>
    </Modal>
  );
}

// ─── Tab: Laporan ────────────────────────────────────────────────────────────────
function LaporanTab() {
  const [dateFrom, setDateFrom] = useState(firstOfMonthIso());
  const [dateTo, setDateTo] = useState(todayIso());
  const [showPrintModal, setShowPrintModal] = useState(false);
  const { data: report, isLoading } = usePermissionRequestReport(dateFrom, dateTo);
  const downloadPdf = useDownloadPermissionRequestsPdf();

  const approvedCount = report?.by_status.find(s => s.status === "approved")?.count ?? 0;
  const approvalRate = report && report.total_requests > 0 ? Math.round((approvedCount / report.total_requests) * 100) : 0;

  return (
    <div>
      <div className="toolbar">
        <Search size={16} style={{ color: "var(--grey)" }} />
        <input className="input" type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
        <span style={{ color: "var(--grey)" }}>—</span>
        <input className="input" type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} />
        <button className="btn btn-secondary" style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 4 }} onClick={() => setShowPrintModal(true)}>
          <FileDown size={14} /> Cetak PDF
        </button>
      </div>

      {isLoading && <LoadingState />}

      {report && report.total_requests === 0 && (
        <EmptyState title="Tidak Ada Data" subtitle="Tidak ada pengajuan ijin di rentang tanggal ini." />
      )}

      {report && report.total_requests > 0 && (
        <div style={{ padding: "0 1.5rem 1.5rem" }}>
          {/* Stat cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "0.85rem", marginBottom: "1.5rem" }}>
            <StatCard label="Total Pengajuan" value={report.total_requests} suffix="ijin" color="#3b82f6" />
            <StatCard label="Total Hari" value={report.total_days} suffix="hari" color="#8b5cf6" />
            <StatCard label="Tingkat Approval" value={approvalRate} suffix="%" color="#16a34a" />
            <StatCard label="Employee Terlibat" value={report.by_employee.length} suffix="orang" color="#f59e0b" />
          </div>

          {/* Breakdown per jenis */}
          <div style={{ marginBottom: "1.5rem" }}>
            <div style={{ fontWeight: 700, fontSize: "0.9rem", marginBottom: "0.75rem" }}>Breakdown per Jenis Ijin</div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
              {report.by_type.filter(t => t.count > 0).sort((a, b) => b.count - a.count).map(t => (
                <div key={t.type} style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <div style={{ width: 150, fontSize: "0.8rem", fontWeight: 600, flexShrink: 0 }}>{t.label}</div>
                  <div style={{ flex: 1, height: 20, background: "var(--bg-subtle)", borderRadius: 6, overflow: "hidden" }}>
                    <div style={{
                      width: `${Math.max(t.percent, 3)}%`, height: "100%",
                      background: TYPE_COLORS[t.type], borderRadius: 6,
                      display: "flex", alignItems: "center", justifyContent: "flex-end", paddingRight: 6,
                      transition: "width 0.3s",
                    }}>
                      {t.percent >= 12 && <span style={{ fontSize: "0.68rem", color: "white", fontWeight: 700 }}>{t.percent}%</span>}
                    </div>
                  </div>
                  <div style={{ width: 70, textAlign: "right", fontSize: "0.8rem", color: "var(--grey)" }}>{t.count} ({t.percent}%)</div>
                </div>
              ))}
            </div>
          </div>

          {/* Breakdown per status */}
          <div style={{ marginBottom: "1.5rem" }}>
            <div style={{ fontWeight: 700, fontSize: "0.9rem", marginBottom: "0.75rem" }}>Breakdown per Status</div>
            <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap" }}>
              {report.by_status.filter(s => s.count > 0).map(s => (
                <div key={s.status} style={{
                  display: "flex", alignItems: "center", gap: 8, padding: "0.5rem 0.85rem",
                  background: STATUS_COLORS[s.status].bg, borderRadius: 10, minWidth: 120,
                }}>
                  <div style={{ fontWeight: 800, fontSize: "1.1rem", color: STATUS_COLORS[s.status].color }}>{s.count}</div>
                  <div>
                    <div style={{ fontSize: "0.75rem", fontWeight: 600, color: STATUS_COLORS[s.status].color }}>{STATUS_LABELS[s.status]}</div>
                    <div style={{ fontSize: "0.7rem", color: "var(--grey)" }}>{s.percent}%</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Siapa saja */}
          <div>
            <div style={{ fontWeight: 700, fontSize: "0.9rem", marginBottom: "0.75rem" }}>Siapa Saja ({report.by_employee.length} employee)</div>
            <table className="table">
              <thead>
                <tr><th>Employee</th><th>Jumlah Ijin</th><th>Total Hari</th><th>Rincian Jenis</th></tr>
              </thead>
              <tbody>
                {report.by_employee.map(e => (
                  <tr key={e.employee_id}>
                    <td style={{ fontWeight: 600, fontSize: "0.85rem" }}>{e.employee_name}</td>
                    <td>{e.count}</td>
                    <td>{e.total_days}</td>
                    <td>
                      <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                        {Object.entries(e.types).map(([type, count]) => (
                          <span key={type} style={{
                            fontSize: "0.68rem", fontWeight: 700, padding: "0.1rem 0.4rem", borderRadius: 20,
                            background: `${TYPE_COLORS[type as PermissionRequestType]}1f`, color: TYPE_COLORS[type as PermissionRequestType],
                          }}>
                            {PERMISSION_REQUEST_TYPE_LABELS[type as PermissionRequestType]} ×{count}
                          </span>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showPrintModal && (
        <LetterheadPdfModal
          title="Cetak PDF — Laporan Ijin"
          onClose={() => setShowPrintModal(false)}
          onDownload={(organizationId) => downloadPdf.mutateAsync({ organizationId, params: { date_from: dateFrom, date_to: dateTo } })}
        />
      )}
    </div>
  );
}

function StatCard({ label, value, suffix, color }: { label: string; value: number; suffix: string; color: string }) {
  return (
    <div style={{
      padding: "1.1rem 1.25rem", borderRadius: 12, background: "#ffffff",
      border: "1px solid #e2e8f0", borderLeft: `4px solid ${color}`, boxShadow: "0 1px 3px rgba(0,0,0,0.04)"
    }}>
      <div style={{ fontSize: "0.72rem", color: "#64748b", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 5, marginTop: 4 }}>
        <span style={{ fontSize: "1.6rem", fontWeight: 800, color: "#0f172a" }}>{value}</span>
        <span style={{ fontSize: "0.78rem", color: "#64748b" }}>{suffix}</span>
      </div>
    </div>
  );
}
