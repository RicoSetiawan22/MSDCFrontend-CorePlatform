import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Plus,
  X,
  Upload,
  FileText,
  CheckCircle,
  ArrowLeft,
  Eye,
  Trash2,
  Building2,
  Calendar,
  BarChart3,
  ListOrdered,
  AlertTriangle,
} from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@shared/lib/api-client";
import { fileApi } from "@shared/api/fileApi";
import { downloadBlobAsFile } from "@shared/lib/downloadFile";
import { Button } from "@shared/components/Button";
import { Modal } from "@shared/components/Modal";
import { PdfPreviewModal } from "@shared/components/PdfPreviewModal";
import { ImagePreviewModal } from "@shared/components/ImagePreviewModal";
import { ApprovalStepsList } from "@shared/components/ApprovalStepsList";
import { InputField } from "@shared/components/InputField";
import { PageHeader } from "@shared/components/PageHeader";
import { LoadingState } from "@shared/components/LoadingState";
import { EmptyState } from "@shared/components/EmptyState";
import { extractErrorMessage } from "@shared/types/api";
import { useActiveOrgId } from "@shared/lib/organization-context";
import { formatCurrency, formatDate } from "@shared/lib/format";
import { quotationApi } from "../api/quotationApi";
import type {
  VendorQuotation,
  QuotationCompareResult,
  QuoteItem,
  VendorTotal,
  QuotationCompareRow,
} from "../api/quotationApi";

const { listByPr, create, compare, pickVendor } = quotationApi;

