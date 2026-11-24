import type { Item } from "../../types/item";
import { ShoppingCart, Pencil, AlertTriangle } from "lucide-react";

interface ItemTableProps {
  items: Item[];
  stockFor: (itemId: number) => number;
  onEdit: (item: Item) => void;
  onCreatePR: (item: Item) => void;
  selectedIds?: number[];
  onToggleSelect?: (itemId: number) => void;
  onSelectAll?: (selectAll: boolean) => void;
}

export function ItemTable({
  items,
  stockFor,
  onEdit,
  onCreatePR,
  selectedIds = [],
  onToggleSelect,
  onSelectAll,
}: ItemTableProps) {
  const lowStockItems = items.filter((item) => {
    const stock = stockFor(item.id);
    const isAsset = item.item_type === "asset";
    return (
      !isAsset &&
      item.reorder_point !== null &&
      item.reorder_point !== undefined &&
      item.reorder_point > 0 &&
      stock <= item.reorder_point
    );
  });

  const allLowStockSelected =
    lowStockItems.length > 0 &&
    lowStockItems.every((i) => selectedIds.includes(i.id));

  return (
    <div className="border border-slate-200/90 rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200/90 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              {onSelectAll && (
                <th className="py-3 px-4 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={allLowStockSelected}
                    disabled={lowStockItems.length === 0}
                    onChange={(e) => onSelectAll(e.target.checked)}
                    className="rounded border-slate-300 text-amber-600 focus:ring-amber-500 cursor-pointer disabled:opacity-40"
                    title="Pilih semua item stok kritis"
                  />
                </th>
              )}
              <th className="py-3 px-4">Nama Item</th>
              <th className="py-3 px-4">Tipe</th>
              <th className="py-3 px-4">Stok Saat Ini</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
            {items.map((item) => {
              const stock = stockFor(item.id);
              const isAsset = item.item_type === "asset";
              const isLowStock =
                !isAsset &&
                item.reorder_point !== null &&
                item.reorder_point !== undefined &&
                item.reorder_point > 0 &&
                stock <= item.reorder_point;

              const isChecked = selectedIds.includes(item.id);

              return (
                <tr
                  key={item.id}
                  className={`hover:bg-slate-50/60 transition-colors ${
                    isChecked ? "bg-amber-50/40" : ""
                  }`}
                >
                  {onToggleSelect && (
                    <td className="py-3 px-4 text-center">
                      {isLowStock ? (
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => onToggleSelect(item.id)}
                          className="rounded border-slate-300 text-amber-600 focus:ring-amber-500 cursor-pointer"
                        />
                      ) : (
                        <span className="text-slate-300 text-xs">—</span>
                      )}
                    </td>
                  )}
                  <td className="py-3 px-4 font-medium text-slate-900">
                    <div className="flex items-center gap-2">
                      <span>{item.item_name}</span>
                      {isLowStock && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-600 border border-rose-200">
                          <AlertTriangle size={10} /> Kritis
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-xs font-semibold capitalize text-slate-500">
                    {item.item_type}
                  </td>
                  <td className="py-3 px-4 font-mono text-xs font-bold">
                    <span className={isLowStock ? "text-rose-600" : "text-slate-800"}>
                      {stock} {item.uom}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                        item.is_active
                          ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {item.is_active ? "Aktif" : "Non-Aktif"}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center justify-center gap-2">
                      {isLowStock ? (
                        <button
                          type="button"
                          onClick={() => onCreatePR(item)}
                          className="p-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg cursor-pointer transition-all shadow-xs"
                          title="Buat PR untuk item ini"
                        >
                          <ShoppingCart size={15} />
                        </button>
                      ) : (
                        <span className="text-xs text-slate-300">—</span>
                      )}
                      <button
                        type="button"
                        onClick={() => onEdit(item)}
                        className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer transition-all"
                        title="Edit Item"
                      >
                        <Pencil size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}