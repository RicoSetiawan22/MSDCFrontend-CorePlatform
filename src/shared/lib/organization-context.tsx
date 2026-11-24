/**
 * OrganizationContext — global active organization state.
 *
 * ARSITEKTUR BARU (organization sekarang dipilih SAAT LOGIN, bukan lewat
 * switcher di TopBar setelah login - lihat AuthController::login()/
 * selectOrganization() di backend dan auth-context.tsx di frontend):
 *  - auth-context.tsx SATU-SATUNYA yang menentukan organization aktif
 *    (dari response login, disimpan ke localStorage supaya tetap ada
 *    setelah refresh halaman).
 *  - Context ini HANYA membaca activeOrganization dari useAuth() - TIDAK
 *    lagi fetch daftar organization sendiri (dulu GET /organizations,
 *    yang membalas SEMUA organization ke SIAPAPUN, tanpa dibatasi hak
 *    akses user - itu sebabnya switcher-nya dihapus, bukan cuma dipindah).
 *  - activeOrgId TETAP disisipkan sebagai header X-Organization-Id di
 *    SEMUA request API (lihat api-client.ts interceptor) - TIDAK BERUBAH.
 *  - useOrganization()/useActiveOrgId() TETAP API YANG SAMA (dipakai
 *    banyak modul lain) - cuma cara dapat datanya yang berubah.
 */

import { createContext, useContext, useEffect, type ReactNode } from "react";
import { queryClient } from "@shared/lib/query-client";
import { useAuth } from "./auth-context";

export interface Organization {
  id: number;
  name: string;
  code: string;
}

interface OrganizationContextValue {
  /** ID organisasi yang sedang aktif — disisipkan di X-Organization-Id header. */
  activeOrgId: number;
  /** Org yang sedang aktif (dipilih saat login). Null cuma untuk sesi lama
   * sebelum fitur pilih-organization-saat-login ada, atau user tanpa
   * organization sama sekali. */
  activeOrg: Organization | null;
  isLoading: boolean;
}

// 0 menandakan tidak ada organisasi aktif; jangan mengarang ID tenant.
const FALLBACK_ORG_ID = 0;

const OrgContext = createContext<OrganizationContextValue | null>(null);

export function OrganizationProvider({ children }: { children: ReactNode }) {
  const { activeOrganization, isLoading: authLoading } = useAuth();

  // Begitu organization aktif berubah (mis. setelah login), invalidate
  // semua React Query cache supaya halaman-halaman refetch data dengan
  // org ID yang baru - dulu dipicu manual dari switchOrg() TopBar,
  // sekarang otomatis mengikuti activeOrganization dari auth-context.
  useEffect(() => {
    if (activeOrganization) {
      queryClient.invalidateQueries();
    }
  }, [activeOrganization?.id]);

  const activeOrgId = activeOrganization?.id ?? FALLBACK_ORG_ID;
  const activeOrg: Organization | null = activeOrganization
    ? { id: activeOrganization.id, name: activeOrganization.name, code: activeOrganization.code }
    : null;

  return (
    <OrgContext.Provider value={{ activeOrgId, activeOrg, isLoading: authLoading }}>
      {children}
    </OrgContext.Provider>
  );
}

export function useOrganization(): OrganizationContextValue {
  const ctx = useContext(OrgContext);
  if (!ctx) throw new Error("useOrganization() must be used within <OrganizationProvider>");
  return ctx;
}

/** Convenience hook — cuma activeOrgId-nya aja (bila tidak perlu keseluruhan context). */
export function useActiveOrgId(): number {
  return useOrganization().activeOrgId;
}
