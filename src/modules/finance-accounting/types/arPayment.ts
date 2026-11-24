export type PaymentMethod = "cash" | "bank_transfer" | "virtual_account" | "other";
export type PaymentStatus = "posted" | "void";

export interface ArPaymentAllocation {
  id: number;
  invoice_id: number;
  invoice?: { id: number; invoice_number: string; total_amount: number };
  amount_allocated: number;
}

export interface ArPayment {
  id: number;
  payment_number: string;
  customer_id: number;
  customer_name: string;
  payment_date: string;
  payment_method: PaymentMethod;
  amount: number;
  reference_number: string | null;
  status: PaymentStatus;
  gl_journal_number: string | null;
  notes: string | null;
  allocations: ArPaymentAllocation[];
}

/** Alokasi manual ke invoice tertentu - OPSIONAL saat submit, kalau
 * dikosongkan backend alokasikan otomatis FIFO ke invoice outstanding. */
export interface ArPaymentAllocationInput {
  invoice_id: number;
  amount_allocated: number;
}

export interface ArPaymentFormValues {
  customer_id: number;
  customer_name: string;
  payment_date?: string;
  payment_method?: PaymentMethod;
  deposit_account_code: string;
  amount: number;
  reference_number?: string;
  notes?: string;
  allocations?: ArPaymentAllocationInput[];
}

export interface ArPaymentListParams {
  page?: number;
  per_page?: number;
  customer_id?: number;
  status?: PaymentStatus;
}
