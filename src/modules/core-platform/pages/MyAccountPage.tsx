import { useEffect, useState } from "react";
import { UserCircle, ShieldCheck, ShieldOff, KeyRound } from "lucide-react";
import { profileApi } from "../api/profileApi";
import { twoFactorApi } from "../api/twoFactorApi";
import { TwoFactorEnrollFlow } from "../components/TwoFactorEnrollFlow";
import { useAuth } from "@shared/lib/auth-context";
import { useOrganization } from "@shared/lib/organization-context";
import { PageHeader } from "@shared/components/PageHeader";
import { Button } from "@shared/components/Button";
import { InputField } from "@shared/components/InputField";
import { Modal } from "@shared/components/Modal";
import { LoadingState } from "@shared/components/LoadingState";
import { extractErrorMessage } from "@shared/types/api";

/**
 * "Akun Saya" - menu KHUSUS di luar semua modul (lihat NavLink berdiri
 * sendiri di Sidebar.tsx, sejajar dengan "Finance Dashboard" - BUKAN
 * masuk salah satu SECTIONS modul). Sengaja tidak digerbang permission
 * apapun (requiredPermissions: [] di nav.ts) - hal-hal di sini
 * (nama, password, 2FA) itu milik SETIAP user atas akunnya sendiri,
 * bukan hak administratif yang perlu izin khusus.
 */
