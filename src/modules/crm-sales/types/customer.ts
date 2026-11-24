/** Cocok dengan kolom fillable Customer entity (Modules/CrmSales/app/Entities/Customer.php) */
export interface Customer {
  id: number;
  customer_code: string;
  organization_id: number | null;
  company_name: string;
  legal_name: string | null;
  npwp: string | null;
  customer_type_code: string | null;
  industry_code: string | null;
  status: CustomerStatus;
  assigned_to: number | null;
  notes: string | null;
  addresses?: Array<{ id: number; address_line: string; is_primary: boolean; city?: string | null; province?: string | null; postal_code?: string | null }>;
  contacts?: Array<{ id: number; name: string; position: string | null; phone: string | null; email: string | null; is_primary: boolean }>;
  created_at: string;
  updated_at: string;
}

export type CustomerStatus = "prospect" | "active" | "inactive" | "churned";

/** Field yang dikirim saat create/update - cocok dengan validasi CustomerController::store() */
export interface CustomerFormValues {
  organization_id?: number | null;
  company_name: string;
  legal_name?: string;
  npwp?: string;
  customer_type_code?: string;
  industry_code?: string;
  notes?: string;
  /** Alamat kantor/pelanggan, disimpan sebagai customer_address utama. */
  address_line?: string;
  /** Kontak teknis pelanggan, terpisah dari PIC internal dari Leads. */
  pic_technical_name?: string;
  pic_technical_phone?: string;
  pic_technical_email?: string;
}

export interface CustomerListParams {
  page?: number;
  per_page?: number;
  status?: CustomerStatus;
  search?: string;
}
