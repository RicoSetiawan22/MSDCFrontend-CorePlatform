import { useState, FormEvent, useMemo } from "react";
import { 
  Search, 
  Plus, 
  Boxes, 
  AlertTriangle, 
  FilterX, 
  CheckCircle,
  X,
  ShoppingCart,
  ArrowRight,
  TrendingDown,
  DollarSign,
  CheckCircle2,
  Ban
} from "lucide-react";
import {
  useItemList,
  useCreateItem,
  useUpdateItem,
  useStockBalance,
} from "../api/useItem";
import { useCreatePr } from "../api/usePr";
import { Button } from "@shared/components/Button";
import { Pagination } from "@shared/components/Pagination";
import { PageHeader } from "@shared/components/PageHeader";
import { EmptyState } from "@shared/components/EmptyState";
import { LoadingState } from "@shared/components/LoadingState";
import { extractErrorMessage } from "@shared/types/api";
import { useActiveOrgId } from "@shared/lib/organization-context";
import { apiClient } from "@shared/lib/api-client";
import type { Item, ItemType } from "../types/item";

import { ItemTable } from "../components/item/ItemTable";
import { ItemFormModal, type ItemFormValues } from "../components/item/ItemFormModal";
import { PrFormModal } from "../components/pr/PrFormModal";
import type { PrFormValues, PrLineForm } from "../types/pr";

const TYPE_LABELS: Record<ItemType, string> = {
  sparepart: "Sparepart",
  consumable: "Consumable",
  asset: "Asset",
  other: "Lainnya",
};

