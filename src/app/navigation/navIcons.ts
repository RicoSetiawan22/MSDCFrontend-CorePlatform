import type { LucideIcon } from "lucide-react";
import {
  LayoutGrid,
  HardDrive,
  DoorOpen,
  Building,
  Server,
  Box,
  Package,
  Ticket,
  ClipboardCheck,
  FileText,
  TrendingUp,
  Database,
  GitFork,
  MonitorCheck, 
  Activity,
  LineChart,
  Users,
  Target,
  FileSpreadsheet,
  FileCheck,
  ShoppingBag,
  UserCheck,
  Boxes,
  Gift,
  ShieldCheck,
  BarChart3,
  ArrowDownRight,
  ArrowUpRight,
  Landmark,
  BookOpen,
  Receipt,
  ArrowDownLeft,
  Building2,
  PieChart,
  ListTree,
  Coins,
  DollarSign,
  Percent,
  BookUser,
  Store,
  FileCheck2,
  CreditCard,
  History,
  Inbox,
  CheckCircle2,
  Shield,
  ArrowLeftRight,
  RotateCcw,
  Warehouse,
  Wrench,
  Calendar,
  Clock,
  Award,
  Hourglass,
  AlertTriangle,
  HelpCircle,
  GitPullRequest,
  LifeBuoy,
  BookMarked,
  BadgeCheck,
  Key,
  Scale,
  Send,
  Archive,
  Tags,
  CheckSquare,
  Workflow,
  UserCog,
  Bell,
  Image,
  Settings,
  Save,
  Cpu,
  LogIn,
  FileEdit,
  BellRing,
  QrCode,
  Cctv,
} from "lucide-react";
import type { NavItem } from "@shared/types/nav";

/**
 * Module metadata for the primary (Tier 1) navigation rail.
 */
export interface ModuleSection {
  id: string;
  title: string;
  shortLabel: string;
  icon: LucideIcon;
  defaultPath: string;
}

export const MODULE_SECTIONS: ModuleSection[] = [
  {
    id: "dc-ops",
    title: "Data Center Operations",
    shortLabel: "Data Center",
    icon: Server,
    defaultPath: "/dc",
  },
  {
    id: "crm-sales",
    title: "CRM & Sales",
    shortLabel: "CRM Sales",
    icon: Users,
    defaultPath: "/crm-sales",
  },
  {
    id: "finance",
    title: "Finance & Accounting",
    shortLabel: "Finance",
    icon: Landmark,
    defaultPath: "/finance/ar-hub",
  },
  {
    id: "procurement",
    title: "Procurement & Inventory",
    shortLabel: "Procurement",
    icon: Package,
    defaultPath: "/procurement-inventory/dashboard",
  },
  {
    id: "hr",
    title: "HR & Service Support",
    shortLabel: "HR Support",
    icon: UserCheck,
    defaultPath: "/hr/employees",
  },
  {
    id: "core",
    title: "Core Platform",
    shortLabel: "Core Platform",
    icon: Settings,
    defaultPath: "/core-platform/my-approvals",
  },
];

/**
 * Maps a specific NavItem to its dedicated Lucide icon.
 */
