import { useState, type FormEvent } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Building2, ArrowLeft } from "lucide-react";
import { useAuth } from "@shared/lib/auth-context";
import { apiClient } from "@shared/lib/api-client";
import { Button } from "@shared/components/Button";
import { InputField } from "@shared/components/InputField";
import { extractErrorMessage } from "@shared/types/api";

export function LoginPage() {
  const { login, selectOrganization } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resendState, setResendState] = useState<"idle" | "sending" | "sent">("idle");

  // "Email belum diverifikasi" (lihat AuthController::login()) - tawarkan
  // kirim ulang link verifikasi langsung dari sini, supaya user tidak
  // buntu tanpa cara self-service (endpoint resend() sudah publik &
  // di-throttle, lihat routes/api.php).
  const isUnverifiedError = !!error && error.toLowerCase().includes("belum diverifikasi");

  async function handleResendVerification() {
    if (!email) return;
    setResendState("sending");
    try {
      await apiClient.post("/v1/core-platform/auth/email/verify/resend", { email });
      setResendState("sent");
    } catch {
      setResendState("idle");
    }
  }

  // Langkah "pilih organization" - dulu ini dipilih lewat switcher di
  // TopBar SETELAH login, sekarang jadi bagian dari layar login ini
  // sendiri (langsung setelah email+password benar, sebelum token
  // diterbitkan) - lihat AuthController::login()/selectOrganization().
  const [organizationStep, setOrganizationStep] = useState<{
    token: string;
    organizations: { id: number; code: string; name: string }[];
  } | null>(null);
  const [selectedOrgId, setSelectedOrgId] = useState<number | null>(null);

  const redirectTo = (location.state as { from?: string } | null)?.from ?? "/";

  function afterLoginStep(step: "organization" | "2fa" | "done", data?: { organizationToken?: string; organizations?: { id: number; code: string; name: string }[]; twoFactorToken?: string }) {
    if (step === "organization") {
      setOrganizationStep({ token: data!.organizationToken!, organizations: data!.organizations! });
      setSelectedOrgId(data!.organizations![0]?.id ?? null);
      return;
    }
    if (step === "2fa") {
      navigate("/login/2fa", { state: { twoFactorToken: data!.twoFactorToken, from: redirectTo } });
      return;
    }
    navigate(redirectTo, { replace: true });
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const result = await login(email, password);
      if (result.step === "organization") {
        afterLoginStep("organization", { organizationToken: result.organizationToken, organizations: result.organizations });
      } else if (result.step === "2fa") {
        afterLoginStep("2fa", { twoFactorToken: result.twoFactorToken });
      } else {
        afterLoginStep("done");
      }
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleSelectOrganization(e: FormEvent) {
    e.preventDefault();
    if (!organizationStep || !selectedOrgId) return;
    setError(null);
    setIsSubmitting(true);
    try {
      const result = await selectOrganization(organizationStep.token, selectedOrgId);
      if (result.step === "2fa") {
        afterLoginStep("2fa", { twoFactorToken: result.twoFactorToken });
      } else {
        afterLoginStep("done");
      }
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>

      {/* ===== LEFT PANEL — Brand ===== */}
      <div style={{
        flex: "0 0 480px",
        background: "linear-gradient(160deg, #1e3a5f 0%, #0f2240 40%, #0a1628 100%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "3rem",
        position: "relative",
        overflow: "hidden",
      }}>
        {/* Decorative circles */}
        <div style={{
          position: "absolute", top: -80, right: -80,
          width: 300, height: 300,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(44,119,169,0.25) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />
        <div style={{
          position: "absolute", bottom: -60, left: -60,
          width: 240, height: 240,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(225,23,115,0.18) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />
        <div style={{
          position: "absolute", top: "30%", right: "10%",
          width: 180, height: 180,
          borderRadius: "50%",
          border: "1px solid rgba(237,174,59,0.15)",
          pointerEvents: "none",
        }} />
        <div style={{
          position: "absolute", bottom: "20%", left: "5%",
          width: 120, height: 120,
          borderRadius: "50%",
          border: "1px solid rgba(44,119,169,0.2)",
          pointerEvents: "none",
        }} />

        {/* Logo */}
        <img
          src="/images/logo.png"
          alt="MSDC Logo"
          style={{ width: 200, marginBottom: "2.5rem", filter: "drop-shadow(0 8px 24px rgba(0,0,0,0.4))" }}
          onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
        />

        {/* Brand text */}
        <div style={{ textAlign: "center", position: "relative", zIndex: 1 }}>
          <h1 style={{
            fontSize: "2.5rem",
            fontWeight: 900,
            color: "#fff",
            letterSpacing: "0.12em",
            margin: "0 0 0.5rem",
            textShadow: "0 2px 20px rgba(0,0,0,0.3)",
          }}>
            MSDC ERP
          </h1>
          <p style={{
            fontSize: "0.9rem",
            color: "rgba(255,255,255,0.55)",
            letterSpacing: "0.08em",
            margin: 0,
          }}>
            ENTERPRISE RESOURCE PLANNING
          </p>
        </div>

        {/* Tagline */}
        <div style={{
          marginTop: "3rem",
          textAlign: "center",
          position: "relative",
          zIndex: 1,
        }}>
          <div style={{
            fontSize: "1rem",
            color: "rgba(255,255,255,0.75)",
            fontWeight: 500,
            marginBottom: "0.5rem",
          }}>
            All-in-one platform for
          </div>
          <div style={{ display: "flex", gap: "0.5rem", justifyContent: "center", flexWrap: "wrap" }}>
            {["Finance", "CRM", "Operations", "HR"].map((tag) => (
              <span key={tag} style={{
                padding: "0.3rem 0.875rem",
                borderRadius: 20,
                background: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.15)",
                color: "rgba(255,255,255,0.7)",
                fontSize: "0.8rem",
                fontWeight: 600,
                backdropFilter: "blur(4px)",
              }}>
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Bottom gradient line */}
        <div style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: 4,
          background: "linear-gradient(90deg, #2C77A9, #E11773, #EDAE3B)",
        }} />
      </div>

      {/* ===== RIGHT PANEL — Login Form ===== */}
      <div style={{
        flex: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem",
        background: "#f4f6f9",
      }}>
        <div style={{ width: "100%", maxWidth: 400 }}>

          {/* Mobile logo (hidden on desktop) */}
          <div style={{ display: "none" }} />

          <div style={{
            marginBottom: "2rem",
          }}>
            <h2 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#1c2333", margin: "0 0 0.35rem" }}>
              Selamat Datang
            </h2>
            <p style={{ fontSize: "0.85rem", color: "var(--grey)", margin: 0 }}>
              Masuk ke akun MSDC Internal Portal Anda
            </p>
          </div>

          {!organizationStep ? (
            <form onSubmit={handleSubmit} style={{
              background: "white",
              borderRadius: 16,
              padding: "2rem",
              boxShadow: "0 4px 24px rgba(0,0,0,0.07)",
              border: "1px solid var(--border)",
            }}>
              <InputField
                label="Email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoFocus
                placeholder="nama@perusahaan.com"
              />
              <div style={{ marginBottom: "0.75rem" }}>
                <InputField
                  label="Password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>

              {error && (
                <div style={{
                  padding: "0.7rem 0.875rem",
                  background: "#fee2e2",
                  color: "#991b1b",
                  borderRadius: 8,
                  fontSize: "0.82rem",
                  marginBottom: "1rem",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <span style={{ fontSize: "1rem" }}>⚠️</span>
                    {error}
                  </div>
                  {isUnverifiedError && (
                    resendState === "sent" ? (
                      <div style={{ marginTop: "0.5rem", fontSize: "0.78rem", color: "#166534" }}>
                        ✅ Email verifikasi baru sudah dikirim ke {email}. Cek inbox (atau folder spam), lalu klik link di dalamnya.
                      </div>
                    ) : (
                      <button type="button" onClick={handleResendVerification} disabled={resendState === "sending"}
                        style={{ marginTop: "0.5rem", border: "none", background: "none", color: "#991b1b", textDecoration: "underline", cursor: "pointer", fontSize: "0.78rem", padding: 0, fontWeight: 600 }}>
                        {resendState === "sending" ? "Mengirim..." : "Kirim ulang email verifikasi"}
                      </button>
                    )
                  )}
                </div>
              )}

              <Button type="submit" disabled={isSubmitting} style={{ width: "100%", height: 44 }}>
                {isSubmitting ? (
                  <span style={{ display: "flex", alignItems: "center", gap: "0.5rem", justifyContent: "center" }}>
                    <LoadingSpinner /> Memproses...
                  </span>
                ) : (
                  <span style={{ display: "flex", alignItems: "center", gap: "0.5rem", justifyContent: "center" }}>
                    Masuk ke Portal →
                  </span>
                )}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleSelectOrganization} style={{
              background: "white",
              borderRadius: 16,
              padding: "2rem",
              boxShadow: "0 4px 24px rgba(0,0,0,0.07)",
              border: "1px solid var(--border)",
            }}>
              <button
                type="button"
                onClick={() => { setOrganizationStep(null); setError(null); }}
                style={{ display: "flex", alignItems: "center", gap: "0.3rem", background: "none", border: "none", color: "var(--grey)", cursor: "pointer", fontSize: "0.78rem", padding: 0, marginBottom: "1rem" }}
              >
                <ArrowLeft size={13} /> Kembali
              </button>

              <div style={{ fontSize: "0.85rem", fontWeight: 600, marginBottom: "0.9rem" }}>
                Pilih Organization
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginBottom: "1.25rem" }}>
                {organizationStep.organizations.map((org) => (
                  <button
                    key={org.id}
                    type="button"
                    onClick={() => setSelectedOrgId(org.id)}
                    style={{
                      display: "flex", alignItems: "center", gap: "0.6rem", width: "100%",
                      padding: "0.7rem 0.9rem", borderRadius: 10, textAlign: "left", cursor: "pointer",
                      border: `2px solid ${selectedOrgId === org.id ? "var(--accent)" : "var(--border)"}`,
                      background: selectedOrgId === org.id ? "var(--accent-light)" : "white",
                    }}
                  >
                    <Building2 size={16} color={selectedOrgId === org.id ? "var(--accent)" : "var(--grey)"} />
                    <div>
                      <div style={{ fontWeight: 600, fontSize: "0.85rem", color: selectedOrgId === org.id ? "var(--accent)" : "var(--text)" }}>{org.name}</div>
                      <div style={{ fontSize: "0.72rem", color: "var(--grey)", fontFamily: "monospace" }}>{org.code}</div>
                    </div>
                  </button>
                ))}
              </div>

              {error && (
                <div style={{
                  padding: "0.7rem 0.875rem", background: "#fee2e2", color: "#991b1b", borderRadius: 8,
                  fontSize: "0.82rem", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem",
                }}>
                  <span style={{ fontSize: "1rem" }}>⚠️</span>
                  {error}
                </div>
              )}

              <Button type="submit" disabled={isSubmitting || !selectedOrgId} style={{ width: "100%", height: 44 }}>
                {isSubmitting ? (
                  <span style={{ display: "flex", alignItems: "center", gap: "0.5rem", justifyContent: "center" }}>
                    <LoadingSpinner /> Memproses...
                  </span>
                ) : "Lanjutkan →"}
              </Button>
            </form>
          )}

          <p style={{ textAlign: "center", fontSize: "0.75rem", color: "var(--grey)", marginTop: "1.5rem" }}>
            Butuh bantuan? Hubungi IT Support internal Anda.
          </p>
        </div>
      </div>
    </div>
  );
}

function LoadingSpinner() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ animation: "msdc-spin 0.8s linear infinite" }}>
      <style>{`@keyframes msdc-spin { to { transform: rotate(360deg); } }`}</style>
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25" />
      <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}
