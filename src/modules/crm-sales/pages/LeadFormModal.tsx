import { useState, type FormEvent } from "react";
import { useCreateLead, useCrmPicUsers } from "../api/useLeads";
import { Button } from "@shared/components/Button";
import { InputField } from "@shared/components/InputField";
import { Modal } from "@shared/components/Modal";
import { NumberSequenceSetupModal } from "@modules/core-platform/components/NumberSequenceSetupModal";
import { extractErrorMessage, extractNumberSequenceError, type NumberSequenceNotConfiguredError } from "@shared/types/api";

const EMPTY = { company_name: "", contact_name: "", email: "", phone: "", source: "", notes: "", pic: "", pic_choice: "", assigned_to: null as number | null, sales_employee_id: null as number | null };

export function LeadFormModal({ onClose }: { onClose: () => void }) {
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState<string | null>(null);
  const [seqError, setSeqError] = useState<NumberSequenceNotConfiguredError | null>(null);
  const create = useCreateLead();
  const { data: picUsers, isLoading: loadingUsers, isError: usersError } = useCrmPicUsers();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form.company_name.trim()) { setError("Nama perusahaan wajib diisi."); return; }
    if (!form.pic_choice) { setError("Pilih PIC dari daftar pengguna."); return; }
    setError(null);
    try {
      await create.mutateAsync(form);
      onClose();
    } catch (err) {
      const seq = extractNumberSequenceError(err);
      if (seq) { setSeqError(seq); return; }
      setError(extractErrorMessage(err));
    }
  }

  return (
    <Modal title="Lead Baru" onClose={onClose} maxWidth={560}>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        {/*
          Lead = bakal customer. Belum tentu ada di database Customer.
          Cukup input teks biasa. Setelah deal baru jadi Customer.
        */}
        <InputField
          label="Nama Perusahaan *"
          required
          value={form.company_name}
          onChange={e => setForm({ ...form, company_name: e.target.value })}
          placeholder="mis. PT Contoh Indonesia"
        />

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 1rem" }}>
          <InputField label="Nama Contact" value={form.contact_name}
            onChange={e => setForm({ ...form, contact_name: e.target.value })}
            placeholder="Budi Santoso" />
          <InputField label="Telepon" value={form.phone}
            onChange={e => setForm({ ...form, phone: e.target.value })}
            placeholder="021-xxxxxxx" />
        </div>

        <InputField label="Email" type="email" value={form.email}
          onChange={e => setForm({ ...form, email: e.target.value })}
          placeholder="contact@perusahaan.co.id" />

        <div>
          <label className="input-label">PIC</label>
          <select className="input" value={form.pic_choice} required
            disabled={loadingUsers || usersError}
            onChange={e => {
              const pic = (picUsers ?? []).find(item => item.choice_id === e.target.value);
              setForm(prev => ({ ...prev, pic_choice: pic?.choice_id ?? "", sales_employee_id: pic?.employee_id ?? null, assigned_to: pic?.user_id ?? null, pic: pic?.full_name ?? "" }));
            }}>
            <option value="">— Pilih PIC (semua jabatan) —</option>
            {(picUsers ?? []).map(pic => <option key={pic.choice_id} value={pic.choice_id}>{pic.full_name} — {pic.position_title}</option>)}
          </select>
          {usersError && <div className="input-error">Gagal memuat daftar PIC.</div>}
        </div>
        <div>
          <label className="input-label">Source</label>
          <select className="input" value={form.source}
            onChange={e => setForm({ ...form, source: e.target.value })}>
            <option value="">— Pilih Source —</option>
            <option value="website">Website</option>
            <option value="referral">Referral</option>
            <option value="sales">Cold Call</option>
            <option value="marketing">Social Media</option>
            <option value="event">Exhibition / Event</option>
            <option value="referral">Partner</option>
            <option value="other">Lainnya</option>
          </select>
        </div>

        <div>
          <label className="input-label">Catatan</label>
          <textarea className="input" rows={3} value={form.notes}
            onChange={e => setForm({ ...form, notes: e.target.value })}
            placeholder="Catatan tentang lead ini..." />
        </div>

        {error && <div className="input-error">{error}</div>}

        <div style={{ display: "flex", gap: "0.6rem" }}>
          <Button type="submit" disabled={create.isPending} style={{ flex: 1 }}>
            {create.isPending ? "Menyimpan..." : "Buat Lead"}
          </Button>
          <Button type="button" variant="secondary" onClick={onClose}>Batal</Button>
        </div>
      </form>

      {seqError && (
        <NumberSequenceSetupModal
          moduleCode={seqError.module_code}
          suggestedPrefix={seqError.suggested_prefix}
          suggestedFormat={seqError.suggested_format}
          lockModuleCode
          onClose={() => setSeqError(null)}
          onCreated={() => { setSeqError(null); create.mutateAsync(form).then(() => onClose()).catch((err) => setError(extractErrorMessage(err))); }}
        />
      )}
    </Modal>
  );
}