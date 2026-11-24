import { useState } from "react";
import { AlertTriangle, TrendingUp, TrendingDown } from "lucide-react";
import { useDisposeAsset } from "../api/useFixedAssets";
import { Button } from "@shared/components/Button";
import { Modal } from "@shared/components/Modal";
import { FormInput } from "@shared/components/ui/FormKit";
import { AccountPicker } from "@shared/components/ui/AccountPicker";
import { extractErrorMessage } from "@shared/types/api";

interface DisposeAssetModalProps {
  assetId: number;
  assetName: string;
  bookValue: number;
  onClose: () => void;
}

export function DisposeAssetModal({ assetId, assetName, bookValue, onClose }: DisposeAssetModalProps) {
  const [disposalDate, setDisposalDate] = useState("");
  const [disposalProceeds, setDisposalProceeds] = useState("");
  const [proceedsAccountCode, setProceedsAccountCode] = useState("");
  const [gainLossAccountCode, setGainLossAccountCode] = useState("");
  const [error, setError] = useState<string | null>(null);

  const disposeMutation = useDisposeAsset();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await disposeMutation.mutateAsync({
        id: assetId,
        values: {
          disposal_date: disposalDate || undefined,
          disposal_proceeds: disposalProceeds ? Number(disposalProceeds) : undefined,
          proceeds_account_code: proceedsAccountCode || undefined,
          gain_loss_account_code: gainLossAccountCode || undefined,
        },
      });
      onClose();
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  }

  const proceeds = Number(disposalProceeds || 0);
  const gainLoss = proceeds - bookValue;
  const isGain = gainLoss >= 0;

  return (
    <Modal title="🏚️ Lepas Aset dari Pembukuan" onClose={onClose} maxWidth={520}>
      {/* Warning banner */}
      <div style={{ display: "flex", gap: "0.6rem", background: "#fee2e2", color: "#991b1b", padding: "0.875rem 1rem", borderRadius: 8, marginBottom: "1.25rem", fontSize: "0.82rem", alignItems: "flex-start" }}>
        <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
        <span>Tindakan ini <strong>TIDAK BISA dibatalkan</strong>. Aset <strong>{assetName}</strong> (nilai buku saat ini {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(bookValue)}) akan dilepas permanen.</span>
      </div>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.1rem" }}>
        <FormInput
          label="Tanggal Disposal *"
          type="date"
          required
          value={disposalDate}
          onChange={(e) => setDisposalDate(e.target.value)}
        />

        <FormInput
          label="Hasil Penjualan / Nilai Pelepasan (Rp)"
          type="number" min={0}
          value={disposalProceeds}
          onChange={(e) => setDisposalProceeds(e.target.value)}
          placeholder="Kosongkan kalau dihapuskan tanpa nilai"
        />

        {/* Gain/Loss indicator */}
        {disposalProceeds && (
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            padding: "0.6rem 0.875rem",
            borderRadius: 8,
            background: isGain ? "#d9f2e6" : "#fee2e2",
            color: isGain ? "#15803d" : "#991b1b",
            fontSize: "0.82rem",
            fontWeight: 600,
          }}>
            {isGain ? <TrendingUp size={15} /> : <TrendingDown size={15} />}
            {isGain ? "Keuntungan" : "Kerugian"}: {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(Math.abs(gainLoss))}
            {isGain ? " (aset dilepas di atas nilai buku)" : " (aset dilepas di bawah nilai buku)"}
          </div>
        )}

        <div>
          <div style={{ marginBottom: "0.4rem" }}><label className="input-label">Akun Penerimaan / Kas</label></div>
          <AccountPicker
            value={proceedsAccountCode}
            onChange={setProceedsAccountCode}
            placeholder="Cari akun kas / bank..."
            error={undefined}
          />
          <div style={{ fontSize: "0.7rem", color: "var(--grey)", marginTop: "0.3rem" }}>
            Wajib kalau ada hasil penjualan (mis. Bank 111001, Kas 111002).
          </div>
        </div>

        <div>
          <div style={{ marginBottom: "0.4rem" }}><label className="input-label">Akun Gain / Loss</label></div>
          <AccountPicker
            value={gainLossAccountCode}
            onChange={setGainLossAccountCode}
            placeholder="Cari akun gain/loss..."
            error={undefined}
          />
          <div style={{ fontSize: "0.7rem", color: "var(--grey)", marginTop: "0.3rem" }}>
            Wajib kalau ada selisih antara hasil penjualan dengan nilai buku.
          </div>
        </div>

        {error && (
          <div style={{ padding: "0.7rem 0.875rem", background: "#fee2e2", color: "#991b1b", borderRadius: 8, fontSize: "0.82rem" }}>
            ⚠️ {error}
          </div>
        )}

        <div style={{ display: "flex", gap: "0.6rem", marginTop: "0.25rem" }}>
          <Button type="submit" variant="danger" disabled={disposeMutation.isPending} style={{ flex: 1 }}>
            {disposeMutation.isPending ? "Memproses..." : "⚠️ Lepas Aset"}
          </Button>
          <Button type="button" variant="secondary" onClick={onClose}>Batal</Button>
        </div>
      </form>
    </Modal>
  );
}
