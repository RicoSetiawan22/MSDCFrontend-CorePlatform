import { useState, useEffect } from "react";
import { Download, X, Maximize2, Minimize2 } from "lucide-react";
import { downloadBlobAsFile } from "@shared/lib/downloadFile";
import { Button } from "./Button";

interface ImagePreviewModalProps {
  title: string;
  blob: Blob;
  filename: string;
  onClose: () => void;
}

/** Sama pola dengan PdfPreviewModal - lampiran gambar (jpg/png/dst) tampil
 * inline dulu di modal, bukan langsung dipaksa unduh (lihat pembatasan
 * lampiran ke PDF/gambar saja di DocumentController::attachFile()). */
export function ImagePreviewModal({ title, blob, filename, onClose }: ImagePreviewModalProps) {
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [isMaximized, setIsMaximized] = useState(false);

  useEffect(() => {
    const url = window.URL.createObjectURL(blob);
    setObjectUrl(url);
    return () => window.URL.revokeObjectURL(url);
  }, [blob]);

  function handleSave() {
    downloadBlobAsFile(blob, filename);
  }

  return (
    <div className="modal-overlay" onClick={onClose} style={{ padding: isMaximized ? 0 : undefined }}>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "white",
          borderRadius: isMaximized ? 0 : 10,
          width: isMaximized ? "100vw" : "90vw",
          height: isMaximized ? "100vh" : "90vh",
          maxWidth: isMaximized ? "none" : 1000,
          display: "flex", flexDirection: "column", overflow: "hidden",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1rem 1.25rem", borderBottom: "1px solid var(--border)", flexShrink: 0 }}>
          <h3 style={{ margin: 0, fontSize: "1.05rem" }}>{title}</h3>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <button
              onClick={() => setIsMaximized((v) => !v)}
              title={isMaximized ? "Kembalikan ukuran" : "Perbesar layar penuh"}
              style={{ border: "none", background: "none", cursor: "pointer", color: "var(--grey)", display: "flex", padding: "0.2rem" }}
            >
              {isMaximized ? <Minimize2 size={17} /> : <Maximize2 size={17} />}
            </button>
            <button onClick={onClose} title="Tutup" style={{ border: "none", background: "none", fontSize: "1.2rem", cursor: "pointer", color: "var(--grey)", display: "flex", padding: "0.2rem" }}>
              <X size={19} />
            </button>
          </div>
        </div>

        <div style={{ flex: 1, background: "#525659", minHeight: 0, display: "flex", alignItems: "center", justifyContent: "center", overflow: "auto" }}>
          {objectUrl && (
            <img src={objectUrl} alt={title} style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
          )}
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.6rem", padding: "0.85rem 1.25rem", borderTop: "1px solid var(--border)", flexShrink: 0 }}>
          <Button variant="secondary" onClick={onClose}><X size={15} /> Tutup</Button>
          <Button onClick={handleSave}><Download size={15} /> Simpan</Button>
        </div>
      </div>
    </div>
  );
}
