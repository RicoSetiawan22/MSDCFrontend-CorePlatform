import { useState } from "react";
import { FileDown, CheckCircle, XCircle } from "lucide-react";
import { useTrialBalance, useDownloadTrialBalancePdf } from "../api/useGlJournals";
import { PageHeader } from "@shared/components/PageHeader";
import { LoadingState } from "@shared/components/LoadingState";
import { LetterheadPdfModal } from "@shared/components/LetterheadPdfModal";
import { formatCurrency } from "@shared/lib/format";
import type { TrialBalance, TrialBalanceGroup, TrialBalanceRow } from "../types/glJournal";

const TODAY = new Date().toISOString().slice(0, 10);
const MONTH_START = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10);

const TYPE_COLORS: Record<string, { bg: string; border: string; text: string; label: string }> = {
  asset:     { bg: "#eff6ff", border: "#0369a1", text: "#0369a1", label: "ASET" },
  liability: { bg: "#fef3c7", border: "#b45309", text: "#b45309", label: "LIABILITAS" },
  equity:    { bg: "#f5f3ff", border: "#7c3aed", text: "#7c3aed", label: "EKUITAS" },
  revenue:   { bg: "#f0fdf4", border: "#16a34a", text: "#16a34a", label: "PENDAPATAN" },
  expense:   { bg: "#fef2f2", border: "#dc2626", text: "#dc2626", label: "BEBAN" },
};

function getTypeColor(type: string) {
  return TYPE_COLORS[type] ?? { bg: "#f9fafb", border: "#9ca3af", text: "#6b7280", label: type.toUpperCase() };
}

function getAmountClass(val: number) {
  if (val > 0) return { color: "#1d4ed8", prefix: "" };
  return { color: "#d1d5db", prefix: "" };
}

function AccountRow({ acc }: { acc: TrialBalanceRow }) {
  const dr = acc.debit_col ?? acc.ending_balance_debit ?? 0;
  const cr = acc.credit_col ?? acc.ending_balance_credit ?? 0;
  const drStyle = getAmountClass(dr);
  return (
    <tr style={{ borderLeft: "3px solid transparent" }}>
      <td style={{ fontFamily: "monospace", fontSize: "0.8rem", fontWeight: 600, color: "#374151" }}>{acc.account_code}</td>
      <td style={{ fontSize: "0.82rem" }}>{acc.account_name}</td>
      <td style={{ textAlign: "right", fontFamily: "monospace", fontSize: "0.82rem", fontWeight: 600, color: dr > 0 ? drStyle.color : "#d1d5db" }}>
        {dr > 0 ? formatCurrency(dr) : "—"}
      </td>
      <td style={{ textAlign: "right", fontFamily: "monospace", fontSize: "0.82rem", fontWeight: 600, color: cr > 0 ? "#7c3aed" : "#d1d5db" }}>
        {cr > 0 ? formatCurrency(cr) : "—"}
      </td>
    </tr>
  );
}

