import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  RefreshCw, Plus, ClipboardCheck, TrendingUp, Wallet, Users, MoreVertical, Filter as FilterIcon, Send,
  Eye, ArrowUpRight, Clock, Info, CheckCircle2,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@shared/lib/auth-context";
import { PageHeader } from "@shared/components/PageHeader";
import { EmptyState } from "@shared/components/EmptyState";
import { LoadingState } from "@shared/components/LoadingState";
import { Pagination } from "@shared/components/Pagination";
import { Modal } from "@shared/components/Modal";
import { Button } from "@shared/components/Button";
import { extractErrorMessage } from "@shared/types/api";
import { formatDate, formatCurrency } from "@shared/lib/format";
import { FileUploadField } from "@shared/components/FileUploadField";
import { EmployeePicker } from "../components/EmployeePicker";
import { BulkGenerateOvertimeModal } from "../components/BulkGenerateOvertimeModal";
import { OvertimeDetailModal } from "../components/OvertimeDetailModal";
import { PostToFinanceModal } from "../components/PostToFinanceModal";
import {
  useOvertimeList,
  useOvertimeCandidates, useSubmitOvertime, useDefaultOvertimeRate,
} from "../api/useOvertime";
import type { OvertimeRecord, OvertimeStatus } from "../types/overtime";

// ─── Design tokens (brand palette) ──────────────────────────────────────────
const NAVY = "#0A2140";
const NAVY_SOFT = "#4A5C74";
const GOLD = "#F2A602";
const GOLD_SOFT = "#FDF1D9";
const BORDER = "#E4E8EE";
const BG_PANEL = "#F7F8FA";
const GREEN = "#1BA672";
const GREEN_SOFT = "#E4F7EF";
const RED = "#E14B4B";
const RED_SOFT = "#FCEAEA";
const GREY_SOFT = "#EEF1F4";
const BLUE_SOFT = "#E8EEF7";

const STATUS_LABELS: Record<OvertimeStatus, string> = {
  draft: "Draft",
  pending_approval: "Menunggu Approval",
  approved: "Disetujui",
  rejected: "Ditolak",
  sent_to_finance: "Sent to Finance",
};

function statusStyle(status: OvertimeStatus): { bg: string; color: string } {
  switch (status) {
    case "approved": return { bg: GREEN_SOFT, color: GREEN };
    case "pending_approval": return { bg: GOLD_SOFT, color: "#B57500" };
    case "rejected": return { bg: RED_SOFT, color: RED };
    case "sent_to_finance": return { bg: BLUE_SOFT, color: NAVY };
    default: return { bg: GREY_SOFT, color: NAVY_SOFT };
  }
}

const AVATAR_PALETTE = [
  { bg: NAVY, color: "#fff" },
  { bg: GOLD, color: "#fff" },
  { bg: GREEN, color: "#fff" },
  { bg: "#5B7290", color: "#fff" },
  { bg: "#B57500", color: "#fff" },
];

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "?";
}

function avatarStyle(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  return AVATAR_PALETTE[hash % AVATAR_PALETTE.length];
}

function Avatar({ name }: { name: string }) {
  const style = avatarStyle(name);
  return (
    <div style={{
      width: 30, height: 30, borderRadius: "50%", background: style.bg, color: style.color,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: "0.7rem", fontWeight: 700, flexShrink: 0,
    }}>
      {initials(name)}
    </div>
  );
}

function Badge({ label, bg, color }: { label: string; bg: string; color: string }) {
  return (
    <span style={{
      background: bg, color, fontWeight: 600, fontSize: "0.72rem",
      padding: "0.3rem 0.6rem", borderRadius: 999, display: "inline-block", whiteSpace: "nowrap",
    }}>
      {label}
    </span>
  );
}

