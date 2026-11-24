/** Cocok dengan kolom fillable Lead entity (Modules/CrmSales/app/Entities/Lead.php) */
export type LeadStatus =
  | "new"
  | "contacted"
  | "qualified"
  | "unqualified"
  | "converted";

export interface Lead {
  id: number;
  lead_number: string;
  company_name: string;
  contact_name: string;
  email: string;
  phone: string;
  source: string;
  status: LeadStatus;

  assigned_to: number | null;
  sales_employee_id?: number | null;

  // Nama PIC dari HR/user (hanya untuk tampilan/kompatibilitas).
  pic?: string | null;

  notes: string | null;

  converted_customer_id: number | null;
  converted_at: string | null;
  created_by: number | null;

  created_at: string;
  updated_at: string;
}

export interface LeadFormValues {
  company_name: string;
  contact_name?: string;
  email?: string;
  phone?: string;
  source?: string;

  /** Identitas Employee HR terpilih; tidak boleh berasal dari input manual. */
  sales_employee_id?: number | null;
  assigned_to?: number | null;
  /** Pilihan terverifikasi server, user:id atau employee:id (untuk HR tanpa login). */
  pic_choice?: string;

  // Nilai tampilan turunan User/Employee HR; backend memverifikasi ulang.
  pic?: string;

  notes?: string;
}

export interface LeadListParams {
  page?: number;
  per_page?: number;
  status?: LeadStatus;
  source?: string;
  search?: string;
  date_from?: string;
  date_to?: string;

  /** 
   * Kecualikan status 'unqualified' dan 'converted'
   * Lead yang sudah converted SUDAH JADI Customer
   */
  open_only?: boolean;
}
/** PIC pilihan lintas jabatan dari user aktif/Employee HR organisasi. */
export interface PicUserOption {
  choice_id: string;
  user_id: number | null;
  employee_id: number | null;
  full_name: string;
  user_name: string | null;
  email: string | null;
  position_title: string;
}

/** Opsi Sales yang dibaca dari Employee aktif HR, bukan seluruh users. */
export interface SalesEmployeeOption {
  employee_id: number;
  user_id: number | null;
  full_name: string;
  user_name?: string | null;
  position_id: number;
  position_title: string;
}