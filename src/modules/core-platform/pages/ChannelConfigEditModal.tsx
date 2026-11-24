import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Modal } from "@shared/components/Modal";
import { Button } from "@shared/components/Button";
import { useUpdateNotificationChannel } from "../api/useNotificationChannels";
import { extractErrorMessage } from "@shared/types/api";
import type { NotificationChannelConfig } from "../types/notificationChannel";

const CHANNEL_LABEL: Record<string, string> = {
  email: "Email", sms: "SMS", whatsapp: "WhatsApp", push: "Push Notification",
  telegram: "Telegram", slack: "Slack", teams: "Microsoft Teams", in_app: "In-App",
};

const PROVIDER_HINT: Record<string, string> = {
  email: "mis. smtp, sendgrid, ses",
  sms: "mis. twilio, zenziva",
  whatsapp: "mis. fonnte, meta_cloud_api, twilio",
  push: "mis. fcm, onesignal",
  telegram: "mis. telegram_bot",
  slack: "mis. slack_webhook",
  teams: "mis. teams_webhook",
  in_app: "mis. database",
};

/** Key yang BENAR-BENAR dibaca kode pengiriman (lihat
 * NotificationService::resolveEmailConfig()/resolveWhatsappConfig()) -
 * cuma email & whatsapp yang punya sender sungguhan saat ini, channel lain
 * masih simulasi jadi tidak ada key baku. */
const KNOWN_KEYS: Record<string, string[]> = {
  email: ["host", "port", "username", "password", "encryption", "from_address", "from_name"],
  whatsapp: ["api_key", "api_url"],
};

/** Config disimpan sebagai JSON bebas (kolom `config` di cp_ntf_channel_config)
 * - bentuknya beda-beda tergantung provider (host/port/user/pass untuk SMTP,
 * api_key/api_url untuk WhatsApp gateway, dst), jadi diedit sebagai daftar
 * key-value bebas, bukan form dengan field yang di-hardcode per provider. */
export function ChannelConfigEditModal({ channelConfig, onClose }: { channelConfig: NotificationChannelConfig; onClose: () => void }) {
  const [provider, setProvider] = useState(channelConfig.provider);
  const [isActive, setIsActive] = useState(channelConfig.is_active);
  const [pairs, setPairs] = useState<Array<{ key: string; value: string }>>(
    Object.entries(channelConfig.config ?? {}).map(([key, value]) => ({ key, value: String(value) }))
  );
  const [error, setError] = useState<string | null>(null);
  const update = useUpdateNotificationChannel(channelConfig.id);

  function addPair() {
    setPairs(p => [...p, { key: "", value: "" }]);
  }
  function addKnownKeys() {
    const existing = new Set(pairs.map(p => p.key));
    const missing = (KNOWN_KEYS[channelConfig.channel] ?? []).filter(k => !existing.has(k));
    setPairs(p => [...p, ...missing.map(key => ({ key, value: "" }))]);
  }
  function removePair(index: number) {
    setPairs(p => p.filter((_, i) => i !== index));
  }
  function setPairKey(index: number, key: string) {
    setPairs(p => p.map((row, i) => (i === index ? { ...row, key } : row)));
  }
  function setPairValue(index: number, value: string) {
    setPairs(p => p.map((row, i) => (i === index ? { ...row, value } : row)));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!provider.trim()) { setError("Provider wajib diisi."); return; }
    setError(null);

    const config: Record<string, string> = {};
    for (const { key, value } of pairs) {
      if (key.trim()) config[key.trim()] = value;
    }

    try {
      await update.mutateAsync({ provider: provider.trim(), config, is_active: isActive });
      onClose();
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  }

  return (
    <Modal title={`Setting Channel — ${CHANNEL_LABEL[channelConfig.channel] ?? channelConfig.channel}`} onClose={onClose} maxWidth={560}>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <label className="input-label">Provider *</label>
            <input className="input" placeholder={PROVIDER_HINT[channelConfig.channel] ?? "nama provider"}
              value={provider} onChange={e => setProvider(e.target.value)} style={{ width: 260 }} />
          </div>
          <label style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.85rem", cursor: "pointer" }}>
            <input type="checkbox" checked={isActive} onChange={e => setIsActive(e.target.checked)} />
            Aktif
          </label>
        </div>

        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
            <label className="input-label" style={{ margin: 0 }}>Kredensial / Setting</label>
            <div style={{ display: "flex", gap: "0.75rem" }}>
              {KNOWN_KEYS[channelConfig.channel] && (
                <button type="button" onClick={addKnownKeys}
                  style={{ border: "none", background: "none", color: "var(--accent)", cursor: "pointer", fontSize: "0.8rem" }}>
                  Isi field standar
                </button>
              )}
              <button type="button" onClick={addPair}
                style={{ display: "flex", alignItems: "center", gap: "0.25rem", border: "none", background: "none", color: "var(--accent)", cursor: "pointer", fontSize: "0.8rem" }}>
                <Plus size={14} /> Tambah
              </button>
            </div>
          </div>

          {pairs.length === 0 && (
            <div style={{ fontSize: "0.78rem", color: "var(--grey)", padding: "0.5rem 0" }}>
              {KNOWN_KEYS[channelConfig.channel]
                ? `Belum ada setting. Klik "Isi field standar" untuk isi ${KNOWN_KEYS[channelConfig.channel].join(", ")}.`
                : "Belum ada setting. Klik \"Tambah\" untuk isi manual."}
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {pairs.map((row, i) => (
              <div key={i} style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                <input className="input" placeholder="key (mis. host)" value={row.key}
                  onChange={e => setPairKey(i, e.target.value)} style={{ flex: 1, fontFamily: "monospace", fontSize: "0.85rem" }} />
                <input className="input" placeholder="value" value={row.value}
                  onChange={e => setPairValue(i, e.target.value)} style={{ flex: 1.5, fontFamily: "monospace", fontSize: "0.85rem" }} />
                <button type="button" onClick={() => removePair(i)}
                  style={{ border: "none", background: "none", color: "var(--bad)", cursor: "pointer", padding: "0.25rem" }} title="Hapus baris">
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>
          <div style={{ fontSize: "0.72rem", color: "var(--grey)", marginTop: "0.5rem" }}>
            {(channelConfig.channel === "email" || channelConfig.channel === "whatsapp") ? (
              <>Centang <strong>Aktif</strong> supaya setting ini benar-benar dipakai saat mengirim — kalau kosong/nonaktif, sistem otomatis pakai setting default server (.env). Nilai sensitif (password/API key) tersimpan di database - pastikan akses ke halaman ini dibatasi ke admin saja.</>
            ) : (
              "Channel ini masih simulasi (belum ada provider yang benar-benar terhubung) - setting di sini belum berpengaruh ke pengiriman sungguhan."
            )}
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
