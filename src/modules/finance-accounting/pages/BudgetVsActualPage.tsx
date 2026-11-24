import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { useBudgetVsActual } from "../api/useBudgets";
import { PageHeader } from "@shared/components/PageHeader";
import { EmptyState } from "@shared/components/EmptyState";
import { LoadingState } from "@shared/components/LoadingState";
import { formatCurrency } from "@shared/lib/format";
import type { BudgetUtilizationStatus } from "../types/budget";

const CURRENT_YEAR = new Date().getFullYear();

const STATUS_CONFIG: Record<BudgetUtilizationStatus, { label: string; color: string; bg: string }> = {
  within_budget: { label: "Aman", color: "var(--good)", bg: "#d9f2e6" },
  near_limit: { label: "Mendekati Limit", color: "var(--warn-text)", bg: "var(--warn-bg)" },
  over_budget: { label: "Melebihi Budget", color: "var(--bad)", bg: "var(--bad-bg)" },
  no_budget: { label: "Tanpa Budget", color: "var(--grey)", bg: "#eceef3" },
};

function utilizationBarColor(pct: number | null): string {
  if (pct === null) return "var(--grey)";
  if (pct > 100) return "var(--bad)";
  if (pct >= 90) return "var(--warn-text)";
  return "var(--good)";
}

/**
 * Halaman inti dari kebutuhan: "IT - Budget Rp5 Miliar", "Operasional -
 * Rp10 Miliar" dst - dikelompokkan per departemen (PERSIS contoh
 * requirement, lihat komentar BudgetService::budgetVsActual() di
 * backend), tiap departemen bisa di-expand untuk lihat breakdown per akun.
 */
export function BudgetVsActualPage() {
  const [fiscalYear, setFiscalYear] = useState(CURRENT_YEAR);
  const [asOfDate, setAsOfDate] = useState("");
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());

  const { data, isLoading } = useBudgetVsActual(fiscalYear, undefined, asOfDate || undefined);

  function toggleExpand(departmentId: number) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(departmentId)) next.delete(departmentId);
      else next.add(departmentId);
      return next;
    });
  }

  return (
    <div>
      <PageHeader title="Budget vs Actual" subtitle="Bandingkan anggaran dengan realisasi belanja - per departemen." />

      <div style={{ padding: "0 2rem" }}>
        <div style={{ display: "flex", alignItems: "flex-end", gap: "1rem", marginBottom: "1.25rem" }}>
          <div>
            <label className="input-label">Tahun Anggaran *</label>
            <input className="input" type="number" style={{ width: 130 }} value={fiscalYear} onChange={(e) => setFiscalYear(Number(e.target.value))} />
          </div>
          <div>
            <label className="input-label">Per Tanggal (opsional)</label>
            <input className="input" type="date" style={{ width: 180 }} value={asOfDate} onChange={(e) => setAsOfDate(e.target.value)} />
          </div>
          {data && (
            <div style={{ marginLeft: "auto", textAlign: "right" }}>
              <div style={{ fontSize: "0.75rem", color: "var(--grey)" }}>Total Budget vs Actual (Semua Departemen)</div>
              <div style={{ fontSize: "1.1rem", fontWeight: 700 }}>
                {formatCurrency(data.grand_total.total_budget)} <span style={{ color: "var(--grey)", fontWeight: 400 }}>vs</span> {formatCurrency(data.grand_total.total_actual)}
              </div>
            </div>
          )}
        </div>

        {isLoading && <LoadingState label="Menghitung..." />}

        {data && data.departments.length === 0 && (
          <div className="content-card" style={{ margin: 0 }}>
            <EmptyState title="Belum Ada Budget untuk Tahun Ini" subtitle="Set budget per departemen dulu di halaman Budget per Departemen." />
          </div>
        )}

        {data && data.departments.length > 0 && (
          <div style={{ display: "grid", gap: "0.9rem", paddingBottom: "2rem" }}>
            {data.departments.map((dept) => {
              const isExpanded = expandedIds.has(dept.department_id);
              const barColor = utilizationBarColor(dept.utilization_pct);
              const barWidth = dept.utilization_pct !== null ? Math.min(100, dept.utilization_pct) : 0;

              return (
                <div key={dept.department_id} className="card" style={{ padding: 0, overflow: "hidden" }}>
                  <button
                    onClick={() => toggleExpand(dept.department_id)}
                    style={{ width: "100%", padding: "1.1rem 1.4rem", border: "none", background: "none", cursor: "pointer", textAlign: "left" }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.75rem" }}>
                      {isExpanded ? <ChevronDown size={16} color="var(--grey)" /> : <ChevronRight size={16} color="var(--grey)" />}
                      <span style={{ fontWeight: 700, fontSize: "1rem", flex: 1 }}>{dept.department_name}</span>
                      <span style={{ fontSize: "0.78rem", fontWeight: 600, color: barColor }}>{dept.utilization_pct !== null ? `${dept.utilization_pct}%` : "—"}</span>
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.82rem", marginBottom: "0.35rem", paddingLeft: "1.6rem" }}>
                      <span style={{ color: "var(--grey)" }}>Budget: <strong style={{ color: "inherit" }}>{formatCurrency(dept.total_budget)}</strong></span>
                      <span style={{ color: "var(--grey)" }}>Actual: <strong style={{ color: "inherit" }}>{formatCurrency(dept.total_actual)}</strong></span>
                      <span style={{ color: dept.total_variance < 0 ? "var(--bad)" : "var(--good)" }}>
                        {dept.total_variance < 0 ? "Melebihi" : "Sisa"}: <strong>{formatCurrency(Math.abs(dept.total_variance))}</strong>
                      </span>
                    </div>

                    <div style={{ height: 8, background: "var(--border)", borderRadius: 999, overflow: "hidden", marginLeft: "1.6rem" }}>
                      <div style={{ width: `${barWidth}%`, height: "100%", background: barColor, borderRadius: 999 }} />
                    </div>
                  </button>

                  {isExpanded && (
                    <table className="table" style={{ margin: 0, borderTop: "1px solid var(--border)" }}>
                      <thead>
                        <tr>
                          <th>Akun</th>
                          <th>Kategori</th>
                          <th style={{ textAlign: "right" }}>Budget</th>
                          <th style={{ textAlign: "right" }}>Actual</th>
                          <th style={{ textAlign: "right" }}>Variance</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dept.lines.map((line) => {
                          const statusCfg = STATUS_CONFIG[line.status];
                          return (
                            <tr key={line.budget_id}>
                              <td style={{ fontSize: "0.85rem" }}>{line.account_code} — {line.account_name}</td>
                              <td style={{ fontSize: "0.85rem", color: "var(--grey)" }}>{line.category ?? "—"}</td>
                              <td style={{ textAlign: "right" }}>{formatCurrency(line.budget)}</td>
                              <td style={{ textAlign: "right" }}>{formatCurrency(line.actual)}</td>
                              <td style={{ textAlign: "right", color: line.variance < 0 ? "var(--bad)" : "inherit" }}>{formatCurrency(line.variance)}</td>
                              <td><span className="badge" style={{ background: statusCfg.bg, color: statusCfg.color }}>{statusCfg.label}</span></td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
