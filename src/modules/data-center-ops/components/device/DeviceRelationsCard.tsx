import React from "react";
import {
  UserCheck,
  FileText,
  Briefcase,
  Network,
  Activity,
  CheckCircle2,
  Mail,
  Phone,
  ShieldCheck,
} from "lucide-react";
import type { Device } from "../../types/device";
import { formatDate } from "@shared/lib/format";

export interface DeviceRelationsCardProps {
  device: Device;
}

export const DeviceRelationsCard: React.FC<DeviceRelationsCardProps> = ({ device }) => {
  const customer = device.customer;
  const contract = device.contract;
  const fixedAsset = device.fixed_asset;
  const ports = device.network_ports ?? [];

  return (
    <div className="flex flex-col gap-6">
      {/* ── 1. Kartu Relasi Komersial & CRM ── */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col">
        {/* Header Band Kuning Emas Pastel MSDC */}
        <div className="bg-[#FDE8B3]/60 px-6 py-4 border-b border-amber-200/50 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-[#0A2140] flex items-center justify-center font-bold">
              <Briefcase size={17} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 tracking-tight">
                Kepemilikan Customer &amp; Kontrak
              </h2>
              <p className="text-[11px] text-slate-600 font-medium">
                Penyewaan colocation, kontrak SLA aktif, dan penomoran aset tetap
              </p>
            </div>
          </div>

          <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white border border-amber-200/80 text-amber-800 shadow-2xs">
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                customer ? "bg-blue-500" : "bg-emerald-500"
              }`}
            />
            <span>{customer ? "Colocation Tenant" : "Aset Internal MSDC"}</span>
          </span>
        </div>

        {/* 3 Grid Relasi */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Kolom 1: Customer / Pelanggan */}
          <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs hover:border-slate-300 hover:shadow-md transition-all duration-200 flex flex-col justify-between gap-4 group">
            <div className="flex flex-col gap-3">
              {/* Top row: Label */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                  <div className="w-6 h-6 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center">
                    <UserCheck size={14} />
                  </div>
                  <span>Customer / Pelanggan</span>
                </div>
                {customer ? (
                  <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 border border-blue-200/70 px-2 py-0.5 rounded-full">
                    CRM Sales
                  </span>
                ) : null}
              </div>

              {/* Data Customer */}
              {customer ? (
                <div className="flex flex-col gap-1.5">
                  <span className="text-base font-bold text-slate-900 leading-snug">
                    {customer.company_name}
                  </span>
                  <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200 self-start">
                    {customer.customer_code}
                  </span>
                  {(customer.email || customer.phone) ? (
                    <div className="text-xs text-slate-600 mt-1 flex flex-col gap-1">
                      {customer.email ? (
                        <div className="flex items-center gap-1.5 truncate">
                          <Mail size={12} className="text-slate-400 shrink-0" />
                          <span className="truncate">{customer.email}</span>
                        </div>
                      ) : null}
                      {customer.phone ? (
                        <div className="flex items-center gap-1.5">
                          <Phone size={12} className="text-slate-400 shrink-0" />
                          <span>{customer.phone}</span>
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              ) : (
                <div className="flex flex-col gap-1 py-1">
                  <span className="text-sm font-bold text-slate-700">Infrastruktur Internal</span>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Perangkat ini merupakan aset internal data center (bukan sewaan customer).
                  </p>
                </div>
              )}
            </div>

            {/* Bottom Row */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>Klasifikasi:</span>
              <strong className="text-slate-800 font-semibold">
                {customer ? "Colocation Tenant" : "Aset Internal"}
              </strong>
            </div>
          </div>

          {/* Kolom 2: Kontrak Layanan */}
          <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs hover:border-slate-300 hover:shadow-md transition-all duration-200 flex flex-col justify-between gap-4 group">
            <div className="flex flex-col gap-3">
              {/* Top row: Label */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                  <div className="w-6 h-6 rounded-md bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <FileText size={14} />
                  </div>
                  <span>Kontrak Layanan</span>
                </div>
                {contract?.status ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    <CheckCircle2 size={11} />
                    <span className="capitalize">{contract.status}</span>
                  </span>
                ) : null}
              </div>

              {/* Data Kontrak */}
              {contract ? (
                <div className="flex flex-col gap-1.5">
                  <span className="font-mono text-base font-bold text-slate-900 leading-snug">
                    {contract.contract_number}
                  </span>
                  {(contract.start_date || contract.end_date) ? (
                    <div className="text-xs text-slate-600 mt-1 flex flex-col gap-0.5">
                      <span className="text-slate-400 font-medium">Masa Berlaku SLA:</span>
                      <strong className="text-slate-700">
                        {contract.start_date ? formatDate(contract.start_date) : "—"} s/d{" "}
                        {contract.end_date ? formatDate(contract.end_date) : "—"}
                      </strong>
                    </div>
                  ) : null}
                </div>
              ) : (
                <div className="flex flex-col gap-1 py-1">
                  <span className="text-sm font-bold text-slate-700">Tanpa Kontrak Colocation</span>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Tidak terikat pada perjanjian sewa kontrak colocation komersial spesifik.
                  </p>
                </div>
              )}
            </div>

            {/* Bottom Row */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>Status Perjanjian:</span>
              <strong className="text-slate-800 font-semibold inline-flex items-center gap-1">
                <ShieldCheck size={12} className="text-emerald-500" />
                {contract ? "SLA 99.9% Aktif" : "SLA Standar Internal"}
              </strong>
            </div>
          </div>

          {/* Kolom 3: Fixed Asset */}
          <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs hover:border-slate-300 hover:shadow-md transition-all duration-200 flex flex-col justify-between gap-4 group">
            <div className="flex flex-col gap-3">
              {/* Top row: Label */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                  <div className="w-6 h-6 rounded-md bg-purple-50 text-purple-600 flex items-center justify-center">
                    <Activity size={14} />
                  </div>
                  <span>Fixed Asset (Finance)</span>
                </div>
                <span
                  className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
                    fixedAsset
                      ? "text-purple-700 bg-purple-50 border-purple-200/70"
                      : "text-slate-500 bg-slate-100 border-slate-200/70"
                  }`}
                >
                  {fixedAsset ? "Terdaftar" : "Unlinked"}
                </span>
              </div>

              {/* Data Fixed Asset */}
              {fixedAsset ? (
                <div className="flex flex-col gap-1.5">
                  <span className="text-base font-bold text-slate-900 leading-snug">
                    {fixedAsset.asset_name}
                  </span>
                  <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200 self-start">
                    {fixedAsset.asset_code}
                  </span>
                </div>
              ) : (
                <div className="flex flex-col gap-1 py-1">
                  <span className="text-sm font-bold text-slate-700">Aset Belum Ditautkan</span>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Belum ditautkan ke nomor register Fixed Asset modul Finance &amp; Accounting.
                  </p>
                </div>
              )}
            </div>

            {/* Bottom Row */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>Nomor Register:</span>
              <strong className="text-slate-800 font-mono font-semibold">
                {device.fixed_asset_id ? `#${device.fixed_asset_id}` : "—"}
              </strong>
            </div>
          </div>
        </div>
      </div>

      {/* ── 2. Kartu Antarmuka Jaringan (Network Interfaces) ── */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col">
        {/* Header Band Kuning Emas Pastel MSDC */}
        <div className="bg-[#FDE8B3]/60 px-6 py-4 border-b border-amber-200/50 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-[#0A2140] flex items-center justify-center font-bold">
              <Network size={17} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 tracking-tight">
                Port &amp; Antarmuka Jaringan (NIC / Uplink)
              </h2>
              <p className="text-[11px] text-slate-600 font-medium">
                Daftar port fisik ethernet, SFP fiber optic, alamat IP, dan MAC address
              </p>
            </div>
          </div>

          <span className="text-xs font-bold text-[#0A2140] bg-white border border-amber-200/80 px-2.5 py-1 rounded-lg shadow-2xs">
            Total {ports.length} Port
          </span>
        </div>

        {/* Content Table or Empty State */}
        {ports.length === 0 ? (
          <div className="p-8 text-center flex flex-col items-center justify-center gap-2">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
              <Network size={22} />
            </div>
            <h3 className="text-sm font-bold text-slate-700 mt-1">
              Belum Ada Port Jaringan Terdaftar
            </h3>
            <p className="text-xs text-slate-500 max-w-md">
              Antarmuka jaringan fisik (NIC, SFP+, port mgmt) belum dikonfigurasi untuk perangkat ini.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FEF9EE] text-slate-800 font-bold border-b border-[#F3EDE0]">
                <tr>
                  <th className="py-3 px-4 text-xs font-bold tracking-wider text-slate-700">NAMA PORT</th>
                  <th className="py-3 px-4 text-xs font-bold tracking-wider text-slate-700">KECEPATAN</th>
                  <th className="py-3 px-4 text-xs font-bold tracking-wider text-slate-700">MAC ADDRESS</th>
                  <th className="py-3 px-4 text-xs font-bold tracking-wider text-slate-700">IP ADDRESS</th>
                  <th className="py-3 px-4 text-xs font-bold tracking-wider text-slate-700 text-center">STATUS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {ports.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-semibold text-slate-900">{p.port_name}</td>
                    <td className="py-3 px-4 text-slate-600">{p.speed || "—"}</td>
                    <td className="py-3 px-4 font-mono text-slate-700">{p.mac_address || "—"}</td>
                    <td className="py-3 px-4 font-mono font-medium text-blue-600">{p.ip_address || "—"}</td>
                    <td className="py-3 px-4 text-center">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        <span>{p.status || "Up"}</span>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default DeviceRelationsCard;
