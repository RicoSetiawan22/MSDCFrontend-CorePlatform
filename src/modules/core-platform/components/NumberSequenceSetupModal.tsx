import { useState, type FormEvent } from "react";
import { Modal } from "@shared/components/Modal";
import { Button } from "@shared/components/Button";
import { extractErrorMessage } from "@shared/types/api";
import { masterDataApi } from "../api/masterDataApi";
import type { NumberSequenceResetPeriod } from "../types/masterData";

interface NumberSequenceSetupModalProps {
  moduleCode: string;
  suggestedPrefix?: string;
  suggestedFormat?: string;
  /** true = dipanggil reaktif dari form dokumen yang kena blokir - module_code
   * TIDAK bisa diubah (harus persis yang diminta). false/omitted = dipanggil
   * dari Master Data > Number Sequence langsung ("+ Tambah"), module_code
   * bebas diketik. */
  lockModuleCode?: boolean;
  onCreated: () => void;
  onClose: () => void;
}

const RESET_PERIODS: { value: NumberSequenceResetPeriod; label: string }[] = [
  { value: "monthly", label: "Bulanan — nomor mulai dari 1 lagi tiap bulan" },
  { value: "yearly", label: "Tahunan — nomor mulai dari 1 lagi tiap tahun" },
  { value: "never", label: "Tidak pernah — terus bertambah tanpa reset" },
];

/**
 * Muncul otomatis begitu form pembuatan dokumen (Lead/Opportunity/
 * Quotation/Sales Order/Contract dkk) kena 422 error_code=
 * 'number_sequence_not_configured' (lihat extractNumberSequenceError di
 * @shared/types/api.ts) - staf atur sekali di sini, LANGSUNG lanjut buat
 * dokumennya (onCreated memicu retry submit form asal), tidak perlu
 * pindah ke halaman Master Data terpisah.
 */
export function NumberSequenceSetupModal({ moduleCode, suggestedPrefix, suggestedFormat, lockModuleCode, onCreated, onClose }: NumberSequenceSetupModalProps) {
  const [code, setCode] = useState(moduleCode);
  const [prefix, setPrefix] = useState(suggestedPrefix ?? "");
  const [format, setFormat] = useState(suggestedFormat ?? "{PREFIX}-{YYYY}{MM}-{SEQ:6}");
  const [resetPeriod, setResetPeriod] = useState<NumberSequenceResetPeriod>("monthly");
  // Nomor urut TERAKHIR yang sudah dipakai, BUKAN nomor berikutnya -
  // penting kalau sudah ada dokumen lama dengan pola nomor ini sebelum
  // sequence-nya baru sekarang didaftarkan (skenario paling umum
  // munculnya inputbox ini), supaya nomor berikutnya TIDAK mengulang
  // dari 1 dan bentrok sama yang sudah dipakai.
  const [currentNumber, setCurrentNumber] = useState("0");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      await masterDataApi.createNumberSequence({
        module_code: code, prefix, format, reset_period: resetPeriod,
        current_number: currentNumber ? Number(currentNumber) : 0,
      });
      onCreated();
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title="⚙️ Setup Nomor Dokumen" onClose={onClose} maxWidth={440}>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        {lockModuleCode && (
          <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 8, padding: "0.7rem 0.85rem", fontSize: "0.82rem", color: "#92400e" }}>
            Nomor urut untuk <strong style={{ fontFamily: "monospace" }}>{moduleCode}</strong> belum diatur di Master Data. Atur sekali di sini, dokumen ini otomatis lanjut dibuat — bisa diubah lagi kapan saja lewat Master Data → Number Sequence.
          </div>
        )}

        <div>
          <label className="input-label">Module Code</label>
          <input className="input" value={code} onChange={(e) => setCode(e.target.value.toLowerCase().replace(/\s+/g, "_"))}
            required disabled={lockModuleCode} style={{ fontFamily: "monospace" }} />
          {!lockModuleCode && (
            <div style={{ fontSize: "0.72rem", color: "var(--grey)", marginTop: "0.3rem" }}>
              Kode unik dokumen yang dipakai kode program - mis. "lead", "quotation", "sales_order".
            </div>
          )}
        </div>

        <div>
          <label className="input-label">Prefix</label>
          <input className="input" value={prefix} onChange={(e) => setPrefix(e.target.value.toUpperCase())} required maxLength={20} />
        </div>

        <div>
          <label className="input-label">Format Nomor</label>
          <input className="input" value={format} onChange={(e) => setFormat(e.target.value)} required style={{ fontFamily: "monospace" }} />
          <div style={{ fontSize: "0.72rem", color: "var(--grey)", marginTop: "0.3rem" }}>
            Token yang bisa dipakai: <code>{"{PREFIX}"}</code> <code>{"{YYYY}"}</code> <code>{"{MM}"}</code> <code>{"{DD}"}</code> <code>{"{SEQ:n}"}</code> (n = jumlah digit angka urut).
          </div>
        </div>

        <div>
          <label className="input-label">Nomor Urut Terakhir yang Sudah Dipakai</label>
          <input className="input" type="number" min={0} step={1} value={currentNumber}
            onChange={(e) => setCurrentNumber(e.target.value)} />
          <div style={{ fontSize: "0.72rem", color: "var(--grey)", marginTop: "0.3rem" }}>
            Biarkan 0 kalau belum pernah ada dokumen dengan pola nomor ini. Kalau sudah ada (mis. sudah ada 5 lead lama bernomor manual), isi <strong>5</strong> di sini supaya lead berikutnya lanjut jadi nomor 6, bukan mengulang dari 1.
          </div>
        </div>

        <div>
          <label className="input-label">Reset Nomor</label>
          <select className="input" value={resetPeriod} onChange={(e) => setResetPeriod(e.target.value as NumberSequenceResetPeriod)}>
            {RESET_PERIODS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>
        </div>

        {error && <div className="input-error">{error}</div>}

        <div style={{ display: "flex", gap: "0.6rem" }}>
          <Button type="submit" disabled={saving} style={{ flex: 1 }}>
            {saving ? "Menyimpan..." : "💾 Simpan & Lanjutkan"}
          </Button>
          <Button type="button" variant="secondary" onClick={onClose}>Batal</Button>
        </div>
      </form>
    </Modal>
  );
}
