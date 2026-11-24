import { Building2, CheckCircle2, FileCheck2, Receipt } from "lucide-react";
import { LoadingState } from "@shared/components/LoadingState";
import type { VendorKPIStats, VendorStatus, TaxStatus } from "../../types/vendor";

interface VendorKPICardsProps {
  stats: VendorKPIStats;
  isLoading?: boolean;
  activeStatusFilter?: VendorStatus | "";
  activeTaxFilter?: TaxStatus | "";
  onStatusFilterChange: (status: VendorStatus | "") => void;
  onTaxFilterChange: (taxStatus: TaxStatus | "") => void;
}

export function VendorKPICards({
  stats,
  isLoading,
  activeStatusFilter = "",
  activeTaxFilter = "",
  onStatusFilterChange,
  onTaxFilterChange,
}: VendorKPICardsProps) {
  if (isLoading) {
    return <LoadingState />;
  }

  // Cek apakah filter aktif
  const isTotalActive = activeStatusFilter === "" && activeTaxFilter === "";
  const isActiveStatusActive = activeStatusFilter === "active";
  const isPkpActive = activeTaxFilter === "pkp";
  const isNonPkpActive = activeTaxFilter === "non_pkp";

  // Base class untuk efek animasi saat diklik & dihover
  const cardAnimationClass =
    "transition-all duration-200 ease-in-out cursor-pointer hover:-translate-y-1 active:scale-95 active:translate-y-0 select-none";

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Card Total Vendor */}
      <button
        type="button"
        onClick={() => {
          onStatusFilterChange("");
          onTaxFilterChange("");
        }}
        className={`w-full text-left p-5 rounded-xl border bg-white shadow-sm flex items-center gap-4 focus:outline-none ${cardAnimationClass} ${
          isTotalActive
            ? "border-blue-500 ring-2 ring-blue-500/20 shadow-md"
            : "border-slate-200/80 hover:border-blue-300 hover:shadow-md"
        }`}
      >
        <div className="p-3 bg-blue-50 text-blue-600 rounded-xl shrink-0">
          <Building2 size={22} />
        </div>
        <div>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
            Total Vendor
          </p>
          <h3 className="text-2xl font-bold text-slate-800">{stats.totalVendors}</h3>
        </div>
      </button>

      {/* 2. Card Vendor Aktif */}
      <button
        type="button"
        onClick={() => {
          onTaxFilterChange("");
          onStatusFilterChange(isActiveStatusActive ? "" : "active");
        }}
        className={`w-full text-left p-5 rounded-xl border bg-white shadow-sm flex items-center gap-4 focus:outline-none ${cardAnimationClass} ${
          isActiveStatusActive
            ? "border-emerald-500 ring-2 ring-emerald-500/20 shadow-md"
            : "border-slate-200/80 hover:border-emerald-300 hover:shadow-md"
        }`}
      >
        <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl shrink-0">
          <CheckCircle2 size={22} />
        </div>
        <div>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
            Vendor Aktif
          </p>
          <h3 className="text-2xl font-bold text-slate-800">
            {stats.activeVendors}
            <span className="text-xs font-normal text-slate-400 ml-1.5">
              ({stats.blacklistedVendors} Blacklist)
            </span>
          </h3>
        </div>
      </button>

      {/* 3. Card Vendor PKP (Kena PPN) */}
      <button
        type="button"
        onClick={() => {
          onStatusFilterChange("");
          onTaxFilterChange(isPkpActive ? "" : "pkp");
        }}
        className={`w-full text-left p-5 rounded-xl border bg-white shadow-sm flex items-center gap-4 focus:outline-none ${cardAnimationClass} ${
          isPkpActive
            ? "border-indigo-500 ring-2 ring-indigo-500/20 shadow-md"
            : "border-slate-200/80 hover:border-indigo-300 hover:shadow-md"
        }`}
      >
        <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl shrink-0">
          <FileCheck2 size={22} />
        </div>
        <div>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
            Vendor PKP (Kena PPN)
          </p>
          <h3 className="text-2xl font-bold text-slate-800">{stats.pkpVendors}</h3>
        </div>
      </button>

      {/* 4. Card Non-PKP / Tanpa PPN */}
      <button
        type="button"
        onClick={() => {
          onStatusFilterChange("");
          onTaxFilterChange(isNonPkpActive ? "" : "non_pkp");
        }}
        className={`w-full text-left p-5 rounded-xl border bg-white shadow-sm flex items-center gap-4 focus:outline-none ${cardAnimationClass} ${
          isNonPkpActive
            ? "border-slate-500 ring-2 ring-slate-500/20 shadow-md"
            : "border-slate-200/80 hover:border-slate-400 hover:shadow-md"
        }`}
      >
        <div className="p-3 bg-slate-100 text-slate-600 rounded-xl shrink-0">
          <Receipt size={22} />
        </div>
        <div>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
            Non-PKP / Tanpa PPN
          </p>
          <h3 className="text-2xl font-bold text-slate-800">{stats.nonPkpVendors}</h3>
        </div>
      </button>
    </div>
  );
}