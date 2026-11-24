import { useEffect, useState } from "react";
import { Copy, CheckCircle2, QrCode, KeyRound } from "lucide-react";
import { twoFactorApi, type TwoFactorSetupData } from "../api/twoFactorApi";
import { Button } from "@shared/components/Button";
import { InputField } from "@shared/components/InputField";
import { LoadingState } from "@shared/components/LoadingState";
import { extractErrorMessage } from "@shared/types/api";

interface TwoFactorEnrollFlowProps {
  /** Dipanggil setelah user klik "Lanjutkan" di layar recovery codes - 2FA sudah AKTIF di titik ini. */
  onComplete: () => void;
  /** Tombol aksi tambahan di footer form kode (mis. "Keluar" di halaman setup wajib, "Batal" di modal My Account). Opsional. */
  extraAction?: { label: string; onClick: () => void };
}

/**
 * Alur enroll 2FA (generate secret -> scan/catat -> konfirmasi kode ->
 * recovery codes) - dipakai DUA tempat: TwoFactorSetupPage.tsx (wajib,
 * dipaksa tampil penuh layar) dan MyAccountPage.tsx (opsional, user
 * memicu sendiri lewat tombol "Aktifkan 2FA"). Disatukan di sini supaya
 * kedua tempat itu tidak duplikasi logic setup/confirm/QR.
 */
