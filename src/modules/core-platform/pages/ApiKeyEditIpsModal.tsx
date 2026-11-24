import { useState } from "react";
import { Modal } from "@shared/components/Modal";
import { Button } from "@shared/components/Button";
import { useUpdateApiKeyAllowedIps } from "../api/useApiKeys";
import { extractErrorMessage } from "@shared/types/api";
import type { ApiKey } from "../types/apiKey";

/** Edit whitelist IP tanpa perlu regenerate key - berguna kalau IP statis
 * sensor IoT berubah, tanpa harus reconfigure device-nya dengan key baru. */
export function ApiKeyEditIpsModal({ apiKey, onClose }: { apiKey: ApiKey; onClose: () => void }) {
  const [value, setValue] = useState((apiKey.allowed_ips ?? []).join("\n"));
  const [error, setError] = useState<string | null>(null);
  const update = useUpdateApiKeyAllowedIps(apiKey.id);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const allowedIps = value
      .split(/[\n,]/)
      .map(s => s.trim())
      .filter(Boolean);

    try {
      await update.mutateAsync(allowedIps);
      onClose();
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  }

  return (
    <Modal title={`Edit Pembatasan IP — ${apiKey.name}`} onClose={onClose} maxWidth={480}>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <div>
          <label className="input-label">IP/CIDR yang Diizinkan</label>
          <textarea className="input" rows={4} autoFocus
            placeholder={"Satu per baris, mis:\n203.0.113.10\n10.0.0.0/24"}
            value={value} onChange={e => setValue(e.target.value)}
            style={{ width: "100%", resize: "vertical", fontFamily: "monospace", fontSize: "0.85rem" }} />
          <div style={{ fontSize: "0.72rem", color: "var(--grey)", marginTop: "0.3rem" }}>
            Kosongkan semua baris untuk menghapus pembatasan IP (key bisa diakses dari IP manapun).
          </div>
        </div>

        {error && <div className="input-error">{error}</div>}

        <div style={{ display: "flex", gap: "0.6rem", paddingTop: "0.5rem" }}>
          <Button type="submit" disabled={update.isPending} style={{ flex: 1 }}>
            {update.isPending ? "Menyimpan..." : "Simpan"}
          </Button>
          <Button type="button" variant="secondary" onClick={onClose}>Batal</Button>
        </div>
      </form>
    </Modal>
  );
}
