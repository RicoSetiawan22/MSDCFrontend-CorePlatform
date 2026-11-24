import { useState } from "react";
import { Link } from "react-router-dom";
import { Server, BatteryCharging, Fuel, Network, Router as RouterIcon, Building2, Layers, Package, FileDown } from "lucide-react";
import { useFixedAssetList, useDownloadDepreciationSchedulePdf } from "../api/useFixedAssets";
import { PageHeader } from "@shared/components/PageHeader";
import { EmptyState } from "@shared/components/EmptyState";
import { LoadingState } from "@shared/components/LoadingState";
import { LetterheadPdfModal } from "@shared/components/LetterheadPdfModal";
import { formatCurrency, formatDate } from "@shared/lib/format";
import type { AssetCategory } from "../types/fixedAsset";

const CATEGORY_CONFIG: Record<AssetCategory, { label: string; icon: typeof Server; color: string }> = {
  rack:       { label: "Rack",         icon: Layers,          color: "#7c3aed" },
  ups:        { label: "UPS",          icon: BatteryCharging,  color: "#b45309" },
  generator:  { label: "Generator",    icon: Fuel,            color: "#dc2626" },
  server:     { label: "Server",       icon: Server,          color: "#1d4ed8" },
  switch:     { label: "Switch",       icon: Network,         color: "#0891b2" },
  router:     { label: "Router",       icon: RouterIcon,      color: "#0f766e" },
  building:   { label: "Bangunan",     icon: Building2,        color: "#92400e" },
  other:      { label: "Lainnya",      icon: Package,         color: "#374151" },
};

const TODAY = new Date().toISOString().slice(0, 10);

