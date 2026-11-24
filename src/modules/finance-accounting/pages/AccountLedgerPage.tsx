import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useAccountLedger } from "../api/useGlJournals";
import { PageHeader } from "@shared/components/PageHeader";
import { EmptyState } from "@shared/components/EmptyState";
import { LoadingState } from "@shared/components/LoadingState";
import { formatCurrency, formatDate } from "@shared/lib/format";

export function AccountLedgerPage() {
  const params = useParams<{ accountId: string }>();
  const accountId = params.accountId ? Number(params.accountId) : undefined;
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const { data, isLoading } = useAccountLedger(accountId, dateFrom || undefined, dateTo || undefined);

  return (
    <div>
      <PageHeader
        title={data ? `Buku Besar — ${data.account.account_code} ${data.account.account_name}` : "Buku Besar"}
        subtitle="Riwayat mutasi & saldo berjalan akun ini, dihitung langsung dari General Ledger."
      />

      <div style={{ padding: "0 2rem 1rem" }}>
        <Link to="/finance/accounts" style={{ fontSize: "0.85rem", color: "var(--accent)", textDecoration: "none" }}>← Kembali ke Chart of Accounts</Link>
      </div>

      <div className="content-card">
        <div className="toolbar">
          <div>
            <label className="input-label" style={{ marginBottom: "0.2rem" }}>Dari Tanggal</label>
            <input className="input" type="date" style={{ width: 170 }} value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
          </div>
          <div>
            <label className="input-label" style={{ marginBottom: "0.2rem" }}>Sampai Tanggal</label>
            <input className="input" type="date" style={{ width: 170 }} value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
          </div>
          {data && (
            <div style={{ marginLeft: "auto", textAlign: "right" }}>
              <div style={{ fontSize: "0.75rem", color: "var(--grey)" }}>Saldo Akhir</div>
              <div style={{ fontSize: "1.15rem", fontWeight: 700 }}>{formatCurrency(data.ending_balance)}</div>
            </div>
          )}
        </div>

        {isLoading && <LoadingState />}

        {data && data.lines.length === 0 && (
          <EmptyState title="Belum Ada Mutasi" subtitle="Belum ada jurnal posted yang menyentuh akun ini pada rentang tanggal yang dipilih." />
        )}

        {data && data.lines.length > 0 && (
          <table className="table">
            <thead>
              <tr>
                <th>Tanggal</th>
                <th>No. Jurnal</th>
                <th>Deskripsi</th>
                <th>Sumber</th>
                <th style={{ textAlign: "right" }}>Debit</th>
                <th style={{ textAlign: "right" }}>Kredit</th>
                <th style={{ textAlign: "right" }}>Saldo Berjalan</th>
              </tr>
            </thead>
            <tbody>
              {data.lines.map((line, i) => (
                <tr key={i}>
                  <td>{formatDate(line.journal_date)}</td>
                  <td>
                    <Link to={`/finance/gl/journals/${line.journal_number}`} style={{ color: "var(--accent)", textDecoration: "none", fontFamily: "monospace", fontSize: "0.8rem" }}>
                      {line.journal_number}
                    </Link>
                  </td>
                  <td>{line.description ?? "—"}</td>
                  <td style={{ fontSize: "0.8rem", color: "var(--grey)" }}>{line.source_module}</td>
                  <td style={{ textAlign: "right" }}>{line.debit > 0 ? formatCurrency(line.debit) : "—"}</td>
                  <td style={{ textAlign: "right" }}>{line.credit > 0 ? formatCurrency(line.credit) : "—"}</td>
                  <td style={{ textAlign: "right", fontWeight: 600 }}>{formatCurrency(line.running_balance)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
