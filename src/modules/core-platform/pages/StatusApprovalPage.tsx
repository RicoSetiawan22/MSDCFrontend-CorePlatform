import { useState, useMemo } from "react";
import { PageHeader } from "@shared/components/PageHeader";
import { useWorkflowInstances } from "../api/useWorkflow";
import { workflowApi } from "../api/workflowApi";
import { LoadingState } from "@shared/components/LoadingState";
import { Modal } from "@shared/components/Modal";
import {
  Search,
  RefreshCw,
  ShoppingBag,
  Receipt,
  FileText,
  Clock,
  Layers,
  Eye,
  CheckCircle2,
  Building2,
  User,
  Calendar,
  ChevronDown,
  Users,
  AlertTriangle,
  X,
  Send,
  Timer,
  Sparkles,
} from "lucide-react";
import { formatDate, formatCurrency } from "@shared/lib/format";
import { DocumentDetailModal } from "@modules/document-management/components/DocumentDetailModal";

type CategoryTab = "all" | "po" | "crm" | "surat" | "other";

interface WorkflowLevelItem {
  id: number;
  sequence: number;
  status: "pending" | "approved" | "rejected" | "skipped";
  acted_at: string | null;
  comments?: string | null;
  approver?: { id: number; name: string; email?: string } | null;
  level?: { id: number; name: string } | null;
}

interface WorkflowInstanceRecord {
  id: number;
  module_code: string;
  document_type: string;
  document_id: number;
  reference_number: string;
  payload: Record<string, unknown> | null;
  status: string;
  initiated_at: string;
  template?: { id: number; code: string; name: string } | null;
  current_level?: { id: number; name: string } | null;
  initiator?: { id: number; name: string; email?: string } | null;
  instance_levels?: WorkflowLevelItem[];
  is_dummy?: boolean;
}

