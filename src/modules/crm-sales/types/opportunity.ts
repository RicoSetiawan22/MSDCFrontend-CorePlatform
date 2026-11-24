/** HARUS cocok persis dengan enum kolom crm_opportunity.stage (lihat
 * migrasi 2026_08_18_000003_create_crm_opportunity_tables + validasi
 * OpportunityController::updateStage()) - sebelumnya frontend pakai daftar
 * 8-stage yang tidak pernah ada di backend ("discovery", "solution_design",
 * "management_approval"), jadi tombol "Next Stage" 422 diam-diam kecuali
 * pas transisi proposal->negotiation yang kebetulan cocok. */
export type OpportunityStage =
  | "qualification"
  | "needs_analysis"
  | "proposal"
  | "negotiation"
  | "closed_won"
  | "closed_lost";

export interface OpportunityActivity {
  id: number;
  opportunity_id: number;
  activity_type: "call" | "meeting" | "email" | "demo" | "other";
  subject: string;
  notes: string | null;
  activity_date: string;
  created_by: number | null;
}

export interface Opportunity {
  id: number;
  opportunity_number: string;
  customer_id: number | null;
  lead_id: number | null;
  name: string;
  estimated_value: string;
  probability_pct: number;
  stage: OpportunityStage;
  expected_close_date: string | null;
  competitor_name: string | null;
  lost_reason: string | null;
  closed_at?: string | null;
  closed_by?: number | null;
  final_amount?: string | null;
  closer_id?: number | null;
  notes?: string | null;
  source_quotation_id?: number | null;
  assigned_to: number | null;
  sales_employee_id?: number | null;
  resolved_sales_employee?: { id: number; full_name: string; position_title: string; user_id: number | null } | null;
  created_by: number | null;
  created_at: string;
  updated_at: string;
  customer?: { id: number; company_name: string; customer_code?: string; converted_leads?: { id: number; pic?: string | null }[] } | null;
  lead?: { id: number; company_name: string; lead_number?: string; pic?: string | null; sales_employee_id?: number | null } | null;
  assigned_user?: { id: number; name: string } | null;
  /** Cuma ada di opportunityApi.show() (list endpoint tidak eager-load ini). */
  activities?: OpportunityActivity[];
}

export interface OpportunityFormValues {
  name: string;
  customer_id?: number | null;
  lead_id?: number | null;
  estimated_value?: number;
  probability_pct?: number;
  stage?: OpportunityStage;
  expected_close_date?: string;
  competitor_name?: string;
  assigned_to?: number | null;
  notes?: string;
  closer_id?: number | null;
  source_quotation_id?: number | null;
}

export interface OpportunityListParams {
  page?: number;
  per_page?: number;
  stage?: OpportunityStage;
  search?: string;
}

export interface PipelineSummary {
  by_stage: {
    stage: string;
    opportunity_count: number;
    total_value: number;
    weighted_value: number;
  }[];
  total_weighted_value: number;
}

/** Nama PIC bersumber dari Employee HR; tidak tampilkan nama PIC teks sebagai baris Sales terpisah. */
export function opportunitySalesPic(opp: Opportunity): string {
  return opp.resolved_sales_employee?.full_name
    || opp.assigned_user?.name
    || "Belum teridentifikasi di Employee HR";
}
