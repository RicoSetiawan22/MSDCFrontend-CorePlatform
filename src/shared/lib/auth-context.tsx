import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { apiClient, registerUnauthorizedHandler, tokenStorage } from "./api-client";

/** Cocok PERSIS dengan UserResource.php (Team 1) - jangan tambah field di
 * sini tanpa cek dulu backend benar-benar mengirimkannya. */
export interface AuthUser {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  is_active: boolean;
  organization: { id: number; name: string } | null;
  organizations?: ActiveOrganization[];
  roles: string[];
  permissions: string[];
  /** null = tidak dibatasi (semua menu sidebar tampil) - gabungan dari
   * SEMUA role user ini, lihat RoleController::SIDEBAR_SECTIONS &
   * UserResource::resolveVisibleSections() di backend. Dipakai Sidebar.tsx
   * buat sembunyikan section menu yang tidak relevan buat role user - beda
   * dari 'permissions' di atas yang mengatur boleh/tidak suatu AKSI. */
  visible_sections: string[] | null;
}

/** Organization yang DIPILIH SAAT LOGIN - BEDA dari AuthUser.organization
 * di atas (kolom tetap organization_id user, biasanya null untuk staf
 * internal). Ini yang jadi X-Organization-Id header (lihat
 * organization-context.tsx) - dipilih sekali di layar login, TIDAK ADA
 * lagi switcher terpisah di TopBar setelah login. */
export interface ActiveOrganization {
  id: number;
  code: string;
  name: string;
}

const ACTIVE_ORG_STORAGE_KEY = "msdc_active_org_id";
const ACTIVE_ORG_NAME_KEY = "msdc_active_org_name";
const ACTIVE_ORG_CODE_KEY = "msdc_active_org_code";

function persistActiveOrganization(org: ActiveOrganization | null): void {
  if (!org) {
    localStorage.removeItem(ACTIVE_ORG_STORAGE_KEY);
    localStorage.removeItem(ACTIVE_ORG_NAME_KEY);
    localStorage.removeItem(ACTIVE_ORG_CODE_KEY);
    return;
  }
  localStorage.setItem(ACTIVE_ORG_STORAGE_KEY, String(org.id));
  localStorage.setItem(ACTIVE_ORG_NAME_KEY, org.name);
  localStorage.setItem(ACTIVE_ORG_CODE_KEY, org.code);
}

/**
 * Logout DAN sesi expired (401) SAMA-SAMA lewat sini - full page reload
 * ke /login, BUKAN navigate() dari react-router. AuthProvider dipasang
 * DI LUAR <RouterProvider> di main.tsx (supaya OrganizationProvider bisa
 * baca activeOrganization dari sini), jadi tidak punya akses ke hook
 * useNavigate() sama sekali. Reload penuh ini SEKALIGUS jadi keuntungan -
 * membersihkan cache React Query & state komponen manapun yang mungkin
 * ninggalin data user lama, bukan cuma reset context ini doang.
 */
function redirectToLogin(): void {
  window.location.href = "/login";
}

function readStoredActiveOrganization(): ActiveOrganization | null {
  const id = localStorage.getItem(ACTIVE_ORG_STORAGE_KEY);
  const name = localStorage.getItem(ACTIVE_ORG_NAME_KEY);
  const code = localStorage.getItem(ACTIVE_ORG_CODE_KEY);
  const parsedId = Number(id);
  if (!id || !name || !Number.isSafeInteger(parsedId) || parsedId <= 0) return null;
  return { id: parsedId, name, code: code ?? "" };
}

interface LoginSuccessData {
  access_token: string;
  token_type: string;
  expires_at: string;
  organization: ActiveOrganization | null;
  two_factor_setup_required: boolean;
}

interface LoginRequiresOrgSelectionData {
  requires_organization_selection: true;
  organization_token: string;
  organizations: { id: number; code: string; name: string }[];
  expires_in_minutes: number;
}

interface LoginRequires2faData {
  requires_2fa: true;
  two_factor_token: string;
  expires_in_minutes: number;
}

type LoginResponse =
  | { message: string; data: LoginSuccessData }
  | LoginRequiresOrgSelectionData
  | LoginRequires2faData;

/** Hasil login() - lapisan UI (LoginPage) cek field mana yang ada untuk
 * tahu langkah berikutnya: pilih organization, masukkan kode 2FA, atau
 * sudah selesai. */
export type LoginResult =
  | { step: "organization"; organizationToken: string; organizations: { id: number; code: string; name: string }[] }
  | { step: "2fa"; twoFactorToken: string }
  | { step: "done" };

