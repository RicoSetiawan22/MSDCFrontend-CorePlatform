import { PageHeader } from "@shared/components/PageHeader";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, DollarSign, Landmark, CalendarX2, Hash, Clock4, BookOpen, Search } from "lucide-react";
import { masterDataApi } from "../api/masterDataApi";
import { NumberSequenceSetupModal } from "../components/NumberSequenceSetupModal";
import { NumberSequenceEditModal } from "../components/NumberSequenceEditModal";
import { OvertimeRateFormModal } from "../components/OvertimeRateFormModal";
import { PostingRuleFormModal } from "../components/PostingRuleFormModal";
import { CurrencyFormModal } from "../components/CurrencyFormModal";
import { BankFormModal } from "../components/BankFormModal";
import { HolidayFormModal } from "../components/HolidayFormModal";
import { useAccountList } from "@modules/finance-accounting/api/useAccounts";
import { Button } from "@shared/components/Button";
import { LoadingState } from "@shared/components/LoadingState";
import { extractErrorMessage } from "@shared/types/api";
import { formatDate, formatCurrency } from "@shared/lib/format";
import type { NumberSequence, OvertimeRate, PostingRule, Bank, Holiday } from "../types/masterData";

const HOLIDAY_TYPE_LABEL: Record<string, string> = {
  national: "Nasional",
  regional: "Regional",
  company: "Perusahaan",
};

const TRANSACTION_TYPE_LABELS: Record<string, string> = {
  payroll: "Payroll",
  ar_invoice: "AR Invoice",
  ap_bill: "AP Bill",
};