export function getNavItemIcon(item: NavItem, _moduleTitle?: string): LucideIcon {
  const labelLower = item.label.toLowerCase().trim();
  const pathLower = item.path.toLowerCase().trim();

  // 1. Data Center Ops: Monitoring & Telemetry Specific
  if (labelLower.includes("overview") || pathLower.includes("/overview") || labelLower.includes("monitoring")) return MonitorCheck;
  if (labelLower.includes("telemetri") || labelLower.includes("telemetry")) return Activity;

  // 2. Standalone Dashboard (Root)
  if (labelLower.includes("dashboard") || pathLower.endsWith("/dashboard")) return LayoutGrid;

  // 3. Data Center Operations Specific
  if (labelLower.includes("site")) return HardDrive;
  if (labelLower.includes("room")) return DoorOpen;
  if (labelLower === "rack") return Server;
  if (labelLower.includes("monitoring rack")) return MonitorCheck;
  if (labelLower.includes("device inventory") || labelLower.includes("device")) return Box;
  if (labelLower.includes("cross-connect") || labelLower.includes("cross connect")) return GitFork;
  if (labelLower.includes("otb")) return BarChart3;
  if (labelLower.includes("ipam")) return Database;
  if (labelLower.includes("ticket & remote hands") || labelLower.includes("ticket")) return Ticket;
  if (labelLower.includes("cctv") || pathLower.includes("/cctv")) return Cctv;
  if (labelLower.includes("scanner pos jaga") || labelLower.includes("scanner") || labelLower.includes("scan")) return QrCode;
  if (labelLower.includes("visitor pass") || labelLower.includes("visitor") || labelLower.includes("kunjungan")) return UserCheck;
  if (labelLower.includes("perintah kerja") || labelLower.includes("work-order")) return ClipboardCheck;
  if (labelLower.includes("surat dc") || labelLower.includes("surat")) return FileText;
  if (labelLower.includes("usage record") || labelLower.includes("usage")) return LineChart;

  // 3. CRM & Sales Specific
  if (labelLower.includes("lead")) return Users;
  if (labelLower.includes("opportunit")) return Target;
  if (labelLower.includes("quotation")) return FileSpreadsheet;
  if (labelLower.includes("contract")) return FileCheck;
  if (labelLower.includes("sales order")) return ShoppingBag;
  if (labelLower.includes("customer 360")) return UserCheck;
  if (labelLower.includes("customer")) return Users;
  if (labelLower.includes("produk") || labelLower.includes("product")) return Boxes;
  if (labelLower.includes("promo") || labelLower.includes("paket")) return Gift;
  if (labelLower.includes("sla")) return ShieldCheck;
  if (labelLower.includes("laporan crm") || labelLower.includes("report")) return BarChart3;

  // 4. Finance & Accounting Specific
  if (labelLower.includes("ar (piutang)") || labelLower.includes("piutang")) return ArrowDownRight;
  if (labelLower.includes("ap (hutang)") || labelLower.includes("hutang")) return ArrowUpRight;
  if (labelLower.includes("kas & bank") || labelLower.includes("kas")) return Landmark;
  if (labelLower.includes("general ledger") || labelLower.includes("gl")) return BookOpen;
  if (labelLower.includes("billing integration")) return Receipt;
  if (labelLower.includes("ar integration")) return ArrowDownLeft;
  if (labelLower.includes("hr integration")) return Users;
  if (labelLower.includes("ap integration")) return ArrowUpRight;
  if (labelLower.includes("fixed assets") || labelLower.includes("asset")) return Building2;
  if (labelLower.includes("budget")) return PieChart;
  if (labelLower.includes("chart of accounts") || labelLower.includes("coa")) return ListTree;
  if (labelLower.includes("cost center")) return Coins;
  if (labelLower.includes("profit center")) return DollarSign;
  if (labelLower.includes("tax")) return Percent;
  if (labelLower.includes("ledger")) return BookUser;

  // 5. Procurement & Inventory Specific
  if (labelLower.includes("vendor")) return Store;
  if (labelLower.includes("purchase request") || labelLower.includes("pr")) return FileText;
  if (labelLower.includes("rfq") || labelLower.includes("quotation")) return HelpCircle;
  if (labelLower.includes("purchase order") || labelLower.includes("po")) return FileCheck2;
  if (labelLower.includes("payment request") || labelLower.includes("fpp")) return CreditCard;
  if (labelLower.includes("history")) return History;
  if (labelLower.includes("goods receipt") || labelLower.includes("grn")) return Inbox;
  if (labelLower.includes("fstb") || labelLower.includes("serah terima")) return CheckCircle2;
  if (labelLower.includes("garansi") || labelLower.includes("fgbg")) return Shield;
  if (labelLower.includes("peminjaman") || labelLower.includes("fpbg")) return ArrowLeftRight;
  if (labelLower.includes("pengembalian") || labelLower.includes("rusak") || labelLower.includes("fprg")) return RotateCcw;
  if (labelLower.includes("item & inventory") || labelLower.includes("item")) return Package;
  if (labelLower.includes("stock")) return ArrowLeftRight;
  if (labelLower.includes("warehouse") || labelLower.includes("gudang")) return Warehouse;
  if (labelLower.includes("service log") || labelLower.includes("maintenance")) return Wrench;

  // 6. HR & Service Support Specific
  if (labelLower.includes("employee")) return Users;
  if (labelLower.includes("shift") || labelLower.includes("attendance") || labelLower.includes("absensi")) return Calendar;
  if (labelLower.includes("ijin") || labelLower.includes("permission") || labelLower.includes("cuti")) return Clock;
  if (labelLower.includes("training") || labelLower.includes("cert")) return Award;
  if (labelLower.includes("performance") || labelLower.includes("evaluasi")) return TrendingUp;
  if (labelLower.includes("overtime") || labelLower.includes("lembur")) return Hourglass;
  if (labelLower.includes("payroll") || labelLower.includes("gaji")) return DollarSign;
  if (labelLower.includes("incident")) return AlertTriangle;
  if (labelLower.includes("problem")) return HelpCircle;
  if (labelLower.includes("change")) return GitPullRequest;
  if (labelLower.includes("support") || labelLower.includes("ticket")) return LifeBuoy;
  if (labelLower.includes("knowledge")) return BookMarked;
  if (labelLower.includes("position") || labelLower.includes("jabatan")) return BadgeCheck;
  if (labelLower.includes("gedung") || labelLower.includes("facility") || labelLower.includes("fasilitas")) return Building;
  if (labelLower.includes("akses") || labelLower.includes("izin masuk")) return Key;
  if (labelLower.includes("legal") || labelLower.includes("mou") || labelLower.includes("nda")) return Scale;

  // 7. Core Platform Specific
  if (labelLower.includes("surat masuk")) return Inbox;
  if (labelLower.includes("surat keluar")) return Send;
  if (labelLower.includes("template surat")) return FileSpreadsheet;
  if (labelLower.includes("arsip")) return Archive;
  if (labelLower.includes("jenis surat")) return Tags;
  if (labelLower.includes("approval")) return CheckSquare;
  if (labelLower.includes("workflow")) return Workflow;
  if (labelLower.includes("organization") || labelLower.includes("organisasi")) return Building2;
  if (labelLower.includes("user")) return UserCog;
  if (labelLower.includes("role") || labelLower.includes("permission")) return Shield;
  if (labelLower.includes("structure")) return Workflow;
  if (labelLower.includes("master data")) return DatabaseIconFallback;
  if (labelLower.includes("notification audit") || pathLower.includes("notifications")) return BellRing;
  if (labelLower.includes("notif")) return Bell;
  if (labelLower.includes("gambar") || labelLower.includes("image")) return Image;
  if (labelLower.includes("setting") || labelLower.includes("pengaturan")) return Settings;
  if (labelLower.includes("backup")) return Save;
  if (labelLower.includes("queue")) return Cpu;
  if (labelLower.includes("api")) return Key;
  if (labelLower.includes("login")) return LogIn;
  if (labelLower.includes("audit")) return FileEdit;

  // 8. Account & Profile Specific
  if (labelLower.includes("profil") || labelLower.includes("keamanan") || labelLower.includes("profile")) return ShieldCheck;

  // Default fallback
  return FileText;
}

// Internal fallback icon
const DatabaseIconFallback = Server;
