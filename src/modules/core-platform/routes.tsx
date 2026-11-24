import { Navigate, type RouteObject } from "react-router-dom";
import { CorePlatformDashboardPage } from "./pages/CorePlatformDashboardPage";
import { OrganizationListPage } from "./pages/OrganizationListPage";
import { UserListPage } from "./pages/UserListPage";
import { RoleListPage } from "./pages/RoleListPage";
import { OrganizationStructurePage } from "./pages/OrganizationStructurePage";
import { MasterDataPage } from "./pages/MasterDataPage";
import { NotificationCenterPage } from "./pages/NotificationCenterPage";
import { AuditLoginPage, AuditDataChangePage, AuditNotificationPage } from "./pages/AuditPage";
import { MyApprovalListPage } from "./pages/MyApprovalListPage";
import { WorkflowTemplateListPage } from "./pages/WorkflowTemplateListPage";
import { WorkflowTemplateDetailPage } from "./pages/WorkflowTemplateDetailPage";
import { TwoFactorSetupPage } from "./pages/TwoFactorSetupPage";
import { SystemSettingsPage } from "./pages/SystemSettingsPage";
import { MyAccountPage } from "./pages/MyAccountPage";
import { ApiKeyListPage } from "./pages/ApiKeyListPage";
import { ImageManagementPage } from "./pages/ImageManagementPage";
import { SystemBackupPage } from "./pages/SystemBackupPage";
import { QueueMonitorPage } from "./pages/QueueMonitorPage";
import { StatusApprovalPage } from "./pages/StatusApprovalPage";

/** Route TERPROTEKSI — path RELATIF (tanpa "/" di depan). Route publik
 * (/login, /login/2fa) didaftarkan LANGSUNG di app/router.tsx, bukan di
 * sini - dulu ada corePlatformPublicRoutes di file ini TAPI TIDAK PERNAH
 * di-import/dipakai router.tsx, jadi /login/2fa sebenarnya 404 selama ini
 * meski komponennya sudah ada (ketahuan saat menata ulang alur login). */
export const corePlatformRoutes: RouteObject[] = [
  // Dashboard Core Platform
  { path: "core-platform/dashboard", element: <CorePlatformDashboardPage /> },
  { path: "core-platform", element: <Navigate to="/core-platform/dashboard" replace /> },
  // Organization
  { path: "core-platform/organizations", element: <OrganizationListPage /> },
  // User & RBAC
  { path: "core-platform/users", element: <UserListPage /> },
  { path: "core-platform/roles", element: <RoleListPage /> },
  // Organization Structure
  { path: "core-platform/organization-structure", element: <OrganizationStructurePage /> },
  // Master Data
  { path: "core-platform/master-data", element: <MasterDataPage /> },
  // Pengaturan Sistem (gerbang: permission system-config.manage)
  { path: "core-platform/system-settings", element: <SystemSettingsPage /> },
  { path: "core-platform/api-keys", element: <ApiKeyListPage /> },
  { path: "core-platform/images", element: <ImageManagementPage /> },
  { path: "core-platform/system-backups", element: <SystemBackupPage /> },
  { path: "core-platform/queue", element: <QueueMonitorPage /> },
  // Notifications
  { path: "core-platform/notifications", element: <NotificationCenterPage /> },
  // Audit
  { path: "core-platform/audit/login", element: <AuditLoginPage /> },
  { path: "core-platform/audit/data-change", element: <AuditDataChangePage /> },
  { path: "core-platform/audit/notifications", element: <AuditNotificationPage /> },
  // Workflow
  { path: "core-platform/my-approvals", element: <MyApprovalListPage /> },
  { path: "core-platform/workflow-templates", element: <WorkflowTemplateListPage /> },
  { path: "core-platform/status-approval", element: <StatusApprovalPage /> },
  { path: "core-platform/workflow-templates/:templateId", element: <WorkflowTemplateDetailPage /> },
  // Alias routes untuk kompatibilitas navigasi
  { path: "workflow-design", element: <WorkflowTemplateListPage /> },
  { path: "workflow-design/:templateId", element: <WorkflowTemplateDetailPage /> },
  // 2FA wajib - lihat guard di app/App.tsx (AppLayout)
  { path: "2fa/setup", element: <TwoFactorSetupPage /> },
  // Akun Saya - menu khusus di luar semua modul, NavLink berdiri sendiri
  // di Sidebar.tsx (bukan bagian SECTIONS), path SENGAJA tanpa prefix
  // "core-platform/" karena ini bukan fitur administratif modul, tapi
  // self-service tiap user atas akunnya sendiri.
  { path: "account", element: <MyAccountPage /> },
];
