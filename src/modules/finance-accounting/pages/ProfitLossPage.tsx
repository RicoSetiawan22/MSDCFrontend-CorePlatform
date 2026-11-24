import { useState } from "react";
import { FileDown, TrendingUp, TrendingDown, Percent } from "lucide-react";
import { useProfitAndLoss, useDownloadProfitLossPdf } from "../api/useFinancialReporting";
import { FinancialGroupTable } from "../components/FinancialGroupTable";
import { PageHeader } from "@shared/components/PageHeader";
import { LoadingState } from "@shared/components/LoadingState";
import { LetterheadPdfModal } from "@shared/components/LetterheadPdfModal";
import { CostCenterPicker } from "@shared/components/ui/CostCenterPicker";
import { ProfitCenterPicker } from "@shared/components/ui/ProfitCenterPicker";
import { formatCurrency } from "@shared/lib/format";

function firstDayOfMonth(): string {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
}
const TODAY = new Date().toISOString().slice(0, 10);

export function ProfitLossPage() {
  const [dateFrom, setDateFrom] = useState(firstDayOfMonth());
  const [dateTo, setDateTo] = useState(TODAY);
  const [costCenterId, setCostCenterId] = useState("");
  const [profitCenterId, setProfitCenterId] = useState("");
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const downloadPdfMutation = useDownloadProfitLossPdf();

  const { data, isLoading } = useProfitAndLoss({
    date_from: dateFrom,
    date_to: dateTo,
    cost_center_id: costCenterId ? Number(costCenterId) : undefined,
    profit_center_id: profitCenterId ? Number(profitCenterId) : undefined,
  });

  const isProfit = data ? data.net_income >= 0 : true;

  return (
    <div>
      <PageHeader
        title="Profit & Loss (Laba Rugi)"
        subtitle="Pendapatan dikurangi beban untuk 1 periode — bisa dipersempit per cost center atau profit center."
      />

      {/* Filter Bar */}
      <div className="pl-filter-bar no-print">
        <div className="pl-filter-bar__actions">
          <button
            onClick={() => setIsPrintModalOpen(true)}
            className="pl-btn pl-btn--primary"
          >
            <FileDown size={15} />
            Cetak PDF
          </button>
        </div>
        <div className="pl-filter-bar__fields">
          <div className="pl-field">
            <label className="input-label">Dari Tanggal *</label>
            <input
              className="input"
              type="date"
              style={{ width: 170 }}
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
          </div>
          <div className="pl-field">
            <label className="input-label">Sampai Tanggal *</label>
            <input
              className="input"
              type="date"
              style={{ width: 170 }}
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
          </div>
          <div className="pl-field">
            <label className="input-label">Cost Center (opsional)</label>
            <div className="pl-field-row">
              <CostCenterPicker
                value={costCenterId}
                onChange={setCostCenterId}
                placeholder="Semua cost center"
              />
              <button
                type="button"
                onClick={() => setCostCenterId("")}
                className="pl-btn-clear"
              >
                Clear
              </button>
            </div>
          </div>
          <div className="pl-field">
            <label className="input-label">Profit Center (opsional)</label>
            <div className="pl-field-row">
              <ProfitCenterPicker
                value={profitCenterId}
                onChange={setProfitCenterId}
                placeholder="Semua profit center"
              />
              <button
                type="button"
                onClick={() => setProfitCenterId("")}
                className="pl-btn-clear"
              >
                Clear
              </button>
            </div>
          </div>
        </div>
      </div>

      {isLoading && <LoadingState label="Menghitung..." />}

      {data && (
        <div className="pl-content">
          {/* KPI Row */}
          <div className="pl-kpi-row">
            <div className="pl-kpi-card pl-kpi-card--revenue">
              <div className="pl-kpi-card__icon">
                <TrendingUp size={22} />
              </div>
              <div className="pl-kpi-card__body">
                <span className="pl-kpi-card__label">Total Pendapatan</span>
                <span className="pl-kpi-card__value pl-kpi-card__value--good">
                  {formatCurrency(data.total_revenue)}
                </span>
              </div>
            </div>

            <div className="pl-kpi-card pl-kpi-card--expense">
              <div className="pl-kpi-card__icon">
                <TrendingDown size={22} />
              </div>
              <div className="pl-kpi-card__body">
                <span className="pl-kpi-card__label">Total Beban</span>
                <span className="pl-kpi-card__value pl-kpi-card__value--bad">
                  {formatCurrency(data.total_expense)}
                </span>
              </div>
            </div>

            <div className={`pl-kpi-card pl-kpi-card--net ${isProfit ? "pl-kpi-card--profit" : "pl-kpi-card--loss"}`}>
              <div className="pl-kpi-card__icon">
                {isProfit ? <TrendingUp size={22} /> : <TrendingDown size={22} />}
              </div>
              <div className="pl-kpi-card__body">
                <span className="pl-kpi-card__label">Laba Bersih</span>
                <span className={`pl-kpi-card__value ${isProfit ? "pl-kpi-card__value--good" : "pl-kpi-card__value--bad"}`}>
                  {formatCurrency(data.net_income)}
                </span>
              </div>
            </div>

            <div className={`pl-kpi-card pl-kpi-card--margin ${isProfit ? "pl-kpi-card--profit" : "pl-kpi-card--loss"}`}>
              <div className="pl-kpi-card__icon">
                <Percent size={22} />
              </div>
              <div className="pl-kpi-card__body">
                <span className="pl-kpi-card__label">Margin</span>
                <span className={`pl-kpi-card__value ${isProfit ? "pl-kpi-card__value--good" : "pl-kpi-card__value--bad"}`}>
                  {data.net_margin_pct !== null ? `${data.net_margin_pct}%` : "—"}
                </span>
              </div>
            </div>
          </div>

          {/* Data Tables */}
          <div className="pl-tables print-area">
            <div className="pl-tables__grid">
              <div className="pl-table-card">
                <div className="pl-table-card__header pl-table-card__header--revenue">
                  PENDAPATAN
                </div>
                <FinancialGroupTable
                  groups={data.revenue}
                  total={data.total_revenue}
                  totalLabel="TOTAL PENDAPATAN"
                  emptyMessage="Tidak ada pendapatan pada periode ini."
                />
              </div>
              <div className="pl-table-card">
                <div className="pl-table-card__header pl-table-card__header--expense">
                  BEBAN
                </div>
                <FinancialGroupTable
                  groups={data.expense}
                  total={data.total_expense}
                  totalLabel="TOTAL BEBAN"
                  emptyMessage="Tidak ada beban pada periode ini."
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {isPrintModalOpen && (
        <LetterheadPdfModal
          title="Cetak PDF — Laba Rugi"
          onClose={() => setIsPrintModalOpen(false)}
          onDownload={(orgId) =>
            downloadPdfMutation.mutateAsync({
              date_from: dateFrom,
              date_to: dateTo,
              organizationId: orgId,
              cost_center_id: costCenterId ? Number(costCenterId) : undefined,
              profit_center_id: profitCenterId ? Number(profitCenterId) : undefined,
            })
          }
        />
      )}
    </div>
  );
}
