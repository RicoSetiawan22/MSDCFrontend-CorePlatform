import { useState } from "react";
import { Link } from "react-router-dom";
import { Plus, PlayCircle, Server, BatteryCharging, Fuel, Network, Router as RouterIcon, Building2, Layers, Package } from "lucide-react";
import { useFixedAssetList } from "../api/useFixedAssets";
import { FixedAssetModal } from "../components/FixedAssetModal";
import { RunDepreciationModal } from "../components/RunDepreciationModal";
import { Button } from "@shared/components/Button";
import { Pagination } from "@shared/components/Pagination";
import { PageHeader } from "@shared/components/PageHeader";
import { EmptyState } from "@shared/components/EmptyState";
import { LoadingState } from "@shared/components/LoadingState";
import { SearchInput, StatusBadge } from "@shared/components/ui/FormKit";
import { formatCurrency } from "@shared/lib/format";
import type { AssetCategory } from "../types/fixedAsset";

const CATEGORY_CONFIG: Record<AssetCategory, { label: string; icon: typeof Server; color: string; bg: string }> = {
  rack:       { label: "Rack",        icon: Layers,           color: "#7c3aed", bg: "#ede9fe" },
  ups:        { label: "UPS",         icon: BatteryCharging,  color: "#b45309", bg: "#fef3c7" },
  generator:  { label: "Generator",    icon: Fuel,             color: "#dc2626", bg: "#fee2e2" },
  server:     { label: "Server",       icon: Server,           color: "#1d4ed8", bg: "#dbeafe" },
  switch:     { label: "Switch",       icon: Network,          color: "#0891b2", bg: "#cffafe" },
  router:     { label: "Router",       icon: RouterIcon,       color: "#0f766e", bg: "#ccfbf1" },
  building:   { label: "Bangunan",     icon: Building2,         color: "#92400e", bg: "#fef3c7" },
  other:      { label: "Lainnya",      icon: Package,          color: "#374151", bg: "#f3f4f6" },
};

