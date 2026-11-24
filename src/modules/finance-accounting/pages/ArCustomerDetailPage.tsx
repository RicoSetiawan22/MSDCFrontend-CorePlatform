import { useParams, Link } from "react-router-dom";
import { useArCustomerOutstanding } from "../api/useArCustomerProfiles";
import { PageHeader } from "@shared/components/PageHeader";
import { EmptyState } from "@shared/components/EmptyState";
import { LoadingState } from "@shared/components/LoadingState";
import { ErrorState } from "@shared/components/ErrorState";
import { formatCurrency, formatDate } from "@shared/lib/format";
import { extractErrorMessage } from "@shared/types/api";

export function ArCustomerDetailPage() {
  const params = useParams<{ customerId: string }>();
  const customerId = params.customerId ? Number(params.customerId) : undefined;
  const { data, isLoading, isError, error } = useArCustomerOutstanding(customerId);

  const usagePercent = data && data.credit_limit ? Math.min(100, Math.round((data.outstanding_balance / data.credit_limit) * 100)) : null;
  const usageColor = usagePercent === null ? "var(--grey)" : usagePercent >= 90 ? "var(--bad)" : usagePercent >= 70 ? "var(--warn-text)" : "var(--good)";

  return (
    <div>
      <PageHeader title={data ? data.customer_name : "Outstanding Balance"} subtitle="Saldo piutang & status kredit customer ini, dihitung langsung dari invoice outstanding." />

      <div style={{ padding: "0 2rem 1rem" }}>
        <Link to="/finance/ar/customers" style={{ fontSize: "0.85rem", color: "var(--accent)", textDecoration: "none" }}>← Kembali ke Credit Limit Customer</Link>
      </div>

      {isLoading && <LoadingState />}
      {isError && <ErrorState message={extractErrorMessage(error)} />}

      {data && (
        <div style={{ padding: "0 2rem 2rem" }}>
          {/* Kartu ringkasan kredit */}
          <div className="card" style={{ padding: "1.5rem", marginBottom: "1.25rem" }}>
            {data.is_credit_hold && (
              <div style={{ background: "var(--bad-bg)", color: "var(--bad)", padding: "0.6rem 0.9rem", borderRadius: 8, fontSize: "0.85rem", fontWeight: 600, marginBottom: "1.1rem" }}>
                ⚠ Customer ini sedang CREDIT HOLD — tidak boleh dapat invoice/PO baru sampai status ini dicabut.
              </div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1.5rem", marginBottom: data.credit_limit ? "1.25rem" : 0 }}>
              <div>
                <div style={{ fontSize: "0.75rem", color: "var(--grey)" }}>Outstanding Balance</div>
                <div style={{ fontSize: "1.3rem", fontWeight: 700 }}>{formatCurrency(data.outstanding_balance)}</div>
              </div>
              <div>
                <div style={{ fontSize: "0.75rem", color: "var(--grey)" }}>Credit Limit</div>
                <div style={{ fontSize: "1.3rem", fontWeight: 700 }}>{data.credit_limit !== null ? formatCurrency(data.credit_limit) : "Tidak diset"}</div>
              </div>
              <div>
                <div style={{ fontSize: "0.75rem", color: "var(--grey)" }}>Sisa Kredit Tersedia</div>
                <div style={{ fontSize: "1.3rem", fontWeight: 700, color: data.available_credit !== null && data.available_credit < 0 ? "var(--bad)" : "inherit" }}>
                  {data.available_credit !== null ? formatCurrency(data.available_credit) : "—"}
                </div>
              </div>
            </div>

            {usagePercent !== null && (
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "var(--grey)", marginBottom: "0.3rem" }}>
                  <span>Pemakaian Kredit</span>
                  <span>{usagePercent}%</span>
                </div>
                <div style={{ height: 8, background: "var(--border)", borderRadius: 999, overflow: "hidden" }}>
                  <div style={{ width: `${usagePercent}%`, height: "100%", background: usageColor, borderRadius: 999 }} />
                </div>
              </div>
            )}
          </div>

          {/* Daftar invoice outstanding */}
          <div className="content-card" style={{ margin: 0 }}>
            <div className="tabs">
              <button className="tab is-active">
                Invoice Outstanding
                <span className="tab__count">{data.invoice_count}</span>
              </button>
            </div>

            {data.invoices.length === 0 && (
              <EmptyState title="Tidak Ada Invoice Outstanding" subtitle="Semua invoice customer ini sudah lunas." />
            )}

            {data.invoices.length > 0 && (
              <table className="table">
                <thead>
                  <tr>
                    <th>No. Invoice</th>
                    <th>Jatuh Tempo</th>
                    <th style={{ textAlign: "right" }}>Total</th>
                    <th style={{ textAlign: "right" }}>Outstanding</th>
                  </tr>
                </thead>
                <tbody>
                  {data.invoices.map((inv) => (
                    <tr key={inv.invoice_number}>
                      <td style={{ fontFamily: "monospace", fontSize: "0.8rem" }}>{inv.invoice_number}</td>
                      <td>
                        {formatDate(inv.due_date)}
                        {inv.is_overdue && <span className="badge badge-churned" style={{ marginLeft: "0.4rem" }}>Telat {inv.days_overdue}h</span>}
                      </td>
                      <td style={{ textAlign: "right" }}>{formatCurrency(inv.total_amount)}</td>
                      <td style={{ textAlign: "right", fontWeight: 600 }}>{formatCurrency(inv.outstanding_amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
