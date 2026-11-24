export interface ApiKey {
  id: number;
  name: string;
  key_prefix: string;
  owner_description: string | null;
  scopes: string[] | null;
  /** IP/CIDR yang diizinkan akses pakai key ini - null/kosong = tidak ada
   * pembatasan IP. Dipakai terutama untuk sensor IoT (lihat
   * ApiKey::ipAllowed() backend). */
  allowed_ips: string[] | null;
  is_active: boolean;
  last_used_at: string | null;
  expires_at: string | null;
  created_by: number | null;
  created_at: string;
  updated_at: string;
}

export interface ApiKeyListParams {
  page?: number;
  per_page?: number;
  is_active?: boolean;
}

export interface ApiKeyCreateValues {
  name: string;
  owner_description?: string;
  allowed_ips?: string[];
  expires_at?: string;
}
