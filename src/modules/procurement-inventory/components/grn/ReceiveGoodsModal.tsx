import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  FileText,
  Upload,
  X,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { Modal } from "@shared/components/Modal";
import { Button } from "@shared/components/Button";
import { LoadingState } from "@shared/components/LoadingState";
import { apiClient } from "@shared/lib/api-client";
import { fileApi } from "@shared/api/fileApi";
import { useActiveOrgId } from "@shared/lib/organization-context";
import { extractErrorMessage } from "@shared/types/api";
import { useCreateGrnDraft } from "../../api/useGrn";
import type { PurchaseOrder, PurchaseOrderLine } from "../../types/po";

interface ReceiveLineForm {
  purchase_order_line_id: number;
  description: string;
  line_type: "goods" | "service";
  ordered_qty: number;
  uom: string;
  quantity_received: number;
  quantity_rejected: number;
  reject_reason: string;
  serial_number: string;
  unit_cost: number;
  condition: "good" | "damaged";
  warranty_expiry: string;
}

interface ReceiveGoodsModalProps {
  po?: PurchaseOrder | null;
  onClose: () => void;
  onSaved: () => void;
}

export function ReceiveGoodsModal({
  po: initialPo,
  onClose,
  onSaved,
}: ReceiveGoodsModalProps) {
  const orgId = useActiveOrgId();
  const qc = useQueryClient();

  const [selectedPoId, setSelectedPoId] = useState<number | null>(
    initialPo ? initialPo.id : null
  );

  // If no initial PO, fetch active POs eligible for receiving
  const { data: poListOptions, isLoading: loadingPoList } = useQuery({
    queryKey: ["eligible-pos-for-grn", orgId],
    queryFn: () =>
      apiClient
        .get<any>("/v1/procurement-inventory/purchase-orders", {
          params: { organization_id: orgId, per_page: 50 },
        })
        .then((r) => {
          const all: PurchaseOrder[] = r.data?.data ?? [];
          return all.filter((p) =>
            ["approved", "sent_to_vendor", "partially_received"].includes(p.status)
          );
        }),
    enabled: !initialPo,
  });

  // Fetch full PO detail
  const { data: fullPo, isLoading: loadingPo } = useQuery({
    queryKey: ["po-detail-for-grn", selectedPoId],
    queryFn: () =>
      apiClient
        .get<any>(`/v1/procurement-inventory/purchase-orders/${selectedPoId}`)
        .then((r) => r.data?.data),
    enabled: !!selectedPoId,
  });

  const { data: warehouses } = useQuery({
    queryKey: ["warehouses", orgId],
    queryFn: () =>
      apiClient
        .get<any>("/v1/procurement-inventory/warehouses", {
          params: { organization_id: orgId, per_page: 100 },
        })
        .then((r) => r.data?.data ?? []),
  });

  const createGrn = useCreateGrnDraft(selectedPoId ?? 0);

  // Form states
  const [warehouseId, setWarehouseId] = useState("");
  const [receiptDate, setReceiptDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [deliveryNoteNumber, setDeliveryNoteNumber] = useState("");
  const [receiverName, setReceiverName] = useState("");
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState<ReceiveLineForm[] | null>(null);
  const [bastFile, setBastFile] = useState<{
    id: number;
    original_name: string;
  } | null>(null);
  const [uploadingBast, setUploadingBast] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  // Populate lines when fullPo arrives
  useEffect(() => {
    if (fullPo) {
      setLines(
        (fullPo.lines ?? []).map((l: PurchaseOrderLine) => {
          const ordered = Number(l.quantity || 0);
          return {
            purchase_order_line_id: l.id,
            description: l.description,
            line_type: l.line_type ?? "goods",
            ordered_qty: ordered,
            uom: l.uom || "pcs",
            quantity_received: ordered,
            quantity_rejected: 0,
            reject_reason: "",
            serial_number: "",
            unit_cost: Number(l.unit_price ?? 0),
            condition: "good" as const,
            warranty_expiry: "",
          };
        })
      );
    } else {
      setLines(null);
    }
  }, [fullPo]);

  function updateLine(
    idx: number,
    field: keyof ReceiveLineForm,
    value: unknown
  ) {
    setLines((prev) =>
      (prev ?? []).map((l, i) => {
        if (i !== idx) return l;
        const updated = { ...l, [field]: value };
        // Auto calculate rejected qty if received qty changed
        if (field === "quantity_received") {
          const rec = Number(value || 0);
          const rej = Math.max(0, l.ordered_qty - rec);
          updated.quantity_rejected = rej;
          if (rej === 0) updated.reject_reason = "";
        }
        return updated;
      })
    );
  }

  async function handleUploadBast(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingBast(true);
    try {
      const r = await fileApi.upload(file, "procurement", "GoodsReceiptBast");
      setBastFile({
        id: r.data.data.id,
        original_name: r.data.data.original_name,
      });
    } catch {
      setError("Gagal upload BAST. Coba lagi.");
    } finally {
      setUploadingBast(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!selectedPoId) {
      setError("Pilih Purchase Order yang akan diterima.");
      return;
    }
    if (!deliveryNoteNumber.trim()) {
      setError("Nomor Surat Jalan dari vendor wajib diisi.");
      return;
    }
    if (!receiverName.trim()) {
      setError("Nama Penerima Barang (Diterima Oleh) wajib diisi.");
      return;
    }
    if (!warehouseId) {
      setError("Gudang tujuan wajib dipilih.");
      return;
    }
    if (!lines || lines.length === 0) {
      setError("Tidak ada baris barang untuk diproses.");
      return;
    }

    // Validate partial receipt & rejected reasons
    for (const line of lines) {
      if (line.quantity_rejected > 0 && !line.reject_reason.trim()) {
        setError(
          `Alasan penolakan wajib diisi untuk item "${line.description}" (${line.quantity_rejected} ${line.uom} ditolak).`
        );
        return;
      }
    }

    const totalReceived = lines.reduce((acc, l) => acc + (l.quantity_received || 0), 0);
    if (totalReceived <= 0) {
      setError("Minimal salah satu item harus memiliki kuantitas diterima > 0.");
      return;
    }

    try {
      // Build safe audit notes to preserve delivery note, receiver name, and rejected items info
      const rejectedSummary = lines
        .filter((l) => l.quantity_rejected > 0)
        .map((l) => `${l.description}: ${l.quantity_rejected} ${l.uom} ditolak (${l.reject_reason})`)
        .join("; ");

      const serialSummary = lines
        .filter((l) => l.serial_number)
        .map((l) => `${l.description}: SN# ${l.serial_number}`)
        .join("; ");

      const auditNotes = [
        `[SJ: ${deliveryNoteNumber.trim()}]`,
        `[Penerima: ${receiverName.trim()}]`,
        rejectedSummary ? `[Ditolak: ${rejectedSummary}]` : null,
        serialSummary ? `[SN: ${serialSummary}]` : null,
        notes.trim() ? `[Catatan: ${notes.trim()}]` : null,
      ]
        .filter(Boolean)
        .join(" ");

      const grn = await createGrn.mutateAsync({
        warehouse_id: Number(warehouseId),
        receipt_date: receiptDate,
        notes: auditNotes || undefined,
        bast_file_id: bastFile?.id,
        lines: lines
          .filter((l) => l.quantity_received > 0)
          .map((l) => ({
            purchase_order_line_id: l.purchase_order_line_id,
            quantity_received: l.quantity_received,
            unit_cost: l.unit_cost,
            condition: l.condition,
            warranty_expiry: l.warranty_expiry || undefined,
          })),
      });

      // Invalidate queries so lists update
      qc.invalidateQueries({ queryKey: ["goodsReceipts"] });
      qc.invalidateQueries({ queryKey: ["purchaseOrders"] });
      setDone(grn.grn_number);
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  }

  if (done) {
    return (
      <Modal title="Barang Berhasil Diterima" onClose={onClose} maxWidth={520}>
        <div className="text-center py-4 flex flex-col items-center gap-3">
          <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center">
            <CheckCircle2 size={28} />
          </div>
          <div>
            <h4 className="text-base font-bold text-slate-800">
              GRN Draft Dibuat ({done})
            </h4>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Dokumen penerimaan barang telah tercatat dalam status <strong>Draft</strong>. Silakan periksa kembali fisik barang di gudang, lalu klik <strong>Post</strong> untuk menambah saldo stok ke inventory.
            </p>
          </div>

          <div className="flex gap-2.5 justify-center mt-3 w-full">
            <Link
              to="/procurement-inventory/goods-receipts"
              className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-medium text-xs rounded-xl transition-all shadow-xs"
              onClick={() => {
                onSaved();
                onClose();
              }}
            >
              Lihat Daftar Goods Receipt →
            </Link>
            <Button
              variant="secondary"
              onClick={() => {
                onSaved();
                onClose();
              }}
              className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 font-medium text-xs rounded-xl"
            >
              Selesai
            </Button>
          </div>
        </div>
      </Modal>
    );
  }

  return (
    <Modal
      title={
        initialPo
          ? `Terima Barang — ${initialPo.po_number}`
          : "Penerimaan Barang Baru (GRN)"
      }
      onClose={onClose}
      maxWidth={880}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 py-1">
        {/* Pilih PO jika belum ada initialPo */}
        {!initialPo && (
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Pilih Purchase Order (PO) *
            </label>
            {loadingPoList ? (
              <div className="p-2.5 text-xs text-slate-400">Memuat daftar PO...</div>
            ) : (
              <select
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:bg-white focus:outline-none focus:border-amber-500 transition-all font-medium"
                value={selectedPoId ?? ""}
                onChange={(e) => setSelectedPoId(e.target.value ? Number(e.target.value) : null)}
              >
                <option value="">— Pilih Purchase Order yang siap diterima —</option>
                {(poListOptions ?? []).map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.po_number} — {p.vendor?.vendor_name ?? "Vendor"} (Status: {p.status})
                  </option>
                ))}
              </select>
            )}
          </div>
        )}

        {/* Info Banner PO */}
        {fullPo && (
          <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl flex items-center justify-between text-xs text-amber-900">
            <div>
              <span className="font-semibold">{fullPo.po_number}</span> — Vendor:{" "}
              <strong>{fullPo.vendor?.vendor_name ?? "—"}</strong>
            </div>
            <span className="text-[11px] text-amber-700 bg-amber-100/80 px-2 py-0.5 rounded-md font-mono">
              Total {fullPo.lines?.length ?? 0} Item
            </span>
          </div>
        )}

        {/* Section 1: Data Surat Jalan & Gudang */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              No. Surat Jalan Vendor *
            </label>
            <input
              type="text"
              placeholder="Contoh: SJ-2026/04/891"
              value={deliveryNoteNumber}
              onChange={(e) => setDeliveryNoteNumber(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:bg-white focus:outline-none focus:border-amber-500 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Diterima Oleh (PIC Penerima) *
            </label>
            <input
              type="text"
              placeholder="Nama staf gudang / penerima"
              value={receiverName}
              onChange={(e) => setReceiverName(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:bg-white focus:outline-none focus:border-amber-500 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Gudang Tujuan *
            </label>
            <select
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:bg-white focus:outline-none focus:border-amber-500 transition-all"
              value={warehouseId}
              onChange={(e) => setWarehouseId(e.target.value)}
            >
              <option value="">— Pilih Gudang —</option>
              {(warehouses ?? []).map((w: any) => (
                <option key={w.id} value={w.id}>
                  {w.warehouse_code ? `[${w.warehouse_code}] ` : ""}
                  {w.name ?? w.warehouse_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Tanggal Terima *
            </label>
            <input
              type="date"
              value={receiptDate}
              onChange={(e) => setReceiptDate(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:bg-white focus:outline-none focus:border-amber-500 transition-all"
            />
          </div>
        </div>

        {/* Section 2: Upload BAST / Surat Jalan */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Lampiran BAST / Scan Surat Jalan Vendor
          </label>
          {bastFile ? (
            <div className="flex items-center justify-between p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-700 font-medium">
              <span className="flex items-center gap-1.5">
                <FileText size={15} /> {bastFile.original_name}
              </span>
              <button
                type="button"
                onClick={() => setBastFile(null)}
                className="text-rose-600 hover:text-rose-700 cursor-pointer"
              >
                <X size={15} />
              </button>
            </div>
          ) : (
            <label className="flex items-center gap-2 p-3 border border-dashed border-slate-300 rounded-xl cursor-pointer text-xs text-slate-500 hover:bg-slate-50 transition-all">
              <Upload size={15} className="text-slate-400" />
              <span>
                {uploadingBast
                  ? "Mengunggah dokumen..."
                  : "Upload scan Surat Jalan / BAST (PDF, JPG, PNG) — bukti serah terima vendor"}
              </span>
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleUploadBast}
                disabled={uploadingBast}
                className="hidden"
              />
            </label>
          )}
        </div>

        {/* Section 3: Verifikasi Baris Barang */}
        <div className="border-t border-slate-100 pt-3 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-800 uppercase tracking-wide">
              Daftar Rincian Barang Diterima
            </label>
            <span className="text-[11px] text-slate-500">
              Mendukung Partial Receipt &amp; Alasan Penolakan
            </span>
          </div>

          {loadingPo && <LoadingState />}

          {!loadingPo && lines && lines.length > 0 && (
            <div className="flex flex-col gap-3 max-h-80 overflow-y-auto pr-1">
              {lines.map((line, idx) => {
                const isPartialOrRejected = line.quantity_rejected > 0;
                return (
                  <div
                    key={line.purchase_order_line_id}
                    className={`p-3.5 border rounded-xl transition-all ${
                      isPartialOrRejected
                        ? "border-amber-300 bg-amber-50/30"
                        : "border-slate-200/90 bg-white"
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2 mb-2.5">
                      <div>
                        <span className="font-bold text-xs text-slate-800">
                          {line.description}
                        </span>
                        <span className="text-[11px] text-slate-500 block">
                          Pesanan: <strong>{line.ordered_qty} {line.uom}</strong> @ Rp{" "}
                          {line.unit_cost.toLocaleString("id-ID")}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-slate-500 font-medium">Kondisi Fisik:</span>
                        <select
                          className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none"
                          value={line.condition}
                          onChange={(e) =>
                            updateLine(idx, "condition", e.target.value as "good" | "damaged")
                          }
                        >
                          <option value="good">Baik (Lengkap)</option>
                          <option value="damaged">Rusak / Cacat</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                      <div>
                        <label className="block text-[11px] font-medium text-slate-600 mb-0.5">
                          Qty Diterima ({line.uom}) *
                        </label>
                        <input
                          type="number"
                          min={0}
                          max={line.ordered_qty}
                          value={line.quantity_received}
                          onChange={(e) =>
                            updateLine(idx, "quantity_received", Number(e.target.value))
                          }
                          className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 font-semibold focus:outline-none focus:bg-white"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-medium text-slate-600 mb-0.5">
                          Qty Ditolak ({line.uom})
                        </label>
                        <input
                          type="number"
                          min={0}
                          max={line.ordered_qty}
                          value={line.quantity_rejected}
                          onChange={(e) =>
                            updateLine(idx, "quantity_rejected", Number(e.target.value))
                          }
                          className={`w-full px-2.5 py-1.5 border rounded-lg text-xs font-semibold focus:outline-none ${
                            line.quantity_rejected > 0
                              ? "bg-rose-50 border-rose-300 text-rose-700"
                              : "bg-slate-50 border-slate-200 text-slate-600"
                          }`}
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-[11px] font-medium text-slate-600 mb-0.5">
                          {line.quantity_rejected > 0 ? (
                            <span className="text-rose-600 font-semibold">
                              Alasan Penolakan Barang *
                            </span>
                          ) : (
                            "Serial Number / Batch / Garansi Toko"
                          )}
                        </label>
                        {line.quantity_rejected > 0 ? (
                          <select
                            value={line.reject_reason}
                            onChange={(e) =>
                              updateLine(idx, "reject_reason", e.target.value)
                            }
                            className="w-full px-2.5 py-1.5 bg-rose-50 border border-rose-300 text-rose-800 rounded-lg text-xs font-medium focus:outline-none"
                          >
                            <option value="">— Pilih Alasan Penolakan —</option>
                            <option value="Barang rusak fisik saat pengiriman">
                              Barang rusak fisik saat pengiriman
                            </option>
                            <option value="Spesifikasi tidak sesuai PO / pesanan">
                              Spesifikasi tidak sesuai PO / pesanan
                            </option>
                            <option value="Cacat produksi / tidak berfungsi">
                              Cacat produksi / tidak berfungsi
                            </option>
                            <option value="Kelebihan kirim dari PO">
                              Kelebihan kirim dari PO
                            </option>
                            <option value="Kedaluwarsa / kemasan sobek">
                              Kedaluwarsa / kemasan sobek
                            </option>
                          </select>
                        ) : (
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              placeholder="No Seri / Batch (opsional)"
                              value={line.serial_number}
                              onChange={(e) =>
                                updateLine(idx, "serial_number", e.target.value)
                              }
                              className="w-1/2 px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 placeholder:text-slate-400 focus:outline-none focus:bg-white"
                            />
                            <input
                              type="date"
                              title="Masa Garansi Toko s.d."
                              value={line.warranty_expiry}
                              onChange={(e) =>
                                updateLine(idx, "warranty_expiry", e.target.value)
                              }
                              className="w-1/2 px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:bg-white"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Section 4: Catatan Tambahan */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Catatan Tambahan Penerimaan
          </label>
          <input
            type="text"
            placeholder="Catatan inspeksi fisik, nama kurir, atau plat nomor kendaraan..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:bg-white focus:outline-none focus:border-amber-500 transition-all placeholder:text-slate-400"
          />
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs flex items-center gap-2 font-medium">
            <AlertTriangle size={15} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 font-medium text-xs rounded-xl"
          >
            Batal
          </Button>
          <Button
            type="submit"
            disabled={createGrn.isPending}
            className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-white font-medium text-xs rounded-xl shadow-xs"
          >
            {createGrn.isPending ? "Menyimpan Draft..." : "Simpan Dokumen Penerimaan (GRN Draft)"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
