import type { RouteObject } from "react-router-dom";
import { SiteListPage } from "./pages/SiteListPage";
import { SiteDetailPage } from "./pages/SiteDetailPage";
import { RoomListPage } from "./pages/RoomListPage";
import { RackListPage } from "./pages/RackListPage";
import { RackDetailPage } from "./pages/RackDetailPage";
import { RackMonitoringPage } from "./pages/RackMonitoringPage";
import { RackMonitoringDashboardPage } from "./pages/RackMonitoringDashboardPage";
import { DeviceListPage } from "./pages/DeviceListPage";
import { DeviceDetailPage } from "./pages/DeviceDetailPage";
import { TicketListPage } from "./pages/TicketListPage";
import { TicketDetailPage } from "./pages/TicketDetailPage";
import { UsageListPage } from "./pages/UsageListPage";
import { IpamListPage } from "./pages/IpamListPage";
import { IpSubnetDetailPage } from "./pages/IpSubnetDetailPage";
import { DashboardPage } from "./pages/DashboardPage";
import { CrossConnectListPage } from "./pages/CrossConnectListPage";
import { OtbListPage } from "./pages/OtbListPage";
import { OtbDetailPage } from "./pages/OtbDetailPage";
import { SuratDcOpsPage } from "./pages/SuratDcOpsPage";
import { SuratDcOpsCreatePage } from "./pages/SuratDcOpsCreatePage";
import { SuratDcOpsDetailPage } from "./pages/SuratDcOpsDetailPage";
import { WorkOrderListPage } from "./pages/WorkOrderListPage";
import { WorkOrderDetailPage } from "./pages/WorkOrderDetailPage";
import { VisitorPassListPage } from "./pages/VisitorPassListPage";
import { VisitorPassDetailPage } from "./pages/VisitorPassDetailPage";
import { VisitorPassScannerPage } from "./pages/VisitorPassScannerPage";
import { VisitorPassInvitePage } from "./pages/VisitorPassInvitePage";
import { VisitorPassCreatePage } from "./pages/VisitorPassCreatePage";
import { CctvListPage } from "./pages/CctvListPage";
import { CctvFormPage } from "./pages/CctvFormPage";

export const dataCenterOpsRoutes: RouteObject[] = [
  { path: "dc", element: <DashboardPage /> },
  { path: "dc/sites", element: <SiteListPage /> },
  { path: "dc/sites/:id", element: <SiteDetailPage /> },
  { path: "dc/rooms", element: <RoomListPage /> },
  { path: "dc/racks", element: <RackListPage /> },
  { path: "dc/racks/:id", element: <RackDetailPage /> },
  { path: "dc/monitoring", element: <RackMonitoringPage /> },
  { path: "dc/monitoring/overview", element: <RackMonitoringDashboardPage /> },
  { path: "dc/monitoring-racks", element: <RackMonitoringDashboardPage /> },
  { path: "dc/devices", element: <DeviceListPage /> },
  { path: "dc/devices/:id", element: <DeviceDetailPage /> },
  { path: "dc/cross-connects", element: <CrossConnectListPage /> },
  { path: "dc/otbs", element: <OtbListPage /> },
  { path: "dc/otbs/:id", element: <OtbDetailPage /> },
  { path: "dc/tickets", element: <TicketListPage /> },
  { path: "dc/tickets/:id", element: <TicketDetailPage /> },
  { path: "dc/work-orders", element: <WorkOrderListPage /> },
  { path: "dc/work-orders/:id", element: <WorkOrderDetailPage /> },
  { path: "dc/usage", element: <UsageListPage /> },
  { path: "dc/ipam", element: <IpamListPage /> },
  { path: "dc/ipam/:id", element: <IpSubnetDetailPage /> },
  { path: "dc/surat", element: <SuratDcOpsPage /> },
  { path: "dc/surat/create", element: <SuratDcOpsCreatePage /> },
  { path: "dc/surat/:id", element: <SuratDcOpsDetailPage /> },
  { path: "dc/visitor-passes", element: <VisitorPassListPage /> },
  { path: "dc/visitor-passes/invite", element: <VisitorPassInvitePage /> },
  { path: "dc/visitor-passes/create", element: <VisitorPassCreatePage /> },
  { path: "dc/visitor-passes/:id", element: <VisitorPassDetailPage /> },
  { path: "dc/visitor-scanner", element: <VisitorPassScannerPage /> },
  { path: "dc/cctv", element: <CctvListPage /> },
  { path: "dc/cctv/new", element: <CctvFormPage /> },
  { path: "dc/cctv/:id/edit", element: <CctvFormPage /> },
];
