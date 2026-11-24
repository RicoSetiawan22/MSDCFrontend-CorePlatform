import { useState } from "react";
import { Plus } from "lucide-react";
import { useArPaymentList } from "../api/useArPayments";
import { ArPaymentModal } from "../components/ArPaymentModal";
import { Button } from "@shared/components/Button";
import { Pagination } from "@shared/components/Pagination";
import { PageHeader } from "@shared/components/PageHeader";
import { EmptyState } from "@shared/components/EmptyState";
import { LoadingState } from "@shared/components/LoadingState";
import { formatCurrency, formatDate } from "@shared/lib/format";
import type { PaymentStatus } from "../types/arPayment";

const METHOD_LABEL: Record<string, string> = {
  cash: "Tunai",
  bank_transfer: "Transfer Bank",
  virtual_account: "Virtual Account",
  other: "Lainnya",
};

export function ArPaymentListPage() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<PaymentStatus | "">("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data, isLoading } = useArPaymentList({ page, per_page: 25, status: status || undefined });

  return (
    <div>
      <PageHeader title="Pembayaran Customer" subtitle="Riwayat pembayaran piutang - piutang berkurang begitu pembayaran tercatat." />

      <div className="content-card">
        <div className="tabs">
          <button className="tab is-active">
            Semua Pembayaran
            <span className="tab__count">{data?.total ?? 0}</span>
          </button>
        </div>

        <div className="toolbar">
          <select className="input" style={{ maxWidth: 160 }} value={status} onChange={(e) => { setStatus(e.target.value as PaymentStatus | ""); setPage(1); }}>
            <option value="">Semua Status</option>
            <option value="posted">Posted</option>
            <option value="void">Void</option>
          </select>
          <Button style={{ marginLeft: "auto" }} onClick={() => setIsModalOpen(true)}><Plus size={15} /> Catat Pembayaran</Button>
        </div>

        {isLoading && <LoadingState />}

        {data && data.data.length === 0 && (
          <EmptyState title="Belum Ada Pembayaran Tercatat" subtitle="Pembayaran yang Anda catat akan ditampilkan di sini." />
        )}

        {data && data.data.length > 0 && (
          <>
            <table className="table">
              <thead>
                <tr>
                  <th>No. Pembayaran</th>
                  <th>Customer</th>
                  <th>Tanggal</th>
                  <th>Metode</th>
                  <th style={{ textAlign: "right" }}>Jumlah</th>
                  <th>Dialokasikan Ke</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {data.data.map((p) => (
                  <tr key={p.id}>
                    <td style={{ fontFamily: "monospace", fontSize: "0.8rem" }}>{p.payment_number}</td>
                    <td>{p.customer_name}</td>
                    <td>{formatDate(p.payment_date)}</td>
                    <td style={{ fontSize: "0.85rem" }}>{METHOD_LABEL[p.payment_method] ?? p.payment_method}</td>
                    <td style={{ textAlign: "right" }}>{formatCurrency(p.amount)}</td>
                    <td style={{ fontSize: "0.8rem", color: "var(--grey)" }}>
                      {p.allocations.length > 0 ? `${p.allocations.length} invoice` : "—"}
                    </td>
                    <td><span className={`badge badge-${p.status === "posted" ? "active" : "churned"}`}>{p.status === "posted" ? "Posted" : "Void"}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ padding: "0 1.5rem" }}>
              <Pagination currentPage={data.current_page} lastPage={data.last_page} total={data.total} onPageChange={setPage} />
            </div>
          </>
        )}
      </div>

      {isModalOpen && <ArPaymentModal onClose={() => setIsModalOpen(false)} />}
    </div>
  );
}
