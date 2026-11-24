import { useState, useMemo } from "react";
import { PageHeader } from "@shared/components/PageHeader";
import { useIpSubnetList } from "../api/useIpam";
import {
  IpamStatusBanner,
  IpamKPICards,
  IpamToolbar,
  IpamTable,
  IpamTablePagination,
  type IpamKPIMetrics,
} from "../components/ipam";
import { IpamFormModal } from "./IpamFormModal";

export function IpamListPage() {
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [versionFilter, setVersionFilter] = useState("");
  const [showForm, setShowForm] = useState(false);

  // ── 1. Fetch Seluruh Subnet Sekaligus ──
  const {
    data: subnetsPage,
    isLoading,
    dataUpdatedAt,
    refetch,
  } = useIpSubnetList({ per_page: 500 });

  const allSubnets = useMemo(() => subnetsPage?.data ?? [], [subnetsPage]);

  // ── 2. Format Waktu Terakhir Diperbarui (Last Updated Timestamp) ──
  const lastUpdatedTime = useMemo(() => {
    if (!dataUpdatedAt) return undefined;
    return new Date(dataUpdatedAt)
      .toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      })
      .replace(/\./g, ":");
  }, [dataUpdatedAt]);

  // ── 3. Kalkulasi Metrik KPI IPAM ──
  const metrics: IpamKPIMetrics = useMemo(() => {
    const totalSubnets = subnetsPage?.total ?? allSubnets.length;
    let publicSubnets = 0;
    let privateSubnets = 0;
    let totalIpCapacity = 0;

    allSubnets.forEach((sub) => {
      const isPublic = sub.subnet_type?.toLowerCase() === "public";
      const isPrivate = sub.subnet_type?.toLowerCase() === "private";
      if (isPublic) publicSubnets += 1;
      if (isPrivate) privateSubnets += 1;

      // Hitung kapasitas alamat IP dari prefix CIDR IPv4 (2^(32-prefix))
      const isIpv4 = sub.ip_version?.toLowerCase() === "ipv4";
      if (isIpv4 && sub.cidr) {
        const parts = sub.cidr.split("/");
        if (parts.length === 2) {
          const prefix = parseInt(parts[1], 10);
          if (!isNaN(prefix) && prefix >= 0 && prefix <= 32) {
            totalIpCapacity += Math.pow(2, 32 - prefix);
          }
        }
      }
    });

    return {
      totalSubnets,
      totalIpCapacity,
      publicSubnets,
      privateSubnets,
    };
  }, [allSubnets, subnetsPage]);

  // ── 4. Client-side Search, Filtering, dan Relevance Sorting ──
  const filteredSubnets = useMemo(() => {
    const q = search.trim().toLowerCase();
    const vFilter = versionFilter.trim().toLowerCase();
    const tFilter = typeFilter.trim().toLowerCase();

    const result = allSubnets.filter((sub) => {
      // Filter Versi IP (case-insensitive)
      if (vFilter && sub.ip_version?.toLowerCase() !== vFilter) {
        return false;
      }

      // Filter Tipe Subnet (case-insensitive)
      if (tFilter && sub.subnet_type?.toLowerCase() !== tFilter) {
        return false;
      }

      // Filter Pencarian (CIDR, Gateway, Description)
      if (q) {
        const matchCidr = sub.cidr?.toLowerCase().includes(q);
        const matchGateway = sub.gateway?.toLowerCase().includes(q);
        const matchDesc = sub.description?.toLowerCase().includes(q);
        if (!matchCidr && !matchGateway && !matchDesc) {
          return false;
        }
      }

      return true;
    });

    // Urutan relevansi: Jika mencari, tempatkan subnet yang CIDR / Gateway-nya
    // berawalan sama dengan kata kunci di posisi paling atas!
    if (q) {
      result.sort((a, b) => {
        const aCidrStarts = a.cidr?.toLowerCase().startsWith(q) ? 1 : 0;
        const bCidrStarts = b.cidr?.toLowerCase().startsWith(q) ? 1 : 0;
        if (aCidrStarts !== bCidrStarts) return bCidrStarts - aCidrStarts;

        const aGatewayStarts = a.gateway?.toLowerCase().startsWith(q) ? 1 : 0;
        const bGatewayStarts = b.gateway?.toLowerCase().startsWith(q) ? 1 : 0;
        if (aGatewayStarts !== bGatewayStarts) return bGatewayStarts - aGatewayStarts;

        return 0;
      });
    }

    return result;
  }, [allSubnets, search, versionFilter, typeFilter]);

  // ── 5. Paginasi Hasil Filter ──
  const total = filteredSubnets.length;
  const totalPages = Math.ceil(total / perPage) || 1;

  const paginatedSubnets = useMemo(() => {
    const start = (page - 1) * perPage;
    return filteredSubnets.slice(start, start + perPage);
  }, [filteredSubnets, page, perPage]);

  return (
    <div className="min-h-screen bg-[#F5F7FA] pb-16">
      {/* ── 1. Header Banner Bergaya MSDC ── */}
      <PageHeader
        title="IPAM"
        subtitle="Pemantauan infrastruktur fisik & operasional 24×7"
        containerClassName="px-7 pt-5 pb-2"
      />

      <div className="mx-7 mt-3 flex flex-col gap-6">
        {/* ── 2. Overview Card: Status Banner & 4 KPI Cards Sesuai Desain MSDC ── */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm flex flex-col gap-5">
          <IpamStatusBanner
            isOperational={true}
            lastUpdated={lastUpdatedTime}
          />

          <IpamKPICards metrics={metrics} />
        </div>

        {/* ── 3. Konten Utama: Toolbar & Tabel Subnet ── */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm flex flex-col gap-4">
          {/* Toolbar: Search, Filters & Tombol + Subnet Baru */}
          <IpamToolbar
            search={search}
            onSearchChange={(val) => {
              setSearch(val);
              setPage(1);
            }}
            typeFilter={typeFilter}
            onTypeFilterChange={(val) => {
              setTypeFilter(val);
              setPage(1);
            }}
            versionFilter={versionFilter}
            onVersionFilterChange={(val) => {
              setVersionFilter(val);
              setPage(1);
            }}
            onNewSubnet={() => setShowForm(true)}
            totalSubnets={total}
          />

          {/* Tabel Subnet IPAM */}
          <IpamTable
            subnets={paginatedSubnets}
            isLoading={isLoading}
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
            />
          )}
        </div>
      </div>

      {/* ── 4. Modal Tambah Subnet Baru ── */}
      {showForm && (
        <IpamFormModal
          onClose={() => setShowForm(false)}
          onSuccess={() => {
            setShowForm(false);
            refetch();
          }}
        />
      )}
    </div>
  );
}

export default IpamListPage;
