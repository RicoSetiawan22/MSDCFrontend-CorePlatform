import { PageHeader } from "@shared/components/PageHeader";
import { DocumentListView } from "@modules/document-management/components/DocumentListView";

/** Izin Masuk Barang TIDAK punya tabel/service domain sendiri (beda dari
 * Peminjaman Fasilitas/Izin Gedung) - tidak referensi facility, jadi cukup
 * jadi Document generik lewat DocumentListView yang sudah ada di
 * document-management (lihat plan Phase 2), dikunci ke
 * document_type=izin_masuk_barang supaya punya menu GA sendiri. */
export function GaGoodsEntryListPage() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-16">
      <PageHeader title="Izin Masuk Barang" subtitle="Izin untuk barang yang masuk dari luar - approval Manager, arsip lewat Sistem Surat." />
      <div className="px-7 py-5">
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">
        <DocumentListView
          documentType="izin_masuk_barang"
          emptyTitle="Belum Ada Izin Masuk Barang"
          emptySubtitle='Klik "Surat Baru" untuk mencatat barang masuk.'
        />
        </div>
      </div>
    </div>
  );
}
