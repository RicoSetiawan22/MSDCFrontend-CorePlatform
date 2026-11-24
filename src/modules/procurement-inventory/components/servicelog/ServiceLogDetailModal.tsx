import {
  FileText,
  Calendar,
  Building2,
  User,
  Wrench,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Download,
  ExternalLink,
  Tag,
  MapPin,
  Laptop,
} from "lucide-react";
import { Link } from "react-router-dom";
import { ProcurementFormModal } from "../ProcurementFormModal";
import type { ServiceLogLine } from "../../types/serviceLog";
import {
  SERVICE_RESULT_LABELS,
  SERVICE_RESULT_BADGES,
  SERVICE_SLA_LABELS,
  SERVICE_SLA_BADGES,
} from "../../types/serviceLog";
import { formatDate, formatCurrency } from "@shared/lib/format";

interface ServiceLogDetailModalProps {
  item: ServiceLogLine;
  onClose: () => void;
  onLinkAssetClick?: () => void;
}

export function ServiceLogDetailModal({
  item,
  onClose,
  onLinkAssetClick,
}: ServiceLogDetailModalProps) {
  const isInternal = item.source_type === "internal";
  const po = item.purchase_order;
  const grLine = item.goods_receipt_lines?.[0];
  const grn = grLine?.goods_receipt;

  const resultStatus = item.service_result || (grn?.status === "posted" ? "completed" : "in_progress");
  const slaStatus = item.sla_status || (resultStatus === "completed" ? "on_time" : "in_progress");

  return (
    <ProcurementFormModal
      title="Detail Service Log & Berita Acara"
      subtitle={`Rincian lengkap riwayat servis, teknisi, penyambung aset, dan status SLA.`}
      icon={Wrench}
      onClose={onClose}
      maxWidth="max-w-[720px]"
      hideFooter
    >
      <div className="flex flex-col gap-4 text-xs">
        {/* ── Status & Banner Ringkasan ── */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-slate-50 border border-slate-200/90 rounded-2xl">
          <div className="flex flex-wrap items-center gap-2">
            {/* Badge Sumber */}
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold uppercase tracking-wider text-[10px] border ${
                isInternal
                  ? "bg-purple-50 text-purple-700 border-purple-200"
                  : "bg-blue-50 text-blue-700 border-blue-200"
              }`}
            >
              {isInternal ? "Servis Internal (Non-PO)" : "PO Rekanan Jasa"}
            </span>

            {/* Badge Hasil */}
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg font-semibold text-[11px] border ${
                SERVICE_RESULT_BADGES[resultStatus] ?? "bg-slate-100 text-slate-700 border-slate-200"
              }`}
            >
              <CheckCircle2 size={12} />
              <span>{SERVICE_RESULT_LABELS[resultStatus] ?? resultStatus}</span>
            </span>

            {/* Badge SLA */}
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg font-semibold text-[11px] border ${
                SERVICE_SLA_BADGES[slaStatus] ?? "bg-slate-100 text-slate-700 border-slate-200"
              }`}
            >
              <Clock size={12} />
              <span>{SERVICE_SLA_LABELS[slaStatus] ?? slaStatus}</span>
            </span>
          </div>

          <div className="text-right">
            <span className="text-slate-400 text-[11px]">Total Nilai Jasa:</span>
            <div className="font-mono font-bold text-sm text-slate-800">
              {formatCurrency(item.amount)}
            </div>
          </div>
        </div>

        {/* ── Section: Aset Terkait (Penyambung ke Aset) ── */}
        <div className="p-4 bg-white border border-slate-200 rounded-2xl flex flex-col gap-2.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold text-slate-800 uppercase tracking-wide text-[11px]">
              <Laptop size={14} className="text-amber-500" />
              <span>Aset Terkait (Penyambung Aset)</span>
            </div>
            {!item.asset && onLinkAssetClick && (
              <button
                type="button"
                onClick={onLinkAssetClick}
                className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-medium text-[11px] transition-all shadow-xs active:scale-95"
              >
                + Hubungkan Aset Sekarang
              </button>
            )}
          </div>

          {item.asset ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-amber-50/40 border border-amber-200/60 rounded-xl">
              <div>
                <span className="text-[10px] font-semibold text-slate-400 uppercase">Nama & Nomor Aset</span>
                <div className="font-bold text-slate-800 text-xs mt-0.5">
                  {item.asset.asset_name}
                </div>
                <div className="font-mono font-medium text-amber-800 text-[11px] mt-0.5">
                  Kode: {item.asset.asset_number}
                </div>
              </div>

              <div>
                <span className="text-[10px] font-semibold text-slate-400 uppercase">Detail Spesifikasi</span>
                <div className="text-slate-600 text-[11px] mt-0.5 flex flex-col gap-0.5">
                  {item.asset.category && (
                    <span>
                      Kategori: <span className="font-medium capitalize">{item.asset.category}</span>
                    </span>
                  )}
                  {item.asset.serial_number && (
                    <span className="font-mono">
                      Serial: {item.asset.serial_number}
                    </span>
                  )}
                  {item.asset.specific_location && (
                    <span className="flex items-center gap-1">
                      <MapPin size={11} className="text-slate-400" />
                      {item.asset.specific_location}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between p-3 bg-slate-50 border border-dashed border-slate-300 rounded-xl text-slate-500">
              <div className="flex items-center gap-2">
                <AlertTriangle size={15} className="text-amber-500 shrink-0" />
                <span>Baris servis ini belum ditautkan ke aset inventaris spesifik.</span>
              </div>
            </div>
          )}
        </div>

        {/* ── Section: Rincian Pekerjaan & Keuangan ── */}
        <div className="p-4 bg-white border border-slate-200 rounded-2xl flex flex-col gap-3 shadow-2xs">
          <div className="font-bold text-slate-800 uppercase tracking-wide text-[11px] flex items-center gap-2">
            <Tag size={14} className="text-blue-500" />
            <span>Rincian Pekerjaan & Kuantitas</span>
          </div>

          <div>
            <span className="text-[10px] font-semibold text-slate-400 uppercase">Deskripsi Layanan</span>
            <div className="font-semibold text-slate-800 text-xs mt-0.5 leading-relaxed">
              {item.description}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-100">
            <div>
              <span className="text-[10px] font-semibold text-slate-400 uppercase">Kuantitas</span>
              <div className="font-mono font-bold text-slate-800 text-xs mt-0.5">
                {item.quantity} {item.uom}
              </div>
            </div>

            <div>
              <span className="text-[10px] font-semibold text-slate-400 uppercase">Biaya Satuan</span>
              <div className="font-mono text-slate-700 text-xs mt-0.5">
                {formatCurrency(item.unit_price)}
              </div>
            </div>

            <div>
              <span className="text-[10px] font-semibold text-slate-400 uppercase">Total Biaya</span>
              <div className="font-mono font-bold text-slate-900 text-xs mt-0.5">
                {formatCurrency(item.amount)}
              </div>
            </div>

            <div>
              <span className="text-[10px] font-semibold text-slate-400 uppercase">Tgl Pelaksanaan</span>
              <div className="font-mono text-slate-700 text-xs mt-0.5 flex items-center gap-1">
                <Calendar size={12} className="text-slate-400" />
                <span>{formatDate(item.service_date)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Section: Pelaksana & Dokumen Transaksi ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {/* Panel Pelaksana */}
          <div className="p-4 bg-white border border-slate-200 rounded-2xl flex flex-col gap-2.5 shadow-2xs">
            <div className="font-bold text-slate-800 uppercase tracking-wide text-[11px] flex items-center gap-2">
              <User size={14} className="text-emerald-500" />
              <span>Teknisi / Pelaksana Servis</span>
            </div>

            <div className="flex flex-col gap-1.5 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-slate-400 text-[11px] min-w-[70px]">Teknisi:</span>
                <span className="font-semibold text-slate-800">
                  {item.technician_name || "Teknisi Operasional"}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-slate-400 text-[11px] min-w-[70px]">Vendor/Pihak:</span>
                <span className="font-medium text-slate-700 flex items-center gap-1">
                  <Building2 size={12} className="text-slate-400" />
                  <span>{item.vendor_name || po?.vendor?.vendor_name || "Internal MSDC"}</span>
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-slate-400 text-[11px] min-w-[70px]">Target SLA:</span>
                <span className="font-medium text-slate-700 font-mono">
                  {item.sla_target || "≤ 24 Jam"}
                </span>
              </div>
            </div>
          </div>

          {/* Panel Dokumen & Referensi */}
          <div className="p-4 bg-white border border-slate-200 rounded-2xl flex flex-col gap-2.5 shadow-2xs">
            <div className="font-bold text-slate-800 uppercase tracking-wide text-[11px] flex items-center gap-2">
              <FileText size={14} className="text-purple-500" />
              <span>Referensi & Berita Acara</span>
            </div>

            <div className="flex flex-col gap-1.5 text-xs">
              {po ? (
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 text-[11px]">No. Purchase Order:</span>
                  <Link
                    to="/procurement-inventory/purchase-orders"
                    className="font-mono font-semibold text-blue-600 hover:underline flex items-center gap-1"
                  >
                    <span>{po.po_number}</span>
                    <ExternalLink size={10} />
                  </Link>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 text-[11px]">No. Ref Servis:</span>
                  <span className="font-mono font-semibold text-slate-700">
                    {item.service_number || `SRV-${item.id}`}
                  </span>
                </div>
              )}

              {po?.purchase_request && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 text-[11px]">No. Purchase Request:</span>
                  <span className="font-mono text-slate-600">
                    {po.purchase_request.pr_number}
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-[11px]">No. BA / BAST:</span>
                <span className="font-mono font-semibold text-slate-800">
                  {item.ba_number || (grn?.grn_number ? `BAST-${grn.grn_number}` : "—")}
                </span>
              </div>

              {item.ba_file_name && (
                <div className="mt-1 pt-1 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-slate-500 truncate flex items-center gap-1">
                    <FileText size={12} className="text-amber-500 shrink-0" />
                    <span className="truncate">{item.ba_file_name}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => alert(`Mengunduh dokumen: ${item.ba_file_name}`)}
                    className="text-blue-600 hover:text-blue-800 text-[11px] font-medium flex items-center gap-0.5 shrink-0"
                  >
                    <Download size={11} />
                    <span>Unduh</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Section: Catatan Tindakan / Temuan Pengerjaan ── */}
        {item.service_notes && (
          <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">
              Catatan Tindakan & Temuan Lapangan
            </span>
            <p className="text-xs text-slate-700 mt-1 leading-relaxed">
              {item.service_notes}
            </p>
          </div>
        )}

        {/* Footer Action */}
        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-all active:scale-95"
          >
            Tutup
          </button>
        </div>
      </div>
    </ProcurementFormModal>
  );
}
