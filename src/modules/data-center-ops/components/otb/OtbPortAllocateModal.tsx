import React, { useState, useEffect } from "react";
import { Unplug, X, Loader2, Info, Building2, FileText, Layers, CheckCircle2 } from "lucide-react";
import type { Otb, OtbPort } from "../../types/otb";
import { useCustomerList } from "@modules/crm-sales/api/useCustomers";
import { useContractList, useContract } from "@modules/crm-sales/api/useContracts";
import { useAllocateOtbPort } from "../../api/useOtb";
import { extractErrorMessage } from "@shared/types/api";

export interface OtbPortAllocateModalProps {
  port: OtbPort | null;
  otb: Otb;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const OtbPortAllocateModal: React.FC<OtbPortAllocateModalProps> = ({
  port,
  otb,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const allocateMutation = useAllocateOtbPort();
  const { data: customerPage, isLoading: loadingCustomers } = useCustomerList({ per_page: 100 });

  const [customerId, setCustomerId] = useState("");
  const [contractId, setContractId] = useState("");
  const [contractServiceId, setContractServiceId] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Kontrak difilter per customer terpilih
  const { data: contractPage, isLoading: loadingContracts } = useContractList({
    per_page: 100,
    customer_id: customerId ? Number(customerId) : undefined,
  });

  // Baris layanan (ContractService) di dalam kontrak terpilih
  const { data: selectedContract, isLoading: loadingServices } = useContract(
    contractId ? Number(contractId) : undefined
  );

  // Reset form when modal opens or port changes
  useEffect(() => {
    if (isOpen) {
      setCustomerId("");
      setContractId("");
      setContractServiceId("");
      setNotes("");
      setError(null);
    }
  }, [isOpen, port]);

  // Esc key listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !allocateMutation.isPending && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, allocateMutation.isPending, onClose]);

  if (!isOpen || !port) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!port) return;
    if (!customerId) {
      setError("Pilih customer terlebih dahulu.");
      return;
    }

    try {
      await allocateMutation.mutateAsync({
        portId: port.id,
        values: {
          customer_id: Number(customerId),
          contract_service_id: contractServiceId ? Number(contractServiceId) : undefined,
          notes: notes.trim() || undefined,
        },
      });
      onSuccess?.();
      onClose();
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col p-6 animate-in zoom-in-95 duration-150 max-h-[92vh]">
        {/* ── Header ── */}
        <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200/80 shadow-2xs shrink-0">
              <Unplug size={22} className="stroke-[2.2]" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-amber-50 border border-amber-200/80 text-[10px] font-bold tracking-wider text-amber-800 uppercase mb-1">
                Alokasi Port Optik
              </div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
                Alokasikan Port #{port.port_number}
              </h2>
              <p className="text-xs text-slate-600 mt-0.5">
                Hubungkan port fisik ke customer CRM dan kontrak layanan aktif.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={allocateMutation.isPending}
            className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer shrink-0"
            aria-label="Tutup dialog"
          >
            <X size={18} />
          </button>
        </div>

        {/* ── Scrollable Form Body ── */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto pr-1 mt-4 space-y-4">
          {/* Card Ringkasan Port */}
          <div className="bg-gradient-to-r from-amber-50/60 to-orange-50/40 border border-amber-200/70 rounded-xl p-3.5 flex items-center justify-between text-xs">
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider">Unit OTB</span>
              <span className="font-mono font-bold text-slate-900 text-sm mt-0.5">{otb.tag_number}</span>
            </div>
            <div className="h-8 w-px bg-amber-200/80" />
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider">Nomor Port</span>
              <span className="font-mono font-bold text-amber-900 text-sm mt-0.5">#{port.port_number}</span>
            </div>
            <div className="h-8 w-px bg-amber-200/80" />
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider">Lokasi Rak</span>
              <span className="font-bold text-slate-900 text-sm mt-0.5">{otb.location ?? "—"}</span>
            </div>
          </div>

          {/* Form Field 1: Customer */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center gap-1.5">
              <Building2 size={13} className="text-amber-600" />
              <span>Customer <span className="text-rose-500">*</span></span>
            </label>
            <select
              className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all cursor-pointer disabled:bg-slate-50"
              value={customerId}
              onChange={(e) => {
                setCustomerId(e.target.value);
                setContractId("");
                setContractServiceId("");
              }}
              disabled={loadingCustomers}
            >
              <option value="">— Pilih Customer CRM —</option>
              {(customerPage?.data ?? []).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.company_name} ({c.customer_code ?? `#${c.id}`})
                </option>
              ))}
            </select>
            <p className="text-[11px] text-slate-500 mt-1">
              Pilih perusahaan pelanggan yang akan memakai port ini.
            </p>
          </div>

          {/* Form Field 2: Kontrak Layanan (Opsional) */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center gap-1.5">
              <FileText size={13} className="text-amber-600" />
              <span>Tautkan Kontrak (Opsional)</span>
            </label>
            <select
              className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all cursor-pointer disabled:bg-slate-50 disabled:text-slate-400"
              value={contractId}
              onChange={(e) => {
                setContractId(e.target.value);
                setContractServiceId("");
              }}
              disabled={!customerId || loadingContracts}
            >
              <option value="">— Tidak ditautkan ke kontrak —</option>
              {(contractPage?.data ?? []).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.contract_number} ({c.contract_type})
                </option>
              ))}
            </select>
            {customerId && !loadingContracts && (contractPage?.data ?? []).length === 0 && (
              <p className="text-[11px] text-amber-700 mt-1">
                Pelanggan ini belum memiliki kontrak aktif. Port tetap dapat dialokasikan tanpa kontrak.
              </p>
            )}
          </div>

          {/* Form Field 3: Layanan Spesifik (Jika kontrak dipilih) */}
          {contractId && (
            <div className="animate-in fade-in duration-150">
              <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center gap-1.5">
                <Layers size={13} className="text-amber-600" />
                <span>Baris Layanan Kontrak (Opsional)</span>
              </label>
              <select
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all cursor-pointer disabled:bg-slate-50"
                value={contractServiceId}
                onChange={(e) => setContractServiceId(e.target.value)}
                disabled={loadingServices}
              >
                <option value="">— Tidak ditautkan ke layanan spesifik —</option>
                {(selectedContract?.services ?? []).map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.description} ({s.service_type ?? "Service"})
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-slate-500 mt-1">
                Tautkan port langsung ke baris item layanan spesifik dalam kontrak terpilih.
              </p>
            </div>
          )}

          {/* Form Field 4: Catatan Tambahan */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1.5">
              Catatan Operasional (Opsional)
            </label>
            <textarea
              className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all resize-none"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Contoh: Sambungan ke switch core rak B02, vlan trunk 100..."
            />
          </div>

          {/* Banner Panduan Operasional */}
          <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-3 flex items-start gap-2.5">
            <Info size={15} className="text-amber-600 shrink-0 mt-0.5" />
            <p className="text-[11px] text-amber-900 leading-relaxed">
              <strong>Info Sistem:</strong> Port yang dialokasikan otomatis tampil pada portal <em>Customer 360</em> dan modul pemetaan topologi Data Center.
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-700 animate-in fade-in duration-150">
              {error}
            </div>
          )}

          {/* ── Footer Actions ── */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={allocateMutation.isPending}
              className="px-4 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={allocateMutation.isPending}
              className="px-4 py-2 text-xs font-bold text-white bg-[#E59B00] hover:bg-[#d48e00] active:bg-[#c28100] rounded-lg shadow-sm hover:shadow transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 min-w-[140px]"
            >
              {allocateMutation.isPending ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 size={14} />
                  <span>Alokasikan Port</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
