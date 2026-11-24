import type { NavItem } from "@shared/types/nav";

export const dataCenterOpsNav: NavItem[] = [
  // ── Standalone Top-Level Menu ──
  { label: "Dashboard", path: "/dc", requiredPermissions: ["dashboard.view"] },

  // ── Kategori Master ──
  { label: "Site Manager", path: "/dc/sites", requiredPermissions: ["site.view"], group: "Master" },
  { label: "Room", path: "/dc/rooms", requiredPermissions: ["site.view"], group: "Master" },
  { label: "Rack", path: "/dc/racks", requiredPermissions: ["rack.view"], group: "Master" },
  { label: "Device Inventory", path: "/dc/devices", requiredPermissions: ["device.view"], group: "Master" },
  { label: "OTB Inventory", path: "/dc/otbs", requiredPermissions: ["otb.view"], group: "Master" },
  { label: "IPAM", path: "/dc/ipam", requiredPermissions: ["ipam.view"], group: "Master" },

  // ── Kategori Transaksi ──
  { label: "Cross Connect", path: "/dc/cross-connects", requiredPermissions: ["cross-connect.view"], group: "Transaksi" },
  { label: "Ticket & Remote Hands", path: "/dc/tickets", requiredPermissions: ["ticket.view"], group: "Transaksi" },
  { label: "Scanner Pos Jaga", path: "/dc/visitor-scanner", requiredPermissions: ["visitor-pass.manage"], group: "Transaksi" },
  { label: "Surat DC", path: "/dc/surat", requiredPermissions: ["document.view"], group: "Transaksi" },
  { label: "Perintah Kerja", path: "/dc/work-orders", requiredPermissions: ["work-order.view"], group: "Transaksi" },

  // ── Kategori Report ──
  { label: "Dashboard Monitoring", path: "/dc/monitoring/overview", requiredPermissions: ["power-cooling.view"], group: "Report" },
  { label: "Telemetri Rak", path: "/dc/monitoring", requiredPermissions: ["power-cooling.view"], group: "Report" },
  { label: "Pemantauan CCTV", path: "/dc/cctv", requiredPermissions: ["cctv.view"], group: "Report" },
  { label: "Visitor Pass Log", path: "/dc/visitor-passes", requiredPermissions: ["visitor-pass.view"], group: "Report" },
  { label: "Usage Record", path: "/dc/usage", requiredPermissions: ["usage-record.view"], group: "Report" },
];
