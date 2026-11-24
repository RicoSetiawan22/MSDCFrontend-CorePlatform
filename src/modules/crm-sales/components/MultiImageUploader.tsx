import { useState, useEffect, useRef } from "react";
import { Upload, X, Image as ImageIcon } from "lucide-react";
import { fileApi } from "@shared/api/fileApi";
import { extractErrorMessage } from "@shared/types/api";

const MAX_IMAGES = 8;

interface UploadedImage {
  fileId: number;
  fileName: string;
  mimeType: string;
  /** Local object URL for instant preview before/while fetching server thumbnail */
  localPreviewUrl?: string;
}

interface MultiImageUploaderProps {
  /** CorePlatform module_code */
  moduleCode: string;
  /** CorePlatform reference_type */
  referenceType: string;
  /** Initially uploaded file IDs (e.g. from existing PromoPackage.image_file_ids) */
  initialFileIds?: number[] | null;
  /** Called whenever the list of file IDs changes */
  onChange: (fileIds: number[]) => void;
  /** Max images (default 8) */
  maxImages?: number;
}

/**
 * Multi-image uploader backed by CorePlatform File Management.
 *
 * Upload flow:
 *   1. User picks file(s)
 *   2. `fileApi.upload()` POSTs multipart/form-data to `/v1/core-platform/files/upload`
 *   3. FileRecord ID is appended to local array → `onChange(fileIds)`
 *   4. Remove clicks sync back via `onChange(remainingIds)`
 *
 * FileRecord IDs are the source of truth stored in `crm_promo_package.image_file_ids`
 * (JSON array column). Thumbnails are fetched server-side via `fileApi.previewBlob()`.
 */
