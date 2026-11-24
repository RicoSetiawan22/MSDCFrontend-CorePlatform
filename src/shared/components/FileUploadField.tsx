import { useState, useEffect, useRef } from "react";
import { Upload, FileIcon, X, Loader2 } from "lucide-react";
import { createFileUploadIdempotencyKey, fileApi } from "@shared/api/fileApi";
import { extractErrorMessage } from "@shared/types/api";

interface FileUploadFieldProps {
  label: string;
  /** File yang SUDAH tersimpan (mis. waktu buka form edit) - kosongkan
   * kalau memang belum ada file terpasang. */
  currentFileId?: number | null;
  /** Label fitur untuk staging upload. Relasi ke parent baru dibuat oleh
   * endpoint parent saat form disimpan. */
  moduleCode: string;
  referenceType: string;
  referenceId?: number;
  accept?: string;
  onUploaded: (fileId: number) => void;
  onRemove?: () => void;
}

/**
 * Komponen BERSAMA untuk SEMUA kebutuhan upload di app ini (bukan
 * khusus logo Organization) - upload lewat File Management CorePlatform
 * yang SUDAH ADA (folder/versioning/thumbnail/OCR/e-signature semua
 * tertangani di sana), bukan bikin mekanisme upload sendiri-sendiri per
 * fitur. Pemanggil CUMA perlu kasih moduleCode/referenceType yang sesuai
 * konteksnya, sisanya (upload, preview, ganti file) sama semua.
 */
export function FileUploadField({ label, currentFileId, moduleCode, referenceType, accept, onUploaded, onRemove }: FileUploadFieldProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const retryRef = useRef<{ identity: string; key: string } | null>(null);

  // Muat preview file yang SUDAH ADA (mis. buka form edit organisasi
  // yang sudah punya logo) - blob fetch, BUKAN <img src="URL polos">,
  // endpoint preview butuh header Authorization Bearer.
  useEffect(() => {
    let objectUrl: string | null = null;
    if (!currentFileId) {
      setPreviewUrl(null);
      setFileName(null);
      return;
    }
    setIsLoadingPreview(true);
    fileApi.show(currentFileId)
      .then((res) => {
        setFileName(res.data.data.original_name);
        if (res.data.data.mime_type.startsWith("image/")) {
          return fileApi.previewBlob(currentFileId).then((blobRes) => {
            objectUrl = window.URL.createObjectURL(blobRes.data);
            setPreviewUrl(objectUrl);
          });
        }
      })
      .catch(() => setError("Gagal memuat pratinjau file."))
      .finally(() => setIsLoadingPreview(false));

    return () => {
      if (objectUrl) window.URL.revokeObjectURL(objectUrl);
    };
  }, [currentFileId]);

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setIsUploading(true);
    try {
      const identity = `${file.name}:${file.size}:${file.lastModified}`;
      if (retryRef.current?.identity !== identity) {
        retryRef.current = { identity, key: createFileUploadIdempotencyKey() };
      }
      // The parent form links the returned file ID after upload. A caller
      // supplied reference ID must not be used as an authorization claim.
      const res = await fileApi.upload(file, moduleCode, referenceType,
        undefined, undefined, retryRef.current.key);
      onUploaded(res.data.data.id);
      retryRef.current = null;
      setFileName(res.data.data.original_name);
      if (file.type.startsWith("image/")) {
        setPreviewUrl(URL.createObjectURL(file));
      }
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setIsUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div style={{ marginBottom: "1rem" }}>
      <label className="input-label">{label}</label>
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", border: "1px solid var(--border)", borderRadius: 8, padding: "0.6rem 0.75rem" }}>
        {isLoadingPreview ? (
          <Loader2 size={20} className="loading-state__spinner" color="var(--grey)" />
        ) : previewUrl ? (
          <img src={previewUrl} alt="Preview" style={{ width: 36, height: 36, objectFit: "contain", borderRadius: 4, border: "1px solid var(--border)" }} />
        ) : fileName ? (
          <FileIcon size={20} color="var(--grey)" />
        ) : (
          <div style={{ width: 36, height: 36, borderRadius: 4, background: "var(--page-bg)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Upload size={16} color="var(--grey)" />
          </div>
        )}

        <div style={{ flex: 1, minWidth: 0, fontSize: "0.82rem", color: fileName ? "var(--grey-dark)" : "var(--grey)" }}>
          {fileName ?? "Belum ada file dipilih"}
        </div>

        {fileName && onRemove && (
          <button type="button" onClick={() => { onRemove(); setFileName(null); setPreviewUrl(null); }} style={{ border: "none", background: "none", color: "var(--bad)", cursor: "pointer", display: "flex" }} title="Hapus">
            <X size={15} />
          </button>
        )}

        <button type="button" onClick={() => inputRef.current?.click()} disabled={isUploading} className="btn btn-secondary" style={{ fontSize: "0.78rem", padding: "0.35rem 0.7rem", flexShrink: 0 }}>
          {isUploading ? "Mengunggah..." : fileName ? "Ganti" : "Unggah"}
        </button>
        <input ref={inputRef} type="file" accept={accept} onChange={handleFileSelect} style={{ display: "none" }} />
      </div>
      {error && <div className="input-error" style={{ marginTop: "0.3rem" }}>{error}</div>}
    </div>
  );
}
