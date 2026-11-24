import { useState } from "react";
import { ChevronDown, ChevronRight, Send, AlertTriangle, Award, DollarSign, CheckCircle2 } from "lucide-react";
import {
  useHrIntegrationList,
  usePostHrIntegrationBatch,
  useHrCertificationIntegrationList,
  usePostHrCertificationBatch,
} from "../api/useHrIntegration";
import { Button } from "@shared/components/Button";
import { PageHeader } from "@shared/components/PageHeader";
import { EmptyState } from "@shared/components/EmptyState";
import { LoadingState } from "@shared/components/LoadingState";
import { Pagination } from "@shared/components/Pagination";
import { formatCurrency } from "@shared/lib/format";
import { extractErrorMessage } from "@shared/types/api";
import type { IntegrationPayrollRecord, IntegrationCertificationRecord } from "../types/integration";

/** HR Integration - antrean review payroll & biaya sertifikasi SDM yang SUDAH DIAJUKAN dari HR Service Support.
 * Payroll dihitung & diklik "Ajukan ke Finance" di modul HR terlebih dahulu,
 * lalu masuk ke antrean ini untuk direview preview jurnalnya dan diposting ke General Ledger (GL) oleh Finance. */
export function HrIntegrationPage() {
  const [activeTab, setActiveTab] = useState<"payroll" | "certifications">("payroll");

  return (
    <div>
      <PageHeader
        title="HR Integration"
        subtitle="Antrean pengajuan Payroll & Biaya Sertifikasi SDM dari modul HR & Service Support — periksa rincian gaji/pajak dan preview jurnal di sini, lalu centang untuk memposting ke Jurnal Umum (GL)."
      />

      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem", borderBottom: "1px solid var(--border)", paddingBottom: "0.5rem" }}>
        <button
          type="button"
          onClick={() => setActiveTab("payroll")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "0.55rem 1rem",
            borderRadius: 8,
            border: activeTab === "payroll" ? "1px solid #2563eb" : "1px solid transparent",
            background: activeTab === "payroll" ? "#eff6ff" : "transparent",
            color: activeTab === "payroll" ? "#1d4ed8" : "var(--grey)",
            fontWeight: 700,
            fontSize: "0.85rem",
            cursor: "pointer",
          }}
        >
          <DollarSign size={15} /> Pengajuan Payroll dari HR
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("certifications")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "0.55rem 1rem",
            borderRadius: 8,
            border: activeTab === "certifications" ? "1px solid #2563eb" : "1px solid transparent",
            background: activeTab === "certifications" ? "#eff6ff" : "transparent",
            color: activeTab === "certifications" ? "#1d4ed8" : "var(--grey)",
            fontWeight: 700,
            fontSize: "0.85rem",
            cursor: "pointer",
          }}
        >
          <Award size={15} /> Biaya Sertifikasi SDM
        </button>
      </div>

      {activeTab === "payroll" ? <PayrollIntegrationSection /> : <CertificationIntegrationSection />}
    </div>
  );
}