export function DepreciationSchedulePage() {
  const [page, setPage] = useState(1);
  const [category, setCategory] = useState<AssetCategory | "">("");
  const [status, setStatus] = useState("in_service");
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const downloadPdfMutation = useDownloadDepreciationSchedulePdf();

  const { data, isLoading } = useFixedAssetList({
    page,
    per_page: 50,
    asset_category: category || undefined,
    status: (status || undefined) as "in_service" | "disposed" | undefined,
  });

  const assets = data?.data ?? [];
  const totalMonthlyDepr = assets.reduce((s, a) => s + Number(a.book_value_summary?.monthly_depreciation ?? 0), 0);
  const totalAccumDepr = assets.reduce((s, a) => s + Number(a.book_value_summary?.accumulated_depreciation ?? 0), 0);
  const totalNbv = assets.reduce((s, a) => s + Number(a.book_value_summary?.book_value ?? 0), 0);

  function exportCsv() {
    const headers = ["Asset Code", "Asset Name", "Category", "Purchase Price", "Salvage Value", "Depreciable Amount", "Useful Life (months)", "Monthly Depr.", "Accumulated Depr.", "Net Book Value", "Purchase Date"];
    const rows = assets.map((a) => [
      a.asset_number, a.asset_name,
      CATEGORY_CONFIG[a.asset_category]?.label ?? a.asset_category,
      a.purchase_price ?? 0, a.salvage_value ?? 0,
      (a.purchase_price ?? 0) - (a.salvage_value ?? 0),
      a.useful_life_months ?? 0,
      a.book_value_summary?.monthly_depreciation ?? 0,
      a.book_value_summary?.accumulated_depreciation ?? 0,
      a.book_value_summary?.book_value ?? 0,
      formatDate(a.purchase_date ?? ""),
    ]);
    const csv = [headers, ...rows]
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `depreciation-schedule-${TODAY}.csv`; a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <PageHeader
        title="Depreciation Schedule"
        subtitle="Jadwal depresiasi seluruh aset tetap — monthly breakdown, akumulasi, dan nilai buku berjalan."
      />

      {/* KPI Cards */}
      {data && assets.length > 0 && (
        <div style={{ padding: "0 2rem 1rem" }} className="print-area">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem", marginBottom: "1.25rem" }}>
            {[
              { label: "Total Monthly Depreciation", value: formatCurrency(totalMonthlyDepr), color: "var(--grey-dark)" },
              { label: "Total Accumulated Depreciation", value: formatCurrency(totalAccumDepr), color: "var(--bad)" },
              { label: "Total Net Book Value", value: formatCurrency(totalNbv), color: "var(--good)" },
            ].map((kpi) => (
              <div key={kpi.label} className="stat-cell" style={{ textAlign: "center" }}>
                <div style={{ fontSize: "0.68rem", color: "var(--grey)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "0.3rem" }}>{kpi.label}</div>
                <div style={{ fontSize: "1.1rem", fontWeight: 700, fontFamily: "monospace", color: kpi.color }}>{kpi.value}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ padding: "0 2rem 1rem" }} className="no-print">
        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem", flexWrap: "wrap" }}>
          <button onClick={() => setIsPrintModalOpen(true)} style={{ display: "flex", alignItems: "center", gap: "0.4rem", padding: "0.5rem 1rem", background: "var(--accent)", color: "white", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 600, fontSize: "0.85rem" }}>
            <FileDown size={15} /> Cetak PDF
          </button>
          <button onClick={exportCsv} style={{ display: "flex", alignItems: "center", gap: "0.4rem", padding: "0.5rem 1rem", background: "white", color: "var(--accent)", border: "1px solid var(--accent)", borderRadius: 8, cursor: "pointer", fontWeight: 600, fontSize: "0.85rem" }}>
            📥 Export CSV
          </button>
        </div>
        <div style={{ display: "flex", gap: "1rem", alignItems: "flex-end" }}>
          <div>
            <label className="input-label" style={{ marginBottom: "0.2rem" }}>Kategori</label>
            <select className="input" style={{ width: 150 }} value={category} onChange={(e) => { setCategory(e.target.value as AssetCategory | ""); setPage(1); }}>
              <option value="">Semua</option>
              {(Object.entries(CATEGORY_CONFIG) as [AssetCategory, typeof CATEGORY_CONFIG[AssetCategory]][]).map(([k, cfg]) => (
                <option key={k} value={k}>{cfg.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="input-label" style={{ marginBottom: "0.2rem" }}>Status</label>
            <select className="input" style={{ width: 130 }} value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
              <option value="">Semua</option>
              <option value="in_service">Aktif</option>
              <option value="disposed">Disposed</option>
            </select>
          </div>
        </div>
      </div>

      <div className="print-area">
        <div className="content-card">
          {isLoading && <LoadingState />}
          {data && assets.length === 0 && <EmptyState title="Tidak Ada Aset" subtitle="Tidak ada aset tetap untuk jadwal depresiasi." />}
          {data && assets.length > 0 && (
            <table className="table">
              <thead>
                <tr>
                  <th>Asset Code</th>
                  <th>Asset Name</th>
                  <th>Category</th>
                  <th style={{ textAlign: "right" }}>Purchase Price</th>
                  <th style={{ textAlign: "right" }}>Salvage Value</th>
                  <th style={{ textAlign: "right" }}>Depreciable Amount</th>
                  <th style={{ textAlign: "right" }}>Useful Life (months)</th>
                  <th style={{ textAlign: "right" }}>Monthly Depr.</th>
                  <th style={{ textAlign: "right" }}>Accumulated Depr.</th>
                  <th style={{ textAlign: "right" }}>Net Book Value</th>
                  <th>Purchase Date</th>
                </tr>
              </thead>
              <tbody>
                {assets.map((asset) => {
                  const cfg = CATEGORY_CONFIG[asset.asset_category];
                  const purchPrice = Number(asset.purchase_price ?? 0);
                  const salvage = Number(asset.salvage_value ?? 0);
                  const deprAmount = purchPrice - salvage;
                  return (
                    <tr key={asset.id}>
                      <td>
                        <Link to={`/finance/assets/${asset.id}`} style={{ color: "var(--accent)", textDecoration: "none", fontFamily: "monospace", fontSize: "0.8rem", fontWeight: 700 }}>
                          {asset.asset_number}
                        </Link>
                      </td>
                      <td style={{ fontSize: "0.82rem", fontWeight: 600 }}>{asset.asset_name}</td>
                      <td>
                        <span style={{ fontSize: "0.75rem", fontWeight: 600, color: cfg?.color }}>
                          {cfg?.label ?? asset.asset_category}
                        </span>
                      </td>
                      <td style={{ textAlign: "right", fontFamily: "monospace", fontSize: "0.8rem" }}>{formatCurrency(purchPrice)}</td>
                      <td style={{ textAlign: "right", fontFamily: "monospace", fontSize: "0.8rem" }}>{formatCurrency(salvage)}</td>
                      <td style={{ textAlign: "right", fontFamily: "monospace", fontSize: "0.8rem" }}>{formatCurrency(deprAmount)}</td>
                      <td style={{ textAlign: "right", fontSize: "0.8rem" }}>{asset.useful_life_months ?? 0}</td>
                      <td style={{ textAlign: "right", fontFamily: "monospace", fontSize: "0.8rem" }}>{formatCurrency(asset.book_value_summary?.monthly_depreciation ?? 0)}</td>
                      <td style={{ textAlign: "right", fontFamily: "monospace", fontSize: "0.8rem", color: "var(--bad)" }}>{formatCurrency(asset.book_value_summary?.accumulated_depreciation ?? 0)}</td>
                      <td style={{ textAlign: "right", fontFamily: "monospace", fontSize: "0.8rem", fontWeight: 700, color: "var(--good)" }}>{formatCurrency(asset.book_value_summary?.book_value ?? 0)}</td>
                      <td style={{ fontSize: "0.8rem" }}>{formatDate(asset.purchase_date ?? "")}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
      {isPrintModalOpen && (
        <LetterheadPdfModal
          title="Cetak PDF — Jadwal Depresiasi"
          onClose={() => setIsPrintModalOpen(false)}
          onDownload={(orgId) => downloadPdfMutation.mutateAsync({ organizationId: orgId, asset_category: category || undefined, status: status || undefined })}
        />
      )}
    </div>
  );
}
