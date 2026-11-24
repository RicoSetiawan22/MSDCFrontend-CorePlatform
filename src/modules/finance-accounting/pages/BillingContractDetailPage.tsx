import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { CheckCircle2, SkipForward, XCircle, PauseCircle, PlayCircle, XSquare, ExternalLink } from "lucide-react";
import { useBillingContract, useBillingHistory, useSuspendBillingContract, useReactivateBillingContract, useTerminateBillingContract } from "../api/useBillingContracts";
import { Button } from "@shared/components/Button";
import { PageHeader } from "@shared/components/PageHeader";
import { EmptyState } from "@shared/components/EmptyState";
import { LoadingState } from "@shared/components/LoadingState";
import { formatCurrency, formatDate } from "@shared/lib/format";
import { extractErrorMessage } from "@shared/types/api";
import type { BillingContractStatus } from "../types/billingContract";

const STATUS_LABEL: Record<BillingContractStatus, string> = {
  active: "Aktif",
  suspended: "Suspended",
  terminated: "Terminated",
};

export function BillingContractDetailPage() {
  const params = useParams<{ contractId: string }>();
  const contractId = params.contractId ? Number(params.contractId) : undefined;
  const { data: contract, isLoading } = useBillingContract(contractId);
  const { data: history, isLoading: isLoadingHistory } = useBillingHistory(contractId);
  const [error, setError] = useState<string | null>(null);

  const suspendMutation = useSuspendBillingContract();
  const reactivateMutation = useReactivateBillingContract();
  const terminateMutation = useTerminateBillingContract();

  async function handleStatusChange(action: "suspend" | "reactivate" | "terminate") {
    if (!contractId) return;
    setError(null);
    try {
      if (action === "suspend") await suspendMutation.mutateAsync(contractId);
      else if (action === "reactivate") await reactivateMutation.mutateAsync(contractId);
      else {
        if (!confirm("Terminasi kontrak ini? Tindakan ini TIDAK BISA dibatalkan - kontrak tidak akan pernah ditagih lagi.")) return;
        await terminateMutation.mutateAsync(contractId);
      }
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  }

  return (
    <div>
      <PageHeader title={contract ? contract.contract_number : "Detail Kontrak Billing"} subtitle={contract ? contract.customer_name : "Memuat..."} />

      <div style={{ padding: "0 2rem 1rem" }}>
        <Link to="/finance/billing/contracts" style={{ fontSize: "0.85rem", color: "var(--accent)", textDecoration: "none" }}>← Kembali ke Billing Integration</Link>
      </div>

      {isLoading && <LoadingState />}

      {contract && (
        <div style={{ padding: "0 2rem 2rem" }}>
          <div className="card" style={{ padding: "1.5rem", marginBottom: "1.25rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.25rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <span className={`badge badge-${contract.status === "active" ? "active" : contract.status === "terminated" ? "churned" : "inactive"}`}>
                  {STATUS_LABEL[contract.status]}
                </span>
                {contract.crm_contract_id ? (
                  <Link to={`/crm-sales/contracts/${contract.crm_contract_id}`} target="_blank"
                    style={{ display: "flex", alignItems: "center", gap: "0.3rem", fontSize: "0.8rem", color: "var(--accent)", textDecoration: "none", fontWeight: 600 }}>
                    Lihat Contract di CRM <ExternalLink size={13} />
                  </Link>
                ) : (
                  <span style={{ fontSize: "0.78rem", color: "var(--warn-text, #b45309)" }}>⚠ Tidak terhubung ke Contract CRM (dibuat manual)</span>
                )}
              </div>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                {contract.status === "active" && (
                  <Button variant="secondary" onClick={() => handleStatusChange("suspend")} disabled={suspendMutation.isPending}>
                    <PauseCircle size={15} /> Suspend
                  </Button>
                )}
                {contract.status === "suspended" && (
                  <Button variant="secondary" onClick={() => handleStatusChange("reactivate")} disabled={reactivateMutation.isPending}>
                    <PlayCircle size={15} /> Aktifkan Lagi
                  </Button>
                )}
                {contract.status !== "terminated" && (
                  <Button variant="danger" onClick={() => handleStatusChange("terminate")} disabled={terminateMutation.isPending}>
                    <XSquare size={15} /> Terminasi
                  </Button>
                )}
              </div>
            </div>

            {error && <div className="input-error" style={{ marginBottom: "1rem" }}>{error}</div>}

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1.25rem" }}>
              <div>
                <div style={{ fontSize: "0.75rem", color: "var(--grey)" }}>Layanan</div>
                <div style={{ fontWeight: 600 }}>{contract.service_description}</div>
              </div>
              <div>
                <div style={{ fontSize: "0.75rem", color: "var(--grey)" }}>Tagihan per Bulan</div>
                <div style={{ fontWeight: 600 }}>{formatCurrency(contract.monthly_amount)}{contract.tax_rate ? ` + ${contract.tax_rate}% pajak` : ""}</div>
              </div>
              <div>
                <div style={{ fontSize: "0.75rem", color: "var(--grey)" }}>Akun Pendapatan</div>
                <div style={{ fontWeight: 600, fontFamily: "monospace", fontSize: "0.85rem" }}>{contract.revenue_account.account_code} — {contract.revenue_account.account_name}</div>
              </div>
              <div>
                <div style={{ fontSize: "0.75rem", color: "var(--grey)" }}>Periode Kontrak</div>
                <div style={{ fontWeight: 600 }}>{formatDate(contract.start_date)} {contract.end_date ? `s/d ${formatDate(contract.end_date)}` : "(tanpa batas)"}</div>
              </div>
              <div>
                <div style={{ fontSize: "0.75rem", color: "var(--grey)" }}>Payment Term</div>
                <div style={{ fontWeight: 600 }}>Net {contract.payment_term_days} hari</div>
              </div>
              <div>
                <div style={{ fontSize: "0.75rem", color: "var(--grey)" }}>Terakhir Ditagih</div>
                <div style={{ fontWeight: 600 }}>{contract.last_billed_period ?? "Belum pernah"}</div>
              </div>
            </div>
          </div>

          <div className="content-card" style={{ margin: 0 }}>
            <div className="tabs">
              <button className="tab is-active">Riwayat Billing</button>
            </div>

            {isLoadingHistory && <LoadingState label="Memuat riwayat..." />}

            {history && history.length === 0 && (
              <EmptyState title="Belum Ada Riwayat Billing" subtitle="Jalankan billing bulanan untuk kontrak ini supaya invoice mulai ter-generate." />
            )}

            {history && history.length > 0 && (
              <table className="table">
                <thead>
                  <tr>
                    <th>Periode</th>
                    <th>Status</th>
                    <th>Invoice</th>
                    <th style={{ textAlign: "right" }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((h, i) => (
                    <tr key={i}>
                      <td>{formatDate(h.period_date)}</td>
                      <td>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem", fontSize: "0.82rem" }}>
                          {h.status === "success" && <CheckCircle2 size={14} color="var(--good)" />}
                          {h.status === "skipped" && <SkipForward size={14} color="var(--warn-text)" />}
                          {h.status === "failed" && <XCircle size={14} color="var(--bad)" />}
                          {h.status === "success" ? "Berhasil" : h.status === "skipped" ? "Dilewati" : "Gagal"}
                        </span>
                        {h.message && <div style={{ fontSize: "0.72rem", color: "var(--grey)" }}>{h.message}</div>}
                      </td>
                      <td>
                        {h.invoice ? (
                          <Link to="/finance/ar-invoices" style={{ color: "var(--accent)", textDecoration: "none", fontFamily: "monospace", fontSize: "0.8rem" }}>
                            {h.invoice.invoice_number}
                          </Link>
                        ) : "—"}
                      </td>
                      <td style={{ textAlign: "right" }}>{h.invoice ? formatCurrency(h.invoice.total_amount) : "—"}</td>
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
