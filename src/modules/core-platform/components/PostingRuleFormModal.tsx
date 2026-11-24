import { useState, type FormEvent } from "react";
import { Modal } from "@shared/components/Modal";
import { Button } from "@shared/components/Button";
import { extractErrorMessage } from "@shared/types/api";
import { masterDataApi } from "../api/masterDataApi";
import { AccountCodePicker } from "./AccountCodePicker";
import type { PostingRule } from "../types/masterData";

interface PostingRuleFormModalProps {
  rule: PostingRule;
  onSaved: () => void;
  onClose: () => void;
}

/** Edit akun GL untuk 1 baris posting (mis. "Gaji Pokok" -> akun mana yang
 * didebit). transaction_type/line_key/side TIDAK bisa diubah di sini -
 * struktural, ditentukan seeder (lihat migration cp_gl_posting_rule) - yang
 * boleh diedit admin cuma akun tujuan, memo, dan aktif/tidaknya baris ini. */
export function PostingRuleFormModal({ rule, onSaved, onClose }: PostingRuleFormModalProps) {
  const [accountCode, setAccountCode] = useState(rule.account_code);
  const [label, setLabel] = useState(rule.label);
  const [isActive, setIsActive] = useState(rule.is_active);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!accountCode || !label.trim()) { setError("Akun dan memo wajib diisi."); return; }
    setError(null);
    setSaving(true);
    try {
      await masterDataApi.updatePostingRule(rule.id, { account_code: accountCode, label: label.trim(), is_active: isActive });
      onSaved();
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title={`Edit Aturan Posting — ${rule.label}`} onClose={onClose} maxWidth={420}>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <div>
          <label className="input-label">Sisi Jurnal</label>
          <div style={{ fontSize: "0.85rem", fontWeight: 600 }}>
            {rule.side === "debit" ? "Debit" : "Kredit"} <span style={{ color: "var(--grey)", fontWeight: 400 }}>(tidak bisa diubah)</span>
          </div>
        </div>
        <div>
          <label className="input-label">Akun (Chart of Accounts)</label>
          <AccountCodePicker value={accountCode} onChange={setAccountCode} />
        </div>
        <div>
          <label className="input-label">Memo</label>
          <input className="input" value={label} onChange={e => setLabel(e.target.value)}
            placeholder="Contoh: Gaji Pokok" style={{ width: "100%" }} />
        </div>
        <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.85rem", cursor: "pointer" }}>
          <input type="checkbox" checked={isActive} onChange={e => setIsActive(e.target.checked)} />
          Aktif
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
