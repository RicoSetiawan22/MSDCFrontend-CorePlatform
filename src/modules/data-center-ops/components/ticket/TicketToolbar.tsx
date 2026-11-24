import React from "react";
import { Search, Plus } from "lucide-react";

export interface TicketToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  priorityFilter: string;
  onPriorityFilterChange: (value: string) => void;
  typeFilter: string;
  onTypeFilterChange: (value: string) => void;
  onNewTicket: () => void;
  totalTickets?: number;
}

export const TicketToolbar: React.FC<TicketToolbarProps> = ({
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  priorityFilter,
  onPriorityFilterChange,
  typeFilter,
  onTypeFilterChange,
  onNewTicket,
  totalTickets,
}) => {
  return (
    <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 flex-wrap">
      {/* ── Left Controls: Search & Filters ── */}
      <div className="flex items-center gap-2.5 flex-1 flex-wrap">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[200px]">
          <Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
          />
          <input
            type="text"
            className="w-full pl-10 pr-3.5 py-2 text-xs sm:text-sm bg-white border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
            placeholder="Cari nomor tiket, subjek..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            aria-label="Cari tiket"
          />
        </div>

        {/* Filter Status */}
        <select
          className="px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all cursor-pointer min-w-[130px]"
          value={statusFilter}
          onChange={(e) => onStatusFilterChange(e.target.value)}
          aria-label="Filter berdasarkan status"
        >
          <option value="">Semua Status</option>
          <option value="trouble">Trouble</option>
          <option value="maintenance">Maintenance</option>
          <option value="pending_customer">Pending Customer</option>
          <option value="normal">Normal</option>
          <option value="closed">Closed</option>
        </select>

        {/* Filter Prioritas */}
        <select
          className="px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all cursor-pointer min-w-[130px]"
          value={priorityFilter}
          onChange={(e) => onPriorityFilterChange(e.target.value)}
          aria-label="Filter berdasarkan prioritas"
        >
          <option value="">Semua Prioritas</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>

        {/* Filter Tipe */}
        <select
          className="px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all cursor-pointer min-w-[130px]"
          value={typeFilter}
          onChange={(e) => onTypeFilterChange(e.target.value)}
          aria-label="Filter berdasarkan tipe tiket"
        >
          <option value="">Semua Tipe</option>
          <option value="incident">Incident</option>
          <option value="remote_hands">Remote Hands</option>
          <option value="maintenance">Maintenance</option>
          <option value="request">Request</option>
          <option value="other">Other</option>
        </select>
      </div>

      {/* ── Right Controls: Counter & Add Button ── */}
      <div className="flex items-center justify-between md:justify-end gap-3 shrink-0">
        {totalTickets !== undefined && (
          <span className="text-xs text-slate-500 font-medium whitespace-nowrap">
            Total: <strong className="text-slate-800">{totalTickets}</strong> tiket
          </span>
        )}

        <button
          type="button"
          onClick={onNewTicket}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#E59B00] hover:bg-[#d48e00] active:bg-[#c28100] text-white text-xs font-bold shadow-xs hover:shadow transition-all cursor-pointer shrink-0"
        >
          <Plus size={15} strokeWidth={2.5} />
          <span>Tiket Baru</span>
        </button>
      </div>
    </div>
  );
};

export default TicketToolbar;