interface AuthContextValue {
  user: AuthUser | null;
  activeOrganization: ActiveOrganization | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  /** true = kebijakan 2FA mewajibkan role user ini, TAPI dia belum
   * setup TOTP sendiri - frontend WAJIB paksa ke halaman setup 2FA
   * sebelum mengizinkan akses ke halaman lain. */
  twoFactorSetupRequired: boolean;
  login: (email: string, password: string) => Promise<LoginResult>;
  selectOrganization: (organizationToken: string, organizationId: number) => Promise<LoginResult>;
  loginTwoFactor: (twoFactorToken: string, code: string) => Promise<void>;
  logout: () => Promise<void>;
  hasPermission: (permission: string) => boolean;
  /** Dipanggil setelah user MENYELESAIKAN setup 2FA wajib - refresh profil
   * supaya twoFactorSetupRequired jadi false tanpa perlu logout/login ulang. */
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * SATU-SATUNYA tempat yang panggil GET /auth/me - dipakai baik saat app
 * pertama kali dibuka (restore sesi dari token tersimpan) MAUPUN tepat
 * setelah login berhasil. Disatukan di sini supaya `user.permissions`
 * SELALU terisi konsisten - response login()/2fa-login() sendiri TIDAK
 * menyertakan permissions (cuma /auth/me yang menyertakan, dan cuma kalau
 * diminta lewat ?with_permissions=1 - lihat UserResource.php).
 */
async function fetchFullProfile(): Promise<{ user: AuthUser; twoFactorSetupRequired: boolean }> {
  const res = await apiClient.get<{ data: AuthUser; two_factor_setup_required: boolean }>("/v1/core-platform/auth/me", {
    params: { with_permissions: 1 },
  });
  return { user: res.data.data, twoFactorSetupRequired: res.data.two_factor_setup_required };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [activeOrganization, setActiveOrganizationState] = useState<ActiveOrganization | null>(() => readStoredActiveOrganization());
  const [twoFactorSetupRequired, setTwoFactorSetupRequired] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  function applyOrganization(org: ActiveOrganization | null) {
    persistActiveOrganization(org);
    setActiveOrganizationState(org);
  }

  useEffect(() => {
    registerUnauthorizedHandler(() => { tokenStorage.clear(); redirectToLogin(); });
  }, []);

  useEffect(() => {
    const token = tokenStorage.get();
    if (!token) {
      setIsLoading(false);
      return;
    }

    fetchFullProfile()
      .then(async (profile) => {
        const storedOrg = readStoredActiveOrganization();
        const memberships = profile.user.organizations ?? [];

        if (storedOrg && !memberships.some((org) => org.id === storedOrg.id)) {
          throw new Error("Organisasi sesi tidak lagi tersedia.");
        }
        if (!storedOrg && memberships.length > 1) {
          throw new Error("Pilih ulang organisasi saat login.");
        }
        if (!storedOrg && memberships.length === 1) {
          // Sesi lama dapat punya token tanpa organisasi tersimpan. Login baru
          // otomatis memilih satu-satunya membership, jadi pulihkan nilai itu
          // lalu muat ulang profil dengan header organisasi yang benar.
          persistActiveOrganization(memberships[0]);
          setActiveOrganizationState(memberships[0]);
          profile = await fetchFullProfile();
        }

        setUser(profile.user);
        setTwoFactorSetupRequired(profile.twoFactorSetupRequired);
      })
      .catch(() => {
        tokenStorage.clear();
        persistActiveOrganization(null);
        setActiveOrganizationState(null);
        redirectToLogin();
      })
      .finally(() => setIsLoading(false));
  }, []);

  async function finalizeSuccessfulLogin(success: LoginSuccessData): Promise<void> {
    tokenStorage.set(success.access_token, success.expires_at);
    applyOrganization(success.organization);
    setTwoFactorSetupRequired(success.two_factor_setup_required);
    const { user } = await fetchFullProfile();
    setUser(user);
  }

  async function login(email: string, password: string): Promise<LoginResult> {
    const res = await apiClient.post<LoginResponse>("/v1/core-platform/auth/login", { email, password });

    if ("requires_organization_selection" in res.data) {
      return { step: "organization", organizationToken: res.data.organization_token, organizations: res.data.organizations };
    }
    if ("requires_2fa" in res.data) {
      return { step: "2fa", twoFactorToken: res.data.two_factor_token };
    }

    await finalizeSuccessfulLogin(res.data.data);
    return { step: "done" };
  }

  async function selectOrganization(organizationToken: string, organizationId: number): Promise<LoginResult> {
    const res = await apiClient.post<LoginResponse>("/v1/core-platform/auth/select-organization", {
      organization_token: organizationToken,
      organization_id: organizationId,
    });

    if ("requires_2fa" in res.data) {
      return { step: "2fa", twoFactorToken: res.data.two_factor_token };
    }
    if ("data" in res.data) {
      await finalizeSuccessfulLogin(res.data.data);
      return { step: "done" };
    }
    // Tidak seharusnya balas requires_organization_selection lagi di sini.
    throw new Error("Respons tidak terduga dari server saat memilih organization.");
  }

  async function loginTwoFactor(twoFactorToken: string, code: string) {
    const res = await apiClient.post<{ data: LoginSuccessData }>("/v1/core-platform/auth/2fa-login", {
      two_factor_token: twoFactorToken,
      code,
    });

    await finalizeSuccessfulLogin(res.data.data);
  }

  async function logout() {
    try {
      await apiClient.post("/v1/core-platform/auth/logout");
    } finally {
      tokenStorage.clear();
      redirectToLogin();
    }
  }

  function hasPermission(permission: string): boolean {
    return user?.permissions?.includes(permission) ?? false;
  }

  async function refreshProfile(): Promise<void> {
    const { user, twoFactorSetupRequired } = await fetchFullProfile();
    setUser(user);
    setTwoFactorSetupRequired(twoFactorSetupRequired);
  }

  return (
    <AuthContext.Provider value={{
      user, activeOrganization, isAuthenticated: !!user, isLoading, twoFactorSetupRequired,
      login, selectOrganization, loginTwoFactor, logout, hasPermission, refreshProfile,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth() harus dipakai di dalam <AuthProvider>");
  return ctx;
}
