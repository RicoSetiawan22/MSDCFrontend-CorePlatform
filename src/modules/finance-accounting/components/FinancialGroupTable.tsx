import { Fragment } from "react";
import { formatCurrency } from "@shared/lib/format";
import type { FinancialSubgroup } from "../types/balanceSheet";

interface FinancialGroupTableProps {
  groups: FinancialSubgroup[];
  total: number;
  totalLabel: string;
  emptyMessage: string;
}

/** Render "subgroup -> daftar akun -> subtotal" - bentuk data yang SAMA
 * persis dipakai balanceSheet() (per section: aset/liability/equity) dan
 * profitAndLoss() (per section: revenue/expense) di backend. */
export function FinancialGroupTable({ groups, total, totalLabel, emptyMessage }: FinancialGroupTableProps) {
  if (groups.length === 0) {
    return <div style={{ padding: "1.5rem", color: "var(--grey)", fontSize: "0.85rem" }}>{emptyMessage}</div>;
  }

  return (
    <table className="table" style={{ margin: 0 }}>
      <tbody>
        {groups.map((group) => (
          <Fragment key={group.subgroup}>
            <tr>
              <td colSpan={2} style={{ fontWeight: 700, fontSize: "0.78rem", color: "var(--grey-dark)", textTransform: "uppercase", letterSpacing: "0.02em", background: "#fafbfd" }}>
                {group.subgroup}
              </td>
            </tr>
            {group.accounts.map((acc) => (
              <tr key={acc.account_code}>
                <td style={{ paddingLeft: "2rem", fontSize: "0.85rem" }}>
                  <span style={{ fontFamily: "monospace", fontSize: "0.78rem", color: "var(--grey)" }}>{acc.account_code}</span> {acc.account_name}
                </td>
                <td style={{ textAlign: "right" }}>{formatCurrency(acc.amount)}</td>
              </tr>
            ))}
            <tr>
              <td style={{ paddingLeft: "2rem", fontSize: "0.82rem", fontStyle: "italic", color: "var(--grey-dark)" }}>Subtotal {group.subgroup}</td>
              <td style={{ textAlign: "right", fontStyle: "italic", color: "var(--grey-dark)" }}>{formatCurrency(group.subtotal)}</td>
            </tr>
          </Fragment>
        ))}
        <tr style={{ fontWeight: 700, background: "#fafbfd", borderTop: "2px solid var(--border)" }}>
          <td>{totalLabel}</td>
          <td style={{ textAlign: "right" }}>{formatCurrency(total)}</td>
        </tr>
      </tbody>
    </table>
  );
}
