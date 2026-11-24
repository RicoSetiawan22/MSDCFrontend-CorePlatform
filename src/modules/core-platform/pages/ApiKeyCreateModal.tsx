import { useState } from "react";
import { Modal } from "@shared/components/Modal";
import { Button } from "@shared/components/Button";
import { useCreateApiKey } from "../api/useApiKeys";
import { extractErrorMessage } from "@shared/types/api";

const EMPTY = {
  name: "",
  owner_description: "",
  allowed_ips: "",
  expires_at: "",
};

/**
 * raw_key CUMA ditampilkan SATU KALI di response create - begitu modal ini
 * ditutup, key aslinya hilang selamanya (yang tersimpan di DB cuma hash-nya,
 * lihat ApiKeyService::create()). Makanya alur di sini 2 tahap: form dulu,
 * lalu ganti ke tampilan "simpan sekarang" setelah berhasil dibuat.
 */
export function ApiKeyCreateModal({ onClose }: { onClose: () => void }) {
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState<string | null>(null);
  const [createdRawKey, setCreatedRawKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const create = useCreateApiKey();

  function set(key: keyof typeof EMPTY, value: string) {
    setForm(f => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) { setError("Nama wajib diisi."); return; }
    setError(null);

    const allowedIps = form.allowed_ips
      .split(/[\n,]/)
      .map(s => s.trim())
      .filter(Boolean);

    try {
      const result = await create.mutateAsync({
        name: form.name.trim(),
        owner_description: form.owner_description || undefined,
        allowed_ips: allowedIps.length > 0 ? allowedIps : undefined,
        expires_at: form.expires_at || undefined,
      });
      setCreatedRawKey(result.raw_key);
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  }

  async function copyKey() {
    if (!createdRawKey) return;
    try {
      await navigator.clipboard.writeText(createdRawKey);
      setCopied(true);
    } catch {
      // clipboard API mungkin diblok - user tinggal select-copy manual
    }
  }

  if (createdRawKey) {
    return (
      <Modal title="API Key Berhasil Dibuat" onClose={onClose} maxWidth={520}>
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div style={{ fontSize: "0.85rem", color: "#b45309", background: "#fffbeb", padding: "0.6rem 0.8rem", borderRadius: 6 }}>
            SIMPAN key di bawah ini SEKARANG — setelah modal ini ditutup, key aslinya tidak akan pernah ditampilkan lagi (yang tersimpan cuma hash-nya).
          </div>
          <div style={{
            fontFamily: "monospace", fontSize: "0.85rem", wordBreak: "break-all",
            background: "#f8fafc", border: "1px solid var(--border)", borderRadius: 6, padding: "0.75rem",
          }}>
            {createdRawKey}
          </div>
          <div style={{ display: "flex", gap: "0.6rem" }}>
            <Button type="button" onClick={copyKey} style={{ flex: 1 }}>
              {copied ? "Tersalin ✓" : "Salin ke Clipboard"}
            </Button>
            <Button type="button" variant="secondary" onClick={onClose}>Selesai</Button>
          </div>
        </div>
      </Modal>
    );
  }

  return (
    <Modal title="API Key Baru" onClose={onClose} maxWidth={520}>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <div>
          <label className="input-label">Nama *</label>
          <input className="input" placeholder="mis. Sensor Suhu Rack R03"
            value={form.name} onChange={e => set("name", e.target.value)}
            style={{ width: "100%" }} />
        </div>

        <div>
          <label className="input-label">Milik / Keterangan</label>
          <input className="input" placeholder="mis. App Absensi Android, atau Sensor IoT Data Center Room A"
            value={form.owner_description} onChange={e => set("owner_description", e.target.value)}
            style={{ width: "100%" }} />
          <div style={{ fontSize: "0.72rem", color: "var(--grey)", marginTop: "0.3rem" }}>
            Jelaskan siapa/aplikasi apa yang pegang key ini — ditampilkan di daftar supaya key mudah dikenali lagi nanti.
          </div>
        </div>

        <div>
          <label className="input-label">IP/CIDR yang Diizinkan (opsional)</label>
          <textarea className="input" rows={3}
            placeholder={"Satu per baris, mis:\n203.0.113.10\n10.0.0.0/24"}
            value={form.allowed_ips} onChange={e => set("allowed_ips", e.target.value)}
            style={{ width: "100%", resize: "vertical", fontFamily: "monospace", fontSize: "0.85rem" }} />
          <div style={{ fontSize: "0.72rem", color: "var(--grey)", marginTop: "0.3rem" }}>
            Kosongkan kalau tidak perlu pembatasan IP. Untuk sensor IoT, isi IP statis sensornya supaya key ini cuma bisa dipakai dari perangkat itu.
          </div>
        </div>

        <div>
          <label className="input-label">Kedaluwarsa (opsional)</label>
          <input className="input" type="date"
            value={form.expires_at} onChange={e => set("expires_at", e.target.value)}
            style={{ width: "100%" }} />
        </div>

        {error && <div className="input-error">{error}</div>}

        <div style={{ display: "flex", gap: "0.6rem", paddingTop: "0.5rem" }}>
          <Button type="submit" disabled={create.isPending} style={{ flex: 1 }}>
            {create.isPending ? "Membuat..." : "Buat API Key"}
          </Button>
          <Button type="button" variant="secondary" onClick={onClose}>Batal</Button>
        </div>
      </form>
    </Modal>
  );
}