export function ItemListPage() {
  const orgId = useActiveOrgId();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<ItemType | "">("");
  const [stockStatusFilter, setStockStatusFilter] = useState<"all" | "low_stock" | "out_of_stock" | "inactive">("all");

  const [selectedItemIds, setSelectedItemIds] = useState<number[]>([]);

  const { data, isLoading, refetch } = useItemList({
    page,
    per_page: 10,
    search: search || undefined,
    item_type: typeFilter || undefined,
  });
  
  const { data: balances } = useStockBalance();
  const createMutation = useCreateItem();
  const updateMutation = useUpdateItem();
  const createPrMutation = useCreatePr();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [isPrModalOpen, setIsPrModalOpen] = useState(false);
  const [prError, setPrError] = useState<string | null>(null);
  const [isPrSaving, setIsPrSaving] = useState(false);
  const [stagedFiles, setStagedFiles] = useState<File[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [prForm, setPrForm] = useState<PrFormValues>({
    employee_id: null,
    employee_name: null,
    purpose: "",
    department_id: null,
    cost_center_id: null,
    notes: "",
    lines: [],
  });

  const [prLines, setPrLines] = useState<PrLineForm[]>([]);

  function stockFor(itemId: number): number {
    if (!balances) return 0;
    return balances
      .filter((b) => b.item_id === itemId)
      .reduce((sum, b) => sum + b.balance, 0);
  }

  const totalValuation = useMemo(() => {
    return (data?.data ?? []).reduce((acc, item) => {
      const stock = stockFor(item.id);
      const estimatedPrice = 50000; 
      return acc + (stock * estimatedPrice);
    }, 0);
  }, [data, balances]);

  const filteredItems = useMemo(() => {
    return (data?.data ?? []).filter((item) => {
      const stock = stockFor(item.id);
      const isAsset = item.item_type === "asset";
      const isLowStock =
        !isAsset &&
        item.reorder_point !== null &&
        item.reorder_point !== undefined &&
        item.reorder_point > 0 &&
        stock <= item.reorder_point;

      const isOutOfStock = stock === 0;
      const isInactive = !item.is_active;

      if (stockStatusFilter === "low_stock") return isLowStock;
      if (stockStatusFilter === "out_of_stock") return isOutOfStock;
      if (stockStatusFilter === "inactive") return isInactive;
      return true;
    });
  }, [data, balances, stockStatusFilter]);

  const totalItems = data?.total ?? 0;
  
  const lowStockCount = useMemo(() => {
    return (data?.data ?? []).filter((item) => {
      const stock = stockFor(item.id);
      const isAsset = item.item_type === "asset";
      return (
        !isAsset &&
        item.reorder_point !== null &&
        item.reorder_point !== undefined &&
        item.reorder_point > 0 &&
        stock <= item.reorder_point
      );
    }).length;
  }, [data, balances]);

  const outOfStockCount = useMemo(() => {
    return (data?.data ?? []).filter((item) => stockFor(item.id) === 0).length;
  }, [data, balances]);

  const inactiveCount = useMemo(() => {
    return (data?.data ?? []).filter((item) => !item.is_active).length;
  }, [data]);

  const healthyPercentage = useMemo(() => {
    return totalItems > 0
      ? Math.round(((totalItems - lowStockCount) / totalItems) * 100)
      : 100;
  }, [totalItems, lowStockCount]);

  function showNotification(msg: string) {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  }

  function handleToggleSelect(itemId: number) {
    setSelectedItemIds((prev) =>
      prev.includes(itemId)
        ? prev.filter((id) => id !== itemId)
        : [...prev, itemId]
    );
  }

  function handleSelectAll(selectAll: boolean) {
    if (selectAll) {
      const currentLowStockIds = filteredItems
        .filter((item) => {
          const stock = stockFor(item.id);
          const isAsset = item.item_type === "asset";
          return (
            !isAsset &&
            item.reorder_point !== null &&
            item.reorder_point !== undefined &&
            item.reorder_point > 0 &&
            stock <= item.reorder_point
          );
        })
        .map((i) => i.id);

      setSelectedItemIds(Array.from(new Set([...selectedItemIds, ...currentLowStockIds])));
    } else {
      const currentIds = new Set(filteredItems.map((i) => i.id));
      setSelectedItemIds(selectedItemIds.filter((id) => !currentIds.has(id)));
    }
  }

  function openCreate() {
    setEditingItem(null);
    setError(null);
    setIsModalOpen(true);
  }

  function openEdit(item: Item) {
    setEditingItem(item);
    setError(null);
    setIsModalOpen(true);
  }

  async function handleFormSubmit(values: ItemFormValues) {
    setError(null);
    try {
      if (editingItem) {
        await updateMutation.mutateAsync({
          id: editingItem.id,
          values: {
            item_name: values.item_name,
            uom: values.uom,
            reorder_point: values.reorder_point !== undefined ? values.reorder_point : null,
            reorder_qty: values.reorder_qty !== undefined ? values.reorder_qty : null,
            is_active: values.is_active,
            notes: values.notes,
          },
        });
        showNotification("Item berhasil diperbarui!");
      } else {
        await createMutation.mutateAsync({
          item_name: values.item_name,
          item_type: values.item_type,
          uom: values.uom,
          reorder_point: values.reorder_point ?? undefined,
          reorder_qty: values.reorder_qty ?? undefined,
          notes: values.notes,
        });
        showNotification("Item baru berhasil ditambahkan!");
      }
      setIsModalOpen(false);
      refetch();
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  }

  function handleCreatePR(item: Item) {
    setPrForm({
      employee_id: null,
      employee_name: null,
      purpose: `Pengadaan item: ${item.item_name}`,
      department_id: null,
      cost_center_id: null,
      notes: "",
      lines: [],
    });

    setPrLines([
      {
        item_id: item.id,
        item_name: item.item_name,
        line_type: "goods",
        description: item.item_name,
        quantity: item.reorder_qty ?? 1,
        uom: item.uom ?? "pcs",
        estimated_unit_price: 0,
        channel: "offline",
      },
    ]);

    setStagedFiles([]);
    setPrError(null);
    setIsPrModalOpen(true);
  }

  function handleCreateBulkPR() {
    const selectedItems = (data?.data ?? []).filter((i) =>
      selectedItemIds.includes(i.id)
    );

    if (selectedItems.length === 0) return;

    setPrForm({
      employee_id: null,
      employee_name: null,
      purpose: `Pengadaan kolektif stok kritis (${selectedItems.length} item)`,
      department_id: null,
      cost_center_id: null,
      notes: "",
      lines: [],
    });

    const lines: PrLineForm[] = selectedItems.map((item) => ({
      item_id: item.id,
      item_name: item.item_name,
      line_type: "goods",
      description: item.item_name,
      quantity: item.reorder_qty ?? 1,
      uom: item.uom ?? "pcs",
      estimated_unit_price: 0,
      channel: "offline",
    }));

    setPrLines(lines);
    setStagedFiles([]);
    setPrError(null);
    setIsPrModalOpen(true);
  }

  async function handlePrSubmit(e: FormEvent) {
    e.preventDefault();
    setPrError(null);

    if (!prForm.purpose?.trim()) {
      setPrError("Tujuan/keperluan wajib diisi.");
      return;
    }

    const validLines = prLines.filter(
      (l) => (l.item_id || l.description.trim()) && l.quantity > 0
    );

    if (validLines.length === 0) {
      setPrError("Minimal 1 baris barang wajib diisi.");
      return;
    }

    setIsPrSaving(true);

    try {
      const created = await createPrMutation.mutateAsync({
        purpose: prForm.purpose.trim(),
        employee_id: prForm.employee_id ? Number(prForm.employee_id) : undefined,
        department_id: prForm.department_id ? Number(prForm.department_id) : undefined,
        cost_center_id: prForm.cost_center_id ? Number(prForm.cost_center_id) : undefined,
        notes: prForm.notes ?? undefined,
        lines: validLines.map((l) => ({
          item_id: l.line_type === "service" ? undefined : (l.item_id ?? undefined),
          line_type: l.line_type,
          description: l.description.trim() || l.item_name || "",
          quantity: l.quantity,
          uom: l.uom,
          estimated_unit_price: l.estimated_unit_price,
          channel: l.channel,
        })),
      });

      const newPrId = (created as { id?: number })?.id;
      if (newPrId && stagedFiles.length > 0) {
        for (const file of stagedFiles) {
          const fd = new FormData();
          fd.append("file", file);
          fd.append("category", "supporting");
          try {
            await apiClient.post(
              `/v1/procurement-inventory/purchase-requests/${newPrId}/attachments`,
              fd,
              { headers: { "Content-Type": "multipart/form-data" } }
            );
          } catch {
            // Silence failure
          }
        }
      }

      setIsPrModalOpen(false);
      setSelectedItemIds([]);
      showNotification("Purchase Request (PR) kolektif berhasil dibuat!");
      refetch();
    } catch (err) {
      setPrError(extractErrorMessage(err));
    } finally {
      setIsPrSaving(false);
    }
  }

  const isSaving = createMutation.isPending || updateMutation.isPending;
  const cardAnimationClass = "transition-all duration-200 ease-in-out cursor-pointer hover:-translate-y-1 active:scale-95 active:translate-y-0 select-none";

  return (
    <div className="min-h-screen bg-[#F5F7FA] pb-16">
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-2.5 bg-slate-900 text-white text-xs px-4 py-3 rounded-2xl shadow-xl border border-slate-700/80 animate-in fade-in slide-in-from-top-3 duration-300">
          <CheckCircle size={16} className="text-emerald-400 shrink-0" />
          <span className="font-medium">{toastMessage}</span>
        </div>
      )}

      {selectedItemIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-slate-900 text-white px-5 py-3.5 rounded-2xl shadow-2xl border border-slate-700/80 flex items-center gap-6 animate-in slide-in-from-bottom-5 duration-300">
          <div className="flex items-center gap-3">
            <div className="relative p-2 bg-amber-500 text-white rounded-xl shadow-xs">
              <ShoppingCart size={20} />
              <span className="absolute -top-1.5 -right-1.5 bg-rose-600 text-white text-[10px] font-extrabold w-5 h-5 rounded-full flex items-center justify-center border-2 border-slate-900">
                {selectedItemIds.length}
              </span>
            </div>
            <div>
              <p className="text-xs font-bold text-white">Keranjang Pengadaan (PR)</p>
              <p className="text-[11px] text-slate-400">
                {selectedItemIds.length} item stok kritis terpilih
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSelectedItemIds([])}
              className="text-xs text-slate-400 hover:text-white px-2 py-1 transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleCreateBulkPR}
              className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white font-semibold text-xs px-4 py-2 rounded-xl transition-all cursor-pointer shadow-xs active:scale-95"
            >
              <span>Buat PR Kolektif</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* ── Page Header ── */}
      <PageHeader
        title="Item & Inventory"
        subtitle="Master item gudang — sparepart, consumable, asset."
        containerClassName="px-7 pt-5 pb-2"
      />

      {/* ── Konten Utama ── */}
      <div className="flex flex-col gap-6 px-7 py-5">
        {/* Top Overview Card: Banner & 4 KPI Cards (Struktur sama persis VendorListPage) */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm flex flex-col gap-5">
          {/* Banner Status */}
          <div className="bg-emerald-50/60 rounded-xl p-4 border border-emerald-200/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
            <div className="flex items-center gap-3.5 flex-1 w-full sm:w-auto">
              <div className="p-2.5 bg-emerald-100 text-emerald-700 rounded-xl shrink-0">
                <CheckCircle2 size={22} />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <h2 className="text-xs font-bold text-emerald-800 tracking-wide uppercase">Sistem Inventory Optimal</h2>
                  <span className={`text-[11px] font-bold font-mono ${healthyPercentage <= 50 ? "text-rose-600" : "text-emerald-700"}`}>
                    {healthyPercentage}% Optimal
                  </span>
                </div>
                <div className="w-full bg-emerald-100/60 h-1.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${healthyPercentage <= 50 ? "bg-rose-500" : "bg-emerald-600"}`}
                    style={{ width: `${healthyPercentage}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-white px-4 py-2.5 rounded-xl border border-emerald-200/80 w-full sm:w-auto justify-between sm:justify-end shadow-xs shrink-0">
              <div className="flex items-center gap-2 text-slate-600 text-xs font-medium">
                <DollarSign size={15} className="text-amber-500" />
                <span>Valuasi Aset:</span>
              </div>
              <span className="text-xs font-bold text-slate-800 font-mono">Rp {totalValuation.toLocaleString("id-ID")}</span>
            </div>
          </div>

          {/* Jajaran 4 Kartu Statistik dengan Animasi Hover & Active Presisi */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Total Master Item */}
            <button
              type="button"
              onClick={() => setStockStatusFilter("all")}
              className={`w-full text-left p-5 rounded-xl border bg-white shadow-sm flex items-center gap-4 focus:outline-none ${cardAnimationClass} ${
                stockStatusFilter === "all"
                  ? "border-blue-500 ring-2 ring-blue-500/20 shadow-md"
                  : "border-slate-200/80 hover:border-blue-300 hover:shadow-md"
              }`}
            >
              <div className="p-3 bg-blue-50 text-blue-600 rounded-xl shrink-0">
                <Boxes size={22} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide truncate">Total Master Item</p>
                <h3 className="text-2xl font-bold text-slate-800 mt-0.5">{totalItems} <span className="text-xs font-normal text-slate-400">Jenis</span></h3>
              </div>
            </button>

            {/* Card 2: Stok Kritis */}
            <button
              type="button"
              onClick={() => setStockStatusFilter(stockStatusFilter === "low_stock" ? "all" : "low_stock")}
              className={`w-full text-left p-5 rounded-xl border bg-white shadow-sm flex items-center gap-4 focus:outline-none ${cardAnimationClass} ${
                stockStatusFilter === "low_stock"
                  ? "border-emerald-500 ring-2 ring-emerald-500/20 shadow-md"
                  : "border-slate-200/80 hover:border-emerald-300 hover:shadow-md"
              }`}
            >
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl shrink-0">
                <AlertTriangle size={22} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide truncate">Stok Kritis / PR</p>
                <h3 className="text-2xl font-bold text-emerald-600 mt-0.5">{lowStockCount} <span className="text-xs font-normal text-slate-400">Item</span></h3>
              </div>
            </button>

            {/* Card 3: Stok Habis */}
            <button
              type="button"
              onClick={() => setStockStatusFilter(stockStatusFilter === "out_of_stock" ? "all" : "out_of_stock")}
              className={`w-full text-left p-5 rounded-xl border bg-white shadow-sm flex items-center gap-4 focus:outline-none ${cardAnimationClass} ${
                stockStatusFilter === "out_of_stock"
                  ? "border-purple-500 ring-2 ring-purple-500/20 shadow-md"
                  : "border-slate-200/80 hover:border-purple-300 hover:shadow-md"
              }`}
            >
              <div className="p-3 bg-purple-50 text-purple-600 rounded-xl shrink-0">
                <TrendingDown size={22} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide truncate">Stok Habis (0)</p>
                <h3 className="text-2xl font-bold text-slate-800 mt-0.5">{outOfStockCount} <span className="text-xs font-normal text-slate-400">Item</span></h3>
              </div>
            </button>

            {/* Card 4: Item Tidak Aktif */}
            <button
              type="button"
              onClick={() => setStockStatusFilter(stockStatusFilter === "inactive" ? "all" : "inactive")}
              className={`w-full text-left p-5 rounded-xl border bg-white shadow-sm flex items-center gap-4 focus:outline-none ${cardAnimationClass} ${
                stockStatusFilter === "inactive"
                  ? "border-rose-500 ring-2 ring-rose-500/20 shadow-md"
                  : "border-slate-200/80 hover:border-rose-300 hover:shadow-md"
              }`}
            >
              <div className="p-3 bg-rose-50 text-rose-600 rounded-xl shrink-0">
                <Ban size={22} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide truncate">Item Tidak Aktif</p>
                <h3 className="text-2xl font-bold text-rose-600 mt-0.5">{inactiveCount} <span className="text-xs font-normal text-slate-400">Item</span></h3>
              </div>
            </button>
          </div>
        </div>

        {/* Table Card: Toolbar & Table */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-72">
                <Search
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-amber-500 transition-all"
                  placeholder="Cari item..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded-full"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              <select
                className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:bg-white focus:outline-none focus:border-amber-500 transition-all cursor-pointer"
                value={typeFilter}
                onChange={(e) => {
                  setTypeFilter(e.target.value as ItemType | "");
                  setPage(1);
                }}
              >
                <option value="">Semua Tipe</option>
                {Object.entries(TYPE_LABELS).map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </select>

              {stockStatusFilter !== "all" && (
                <button
                  type="button"
                  onClick={() => setStockStatusFilter("all")}
                  className="flex items-center gap-1.5 px-3 py-2 bg-rose-50 border border-rose-200/60 text-rose-600 rounded-xl text-xs font-semibold hover:bg-rose-100 transition-all cursor-pointer"
                >
                  <FilterX size={14} /> Reset Filter Card
                </button>
              )}
            </div>

            <Button
              onClick={openCreate}
              className="w-full sm:w-auto flex items-center justify-center gap-1.5 bg-amber-500 hover:bg-amber-600 active:scale-95 text-white font-medium px-4 py-2 rounded-xl text-sm transition-all cursor-pointer shadow-xs"
            >
              <Plus size={16} /> Item Baru
            </Button>
          </div>

          {isLoading && <LoadingState />}

          {!isLoading && filteredItems.length === 0 && (
            <EmptyState
              title="Belum Ada Item"
              subtitle="Item inventory akan muncul di sini atau tidak sesuai dengan kriteria filter."
            />
          )}

          {!isLoading && filteredItems.length > 0 && (
            <>
              <ItemTable
                items={filteredItems}
                stockFor={stockFor}
                onEdit={openEdit}
                onCreatePR={handleCreatePR}
                selectedIds={selectedItemIds}
                onToggleSelect={handleToggleSelect}
                onSelectAll={handleSelectAll}
              />

              <div className="pt-2">
                <Pagination
                  currentPage={data?.current_page ?? 1}
                  lastPage={data?.last_page ?? 1}
                  total={data?.total ?? 0}
                  onPageChange={setPage}
                />
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Modals ── */}
      {isModalOpen && (
        <ItemFormModal
          editingItem={editingItem}
          onClose={() => setIsModalOpen(false)}
          onSubmit={handleFormSubmit}
          isSaving={isSaving}
          error={error}
          existingItems={data?.data ?? []}
        />
      )}

      {isPrModalOpen && (
        <PrFormModal
          form={prForm}
          setForm={setPrForm}
          lines={prLines}
          setLines={setPrLines}
          stagedFiles={stagedFiles}
          setStagedFiles={setStagedFiles}
          error={prError}
          isSaving={isPrSaving}
          onSubmit={handlePrSubmit}
          onClose={() => setIsPrModalOpen(false)}
          orgId={orgId}
        />
      )}
    </div>
  );
}

export default ItemListPage;