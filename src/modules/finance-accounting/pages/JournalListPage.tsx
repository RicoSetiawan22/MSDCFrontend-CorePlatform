import { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Plus, FileDown, ChevronDown, ChevronRight, Lock } from "lucide-react";
import { useGlJournalList, useJournalSummary } from "../api/useGlJournals";
import { JournalFormModal } from "../components/JournalFormModal";
import { PrintGeneralJournalModal } from "../components/PrintGeneralJournalModal";
import { Button } from "@shared/components/Button";
import { Pagination } from "@shared/components/Pagination";
import { PageHeader } from "@shared/components/PageHeader";
import { EmptyState } from "@shared/components/EmptyState";
import { LoadingState } from "@shared/components/LoadingState";
import { formatCurrency, formatDate } from "@shared/lib/format";
import type { JournalStatus } from "../types/glJournal";

const STATUS_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
  draft:    { color: "#d97706", bg: "#fef3c7", label: "Draft" },
  posted:   { color: "#16a34a", bg: "#dcfce7", label: "Posted" },
  reversed: { color: "#7c3aed", bg: "#ede9fe", label: "Reversed" },
};

const SOURCE_COLORS: Record<string, string> = {
  FinanceAccounting: "#1d4ed8",
  CRMSales: "#16a34a",
  Inventory: "#b45309",
  Procurement: "#7c3aed",
  FixedAsset: "#0891b2",
  Payroll: "#dc2626",
  default: "#6b7280",
};

const BULAN = [
  { value: "01", label: "Januari" },   { value: "02", label: "Februari" },
  { value: "03", label: "Maret" },     { value: "04", label: "April" },
  { value: "05", label: "Mei" },       { value: "06", label: "Juni" },
  { value: "07", label: "Juli" },      { value: "08", label: "Agustus" },
  { value: "09", label: "September" }, { value: "10", label: "Oktober" },
  { value: "11", label: "November" },  { value: "12", label: "Desember" },
];

function firstDayOf(year: number, month: string) { return `${year}-${month}-01`; }
function lastDayOf(year: number, month: string) {
  const d = new Date(year, parseInt(month), 0);
  return `${year}-${month}-${String(d.getDate()).padStart(2, "0")}`;
}

interface JournalLine {
  account_code: string;
  account_name: string;
  description: string | null;
  debit: number;
  credit: number;
}

interface JournalEntry {
  journal_number: string;
  journal_date: string;
  description: string | null;
  source_module: string;
  status: JournalStatus;
  total_debit: number;
  line_count: number;
  lines: JournalLine[];
}

