// ── Product Category ──
export interface ProductCategory {
  id: number;
  name: string;
  code: string;
  description: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ── Product / Service ──
export type ProductUnit = "bulan" | "unit" | "project" | "pcs" | "jam" | "lot";

/** Sama seperti enum service_type di crm_quotation_line/crm_sales_order_line/
 * crm_contract_service - dipakai buat klasifikasi + turunkan otomatis
 * service_type baris Quotation begitu produk ini dipilih (lihat
 * QuotationService::productServiceTypes()). */
export type ProductServiceType =
  | "colocation" | "dedicated_server" | "cloud" | "bandwidth"
  | "cross_connect" | "managed_service" | "other";

export interface Product {
  id: number;
  product_code: string;
  name: string;
  category_id: number | null;
  category?: ProductCategory;
  unit: ProductUnit;
  description: string | null;
  base_price: number;
  cost_price: number;
  is_active: boolean;
  image_file_id: number | null;
  image?: { id: number; original_name: string; mime_type: string };
  service_type: ProductServiceType;
  /** Template kebutuhan resource DataCenterOps - begitu produk ini dipilih
   * saat bikin Quotation, nilai ini otomatis mengalir ke baris Sales
   * Order (required_rack_u dkk) via SalesOrderService::createFromQuotation(),
   * jadi tidak perlu diisi manual lagi di ResourceAvailabilityCard. */
  default_rack_u: number | null;
  /** 'unit' = ecer per-U (nyempil bareng tenant lain di 1 rack), 'whole_rack'
   * = borong 1 rack utuh - eksklusif, tidak peduli total_u rack yang kebagian. */
  default_rack_mode: "unit" | "whole_rack";
  default_ip_count: number | null;
  default_power_watt: number | null;
  default_bandwidth_mbps: number | null;
  default_requires_cross_connect: boolean;
  created_at: string;
  updated_at: string;
}

// ── Promo Package Item ──
export interface PromoPackageItem {
  id?: number;
  product_id: number | null;
  product_name: string;
  qty: number;
  unit_price: number;
  subtotal: number;
  sort_order: number;
}

export type PromoPackageStatus = "draft" | "active" | "expired" | "cancelled";

export type ApprovalType = "discount" | "custom_price" | "volume" | null;

// ── Promo Package ──
export interface PromoPackage {
  id: number;
  package_code: string;
  name: string;
  description: string | null;
  image_file_ids: number[] | null;
  status: PromoPackageStatus;
  normal_price: number;
  promo_price: number;
  discount_pct: number;
  start_date: string | null;
  end_date: string | null;
  requires_approval: boolean;
  approval_type: ApprovalType;
  approval_threshold_pct: number | null;
  workflow_instance_id: number | null;
  workflow_status: string | null;
  created_by: number | null;
  creator?: { id: number; name: string };
  items?: PromoPackageItem[];
  created_at: string;
  updated_at: string;
}

// ── Promo Package Form Values ──
export interface PromoPackageFormValues {
  name: string;
  description?: string;
  image_file_ids?: number[];
  status: PromoPackageStatus;
  normal_price?: number;
  promo_price?: number;
  discount_pct?: number;
  start_date?: string;
  end_date?: string;
  requires_approval?: boolean;
  approval_type?: ApprovalType;
  approval_threshold_pct?: number;
  items: PromoPackageItem[];
}

// ── Customer Custom Price ──
export interface CustomerProductPrice {
  id: number;
  customer_id: number;
  product_id: number | null;
  product_name: string;
  unit: ProductUnit;
  custom_price: number;
  notes: string | null;
  is_active: boolean;
}
