import { PageHeader } from "@shared/components/PageHeader";
import { DocumentListView } from "@modules/document-management/components/DocumentListView";

export function LegalDocumentListPage() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-16">
      <PageHeader title="Legal Document" subtitle="Dokumen legal lainnya - nomor otomatis, approval role Legal Approver, arsip terpusat." />
      <div className="px-7 py-5">
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">
        <DocumentListView
          documentType="legal_document"
          emptyTitle="Belum Ada Legal Document"
          emptySubtitle='Klik "Surat Baru" untuk mengunggah/membuat dokumen legal.'
        />
        </div>
      </div>
    </div>
  );
}
