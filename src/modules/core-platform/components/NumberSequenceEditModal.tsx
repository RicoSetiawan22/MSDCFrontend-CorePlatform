import { useState, type FormEvent } from "react";
import { Modal } from "@shared/components/Modal";
import { Button } from "@shared/components/Button";
import { extractErrorMessage } from "@shared/types/api";
import { masterDataApi } from "../api/masterDataApi";
import type { NumberSequence, NumberSequenceResetPeriod } from "../types/masterData";

const RESET_PERIODS: { value: NumberSequenceResetPeriod; label: string }[] = [
  { value: "monthly", label: "Bulanan — nomor mulai dari 1 lagi tiap bulan" },
  { value: "yearly", label: "Tahunan — nomor mulai dari 1 lagi tiap tahun" },
  { value: "never", label: "Tidak pernah — terus bertambah tanpa reset" },
];

/**
 * Edit sequence yang SUDAH ada - module_code TIDAK bisa diubah (backend
 * NumberSequenceController::update() memang tidak menerimanya), tapi
 * prefix/format/current_number/reset_period bisa. Beda dari
 * NumberSequenceSetupModal yang khusus BUAT BARU.
 */
export function NumberSequenceEditModal({ sequence, onSaved, onClose }: {
  sequence: NumberSequence;
  onSaved: () => void;
  onClose: () => void;
}) {
  const [prefix, setPrefix] = useState(sequence.prefix);
  const [format, setFormat] = useState(sequence.format);
  const [resetPeriod, setResetPeriod] = useState<NumberSequenceResetPeriod>(sequence.reset_period);
  const [currentNumber, setCurrentNumber] = useState(String(sequence.current_number));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Backend menolak current_number diturunkan (risiko bentrok nomor dengan
  // dokumen yang sudah pernah dibuat) kecuali force=true dikirim - lihat
  // NumberSequenceController::update(). Begitu ditolak, tawarkan tombol
  // konfirmasi eksplisit alih-alih diam-diam mengirim force=true.
  const [decreaseBlocked, setDecreaseBlocked] = useState(false);

  async function submitUpdate(force: boolean) {
    setError(null);
    setSaving(true);
    try {
      await masterDataApi.updateNumberSequence(sequence.id, {
        prefix, format, reset_period: resetPeriod,
        current_number: currentNumber ? Number(currentNumber) : 0,
        force,
      });
      onSaved();
    } catch (err) {
      const errorCode = (err as { response?: { data?: { error_code?: string } } })?.response?.data?.error_code;
      if (errorCode === "number_sequence_decrease_blocked") {
        setDecreaseBlocked(true);
      }
      setError(extractErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setDecreaseBlocked(false);
    await submitUpdate(false);
  }

  return (
    <Modal title={`✏️ Edit Number Sequence — ${sequence.module_code}`} onClose={onClose} maxWidth={440}>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <div>
          <label className="input-label">Module Code</label>
          <input className="input" value={sequence.module_code} disabled style={{ fontFamily: "monospace" }} />
          <div style={{ fontSize: "0.72rem", color: "var(--grey)", marginTop: "0.3rem" }}>
            Tidak bisa diubah — dipakai langsung oleh kode program.
          </div>
        </div>

        <div>
          <label className="input-label">Prefix</label>
          <input className="input" value={prefix} onChange={(e) => setPrefix(e.target.value.toUpperCase())} required maxLength={20} />
        </div>

        <div>
          <label className="input-label">Format Nomor</label>
          <input className="input" value={format} onChange={(e) => setFormat(e.target.value)} required style={{ fontFamily: "monospace" }} />
          <div style={{ fontSize: "0.72rem", color: "var(--grey)", marginTop: "0.3rem" }}>
            Token: <code>{"{PREFIX}"}</code> <code>{"{YYYY}"}</code> <code>{"{MM}"}</code> <code>{"{DD}"}</code> <code>{"{SEQ:n}"}</code> (n = jumlah digit).
          </div>
        </div>

        <div>
          <label className="input-label">Nomor Urut Saat Ini</label>
          <input className="input" type="number" min={0} step={1} value={currentNumber}
            onChange={(e) => { setCurrentNumber(e.target.value); setDecreaseBlocked(false); }} />
          <div style={{ fontSize: "0.72rem", color: "var(--grey)", marginTop: "0.3rem" }}>
            Nomor berikutnya akan jadi <strong>{(Number(currentNumber) || 0) + 1}</strong>. Ubah hati-hati — nilai yang terlalu rendah bisa bikin nomor baru bentrok dengan dokumen yang sudah ada.
          </div>
        </div>

        <div>
          <label className="input-label">Reset Nomor</label>
          <select className="input" value={resetPeriod} onChange={(e) => setResetPeriod(e.target.value as NumberSequenceResetPeriod)}>
            {RESET_PERIODS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>
        </div>

        {error && <div className="input-error">{error}</div>}

        {decreaseBlocked && (
          <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 8, padding: "0.7rem 0.85rem", fontSize: "0.8rem", color: "#92400e", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <span>Kalau ini memang disengaja (mis. reset manual), tekan tombol ini untuk lanjut menurunkan nomornya.</span>
            <Button type="button" variant="danger" disabled={saving} onClick={() => submitUpdate(true)}>
              {saving ? "Menyimpan..." : "⚠️ Ya, tetap turunkan nomornya"}
            </Button>
          </div>
        )}

        <div style={{ display: "flex", gap: "0.6rem" }}>
          <Button type="submit" disabled={saving} style={{ flex: 1 }}>
            {saving ? "Menyimpan..." : "💾 Simpan Perubahan"}
          </Button>
          <Button type="button" variant="secondary" onClick={onClose}>Batal</Button>
        </div>
      </form>
    </Modal>
  );
}
