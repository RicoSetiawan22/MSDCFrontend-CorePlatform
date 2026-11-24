export type TaxCategory = "ppn_output" | "ppn_input" | "pph_withholding";

export interface TaxType {
  id: number;
  code: string;
  name: string;
  category: TaxCategory;
  rate: number;
  is_active: boolean;
  notes: string | null;
}

/** store() ini UPSERT by code - kirim code yang sama lagi untuk update. */
export interface TaxTypeFormValues {
  code: string;
  name: string;
  category: TaxCategory;
  rate: number;
  is_active?: boolean;
  notes?: string;
}

export interface TaxTypeListParams {
  category?: TaxCategory;
  is_active?: boolean;
}
