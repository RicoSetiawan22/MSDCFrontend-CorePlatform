import { useState, type FormEvent } from "react";
import { Modal } from "@shared/components/Modal";
import { Button } from "@shared/components/Button";
import { extractErrorMessage } from "@shared/types/api";
import { masterDataApi } from "../api/masterDataApi";
import type { OvertimeRate } from "../types/masterData";

interface OvertimeRateFormModalProps {
  /** Kosongkan untuk buat baru, isi untuk edit. */
  rate?: OvertimeRate;
  onSaved: () => void;
  onClose: () => void;
}

/**
 * Tarif lembur (Rp/jam) - dipakai HrServiceSupport (SubmitOvertimeModal)
 * buat kasih estimasi biaya lembur ke HRD sebelum submit ("4 jam x tarif
 * ini"), dan buat prefill jumlah rate saat posting ke Finance. "Jadikan
 * Default" cuma boleh 1 baris aktif (backend otomatis matikan yang lain
 * kalau ini di-set true).
 */
export function OvertimeRateFormModal({ rate, onSaved, onClose }: OvertimeRateFormModalProps) {
  const isEdit = !!rate;
  const [code, setCode] = useState(rate?.code ?? "");
  const [name, setName] = useState(rate?.name ?? "");
  const [ratePerHour, setRatePerHour] = useState(rate ? String(rate.rate_per_hour) : "");
  const [isDefault, setIsDefault] = useState(rate?.is_default ?? false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!code.trim() || !name.trim() || !ratePerHour) { setError("Kode, nama, dan tarif wajib diisi."); return; }
    setError(null);
    setSaving(true);
    try {
      const values = { code: code.trim().toUpperCase(), name: name.trim(), rate_per_hour: Number(ratePerHour), is_default: isDefault };
      if (isEdit) {
        await masterDataApi.updateOvertimeRate(rate.id, values);
      } else {
        await masterDataApi.createOvertimeRate(values);
      }
      onSaved();
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title={isEdit ? "Edit Tarif Lembur" : "Tarif Lembur Baru"} onClose={onClose} maxWidth={420}>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <div>
          <label className="input-label">Kode</label>
          <input className="input" value={code} onChange={(e) => setCode(e.target.value)}
            placeholder="Contoh: DEFAULT, STAFF, MANAGER" style={{ width: "100%", textTransform: "uppercase" }} />
        </div>
        <div>
          <label className="input-label">Nama</label>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)}
            placeholder="Contoh: Tarif Lembur Standar" style={{ width: "100%" }} />
        </div>
        <div>
          <label className="input-label">Tarif per Jam (Rp)</label>
          <input className="input" type="number" min={0} step={500} value={ratePerHour}
            onChange={(e) => setRatePerHour(e.target.value)} style={{ width: "100%" }} />
        </div>
        <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.85rem", cursor: "pointer" }}>
          <input type="checkbox" checked={isDefault} onChange={(e) => setIsDefault(e.target.checked)} />
          Jadikan Default (otomatis dipakai untuk estimasi lembur)
        </label>

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
