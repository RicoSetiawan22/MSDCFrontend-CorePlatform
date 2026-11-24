import { useState } from "react";
import { Plus, ArrowDownCircle, ArrowUpCircle, ArrowLeftRight } from "lucide-react";
import { useCbMutationList } from "../api/useCbMutations";
import { CbMutationModal } from "../components/CbMutationModal";
import { Button } from "@shared/components/Button";
import { Pagination } from "@shared/components/Pagination";
import { PageHeader } from "@shared/components/PageHeader";
import { EmptyState } from "@shared/components/EmptyState";
import { LoadingState } from "@shared/components/LoadingState";
import { formatCurrency, formatDate } from "@shared/lib/format";
import type { MutationType } from "../types/cbMutation";

const TABS = [
  { key: "" as MutationType | "", label: "Semua" },
  { key: "deposit" as MutationType, label: "Setoran" },
  { key: "withdrawal" as MutationType, label: "Penarikan" },
  { key: "transfer" as MutationType, label: "Transfer" },
];

const TYPE_COLOR: Record<MutationType, { color: string; bg: string }> = {
  deposit:    { color: "#15803d", bg: "#d9f2e6" },
  withdrawal: { color: "#dc2626", bg: "#fee2e2" },
  transfer:   { color: "#1d4ed8", bg: "#dbeafe" },
};

const TYPE_ICON: Record<MutationType, typeof ArrowDownCircle> = {
  deposit:    ArrowDownCircle,
  withdrawal: ArrowUpCircle,
  transfer:   ArrowLeftRight,
};

export function CbMutationListPage() {
  const [page, setPage] = useState(1);
  const [mutationType, setMutationType] = useState<MutationType | "">("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data, isLoading } = useCbMutationList({ page, per_page: 25, mutation_type: mutationType || undefined });

  const totalDeposit = data?.data.filter((m) => m.mutation_type === "deposit").reduce((s, m) => s + m.amount, 0) ?? 0;
  const totalWithdrawal = data?.data.filter((m) => m.mutation_type === "withdrawal").reduce((s, m) => s + m.amount, 0) ?? 0;

  return (
    <div>
      <PageHeader title="Mutasi Kas & Bank" subtitle="Setoran, penarikan, dan transfer antar akun kas/bank." />

      <div className="content-card">
        {/* Toolbar */}
        <div style={{ padding: "1rem 1.25rem", borderBottom: "1px solid var(--border)", display: "flex", gap: "0.75rem", alignItems: "center", flexWrap: "wrap" }}>
          {/* Filter chips */}
          <div style={{ display: "flex", gap: "0.4rem", flex: 1, flexWrap: "wrap" }}>
            {TABS.map((tab) => {
              const isActive = (mutationType || "") === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => { setMutationType(tab.key); setPage(1); }}
                  style={{
                    padding: "0.35rem 0.875rem", borderRadius: 20, cursor: "pointer",
                    border: `1px solid ${isActive ? "var(--accent)" : "var(--border)"}`,
                    background: isActive ? "var(--accent-light)" : "white",
                    color: isActive ? "var(--accent)" : "var(--grey)",
                    fontSize: "0.78rem", fontWeight: isActive ? 700 : 400,
                  }}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus size={15} /> Catat Mutasi
          </Button>
        </div>

        {/* Summary strip */}
        {data && data.data.length > 0 && (
          <div style={{ display: "flex", gap: "1.5rem", padding: "0.75rem 1.25rem", background: "var(--bg-subtle)", borderBottom: "1px solid var(--border)" }}>
            <div>
              <div style={{ fontSize: "0.68rem", color: "var(--grey)", textTransform: "uppercase", letterSpacing: "0.04em" }}>Total Setoran</div>
              <div style={{ fontSize: "0.9rem", fontWeight: 700, color: "#15803d", fontFamily: "monospace" }}>{formatCurrency(totalDeposit)}</div>
            </div>
            <div style={{ borderLeft: "1px solid var(--border)", paddingLeft: "1.5rem" }}>
              <div style={{ fontSize: "0.68rem", color: "var(--grey)", textTransform: "uppercase", letterSpacing: "0.04em" }}>Total Penarikan</div>
              <div style={{ fontSize: "0.9rem", fontWeight: 700, color: "#dc2626", fontFamily: "monospace" }}>{formatCurrency(totalWithdrawal)}</div>
            </div>
            <div style={{ borderLeft: "1px solid var(--border)", paddingLeft: "1.5rem" }}>
              <div style={{ fontSize: "0.68rem", color: "var(--grey)", textTransform: "uppercase", letterSpacing: "0.04em" }}>Net Kas Masuk</div>
              <div style={{ fontSize: "0.9rem", fontWeight: 700, fontFamily: "monospace", color: totalDeposit - totalWithdrawal >= 0 ? "var(--good)" : "var(--bad)" }}>
                {formatCurrency(totalDeposit - totalWithdrawal)}
              </div>
            </div>
          </div>
        )}

        {isLoading && <LoadingState />}
        {data && data.data.length === 0 && (
          <EmptyState title="Belum Ada Mutasi Tercatat" subtitle="Setoran, penarikan, dan transfer yang Anda catat akan ditampilkan di sini." />
        )}

        {data && data.data.length > 0 && (
          <>
            <table className="table">
              <thead>
                <tr>
                  <th style={{ width: 32 }}></th>
                  <th>No. Mutasi</th>
                  <th>Jenis</th>
                  <th>Dari Akun</th>
                  <th>Ke Akun</th>
                  <th>Tanggal</th>
                  <th style={{ textAlign: "right" }}>Jumlah</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {data.data.map((m) => {
                  const tc = TYPE_COLOR[m.mutation_type];
                  const Icon = TYPE_ICON[m.mutation_type];
                  return (
                    <tr key={m.id}>
                      <td>
                        <div style={{ width: 30, height: 30, borderRadius: 7, background: tc.bg, color: tc.color, display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <Icon size={15} />
                        </div>
                      </td>
                      <td>
                        <span style={{ fontFamily: "monospace", fontSize: "0.8rem", fontWeight: 600 }}>{m.mutation_number}</span>
                      </td>
                      <td>
                        <span style={{ fontSize: "0.78rem", fontWeight: 600, color: tc.color }}>{m.mutation_type === "deposit" ? "Setoran" : m.mutation_type === "withdrawal" ? "Penarikan" : "Transfer"}</span>
                      </td>
                      <td style={{ fontSize: "0.8rem", fontFamily: "monospace" }}>{m.from_account ? `${m.from_account.account_code} — ${m.from_account.account_name}` : "—"}</td>
                      <td style={{ fontSize: "0.8rem", fontFamily: "monospace" }}>{m.to_account ? `${m.to_account.account_code} — ${m.to_account.account_name}` : "—"}</td>
                      <td style={{ fontSize: "0.82rem" }}>{formatDate(m.mutation_date)}</td>
                      <td style={{ textAlign: "right", fontFamily: "monospace", fontWeight: 700 }}>{formatCurrency(m.amount)}</td>
                      <td>
                        <span className={`badge badge-${m.status === "posted" ? "active" : "churned"}`}>
                          {m.status === "posted" ? "Posted" : "Void"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div style={{ padding: "0 1.5rem" }}>
              <Pagination currentPage={data.current_page} lastPage={data.last_page} total={data.total} onPageChange={setPage} />
            </div>
          </>
        )}
      </div>

      {isModalOpen && <CbMutationModal onClose={() => setIsModalOpen(false)} />}
    </div>
  );
}
