
import type { NavItem } from "@shared/types/nav";

export const crmSalesNav: NavItem[] = [
  // ── Standalone Top-Level Menu ──
  {
    label: "Dashboard",
    path: "/crm-sales",
    requiredPermissions: [],
  },

  // ── Kategori Master ──
  {
    label: "Leads",
    path: "/crm-sales/leads",
    requiredPermissions: ["lead.view"],
    group: "Master",
  },
  {
    label: "Customer",
    path: "/crm-sales/customers",
    requiredPermissions: ["customer.view"],
    group: "Master",
  },
  {
    label: "Produk & Jasa",
    path: "/crm-sales/products",
    requiredPermissions: [],
    group: "Master",
  },
  {
    label: "Paket Promo",
    path: "/crm-sales/packages",
    requiredPermissions: [],
    group: "Master",
  },
  {
    label: "Opportunity",
    path: "/crm-sales/opportunities",
    requiredPermissions: ["opportunity.view"],
    group: "Transaksi",
  },
  {
    label: "Quotation",
    path: "/crm-sales/quotations",
    requiredPermissions: ["quotation.view"],
    group: "Transaksi",
  },
  {
    label: "Contract & SLA",
    path: "/crm-sales/contracts",
    requiredPermissions: ["contract.view"],
    group: "Transaksi",
  },
  {
    label: "Sales Order",
    path: "/crm-sales/sales-orders",
    requiredPermissions: ["sales-order.view"],
    group: "Transaksi",
  },
  {
    label: "Customer 360",
    path: "/crm-sales/customer-360",
    requiredPermissions: ["customer.view", "contract.view"],
    group: "Transaksi",
  },

  // ── Kategori Report ──

{
  label: "Laporan CRM",
  path: "/crm-sales/reports",
  requiredPermissions: [],
  group: "Report",
},
{
  label: "Monitoring Sales",
  path: "/crm-sales/monitoring-sales",
  requiredPermissions: [],
  group: "Report",
},
];
