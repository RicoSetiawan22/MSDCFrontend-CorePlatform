export type ApPaymentMethod = "cash" | "bank_transfer" | "check" | "other";
export type ApPaymentStatus = "posted" | "void";

export interface ApPaymentAllocation {
  id: number;
  bill_id: number;
  bill?: { id: number; bill_number: string; total_amount: number };
  amount_allocated: number;
}

export interface ApPayment {
  id: number;
  payment_number: string;
  vendor_id: number;
  vendor_name: string;
  payment_date: string;
  payment_method: ApPaymentMethod;
  amount: number;
  reference_number: string | null;
  status: ApPaymentStatus;
  gl_journal_number: string | null;
  notes: string | null;
  allocations: ApPaymentAllocation[];
}

export interface ApPaymentAllocationInput {
  bill_id: number;
  amount_allocated: number;
}

export interface ApPaymentFormValues {
  vendor_id: number;
  vendor_name: string;
  payment_date?: string;
  payment_method?: ApPaymentMethod;
  withdrawal_account_code: string;
  amount: number;
  reference_number?: string;
  notes?: string;
  allocations?: ApPaymentAllocationInput[];
}

export interface ApPaymentListParams {
  page?: number;
  per_page?: number;
  vendor_id?: number;
  status?: ApPaymentStatus;
}
