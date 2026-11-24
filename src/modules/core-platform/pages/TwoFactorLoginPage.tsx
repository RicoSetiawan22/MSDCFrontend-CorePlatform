import { useState, type FormEvent } from "react";
import { useNavigate, useLocation, Navigate } from "react-router-dom";
import { useAuth } from "@shared/lib/auth-context";
import { Button } from "@shared/components/Button";
import { InputField } from "@shared/components/InputField";
import { extractErrorMessage } from "@shared/types/api";

export function TwoFactorLoginPage() {
  const { loginTwoFactor } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const state = location.state as { twoFactorToken?: string; from?: string } | null;

  // Halaman ini TIDAK BOLEH diakses langsung (mis. ketik URL manual) tanpa
  // sudah lewat langkah 1 - two_factor_token cuma ada di state navigasi,
  // bukan di URL, supaya tidak nyangkut di browser history/bookmark.
  if (!state?.twoFactorToken) {
    return <Navigate to="/login" replace />;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await loginTwoFactor(state!.twoFactorToken!, code);
      navigate(state?.from ?? "/", { replace: true });
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--sidebar-bg)" }}>
      <form onSubmit={handleSubmit} className="card" style={{ padding: "2rem", width: "100%", maxWidth: 380 }}>
        <h1 style={{ fontSize: "1.4rem", marginBottom: "0.25rem" }}>Verifikasi 2FA</h1>
        <p style={{ color: "var(--grey)", fontSize: "0.85rem", marginBottom: "1.5rem" }}>
          Masukkan kode 6 digit dari authenticator app Anda.
        </p>

        <InputField label="Kode 2FA" inputMode="numeric" maxLength={6} required value={code} onChange={(e) => setCode(e.target.value)} autoFocus />

        {error && <div className="input-error" style={{ marginBottom: "1rem" }}>{error}</div>}

        <Button type="submit" disabled={isSubmitting} style={{ width: "100%" }}>
          {isSubmitting ? "Memverifikasi..." : "Verifikasi & Masuk"}
        </Button>
      </form>
    </div>
  );
}