function AccountGroup({ group }: { group: TrialBalanceGroup }) {
  const { border, label } = getTypeColor(group.type);
  return (
    <tbody>
      <tr>
        <td colSpan={4} style={{ padding: "6px 12px", background: border, color: "white", fontSize: "0.72rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.06em" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span>{label}</span>
            <span style={{ opacity: 0.7, fontSize: "0.68rem" }}>{group.accounts.length} akun</span>
          </div>
        </td>
      </tr>
      {group.accounts.map((acc) => (
        <AccountRow key={acc.account_id} acc={acc} />
      ))}
      <tr style={{ background: `${border}22`, borderTop: `2px solid ${border}` }}>
        <td colSpan={2} style={{ fontWeight: 800, fontSize: "0.8rem", color: border }}>Subtotal {label}</td>
        <td style={{ textAlign: "right", fontFamily: "monospace", fontWeight: 800, fontSize: "0.85rem", color: group.group_debit_col > 0 ? "#1d4ed8" : "#d1d5db" }}>
          {group.group_debit_col > 0 ? formatCurrency(group.group_debit_col) : "—"}
        </td>
        <td style={{ textAlign: "right", fontFamily: "monospace", fontWeight: 800, fontSize: "0.85rem", color: group.group_credit_col > 0 ? "#7c3aed" : "#d1d5db" }}>
          {group.group_credit_col > 0 ? formatCurrency(group.group_credit_col) : "—"}
        </td>
      </tr>
    </tbody>
  );
}

export function TrialBalancePage() {
  const [dateFrom, setDateFrom] = useState(MONTH_START);
  const [dateTo, setDateTo] = useState(TODAY);
  const [asOfDate, setAsOfDate] = useState("");
  const [mode, setMode] = useState<"range" | "point">("range");
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const downloadPdfMutation = useDownloadTrialBalancePdf();

  const effectiveDateFrom = mode === "range" ? dateFrom : "";
  const effectiveDateTo = mode === "range" ? dateTo : "";
  const effectiveAsOfDate = mode === "point" ? asOfDate : "";

  const { data, isLoading } = useTrialBalance(effectiveAsOfDate || undefined, effectiveDateFrom || undefined, effectiveDateTo || undefined);
  const tb: TrialBalance | undefined = data;

  const groups: TrialBalanceGroup[] = tb?.groups ?? [];
  const flatAccounts: TrialBalanceRow[] = tb?.accounts ?? [];

  // Build flat groups from flat accounts
  const flatGroups: TrialBalanceGroup[] = groups.length > 0 ? groups : (() => {
    if (flatAccounts.length === 0) return [];
    const typeOrder = ["asset", "liability", "equity", "revenue", "expense"];
    const grouped: Record<string, TrialBalanceRow[]> = {};
    for (const acc of flatAccounts) {
      const t = acc.account_type;
      if (!grouped[t]) grouped[t] = [];
      grouped[t].push(acc);
    }
    return typeOrder
      .filter((t) => grouped[t]?.length > 0)
      .map((t) => ({
        type: t,
        label: getTypeColor(t).label,
        group_debit_col: grouped[t].reduce((s, a) => s + (a.debit_col ?? a.ending_balance_debit ?? 0), 0),
        group_credit_col: grouped[t].reduce((s, a) => s + (a.credit_col ?? a.ending_balance_credit ?? 0), 0),
        accounts: grouped[t],
      }));
  })();

  const totalDebit = tb?.total_debit ?? 0;
  const totalCredit = tb?.total_credit ?? 0;
  const isBalanced = tb?.is_balanced ?? (totalDebit === totalCredit);
  const totalAccounts = flatAccounts.length;

  return (
    <div>
      <PageHeader
        title="Trial Balance"
        subtitle="Neraca Saldo — saldo setiap akun GL berdasarkan periode tanggal tertentu."
      />

      <div style={{ padding: "0 2rem 1rem" }} className="no-print">
        {/* Mode toggle */}
        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem", alignItems: "center" }}>
          <button
            onClick={() => setMode("range")}
            style={{ padding: "0.4rem 0.9rem", borderRadius: 8, fontSize: "0.82rem", fontWeight: 600, cursor: "pointer", border: "none", background: mode === "range" ? "var(--accent)" : "#e5e7eb", color: mode === "range" ? "white" : "#374151" }}
          >
            Periode Tanggal
          </button>
          <button
            onClick={() => setMode("point")}
            style={{ padding: "0.4rem 0.9rem", borderRadius: 8, fontSize: "0.82rem", fontWeight: 600, cursor: "pointer", border: "none", background: mode === "point" ? "var(--accent)" : "#e5e7eb", color: mode === "point" ? "white" : "#374151" }}
          >
            Per Tanggal Tertentu
          </button>
        </div>

        <div style={{ display: "flex", gap: "1rem", alignItems: "flex-end", flexWrap: "wrap", marginBottom: "1rem" }}>
          {mode === "range" ? (
            <>
              <div>
                <label className="input-label" style={{ marginBottom: "0.2rem", display: "block" }}>Dari Tanggal</label>
                <input className="input" type="date" style={{ width: 170 }} value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
              </div>
              <div>
                <label className="input-label" style={{ marginBottom: "0.2rem", display: "block" }}>Sampai Tanggal</label>
                <input className="input" type="date" style={{ width: 170 }} value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
              </div>
            </>
          ) : (
            <div>
              <label className="input-label" style={{ marginBottom: "0.2rem", display: "block" }}>Per Tanggal</label>
              <input className="input" type="date" style={{ width: 170 }} value={asOfDate} onChange={(e) => setAsOfDate(e.target.value)} />
            </div>
          )}
          <button
            onClick={() => setIsPrintModalOpen(true)}
            style={{ display: "flex", alignItems: "center", gap: "0.4rem", padding: "0.5rem 1rem", background: "var(--accent)", color: "white", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 600, fontSize: "0.85rem" }}
          >
            <FileDown size={15} /> Cetak PDF
          </button>
        </div>
      </div>

      <div style={{ padding: "0 2rem 2rem" }} className="print-area">

        {/* KPI Row */}
        {tb && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.75rem", marginBottom: "1.25rem" }}>
            {[
              { label: "Total Akun", value: `${totalAccounts} akun`, bg: "#f5f5f5", border: "#1a1a1a", text: "#1a1a1a" },
              { label: "Total Debit", value: formatCurrency(totalDebit), bg: "#eff6ff", border: "#1d4ed8", text: "#1d4ed8" },
              { label: "Total Kredit", value: formatCurrency(totalCredit), bg: "#f5f3ff", border: "#7c3aed", text: "#7c3aed" },
              {
                label: "Status",
                value: isBalanced ? "✓ Balance" : "✗ Tidak Balance",
                bg: isBalanced ? "#f0fdf4" : "#fef2f2",
                border: isBalanced ? "#16a34a" : "#dc2626",
                text: isBalanced ? "#16a34a" : "#dc2626",
              },
            ].map((kpi) => (
              <div key={kpi.label} style={{ background: kpi.bg, border: `2px solid ${kpi.border}`, borderRadius: 10, padding: "0.85rem", textAlign: "center" }}>
                <div style={{ fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "#666", marginBottom: "0.3rem" }}>{kpi.label}</div>
                <div style={{ fontSize: "1.05rem", fontWeight: 800, color: kpi.text, fontFamily: "monospace" }}>{kpi.value}</div>
              </div>
            ))}
          </div>
        )}

        {/* Balance Indicator */}
        {tb && (
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem", padding: "0.6rem 1rem", background: isBalanced ? "#dcfce7" : "#fee2e2", border: `1px solid ${isBalanced ? "#16a34a" : "#dc2626"}`, borderRadius: 8 }}>
            {isBalanced
              ? <CheckCircle size={16} color="#16a34a" />
              : <XCircle size={16} color="#dc2626" />}
            <span style={{ fontSize: "0.82rem", fontWeight: 600, color: isBalanced ? "#16a34a" : "#dc2626" }}>
              {isBalanced
                ? "Trial Balance BALANCE — Total Debit dan Kredit sama. ✓"
                : "Trial Balance TIDAK BALANCE — Perbedaan Rp " + formatCurrency(Math.abs(totalDebit - totalCredit)) + ". Periksa jurnal."}
            </span>
          </div>
        )}

        {/* Main Table */}
        {isLoading && <LoadingState label="Menghitung saldo..." />}

        {!isLoading && flatGroups.length === 0 && (
          <div style={{ border: "1px solid var(--border)", borderRadius: 8, padding: "3rem", textAlign: "center", color: "var(--grey)" }}>
            Tidak ada data akun untuk periode ini.
          </div>
        )}

        {!isLoading && flatGroups.length > 0 && (
          <div style={{ border: "1px solid var(--border)", borderRadius: 10, overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#374151" }}>
                  <th style={{ padding: "0.5rem 0.75rem", textAlign: "left", fontSize: "0.72rem", color: "white", textTransform: "uppercase", letterSpacing: "0.04em", width: 100 }}>Kode</th>
                  <th style={{ padding: "0.5rem 0.75rem", textAlign: "left", fontSize: "0.72rem", color: "white", textTransform: "uppercase", letterSpacing: "0.04em" }}>Nama Akun</th>
                  <th style={{ padding: "0.5rem 0.75rem", textAlign: "right", fontSize: "0.72rem", color: "white", textTransform: "uppercase", letterSpacing: "0.04em", width: 130 }}>Debit (Rp)</th>
                  <th style={{ padding: "0.5rem 0.75rem", textAlign: "right", fontSize: "0.72rem", color: "white", textTransform: "uppercase", letterSpacing: "0.04em", width: 130 }}>Kredit (Rp)</th>
                </tr>
              </thead>

              {flatGroups.map((group) => (
                <AccountGroup key={group.type} group={group} />
              ))}

              {/* Grand Total */}
              <tfoot>
                <tr style={{ background: "#1a1a1a", color: "white" }}>
                  <td colSpan={2} style={{ padding: "0.65rem 0.75rem", fontWeight: 800, fontSize: "0.85rem" }}>GRAND TOTAL</td>
                  <td style={{ padding: "0.65rem 0.75rem", textAlign: "right", fontFamily: "monospace", fontWeight: 800, fontSize: "0.9rem", color: "#93c5fd" }}>{formatCurrency(totalDebit)}</td>
                  <td style={{ padding: "0.65rem 0.75rem", textAlign: "right", fontFamily: "monospace", fontWeight: 800, fontSize: "0.9rem", color: "#c4b5fd" }}>{formatCurrency(totalCredit)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {isPrintModalOpen && (
        <LetterheadPdfModal
          title="Cetak PDF — Trial Balance"
          onClose={() => setIsPrintModalOpen(false)}
          onDownload={(orgId) => downloadPdfMutation.mutateAsync({
            organizationId: orgId,
            asOfDate: effectiveAsOfDate || undefined,
            dateFrom: effectiveDateFrom || undefined,
            dateTo: effectiveDateTo || undefined,
          })}
        />
      )}
    </div>
  );
}
