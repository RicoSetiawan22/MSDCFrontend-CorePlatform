/** "internal" = cabang milik sendiri (mis. MSDC Surabaya, MSDC Madiun) -
 * "customer"/"vendor" dipakai modul lain (CRM, Procurement), TIDAK
 * relevan untuk kop surat laporan - selalu filter type=internal saat
 * dipakai untuk keperluan itu. */
export type OrganizationType = "internal" | "customer" | "vendor";

export interface Organization {
  id: number;
  parent_id: number | null;
  code: string;
  name: string;
  type: OrganizationType;
  is_active: boolean;
  address_line_1: string | null;
  address_line_2: string | null;
  /** Referensi ke File Management (cp_fm_file) - GANTI dari logo_path
   * (path server diketik manual) supaya upload logo lewat sistem
   * terstruktur, bukan admin ketik path server manual. */
  logo_file_id: number | null;
  npwp?: string | null;
  nib?: string | null;
  pic_name?: string | null;
  pic_email?: string | null;
  pic_phone?: string | null;
}

/** Field yang BENAR-BENAR diterima OrganizationController::store() /
 * update() — semua field yang divalidasi dan di-accept backend. */
export interface OrganizationFormValues {
  parent_id?: number;
  code: string;
  name: string;
  type: OrganizationType;
  npwp?: string;
  address_line_1?: string;
  address_line_2?: string;
  pic_name?: string;
  pic_email?: string;
  pic_phone?: string;
  is_active?: boolean;
  logo_file_id?: number | null;
}

export interface OrganizationListParams {
  page?: number;
  per_page?: number;
  type?: OrganizationType;
  search?: string;
}
