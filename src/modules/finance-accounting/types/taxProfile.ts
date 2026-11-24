export interface TaxCustomerProfile {
  id: number;
  customer_id: number;
  customer_name: string;
  npwp: string | null;
  npwp_name: string | null;
  is_pkp: boolean;
  is_wapu: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

/** customerStore() UPSERT by customer_id - kirim customer_id yang sama
 * lagi untuk update profil pajak customer yang sudah ada. */
export interface TaxCustomerProfileFormValues {
  customer_id: number;
  customer_name: string;
  npwp?: string;
  npwp_name?: string;
  is_pkp?: boolean;
  is_wapu?: boolean;
  notes?: string;
}

export interface TaxCustomerProfileListParams {
  page?: number;
  per_page?: number;
  pkp_only?: boolean;
}

export interface TaxVendorProfile {
  id: number;
  vendor_id: number;
  vendor_name: string;
  npwp: string | null;
  npwp_name: string | null;
  is_pkp: boolean;
  default_tax_type_id: number | null;
  default_tax_type?: { id: number; code: string; name: string; rate: number } | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

/** vendorStore() UPSERT by vendor_id - sama pola dengan customerStore(). */
export interface TaxVendorProfileFormValues {
  vendor_id: number;
  vendor_name: string;
  npwp?: string;
  npwp_name?: string;
  is_pkp?: boolean;
  default_tax_type_id?: number;
  notes?: string;
}

export interface TaxVendorProfileListParams {
  page?: number;
  per_page?: number;
  pkp_only?: boolean;
}
