import { useState } from "react";
import { Link } from "react-router-dom";
import { FileDown, TrendingUp, TrendingDown } from "lucide-react";
import { useProfitComparison, useDownloadProfitCenterComparisonPdf } from "../api/useProfitCenters";
import { PageHeader } from "@shared/components/PageHeader";
import { EmptyState } from "@shared/components/EmptyState";
import { LoadingState } from "@shared/components/LoadingState";
import { LetterheadPdfModal } from "@shared/components/LetterheadPdfModal";
import { formatCurrency } from "@shared/lib/format";

/**
 * Wujud LANGSUNG dari kebutuhan: "Perusahaan memiliki Dedicated Server,
 * Colocation, Cloud, Managed Service, Internet Service - ERP dapat
 * mengetahui laba masing-masing layanan." Diurutkan dari laba TERBESAR
 * (lihat ProfitCenterService::profitComparison()), bar horizontal supaya
 * perbandingan antar lini layanan langsung kelihatan sekali pandang.
 */
export function ProfitCenterComparisonPage() {
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  const downloadPdfMutation = useDownloadProfitCenterComparisonPdf();
  const { data, isLoading } = useProfitComparison(dateFrom || undefined, dateTo || undefined);

  const maxRevenue = data ? Math.max(...data.profit_centers.map((p) => p.total_revenue), 1) : 1;

  return (
    <div>
      <style>{`
        @media print {
          @page { margin: 20mm 15mm; size: A4 landscape; }
          body * { visibility: hidden; }
          .print-area, .print-area * { visibility: visible; }
          .print-area { position: absolute; left: 0; top: 0; width: 100%; }
          .no-print { display: none !important; }
        }
      `}</style>

      <PageHeader title="Perbandingan Laba Antar Layanan" subtitle="Laba masing-masing lini layanan - Dedicated Server, Colocation, Cloud, dst." />

      <div className="content-card">
        <div className="toolbar no-print">
          <div>
            <label className="input-label" style={{ marginBottom: "0.2rem" }}>Dari Tanggal</label>
            <input className="input" type="date" style={{ width: 170 }} value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
          </div>
          <div>
            <label className="input-label" style={{ marginBottom: "0.2rem" }}>Sampai Tanggal</label>
            <input className="input" type="date" style={{ width: 170 }} value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
          </div>
          <button
            onClick={() => setIsPrintModalOpen(true)}
            style={{
              display: "flex", alignItems: "center", gap: "0.4rem",
              padding: "0.5rem 1rem",
              background: "var(--accent)", color: "white",
              border: "none", borderRadius: 8,
              cursor: "pointer",
              fontWeight: 600, fontSize: "0.85rem",
            }}
          >
            <FileDown size={15} /> Cetak PDF
          </button>
          {data && (
            <div style={{ marginLeft: "auto", textAlign: "right" }}>
              <div style={{ fontSize: "0.75rem", color: "var(--grey)" }}>Total Laba Bersih (Semua Layanan)</div>
              <div style={{ fontSize: "1.15rem", fontWeight: 700, color: data.grand_total.net_profit >= 0 ? "var(--good)" : "var(--bad)" }}>
                {formatCurrency(data.grand_total.net_profit)}
              </div>
            </div>
          )}
        </div>

        {isLoading && <LoadingState label="Menghitung..." />}

        {data && data.profit_centers.length === 0 && (
          <EmptyState title="Belum Ada Profit Center" subtitle="Daftarkan lini layanan dulu di halaman Profit Center." />
        )}

        {data && data.profit_centers.length > 0 && (
          <div style={{ padding: "0.5rem 1.5rem 1.5rem", display: "grid", gap: "0.9rem" }} className="print-area">
            {data.profit_centers.map((pc) => {
              const barWidth = Math.max(2, (pc.total_revenue / maxRevenue) * 100);
              const isProfit = pc.net_profit >= 0;
              return (
                <Link key={pc.profit_center_id} to={`/finance/profit-centers/${pc.profit_center_id}/report`} className="card" style={{ padding: "1.1rem 1.4rem", textDecoration: "none", color: "inherit", display: "block" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.6rem" }}>
                    <span style={{ fontWeight: 700, fontSize: "1rem" }}>{pc.name}</span>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                      {isProfit ? <TrendingUp size={15} color="var(--good)" /> : <TrendingDown size={15} color="var(--bad)" />}
                      <span style={{ fontWeight: 700, color: isProfit ? "var(--good)" : "var(--bad)" }}>{formatCurrency(pc.net_profit)}</span>
                      {pc.margin_pct !== null && <span style={{ fontSize: "0.78rem", color: "var(--grey)" }}>({pc.margin_pct}% margin)</span>}
                    </div>
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.78rem", color: "var(--grey)", marginBottom: "0.35rem" }}>
                    <span>Pendapatan: <strong style={{ color: "inherit" }}>{formatCurrency(pc.total_revenue)}</strong></span>
                    <span>Beban: <strong style={{ color: "inherit" }}>{formatCurrency(pc.total_expense)}</strong></span>
                  </div>

                  <div style={{ height: 10, background: "var(--border)", borderRadius: 999, overflow: "hidden", display: "flex" }}>
                    <div style={{ width: `${barWidth}%`, height: "100%", background: isProfit ? "var(--good)" : "var(--bad)", borderRadius: 999 }} />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {isPrintModalOpen && (
        <LetterheadPdfModal
          title="Cetak PDF — Perbandingan Laba Antar Layanan"
          onClose={() => setIsPrintModalOpen(false)}
          onDownload={(orgId) =>
            downloadPdfMutation.mutateAsync({
              organizationId: orgId,
              date_from: dateFrom || undefined,
              date_to: dateTo || undefined,
            })
          }
        />
      )}
    </div>
  );
}
