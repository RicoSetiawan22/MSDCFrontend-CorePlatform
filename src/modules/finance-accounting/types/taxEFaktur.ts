export type EFakturStatus = "draft" | "issued" | "cancelled";

export interface TaxEFaktur {
  id: number;
  invoice: { id: number; invoice_number: string; customer_name: string } | null;
  nomor_faktur: string | null;
  tanggal_faktur: string | null;
  status: EFakturStatus;
  dpp: number;
  ppn_amount: number;
  customer_npwp_snapshot: string | null;
  notes: string | null;
}

/** store() ini UPSERT by invoice_id - kirim invoice_id yang sama lagi
 * untuk susulkan nomor_faktur setelah sebelumnya draft. */
export interface TaxEFakturFormValues {
  invoice_id: number;
  nomor_faktur?: string;
  tanggal_faktur?: string;
  dpp?: number;
  ppn_amount?: number;
  customer_npwp_snapshot?: string;
  notes?: string;
}

export interface TaxEFakturListParams {
  page?: number;
  per_page?: number;
  status?: EFakturStatus;
}
