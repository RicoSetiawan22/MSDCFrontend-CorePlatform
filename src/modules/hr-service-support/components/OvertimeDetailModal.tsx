import { Modal } from "@shared/components/Modal";
import { LoadingState } from "@shared/components/LoadingState";
import { formatDate, formatCurrency } from "@shared/lib/format";
import { useAuth } from "@shared/lib/auth-context";
import { useOvertimeRecord, useDefaultOvertimeRate } from "../api/useOvertime";
import type { OvertimeRecord } from "../types/overtime";
import {
  Clock, Calendar, CheckCircle2, AlertCircle, ArrowUpRight,
  ShieldCheck, ExternalLink,
} from "lucide-react";
import { Link } from "react-router-dom";

const NAVY = "#0A2140";
const NAVY_SOFT = "#4A5C74";
const GOLD = "#F2A602";
const GOLD_SOFT = "#FDF1D9";
const BORDER = "#E4E8EE";
const BG_PANEL = "#F7F8FA";
const GREEN = "#1BA672";
const GREEN_SOFT = "#E4F7EF";
const RED_SOFT = "#FCEAEA";
const BLUE_SOFT = "#E8EEF7";

interface OvertimeDetailModalProps {
  recordId: number;
  onClose: () => void;
  onOpenPostFinance?: (record: OvertimeRecord) => void;
}

