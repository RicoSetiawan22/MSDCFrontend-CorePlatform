import { useState } from "react";
import { FileDown } from "lucide-react";
import { useArAgingReport, useDownloadAgingArPdf } from "../api/useArInvoices";
import { PageHeader } from "@shared/components/PageHeader";
import { EmptyState } from "@shared/components/EmptyState";
import { LoadingState } from "@shared/components/LoadingState";
import { LetterheadPdfModal } from "@shared/components/LetterheadPdfModal";
import { formatCurrency } from "@shared/lib/format";

/* Bucket definitions — shared by KPI row and table headers */
const BUCKETS: { key: "current" | "d1_30" | "d31_60" | "d61_90" | "d90_plus"; label: string; shortLabel: string; color: string; bgColor: string; borderColor: string; icon: string }[] = [
  { key: "current",  label: "Belum Jatuh Tempo", shortLabel: "Current",       color: "#1a7a49", bgColor: "#e6f7ed", borderColor: "#1a7a49", icon: "" },
  { key: "d1_30",   label: "1–30 Hari",         shortLabel: "1–30 Hari",     color: "#8a6d1d", bgColor: "#fff9e6", borderColor: "#c9a227", icon: "" },
  { key: "d31_60",  label: "31–60 Hari",        shortLabel: "31–60 Hari",    color: "#b5620a", bgColor: "#fff3e0", borderColor: "#e67e22", icon: "" },
  { key: "d61_90",  label: "61–90 Hari",         shortLabel: "61–90 Hari",    color: "#c0392b", bgColor: "#fdeaef", borderColor: "#e74c3c", icon: "" },
  { key: "d90_plus",label: "> 90 Hari",          shortLabel: "> 90 Hari",     color: "#922b21", bgColor: "#fdf0f0", borderColor: "#c0392b", icon: "" },
];

/**
 * Aging AR Report — piutang dikelompokkan per umur keterlambatan.
 * Makin ke kanan (makin merah) = makin berisiko tidak tertagih.
 */
