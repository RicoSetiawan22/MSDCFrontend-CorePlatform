import { useNavigate } from "react-router-dom";
import { ShieldCheck } from "lucide-react";
import { TwoFactorEnrollFlow } from "../components/TwoFactorEnrollFlow";
import { useAuth } from "@shared/lib/auth-context";

/**
 * Halaman WAJIB setup 2FA - muncul otomatis (lihat guard di App.tsx)
 * begitu user.twoFactorSetupRequired true, yaitu ketika role user ini
 * diwajibkan 2FA (Pengaturan Sistem > Kebijakan 2FA) TAPI dia belum
 * pernah setup TOTP sendiri. UI enroll-nya (QR/manual/konfirmasi) ada di
 * TwoFactorEnrollFlow.tsx - dipakai bareng dengan setup 2FA OPSIONAL di
 * "Akun Saya" (MyAccountPage.tsx), halaman ini cuma chrome-nya (judul,
 * penjelasan wajib, tombol Keluar).
 */
export function TwoFactorSetupPage() {
  const { refreshProfile, logout } = useAuth();
  const navigate = useNavigate();

  async function handleDone() {
    await refreshProfile();
    navigate("/", { replace: true });
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--sidebar-bg)", padding: "2rem" }}>
      <div className="card" style={{ padding: "2rem", width: "100%", maxWidth: 460 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.5rem" }}>
          <ShieldCheck size={22} color="var(--accent)" />
          <h1 style={{ fontSize: "1.3rem", margin: 0 }}>Setup 2FA Wajib</h1>
        </div>
        <p style={{ color: "var(--grey)", fontSize: "0.85rem", marginBottom: "1.5rem" }}>
          Role Anda diwajibkan mengaktifkan autentikasi 2 langkah sebelum bisa melanjutkan ke portal.
        </p>

        <TwoFactorEnrollFlow onComplete={handleDone} extraAction={{ label: "Keluar", onClick: () => logout() }} />
      </div>
    </div>
  );
}
