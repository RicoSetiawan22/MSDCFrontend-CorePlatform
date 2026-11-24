export type UserStatus = "active" | "inactive" | "pending" | "suspended";

export interface User {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  /** Sumber kebenaran status user - UserResource backend cuma kirim ini
   * (boolean), BUKAN field "status" string. is_active=false = user
   * langsung tidak bisa login lagi (lihat AuthController::login()). */
  is_active: boolean;
  roles?: string[];
  /** cp_user_organization - organization yang bisa dipilih user ini saat login. */
  organizations?: { id: number; code: string; name: string }[];
  created_at: string;
  updated_at: string;
}

export interface UserFormValues {
  name: string;
  email: string;
  password: string;
  phone?: string;
  roles?: string[];
  /** cp_user_organization - diisi LANGSUNG saat create supaya tidak ada
   * user baru yang lolos tanpa organization (dulu langkah terpisah lewat
   * "Edit Organisasi" yang gampang lupa - lihat UserController::store()). */
  organization_ids?: number[];
}

export interface UserListParams {
  page?: number;
  per_page?: number;
  status?: UserStatus;
  search?: string;
}
