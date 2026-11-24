import { useState } from "react";
import { FileDown } from "lucide-react";
import { useAuditLog, useAuditLogSummary, useDownloadAuditLogPdf } from "../api/useAuditLog";
import { PageHeader } from "@shared/components/PageHeader";
import { EmptyState } from "@shared/components/EmptyState";
import { LoadingState } from "@shared/components/LoadingState";
import { Pagination } from "@shared/components/Pagination";
import { LetterheadPdfModal } from "@shared/components/LetterheadPdfModal";
import { formatDate } from "@shared/lib/format";

const TODAY = new Date().toISOString().slice(0, 10);

const ACTION_CONFIG: Record<string, { label: string; color: string; bg: string; textColor: string }> = {
  created:   { label: "Dibuat",       color: "#16a34a", bg: "#dcfce7", textColor: "#16a34a" },
  posted:    { label: "Diposting",    color: "#7c3aed", bg: "#ede9fe", textColor: "#7c3aed" },
  approved:  { label: "Disetujui",     color: "#16a34a", bg: "#dcfce7", textColor: "#16a34a" },
  updated:   { label: "Diubah",       color: "#1d4ed8", bg: "#dbeafe", textColor: "#1d4ed8" },
  deleted:   { label: "Dihapus",       color: "#dc2626", bg: "#fee2e2", textColor: "#dc2626" },
  voided:    { label: "Dibatalkan",    color: "#dc2626", bg: "#fee2e2", textColor: "#dc2626" },
  rejected:  { label: "Ditolak",       color: "#dc2626", bg: "#fee2e2", textColor: "#dc2626" },
  reversed:  { label: "Di-reversal",  color: "#b45309", bg: "#fef3c7", textColor: "#b45309" },
  imported:  { label: "Di-impor",      color: "#0891b2", bg: "#cffafe", textColor: "#0891b2" },
  exported:  { label: "Di-ekspor",     color: "#92400e", bg: "#fef3c7", textColor: "#92400e" },
};

function getActionConfig(action: string) {
  return ACTION_CONFIG[action] ?? { label: action, color: "#6b7280", bg: "#f3f4f6", textColor: "#6b7280" };
}

const ENTITY_LABELS: Record<string, string> = {
  ar_invoice:       "AR Invoice",
  ap_bill:          "AP Bill",
  gl_journal:       "Jurnal Umum",
  fa_asset:         "Aset Tetap",
  customer:          "Pelanggan",
  vendor:            "Vendor",
  budget:           "Anggaran",
  cb_account:        "Rekening Bank",
  cb_mutation:      "Mutasi Bank",
  profit_center:    "Profit Center",
  cost_center:      "Cost Center",
  coa:              "Akun COA",
  tax_efaktur:      "E-Faktur",
  tax_withholding:  "Bukti Potong PPh",
};

