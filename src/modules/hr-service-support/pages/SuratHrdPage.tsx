import { ModuleSuratPage } from "@modules/document-management/components/ModuleSuratPage";

/** SATU halaman untuk SEMUA jenis surat HRD (SK, Teguran, dan jenis baru
 * apapun yang diatur ke module='hr-service-support' lewat Core Platform >
 * Kelola Jenis Surat) - MENGGANTIKAN SkListPage.tsx/TeguranListPage.tsx
 * yang masing-masing 1 halaman terpisah per jenis (lihat plan Phase 4:
 * jenis surat baru untuk HRD sekarang cukup dikonfigurasi, tidak perlu
 * halaman baru). employeeLinked=true karena SK/Teguran/dst di HRD selalu
 * ditujukan ke 1 employee tertentu. */
export function SuratHrdPage() {
  return <ModuleSuratPage moduleCode="hr-service-support" moduleName="HRD" employeeLinked />;
}
