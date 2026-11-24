import { useState, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { ChevronRight, Zap, CheckCircle2 } from "lucide-react";
import { useIpSubnet, useIpAddresses } from "../api/useIpam";
import { PageHeader } from "@shared/components/PageHeader";
import { EmptyState } from "@shared/components/EmptyState";
import { LoadingState } from "@shared/components/LoadingState";
import {
  IpSubnetHero,
  IpAddressTable,
  IpamTablePagination,
  AllocateAddressModal,
  ReleaseAddressModal,
  GenerateAddressModal,
} from "../components/ipam";
import type { IpAddress, IpAddressStatus } from "../types/ipam";

export function IpSubnetDetailPage() {
  const { id } = useParams<{ id: string }>();
  const subnetId = id ? Number(id) : undefined;

  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(50);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [search, setSearch] = useState<string>("");

  // Target modal states
  const [allocateTarget, setAllocateTarget] = useState<IpAddress | null>(null);
  const [releaseTarget, setReleaseTarget] = useState<IpAddress | null>(null);
  const [showGenerateModal, setShowGenerateModal] = useState<boolean>(false);

  // Toast / feedback message state
  const [feedbackToast, setFeedbackToast] = useState<{
    message: string;
    type: "success" | "info";
  } | null>(null);

  function triggerFeedback(message: string, type: "success" | "info" = "success") {
    setFeedbackToast({ message, type });
    setTimeout(() => {
      setFeedbackToast(null);
    }, 4000);
  }

  // ── 1. Fetch Detail Subnet ──
  const { data: subnet, isLoading: loadingSubnet } = useIpSubnet(subnetId);

  // ── 2. Fetch Alamat IP di Subnet Terpilih ──
  const {
    data: addressesPage,
    isLoading: loadingAddresses,
    refetch: refetchAddresses,
  } = useIpAddresses(subnetId, {
    page,
    per_page: perPage,
    status: (statusFilter || undefined) as IpAddressStatus | undefined,
    search: search.trim() || undefined,
  });

  const rawAddresses = useMemo(() => addressesPage?.data ?? [], [addressesPage]);

  // ── 3. Client-Side Relevance Sorting (Jika ada pencarian) ──
  const sortedAddresses = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rawAddresses;

    const copy = [...rawAddresses];
    copy.sort((a, b) => {
      const aIp = a.ip_address.toLowerCase();
      const bIp = b.ip_address.toLowerCase();

      // Exact match prioritaskan paling atas
      if (aIp === q && bIp !== q) return -1;
      if (bIp === q && aIp !== q) return 1;

      // Prefix match urutan berikutnya
      const aStarts = aIp.startsWith(q) ? 1 : 0;
      const bStarts = bIp.startsWith(q) ? 1 : 0;
      if (aStarts !== bStarts) return bStarts - aStarts;

      // Match pada nama customer
      const aCust = a.customer?.company_name?.toLowerCase().includes(q) ? 1 : 0;
      const bCust = b.customer?.company_name?.toLowerCase().includes(q) ? 1 : 0;
      if (aCust !== bCust) return bCust - aCust;

      return 0;
    });

    return copy;
  }, [rawAddresses, search]);

  // Cek apakah subnet mendukung generate (IPv4)
  const isIpv4 = subnet?.ip_version?.toLowerCase() === "ipv4";
  const total = addressesPage?.total ?? 0;
  const totalPages = addressesPage?.last_page ?? 1;

  if (loadingSubnet && !subnet) return <LoadingState />;
  if (!subnet) {
    return (
      <div className="min-h-screen bg-[#F5F7FA] p-8 flex items-center justify-center">
        <EmptyState
          title="Subnet Tidak Ditemukan"
          subtitle="Subnet ini mungkin sudah dihapus atau ID tidak valid."
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F7FA] pb-16">
      {/* ── 1. Breadcrumbs: IPAM > CIDR ── */}
      <div className="px-7 pt-4 pb-1 flex items-center gap-1.5 text-xs text-slate-500 font-medium">
        <Link
          to="/dc/ipam"
          className="hover:text-slate-800 transition-colors"
        >
          IPAM
        </Link>
        <ChevronRight size={13} className="text-slate-400" />
        <span className="font-semibold text-slate-800 font-mono">
          {subnet.cidr}
        </span>
      </div>

      {/* ── 2. Header Banner MSDC ── */}
      <PageHeader
        title="IPAM"
        subtitle="Pemantauan infrastruktur fisik & operasional 24×7"
        containerClassName="px-7 pt-2 pb-2"
      />

      <div className="mx-7 mt-3 flex flex-col gap-6">
        {/* ── 3. Subnet Info Hero Card (Mockup 1) ── */}
        <IpSubnetHero subnet={subnet} />

        {/* ── Feedback Notification Toast ── */}
        {feedbackToast && (
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2.5 shadow-xs animate-in slide-in-from-top duration-200">
            <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
            <span>{feedbackToast.message}</span>
          </div>
        )}

        {/* ── 4. Main Table Card Container (Mockup 1) ── */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm flex flex-col gap-4">
          {/* Toolbar: Search, Status Filter & Generate Alamat Button */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              {/* Search CIDR / IP Input */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Cari subnet CIDR..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  className="w-full sm:w-72 px-3.5 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500 transition-all shadow-2xs"
                />
              </div>

              {/* Status Filter Dropdown */}
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer shadow-2xs"
              >
                <option value="">Semua Status</option>
                <option value="available">Available</option>
                <option value="allocated">Allocated</option>
                <option value="reserved">Reserved</option>
                <option value="blocked">Blocked</option>
              </select>
            </div>

            {/* Amber Generate Button */}
            <button
              type="button"
              onClick={() => setShowGenerateModal(true)}
              disabled={!isIpv4}
              title={
                !isIpv4
                  ? "Auto-generate cuma didukung untuk IPv4"
                  : "Generate seluruh alamat IP untuk subnet ini"
              }
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-[#E59B00] hover:bg-[#D48F00] active:bg-[#c28100] text-white text-xs font-bold rounded-lg transition-all active:scale-[0.98] cursor-pointer shadow-xs disabled:opacity-40 disabled:cursor-not-allowed self-end sm:self-center"
            >
              <Zap size={14} />
              <span>Generate Alamat</span>
            </button>
          </div>

          {/* IPv6 Notice */}
          {!isIpv4 && (
            <div className="px-3.5 py-2 rounded-lg bg-slate-50 border border-slate-200 text-[0.75rem] text-slate-500 italic">
              Auto-generate alamat cuma didukung untuk subnet IPv4.
            </div>
          )}

          {/* Tabel Alamat IP */}
          <IpAddressTable
            addresses={sortedAddresses}
            isLoading={loadingAddresses}
            onAllocate={(addr) => setAllocateTarget(addr)}
            onRelease={(addr) => setReleaseTarget(addr)}
            onGenerateClick={() => setShowGenerateModal(true)}
            canGenerate={isIpv4}
          />

          {/* Paginasi Terstandar */}
          {total > 0 && (
            <IpamTablePagination
              currentPage={page}
              totalPages={totalPages}
              perPage={perPage}
              onPageChange={setPage}
              onPerPageChange={(newPerPage) => {
                setPerPage(newPerPage);
                setPage(1);
              }}
              perPageOptions={[20, 50, 100]}
            />
          )}
        </div>
      </div>

      {/* ── 5. Modal 1: Alokasikan IP (Mockup 2) ── */}
      {allocateTarget && (
        <AllocateAddressModal
          address={allocateTarget}
          onClose={() => setAllocateTarget(null)}
          onSuccess={() => {
            triggerFeedback(
              `Alamat IP ${allocateTarget.ip_address} berhasil dialokasikan.`
            );
            refetchAddresses();
          }}
        />
      )}

      {/* ── 6. Modal 2: Konfirmasi Lepas IP (Mockup 3) ── */}
      {releaseTarget && (
        <ReleaseAddressModal
          address={releaseTarget}
          subnetCidr={subnet.cidr}
          onClose={() => setReleaseTarget(null)}
          onSuccess={() => {
            triggerFeedback(
              `Alamat IP ${releaseTarget.ip_address} berhasil dilepas kembali ke stok.`
            );
            refetchAddresses();
          }}
        />
      )}

      {/* ── 7. Modal 3: Konfirmasi Generate Alamat IP ── */}
      {showGenerateModal && subnetId && (
        <GenerateAddressModal
          subnetId={subnetId}
          subnetCidr={subnet.cidr}
          onClose={() => setShowGenerateModal(false)}
          onSuccess={(msg) => {
            triggerFeedback(
              msg || `Alamat IP untuk subnet ${subnet.cidr} berhasil dibuat.`
            );
            refetchAddresses();
          }}
        />
      )}
    </div>
  );
}

export default IpSubnetDetailPage;
