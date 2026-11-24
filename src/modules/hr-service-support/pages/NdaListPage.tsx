import { PageHeader } from "@shared/components/PageHeader";
import { DocumentListView } from "@modules/document-management/components/DocumentListView";

export function NdaListPage() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-16">
      <PageHeader title="NDA" subtitle="Non-Disclosure Agreement - nomor otomatis, approval role Legal Approver, arsip terpusat." />
      <div className="px-7 py-5">
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">
        <DocumentListView
          documentType="nda"
          emptyTitle="Belum Ada NDA"
          emptySubtitle='Klik "Surat Baru" untuk membuat NDA.'
        />
        </div>
      </div>
    </div>
  );
}
