import { PageHeader } from "@shared/components/PageHeader";
import { DocumentListView } from "./DocumentListView";

/** SATU halaman generik dipakai SEMUA modul yang butuh "buat surat" -
 * TIDAK perlu halaman/route baru tiap kali ada jenis surat baru. Jenis
 * surat yang tersedia di sini murni ditentukan oleh konfigurasi
 * document_type.meta.module (lihat Core Platform > Kelola Jenis Surat,
 * DocumentTypeListPage.tsx) - tambah jenis surat baru untuk modul ini =
 * atur di sana saja, TIDAK ada kode yang perlu diubah/deploy ulang. Lihat
 * plan Phase 4 Sistem Surat. */
export function ModuleSuratPage({ moduleCode, moduleName, employeeLinked }: {
  moduleCode: string;
  moduleName: string;
  /** Diteruskan ke DocumentFormModal - berlaku untuk SEMUA jenis surat di
   * modul ini (mis. SK & Teguran HRD sama-sama ditujukan ke 1 employee).
   * Kalau nanti 1 modul punya campuran jenis employee-linked & tidak,
   * pemisahan lebih halus per document_type adalah penyempurnaan lanjutan. */
  employeeLinked?: boolean;
}) {
  return (
    <div>
      <PageHeader title={`Surat ${moduleName}`} subtitle="Jenis surat yang tersedia di sini diatur lewat Core Platform > Kelola Jenis Surat." />
      <div className="content-card">
        <DocumentListView
          moduleCode={moduleCode}
          employeeLinked={employeeLinked}
          emptyTitle={`Belum Ada Surat ${moduleName}`}
          emptySubtitle='Klik "Surat Baru" untuk membuat surat pertama.'
        />
      </div>
    </div>
  );
}
