import React from "react";
import { Link } from "react-router-dom";
import {
  ShieldAlert,
  PackageX,
  ArrowRight,
  ExternalLink,
  AlertCircle,
  Package,
} from "lucide-react";
import type { InventoryAlertItem } from "../../types/dashboard";

interface InventoryAlertBannerProps {
  outOfStockCount: number;
  belowReorderCount: number;
  alertItems?: InventoryAlertItem[];
  onCreatePrClick?: () => void;
}

export const InventoryAlertBanner: React.FC<InventoryAlertBannerProps> = ({
  outOfStockCount,
  belowReorderCount,
  alertItems = [],
  onCreatePrClick,
}) => {
  // Sembunyikan banner jika tidak ada barang kritis
  if (outOfStockCount === 0 && belowReorderCount === 0) return null;

  return (
    <div className="bg-gradient-to-r from-rose-50/70 via-amber-50/40 to-white border border-rose-200/80 rounded-2xl p-4.5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-all">
      {/* Sisi Kiri: Ikon & Pesan Ringkasan */}
      <div className="flex items-start gap-3.5 min-w-0">
        <div className="p-2.5 bg-rose-100/80 text-rose-600 rounded-2xl shrink-0 border border-rose-200/60 shadow-2xs">
          <ShieldAlert size={20} />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="text-sm font-bold text-slate-900 m-0">
              Peringatan Stok & Pengadaan Barang
            </h4>
            {outOfStockCount > 0 && (
              <span className="px-2 py-0.5 text-[10px] font-bold bg-rose-600 text-white rounded-full uppercase tracking-wider">
                Kritis
              </span>
            )}
          </div>

          {/* Deskripsi Ringkas */}
          <div className="flex items-center flex-wrap gap-x-2 gap-y-1 text-xs text-slate-600 mt-1 leading-relaxed">
            {outOfStockCount > 0 && (
              <span className="inline-flex items-center gap-1 text-rose-700 font-bold bg-rose-100/60 px-2 py-0.5 rounded-md border border-rose-200/70">
                <AlertCircle size={12} className="shrink-0" />
                {outOfStockCount} Item Stok Kosong (0)
              </span>
            )}
            {belowReorderCount > 0 && (
              <span className="inline-flex items-center gap-1 text-amber-700 font-semibold bg-amber-100/60 px-2 py-0.5 rounded-md border border-amber-200/70">
                <Package size={12} className="shrink-0" />
                {belowReorderCount} Item di Bawah Reorder Point
              </span>
            )}
            <span className="text-slate-500">
              Segera ajukan Purchase Request untuk menjaga ketersediaan stok.
            </span>
          </div>

          {/* Samples Item */}
          {alertItems.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 mt-2.5">
              {alertItems.slice(0, 2).map((item) => (
                <span
                  key={item.id}
                  className="inline-flex items-center gap-1.5 text-[11px] font-mono font-medium px-2.5 py-1 rounded-lg bg-white border border-rose-200/80 text-rose-800 shadow-2xs"
                >
                  <PackageX size={12} className="text-rose-500 shrink-0" />
                  <span className="truncate max-w-[150px]">{item.item_name}</span>
                  <span className="text-rose-600 font-bold">({item.stock_quantity})</span>
                </span>
              ))}

              {/* Tautan kalau item lebih dari 2 */}
              {outOfStockCount > 2 && (
                <Link
                  to="/procurement-inventory/items?filter=out_of_stock"
                  className="text-[11px] text-rose-700 font-semibold hover:underline flex items-center gap-1 ml-1"
                >
                  +{outOfStockCount - 2} item lainnya <ExternalLink size={11} />
                </Link>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Sisi Kanan: Tombol Aksi Cepat */}
      <div className="flex items-center gap-2 shrink-0 w-full md:w-auto justify-end">
        <button
          type="button"
          onClick={onCreatePrClick}
          className="px-4 py-2.5 text-xs font-semibold text-white bg-amber-500 hover:bg-amber-600 active:scale-95 rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer"
        >
          <span>Buat PR Baru</span>
          <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
};