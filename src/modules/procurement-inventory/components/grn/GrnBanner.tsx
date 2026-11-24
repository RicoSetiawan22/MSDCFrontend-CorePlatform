import { Truck, Clock, CheckCircle2, FileCheck2 } from "lucide-react";

interface GrnBannerProps {
  totalGrn: number;
  draftCount: number;
  postedCount: number;
}

export function GrnBanner({ totalGrn, draftCount, postedCount }: GrnBannerProps) {
  return (
    <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
      <div className="flex items-center gap-6 w-full md:w-auto divide-x divide-slate-100">
        
        {/* Stat 1: Total Penerimaan */}
        <div className="flex items-center gap-3 pr-2">
          <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl border border-amber-100">
            <Truck size={20} />
          </div>
          <div>
            <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">
              Total Penerimaan
            </p>
            <p className="text-base font-bold text-slate-800 mt-0.5">
              {totalGrn} <span className="text-xs font-normal text-slate-400">Transaksi</span>
            </p>
          </div>
        </div>

        {/* Stat 2: Draft (Belum Post) */}
        <div className="flex items-center gap-3 pl-6">
          <div className="p-2.5 bg-amber-500/10 text-amber-700 rounded-xl border border-amber-200/60">
            <Clock size={20} />
          </div>
          <div>
            <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">
              Draft (Belum Post)
            </p>
            <p className="text-base font-bold text-amber-700 mt-0.5">
              {draftCount} <span className="text-xs font-normal text-slate-400">Perlu Cek</span>
            </p>
          </div>
        </div>

        {/* Stat 3: Stok Masuk (Posted) */}
        <div className="hidden sm:flex items-center gap-3 pl-6">
          <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100">
            <CheckCircle2 size={20} />
          </div>
          <div>
            <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">
              Stok Masuk (Posted)
            </p>
            <p className="text-base font-bold text-slate-800 mt-0.5">
              {postedCount} <span className="text-xs font-normal text-slate-400">Selesai</span>
            </p>
          </div>
        </div>
      </div>

      {/* Info Box Alur Sistem */}
      <div className="w-full md:w-72 bg-slate-50/80 p-3 rounded-xl border border-slate-200/60 flex items-start gap-2.5 text-xs text-slate-600 leading-relaxed">
        <FileCheck2 size={18} className="text-amber-500 shrink-0 mt-0.5" />
        <span>
          Klik tombol <strong>Post</strong> pada item draft agar kuantitas penerimaan barang otomatis menambahkan <strong>Stok Total Inventory</strong>.
        </span>
      </div>
    </div>
  );
}