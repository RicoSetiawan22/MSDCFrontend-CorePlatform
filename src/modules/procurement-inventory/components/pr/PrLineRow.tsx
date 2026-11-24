import { useState } from "react";
import { Trash2, Package, Wrench, AlertTriangle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { itemApi } from "../../api/itemApi";
import { CurrencyInput } from "@shared/components/CurrencyInput";
import type { PrLineForm } from "../../types/pr";
import type { Item } from "../../types/item";

const GOODS_UOM = ["pcs", "unit", "box", "roll", "meter", "kg", "liter", "pack", "set", "rim"];
const SERVICE_UOM = ["paket", "kali", "jam", "hari", "bulan", "proyek", "titik", "kunjungan"];

export function PrLineRow({
  line,
  idx,
  onUpdate,
  onRemove,
  canRemove,
  orgId,
}: {
  line: PrLineForm;
  idx: number;
  onUpdate: (i: number, f: keyof PrLineForm, v: unknown) => void;
  onRemove: (i: number) => void;
  canRemove: boolean;
  orgId: number;
}) {
  const [itemSearch, setItemSearch] = useState("");

  const { data: itemResults } = useQuery({
    queryKey: ["item-search", itemSearch, orgId],
    queryFn: () =>
      itemApi
        .list({ search: itemSearch, per_page: 10 })
        .then((r) => r.data?.data ?? []),
    enabled: itemSearch.length >= 2,
  });

  const isService = line.line_type === "service";
  const lineSubtotal = (line.quantity || 0) * (line.estimated_unit_price || 0);
  const isPriceZero = !line.estimated_unit_price || line.estimated_unit_price <= 0;

  return (
    <div className="p-3 bg-white border border-slate-200 rounded-xl shadow-xs flex flex-col gap-2">
      {/* Type Toggle: Goods vs Service & Subtotal Preview */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              onUpdate(idx, "line_type", "goods");
              if (!GOODS_UOM.includes(line.uom)) onUpdate(idx, "uom", "pcs");
            }}
            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
              line.line_type === "goods"
                ? "bg-amber-100 text-amber-700 border border-amber-300"
                : "bg-slate-50 text-slate-400 border border-slate-200"
            }`}
          >
            <Package size={11} />
            <span>Barang</span>
          </button>
          <button
            type="button"
            onClick={() => {
              onUpdate(idx, "line_type", "service");
              onUpdate(idx, "item_id", null);
              if (!SERVICE_UOM.includes(line.uom)) onUpdate(idx, "uom", "paket");
            }}
            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
              line.line_type === "service"
                ? "bg-amber-100 text-amber-700 border border-amber-300"
                : "bg-slate-50 text-slate-400 border border-slate-200"
            }`}
          >
            <Wrench size={11} />
            <span>Jasa / Service</span>
          </button>
        </div>

        {/* Per-Line Subtotal Display */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400 text-[11px]">Subtotal:</span>
          <span className={`font-mono font-bold ${isPriceZero ? "text-red-500" : "text-slate-800"}`}>
            Rp {lineSubtotal.toLocaleString("id-ID")}
          </span>
          {isPriceZero && (
            <span className="text-[10px] text-red-500 flex items-center gap-0.5 font-medium">
              <AlertTriangle size={11} /> Estimasi wajib &gt; 0
            </span>
          )}
        </div>
      </div>

      {/* Grid Inputs */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
        {/* Item Picker (If Goods) */}
        <div className="sm:col-span-3 relative">
          {isService ? (
            <div className="text-xs text-amber-700/80 bg-amber-50/50 py-1.5 px-2.5 rounded-lg border border-amber-100 font-medium text-center">
              Jasa (Non-Katalog)
            </div>
          ) : (
            <div>
              <input
                type="text"
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:outline-none focus:border-amber-500"
                placeholder={line.item_name || "Pilih / Cari item..."}
                value={itemSearch}
                onChange={(e) => {
                  setItemSearch(e.target.value);
                  if (!e.target.value) onUpdate(idx, "item_id", null);
                }}
              />
              {itemSearch.length >= 2 && itemResults && (
                <div className="absolute top-full left-0 right-0 z-50 bg-white border border-slate-200 rounded-lg shadow-lg max-h-36 overflow-y-auto mt-1">
                  {itemResults.map((it: Item) => (
                    <button
                      key={it.id}
                      type="button"
                      className="w-full text-left px-3 py-1.5 text-xs hover:bg-slate-50 cursor-pointer"
                      onClick={() => {
                        onUpdate(idx, "item_id", it.id);
                        onUpdate(idx, "item_name", it.item_name);
                        onUpdate(idx, "description", it.item_name);
                        onUpdate(idx, "uom", it.uom ?? "pcs");
                        if (it.standard_price && it.standard_price > 0) {
                          onUpdate(idx, "estimated_unit_price", it.standard_price);
                        }
                        setItemSearch("");
                      }}
                    >
                      {it.item_code} — {it.item_name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Description */}
        <div className="sm:col-span-3">
          <input
            type="text"
            required
            className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:outline-none focus:border-amber-500"
            placeholder={isService ? "mis. Perbaikan AC Kantor" : "Spesifikasi / Nama Barang"}
            value={line.description}
            onChange={(e) => onUpdate(idx, "description", e.target.value)}
          />
        </div>

        {/* Qty */}
        <div className="sm:col-span-1">
          <input
            type="number"
            min={0.01}
            step="any"
            required
            className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-center focus:bg-white focus:outline-none focus:border-amber-500 font-mono"
            value={line.quantity}
            onFocus={(e) => e.target.select()}
            onChange={(e) => onUpdate(idx, "quantity", Number(e.target.value))}
          />
        </div>

        {/* Satuan Dinamis (Dropdown Sesuai Tipe Barang vs Jasa) */}
        <div className="sm:col-span-2">
          <select
            className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-amber-500 cursor-pointer"
            value={line.uom}
            onChange={(e) => onUpdate(idx, "uom", e.target.value)}
          >
            {isService
              ? SERVICE_UOM.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))
              : GOODS_UOM.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
          </select>
        </div>

        {/* Price Currency Input */}
        <div className="sm:col-span-2">
          <CurrencyInput
            value={line.estimated_unit_price}
            onChange={(v) => onUpdate(idx, "estimated_unit_price", v)}
            placeholder="Estimasi/satuan"
          />
        </div>

        {/* Delete Button */}
        <div className="sm:col-span-1 text-center">
          <button
            type="button"
            onClick={() => onRemove(idx)}
            disabled={!canRemove}
            className={`p-1.5 rounded-lg ${
              canRemove
                ? "text-red-500 hover:bg-red-50 cursor-pointer"
                : "text-slate-300 cursor-not-allowed"
            }`}
            title="Hapus baris"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}