import React, { useState, useEffect } from "react";
import { X, Loader2, AlertCircle } from "lucide-react";
import { useCustomerList } from "@modules/crm-sales/api/useCustomers";
import { useContractList, useContract } from "@modules/crm-sales/api/useContracts";
import { useAllocateIpAddress } from "../../api/useIpam";
import { extractErrorMessage } from "@shared/types/api";
import type { IpAddress } from "../../types/ipam";

export interface AllocateAddressModalProps {
  address: IpAddress;
  onClose: () => void;
  onSuccess?: () => void;
}

export const AllocateAddressModal: React.FC<AllocateAddressModalProps> = ({
  address,
  onClose,
  onSuccess,
}) => {
  const allocateMutation = useAllocateIpAddress();
  const { data: customerPage } = useCustomerList({ per_page: 100 });

  const [customerId, setCustomerId] = useState("");
  const [contractId, setContractId] = useState("");
  const [contractServiceId, setContractServiceId] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Kontrak difilter per customer terpilih
  const { data: contractPage } = useContractList({
    per_page: 100,
    customer_id: customerId ? Number(customerId) : undefined,
  });

  // Layanan spesifik di dalam kontrak (jika ada)
  const { data: selectedContract } = useContract(
    contractId ? Number(contractId) : undefined
  );

  const isPending = allocateMutation.isPending;

  // Tutup dengan tombol Escape
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && !isPending) {
        onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, isPending]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!customerId) {
      setError("Silakan pilih customer terlebih dahulu.");
      return;
    }

    try {
      await allocateMutation.mutateAsync({
        addressId: address.id,
        values: {
          allocated_to_type: "customer",
          customer_id: Number(customerId),
          contract_service_id: contractServiceId ? Number(contractServiceId) : undefined,
          notes: notes.trim() || undefined,
        },
      });
      onSuccess?.();
      onClose();
    } catch (err: unknown) {
      setError(extractErrorMessage(err));
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isPending) onClose();
      }}
    >
      <div
        className="w-full max-w-[440px] bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 flex flex-col gap-4 animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Modal Header ── */}
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900">
            Alokasikan {address.ip_address}
          </h3>
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer disabled:opacity-50"
          >
            <X size={18} />
          </button>
        </div>

        {/* ── Error Banner ── */}
        {error && (
          <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle size={15} className="shrink-0 text-rose-600" />
            <span className="leading-snug">{error}</span>
          </div>
        )}

        {/* ── Form Fields ── */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Customer */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Customer <span className="text-rose-500">*</span>
            </label>
            <select
              className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2.5 text-xs sm:text-sm text-slate-700 focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500 disabled:bg-slate-50 disabled:text-slate-400 transition-all cursor-pointer"
              value={customerId}
              onChange={(e) => {
                setCustomerId(e.target.value);
                setContractId("");
                setContractServiceId("");
              }}
              disabled={isPending}
              required
            >
              <option value="">— Pilih customer —</option>
              {(customerPage?.data ?? []).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.company_name}
                </option>
              ))}
            </select>
          </div>

          {/* Kontrak (opsional) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Kontrak (opsional)
            </label>
            <select
              className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2.5 text-xs sm:text-sm text-slate-700 focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500 disabled:bg-slate-50 disabled:text-slate-400 transition-all cursor-pointer"
              value={contractId}
              onChange={(e) => {
                setContractId(e.target.value);
                setContractServiceId("");
              }}
              disabled={!customerId || isPending}
            >
              <option value="">— Tidak ditautkan ke kontrak —</option>
              {(contractPage?.data ?? []).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.contract_number}
                </option>
              ))}
            </select>
          </div>

          {/* Layanan Kontrak (opsional jika ada di kontrak terpilih) */}
          {contractId && (selectedContract?.services ?? []).length > 0 && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Layanan Spesifik (opsional)
              </label>
              <select
                className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2.5 text-xs sm:text-sm text-slate-700 focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500 disabled:bg-slate-50 disabled:text-slate-400 transition-all cursor-pointer"
                value={contractServiceId}
                onChange={(e) => setContractServiceId(e.target.value)}
                disabled={isPending}
              >
                <option value="">— Tidak ditautkan ke layanan spesifik —</option>
                {(selectedContract?.services ?? []).map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.description}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Catatan */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Catatan
            </label>
            <textarea
              rows={3}
              className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2.5 text-xs sm:text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500 resize-none transition-all"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Catatan tambahan..."
              disabled={isPending}
            />
          </div>

          {/* ── Action Buttons ── */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={isPending || !customerId}
              className="flex-1 py-2.5 bg-[#E59B00] hover:bg-[#D48F00] active:bg-[#c28100] text-white font-bold rounded-lg text-xs sm:text-sm transition-all shadow-xs disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
            >
              {isPending ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Mengalokasikan...</span>
                </>
              ) : (
                <span>Alokasikan</span>
              )}
            </button>

            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="px-6 py-2.5 border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold rounded-lg text-xs sm:text-sm transition-colors cursor-pointer disabled:opacity-50"
            >
              Batal
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AllocateAddressModal;
