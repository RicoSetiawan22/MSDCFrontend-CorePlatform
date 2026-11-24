import React, { useState, useMemo } from "react";
import { Server, Check, ChevronDown, ChevronUp } from "lucide-react";
import type { DashboardDetailsData } from "../../types/dashboard";
import type { Rack } from "../../types/rack";
import { Card, CardHeader, CardTitle, CardContent } from "@shared/components/ui/Card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@shared/components/ui/Table";
import { Badge } from "@shared/components/ui/Badge";
import { ProgressBar } from "@shared/components/ui/ProgressBar";

export interface RackOccupancySectionProps {
  details?: DashboardDetailsData | null;
  racks?: Rack[];
  totalKnownRacks?: number;
  onViewRackDetail?: (rackId: number) => void;
}

export const RackOccupancySection: React.FC<RackOccupancySectionProps> = ({
  details,
  racks,
  totalKnownRacks = 3,
  onViewRackDetail,
}) => {
  // ── 1. State Management ──
  const [isOpen, setIsOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<"kosong" | "terpakai">("kosong");

  // ── 2. Data Komputasi (Zero Logic Change) ──
  const { emptyRacks, topUsedRacks, emptyCount, totalRacks } = useMemo(() => {
    // Prioritaskan data real dari endpoint /v1/data-center-ops/racks
    if (racks && racks.length > 0) {
      const empty = racks
        .filter((r) => (r.used_u ?? 0) === 0)
        .map((r) => ({
          id: r.id,
          rack_code: r.rack_code,
          total_u: r.total_u || 42,
          power_watt: r.power_capacity_watt ? Number(r.power_capacity_watt) : null,
          site: r.site_room?.site?.site_name || "Data Center Surabaya 1",
          room: r.site_room?.room_name || "Server Room",
          status: r.status,
        }));

      const top = [...racks]
        .filter((r) => (r.used_u ?? 0) > 0)
        .sort((a, b) => (b.used_u ?? 0) - (a.used_u ?? 0))
        .map((r) => ({
          id: r.id,
          rack_code: r.rack_code,
          site: r.site_room?.site?.site_name || "Data Center Surabaya 1",
          used_u: r.used_u ?? 0,
          total_u: r.total_u || 42,
          free_u: r.free_u ?? Math.max(0, (r.total_u || 42) - (r.used_u ?? 0)),
        }));

      return {
        emptyRacks: empty,
        topUsedRacks: top,
        emptyCount: empty.length,
        totalRacks: racks.length,
      };
    }

    const rackDetails = details?.rack_details;
    const empty = rackDetails?.empty_racks ?? [];
    const top = (rackDetails?.top_used ?? []).map((item) => ({
      ...item,
      total_u: item.total_u || 42,
      free_u: item.free_u ?? Math.max(0, (item.total_u || 42) - item.used_u),
    }));
    const count = rackDetails?.empty_count ?? empty.length;
    const total = totalKnownRacks || Math.max(top.length + count, 3);

    return {
      emptyRacks: empty,
      topUsedRacks: top,
      emptyCount: count,
      totalRacks: total,
    };
  }, [racks, details?.rack_details, totalKnownRacks]);

  return (
    <Card className="min-w-0 bg-white rounded-2xl border border-slate-200/80 shadow-2xs">
      {/* ── 1. Top Card Header ── */}
      <CardHeader className={isOpen ? "border-b border-slate-100" : ""}>
        <div className="flex items-center gap-2.5">
          <Server size={18} className="text-amber-500" />
          <CardTitle className="text-sm font-extrabold text-slate-900 uppercase tracking-wide">
            Rack Kosong &amp; Terpakai
          </CardTitle>
        </div>

        {/* Sisi Kanan: Segmented Control Toggle & Collapse Button */}
        <div className="flex items-center gap-3">
          {/* Segmented Control (Pill Toggle) */}
          <div className="inline-flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200/80">
            <button
              type="button"
              onClick={() => setActiveTab("kosong")}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                activeTab === "kosong"
                  ? "bg-white text-slate-900 font-bold shadow-2xs"
                  : "text-slate-500 hover:text-slate-800 bg-transparent"
              }`}
            >
              Kosong
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("terpakai")}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                activeTab === "terpakai"
                  ? "bg-white text-slate-900 font-bold shadow-2xs"
                  : "text-slate-500 hover:text-slate-800 bg-transparent"
              }`}
            >
              Terpakai
            </button>
          </div>

          {/* Toggle Collapse Button */}
          <button
            type="button"
            onClick={() => setIsOpen((prev) => !prev)}
            aria-expanded={isOpen}
            aria-label={
              isOpen
                ? "Tutup panel Rack Kosong & Terpakai"
                : "Buka panel Rack Kosong & Terpakai"
            }
            className="border border-slate-200/80 bg-white cursor-pointer text-slate-500 hover:text-slate-900 p-1.5 flex items-center justify-center rounded-lg hover:bg-slate-50 shadow-2xs transition-colors"
          >
            {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      </CardHeader>

      {/* ── 2. Collapsible Body (Full Width Single Table View) ── */}
      {isOpen && (
        <CardContent className="p-5">
          {activeTab === "kosong" ? (
            /* ── Tab: Rack Kosong ── */
            <div className="min-w-0">
              {/* Sub-header */}
              <div className="flex justify-between items-center mb-3.5 flex-wrap gap-2">
                <div className="flex items-center gap-2.5">
                  <h4 className="m-0 text-xs font-extrabold uppercase tracking-wide text-emerald-700">
                    Rack Kosong ({emptyCount})
                  </h4>
                  <Badge variant="success">
                    {emptyCount === 0 ? "100% Utilized" : `${emptyCount} Unit Siap Pakai`}
                  </Badge>
                </div>

                <span className="text-xs text-slate-500">
                  Diurutkan berdasarkan sisa U tertinggi
                </span>
              </div>

              {/* Tabel / Konten Rack Kosong */}
              <div className="border border-slate-200/80 rounded-xl overflow-hidden bg-white shadow-2xs">
                <Table>
                  <TableHeader className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 uppercase tracking-wider text-[11px]">
                    <tr>
                      <TableHead className="py-3 px-4">KODE</TableHead>
                      <TableHead className="py-3 px-4">SITE</TableHead>
                      <TableHead className="py-3 px-4 text-center">SISA U</TableHead>
                      <TableHead className="py-3 px-4 text-right">KAPASITAS</TableHead>
                    </tr>
                  </TableHeader>
                  <TableBody>
                    {emptyCount === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-10 px-4 text-center">
                          <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-3">
                            <Check size={20} className="text-emerald-600 stroke-[2.5]" />
                          </div>
                          <div className="font-bold text-sm text-slate-900">
                            Semua Rack Terisi (0 Kosong)
                          </div>
                          <div className="text-xs text-slate-500 mt-1">
                            Seluruh {totalRacks} rack memiliki alokasi aktif (tidak ada rack 0 U terpakai).
                          </div>
                        </td>
                      </tr>
                    ) : (
                      emptyRacks.map((rack) => (
                        <TableRow
                          key={rack.id}
                          isClickable={!!onViewRackDetail}
                          onClick={() => onViewRackDetail?.(rack.id)}
                          className="border-b border-slate-100 hover:bg-slate-50/70 transition-colors"
                        >
                          <TableCell className="font-bold text-slate-900 py-3.5 px-4 text-sm">
                            {rack.rack_code}
                          </TableCell>
                          <TableCell className="font-medium text-slate-600 py-3.5 px-4 text-xs">
                            {rack.site}
                          </TableCell>
                          <TableCell className="text-center font-bold text-emerald-600 py-3.5 px-4 text-xs">
                            {rack.total_u} U
                          </TableCell>
                          <TableCell className="text-right text-slate-500 py-3.5 px-4 text-xs">
                            {rack.total_u} U
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          ) : (
            /* ── Tab: Rack Paling Terpakai ── */
            <div className="min-w-0">
              {/* Sub-header */}
              <div className="flex justify-between items-center mb-3.5 flex-wrap gap-2">
                <div className="flex items-center gap-2.5">
                  <h4 className="m-0 text-xs font-extrabold uppercase tracking-wide text-amber-700">
                    Rack Paling Terpakai ({topUsedRacks.length})
                  </h4>
                </div>

                <span className="text-xs text-slate-500">
                  Diurutkan berdasarkan utilisasi tertinggi
                </span>
              </div>

              {/* Tabel Rack Paling Terpakai */}
              <div className="border border-slate-200/80 rounded-xl overflow-hidden bg-white shadow-2xs">
                <Table>
                  <TableHeader className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 uppercase tracking-wider text-[11px]">
                    <tr>
                      <TableHead className="py-3 px-4">KODE</TableHead>
                      <TableHead className="py-3 px-4">SITE</TableHead>
                      <TableHead className="py-3 px-4 text-right">USED U</TableHead>
                      <TableHead className="py-3 px-4 text-right w-[160px]">KAPASITAS</TableHead>
                    </tr>
                  </TableHeader>
                  <TableBody>
                    {topUsedRacks.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-8 px-4 text-center text-slate-400 text-xs">
                          Belum ada data rack terpakai.
                        </td>
                      </tr>
                    ) : (
                      topUsedRacks.map((item) => {
                        const totalU = item.total_u > 0 ? item.total_u : 42;
                        const usedU = item.used_u ?? 0;
                        const freeU = item.free_u ?? Math.max(0, totalU - usedU);
                        const pct = totalU > 0 ? Math.min(100, Math.round((usedU / totalU) * 100)) : 0;

                        return (
                          <TableRow
                            key={item.id}
                            isClickable={!!onViewRackDetail}
                            onClick={() => onViewRackDetail?.(item.id)}
                            className="border-b border-slate-100 hover:bg-slate-50/70 transition-colors"
                          >
                            <TableCell className="font-bold text-slate-900 py-3.5 px-4 text-sm">
                              {item.rack_code}
                            </TableCell>
                            <TableCell className="font-medium text-slate-600 py-3.5 px-4 text-xs">
                              {item.site}
                            </TableCell>
                            <TableCell className="text-right font-bold py-3.5 px-4 text-xs text-amber-600">
                              {item.used_u} U
                            </TableCell>
                            <TableCell
                              className="text-right w-[160px] py-3.5 px-4"
                              title={`Utilisasi: ${pct}% (${usedU}U terpakai, ${freeU}U kosong dari total ${totalU}U)`}
                            >
                              <ProgressBar
                                percentage={pct}
                                maxLabel={`${totalU}U`}
                                maxWidth="130px"
                              />
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
};