function PayrollIntegrationSection() {
  const now = new Date();
  const [page, setPage] = useState(1);
  const [monthFilter, setMonthFilter] = useState(now.getMonth() + 1);
  const [yearFilter, setYearFilter] = useState(now.getFullYear());
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  const { data, isLoading } = useHrIntegrationList({
    page,
    per_page: 20,
    period_month: monthFilter,
    period_year: yearFilter,
    search: search || undefined,
  });
  const postBatch = usePostHrIntegrationBatch();

  const records = data?.data ?? [];
  const postableIds = records.filter(r => r.journal_preview).map(r => r.id);
  const allSelected = postableIds.length > 0 && postableIds.every(id => selectedIds.includes(id));

  function toggleSelect(id: number) {
    setSelectedIds(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]));
  }

  function toggleSelectAll() {
    setSelectedIds(allSelected ? [] : postableIds);
  }

  function handlePostSelected() {
    if (selectedIds.length === 0) return;
    if (!confirm(`Posting ${selectedIds.length} pengajuan payroll terpilih ke Jurnal Umum (GL)? Aksi ini tidak bisa dibatalkan.`)) return;
    postBatch.mutate(selectedIds, {
      onSuccess: res => {
        alert(res.message);
        setSelectedIds([]);
      },
      onError: e => alert("Gagal: " + extractErrorMessage(e)),
    });
  }

  return (
    <div className="content-card">
      <div className="toolbar">
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <select
            className="input"
            style={{ maxWidth: 100 }}
            value={monthFilter}
            onChange={e => {
              setMonthFilter(parseInt(e.target.value));
              setPage(1);
            }}
          >
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i + 1} value={i + 1}>
                {String(i + 1).padStart(2, "0")}
              </option>
            ))}
          </select>
          <span style={{ color: "var(--grey)" }}>/</span>
          <select
            className="input"
            style={{ maxWidth: 100 }}
            value={yearFilter}
            onChange={e => {
              setYearFilter(parseInt(e.target.value));
              setPage(1);
            }}
          >
            {[2024, 2025, 2026, 2027].map(y => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
        <input
          className="input"
          placeholder="Cari nama/kode pegawai..."
          value={search}
          onChange={e => {
            setSearch(e.target.value);
            setPage(1);
          }}
          style={{ maxWidth: 220 }}
        />
        <div style={{ marginLeft: "auto", display: "flex", gap: "0.5rem" }}>
          <Button
            disabled={selectedIds.length === 0 || postBatch.isPending}
            onClick={handlePostSelected}
            style={{ display: "flex", alignItems: "center", gap: 4 }}
          >
            <Send size={14} /> {postBatch.isPending ? "Memproses..." : `Posting ke GL Terpilih (${selectedIds.length})`}
          </Button>
        </div>
      </div>

      {isLoading && <LoadingState />}
      {data && records.length === 0 && (
        <EmptyState
          title="Belum Ada Pengajuan Payroll dari HR"
          subtitle={`Payroll periode ${String(monthFilter).padStart(2, "0")}/${yearFilter} yang sudah dihitung dan diklik "Ajukan ke Finance" pada modul HR & Service Support > Payroll > Detail akan tampil di sini untuk direview & diposting ke Jurnal Umum (GL).`}
        />
      )}
      {data && records.length > 0 && (
        <>
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "0 1.5rem 0.6rem", fontSize: "0.78rem", color: "var(--grey)" }}>
            <input type="checkbox" checked={allSelected} onChange={toggleSelectAll} disabled={postableIds.length === 0} />
            Pilih semua pengajuan payroll dari HR yang siap diposting di halaman ini
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem", padding: "0 1.5rem 1rem" }}>
            {records.map(record => (
              <HrIntegrationRow
                key={record.id}
                record={record}
                selected={selectedIds.includes(record.id)}
                onToggle={() => toggleSelect(record.id)}
              />
            ))}
          </div>
          <div style={{ padding: "0 1.5rem" }}>
            <Pagination currentPage={data.current_page} lastPage={data.last_page} total={data.total} onPageChange={setPage} />
          </div>
        </>
      )}
    </div>
  );
}

