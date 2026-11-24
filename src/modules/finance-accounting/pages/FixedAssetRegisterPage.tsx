import { useState } from "react";
import { Link } from "react-router-dom";
import { Server, BatteryCharging, Fuel, Network, Router as RouterIcon, Building2, Layers, Package, FileDown } from "lucide-react";
import { useFixedAssetList, useDownloadFixedAssetsPdf } from "../api/useFixedAssets";
import { PageHeader } from "@shared/components/PageHeader";
import { EmptyState } from "@shared/components/EmptyState";
import { LoadingState } from "@shared/components/LoadingState";
import { Pagination } from "@shared/components/Pagination";
import { LetterheadPdfModal } from "@shared/components/LetterheadPdfModal";
import { formatCurrency, formatDate } from "@shared/lib/format";
import type { AssetCategory } from "../types/fixedAsset";

const CATEGORY_CONFIG: Record<AssetCategory, { label: string; icon: typeof Server; color: string; bg: string }> = {
  rack:       { label: "Rack",         icon: Layers,          color: "#7c3aed", bg: "#ede9fe" },
  ups:        { label: "UPS",          icon: BatteryCharging,  color: "#b45309", bg: "#fef3c7" },
  generator:  { label: "Generator",    icon: Fuel,            color: "#dc2626", bg: "#fee2e2" },
  server:     { label: "Server",       icon: Server,          color: "#1d4ed8", bg: "#dbeafe" },
  switch:     { label: "Switch",       icon: Network,         color: "#0891b2", bg: "#cffafe" },
  router:     { label: "Router",       icon: RouterIcon,      color: "#0f766e", bg: "#ccfbf1" },
  building:   { label: "Bangunan",     icon: Building2,        color: "#92400e", bg: "#fef3c7" },
  other:      { label: "Lainnya",      icon: Package,         color: "#374151", bg: "#f3f4f6" },
};

const TODAY = new Date().toISOString().slice(0, 10);

export function FixedAssetRegisterPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<AssetCategory | "">("");
  const [status, setStatus] = useState("");
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const downloadPdfMutation = useDownloadFixedAssetsPdf();

  const { data, isLoading } = useFixedAssetList({
    page,
    per_page: 20,
    search: search || undefined,
    asset_category: category || undefined,
    status: (status || undefined) as "in_service" | "disposed" | undefined,
  });

  const assets = data?.data ?? [];
  const totalAssetsValue = assets.reduce((s, a) => s + Number(a.purchase_price ?? 0), 0);
  const totalNbv = assets.reduce((s, a) => s + Number(a.book_value_summary?.book_value ?? 0), 0);
  const totalAccumDepr = assets.reduce((s, a) => s + Number(a.book_value_summary?.accumulated_depreciation ?? 0), 0);
