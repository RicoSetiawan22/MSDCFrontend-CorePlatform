import { useState } from "react";
import { useCreateFixedAsset } from "../api/useFixedAssets";
import { Button } from "@shared/components/Button";
import { Modal } from "@shared/components/Modal";
import { FormInput, SearchableSelect } from "@shared/components/ui/FormKit";
import { AccountPicker } from "@shared/components/ui/AccountPicker";
import { CostCenterPicker } from "@shared/components/ui/CostCenterPicker";
import { extractErrorMessage } from "@shared/types/api";
import type { AssetCategory, DepreciationMethod, FaAssetFormValues } from "../types/fixedAsset";

interface FixedAssetModalProps {
  onClose: () => void;
}

const CATEGORY_LABEL: Record<AssetCategory, string> = {
  rack: "Rack", ups: "UPS", generator: "Generator", server: "Server",
  switch: "Switch", router: "Router", building: "Bangunan", other: "Lainnya",
};

const EMPTY_FORM: FaAssetFormValues = {
  asset_name: "", asset_category: "server", location: "", purchase_date: "",
  purchase_price: 0, useful_life_months: 36, depreciation_method: "straight_line",
  asset_account_code: "",
};

const CATEGORY_OPTIONS = Object.entries(CATEGORY_LABEL).map(([value, label]) => ({
  value, label,
}));

const DEPRECIATION_OPTIONS = [
  { value: "straight_line", label: "Garis Lurus (Straight Line)", sublabel: "Sama tiap bulan" },
  { value: "declining_balance", label: "Saldo Menurun (Declining Balance)", sublabel: "Lebih besar di awal" },
];

