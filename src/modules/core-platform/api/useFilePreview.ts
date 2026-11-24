import { useEffect, useState } from "react";
import { apiClient } from "@shared/lib/api-client";

const BASE = "/v1/core-platform/files";

/**
 * Sama seperti useFilePreview() tapi ambil thumbnail hasil generate GD
 * otomatis (size_label small/medium/large, lihat
 * FileManagementService::generateThumbnails()) - jauh lebih ringan dari
 * preview full-size, dipakai buat grid galeri di halaman Manajemen Gambar
 * supaya tidak menarik puluhan gambar ukuran penuh sekaligus.
 */
export function useFileThumbnail(fileId: number | null | undefined, sizeLabel: "small" | "medium" | "large" = "small") {
  const [url, setUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!fileId) { setUrl(null); return; }

    let objectUrl: string | null = null;
    let cancelled = false;
    setIsLoading(true);

    apiClient.get(`${BASE}/${fileId}/thumbnails/${sizeLabel}`, { responseType: "blob" })
      .then((res) => {
        if (cancelled) return;
        objectUrl = URL.createObjectURL(res.data as Blob);
        setUrl(objectUrl);
      })
      .catch(() => { if (!cancelled) setUrl(null); })
      .finally(() => { if (!cancelled) setIsLoading(false); });

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [fileId, sizeLabel]);

  return { url, isLoading };
}

/**
 * Ambil binary file dari sistem File Management (butuh Bearer token + izin
 * view per-file) lalu ubah jadi object URL lokal - <img src> biasa TIDAK
 * bisa kirim Authorization header, jadi tidak bisa langsung pakai URL
 * endpoint preview-nya. Dipakai buat foto employee (lihat
 * EmployeeController::photoUpload() / Employee::photoFile()).
 */
export function useFilePreview(fileId: number | null | undefined) {
  const [url, setUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!fileId) { setUrl(null); return; }

    let objectUrl: string | null = null;
    let cancelled = false;
    setIsLoading(true);

    apiClient.get(`${BASE}/${fileId}/preview`, { responseType: "blob" })
      .then((res) => {
        if (cancelled) return;
        objectUrl = URL.createObjectURL(res.data as Blob);
        setUrl(objectUrl);
      })
      .catch(() => { if (!cancelled) setUrl(null); })
      .finally(() => { if (!cancelled) setIsLoading(false); });

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [fileId]);

  return { url, isLoading };
}
