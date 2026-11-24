import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { MapPin, Ban } from "lucide-react";
import { useFixedAsset, useDepreciationSchedule } from "../api/useFixedAssets";
import { RelocateAssetModal } from "../components/RelocateAssetModal";
import { DisposeAssetModal } from "../components/DisposeAssetModal";
import { Button } from "@shared/components/Button";
import { PageHeader } from "@shared/components/PageHeader";
import { EmptyState } from "@shared/components/EmptyState";
import { LoadingState } from "@shared/components/LoadingState";
import { ErrorState } from "@shared/components/ErrorState";
import { formatCurrency, formatDate } from "@shared/lib/format";
import { extractErrorMessage } from "@shared/types/api";

type Tab = "history" | "projection" | "relocations";

export function FixedAssetDetailPage() {
  const params = useParams<{ assetId: string }>();
  const assetId = params.assetId ? Number(params.assetId) : undefined;
  const [tab, setTab] = useState<Tab>("history");
  const [isRelocateOpen, setIsRelocateOpen] = useState(false);
  const [isDisposeOpen, setIsDisposeOpen] = useState(false);

  const { data: asset, isLoading, isError, error } = useFixedAsset(assetId);
  const { data: schedule } = useDepreciationSchedule(assetId);

  return (
    <div>
      <PageHeader title={asset ? asset.asset_name : "Detail Aset"} subtitle={asset ? asset.asset_number : "Memuat..."} />

      <div style={{ padding: "0 2rem 1rem" }}>
        <Link to="/finance/assets" style={{ fontSize: "0.85rem", color: "var(--accent)", textDecoration: "none" }}>← Kembali ke Fixed Asset Management</Link>
      </div>

      {isLoading && <LoadingState />}
      {isError && <ErrorState message={extractErrorMessage(error)} />}

      {asset && (
        <div style={{ padding: "0 2rem 2rem" }}>
          <div className="card" style={{ padding: "1.5rem", marginBottom: "1.25rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.25rem" }}>
              <span className={`badge badge-${asset.status === "in_service" ? "active" : "inactive"}`}>{asset.status === "in_service" ? "Aktif" : "Disposed"}</span>
              {asset.status === "in_service" && (
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <Button variant="secondary" onClick={() => setIsRelocateOpen(true)}><MapPin size={15} /> Relokasi</Button>
                  <Button variant="danger" onClick={() => setIsDisposeOpen(true)}><Ban size={15} /> Lepas Aset</Button>
                </div>
              )}
            </div>

            {/* Kartu nilai buku - 3 angka inti dari kebutuhan: Harga Beli, Depresiasi, Nilai Buku */}
            <div className="stat-grid" style={{ border: "1px solid var(--border)", borderRadius: 8, marginBottom: "1.25rem" }}>
              <div className="stat-cell">
                <div className="stat-cell__label">Harga Beli</div>
                <div className="stat-cell__value">{formatCurrency(asset.book_value_summary.purchase_price)}</div>
              </div>
              <div className="stat-cell">
                <div className="stat-cell__label">Akumulasi Depresiasi</div>
                <div className="stat-cell__value" style={{ color: "var(--bad)" }}>{formatCurrency(asset.book_value_summary.accumulated_depreciation)}</div>
              </div>
              <div className="stat-cell">
                <div className="stat-cell__label">Nilai Buku Saat Ini</div>
                <div className="stat-cell__value" style={{ color: "var(--good)" }}>{formatCurrency(asset.book_value_summary.book_value)}</div>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1.1rem" }}>
              <div><div style={{ fontSize: "0.75rem", color: "var(--grey)" }}>Lokasi</div><div style={{ fontWeight: 600 }}>{asset.location}</div></div>
              <div><div style={{ fontSize: "0.75rem", color: "var(--grey)" }}>Umur Ekonomis</div><div style={{ fontWeight: 600 }}>{asset.useful_life_months} bulan</div></div>
              <div><div style={{ fontSize: "0.75rem", color: "var(--grey)" }}>Metode Depresiasi</div><div style={{ fontWeight: 600 }}>{asset.depreciation_method === "straight_line" ? "Garis Lurus" : "Saldo Menurun"}</div></div>
              <div><div style={{ fontSize: "0.75rem", color: "var(--grey)" }}>Akun Aset</div><div style={{ fontWeight: 600, fontFamily: "monospace", fontSize: "0.85rem" }}>{asset.asset_account.account_code}</div></div>
            </div>
          </div>

          <div className="content-card" style={{ margin: 0 }}>
            <div className="tabs">
              <button className={`tab${tab === "history" ? " is-active" : ""}`} onClick={() => setTab("history")}>Riwayat Depresiasi</button>
              <button className={`tab${tab === "projection" ? " is-active" : ""}`} onClick={() => setTab("projection")}>Proyeksi ke Depan</button>
              <button className={`tab${tab === "relocations" ? " is-active" : ""}`} onClick={() => setTab("relocations")}>Riwayat Relokasi</button>
            </div>

            {tab === "history" && (
              (asset.depreciation_history?.length ?? 0) === 0 ? (
                <EmptyState title="Belum Ada Depresiasi Tercatat" subtitle="Jalankan depresiasi bulanan untuk mulai mencatat beban aset ini." />
              ) : (
                <table className="table">
                  <thead><tr><th>Periode</th><th style={{ textAlign: "right" }}>Beban</th><th style={{ textAlign: "right" }}>Akumulasi</th><th style={{ textAlign: "right" }}>Nilai Buku</th><th>Jurnal</th></tr></thead>
                  <tbody>
                    {asset.depreciation_history!.map((h, i) => (
                      <tr key={i}>
                        <td>{formatDate(h.period_date)}</td>
                        <td style={{ textAlign: "right" }}>{formatCurrency(h.amount)}</td>
                        <td style={{ textAlign: "right" }}>{formatCurrency(h.accumulated_depreciation)}</td>
                        <td style={{ textAlign: "right", fontWeight: 600 }}>{formatCurrency(h.book_value)}</td>
                        <td>{h.gl_journal_number ? <Link to={`/finance/gl/journals/${h.gl_journal_number}`} style={{ color: "var(--accent)", textDecoration: "none", fontFamily: "monospace", fontSize: "0.8rem" }}>{h.gl_journal_number}</Link> : "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )
            )}

            {tab === "projection" && (
              !schedule || schedule.projection.length === 0 ? (
                <EmptyState title="Tidak Ada Proyeksi" subtitle="Aset ini sudah fully depreciated atau belum ada data yang cukup." />
              ) : (
                <>
                  <p style={{ fontSize: "0.78rem", color: "var(--grey)", padding: "1rem 1.5rem 0" }}>Estimasi ke depan - BELUM di-posting, murni proyeksi berdasar sisa umur pakai.</p>
                  <table className="table">
                    <thead><tr><th>Periode</th><th style={{ textAlign: "right" }}>Estimasi Beban</th><th style={{ textAlign: "right" }}>Akumulasi</th><th style={{ textAlign: "right" }}>Nilai Buku</th></tr></thead>
                    <tbody>
                      {schedule.projection.map((p, i) => (
                        <tr key={i}>
                          <td style={{ color: "var(--grey)" }}>{formatDate(p.period_date)}</td>
                          <td style={{ textAlign: "right", color: "var(--grey)" }}>{formatCurrency(p.depreciation_amount)}</td>
                          <td style={{ textAlign: "right", color: "var(--grey)" }}>{formatCurrency(p.accumulated_depreciation)}</td>
                          <td style={{ textAlign: "right", color: "var(--grey)" }}>{formatCurrency(p.book_value)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </>
              )
            )}

            {tab === "relocations" && (
              (asset.relocations?.length ?? 0) === 0 ? (
                <EmptyState title="Belum Pernah Direlokasi" subtitle="Riwayat perpindahan lokasi aset ini akan ditampilkan di sini." />
              ) : (
                <table className="table">
                  <thead><tr><th>Tanggal</th><th>Dari</th><th>Ke</th><th>Alasan</th></tr></thead>
                  <tbody>
                    {asset.relocations!.map((r) => (
                      <tr key={r.id}>
                        <td>{formatDate(r.relocation_date)}</td>
                        <td>{r.from_location}</td>
                        <td style={{ fontWeight: 600 }}>{r.to_location}</td>
                        <td style={{ fontSize: "0.85rem", color: "var(--grey)" }}>{r.reason ?? "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )
            )}
          </div>
        </div>
      )}

      {isRelocateOpen && assetId && asset && (
        <RelocateAssetModal assetId={assetId} currentLocation={asset.location} onClose={() => setIsRelocateOpen(false)} />
      )}
      {isDisposeOpen && assetId && asset && (
        <DisposeAssetModal assetId={assetId} assetName={asset.asset_name} bookValue={asset.book_value_summary.book_value} onClose={() => setIsDisposeOpen(false)} />
      )}
    </div>
  );
}