// ─── Main Page ─────────────────────────────────────────────────────────────────────
export function VendorQuotationPage() {
  const orgId = useActiveOrgId();
  const [searchParams, setSearchParams] = useSearchParams();
  const prParam = searchParams.get("pr");
  const [selectedPrId, setSelectedPrIdState] = useState<number | null>(
    prParam ? Number(prParam) : null,
  );
  const [activeTab, setActiveTab] = useState<"list" | "compare">("list");
  
  const [deletedQuotationIds, setDeletedQuotationIds] = useState<number[]>(() => {
    try {
      const saved = localStorage.getItem("deletedQuotationIds");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  function setSelectedPrId(id: number | null) {
    setSelectedPrIdState(id);
    setSearchParams(id ? { pr: String(id) } : {});
  }

  const { data: approvedPrs, isLoading: loadingPrs } = useQuery({
    queryKey: ["pr-approved-for-quotation", orgId],
    queryFn: () =>
      apiClient
        .get<any>("/v1/procurement-inventory/purchase-requests", {
          params: { organization_id: orgId, status: "approved", per_page: 100 },
        })
        .then((r) => r.data?.data ?? []),
  });

  const selectedPr = approvedPrs?.find((p: any) => p.id === selectedPrId);

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-16">
      <PageHeader
        title="Vendor Quotation (RFQ)"
        subtitle="Kelola penawaran harga dari vendor untuk PR yang sudah disetujui — bandingkan dan tentukan pemenangnya."
        containerClassName="px-8 pt-6 pb-3"
      />

      <div className="flex flex-col gap-6 px-8 py-4">
        {!selectedPrId && (
          <div className="bg-white rounded-2xl border border-slate-200/70 p-6 shadow-xs flex flex-col gap-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-2 h-6 bg-amber-500 rounded-full" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  Pilih Purchase Request (PR)
                </span>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200/50">
                {approvedPrs?.length ?? 0} PR Approved
              </span>
            </div>

            {loadingPrs && <LoadingState />}
            {!loadingPrs && (approvedPrs ?? []).length === 0 && (
              <EmptyState
                title="Belum Ada PR Approved"
                subtitle="RFQ hanya dapat dimulai untuk Purchase Request yang statusnya sudah Approved."
              />
            )}
            {!loadingPrs && (approvedPrs ?? []).length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {(approvedPrs ?? []).map((pr: any) => (
                  <button
                    key={pr.id}
                    type="button"
                    onClick={() => setSelectedPrId(pr.id)}
                    className="text-left bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden cursor-pointer flex flex-col p-0 group transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-amber-400"
                  >
                    <div className="h-1.5 bg-slate-800 w-full transition-colors duration-300 group-hover:bg-amber-500" />
                    <div className="p-5 flex flex-col gap-3.5 w-full">
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2.5 py-1 rounded-lg">
                          {pr.pr_number}
                        </span>
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/50">
                          Approved
                        </span>
                      </div>
                      <div className="font-semibold text-sm text-slate-800 line-clamp-2 min-h-[2.5rem]">
                        {pr.purpose ?? "—"}
                      </div>
                      <div className="flex flex-col gap-1.5 pt-3 border-t border-slate-100 text-xs text-slate-500">
                        {pr.requester?.name && (
                          <div className="flex items-center gap-2">
                            <Building2 size={13} className="text-slate-400" />
                            <span className="truncate font-medium text-slate-700">{pr.requester.name}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <Calendar size={13} className="text-slate-400" />
                          <span>{pr.lines?.length ?? 0} item · {formatDate(pr.created_at)}</span>
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {selectedPrId && (
          <>
            <div className="bg-white rounded-2xl border border-slate-200/70 shadow-xs flex flex-col overflow-hidden">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-6 py-4 bg-slate-50/50 border-b border-slate-100 gap-4">
                <button
                  onClick={() => setSelectedPrId(null)}
                  className="bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200/60 px-3.5 py-2 rounded-xl cursor-pointer flex items-center gap-2 text-xs font-bold transition-all shadow-2xs"
                >
                  <ArrowLeft size={14} /> Ganti PR
                </button>
                <div className="flex flex-col sm:items-end w-full sm:w-auto">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">PR Terpilih:</span>
                    <span className="font-bold font-mono text-xs text-slate-900 bg-white px-2.5 py-0.5 rounded-lg border border-slate-200/70 shadow-2xs">
                      {selectedPr?.pr_number}
                    </span>
                  </div>
                  <div className="text-xs font-medium text-slate-600 mt-1 max-w-md truncate">
                    {selectedPr?.purpose}
                  </div>
                </div>
              </div>
              <div className="flex bg-white px-6 pt-2 gap-4">
                {(["list", "compare"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setActiveTab(t)}
                    className={`pb-3 px-4 border-none bg-transparent cursor-pointer text-xs font-bold transition-all flex items-center gap-2 border-b-2 ${
                      activeTab === t
                        ? "text-amber-600 border-amber-500"
                        : "text-slate-400 border-transparent hover:text-slate-600"
                    }`}
                  >
                    {t === "list" ? <ListOrdered size={15} /> : <BarChart3 size={15} />}
                    {t === "list" ? "Daftar Quotation Vendor" : "Perbandingan & Analisis"}
                  </button>
                ))}
              </div>
            </div>

            {activeTab === "list" && (
              <QuotationListSection
                prId={selectedPrId}
                pr={selectedPr}
                deletedQuotationIds={deletedQuotationIds}
                setDeletedQuotationIds={setDeletedQuotationIds}
              />
            )}

            {activeTab === "compare" && (
              <ComparisonSection
                prId={selectedPrId}
                deletedQuotationIds={deletedQuotationIds}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ─── List + Input Quotation ────────────────────────────────────────────────    
function QuotationListSection({
  prId,
  pr,
  deletedQuotationIds,
  setDeletedQuotationIds,
}: {
  prId: number;
  pr: any;
  deletedQuotationIds: number[];
  setDeletedQuotationIds: React.Dispatch<React.SetStateAction<number[]>>;
}) {
  const [showForm, setShowForm] = useState(false);
  const qc = useQueryClient();

  const { data: quotations = [], isLoading } = useQuery({
    queryKey: ["vendor-quotations", prId],
    queryFn: () => listByPr(prId).then((r: any) => r.data.data ?? []),
  });

  const { data: vendors } = useQuery({
    queryKey: ["vendors-all", pr?.organization_id],
    queryFn: () =>
      apiClient
        .get<any>("/v1/procurement-inventory/vendors", {
          params: { organization_id: pr?.organization_id, per_page: 200 },
        })
        .then((r) => r.data?.data ?? []),
  });

  const existingVendorIds = new Set(
    (quotations ?? []).map((q: VendorQuotation) => q.vendor_id),
  );
  const availableVendors = (vendors ?? []).filter(
    (v: any) => !existingVendorIds.has(v.id),
  );

  return (
    <>
      <div className="bg-white rounded-2xl border border-slate-200/70 p-6 shadow-xs flex flex-col gap-5">
        <div className="flex justify-between items-center pb-2">
          <div>
            <h3 className="text-sm font-bold text-slate-900 m-0">Daftar Quotation Vendor</h3>
            <p className="text-xs text-slate-500 mt-0.5">Kelola dokumen dan rincian penawaran harga dari vendor.</p>
          </div>
          {availableVendors.length > 0 && (
            <Button onClick={() => setShowForm(true)} className="bg-amber-500 hover:bg-amber-600 text-white font-medium px-4 py-2 rounded-xl text-xs shadow-xs transition-all">
              <Plus size={15} /> Input Quotation Baru
            </Button>
          )}
        </div>

        {isLoading && <LoadingState />}
        {!isLoading && (!quotations || quotations.length === 0) && (
          <EmptyState
            title="Belum Ada Quotation"
            subtitle="Silakan input quotation baru dari masing-masing vendor terkait."
          />
        )}
        {!isLoading && quotations && quotations.length > 0 && (
          <div className="overflow-x-auto rounded-xl border border-slate-100">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-200 text-slate-600 text-[11px] font-bold uppercase tracking-wider">
                  <th className="py-3 px-4 text-center">No Quotation</th>
                  <th className="py-3 px-4 text-center">Vendor</th>
                  <th className="py-3 px-4 text-center">Tanggal</th>
                  <th className="py-3 px-4 text-center">Valid Until</th>
                  <th className="py-3 px-4 text-center">Total</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {quotations
                  .filter((q: VendorQuotation) => !deletedQuotationIds.includes(q.id))
                  .map((q: VendorQuotation) => (
                    <tr key={q.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-4 text-center font-mono font-medium text-slate-800">
                        {q.quotation_number}
                      </td>
                      <td className="py-3.5 px-4 text-left font-semibold text-slate-900">
                       {q.vendor?.vendor_name ?? "—"}
                      </td>
                      <td className="py-3.5 px-4 text-center text-slate-600">{q.quotation_date ? formatDate(q.quotation_date) : "—"}</td>
                      <td className="py-3.5 px-4 text-center text-slate-600">{q.valid_until ? formatDate(q.valid_until) : "—"}</td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900">
                        {formatCurrency(Number(q.total_amount))}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            q.status === "submitted"
                              ? "bg-amber-50 text-amber-700 border border-amber-200/60"
                              : q.status === "accepted"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200/60"
                              : "bg-rose-50 text-rose-700 border border-rose-200/60"
                          }`}
                        >
                          {q.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex justify-center items-center gap-1.5">
                          {/* Tombol Detail */}
                          <div className="inline-flex">
                            <QuotationDetailBtn quotation={q} />
                          </div>

                          {/* Tombol Hapus */}
                          <button
                            type="button"
                            title="Hapus Quotation"
                            onClick={() => {
                              const confirmed = window.confirm(
                                "Apakah Anda yakin ingin menghapus quotation ini dari daftar?"
                              );
                              if (confirmed) {
                                setDeletedQuotationIds((prev) => {
                                  const updated = prev.includes(q.id) ? prev : [...prev, q.id];
                                  localStorage.setItem("deletedQuotationIds", JSON.stringify(updated));
                                  return updated;
                                });
                              }
                            }}
                            className="p-1.5 rounded-xl border border-rose-200 bg-rose-50/60 hover:bg-rose-100 text-rose-600 transition-all flex items-center justify-center cursor-pointer shadow-2xs"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showForm && (
        <InputQuotationModal
          prId={prId}
          prLines={pr?.lines ?? []}
          vendors={availableVendors}
          onClose={() => setShowForm(false)}
          onSaved={() => {
            setShowForm(false);
            qc.invalidateQueries({ queryKey: ["vendor-quotations", prId] });
          }}
        />
      )}
    </>
  );
}

// ─── Input Quotation Modal ────────────────────────────────────────────────────────
interface QuotationLineForm {
  pr_line_id?: number;
  description: string;
  quantity: number;
  uom: string;
  unit_price: number;
  discount_pct: number;
}

function InputQuotationModal({
  prId,
  prLines,
  vendors,
  onClose,
  onSaved,
}: {
  prId: number;
  prLines: any[];
  vendors: any[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [vendorId, setVendorId] = useState("");
  const [quotationDate, setQuotationDate] = useState("");
  const [validUntil, setValidUntil] = useState("");
  const [taxAmount, setTaxAmount] = useState("0");
  const [notes, setNotes] = useState("");
  const [paymentTerms, setPaymentTerms] = useState("");
  const [deliveryTerms, setDeliveryTerms] = useState("");
  const [shippingCost, setShippingCost] = useState("0");
  const [leadTime, setLeadTime] = useState("7");
  const [warranty, setWarranty] = useState("1 Tahun Garansi Resmi");

  const [lines, setLines] = useState<QuotationLineForm[]>(
    prLines.length > 0
      ? prLines.map((l: any) => ({
          pr_line_id: l.id,
          description: l.description,
          quantity: Number(l.quantity),
          uom: l.uom,
          unit_price: Number(l.estimated_unit_price ?? 0),
          discount_pct: 0,
        }))
      : [
          {
            description: "",
            quantity: 1,
            uom: "pcs",
            unit_price: 0,
            discount_pct: 0,
          },
        ],
  );
  const [uploadedFileIds, setUploadedFileIds] = useState<number[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function updateLine(idx: number, field: keyof QuotationLineForm, value: any) {
    setLines((prev) =>
      prev.map((l, i) => (i !== idx ? l : { ...l, [field]: value })),
    );
  }

  function addLine() {
    setLines((prev) => [
      ...prev,
      {
        description: "",
        quantity: 1,
        uom: "pcs",
        unit_price: 0,
        discount_pct: 0,
      },
    ]);
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const r = await fileApi.upload(file, "procurement", "VendorQuotation");
      const newFile = r.data.data;
      setUploadedFiles((prev) => [...prev, newFile]);
      setUploadedFileIds((prev) => [...prev, newFile.id]);
    } catch {}
    e.target.value = "";
  }

  async function handleRemoveFile(file: any) {
    try {
      await apiClient.delete(`/v1/core-platform/files/${file.id}`);
      setUploadedFiles((prev) => prev.filter((f) => f.id !== file.id));
      setUploadedFileIds((prev) => prev.filter((id) => id !== file.id));
    } catch {}
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!vendorId) {
      setError("Vendor wajib dipilih.");
      return;
    }
    const validLines = lines.filter((l) => l.description.trim());
    if (validLines.length === 0) {
      setError("Minimal 1 baris quotation.");
      return;
    }

    setSaving(true);
    try {
      const combinedNotes = [
        notes,
        leadTime ? `Lead Time: ${leadTime} hari` : null,
        Number(shippingCost) > 0 ? `Ongkir: Rp ${Number(shippingCost).toLocaleString("id-ID")}` : null,
        warranty ? `Garansi: ${warranty}` : null,
      ]
        .filter(Boolean)
        .join(" | ");

      await create(prId, {
        vendor_id: Number(vendorId),
        quotation_date: quotationDate || undefined,
        valid_until: validUntil || undefined,
        tax_amount: Number(taxAmount) || 0,
        notes: combinedNotes || undefined,
        payment_terms: paymentTerms || undefined,
        delivery_terms: deliveryTerms || undefined,
        file_ids: uploadedFileIds.length > 0 ? uploadedFileIds : undefined,
        lines: validLines,
      });
      onSaved();
    } catch (err: any) {
      setError(extractErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  const subtotal = lines.reduce(
    (s, l) =>
      s +
      Number(l.quantity) *
        Number(l.unit_price) *
        (1 - Number(l.discount_pct) / 100),
    0,
  );
  const tax = Number(taxAmount) || 0;
  const total = subtotal + tax;

  return (
    <Modal title="Input Vendor Quotation" onClose={onClose} maxWidth={800}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-xs">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="input-label font-semibold text-slate-700">Vendor *</label>
            <select
              className="input w-full bg-slate-50/50"
              value={vendorId}
              onChange={(e) => setVendorId(e.target.value)}
            >
              <option value="">— Pilih Vendor —</option>
              {vendors.map((v: any) => (
                <option key={v.id} value={v.id}>
                  {v.vendor_name}
                </option>
              ))}
            </select>
          </div>
          <InputField
            label="Tanggal Quotation"
            type="date"
            value={quotationDate}
            onChange={(e: any) => setQuotationDate(e.target.value)}
          />
          <InputField
            label="Berlaku Hingga"
            type="date"
            value={validUntil}
            onChange={(e: any) => setValidUntil(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InputField
            label="Term Pembayaran"
            value={paymentTerms}
            onChange={(e: any) => setPaymentTerms(e.target.value)}
            placeholder="mis. Net 30"
          />
          <InputField
            label="Term Pengiriman"
            value={deliveryTerms}
            onChange={(e: any) => setDeliveryTerms(e.target.value)}
            placeholder="mis. DDP, FOB"
          />
        </div>

        {/* Ongkos Kirim, Lead Time, Garansi */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <InputField
            label="Ongkos Kirim (Rp)"
            type="number"
            value={shippingCost}
            onChange={(e: any) => setShippingCost(e.target.value)}
            placeholder="0"
          />
          <InputField
            label="Lead Time (Hari)"
            type="number"
            value={leadTime}
            onChange={(e: any) => setLeadTime(e.target.value)}
            placeholder="7"
          />
          <InputField
            label="Ketentuan Garansi"
            value={warranty}
            onChange={(e: any) => setWarranty(e.target.value)}
            placeholder="1 Tahun Garansi Resmi"
          />
        </div>

        <div>
          <label className="input-label font-semibold text-slate-700 mb-1 block">Lampiran Dokumen Vendor</label>
          <div className="flex flex-col gap-2">
            {uploadedFiles.map((f) => (
              <div
                key={f.id}
                className="flex items-center gap-2 px-3 py-2 bg-emerald-50/60 border border-emerald-200/50 rounded-xl text-xs text-emerald-900"
              >
                <FileText size={15} className="text-emerald-600 shrink-0" />
                <span className="flex-1 truncate font-medium">{f.original_name ?? f.name}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveFile(f)}
                  className="border-none bg-transparent text-rose-600 cursor-pointer p-1 hover:bg-rose-50 rounded-lg"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
            <label className="flex items-center justify-center gap-2 p-3 border border-dashed border-slate-300 rounded-xl cursor-pointer text-xs text-slate-600 hover:bg-slate-50 transition-all">
              <Upload size={15} className="text-slate-400" />
              <span className="font-medium">Upload dokumen penawaran (PDF, JPG, XLSX — maks 50MB)</span>
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.xlsx,.xls"
                onChange={handleUpload}
                className="hidden"
              />
            </label>
          </div>
        </div>

        <div className="flex justify-between items-center pt-2 border-t border-slate-100">
          <label className="input-label font-bold text-slate-800 m-0">Rincian Barang / Jasa</label>
          <button
            type="button"
            className="border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 px-3 py-1.5 rounded-xl cursor-pointer flex items-center gap-1 text-xs font-semibold shadow-2xs"
            onClick={addLine}
          >
            <Plus size={13} /> Tambah Baris
          </button>
        </div>

        <div className="flex flex-col gap-2 max-h-56 overflow-y-auto pr-1">
          {lines.map((line, idx) => (
            <div
              key={idx}
              className="grid grid-cols-[2fr_70px_80px_90px_70px_32px] gap-2 items-center bg-slate-50/70 p-2 rounded-xl border border-slate-200/60"
            >
              <input
                className="input bg-white text-xs"
                value={line.description}
                onChange={(e) => updateLine(idx, "description", e.target.value)}
                placeholder="Nama barang..."
              />
              <input
                className="input bg-white text-xs text-center"
                type="number"
                min={0.0001}
                step="any"
                value={line.quantity}
                onFocus={(e: any) => e.target.select()}
                onChange={(e: any) => updateLine(idx, "quantity", Number(e.target.value))}
              />
              <input
                className="input bg-white text-xs text-center"
                value={line.uom}
                onChange={(e) => updateLine(idx, "uom", e.target.value)}
                placeholder="Satuan"
              />
              <input
                className="input bg-white text-xs font-mono"
                type="number"
                min={0}
                step="any"
                value={line.unit_price || ""}
                onFocus={(e: any) => e.target.select()}
                onChange={(e: any) => updateLine(idx, "unit_price", Number(e.target.value))}
                placeholder="Harga"
              />
              <input
                className="input bg-white text-xs text-center font-mono"
                type="number"
                min={0}
                max={100}
                step="any"
                value={line.discount_pct || ""}
                onChange={(e: any) => updateLine(idx, "discount_pct", Number(e.target.value))}
                placeholder="Disc%"
              />
              <button
                type="button"
                onClick={() => setLines((p) => p.filter((_, i) => i !== idx))}
                className="border-none bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg p-1.5 cursor-pointer flex justify-center items-center"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-[1fr_auto] gap-2 p-4 bg-slate-50 border border-slate-200/70 rounded-xl text-xs">
          <span className="text-slate-600">Subtotal</span>
          <span className="font-mono text-right font-medium">{formatCurrency(subtotal)}</span>
          <span className="text-slate-600">PPN / Tax</span>
          <div className="flex items-center gap-2 justify-end">
            <span className="text-slate-400">Rp</span>
            <input
              className="input w-32 text-xs py-1 px-2.5 font-mono bg-white"
              type="number"
              min={0}
              step="any"
              value={taxAmount}
              onChange={(e: any) => setTaxAmount(e.target.value)}
            />
          </div>
          <strong className="text-slate-900 text-sm">Total Keseluruhan</strong>
          <strong className="font-mono text-right text-sm text-slate-900">
            {formatCurrency(total)}
          </strong>
        </div>

        <InputField
          label="Catatan Tambahan"
          value={notes}
          onChange={(e: any) => setNotes(e.target.value)}
          placeholder="Catatan khusus dari vendor..."
        />

        {error && <div className="input-error text-rose-600 bg-rose-50 p-2.5 rounded-xl">{error}</div>}

        <div className="flex gap-2.5 justify-end pt-3 border-t border-slate-100">
          <Button type="button" variant="secondary" onClick={onClose} className="px-4 py-2">
            Batal
          </Button>
          <Button type="submit" disabled={saving} className="bg-amber-500 hover:bg-amber-600 text-white px-5 py-2">
            {saving ? "Menyimpan..." : "💾 Simpan Quotation"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

// ─── Quotation Detail ───────────────────────────────────────────────────────────
function QuotationDetailBtn({ quotation }: { quotation: VendorQuotation }) {
  const [open, setOpen] = useState(false);
  const [previewFile, setPreviewFile] = useState<{
    blob: Blob;
    filename: string;
    isImage: boolean;
  } | null>(null);

  const { data: files } = useQuery({
    queryKey: ["qt-files", quotation.id],
    queryFn: () => quotationApi.listFiles(quotation.id).then((r: any) => r.data.data ?? []),
    enabled: open,
  });

  async function handleOpenFile(f: any) {
    try {
      const res = await apiClient.get(
        `/v1/core-platform/files/${f.id}/download`,
        { responseType: "blob" },
      );
      const filename = f.original_name ?? f.name ?? "file";
      const mimeType = f.mime_type ?? res.data?.type ?? "";
      if (mimeType === "application/pdf") {
        setPreviewFile({ blob: res.data, filename, isImage: false });
      } else if (mimeType.startsWith("image/")) {
        setPreviewFile({ blob: res.data, filename, isImage: true });
      } else {
        downloadBlobAsFile(res.data, filename);
      }
    } catch (err) {
      alert(extractErrorMessage(err));
    }
  }

  return (
    <>
      <button
        type="button"
        title="Lihat Detail Quotation"
        onClick={() => setOpen(true)}
        className="p-1.5 rounded-xl border border-blue-200 bg-blue-50/60 hover:bg-blue-100 text-blue-600 transition-all flex items-center justify-center cursor-pointer shadow-2xs"
      >
        <Eye size={14} />
      </button>
      {open && (
        <Modal
          title={`Detail Quotation — ${quotation.quotation_number}`}
          onClose={() => setOpen(false)}
          maxWidth={680}
        >
          <div className="flex flex-col gap-4 text-xs">
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
              <table className="w-full border-collapse">
                <tbody>
                  {[
                    { label: "Vendor", value: quotation.vendor?.vendor_name ?? "—" },
                    { label: "Tanggal Penawaran", value: quotation.quotation_date ? formatDate(quotation.quotation_date) : "—" },
                    { label: "Berlaku Hingga", value: quotation.valid_until ? formatDate(quotation.valid_until) : "—" },
                    { label: "Subtotal", value: formatCurrency(Number(quotation.subtotal)) },
                    { label: "PPN / Tax", value: formatCurrency(Number(quotation.tax_amount)) },
                    { label: "Total Pembayaran", value: formatCurrency(Number(quotation.total_amount)), bold: true },
                  ].map((item, idx) => (
                    <tr key={item.label} className={idx % 2 === 0 ? "bg-slate-50/50" : "bg-white"}>
                      <td className="p-3 border-b border-slate-100 font-semibold text-slate-600 w-1/3">
                        {item.label}
                      </td>
                      <td className={`p-3 border-b border-slate-100 text-slate-800 font-mono ${item.bold ? "font-bold text-slate-900 text-sm" : ""}`}>
                        {item.value}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200/60">
              {quotation.payment_terms && (
                <div>
                  <span className="text-slate-400 block font-semibold mb-0.5">Term Pembayaran:</span>
                  <span className="text-slate-800 font-medium">{quotation.payment_terms}</span>
                </div>
              )}
              {quotation.delivery_terms && (
                <div>
                  <span className="text-slate-400 block font-semibold mb-0.5">Term Pengiriman:</span>
                  <span className="text-slate-800 font-medium">{quotation.delivery_terms}</span>
                </div>
              )}
            </div>

            {quotation.notes && (
              <div className="bg-amber-50/50 border border-amber-200/60 p-3.5 rounded-xl">
                <span className="text-amber-800 font-bold block mb-0.5">Catatan / Detail Tambahan Vendor:</span>
                <span className="text-amber-900">{quotation.notes}</span>
              </div>
            )}

            {quotation.lines && quotation.lines.length > 0 && (
              <div>
                <div className="font-bold text-slate-800 mb-2">Rincian Barang / Jasa:</div>
                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                        <th className="p-2.5 text-center">Deskripsi</th>
                        <th className="p-2.5 text-center">Qty</th>
                        <th className="p-2.5 text-center">Satuan</th>
                        <th className="p-2.5 text-center">Harga Satuan</th>
                        <th className="p-2.5 text-center">Disc%</th>
                        <th className="p-2.5 text-center">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {quotation.lines.map((l) => (
                        <tr key={l.id} className="hover:bg-slate-50/50">
                          <td className="p-2.5 font-medium text-slate-900">{l.description}</td>
                          <td className="p-2.5 text-center text-slate-600">{Number(l.quantity)}</td>
                          <td className="p-2.5 text-center text-slate-600">{l.uom}</td>
                          <td className="p-2.5 text-right font-mono text-slate-600">{formatCurrency(Number(l.unit_price))}</td>
                          <td className="p-2.5 text-center text-slate-600">{Number(l.discount_pct)}%</td>
                          <td className="p-2.5 text-right font-mono font-bold text-slate-900">{formatCurrency(Number(l.line_total))}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {files && files.length > 0 && (
              <div>
                <div className="font-bold text-slate-800 mb-2">Lampiran Dokumen:</div>
                <div className="flex flex-col gap-1.5">
                  {files.map((f: any) => (
                    <div
                      key={f.id}
                      className="flex items-center gap-2 px-3 py-2 bg-emerald-50/60 border border-emerald-200/50 rounded-xl text-xs text-emerald-900"
                    >
                      <FileText size={15} className="text-emerald-600 shrink-0" />
                      <button
                        type="button"
                        onClick={() => handleOpenFile(f)}
                        className="flex-1 border-none bg-transparent p-0 text-left cursor-pointer text-emerald-700 hover:underline font-medium"
                      >
                        {f.original_name ?? f.name}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-2 flex justify-end">
              <Button onClick={() => setOpen(false)} variant="secondary" className="px-5">
                Tutup
              </Button>
            </div>
          </div>
        </Modal>
      )}
      {previewFile && !previewFile.isImage && (
        <PdfPreviewModal
          title={previewFile.filename}
          blob={previewFile.blob}
          filename={previewFile.filename}
          onClose={() => setPreviewFile(null)}
        />
      )}
      {previewFile && previewFile.isImage && (
        <ImagePreviewModal
          title={previewFile.filename}
          blob={previewFile.blob}
          filename={previewFile.filename}
          onClose={() => setPreviewFile(null)}
        />
      )}
    </>
  );
}

// ─── Comparison Section & Other Components ──────────────────────────────────────

function QuotationPdfBtn({ quotation }: { quotation: VendorQuotation }) {
  const [previewFile, setPreviewFile] = useState<{
    blob: Blob;
    filename: string;
  } | null>(null);

  const { data: files, isLoading } = useQuery({
    queryKey: ["qt-files", quotation.id],
    queryFn: () =>
      quotationApi.listFiles(quotation.id).then((r: any) => r.data.data ?? []),
  });

  // Ambil SEMUA dokumen PDF, bukan hanya PDF pertama.
  const pdfFiles = (files ?? []).filter((file: any) => {
    const filename = (
      file.original_name ??
      file.name ??
      file.filename ??
      ""
    ).toLowerCase();

    return (
      file.mime_type === "application/pdf" ||
      filename.endsWith(".pdf")
    );
  });

  async function handleOpenPdf(file: any) {
    try {
      const response = await apiClient.get(
        `/v1/core-platform/files/${file.id}/download`,
        { responseType: "blob" }
      );

      setPreviewFile({
        blob: response.data,
        filename:
          file.original_name ??
          file.name ??
          file.filename ??
          "quotation.pdf",
      });
    } catch (error) {
      console.error("Gagal membuka PDF penawaran:", error);
      alert("Dokumen PDF gagal dibuka. Silakan coba kembali.");
    }
  }

  if (isLoading) {
    return <span className="text-slate-400">Memuat dokumen...</span>;
  }

  if (pdfFiles.length === 0) {
    return (
      <span className="text-slate-400" title="PDF penawaran tidak tersedia">
        —
      </span>
    );
  }

  return (
    <>
      <div className="flex flex-col items-center gap-2 min-w-[150px] py-1">
        {pdfFiles.map((file: any, index: number) => {
          const filename =
            file.original_name ??
            file.name ??
            file.filename ??
            `Dokumen ${index + 1}.pdf`;

          return (
            <button
              key={file.id}
              type="button"
              title={`Buka ${filename}`}
              onClick={() => handleOpenPdf(file)}
              className="flex w-full max-w-[240px] items-center gap-2 rounded-lg border border-rose-200 bg-rose-50/70 px-3 py-2 text-left text-rose-700 transition-colors hover:bg-rose-100"
            >
              <FileText size={16} className="shrink-0 text-rose-600" />

              <span className="min-w-0 flex-1">
                <span className="block text-[10px] font-semibold text-rose-500">
                  Dokumen {index + 1}
                </span>
                <span className="block break-words text-xs font-medium">
                  {filename}
                </span>
              </span>

              <Eye size={14} className="shrink-0" />
            </button>
          );
        })}
      </div>

      {previewFile && (
        <PdfPreviewModal
          title={previewFile.filename}
          blob={previewFile.blob}
          filename={previewFile.filename}
          onClose={() => setPreviewFile(null)}
        />
      )}
    </>
  );
}


function ComparisonSection({ prId, deletedQuotationIds }: { prId: number; deletedQuotationIds: number[] }) {
  const qc = useQueryClient();
  const [pickedQtId, setPickedQtId] = useState<number | null>(null);
  const [pickingNotes, setPickingNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["qt-compare", prId],
    queryFn: () => compare(prId).then((r: any) => r.data.data),
  });
  const { data: quotations = [] } = useQuery({
    queryKey: ["vendor-quotations", prId],
    queryFn: () => listByPr(prId).then((r: any) => r.data.data ?? []),
  });
  const { data: picking } = useQuery({
    queryKey: ["pr-picking", prId],
    queryFn: () =>
      apiClient
        .get<any>(`/v1/procurement-inventory/purchase-requests/${prId}/quotations/picking`)
        .then((r) => r.data?.data ?? null),
  });

  async function handlePick() {
    if (!pickedQtId) {
      setError("Pilih salah satu vendor pemenang terlebih dahulu.");
      return;
    }
    if (!pickingNotes.trim() || pickingNotes.trim().length < 10) {
      setError("Alasan/justifikasi penunjukan vendor wajib diisi minimal 10 karakter untuk keperluan audit.");
      return;
    }

    setError(null);
    setSaving(true);
    try {
      await pickVendor(prId, { quotation_id: pickedQtId, notes: pickingNotes.trim() || undefined });
      qc.invalidateQueries({ queryKey: ["qt-compare", prId] });
      qc.invalidateQueries({ queryKey: ["vendor-quotations", prId] });
      qc.invalidateQueries({ queryKey: ["pr-picking", prId] });
    } catch (err: any) {
      setError(extractErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  if (isLoading) return <LoadingState />;
  if (!data) return null;

  const { vendor_totals, comparison } = data as QuotationCompareResult;

  const visibleVendorTotals = vendor_totals.filter(
    (vt: VendorTotal) =>
      !deletedQuotationIds.includes(vt.quotation_id) &&
      quotations.some((q: VendorQuotation) => q.id === vt.quotation_id),
  );

  const visibleQuotationIds = new Set(visibleVendorTotals.map((vt: VendorTotal) => vt.quotation_id));

  const visibleComparison = comparison?.map((row: QuotationCompareRow) => ({
    ...row,
    quotes: row.quotes?.filter((q: QuoteItem) => visibleQuotationIds.has(q.quotation_id)),
  }));

  if (visibleVendorTotals.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/70 p-6 shadow-xs flex flex-col gap-4">
        <EmptyState
          title="Belum Ada Quotation"
          subtitle="Input quotation vendor terlebih dahulu untuk mulai membandingkan."
        />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200/70 p-6 shadow-xs flex flex-col gap-6">
      <div>
        <h3 className="text-sm font-bold text-slate-900 m-0">Perbandingan & Analisis Vendor</h3>
        <p className="text-xs text-slate-500 mt-0.5">Evaluasi total penawaran harga terbaik untuk menentukan vendor pemenang.</p>
      </div>

      {/* Peringatan Audit Single Source bila vendor yang dibandingkan < 2 */}
      {visibleVendorTotals.length === 1 && (
        <div className="flex items-center gap-2.5 p-3.5 bg-amber-50 border border-amber-200/80 rounded-xl text-xs text-amber-800">
          <AlertTriangle size={16} className="text-amber-600 shrink-0" />
          <span>
            <strong>Audit Single-Source:</strong> Hanya 1 vendor yang dibandingkan. Kebijakan procurement mewajibkan minimal 2–3 vendor, atau lampirkan justifikasi pemilihan tunggal yang lengkap pada kolom alasan di bawah.
          </span>
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-slate-100">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50/70 border-b border-slate-200 text-slate-600 text-[11px] font-bold uppercase tracking-wider">
              <th className="py-3 px-4 text-center">Pilih</th>
              <th className="py-3 px-4">Vendor</th>
              <th className="py-3 px-4 text-center">Tanggal</th>
              <th className="py-3 px-4 text-center">Valid Until</th>
              <th className="py-3 px-4 text-center">Subtotal</th>
              <th className="py-3 px-4 text-center">PPN</th>
              <th className="py-3 px-4 text-center">TOTAL</th>
              <th className="py-3 px-4 text-center">Keterangan</th>
              <th className="py-3 px-4 text-center">Dokumen</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {visibleVendorTotals.map((vt: VendorTotal, idx: number) => (
              <tr
                key={vt.quotation_id}
                className="transition-colors"
                style={{
                  background:
                    pickedQtId === vt.quotation_id
                      ? "#f5f3ff"
                      : idx === 0
                      ? "#f0fdf4"
                      : undefined,
                }}
              >
                <td className="py-3.5 px-4 text-center">
                  <input
                    type="radio"
                    name="picked-vendor"
                    checked={pickedQtId === vt.quotation_id}
                    onChange={() => setPickedQtId(vt.quotation_id)}
                    className="cursor-pointer accent-amber-500"
                  />
                </td>
                <td className="py-3.5 px-4 font-bold text-slate-900">{vt.vendor_name}</td>
                <td className="py-3.5 px-4 text-center text-slate-600">{vt.quotation_date ? formatDate(vt.quotation_date) : "—"}</td>
                <td className="py-3.5 px-4 text-center text-slate-600">{vt.valid_until ? formatDate(vt.valid_until) : "—"}</td>
                <td className="py-3.5 px-4 text-right font-mono text-slate-600">
                 {formatCurrency(vt.subtotal)}
                </td>
                <td className="py-3.5 px-4 text-right font-mono text-slate-600">
            {formatCurrency(vt.tax_amount)}
</td>
              <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900 text-sm">
  {formatCurrency(vt.total_amount)}
</td>
                <td className="py-3.5 px-4 text-center">
                  {idx === 0 && (
                    <span className="inline-block text-[10px] bg-emerald-600 text-white px-2.5 py-0.5 rounded-full font-bold shadow-2xs">
                      TERMURAH
                    </span>
                  )}
                </td>
               <td className="py-3.5 px-4 text-center align-middle">
  {(() => {
    const quotation = quotations.find(
      (q: VendorQuotation) => q.id === vt.quotation_id
    );

    return quotation ? (
      <div className="flex justify-center items-center">
        <QuotationDetailBtn quotation={quotation} />
      </div>
    ) : (
      "—"
    );
  })()}
</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {visibleComparison && visibleComparison.length > 0 && (
        <div className="flex flex-col gap-3">
          <h4 className="text-xs font-bold text-slate-800">Detail Spesifikasi Per Item</h4>
          <div className="overflow-x-auto rounded-xl border border-slate-100">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-200 text-slate-600 text-[11px] font-bold uppercase tracking-wider">
                  <th className="py-3 px-4">Deskripsi (PR)</th>
                  <th className="py-3 px-4 text-center">Qty</th>
                  <th className="py-3 px-4 text-right">Est. Harga PR</th>
                  {visibleVendorTotals.map((vt: VendorTotal) => (
                    <th key={vt.quotation_id} className="py-3 px-4 text-center">
                      {vt.vendor_name?.slice(0, 12)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {visibleComparison.map((row: QuotationCompareRow) => (
                  <tr key={row.pr_line_id} className="hover:bg-slate-50/50">
                  <td className="py-3.5 px-4 align-top text-left font-medium text-slate-900">
                  {row.description}
                  </td>
                  <td className="py-3.5 px-4 align-top text-center text-slate-600">
                  {row.pr_qty} {row.pr_uom}
                  </td>
                  <td className="py-3.5 px-4 align-top text-right font-mono text-slate-600">
                  {formatCurrency(row.pr_est_price)}
                  </td>
                    {visibleVendorTotals.map((vt: VendorTotal) => {
                      const quotation = quotations.find((item: VendorQuotation) => item.id === vt.quotation_id);
                      return (
                     <td key={vt.quotation_id} className="py-3.5 px-4 text-center align-top">
                          {quotation ? <QuotationPdfBtn quotation={quotation} /> : "—"}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!picking && (
        <div className="flex flex-col sm:flex-row gap-4 items-end p-5 bg-slate-50/80 border border-slate-200/70 rounded-2xl">
          <div className="flex-1 w-full">
            <InputField
              label="Alasan / Catatan Penunjukan Vendor"
              value={pickingNotes}
              onChange={(e: any) => setPickingNotes(e.target.value)}
              placeholder="Tuliskan alasan mengapa vendor ini dipilih (minimal 10 karakter)..."
            />
          </div>
          <Button onClick={handlePick} disabled={!pickedQtId || saving} className="bg-amber-500 hover:bg-amber-600 text-white font-medium px-5 py-2.5 rounded-xl shadow-xs w-full sm:w-auto">
            <CheckCircle size={15} /> {saving ? "Memproses..." : "✓ Pilih Vendor Ini"}
          </Button>
        </div>
      )}

      {error && <div className="input-error text-rose-600 bg-rose-50 p-3 rounded-xl">{error}</div>}
      {picking && <MakePoSection prId={prId} picking={picking} />}
    </div>
  );
}

function MakePoSection({ prId, picking }: { prId: number; picking: any }) {
  const [deliveryDate, setDeliveryDate] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const r = await apiClient.post<any>(
        `/v1/procurement-inventory/purchase-requests/${prId}/convert-to-po`,
        { expected_delivery_date: deliveryDate || undefined, notes: notes || undefined },
      );
      setDone(r.data?.data?.po_number ?? "PO");
    } catch (err: any) {
      setError(extractErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  if (done) {
    return (
      <div className="mt-4 p-5 bg-emerald-50 border border-emerald-300 rounded-2xl text-center shadow-2xs">
        <div className="font-bold text-emerald-800 text-sm">
          ✅ Purchase Order <span className="font-mono">{done}</span> berhasil dibuat!
        </div>
        <div className="text-xs text-emerald-700 mt-1">
          Silakan cek menu Purchase Order untuk melanjutkan proses pengiriman ke vendor.
        </div>
      </div>
    );
  }

  if (picking.status === "pending_epm_approval") {
    return (
      <div className="mt-4 p-5 bg-amber-50 border border-amber-200 rounded-2xl text-xs shadow-2xs">
        <div className="font-bold text-amber-800 text-sm mb-1">
          ⏳ Menunggu Persetujuan EPM — Vendor: {picking.vendor?.vendor_name}
        </div>
        <div className="text-amber-700 mb-3">
          Quotation <span className="font-mono font-bold">{picking.quotation?.quotation_number}</span> {picking.notes ? `— Alasan: ${picking.notes}` : ""}
          <br />
          Proses sedang menunggu persetujuan berjenjang (Manager → EPM1 → EPM2) sebelum PO dapat diterbitkan.
        </div>
        <ApprovalStepsList workflowInstanceId={picking.workflow_instance_id} />
      </div>
    );
  }

  if (picking.status === "rejected") {
    return (
      <div className="mt-4 p-5 bg-rose-50 border border-rose-200 rounded-2xl text-xs shadow-2xs">
        <div className="font-bold text-rose-800 text-sm mb-1">
          ✕ Penunjukan Vendor {picking.vendor?.vendor_name} Ditolak EPM
        </div>
        <div className="text-rose-700">Silakan pilih ulang vendor pemenang lainnya dari tabel perbandingan di atas.</div>
      </div>
    );
  }

  return (
    <div className="mt-4 p-5 bg-purple-50/80 border border-purple-200 rounded-2xl text-xs shadow-2xs">
      <div className="font-bold text-purple-900 text-sm mb-1">
        ✓ Vendor Pemenang Disetujui: {picking.vendor?.vendor_name}
      </div>
      <div className="text-purple-700 mb-4">
        Quotation <span className="font-mono font-bold">{picking.quotation?.quotation_number}</span> {picking.notes ? `— Alasan: ${picking.notes}` : ""}
      </div>
      <form onSubmit={handleSubmit} className="flex gap-4 items-end flex-wrap">
        <div className="min-w-[200px]">
          <label className="input-label font-semibold text-purple-900">Est. Tanggal Pengiriman</label>
          <input
            className="input w-full text-xs bg-white"
            type="date"
            value={deliveryDate}
            onChange={(e) => setDeliveryDate(e.target.value)}
          />
        </div>
        <div className="flex-1 min-w-[220px]">
          <InputField
            label="Catatan PO (opsional)"
            value={notes}
            onChange={(e: any) => setNotes(e.target.value)}
            placeholder="Catatan tambahan untuk PO..."
          />
        </div>
        <Button type="submit" disabled={saving} className="bg-purple-600 hover:bg-purple-700 text-white font-medium px-5 py-2.5 rounded-xl shadow-xs">
          {saving ? "Membuat PO..." : "📦 Buat Purchase Order"}
        </Button>
      </form>
      {error && <div className="input-error mt-2 text-rose-600 bg-white p-2.5 rounded-xl">{error}</div>}
    </div>
  );
}

export default VendorQuotationPage;
