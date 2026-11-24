import { useState } from "react";
import { Search, Plus, TrendingUp, CheckCircle2, AlertTriangle, Clock, MoreVertical, Filter as FilterIcon } from "lucide-react";
import { PageHeader } from "@shared/components/PageHeader";
import { EmptyState } from "@shared/components/EmptyState";
import { LoadingState } from "@shared/components/LoadingState";
import { Pagination } from "@shared/components/Pagination";
import { formatDate } from "@shared/lib/format";
import { extractErrorMessage } from "@shared/types/api";
import { useEmployeeList } from "../api/useEmployees";
import {
  usePerformanceReviews, usePerformanceReview, useCreatePerformanceReview,
  useSubmitPerformanceReview, useAcknowledgePerformanceReview,
  useCreatePerformanceGoal, useUpdateGoalProgress, useCrossModuleMetrics, useKpiProgress,
} from "../api/usePerformance";
import type { PerformanceReview, ReviewStatus, GoalStatus } from "../types/itil";

// ─── Design tokens (brand palette) ──────────────────────────────────────────
const NAVY = "#0f172a";
const NAVY_SOFT = "#64748b";     // secondary text on light bg
const GOLD = "#F2A602";
const GOLD_SOFT = "#FDF1D9";     // gold tint background
const BORDER = "#e2e8f0";
const BG_PANEL = "#f8fafc";
const GREEN = "#16a34a";
const GREEN_SOFT = "#f0fdf4";
const RED = "#dc2626";
const RED_SOFT = "#fef2f2";
const GREY_SOFT = "#f1f5f9";

const REVIEW_STATUS_LABELS: Record<ReviewStatus, string> = {
  draft: "Draft", submitted: "Disubmit", acknowledged: "Diaknowledge",
};
const GOAL_STATUS_LABELS: Record<GoalStatus, string> = {
  on_track: "On Track", at_risk: "Berisiko", achieved: "Tercapai", missed: "Gagal",
};

function scoreColor(score: number | null): string {
  if (score === null) return NAVY_SOFT;
  if (score >= 80) return GREEN;
  if (score >= 60) return GOLD;
  return RED;
}

function reviewStatusStyle(status: ReviewStatus): { bg: string; color: string } {
  if (status === "acknowledged") return { bg: GREEN_SOFT, color: GREEN };
  if (status === "submitted") return { bg: GOLD_SOFT, color: "#B57500" };
  return { bg: GREY_SOFT, color: NAVY_SOFT };
}

function goalStatusStyle(status: GoalStatus): { bg: string; color: string } {
  if (status === "achieved") return { bg: GREEN_SOFT, color: GREEN };
  if (status === "missed") return { bg: RED_SOFT, color: RED };
  if (status === "at_risk") return { bg: GOLD_SOFT, color: "#B57500" };
  return { bg: GREY_SOFT, color: NAVY_SOFT };
}

function Badge({ label, bg, color }: { label: string; bg: string; color: string }) {
  return (
    <span style={{
      background: bg, color, fontWeight: 600, fontSize: "0.72rem",
      padding: "0.3rem 0.65rem", borderRadius: 999, display: "inline-block",
    }}>
      {label}
    </span>
  );
}

function StatCard({ icon, iconBg, iconColor, label, value, unit, footer, footerColor }: {
  icon: React.ReactNode; iconBg: string; iconColor: string; label: string; value: React.ReactNode;
  unit?: string; footer?: React.ReactNode; footerColor?: string;
}) {
  return (
    <div style={{
      background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 16, padding: "1.25rem",
      boxShadow: "0 1px 3px rgba(10,33,64,0.05)", flex: "1 1 0", minWidth: 0,
      display: "flex", flexDirection: "column", justifyContent: "space-between",
    }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "0.9rem" }}>
        <div style={{ fontSize: "0.82rem", fontWeight: 600, color: NAVY_SOFT, lineHeight: 1.3 }}>{label}</div>
        <div style={{
          width: 34, height: 34, borderRadius: 9, background: iconBg,
          display: "flex", alignItems: "center", justifyContent: "center", color: iconColor, flexShrink: 0,
        }}>
          {icon}
        </div>
      </div>
      <div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
          <span style={{ fontSize: "1.85rem", fontWeight: 800, color: NAVY, lineHeight: 1 }}>{value}</span>
          {unit && <span style={{ fontSize: "0.95rem", fontWeight: 600, color: NAVY_SOFT }}>{unit}</span>}
        </div>
        {footer && <div style={{ fontSize: "0.75rem", fontWeight: 600, color: footerColor ?? NAVY_SOFT, marginTop: 8 }}>{footer}</div>}
      </div>
    </div>
  );
}

