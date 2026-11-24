import { Outlet, Navigate, useLocation } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { SessionExpiryBanner } from "@shared/components/SessionExpiryBanner";
import { useAuth } from "@shared/lib/auth-context";

/**
 * Layout bersama SEMUA halaman yang butuh login - Sidebar + TopBar + area
 * konten. <Outlet /> di sini yang jadi tempat React Router me-render route
 * anak (halaman tiap modul) - lihat children di app/router.tsx.
 *
 * height: "100vh" (BUKAN minHeight) SENGAJA - mengunci tinggi shell PERSIS
 * setinggi layar, supaya <main overflowY:"auto"> di bawah ini benar-benar
 * jadi area scroll MANDIRI (Sidebar & TopBar tetap diam di tempat saat
 * konten panjang di-scroll) - lihat html,body,#root{height:100%} di
 * global.css yang jadi syarat supaya height:100vh ini bekerja sampai ke
 * bawah. Halaman biasa (list/form standar) TETAP scroll wajar dalam
 * <main> ini; halaman full-screen (mis. ArInvoiceFormPage) memanfaatkan
 * tinggi PENUH yang terkunci ini untuk layout 2-kolom yang scroll
 * independen per kolom.
 */
const TWO_FACTOR_SETUP_PATH = "/2fa/setup";

export function AppLayout() {
  const { twoFactorSetupRequired } = useAuth();
  const location = useLocation();

  // Role user ini diwajibkan 2FA (Pengaturan Sistem > Kebijakan 2FA) TAPI
  // dia belum pernah setup TOTP sendiri - paksa ke halaman setup, blokir
  // navigasi ke halaman lain manapun sampai selesai (lihat
  // TwoFactorSetupPage.tsx). Halaman setup itu sendiri dikecualikan dari
  // redirect ini (kalau tidak, akan loop redirect ke diri sendiri).
  if (twoFactorSetupRequired && location.pathname !== TWO_FACTOR_SETUP_PATH) {
    return <Navigate to={TWO_FACTOR_SETUP_PATH} replace />;
  }

  // Halaman setup 2FA ditampilkan TANPA Sidebar/TopBar - fokus penuh,
  // tidak ada jalan pintas ke halaman lain lewat menu.
  if (location.pathname === TWO_FACTOR_SETUP_PATH) {
    return <Outlet />;
  }

  return (
    <div style={{ display: "flex", height: "100vh" }}>
      <Sidebar />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <TopBar />
        <SessionExpiryBanner />
        <main style={{ flex: 1, overflowY: "auto", minHeight: 0 }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
