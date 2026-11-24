import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@shared/lib/auth-context";

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <div style={{ padding: "2rem", textAlign: "center", color: "var(--grey)" }}>Memuat...</div>;
  }

  if (!isAuthenticated) {
    // Simpan URL tujuan semula supaya LoginPage bisa balikkan ke sini
    // setelah login berhasil - lihat redirectTo di LoginPage.tsx.
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  return <>{children}</>;
}