function UpcomingEvaluationsPanel({ reviews, onShowAll }: { reviews: PerformanceReview[]; onShowAll: () => void }) {
  const upcoming = reviews
    .filter(r => r.status !== "acknowledged")
    .sort((a, b) => new Date(a.review_date ?? 0).getTime() - new Date(b.review_date ?? 0).getTime())
    .slice(0, 4);

  return (
    <div style={{
      background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 16,
      boxShadow: "0 1px 3px rgba(10,33,64,0.05)", width: "100%", boxSizing: "border-box",
      display: "flex", flexDirection: "column", height: "100%", overflow: "hidden",
    }}>
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "1.25rem 1.25rem 1rem",
      }}>
        <div style={{ fontWeight: 800, fontSize: "1.05rem", color: NAVY, lineHeight: 1.25 }}>
          Evaluasi Mendatang
        </div>
        <MoreVertical size={18} color={NAVY_SOFT} />
      </div>

      <div style={{ flex: 1, padding: "0 1.25rem", overflowY: "auto" }}>
        {upcoming.length === 0 && (
          <div style={{ fontSize: "0.78rem", color: NAVY_SOFT, paddingBottom: "1rem" }}>Tidak ada evaluasi tertunda.</div>
        )}
        {upcoming.map((r, i) => {
          const style = reviewStatusStyle(r.status);
          return (
            <div key={r.id} style={{
              display: "flex", gap: "0.7rem", alignItems: "flex-start",
              padding: "0.9rem 0",
              borderTop: i === 0 ? "none" : `1px solid ${BORDER}`,
            }}>
              <div style={{
                width: 32, height: 32, borderRadius: 9, background: style.bg, color: style.color,
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
              }}>
                {r.status === "draft" ? <Clock size={15} /> : <AlertTriangle size={15} />}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: "0.85rem", fontWeight: 700, color: NAVY, lineHeight: 1.3 }}>
                  {REVIEW_STATUS_LABELS[r.status]}: {r.employee?.full_name ?? "—"}
                </div>
                <div style={{ fontSize: "0.75rem", color: NAVY_SOFT, marginTop: 2 }}>
                  {formatDate(r.review_date)}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <button onClick={onShowAll} style={{
        width: "100%", background: BG_PANEL, border: "none", borderTop: `1px solid ${BORDER}`,
        color: NAVY, fontWeight: 700, fontSize: "0.85rem", cursor: "pointer",
        padding: "1rem 1.25rem", textAlign: "left", borderRadius: "0 0 16px 16px",
      }}>
        Lihat Semua Jadwal
      </button>
    </div>
  );
}