function StatCard({ icon, iconBg, iconColor, label, value, unit, footer, footerColor, dark }: {
  icon: React.ReactNode; iconBg: string; iconColor: string; label: string; value: React.ReactNode;
  unit?: string; footer?: React.ReactNode; footerColor?: string; dark?: boolean;
}) {
  return (
    <div style={{
      background: dark ? NAVY : "#fff", border: dark ? "none" : `1px solid ${BORDER}`, borderRadius: 16,
      padding: "1.1rem 1.25rem", boxShadow: "0 1px 3px rgba(10,33,64,0.05)", flex: "1 1 0", minWidth: 0,
      display: "flex", flexDirection: "column", justifyContent: "space-between",
    }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "0.9rem" }}>
        <div style={{ fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.03em", color: dark ? "#B8C4D6" : NAVY_SOFT, lineHeight: 1.3 }}>{label}</div>
        <div style={{
          width: 30, height: 30, borderRadius: 8, background: dark ? "rgba(255,255,255,0.12)" : iconBg,
          display: "flex", alignItems: "center", justifyContent: "center", color: dark ? "#fff" : iconColor, flexShrink: 0,
        }}>
          {icon}
        </div>
      </div>
      <div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
          <span style={{ fontSize: "1.6rem", fontWeight: 800, color: dark ? "#fff" : NAVY, lineHeight: 1.15 }}>{value}</span>
          {unit && <span style={{ fontSize: "0.85rem", fontWeight: 600, color: dark ? "#B8C4D6" : NAVY_SOFT }}>{unit}</span>}
        </div>
        {footer && <div style={{ fontSize: "0.72rem", fontWeight: 600, color: dark ? "#B8C4D6" : (footerColor ?? NAVY_SOFT), marginTop: 6 }}>{footer}</div>}
      </div>
    </div>
  );
}

/** Bar chart built purely from the current page's real overtime records
 * (hours summed per employee) — no invented/mocked figures. */
function OvertimeByEmployeeChart({ rows }: { rows: { employee?: { full_name: string } | null; overtime_hours: number | string }[] }) {
  const byEmployee = new Map<string, number>();
  rows.forEach(r => {
    const name = r.employee?.full_name ?? "—";
    byEmployee.set(name, (byEmployee.get(name) ?? 0) + (Number(r.overtime_hours) || 0));
  });
  const bars = Array.from(byEmployee.entries()).slice(0, 8);
  const max = Math.max(1, ...bars.map(([, v]) => v));

  return (
    <div style={{
      background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 16,
      boxShadow: "0 1px 3px rgba(10,33,64,0.05)", overflow: "hidden",
    }}>
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "1.1rem 1.5rem", borderBottom: `1px solid ${BORDER}`,
      }}>
        <div style={{ fontWeight: 800, fontSize: "1rem", color: NAVY }}>Distribusi Jam Overtime per Employee</div>
        <MoreVertical size={18} color={NAVY_SOFT} />
      </div>
      <div style={{ padding: "1.5rem" }}>
        {bars.length === 0 ? (
          <div style={{ fontSize: "0.82rem", color: NAVY_SOFT }}>Belum ada data untuk periode ini.</div>
        ) : (
          <div style={{ display: "flex", alignItems: "flex-end", gap: "1rem", height: 180 }}>
            {bars.map(([name, hours]) => (
              <div key={name} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 8, height: "100%", justifyContent: "flex-end" }}>
                <div style={{ fontSize: "0.72rem", fontWeight: 700, color: NAVY }}>{Number(hours).toFixed(1)}</div>
                <div style={{
                  width: "60%", maxWidth: 40, height: `${Math.max(6, (hours / max) * 130)}px`,
                  background: NAVY, borderRadius: "6px 6px 0 0",
                }} />
                <div style={{
                  fontSize: "0.68rem", color: NAVY_SOFT, textAlign: "center", lineHeight: 1.2,
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", width: "100%",
                }}>
                  {name}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function OvertimeListPage() {
  const queryClient = useQueryClient();
  const { user, hasPermission } = useAuth();
  const canSubmit = hasPermission("overtime.submit");
  const isManagerOrAdmin = user?.roles?.some(
    (r) => r.toLowerCase().includes("manager") || r.toLowerCase().includes("admin")
  ) ?? false;

  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<OvertimeStatus | "">("");
  const [monthFilter, setMonthFilter] = useState(new Date().getMonth() + 1);
  const [yearFilter, setYearFilter] = useState(new Date().getFullYear());
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [selectedEmployeeForSubmit, setSelectedEmployeeForSubmit] = useState<{ id: number; full_name: string } | null>(null);
  const [detailRecordId, setDetailRecordId] = useState<number | null>(null);
  const [postFinanceRecord, setPostFinanceRecord] = useState<OvertimeRecord | null>(null);

  const { data, isLoading } = useOvertimeList({
    status: statusFilter || undefined,
    period_month: monthFilter,
    period_year: yearFilter,
    page, per_page: 20,
  });

  const { data: defaultRate } = useDefaultOvertimeRate();

  const rows = data?.data ?? [];
  const totalHours = rows.reduce((sum, r) => sum + (Number(r.overtime_hours) || 0), 0);
  const uniqueEmployeeCount = new Set(rows.map(r => r.employee?.full_name ?? "—")).size;
  const avgPerEmployee = uniqueEmployeeCount ? totalHours / uniqueEmployeeCount : 0;
  const totalCost = defaultRate ? totalHours * defaultRate.rate_per_hour : null;

  const topEmployee = (() => {
    const byEmployee = new Map<string, number>();
    rows.forEach(r => {
      const name = r.employee?.full_name ?? "—";
      byEmployee.set(name, (byEmployee.get(name) ?? 0) + (Number(r.overtime_hours) || 0));
    });
    let best: [string, number] | null = null;
    byEmployee.forEach((hours, name) => { if (!best || hours > best[1]) best = [name, hours]; });
    return best;
  })();

  return (
    <div style={{ background: BG_PANEL, minHeight: "100%" }}>
      <PageHeader title="Overtime Records"
        subtitle="Pengajuan lembur bulanan — HRD ajukan hari lembur, Manager approve lewat My Approvals, lalu di-posting ke Finance." />

      <div className="px-7 py-5 flex flex-col gap-5">
        {/* ── Workflow Guide Banner ─────────────────────────────────── */}
        <div style={{
          background: "#fff",
          border: `1px solid ${BORDER}`,
          borderLeft: `4px solid ${GOLD}`,
          borderRadius: 12,
          padding: "0.85rem 1.15rem",
          display: "flex",
          alignItems: "center",
          gap: "0.85rem",
          fontSize: "0.82rem",
          boxShadow: "0 1px 3px rgba(10,33,64,0.04)",
        }}>
          <Info size={20} color={GOLD} style={{ flexShrink: 0 }} />
          <div style={{ color: NAVY_SOFT, lineHeight: 1.45 }}>
            <strong style={{ color: NAVY }}>Alur Bisnis Overtime:</strong>{" "}
            1. <strong>HR Staff</strong> ajukan lembur (klik tombol <em>Generate (Bulk)</em> atau <em>Ajukan Overtime</em>).
            {" ➔ "}2. <strong>Manager</strong> approve di menu <em>My Approvals</em> (pengajuan masuk ke inbox akun Manager, bukan akun pemohon).
            {" ➔ "}3. <strong>HR Staff</strong> klik tombol <em>Posting ke Finance</em> pada lembur yang disetujui untuk pembukuan jurnal akuntansi.
          </div>
        </div>

        {/* ── Stat cards ─────────────────────────────────────────────── */}
      <div style={{ display: "flex", gap: "1rem", marginBottom: "1.25rem", flexWrap: "wrap" }}>
        <StatCard
          label="Total Jam Overtime"
          value={totalHours.toFixed(1)} unit="jam"
          icon={<TrendingUp size={15} />} iconBg={GOLD_SOFT} iconColor="#B57500"
          footer={`Periode ${String(monthFilter).padStart(2, "0")}/${yearFilter}`}
        />
        <StatCard
          label="Estimasi Biaya Overtime"
          value={totalCost !== null ? formatCurrency(totalCost) : "—"}
          icon={<Wallet size={15} />} iconBg={RED_SOFT} iconColor={RED}
          footer={defaultRate ? `@ ${formatCurrency(defaultRate.rate_per_hour)}/jam` : "Rate belum diatur"}
        />
        <StatCard
          label="Rata-rata per Employee"
          value={avgPerEmployee.toFixed(1)} unit="jam"
          icon={<Users size={15} />} iconBg={BLUE_SOFT} iconColor={NAVY}
          footer={`Dari ${uniqueEmployeeCount} employee aktif`}
        />
        <StatCard dark
          label="Kontributor Tertinggi"
          value={topEmployee ? topEmployee[0] : "—"}
          icon={<TrendingUp size={15} />} iconBg="" iconColor=""
          footer={topEmployee ? `${Number(topEmployee[1]).toFixed(1)} jam bulan ini` : "Belum ada data"}
        />
      </div>

      {/* ── Chart card ─────────────────────────────────────────────── */}
      <div style={{ marginBottom: "1.25rem" }}>
        <OvertimeByEmployeeChart rows={rows} />
      </div>

      {/* ── Table card ─────────────────────────────────────────────── */}
      <div style={{
        background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 16,
        boxShadow: "0 1px 3px rgba(10,33,64,0.05)", overflow: "hidden",
      }}>
        <div style={{
          display: "flex", alignItems: "center", gap: "0.75rem",
          padding: "1.25rem 1.5rem", borderBottom: `1px solid ${BORDER}`, flexWrap: "wrap",
        }}>
          <div style={{ fontWeight: 800, fontSize: "1.05rem", color: NAVY, marginRight: "auto" }}>
            Riwayat Overtime
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <select value={monthFilter}
              onChange={e => { setMonthFilter(parseInt(e.target.value)); setPage(1); }}
              style={{ border: `1px solid ${BORDER}`, borderRadius: 10, padding: "0.5rem 0.6rem", color: NAVY, background: "#fff", fontSize: "0.82rem" }}>
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i + 1} value={i + 1}>{String(i + 1).padStart(2, "0")}</option>
              ))}
            </select>
            <span style={{ color: NAVY_SOFT }}>/</span>
            <select value={yearFilter}
              onChange={e => { setYearFilter(parseInt(e.target.value)); setPage(1); }}
              style={{ border: `1px solid ${BORDER}`, borderRadius: 10, padding: "0.5rem 0.6rem", color: NAVY, background: "#fff", fontSize: "0.82rem" }}>
              {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>

          <div style={{
            display: "flex", alignItems: "center", gap: 6, background: BG_PANEL,
            border: `1px solid ${BORDER}`, borderRadius: 10, padding: "0 0.5rem 0 0.7rem",
          }}>
            <FilterIcon size={13} color={NAVY_SOFT} />
            <select value={statusFilter}
              onChange={e => { setStatusFilter(e.target.value as OvertimeStatus | ""); setPage(1); }}
              style={{ border: "none", borderRadius: 10, padding: "0.5rem 0.4rem", color: NAVY, background: "transparent", fontSize: "0.82rem", outline: "none" }}>
              <option value="">Semua Status</option>
              {Object.entries(STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>

          {canSubmit && (
            <button
              onClick={() => setShowBulkModal(true)}
              title="Generate dan ajukan lembur massal untuk seluruh karyawan aktif"
              style={{
                display: "flex", alignItems: "center", gap: 6, border: `1.5px solid ${NAVY}`,
                background: "#fff", color: NAVY, borderRadius: 10, padding: "0.55rem 1rem",
                fontWeight: 700, fontSize: "0.82rem", cursor: "pointer",
                boxShadow: "0 1px 2px rgba(10,33,64,0.05)",
                transition: "all 0.15s ease",
              }}>
              <RefreshCw size={14} color={NAVY} /> Generate (Bulk)
            </button>
          )}

          {canSubmit && (
            <button
              onClick={() => {
                setSelectedEmployeeForSubmit(null);
                setShowSubmitModal(true);
              }}
              style={{
                display: "flex", alignItems: "center", gap: 6, border: "none",
                background: GOLD, color: "#fff", borderRadius: 10, padding: "0.55rem 1rem",
                fontWeight: 700, fontSize: "0.82rem", cursor: "pointer",
              }}>
              <Plus size={14} /> Ajukan Overtime
            </button>
          )}
        </div>

        {isLoading && <div style={{ padding: "1.5rem" }}><LoadingState /></div>}
        {data && data.data.length === 0 && (
          <div style={{ padding: "1.5rem" }}>
            <EmptyState title="Belum Ada Data Overtime"
              subtitle={canSubmit ? 'Klik "Ajukan Overtime" untuk mengajukan lembur employee.' : "Belum ada pengajuan lembur untuk periode ini."} />
          </div>
        )}
        {data && data.data.length > 0 && (
          <>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: BG_PANEL }}>
                    {["Employee", "Periode", "Total Jam", "Status", "Diajukan", "Aksi"].map(h => (
                      <th key={h} style={{
                        textAlign: "left", padding: "0.85rem 1.5rem", fontSize: "0.72rem",
                        textTransform: "uppercase", letterSpacing: "0.03em", color: NAVY_SOFT,
                        fontWeight: 700, borderBottom: `1px solid ${BORDER}`, whiteSpace: "nowrap",
                      }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.data.map(rec => {
                    const style = statusStyle(rec.status);
                    return (
                      <tr key={rec.id} style={{ borderBottom: `1px solid ${BORDER}` }}>
                        <td style={{ padding: "0.85rem 1.5rem" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                            <Avatar name={rec.employee?.full_name ?? "—"} />
                            <span style={{ fontWeight: 700, color: NAVY, fontSize: "0.88rem" }}>
                              {rec.employee?.full_name ?? "—"}
                            </span>
                          </div>
                        </td>
                        <td style={{ padding: "0.85rem 1.5rem", fontFamily: "monospace", fontSize: "0.8rem", color: NAVY_SOFT }}>
                          {String(rec.period_month).padStart(2, "0")}/{rec.period_year}
                        </td>
                        <td style={{ padding: "0.85rem 1.5rem" }}>
                          <span style={{ fontWeight: 700, color: rec.overtime_hours > 0 ? NAVY : NAVY_SOFT, fontSize: "0.9rem" }}>
                            {(Number(rec.overtime_hours) || 0).toFixed(2)} jam
                          </span>
                        </td>
                        <td style={{ padding: "0.85rem 1.5rem" }}>
                          <span title={rec.rejection_reason ?? undefined}>
                            <Badge label={STATUS_LABELS[rec.status]} bg={style.bg} color={style.color} />
                          </span>
                        </td>
                        <td style={{ padding: "0.85rem 1.5rem", fontSize: "0.8rem", color: NAVY_SOFT }}>
                          {rec.submitter?.full_name
                            ? `${rec.submitter.full_name}${rec.submitted_at ? " · " + formatDate(rec.submitted_at) : ""}`
                            : "—"}
                        </td>
                        <td style={{ padding: "0.85rem 1.5rem" }}>
                          <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap", alignItems: "center" }}>
                            {/* Tombol Detail selalu bisa diakses */}
                            <button
                              type="button"
                              onClick={() => setDetailRecordId(rec.id)}
                              style={{
                                display: "flex", alignItems: "center", gap: 4,
                                border: `1px solid ${BORDER}`, background: "#fff", color: NAVY,
                                borderRadius: 8, padding: "0.35rem 0.6rem", fontSize: "0.72rem", fontWeight: 600, cursor: "pointer",
                              }}>
                              <Eye size={12} color={NAVY_SOFT} /> Detail
                            </button>

                            {/* Aksi Draft: Ajukan Approval */}
                            {rec.status === "draft" && canSubmit && (
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedEmployeeForSubmit(rec.employee ? { id: rec.employee_id, full_name: rec.employee.full_name } : null);
                                  setShowSubmitModal(true);
                                }}
                                style={{
                                  display: "flex", alignItems: "center", gap: 4,
                                  border: `1px solid ${BORDER}`, background: "#fff", color: NAVY,
                                  borderRadius: 8, padding: "0.35rem 0.6rem", fontSize: "0.72rem", fontWeight: 700, cursor: "pointer",
                                }}>
                                <Send size={12} color={GOLD} /> Ajukan Approval
                              </button>
                            )}

                            {/* Aksi Pending Approval: Pisahkan akun Manager vs Staff Submitter */}
                            {rec.status === "pending_approval" && (
                              isManagerOrAdmin ? (
                                <Link to="/core-platform/my-approvals"
                                  style={{
                                    display: "flex", alignItems: "center", gap: 4, textDecoration: "none",
                                    border: `1px solid ${GOLD}`, background: GOLD_SOFT, color: "#B57500",
                                    borderRadius: 8, padding: "0.35rem 0.6rem", fontSize: "0.72rem", fontWeight: 700,
                                  }}>
                                  <ClipboardCheck size={12} /> Review di My Approvals
                                </Link>
                              ) : (
                                <span
                                  title="Pengajuan sedang dalam antrean approval di halaman My Approvals milik Manager"
                                  style={{
                                    display: "flex", alignItems: "center", gap: 4,
                                    border: `1px solid ${BORDER}`, background: GOLD_SOFT, color: "#B57500",
                                    borderRadius: 8, padding: "0.35rem 0.6rem", fontSize: "0.72rem", fontWeight: 600,
                                  }}>
                                  <Clock size={12} /> Tunggu Manager
                                </span>
                              )
                            )}

                            {/* Aksi Approved: Posting ke Finance */}
                            {rec.status === "approved" && (
                              <button
                                type="button"
                                onClick={() => setPostFinanceRecord(rec)}
                                style={{
                                  display: "flex", alignItems: "center", gap: 4,
                                  border: "none", background: GREEN, color: "#fff",
                                  borderRadius: 8, padding: "0.35rem 0.65rem", fontSize: "0.72rem", fontWeight: 700, cursor: "pointer",
                                  boxShadow: "0 1px 2px rgba(27,166,114,0.2)",
                                }}>
                                <ArrowUpRight size={12} /> Posting ke Finance
                              </button>
                            )}

                            {/* Aksi Sent to Finance: Indikator selesai */}
                            {rec.status === "sent_to_finance" && (
                              <span style={{ color: GREEN, fontSize: "0.75rem", fontWeight: 700, display: "flex", alignItems: "center", gap: 3 }}>
                                <CheckCircle2 size={13} color={GREEN} /> Posted
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div style={{ padding: "1rem 1.5rem" }}>
              <Pagination currentPage={data.current_page} lastPage={data.last_page}
                total={data.total} onPageChange={setPage} />
            </div>
          </>
        )}
        </div>
      </div>

      {showSubmitModal && (
        <SubmitOvertimeModal
          initialEmployee={selectedEmployeeForSubmit}
          initialMonth={monthFilter}
          initialYear={yearFilter}
          onClose={() => {
            setShowSubmitModal(false);
            setSelectedEmployeeForSubmit(null);
          }}
        />
      )}

      {showBulkModal && (
        <BulkGenerateOvertimeModal
          initialMonth={monthFilter}
          initialYear={yearFilter}
          existingRecords={rows}
          onClose={() => setShowBulkModal(false)}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ["hrOvertime"] });
          }}
        />
      )}

      {detailRecordId !== null && (
        <OvertimeDetailModal
          recordId={detailRecordId}
          onClose={() => setDetailRecordId(null)}
          onOpenPostFinance={(rec) => {
            setDetailRecordId(null);
            setPostFinanceRecord(rec);
          }}
        />
      )}

      {postFinanceRecord !== null && (
        <PostToFinanceModal
          record={postFinanceRecord}
          onClose={() => setPostFinanceRecord(null)}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ["hrOvertime"] });
          }}
        />
      )}
    </div>
  );
}

// ─── Ajukan Overtime (HRD) ────────────────────────────────────────────────────
function SubmitOvertimeModal({
  initialEmployee = null,
  initialMonth,
  initialYear,
  onClose,
}: {
  initialEmployee?: { id: number; full_name: string } | null;
  initialMonth?: number;
  initialYear?: number;
  onClose: () => void;
}) {
  const [employee, setEmployee] = useState<{ id: number; full_name: string } | null>(initialEmployee);
  const [pickingEmployee, setPickingEmployee] = useState(!initialEmployee);
  const [month, setMonth] = useState(initialMonth ?? (new Date().getMonth() + 1));
  const [year, setYear] = useState(initialYear ?? new Date().getFullYear());
  const [selected, setSelected] = useState<Record<string, { checked: boolean; notes: string }>>({});
  const [attachmentFileId, setAttachmentFileId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { data: candidates, isLoading: candidatesLoading } = useOvertimeCandidates(employee?.id, month, year);
  const { data: defaultRate } = useDefaultOvertimeRate();
  const submitMutation = useSubmitOvertime();

  useEffect(() => {
    if (candidates && candidates.length > 0) {
      setSelected((prev) => {
        const next = { ...prev };
        candidates.forEach((c) => {
          if (next[c.overtime_date] === undefined) {
            next[c.overtime_date] = { checked: true, notes: "" };
          }
        });
        return next;
      });
    }
  }, [candidates]);

  function toggleDay(date: string) {
    setSelected((prev) => ({
      ...prev,
      [date]: { checked: !prev[date]?.checked, notes: prev[date]?.notes ?? "" },
    }));
  }

  function setNotes(date: string, notes: string) {
    setSelected((prev) => ({ ...prev, [date]: { checked: prev[date]?.checked ?? false, notes } }));
  }

  function handleSubmit() {
    const days = Object.entries(selected)
      .filter(([, v]) => v.checked)
      .map(([date, v]) => ({ overtime_date: date, notes: v.notes || undefined }));

    if (!employee || days.length === 0) {
      setError("Pilih employee dan minimal 1 hari lembur.");
      return;
    }
    setError(null);

    submitMutation.mutate({ employee_id: employee.id, month, year, days, attachment_file_id: attachmentFileId ?? undefined }, {
      onSuccess: onClose,
      onError: (err: Error) => setError(extractErrorMessage(err)),
    });
  }

  const totalSelectedHours = (candidates ?? [])
    .filter((c) => selected[c.overtime_date]?.checked)
    .reduce((sum, c) => sum + Number(c.overtime_hours), 0);

  return (
    <Modal title="Ajukan Overtime" onClose={onClose} maxWidth={640}>
      <div style={{ marginBottom: "1rem" }}>
        <label className="input-label">Employee</label>
        {!employee || pickingEmployee ? (
          <EmployeePicker
            onSelect={(emp) => { setEmployee(emp); setPickingEmployee(false); setSelected({}); }}
            onCancel={() => setPickingEmployee(false)}
          />
        ) : (
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", padding: "0.5rem 0.7rem", background: "var(--bg-subtle)", borderRadius: 6 }}>
            <div style={{ flex: 1, fontSize: "0.85rem", fontWeight: 600 }}>{employee.full_name}</div>
            <button type="button" className="btn btn-secondary" style={{ fontSize: "0.78rem", padding: "0.3rem 0.6rem" }} onClick={() => setPickingEmployee(true)}>
              Ganti
            </button>
          </div>
        )}
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: "1rem" }}>
        <div style={{ flex: 1 }}>
          <label className="input-label">Bulan</label>
          <select className="input" style={{ width: "100%" }} value={month} onChange={(e) => { setMonth(parseInt(e.target.value)); setSelected({}); }}>
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i + 1} value={i + 1}>{String(i + 1).padStart(2, "0")}</option>
            ))}
          </select>
        </div>
        <div style={{ flex: 1 }}>
          <label className="input-label">Tahun</label>
          <select className="input" style={{ width: "100%" }} value={year} onChange={(e) => { setYear(parseInt(e.target.value)); setSelected({}); }}>
            {[2024, 2025, 2026, 2027].map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      {employee && (
        <div style={{ marginBottom: "1rem" }}>
          <label className="input-label">Kandidat Hari Lembur (dari selisih jam terjadwal vs actual)</label>
          {candidatesLoading && <LoadingState />}
          {!candidatesLoading && (candidates?.length ?? 0) === 0 && (
            <div style={{ fontSize: "0.82rem", color: "var(--grey)", padding: "0.6rem" }}>
              Tidak ada kandidat lembur untuk {employee.full_name} di periode {String(month).padStart(2, "0")}/{year} (tidak ada attendance dengan jam kerja melebihi jadwal).
            </div>
          )}
          {!candidatesLoading && (candidates?.length ?? 0) > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", maxHeight: 320, overflowY: "auto" }}>
              {candidates!.map((c) => {
                const state = selected[c.overtime_date];
                return (
                  <div key={c.overtime_date} style={{ border: "1px solid var(--border)", borderRadius: 8, padding: "0.6rem 0.75rem" }}>
                    <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" }}>
                      <input type="checkbox" checked={state?.checked ?? false} onChange={() => toggleDay(c.overtime_date)} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: "0.85rem", fontWeight: 600 }}>
                          {formatDate(c.overtime_date)} <span style={{ color: "var(--grey)", fontWeight: 400 }}>({c.shift_name ?? "—"})</span>
                        </div>
                        <div style={{ fontSize: "0.72rem", color: "var(--grey)" }}>
                          Terjadwal {c.scheduled_hours ?? "—"} jam · Actual {c.actual_hours ?? "—"} jam
                        </div>
                      </div>
                      <div style={{ fontWeight: 700, color: "var(--accent)", fontSize: "0.85rem" }}>+{c.overtime_hours} jam</div>
                    </label>
                    {state?.checked && (
                      <input className="input" placeholder="Keterangan (mis. handle insiden, closing bulanan)..."
                        value={state.notes} onChange={(e) => setNotes(c.overtime_date, e.target.value)}
                        style={{ width: "100%", marginTop: "0.5rem", fontSize: "0.82rem" }} />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {totalSelectedHours > 0 && (
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          fontSize: "0.85rem", marginBottom: "1rem", padding: "0.6rem 0.85rem",
          background: "var(--bg-subtle)", borderRadius: 8,
        }}>
          <div>Total diajukan: <strong style={{ color: "var(--accent)" }}>{totalSelectedHours.toFixed(2)} jam</strong></div>
          {defaultRate && (
            <div>
              Estimasi biaya ({formatCurrency(defaultRate.rate_per_hour)}/jam):{" "}
              <strong style={{ color: "var(--accent)" }}>{formatCurrency(totalSelectedHours * defaultRate.rate_per_hour)}</strong>
            </div>
          )}
        </div>
      )}

      <FileUploadField
        label="Bukti / Foto Lembur (opsional)"
        currentFileId={attachmentFileId}
        moduleCode="HrServiceSupport"
        referenceType="overtime_record"
        accept="image/*"
        onUploaded={(fileId) => setAttachmentFileId(fileId)}
        onRemove={() => setAttachmentFileId(null)}
      />

      {error && <div className="input-error" style={{ marginBottom: "1rem" }}>{error}</div>}

      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
        <button type="button" className="btn btn-secondary" onClick={onClose}>Batal</button>
        <Button onClick={handleSubmit} disabled={submitMutation.isPending || !employee}>
          {submitMutation.isPending ? "Mengajukan..." : "Ajukan untuk Approval"}
        </Button>
      </div>
    </Modal>
  );
}