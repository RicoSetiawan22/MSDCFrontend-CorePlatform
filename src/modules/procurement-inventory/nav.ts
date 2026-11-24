import type { NavItem } from "@shared/types/nav";

export const procurementInventoryNav: NavItem[] = [
  // ── Standalone Top-Level Menu ──
  { label: "Dashboard", path: "/procurement-inventory/dashboard", requiredPermissions: ["dashboard.view"] },

  // ── Kategori Master ──
  { label: "Vendor", path: "/procurement-inventory/vendors", requiredPermissions: ["vendor.view"], group: "Master" },
  { label: "Item & Inventory", path: "/procurement-inventory/items", requiredPermissions: ["inventory.view"], group: "Master" },
  { label: "Warehouse", path: "/procurement-inventory/warehouses", requiredPermissions: ["warehouse.view"], group: "Master" },

  // ── Kategori Transaksi ──
  { label: "Purchase Request", path: "/procurement-inventory/purchase-requests", requiredPermissions: ["purchase-request.view"], group: "Transaksi" },
  { label: "RFQ / Vendor Quotation", path: "/procurement-inventory/vendor-quotations", requiredPermissions: ["purchase-request.view"], group: "Transaksi" },
  { label: "Purchase Order", path: "/procurement-inventory/purchase-orders", requiredPermissions: ["purchase-order.view"], group: "Transaksi" },
  { label: "Payment Request (FPP)", path: "/procurement-inventory/payment-requests", requiredPermissions: ["payment-request.view"], group: "Transaksi" },
  { label: "History PO", path: "/procurement-inventory/po-history", requiredPermissions: ["purchase-order.view"], group: "Transaksi" },
  { label: "Goods Receipt", path: "/procurement-inventory/goods-receipts", requiredPermissions: ["goods-receipt.view"], group: "Transaksi" },
  { label: "Serah Terima Barang (FSTB)", path: "/procurement-inventory/goods-handovers", requiredPermissions: ["goods-handover.view"], group: "Transaksi" },
  { label: "Garansi Barang (FGBG)", path: "/procurement-inventory/warranty-claims", requiredPermissions: ["warranty-claim.view"], group: "Transaksi" },
  { label: "Peminjaman Barang (FPBG)", path: "/procurement-inventory/item-loans", requiredPermissions: ["item-loan.view"], group: "Transaksi" },
  { label: "Pengembalian Barang Rusak (FPRG)", path: "/procurement-inventory/damaged-item-returns", requiredPermissions: ["damaged-item-return.view"], group: "Transaksi" },
  { label: "Surat Procurement", path: "/procurement-inventory/surat", requiredPermissions: ["document.view"], group: "Transaksi" },
  { label: "Stock Movement", path: "/procurement-inventory/stock-movements", requiredPermissions: ["inventory.view"], group: "Transaksi" },
  { label: "Asset Maintenance", path: "/procurement-inventory/maintenance", requiredPermissions: ["maintenance.view"], group: "Transaksi" },

  // ── Kategori Report ──
  { label: "Service Log", path: "/procurement-inventory/service-log", requiredPermissions: ["inventory.view"], group: "Report" },
];
