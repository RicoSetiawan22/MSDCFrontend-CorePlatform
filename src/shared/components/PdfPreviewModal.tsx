import { useState, useEffect, useRef } from "react";
import { Printer, Download, X, Maximize2, Minimize2 } from "lucide-react";
import { downloadBlobAsFile } from "@shared/lib/downloadFile";
import { Button } from "./Button";

interface PdfPreviewModalProps {
  title: string;
  blob: Blob;
  filename: string;
  onClose: () => void;
}

/**
 * Langkah PRATINJAU sebelum benar-benar cetak/simpan - blob PDF yang
 * diterima dari backend TIDAK LANGSUNG diunduh (beda dari versi
 * sebelumnya), ditampilkan dulu di <iframe> pakai PDF viewer BAWAAN
 * browser (Chrome/Edge/Firefox semua sudah bisa render PDF langsung).
 * Dari sini user pilih salah satu: Cetak (window print BAWAAN pada
 * konten iframe, bukan seluruh halaman app), Simpan (unduh ke disk),
 * atau Tutup (batal, blob dibuang begitu saja - TIDAK tersimpan/tercetak).
 *
 * isMaximized TOGGLE ukuran - default 90vw/90vh (masih terlihat ini
 * "jendela mengambang" di atas halaman), sekali klik jadi 100vw/100vh
 * penuh (berguna untuk laporan berkolom banyak yang terasa kecil di
 * ukuran default). Tombol Tutup (✕) TETAP terpisah dari toggle ini -
 * maximize/restore TIDAK PERNAH menutup modal.
 */
export function PdfPreviewModal({ title, blob, filename, onClose }: PdfPreviewModalProps) {
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [isMaximized, setIsMaximized] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const url = window.URL.createObjectURL(blob);
    setObjectUrl(url);
    return () => window.URL.revokeObjectURL(url);
  }, [blob]);

  function handlePrint() {
    // Print KONTEN IFRAME-nya (PDF-nya saja) - bukan window.print() pada
    // seluruh halaman app, yang akan ikut mencetak sidebar/toolbar dsb.
    iframeRef.current?.contentWindow?.print();
  }

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

        <div style={{ flex: 1, background: "#525659", minHeight: 0 }}>
          {objectUrl && (
            <iframe ref={iframeRef} src={objectUrl} title={title} style={{ width: "100%", height: "100%", border: "none" }} />
          )}
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.6rem", padding: "0.85rem 1.25rem", borderTop: "1px solid var(--border)", flexShrink: 0 }}>
          <Button variant="secondary" onClick={onClose}><X size={15} /> Tutup</Button>
          <Button variant="secondary" onClick={handleSave}><Download size={15} /> Simpan</Button>
          <Button onClick={handlePrint}><Printer size={15} /> Cetak</Button>
        </div>
      </div>
    </div>
  );
}
