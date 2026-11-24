import { useState, useMemo, type FormEvent } from "react";
import {
  Plus,
  Upload,
  FileText,
  AlertCircle,
  X,
  DollarSign,
} from "lucide-react";
import { ProcurementFormModal } from "../ProcurementFormModal";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@shared/lib/api-client";
import { PrLineRow } from "./PrLineRow";
import { EmployeePickerField } from "./EmployeePickerField";
import type { PrFormValues, PrLineForm } from "../../types/pr";

interface Department {
  id: number;
  name: string;
}

interface CostCenter {
  id: number;
  code: string;
  name: string;
  budget_limit?: number;
}

async function fetchDepartments(orgId: number): Promise<Department[]> {
  try {
    const r = await apiClient.get<{ data?: { data?: Department[] } }>(
      "/v1/core-platform/departments",
      {
        params: { organization_id: orgId, per_page: 200 },
      }
    );
    return r.data?.data?.data ?? [];
  } catch {
    return [];
  }
}

async function fetchCostCenters(orgId: number): Promise<CostCenter[]> {
  try {
    const r = await apiClient.get<{ data?: CostCenter[] }>(
      "/v1/finance-accounting/cost-centers",
      {
        params: { organization_id: orgId },
      }
    );
    return r.data?.data ?? [];
  } catch {
    return [];
  }
}

interface PrFormModalProps {
  form: PrFormValues;
  setForm: React.Dispatch<React.SetStateAction<PrFormValues>>;
  lines: PrLineForm[];
  setLines: React.Dispatch<React.SetStateAction<PrLineForm[]>>;
  stagedFiles: File[];
  setStagedFiles: React.Dispatch<React.SetStateAction<File[]>>;
  error: string | null;
  isSaving: boolean;
  onSubmit: (e: FormEvent) => void;
  onClose: () => void;
  orgId: number;
}

