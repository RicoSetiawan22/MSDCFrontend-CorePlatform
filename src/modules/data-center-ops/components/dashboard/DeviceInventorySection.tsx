import React, { useState, useMemo, useEffect } from "react";
import {
  Monitor,
  ChevronDown,
  ChevronUp,
  Check,
} from "lucide-react";
import type { DashboardDetailsData } from "../../types/dashboard";
import { DataTablePagination } from "../common/DataTablePagination";

export interface DeviceInventorySectionProps {
  details?: DashboardDetailsData | null;
}

// ── Utilitas Inisial Nama Perusahaan ──
function getCustomerInitial(name: string): string {
  if (!name) return "?";
  const cleaned = name.replace(/^(PT|CV|UD)\.?\s+/i, "").trim();
  return (cleaned[0] || name[0]).toUpperCase();
}

// ── Utilitas Palet Pastel Avatar ──
function getCustomerPastelAvatar(name: string) {
  const lower = name.toLowerCase();
  if (lower.includes("coba")) {
    return { bg: "#FEF3C7", text: "#D97706" }; // Amber pastel
  }
  if (lower.includes("colocation") || lower.includes("contoh")) {
    return { bg: "#E0F2FE", text: "#0284C7" }; // Sky Blue pastel
  }
  // Palet fallback pastel bergantian berdasarkan panjang string
  const fallbacks = [
    { bg: "#E0F2FE", text: "#0284C7" },
    { bg: "#EDE9FE", text: "#6D28D9" },
    { bg: "#DCFCE7", text: "#15803D" },
    { bg: "#FCE7F3", text: "#BE185D" },
  ];
  return fallbacks[name.length % fallbacks.length];
}

export type DeviceInventoryTab = "own" | "customer" | "unmounted";

