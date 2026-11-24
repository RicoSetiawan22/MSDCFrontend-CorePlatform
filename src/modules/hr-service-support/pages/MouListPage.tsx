import { PageHeader } from "@shared/components/PageHeader";
import { DocumentListView } from "@modules/document-management/components/DocumentListView";

export function MouListPage() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-16">
      <PageHeader title="MoU" subtitle="Memorandum of Understanding - nomor otomatis, approval role Legal Approver, arsip terpusat." />
      <div className="px-7 py-5">
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">
        <DocumentListView
          documentType="mou"
          emptyTitle="Belum Ada MoU"
          emptySubtitle='Klik "Surat Baru" untuk membuat MoU.'
        />
        </div>
      </div>
    </div>
  );
}