function CertificationIntegrationSection() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  const { data, isLoading } = useHrCertificationIntegrationList({
    page,
    per_page: 20,
    reimbursement_status: statusFilter || undefined,
    search: search || undefined,
  });
  const postCertBatch = usePostHrCertificationBatch();

  const records = data?.data ?? [];
  const postableIds = records
    .filter(r => r.journal_preview && r.reimbursement_status !== "POSTED_TO_GL" && r.reimbursement_status !== "PAID")
    .map(r => r.id);
  const allSelected = postableIds.length > 0 && postableIds.every(id => selectedIds.includes(id));

  function toggleSelect(id: number) {
    setSelectedIds(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]));
  }

  function toggleSelectAll() {
    setSelectedIds(allSelected ? [] : postableIds);
  }

  function handlePostSelected() {
    if (selectedIds.length === 0) return;
    if (!confirm(`Posting ${selectedIds.length} biaya sertifikasi terpilih ke Jurnal Umum (GL)? Aksi ini tidak bisa dibatalkan.`)) return;
    postCertBatch.mutate(selectedIds, {
      onSuccess: res => {
        alert(res.message);
        setSelectedIds([]);
      },
      onError: e => alert("Gagal: " + extractErrorMessage(e)),
    });
  }

  return (
    <div className="content-card">
      <div className="toolbar">
        <select
          className="input"
          style={{ maxWidth: 210 }}
          value={statusFilter}
          onChange={e => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
        >
          <option value="">Semua Status Antrean</option>
          <option value="PENDING_FINANCE">Menunggu Finance (Pending)</option>
          <option value="DRAFT">Draft Biaya Sertifikasi</option>
          <option value="POSTED_TO_GL">Sudah Diposting ke GL</option>
        </select>
        <input
          className="input"
          placeholder="Cari nama pegawai / sertifikasi..."
          value={search}
          onChange={e => {
            setSearch(e.target.value);
            setPage(1);
          }}
          style={{ maxWidth: 260 }}
        />
        <div style={{ marginLeft: "auto", display: "flex", gap: "0.5rem" }}>
          <Button
            disabled={selectedIds.length === 0 || postCertBatch.isPending}
            onClick={handlePostSelected}
            style={{ display: "flex", alignItems: "center", gap: 4 }}
          >
            <Send size={14} /> {postCertBatch.isPending ? "Memproses..." : `Posting Biaya Terpilih (${selectedIds.length})`}
          </Button>
        </div>
      </div>

      {isLoading && <LoadingState />}
      {data && records.length === 0 && (
        <EmptyState
          title="Tidak Ada Antrean Biaya Sertifikasi SDM"
          subtitle="Sertifikasi dengan sumber dana Perusahaan (Company Sponsored) atau Reimbursement dari modul HR Training & Sertifikasi akan tampil di sini untuk diposting ke Jurnal GL."
        />
      )}
      {data && records.length > 0 && (
        <>
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "0 1.5rem 0.6rem", fontSize: "0.78rem", color: "var(--grey)" }}>
            <input type="checkbox" checked={allSelected} onChange={toggleSelectAll} disabled={postableIds.length === 0} />
            Pilih semua biaya sertifikasi yang siap diposting di halaman ini
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem", padding: "0 1.5rem 1rem" }}>
            {records.map(record => (
              <HrCertificationIntegrationRow
                key={record.id}
                record={record}
                selected={selectedIds.includes(record.id)}
                onToggle={() => toggleSelect(record.id)}
              />
            ))}
          </div>
          <div style={{ padding: "0 1.5rem" }}>
            <Pagination currentPage={data.current_page} lastPage={data.last_page} total={data.total} onPageChange={setPage} />
          </div>
        </>
      )}
    </div>
  );
}

