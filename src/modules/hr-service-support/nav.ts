import type { NavItem } from "@shared/types/nav";

export const hrServiceSupportNav: NavItem[] = [
  // ?? Overview / Dashboard ??
  { label: "Dashboard", path: "/hr/dashboard", requiredPermissions: [], group: "Overview" },

  // ?? Kategori Master ??
  { label: "Position Jabatan", path: "/hr/positions", requiredPermissions: ["employee.view"], group: "Master" },
  { label: "Gedung & Fasilitas", path: "/hr/facilities", requiredPermissions: ["facility.view"], group: "Master" },

  // ?? Kategori Transaksi ??
  // ── Kategori Master ──
  { label: "Position Jabatan", path: "/hr/positions", requiredPermissions: ["employee.view"], group: "Master" },
  { label: "Gedung & Fasilitas", path: "/hr/facilities", requiredPermissions: ["facility.view"], group: "Master" },

  // ── Kategori Transaksi ──
  { label: "Employee", path: "/hr/employees", requiredPermissions: ["employee.view"], group: "Transaksi" },
  { label: "Shift & Attendance", path: "/hr/shifts", requiredPermissions: ["shift.view"], group: "Transaksi" },
  { label: "Ijin Employee", path: "/hr/permissions", requiredPermissions: ["permission-request.view"], group: "Transaksi" },
  { label: "Training & Certification", path: "/hr/training", requiredPermissions: ["training.view"], group: "Transaksi" },
  { label: "Performance Review", path: "/hr/performance", requiredPermissions: ["performance.view"], group: "Transaksi" },
  { label: "Overtime", path: "/hr/overtime", requiredPermissions: ["employee.view"], group: "Transaksi" },
  { label: "Payroll", path: "/hr/payroll", requiredPermissions: ["payroll.view"], group: "Transaksi" },
  { label: "Pensiun", path: "/hr/pensiun", requiredPermissions: ["employee.view"], group: "Transaksi" },
  { label: "Incident Management", path: "/hr/incidents", requiredPermissions: ["incident.view"], group: "Transaksi" },
  { label: "Problem Management", path: "/hr/problems", requiredPermissions: ["problem.view"], group: "Transaksi" },
  { label: "Change Management", path: "/hr/change-requests", requiredPermissions: ["change-request.view"], group: "Transaksi" },
  { label: "Support Ticket", path: "/hr/support-tickets", requiredPermissions: ["support-ticket.view"], group: "Transaksi" },
  { label: "Knowledge Base", path: "/hr/knowledge-base", requiredPermissions: ["knowledge-base.view"], group: "Transaksi" },
  { label: "Surat HRD", path: "/hr/surat", requiredPermissions: ["document.view"], group: "Transaksi" },
  { label: "Peminjaman Fasilitas", path: "/hr/facility-bookings", requiredPermissions: ["facility.view"], group: "Transaksi" },
  { label: "Surat Izin Gedung", path: "/hr/building-access", requiredPermissions: ["facility.view"], group: "Transaksi" },
  { label: "Izin Masuk Barang", path: "/hr/goods-entry", requiredPermissions: ["document.view"], group: "Transaksi" },
  { label: "Legal Review", path: "/hr/legal-review", requiredPermissions: ["document.view"], group: "Transaksi" },
  { label: "MoU", path: "/hr/mou", requiredPermissions: ["document.view"], group: "Transaksi" },
  { label: "NDA", path: "/hr/nda", requiredPermissions: ["document.view"], group: "Transaksi" },
  { label: "Legal Document", path: "/hr/legal-documents", requiredPermissions: ["document.view"], group: "Transaksi" },

  // ?? Kategori Report ??
  // ── Kategori Report ──
  { label: "Laporan Absensi Employee", path: "/hr/attendance-report", requiredPermissions: ["attendance.view"], group: "Report" },
];