export function OvertimeDetailModal({
  recordId,
  onClose,
  onOpenPostFinance,
}: OvertimeDetailModalProps) {
  const { user } = useAuth();
  const { data: record, isLoading } = useOvertimeRecord(recordId);
  const { data: defaultRate } = useDefaultOvertimeRate();

  const isManagerOrAdmin = user?.roles.some(
    (r) => r.toLowerCase().includes("manager") || r.toLowerCase().includes("admin")
  );

  return (
    <Modal title="Rincian Pengajuan Overtime" onClose={onClose} maxWidth={720}>
      {isLoading && (
        <div style={{ padding: "2.5rem 1rem", textAlign: "center" }}>
          <LoadingState />
        </div>
      )}

      {!isLoading && !record && (
        <div style={{ padding: "2rem", textAlign: "center", color: NAVY_SOFT }}>
          Data lembur tidak ditemukan atau telah dihapus.
        </div>
      )}

      {!isLoading && record && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          {/* Header Card */}
          <div style={{
            background: BG_PANEL,
            border: `1px solid ${BORDER}`,
            borderRadius: 12,
            padding: "1rem 1.25rem",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "1rem",
          }}>
            <div>
              <div style={{ fontSize: "0.75rem", fontWeight: 700, color: NAVY_SOFT, textTransform: "uppercase" }}>
                Karyawan
              </div>
              <div style={{ fontSize: "1.2rem", fontWeight: 800, color: NAVY, marginTop: 2 }}>
                {record.employee?.full_name ?? "—"}
              </div>
              <div style={{ fontSize: "0.8rem", color: NAVY_SOFT, marginTop: 2 }}>
                Periode: <strong>{String(record.period_month).padStart(2, "0")}/{record.period_year}</strong>
              </div>
            </div>

            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: "0.75rem", fontWeight: 700, color: NAVY_SOFT, textTransform: "uppercase" }}>
                Total Jam Lembur
              </div>
              <div style={{ fontSize: "1.5rem", fontWeight: 800, color: NAVY, marginTop: 2 }}>
                {(Number(record.overtime_hours) || 0).toFixed(2)}{" "}
                <span style={{ fontSize: "0.85rem", fontWeight: 600 }}>jam</span>
              </div>
              {defaultRate && (
                <div style={{ fontSize: "0.8rem", color: GOLD, fontWeight: 700 }}>
                  Est. Biaya: {formatCurrency((Number(record.overtime_hours) || 0) * defaultRate.rate_per_hour)}
                </div>
              )}
            </div>
          </div>

          {/* Workflow Status Explanation Box */}
          {record.status === "pending_approval" && (
            <div style={{
              background: GOLD_SOFT,
              border: `1px solid #E6B85C`,
              borderRadius: 10,
              padding: "0.9rem 1rem",
              fontSize: "0.82rem",
              color: "#7A4D00",
              lineHeight: 1.5,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, fontWeight: 700, marginBottom: 4 }}>
                <Clock size={16} /> Menunggu Persetujuan Manager (Workflow Engine)
              </div>
              <div>
                Pengajuan lembur ini sudah berhasil dikirimkan ke Workflow Engine dan saat ini berada dalam antrean persetujuan.
                Sesuai prinsip <em>Segregation of Duties</em>, tugas approval masuk ke halaman <strong>My Approvals</strong> milik pengguna dengan role <strong>Manager</strong>.
              </div>
              {isManagerOrAdmin && (
                <div style={{ marginTop: 8 }}>
                  <Link
                    to="/core-platform/my-approvals"
                    onClick={onClose}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                      background: GOLD,
                      color: "#fff",
                      padding: "0.35rem 0.75rem",
                      borderRadius: 6,
                      fontSize: "0.78rem",
                      fontWeight: 700,
                      textDecoration: "none",
                    }}
                  >
                    Buka My Approvals untuk Review <ExternalLink size={12} />
                  </Link>
                </div>
              )}
            </div>
          )}

          {record.status === "approved" && (
            <div style={{
              background: GREEN_SOFT,
              border: `1px solid #78D5B1`,
              borderRadius: 10,
              padding: "0.9rem 1rem",
              fontSize: "0.82rem",
              color: "#0E6B47",
              lineHeight: 1.5,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 8,
            }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, fontWeight: 700, marginBottom: 4 }}>
                  <CheckCircle2 size={16} /> Disetujui oleh Manager
                </div>
                <div>
                  Pengajuan telah disetujui
                  {record.approver?.full_name ? ` oleh ${record.approver.full_name}` : ""}
                  {record.approved_at ? ` pada ${formatDate(record.approved_at)}` : ""}.
                  Langkah selanjutnya adalah mem-posting data ini ke Finance untuk pencatatan beban lembur.
                </div>
              </div>
              {onOpenPostFinance && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenPostFinance(record);
                  }}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    background: GREEN,
                    color: "#fff",
                    border: "none",
                    padding: "0.45rem 0.85rem",
                    borderRadius: 8,
                    fontSize: "0.8rem",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  <ArrowUpRight size={14} /> Posting ke Finance
                </button>
              )}
            </div>
          )}

          {record.status === "rejected" && (
            <div style={{
              background: RED_SOFT,
              border: `1px solid #F5A3A3`,
              borderRadius: 10,
              padding: "0.9rem 1rem",
              fontSize: "0.82rem",
              color: "#9C2121",
              lineHeight: 1.5,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, fontWeight: 700, marginBottom: 4 }}>
                <AlertCircle size={16} /> Pengajuan Ditolak
              </div>
              <div>
                Alasan Penolakan: <strong>{record.rejection_reason || "Tidak ada alasan spesifik"}</strong>
              </div>
            </div>
          )}

          {record.status === "sent_to_finance" && (
            <div style={{
              background: BLUE_SOFT,
              border: `1px solid #B8CDE6`,
              borderRadius: 10,
              padding: "0.9rem 1rem",
              fontSize: "0.82rem",
              color: NAVY,
              lineHeight: 1.5,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, fontWeight: 700, marginBottom: 4 }}>
                <ShieldCheck size={16} /> Sudah Diposting ke Finance
              </div>
              <div>
                Data lembur ini telah diposting dan membentuk entri Jurnal Umum di Finance & Accounting
                {record.gl_journal_id ? ` (GL Journal #${record.gl_journal_id})` : ""}.
              </div>
            </div>
          )}

          {/* Audit / Submitter Information */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: 12,
            fontSize: "0.8rem",
          }}>
            <div style={{ border: `1px solid ${BORDER}`, borderRadius: 8, padding: "0.6rem 0.8rem" }}>
              <div style={{ color: NAVY_SOFT, fontSize: "0.72rem", fontWeight: 700 }}>DIAJUKAN OLEH</div>
              <div style={{ fontWeight: 700, color: NAVY, marginTop: 2 }}>
                {record.submitter?.full_name ?? "—"}
              </div>
              {record.submitted_at && (
                <div style={{ fontSize: "0.72rem", color: NAVY_SOFT }}>
                  {formatDate(record.submitted_at)}
                </div>
              )}
            </div>

            <div style={{ border: `1px solid ${BORDER}`, borderRadius: 8, padding: "0.6rem 0.8rem" }}>
              <div style={{ color: NAVY_SOFT, fontSize: "0.72rem", fontWeight: 700 }}>DISETUJUI OLEH</div>
              <div style={{ fontWeight: 700, color: NAVY, marginTop: 2 }}>
                {record.approver?.full_name ?? "Belum Disetujui"}
              </div>
              {record.approved_at && (
                <div style={{ fontSize: "0.72rem", color: NAVY_SOFT }}>
                  {formatDate(record.approved_at)}
                </div>
              )}
            </div>
          </div>

          {/* Table of Breakdown Days */}
          <div>
            <div style={{ fontSize: "0.88rem", fontWeight: 800, color: NAVY, marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
              <Calendar size={15} /> Rincian Hari Lembur
            </div>

            {(!record.days || record.days.length === 0) ? (
              <div style={{
                padding: "1.5rem",
                textAlign: "center",
                background: BG_PANEL,
                borderRadius: 8,
                fontSize: "0.8rem",
                color: NAVY_SOFT,
              }}>
                Tidak ada rincian per hari (total jam terakumulasi langsung di record).
              </div>
            ) : (
              <div style={{ border: `1px solid ${BORDER}`, borderRadius: 8, overflow: "hidden" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.8rem" }}>
                  <thead style={{ background: BG_PANEL }}>
                    <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
                      <th style={{ padding: "0.55rem 0.8rem", textAlign: "left", color: NAVY_SOFT, fontWeight: 700 }}>Tanggal</th>
                      <th style={{ padding: "0.55rem 0.8rem", textAlign: "center", color: NAVY_SOFT, fontWeight: 700 }}>Jadwal</th>
                      <th style={{ padding: "0.55rem 0.8rem", textAlign: "center", color: NAVY_SOFT, fontWeight: 700 }}>Aktual</th>
                      <th style={{ padding: "0.55rem 0.8rem", textAlign: "right", color: NAVY_SOFT, fontWeight: 700 }}>Jam Lembur</th>
                      <th style={{ padding: "0.55rem 0.8rem", textAlign: "left", color: NAVY_SOFT, fontWeight: 700 }}>Keterangan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {record.days.map((day) => (
                      <tr key={day.id} style={{ borderBottom: `1px solid ${BORDER}` }}>
                        <td style={{ padding: "0.55rem 0.8rem", fontWeight: 600, color: NAVY }}>
                          {formatDate(day.overtime_date)}
                        </td>
                        <td style={{ padding: "0.55rem 0.8rem", textAlign: "center", color: NAVY_SOFT }}>
                          {day.scheduled_hours !== null ? `${day.scheduled_hours} jam` : "—"}
                        </td>
                        <td style={{ padding: "0.55rem 0.8rem", textAlign: "center", color: NAVY_SOFT }}>
                          {day.actual_hours !== null ? `${day.actual_hours} jam` : "—"}
                        </td>
                        <td style={{ padding: "0.55rem 0.8rem", textAlign: "right", fontWeight: 700, color: NAVY }}>
                          +{day.overtime_hours} jam
                        </td>
                        <td style={{ padding: "0.55rem 0.8rem", color: NAVY_SOFT }}>
                          {day.notes || "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, paddingTop: 10, borderTop: `1px solid ${BORDER}` }}>
            <button type="button" className="btn btn-secondary" onClick={onClose} style={{ fontSize: "0.82rem" }}>
              Tutup
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}