export function MyAccountPage() {
  const { user, refreshProfile } = useAuth();
  const { activeOrg } = useOrganization();

  const [name, setName] = useState(user?.name ?? "");
  const [savingName, setSavingName] = useState(false);
  const [nameSaved, setNameSaved] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);

  // user null di render PERTAMA kalau halaman ini yang dibuka duluan
  // setelah refresh (AuthProvider masih fetch /auth/me) - useState di atas
  // sudah kepalang nangkep "" dan tidak reset sendiri, jadi sinkronkan
  // manual begitu profil selesai dimuat.
  useEffect(() => {
    if (user) setName(user.name);
  }, [user]);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newPasswordConfirmation, setNewPasswordConfirmation] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordSaved, setPasswordSaved] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const [twoFactorEnabled, setTwoFactorEnabled] = useState<boolean | null>(null);
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [disabling, setDisabling] = useState(false);
  const [twoFactorError, setTwoFactorError] = useState<string | null>(null);

  useEffect(() => {
    twoFactorApi.status().then((res) => setTwoFactorEnabled(res.data.data.enabled)).catch(() => setTwoFactorEnabled(false));
  }, []);

  async function handleSaveName(e: React.FormEvent) {
    e.preventDefault();
    setNameError(null);
    setNameSaved(false);
    setSavingName(true);
    try {
      await profileApi.updateName(name);
      await refreshProfile();
      setNameSaved(true);
    } catch (err) {
      setNameError(extractErrorMessage(err));
    } finally {
      setSavingName(false);
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSaved(false);
    setSavingPassword(true);
    try {
      await profileApi.changePassword(currentPassword, newPassword, newPasswordConfirmation);
      setCurrentPassword("");
      setNewPassword("");
      setNewPasswordConfirmation("");
      setPasswordSaved(true);
    } catch (err) {
      setPasswordError(extractErrorMessage(err));
    } finally {
      setSavingPassword(false);
    }
  }

  async function handleDisable2fa() {
    if (!confirm("Nonaktifkan 2FA untuk akun ini? Anda tidak akan diminta kode 2 langkah lagi saat login.")) return;
    setTwoFactorError(null);
    setDisabling(true);
    try {
      await twoFactorApi.disable();
      setTwoFactorEnabled(false);
    } catch (err) {
      setTwoFactorError(extractErrorMessage(err));
    } finally {
      setDisabling(false);
    }
  }

  function handleEnrollComplete() {
    setShowEnrollModal(false);
    setTwoFactorEnabled(true);
  }

  return (
    <div>
      <PageHeader title="Akun Saya" subtitle="Kelola profil, password, dan keamanan login Anda sendiri." />

      <div className="content-card" style={{ marginBottom: "1.25rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
          <UserCircle size={18} color="var(--accent)" />
          <h3 style={{ margin: 0 }}>Profil</h3>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 1rem", marginBottom: "0.5rem", fontSize: "0.85rem" }}>
          <div>
            <div style={{ color: "var(--grey)", fontSize: "0.72rem", marginBottom: "0.2rem" }}>Email</div>
            <div style={{ fontWeight: 600 }}>{user?.email}</div>
          </div>
          <div>
            <div style={{ color: "var(--grey)", fontSize: "0.72rem", marginBottom: "0.2rem" }}>Role</div>
            <div style={{ fontWeight: 600 }}>{user?.roles.join(", ") || "—"}</div>
          </div>
          <div>
            <div style={{ color: "var(--grey)", fontSize: "0.72rem", marginBottom: "0.2rem" }}>Organisasi Aktif</div>
            <div style={{ fontWeight: 600 }}>{activeOrg?.name ?? "—"}</div>
          </div>
        </div>
        <p style={{ fontSize: "0.72rem", color: "var(--grey)", marginBottom: "1rem" }}>
          Email, role, dan organisasi tidak bisa diubah sendiri di sini - hubungi admin (menu User Management) kalau perlu diubah.
        </p>

        <form onSubmit={handleSaveName} style={{ maxWidth: 360 }}>
          <InputField label="Nama Lengkap" required value={name} onChange={(e) => setName(e.target.value)} />
          {nameError && <div className="input-error" style={{ marginBottom: "1rem" }}>{nameError}</div>}
          {nameSaved && !nameError && <div style={{ color: "var(--good)", fontSize: "0.82rem", marginBottom: "1rem" }}>Nama berhasil diperbarui.</div>}
          <Button type="submit" disabled={savingName}>{savingName ? "Menyimpan..." : "Simpan Nama"}</Button>
        </form>
      </div>

      <div className="content-card" style={{ marginBottom: "1.25rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
          <KeyRound size={18} color="var(--accent)" />
          <h3 style={{ margin: 0 }}>Ubah Password</h3>
        </div>
        <form onSubmit={handleChangePassword} style={{ maxWidth: 360 }}>
          <InputField label="Password Saat Ini" type="password" required value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
          <InputField label="Password Baru" type="password" minLength={8} required value={newPassword} onChange={(e) => setNewPassword(e.target.value)} hint="Minimal 8 karakter." />
          <InputField label="Konfirmasi Password Baru" type="password" required value={newPasswordConfirmation} onChange={(e) => setNewPasswordConfirmation(e.target.value)} />
          {passwordError && <div className="input-error" style={{ marginBottom: "1rem" }}>{passwordError}</div>}
          {passwordSaved && !passwordError && <div style={{ color: "var(--good)", fontSize: "0.82rem", marginBottom: "1rem" }}>Password berhasil diubah.</div>}
          <Button type="submit" disabled={savingPassword}>{savingPassword ? "Menyimpan..." : "Ubah Password"}</Button>
        </form>
      </div>

      <div className="content-card">
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
          <ShieldCheck size={18} color="var(--accent)" />
          <h3 style={{ margin: 0 }}>Autentikasi 2 Langkah (2FA)</h3>
        </div>
        <p style={{ color: "var(--grey)", fontSize: "0.85rem", marginBottom: "1rem" }}>
          Tambah lapisan keamanan - selain email &amp; password, login akan minta kode 6 digit dari aplikasi authenticator.
        </p>

        {twoFactorEnabled === null && <LoadingState />}

        {twoFactorEnabled === false && (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", background: "var(--bg-subtle)", borderRadius: 8, padding: "0.6rem 0.8rem", fontSize: "0.82rem", marginBottom: "1rem", color: "var(--grey)" }}>
              <ShieldOff size={15} /> 2FA belum aktif untuk akun ini.
            </div>
            <Button onClick={() => setShowEnrollModal(true)}>Aktifkan 2FA</Button>
          </>
        )}

        {twoFactorEnabled === true && (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", background: "#f0fdf4", border: "1px solid #bbf7d0", color: "#15803d", borderRadius: 8, padding: "0.6rem 0.8rem", fontSize: "0.82rem", marginBottom: "1rem" }}>
              <ShieldCheck size={15} /> 2FA sudah aktif untuk akun ini.
            </div>
            {twoFactorError && <div className="input-error" style={{ marginBottom: "1rem" }}>{twoFactorError}</div>}
            <Button variant="danger" onClick={handleDisable2fa} disabled={disabling}>
              {disabling ? "Menonaktifkan..." : "Nonaktifkan 2FA"}
            </Button>
          </>
        )}
      </div>

      {showEnrollModal && (
        <Modal title="Aktifkan 2FA" onClose={() => setShowEnrollModal(false)}>
          <TwoFactorEnrollFlow
            onComplete={handleEnrollComplete}
            extraAction={{ label: "Batal", onClick: () => setShowEnrollModal(false) }}
          />
        </Modal>
      )}
    </div>
  );
}