export function MasterDataPage() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<"currency" | "bank" | "holiday" | "sequence" | "overtime" | "posting">("currency");
  const [search, setSearch] = useState("");
  const [showSequenceModal, setShowSequenceModal] = useState(false);
  const [editSequence, setEditSequence] = useState<NumberSequence | null>(null);
  const [showOvertimeRateModal, setShowOvertimeRateModal] = useState(false);
  const [editOvertimeRate, setEditOvertimeRate] = useState<OvertimeRate | null>(null);
  const [editPostingRule, setEditPostingRule] = useState<PostingRule | null>(null);
  const [showCurrencyModal, setShowCurrencyModal] = useState(false);
  const [showBankModal, setShowBankModal] = useState(false);
  const [editBank, setEditBank] = useState<Bank | null>(null);
  const [showHolidayModal, setShowHolidayModal] = useState(false);
  const [editHoliday, setEditHoliday] = useState<Holiday | null>(null);

  const { data: currencies, isLoading: loadingCurrency } = useQuery({
    queryKey: ["mdCurrencies"] as const,
    queryFn: () => masterDataApi.currencies().then(r => r.data.data),
  });
  const { data: banks, isLoading: loadingBank } = useQuery({
    queryKey: ["mdBanks"] as const,
    queryFn: () => masterDataApi.banks().then(r => r.data.data),
  });
  const { data: holidays, isLoading: loadingHoliday } = useQuery({
    queryKey: ["mdHolidays"] as const,
    queryFn: () => masterDataApi.holidays({}).then(r => r.data.data),
  });
  const { data: sequences, isLoading: loadingSeq } = useQuery({
    queryKey: ["mdSequences"] as const,
    queryFn: () => masterDataApi.numberSequences().then(r => r.data),
  });
  const { data: overtimeRates, isLoading: loadingOvertimeRate } = useQuery({
    queryKey: ["mdOvertimeRates"] as const,
    queryFn: () => masterDataApi.overtimeRates().then(r => r.data),
  });
  const { data: postingRules, isLoading: loadingPostingRules } = useQuery({
    queryKey: ["mdPostingRules"] as const,
    queryFn: () => masterDataApi.postingRules().then(r => r.data.data),
  });
  const { data: accountsForNames } = useAccountList({ per_page: 100 });
  const accountNameByCode = new Map((accountsForNames?.data ?? []).map(a => [a.account_code, a.account_name]));

  async function handleDeleteHoliday(h: Holiday) {
    if (!confirm(`Hapus hari libur "${h.name}"?`)) return;
    try {
      await masterDataApi.deleteHoliday(h.id);
      qc.invalidateQueries({ queryKey: ["mdHolidays"] });
    } catch (err) { alert(extractErrorMessage(err)); }
  }

  const tabs = [
    { key: "currency" as const, label: "Currency", icon: DollarSign, count: currencies?.length ?? 0, loading: loadingCurrency },
    { key: "bank" as const, label: "Bank", icon: Landmark, count: banks?.length ?? 0, loading: loadingBank },
    { key: "holiday" as const, label: "Hari Libur", icon: CalendarX2, count: holidays?.length ?? 0, loading: loadingHoliday },
    { key: "sequence" as const, label: "Number Sequence", icon: Hash, count: sequences?.data.length ?? 0, loading: loadingSeq },
    { key: "overtime" as const, label: "Tarif Lembur", icon: Clock4, count: overtimeRates?.data.length ?? 0, loading: loadingOvertimeRate },
    { key: "posting" as const, label: "Posting GL", icon: BookOpen, count: postingRules?.length ?? 0, loading: loadingPostingRules },
  ];

  const activeTab = tabs.find(t => t.key === tab)!;

  // Determine add action & button label per tab
  const addActions: Partial<Record<typeof tab, { label: string; onClick: () => void }>> = {
    currency: { label: "Tambah Currency", onClick: () => setShowCurrencyModal(true) },
    bank: { label: "Tambah Bank", onClick: () => setShowBankModal(true) },
    holiday: { label: "Tambah Hari Libur", onClick: () => setShowHolidayModal(true) },
    sequence: { label: "Tambah Sequence", onClick: () => setShowSequenceModal(true) },
    overtime: { label: "Tambah Tarif", onClick: () => setShowOvertimeRateModal(true) },
  };

  const addAction = addActions[tab];

  return (
    <main className="flex-1 overflow-y-auto bg-slate-50 min-h-screen w-full font-sans">
      <PageHeader
        title="Master Data"
        subtitle="Referensi global — currency, bank, holiday, number sequence, dan aturan posting."
      />
      <div className="px-7 py-5 space-y-6">

      {/* Main Card */}
      <section className="bg-white border border-slate-200/90 rounded-2xl shadow-sm overflow-hidden">
        {/* Tab Navigation - Underline Style */}
        <div className="border-b border-slate-200 px-4 sm:px-6 flex items-center gap-1 overflow-x-auto">
          {tabs.map(t => {
            const isActive = tab === t.key;
            const Icon = t.icon;
            return (
              <button
                key={t.key}
                onClick={() => { setTab(t.key); setSearch(""); }}
                className={`py-4 flex items-center gap-2 text-[13px] font-bold transition-all border-b-2 border-t-0 border-x-0 px-3 whitespace-nowrap outline-none focus:outline-none focus:ring-0 ring-0 shadow-none ${
                  isActive
                    ? "border-amber-500 text-amber-600"
                    : "border-transparent text-slate-500 hover:text-slate-700"
                }`}
              >
                <Icon size={15} className={isActive ? "text-amber-500" : "text-slate-400"} />
                <span>{t.label}</span>
                <span className={`ml-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                  isActive ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-500"
                }`}>
                  {t.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Toolbar: Search + Add Button */}
        <div className="p-4 sm:px-6 sm:py-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-100">
          <div className="relative w-full sm:w-80">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <Search size={16} className="text-slate-400" />
            </div>
            <input
              type="text"
              placeholder={`Cari data ${activeTab.label.toLowerCase()}...`}
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs bg-white rounded-xl border border-slate-300 placeholder-slate-400 text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-colors shadow-sm"
            />
          </div>
          {addAction && (
            <Button onClick={addAction.onClick}>
              <Plus size={15} />
              {addAction.label}
            </Button>
          )}
        </div>

        {/* TAB: Currency */}
        {tab === "currency" && (
          <>
            {loadingCurrency && <LoadingState />}
            {!loadingCurrency && (
              <div className="overflow-x-auto min-h-[250px]">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50/70 border-b border-slate-200/80 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      <th className="py-3.5 px-6">Kode</th>
                      <th className="py-3.5 px-6">Nama Currency</th>
                      <th className="py-3.5 px-6">Symbol</th>
                      <th className="py-3.5 px-6 text-center">Desimal</th>
                      <th className="py-3.5 px-6 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(currencies ?? [])
                      .filter(c => c.code.toLowerCase().includes(search.toLowerCase()) || c.name.toLowerCase().includes(search.toLowerCase()))
                      .map(c => (
                        <tr key={c.id} className="hover:bg-amber-50/30 transition-colors group">
                          <td className="py-4 px-6 whitespace-nowrap">
                            <span className="font-mono font-bold text-amber-600 bg-amber-50 border border-amber-200/80 px-2 py-1 rounded-md">{c.code}</span>
                          </td>
                          <td className="py-4 px-6 font-semibold text-slate-800">{c.name}</td>
                          <td className="py-4 px-6 font-mono text-slate-600">{c.symbol ?? "—"}</td>
                          <td className="py-4 px-6 text-center text-slate-600">{c.decimal_places}</td>
                          <td className="py-4 px-6 text-center">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${c.is_active ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-slate-50 text-slate-600 border border-slate-200"}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${c.is_active ? "bg-emerald-500" : "bg-slate-400"}`}></span>
                              {c.is_active ? "Aktif" : "Nonaktif"}
                            </span>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {/* TAB: Bank */}
        {tab === "bank" && (
          <>
            {loadingBank && <LoadingState />}
            {!loadingBank && (
              <div className="overflow-x-auto min-h-[250px]">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50/70 border-b border-slate-200/80 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      <th className="py-3.5 px-6">Kode</th>
                      <th className="py-3.5 px-6">Nama Bank</th>
                      <th className="py-3.5 px-6">Cabang</th>
                      <th className="py-3.5 px-6">No. Rekening</th>
                      <th className="py-3.5 px-6">Atas Nama</th>
                      <th className="py-3.5 px-6 text-center">Status</th>
                      <th className="py-3.5 px-6 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(banks ?? [])
                      .filter(b => b.code.toLowerCase().includes(search.toLowerCase()) || b.name.toLowerCase().includes(search.toLowerCase()))
                      .map(b => (
                        <tr key={b.id} className="hover:bg-amber-50/30 transition-colors group">
                          <td className="py-4 px-6 whitespace-nowrap">
                            <span className="font-mono font-bold text-amber-600 bg-amber-50 border border-amber-200/80 px-2 py-1 rounded-md">{b.code}</span>
                          </td>
                          <td className="py-4 px-6 font-semibold text-slate-800">{b.name}</td>
                          <td className="py-4 px-6 text-slate-600">{b.branch_name ?? "—"}</td>
                          <td className="py-4 px-6 font-mono text-slate-600">{b.account_number ?? "—"}</td>
                          <td className="py-4 px-6 text-slate-600">{b.account_name ?? "—"}</td>
                          <td className="py-4 px-6 text-center">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${b.is_active ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-slate-50 text-slate-600 border border-slate-200"}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${b.is_active ? "bg-emerald-500" : "bg-slate-400"}`}></span>
                              {b.is_active ? "Aktif" : "Nonaktif"}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-right">
                            <button type="button" onClick={() => setEditBank(b)} className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors opacity-80 group-hover:opacity-100" title="Edit Bank">
                              <Pencil size={15} />
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {/* TAB: Holiday */}
        {tab === "holiday" && (
          <>
            {loadingHoliday && <LoadingState />}
            {!loadingHoliday && (
              <div className="overflow-x-auto min-h-[250px]">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50/70 border-b border-slate-200/80 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      <th className="py-3.5 px-6">Tanggal</th>
                      <th className="py-3.5 px-6">Nama Hari Libur</th>
                      <th className="py-3.5 px-6">Tipe</th>
                      <th className="py-3.5 px-6 text-center">Berulang / Tahun</th>
                      <th className="py-3.5 px-6 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(holidays ?? [])
                      .filter(h => h.name.toLowerCase().includes(search.toLowerCase()))
                      .map(h => (
                        <tr key={h.id} className="hover:bg-amber-50/30 transition-colors group">
                          <td className="py-4 px-6 font-mono text-slate-600 whitespace-nowrap">{formatDate(h.date)}</td>
                          <td className="py-4 px-6 font-semibold text-slate-800">{h.name}</td>
                          <td className="py-4 px-6">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                              {h.type ? HOLIDAY_TYPE_LABEL[h.type] : "—"}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-center">
                            {h.is_recurring_yearly 
                              ? <span className="inline-flex items-center gap-1 text-emerald-600 font-bold text-[11px]">✓ Ya</span>
                              : <span className="text-slate-400">—</span>
                            }
                          </td>
                          <td className="py-4 px-6 text-right">
                            <div className="inline-flex items-center gap-1 opacity-80 group-hover:opacity-100">
                              <button type="button" onClick={() => setEditHoliday(h)} className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors" title="Edit">
                                <Pencil size={15} />
                              </button>
                              <button type="button" onClick={() => handleDeleteHoliday(h)} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors" title="Hapus">
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {/* TAB: Number Sequence */}
        {tab === "sequence" && (
          <>
            {loadingSeq && <LoadingState />}
            {!loadingSeq && (
              <div className="overflow-x-auto min-h-[250px]">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50/70 border-b border-slate-200/80 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      <th className="py-3.5 px-6">Module Code</th>
                      <th className="py-3.5 px-6">Prefix</th>
                      <th className="py-3.5 px-6">Format</th>
                      <th className="py-3.5 px-6 text-center">Nomor Saat Ini</th>
                      <th className="py-3.5 px-6">Reset Period</th>
                      <th className="py-3.5 px-6 text-center">Status</th>
                      <th className="py-3.5 px-6 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(sequences?.data ?? [])
                      .filter(s => s.module_code.toLowerCase().includes(search.toLowerCase()) || s.prefix.toLowerCase().includes(search.toLowerCase()))
                      .map(s => (
                        <tr key={s.id} className="hover:bg-amber-50/30 transition-colors group">
                          <td className="py-4 px-6 whitespace-nowrap">
                            <span className="font-mono font-bold text-amber-600 bg-amber-50 border border-amber-200/80 px-2 py-1 rounded-md">{s.module_code}</span>
                          </td>
                          <td className="py-4 px-6 font-mono text-slate-700">{s.prefix}</td>
                          <td className="py-4 px-6 font-mono text-[11px] text-slate-500">{s.format}</td>
                          <td className="py-4 px-6 text-center font-mono font-bold text-slate-800">{s.current_number}</td>
                          <td className="py-4 px-6 capitalize text-slate-600">{s.reset_period}</td>
                          <td className="py-4 px-6 text-center">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${s.is_active ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-slate-50 text-slate-600 border border-slate-200"}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${s.is_active ? "bg-emerald-500" : "bg-slate-400"}`}></span>
                              {s.is_active ? "Aktif" : "Nonaktif"}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-right">
                            <button type="button" onClick={() => setEditSequence(s)} className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors opacity-80 group-hover:opacity-100" title="Edit Sequence">
                              <Pencil size={15} />
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {/* TAB: Overtime Rate */}
        {tab === "overtime" && (
          <>
            {loadingOvertimeRate && <LoadingState />}
            {!loadingOvertimeRate && (
              <div className="overflow-x-auto min-h-[250px]">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50/70 border-b border-slate-200/80 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      <th className="py-3.5 px-6">Kode</th>
                      <th className="py-3.5 px-6">Nama Tarif</th>
                      <th className="py-3.5 px-6 text-right">Tarif / Jam</th>
                      <th className="py-3.5 px-6 text-center">Default</th>
                      <th className="py-3.5 px-6 text-center">Status</th>
                      <th className="py-3.5 px-6 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(overtimeRates?.data ?? [])
                      .filter(r => r.code.toLowerCase().includes(search.toLowerCase()) || r.name.toLowerCase().includes(search.toLowerCase()))
                      .map(r => (
                        <tr key={r.id} className="hover:bg-amber-50/30 transition-colors group">
                          <td className="py-4 px-6 whitespace-nowrap">
                            <span className="font-mono font-bold text-amber-600 bg-amber-50 border border-amber-200/80 px-2 py-1 rounded-md">{r.code}</span>
                          </td>
                          <td className="py-4 px-6 font-semibold text-slate-800">{r.name}</td>
                          <td className="py-4 px-6 text-right font-mono text-slate-700">{formatCurrency(r.rate_per_hour)}</td>
                          <td className="py-4 px-6 text-center">
                            {r.is_default
                              ? <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700 border border-amber-200">DEFAULT</span>
                              : <span className="text-slate-300">—</span>
                            }
                          </td>
                          <td className="py-4 px-6 text-center">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${r.is_active ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-slate-50 text-slate-600 border border-slate-200"}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${r.is_active ? "bg-emerald-500" : "bg-slate-400"}`}></span>
                              {r.is_active ? "Aktif" : "Nonaktif"}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-right">
                            <button type="button" onClick={() => setEditOvertimeRate(r)} className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors opacity-80 group-hover:opacity-100" title="Edit Tarif">
                              <Pencil size={15} />
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {/* TAB: Posting GL */}
        {tab === "posting" && (
          <>
            <div className="px-6 py-3 bg-blue-50/60 border-b border-blue-100 text-[11px] text-blue-700 font-medium">
              Akun GL yang dipakai saat transaksi ini diposting ke Finance (Payroll, AR Integration, AP Integration, dst). Baris ini tetap (diatur sistem) — yang bisa diubah cuma akun tujuan, memo, dan aktif/tidaknya.
            </div>
            {loadingPostingRules && <LoadingState />}
            {!loadingPostingRules && (
              <div className="overflow-x-auto min-h-[250px]">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50/70 border-b border-slate-200/80 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      <th className="py-3.5 px-6">Jenis Transaksi</th>
                      <th className="py-3.5 px-6">Kode Akun</th>
                      <th className="py-3.5 px-6">Nama Akun</th>
                      <th className="py-3.5 px-6">Memo / Label</th>
                      <th className="py-3.5 px-6 text-right">Debit</th>
                      <th className="py-3.5 px-6 text-right">Kredit</th>
                      <th className="py-3.5 px-6 text-center">Status</th>
                      <th className="py-3.5 px-6 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(postingRules ?? [])
                      .filter(r => 
                        (TRANSACTION_TYPE_LABELS[r.transaction_type] ?? r.transaction_type).toLowerCase().includes(search.toLowerCase()) ||
                        r.account_code.toLowerCase().includes(search.toLowerCase())
                      )
                      .map(r => (
                        <tr key={r.id} className="hover:bg-amber-50/30 transition-colors group">
                          <td className="py-4 px-6 whitespace-nowrap">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-violet-50 text-violet-700 border border-violet-200">
                              {TRANSACTION_TYPE_LABELS[r.transaction_type] ?? r.transaction_type}
                            </span>
                          </td>
                          <td className="py-4 px-6 whitespace-nowrap">
                            <span className="font-mono font-bold text-amber-600 bg-amber-50 border border-amber-200/80 px-2 py-1 rounded-md">{r.account_code}</span>
                          </td>
                          <td className="py-4 px-6 text-slate-700">{accountNameByCode.get(r.account_code) ?? "—"}</td>
                          <td className="py-4 px-6 text-slate-600">{r.label}</td>
                          <td className="py-4 px-6 text-right font-mono text-slate-500">{r.side === "debit" ? "(sesuai jumlah)" : "—"}</td>
                          <td className="py-4 px-6 text-right font-mono text-slate-500">{r.side === "credit" ? "(sesuai jumlah)" : "—"}</td>
                          <td className="py-4 px-6 text-center">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${r.is_active ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-slate-50 text-slate-600 border border-slate-200"}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${r.is_active ? "bg-emerald-500" : "bg-slate-400"}`}></span>
                              {r.is_active ? "Aktif" : "Nonaktif"}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-right">
                            <button type="button" onClick={() => setEditPostingRule(r)} className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors opacity-80 group-hover:opacity-100" title="Edit Posting Rule">
                              <Pencil size={15} />
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </section>

      {/* Modals */}
      {showCurrencyModal && (
        <CurrencyFormModal
          onSaved={() => { setShowCurrencyModal(false); qc.invalidateQueries({ queryKey: ["mdCurrencies"] }); }}
          onClose={() => setShowCurrencyModal(false)}
        />
      )}
      {showBankModal && (
        <BankFormModal
          onSaved={() => { setShowBankModal(false); qc.invalidateQueries({ queryKey: ["mdBanks"] }); }}
          onClose={() => setShowBankModal(false)}
        />
      )}
      {editBank && (
        <BankFormModal
          bank={editBank}
          onSaved={() => { setEditBank(null); qc.invalidateQueries({ queryKey: ["mdBanks"] }); }}
          onClose={() => setEditBank(null)}
        />
      )}
      {showHolidayModal && (
        <HolidayFormModal
          onSaved={() => { setShowHolidayModal(false); qc.invalidateQueries({ queryKey: ["mdHolidays"] }); }}
          onClose={() => setShowHolidayModal(false)}
        />
      )}
      {editHoliday && (
        <HolidayFormModal
          holiday={editHoliday}
          onSaved={() => { setEditHoliday(null); qc.invalidateQueries({ queryKey: ["mdHolidays"] }); }}
          onClose={() => setEditHoliday(null)}
        />
      )}
      {showSequenceModal && (
        <NumberSequenceSetupModal
          moduleCode=""
          onCreated={() => { setShowSequenceModal(false); qc.invalidateQueries({ queryKey: ["mdSequences"] }); }}
          onClose={() => setShowSequenceModal(false)}
        />
      )}
      {editSequence && (
        <NumberSequenceEditModal
          sequence={editSequence}
          onSaved={() => { setEditSequence(null); qc.invalidateQueries({ queryKey: ["mdSequences"] }); }}
          onClose={() => setEditSequence(null)}
        />
      )}
      {showOvertimeRateModal && (
        <OvertimeRateFormModal
          onSaved={() => { setShowOvertimeRateModal(false); qc.invalidateQueries({ queryKey: ["mdOvertimeRates"] }); }}
          onClose={() => setShowOvertimeRateModal(false)}
        />
      )}
      {editOvertimeRate && (
        <OvertimeRateFormModal
          rate={editOvertimeRate}
          onSaved={() => { setEditOvertimeRate(null); qc.invalidateQueries({ queryKey: ["mdOvertimeRates"] }); }}
          onClose={() => setEditOvertimeRate(null)}
        />
      )}
      {editPostingRule && (
        <PostingRuleFormModal
          rule={editPostingRule}
          onSaved={() => { setEditPostingRule(null); qc.invalidateQueries({ queryKey: ["mdPostingRules"] }); }}
          onClose={() => setEditPostingRule(null)}
        />
      )}
    </div>
    </main>
  );
}