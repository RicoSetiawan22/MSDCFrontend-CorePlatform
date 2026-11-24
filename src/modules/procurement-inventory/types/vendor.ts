export type VendorCategory = "hardware" | "service" | "sparepart" | "other";
export type TaxStatus = "pkp" | "non_pkp" | "pemungut";
export type VendorStatus = "active" | "blacklisted" | "inactive";

export interface VendorDocument {
  id: string;
  file_name: string;
  document_type: string;
  file_url: string;
}

export interface Vendor {
  id: string | number;
  vendor_code: string;
  vendor_name: string;
  legal_name?: string;
  npwp?: string;
  sppkp_number?: string;
  tax_status: TaxStatus;
  category: VendorCategory;
  categories?: VendorCategory[];
  category_other_detail?: string;
  payment_term_days: number;
  rating?: number;
  status: VendorStatus;
  is_verified?: boolean;
  notes?: string;
  // Kontak Vendor (Wajib di update-procurement)
  pic_name?: string;
  pic_position?: string;
  pic_phone?: string;
  pic_email?: string;
  // Alamat Lengkap
  address?: string;
  city?: string;
  province?: string;
  postal_code?: string;
  // Finansial & Legal
  default_pph?: string;
  currency?: string;
  credit_limit?: number;
  nib_siup?: string;
  website?: string;
  // Bank
  bank_name?: string;
  bank_account_number?: string;
  bank_account_holder?: string;
  documents?: VendorDocument[];
}

export interface VendorFormValues {
  vendor_name: string;
  legal_name?: string;
  npwp?: string;
  sppkp_number?: string;
  tax_status: TaxStatus;
  category: VendorCategory;
  categories?: VendorCategory[];
  category_other_detail?: string;
  payment_term_days: number;
  rating?: number;
  notes?: string;
  // Kontak Vendor
  pic_name?: string;
  pic_position?: string;
  pic_phone?: string;
  pic_email?: string;
  // Alamat Lengkap
  address?: string;
  city?: string;
  province?: string;
  postal_code?: string;
  // Finansial & Legal
  default_pph?: string;
  currency?: string;
  credit_limit?: number;
  nib_siup?: string;
  website?: string;
  // Bank
  bank_name?: string;
  bank_account_number?: string;
  bank_account_holder?: string;
}

export interface VendorListParams {
  search?: string;
  category?: VendorCategory;
  tax_status?: TaxStatus;
  status?: VendorStatus;
  page?: number;
  per_page?: number;
}

export interface VendorKPIStats {
  totalVendors: number;
  activeVendors: number;
  inactiveVendors?: number;
  blacklistedVendors: number;
  pkpVendors: number;
  nonPkpVendors: number;
}