export function AuditLogPage() {
  const [page, setPage] = useState(1);
  const [entityType, setEntityType] = useState("");
  const [action, setAction] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const downloadPdfMutation = useDownloadAuditLogPdf();

  const { data, isLoading } = useAuditLog({
    page,
    per_page: 50,
    entity_type: entityType || undefined,
    action: action || undefined,
    date_from: dateFrom || undefined,
    date_to: dateTo || undefined,
  });

  const { data: summary } = useAuditLogSummary();
  const entries = data?.data ?? [];

  function exportCsv() {
    if (!entries.length) return;
    const headers = ["Timestamp", "User", "Email", "Modul", "Entity", "Entity ID", "Action", "Before", "After", "Alasan", "IP Address"];
    const rows = entries.map((e) => [
      e.occurred_at, e.user_name, e.user_email, e.module,
      ENTITY_LABELS[e.entity_type] ?? e.entity_type,
      String(e.entity_id ?? ""), e.action,
      e.before_summary ?? "", e.after_summary ?? "", e.reason ?? "", e.ip_address ?? "",
    ]);
    const csv = [headers, ...rows]
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `audit-log-${TODAY}.csv`; a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <PageHeader
        title="Audit Log"
        subtitle="Jejak aktivitas di modul Finance — siapa mengubah apa, kapan, dan dari mana."
      />

      {/* KPI Summary */}
      {summary && (
        <div style={{ padding: "0 2rem 1rem" }} className="print-area">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.75rem", marginBottom: "0.75rem" }}>
            {[
              { label: "Hari Ini", value: summary.today_changes, bg: "#f0fdf4", border: "#16a34a", color: "#16a34a" },
              { label: "Minggu Ini", value: summary.week_changes, bg: "#eff6ff", border: "#1d4ed8", color: "#1d4ed8" },
              { label: "Bulan Ini", value: summary.month_changes, bg: "#f5f3ff", border: "#7c3aed", color: "#7c3aed" },
              { label: "User Paling Aktif", value: summary.top_user ?? "—", bg: "#fef3c7", border: "#b45309", color: "#b45309" },
            ].map((kpi) => (
              <div key={kpi.label} style={{ background: kpi.bg, border: `2px solid ${kpi.border}`, borderRadius: 8, padding: "0.85rem 1rem", textAlign: "center" }}>
                <div style={{ fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "#666", marginBottom: "0.3rem" }}>{kpi.label}</div>
                <div style={{ fontSize: "1.3rem", fontWeight: 800, color: kpi.color, fontFamily: typeof kpi.value === "number" ? "monospace" : "inherit" }}>
                  {typeof kpi.value === "number" ? kpi.value.toLocaleString("id-ID") : kpi.value}
                </div>
              </div>
            ))}
          </div>

          {/* Action breakdown chips */}
          {summary.action_breakdown && summary.action_breakdown.length > 0 && (
            <div style={{ marginBottom: "0.5rem" }}>
              <div style={{ fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", color: "#666", marginBottom: "0.4rem", letterSpacing: "0.04em" }}>Aktivitas per Action</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
                {summary.action_breakdown.map((item) => {
                  const cfg = getActionConfig(item.action);
                  return (
                    <div key={item.action} style={{ display: "flex", alignItems: "center", gap: 5, background: cfg.bg, border: `1px solid ${cfg.color}33`, borderRadius: 20, padding: "3px 10px" }}>
                      <div style={{ width: 7, height: 7, borderRadius: "50%", background: cfg.color, flexShrink: 0 }} />
                      <span style={{ fontSize: "0.72rem", color: cfg.textColor, fontWeight: 600 }}>{cfg.label}</span>
                      <span style={{ fontSize: "0.72rem", color: cfg.color, fontWeight: 800 }}>{item.count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Entity breakdown chips */}
          {summary.entity_breakdown && summary.entity_breakdown.length > 0 && (
            <div>
              <div style={{ fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", color: "#666", marginBottom: "0.4rem", letterSpacing: "0.04em" }}>Aktivitas per Entity</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
                {summary.entity_breakdown.map((item) => (
                  <div key={item.entity_type} style={{ display: "flex", alignItems: "center", gap: 5, background: "#f3f4f6", border: "1px solid #d1d5db", borderRadius: 20, padding: "3px 10px" }}>
                    <span style={{ fontSize: "0.72rem", color: "#374151", fontWeight: 600 }}>{item.label}</span>
                    <span style={{ fontSize: "0.72rem", color: "#374151", fontWeight: 800 }}>{item.count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Toolbar */}
      <div style={{ padding: "0 2rem 1rem" }} className="no-print">
        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem", flexWrap: "wrap" }}>
          <button onClick={() => setIsPrintModalOpen(true)} style={{ display: "flex", alignItems: "center", gap: "0.4rem", padding: "0.5rem 1rem", background: "var(--accent)", color: "white", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 600, fontSize: "0.85rem" }}>
            <FileDown size={15} /> Cetak PDF
          </button>
          <button onClick={exportCsv} disabled={!entries.length} style={{ display: "flex", alignItems: "center", gap: "0.4rem", padding: "0.5rem 1rem", background: "white", color: "var(--accent)", border: "1px solid var(--accent)", borderRadius: 8, cursor: entries.length ? "pointer" : "not-allowed", fontWeight: 600, fontSize: "0.85rem", opacity: entries.length ? 1 : 0.5 }}>
            📥 Export CSV
          </button>
        </div>

        <div style={{ display: "flex", gap: "1rem", alignItems: "flex-end", flexWrap: "wrap" }}>
          <div>
            <label className="input-label" style={{ marginBottom: "0.2rem", display: "block" }}>Entity Type</label>
            <select className="input" style={{ width: 160 }} value={entityType} onChange={(e) => { setEntityType(e.target.value); setPage(1); }}>
              <option value="">Semua</option>
              {Object.entries(ENTITY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          <div>
            <label className="input-label" style={{ marginBottom: "0.2rem", display: "block" }}>Action</label>
            <select className="input" style={{ width: 140 }} value={action} onChange={(e) => { setAction(e.target.value); setPage(1); }}>
              <option value="">Semua</option>
              {Object.entries(ACTION_CONFIG).map(([k, cfg]) => <option key={k} value={k}>{cfg.label}</option>)}
            </select>
          </div>
          <div>
            <label className="input-label" style={{ marginBottom: "0.2rem", display: "block" }}>Dari Tanggal</label>
            <input className="input" type="date" style={{ width: 170 }} value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(1); }} />
          </div>
          <div>
            <label className="input-label" style={{ marginBottom: "0.2rem", display: "block" }}>Sampai Tanggal</label>
            <input className="input" type="date" style={{ width: 170 }} value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPage(1); }} />
          </div>
          {(entityType || action || dateFrom || dateTo) && (
            <button onClick={() => { setEntityType(""); setAction(""); setDateFrom(""); setDateTo(""); setPage(1); }} style={{ padding: "0.5rem 0.75rem", background: "none", color: "var(--grey)", border: "1px solid var(--border)", borderRadius: 8, cursor: "pointer", fontSize: "0.8rem" }}>
              ✕ Reset Filter
            </button>
          )}
        </div>
      </div>

      {/* Log Table */}
      <div style={{ padding: "0 2rem 2rem" }} className="print-area">
        <div style={{ border: "1px solid var(--border)", borderRadius: 8, overflow: "hidden" }}>
          {isLoading && <LoadingState />}
          {!isLoading && entries.length === 0 && (
            <div style={{ padding: "3rem", textAlign: "center" }}>
              <EmptyState title="Tidak Ada Log Aktivitas" subtitle="Belum ada aktivitas di modul Finance untuk filter yang dipilih." />
            </div>
          )}
          {!isLoading && entries.length > 0 && (
            <table className="table" style={{ margin: 0 }}>
              <thead>
                <tr>
                  <th style={{ width: 160 }}>Timestamp</th>
                  <th>User</th>
                  <th>Entity</th>
                  <th style={{ textAlign: "center", width: 100 }}>Action</th>
                  <th>Perubahan (Before &rarr; After)</th>
                  <th style={{ width: 110 }}>IP Address</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => {
                  const cfg = getActionConfig(entry.action);
                  const entityLabel = ENTITY_LABELS[entry.entity_type] ?? entry.entity_type;
                  return (
                    <tr key={entry.id} style={{ borderLeft: `3px solid ${cfg.color}` }}>
                      <td style={{ fontSize: "0.78rem", fontFamily: "monospace", color: "var(--grey-dark)", whiteSpace: "nowrap" }}>
                        {entry.occurred_at ? formatDate(entry.occurred_at) : "—"}
                      </td>
                      <td>
                        <div style={{ fontSize: "0.82rem", fontWeight: 600 }}>{entry.user_name}</div>
                        <div style={{ fontSize: "0.7rem", color: "var(--grey)" }}>{entry.user_email}</div>
                      </td>
                      <td>
                        <div style={{ display: "inline-block", fontSize: "0.72rem", fontWeight: 700, background: "#f3f4f6", border: "1px solid #d1d5db", borderRadius: 4, padding: "1px 6px", color: "#374151" }}>
                          {entityLabel}
                        </div>
                        {entry.entity_id && <div style={{ fontSize: "0.7rem", fontFamily: "monospace", color: "var(--grey)", marginTop: 2 }}>#{entry.entity_id}</div>}
                      </td>
                      <td style={{ textAlign: "center" }}>
                        <span style={{ display: "inline-block", padding: "2px 10px", borderRadius: 12, fontSize: "0.72rem", fontWeight: 700, background: cfg.bg, color: cfg.textColor }}>
                          {cfg.label}
                        </span>
                      </td>
                      <td style={{ fontSize: "0.78rem", maxWidth: 340 }}>
                        {entry.before_summary && (
                          <div style={{ color: "#dc2626", marginBottom: 2 }}>
                            <span style={{ fontSize: "0.65rem", fontWeight: 700, color: "#dc2626" }}>&#9650; BEFORE:</span> {entry.before_summary}
                          </div>
                        )}
                        {entry.after_summary && (
                          <div style={{ color: "#16a34a", marginBottom: 2 }}>
                            <span style={{ fontSize: "0.65rem", fontWeight: 700, color: "#16a34a" }}>&#9660; AFTER:</span> {entry.after_summary}
                          </div>
                        )}
                        {entry.reason && (
                          <div style={{ color: "#b45309", fontSize: "0.7rem", fontStyle: "italic" }}>
                            &#9888; {entry.reason}
                          </div>
                        )}
                        {!entry.before_summary && !entry.after_summary && !entry.reason && (
                          <span style={{ color: "var(--grey)" }}>—</span>
                        )}
                      </td>
                      <td style={{ fontFamily: "monospace", fontSize: "0.72rem", color: "var(--grey)" }}>
                        {entry.ip_address ?? "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {data && data.total > 50 && (
          <div style={{ padding: "0.75rem 0" }}>
            <Pagination currentPage={page} lastPage={data.last_page ?? 1} total={data.total} onPageChange={setPage} />
          </div>
        )}
      </div>

      {isPrintModalOpen && (
        <LetterheadPdfModal
          title="Cetak PDF — Audit Log"
          onClose={() => setIsPrintModalOpen(false)}
          onDownload={(orgId) => downloadPdfMutation.mutateAsync({ organizationId: orgId, entity_type: entityType || undefined, action: action || undefined, date_from: dateFrom || undefined, date_to: dateTo || undefined })}
        />
      )}
    </div>
  );
}
