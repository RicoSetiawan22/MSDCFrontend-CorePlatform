export type SlaCompensationType = "credit_pct" | "fixed_amount" | "none";
export type SlaBreachType = "uptime" | "response_time" | "resolution_time";
export type SlaBreachStatus = "reported" | "acknowledged" | "compensated";

export interface SlaBreach {
  id: number;
  sla_id: number;
  breach_date: string;
  breach_type: SlaBreachType;
  description: string | null;
  compensation_amount: string;
  /** Diisi otomatis begitu status jadi 'compensated' - AR Invoice negatif
   * (credit note) yang dibuat SlaService::applyCompensationToInvoice()
   * buat langsung motong tagihan customer sejumlah compensation_amount. */
  credit_invoice_id: number | null;
  status: SlaBreachStatus;
  created_by: number | null;
  created_at: string;
}

export interface Sla {
  id: number;
  contract_id: number;
  sla_name: string;
  uptime_target_pct: string;
  response_time_minutes: number | null;
  resolution_time_hours: number | null;
  compensation_type: SlaCompensationType;
  compensation_value: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  // Cuma terisi dari listByContract() - eager load ->with('breaches')
  breaches?: SlaBreach[];
}

export interface SlaFormValues {
  sla_name: string;
  uptime_target_pct?: number;
  response_time_minutes?: number;
  resolution_time_hours?: number;
  compensation_type?: SlaCompensationType;
  compensation_value?: number;
  notes?: string;
}

export interface SlaBreachFormValues {
  breach_date?: string;
  breach_type?: SlaBreachType;
  description?: string;
  compensation_amount?: number;
}

export interface SlaListParams {
  page?: number;
  per_page?: number;
  contract_id?: number;
}

export interface SlaTemplate {
  id: number;
  template_name: string;
  uptime_target_pct: string;
  response_time_minutes: number | null;
  resolution_time_hours: number | null;
  compensation_type: SlaCompensationType;
  compensation_value: string | null;
  notes: string | null;
  created_at: string;
}

export interface SlaTemplateFormValues {
  template_name: string;
  uptime_target_pct?: number;
  response_time_minutes?: number;
  resolution_time_hours?: number;
  compensation_type?: SlaCompensationType;
  compensation_value?: number;
  notes?: string;
}
