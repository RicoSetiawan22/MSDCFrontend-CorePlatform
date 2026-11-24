import { createBrowserRouter, redirect } from "react-router-dom";
import { AppLayout } from "./App";
import { LoginPage } from "../modules/core-platform/pages/LoginPage";
import { TwoFactorLoginPage } from "../modules/core-platform/pages/TwoFactorLoginPage";
import { corePlatformRoutes } from "../modules/core-platform/routes";
import { crmSalesRoutes } from "../modules/crm-sales/routes";
import { financeAccountingRoutes } from "../modules/finance-accounting/routes";
import { procurementInventoryRoutes } from "../modules/procurement-inventory/routes";
import { dataCenterOpsRoutes } from "../modules/data-center-ops/routes";
import { hrServiceSupportRoutes } from "../modules/hr-service-support/routes";
import { documentManagementRoutes } from "../modules/document-management/routes";
import { VerifyDocumentPage } from "../modules/document-management/pages/VerifyDocumentPage";
import { VerifyApprovalPage } from "../modules/core-platform/pages/VerifyApprovalPage";
import { PublicVisitorPassPage } from "../modules/data-center-ops/pages/PublicVisitorPassPage";
import { PublicVisitorRegistrationPage } from "../modules/data-center-ops/pages/PublicVisitorRegistrationPage";
import { DashboardPage } from "@/modules/data-center-ops/pages/DashboardPage";

export const router = createBrowserRouter([
  { path: "/login", element: <LoginPage /> },
  // Dulu didaftarkan di corePlatformPublicRoutes yang TIDAK PERNAH
  // di-import ke sini - jadi 404 walau komponennya sudah lama ada.
  { path: "/login/2fa", element: <TwoFactorLoginPage /> },
  // PUBLIK, di luar AppLayout (tidak wajib token) - dibuka lewat scan QR
  // stempel tanda tangan surat, lihat DocumentService::sign(). SENGAJA
  // sejajar dengan /login, bukan bagian documentManagementRoutes yang
  // masuk area terproteksi.
  { path: "/verify", element: <VerifyDocumentPage /> },
  // PUBLIK, sama alasan dengan /verify - dibuka lewat scan QR di 1 kolom
  // tanda tangan spesifik di PDF PO/PR/FPP (ProcurementInventory), lihat
  // ResolvesApprovalSignatures::buildVerifyQrDataUri().
  { path: "/verify-approval", element: <VerifyApprovalPage /> },
  // PUBLIK, e-Pass Digital Badge Tamu untuk dibuka di smartphone pengunjung
  { path: "/visitor-pass/:token", element: <PublicVisitorPassPage /> },
  // PUBLIK, Formulir Registrasi Mandiri Tamu dari link undangan email/WA
  { path: "/visitor-registration/:token", element: <PublicVisitorRegistrationPage /> },
  {
    path: "/",
    element: <AppLayout />,
    loader: () => {
      const token = localStorage.getItem("msdc_access_token");
      if (!token) return redirect("/login");
      return null;
    },
    children: [
      { index: true, element: <DashboardPage /> },
      ...corePlatformRoutes,
      ...crmSalesRoutes,
      ...financeAccountingRoutes,
      ...procurementInventoryRoutes,
      ...dataCenterOpsRoutes,
      ...hrServiceSupportRoutes,
      ...documentManagementRoutes,
    ],
  },
  { path: "*", element: <div style={{ padding: "2rem" }}><h2>404 — Halaman tidak ditemukan</h2></div> },
]);