export function FixedAssetListPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<AssetCategory | "">("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isRunModalOpen, setIsRunModalOpen] = useState(false);

  const { data, isLoading } = useFixedAssetList({
    page,
    per_page: 20,
    search: search || undefined,
    asset_category: category || undefined,
  });

  const totalAssets = data?.total ?? 0;
  const totalBookValue = (data?.data ?? []).reduce((sum, a) => sum + Number(a.book_value_summary?.book_value ?? 0), 0);
  const totalPurchaseValue = (data?.data ?? []).reduce((sum, a) => sum + Number(a.purchase_price ?? 0), 0);

  return (
    <div>
      <PageHeader
        title="Fixed Asset Management"
        subtitle="Aset perusahaan — harga beli, lokasi, umur, depresiasi, dan nilai buku."
      />

      <div className="content-card">
        {/* Toolbar */}
        <div style={{ padding: "1rem 1.25rem", borderBottom: "1px solid var(--border)", display: "flex", gap: "0.75rem", alignItems: "center", flexWrap: "wrap" }}>
          {/* Search */}
          <div style={{ flex: 1, minWidth: 200 }}>
            <SearchInput value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Cari nama, nomor, atau tag aset..." />
          </div>

          {/* Category chips */}
          <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={() => { setCategory(""); setPage(1); }}
              style={{
                padding: "0.3rem 0.75rem",
                borderRadius: 20,
                border: `1px solid ${!category ? "var(--accent)" : "var(--border)"}`,
                background: !category ? "var(--accent-light)" : "white",
                color: !category ? "var(--accent)" : "var(--grey)",
                fontSize: "0.78rem",
                fontWeight: !category ? 700 : 400,
                cursor: "pointer",
              }}
            >
              Semua
            </button>
            {(Object.entries(CATEGORY_CONFIG) as [AssetCategory, typeof CATEGORY_CONFIG[AssetCategory]][]).map(([key, cfg]) => {
              const Icon = cfg.icon;
              const isActive = category === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => { setCategory(key); setPage(1); }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.3rem",
                    padding: "0.3rem 0.75rem",
                    borderRadius: 20,
                    border: `1px solid ${isActive ? cfg.color : "var(--border)"}`,
                    background: isActive ? cfg.bg : "white",
                    color: isActive ? cfg.color : "var(--grey)",
                    fontSize: "0.78rem",
                    fontWeight: isActive ? 700 : 400,
                    cursor: "pointer",
                  }}
                >
                  <Icon size={12} />
                  {cfg.label}
                </button>
              );
            })}
          </div>

          <div style={{ marginLeft: "auto", display: "flex", gap: "0.5rem" }}>
            <Button variant="secondary" onClick={() => setIsRunModalOpen(true)}>
              <PlayCircle size={15} /> Depresiasi
            </Button>
            <Button onClick={() => setIsCreateModalOpen(true)}>
              <Plus size={15} /> Aset Baru
            </Button>
          </div>
        </div>

        {/* Summary strip */}
        {data && data.data.length > 0 && (
          <div style={{ display: "flex", gap: "1.5rem", padding: "0.75rem 1.25rem", background: "var(--bg-subtle)", borderBottom: "1px solid var(--border)" }}>
            <div>
              <div style={{ fontSize: "0.68rem", color: "var(--grey)", textTransform: "uppercase", letterSpacing: "0.04em" }}>Total Aset</div>
              <div style={{ fontSize: "0.95rem", fontWeight: 700 }}>{totalAssets.toLocaleString("id-ID")} aset</div>
            </div>
            <div style={{ borderLeft: "1px solid var(--border)", paddingLeft: "1.5rem" }}>
              <div style={{ fontSize: "0.68rem", color: "var(--grey)", textTransform: "uppercase", letterSpacing: "0.04em" }}>Total Harga Beli</div>
              <div style={{ fontSize: "0.95rem", fontWeight: 700, fontFamily: "monospace" }}>{formatCurrency(totalPurchaseValue)}</div>
            </div>
            <div style={{ borderLeft: "1px solid var(--border)", paddingLeft: "1.5rem" }}>
              <div style={{ fontSize: "0.68rem", color: "var(--grey)", textTransform: "uppercase", letterSpacing: "0.04em" }}>Total Nilai Buku</div>
              <div style={{ fontSize: "0.95rem", fontWeight: 700, fontFamily: "monospace", color: "var(--good)" }}>{formatCurrency(totalBookValue)}</div>
            </div>
          </div>
        )}

        {isLoading && <LoadingState />}

        {data && data.data.length === 0 && (
          <EmptyState
            title="Belum Ada Aset Terdaftar"
            subtitle="Aset yang Anda daftarkan atau yang cocok dengan filter akan ditampilkan di sini."
          />
        )}

        {data && data.data.length > 0 && (
          <>
            <table className="table">
              <thead>
                <tr>
                  <th>Aset</th>
                  <th>Kategori</th>
                  <th>Lokasi</th>
                  <th style={{ textAlign: "right" }}>Harga Beli</th>
                  <th style={{ textAlign: "right" }}>Nilai Buku</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {data.data.map((asset) => {
                  const cfg = CATEGORY_CONFIG[asset.asset_category];
                  const Icon = cfg.icon;
                  return (
                    <tr key={asset.id}>
                      <td>
                        <Link
                          to={`/finance/assets/${asset.id}`}
                          style={{ display: "flex", alignItems: "center", gap: "0.75rem", textDecoration: "none" }}
                        >
                          <div style={{ width: 34, height: 34, borderRadius: 8, background: cfg.bg, color: cfg.color, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                            <Icon size={16} />
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, color: "var(--accent)", fontSize: "0.875rem" }}>{asset.asset_name}</div>
                            <div style={{ fontSize: "0.72rem", color: "var(--grey)", fontFamily: "monospace" }}>{asset.asset_number}</div>
                          </div>
                        </Link>
                      </td>
                      <td>
                        <span style={{ fontSize: "0.78rem", fontWeight: 600, color: cfg.color }}>{cfg.label}</span>
                      </td>
                      <td style={{ fontSize: "0.85rem", color: "var(--grey-dark)" }}>{asset.location}</td>
                      <td style={{ textAlign: "right", fontSize: "0.85rem", fontFamily: "monospace" }}>
                        {formatCurrency(asset.purchase_price)}
                      </td>
                      <td style={{ textAlign: "right", fontSize: "0.85rem", fontWeight: 700, fontFamily: "monospace", color: "var(--good)" }}>
                        {formatCurrency(asset.book_value_summary.book_value)}
                      </td>
                      <td>
                        <StatusBadge status={asset.status === "in_service" ? "active" : "terminated"} label={asset.status === "in_service" ? "Aktif" : "Disposed"} />
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

      {isCreateModalOpen && <FixedAssetModal onClose={() => setIsCreateModalOpen(false)} />}
      {isRunModalOpen && <RunDepreciationModal onClose={() => setIsRunModalOpen(false)} />}
    </div>
  );
}