export function PerformanceListPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [showCreate, setShowCreate] = useState(false);
  const [detailReviewId, setDetailReviewId] = useState<number | null>(null);

  const { data, isLoading } = usePerformanceReviews({
    page, per_page: 20, status: statusFilter || undefined, search: search || undefined,
  });

  const submitReview = useSubmitPerformanceReview();
  const ackReview = useAcknowledgePerformanceReview();

  const rows = data?.data ?? [];
  const scored = rows.filter(r => r.overall_score !== null);
  const avgScore = scored.length ? scored.reduce((sum, r) => sum + (r.overall_score ?? 0), 0) / scored.length : null;
  const completionPct = rows.length ? Math.round((rows.filter(r => r.status === "acknowledged").length / rows.length) * 100) : 0;
  const pendingCount = rows.filter(r => r.status === "draft").length;

  return (
    <div style={{ background: BG_PANEL, minHeight: "100%", padding: "0", width: "100%", maxWidth: "100%", boxSizing: "border-box" }}>
      <PageHeader title="Performance Review" subtitle="Penilaian kinerja dan pengelolaan goal employee." />

      <div className="px-7 py-5">
        {/* ── Two-column layout: left (stats + table) / right (upcoming) ── */}
      <div style={{ display: "flex", gap: "1.25rem", flexWrap: "wrap", alignItems: "stretch", width: "100%", maxWidth: "100%", boxSizing: "border-box" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem", flex: "1 1 600px", minWidth: 0, maxWidth: "100%" }}>

          {/* ── Stat cards ─────────────────────────────────────────── */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
            <StatCard
              label="Rata-rata Skor"
              value={avgScore !== null ? avgScore.toFixed(1) : "—"}
              unit={avgScore !== null ? "/100" : undefined}
              icon={<TrendingUp size={16} />} iconBg={GOLD_SOFT} iconColor="#B57500"
              footer={scored.length ? `dari ${scored.length} review dinilai` : "Belum ada skor"}
            />
            <StatCard
              label="Review Selesai"
              value={`${completionPct}%`}
              icon={<CheckCircle2 size={16} />} iconBg={GREEN_SOFT} iconColor={GREEN}
              footer={
                <div style={{ height: 5, borderRadius: 3, background: BORDER, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${completionPct}%`, background: GREEN, borderRadius: 3 }} />
                </div>
              }
            />
            <StatCard
              label="Perlu Ditindaklanjuti"
              value={pendingCount}
              icon={<AlertTriangle size={16} />} iconBg={RED_SOFT} iconColor={RED}
              footer="Prioritas Tinggi" footerColor={RED}
            />
          </div>

          {/* ── Table card ─────────────────────────────────────────── */}
          <div style={{
            background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 16,
            boxShadow: "0 1px 3px rgba(10,33,64,0.05)", overflow: "hidden", flex: 1, minWidth: 0,
            display: "flex", flexDirection: "column",
          }}>
            <div style={{
              display: "flex", alignItems: "center", gap: "0.75rem",
              padding: "1.25rem 1.5rem", borderBottom: `1px solid ${BORDER}`, flexWrap: "wrap",
            }}>
              <div style={{ fontWeight: 800, fontSize: "1.05rem", color: NAVY, marginRight: "auto" }}>
                Daftar Review
              </div>
              <div style={{
                display: "flex", alignItems: "center", gap: 8, background: BG_PANEL,
                border: `1px solid ${BORDER}`, borderRadius: 10, padding: "0.5rem 0.85rem", width: 220,
              }}>
                <Search size={16} color={NAVY_SOFT} />
                <input
                  placeholder="Cari employee..." value={search}
                  onChange={e => { setSearch(e.target.value); setPage(1); }}
                  style={{ border: "none", outline: "none", background: "transparent", width: "100%", color: NAVY, fontSize: "0.85rem" }}
                />
              </div>
              <div style={{
                display: "flex", alignItems: "center", gap: 6, background: "#fff",
                border: `1px solid ${BORDER}`, borderRadius: 10, padding: "0 0.4rem 0 0",
              }}>
                <FilterIcon size={14} color={NAVY_SOFT} style={{ marginLeft: 10 }} />
                <select
                  value={statusFilter}
                  onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
                  style={{
                    border: "none", borderRadius: 10, padding: "0.55rem 0.5rem",
                    color: NAVY, background: "transparent", fontSize: "0.85rem", outline: "none",
                  }}
                >
                  <option value="">Semua Status</option>
                  <option value="draft">Draft</option>
                  <option value="submitted">Disubmit</option>
                  <option value="acknowledged">Diaknowledge</option>
                </select>
              </div>
              <button
                onClick={() => setShowCreate(true)}
                style={{
                  display: "flex", alignItems: "center", gap: 6,
                  background: GOLD, color: "#fff", border: "none", borderRadius: 10,
                  padding: "0.6rem 1.1rem", fontWeight: 700, fontSize: "0.85rem", cursor: "pointer",
                }}
              >
                <Plus size={15} /> Review Baru
              </button>
            </div>

            {isLoading && <div style={{ padding: "1.5rem" }}><LoadingState /></div>}
            {data && data.data.length === 0 && (
              <div style={{ padding: "1.5rem" }}>
                <EmptyState title="Belum Ada Review" subtitle="Review kinerja akan muncul di sini." />
              </div>
            )}
            {data && data.data.length > 0 && (
              <>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ background: BG_PANEL }}>
                        {["Employee", "Periode", "Tanggal", "Skor", "Status", "Aksi"].map(h => (
                          <th key={h} style={{
                            textAlign: "left", padding: "0.85rem 1.5rem",
                            fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.03em",
                            color: NAVY_SOFT, fontWeight: 700, borderBottom: `1px solid ${BORDER}`,
                            whiteSpace: "nowrap",
                          }}>
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {data.data.map(r => <ReviewRow key={r.id} review={r}
                        submitReview={submitReview} ackReview={ackReview} onDetail={() => setDetailReviewId(r.id)} />)}
                    </tbody>
                  </table>
                </div>
                <div style={{ padding: "1rem 1.5rem", marginTop: "auto" }}>
                  <Pagination currentPage={data.current_page} lastPage={data.last_page}
                    total={data.total} onPageChange={setPage} />
                </div>
              </>
            )}
          </div>
        </div>

        <UpcomingEvaluationsPanel reviews={rows} onShowAll={() => { setStatusFilter("draft"); setPage(1); }} />
        </div>
      </div>

      {showCreate && <CreateReviewModal onClose={() => setShowCreate(false)} />}
      {detailReviewId && <ReviewDetailModal reviewId={detailReviewId} onClose={() => setDetailReviewId(null)} />}
    </div>
  );
}

function ReviewRow({ review, submitReview, ackReview, onDetail }: {
  review: PerformanceReview;
  submitReview: ReturnType<typeof useSubmitPerformanceReview>;
  ackReview: ReturnType<typeof useAcknowledgePerformanceReview>;
  onDetail: () => void;
}) {
  const statusStyle = reviewStatusStyle(review.status);
  return (
    <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
      <td style={{ padding: "0.9rem 1.5rem" }}>
        <button onClick={onDetail}
          style={{ background: "none", border: "none", padding: 0, fontWeight: 700, color: NAVY, cursor: "pointer", textAlign: "left", fontSize: "0.9rem" }}>
          {review.employee?.full_name ?? "—"}
        </button>
      </td>
      <td style={{ padding: "0.9rem 1.5rem", fontFamily: "monospace", fontSize: "0.8rem", color: NAVY_SOFT }}>{review.review_period}</td>
      <td style={{ padding: "0.9rem 1.5rem", color: NAVY_SOFT, fontSize: "0.85rem" }}>{formatDate(review.review_date)}</td>
      <td style={{ padding: "0.9rem 1.5rem" }}>
        {review.overall_score !== null ? (
          <span style={{ color: scoreColor(review.overall_score), fontWeight: 800, fontSize: "1rem" }}>
            {review.overall_score}
          </span>
        ) : <span style={{ color: NAVY_SOFT }}>—</span>}
      </td>
      <td style={{ padding: "0.9rem 1.5rem" }}>
        <Badge label={REVIEW_STATUS_LABELS[review.status]} bg={statusStyle.bg} color={statusStyle.color} />
      </td>
      <td style={{ padding: "0.9rem 1.5rem" }}>
        {review.status === "draft" && (
          <button
            disabled={submitReview.isPending}
            onClick={() => {
              const score = prompt("Skor Overall (0-100):");
              if (score === null) return;
              submitReview.mutate({ id: review.id, values: { overall_score: parseFloat(score) } }, {
                onError: (e: Error) => alert("Gagal: " + e.message),
              });
            }}
            style={{
              fontSize: "0.75rem", padding: "0.4rem 0.75rem", borderRadius: 8,
              border: `1px solid ${BORDER}`, background: "#fff", color: NAVY, fontWeight: 600, cursor: "pointer",
            }}>
            Submit
          </button>
        )}
        {review.status === "submitted" && (
          <button
            disabled={ackReview.isPending}
            onClick={() => ackReview.mutate(review.id, {
              onError: (e: Error) => alert("Gagal: " + e.message),
            })}
            style={{
              fontSize: "0.75rem", padding: "0.4rem 0.75rem", borderRadius: 8,
              border: "none", background: GOLD, color: "#fff", fontWeight: 700, cursor: "pointer",
            }}>
            Acknowledge
          </button>
        )}
      </td>
    </tr>
  );
}

// ─── Modal shell ─────────────────────────────────────────────────────────────
function ModalShell({ title, onClose, maxWidth = 520, children }: { title: string; onClose: () => void; maxWidth?: number; children: React.ReactNode }) {
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
        background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 16, padding: "1.5rem",
        width: "100%", maxWidth, maxHeight: "90vh", overflowY: "auto", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.04)",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
          <div style={{ fontWeight: 800, fontSize: "1.1rem", color: NAVY }}>{title}</div>
          <button onClick={onClose}
            style={{ background: "none", border: "none", color: NAVY_SOFT, cursor: "pointer", fontSize: "1.2rem", padding: "0.25rem 0.5rem", lineHeight: 1 }}>
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function F({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ fontSize: "0.78rem", fontWeight: 700, display: "block", marginBottom: 4, color: NAVY }}>
        {label}{required && <span style={{ color: RED, marginLeft: 2 }}>*</span>}
      </label>
      {children}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  border: `1px solid ${BORDER}`, borderRadius: 8, padding: "0.55rem 0.7rem",
  fontSize: "0.85rem", color: NAVY, background: "#fff", outline: "none",
};

// ─── Employee Picker (search + select) ──────────────────────────────────────
function EmployeePicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [empSearch, setEmpSearch] = useState("");
  const { data: employeesPage, isLoading } = useEmployeeList({ per_page: 50, search: empSearch || undefined });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <input placeholder="Cari nama employee..." value={empSearch}
        onChange={e => setEmpSearch(e.target.value)} style={{ ...inputStyle, width: "100%" }} />
      <select value={value} onChange={e => onChange(e.target.value)} disabled={isLoading} style={{ ...inputStyle, width: "100%" }}>
        <option value="">— Pilih Employee —</option>
        {(employeesPage?.data ?? []).map(e => (
          <option key={e.id} value={e.id}>{e.full_name} ({e.employee_number})</option>
        ))}
      </select>
    </div>
  );
}

// ─── Objective cross-module performance data panel ──────────────────────────
function CrossModuleMetricsPanel({ employeeId }: { employeeId: number }) {
  const { data: metrics, isLoading } = useCrossModuleMetrics(employeeId);

  if (isLoading) return <div style={{ fontSize: "0.75rem", color: NAVY_SOFT }}>Memuat data kinerja objektif...</div>;
  if (!metrics) return null;

  if (!metrics.has_user_account) {
    return (
      <div style={{ fontSize: "0.78rem", color: NAVY_SOFT, fontStyle: "italic" }}>
        Employee ini belum terhubung ke akun login - data tiket/deal dari modul lain tidak bisa ditarik.
      </div>
    );
  }

  const items = [
    { label: "Tiket DC Ops Selesai", value: metrics.data_center_ops.tickets_resolved },
    { label: "Tiket DC Ops Berjalan", value: metrics.data_center_ops.tickets_open },
    { label: "Incident HR Selesai", value: metrics.hr_service_support.incidents_resolved },
    { label: "Deal CRM Menang", value: metrics.crm_sales.deals_won },
    { label: "Nilai Deal Menang", value: `Rp ${metrics.crm_sales.deals_won_value.toLocaleString("id-ID")}` },
    { label: "Deal CRM Kalah", value: metrics.crm_sales.deals_lost },
  ];

  return (
    <div>
      <div style={{ fontSize: "0.7rem", color: NAVY_SOFT, marginBottom: 6 }}>
        Referensi data objektif dari modul lain (Data Center Ops, CRM Sales) - bukan input otomatis, murni bantuan penilaian.
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
        {items.map(it => (
          <div key={it.label} style={{ background: BG_PANEL, border: `1px solid ${BORDER}`, borderRadius: 8, padding: "0.5rem 0.65rem" }}>
            <div style={{ fontSize: "0.65rem", color: NAVY_SOFT }}>{it.label}</div>
            <div style={{ fontWeight: 800, fontSize: "0.95rem", color: NAVY }}>{it.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Target KPI posisi employee (dipilih manual di /hr/positions) vs angka
 * aktual dihitung otomatis dari sistem, periode 1 bulan berjalan - lihat
 * PerformanceService::positionKpiProgress(). Beda dari CrossModuleMetricsPanel
 * di atas: itu cuma referensi mentah semua modul, ini KHUSUS metrik yang
 * sudah ditetapkan sebagai target buat posisi employee ini. */
function KpiProgressPanel({ employeeId }: { employeeId: number }) {
  const { data: progress, isLoading } = useKpiProgress(employeeId);

  if (isLoading) return <div style={{ fontSize: "0.75rem", color: NAVY_SOFT }}>Memuat progress KPI...</div>;
  if (!progress || progress.length === 0) {
    return (
      <div style={{ fontSize: "0.78rem", color: NAVY_SOFT, fontStyle: "italic" }}>
        Posisi employee ini belum punya target KPI dikonfigurasi. Atur di menu HR &gt; Position.
      </div>
    );
  }

  return (
    <div>
      <div style={{ fontSize: "0.7rem", color: NAVY_SOFT, marginBottom: 8 }}>
        Target KPI posisi (bulan berjalan) vs angka aktual — dihitung otomatis dari sistem.
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {progress.map(p => {
          const pct = p.achievement_pct ?? 0;
          const barColor = pct >= 100 ? GREEN : pct >= 50 ? GOLD : RED;
          return (
            <div key={p.metric_key}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.78rem", marginBottom: 3 }}>
                <span style={{ color: NAVY }}>{p.label}</span>
                <span style={{ color: NAVY_SOFT }}>
                  {p.actual_value} / {p.target_value}
                  {p.achievement_pct !== null && <strong style={{ color: barColor, marginLeft: 6 }}>{p.achievement_pct}%</strong>}
                </span>
              </div>
              <div style={{ height: 6, borderRadius: 3, background: BORDER, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${Math.min(pct, 100)}%`, background: barColor, borderRadius: 3 }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Create Review Modal ─────────────────────────────────────────────────────
function CreateReviewModal({ onClose }: { onClose: () => void }) {
  const [employeeId, setEmployeeId] = useState("");
  const [reviewerId, setReviewerId] = useState("");
  const [period, setPeriod] = useState("");
  const [date, setDate] = useState("");
  const [comments, setComments] = useState("");
  const [error, setError] = useState<string | null>(null);

  const createReview = useCreatePerformanceReview();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!employeeId || !period.trim()) { setError("Employee dan Periode wajib diisi."); return; }
    setError(null);

    createReview.mutate({
      employeeId: parseInt(employeeId),
      values: {
        reviewer_id: reviewerId ? parseInt(reviewerId) : undefined,
        review_period: period.trim(),
        review_date: date || undefined,
        comments: comments.trim() || undefined,
      },
    }, { onSuccess: onClose, onError: (e) => setError(extractErrorMessage(e)) });
  }

  return (
    <ModalShell title="Siklus Review Baru" onClose={onClose} maxWidth={600}>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
        <F label="Employee" required>
          <EmployeePicker value={employeeId} onChange={setEmployeeId} />
        </F>

        {employeeId && (
          <>
            <div style={{ background: BG_PANEL, border: `1px solid ${BORDER}`, borderRadius: 8, padding: "0.75rem" }}>
              <CrossModuleMetricsPanel employeeId={parseInt(employeeId)} />
            </div>
            <div style={{ background: BG_PANEL, border: `1px solid ${BORDER}`, borderRadius: 8, padding: "0.75rem" }}>
              <KpiProgressPanel employeeId={parseInt(employeeId)} />
            </div>
          </>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
          <F label="Periode Review" required>
            <input value={period} onChange={e => setPeriod(e.target.value)}
              placeholder="mis. 2026-Q3" style={{ ...inputStyle, width: "100%" }} />
          </F>
          <F label="Tanggal Review">
            <input type="date" value={date} onChange={e => setDate(e.target.value)} style={{ ...inputStyle, width: "100%" }} />
          </F>
        </div>

        <F label="Reviewer (opsional)">
          <EmployeePicker value={reviewerId} onChange={setReviewerId} />
        </F>

        <F label="Catatan">
          <textarea value={comments} onChange={e => setComments(e.target.value)}
            placeholder="Catatan awal siklus review..." style={{ ...inputStyle, width: "100%", minHeight: 60, resize: "vertical" }} />
        </F>

        {error && <div style={{ color: RED, fontSize: "0.8rem" }}>{error}</div>}

        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 8, paddingTop: 8, borderTop: `1px solid ${BORDER}` }}>
          <button type="button" onClick={onClose}
            style={{ padding: "0.6rem 1.1rem", borderRadius: 8, border: `1px solid ${BORDER}`, background: "#fff", color: NAVY, fontWeight: 600, cursor: "pointer" }}>
            Batal
          </button>
          <button type="submit" disabled={createReview.isPending}
            style={{ padding: "0.6rem 1.1rem", borderRadius: 8, border: "none", background: GOLD, color: "#fff", fontWeight: 700, cursor: "pointer" }}>
            {createReview.isPending ? "Menyimpan..." : "Buat Review"}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

// ─── Review Detail Modal (goals: add + update progress) ────────────────────
function ReviewDetailModal({ reviewId, onClose }: { reviewId: number; onClose: () => void }) {
  const { data: review, isLoading } = usePerformanceReview(reviewId);
  const [goalDesc, setGoalDesc] = useState("");
  const [targetValue, setTargetValue] = useState("");
  const [weightPct, setWeightPct] = useState("");
  const [goalError, setGoalError] = useState<string | null>(null);
  const createGoal = useCreatePerformanceGoal();

  function handleAddGoal() {
    if (!review || !goalDesc.trim()) { setGoalError("Deskripsi goal wajib diisi."); return; }
    setGoalError(null);
    createGoal.mutate({
      employeeId: review.employee_id,
      values: {
        review_id: review.id, goal_description: goalDesc.trim(),
        target_value: targetValue ? parseFloat(targetValue) : undefined,
        weight_pct: weightPct ? parseFloat(weightPct) : undefined,
      },
    }, {
      onSuccess: () => { setGoalDesc(""); setTargetValue(""); setWeightPct(""); },
      onError: (e) => setGoalError(extractErrorMessage(e)),
    });
  }

  const statusStyle = review ? reviewStatusStyle(review.status) : { bg: GREY_SOFT, color: NAVY_SOFT };

  return (
    <ModalShell title={review ? `Review — ${review.employee?.full_name ?? ""}` : "Detail Review"} onClose={onClose} maxWidth={720}>
      {isLoading && <LoadingState />}
      {review && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div style={{ fontSize: "0.8rem", color: NAVY_SOFT, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span>{review.review_period} · {formatDate(review.review_date)} · Reviewer: {review.reviewer?.full_name ?? "—"}</span>
            <Badge label={REVIEW_STATUS_LABELS[review.status]} bg={statusStyle.bg} color={statusStyle.color} />
          </div>
          {review.comments && <div style={{ fontSize: "0.8rem", color: NAVY }}>{review.comments}</div>}

          <div style={{ background: BG_PANEL, border: `1px solid ${BORDER}`, borderRadius: 8, padding: "0.75rem" }}>
            <CrossModuleMetricsPanel employeeId={review.employee_id} />
          </div>

          <div style={{ background: BG_PANEL, border: `1px solid ${BORDER}`, borderRadius: 8, padding: "0.75rem" }}>
            <KpiProgressPanel employeeId={review.employee_id} />
          </div>

          <div>
            <div style={{ fontWeight: 700, fontSize: "0.85rem", marginBottom: 8, color: NAVY }}>Tambah Goal</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <input placeholder="Deskripsi goal, mis. Selesaikan 10 tiket bulan ini" value={goalDesc}
                onChange={e => setGoalDesc(e.target.value)} style={{ ...inputStyle, width: "100%" }} />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                <input type="number" placeholder="Target Value" value={targetValue}
                  onChange={e => setTargetValue(e.target.value)} style={inputStyle} />
                <input type="number" min={0} max={100} placeholder="Bobot % (opsional)" value={weightPct}
                  onChange={e => setWeightPct(e.target.value)} style={inputStyle} />
              </div>
              <button onClick={handleAddGoal} disabled={createGoal.isPending}
                style={{
                  alignSelf: "flex-start", padding: "0.55rem 1rem", borderRadius: 8, border: "none",
                  background: GOLD, color: "#fff", fontWeight: 700, cursor: "pointer",
                }}>
                {createGoal.isPending ? "..." : "Tambah Goal"}
              </button>
            </div>
            {goalError && <div style={{ color: RED, fontSize: "0.8rem", marginTop: 4 }}>{goalError}</div>}
          </div>

          <div>
            <div style={{ fontWeight: 700, fontSize: "0.85rem", marginBottom: 8, color: NAVY }}>Goals ({review.goals?.length ?? 0})</div>
            {(!review.goals || review.goals.length === 0) ? (
              <div style={{ fontSize: "0.8rem", color: NAVY_SOFT }}>Belum ada goal untuk siklus review ini.</div>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: BG_PANEL }}>
                    {["Deskripsi", "Target", "Aktual", "Bobot", "Status", ""].map(h => (
                      <th key={h} style={{
                        textAlign: "left", padding: "0.6rem 0.75rem", fontSize: "0.68rem", textTransform: "uppercase",
                        letterSpacing: "0.03em", color: NAVY_SOFT, fontWeight: 700, borderBottom: `1px solid ${BORDER}`,
                        width: h === "" ? 150 : undefined,
                      }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {review.goals.map(g => <GoalRow key={g.id} goal={g} />)}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </ModalShell>
  );
}

function GoalRow({ goal }: { goal: { id: number; goal_description: string; target_value: number | null; actual_value: number | null; weight_pct: number | null; status: GoalStatus } }) {
  const [actual, setActual] = useState("");
  const [error, setError] = useState<string | null>(null);
  const updateProgress = useUpdateGoalProgress();

  function handleUpdate() {
    if (actual === "") { setError("Isi nilai aktual dulu."); return; }
    setError(null);
    updateProgress.mutate({ goalId: goal.id, values: { actual_value: parseFloat(actual) } }, {
      onError: (e) => setError(extractErrorMessage(e)),
    });
  }

  const statusStyle = goalStatusStyle(goal.status);

  return (
    <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
      <td style={{ padding: "0.6rem 0.75rem", fontSize: "0.85rem", color: NAVY }}>{goal.goal_description}</td>
      <td style={{ padding: "0.6rem 0.75rem", fontSize: "0.85rem", color: NAVY_SOFT }}>{goal.target_value ?? "—"}</td>
      <td style={{ padding: "0.6rem 0.75rem", fontSize: "0.85rem", color: NAVY_SOFT }}>{goal.actual_value ?? "—"}</td>
      <td style={{ padding: "0.6rem 0.75rem", fontSize: "0.85rem", color: NAVY_SOFT }}>{goal.weight_pct ? `${goal.weight_pct}%` : "—"}</td>
      <td style={{ padding: "0.6rem 0.75rem" }}>
        <Badge label={GOAL_STATUS_LABELS[goal.status]} bg={statusStyle.bg} color={statusStyle.color} />
      </td>
      <td style={{ padding: "0.6rem 0.75rem" }}>
        <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
          <input type="number" placeholder="Aktual" value={actual}
            onChange={e => setActual(e.target.value)} style={{ ...inputStyle, width: 70, padding: "0.4rem 0.5rem" }} />
          <button onClick={handleUpdate} disabled={updateProgress.isPending}
            style={{
              padding: "0.4rem 0.65rem", fontSize: "0.75rem", borderRadius: 6,
              border: `1px solid ${BORDER}`, background: "#fff", color: NAVY, fontWeight: 600, cursor: "pointer",
            }}>
            Update
          </button>
        </div>
        {error && <div style={{ color: RED, fontSize: "0.7rem" }}>{error}</div>}
      </td>
    </tr>
  );
}