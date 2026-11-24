import type { RouteObject } from "react-router-dom";
import { HrDashboardPage } from "./pages/HrDashboardPage";
import { EmployeeListPage } from "./pages/EmployeeListPage";
import { ShiftListPage } from "./pages/ShiftListPage";
import { TrainingListPage } from "./pages/TrainingListPage";
import { PerformanceListPage } from "./pages/PerformanceListPage";
import { IncidentListPage } from "./pages/IncidentListPage";
import { ProblemListPage } from "./pages/ProblemListPage";
import { ChangeRequestListPage } from "./pages/ChangeRequestListPage";
import { SupportTicketListPage } from "./pages/SupportTicketListPage";
import { KnowledgeBaseListPage } from "./pages/KnowledgeBaseListPage";
import { OvertimeListPage } from "./pages/OvertimeListPage";
import { PayrollListPage } from "./pages/PayrollListPage";
import { PensiunPage } from "./pages/PensiunPage";
import { PositionListPage } from "./pages/PositionListPage";
import { PermissionRequestListPage } from "./pages/PermissionRequestListPage";
import { AttendanceReportPage } from "./pages/AttendanceReportPage";
import { SuratHrdPage } from "./pages/SuratHrdPage";
import { GaFacilityListPage } from "./pages/GaFacilityListPage";
import { GaFacilityBookingListPage } from "./pages/GaFacilityBookingListPage";
import { GaBuildingAccessPermitListPage } from "./pages/GaBuildingAccessPermitListPage";
import { GaGoodsEntryListPage } from "./pages/GaGoodsEntryListPage";
import { LegalReviewListPage } from "./pages/LegalReviewListPage";
import { MouListPage } from "./pages/MouListPage";
import { NdaListPage } from "./pages/NdaListPage";
import { LegalDocumentListPage } from "./pages/LegalDocumentListPage";

export const hrServiceSupportRoutes: RouteObject[] = [
  { path: "hr/dashboard", element: <HrDashboardPage /> },
  { path: "hr", element: <HrDashboardPage /> },
  { path: "hr/employees", element: <EmployeeListPage /> },
  { path: "hr/shifts", element: <ShiftListPage /> },
  { path: "hr/training", element: <TrainingListPage /> },
  { path: "hr/performance", element: <PerformanceListPage /> },
  { path: "hr/incidents", element: <IncidentListPage /> },
  { path: "hr/problems", element: <ProblemListPage /> },
  { path: "hr/change-requests", element: <ChangeRequestListPage /> },
  { path: "hr/support-tickets", element: <SupportTicketListPage /> },
  { path: "hr/knowledge-base", element: <KnowledgeBaseListPage /> },
  { path: "hr/overtime", element: <OvertimeListPage /> },
  { path: "hr/payroll", element: <PayrollListPage /> },
  { path: "hr/pensiun", element: <PensiunPage /> },
  { path: "hr/positions", element: <PositionListPage /> },
  { path: "hr/permissions", element: <PermissionRequestListPage /> },
  { path: "hr/attendance-report", element: <AttendanceReportPage /> },
  { path: "hr/surat", element: <SuratHrdPage /> },
  // General Affairs - DIPINDAH dari modules/general-affairs (menu & fungsi
  // GA sekarang bagian dari HR & Service Support).
  { path: "hr/facilities", element: <GaFacilityListPage /> },
  { path: "hr/facility-bookings", element: <GaFacilityBookingListPage /> },
  { path: "hr/building-access", element: <GaBuildingAccessPermitListPage /> },
  { path: "hr/goods-entry", element: <GaGoodsEntryListPage /> },
  // Legal - DIPINDAH dari modules/legal (menu & fungsi Legal sekarang
  // bagian dari HR & Service Support).
  { path: "hr/legal-review", element: <LegalReviewListPage /> },
  { path: "hr/mou", element: <MouListPage /> },
  { path: "hr/nda", element: <NdaListPage /> },
  { path: "hr/legal-documents", element: <LegalDocumentListPage /> },
];
