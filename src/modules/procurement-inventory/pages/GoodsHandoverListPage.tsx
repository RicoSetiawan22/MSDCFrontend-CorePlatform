import { useState, useMemo, type FormEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Plus,
  X,
  FileDown,
  Tag,
  CheckCircle2,
  PackageCheck,
  Building2,
  Users,
  Calendar,
  FileText,
  FilterX,
  UserCheck,
} from "lucide-react";
import {
  useGoodsHandoverList,
  useHandoverAvailability,
  useCreateGoodsHandover,
} from "../api/useGoodsHandover";
import { goodsHandoverApi } from "../api/goodsHandoverApi";
import { ProcurementFormModal } from "../components/ProcurementFormModal";
import { PdfPreviewModal } from "@shared/components/PdfPreviewModal";
import { Pagination } from "@shared/components/Pagination";
import { PageHeader } from "@shared/components/PageHeader";
import { EmptyState } from "@shared/components/EmptyState";
import { LoadingState } from "@shared/components/LoadingState";
import { extractErrorMessage } from "@shared/types/api";
import { useActiveOrgId } from "@shared/lib/organization-context";
import { useAuth } from "@shared/lib/auth-context";
import { employeeApi } from "@modules/hr-service-support/api/employeeApi";
import type { Employee } from "@modules/hr-service-support/types/employee";
import type {
  GoodsHandover,
  AvailableGrnForHandover,
  AssetCategory,
} from "../types/goodsHandover";

const ASSET_CATEGORY_LABELS: Record<AssetCategory, string> = {
  server: "Server",
  network: "Network",
  rack: "Rack",
  cooling: "Cooling",
  power: "Power",
  other: "Lainnya",
};