// Data simulasi lintas divisi (Procurement, CRM, HR, dll)
const DUMMY_TRANSACTIONS: WorkflowInstanceRecord[] = [
  {
    id: 101,
    module_code: "procurement",
    document_type: "purchase_order",
    document_id: 881,
    reference_number: "PO-2026-0881",
    status: "pending",
    initiated_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 hari lalu
    template: {
      id: 201,
      code: "po-tier2-approval",
      name: "Procurement Tier II Approval (> Rp 50.000.000)",
    },
    current_level: {
      id: 301,
      name: "Finance Manager Review",
    },
    initiator: {
      id: 12,
      name: "Ahmad Fauzi (Divisi Logistik & Gudang)",
      email: "ahmad.fauzi@msdc.co.id",
    },
    payload: {
      vendor_name: "PT Graha Sumber Prima",
      total_amount: 78500000,
      title: "Pengadaan 8 Unit Core Switch & Server Rack Data Center",
    },
    instance_levels: [
      {
        id: 1001,
        sequence: 1,
        status: "approved",
        acted_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 4 * 3600 * 1000).toISOString(),
        approver: { id: 5, name: "Budi Santoso (Kadiv Procurement)" },
        level: { id: 1, name: "Supervisor Procurement" },
        comments: "Spesifikasi teknis dan vendor scoring sudah sesuai standar ISO.",
      },
      {
        id: 1002,
        sequence: 2,
        status: "pending",
        acted_at: null,
        approver: { id: 8, name: "Hendra Kurniawan (Finance Manager)" },
        level: { id: 2, name: "Finance Manager Review" },
      },
      {
        id: 1003,
        sequence: 3,
        status: "skipped",
        acted_at: null,
        approver: { id: 2, name: "Direktur Operasional" },
        level: { id: 3, name: "Direktur Operasional" },
      },
    ],
    is_dummy: true,
  },
  {
    id: 102,
    module_code: "crm",
    document_type: "invoice",
    document_id: 412,
    reference_number: "INV-CRM/2026/0412",
    status: "pending",
    initiated_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(), // 4 hari lalu (SLA Overdue)
    template: {
      id: 202,
      code: "crm-sales-contract-approval",
      name: "Sales Contract & Billing Approval Tier I",
    },
    current_level: {
      id: 302,
      name: "Head of Sales & CRM Approval",
    },
    initiator: {
      id: 15,
      name: "Dewi Lestari (Account Executive CRM)",
      email: "dewi.lestari@msdc.co.id",
    },
    payload: {
      customer_name: "PT Telkom Akses",
      total_amount: 145000000,
      title: "Kontrak Tahunan Colocation & Managed Cloud SLA 99.9%",
    },
    instance_levels: [
      {
        id: 1004,
        sequence: 1,
        status: "pending",
        acted_at: null,
        approver: { id: 9, name: "Siti Aminah (Head of Sales & CRM)" },
        level: { id: 1, name: "Head of Sales & CRM Approval" },
      },
      {
        id: 1005,
        sequence: 2,
        status: "skipped",
        acted_at: null,
        approver: { id: 3, name: "General Manager Bisnis" },
        level: { id: 2, name: "General Manager Bisnis" },
      },
    ],
    is_dummy: true,
  },
  {
    id: 103,
    module_code: "core-platform",
    document_type: "surat",
    document_id: 1,
    reference_number: "SK/0001/11/2026",
    status: "pending",
    initiated_at: new Date().toISOString(),
    template: {
      id: 203,
      code: "sk-official-approval",
      name: "Document/Surat Approval Workflow (Manager)",
    },
    current_level: {
      id: 303,
      name: "Manager Legal & Sekretariat",
    },
    initiator: {
      id: 1,
      name: "Test User (Sekretariat Core Platform)",
      email: "test@example.com",
    },
    payload: {
      title: "Surat Keputusan Pengangkatan Tim Audit Mutu Internal ISO 27001",
      document_type: "sk",
    },
    instance_levels: [
      {
        id: 1006,
        sequence: 1,
        status: "pending",
        acted_at: null,
        approver: { id: 4, name: "Irfan Hakim (Manager Legal & Core)" },
        level: { id: 1, name: "Manager Legal & Sekretariat" },
      },
    ],
    is_dummy: true,
  },
  {
    id: 104,
    module_code: "hr",
    document_type: "overtime_request",
    document_id: 19,
    reference_number: "HR-REQ/2026/019",
    status: "pending",
    initiated_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 hari lalu
    template: {
      id: 204,
      code: "hr-overtime-approval",
      name: "Pengajuan Lembur & Dinas Luar Divisi Operasional",
    },
    current_level: {
      id: 304,
      name: "HR Operation Manager",
    },
    initiator: {
      id: 18,
      name: "Rian Pratama (Dev Team DataOps)",
      email: "rian.pratama@msdc.co.id",
    },
    payload: {
      title: "Dinas On-Site Maintenance & Pergantian Baterai UPS Data Center",
    },
    instance_levels: [
      {
        id: 1007,
        sequence: 1,
        status: "approved",
        acted_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000 + 3 * 3600 * 1000).toISOString(),
        approver: { id: 11, name: "Kevin Sanjaya (Team Lead DataOps)" },
        level: { id: 1, name: "Team Lead DataOps" },
        comments: "Pekerjaan darurat saat maintenance window malam hari.",
      },
      {
        id: 1008,
        sequence: 2,
        status: "pending",
        acted_at: null,
        approver: { id: 14, name: "Maya Indah (HR Operation Manager)" },
        level: { id: 2, name: "HR Operation Manager" },
      },
    ],
    is_dummy: true,
  },
];

