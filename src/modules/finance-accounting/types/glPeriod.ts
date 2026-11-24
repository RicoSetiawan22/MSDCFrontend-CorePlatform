export type PeriodStatus = "open" | "closed";

export interface GlPeriod {
  id: number;
  fiscal_year: number;
  period_month: number;
  period_name: string;
  start_date: string;
  end_date: string;
  status: PeriodStatus;
  closed_at: string | null;
  closed_by: number | null;
}
