export type UsageType = "rack_space" | "power" | "bandwidth" | "remote_hands";
export type UsageStatus = "draft" | "sent_to_finance" | "billed" | "waived";

export interface UsageRecord {
  id: number;
  customer_id: number | null;
  site_id: number | null;
  contract_id: number | null;
  usage_type: UsageType;
  period_month: number;
  period_year: number;
  quantity: string | number;
  unit: string;
  unit_price: string | number | null;
  total_amount: string | number | null;
  status: UsageStatus;
  sent_at: string | null;
  created_at: string;
  updated_at: string;
  customer?: { id: number; company_name?: string } | null;
}

export interface UsageListParams {
  page?: number;
  per_page?: number;
  usage_type?: UsageType;
  status?: UsageStatus;
  customer_id?: number;
  date_from?: string;
  date_to?: string;
}
