import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";

/**
 * API client TERPUSAT - SATU-SATUNYA tempat yang tahu detail base URL,
 * header Authorization, dan penanganan sesi habis. Modul manapun (crm-sales,
 * finance-accounting, dst) import instance INI, tidak pernah bikin axios
 * instance sendiri-sendiri.
 *
 * CATATAN PENTING soal "auto-refresh token": backend Laravel Passport di
 * project ini pakai Personal Access Token (masa berlaku 6 bulan, lihat
 * Passport::personalAccessTokensExpireIn() di CorePlatformServiceProvider),
 * BUKAN authorization-code grant dengan refresh_token terpisah. TIDAK ADA
 * endpoint POST /auth/refresh di backend saat ini.
 *
 * Jadi "auto-refresh" di sini BUKAN "diam-diam tukar token lama dengan
 * token baru tanpa user sadar" (itu tidak mungkin dengan skema token
 * sekarang) - tapi "penanganan sesi habis yang rapi": begitu API balas 401
 * (token invalid/kedaluwarsa), user OTOMATIS diarahkan ke halaman login,
 * dengan URL tujuan semula disimpan supaya begitu login ulang, langsung
 * balik ke halaman yang tadi dibuka - bukan dilempar ke dashboard kosong.
 *
 * Kalau nanti butuh sesi yang benar-benar bisa diperpanjang tanpa login
 * ulang, itu perlu penambahan di BACKEND dulu (endpoint /auth/refresh
 * atau ganti ke Passport authorization-code grant yang punya refresh_token
 * asli) - bukan sesuatu yang bisa "diakali" dari frontend saja.
 */

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string) || "/api";

const TOKEN_STORAGE_KEY = "msdc_access_token";
const TOKEN_EXPIRY_STORAGE_KEY = "msdc_token_expires_at";

export const tokenStorage = {
  get(): string | null {
    return localStorage.getItem(TOKEN_STORAGE_KEY);
  },
  set(token: string, expiresAt: string | null): void {
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
    if (expiresAt) localStorage.setItem(TOKEN_EXPIRY_STORAGE_KEY, expiresAt);
  },
  clear(): void {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(TOKEN_EXPIRY_STORAGE_KEY);
  },
  getExpiresAt(): Date | null {
    const raw = localStorage.getItem(TOKEN_EXPIRY_STORAGE_KEY);
    return raw ? new Date(raw) : null;
  },
};

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    Accept: "application/json",
  },
});

// ---- Helper: get active org ID (diset saat login, lihat auth-context.tsx ActiveOrganization) ----
function getActiveOrgId(): number | null {
  const stored = localStorage.getItem("msdc_active_org_id");
  return stored ? Number(stored) : null;
}

// ---- Request interceptor: Bearer token + X-Organization-Id header + boolean params ----
apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = tokenStorage.get();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // Header scoping — backend pakai X-Organization-Id untuk ScopesOrganization trait
  // (auto-scoped queries DAN auto-set organization_id saat create, lihat
  // ScopesOrganization::bootScopesOrganization()). TIDAK ADA injeksi organization_id
  // ke body di sini lagi — dulu ada injeksi hardcoded organization_id=2 ke SETIAP
  // body POST/PUT/PATCH yang belum punya field itu, tapi ini redundant (backend
  // sudah handle lewat header) SEKALIGUS salah untuk entity yang organization_id-nya
  // memang harus tetap null (mis. field `users.organization_id` yang cuma dipakai
  // user customer/tenant, BUKAN staff internal — lihat UserController::store()).
  // Nilai hardcoded "2" juga cuma valid kalau organisasi id 2 kebetulan ada di DB
  // yang aktif — di server lain (mis. server Debian user) ini menyebabkan gagal
  // validasi "The selected organization id is invalid." pada SEMUA form create
  // yang tidak eksplisit mengisi organization_id sendiri.
  const orgId = getActiveOrgId();
  if (orgId !== null) {
    config.headers["X-Organization-Id"] = String(orgId);
  }

  // Laravel tidak menerima string "true"/"false" di query string GET —
  // ubah ke integer 1/0 yang dikenali Laravel validation.
  if (config.params && typeof config.params === "object") {
    for (const key of Object.keys(config.params)) {
      if (typeof (config.params as Record<string, unknown>)[key] === "boolean") {
        (config.params as Record<string, unknown>)[key] = (config.params as Record<string, unknown>)[key] ? 1 : 0;
      }
    }
  }

  return config;
});

// ---- Response interceptor: tangani 401 secara terpusat ----
// Callback ini di-set oleh AuthProvider saat aplikasi mulai jalan (lihat
// auth-context.tsx) - dipisah dari sini supaya api-client.ts TIDAK perlu
// tahu apa-apa soal React/routing, cuma exec 1 fungsi yang disuntikkan.
let onUnauthorized: (() => void) | null = null;
export function registerUnauthorizedHandler(handler: () => void) {
  onUnauthorized = handler;
}

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      tokenStorage.clear();
      onUnauthorized?.();
    }
    return Promise.reject(error);
  },
);

/**
 * Sisa hari sebelum token kedaluwarsa - dipakai SessionExpiryBanner untuk
 * kasih peringatan proaktif SEBELUM user tiba-tiba ke-logout di tengah
 * kerja (UX lebih baik daripada nunggu 401 muncul mendadak).
 */
export function daysUntilTokenExpiry(): number | null {
  const expiresAt = tokenStorage.getExpiresAt();
  if (!expiresAt) return null;

  const diffMs = expiresAt.getTime() - Date.now();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Helper ekstraksi pesan error yang type-safe dan ternormalisasi dari AxiosError / API response
 */
export function getApiErrorMessage(err: unknown, defaultMessage = "Terjadi kesalahan pada server"): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as { message?: string; errors?: Record<string, string[] | string> } | undefined;
    
    // Prioritaskan pesan validasi spesifik per-field dari backend (mis. Laravel 422 errors)
    if (data?.errors && typeof data.errors === "object") {
      const errorKeys = Object.keys(data.errors);
      if (errorKeys.length > 0) {
        const firstField = errorKeys[0];
        const fieldError = data.errors[firstField];
        if (Array.isArray(fieldError) && fieldError.length > 0) {
          return fieldError[0];
        }
        if (typeof fieldError === "string" && fieldError.trim().length > 0) {
          return fieldError;
        }
      }
    }

    if (data?.message) return data.message;
    return err.message || defaultMessage;
  }
  if (err instanceof Error) {
    return err.message;
  }
  return defaultMessage;
}

