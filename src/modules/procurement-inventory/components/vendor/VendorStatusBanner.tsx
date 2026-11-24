import { CheckCircle } from "lucide-react";

interface VendorStatusBannerProps {
  pkpPercentage: number;
}

export function VendorStatusBanner({ pkpPercentage }: VendorStatusBannerProps) {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-slate-50 border border-slate-200/80 rounded-xl gap-3">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-emerald-100 text-emerald-700 rounded-lg">
          <CheckCircle size={20} />
        </div>
        <div>
          <p className="text-xs text-slate-500">
            {pkpPercentage}% vendor terdaftar sebagai PKP (Pengusaha Kena Pajak) untuk PPN AP Bill.
          </p>
        </div>
      </div>
    </div>
  );
}