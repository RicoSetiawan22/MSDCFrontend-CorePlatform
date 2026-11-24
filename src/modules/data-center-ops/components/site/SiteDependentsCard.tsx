import React, { useState, useMemo } from "react";
import {
  Search,
  ChevronDown,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import type {
  SiteDependents,
  SiteContractRef,
  SiteSalesOrderRef,
  SiteDependentDevice,
  SiteDependentRackAllocation,
} from "../../types/site";
import { DependentsTablePagination } from "./DependentsTablePagination";
import { SiteMiniKPICards } from "./SiteMiniKPICards";

interface SiteDependentsCardProps {
  dependents?: SiteDependents;
  showKPICards?: boolean;
}

// ── Status Mapping & Styles ──────────────────────────────────────────
const CONTRACT_STATUS_MAP: Record<
  string,
  { label: string; bg: string; text: string; border: string; dot: string }
> = {
  active: {
    label: "Aktif",
    bg: "bg-emerald-50",
    text: "text-emerald-600",
    border: "border-emerald-200/80",
    dot: "bg-emerald-500",
  },
  draft: {
    label: "Draft",
    bg: "bg-amber-50",
    text: "text-amber-600",
    border: "border-amber-200/80",
    dot: "bg-amber-500",
  },
  sent_to_client: {
    label: "Terkirim",
    bg: "bg-blue-50",
    text: "text-blue-600",
    border: "border-blue-200/80",
    dot: "bg-blue-500",
  },
  terminated: {
    label: "Berakhir",
    bg: "bg-slate-100",
    text: "text-slate-600",
    border: "border-slate-200/80",
    dot: "bg-slate-400",
  },
  expired: {
    label: "Kedaluwarsa",
    bg: "bg-rose-50",
    text: "text-rose-600",
    border: "border-rose-200/80",
    dot: "bg-rose-500",
  },
};

const SO_STATUS_MAP: Record<
  string,
  { label: string; bg: string; text: string; border: string; dot: string }
> = {
  active: {
    label: "Aktif",
    bg: "bg-emerald-50",
    text: "text-emerald-600",
    border: "border-emerald-200/80",
    dot: "bg-emerald-500",
  },
  draft: {
    label: "Draft",
    bg: "bg-amber-50",
    text: "text-amber-600",
    border: "border-amber-200/80",
    dot: "bg-amber-500",
  },
  completed: {
    label: "Selesai",
    bg: "bg-blue-50",
    text: "text-blue-600",
    border: "border-blue-200/80",
    dot: "bg-blue-500",
  },
  cancelled: {
    label: "Dibatalkan",
    bg: "bg-rose-50",
    text: "text-rose-600",
    border: "border-rose-200/80",
    dot: "bg-rose-500",
  },
};

// ── 1. SUB-TABEL: KONTRAK CUSTOMER ───────────────────────────────────
interface ContractsSubTableProps {
  contracts?: SiteContractRef[];
}

const ContractsSubTable: React.FC<ContractsSubTableProps> = ({ contracts = [] }) => {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  const filteredContracts = useMemo(() => {
    return contracts.filter((c) => {
      const matchSearch =
        search.trim() === "" ||
        c.contract_number.toLowerCase().includes(search.toLowerCase()) ||
        (c.customer?.company_name &&
          c.customer.company_name.toLowerCase().includes(search.toLowerCase()));

      const matchStatus = statusFilter === "all" || c.status === statusFilter;

      return matchSearch && matchStatus;
    });
  }, [contracts, search, statusFilter]);

  const totalPages = Math.ceil(filteredContracts.length / perPage) || 1;
  const paginatedContracts = useMemo(() => {
    const start = (page - 1) * perPage;
    return filteredContracts.slice(start, start + perPage);
  }, [filteredContracts, page, perPage]);

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col p-6 gap-4">
      {/* ── Header: Judul + Badge + Search + Filter ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1">
        <div className="flex items-center gap-3">
          <h3 className="text-xl font-bold text-slate-900 tracking-tight">
            Kontrak Customer
          </h3>
          <span className="bg-amber-50 text-amber-600 border border-amber-200/80 px-3 py-0.5 rounded-full text-xs font-semibold">
            {filteredContracts.length} Kontrak
          </span>
        </div>

        <div className="flex items-center flex-wrap gap-2.5">
          {/* Input Search */}
          <div className="relative flex items-center">
            <input
              type="text"
              placeholder="Cari Kontrak berdasarkan kode..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-56 sm:w-64 pl-3.5 pr-9 py-2 text-xs border border-slate-200 rounded-xl bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all shadow-2xs"
            />
            <Search
              size={15}
              className="absolute right-3 text-slate-400 pointer-events-none"
            />
          </div>

          {/* Dropdown Filter Status Bergaya Tombol Emas */}
          <div className="relative inline-flex items-center">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="appearance-none bg-[#E59B00] hover:bg-[#D48F00] text-white font-semibold text-xs pl-3.5 pr-8 py-2 rounded-xl cursor-pointer shadow-xs transition-colors focus:outline-none"
            >
              <option value="all" className="bg-white text-slate-800">
                Semua Status
              </option>
              <option value="active" className="bg-white text-slate-800">
                Aktif
              </option>
              <option value="draft" className="bg-white text-slate-800">
                Draft
              </option>
              <option value="sent_to_client" className="bg-white text-slate-800">
                Terkirim
              </option>
              <option value="terminated" className="bg-white text-slate-800">
                Berakhir
              </option>
              <option value="expired" className="bg-white text-slate-800">
                Kedaluwarsa
              </option>
            </select>
            <ChevronDown
              size={14}
              className="absolute right-2.5 text-white pointer-events-none"
            />
          </div>
        </div>
      </div>

      {/* ── Table Container ── */}
      <div className="border border-slate-100 rounded-xl overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            {/* Header Strip Kuning Emas Pastel Sesuai Desain */}
            <thead className="bg-[#FDE8B3]/60 text-slate-800 font-bold border-b border-amber-200/40">
              <tr>
                <th className="py-3 px-6 text-xs font-bold tracking-wider">
                  NO. KONTRAK
                </th>
                <th className="py-3 px-6 text-xs font-bold tracking-wider">
                  CUSTOMER
                </th>
                <th className="py-3 px-6 text-xs font-bold tracking-wider text-center">
                  STATUS
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedContracts.length === 0 ? (
                <tr>
                  <td colSpan={3} className="py-8 text-center text-slate-400">
                    Tidak ada data kontrak yang sesuai.
                  </td>
                </tr>
              ) : (
                paginatedContracts.map((c) => {
                  const statusInfo = CONTRACT_STATUS_MAP[c.status] ?? {
                    label: c.status,
                    bg: "bg-slate-100",
                    text: "text-slate-700",
                    border: "border-slate-200",
                    dot: "bg-slate-400",
                  };
                  return (
                    <tr
                      key={c.id}
                      className="hover:bg-amber-50/20 transition-colors"
                    >
                      <td className="py-3.5 px-6 font-mono font-bold text-slate-900">
                        {c.contract_number}
                      </td>
                      <td className="py-3.5 px-6 font-bold text-slate-900">
                        {c.customer?.company_name ?? "—"}
                      </td>
                      <td className="py-3.5 px-6 text-center">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${statusInfo.bg} ${statusInfo.text} ${statusInfo.border}`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${statusInfo.dot}`}
                          />
                          <span>{statusInfo.label}</span>
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Pagination di Bagian Paling Bawah ── */}
      <DependentsTablePagination
        currentPage={page}
        totalPages={totalPages}
        perPage={perPage}
        onPageChange={setPage}
        onPerPageChange={setPerPage}
      />
    </div>
  );
};

// ── 2. SUB-TABEL: SALES ORDER ────────────────────────────────────────
interface SalesOrdersSubTableProps {
  salesOrders?: SiteSalesOrderRef[];
}

const SalesOrdersSubTable: React.FC<SalesOrdersSubTableProps> = ({
  salesOrders = [],
}) => {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  const filteredSos = useMemo(() => {
    return salesOrders.filter((so) => {
      const matchSearch =
        search.trim() === "" ||
        so.so_number.toLowerCase().includes(search.toLowerCase()) ||
        (so.customer?.company_name &&
          so.customer.company_name.toLowerCase().includes(search.toLowerCase()));

      const matchStatus = statusFilter === "all" || so.status === statusFilter;

      return matchSearch && matchStatus;
    });
  }, [salesOrders, search, statusFilter]);

  const totalPages = Math.ceil(filteredSos.length / perPage) || 1;
  const paginatedSos = useMemo(() => {
    const start = (page - 1) * perPage;
    return filteredSos.slice(start, start + perPage);
  }, [filteredSos, page, perPage]);

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col p-6 gap-4">
      {/* ── Header: Judul + Badge + Search + Filter ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1">
        <div className="flex items-center gap-3">
          <h3 className="text-xl font-bold text-slate-900 tracking-tight">
            Sales Order
          </h3>
          <span className="bg-amber-50 text-amber-600 border border-amber-200/80 px-3 py-0.5 rounded-full text-xs font-semibold">
            {filteredSos.length} Sales Order
          </span>
        </div>

        <div className="flex items-center flex-wrap gap-2.5">
          {/* Input Search */}
          <div className="relative flex items-center">
            <input
              type="text"
              placeholder="Cari SO berdasarkan kode..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-56 sm:w-64 pl-3.5 pr-9 py-2 text-xs border border-slate-200 rounded-xl bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all shadow-2xs"
            />
            <Search
              size={15}
              className="absolute right-3 text-slate-400 pointer-events-none"
            />
          </div>

          {/* Dropdown Filter Status */}
          <div className="relative inline-flex items-center">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="appearance-none bg-[#E59B00] hover:bg-[#D48F00] text-white font-semibold text-xs pl-3.5 pr-8 py-2 rounded-xl cursor-pointer shadow-xs transition-colors focus:outline-none"
            >
              <option value="all" className="bg-white text-slate-800">
                Semua Status
              </option>
              <option value="active" className="bg-white text-slate-800">
                Aktif
              </option>
              <option value="draft" className="bg-white text-slate-800">
                Draft
              </option>
              <option value="completed" className="bg-white text-slate-800">
                Selesai
              </option>
              <option value="cancelled" className="bg-white text-slate-800">
                Dibatalkan
              </option>
            </select>
            <ChevronDown
              size={14}
              className="absolute right-2.5 text-white pointer-events-none"
            />
          </div>
        </div>
      </div>

      {/* ── Table Container ── */}
      <div className="border border-slate-100 rounded-xl overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FDE8B3]/60 text-slate-800 font-bold border-b border-amber-200/40">
              <tr>
                <th className="py-3 px-6 text-xs font-bold tracking-wider">
                  NO. SALES ORDER
                </th>
                <th className="py-3 px-6 text-xs font-bold tracking-wider">
                  CUSTOMER
                </th>
                <th className="py-3 px-6 text-xs font-bold tracking-wider text-center">
                  STATUS
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedSos.length === 0 ? (
                <tr>
                  <td colSpan={3} className="py-8 text-center text-slate-400">
                    Tidak ada data sales order yang sesuai.
                  </td>
                </tr>
              ) : (
                paginatedSos.map((so) => {
                  const statusInfo = SO_STATUS_MAP[so.status] ?? {
                    label: so.status,
                    bg: "bg-slate-100",
                    text: "text-slate-700",
                    border: "border-slate-200",
                    dot: "bg-slate-400",
                  };
                  return (
                    <tr
                      key={so.id}
                      className="hover:bg-amber-50/20 transition-colors"
                    >
                      <td className="py-3.5 px-6 font-mono font-bold text-slate-900">
                        {so.so_number}
                      </td>
                      <td className="py-3.5 px-6 font-bold text-slate-900">
                        {so.customer?.company_name ?? "—"}
                      </td>
                      <td className="py-3.5 px-6 text-center">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${statusInfo.bg} ${statusInfo.text} ${statusInfo.border}`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${statusInfo.dot}`}
                          />
                          <span>{statusInfo.label}</span>
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Pagination di Bagian Paling Bawah ── */}
      <DependentsTablePagination
        currentPage={page}
        totalPages={totalPages}
        perPage={perPage}
        onPageChange={setPage}
        onPerPageChange={setPerPage}
      />
    </div>
  );
};

// ── 3. SUB-TABEL: DEVICE TERHUBUNG CUSTOMER ──────────────────────────
interface DevicesSubTableProps {
  devices?: SiteDependentDevice[];
}

const DevicesSubTable: React.FC<DevicesSubTableProps> = ({ devices = [] }) => {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  const filteredDevices = useMemo(() => {
    return devices.filter((d) => {
      if (search.trim() === "") return true;
      const s = search.toLowerCase();
      return (
        d.device_code.toLowerCase().includes(s) ||
        d.device_name.toLowerCase().includes(s) ||
        (d.customer?.company_name &&
          d.customer.company_name.toLowerCase().includes(s)) ||
        (d.contract?.contract_number &&
          d.contract.contract_number.toLowerCase().includes(s))
      );
    });
  }, [devices, search]);

  const totalPages = Math.ceil(filteredDevices.length / perPage) || 1;
  const paginatedDevices = useMemo(() => {
    const start = (page - 1) * perPage;
    return filteredDevices.slice(start, start + perPage);
  }, [filteredDevices, page, perPage]);

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col p-6 gap-4">
      {/* ── Header: Judul + Badge + Search ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1">
        <div className="flex items-center gap-3">
          <h3 className="text-xl font-bold text-slate-900 tracking-tight">
            Device Terhubung Customer
          </h3>
          <span className="bg-amber-50 text-amber-600 border border-amber-200/80 px-3 py-0.5 rounded-full text-xs font-semibold">
            {filteredDevices.length} Device
          </span>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="relative flex items-center">
            <input
              type="text"
              placeholder="Cari Device berdasarkan kode / nama..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-64 sm:w-72 pl-3.5 pr-9 py-2 text-xs border border-slate-200 rounded-xl bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all shadow-2xs"
            />
            <Search
              size={15}
              className="absolute right-3 text-slate-400 pointer-events-none"
            />
          </div>
        </div>
      </div>

      {/* ── Table Container ── */}
      <div className="border border-slate-100 rounded-xl overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FDE8B3]/60 text-slate-800 font-bold border-b border-amber-200/40">
              <tr>
                <th className="py-3 px-6 text-xs font-bold tracking-wider">
                  KODE PERANGKAT
                </th>
                <th className="py-3 px-6 text-xs font-bold tracking-wider">
                  NAMA PERANGKAT
                </th>
                <th className="py-3 px-6 text-xs font-bold tracking-wider">
                  CUSTOMER
                </th>
                <th className="py-3 px-6 text-xs font-bold tracking-wider">
                  NO. KONTRAK
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedDevices.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-slate-400">
                    Tidak ada perangkat customer yang terhubung.
                  </td>
                </tr>
              ) : (
                paginatedDevices.map((d) => (
                  <tr
                    key={d.id}
                    className="hover:bg-amber-50/20 transition-colors"
                  >
                    <td className="py-3.5 px-6 font-mono font-bold text-slate-900">
                      {d.device_code}
                    </td>
                    <td className="py-3.5 px-6 font-semibold text-slate-800">
                      {d.device_name}
                    </td>
                    <td className="py-3.5 px-6 font-bold text-slate-900">
                      {d.customer?.company_name ?? "—"}
                    </td>
                    <td className="py-3.5 px-6 font-mono text-slate-600">
                      {d.contract?.contract_number ?? "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Pagination di Bagian Paling Bawah ── */}
      <DependentsTablePagination
        currentPage={page}
        totalPages={totalPages}
        perPage={perPage}
        onPageChange={setPage}
        onPerPageChange={setPerPage}
      />
    </div>
  );
};

// ── 4. SUB-TABEL: RACK DENGAN ALOKASI AKTIF ──────────────────────────
interface RacksSubTableProps {
  racks?: SiteDependentRackAllocation[];
}

const RacksSubTable: React.FC<RacksSubTableProps> = ({ racks = [] }) => {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  const filteredRacks = useMemo(() => {
    return racks.filter((r) => {
      if (search.trim() === "") return true;
      const s = search.toLowerCase();
      return (
        (r.rack?.rack_code && r.rack.rack_code.toLowerCase().includes(s)) ||
        (r.customer?.company_name &&
          r.customer.company_name.toLowerCase().includes(s)) ||
        (r.contract?.contract_number &&
          r.contract.contract_number.toLowerCase().includes(s))
      );
    });
  }, [racks, search]);

  const totalPages = Math.ceil(filteredRacks.length / perPage) || 1;
  const paginatedRacks = useMemo(() => {
    const start = (page - 1) * perPage;
    return filteredRacks.slice(start, start + perPage);
  }, [filteredRacks, page, perPage]);

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col p-6 gap-4">
      {/* ── Header: Judul + Badge + Search ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1">
        <div className="flex items-center gap-3">
          <h3 className="text-xl font-bold text-slate-900 tracking-tight">
            Rack dengan Alokasi Aktif
          </h3>
          <span className="bg-amber-50 text-amber-600 border border-amber-200/80 px-3 py-0.5 rounded-full text-xs font-semibold">
            {filteredRacks.length} Rack
          </span>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="relative flex items-center">
            <input
              type="text"
              placeholder="Cari Rack berdasarkan kode..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-64 sm:w-72 pl-3.5 pr-9 py-2 text-xs border border-slate-200 rounded-xl bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all shadow-2xs"
            />
            <Search
              size={15}
              className="absolute right-3 text-slate-400 pointer-events-none"
            />
          </div>
        </div>
      </div>

      {/* ── Table Container ── */}
      <div className="border border-slate-100 rounded-xl overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FDE8B3]/60 text-slate-800 font-bold border-b border-amber-200/40">
              <tr>
                <th className="py-3 px-6 text-xs font-bold tracking-wider">
                  KODE RACK
                </th>
                <th className="py-3 px-6 text-xs font-bold tracking-wider">
                  CUSTOMER
                </th>
                <th className="py-3 px-6 text-xs font-bold tracking-wider">
                  NO. KONTRAK
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedRacks.length === 0 ? (
                <tr>
                  <td colSpan={3} className="py-8 text-center text-slate-400">
                    Tidak ada rak dengan alokasi aktif.
                  </td>
                </tr>
              ) : (
                paginatedRacks.map((r) => (
                  <tr
                    key={r.id}
                    className="hover:bg-amber-50/20 transition-colors"
                  >
                    <td className="py-3.5 px-6 font-mono font-bold text-slate-900">
                      {r.rack?.rack_code ?? "—"}
                    </td>
                    <td className="py-3.5 px-6 font-bold text-slate-900">
                      {r.customer?.company_name ?? "—"}
                    </td>
                    <td className="py-3.5 px-6 font-mono text-slate-600">
                      {r.contract?.contract_number ?? "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Pagination di Bagian Paling Bawah ── */}
      <DependentsTablePagination
        currentPage={page}
        totalPages={totalPages}
        perPage={perPage}
        onPageChange={setPage}
        onPerPageChange={setPerPage}
      />
    </div>
  );
};

// ── 5. MAIN COMPONENT ────────────────────────────────────────────────
export const SiteDependentsCard: React.FC<SiteDependentsCardProps> = ({
  dependents,
  showKPICards = false,
}) => {
  const [selectedTable, setSelectedTable] = useState<string>("all");

  if (!dependents) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/80 p-8 text-center text-slate-500 text-sm">
        Data dependensi relasi tidak tersedia.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* ── 1. 6 Mini KPI Metric Cards Sesuai Desain Modern (Opsional) ── */}
      {showKPICards && <SiteMiniKPICards dependents={dependents} />}

      {/* ── 2. Banner Status Keamanan Hapus Site ── */}
      {dependents.can_delete ? (
        <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-4 flex items-start gap-3 text-xs text-emerald-800">
          <CheckCircle2
            size={18}
            className="text-emerald-600 shrink-0 mt-0.5"
          />
          <div>
            <span className="font-bold">Aman untuk Dihapus:</span> Site ini
            tidak memiliki kontrak pelanggan, sales order, atau alokasi aktif.
            Penghapusan site akan menghapus cascade infrastruktur room dan rak
            kosong.
          </div>
        </div>
      ) : (
        <div className="bg-rose-50/80 border border-rose-200 rounded-xl p-4 flex items-start gap-3 text-xs text-rose-800">
          <AlertTriangle size={18} className="text-rose-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">
              Tidak Dapat Dihapus (Terikat Customer):
            </span>{" "}
            Site ini masih memiliki relasi kontrak, sales order, atau
            rak/perangkat customer aktif di bawah ini. Anda harus memindahkan
            atau memutuskan relasi customer sebelum site dapat dihapus.
          </div>
        </div>
      )}

      {/* ── 3. Pengontrol Tampilan Tabel (Pilih Tabel Dropdown) ── */}
      <div className="flex items-center justify-between flex-wrap gap-3 bg-white rounded-xl border border-slate-200/80 px-5 py-3 shadow-2xs">
        <div className="text-xs font-bold text-slate-700">
          Daftar Relasi Data Customer:
        </div>

        <div className="relative inline-flex items-center">
          <select
            value={selectedTable}
            onChange={(e) => setSelectedTable(e.target.value)}
            className="appearance-none bg-[#E59B00] hover:bg-[#D48F00] text-white font-semibold text-xs pl-4 pr-9 py-2 rounded-xl cursor-pointer shadow-xs transition-colors focus:outline-none"
          >
            <option value="all" className="bg-white text-slate-800">
              Pilih Tabel: Tampilkan Semua (4 Tabel)
            </option>
            <option value="contracts" className="bg-white text-slate-800">
              Hanya Kontrak Customer ({dependents.contracts?.length ?? 0})
            </option>
            <option value="sales_orders" className="bg-white text-slate-800">
              Hanya Sales Order ({dependents.sales_orders?.length ?? 0})
            </option>
            <option value="devices" className="bg-white text-slate-800">
              Hanya Device Customer (
              {dependents.devices_with_customer?.length ?? 0})
            </option>
            <option value="racks" className="bg-white text-slate-800">
              Hanya Rack Alokasi Aktif (
              {dependents.racks_with_active_allocation?.length ?? 0})
            </option>
          </select>
          <ChevronDown
            size={14}
            className="absolute right-3 text-white pointer-events-none"
          />
        </div>
      </div>

      {/* ── 4. Tabel-Tabel Dependensi Terisolasi ── */}
      {(selectedTable === "all" || selectedTable === "contracts") && (
        <ContractsSubTable contracts={dependents.contracts} />
      )}

      {(selectedTable === "all" || selectedTable === "sales_orders") && (
        <SalesOrdersSubTable salesOrders={dependents.sales_orders} />
      )}

      {(selectedTable === "all" || selectedTable === "devices") && (
        <DevicesSubTable devices={dependents.devices_with_customer} />
      )}

      {(selectedTable === "all" || selectedTable === "racks") && (
        <RacksSubTable racks={dependents.racks_with_active_allocation} />
      )}
    </div>
  );
};

export default SiteDependentsCard;
