import { useAuth } from "@shared/lib/auth-context";

/**
 * Nama user yang sedang login - dipakai mengisi otomatis nama penandatangan
 * (Marketing / pihak MSDC) di PDF. Dibaca defensif: kalau auth context tidak
 * punya `user.name`, hasilnya string kosong dan kolom nama tinggal diketik
 * manual (tidak error).
 */
export function useCurrentUserName(): string {
  const auth = useAuth() as unknown as { user?: { name?: string | null } | null };
  return auth?.user?.name?.trim() ?? "";
}
