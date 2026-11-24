import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Download, Printer, X } from "lucide-react";
import { MSDC_PDF_LOGO } from "../lib/pdfBrand";

type CrmPdfPreviewModalProps = {
  title: string;
  blob: Blob;
  filename: string;
  onClose: () => void;
};

const CRM_PDF_PREVIEW_STYLES = `
.crm-pdf-preview-backdrop { position:fixed; inset:0; z-index:10000; display:flex; align-items:center; justify-content:center; padding:clamp(8px,1.25rem,20px); background:rgba(15,23,42,.62); backdrop-filter:blur(3px); }
.crm-pdf-preview-dialog { width:min(1440px,96vw); height:min(92vh,1000px); min-height:420px; display:flex; flex-direction:column; overflow:hidden; border:1px solid rgba(255,255,255,.22); border-radius:18px; background:#fff; box-shadow:0 28px 80px rgba(2,17,35,.34); }
.crm-pdf-preview-header { flex:0 0 auto; display:flex; align-items:center; gap:16px; min-height:92px; padding:16px 22px 16px 26px; color:#fff; background:#092747; border-bottom:5px solid #F7AB00; }
.crm-pdf-preview-heading { flex:1; min-width:0; }
.crm-pdf-preview-eyebrow { margin-bottom:5px; color:#dbe5f0; font-size:11px; font-weight:700; letter-spacing:.045em; }
.crm-pdf-preview-title { display:block; overflow:hidden; color:#fff; font-size:clamp(14px,1.2vw,18px); font-weight:800; line-height:1.35; text-overflow:ellipsis; white-space:nowrap; }
.crm-pdf-preview-logo { width:116px; height:58px; flex:0 0 auto; object-fit:contain; }
.crm-pdf-preview-close { width:42px; height:42px; display:inline-flex; flex:0 0 42px; align-items:center; justify-content:center; border:1px solid rgba(255,255,255,.2); border-radius:10px; background:rgba(255,255,255,.08); color:#fff; cursor:pointer; transition:background .16s ease,transform .16s ease; }
.crm-pdf-preview-close:hover { transform:translateY(-1px); background:rgba(255,255,255,.16); }
.crm-pdf-preview-content { flex:1 1 auto; min-height:0; overflow:hidden; background:#323232; }
.crm-pdf-preview-frame { display:block; width:100%; height:100%; border:0; background:#323232; }
.crm-pdf-preview-footer { flex:0 0 auto; display:flex; align-items:center; justify-content:flex-end; gap:10px; min-height:76px; padding:12px 20px; border-top:1px solid #e2e8f0; background:#fff; }
.crm-pdf-preview-action { min-height:42px; display:inline-flex; align-items:center; justify-content:center; gap:8px; padding:9px 16px; border:1px solid #dbe3ec; border-radius:10px; background:#fff; color:#475569; font-family:inherit; font-size:13px; font-weight:700; line-height:1.2; cursor:pointer; transition:transform .16s ease,box-shadow .16s ease,border-color .16s ease,background .16s ease; }
.crm-pdf-preview-action:hover { transform:translateY(-1px); border-color:#cbd5e1; box-shadow:0 5px 14px rgba(15,39,71,.09); }
.crm-pdf-preview-action--primary { border-color:#092747; background:#092747; color:#fff; }
.crm-pdf-preview-action--primary:hover { border-color:#143b66; background:#143b66; }
.crm-pdf-preview-action:focus-visible,.crm-pdf-preview-close:focus-visible { outline:3px solid rgba(247,171,0,.42); outline-offset:2px; }
@media (max-width:640px) { .crm-pdf-preview-dialog { width:100%; height:96vh; min-height:0; border-radius:12px; } .crm-pdf-preview-header { min-height:76px; gap:10px; padding:12px; } .crm-pdf-preview-logo { width:76px; height:42px; } .crm-pdf-preview-close { width:36px; height:36px; flex-basis:36px; } .crm-pdf-preview-footer { min-height:66px; gap:7px; padding:9px; } .crm-pdf-preview-action { min-height:40px; padding:8px 10px; font-size:12px; } }
@media (prefers-reduced-motion:reduce) { .crm-pdf-preview-close,.crm-pdf-preview-action { transition:none !important; } .crm-pdf-preview-close:hover,.crm-pdf-preview-action:hover { transform:none; } }
`;

export function CrmPdfPreviewModal({
  title,
  blob,
  filename,
  onClose,
}: CrmPdfPreviewModalProps) {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const onCloseRef = useRef(onClose);
  const [previewUrl, setPreviewUrl] = useState("");

  onCloseRef.current = onClose;

  useEffect(() => {
    const url = URL.createObjectURL(blob);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [blob]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onCloseRef.current();
    };

    window.addEventListener("keydown", handleEscape);
    return () => {
      window.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  function handleDownload() {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 30000);
  }

  function handlePrint() {
    try {
      iframeRef.current?.contentWindow?.focus();
      iframeRef.current?.contentWindow?.print();
    } catch {
      if (previewUrl) window.open(previewUrl, "_blank", "noopener,noreferrer");
    }
  }

  return createPortal(
    <div
      className="crm-pdf-preview-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onMouseDown={event => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <style>{CRM_PDF_PREVIEW_STYLES}</style>
      <div className="crm-pdf-preview-dialog">
        <header className="crm-pdf-preview-header">
          <div className="crm-pdf-preview-heading">
            <div className="crm-pdf-preview-eyebrow">CRM &amp; SALES</div>
            <strong className="crm-pdf-preview-title" title={title}>{title}</strong>
          </div>
          <img className="crm-pdf-preview-logo" src={MSDC_PDF_LOGO} alt="MSDC Surabaya" />
          <button type="button" className="crm-pdf-preview-close" onClick={onClose} aria-label="Tutup preview" title="Tutup">
            <X size={19} />
          </button>
        </header>

        <div className="crm-pdf-preview-content">
          {previewUrl && (
            <iframe
              ref={iframeRef}
              className="crm-pdf-preview-frame"
              src={previewUrl}
              title={title}
            />
          )}
        </div>

        <footer className="crm-pdf-preview-footer">
          <button type="button" className="crm-pdf-preview-action" onClick={onClose}>
            <X size={15} /> Tutup
          </button>
          <button type="button" className="crm-pdf-preview-action" onClick={handleDownload}>
            <Download size={15} /> Simpan
          </button>
          <button type="button" className="crm-pdf-preview-action crm-pdf-preview-action--primary" onClick={handlePrint}>
            <Printer size={15} /> Cetak
          </button>
        </footer>
      </div>
    </div>,
    document.body
  );
}