export function TwoFactorEnrollFlow({ onComplete, extraAction }: TwoFactorEnrollFlowProps) {
  const [setupData, setSetupData] = useState<TwoFactorSetupData | null>(null);
  const [setupMode, setSetupMode] = useState<"qr" | "manual">("qr");
  const [code, setCode] = useState("");
  const [recoveryCodes, setRecoveryCodes] = useState<string[] | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    twoFactorApi.setup()
      .then((res) => {
        setSetupData(res.data.data);
        if (!res.data.data.qr_code_data_uri) setSetupMode("manual"); // Server gagal render QR (endroid/qr-code belum terpasang) - tetap bisa lanjut lewat kode manual.
      })
      .catch((err) => setError(extractErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  async function handleConfirm(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setConfirming(true);
    try {
      const res = await twoFactorApi.confirm(code);
      setRecoveryCodes(res.data.data.recovery_codes);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setConfirming(false);
    }
  }

  function copySecret() {
    if (!setupData) return;
    navigator.clipboard.writeText(setupData.secret).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  if (loading) return <LoadingState />;

  if (error && !setupData) return <div className="input-error">{error}</div>;

  if (recoveryCodes) {
    return (
      <>
        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", background: "#f0fdf4", border: "1px solid #bbf7d0", color: "#15803d", borderRadius: 8, padding: "0.6rem 0.8rem", fontSize: "0.82rem", marginBottom: "1rem" }}>
          <CheckCircle2 size={15} /> 2FA berhasil diaktifkan.
        </div>
        <div style={{ fontSize: "0.82rem", fontWeight: 600, marginBottom: "0.5rem" }}>
          Recovery Codes — simpan di tempat aman
        </div>
        <p style={{ fontSize: "0.75rem", color: "var(--grey)", marginBottom: "0.75rem" }}>
          Masing-masing kode cuma bisa dipakai SEKALI kalau device authenticator Anda hilang. Tidak akan ditampilkan lagi setelah ini.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.4rem", background: "var(--bg-subtle)", borderRadius: 8, padding: "0.9rem", marginBottom: "1.25rem" }}>
          {recoveryCodes.map((c) => (
            <code key={c} style={{ fontSize: "0.82rem", fontFamily: "monospace" }}>{c}</code>
          ))}
        </div>
        <Button onClick={onComplete} style={{ width: "100%" }}>Sudah Disimpan, Lanjutkan →</Button>
      </>
    );
  }

  if (!setupData) return null;

  return (
    <>
      <div style={{ display: "flex", gap: "0.4rem", marginBottom: "1rem", background: "var(--bg-subtle)", borderRadius: 8, padding: "0.25rem" }}>
        <button
          type="button"
          onClick={() => setSetupMode("qr")}
          disabled={!setupData.qr_code_data_uri}
          style={{
            flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "0.35rem",
            padding: "0.5rem", borderRadius: 6, border: "none", cursor: setupData.qr_code_data_uri ? "pointer" : "not-allowed",
            fontSize: "0.82rem", fontWeight: 600,
            background: setupMode === "qr" ? "white" : "transparent",
            color: setupMode === "qr" ? "var(--accent)" : "var(--grey)",
            boxShadow: setupMode === "qr" ? "0 1px 2px rgba(0,0,0,0.08)" : "none",
          }}
        >
          <QrCode size={15} /> Scan QR Code
        </button>
        <button
          type="button"
          onClick={() => setSetupMode("manual")}
          style={{
            flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "0.35rem",
            padding: "0.5rem", borderRadius: 6, border: "none", cursor: "pointer",
            fontSize: "0.82rem", fontWeight: 600,
            background: setupMode === "manual" ? "white" : "transparent",
            color: setupMode === "manual" ? "var(--accent)" : "var(--grey)",
            boxShadow: setupMode === "manual" ? "0 1px 2px rgba(0,0,0,0.08)" : "none",
          }}
        >
          <KeyRound size={15} /> Kode Manual
        </button>
      </div>

      {setupMode === "qr" && setupData.qr_code_data_uri && (
        <div style={{ background: "var(--bg-subtle)", borderRadius: 10, padding: "1rem", marginBottom: "1.25rem", textAlign: "center" }}>
          <div style={{ fontSize: "0.78rem", color: "var(--grey)", marginBottom: "0.75rem" }}>
            1. Buka aplikasi authenticator (Google Authenticator / Authy) → tambah akun baru → pindai kode QR ini:
          </div>
          <img src={setupData.qr_code_data_uri} alt="QR Code 2FA" width={200} height={200} style={{ background: "white", padding: "0.5rem", borderRadius: 6, border: "1px solid var(--border)" }} />
        </div>
      )}

      {setupMode === "manual" && (
        <div style={{ background: "var(--bg-subtle)", borderRadius: 10, padding: "1rem", marginBottom: "1.25rem" }}>
          <div style={{ fontSize: "0.78rem", color: "var(--grey)", marginBottom: "0.5rem" }}>
            1. Buka aplikasi authenticator (Google Authenticator / Authy) → tambah akun baru → pilih "Masukkan kode setup manual" → tempel kode di bawah ini:
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <code style={{ flex: 1, background: "white", border: "1px solid var(--border)", borderRadius: 6, padding: "0.5rem 0.7rem", fontSize: "0.9rem", letterSpacing: "0.05em", wordBreak: "break-all" }}>
              {setupData.secret}
            </code>
            <button type="button" onClick={copySecret} className="btn btn-secondary" style={{ padding: "0.5rem 0.6rem", flexShrink: 0 }} title="Salin">
              {copied ? <CheckCircle2 size={15} color="var(--good)" /> : <Copy size={15} />}
            </button>
          </div>
        </div>
      )}

      <form onSubmit={handleConfirm}>
        <div style={{ fontSize: "0.78rem", color: "var(--grey)", marginBottom: "0.5rem" }}>
          2. Masukkan kode 6 digit yang muncul di aplikasi authenticator:
        </div>
        <InputField label="Kode 2FA" inputMode="numeric" maxLength={6} required value={code} onChange={(e) => setCode(e.target.value)} autoFocus />

        {error && <div className="input-error" style={{ marginBottom: "1rem" }}>{error}</div>}

        <div style={{ display: "flex", gap: "0.6rem", marginTop: "0.5rem" }}>
          <Button type="submit" disabled={confirming} style={{ flex: 1 }}>
            {confirming ? "Memverifikasi..." : "Aktifkan 2FA"}
          </Button>
          {extraAction && (
            <Button type="button" variant="secondary" onClick={extraAction.onClick}>{extraAction.label}</Button>
          )}
        </div>
      </form>
    </>
  );
}