export function GoodsHandoverListPage() {
  const { hasPermission } = useAuth();
  const canManage = hasPermission("goods-handover.manage");
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [warehouseFilter, setWarehouseFilter] = useState("");

  const { data, isLoading } = useGoodsHandoverList({
    page,
    per_page: 20,
    search: search || undefined,
  });

  const handovers = useMemo(() => data?.data ?? [], [data]);

  // KPI Calculations
  const totalHandovers = data?.total ?? 0;

  const uniqueWarehouses = useMemo(() => {
    const set = new Set<string>();
    handovers.forEach((h) => {
      if (h.warehouse?.warehouse_name) set.add(h.warehouse.warehouse_name);
    });
    return Array.from(set);
  }, [handovers]);

  const uniqueReceiversCount = useMemo(() => {
    const set = new Set<string>();
    handovers.forEach((h) => {
      if (h.received_by_employee?.full_name) set.add(h.received_by_employee.full_name);
    });
    return set.size;
  }, [handovers]);

  const filteredHandovers = useMemo(() => {
    if (!warehouseFilter) return handovers;
    return handovers.filter((h) => h.warehouse?.warehouse_name === warehouseFilter);
  }, [handovers, warehouseFilter]);

  const cardAnimationClass =
    "transition-all duration-200 ease-in-out cursor-pointer hover:-translate-y-1 active:scale-95 active:translate-y-0 select-none";

  return (
    <div className="min-h-screen bg-[#F5F7FA] pb-16">
      {/* ── 1. PageHeader Banner (Navy Blue & Gold Diagonal) ── */}
      <PageHeader
        title="Serah Terima Barang (FSTB)"
        subtitle="Serah terima fisik barang yang sudah diterima gudang (Goods Receipt) dari Admin Gudang ke employee pemohon — otomatis mengurangi saldo stok gudang."
        containerClassName="px-7 pt-5 pb-2"
      />

      {/* ── 2. Pembungkus Konten Utama ── */}
      <div className="flex flex-col gap-6 px-7 py-5">
        {/* ── Top Overview Card: Banner & 4 KPI Cards (Persis Referensi) ── */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm flex flex-col gap-5">
          {/* Banner Status Health */}
          <div className="bg-emerald-50/60 rounded-xl p-4 border border-emerald-200/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
            <div className="flex items-center gap-3.5 flex-1 w-full sm:w-auto">
              <div className="p-2.5 bg-emerald-100 text-emerald-700 rounded-xl shrink-0">
                <CheckCircle2 size={22} />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <h2 className="text-xs font-bold text-emerald-800 tracking-wide uppercase">
                    Status Operasional Serah Terima Barang (FSTB)
                  </h2>
                  <span className="text-[11px] font-bold font-mono text-emerald-700">
                    100% Terverifikasi
                  </span>
                </div>
                <div className="w-full bg-emerald-100/60 h-1.5 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-600 transition-all duration-300 w-full" />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-white px-4 py-2.5 rounded-xl border border-emerald-200/80 w-full sm:w-auto justify-between sm:justify-end shadow-xs shrink-0">
              <div className="flex items-center gap-2 text-slate-600 text-xs font-medium">
                <PackageCheck size={15} className="text-amber-500" />
                <span>Total Dokumen FSTB:</span>
              </div>
              <span className="text-xs font-bold text-slate-800 font-mono">
                {totalHandovers} Transaksi
              </span>
            </div>
          </div>

          {/* 4 Kartu Statistik Interaktif */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Total FSTB */}
            <button
              type="button"
              onClick={() => setWarehouseFilter("")}
              className={`w-full text-left p-5 rounded-xl border bg-white shadow-sm flex items-center gap-4 focus:outline-none ${cardAnimationClass} ${
                warehouseFilter === ""
                  ? "border-blue-500 ring-2 ring-blue-500/20 shadow-md"
                  : "border-slate-200/80 hover:border-blue-300 hover:shadow-md"
              }`}
            >
              <div className="p-3 bg-blue-50 text-blue-600 rounded-xl shrink-0">
                <FileText size={22} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide truncate">
                  Total FSTB
                </p>
                <h3 className="text-2xl font-bold text-slate-800 mt-0.5">
                  {totalHandovers}{" "}
                  <span className="text-xs font-normal text-slate-400">Dokumen</span>
                </h3>
              </div>
            </button>

            {/* Card 2: Serah Terima Selesai */}
            <div className="w-full text-left p-5 rounded-xl border border-slate-200/80 bg-white shadow-sm flex items-center gap-4">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl shrink-0">
                <CheckCircle2 size={22} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide truncate">
                  Status Serah Terima
                </p>
                <h3 className="text-2xl font-bold text-emerald-600 mt-0.5">
                  {totalHandovers}{" "}
                  <span className="text-xs font-normal text-slate-400">Selesai</span>
                </h3>
              </div>
            </div>

            {/* Card 3: Gudang Terlibat */}
            <div className="w-full text-left p-5 rounded-xl border border-slate-200/80 bg-white shadow-sm flex items-center gap-4">
              <div className="p-3 bg-purple-50 text-purple-600 rounded-xl shrink-0">
                <Building2 size={22} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide truncate">
                  Gudang Terlibat
                </p>
                <h3 className="text-2xl font-bold text-slate-800 mt-0.5">
                  {uniqueWarehouses.length}{" "}
                  <span className="text-xs font-normal text-slate-400">Lokasi</span>
                </h3>
              </div>
            </div>

            {/* Card 4: Karyawan Penerima */}
            <div className="w-full text-left p-5 rounded-xl border border-slate-200/80 bg-white shadow-sm flex items-center gap-4">
              <div className="p-3 bg-amber-50 text-amber-600 rounded-xl shrink-0">
                <Users size={22} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide truncate">
                  Penerima Unik
                </p>
                <h3 className="text-2xl font-bold text-amber-600 mt-0.5">
                  {uniqueReceiversCount}{" "}
                  <span className="text-xs font-normal text-slate-400">Orang</span>
                </h3>
              </div>
            </div>
          </div>
        </div>

        {/* ── Main Table Card: Toolbar & Data Table ── */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm flex flex-col gap-4">
          {/* Toolbar Sesuai Referensi */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3 flex-1 flex-wrap">
              {/* Search input */}
              <div className="relative flex-1 min-w-[240px] max-w-sm">
                <Search
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="text"
                  placeholder="Cari No. FSTB / No. PO / Pemohon..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-amber-500 transition-all"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearch("");
                      setPage(1);
                    }}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded-full cursor-pointer"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* Warehouse Filter Dropdown */}
              {uniqueWarehouses.length > 0 && (
                <select
                  value={warehouseFilter}
                  onChange={(e) => setWarehouseFilter(e.target.value)}
                  className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:bg-white focus:outline-none focus:border-amber-500 transition-all cursor-pointer"
                >
                  <option value="">Semua Gudang</option>
                  {uniqueWarehouses.map((wh) => (
                    <option key={wh} value={wh}>
                      {wh}
                    </option>
                  ))}
                </select>
              )}

              {warehouseFilter && (
                <button
                  type="button"
                  onClick={() => setWarehouseFilter("")}
                  className="flex items-center gap-1.5 px-3 py-2 bg-rose-50 border border-rose-200/60 text-rose-600 rounded-xl text-xs font-semibold hover:bg-rose-100 transition-all cursor-pointer"
                >
                  <FilterX size={14} /> Reset Filter
                </button>
              )}
            </div>

            {/* Tombol Aksi Tambah (Kuning Emas Sesuai Referensi) */}
            {canManage && (
              <button
                type="button"
                onClick={() => setShowModal(true)}
                className="flex items-center justify-center gap-1.5 bg-amber-500 hover:bg-amber-600 active:scale-95 text-white font-medium px-4 py-2 rounded-xl text-sm transition-all shadow-xs cursor-pointer shrink-0"
              >
                <Plus size={16} />
                <span>FSTB Baru</span>
              </button>
            )}
          </div>

          {isLoading && <LoadingState />}
          {!isLoading && filteredHandovers.length === 0 && (
            <EmptyState
              title="Belum Ada FSTB"
              subtitle="Serah terima barang dari Admin Gudang ke pemohon akan muncul di sini."
            />
          )}

          {!isLoading && filteredHandovers.length > 0 && (
            <div className="border border-slate-200/90 rounded-xl overflow-hidden mt-1">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-200/90 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      <th className="py-3.5 px-4">No FSTB</th>
                      <th className="py-3.5 px-4">Dokumen Terkait</th>
                      <th className="py-3.5 px-4">Gudang</th>
                      <th className="py-3.5 px-4">Diserahkan Oleh</th>
                      <th className="py-3.5 px-4">Diterima Oleh</th>
                      <th className="py-3.5 px-4">Tanggal</th>
                      <th className="py-3.5 px-4 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                    {filteredHandovers.map((fstb) => (
                      <GoodsHandoverRow key={fstb.id} fstb={fstb} />
                    ))}
                  </tbody>
                </table>
              </div>
              {data && data.last_page > 1 && (
                <div className="p-4 border-t border-slate-100 bg-slate-50/40">
                  <Pagination
                    currentPage={data.current_page}
                    lastPage={data.last_page}
                    total={data.total}
                    onPageChange={setPage}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {showModal && <GoodsHandoverFormModal onClose={() => setShowModal(false)} />}
    </div>
  );
}

function GoodsHandoverRow({ fstb }: { fstb: GoodsHandover }) {
  const orgId = useActiveOrgId();
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [previewBlob, setPreviewBlob] = useState<Blob | null>(null);

  async function handlePreviewPdf() {
    if (!orgId) return;
    setDownloadingPdf(true);
    try {
      const res = await goodsHandoverApi.downloadPdf(fstb.id, orgId);
      setPreviewBlob(res.data);
    } catch (err) {
      alert(extractErrorMessage(err));
    } finally {
      setDownloadingPdf(false);
    }
  }

  return (
    <>
      <tr className="hover:bg-slate-50/60 transition-colors">
        <td className="py-3.5 px-4">
          <div className="font-mono text-xs font-bold text-slate-800">
            {fstb.handover_number}
          </div>
          {fstb.notes && (
            <div className="text-xs text-slate-400 truncate max-w-xs mt-0.5">
              {fstb.notes}
            </div>
          )}
        </td>
        <td className="py-3.5 px-4 text-xs">
          <div className="flex flex-col gap-1">
            <span className="inline-flex items-center gap-1 font-mono text-[11px] font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md w-fit">
              <span className="text-slate-400 font-sans">PO:</span>
              {fstb.purchase_order?.po_number ?? "—"}
            </span>
            <span className="inline-flex items-center gap-1 font-mono text-[11px] font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md w-fit border border-amber-200/50">
              <span className="text-amber-500 font-sans">GRN:</span>
              {fstb.goods_receipt?.grn_number ?? "—"}
            </span>
          </div>
        </td>
        <td className="py-3.5 px-4 text-xs font-medium text-slate-700">
          <div className="flex items-center gap-1.5">
            <Building2 size={13} className="text-slate-400 shrink-0" />
            <span>{fstb.warehouse?.warehouse_name ?? "—"}</span>
          </div>
        </td>
        <td className="py-3.5 px-4 text-xs text-slate-600">
          <div className="font-medium text-slate-800">
            {fstb.handed_over_by_employee?.full_name ?? "—"}
          </div>
          <div className="text-[11px] text-slate-400">Admin Gudang</div>
        </td>
        <td className="py-3.5 px-4 text-xs text-slate-600">
          <div className="flex items-center gap-1.5 font-medium text-slate-900">
            <UserCheck size={14} className="text-emerald-600 shrink-0" />
            <span>{fstb.received_by_employee?.full_name ?? "—"}</span>
          </div>
          <div className="text-[11px] text-slate-400 ml-5">Pemohon</div>
        </td>
        <td className="py-3.5 px-4 text-xs text-slate-600 whitespace-nowrap">
          <div className="flex items-center gap-1.5">
            <Calendar size={13} className="text-slate-400 shrink-0" />
            <span>{new Date(fstb.handover_date).toLocaleDateString("id-ID")}</span>
          </div>
        </td>
        <td className="py-3.5 px-4 text-center">
          <button
            type="button"
            disabled={downloadingPdf}
            onClick={handlePreviewPdf}
            title="Pratinjau PDF FSTB"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-600 hover:text-amber-600 hover:bg-amber-50 hover:border-amber-300 transition-all text-xs font-medium cursor-pointer shadow-2xs disabled:opacity-50"
          >
            <FileDown size={14} className="text-amber-500" />
            <span>{downloadingPdf ? "Memuat..." : "PDF"}</span>
          </button>
        </td>
      </tr>
      {previewBlob && (
        <PdfPreviewModal
          title={`FSTB — ${fstb.handover_number}`}
          blob={previewBlob}
          filename={`FSTB_${fstb.handover_number}.pdf`}
          onClose={() => setPreviewBlob(null)}
        />
      )}
    </>
  );
}

interface LineFormState {
  quantity: number;
  needsAssetTag: boolean;
  assetCode: string;
  serialNumber: string;
  assetCategory: AssetCategory;
}

function GoodsHandoverFormModal({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate();
  const [grnId, setGrnId] = useState<number | "">("");
  const [grnSearch, setGrnSearch] = useState("");
  const [selectedGrn, setSelectedGrn] = useState<AvailableGrnForHandover | null>(null);
  const [receiver, setReceiver] = useState<Employee | { id: number; full_name: string; department?: { name: string } } | null>(null);
  const [handoverDate, setHandoverDate] = useState(new Date().toISOString().slice(0, 10));
  const [recipientDepartment, setRecipientDepartment] = useState("");
  const [placementLocation, setPlacementLocation] = useState("");
  const [lineForms, setLineForms] = useState<Record<number, LineFormState>>({});
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [taggedAssetCount, setTaggedAssetCount] = useState<number | null>(null);
  const createMutation = useCreateGoodsHandover();

  const { data: grnResults } = useQuery({
    queryKey: ["grn-available-for-handover", grnSearch],
    queryFn: () => goodsHandoverApi.receiptsAvailableForHandover(grnSearch).then((r) => r.data.data),
  });

  const { data: availability, isLoading: loadingAvailability } = useHandoverAvailability(grnId || undefined);

  function selectGrn(g: AvailableGrnForHandover) {
    setGrnId(g.id);
    setSelectedGrn(g);
    setGrnSearch("");
    setLineForms({});
    setReceiver(null);
  }

  function resetLineFormsFromAvailability() {
    if (!availability) return;
    const defaults: Record<number, LineFormState> = {};
    availability.lines.forEach((l) => {
      defaults[l.goods_receipt_line_id] = {
        quantity: l.quantity_available,
        needsAssetTag: false,
        assetCode: "",
        serialNumber: "",
        assetCategory: "other",
      };
    });
    setLineForms(defaults);
    if (availability.suggested_receiver && !receiver) setReceiver(availability.suggested_receiver);
  }

  function updateLine(lineId: number, patch: Partial<LineFormState>) {
    setLineForms((prev) => ({ ...prev, [lineId]: { ...prev[lineId], ...patch } }));
  }

  const [primedFor, setPrimedFor] = useState<number | null>(null);
  if (availability && primedFor !== grnId) {
    resetLineFormsFromAvailability();
    setPrimedFor(grnId as number);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!grnId) {
      setError("Pilih Goods Receipt terlebih dahulu.");
      return;
    }
    if (!handoverDate) {
      setError("Tanggal serah terima wajib diisi.");
      return;
    }
    if (!receiver) {
      setError("Pilih employee penerima barang.");
      return;
    }
    if (!recipientDepartment.trim()) {
      setError("Unit kerja / departemen penerima wajib diisi.");
      return;
    }

    // Validasi sisa kuantitas per baris
    if (availability) {
      for (const line of availability.lines) {
        const f = lineForms[line.goods_receipt_line_id];
        if (f && Number(f.quantity) > line.quantity_available) {
          setError(
            `Kuantitas untuk "${line.description}" (${f.quantity} ${line.uom}) melebihi sisa tersedia (${line.quantity_available} ${line.uom}).`
          );
          return;
        }
      }
    }

    const lines = Object.entries(lineForms)
      .map(([goodsReceiptLineId, f]) => ({
        goods_receipt_line_id: Number(goodsReceiptLineId),
        quantity: Number(f.quantity),
        needs_asset_tag: f.needsAssetTag,
        asset_code: f.needsAssetTag && f.assetCode.trim() ? f.assetCode.trim() : undefined,
        asset_category: f.needsAssetTag ? f.assetCategory : undefined,
      }))
      .filter((l) => l.quantity > 0);

    if (lines.length === 0) {
      setError("Minimal 1 baris barang dengan jumlah > 0.");
      return;
    }

    try {
      const serialsSummary = Object.entries(lineForms)
        .filter(([_, f]) => f.needsAssetTag && f.serialNumber.trim())
        .map(([id, f]) => `Line ${id}: SN# ${f.serialNumber.trim()}`)
        .join("; ");

      const auditNotes = [
        `[Tgl: ${handoverDate}]`,
        `[Unit Kerja: ${recipientDepartment.trim()}]`,
        placementLocation.trim() ? `[Lokasi: ${placementLocation.trim()}]` : null,
        serialsSummary ? `[SN: ${serialsSummary}]` : null,
        notes.trim() ? `[Catatan: ${notes.trim()}]` : null,
      ]
        .filter(Boolean)
        .join(" ");

      await createMutation.mutateAsync({
        goods_receipt_id: grnId,
        received_by_employee_id: receiver.id,
        notes: auditNotes || undefined,
        lines,
      });
      const taggedCount = lines.filter((l) => l.needs_asset_tag).length;
      if (taggedCount > 0) {
        setTaggedAssetCount(taggedCount);
      } else {
        onClose();
      }
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  }

  if (taggedAssetCount !== null) {
    return (
      <ProcurementFormModal
        title="FSTB Berhasil Disimpan"
        subtitle="Barang berhasil diserahterimakan dan dicatat dalam sistem"
        icon={CheckCircle2}
        onClose={onClose}
        maxWidth="max-w-[480px]"
        footer={
          <>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Tutup
            </button>
            <button
              type="button"
              onClick={() => {
                onClose();
                navigate("/procurement-inventory/maintenance");
              }}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-medium transition-colors shadow-xs cursor-pointer"
            >
              <Tag size={14} />
              <span>Lihat di Asset Maintenance</span>
            </button>
          </>
        }
      >
        <div className="flex flex-col gap-4 py-1">
          <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200/80 rounded-2xl text-emerald-800 text-xs">
            <CheckCircle2 size={24} className="text-emerald-600 shrink-0" />
            <div>
              FSTB berhasil disimpan. <strong>{taggedAssetCount} barang</strong> ditandai dengan Kode Barang dan otomatis terdaftar di menu Asset Maintenance.
            </div>
          </div>
        </div>
      </ProcurementFormModal>
    );
  }

  return (
    <ProcurementFormModal
      title="Serah Terima Barang (FSTB) Baru"
      subtitle="Dokumentasi penyerahan barang dari penerimaan ke employee/unit kerja"
      icon={PackageCheck}
      onClose={onClose}
      maxWidth="max-w-[680px]"
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
          >
            Batal
          </button>
          <button
            type="submit"
            form="fstb-form"
            disabled={createMutation.isPending}
            className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-medium transition-all shadow-xs cursor-pointer disabled:opacity-50"
          >
            {createMutation.isPending ? "Menyimpan..." : "Simpan FSTB"}
          </button>
        </>
      }
    >
      <form id="fstb-form" onSubmit={handleSubmit} className="flex flex-col gap-4 py-1">
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">
            Goods Receipt (GRN) *
          </label>
          {selectedGrn ? (
            <div className="flex items-center justify-between gap-3 p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl text-sm">
              <span className="font-semibold text-amber-900 font-mono">
                {selectedGrn.grn_number} — PO {selectedGrn.purchase_order?.po_number ?? "—"}
              </span>
              <button
                type="button"
                onClick={() => {
                  setSelectedGrn(null);
                  setGrnId("");
                  setPrimedFor(null);
                }}
                className="text-slate-400 hover:text-rose-600 p-1 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>
          ) : (
            <div className="relative">
              <div className="relative">
                <Search
                  size={15}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="text"
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:bg-white focus:outline-none focus:border-amber-500 transition-all"
                  placeholder="Cari No. GRN atau No. PO..."
                  value={grnSearch}
                  onChange={(e) => setGrnSearch(e.target.value)}
                />
              </div>
              {(grnResults ?? []).length > 0 && (
                <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-48 overflow-y-auto divide-y divide-slate-100">
                  {(grnResults ?? []).map((g) => (
                    <button
                      key={g.id}
                      type="button"
                      className="w-full p-2.5 text-left hover:bg-slate-50 text-xs text-slate-700 flex flex-col gap-0.5 transition-colors cursor-pointer"
                      onClick={() => selectGrn(g)}
                    >
                      <span className="font-bold font-mono text-slate-900">
                        {g.grn_number}
                      </span>
                      <span className="text-slate-500">
                        PO {g.purchase_order?.po_number ?? "—"} ({g.purchase_order?.vendor?.vendor_name ?? "—"})
                      </span>
                    </button>
                  ))}
                </div>
              )}
              {grnResults && grnResults.length === 0 && (
                <div className="text-xs text-slate-400 mt-1.5 italic">
                  Tidak ada GRN yang masih punya sisa barang untuk diserahterimakan.
                </div>
              )}
            </div>
          )}
        </div>

        {grnId && loadingAvailability && (
          <div className="text-xs text-slate-400 py-2">Memuat baris barang...</div>
        )}

        {grnId && availability && (
          <>
            {/* Header Form Data: Tanggal, Unit Kerja, Lokasi */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-slate-50 border border-slate-200/80 rounded-xl">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wide mb-1">
                  Tanggal Serah Terima *
                </label>
                <input
                  type="date"
                  value={handoverDate}
                  onChange={(e) => setHandoverDate(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wide mb-1">
                  Unit Kerja / Dept *
                </label>
                <input
                  type="text"
                  placeholder="mis. IT / Studio Broadcast / HR"
                  value={recipientDepartment}
                  onChange={(e) => setRecipientDepartment(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wide mb-1">
                  Lokasi Penempatan
                </label>
                <input
                  type="text"
                  placeholder="mis. R. Server Lt. 2 / Meja Kerja"
                  value={placementLocation}
                  onChange={(e) => setPlacementLocation(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">
                Baris Barang Diserahkan
              </label>
              {availability.lines.length === 0 && (
                <div className="text-xs text-slate-400">
                  Semua barang di GRN ini sudah diserahterimakan sepenuhnya.
                </div>
              )}
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl p-3 bg-slate-50/50">
                {availability.lines.map((l) => {
                  const f = lineForms[l.goods_receipt_line_id];
                  if (!f) return null;
                  return (
                    <div key={l.goods_receipt_line_id} className="py-2.5 first:pt-0 last:pb-0">
                      <div className="flex items-center gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-medium text-slate-900">
                            {l.description}
                          </div>
                          <div className="text-[11px] text-slate-400 mt-0.5">
                            Sisa belum diserahkan: <strong className="text-amber-700">{l.quantity_available} {l.uom}</strong>
                            {l.warranty_expiry && ` · Garansi s.d. ${l.warranty_expiry}`}
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <input
                            type="number"
                            min={0}
                            max={l.quantity_available}
                            step="any"
                            className="w-20 px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono text-slate-800 text-right focus:outline-none focus:border-amber-500 font-semibold"
                            value={f.quantity}
                            onChange={(e) =>
                              updateLine(l.goods_receipt_line_id, {
                                quantity: Number(e.target.value),
                              })
                            }
                          />
                          <span className="text-xs text-slate-400 w-10 truncate">{l.uom}</span>
                        </div>
                      </div>
                      <label className="flex items-center gap-2 mt-2 text-xs text-slate-600 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          className="rounded text-amber-500 focus:ring-amber-400"
                          checked={f.needsAssetTag}
                          onChange={(e) =>
                            updateLine(l.goods_receipt_line_id, {
                              needsAssetTag: e.target.checked,
                            })
                          }
                        />
                        <span className="font-medium text-slate-700">
                          Beri Kode Barang / Catat Aset <span className="text-slate-400 font-normal">(laptop, server, switch, dsb.)</span>
                        </span>
                      </label>
                      {f.needsAssetTag && (
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-2 pl-5">
                          <input
                            type="text"
                            className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-amber-500 font-mono"
                            placeholder="Nomor Seri / SN#"
                            value={f.serialNumber}
                            onChange={(e) =>
                              updateLine(l.goods_receipt_line_id, {
                                serialNumber: e.target.value,
                              })
                            }
                          />
                          <input
                            type="text"
                            className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-amber-500 font-mono"
                            placeholder="Kode Barang (kosong = auto)"
                            value={f.assetCode}
                            onChange={(e) =>
                              updateLine(l.goods_receipt_line_id, {
                                assetCode: e.target.value,
                              })
                            }
                          />
                          <select
                            className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-amber-500"
                            value={f.assetCategory}
                            onChange={(e) =>
                              updateLine(l.goods_receipt_line_id, {
                                assetCategory: e.target.value as AssetCategory,
                              })
                            }
                          >
                            {Object.entries(ASSET_CATEGORY_LABELS).map(([v, l2]) => (
                              <option key={v} value={v}>
                                {l2}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">
                Diterima Oleh (Employee Pemohon) *
              </label>
              <EmployeePickerField
                employeeId={receiver?.id ?? ""}
                employeeName={receiver?.full_name ?? ""}
                onSelect={(emp) => {
                  setReceiver(emp);
                  if (emp && (emp as any).department?.name && !recipientDepartment) {
                    setRecipientDepartment((emp as any).department.name);
                  }
                }}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">
                Catatan Serah Terima (opsional)
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="mis. Kondisi kelengkapan barang, aksesoris bawaan, catatan serah terima"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-amber-500 transition-all resize-y"
              />
            </div>
          </>
        )}

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200/80 rounded-xl text-xs font-medium text-rose-700">
            {error}
          </div>
        )}
      </form>
    </ProcurementFormModal>
  );
}

function EmployeePickerField({
  employeeId,
  employeeName,
  onSelect,
}: {
  employeeId: number | "";
  employeeName: string;
  onSelect: (emp: Employee | null) => void;
}) {
  const [search, setSearch] = useState("");
  const { data: results } = useQuery({
    queryKey: ["employee-search", search],
    queryFn: () => employeeApi.list({ search, per_page: 10 }).then((r) => r.data?.data ?? []),
    enabled: search.length >= 2,
  });

  if (employeeId) {
    return (
      <div className="flex items-center justify-between gap-3 p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl text-sm">
        <span className="font-semibold text-amber-900">{employeeName}</span>
        <button
          type="button"
          onClick={() => onSelect(null)}
          className="text-slate-400 hover:text-rose-600 p-1 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
        >
          <X size={15} />
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <input
        type="text"
        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:bg-white focus:outline-none focus:border-amber-500 transition-all placeholder:text-slate-400"
        placeholder="Ketik minimal 2 huruf untuk cari nama employee..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      {search.length >= 2 && results && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-48 overflow-y-auto divide-y divide-slate-100">
          {results.length === 0 && (
            <div className="p-3 text-xs text-slate-400">Tidak ditemukan.</div>
          )}
          {results.map((emp) => (
            <button
              key={emp.id}
              type="button"
              className="w-full p-2.5 text-left hover:bg-slate-50 text-xs text-slate-800 flex items-center justify-between transition-colors cursor-pointer"
              onClick={() => {
                onSelect(emp);
                setSearch("");
              }}
            >
              <span className="font-medium text-slate-900">{emp.full_name}</span>
              <span className="text-[11px] text-slate-400 font-mono">({emp.employee_number})</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}