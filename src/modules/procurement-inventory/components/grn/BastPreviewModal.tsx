import { useEffect, useState } from "react";
import { Download } from "lucide-react";
import { Modal } from "@shared/components/Modal";
import { LoadingState } from "@shared/components/LoadingState";
import { apiClient } from "@shared/lib/api-client";
import { downloadBlobAsFile } from "@shared/lib/downloadFile";
import { extractErrorMessage } from "@shared/types/api";

interface BastPreviewModalProps {
  fileId: number;
  fileName: string;
  mimeType: string | null;
  onClose: () => void;
}

export function BastPreviewModal({
  fileId,
  fileName,
  mimeType,
  onClose,
}: BastPreviewModalProps) {
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [resolvedMime, setResolvedMime] = useState<string | null>(mimeType);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let url: string | null = null;
    let cancelled = false;

    (async () => {
      try {
        const res = await apiClient.get(`/v1/core-platform/files/${fileId}/download`, {
          responseType: "blob",
        });
        if (cancelled) return;
        const blob: Blob = res.data;
        url = URL.createObjectURL(blob);
        setObjectUrl(url);
        setResolvedMime(mimeType ?? blob.type ?? null);
      } catch (err) {
        if (!cancelled) setError(extractErrorMessage(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      if (url) URL.revokeObjectURL(url);
    };
  }, [fileId, mimeType]);

  function handleDownload() {
    if (!objectUrl) return;
    fetch(objectUrl)
      .then((r) => r.blob())
      .then((blob) => downloadBlobAsFile(blob, fileName));
  }

  const isImage = resolvedMime?.startsWith("image/");
  const isPdf = resolvedMime === "application/pdf";

  return (
    <Modal title={fileName} onClose={onClose} maxWidth={820}>
      {loading && <LoadingState />}
      {error && <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs">{error}</div>}
      {!loading && !error && objectUrl && (
        <div className="flex flex-col gap-3 py-1">
          <div className="max-h-[70vh] overflow-auto bg-slate-100 rounded-xl flex justify-center p-2">
            {isImage && <img src={objectUrl} alt={fileName} className="max-w-full h-auto rounded-lg" />}
            {isPdf && <iframe src={objectUrl} title={fileName} className="w-full h-[70vh] border-none rounded-lg" />}
            {!isImage && !isPdf && (
              <div className="p-8 text-center text-slate-400 text-xs">
                Format file ini tidak bisa di-preview langsung ({resolvedMime ?? "tipe tidak diketahui"}). Unduh untuk membukanya.
              </div>
            )}
          </div>
          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-xs rounded-xl border border-slate-200 transition-all cursor-pointer"
            >
              <Download size={14} />
              <span>Unduh File</span>
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}