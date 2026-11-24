import { Eye, Pencil, Ban, CheckCircle2 } from "lucide-react";
import { Pagination } from "@shared/components/Pagination";
import { LoadingState } from "@shared/components/LoadingState";
import { EmptyState } from "@shared/components/EmptyState";
import type { Vendor, VendorCategory, VendorStatus } from "../../types/vendor";

const CATEGORY_LABEL: Record<VendorCategory, string> = {
  hardware: "Hardware",
  service: "Jasa / Service",
  sparepart: "Sparepart",
  other: "Lainnya",
};

const STATUS_LABEL: Record<VendorStatus, string> = {
  active: "Aktif",
  inactive: "Nonaktif",
  blacklisted: "Blacklist",
};

/** Utility untuk merapikan format NPWP (15 digit) */
function formatNPWP(npwp: string): string {
  const clean = npwp.replace(/\D/g, "");
  if (clean.length === 15) {
    return clean.replace(
      /(\d{2})(\d{3})(\d{3})(\d{1})(\d{3})(\d{3})/,
      "$1.$2.$3.$4-$5.$6"
    );
  }
  return npwp;
}

interface VendorTableProps {
  vendors: Vendor[];
  isLoading?: boolean;
  onViewDetail?: (vendor: Vendor) => void; // 🟢 Tambahkan prop onViewDetail
  onEdit: (vendor: Vendor) => void;
  onToggleStatus: (vendor: Vendor) => void;
  isStatusPending?: boolean;
  currentPage: number;
  lastPage: number;
  total: number;
  onPageChange: (p: number) => void;
}

export function VendorTable({
  vendors,
  isLoading,
  onViewDetail, // 🟢 Destructure prop onViewDetail
  onEdit,
  onToggleStatus,
  isStatusPending,
  currentPage,
  lastPage,
  total,
  onPageChange,
}: VendorTableProps) {
  if (isLoading) return <LoadingState />;

  if (vendors.length === 0) {
    return (
      <EmptyState
        title="Belum Ada Vendor Terdaftar"
        subtitle="Tidak ada data vendor yang sesuai dengan kriteria/filter."
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Container Tabel Berbingkai Rapi */}
      <div className="border border-slate-200/90 rounded-xl overflow-hidden bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/90 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                <th className="py-3.5 px-4">KODE</th>
                <th className="py-3.5 px-4">NAMA VENDOR</th>
                <th className="py-3.5 px-4">NPWP</th>
                <th className="py-3.5 px-4">PAJAK</th>
                <th className="py-3.5 px-4">KATEGORI</th>
                <th className="py-3.5 px-4">PAYMENT TERM</th>
                <th className="py-3.5 px-4">STATUS</th>
                <th className="py-3.5 px-4 text-center no-print">AKSI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
              {vendors.map((vendor) => (
                <tr
                  key={vendor.id}
                  className="hover:bg-slate-50/60 transition-colors"
                >
                  {/* Kode Vendor */}
                  <td className="py-3.5 px-4 font-mono text-xs font-bold text-slate-800">
                    {vendor.vendor_code}
                  </td>

                  {/* Nama Vendor */}
                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-slate-900">
                      {vendor.vendor_name}
                    </div>
                    {vendor.legal_name && (
                      <div className="text-xs text-slate-400 font-normal">
                        {vendor.legal_name}
                      </div>
                    )}
                  </td>

                  {/* Kolom NPWP */}
                  <td className="py-3.5 px-4">
                    {vendor.npwp ? (
                      <span
                        className="font-mono text-xs font-semibold text-slate-700 bg-sky-50 border border-sky-200/80 px-2.5 py-1 rounded-md inline-block whitespace-nowrap tracking-tight shadow-xs"
                        title={vendor.npwp}
                      >
                        {formatNPWP(vendor.npwp)}
                      </span>
                    ) : (
                      <span className="inline-flex items-center text-[11px] font-medium text-slate-400 bg-slate-100/70 border border-slate-200/60 px-2.5 py-0.5 rounded-full whitespace-nowrap">
                        Belum Diisi
                      </span>
                    )}
                  </td>

                  {/* Kolom Status Pajak */}
                  <td className="py-3.5 px-4">
                    {vendor.tax_status === "pkp" ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        PKP
                      </span>
                    ) : vendor.tax_status === "pemungut" ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                        Pemungut
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200/80">
                        Non-PKP
                      </span>
                    )}
                  </td>

                  {/* Kolom Kategori */}
                  <td className="py-3.5 px-4 text-slate-700">
                    <div className="flex flex-col items-start">
                      <span className="font-medium">
                        {CATEGORY_LABEL[vendor.category] ?? vendor.category}
                      </span>
                      {vendor.category === "other" &&
                        vendor.category_other_detail && (
                          <span className="text-xs text-slate-400 font-normal">
                            {vendor.category_other_detail}
                          </span>
                        )}
                    </div>
                  </td>

                  {/* Payment Term */}
                  <td className="py-3.5 px-4 font-medium text-slate-600">
                    Net {vendor.payment_term_days} hari
                  </td>

                  {/* Status Vendor */}
                  <td className="py-3.5 px-4">
                    <span
                      className={`inline-flex items-center px-3 py-0.5 rounded-full text-xs font-medium border ${
                        vendor.status === "active"
                          ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                          : vendor.status === "blacklisted"
                          ? "bg-red-50 text-red-600 border-red-200"
                          : "bg-slate-100 text-slate-600 border-slate-200"
                      }`}
                    >
                      {STATUS_LABEL[vendor.status]}
                    </span>
                  </td>

                  {/* Aksi */}
                  <td className="py-3.5 px-4 no-print">
                    <div className="flex items-center justify-center gap-1.5">
                      {/* 🟢 Tombol Lihat Detail (Mata) */}
                      {onViewDetail && (
                        <button
                          type="button"
                          onClick={() => onViewDetail(vendor)}
                          className="p-1.5 rounded-lg border border-blue-200 bg-blue-50/50 text-blue-600 hover:bg-blue-100 transition-colors cursor-pointer"
                          title="Lihat Detail Profil & Dokumen"
                        >
                          <Eye size={15} />
                        </button>
                      )}

                      {/* Tombol Edit */}
                      <button
                        type="button"
                        onClick={() => onEdit(vendor)}
                        className="p-1.5 rounded-lg border border-amber-200 bg-amber-50/50 text-amber-600 hover:bg-amber-100 transition-colors cursor-pointer"
                        title="Edit Data Vendor"
                      >
                        <Pencil size={15} />
                      </button>

                      {/* Tombol Toggle Status */}
                      <button
                        type="button"
                        onClick={() => onToggleStatus(vendor)}
                        disabled={isStatusPending}
                        className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                          vendor.status === "blacklisted"
                            ? "border-emerald-200 bg-emerald-50/50 text-emerald-600 hover:bg-emerald-100"
                            : "border-red-200 bg-red-50/50 text-red-600 hover:bg-red-100"
                        }`}
                        title={
                          vendor.status === "blacklisted"
                            ? "Aktifkan kembali"
                            : "Blacklist"
                        }
                      >
                        {vendor.status === "blacklisted" ? (
                          <CheckCircle2 size={15} />
                        ) : (
                          <Ban size={15} />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Pagination
        currentPage={currentPage}
        lastPage={lastPage}
        total={total}
        onPageChange={onPageChange}
      />
    </div>
  );
}