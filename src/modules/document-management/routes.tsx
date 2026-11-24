import type { RouteObject } from "react-router-dom";
import { SuratMasukListPage } from "./pages/SuratMasukListPage";
import { SuratKeluarListPage } from "./pages/SuratKeluarListPage";
import { ArsipSuratPage } from "./pages/ArsipSuratPage";
import { TemplateSuratListPage } from "./pages/TemplateSuratListPage";
import { DocumentTypeListPage } from "./pages/DocumentTypeListPage";

export const documentManagementRoutes: RouteObject[] = [
  { path: "core-platform/surat-masuk", element: <SuratMasukListPage /> },
  { path: "core-platform/surat-keluar", element: <SuratKeluarListPage /> },
  { path: "core-platform/template-surat", element: <TemplateSuratListPage /> },
  { path: "core-platform/arsip-surat", element: <ArsipSuratPage /> },
  { path: "core-platform/jenis-surat", element: <DocumentTypeListPage /> },
];
