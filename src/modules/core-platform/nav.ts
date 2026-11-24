import type { NavItem } from "@shared/types/nav";

/**
 * Core Platform — halaman terproteksi yang tampil di Sidebar.
 * Route publik (Login, 2FA) TIDAK ada di nav karena tidak butuh login.
 */
export const corePlatformNav: NavItem[] = [
  // ── Overview / Dashboard ──
  { label: "Dashboard", path: "/core-platform/dashboard", requiredPermissions: [], group: "Overview" },

  // ── Kategori Master ──
  { label: "Workflow Design", path: "/core-platform/workflow-templates", requiredPermissions: ["workflow.manage"], group: "Master" },
  { label: "Organization", path: "/core-platform/organizations", requiredPermissions: ["organization.view"], group: "Master" },
  { label: "Org Structure", path: "/core-platform/organization-structure", requiredPermissions: ["master-data.view"], group: "Master" },
  { label: "Master Data", path: "/core-platform/master-data", requiredPermissions: ["master-data.view"], group: "Master" },
  { label: "User Management", path: "/core-platform/users", requiredPermissions: ["user.view"], group: "Master" },
  { label: "API Key & IoT Access", path: "/core-platform/api-keys", requiredPermissions: ["api-key.view"], group: "Master" },
  { label: "System Setting", path: "/core-platform/system-settings", requiredPermissions: ["system-config.manage"], group: "Master" },
  { label: "Backup & Restore", path: "/core-platform/system-backups", requiredPermissions: ["system-backup.manage"], group: "Master" },

  // ── Kategori Transaksi ──
  { label: "Surat Masuk", path: "/core-platform/surat-masuk", requiredPermissions: ["document.view"], group: "Transaksi" },
  { label: "Surat Keluar", path: "/core-platform/surat-keluar", requiredPermissions: ["document.view"], group: "Transaksi" },
  { label: "Template Surat", path: "/core-platform/template-surat", requiredPermissions: ["template.view"], group: "Transaksi" },
  { label: "Arsip Surat", path: "/core-platform/arsip-surat", requiredPermissions: ["document.view"], group: "Transaksi" },
  { label: "Kelola Jenis Surat", path: "/core-platform/jenis-surat", requiredPermissions: ["lookup.manage"], group: "Transaksi" },
  { label: "My Approvals", path: "/core-platform/my-approvals", requiredPermissions: [], group: "Transaksi" },
  { label: "Role & Permission", path: "/core-platform/roles", requiredPermissions: ["role.view"], group: "Transaksi" },
  { label: "Status Approval", path: "/core-platform/status-approval", requiredPermissions: [], group: "Transaksi" }, 
  { label: "Notification Center", path: "/core-platform/notifications", requiredPermissions: [], group: "Transaksi" },
  { label: "Manajemen Gambar", path: "/core-platform/images", requiredPermissions: ["file.view"], group: "Transaksi" },
  { label: "Queue Monitoring", path: "/core-platform/queue", requiredPermissions: ["queue.view"], group: "Transaksi" },

  // ── Kategori Report ──
  { label: "Notification Audit", path: "/core-platform/audit/notifications", requiredPermissions: ["audit.view"], group: "Report" },
  { label: "Login Audit", path: "/core-platform/audit/login", requiredPermissions: ["audit.view"], group: "Report" },
  { label: "Data Change Audit", path: "/core-platform/audit/data-change", requiredPermissions: ["audit.view"], group: "Report" },
];
