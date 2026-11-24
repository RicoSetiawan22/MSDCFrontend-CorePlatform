import { useState, type FormEvent } from "react";
import { Modal } from "@shared/components/Modal";
import { Button } from "@shared/components/Button";
import { extractErrorMessage } from "@shared/types/api";
import { masterDataApi } from "../api/masterDataApi";

interface CurrencyFormModalProps {
  onSaved: () => void;
  onClose: () => void;
}

/**
 * Currency cuma bisa DIBUAT lewat form ini, tidak ada edit/hapus - backend
 * (FinanceReferenceController) memang tidak menyediakan updateCurrency/
 * deleteCurrency, karena currency_code dipakai sebagai referensi di
 * transaksi AR/AP/GL multi-currency (mengubah/menghapusnya bisa
 * meninggalkan transaksi lama menunjuk ke currency yang sudah tidak ada).
 */
export function CurrencyFormModal({ onSaved, onClose }: CurrencyFormModalProps) {
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [symbol, setSymbol] = useState("");
  const [decimalPlaces, setDecimalPlaces] = useState("2");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!code.trim() || !name.trim()) { setError("Kode dan nama wajib diisi."); return; }
    if (code.trim().length !== 3) { setError("Kode currency harus 3 huruf (mis. IDR, USD)."); return; }
    setError(null);
    setSaving(true);
    try {
      await masterDataApi.createCurrency({
        code: code.trim().toUpperCase(),
        name: name.trim(),
        symbol: symbol.trim() || undefined,
        decimal_places: decimalPlaces ? Number(decimalPlaces) : undefined,
      });
      onSaved();
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title="Currency Baru" onClose={onClose} maxWidth={420}>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <div>
          <label className="input-label">Kode (3 huruf) *</label>
          <input className="input" value={code} maxLength={3} onChange={(e) => setCode(e.target.value)}
            placeholder="mis. IDR, USD, SGD" style={{ width: "100%", textTransform: "uppercase" }} />
        </div>
        <div>
          <label className="input-label">Nama *</label>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)}
            placeholder="mis. Rupiah Indonesia" style={{ width: "100%" }} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
          <div>
            <label className="input-label">Symbol</label>
            <input className="input" value={symbol} onChange={(e) => setSymbol(e.target.value)}
              placeholder="mis. Rp, $" style={{ width: "100%" }} />
          </div>
          <div>
            <label className="input-label">Desimal</label>
            <input className="input" type="number" min={0} max={6} value={decimalPlaces}
              onChange={(e) => setDecimalPlaces(e.target.value)} style={{ width: "100%" }} />
          </div>
        </div>

        {error && <div className="input-error">{error}</div>}

        <div style={{ display: "flex", gap: "0.6rem" }}>
          <Button type="submit" disabled={saving} style={{ flex: 1 }}>
            {saving ? "Menyimpan..." : "💾 Simpan"}
          </Button>
          <Button type="button" variant="secondary" onClick={onClose}>Batal</Button>
        </div>
      </form>
    </Modal>
  );
}