function exportCsv() {
    const headers = [
      "Asset Number", "Asset Name", "Category", "Location", "Purchase Date",
      "Purchase Price", "Useful Life (months)", "Salvage Value",
      "Accumulated Depreciation", "Monthly Depreciation", "Net Book Value", "Status",
    ];
    const rows = assets.map((a) => [
      a.asset_number, a.asset_name,
      CATEGORY_CONFIG[a.asset_category]?.label ?? a.asset_category,
      a.location ?? "", formatDate(a.purchase_date ?? ""),
      a.purchase_price ?? 0,
      a.useful_life_months ?? 0,
      a.salvage_value ?? 0,
      a.book_value_summary?.accumulated_depreciation ?? 0,
      a.book_value_summary?.monthly_depreciation ?? 0,
      a.book_value_summary?.book_value ?? 0,
      a.status === "in_service" ? "Aktif" : "Disposed",
    ]);
    const csv = [headers, ...rows]
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `fixed-asset-register-${TODAY}.csv`; a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <PageHeader
        title="Fixed Asset Register"
        subtitle="Master daftar seluruh aset tetap — harga beli, lokasi, umur pakai, depresiasi, dan nilai buku."
      />

      <div style={{ padding: "0 2rem 1.25rem" }} className="no-print">
        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem", flexWrap: "wrap" }}>
          <button onClick={() => setIsPrintModalOpen(true)} style={{ display: "flex", alignItems: "center", gap: "0.4rem", padding: "0.5rem 1rem", background: "var(--accent)", color: "white", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 600, fontSize: "0.85rem" }}>
            <FileDown size={15} /> Cetak PDF
          </button>
          <button onClick={exportCsv} style={{ display: "flex", alignItems: "center", gap: "0.4rem", padding: "0.5rem 1rem", background: "white", color: "var(--accent)", border: "1px solid var(--accent)", borderRadius: 8, cursor: "pointer", fontWeight: 600, fontSize: "0.85rem" }}>
            📥 Export CSV
          </button>
        </div>

        <div style={{ display: "flex", gap: "1rem", alignItems: "flex-end", flexWrap: "wrap" }}>
          <div>
            <label className="input-label" style={{ marginBottom: "0.2rem" }}>Cari</label>
            <input className="input" type="text" style={{ width: 200 }} value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Nama, nomor, tag..." />
          </div>
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

      {/* KPI Cards */}
      {data && assets.length > 0 && (
        <div style={{ padding: "0 2rem 1.25rem" }} className="print-area">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1rem", marginBottom: "1.25rem" }}>
            {[
              { label: "Total Aset Tampil", value: `${assets.length} aset`, color: "var(--accent)" },
              { label: "Total Harga Beli", value: formatCurrency(totalAssetsValue), color: "var(--grey-dark)" },
              { label: "Total Nilai Buku", value: formatCurrency(totalNbv), color: "var(--good)" },
              { label: "Akumulasi Depresiasi", value: formatCurrency(totalAccumDepr), color: "var(--bad)" },
            ].map((kpi) => (
              <div key={kpi.label} className="stat-cell" style={{ textAlign: "center" }}>
                <div style={{ fontSize: "0.68rem", color: "var(--grey)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "0.3rem" }}>{kpi.label}</div>
                <div style={{ fontSize: "1.05rem", fontWeight: 700, fontFamily: "monospace", color: kpi.color }}>{kpi.value}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="print-area">
        <div className="content-card">
          {isLoading && <LoadingState />}

          {data && assets.length === 0 && (
            <EmptyState title="Tidak Ada Aset" subtitle="Tidak ada aset tetap yang cocok dengan filter." />
          )}

          {data && assets.length > 0 && (
            <>
              <table className="table">
                <thead>
                  <tr>
                    <th>Asset Code</th>
                    <th>Asset Name</th>
                    <th>Category</th>
                    <th>Location / Cost Center</th>
                    <th>Purchase Date</th>
                    <th style={{ textAlign: "right" }}>Purchase Price</th>
                    <th style={{ textAlign: "right" }}>Useful Life (Months)</th>
                    <th style={{ textAlign: "right" }}>Salvage Value</th>
                    <th style={{ textAlign: "right" }}>Accumulated Depr.</th>
                    <th style={{ textAlign: "right" }}>Monthly Depr.</th>
                    <th style={{ textAlign: "right" }}>Net Book Value</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {assets.map((asset) => {
                    const cfg = CATEGORY_CONFIG[asset.asset_category];
                    const Icon = cfg?.icon ?? Package;
                    return (
                      <tr key={asset.id}>
                        <td>
                          <Link to={`/finance/assets/${asset.id}`} style={{ color: "var(--accent)", textDecoration: "none", fontFamily: "monospace", fontSize: "0.8rem", fontWeight: 700 }}>
                            {asset.asset_number}
                          </Link>
                        </td>
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                            <div style={{ width: 24, height: 24, borderRadius: 5, background: cfg?.bg ?? "#f3f4f6", color: cfg?.color ?? "#374151", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                              <Icon size={12} />
                            </div>
                            <span style={{ fontWeight: 600, fontSize: "0.85rem" }}>{asset.asset_name}</span>
                          </div>
                        </td>
                        <td>
                          <span style={{ fontSize: "0.78rem", fontWeight: 600, color: cfg?.color ?? "inherit" }}>
                            {cfg?.label ?? asset.asset_category}
                          </span>
                        </td>
                        <td style={{ fontSize: "0.85rem" }}>{asset.location ?? "—"}</td>
                        <td style={{ fontSize: "0.82rem" }}>{formatDate(asset.purchase_date ?? "")}</td>
                        <td style={{ textAlign: "right", fontFamily: "monospace", fontSize: "0.82rem" }}>{formatCurrency(asset.purchase_price)}</td>
                        <td style={{ textAlign: "right", fontSize: "0.82rem" }}>{asset.useful_life_months ?? 0} bulan</td>
                        <td style={{ textAlign: "right", fontFamily: "monospace", fontSize: "0.82rem" }}>{formatCurrency(asset.salvage_value ?? 0)}</td>
                        <td style={{ textAlign: "right", fontFamily: "monospace", fontSize: "0.82rem", color: "var(--bad)" }}>{formatCurrency(asset.book_value_summary?.accumulated_depreciation ?? 0)}</td>
                        <td style={{ textAlign: "right", fontFamily: "monospace", fontSize: "0.82rem" }}>{formatCurrency(asset.book_value_summary?.monthly_depreciation ?? 0)}</td>
                        <td style={{ textAlign: "right", fontFamily: "monospace", fontSize: "0.82rem", fontWeight: 700, color: "var(--good)" }}>{formatCurrency(asset.book_value_summary?.book_value ?? 0)}</td>
                        <td>
                          <span className={`badge badge-${asset.status === "in_service" ? "active" : "churned"}`}>
                            {asset.status === "in_service" ? "Aktif" : "Disposed"}
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
      </div>
      {isPrintModalOpen && (
        <LetterheadPdfModal
          title="Cetak PDF — Fixed Asset Register"
          onClose={() => setIsPrintModalOpen(false)}
          onDownload={(orgId) => downloadPdfMutation.mutateAsync({ organizationId: orgId, asset_category: category || undefined, status: (status || undefined) as "in_service" | "disposed" | undefined, search: search || undefined })}
        />
      )}
    </div>
  );
}
