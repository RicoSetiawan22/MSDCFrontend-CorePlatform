export type BillStatus = "draft" | "posted" | "paid" | "partially_paid" | "void";

export interface ApBill {
  id: number;
  bill_number: string;
  vendor_id: number;
  vendor_name: string;
  vendor_code: string | null;
  bill_date: string;
  due_date: string;
  currency: string;
  subtotal: number;
  tax_amount: number;
  total_amount: number;
  paid_amount: number;
  status: BillStatus;
  notes: string | null;
  outstanding_amount: number;
  is_overdue: boolean;
  days_overdue: number;
  /** 'goods_receipt' + nomor GRN kalau bill ini dibuat otomatis dari
   * penerimaan barang PO (lihat GoodsReceiptService::postGrn()) - null
   * kalau bill dibuat manual (bukan dari alur Procurement). */
  reference_type?: string | null;
  reference_number?: string | null;
}

export interface ApBillLineInput {
  description?: string;
  quantity?: number;
  unit_price: number;
  expense_account_code: string;
}

export interface ApBillFormValues {
  vendor_id: number;
  vendor_name: string;
  vendor_code?: string;
  /** Kosongkan supaya backend hitung otomatis dari
   * default_payment_term_days vendor (lihat AccountsPayableService::
   * deriveDueDate()) - TIDAK wajib diisi manual, beda dari AR Invoice. */
  due_date?: string;
  bill_date?: string;
  tax_amount?: number;
  notes?: string;
  /** Cuma dikirim TRUE kalau user sadar vendor sedang di-hold dan
   * sengaja mau lanjut - lihat AccountsPayableService::createBill(). */
  override_hold?: boolean;
  /** Opsional - dari cost center & profit center mana beban bill ini
   * berasal (mis. cost center "Surabaya DC", profit center "Colocation").
   * Tanpa ini, bill TIDAK akan pernah muncul di Cost Center Report atau
   * Profit Center Report manapun. */
  cost_center_id?: number;
  profit_center_id?: number;
  lines: ApBillLineInput[];
}

export interface ApBillListParams {
  page?: number;
  per_page?: number;
  vendor_id?: number;
  status?: BillStatus;
  overdue_only?: boolean;
}
