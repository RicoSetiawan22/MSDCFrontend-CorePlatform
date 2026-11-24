import { useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Ban } from "lucide-react";
import { useApBillList, useVoidApBill } from "../api/useApBills";
import { Button } from "@shared/components/Button";
import { Pagination } from "@shared/components/Pagination";
import { PageHeader } from "@shared/components/PageHeader";
import { EmptyState } from "@shared/components/EmptyState";
import { LoadingState } from "@shared/components/LoadingState";
import { formatCurrency, formatDate } from "@shared/lib/format";
import type { ApBill, BillStatus } from "../types/apBill";

const STATUS_LABEL: Record<BillStatus, string> = {
  draft: "Draft",
  posted: "Terposting",
  paid: "Lunas",
  partially_paid: "Sebagian Lunas",
  void: "Dibatalkan",
};

export function ApBillListPage() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<BillStatus | "">("");

  const { data, isLoading } = useApBillList({ page, per_page: 10, status: status || undefined });

  return (
    <div>
      <PageHeader title="AP Bill" subtitle="Kelola tagihan hutang ke vendor - Accounts Payable." />

      <div className="content-card">
        <div className="tabs">
          <button className="tab is-active">
            Semua Bill
            <span className="tab__count">{data?.total ?? 0}</span>
          </button>
        </div>

        <div className="toolbar">
          <select className="input" style={{ maxWidth: 180 }} value={status} onChange={(e) => { setStatus(e.target.value as BillStatus | ""); setPage(1); }}>
            <option value="">Semua Status</option>
            {Object.entries(STATUS_LABEL).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
          <Link to="/finance/ap-bills/new" style={{ marginLeft: "auto" }}>
            <Button><Plus size={15} /> Bill Baru</Button>
          </Link>
        </div>

        {isLoading && <LoadingState />}

        {data && data.data.length === 0 && (
          <EmptyState title="Belum Ada Bill Tercatat" subtitle="Bill dari vendor yang Anda buat akan ditampilkan di sini." />
        )}

        {data && data.data.length > 0 && (
          <>
            <table className="table">
              <thead>
                <tr>
                  <th>No. Bill</th>
                  <th>Vendor</th>
                  <th>Jatuh Tempo</th>
                  <th>Total</th>
                  <th>Sisa Bayar</th>
                  <th>Status</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {data.data.map((bill) => (
                  <BillRow key={bill.id} bill={bill} />
                ))}
              </tbody>
            </table>
            <div style={{ padding: "0 1.5rem" }}>
              <Pagination currentPage={data.current_page} lastPage={data.last_page} total={data.total} onPageChange={setPage} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function BillRow({ bill }: { bill: ApBill }) {
  const voidMutation = useVoidApBill();

  return (
    <tr>
      <td style={{ fontFamily: "monospace", fontSize: "0.8rem" }}>{bill.bill_number}</td>
      <td>{bill.vendor_name}</td>
      <td>
        {formatDate(bill.due_date)}
        {bill.is_overdue && <span className="badge badge-churned" style={{ marginLeft: "0.4rem" }}>Telat {bill.days_overdue}h</span>}
      </td>
      <td>{formatCurrency(bill.total_amount)}</td>
      <td>{formatCurrency(bill.outstanding_amount)}</td>
      <td><span className={`badge badge-${bill.status === "paid" ? "active" : bill.status === "void" ? "churned" : "prospect"}`}>{STATUS_LABEL[bill.status]}</span></td>
      <td>
        {(bill.status === "draft" || bill.status === "posted") && (
          <button
            onClick={() => { if (confirm(`Batalkan bill ${bill.bill_number}?`)) voidMutation.mutate(bill.id); }}
            disabled={voidMutation.isPending}
            style={{ border: "none", background: "none", color: "var(--bad)", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.3rem", fontSize: "0.78rem", fontWeight: 600 }}
          >
            <Ban size={13} /> Void
          </button>
        )}
      </td>
    </tr>
  );
}