export function FixedAssetModal({ onClose }: FixedAssetModalProps) {
  const [form, setForm] = useState<FaAssetFormValues>(EMPTY_FORM);
  const [costCenterId, setCostCenterId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const createMutation = useCreateFixedAsset();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await createMutation.mutateAsync({
        ...form,
        cost_center_id: costCenterId ? Number(costCenterId) : undefined,
      });
      onClose();
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  }

  // Lifespan presets
  const lifespanPresets = [
    { label: "2 Thn", months: 24 },
    { label: "3 Thn", months: 36 },
    { label: "5 Thn", months: 60 },
    { label: "10 Thn", months: 120 },
  ];

  return (
    <Modal title="📦 Daftarkan Aset Baru" onClose={onClose} maxWidth={640}>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>

        {/* Aset Info */}
        <div>
          <div style={{ fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em", color: "var(--grey-dark)", marginBottom: "0.75rem", paddingBottom: "0.5rem", borderBottom: "1px solid var(--border)" }}>
            Informasi Aset
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.875rem" }}>
            <FormInput
              label="Nama Aset *"
              required
              value={form.asset_name}
              onChange={(e) => setForm({ ...form, asset_name: e.target.value })}
              placeholder="mis. Server Dell PowerEdge R750"
            />
            <SearchableSelect
              value={form.asset_category}
              onChange={(v) => setForm({ ...form, asset_category: v as AssetCategory })}
              options={CATEGORY_OPTIONS}
              placeholder="Pilih kategori..."
              searchPlaceholder="Cari kategori..."
            />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.875rem", marginTop: "0.875rem" }}>
            <FormInput
              label="Lokasi *"
              required
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              placeholder="mis. DC Surabaya - Rack A12"
            />
            <FormInput
              label="Asset Tag"
              value={form.asset_tag ?? ""}
              onChange={(e) => setForm({ ...form, asset_tag: e.target.value })}
              placeholder="mis. barcode/RFID (opsional)"
            />
          </div>
          <div style={{ marginTop: "0.875rem" }}>
            <div style={{ marginBottom: "0.4rem" }}><label className="input-label">Cost Center</label></div>
            <CostCenterPicker
              value={costCenterId}
              onChange={setCostCenterId}
              placeholder="Pilih cost center... (opsional)"
            />
            <div style={{ fontSize: "0.68rem", color: "var(--grey)", marginTop: "0.25rem" }}>
              Untuk alokasi biaya aset per departemen/lokasi.
            </div>
          </div>
        </div>

        {/* Pembelian */}
        <div>
          <div style={{ fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em", color: "var(--grey-dark)", marginBottom: "0.75rem", paddingBottom: "0.5rem", borderBottom: "1px solid var(--border)" }}>
            Detail Pembelian
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.875rem" }}>
            <FormInput
              label="Tanggal Pembelian *"
              type="date"
              required
              value={form.purchase_date}
              onChange={(e) => setForm({ ...form, purchase_date: e.target.value })}
            />
            <FormInput
              label="Harga Beli (Rp) *"
              type="number"
              required
              min={0}
              value={form.purchase_price || ""}
              onChange={(e) => setForm({ ...form, purchase_price: Number(e.target.value) })}
              placeholder="0"
            />
          </div>
        </div>

        {/* Depresiasi */}
        <div>
          <div style={{ fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em", color: "var(--grey-dark)", marginBottom: "0.75rem", paddingBottom: "0.5rem", borderBottom: "1px solid var(--border)" }}>
            Depresiasi
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.875rem" }}>
            <div>
              <FormInput
                label="Umur Ekonomis (bulan) *"
                type="number"
                required
                min={1}
                value={form.useful_life_months || ""}
                onChange={(e) => setForm({ ...form, useful_life_months: Number(e.target.value) })}
                placeholder="36"
              />
              {/* Quick preset chips */}
              <div style={{ display: "flex", gap: "0.4rem", marginTop: "0.4rem", flexWrap: "wrap" }}>
                {lifespanPresets.map((p) => (
                  <button
                    key={p.months}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, useful_life_months: p.months }))}
                    style={{
                      border: `1px solid ${form.useful_life_months === p.months ? "var(--accent)" : "var(--border)"}`,
                      background: form.useful_life_months === p.months ? "var(--accent-light)" : "white",
                      borderRadius: 16,
                      padding: "0.15rem 0.6rem",
                      fontSize: "0.72rem",
                      fontWeight: 600,
                      cursor: "pointer",
                      color: form.useful_life_months === p.months ? "var(--accent)" : "var(--grey)",
                    }}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <FormInput
                label="Nilai Sisa / Salvage Value (Rp)"
                type="number"
                min={0}
                value={form.salvage_value ?? ""}
                onChange={(e) => setForm({ ...form, salvage_value: Number(e.target.value) || 0 })}
                placeholder="0"
              />
            </div>
          </div>

          <div style={{ marginTop: "0.875rem" }}>
            <div style={{ marginBottom: "0.4rem" }}><label className="input-label">Metode Depresiasi</label></div>
            <div style={{ display: "flex", gap: "0.6rem" }}>
              {DEPRECIATION_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setForm({ ...form, depreciation_method: opt.value as DepreciationMethod })}
                  style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-start",
                    padding: "0.65rem 0.875rem",
                    border: `1px solid ${form.depreciation_method === opt.value ? "var(--accent)" : "var(--border)"}`,
                    background: form.depreciation_method === opt.value ? "var(--accent-light)" : "white",
                    borderRadius: 8,
                    cursor: "pointer",
                    gap: "0.15rem",
                  }}
                >
                  <span style={{ fontSize: "0.82rem", fontWeight: 700, color: form.depreciation_method === opt.value ? "var(--accent)" : "var(--text)" }}>
                    {opt.label}
                  </span>
                  <span style={{ fontSize: "0.7rem", color: "var(--grey)" }}>{opt.sublabel}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Akun */}
        <div>
          <div style={{ fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em", color: "var(--grey-dark)", marginBottom: "0.75rem", paddingBottom: "0.5rem", borderBottom: "1px solid var(--border)" }}>
            Pengaturan Akun
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.875rem" }}>
            <div>
              <div style={{ marginBottom: "0.4rem" }}><label className="input-label">Akun Aset *</label></div>
              <AccountPicker
                value={form.asset_account_code ?? ""}
                onChange={(v) => setForm({ ...form, asset_account_code: v })}
                accountType="asset"
                placeholder="Cari akun aset..."
                error={error && !form.asset_account_code ? "Wajib dipilih" : undefined}
              />
            </div>
            <div>
              <div style={{ marginBottom: "0.4rem" }}><label className="input-label">Akun Lawan (Counter)</label></div>
              <AccountPicker
                value={form.counter_account_code ?? ""}
                onChange={(v) => setForm({ ...form, counter_account_code: v })}
                placeholder="mis. Bank / Hutang..."
                error={undefined}
              />
            </div>
          </div>
          <div style={{ fontSize: "0.72rem", color: "var(--grey)", marginTop: "0.4rem", lineHeight: 1.5 }}>
            Akun Aset = akun di mana nilai aset tercatat. Counter = akun yang di-debit/di-kredit saat aset pertama kali aquisição (mis. Bank 111001, Hutang 211001).
          </div>
        </div>

        {/* Posting Option */}
        <div style={{ background: "var(--bg-subtle)", borderRadius: 8, padding: "0.875rem" }}>
          <label style={{ display: "flex", alignItems: "flex-start", gap: "0.6rem", cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={form.post_acquisition ?? false}
              onChange={(e) => setForm({ ...form, post_acquisition: e.target.checked })}
              style={{ marginTop: "0.15rem", flexShrink: 0 }}
            />
            <div>
              <div style={{ fontSize: "0.85rem", fontWeight: 600, marginBottom: "0.2rem" }}>
                Langsung posting jurnal akuisisi sekarang
              </div>
              <div style={{ fontSize: "0.72rem", color: "var(--grey)" }}>
                Kalau tidak dicentang, aset cuma didaftarkan datanya saja — jurnal bisa diposting terpisah nanti.
              </div>
            </div>
          </label>
        </div>

        {error && (
          <div style={{ padding: "0.7rem 0.875rem", background: "#fee2e2", color: "#991b1b", borderRadius: 8, fontSize: "0.82rem" }}>
            ⚠️ {error}
          </div>
        )}

        <Button type="submit" disabled={createMutation.isPending} style={{ width: "100%" }}>
          {createMutation.isPending ? "Menyimpan..." : "💾 Daftarkan Aset"}
        </Button>
      </form>
    </Modal>
  );
}