export function StatusApprovalPage() {
  const [activeTab, setActiveTab] = useState<CategoryTab>("all");
  const [search, setSearch] = useState("");
  const [selectedInstanceForTracker, setSelectedInstanceForTracker] = useState<WorkflowInstanceRecord | null>(null);
  const [selectedSuratId, setSelectedSuratId] = useState<number | null>(null);
  const [remindingId, setRemindingId] = useState<number | null>(null);

  // Ambil seluruh antrean approval dari semua divisi (Global Monitoring)
  const { data, isLoading, refetch } = useWorkflowInstances({
    status: "pending",
    per_page: 100,
  });

  // Ekstrak items riil + gabung dengan dummy data lintas divisi
  const allInstances: WorkflowInstanceRecord[] = useMemo(() => {
    let realData: WorkflowInstanceRecord[] = [];
    if (data) {
      if (Array.isArray(data)) {
        realData = data as unknown as WorkflowInstanceRecord[];
      } else {
        const anyD = data as unknown as Record<string, unknown>;
        if (Array.isArray(anyD.data)) {
          realData = anyD.data as WorkflowInstanceRecord[];
        } else if (anyD.data && typeof anyD.data === "object" && Array.isArray((anyD.data as Record<string, unknown>).data)) {
          realData = (anyD.data as { data: WorkflowInstanceRecord[] }).data;
        }
      }
    }

    // Jika di database ada data riil, tampilkan data riil + dummy pelengkap
    // Jika belum ada data riil, tampilkan dummy lengkap
    if (realData.length > 0) {
      // Gabungkan riil dengan dummy (hindari ID tabrakan)
      const existingRefs = new Set(realData.map((r) => r.reference_number));
      const filteredDummy = DUMMY_TRANSACTIONS.filter((d) => !existingRefs.has(d.reference_number));
      return [...realData, ...filteredDummy];
    }

    return DUMMY_TRANSACTIONS;
  }, [data]);

  // Helper pengelompokan jenis divisi / modul
  function getItemCategory(item: WorkflowInstanceRecord): CategoryTab {
    const docType = (item.document_type || "").toLowerCase();
    const modCode = (item.module_code || "").toLowerCase();
    const wfName = (item.template?.name || "").toLowerCase();

    if (
      docType.includes("po") ||
      docType.includes("purchase_order") ||
      docType.includes("purchase-order") ||
      modCode.includes("procurement") ||
      wfName.includes("purchase order") ||
      wfName.includes("pengadaan")
    ) {
      return "po";
    }

    if (
      docType.includes("invoice") ||
      docType.includes("quotation") ||
      docType.includes("contract") ||
      docType.includes("kontrak") ||
      docType.includes("sales") ||
      modCode.includes("crm") ||
      wfName.includes("invoice") ||
      wfName.includes("penawaran") ||
      wfName.includes("contract") ||
      wfName.includes("kontrak")
    ) {
      return "crm";
    }

    if (
      docType.includes("surat") ||
      docType.includes("document") ||
      docType.includes("sk") ||
      modCode.includes("coreplatform") ||
      modCode.includes("core-platform") ||
      wfName.includes("surat")
    ) {
      return "surat";
    }

    return "other";
  }

  // Hitung durasi tertunda (Aging)
  function getAgingInfo(dateString: string | null | undefined): { label: string; colorClass: string; isWarning: boolean } {
    if (!dateString) return { label: "Baru saja", colorClass: "text-slate-500 bg-slate-100", isWarning: false };
    const initiated = new Date(dateString).getTime();
    const now = Date.now();
    const diffHours = Math.floor((now - initiated) / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays >= 3) {
      return {
        label: `Tertahan ${diffDays} Hari (SLA Terlewat)`,
        colorClass: "text-rose-700 bg-rose-50 border-rose-200/80",
        isWarning: true,
      };
    } else if (diffDays >= 1) {
      return {
        label: `Tertahan ${diffDays} Hari`,
        colorClass: "text-amber-800 bg-amber-50 border-amber-200/80",
        isWarning: false,
      };
    } else {
      return {
        label: `< 24 Jam (${Math.max(1, diffHours)} Jam)`,
        colorClass: "text-emerald-700 bg-emerald-50 border-emerald-200/80",
        isWarning: false,
      };
    }
  }

  // Cari siapa yang saat ini memegang dan BELUM APPROVE
  function getPendingApproverInfo(item: WorkflowInstanceRecord): {
    name: string;
    stepTitle: string;
    levelIndex: number;
    totalLevels: number;
  } {
    const levels = item.instance_levels || [];
    const totalLevels = levels.length > 0 ? levels.length : 1;

    // Cari level pertama yang masih pending
    const currentPendingLevel = levels.find((l) => l.status === "pending") || levels[0];
    const levelIndex = currentPendingLevel ? currentPendingLevel.sequence || 1 : 1;
    const stepTitle = currentPendingLevel?.level?.name || item.current_level?.name || "Review Verifikasi";

    let name = "Belum Ditentukan";
    if (currentPendingLevel?.approver?.name) {
      name = currentPendingLevel.approver.name;
    } else if (currentPendingLevel?.level?.name) {
      name = `Pool: ${currentPendingLevel.level.name}`;
    }

    return { name, stepTitle, levelIndex, totalLevels };
  }

  // Hitung jumlah statistik antrean pending
  const stats = useMemo(() => {
    let poCount = 0;
    let crmCount = 0;
    let suratCount = 0;
    let otherCount = 0;

    allInstances.forEach((item) => {
      const cat = getItemCategory(item);
      if (cat === "po") poCount++;
      else if (cat === "crm") crmCount++;
      else if (cat === "surat") suratCount++;
      else otherCount++;
    });

    return {
      totalPending: allInstances.length,
      poCount,
      crmCount,
      suratCount,
      otherCount,
    };
  }, [allInstances]);

  // Data yang difilter sesuai Dropdown Module & Pencarian
  const filteredItems = useMemo(() => {
    return allInstances.filter((item) => {
      // 1. Filter Kategori Modul
      if (activeTab !== "all") {
        const cat = getItemCategory(item);
        if (cat !== activeTab) return false;
      }

      // 2. Filter Search
      if (search.trim()) {
        const q = search.toLowerCase();
        const docNum = (item.reference_number || "").toLowerCase();
        const wfName = (item.template?.name || "").toLowerCase();
        const initiator = (item.initiator?.name || "").toLowerCase();
        const currentLevel = (item.current_level?.name || "").toLowerCase();
        const pendingApprover = (item.instance_levels?.map((l) => l.approver?.name || "").join(" ") || "").toLowerCase();

        return (
          docNum.includes(q) ||
          wfName.includes(q) ||
          initiator.includes(q) ||
          currentLevel.includes(q) ||
          pendingApprover.includes(q)
        );
      }

      return true;
    });
  }, [allInstances, activeTab, search]);

  return (
    <div className="w-full bg-slate-50 min-h-screen font-sans">
      <PageHeader
        title="Status Approval Transaksi"
        subtitle="Pusat pemantauan seluruh transaksi yang belum disetujui (Pending Approval) lintas modul — Procurement PO, CRM Sales, Persuratan, dan Divisi Terkait."
      />

      <div className="px-7 py-5 space-y-6">
        {/* Grid 4 Kartu Metrik ala DataOps */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Total Pending Transaksi */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-[0_2px_8px_rgba(0,0,0,0.04)] flex flex-col justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Clock size={18} />
              </div>
              <span className="text-[11px] font-bold text-slate-400 tracking-wider uppercase">
                TOTAL BELUM APPROVAL
              </span>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-extrabold text-slate-800">{stats.totalPending}</div>
              <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-500 font-medium">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                <span>Semua Divisi & Modul</span>
              </div>
            </div>
          </div>

          {/* Card 2: Purchase Order (Procurement) */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-[0_2px_8px_rgba(0,0,0,0.04)] flex flex-col justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <ShoppingBag size={18} />
              </div>
              <span className="text-[11px] font-bold text-slate-400 tracking-wider uppercase">
                PROCUREMENT (PO)
              </span>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-extrabold text-slate-800">{stats.poCount}</div>
              <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-500 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span>Pengadaan & Order Barang</span>
              </div>
            </div>
          </div>

          {/* Card 3: CRM & Sales Invoice */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-[0_2px_8px_rgba(0,0,0,0.04)] flex flex-col justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Receipt size={18} />
              </div>
              <span className="text-[11px] font-bold text-slate-400 tracking-wider uppercase">
                CRM & SALES
              </span>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-extrabold text-slate-800">{stats.crmCount}</div>
              <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-500 font-medium">
                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                <span>Tagihan & Nota Pelanggan</span>
              </div>
            </div>
          </div>

          {/* Card 4: Surat & Legal */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-[0_2px_8px_rgba(0,0,0,0.04)] flex flex-col justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <FileText size={18} />
              </div>
              <span className="text-[11px] font-bold text-slate-400 tracking-wider uppercase">
                PERSURATAN & LEGAL
              </span>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-extrabold text-slate-800">{stats.suratCount}</div>
              <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-500 font-medium">
                <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                <span>Surat Dinas & SK Keputusan</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Card: Table and Filters (Sesuai Referensi Workflow Template) */}
        <section className="bg-white rounded-xl shadow-sm border border-slate-200/80 overflow-hidden">
          {/* Filter and Action Bar */}
          <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex flex-1 items-center gap-3">
              {/* Dropdown Filter Module */}
              <div className="relative min-w-[210px]">
                <select
                  className="w-full bg-white border border-slate-300 text-slate-700 text-sm rounded-lg px-3.5 py-2.5 pr-8 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 appearance-none font-medium cursor-pointer shadow-sm"
                  value={activeTab}
                  onChange={(e) => setActiveTab(e.target.value as CategoryTab)}
                >
                  <option value="all">Semua Module</option>
                  <option value="po">Procurement (Purchase Order)</option>
                  <option value="crm">CRM & Sales Invoice</option>
                  <option value="surat">Persuratan & Legal (SK)</option>
                  <option value="other">Modul Lainnya</option>
                </select>
                <ChevronDown size={16} className="text-slate-400 absolute right-3 top-3.5 pointer-events-none" />
              </div>

              {/* Search Input */}
              <div className="relative flex-1 max-w-md">
                <Search size={16} className="text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
                <input
                  className="w-full bg-slate-50/60 border border-slate-200 text-slate-700 text-sm rounded-lg pl-10 pr-4 py-2 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 placeholder-slate-400 transition"
                  placeholder="Cari nomor dokumen, alur, approver yang belum setuju..."
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>

            {/* Action / Refresh Button */}
            <button
              onClick={() => refetch()}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-lg shadow-sm transition-all duration-150"
              type="button"
            >
              <RefreshCw size={15} />
              <span>Refresh Antrean</span>
            </button>
          </div>

          {/* Table Content */}
          {isLoading && <LoadingState />}

          {!isLoading && filteredItems.length === 0 && (
            <div className="min-h-[350px] flex flex-col items-center justify-center p-8 text-center">
              <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-200/80 flex items-center justify-center mb-4 text-emerald-600 shadow-inner">
                <CheckCircle2 size={36} strokeWidth={1.75} />
              </div>
              <h3 className="text-base font-bold text-slate-800">Semua Transaksi Sudah Disetujui!</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm">
                Tidak ada dokumen transaksi bisnis yang saat ini tertahan menunggu persetujuan pada filter ini.
              </p>
            </div>
          )}

          {!isLoading && filteredItems.length > 0 && (
            <div className="overflow-x-auto min-h-[350px]">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/50 text-[11px] uppercase tracking-wider text-slate-400 font-bold">
                    <th className="py-4 px-6 font-semibold" scope="col">SISTEM / DIVISI</th>
                    <th className="py-4 px-6 font-semibold" scope="col">NOMOR & RINCIAN TRANSAKSI</th>
                    <th className="py-4 px-6 font-semibold" scope="col">PEMOHON ASAL</th>
                    <th className="py-4 px-6 font-semibold" scope="col">POSISI TINGKATAN</th>
                    <th className="py-4 px-6 font-semibold" scope="col">👉 BELUM APPROVE (APPROVER)</th>
                    <th className="py-4 px-6 font-semibold" scope="col">LAMA MENUNGGU</th>
                    <th className="py-4 px-6 font-semibold text-right" scope="col">AKSI</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredItems.map((item) => {
                    const cat = getItemCategory(item);
                    const isPO = cat === "po";
                    const isCRM = cat === "crm";
                    const isSurat = cat === "surat";

                    const approverInfo = getPendingApproverInfo(item);
                    const aging = getAgingInfo(item.initiated_at);

                    return (
                      <tr key={item.id} className="hover:bg-amber-50/30 transition-colors group">
                        {/* 1. Sistem / Divisi */}
                        <td className="py-4 px-6 whitespace-nowrap">
                          {isPO ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80 shadow-xs">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                              <ShoppingBag size={12} /> Procurement (PO)
                            </span>
                          ) : isCRM ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200/80 shadow-xs">
                              <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                              <Receipt size={12} /> CRM & Sales
                            </span>
                          ) : isSurat ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-purple-50 text-purple-700 border border-purple-200/80 shadow-xs">
                              <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
                              <FileText size={12} /> Persuratan & Legal
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200 shadow-xs">
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                              <Layers size={12} /> {item.module_code || "Umum"}
                            </span>
                          )}
                          {item.is_dummy && (
                            <span className="ml-1.5 inline-flex items-center gap-0.5 px-1.5 py-0.2 text-[9px] font-bold text-amber-700 bg-amber-50 rounded border border-amber-200/70" title="Simulasi Lintas Divisi">
                              <Sparkles size={9} /> Simulasi
                            </span>
                          )}
                        </td>

                        {/* 2. Nomor Dokumen & Rincian */}
                        <td className="py-4 px-6">
                          <div className="font-mono font-bold text-slate-900">{item.reference_number || `DOC-${item.id}`}</div>
                          <div className="text-[11px] text-slate-400 mt-0.5 truncate max-w-xs" title={item.template?.name ?? ""}>
                            {item.template?.name || "Standard Approval Chain"}
                          </div>
                          {/* Rincian data dokumen */}
                          {item.payload?.title ? (
                            <div className="text-[11px] text-slate-600 mt-1 italic">
                              "{String(item.payload.title)}"
                            </div>
                          ) : null}
                          {item.payload?.vendor_name ? (
                            <div className="text-[11px] text-slate-600 mt-0.5 flex items-center gap-1">
                              <Building2 size={11} className="text-slate-400" />
                              <span>Vendor: <strong>{String(item.payload.vendor_name)}</strong></span>
                            </div>
                          ) : null}
                          {item.payload?.customer_name ? (
                            <div className="text-[11px] text-slate-600 mt-0.5 flex items-center gap-1">
                              <User size={11} className="text-slate-400" />
                              <span>Klien: <strong>{String(item.payload.customer_name)}</strong></span>
                            </div>
                          ) : null}
                          {item.payload?.total_amount ? (
                            <div className="text-[10px] text-blue-700 font-bold font-mono mt-0.5">
                              Nilai: {formatCurrency(Number(item.payload.total_amount))}
                            </div>
                          ) : null}
                        </td>

                        {/* 3. Pemohon Asal & Tanggal */}
                        <td className="py-4 px-6 whitespace-nowrap">
                          <div className="font-medium text-slate-800 flex items-center gap-1.5">
                            <User size={13} className="text-slate-400" />
                            <span>{item.initiator?.name || "Sistem Otomatis"}</span>
                          </div>
                          <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                            <Calendar size={11} /> {formatDate(item.initiated_at)}
                          </div>
                        </td>

                        {/* 4. Posisi Tingkatan */}
                        <td className="py-4 px-6 whitespace-nowrap">
                          <div className="font-semibold text-slate-800 text-xs">
                            {approverInfo.stepTitle}
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">
                            <span>Tingkat {approverInfo.levelIndex} dari {approverInfo.totalLevels}</span>
                          </div>
                        </td>

                        {/* 5. 👉 SIAPA YANG BELUM APPROVE */}
                        <td className="py-4 px-6 whitespace-nowrap">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-300 shadow-xs">
                            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                            <span>⏳ {approverInfo.name}</span>
                          </span>
                        </td>

                        {/* 6. Lama Menunggu (Aging) */}
                        <td className="py-4 px-6 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${aging.colorClass}`}>
                            <Timer size={12} />
                            <span>{aging.label}</span>
                          </span>
                        </td>

                        {/* 7. Aksi (Lacak Rantai Persetujuan) */}
                        <td className="py-4 px-6 whitespace-nowrap text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Tombol Lacak Alur Tim */}
                            <button
                              onClick={() => setSelectedInstanceForTracker(item)}
                              className="px-3 py-1.5 text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200/80 rounded-lg transition inline-flex items-center gap-1.5 shadow-xs"
                              title="Lacak Rantai Persetujuan Seluruh Tim"
                            >
                              <Users size={13} /> Lacak Alur
                            </button>

                            {/* Tombol Detail Dokumen Fisik / Surat jika surat */}
                            {isSurat && item.document_id && (
                              <button
                                onClick={() => setSelectedSuratId(item.document_id)}
                                className="px-2.5 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition inline-flex items-center gap-1"
                                title="Lihat Dokumen Surat Resmi"
                              >
                                <Eye size={13} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      {/* ===== MODAL PELACAK RANTAI PERSETUJUAN TIM (SIAPA YANG SUDAH & BELUM APPROVE) ===== */}
      {selectedInstanceForTracker && (
        <Modal
          title={`Pelacak Persetujuan: ${selectedInstanceForTracker.reference_number || `DOC-${selectedInstanceForTracker.id}`}`}
          onClose={() => setSelectedInstanceForTracker(null)}
          maxWidth={680}
        >
          <div className="space-y-5 text-xs">
            {/* Ringkasan Header Transaksi */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-2 gap-3 text-slate-600">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Modul / Divisi:</span>
                <strong className="text-slate-800 text-sm uppercase">{selectedInstanceForTracker.module_code}</strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Alur Workflow:</span>
                <strong className="text-slate-800 text-sm">{selectedInstanceForTracker.template?.name || "Standard Workflow"}</strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Pemohon Asal:</span>
                <strong className="text-slate-800">{selectedInstanceForTracker.initiator?.name ?? "Sistem"}</strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Tanggal Pengajuan:</span>
                <strong className="text-slate-800">{formatDate(selectedInstanceForTracker.initiated_at)}</strong>
              </div>
            </div>

            {/* Stepper Rantai Persetujuan (Siapa Saja yang Sudah & Belum Approve) */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Users size={16} className="text-amber-600" />
                  <h4 className="font-bold text-slate-800 text-sm">
                    Status Rantai Persetujuan Tim ({selectedInstanceForTracker.instance_levels?.length || 1} Tingkatan)
                  </h4>
                </div>
                <span className="text-[11px] text-slate-400 font-medium">Urutan Otorisasi Dokumen</span>
              </div>

              <div className="space-y-2.5">
                {(selectedInstanceForTracker.instance_levels && selectedInstanceForTracker.instance_levels.length > 0) ? (
                  selectedInstanceForTracker.instance_levels.map((il, idx) => {
                    const levelName = il.level?.name ?? `Tingkatan ${idx + 1}`;
                    const isApproved = il.status === "approved";
                    const isRejected = il.status === "rejected";
                    const isPending = il.status === "pending";

                    return (
                      <div
                        key={il.id}
                        className={`p-3.5 rounded-xl border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all ${
                          isApproved
                            ? "bg-emerald-50/70 border-emerald-200 text-emerald-900"
                            : isPending
                            ? "bg-amber-50/90 border-amber-300 text-amber-900 shadow-sm"
                            : isRejected
                            ? "bg-rose-50/70 border-rose-200 text-rose-900"
                            : "bg-white border-slate-200 text-slate-600"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5 shrink-0">
                            {isApproved ? (
                              <CheckCircle2 size={18} className="text-emerald-600" />
                            ) : isPending ? (
                              <AlertTriangle size={18} className="text-amber-600 animate-pulse" />
                            ) : isRejected ? (
                              <X size={18} className="text-rose-600" />
                            ) : (
                              <Clock size={18} className="text-slate-400" />
                            )}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 flex items-center gap-2 text-sm">
                              <span>Level {il.sequence || idx + 1}: {levelName}</span>
                              {isPending && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-white shadow-xs">
                                  SEDANG TERTUNDA DI SINI
                                </span>
                              )}
                            </div>
                            <div className="text-xs mt-1">
                              {isApproved && (
                                <span className="text-emerald-800 font-medium">
                                  ✓ Sudah Disetujui oleh: <strong>{il.approver?.name ?? "Pejabat Terdaftar"}</strong>
                                  {il.acted_at ? ` pada ${formatDate(il.acted_at)}` : ""}
                                </span>
                              )}
                              {isPending && (
                                <span className="text-amber-900 font-semibold">
                                  ⏳ <strong>BELUM APPROVE</strong> — Menunggu tindakan dari:{" "}
                                  <span className="underline font-bold text-amber-950">
                                    {il.approver?.name ?? "Tim / Penanggung Jawab Terkait"}
                                  </span>
                                </span>
                              )}
                              {isRejected && (
                                <span className="text-rose-800 font-medium">
                                  ✕ Ditolak oleh: <strong>{il.approver?.name ?? "Approver"}</strong>
                                  {il.comments ? ` — Alasan: "${il.comments}"` : ""}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Tombol Ingatkan / Senggol Approver jika masih pending */}
                        {isPending && (
                          <div className="shrink-0 self-end sm:self-center">
                            <button
                              disabled={remindingId === il.id}
                              onClick={async () => {
                                const approverName = il.approver?.name || "Approver Terkait";

                                try {
                                  setRemindingId(il.id);
                                  await workflowApi.remind(selectedInstanceForTracker.id, {
                                    approver_user_id: il.approver?.id,
                                    level_id: il.id,
                                  });
                                  alert(`Berhasil! Notifikasi pengingat approval telah dikirimkan ke ${approverName}.`);
                                } catch (err: any) {
                                  alert(err?.response?.data?.message || "Gagal mengirimkan pengingat approval.");
                                } finally {
                                  setRemindingId(null);
                                }
                              }}
                              className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 disabled:opacity-50 text-white font-bold rounded-lg text-xs shadow-xs inline-flex items-center gap-1.5 transition cursor-pointer"
                            >
                              <Send size={12} className={remindingId === il.id ? "animate-spin" : ""} />
                              {remindingId === il.id ? "Mengirim..." : "Senggol Approver"}
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-500 text-center italic">
                    Level alur belum memiliki pemetaan approver aktif.
                  </div>
                )}
              </div>
            </div>

            {/* Tombol Tutup */}
            <div className="flex items-center justify-end pt-3 border-t border-slate-100">
              <button
                onClick={() => setSelectedInstanceForTracker(null)}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-xs transition"
              >
                Tutup
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal Khusus Dokumen Surat jika ingin melihat preview suratnya */}
      {selectedSuratId && (
        <DocumentDetailModal
          documentId={selectedSuratId}
          onClose={() => setSelectedSuratId(null)}
        />
      )}
    </div>
  );
}
