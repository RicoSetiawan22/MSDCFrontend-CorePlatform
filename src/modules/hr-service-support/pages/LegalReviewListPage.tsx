import { PageHeader } from "@shared/components/PageHeader";
import { DocumentListView } from "@modules/document-management/components/DocumentListView";

export function LegalReviewListPage() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-16">
      <PageHeader title="Legal Review" subtitle="Permintaan review dokumen/kontrak oleh tim Legal - approval role Legal Approver." />
      <div className="px-7 py-5">
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">
        <DocumentListView
          documentType="legal_review"
          emptyTitle="Belum Ada Legal Review"
          emptySubtitle='Klik "Surat Baru" untuk mengajukan review.'
        />
        </div>
      </div>
    </div>
  );
}
