import React from "react";
import { Link } from "react-router-dom";
import { FileText, Building2, FileCheck, HardDrive, MapPin, Calendar } from "lucide-react";
import type { Ticket } from "../../types/ticket";
import { formatSlaDue } from "./TicketTable";

export interface TicketInfoCardProps {
  ticket: Ticket;
}

export const TicketInfoCard: React.FC<TicketInfoCardProps> = ({ ticket }) => {
  const createdDate = formatSlaDue(ticket.created_at);
  const updatedDate = formatSlaDue(ticket.updated_at);

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm flex flex-col gap-5">
      {/* ── Header ── */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200/80">
            <FileText size={16} />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900">Rincian Insiden &amp; Permohonan</h2>
            <p className="text-[11px] text-slate-500">Informasi komprehensif terkait tiket operasional</p>
          </div>
        </div>
      </div>

      {/* ── Deskripsi Masalah ── */}
      <div>
        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
          Deskripsi Masalah / Tugas
        </span>
        <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200/80 text-xs text-slate-800 leading-relaxed font-normal whitespace-pre-wrap">
          {ticket.description || "Tidak ada deskripsi rinci yang disertakan pada tiket ini."}
        </div>
      </div>

      {/* ── Relasi Sistem & Infrastruktur ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
        {/* Pelanggan CRM */}
        <div className="p-3.5 rounded-xl border border-slate-100 bg-white shadow-2xs">
          <div className="flex items-center gap-1.5 text-slate-400 mb-1">
            <Building2 size={13} className="text-amber-600" />
            <span className="text-[11px] font-medium text-slate-500">Pelanggan CRM:</span>
          </div>
          <span className="text-xs font-bold text-slate-800 block truncate">
            {ticket.customer_id ? `Customer ID #${ticket.customer_id}` : "Pelanggan Internal / Umum"}
          </span>
        </div>

        {/* Kontrak Layanan */}
        <div className="p-3.5 rounded-xl border border-slate-100 bg-white shadow-2xs">
          <div className="flex items-center gap-1.5 text-slate-400 mb-1">
            <FileCheck size={13} className="text-amber-600" />
            <span className="text-[11px] font-medium text-slate-500">Kontrak Layanan:</span>
          </div>
          {ticket.contract_id ? (
            <Link
              to={`/crm-sales/contracts/${ticket.contract_id}`}
              className="text-xs font-bold text-amber-700 hover:text-amber-900 hover:underline block truncate font-mono"
            >
              {ticket.contract?.contract_number ?? `Contract #${ticket.contract_id}`}
            </Link>
          ) : (
            <span className="text-xs font-medium text-slate-400 block">—</span>
          )}
        </div>

        {/* Perangkat Terkait */}
        <div className="p-3.5 rounded-xl border border-slate-100 bg-white shadow-2xs">
          <div className="flex items-center gap-1.5 text-slate-400 mb-1">
            <HardDrive size={13} className="text-amber-600" />
            <span className="text-[11px] font-medium text-slate-500">Perangkat Server / Rack:</span>
          </div>
          {ticket.device_id ? (
            <Link
              to={`/dc/devices/${ticket.device_id}`}
              className="text-xs font-bold text-amber-700 hover:text-amber-900 hover:underline block truncate"
            >
              Lihat Perangkat #{ticket.device_id}
            </Link>
          ) : (
            <span className="text-xs font-medium text-slate-400 block">Tidak ditautkan ke perangkat spesifik</span>
          )}
        </div>

        {/* Lokasi Site */}
        <div className="p-3.5 rounded-xl border border-slate-100 bg-white shadow-2xs">
          <div className="flex items-center gap-1.5 text-slate-400 mb-1">
            <MapPin size={13} className="text-amber-600" />
            <span className="text-[11px] font-medium text-slate-500">Site Data Center:</span>
          </div>
          {ticket.site_id ? (
            <Link
              to={`/dc/sites/${ticket.site_id}`}
              className="text-xs font-bold text-amber-700 hover:text-amber-900 hover:underline block truncate"
            >
              Site ID #{ticket.site_id}
            </Link>
          ) : (
            <span className="text-xs font-medium text-slate-400 block">Semua Site</span>
          )}
        </div>
      </div>

      {/* ── Metadata Timestamp ── */}
      <div className="flex items-center justify-between text-[11px] text-slate-500 pt-3 border-t border-slate-100 flex-wrap gap-2">
        <div className="flex items-center gap-1.5">
          <Calendar size={13} className="text-slate-400" />
          <span>Dibuat: <strong className="text-slate-700 font-medium">{createdDate.formatted}</strong></span>
        </div>
        <div className="flex items-center gap-1.5">
          <span>Terakhir Diperbarui: <strong className="text-slate-700 font-medium">{updatedDate.formatted}</strong></span>
        </div>
      </div>
    </div>
  );
};

export default TicketInfoCard;