export function ArAgingReportPage() {
  const [asOfDate, setAsOfDate] = useState("");
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const downloadPdfMutation = useDownloadAgingArPdf();

  const { data, isLoading } = useArAgingReport(asOfDate || undefined);

  /* ---------- KPI Card helper ---------- */
  function KpiCard({ bucket, amount }: { bucket: (typeof BUCKETS)[0]; amount: number }) {
    return (
      <div style={{
        flex: "1 1 0",
        minWidth: 160,
        padding: "1rem 1.1rem",
        background: bucket.bgColor,
        border: `2px solid ${bucket.borderColor}`,
        borderRadius: 12,
        display: "flex",
        flexDirection: "column",
        gap: "0.3rem",
      }}>
        {/* Icon + label row */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
          <span style={{ fontSize: "1rem" }}>{bucket.icon}</span>
          <span style={{ fontSize: "0.7rem", fontWeight: 600, color: bucket.color, textTransform: "uppercase", letterSpacing: "0.04em" }}>
            {bucket.shortLabel}
          </span>
        </div>
        {/* Amount */}
        <div style={{ fontSize: "1.05rem", fontWeight: 700, color: bucket.color, fontFamily: "'SF Mono', 'Fira Code', monospace" }}>
          {formatCurrency(amount)}
        </div>
      </div>
    );
  }

  /* ---------- Table header helper ---------- */
  function Th({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
    return <th style={{ padding: "0.7rem 1rem", textAlign: "right", fontSize: "0.78rem", fontWeight: 700, borderBottom: "2px solid var(--border)", whiteSpace: "nowrap", ...style }}>{children}</th>;
  }

  /* ---------- Table cell helper ---------- */
  function Td({ children, color }: { children: React.ReactNode; color?: string }) {
    return <td style={{ padding: "0.65rem 1rem", textAlign: "right", fontFamily: "'SF Mono', 'Fira Code', monospace", fontSize: "0.82rem", color: color ?? "inherit" }}>{children}</td>;
  }

  return (
    <div>
      <PageHeader
        title="Aging Piutang"
        subtitle="Piutang dikelompokkan per umur keterlambatan — semakin merah, semakin berisiko tidak tertagih."
      />

      {/* ── KPI Summary Row ─────────────────────────────────────── */}
      {data && (
        <div style={{ padding: "0 2rem 1rem" }} className="print-area">
          <div style={{ display: "flex", gap: "0.75rem", marginBottom: "0.85rem", flexWrap: "wrap" }}>
            {BUCKETS.map((b) => (
              <KpiCard key={b.key} bucket={b} amount={data.grand_total[b.key]} />
            ))}
          </div>

          {/* Total Outstanding Banner */}
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0.85rem 1.5rem",
            background: "linear-gradient(135deg, #1e88c7 0%, #e30f75 100%)",
            borderRadius: 12,
            color: "white",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <div style={{
                width: 40, height: 40, borderRadius: "50%",
                background: "rgba(255,255,255,0.2)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "1.2rem",
              }}>
                📋
              </div>
              <div>
                <div style={{ fontSize: "0.72rem", opacity: 0.85, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Total Outstanding Piutang
                </div>
                <div style={{ fontSize: "0.82rem", opacity: 0.7, marginTop: "0.1rem" }}>
                  {data.customers.length} customer{data.customers.length !== 1 ? "s" : ""} · per {asOfDate || "hari ini"}
                </div>
              </div>
            </div>
            <div style={{ fontSize: "1.65rem", fontWeight: 800, fontFamily: "'SF Mono', 'Fira Code', monospace", textShadow: "0 1px 4px rgba(0,0,0,0.2)" }}>
              {formatCurrency(data.grand_total.total)}
            </div>
          </div>
        </div>
      )}

      {/* ── Toolbar ──────────────────────────────────────────────── */}
      <div style={{ padding: "0 2rem 1rem" }} className="no-print">
        <div style={{ display: "flex", gap: "0.6rem", alignItems: "flex-end", flexWrap: "wrap" }}>
          {/* Date picker */}
          <div>
            <label className="input-label" style={{ marginBottom: "0.2rem" }}>Per Tanggal</label>
            <input
              className="input"
              type="date"
              style={{ width: 180 }}
              value={asOfDate}
              onChange={(e) => setAsOfDate(e.target.value)}
            />
          </div>

          {/* PDF button */}
          <button
            onClick={() => setIsPrintModalOpen(true)}
            disabled={!asOfDate}
            style={{
              display: "flex", alignItems: "center", gap: "0.4rem",
              padding: "0.5rem 1.1rem",
              background: asOfDate ? "var(--accent)" : "var(--grey)",
              color: "white",
              border: "none", borderRadius: 8,
              cursor: asOfDate ? "pointer" : "not-allowed",
              fontWeight: 600, fontSize: "0.85rem",
              transition: "background 0.15s",
            }}
            onMouseEnter={(e) => { if (asOfDate) (e.target as HTMLButtonElement).style.opacity = "0.85"; }}
            onMouseLeave={(e) => { (e.target as HTMLButtonElement).style.opacity = "1"; }}
          >
            <FileDown size={15} /> Cetak PDF
          </button>
        </div>
      </div>

      {/* ── Table ───────────────────────────────────────────────── */}
      <div style={{ padding: "0 2rem 2rem" }} className="print-area">
        <div className="content-card" style={{ padding: 0, overflowX: "auto" }}>
          {isLoading && <LoadingState label="Menghitung..." />}

          {data && data.customers.length === 0 && (
            <EmptyState
              title="Tidak Ada Piutang Outstanding"
              subtitle="Semua invoice sudah lunas per tanggal yang dipilih."
            />
          )}

          {data && data.customers.length > 0 && (
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
              <thead>
                <tr style={{ background: "#f8f9fc" }}>
                  <th style={{ padding: "0.8rem 1rem", textAlign: "left", fontWeight: 700, borderBottom: "2px solid var(--border)", color: "var(--grey-dark)", whiteSpace: "nowrap" }}>
                    Customer
                  </th>
                  {BUCKETS.map((b) => (
                    <Th key={b.key} style={{ color: b.color }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "0.3rem" }}>
                        <span>{b.icon}</span>
                        <span>{b.label}</span>
                      </div>
                    </Th>
                  ))}
                  <Th style={{ color: "var(--grey-dark)" }}>Total</Th>
                </tr>
              </thead>
              <tbody>
                {data.customers.map((c) => (
                  <tr key={c.customer_id} style={{ borderBottom: "1px solid var(--border)" }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#f8f9fc")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    <td style={{ padding: "0.65rem 1rem", fontWeight: 600, color: "var(--grey-dark)" }}>
                      {c.customer_name}
                    </td>
                    {BUCKETS.map((b) => (
                      <Td key={b.key} color={c[b.key] > 0 ? b.color : "var(--grey)"}>
                        {c[b.key] > 0 ? formatCurrency(c[b.key]) : "—"}
                      </Td>
                    ))}
                    <Td color="var(--grey-dark)">
                      <strong>{formatCurrency(c.total)}</strong>
                    </Td>
                  </tr>
                ))}

                {/* Grand Total row */}
                <tr style={{ background: "#1e2a3a", fontWeight: 700 }}>
                  <td style={{ padding: "0.8rem 1rem", color: "white", fontWeight: 700, fontSize: "0.85rem" }}>
                    Grand Total
                  </td>
                  {BUCKETS.map((b) => (
                    <td key={b.key} style={{
                      padding: "0.8rem 1rem",
                      textAlign: "right",
                      fontFamily: "'SF Mono', 'Fira Code', monospace",
                      fontSize: "0.85rem",
                      color: "white",
                      background: `${b.borderColor}33`,
                    }}>
                      {formatCurrency(data.grand_total[b.key])}
                    </td>
                  ))}
                  <td style={{
                    padding: "0.8rem 1rem",
                    textAlign: "right",
                    fontFamily: "'SF Mono', 'Fira Code', monospace",
                    fontSize: "0.95rem",
                    color: "white",
                  }}>
                    <strong>{formatCurrency(data.grand_total.total)}</strong>
                  </td>
                </tr>
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ── PDF Modal ─────────────────────────────────────────────── */}
      {isPrintModalOpen && (
        <LetterheadPdfModal
          title="Cetak PDF — Aging Piutang"
          onClose={() => setIsPrintModalOpen(false)}
          onDownload={(orgId) => downloadPdfMutation.mutateAsync({ asOfDate, organizationId: orgId })}
        />
      )}
    </div>
  );
}