function HrIntegrationRow({
  record,
  selected,
  onToggle,
}: {
  record: IntegrationPayrollRecord;
  selected: boolean;
  onToggle: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const overtimeNeedsApproval =
    record.overtime_record && !["approved", "sent_to_finance"].includes(record.overtime_record.status);

  const grossAmt = Number(record.total_amount) || 0;
  const dedAmt = Number(record.total_deduction) || 0;
  const netAmt = Number(record.net_amount ?? grossAmt - dedAmt) || 0;

  return (
    <div style={{ border: "1px solid var(--border)", borderRadius: 8, overflow: "hidden" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.75rem 1rem" }}>
        <input
          type="checkbox"
          checked={selected}
          onChange={onToggle}
          disabled={!record.journal_preview}
          onClick={e => e.stopPropagation()}
        />
        <div style={{ flex: 1, minWidth: 0, cursor: "pointer" }} onClick={() => setExpanded(e => !e)}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            <span style={{ fontWeight: 700, fontSize: "0.88rem" }}>{record.employee?.full_name ?? "—"}</span>
            {record.employee?.employee_number && (
              <span style={{ fontSize: "0.74rem", color: "var(--grey)", fontFamily: "monospace" }}>
                ({record.employee.employee_number})
              </span>
            )}
            <span style={{ fontSize: "0.75rem", color: "var(--grey)", fontFamily: "monospace" }}>
              • Periode {String(record.period_month).padStart(2, "0")}/{record.period_year}
            </span>
            <span
              style={{
                fontSize: "0.68rem",
                fontWeight: 700,
                padding: "2px 8px",
                borderRadius: 999,
                background: "#dbeafe",
                color: "#1d4ed8",
              }}
            >
              Diajukan dari HR
            </span>
            {record.ptkp_status && (
              <span
                style={{
                  fontSize: "0.68rem",
                  fontWeight: 700,
                  padding: "2px 8px",
                  borderRadius: 999,
                  background: "#fef3c7",
                  color: "#b45309",
                }}
              >
                PTKP {record.ptkp_status} · TER {record.ter_category || "A"}
              </span>
            )}
          </div>
          <div
            style={{
              fontSize: "0.73rem",
              color: "var(--grey)",
              marginTop: 4,
              marginLeft: 22,
              display: "flex",
              gap: 14,
              flexWrap: "wrap",
            }}
          >
            <span>
              Bruto: <strong>{formatCurrency(grossAmt)}</strong>
            </span>
            <span>
              Potongan (BPJS &amp; PPh 21): <strong style={{ color: "#dc2626" }}>- {formatCurrency(dedAmt)}</strong>
            </span>
            <span>
              Gaji Bersih (Take-Home): <strong style={{ color: "#059669" }}>{formatCurrency(netAmt)}</strong>
            </span>
          </div>
          {overtimeNeedsApproval && (
            <div
              style={{
                fontSize: "0.68rem",
                color: "#c2410c",
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                gap: 3,
                marginTop: 2,
                marginLeft: 20,
              }}
            >
              <AlertTriangle size={10} /> Overtime periode ini belum di-approve Manager — lembur akan diposting Rp 0
            </div>
          )}
          {record.preview_error && (
            <div
              style={{
                fontSize: "0.68rem",
                color: "#dc2626",
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                gap: 3,
                marginTop: 2,
                marginLeft: 20,
              }}
            >
              <AlertTriangle size={10} /> {record.preview_error}
            </div>
          )}
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontFamily: "monospace", fontWeight: 700, fontSize: "0.9rem" }}>{formatCurrency(grossAmt)}</div>
          <div style={{ fontSize: "0.7rem", color: "#059669", fontFamily: "monospace", fontWeight: 600 }}>
            Net: {formatCurrency(netAmt)}
          </div>
        </div>
      </div>

      {expanded && record.journal_preview && (
        <div style={{ borderTop: "1px solid var(--border)", background: "#fafbfc", padding: "0.5rem 1rem 0.75rem 2.5rem" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.78rem" }}>
            <thead>
              <tr>
                <th
                  style={{
                    padding: "3px 8px",
                    textAlign: "left",
                    color: "var(--grey)",
                    fontSize: "0.7rem",
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                    borderBottom: "1px solid var(--border)",
                    width: 90,
                  }}
                >
                  Kode
                </th>
                <th
                  style={{
                    padding: "3px 8px",
                    textAlign: "left",
                    color: "var(--grey)",
                    fontSize: "0.7rem",
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                    borderBottom: "1px solid var(--border)",
                  }}
                >
                  Nama Akun
                </th>
                <th
                  style={{
                    padding: "3px 8px",
                    textAlign: "left",
                    color: "var(--grey)",
                    fontSize: "0.7rem",
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                    borderBottom: "1px solid var(--border)",
                  }}
                >
                  Memo
                </th>
                <th
                  style={{
                    padding: "3px 8px",
                    textAlign: "right",
                    color: "var(--grey)",
                    fontSize: "0.7rem",
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                    borderBottom: "1px solid var(--border)",
                    width: 120,
                  }}
                >
                  Debit
                </th>
                <th
                  style={{
                    padding: "3px 8px",
                    textAlign: "right",
                    color: "var(--grey)",
                    fontSize: "0.7rem",
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                    borderBottom: "1px solid var(--border)",
                    width: 120,
                  }}
                >
                  Kredit
                </th>
              </tr>
            </thead>
            <tbody>
              {record.journal_preview.lines.map((line, i) => (
                <tr key={i}>
                  <td style={{ padding: "3px 8px", fontFamily: "monospace", fontSize: "0.75rem", color: "#6b7280" }}>
                    {line.account_code || "—"}
                  </td>
                  <td style={{ padding: "3px 8px", fontSize: "0.78rem" }}>{line.account_name ?? "(Tanpa nama)"}</td>
                  <td style={{ padding: "3px 8px", color: "var(--grey)", fontSize: "0.75rem", fontStyle: "italic" }}>
                    {line.description ?? "—"}
                  </td>
                  <td
                    style={{
                      padding: "3px 8px",
                      textAlign: "right",
                      fontFamily: "monospace",
                      fontWeight: 600,
                      color: line.debit > 0 ? "#1d4ed8" : "#d1d5db",
                    }}
                  >
                    {line.debit > 0 ? formatCurrency(line.debit) : "—"}
                  </td>
                  <td
                    style={{
                      padding: "3px 8px",
                      textAlign: "right",
                      fontFamily: "monospace",
                      fontWeight: 600,
                      color: line.credit > 0 ? "#7c3aed" : "#d1d5db",
                    }}
                  >
                    {line.credit > 0 ? formatCurrency(line.credit) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {record.journal_preview.note && (
            <div style={{ fontSize: "0.75rem", color: "var(--grey)", marginTop: "0.4rem", fontStyle: "italic" }}>
              {record.journal_preview.note}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function HrCertificationIntegrationRow({
  record,
  selected,
  onToggle,
}: {
  record: IntegrationCertificationRecord;
  selected: boolean;
  onToggle: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const isAlreadyPosted = record.reimbursement_status === "POSTED_TO_GL" || record.reimbursement_status === "PAID";
  const canPost = Boolean(record.journal_preview && !isAlreadyPosted);

  const statusBadge = (() => {
    switch (record.reimbursement_status) {
      case "POSTED_TO_GL":
      case "PAID":
        return { label: `Posted GL (${record.gl_journal_number || "Selesai"})`, bg: "#dcfce7", color: "#15803d" };
      case "PENDING_FINANCE":
        return { label: "Menunggu Posting Finance", bg: "#fef3c7", color: "#b45309" };
      case "DRAFT":
        return { label: "Draft Biaya", bg: "#f1f5f9", color: "#475569" };
      default:
        return { label: record.reimbursement_status || "Draft", bg: "#f1f5f9", color: "#475569" };
    }
  })();

  return (
    <div style={{ border: "1px solid var(--border)", borderRadius: 8, overflow: "hidden" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.75rem 1rem" }}>
        <input
          type="checkbox"
          checked={selected}
          onChange={onToggle}
          disabled={!canPost}
          onClick={e => e.stopPropagation()}
        />
        <div style={{ flex: 1, minWidth: 0, cursor: "pointer" }} onClick={() => setExpanded(e => !e)}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            <span style={{ fontWeight: 700, fontSize: "0.88rem" }}>{record.employee?.full_name ?? "—"}</span>
            <span style={{ fontSize: "0.75rem", color: "var(--grey)", fontFamily: "monospace" }}>
              ({record.employee?.employee_number ?? "—"})
            </span>
            <span style={{ fontSize: "0.8rem", fontWeight: 600, color: "#1e40af" }}>
              • {record.certification?.name ?? "Sertifikasi"} ({record.certification?.code ?? "-"})
            </span>
            <span
              style={{
                fontSize: "0.7rem",
                fontWeight: 700,
                padding: "2px 8px",
                borderRadius: 999,
                background: statusBadge.bg,
                color: statusBadge.color,
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              {isAlreadyPosted && <CheckCircle2 size={11} />}
              {statusBadge.label}
            </span>
          </div>
          <div
            style={{
              fontSize: "0.74rem",
              color: "var(--grey)",
              marginTop: 3,
              marginLeft: 22,
              display: "flex",
              gap: 12,
              flexWrap: "wrap",
            }}
          >
            <span>
              Sumber Dana:{" "}
              <strong>{record.funding_source === "REIMBURSEMENT" ? "Reimbursement Karyawan" : "Ditanggung Perusahaan"}</strong>
            </span>
            <span>
              Cost Center: <strong>{record.cost_center?.name ?? "Default HR"}</strong>
            </span>
            <span>
              Tgl Terbit: <strong>{record.issued_date}</strong>
            </span>
          </div>
          {record.preview_error && (
            <div
              style={{
                fontSize: "0.68rem",
                color: "#dc2626",
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                gap: 3,
                marginTop: 2,
                marginLeft: 20,
              }}
            >
              <AlertTriangle size={10} /> {record.preview_error}
            </div>
          )}
        </div>
        <div style={{ fontFamily: "monospace", fontWeight: 700, fontSize: "0.9rem" }}>
          {formatCurrency(record.cost_amount || record.journal_preview?.total_amount || 0)}
        </div>
      </div>

      {expanded && record.journal_preview && (
        <div style={{ borderTop: "1px solid var(--border)", background: "#fafbfc", padding: "0.5rem 1rem 0.75rem 2.5rem" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.78rem" }}>
            <thead>
              <tr>
                <th
                  style={{
                    padding: "3px 8px",
                    textAlign: "left",
                    color: "var(--grey)",
                    fontSize: "0.7rem",
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                    borderBottom: "1px solid var(--border)",
                    width: 90,
                  }}
                >
                  Kode
                </th>
                <th
                  style={{
                    padding: "3px 8px",
                    textAlign: "left",
                    color: "var(--grey)",
                    fontSize: "0.7rem",
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                    borderBottom: "1px solid var(--border)",
                  }}
                >
                  Nama Akun
                </th>
                <th
                  style={{
                    padding: "3px 8px",
                    textAlign: "left",
                    color: "var(--grey)",
                    fontSize: "0.7rem",
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                    borderBottom: "1px solid var(--border)",
                  }}
                >
                  Memo
                </th>
                <th
                  style={{
                    padding: "3px 8px",
                    textAlign: "right",
                    color: "var(--grey)",
                    fontSize: "0.7rem",
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                    borderBottom: "1px solid var(--border)",
                    width: 120,
                  }}
                >
                  Debit
                </th>
                <th
                  style={{
                    padding: "3px 8px",
                    textAlign: "right",
                    color: "var(--grey)",
                    fontSize: "0.7rem",
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                    borderBottom: "1px solid var(--border)",
                    width: 120,
                  }}
                >
                  Kredit
                </th>
              </tr>
            </thead>
            <tbody>
              {record.journal_preview.lines.map((line, i) => (
                <tr key={i}>
                  <td style={{ padding: "3px 8px", fontFamily: "monospace", fontSize: "0.75rem", color: "#6b7280" }}>
                    {line.account_code || "—"}
                  </td>
                  <td style={{ padding: "3px 8px", fontSize: "0.78rem" }}>{line.account_name ?? "(Tanpa nama)"}</td>
                  <td style={{ padding: "3px 8px", color: "var(--grey)", fontSize: "0.75rem", fontStyle: "italic" }}>
                    {line.description ?? "—"}
                  </td>
                  <td
                    style={{
                      padding: "3px 8px",
                      textAlign: "right",
                      fontFamily: "monospace",
                      fontWeight: 600,
                      color: line.debit > 0 ? "#1d4ed8" : "#d1d5db",
                    }}
                  >
                    {line.debit > 0 ? formatCurrency(line.debit) : "—"}
                  </td>
                  <td
                    style={{
                      padding: "3px 8px",
                      textAlign: "right",
                      fontFamily: "monospace",
                      fontWeight: 600,
                      color: line.credit > 0 ? "#7c3aed" : "#d1d5db",
                    }}
                  >
                    {line.credit > 0 ? formatCurrency(line.credit) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {record.journal_preview.note && (
            <div style={{ fontSize: "0.75rem", color: "var(--grey)", marginTop: "0.4rem", fontStyle: "italic" }}>
              {record.journal_preview.note}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
