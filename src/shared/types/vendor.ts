/** Subset MINIMAL dari Vendor (ProcurementInventory) - cuma field yang
 * dibutuhkan untuk pencarian & tampilan singkat lintas modul (mis.
 * pemilih vendor di form AP Bill). CRUD penuh TETAP cuma ada di modul
 * procurement-inventory sendiri. */
export interface VendorSummary {
  id: number;
  vendor_code: string;
  vendor_name: string;
  status: string;
  payment_term_days: number;
}