function JournalCard({ journal }: { journal: JournalEntry }) {
  const [expanded, setExpanded] = useState(false);
  const cfg = STATUS_CONFIG[journal.status] ?? STATUS_CONFIG.draft;
  const sourceColor = SOURCE_COLORS[journal.source_module] ?? SOURCE_COLORS.default;

  return (
    <div style={{ border: "1px solid var(--border)", borderRadius: 10, overflow: "hidden", marginBottom: "0.5rem" }}>
      {/* Header */}
      <div
        style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.75rem 1rem", background: expanded ? "#f8fafc" : "white", cursor: "pointer", borderLeft: `4px solid ${cfg.color}` }}
        onClick={() => setExpanded(!expanded)}
      >
        <span style={{ color: "var(--grey)" }}>{expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}</span>

        <div style={{ minWidth: 150 }}>
          <div style={{ fontFamily: "monospace", fontSize: "0.8rem", fontWeight: 700 }}>
            <Link to={`/finance/gl/journals/${journal.journal_number}`} onClick={(e) => e.stopPropagation()} style={{ color: "var(--accent)", textDecoration: "none" }}>
              {journal.journal_number}
            </Link>
          </div>
          <div style={{ fontSize: "0.7rem", color: "var(--grey)" }}>{formatDate(journal.journal_date)}</div>
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: "0.82rem", color: "#374151", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {journal.description ?? "—"}
          </div>
          <div style={{ fontSize: "0.7rem", color: "var(--grey)", marginTop: 2 }}>
            {journal.line_count} baris akun
          </div>
        </div>

        <span style={{ fontSize: "0.68rem", fontWeight: 700, background: sourceColor + "22", color: sourceColor, padding: "2px 8px", borderRadius: 4, border: `1px solid ${sourceColor}44` }}>
          {journal.source_module}
        </span>

        <div style={{ fontFamily: "monospace", fontSize: "0.9rem", fontWeight: 700, color: "#1a1a1a", minWidth: 140, textAlign: "right" }}>
          {formatCurrency(journal.total_debit)}
        </div>

        <span style={{ display: "inline-block", padding: "3px 10px", borderRadius: 12, fontSize: "0.72rem", fontWeight: 700, background: cfg.bg, color: cfg.color, minWidth: 70, textAlign: "center" }}>
          {cfg.label}
        </span>
      </div>

      {/* Expanded lines */}
      {expanded && journal.lines.length > 0 && (
        <div style={{ borderTop: "1px solid var(--border)", background: "#fafbfc", padding: "0.5rem 1rem 0.75rem 2.5rem" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.78rem" }}>
            <thead>
              <tr>
                <th style={{ padding: "3px 8px", textAlign: "left", color: "var(--grey)", fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.04em", borderBottom: "1px solid var(--border)", width: 90 }}>Kode</th>
                <th style={{ padding: "3px 8px", textAlign: "left", color: "var(--grey)", fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.04em", borderBottom: "1px solid var(--border)" }}>Nama Akun</th>
                <th style={{ padding: "3px 8px", textAlign: "left", color: "var(--grey)", fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.04em", borderBottom: "1px solid var(--border)" }}>Memo</th>
                <th style={{ padding: "3px 8px", textAlign: "right", color: "var(--grey)", fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.04em", borderBottom: "1px solid var(--border)", width: 120 }}>Debit</th>
                <th style={{ padding: "3px 8px", textAlign: "right", color: "var(--grey)", fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.04em", borderBottom: "1px solid var(--border)", width: 120 }}>Kredit</th>
              </tr>
            </thead>
            <tbody>
              {journal.lines.map((line, i) => (
                <tr key={i}>
                  <td style={{ padding: "3px 8px", fontFamily: "monospace", fontSize: "0.75rem", color: "#6b7280" }}>{line.account_code || "—"}</td>
                  <td style={{ padding: "3px 8px", fontSize: "0.78rem" }}>{line.account_name}</td>
                  <td style={{ padding: "3px 8px", color: "var(--grey)", fontSize: "0.75rem", fontStyle: "italic" }}>{line.description ?? "—"}</td>
                  <td style={{ padding: "3px 8px", textAlign: "right", fontFamily: "monospace", fontWeight: 600, color: line.debit > 0 ? "#1d4ed8" : "#d1d5db" }}>
                    {line.debit > 0 ? formatCurrency(line.debit) : "—"}
                  </td>
                  <td style={{ padding: "3px 8px", textAlign: "right", fontFamily: "monospace", fontWeight: 600, color: line.credit > 0 ? "#7c3aed" : "#d1d5db" }}>
                    {line.credit > 0 ? formatCurrency(line.credit) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export function JournalListPage() {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = String(now.getMonth() + 1).padStart(2, "0");

  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<JournalStatus | "">("");
  const [bulan, setBulan] = useState(currentMonth);
  const [tahun, setTahun] = useState(String(currentYear));
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const navigate = useNavigate();

  const dateFrom = firstDayOf(parseInt(tahun), bulan);
  const dateTo   = lastDayOf(parseInt(tahun), bulan);

  const { data, isLoading } = useGlJournalList({
    page, per_page: 25,
    status: status || undefined,
    date_from: dateFrom,
    date_to: dateTo,
  });

  // Summary API — ALL data (not paginated) for KPI totals
  const { data: summary } = useJournalSummary(dateFrom, dateTo);

  // Group raw rows into journal entries
  const journals: JournalEntry[] = useMemo(() => {
    if (!data) return [];
    const map = new Map<string, JournalEntry>();
    for (const line of data.data) {
      const existing = map.get(line.journal_number);
      const lineEntry: JournalLine = {
        account_code: (line as any).account?.account_code ?? "—",
        account_name: (line as any).account?.account_name ?? "(Tanpa nama)",
        description: line.description,
        debit: Number(line.debit ?? 0),
        credit: Number(line.credit ?? 0),
      };
      if (existing) {
        existing.lines.push(lineEntry);
        existing.total_debit += Number(line.debit ?? 0);
        existing.line_count++;
      } else {
        map.set(line.journal_number, {
          journal_number: line.journal_number,
          journal_date: line.journal_date,
          description: line.description,
          source_module: line.source_module ?? "",
          status: line.status,
          total_debit: Number(line.debit ?? 0),
          line_count: 1,
          lines: [lineEntry],
        });
      }
    }
    return Array.from(map.values());
  }, [data]);

  // KPI from summary API (ALL journals, not page)
  const stats = useMemo(() => {
    const totalJournals = (summary?.manual?.journal_count ?? 0) + (summary?.automatic?.journal_count ?? 0);
    const totalAmount = (summary?.manual?.total_amount ?? 0) + (summary?.automatic?.total_amount ?? 0);
    const postedCount = journals.filter((j) => j.status === "posted").length;
    const draftCount = journals.filter((j) => j.status === "draft").length;
    const reversedCount = journals.filter((j) => j.status === "reversed").length;
    const postedAmount = journals.filter((j) => j.status === "posted").reduce((s, j) => s + j.total_debit, 0);
    const sources: Record<string, number> = {};
    for (const j of journals) {
      sources[j.source_module] = (sources[j.source_module] ?? 0) + 1;
    }
    return { total: totalJournals, posted: postedCount, draft: draftCount, reversed: reversedCount, totalAmount, postedAmount, sources };
  }, [summary, journals]);

  return (
    <div>
      <PageHeader
        title="Jurnal Umum"
        subtitle="Seluruh transaksi akuntansi yang diposting — dari semua modul (AR, AP, GL, Fixed Asset, dll)."
      />

      {/* KPI Row */}
      {journals.length > 0 && (
        <div style={{ padding: "0 2rem 1rem" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "0.6rem" }}>
            {[
              { label: "Total Jurnal", value: `${stats.total} jurnal`, bg: "#f5f5f5", border: "#1a1a1a", text: "#1a1a1a" },
              { label: "Posted", value: `${stats.posted} jurnal`, bg: "#f0fdf4", border: "#16a34a", text: "#16a34a" },
              { label: "Draft", value: `${stats.draft} jurnal`, bg: "#fffbeb", border: "#d97706", text: "#d97706" },
              { label: "Reversed", value: `${stats.reversed} jurnal`, bg: "#f5f3ff", border: "#7c3aed", text: "#7c3aed" },
              { label: "Total Posted", value: formatCurrency(stats.postedAmount), bg: "#eff6ff", border: "#1d4ed8", text: "#1d4ed8" },
            ].map((k) => (
              <div key={k.label} style={{ background: k.bg, border: `2px solid ${k.border}`, borderRadius: 8, padding: "0.75rem 1rem", textAlign: "center" }}>
                <div style={{ fontSize: "0.62rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "#666", marginBottom: "0.2rem" }}>{k.label}</div>
                <div style={{ fontSize: "1rem", fontWeight: 800, color: k.text, fontFamily: "monospace" }}>{k.value}</div>
              </div>
            ))}
          </div>

          {/* Source breakdown */}
          {Object.keys(stats.sources).length > 1 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem", marginTop: "0.6rem" }}>
              {Object.entries(stats.sources).map(([src, count]) => (
                <div key={src} style={{ display: "flex", alignItems: "center", gap: 5, background: (SOURCE_COLORS[src] ?? "#6b7280") + "22", border: `1px solid ${SOURCE_COLORS[src] ?? "#6b7280"}44`, borderRadius: 20, padding: "3px 10px" }}>
                  <div style={{ width: 7, height: 7, borderRadius: "50%", background: SOURCE_COLORS[src] ?? "#6b7280" }} />
                  <span style={{ fontSize: "0.72rem", color: SOURCE_COLORS[src] ?? "#6b7280", fontWeight: 600 }}>{src}</span>
                  <span style={{ fontSize: "0.72rem", color: SOURCE_COLORS[src] ?? "#6b7280", fontWeight: 800 }}>{count}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Toolbar */}
      <div style={{ padding: "0 2rem 1rem" }}>
        <div style={{ display: "flex", gap: "1rem", alignItems: "flex-end", flexWrap: "wrap" }}>
          <div>
            <label className="input-label" style={{ marginBottom: "0.2rem", display: "block" }}>Bulan</label>
            <select className="input" style={{ width: 140 }} value={bulan} onChange={(e) => { setBulan(e.target.value); setPage(1); }}>
              {BULAN.map((b) => <option key={b.value} value={b.value}>{b.label}</option>)}
            </select>
          </div>
          <div>
            <label className="input-label" style={{ marginBottom: "0.2rem", display: "block" }}>Tahun</label>
            <select className="input" style={{ width: 100 }} value={tahun} onChange={(e) => { setTahun(e.target.value); setPage(1); }}>
              {Array.from({ length: 5 }, (_, i) => currentYear - i).map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <div>
            <label className="input-label" style={{ marginBottom: "0.2rem", display: "block" }}>Status</label>
            <select className="input" style={{ width: 130 }} value={status} onChange={(e) => { setStatus(e.target.value as JournalStatus | ""); setPage(1); }}>
              <option value="">Semua</option>
              <option value="posted">Posted</option>
              <option value="draft">Draft</option>
              <option value="reversed">Reversed</option>
            </select>
          </div>
          <div style={{ marginLeft: "auto", display: "flex", gap: "0.5rem" }}>
            <Button variant="secondary" onClick={() => setIsPrintModalOpen(true)}>
              <FileDown size={15} /> Cetak PDF
            </Button>
            <Button variant="secondary" onClick={() => navigate("/finance/gl/closing-entries")}>
              <Lock size={15} /> Jurnal Penutup
            </Button>
            <Button onClick={() => setIsModalOpen(true)}>
              <Plus size={15} /> Jurnal Manual
            </Button>
          </div>
        </div>
      </div>

      {/* Journal list */}
      <div style={{ padding: "0 2rem 2rem" }}>
        <div style={{ marginBottom: "0.75rem", fontSize: "0.78rem", color: "var(--grey)" }}>
          {journals.length > 0
            ? `${journals.length} jurnal ditampilkan — Total semua jurnal periode ini: Rp ${stats.totalAmount.toLocaleString("id-ID")}`
            : "Memuat..."}
        </div>

        {isLoading && <LoadingState label="Memuat jurnal..." />}

        {!isLoading && journals.length === 0 && (
          <EmptyState
            title="Tidak Ada Jurnal"
            subtitle={`Tidak ada jurnal untuk ${BULAN.find((b) => b.value === bulan)?.label} ${tahun}.`}
          />
        )}

        {!isLoading && journals.length > 0 && (
          <>
            {journals.map((j) => <JournalCard key={j.journal_number} journal={j} />)}
            <div style={{ paddingTop: "0.75rem" }}>
              <Pagination
                currentPage={page}
                lastPage={data?.last_page ?? 1}
                total={data?.total ?? 0}
                onPageChange={setPage}
              />
            </div>
          </>
        )}
      </div>

      {isModalOpen && <JournalFormModal onClose={() => setIsModalOpen(false)} />}
      {isPrintModalOpen && (
        <PrintGeneralJournalModal
          onClose={() => setIsPrintModalOpen(false)}
          initialDateFrom={dateFrom}
          initialDateTo={dateTo}
        />
      )}
    </div>
  );
}
