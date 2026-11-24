import { useState, useEffect } from "react";
import {
  Globe2,
  Search,
  CheckCircle2,
  AlertCircle,
  X,
  Loader2,
  Layers,
  ArrowRight,
  RefreshCw,
} from "lucide-react";
import { useIpSubnetList, useNextAvailableIp, useAllocateIpAddress } from "../api/useIpam";
import { extractErrorMessage } from "@shared/types/api";

export interface WorkOrderIpAllocateModalProps {
  customerId: number | null | undefined;
  contractServiceId: number;
  requiredCount: number | null;
  currentCount: number;
  onClose: () => void;
  onSaved: () => void;
}

/**
 * Modal Alokasi IP LANGSUNG dari Perintah Kerja (Work Order).
 * Mencari 1 IP kosong di subnet terpilih (next-available) dan menguncinya
 * ke customer / baris layanan kontrak ini.
 *
 * Modal tetap terbuka setelah tiap alokasi berhasil agar staf teknisi dapat
 * mengulangi pencarian dan alokasi beberapa kali sesuai kuota (requiredCount).
 */
export function WorkOrderIpAllocateModal({
  customerId,
  contractServiceId,
  requiredCount,
  currentCount,
  onClose,
  onSaved,
}: WorkOrderIpAllocateModalProps) {
  const [subnetId, setSubnetId] = useState("");
  const [foundIp, setFoundIp] = useState<{ id: number; ip_address: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [allocatedCount, setAllocatedCount] = useState(currentCount);

  // Fetch seluruh subnet aktif dari IPAM
  const { data: subnetsPage, isLoading: loadingSubnets } = useIpSubnetList({ per_page: 100 });
  const findNext = useNextAvailableIp();
  const allocate = useAllocateIpAddress();

  const isBusy = findNext.isPending || allocate.isPending;

  // Tangani tombol ESC untuk menutup modal jika tidak sedang menyimpan
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isBusy) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, isBusy]);

  function handleFind() {
    if (!subnetId) {
      setError("Silakan pilih subnet terlebih dahulu.");
      return;
    }
    setError(null);
    setFoundIp(null);
    findNext.mutate(Number(subnetId), {
      onSuccess: (ip) => setFoundIp({ id: ip.id, ip_address: ip.ip_address }),
      onError: (err) => setError(extractErrorMessage(err)),
    });
  }

  function handleAllocate() {
    if (!foundIp) return;
    setError(null);
    allocate.mutate(
      {
        addressId: foundIp.id,
        values: {
          allocated_to_type: "customer",
          customer_id: customerId ?? undefined,
          contract_service_id: contractServiceId,
        },
      },
      {
        onSuccess: () => {
          setAllocatedCount((c) => c + 1);
          setFoundIp(null);
          onSaved();
        },
        onError: (err) => setError(extractErrorMessage(err)),
      }
    );
  }

  const isQuotaFulfilled = requiredCount ? allocatedCount >= requiredCount : false;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={isBusy ? undefined : onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-[500px] overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="ip-allocate-modal-title"
      >
        {/* ── Modal Header Bergaya MSDC ── */}
        <div className="px-6 pt-5 pb-4 flex items-center justify-between border-b border-slate-100 bg-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200/80 flex items-center justify-center text-teal-600 shrink-0">
              <Globe2 size={20} />
            </div>
            <div>
              <h2
                id="ip-allocate-modal-title"
                className="text-base font-bold text-[#0A2140] tracking-tight leading-tight"
              >
                Alokasi Alamat IP (IPAM)
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Cari dan pasang alamat IP kosong untuk layanan kontrak ini
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isBusy}
            aria-label="Tutup modal"
            className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full p-1.5 transition-colors cursor-pointer disabled:opacity-50"
          >
            <X size={18} />
          </button>
        </div>

        {/* ── Modal Body ── */}
        <div className="px-6 py-5 flex flex-col gap-4 overflow-y-auto">
          {/* Card Status Kuota Alokasi */}
          <div
            className={`rounded-xl border p-3.5 flex items-center justify-between gap-3 transition-colors ${
              isQuotaFulfilled
                ? "bg-emerald-50/80 border-emerald-200 text-emerald-900"
                : "bg-slate-50 border-slate-200 text-slate-800"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                  isQuotaFulfilled ? "bg-emerald-100 text-emerald-700" : "bg-white border border-slate-200 text-slate-600"
                }`}
              >
                <Layers size={14} />
              </div>
              <div className="flex flex-col">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Status Kuota IP
                </span>
                <span className="text-xs font-semibold">
                  Teralokasi:{" "}
                  <strong className="text-sm font-bold text-slate-900">
                    {allocatedCount}
                  </strong>
                  {requiredCount ? ` / ${requiredCount}` : ""} IP
                </span>
              </div>
            </div>

            {isQuotaFulfilled && (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                <CheckCircle2 size={11} /> Kuota Terpenuhi
              </span>
            )}
          </div>

          {/* Pemilihan Subnet */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-700">
              Pilih Subnet IPAM <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <select
                className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all cursor-pointer disabled:bg-slate-50"
                value={subnetId}
                onChange={(e) => {
                  setSubnetId(e.target.value);
                  setFoundIp(null);
                  setError(null);
                }}
                disabled={loadingSubnets || isBusy}
              >
                <option value="">— Pilih Subnet Terdaftar —</option>
                {(subnetsPage?.data ?? []).map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.cidr} ({s.subnet_type?.toUpperCase()})
                    {s.description ? ` — ${s.description}` : ""}
                  </option>
                ))}
              </select>
            </div>
            <p className="text-[11px] text-slate-400">
              Menampilkan subnet publik &amp; private yang terkonfigurasi di IPAM data center.
            </p>
          </div>

          {/* Hasil Pencarian IP / Tombol Cari */}
          {!foundIp ? (
            <button
              type="button"
              onClick={handleFind}
              disabled={!subnetId || findNext.isPending || isBusy}
              className="w-full py-2.5 px-4 bg-[#E59B00] hover:bg-[#d48f00] text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
            >
              {findNext.isPending ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  <span>Mencari IP Kosong Berikutnya...</span>
                </>
              ) : (
                <>
                  <Search size={15} />
                  <span>Cari IP Kosong (Next Available)</span>
                </>
              )}
            </button>
          ) : (
            <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-4 flex flex-col gap-3 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
                  <CheckCircle2 size={13} className="text-emerald-600" />
                  IP Kosong Ditemukan
                </span>
                <button
                  type="button"
                  onClick={handleFind}
                  disabled={isBusy}
                  className="text-[11px] text-slate-500 hover:text-slate-800 flex items-center gap-1 font-semibold transition-colors cursor-pointer"
                  title="Cari IP berikutnya di subnet yang sama"
                >
                  <RefreshCw size={11} />
                  <span>Ganti IP Lain</span>
                </button>
              </div>

              <div className="flex items-center justify-between gap-3 bg-white p-3 rounded-lg border border-emerald-200/80 shadow-2xs">
                <span className="font-mono text-base font-black text-emerald-800 tracking-wide">
                  {foundIp.ip_address}
                </span>

                <button
                  type="button"
                  onClick={handleAllocate}
                  disabled={allocate.isPending}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 active:scale-95"
                >
                  {allocate.isPending ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      <span>Mengalokasikan...</span>
                    </>
                  ) : (
                    <>
                      <span>Alokasikan Sekarang</span>
                      <ArrowRight size={13} />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Banner Pesan Error */}
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium flex items-center gap-2 animate-in fade-in duration-150">
              <AlertCircle size={15} className="text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* ── Modal Footer ── */}
        <div className="px-6 py-3.5 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between shrink-0">
          <span className="text-[11px] text-slate-400">
            {allocatedCount > 0 ? "Alokasi IP tersimpan otomatis." : "Belum ada IP yang dialokasikan."}
          </span>
          <button
            type="button"
            onClick={onClose}
            disabled={isBusy}
            className="px-5 py-2 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs active:scale-95"
          >
            Selesai
          </button>
        </div>
      </div>
    </div>
  );
}

export default WorkOrderIpAllocateModal;
