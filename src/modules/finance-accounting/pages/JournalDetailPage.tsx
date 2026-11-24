import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useGlJournal, usePostGlJournal, useReverseGlJournal } from "../api/useGlJournals";
import { Button } from "@shared/components/Button";
import { PageHeader } from "@shared/components/PageHeader";
import { formatCurrency, formatDate } from "@shared/lib/format";
import { extractErrorMessage } from "@shared/types/api";

export function JournalDetailPage() {
  const params = useParams<{ journalNumber: string }>();
  const navigate = useNavigate();
  const { data: journal, isLoading } = useGlJournal(params.journalNumber);
  const postMutation = usePostGlJournal();
  const reverseMutation = useReverseGlJournal();
  const [error, setError] = useState<string | null>(null);
  const [reverseReason, setReverseReason] = useState("");
  const [showReverseForm, setShowReverseForm] = useState(false);

  async function handlePost() {
    if (!params.journalNumber) return;
    setError(null);
    try {
      await postMutation.mutateAsync(params.journalNumber);
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  }

  async function handleReverse() {
    if (!params.journalNumber) return;
    setError(null);
    try {
      const res = await reverseMutation.mutateAsync({ journalNumber: params.journalNumber, reason: reverseReason || undefined });
      navigate(`/finance/gl/journals/${res.data.data.reversal_journal_number}`);
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  }

  if (isLoading || !journal) {
    return (
      <div>
        <PageHeader title="Detail Jurnal" subtitle="Memuat..." />
      </div>
    );
  }

  return (
    <div>
      <PageHeader title={journal.journal_number} subtitle={`${formatDate(journal.journal_date)} — ${journal.source_module} (${journal.entry_type === "manual" ? "Manual" : "Otomatis"})`} />

      <div style={{ padding: "0 2rem 2rem" }}>
        <div className="card" style={{ padding: "1.5rem", marginBottom: "1.25rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.25rem" }}>
            <div>
              <span className={`badge badge-${journal.status === "posted" ? "active" : journal.status === "reversed" ? "churned" : "prospect"}`}>
                {journal.status === "posted" ? "Posted" : journal.status === "reversed" ? "Reversed" : "Draft"}
              </span>
              {journal.reverses_journal_number && (
                <span style={{ marginLeft: "0.75rem", fontSize: "0.8rem", color: "var(--grey)" }}>
                  Pembalik dari <Link to={`/finance/gl/journals/${journal.reverses_journal_number}`} style={{ color: "var(--accent)" }}>{journal.reverses_journal_number}</Link>
                </span>
              )}
            </div>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              {journal.status === "draft" && (
                <Button onClick={handlePost} disabled={postMutation.isPending}>
                  {postMutation.isPending ? "Memproses..." : "Post Jurnal"}
                </Button>
              )}
              {journal.status === "posted" && !showReverseForm && (
                <Button variant="danger" onClick={() => setShowReverseForm(true)}>Reverse Jurnal</Button>
              )}
            </div>
          </div>

          {showReverseForm && (
            <div style={{ background: "var(--bad-bg)", padding: "1rem", borderRadius: 8, marginBottom: "1.25rem" }}>
              <label className="input-label">Alasan Reversal</label>
              <input className="input" value={reverseReason} onChange={(e) => setReverseReason(e.target.value)} placeholder="mis. Salah input akun" style={{ marginBottom: "0.75rem" }} />
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <Button variant="danger" onClick={handleReverse} disabled={reverseMutation.isPending}>
                  {reverseMutation.isPending ? "Memproses..." : "Konfirmasi Reverse"}
                </Button>
                <Button variant="secondary" onClick={() => setShowReverseForm(false)}>Batal</Button>
              </div>
            </div>
          )}

          {error && <div className="input-error" style={{ marginBottom: "1rem" }}>{error}</div>}

          <table className="table">
            <thead>
              <tr>
                <th>Akun</th>
                <th>Deskripsi</th>
                <th style={{ textAlign: "right" }}>Debit</th>
                <th style={{ textAlign: "right" }}>Kredit</th>
              </tr>
            </thead>
            <tbody>
              {journal.lines.map((line) => (
                <tr key={line.id}>
                  <td><span style={{ fontFamily: "monospace", fontSize: "0.8rem" }}>{line.account.account_code}</span> — {line.account.account_name}</td>
                  <td>{line.description ?? "—"}</td>
                  <td style={{ textAlign: "right" }}>{line.debit > 0 ? formatCurrency(line.debit) : "—"}</td>
                  <td style={{ textAlign: "right" }}>{line.credit > 0 ? formatCurrency(line.credit) : "—"}</td>
                </tr>
              ))}
              <tr style={{ fontWeight: 700 }}>
                <td colSpan={2}>Total</td>
                <td style={{ textAlign: "right" }}>{formatCurrency(journal.total_debit)}</td>
                <td style={{ textAlign: "right" }}>{formatCurrency(journal.total_credit)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