export function MultiImageUploader({
  moduleCode,
  referenceType,
  initialFileIds,
  onChange,
  maxImages = MAX_IMAGES,
}: MultiImageUploaderProps) {
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [errors, setErrors] = useState<Map<number, string>>(new Map());
  const inputRef = useRef<HTMLInputElement>(null);

  // Load initial images by fetching their metadata
  useEffect(() => {
    if (!initialFileIds?.length) {
      setImages([]);
      return;
    }

    const ids = [...new Set(initialFileIds)].slice(0, maxImages);

    Promise.allSettled(
      ids.map(async (fileId) => {
        const res = await fileApi.show(fileId);
        return { fileId, fileName: res.data.data.original_name, mimeType: res.data.data.mime_type };
      })
    ).then((results) => {
      const loaded: UploadedImage[] = [];
      results.forEach((r) => {
        if (r.status === "fulfilled") loaded.push({ ...r.value });
      });
      // Sort by original order
      loaded.sort((a, b) => ids.indexOf(a.fileId) - ids.indexOf(b.fileId));
      setImages(loaded);
      onChange(loaded.map((img) => img.fileId));
    });
  }, []); // intentionally run once on mount — initialFileIds from props

  // Store preview URLs in a ref (persists across renders, not reactive)
  const previewsRef = useRef<Map<number, string>>(new Map());
  const [, forceUpdate] = useState(0);

  // Fetch server previews for all loaded images
  useEffect(() => {
    images.forEach((img) => {
      if (img.mimeType.startsWith("image/") && !previewsRef.current.has(img.fileId)) {
        fileApi
          .previewBlob(img.fileId)
          .then((res) => {
            previewsRef.current.set(img.fileId, URL.createObjectURL(res.data));
            forceUpdate(n => n + 1);
          })
          .catch(() => { /* fallback: keep local preview */ });
      }
    });
  }, [images]);

  // Cleanup blob URLs when images change
  useEffect(() => {
    const currentIds = new Set(images.map(img => img.fileId));
    previewsRef.current.forEach((url, id) => {
      if (!currentIds.has(id)) {
        URL.revokeObjectURL(url);
        previewsRef.current.delete(id);
      }
    });
  }, [images]);

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;

    const remainingSlots = maxImages - images.length;
    const toUpload = files.slice(0, remainingSlots);

    if (files.length > remainingSlots) {
      alert(`Maksimal ${maxImages} gambar. Sisanya (${files.length - remainingSlots}) tidak diupload.`);
    }

    for (const file of toUpload) {
      const localPreview = URL.createObjectURL(file);
      const tempId = -Date.now() - Math.random(); // temporary negative ID

      // Optimistic preview
      setImages((prev) => [
        ...prev,
        { fileId: tempId, fileName: file.name, mimeType: file.type, localPreviewUrl: localPreview },
      ]);
      setErrors((prev) => {
        const m = new Map(prev);
        m.delete(tempId);
        return m;
      });

      try {
        const res = await fileApi.upload(file, moduleCode, referenceType);
        const fileRecord = res.data.data;

        setImages((prev) =>
          prev.map((img) =>
            img.fileId === tempId
              ? { fileId: fileRecord.id, fileName: fileRecord.original_name, mimeType: fileRecord.mime_type }
              : img
          )
        );

        const updatedIds = images
          .filter((img) => img.fileId !== tempId)
          .map((img) => img.fileId);
        updatedIds.push(fileRecord.id);
        onChange(updatedIds);
      } catch (err) {
        setErrors((prev) => {
          const m = new Map(prev);
          m.set(tempId, extractErrorMessage(err));
          return m;
        });
        // Remove failed optimistic entry
        setImages((prev) => prev.filter((img) => img.fileId !== tempId));
        URL.revokeObjectURL(localPreview);
      }
    }

    if (inputRef.current) inputRef.current.value = "";
  }

  function handleRemove(fileId: number) {
    setImages((prev) => prev.filter((img) => img.fileId !== fileId));
    const remaining = images.filter((img) => img.fileId !== fileId).map((img) => img.fileId);
    onChange(remaining);
  }

  const canAddMore = images.length < maxImages;

  return (
    <div style={{ marginBottom: "1rem" }}>
      <label className="input-label">Gambar Paket (maks. {maxImages})</label>

      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.6rem", alignItems: "flex-start" }}>
        {/* Image thumbnails */}
        {images.map((img, idx) => {
          const previewUrl =
            previewsRef.current.get(img.fileId) ?? img.localPreviewUrl;
          const hasError = errors.has(img.fileId);
          const errorMsg = errors.get(img.fileId);

          return (
            <div
              key={img.fileId}
              title={img.fileName}
              style={{
                position: "relative",
                width: 88,
                height: 88,
                borderRadius: 8,
                border: `2px solid ${hasError ? "#dc2626" : "#e5e7eb"}`,
                overflow: "hidden",
                background: "#f9fafb",
                flexShrink: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {previewUrl && img.mimeType.startsWith("image/") ? (
                <img
                  src={previewUrl}
                  alt={img.fileName}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              ) : (
                <ImageIcon size={28} color="#9ca3af" />
              )}

              {/* Remove button */}
              <button
                type="button"
                onClick={() => handleRemove(img.fileId)}
                title="Hapus gambar"
                style={{
                  position: "absolute",
                  top: 2,
                  right: 2,
                  width: 20,
                  height: 20,
                  borderRadius: "50%",
                  border: "none",
                  background: "rgba(0,0,0,0.55)",
                  color: "white",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: 0,
                  lineHeight: 1,
                }}
              >
                <X size={11} />
              </button>

              {/* Primary badge */}
              {idx === 0 && (
                <span
                  style={{
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    right: 0,
                    background: "rgba(99,102,241,0.85)",
                    color: "white",
                    fontSize: "0.58rem",
                    fontWeight: 700,
                    textAlign: "center",
                    padding: "1px 0",
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                  }}
                >
                  Utama
                </span>
              )}

              {/* Error overlay */}
              {hasError && (
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    background: "rgba(220,38,38,0.15)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                  title={errorMsg ?? ""}
                >
                  <span style={{ fontSize: "0.6rem", color: "#dc2626", textAlign: "center", padding: 2 }}>
                    !
                  </span>
                </div>
              )}
            </div>
          );
        })}

        {/* Add button */}
        {canAddMore && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            title={`Tambah gambar (${images.length}/${maxImages})`}
            style={{
              width: 88,
              height: 88,
              borderRadius: 8,
              border: "2px dashed #c7d2fe",
              background: "#f5f3ff",
              cursor: "pointer",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 4,
              flexShrink: 0,
              transition: "border-color 0.15s, background 0.15s",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = "#6366f1";
              (e.currentTarget as HTMLButtonElement).style.background = "#ede9fe";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = "#c7d2fe";
              (e.currentTarget as HTMLButtonElement).style.background = "#f5f3ff";
            }}
          >
            <Upload size={20} color="#6366f1" />
            <span style={{ fontSize: "0.62rem", color: "#6366f1", fontWeight: 600 }}>
              {images.length === 0 ? "Tambah" : "+ lagi"}
            </span>
          </button>
        )}

        {/* Slot counter */}
        {images.length > 0 && (
          <div
            style={{
              height: 88,
              display: "flex",
              alignItems: "center",
              padding: "0 0.4rem",
              fontSize: "0.72rem",
              color: "#9ca3af",
            }}
          >
            {images.length}/{maxImages}
          </div>
        )}
      </div>

      {/* Errors list */}
      {Array.from(errors.values()).filter(Boolean).map((msg, i) => (
        <div key={i} className="input-error" style={{ marginTop: "0.25rem" }}>
          {msg}
        </div>
      ))}

      <div style={{ marginTop: "0.4rem", fontSize: "0.7rem", color: "#9ca3af" }}>
        Format: JPG, PNG, GIF. Maks 50 MB per file. Gambar pertama = foto utama paket.
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileSelect}
        style={{ display: "none" }}
      />
    </div>
  );
}
