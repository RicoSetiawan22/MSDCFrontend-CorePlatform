export interface ApAgingBill {
  bill_number: string;
  due_date: string;
  days_overdue: number;
  bucket: "current" | "d1_30" | "d31_60" | "d61_90" | "d90_plus";
  outstanding_amount: number;
}

export interface ApAgingVendorRow {
  vendor_id: number;
  vendor_name: string;
  current: number;
  d1_30: number;
  d31_60: number;
  d61_90: number;
  d90_plus: number;
  total: number;
  bills: ApAgingBill[];
}

export interface ApAgingReport {
  as_of_date: string;
  vendors: ApAgingVendorRow[];
  grand_total: {
    current: number;
    d1_30: number;
    d31_60: number;
    d61_90: number;
    d90_plus: number;
    total: number;
  };
}
