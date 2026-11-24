import { useParams, Link } from "react-router-dom";
import { useApVendorOutstanding } from "../api/useApVendorProfiles";
import { PageHeader } from "@shared/components/PageHeader";
import { EmptyState } from "@shared/components/EmptyState";
import { LoadingState } from "@shared/components/LoadingState";
import { ErrorState } from "@shared/components/ErrorState";
import { formatCurrency, formatDate } from "@shared/lib/format";
import { extractErrorMessage } from "@shared/types/api";

export function ApVendorDetailPage() {
  const params = useParams<{ vendorId: string }>();
  const vendorId = params.vendorId ? Number(params.vendorId) : undefined;
  const { data, isLoading, isError, error } = useApVendorOutstanding(vendorId);

  return (
    <div>
      <PageHeader title={data ? data.vendor_name : "Outstanding Balance"} subtitle="Saldo hutang vendor ini, dihitung langsung dari bill outstanding." />

      <div style={{ padding: "0 2rem 1rem" }}>
        <Link to="/finance/ap/vendors" style={{ fontSize: "0.85rem", color: "var(--accent)", textDecoration: "none" }}>← Kembali ke Payment Term Vendor</Link>
      </div>

      {isLoading && <LoadingState />}
      {isError && <ErrorState message={extractErrorMessage(error)} />}

      {data && (
        <div style={{ padding: "0 2rem 2rem" }}>
          <div className="card" style={{ padding: "1.5rem", marginBottom: "1.25rem" }}>
            {data.is_hold && (
              <div style={{ background: "var(--bad-bg)", color: "var(--bad)", padding: "0.6rem 0.9rem", borderRadius: 8, fontSize: "0.85rem", fontWeight: 600, marginBottom: "1.1rem" }}>
                ⚠ Vendor ini sedang di-HOLD — bill baru tidak bisa dibuat kecuali di-override saat submit.
              </div>
            )}

            <div>
              <div style={{ fontSize: "0.75rem", color: "var(--grey)" }}>Outstanding Balance</div>
              <div style={{ fontSize: "1.6rem", fontWeight: 700 }}>{formatCurrency(data.outstanding_balance)}</div>
              <div style={{ fontSize: "0.78rem", color: "var(--grey)", marginTop: "0.2rem" }}>{data.bill_count} bill belum lunas</div>
            </div>
          </div>

          <div className="content-card" style={{ margin: 0 }}>
            <div className="tabs">
              <button className="tab is-active">
                Bill Outstanding
                <span className="tab__count">{data.bill_count}</span>
              </button>
            </div>

            {data.bills.length === 0 && (
              <EmptyState title="Tidak Ada Bill Outstanding" subtitle="Semua bill vendor ini sudah lunas." />
            )}

            {data.bills.length > 0 && (
              <table className="table">
                <thead>
                  <tr>
                    <th>No. Bill</th>
                    <th>Jatuh Tempo</th>
                    <th style={{ textAlign: "right" }}>Total</th>
                    <th style={{ textAlign: "right" }}>Outstanding</th>
                  </tr>
                </thead>
                <tbody>
                  {data.bills.map((bill) => (
                    <tr key={bill.bill_number}>
                      <td style={{ fontFamily: "monospace", fontSize: "0.8rem" }}>{bill.bill_number}</td>
                      <td>
                        {formatDate(bill.due_date)}
                        {bill.is_overdue && <span className="badge badge-churned" style={{ marginLeft: "0.4rem" }}>Telat {bill.days_overdue}h</span>}
                      </td>
                      <td style={{ textAlign: "right" }}>{formatCurrency(bill.total_amount)}</td>
                      <td style={{ textAlign: "right", fontWeight: 600 }}>{formatCurrency(bill.outstanding_amount)}</td>
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