export const DeviceInventorySection: React.FC<DeviceInventorySectionProps> = ({
  details,
}) => {
  // ── 1. State Management ──
  const [isOpen, setIsOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<DeviceInventoryTab>("own");

  // ── State Paginasi per Tab ──
  const [ownPage, setOwnPage] = useState<number>(1);
  const [ownPerPage, setOwnPerPage] = useState<number>(5);

  const [custPage, setCustPage] = useState<number>(1);
  const [custPerPage, setCustPerPage] = useState<number>(5);

  const [unmountedPage, setUnmountedPage] = useState<number>(1);
  const [unmountedPerPage, setUnmountedPerPage] = useState<number>(5);

  // ── 2. Data Komputasi Metrik (useMemo) ──
  const {
    totalDevices,
    totalCustomers,
    ownCount,
    customerDevicesCount,
    unmountedCount,
    isAllMounted,
    byCustomerList,
    ownDevicesList,
    unmountedList,
  } = useMemo(() => {
    const devDetails = details?.device_details;
    const customers = devDetails?.by_customer ?? [];
    const unmounted = devDetails?.unmounted ?? [];
    const ownList = devDetails?.own_devices ?? [];
    const own = devDetails?.own_count ?? ownList.length;

    // Total device milik seluruh customer
    const custDevTotal = customers.reduce((acc, c) => acc + (c.device_count || 0), 0);

    // Total keseluruhan: customer + own + unmounted
    const total = custDevTotal + own + unmounted.length;

    return {
      totalDevices: total,
      totalCustomers: customers.length,
      ownCount: own,
      customerDevicesCount: custDevTotal,
      unmountedCount: unmounted.length,
      isAllMounted: unmounted.length === 0,
      byCustomerList: customers,
      ownDevicesList: ownList,
      unmountedList: unmounted,
    };
  }, [details?.device_details]);

  // ── 3. Perhitungan Total Halaman & Proteksi Paginasi ──
  const ownTotalPages = Math.ceil(ownDevicesList.length / ownPerPage) || 1;
  const custTotalPages = Math.ceil(byCustomerList.length / custPerPage) || 1;
  const unmountedTotalPages = Math.ceil(unmountedList.length / unmountedPerPage) || 1;

  useEffect(() => {
    if (ownPage > ownTotalPages) setOwnPage(ownTotalPages);
  }, [ownPage, ownTotalPages]);

  useEffect(() => {
    if (custPage > custTotalPages) setCustPage(custTotalPages);
  }, [custPage, custTotalPages]);

  useEffect(() => {
    if (unmountedPage > unmountedTotalPages) setUnmountedPage(unmountedTotalPages);
  }, [unmountedPage, unmountedTotalPages]);

  // ── 4. Slice Data Paginasi ──
  const paginatedOwnDevices = useMemo(() => {
    const start = (ownPage - 1) * ownPerPage;
    return ownDevicesList.slice(start, start + ownPerPage);
  }, [ownDevicesList, ownPage, ownPerPage]);

  const paginatedCustomerList = useMemo(() => {
    const start = (custPage - 1) * custPerPage;
    return byCustomerList.slice(start, start + custPerPage);
  }, [byCustomerList, custPage, custPerPage]);

  const paginatedUnmountedList = useMemo(() => {
    const start = (unmountedPage - 1) * unmountedPerPage;
    return unmountedList.slice(start, start + unmountedPerPage);
  }, [unmountedList, unmountedPage, unmountedPerPage]);

  return (
    <div className="w-full bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden transition-all min-w-0">
      {/* ── 1. Top Card Header ── */}
      <div className="px-5 py-4 flex items-center justify-between border-b border-slate-100 bg-white select-none">
        <div className="flex items-center gap-3 flex-wrap">
          {/* Ikon Monitor + Judul */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
              <Monitor size={18} />
            </div>
            <h3 className="m-0 text-sm md:text-base font-extrabold text-slate-900 tracking-tight">
              Device Inventory Milik Sendiri vs Customer
            </h3>
          </div>

          {/* Badge Peringkasan Metrik */}
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 border border-amber-200 text-amber-800 shadow-2xs">
            {totalDevices} Device Terdaftar • {totalCustomers} Customer Aktif
          </span>
        </div>

        {/* Toggle Collapse Button */}
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          aria-expanded={isOpen}
          aria-label={isOpen ? "Tutup panel Device Inventory" : "Buka panel Device Inventory"}
          className="border border-slate-200/80 bg-white cursor-pointer text-slate-500 hover:text-slate-900 p-1.5 flex items-center justify-center rounded-lg hover:bg-slate-50 shadow-2xs transition-colors"
        >
          {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>

      {/* ── 2. Collapsible Body ── */}
      {isOpen && (
        <div className="p-5">
          {/* ── Toggle Filter Bar ── */}
          <div className="inline-flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200/80 gap-1 mb-5 flex-wrap">
            <button
              type="button"
              onClick={() => setActiveTab("own")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === "own"
                  ? "bg-amber-500 text-white shadow-2xs font-bold"
                  : "text-slate-600 hover:text-slate-900 bg-transparent"
              }`}
            >
              Milik Sendiri ({ownCount})
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("customer")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === "customer"
                  ? "bg-amber-500 text-white shadow-2xs font-bold"
                  : "text-slate-600 hover:text-slate-900 bg-transparent"
              }`}
            >
              Device Milik Customer ({customerDevicesCount})
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("unmounted")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === "unmounted"
                  ? "bg-amber-500 text-white shadow-2xs font-bold"
                  : "text-slate-600 hover:text-slate-900 bg-transparent"
              }`}
            >
              Belum Masuk Rack ({unmountedCount})
            </button>
          </div>

          {/* ── TAB 1: Milik Sendiri ── */}
          {activeTab === "own" && (
            <div className="min-w-0">
              {/* Sub-header Bar */}
              <div className="flex justify-between items-center mb-3.5">
                <h4 className="m-0 text-xs font-extrabold uppercase tracking-wide text-emerald-700">
                  Milik Sendiri
                </h4>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs">
                  {ownCount} Device
                </span>
              </div>

              {/* Table / Empty State Milik Sendiri */}
              {ownCount === 0 || ownDevicesList.length === 0 ? (
                <div className="border border-dashed border-slate-200 rounded-xl bg-slate-50/70 p-10 flex flex-col items-center justify-center text-center gap-1.5">
                  <div className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center mb-2 shadow-2xs">
                    <span className="w-3 h-3 border-2 border-slate-400 rounded-xs" />
                  </div>
                  <div className="font-bold text-sm text-slate-800">
                    Belum ada device milik sendiri.
                  </div>
                  <div className="text-xs text-slate-500 max-w-sm">
                    Aset baremetal internal belum dialokasikan di rack ini.
                  </div>
                </div>
              ) : (
                <div className="border border-slate-200/80 rounded-xl bg-white overflow-hidden shadow-2xs w-full">
                  <table className="w-full border-collapse text-left text-xs">
                    <thead>
                      <tr className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 uppercase tracking-wider text-[11px] font-bold">
                        <th className="py-3 px-4 w-[42%]">DEVICE</th>
                        <th className="py-3 px-4 w-[45%]">SITE/RACK</th>
                        <th className="py-3 px-4 w-[13%]">U</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedOwnDevices.map((dev) => {
                        const siteRackText = [dev.site, dev.rack].filter(Boolean).join(" ");

                        return (
                          <tr
                            key={dev.id}
                            className="border-b border-slate-100 hover:bg-slate-50/70 transition-colors"
                          >
                            {/* Device Type & Name */}
                            <td className="py-3.5 px-4">
                              <div className="flex flex-col">
                                <span className="text-[11px] text-slate-400 lowercase mb-0.5">
                                  {dev.device_type || "device"}
                                </span>
                                <span className="font-bold text-slate-900 text-xs">
                                  {dev.device_name}
                                </span>
                              </div>
                            </td>

                            {/* Site & Rack */}
                            <td className="py-3.5 px-4 text-slate-600 font-medium text-xs">
                              {siteRackText || "—"}
                            </td>

                            {/* Rack U */}
                            <td className="py-3.5 px-4 text-slate-600 font-medium text-xs">
                              {dev.rack_u ? `U${dev.rack_u}` : "-"}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Pagination Tab Milik Sendiri */}
              {ownDevicesList.length > 0 && (
                <div className="mt-2">
                  <DataTablePagination
                    currentPage={ownPage}
                    totalPages={ownTotalPages}
                    perPage={ownPerPage}
                    onPageChange={(page) => setOwnPage(page)}
                    onPerPageChange={(size) => {
                      setOwnPerPage(size);
                      setOwnPage(1);
                    }}
                    perPageOptions={[5, 10, 20]}
                  />
                </div>
              )}
            </div>
          )}

          {/* ── TAB 2: Device Milik Customer ── */}
          {activeTab === "customer" && (
            <div className="min-w-0">
              {/* Sub-header Bar */}
              <div className="flex justify-between items-center mb-3.5">
                <h4 className="m-0 text-xs font-extrabold uppercase tracking-wide text-blue-700">
                  Device Milik Customer
                </h4>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 shadow-2xs">
                  {customerDevicesCount} Device Total
                </span>
              </div>

              {/* Tabel Daftar Customer & Device */}
              <div className="border border-slate-200/80 rounded-xl bg-white overflow-hidden shadow-2xs w-full">
                {byCustomerList.length === 0 ? (
                  <div className="py-10 px-4 text-center text-slate-400 text-xs">
                    Belum ada device customer terdaftar.
                  </div>
                ) : (
                  <table className="w-full border-collapse text-left text-xs">
                    <thead>
                      <tr className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 uppercase tracking-wider text-[11px] font-bold">
                        <th className="py-3 px-4 w-[50%]">CUSTOMER</th>
                        <th className="py-3 px-4 w-[30%]">STATUS</th>
                        <th className="py-3 px-4 w-[20%] text-right">
                          JUMLAH DEVICE
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedCustomerList.map((c) => {
                        const avatarPal = getCustomerPastelAvatar(c.company_name);
                        const initial = getCustomerInitial(c.company_name);

                        return (
                          <tr
                            key={c.customer_id}
                            className="border-b border-slate-100 hover:bg-slate-50/70 transition-colors"
                          >
                            {/* Customer Avatar & Name */}
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-3">
                                <div
                                  style={{
                                    backgroundColor: avatarPal.bg,
                                    color: avatarPal.text,
                                  }}
                                  className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 shadow-2xs"
                                >
                                  {initial}
                                </div>
                                <div>
                                  <div className="font-bold text-xs text-slate-900 leading-tight">
                                    {c.company_name}
                                  </div>
                                  <div className="text-[11px] text-slate-400 mt-0.5">
                                    Colocation / Dedicated Client
                                  </div>
                                </div>
                              </div>
                            </td>

                            {/* Status Badge */}
                            <td className="py-3.5 px-4">
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                Customer Aktif
                              </span>
                            </td>

                            {/* Device Count */}
                            <td className="py-3.5 px-4 text-right">
                              <span className="font-extrabold text-sm text-blue-600">
                                {c.device_count}
                              </span>
                              <span className="text-xs text-slate-500 ml-1">
                                Device
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Pagination Tab Device Milik Customer */}
              {byCustomerList.length > 0 && (
                <div className="mt-2">
                  <DataTablePagination
                    currentPage={custPage}
                    totalPages={custTotalPages}
                    perPage={custPerPage}
                    onPageChange={(page) => setCustPage(page)}
                    onPerPageChange={(size) => {
                      setCustPerPage(size);
                      setCustPage(1);
                    }}
                    perPageOptions={[5, 10, 20]}
                  />
                </div>
              )}
            </div>
          )}

          {/* ── TAB 3: Belum Masuk Rack (Spare) ── */}
          {activeTab === "unmounted" && (
            <div className="min-w-0">
              {/* Sub-header Bar */}
              <div className="flex justify-between items-center mb-3.5">
                <h4 className="m-0 text-xs font-extrabold uppercase tracking-wide text-amber-700">
                  Belum Masuk Rack (Spare)
                </h4>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 shadow-2xs">
                  {isAllMounted ? "100% Mounted" : `${unmountedCount} Unmounted`}
                </span>
              </div>

              {/* Konten Tab 3: Empty State Sukses jika 0, atau Tabel jika ada data */}
              {unmountedCount === 0 || unmountedList.length === 0 ? (
                <div className="border border-dashed border-slate-200 rounded-xl bg-slate-50/70 p-10 flex flex-col items-center justify-center text-center gap-1.5">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center mb-2 shadow-2xs">
                    <Check size={20} className="text-emerald-600 stroke-[2.5]" />
                  </div>
                  <div className="font-bold text-sm text-slate-800">
                    Semua sudah ter-mount.
                  </div>
                  <div className="text-xs text-slate-500 max-w-sm">
                    Tidak ada unit spare menganggur di luar rack.
                  </div>
                </div>
              ) : (
                <div className="border border-slate-200/80 rounded-xl bg-white overflow-hidden shadow-2xs w-full">
                  <table className="w-full border-collapse text-left text-xs">
                    <thead>
                      <tr className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 uppercase tracking-wider text-[11px] font-bold">
                        <th className="py-3 px-4 w-[45%]">PERANGKAT UNMOUNTED</th>
                        <th className="py-3 px-4 w-[35%]">SITE</th>
                        <th className="py-3 px-4 w-[20%] text-right">STATUS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedUnmountedList.map((dev) => (
                        <tr
                          key={dev.id}
                          className="border-b border-slate-100 hover:bg-slate-50/70 transition-colors"
                        >
                          {/* Device Type & Name */}
                          <td className="py-3.5 px-4">
                            <div className="flex flex-col">
                              <span className="text-[11px] text-slate-400 lowercase mb-0.5">
                                {dev.device_type || "device"}
                              </span>
                              <span className="font-bold text-slate-900 text-xs">
                                {dev.device_name}
                              </span>
                            </div>
                          </td>

                          {/* Site */}
                          <td className="py-3.5 px-4 text-slate-600 font-medium text-xs">
                            {dev.site || "—"}
                          </td>

                          {/* Status */}
                          <td className="py-3.5 px-4 text-right">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200 shadow-2xs">
                              {dev.status || "Spare"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Pagination Tab Belum Masuk Rack */}
              {unmountedList.length > 0 && (
                <div className="mt-2">
                  <DataTablePagination
                    currentPage={unmountedPage}
                    totalPages={unmountedTotalPages}
                    perPage={unmountedPerPage}
                    onPageChange={(page) => setUnmountedPage(page)}
                    onPerPageChange={(size) => {
                      setUnmountedPerPage(size);
                      setUnmountedPage(1);
                    }}
                    perPageOptions={[5, 10, 20]}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
