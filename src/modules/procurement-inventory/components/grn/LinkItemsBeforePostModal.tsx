import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { PackagePlus, CheckCircle2 } from "lucide-react";
import { Modal } from "@shared/components/Modal";
import { Button } from "@shared/components/Button";
import { InputField } from "@shared/components/InputField";
import { itemApi } from "../../api/itemApi";
import { useCreateItem } from "../../api/useItem";
import { extractErrorMessage } from "@shared/types/api";
import type { GoodsReceipt, GoodsReceiptLine } from "../../types/grn";
import type { Item, ItemType } from "../../types/item";
import type { usePostGrn } from "../../api/useGrn";

interface LinkItemsBeforePostModalProps {
  grn: GoodsReceipt;
  unlinkedLines: GoodsReceiptLine[];
  onClose: () => void;
  onPosted: () => void;
  postMutation: ReturnType<typeof usePostGrn>;
}

export function LinkItemsBeforePostModal({
  grn,
  unlinkedLines,
  onClose,
  onPosted,
  postMutation,
}: LinkItemsBeforePostModalProps) {
  const [links, setLinks] = useState<Record<number, number | null>>(
    Object.fromEntries(unlinkedLines.map((l) => [l.purchase_order_line_id, null]))
  );
  const [error, setError] = useState<string | null>(null);

  function setLink(poLineId: number, itemId: number | null) {
    setLinks((prev) => ({ ...prev, [poLineId]: itemId }));
  }

  async function handleConfirm() {
    setError(null);
    const missing = unlinkedLines.filter((l) => !links[l.purchase_order_line_id]);
    if (missing.length > 0) {
      setError("Semua baris wajib dihubungkan ke item katalog dulu sebelum posting.");
      return;
    }
    try {
      await postMutation.mutateAsync({
        item_links: unlinkedLines.map((l) => ({
          purchase_order_line_id: l.purchase_order_line_id,
          item_id: links[l.purchase_order_line_id]!,
        })),
      });
      onPosted();
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  }

  return (
    <Modal title={`Hubungkan Item ke Inventory — ${grn.grn_number}`} onClose={onClose} maxWidth={640}>
      <div className="flex flex-col gap-4 py-1">
        <div className="p-3 bg-amber-50 border border-amber-200/80 rounded-xl text-xs text-amber-800 leading-relaxed">
          Baris di bawah ini belum terhubung ke item katalog, jadi stoknya tidak akan tercatat di Item &amp; Inventory. Pilih item yang sesuai (atau buat item baru) untuk tiap baris sebelum melanjutkan post.
        </div>

        {unlinkedLines.map((line) => (
          <LineItemLinkRow
            key={line.purchase_order_line_id}
            description={line.purchase_order_line?.description ?? "—"}
            quantity={line.quantity_received}
            uom={line.purchase_order_line?.uom ?? ""}
            selectedItemId={links[line.purchase_order_line_id]}
            onSelect={(itemId) => setLink(line.purchase_order_line_id, itemId)}
          />
        ))}

        {error && <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs">{error}</div>}

        <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
          <Button type="button" variant="secondary" onClick={onClose} className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 font-medium text-xs rounded-xl">
            Batal
          </Button>
          <Button type="button" disabled={postMutation.isPending} onClick={handleConfirm} className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-white font-medium text-xs rounded-xl shadow-xs">
            {postMutation.isPending ? "Memproses..." : "Hubungkan & Post"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function LineItemLinkRow({
  description,
  quantity,
  uom,
  selectedItemId,
  onSelect,
}: {
  description: string;
  quantity: number;
  uom: string;
  selectedItemId: number | null;
  onSelect: (itemId: number | null) => void;
}) {
  const [mode, setMode] = useState<"search" | "create">("search");
  const [search, setSearch] = useState("");
  const [selectedLabel, setSelectedLabel] = useState<string | null>(null);
  const createMutation = useCreateItem();

  const { data: results } = useQuery({
    queryKey: ["item-search-grn", search],
    queryFn: () => itemApi.list({ search, per_page: 10 }).then((r) => r.data?.data ?? []),
    enabled: mode === "search" && search.length >= 2,
  });

  const [newItemForm, setNewItemForm] = useState({ item_name: description, item_type: "sparepart" as ItemType, uom: uom || "pcs" });
  const [createError, setCreateError] = useState<string | null>(null);

  async function handleCreate() {
    setCreateError(null);
    if (!newItemForm.item_name.trim()) {
      setCreateError("Nama item wajib diisi.");
      return;
    }
    try {
      const res = await createMutation.mutateAsync({
        item_name: newItemForm.item_name.trim(),
        item_type: newItemForm.item_type,
        uom: newItemForm.uom || "pcs",
      });
      const created = res.data.data as Item;
      onSelect(created.id);
      setSelectedLabel(`${created.item_code} — ${created.item_name}`);
      setMode("search");
    } catch (err) {
      setCreateError(extractErrorMessage(err));
    }
  }

  return (
    <div className="p-3 border border-slate-200 rounded-xl bg-slate-50/50 flex flex-col gap-2">
      <div className="text-xs font-semibold text-slate-800">{description}</div>
      <div className="text-[11px] text-slate-400">Qty diterima: {quantity} {uom}</div>

      {selectedItemId && selectedLabel && (
        <div className="flex items-center justify-between p-2 bg-emerald-50 border border-emerald-200 rounded-lg text-xs font-medium text-emerald-700">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 size={13} className="text-emerald-600 shrink-0" />
            <span>{selectedLabel}</span>
          </span>
          <button
            type="button"
            onClick={() => {
              onSelect(null);
              setSelectedLabel(null);
            }}
            className="text-rose-600 hover:underline text-[11px] font-semibold cursor-pointer"
          >
            Ganti
          </button>
        </div>
      )}

      {!selectedItemId && (
        <>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setMode("search")}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors cursor-pointer ${
                mode === "search"
                  ? "bg-slate-200 text-slate-800"
                  : "bg-slate-100 text-slate-500 hover:bg-slate-200"
              }`}
            >
              Cari Item
            </button>
            <button
              type="button"
              onClick={() => setMode("create")}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium flex items-center gap-1 transition-colors cursor-pointer ${
                mode === "create"
                  ? "bg-slate-200 text-slate-800"
                  : "bg-slate-100 text-slate-500 hover:bg-slate-200"
              }`}
            >
              <PackagePlus size={13} /> Item Baru
            </button>
          </div>

          {mode === "search" && (
            <div className="relative">
              <input
                className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-amber-500"
                placeholder="Ketik nama/kode item (min 2 huruf)..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {search.length >= 2 && results && (
                <div className="absolute top-full left-0 right-0 z-30 bg-white border border-slate-200 rounded-lg shadow-md max-h-36 overflow-y-auto mt-1 divide-y divide-slate-100">
                  {results.length === 0 && (
                    <div className="p-2 text-[11px] text-slate-400">Tidak ditemukan — coba "Item Baru".</div>
                  )}
                  {results.map((it) => (
                    <button
                      key={it.id}
                      type="button"
                      className="w-full text-left px-3 py-1.5 text-xs text-slate-700 hover:bg-amber-50 hover:text-amber-700 transition-colors cursor-pointer"
                      onClick={() => {
                        onSelect(it.id);
                        setSelectedLabel(`${it.item_code} — ${it.item_name}`);
                        setSearch("");
                      }}
                    >
                      <span className="font-mono font-bold text-amber-600">{it.item_code}</span> — {it.item_name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {mode === "create" && (
            <div className="p-3 bg-white border border-slate-200 rounded-xl flex flex-col gap-2">
              <div className="text-[11px] text-slate-400">
                Kode item akan dibuat otomatis oleh sistem.
              </div>
              <InputField
                label="UoM"
                value={newItemForm.uom}
                onChange={(e) => setNewItemForm((f) => ({ ...f, uom: e.target.value }))}
              />
              <InputField
                label="Nama Item *"
                value={newItemForm.item_name}
                onChange={(e) => setNewItemForm((f) => ({ ...f, item_name: e.target.value }))}
              />
              {createError && <div className="p-2 bg-red-50 border border-red-200 text-red-600 rounded-lg text-[11px]">{createError}</div>}
              <Button
                type="button"
                disabled={createMutation.isPending}
                onClick={handleCreate}
                className="self-start px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white font-medium text-xs rounded-lg shadow-xs transition-all cursor-pointer"
              >
                {createMutation.isPending ? "Membuat..." : "+ Buat & Pilih"}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}