import type { NavItem } from "@shared/types/nav";

export const financeAccountingNav: NavItem[] = [
  // ── Kategori Master ──
  {
    label: "Cost Center",
    path: "/finance/cost-centers",
    requiredPermissions: ["cost-center.view"],
    group: "Master",
  },
  {
    label: "Profit Center",
    path: "/finance/profit-centers",
    requiredPermissions: ["profit-center.view"],
    group: "Master",
  },
  {
    label: "Jenis Pajak",
    path: "/finance/tax/types",
    requiredPermissions: ["tax.view"],
    group: "Master",
  },
  {
    label: "Profil Pajak",
    path: "/finance/tax/profiles",
    requiredPermissions: ["tax.view"],
    group: "Master",
  },
  {
    label: "Payment Term Vendor",
    path: "/finance/ap/vendors",
    requiredPermissions: ["ap.view"],
    group: "Master",
  },

  // ── Kategori Transaksi ──
  {
    label: "AR (Piutang)",
    path: "/finance/ar-hub",
    requiredPermissions: ["ar.view"],
    group: "Transaksi",
  },
  {
    label: "AP (Hutang)",
    path: "/finance/ap-hub",
    requiredPermissions: ["ap.view"],
    group: "Transaksi",
  },
  {
    label: "Kas & Bank",
    path: "/finance/cb-hub",
    requiredPermissions: ["cash-bank.view"],
    group: "Transaksi",
  },
  {
    label: "General Ledger",
    path: "/finance/gl/journals",
    requiredPermissions: ["gl.view"],
    group: "Transaksi",
  },
  {
    label: "Billing Integration",
    path: "/finance/billing/contracts",
    requiredPermissions: ["billing-integration.view"],
    group: "Transaksi",
  },
  {
    label: "AR Integration",
    path: "/finance/integration/ar",
    requiredPermissions: ["ar.view"],
    group: "Transaksi",
  },
  {
    label: "HR Integration",
    path: "/finance/integration/hr",
    requiredPermissions: ["hr-integration.view"],
    group: "Transaksi",
  },
  {
    label: "AP Integration",
    path: "/finance/integration/ap",
    requiredPermissions: ["ap.view"],
    group: "Transaksi",
  },
  {
    label: "Fixed Assets",
    path: "/finance/assets",
    requiredPermissions: ["asset.view"],
    group: "Transaksi",
  },
  {
    label: "Budget",
    path: "/finance/budgets",
    requiredPermissions: ["budget.view"],
    group: "Transaksi",
  },
  {
    label: "Chart of Accounts",
    path: "/finance/accounts",
    requiredPermissions: ["coa.view"],
    group: "Transaksi",
  },
  {
    label: "E-Faktur",
    path: "/finance/tax/efaktur",
    requiredPermissions: ["tax.view"],
    group: "Transaksi",
  },
  {
    label: "Bukti Potong Pajak",
    path: "/finance/tax/withholding",
    requiredPermissions: ["tax.view"],
    group: "Transaksi",
  },
  {
    label: "Credit Limit Customer",
    path: "/finance/ar/customers",
    requiredPermissions: ["ar.view"],
    group: "Transaksi",
  },

  // ── Kategori Report ──
  {
    label: "Laporan Keuangan",
    path: "/finance/reports",
    requiredPermissions: ["financial-report.view"],
    group: "Report",
  },
  {
    label: "Laporan Pajak",
    path: "/finance/tax/reports",
    requiredPermissions: ["tax.view"],
    group: "Report",
  },
];
