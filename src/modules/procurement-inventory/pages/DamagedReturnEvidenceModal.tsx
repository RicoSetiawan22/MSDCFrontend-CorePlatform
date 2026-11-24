import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Paperclip } from "lucide-react";
import { damagedItemReturnApi } from "../api/damagedItemReturnApi";
import { useActiveOrgId } from "@shared/lib/organization-context";
import { useAuth } from "@shared/lib/auth-context";
import { ProcurementFormModal } from "../components/ProcurementFormModal";
import { LoadingState } from "@shared/components/LoadingState";
import { extractErrorMessage } from "@shared/types/api";

export function DamagedReturnEvidenceModal({ id, onClose }: { id: number; onClose: () => void }) {
  const orgId = useActiveOrgId();
  const { user } = useAuth();
  const [reference, setReference] = useState<string | null>(null);
  const [url, setUrl] = useState<string | null>(null);
  const files = useQuery({
    queryKey: ["damaged-return-evidence", user?.id, orgId, id],
    queryFn: async ({ signal }) => (await damagedItemReturnApi.evidence(id, signal)).data.data,
    enabled: Boolean(user && orgId),
    retry: false,
  });
  const content = useQuery({
    queryKey: ["damaged-return-evidence-content", user?.id, orgId, id, reference],
    queryFn: async ({ signal }) => (await damagedItemReturnApi.evidenceContent(id, reference!, signal)).data,
    enabled: Boolean(user && orgId && reference),
    retry: false,
    gcTime: 0,
    staleTime: 0,
  });

  useEffect(() => {
    if (!content.data) {
      setUrl(null);
      return;
    }
    const objectUrl = URL.createObjectURL(content.data);
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [content.data]);

  const selected = files.data?.find((file) => file.id === reference);

  return (
    <ProcurementFormModal
      title="Bukti Kerusakan Barang"
      subtitle="Lampiran foto atau dokumen fisik kondisi barang yang rusak"
      icon={Paperclip}
      onClose={onClose}
      maxWidth="max-w-[760px]"
      footer={
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
        >
          Tutup
        </button>
      }
    >
      <div className="flex flex-col gap-3 py-1">
        {files.isPending && <LoadingState />}
        {files.error && (
          <div className="p-3 bg-rose-50 border border-rose-200/80 rounded-xl text-xs font-medium text-rose-700">
            {extractErrorMessage(files.error)}
          </div>
        )}
        {files.data?.length === 0 && (
          <div className="text-xs text-slate-400 py-4 text-center italic">
            Belum ada bukti kerusakan yang dilampirkan.
          </div>
        )}
        <div className="flex flex-wrap gap-2">
          {files.data?.map((file) => (
            <button
              key={file.id}
              type="button"
              className={`px-3 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer border ${
                reference === file.id
                  ? "bg-amber-500 text-white border-amber-500 shadow-xs"
                  : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
              }`}
              disabled={!file.previewable || content.isFetching}
              onClick={() => {
                setUrl(null);
                setReference(file.id);
              }}
            >
              {file.name} ({Math.ceil(file.size_bytes / 1024)} KB)
            </button>
          ))}
        </div>
        {content.isFetching && <LoadingState />}
        {content.error && (
          <div className="p-3 bg-rose-50 border border-rose-200/80 rounded-xl text-xs font-medium text-rose-700">
            {extractErrorMessage(content.error)}
          </div>
        )}
        {url && !content.isFetching && !content.error && selected && (
          <div className="mt-2 border border-slate-200 rounded-2xl overflow-hidden bg-slate-900/5 flex items-center justify-center">
            {selected.mime_type === "application/pdf" ? (
              <iframe
                title={`Bukti: ${selected.name}`}
                src={url}
                className="w-full h-[60vh] border-0"
              />
            ) : (
              <img
                alt={`Bukti kerusakan: ${selected.name}`}
                src={url}
                className="max-w-full max-h-[60vh] object-contain rounded-xl p-2"
              />
            )}
          </div>
        )}
      </div>
    </ProcurementFormModal>
  );
}
