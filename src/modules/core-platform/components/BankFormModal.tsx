import { useState, type FormEvent } from "react";
import { Modal } from "@shared/components/Modal";
import { Button } from "@shared/components/Button";
import { extractErrorMessage } from "@shared/types/api";
import { masterDataApi } from "../api/masterDataApi";
import type { Bank } from "../types/masterData";

interface BankFormModalProps {
  /** Kosongkan untuk buat baru, isi untuk edit. */
  bank?: Bank;
  onSaved: () => void;
  onClose: () => void;
}

/**
 * Master data Bank - dipakai sebagai referensi rekening perusahaan (mis.
 * rekening tujuan yang ditampilkan di invoice, atau akun bank untuk
 * rekonsiliasi Finance & Accounting > Bank Reconciliation).
 */
export function BankFormModal({ bank, onSaved, onClose }: BankFormModalProps) {
  const isEdit = !!bank;
  const [code, setCode] = useState(bank?.code ?? "");
  const [name, setName] = useState(bank?.name ?? "");
  const [swiftCode, setSwiftCode] = useState(bank?.swift_code ?? "");
  const [branchName, setBranchName] = useState(bank?.branch_name ?? "");
  const [accountNumber, setAccountNumber] = useState(bank?.account_number ?? "");
  const [accountName, setAccountName] = useState(bank?.account_name ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!code.trim() || !name.trim()) { setError("Kode dan nama bank wajib diisi."); return; }
    setError(null);
    setSaving(true);
    try {
      const values = {
        name: name.trim(),
        swift_code: swiftCode.trim() || undefined,
        branch_name: branchName.trim() || undefined,
        account_number: accountNumber.trim() || undefined,
        account_name: accountName.trim() || undefined,
      };
      if (isEdit) {
        await masterDataApi.updateBank(bank.id, values);
      } else {
        await masterDataApi.createBank({ ...values, code: code.trim().toUpperCase() });
      }
      onSaved();
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title={isEdit ? "Edit Bank" : "Bank Baru"} onClose={onClose} maxWidth={420}>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <div>
          <label className="input-label">Kode *</label>
          <input className="input" value={code} disabled={isEdit} onChange={(e) => setCode(e.target.value)}
            placeholder="mis. BCA, MANDIRI, BNI" style={{ width: "100%", textTransform: "uppercase" }} />
        </div>
        <div>
          <label className="input-label">Nama Bank *</label>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)}
            placeholder="mis. Bank Central Asia" style={{ width: "100%" }} />
        </div>
        <div>
          <label className="input-label">SWIFT Code</label>
          <input className="input" value={swiftCode} onChange={(e) => setSwiftCode(e.target.value)}
            placeholder="Opsional" style={{ width: "100%" }} />
        </div>
        <div>
          <label className="input-label">Cabang</label>
          <input className="input" value={branchName} onChange={(e) => setBranchName(e.target.value)}
            placeholder="Opsional" style={{ width: "100%" }} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
          <div>
            <label className="input-label">No Rekening</label>
            <input className="input" value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)}
              placeholder="Opsional" style={{ width: "100%" }} />
          </div>
          <div>
            <label className="input-label">Atas Nama</label>
            <input className="input" value={accountName} onChange={(e) => setAccountName(e.target.value)}
              placeholder="Opsional" style={{ width: "100%" }} />
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
