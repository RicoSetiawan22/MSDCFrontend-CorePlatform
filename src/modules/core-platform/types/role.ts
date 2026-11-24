/** roles/permissions Spatie HANYA {id, name, guard_name, timestamps} - TIDAK
 * ada kolom description/status/is_system di database sama sekali (dicek
 * langsung lewat Schema::getColumnListing). module/action/display_name di
 * Permission dihitung backend dari nama ("module.action"), bukan kolom asli. */
export interface Permission {
  id: number;
  name: string;
  guard_name: string;
  module: string;
  action: string;
  display_name: string;
}

/** 6 section sidebar TETAP - HARUS persis sama dengan judul section di
 * src/app/Sidebar.tsx (SECTIONS array) DAN RoleController::SIDEBAR_SECTIONS
 * di backend, karena dicocokkan sebagai string literal apa adanya. */
export const SIDEBAR_SECTIONS = [
  "CRM & Sales",
  "Finance & Accounting",
  "Data Center Operations",
  "Procurement & Inventory",
  "HR & Service Support",
  "Core Platform",
] as const;

export interface Role {
  id: number;
  name: string;
  guard_name?: string;
  permissions?: { id: number; name: string }[];
  /** null = tidak dibatasi (semua section sidebar tampil buat role ini) -
   * lihat RoleController::SIDEBAR_SECTIONS & UserResource::resolveVisibleSections(). */
  sidebar_sections?: string[] | null;
}

export interface RoleFormValues {
  name: string;
  permissions?: string[];
}