export function PrFormModal({
  form,
  setForm,
  lines,
  setLines,
  stagedFiles,
  setStagedFiles,
  error: externalError,
  isSaving,
  onSubmit,
  onClose,
  orgId,
}: PrFormModalProps) {
  const [localError, setLocalError] = useState<string | null>(null);

  const { data: deptData } = useQuery({
    queryKey: ["departments", orgId],
    queryFn: () => fetchDepartments(orgId),
  });

  const { data: ccData } = useQuery({
    queryKey: ["cost-centers", orgId],
    queryFn: () => fetchCostCenters(orgId),
  });

  // Hitung total estimasi keseluruhan PR
  const totalEstimatedCost = useMemo(() => {
    return lines.reduce((acc, l) => acc + (l.quantity || 0) * (l.estimated_unit_price || 0), 0);
  }, [lines]);

  // Cari budget Cost Center
  const selectedCostCenter = useMemo(() => {
    return ccData?.find((c) => String(c.id) === String(form.cost_center_id));
  }, [ccData, form.cost_center_id]);

  // Simulasi pagu budget cost center jika tidak ada dari API: Rp 50.000.000
  const costCenterBudget = selectedCostCenter?.budget_limit ?? 50000000;
  const isBudgetExceeded = totalEstimatedCost > costCenterBudget;

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    setLocalError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setLocalError("Ukuran file lampiran maksimal 10MB.");
      return;
    }

    setStagedFiles((prev) => [...prev, file]);
    e.target.value = "";
  }

  function handleAddLine() {
    setLines((prev) => [
      ...prev,
      {
        item_id: null,
        item_name: "",
        line_type: "goods",
        description: "",
        quantity: 1,
        uom: "pcs",
        estimated_unit_price: 0,
        channel: "offline",
      },
    ]);
  }

  function handleRemoveLine(idx: number) {
    setLines((prev) => prev.filter((_, i) => i !== idx));
  }

  function handleUpdateLine(
    idx: number,
    field: keyof PrLineForm,
    value: unknown
  ) {
    setLines((prev) =>
      prev.map((l, i) => {
        if (i !== idx) return l;
        const u = { ...l, [field]: value };
        if (field === "item_id") {
          u.item_name = "";
        }
        if (field === "line_type" && value === "service") {
          u.item_id = null;
          u.item_name = "";
          u.uom = "paket";
        }
        return u;
      })
    );
  }

  function handleFormSubmit(e: FormEvent) {
    e.preventDefault();
    setLocalError(null);

    // 1. Validasi Tujuan
    if (!form.purpose || form.purpose.trim().length < 5) {
      setLocalError("Tujuan/keperluan pengadaan wajib diisi minimal 5 karakter.");
      return;
    }

    // 2. Validasi Tanggal Dibutuhkan
    if (!form.required_date) {
      setLocalError("Tanggal dibutuhkan barang/jasa wajib diisi.");
      return;
    }

    // 3. Validasi Baris Barang
    if (lines.length === 0) {
      setLocalError("Purchase Request minimal harus memiliki 1 baris barang atau jasa.");
      return;
    }

    // 4. Validasi Estimasi Harga > 0 (Aturan Wajib update-procurement)
    const zeroPriceLine = lines.find((l) => !l.estimated_unit_price || l.estimated_unit_price <= 0);
    if (zeroPriceLine) {
      setLocalError(
        `Estimasi harga wajib > 0 untuk semua baris item (periksa baris: "${
          zeroPriceLine.description || zeroPriceLine.item_name || "Tanpa deskripsi"
        }").`
      );
      return;
    }

    // 5. Validasi Justifikasi jika nominal besar (> 10 juta)
    if (totalEstimatedCost > 10000000 && (!form.justification || form.justification.trim().length < 10)) {
      setLocalError(
        "Untuk pengadaan di atas Rp 10.000.000, alasan/justifikasi kebutuhan wajib diisi lengkap."
      );
      return;
    }

    onSubmit(e);
  }

  const activeError = localError || externalError;

  return (
    <ProcurementFormModal
      title="Purchase Request (FPR) Baru"
      subtitle="Formulir pengajuan kebutuhan pengadaan barang atau jasa internal MSDC"
      icon={FileText}
      onClose={onClose}
      maxWidth="max-w-[820px]"
      footer={
        <div className="flex items-center justify-between w-full pt-2">
          {/* Total & Budget Indicator */}
          <div className="flex items-center gap-3">
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">
                Total Estimasi PR
              </span>
              <span className="text-base font-extrabold text-slate-900 font-mono">
                Rp {totalEstimatedCost.toLocaleString("id-ID")}
              </span>
            </div>

            {form.cost_center_id && (
              <div
                className={`px-2.5 py-1 rounded-xl text-xs flex items-center gap-1.5 border ${
                  isBudgetExceeded
                    ? "bg-red-50 text-red-700 border-red-200"
                    : "bg-emerald-50 text-emerald-700 border-emerald-200"
                }`}
              >
                <DollarSign size={13} />
                <span>
                  Budget CC: Rp {costCenterBudget.toLocaleString("id-ID")}
                </span>
                {isBudgetExceeded && <span className="font-bold text-[10px]">(OVER)</span>}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              form="pr-form-modal"
              disabled={isSaving}
              className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
            >
              {isSaving ? "Menyimpan PR..." : "Kirim Pengajuan PR"}
            </button>
          </div>
        </div>
      }
    >
      <form id="pr-form-modal" onSubmit={handleFormSubmit} className="flex flex-col gap-4 py-1">
        
        {/* Section 1: Informasi Pemohon & Urgensi */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {/* Diajukan atas nama */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Diajukan Atas Nama (Karyawan)
            </label>
            <EmployeePickerField
              employeeId={form.employee_id ?? ""}
              employeeName={form.employee_name ?? ""}
              onSelect={(emp) =>
                setForm({
                  ...form,
                  employee_id: emp?.id ?? null,
                  employee_name: emp?.full_name ?? null,
                })
              }
            />
          </div>

          {/* Prioritas & Tanggal Dibutuhkan */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Prioritas <span className="text-red-500">*</span>
              </label>
              <select
                className={`w-full px-3 py-2 border rounded-xl text-xs font-bold focus:outline-none transition-all ${
                  form.priority === "urgent"
                    ? "bg-rose-50 border-rose-300 text-rose-700"
                    : "bg-slate-50 border-slate-200 text-slate-800 focus:bg-white focus:border-amber-500"
                }`}
                value={form.priority ?? "normal"}
                onChange={(e) =>
                  setForm({ ...form, priority: e.target.value as "normal" | "urgent" })
                }
              >
                <option value="normal">Normal (Standar SLA)</option>
                <option value="urgent">Urgent / Mendesak</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Tgl Dibutuhkan <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-amber-500 font-mono"
                value={form.required_date ?? ""}
                onChange={(e) => setForm({ ...form, required_date: e.target.value })}
              />
            </div>
          </div>
        </div>

        {/* Tujuan Pengadaan */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Tujuan / Judul Pengadaan <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-amber-500 transition-all font-medium"
            placeholder="mis. Pengadaan 3 Unit Laptop Editing & Perbaikan AC Studio Surabaya"
            value={form.purpose ?? ""}
            onChange={(e) => setForm({ ...form, purpose: e.target.value })}
          />
        </div>

        {/* Departemen, Cost Center, & Jenis Kebutuhan */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Departemen Pemohon
            </label>
            <select
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-amber-500 transition-all"
              value={form.department_id ?? ""}
              onChange={(e) =>
                setForm({
                  ...form,
                  department_id: e.target.value ? Number(e.target.value) : null,
                })
              }
            >
              <option value="">— Pilih Departemen —</option>
              {deptData?.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Cost Center Pembebanan
            </label>
            <select
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-amber-500 transition-all"
              value={form.cost_center_id ?? ""}
              onChange={(e) =>
                setForm({
                  ...form,
                  cost_center_id: e.target.value ? Number(e.target.value) : null,
                })
              }
            >
              <option value="">— Pilih Cost Center —</option>
              {ccData?.map((cc) => (
                <option key={cc.id} value={cc.id}>
                  {cc.code} — {cc.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Jenis Kebutuhan
            </label>
            <select
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-amber-500 transition-all"
              value={form.need_type ?? "consumable"}
              onChange={(e) =>
                setForm({
                  ...form,
                  need_type: e.target.value as "restock" | "new_asset" | "consumable" | "service",
                })
              }
            >
              <option value="restock">Restock Stok Kritis Gudang</option>
              <option value="new_asset">Aset Tetap Baru Perusahaan</option>
              <option value="consumable">Barang Habis Pakai (Operasional)</option>
              <option value="service">Jasa Pemeliharaan / Perbaikan</option>
            </select>
          </div>
        </div>

        {/* Alasan / Justifikasi Kebutuhan */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Alasan / Justifikasi Pengadaan
          </label>
          <textarea
            rows={2}
            className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-amber-500 transition-all resize-none"
            placeholder="Jelaskan urgensi dan peruntukan barang/jasa yang diajukan..."
            value={form.justification ?? ""}
            onChange={(e) => setForm({ ...form, justification: e.target.value })}
          />
        </div>

        {/* Section 2: Baris Barang & Jasa */}
        <div className="flex flex-col gap-2 pt-2 border-t border-slate-100">
          <div className="flex items-center justify-between">
            <div>
              <label className="block text-xs font-bold text-slate-800">
                Daftar Barang / Jasa <span className="text-red-500">*</span>
              </label>
              <p className="text-[11px] text-slate-400">
                Pilih katalog barang atau ketik deskripsi jasa dengan satuan & estimasi harga wajib &gt; 0.
              </p>
            </div>
            <button
              type="button"
              onClick={handleAddLine}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-xs font-bold text-amber-700 transition-all cursor-pointer"
            >
              <Plus size={14} /> Tambah Item
            </button>
          </div>

          {/* List Input Baris */}
          <div className="flex flex-col gap-2.5 max-h-[280px] overflow-y-auto pr-1">
            {lines.map((line, idx) => (
              <PrLineRow
                key={idx}
                line={line}
                idx={idx}
                onUpdate={handleUpdateLine}
                onRemove={handleRemoveLine}
                canRemove={lines.length > 1}
                orgId={orgId}
              />
            ))}
          </div>
        </div>

        {/* Section 3: Lampiran Penunjang */}
        <div className="pt-2 border-t border-slate-100">
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Lampiran Dokumen Penunjang (Penawaran Awal, Foto Kerusakan, Brosur)
          </label>
          <div className="flex flex-col gap-2">
            {stagedFiles.map((file, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-2 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800"
              >
                <div className="flex items-center gap-2 truncate">
                  <FileText size={15} />
                  <span className="truncate">{file.name}</span>
                  <span className="text-[10px] text-slate-400">
                    ({(file.size / 1024 / 1024).toFixed(2)} MB)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setStagedFiles(stagedFiles.filter((_, fi) => fi !== i))}
                  className="text-red-500 hover:text-red-700 p-1 cursor-pointer"
                >
                  <X size={14} />
                </button>
              </div>
            ))}

            <label className="flex items-center justify-center gap-2 p-3 border-2 border-dashed border-slate-200 hover:border-amber-400 bg-slate-50/50 rounded-xl text-xs text-slate-500 hover:text-amber-600 transition-all cursor-pointer group">
              <Upload size={15} className="group-hover:text-amber-600" />
              <span>Klik untuk upload dokumen penunjang (PDF, XLS, PNG, Maks. 10MB)</span>
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.xlsx,.xls"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* Error Notification */}
        {activeError && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs flex items-center gap-2">
            <AlertCircle size={15} className="shrink-0" />
            <span>{activeError}</span>
          </div>
        )}
      </form>
    </ProcurementFormModal>
  );
}