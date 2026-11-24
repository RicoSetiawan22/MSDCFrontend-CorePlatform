import { useState, type FormEvent } from "react";
import { Modal } from "@shared/components/Modal";
import { Button } from "@shared/components/Button";
import { extractErrorMessage } from "@shared/types/api";
import { masterDataApi } from "../api/masterDataApi";
import type { Holiday } from "../types/masterData";

interface HolidayFormModalProps {
  /** Kosongkan untuk buat baru, isi untuk edit. */
  holiday?: Holiday;
  onSaved: () => void;
  onClose: () => void;
}

const TYPE_OPTIONS: { value: "national" | "regional" | "company"; label: string }[] = [
  { value: "national", label: "Nasional" },
  { value: "regional", label: "Regional" },
  { value: "company", label: "Perusahaan" },
];

/** Hari libur - dipakai perhitungan lembur/absensi (hari libur tidak
 * dihitung sebagai hari kerja normal). */
export function HolidayFormModal({ holiday, onSaved, onClose }: HolidayFormModalProps) {
  const isEdit = !!holiday;
  const [date, setDate] = useState(holiday?.date?.slice(0, 10) ?? "");
  const [name, setName] = useState(holiday?.name ?? "");
  const [type, setType] = useState<"national" | "regional" | "company">(holiday?.type ?? "national");
  const [isRecurringYearly, setIsRecurringYearly] = useState(holiday?.is_recurring_yearly ?? false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!date || !name.trim()) { setError("Tanggal dan nama wajib diisi."); return; }
    setError(null);
    setSaving(true);
    try {
      const values = { date, name: name.trim(), type, is_recurring_yearly: isRecurringYearly };
      if (isEdit) {
        await masterDataApi.updateHoliday(holiday.id, values);
      } else {
        await masterDataApi.createHoliday(values);
      }
      onSaved();
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title={isEdit ? "Edit Hari Libur" : "Hari Libur Baru"} onClose={onClose} maxWidth={420}>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <div>
          <label className="input-label">Tanggal *</label>
          <input className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} style={{ width: "100%" }} />
        </div>
        <div>
          <label className="input-label">Nama *</label>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)}
            placeholder="mis. Hari Kemerdekaan RI" style={{ width: "100%" }} />
        </div>
        <div>
          <label className="input-label">Tipe</label>
          <select className="input" value={type} onChange={(e) => setType(e.target.value as typeof type)} style={{ width: "100%" }}>
            {TYPE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
        <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.85rem", cursor: "pointer" }}>
          <input type="checkbox" checked={isRecurringYearly} onChange={(e) => setIsRecurringYearly(e.target.checked)} />
          Berulang tiap tahun di tanggal yang sama
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
