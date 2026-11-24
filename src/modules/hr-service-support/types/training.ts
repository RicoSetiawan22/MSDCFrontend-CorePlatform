export type EnrollmentStatus = "enrolled" | "completed" | "failed";
export type CertificationStatus = "active" | "expired" | "revoked";
export type FundingSource = "company" | "employee" | "shared";
export type ReimbursementStatus = "not_applicable" | "draft" | "submitted" | "paid";

export const ENROLLMENT_LABELS: Record<EnrollmentStatus, string> = {
  enrolled: "Terdaftar",
  completed: "Lulus",
  failed: "Gagal",
};

export const CERT_STATUS_LABELS: Record<CertificationStatus, string> = {
  active: "Aktif",
  expired: "Expired",
  revoked: "Dicabut",
};

export const FUNDING_SOURCE_LABELS: Record<FundingSource, string> = {
  company: "Company Funded",
  employee: "Employee Funded",
  shared: "Shared (50:50)",
};

export const REIMBURSEMENT_STATUS_LABELS: Record<ReimbursementStatus, string> = {
  not_applicable: "Tidak Diklaim",
  draft: "Draft Klaim",
  submitted: "Menunggu Finance",
  paid: "Terbayar (Paid)",
};

export interface Training {
  id: number;
  training_code: string;
  title: string;
  provider: string | null;
  training_date: string | null;
  duration_hours: string | null;
  total_cost?: string | number | null;
  budget_amount?: string | number | null;
  cost_per_participant?: string | number | null;
  cost_center_id?: number | null;
  currency?: string | null;
  created_at: string;
  participants_count?: number;
  participants?: EmployeeTraining[];
  cost_center?: { id: number; code?: string; name?: string; cost_center_code?: string; cost_center_name?: string } | null;
}

export interface EmployeeTraining {
  id: number;
  employee_id: number;
  training_id: number;
  status: EnrollmentStatus;
  score: string | null;
  certificate_file_id: number | null;
  created_at: string;
  training?: Training;
  employee?: { id: number; full_name: string };
}

export interface Certification {
  id: number;
  cert_code: string;
  cert_name: string;
  issuing_body: string | null;
  validity_months: number | null;
  exam_fee?: string | number | null;
  renewal_fee?: string | number | null;
  currency?: string | null;
  employee_certifications_count?: number;
  employee_certifications?: EmployeeCertification[];
}

export interface EmployeeCertification {
  id: number;
  employee_id: number;
  certification_id: number;
  certificate_number: string | null;
  issued_date: string;
  expiry_date: string | null;
  status: CertificationStatus;
  is_expiring_soon: boolean;
  funding_source?: FundingSource | null;
  reimbursement_status?: ReimbursementStatus | null;
  cost_amount?: string | number | null;
  cost_center_id?: number | null;
  cost_center?: { id: number; code?: string; name?: string } | null;
  gl_journal_number?: string | null;
  sent_to_finance_at?: string | null;
  file_id: number | null;
  created_at: string;
  employee?: { id: number; full_name: string; employee_number?: string };
  certification?: Certification;
}
