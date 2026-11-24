/** "contract"/"intern" DIHAPUS dari sini - itu duplikasi keliru dari
 * EmployeeType (dua dimensi berbeda: status = kondisi kepegawaian saat
 * ini, type = jenis hubungan kerja) - backend enum hr_employee.employment_status
 * juga tidak pernah punya nilai itu, cuma yang di bawah ini. */
export type EmploymentStatus = "active" | "probation" | "on_leave" | "resigned" | "terminated" | "retired";
export type EmployeeType = "permanent" | "contract" | "intern" | "outsourced";

export interface Employee {
  id: number;
  /** Kode Employee otomatis dari sistem (mis. EMP-202610-000003) */
  employee_number: string;
  /** NIK (Nomor Induk Kepegawaian) - 16 karakter terkunci */
  nik?: string | null;
  /** Menautkan employee ke akun login (users) - dipakai buat resolve
   * "user yang login ini employee siapa" (mis. atribusi approval cuti,
   * lihat LeaveController::resolveApproverEmployeeId() di backend). */
  user_id: number | null;
  user?: { id: number; name: string; email: string } | null;
  position_id: number | null;
  /** site_id di sini cuma default "posisi ini biasanya di site mana" -
   * dipakai buat pre-fill pilihan Site di ShiftPickerModal, BUKAN sumber
   * kebenaran "bertugas di site mana hari ini" (itu tetap ShiftSchedule.site_id
   * sendiri, lihat DashboardService::onDutyToday()). */
  position?: { id: number; position_title: string; site_id: number | null; work_location: "office" | "field" } | null;
  department_id: number | null;
  cost_center_id: number | null;
  full_name: string;
  /** Tanggal lahir karyawan (YYYY-MM-DD) */
  birth_date?: string | null;
  /** Jenis kelamin karyawan ("male" = Laki-laki, "female" = Perempuan) */
  gender?: "male" | "female" | string | null;
  email: string;
  phone: string | null;
  /** Alamat sesuai KTP */
  ktp_address?: string | null;
  address_ktp?: string | null;
  /** Alamat domisili tempat tinggal saat ini */
  domicile_address?: string | null;
  address_domicile?: string | null;
  /** Foto profil - lewat sistem File Management CorePlatform (cp_fm_file),
   * bukan path/URL langsung. Ambil binary-nya lewat useFilePreview(id)
   * (butuh Bearer token + izin view). Lihat Employee::photoFile() di backend. */
  photo_file_id: number | null;
  /** Gambar tanda tangan - sama pola dengan photo_file_id (File Management
   * CorePlatform). WorkflowEngineService::assertSignatureUploaded() MEWAJIBKAN
   * ini terisi sebelum employee bisa approve dokumen Procurement (PR/PO/FPP). */
  signature_file_id: number | null;
  join_date: string | null;
  /** Tanggal selesai kontrak / keluar / resign / pensiun (YYYY-MM-DD) */
  exit_date?: string | null;
  end_date?: string | null;
  employment_status: EmploymentStatus;
  employee_type: EmployeeType;
  notes: string | null;
  created_at: string;
  updated_at: string;
  work_experiences?: WorkExperience[];
  skills?: Skill[];
  family_members?: EmployeeFamily[];
  families?: EmployeeFamily[];
  educations?: EmployeeEducation[];
  /** BPJS & Pajak (opsional untuk mendukung data kepesertaan & perpajakan) */
  bpjs_kesehatan_number?: string | null;
  bpjs_kesehatan_status?: string | null;
  bpjs_ketenagakerjaan_number?: string | null;
  bpjs_ketenagakerjaan_status?: string | null;
  npwp?: string | null;
  ptkp_status?: string | null;
}

export interface EmployeeListParams {
  page?: number;
  per_page?: number;
  employment_status?: EmploymentStatus;
  department_id?: number;
  /** Filter ke employee yang posisinya "lapangan DC" (Position.work_location)
   * - dipakai papan Jadwal Shift saat staf HR memilih site DC tertentu. */
  work_location?: "office" | "field";
  search?: string;
}

export interface EmployeeStats {
  total: number;
  active: number;
  probation: number;
  on_leave: number;
  resigned: number;
  terminated: number;
  retired: number;
  inactive?: number;
}

export interface WorkExperience {
  id: number;
  employee_id: number;
  company_name: string;
  position_title: string;
  start_date: string;
  end_date: string | null;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export type ProficiencyLevel = "beginner" | "intermediate" | "advanced" | "expert";

export interface Skill {
  id: number;
  employee_id: number;
  skill_name: string;
  proficiency_level: ProficiencyLevel;
  years_of_experience: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface EmployeeFamily {
  id: number;
  employee_id: number;
  full_name: string;
  relationship: "spouse" | "child" | "parent" | "sibling" | "other";
  birth_date: string | null;
  gender: "male" | "female" | null;
  nik: string | null;
  occupation: string | null;
  phone: string | null;
  is_dependent: boolean;
  is_emergency_contact: boolean;
  notes: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface EmployeeEducation {
  id: number;
  employee_id: number;
  degree_level: "SD" | "SMP" | "SMA/SMK" | "D1" | "D2" | "D3" | "D4" | "S1" | "S2" | "S3" | "Non-Formal";
  institution_name: string;
  major: string | null;
  start_year: number | null;
  graduation_year: number | null;
  gpa: string | number | null;
  degree_title: string | null;
  notes: string | null;
  created_at?: string;
  updated_at?: string;
}