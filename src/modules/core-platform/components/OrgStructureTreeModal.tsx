import { useState, useMemo } from "react";
import { 
  Building2, Briefcase, Users, ChevronRight, ChevronDown, 
  GitCompare, X, Search, Layers, Network, 
  Building, MapPin, Phone, FolderTree, User, ShieldCheck,
} from "lucide-react";
import type { Branch, BusinessUnit, Department, PositionRef } from "../types/organization";
import { useInternalOrganizations } from "@shared/api/organizationApi";
import { useOrganization } from "@shared/lib/organization-context";
import { useOrgStructureTree } from "../api/useDepartments";

interface OrgStructureTreeModalProps {
  onClose: () => void;
  branches: Branch[];
  businessUnits: BusinessUnit[];
  departments: Department[];
}

// Helper badge level jabatan (Supervisor, Staff, Manager, Lead, dll)
function getPositionLevelBadge(level?: string | null): { bg: string; text: string; border: string } {
  const l = (level ?? "").toLowerCase();
  if (l.includes("lead") || l.includes("supervisor") || l.includes("spv")) {
    return { bg: "bg-amber-50", text: "text-amber-800", border: "border-amber-200" };
  }
  if (l.includes("manager") || l.includes("head") || l.includes("chief") || l.includes("director")) {
    return { bg: "bg-purple-50", text: "text-purple-800", border: "border-purple-200" };
  }
  if (l.includes("officer") || l.includes("specialist") || l.includes("senior")) {
    return { bg: "bg-blue-50", text: "text-blue-800", border: "border-blue-200" };
  }
  // Staff / default
  return { bg: "bg-emerald-50", text: "text-emerald-800", border: "border-emerald-200" };
}

export function OrgStructureTreeModal({
  onClose,
  branches,
  businessUnits,
  departments,
}: OrgStructureTreeModalProps) {
  const { activeOrg } = useOrganization();
  const { data: organizations } = useInternalOrganizations();

  // State
  const [selectedOrgId, setSelectedOrgId] = useState<number | "all">(
    activeOrg?.id ?? (organizations?.[0]?.id ?? "all")
  );
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"chart" | "tree">("chart");
  const [collapsedNodes, setCollapsedNodes] = useState<Record<string, boolean>>({});

  // Ambil data tree lengkap dari backend: GET /api/v1/core-platform/organization-structure/tree
  const { data: treeData, isLoading: loadingTree } = useOrgStructureTree(
    selectedOrgId !== "all" ? { organization_id: Number(selectedOrgId) } : undefined
  );

  // Map ID Departemen -> Daftar Positions & Employees (dari treeData API atau props)
  const positionsByDeptId = useMemo(() => {
    const map = new Map<number, PositionRef[]>();

    // 1. Ekstrak dari props departments jika sudah ada
    departments.forEach(dept => {
      if (dept.positions && dept.positions.length > 0) {
        map.set(dept.id, dept.positions);
      }
    });

    // 2. Ekstrak rekursif dari response treeData API
    if (treeData) {
      const traverse = (node: unknown) => {
        if (!node || typeof node !== "object") return;
        const n = node as Record<string, unknown>;

        // Jika node adalah department dan punya positions
        if (n.positions && Array.isArray(n.positions) && n.id) {
          map.set(Number(n.id), n.positions as PositionRef[]);
        }

        // Rekursif ke children/departments/business_units/branches/data
        if (Array.isArray(node)) {
          node.forEach(traverse);
        } else {
          if (Array.isArray(n.departments)) n.departments.forEach(traverse);
          if (Array.isArray(n.business_units)) n.business_units.forEach(traverse);
          if (Array.isArray(n.branches)) n.branches.forEach(traverse);
          if (Array.isArray(n.children)) n.children.forEach(traverse);
          if (Array.isArray(n.data)) n.data.forEach(traverse);
        }
      };

      traverse(treeData);
    }

    return map;
  }, [departments, treeData]);

  const toggleNode = (nodeKey: string) => {
    setCollapsedNodes(prev => ({ ...prev, [nodeKey]: !prev[nodeKey] }));
  };

  // Fungsi Buka Semua & Tutup Semua
  const expandAll = () => {
    setCollapsedNodes({});
  };

  const collapseAll = () => {
    const allKeys: Record<string, boolean> = {
      branches: true,
      bus: true,
    };
    businessUnits.forEach(bu => { allKeys[`bu-${bu.id}`] = true; });
    branches.forEach(b => { allKeys[`branch-${b.id}`] = true; });
    departments.forEach(d => { 
      allKeys[`dept-${d.id}`] = true; 
      allKeys[`dept-tree-${d.id}`] = true; 
    });
    setCollapsedNodes(allKeys);
  };

  // Filter data berdasarkan organisasi yang dipilih
  const currentOrg = useMemo(() => {
    if (selectedOrgId === "all") return null;
    return organizations?.find(o => o.id === Number(selectedOrgId)) ?? activeOrg;
  }, [selectedOrgId, organizations, activeOrg]);

  const filteredBranches = useMemo(() => {
    let list = branches;
    if (selectedOrgId !== "all") {
      list = list.filter(b => b.organization_id === Number(selectedOrgId));
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(b => b.name.toLowerCase().includes(q) || b.code.toLowerCase().includes(q));
    }
    return list;
  }, [branches, selectedOrgId, search]);

  const filteredBUs = useMemo(() => {
    let list = businessUnits;
    if (selectedOrgId !== "all") {
      list = list.filter(bu => bu.organization_id === Number(selectedOrgId));
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(bu => bu.name.toLowerCase().includes(q) || bu.code.toLowerCase().includes(q));
    }
    return list;
  }, [businessUnits, selectedOrgId, search]);

  // Hierarki Departemen (dikelompokkan per BU dan Sub-Dept) + Pencarian sampai level Personil HR
  const departmentsByBU = useMemo(() => {
    const map = new Map<number, Department[]>();
    const unassigned: Department[] = [];

    departments.forEach(dept => {
      if (selectedOrgId !== "all" && dept.organization_id && dept.organization_id !== Number(selectedOrgId)) {
        return;
      }

      const positions = positionsByDeptId.get(dept.id) || dept.positions || [];

      if (search.trim()) {
        const q = search.toLowerCase();
        const matchDept = dept.name.toLowerCase().includes(q) || dept.code.toLowerCase().includes(q);
        const matchPersonnel = positions.some(pos => 
          pos.position_title.toLowerCase().includes(q) ||
          (pos.level && pos.level.toLowerCase().includes(q)) ||
          (pos.employees && pos.employees.some(emp => 
            emp.full_name.toLowerCase().includes(q) ||
            (emp.employee_number && emp.employee_number.toLowerCase().includes(q)) ||
            (emp.email && emp.email.toLowerCase().includes(q))
          ))
        );
        if (!matchDept && !matchPersonnel) return;
      }

      if (dept.business_unit_id) {
        const existing = map.get(dept.business_unit_id) || [];
        existing.push(dept);
        map.set(dept.business_unit_id, existing);
      } else {
        unassigned.push(dept);
      }
    });

    return { map, unassigned };
  }, [departments, selectedOrgId, search, positionsByDeptId]);

  // Total Personil HR di seluruh departemen yang tampil
  const totalEmployeesCount = useMemo(() => {
    let count = 0;
    departments.forEach(d => {
      const positions = positionsByDeptId.get(d.id) || d.positions || [];
      positions.forEach(p => {
        count += p.employees?.length ?? 0;
      });
    });
    return count;
  }, [departments, positionsByDeptId]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-3xl border border-slate-200/90 shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col overflow-hidden text-slate-800"
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER MODAL */}
        <div className="px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-slate-900 via-slate-800 to-[#1e293b] text-white flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
              <Network size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold tracking-tight text-white">Bagan Struktur Organisasi & Personil HR</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Tree View
                </span>
                {loadingTree && (
                  <span className="text-[10px] text-amber-300/80 animate-pulse">Memuat HR...</span>
                )}
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Hierarki Perusahaan, Cabang, Unit Bisnis, Departemen, hingga Jabatan & Karyawan HR.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* View Mode Toggle */}
            <div className="bg-slate-800/80 p-1 rounded-xl border border-slate-700 flex items-center text-xs font-semibold">
              <button
                type="button"
                onClick={() => setViewMode("chart")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  viewMode === "chart" ? "bg-amber-500 text-white shadow-sm" : "text-slate-300 hover:text-white"
                }`}
              >
                <GitCompare size={14} />
                <span>Bagan Visual</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode("tree")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  viewMode === "tree" ? "bg-amber-500 text-white shadow-sm" : "text-slate-300 hover:text-white"
                }`}
              >
                <FolderTree size={14} />
                <span>Pohon Hierarki</span>
              </button>
            </div>

            <button 
              type="button"
              onClick={onClose} 
              className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition-all ml-2 cursor-pointer"
              title="Tutup"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* TOOLBAR CONTROLS */}
        <div className="px-6 py-3 border-b border-slate-100 bg-slate-50/80 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex flex-wrap items-center gap-3">
            {/* Organisasi Selector */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Entitas:</span>
              <select
                className="bg-white border border-slate-300 text-xs font-semibold text-slate-700 rounded-xl px-3 py-1.5 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 shadow-sm cursor-pointer"
                value={selectedOrgId}
                onChange={(e) => setSelectedOrgId(e.target.value === "all" ? "all" : Number(e.target.value))}
              >
                <option value="all">Semua Organisasi</option>
                {(organizations ?? []).map(org => (
                  <option key={org.id} value={org.id}>{org.name} ({org.code})</option>
                ))}
              </select>
            </div>

            {/* Pencarian (Cabang, BU, Dept, Jabatan, atau Karyawan) */}
            <div className="relative w-72">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Cari cabang, dept, jabatan, personil..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-white border border-slate-300 text-xs rounded-xl pl-8 pr-3 py-1.5 placeholder-slate-400 text-slate-700 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 shadow-sm"
              />
            </div>
          </div>

          {/* TOMBOL BUKA SEMUA & TUTUP SEMUA */}
          <div className="flex items-center gap-2 text-xs">
            <button
              type="button"
              onClick={expandAll}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 active:scale-95 font-semibold text-slate-700 transition-all cursor-pointer shadow-xs"
              title="Buka semua rincian departemen & personil"
            >
              <ChevronDown size={14} className="text-slate-500" />
              <span>Buka Semua</span>
            </button>
            <button
              type="button"
              onClick={collapseAll}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 active:scale-95 font-semibold text-slate-700 transition-all cursor-pointer shadow-xs"
              title="Tutup semua rincian departemen & personil"
            >
              <ChevronRight size={14} className="text-slate-500" />
              <span>Tutup Semua</span>
            </button>
          </div>
        </div>

        {/* LEGEND BADGES */}
        <div className="px-6 py-2 bg-white border-b border-slate-100 flex flex-wrap items-center gap-4 text-[11px] font-semibold text-slate-500 shrink-0">
          <span className="text-slate-400 uppercase tracking-wider text-[10px] font-bold">Keterangan:</span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span> Organisasi Induk
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> Cabang (Branch)
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-500"></span> Business Unit (BU)
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Department
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span> Personil HR
          </span>
        </div>

        {/* MAIN TREE CONTENT AREA */}
        <div className="flex-1 overflow-auto p-6 bg-slate-50/50">
          {viewMode === "chart" ? (
            /* ================= MODE BAGAN VISUAL (ORG CHART) ================= */
            <div className="min-w-fit flex flex-col items-center pb-12">
              {/* LEVEL 1: ROOT ORGANISASI */}
              <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl p-4 shadow-lg border border-slate-700 min-w-[280px] max-w-sm text-center relative z-10">
                <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 mx-auto flex items-center justify-center mb-2">
                  <Building2 size={20} />
                </div>
                <h3 className="font-extrabold text-sm text-white">{currentOrg?.name ?? "MSDC Enterprise Platform"}</h3>
                <p className="text-[11px] font-mono text-amber-400 mt-0.5">{currentOrg?.code ?? "MSDC-HQ"}</p>
                <div className="mt-2 pt-2 border-t border-slate-700/60 flex items-center justify-center gap-3 text-[10px] text-slate-300">
                  <span>{filteredBranches.length} Cabang</span>
                  <span>•</span>
                  <span>{filteredBUs.length} Unit Bisnis</span>
                  <span>•</span>
                  <span className="text-amber-300 font-bold">{totalEmployeesCount} Personil HR</span>
                </div>
              </div>

              {/* Vertical connector from Root */}
              <div className="w-0.5 h-8 bg-slate-300"></div>

              {/* LEVEL 2: SPLIT CABANG & BUSINESS UNIT */}
              <div className="w-full flex flex-col lg:flex-row items-stretch justify-center gap-8 relative pt-4">
                {/* Horizontal Bar Connector */}
                <div className="hidden lg:block absolute top-0 left-1/4 right-1/4 h-0.5 bg-slate-300"></div>

                {/* KOLOM KIRI: CABANG (BRANCHES) */}
                <div className="flex-1 max-w-md bg-white rounded-2xl border border-amber-200/80 p-5 shadow-sm">
                  <div 
                    onClick={() => toggleNode("branches")}
                    className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100 cursor-pointer select-none"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400">
                        {collapsedNodes["branches"] ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
                      </span>
                      <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                        <Building size={16} />
                      </div>
                      <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider">Cabang (Branch)</h4>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700">
                      {filteredBranches.length}
                    </span>
                  </div>

                  {!collapsedNodes["branches"] && (
                    <div className="space-y-3">
                      {filteredBranches.map(branch => (
                        <div key={branch.id} className="p-3 bg-amber-50/40 border border-amber-200/60 rounded-xl hover:border-amber-400 transition-all">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <span className="text-[10px] font-mono font-bold bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded">
                                {branch.code}
                              </span>
                              <div className="font-bold text-xs text-slate-900 mt-1">{branch.name}</div>
                            </div>
                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${branch.is_active ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                              {branch.is_active ? "AKTIF" : "NONAKTIF"}
                            </span>
                          </div>
                          {(branch.address || branch.phone) && (
                            <div className="mt-2 pt-2 border-t border-amber-100 text-[10px] text-slate-500 space-y-0.5">
                              {branch.address && <div className="flex items-center gap-1.5"><MapPin size={11} className="text-amber-600 shrink-0" /> <span className="truncate">{branch.address}</span></div>}
                              {branch.phone && <div className="flex items-center gap-1.5"><Phone size={11} className="text-amber-600 shrink-0" /> <span>{branch.phone}</span></div>}
                            </div>
                          )}
                        </div>
                      ))}
                      {filteredBranches.length === 0 && (
                        <div className="py-6 text-center text-xs text-slate-400 italic">Tidak ada cabang ditemukan.</div>
                      )}
                    </div>
                  )}
                </div>

                {/* KOLOM KANAN: BUSINESS UNITS & DEPARTMENTS (DENGAN DATA HR) */}
                <div className="flex-1 max-w-2xl bg-white rounded-2xl border border-sky-200/80 p-5 shadow-sm">
                  <div 
                    onClick={() => toggleNode("bus")}
                    className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100 cursor-pointer select-none"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400">
                        {collapsedNodes["bus"] ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
                      </span>
                      <div className="w-7 h-7 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
                        <Briefcase size={16} />
                      </div>
                      <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider">Business Unit & Departemen</h4>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 text-sky-700">
                      {filteredBUs.length} BU
                    </span>
                  </div>

                  {!collapsedNodes["bus"] && (
                    <div className="space-y-4">
                      {filteredBUs.map(bu => {
                        const depts = departmentsByBU.map.get(bu.id) || [];
                        const isCollapsed = !!collapsedNodes[`bu-${bu.id}`];

                        return (
                          <div key={bu.id} className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-xs">
                            {/* BU Header Card */}
                            <div 
                              onClick={() => toggleNode(`bu-${bu.id}`)}
                              className="p-3 bg-slate-50 hover:bg-sky-50/50 flex items-center justify-between cursor-pointer transition-colors select-none"
                            >
                              <div className="flex items-center gap-2.5">
                                <span className="text-slate-400 hover:text-slate-600">
                                  {isCollapsed ? <ChevronRight size={15} /> : <ChevronDown size={15} />}
                                </span>
                                <div className="w-6 h-6 rounded-md bg-sky-100 text-sky-700 flex items-center justify-center">
                                  <Briefcase size={13} />
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-bold text-xs text-slate-900">{bu.name}</span>
                                    <span className="text-[10px] font-mono text-slate-500 bg-white border border-slate-200 px-1.5 py-0.5 rounded">
                                      {bu.code}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <span className="text-[10px] font-semibold text-slate-500 bg-white border border-slate-200 px-2 py-0.5 rounded-full">
                                {depts.length} Dept
                              </span>
                            </div>

                            {/* List Departemen di bawah BU ini */}
                            {!isCollapsed && (
                              <div className="p-3 pl-6 bg-white border-t border-slate-100 space-y-3">
                                {depts.map(dept => {
                                  const positions = positionsByDeptId.get(dept.id) || dept.positions || [];
                                  const totalDeptPersonnel = positions.reduce((acc, p) => acc + (p.employees?.length ?? 0), 0);
                                  const isDeptCardCollapsed = !!collapsedNodes[`dept-${dept.id}`];

                                  return (
                                    <div 
                                      key={dept.id} 
                                      className="p-3.5 bg-slate-50/80 hover:bg-slate-50 border border-slate-200 rounded-xl transition-all shadow-2xs space-y-2.5"
                                    >
                                      {/* Baris Utama Departemen */}
                                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                        <div 
                                          onClick={() => toggleNode(`dept-${dept.id}`)}
                                          className="flex items-center gap-2 cursor-pointer select-none"
                                        >
                                          <span className="text-slate-400 hover:text-slate-600">
                                            {isDeptCardCollapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
                                          </span>
                                          <div className="w-6 h-6 rounded-md bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                                            <Users size={13} />
                                          </div>
                                          <div>
                                            <div className="flex items-center gap-1.5">
                                              <span className="font-bold text-xs text-slate-900">{dept.name}</span>
                                              <span className="text-[10px] font-mono text-slate-500 bg-white border border-slate-200 px-1.5 py-0.2 rounded">
                                                {dept.code}
                                              </span>
                                            </div>
                                          </div>
                                        </div>

                                        <div className="flex items-center gap-2 self-start sm:self-auto pl-6 sm:pl-0">
                                          {/* Badge Jumlah Personil HR */}
                                          {totalDeptPersonnel > 0 ? (
                                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200/80">
                                              👥 {totalDeptPersonnel} Personil HR
                                            </span>
                                          ) : (
                                            <span className="text-[10px] text-slate-400 italic bg-white border border-slate-200 px-2 py-0.5 rounded-full">
                                              Belum ada personil HR
                                            </span>
                                          )}

                                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${dept.is_active ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                                            {dept.is_active ? "AKTIF" : "NONAKTIF"}
                                          </span>
                                        </div>
                                      </div>

                                      {/* Rincian Jabatan & Karyawan HR (Collapsible) */}
                                      {!isDeptCardCollapsed && (
                                        <div className="pt-2 border-t border-slate-200/70">
                                          {positions.length > 0 ? (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-1">
                                              {positions.map((pos, pIdx) => {
                                                const badgeStyle = getPositionLevelBadge(pos.level);
                                                const employees = pos.employees ?? [];

                                                return (
                                                  <div 
                                                    key={pos.id ?? pIdx}
                                                    className="bg-white p-2.5 rounded-xl border border-slate-200/90 shadow-2xs space-y-1.5"
                                                  >
                                                    {/* Header Jabatan & Level */}
                                                    <div className="flex items-start justify-between gap-1.5">
                                                      <div className="flex items-center gap-1.5 font-bold text-xs text-slate-800">
                                                        <ShieldCheck size={13} className="text-blue-600 shrink-0 mt-0.5" />
                                                        <span className="leading-tight">{pos.position_title}</span>
                                                      </div>
                                                      {pos.level && (
                                                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md border shrink-0 ${badgeStyle.bg} ${badgeStyle.text} ${badgeStyle.border}`}>
                                                          {pos.level}
                                                        </span>
                                                      )}
                                                    </div>

                                                    {/* Daftar Karyawan pada Jabatan Ini */}
                                                    <div className="space-y-1 pt-1 border-t border-slate-100">
                                                      {employees.map((emp, eIdx) => (
                                                        <div key={emp.id ?? eIdx} className="flex items-center justify-between gap-2 text-[11px] text-slate-600">
                                                          <div className="flex items-center gap-1.5 truncate">
                                                            <User size={12} className="text-slate-400 shrink-0" />
                                                            <span className="font-semibold text-slate-900 truncate">{emp.full_name}</span>
                                                            {emp.employee_number && (
                                                              <span className="font-mono text-[9px] text-slate-500 bg-slate-100 px-1 py-0.2 rounded border border-slate-200 shrink-0">
                                                                {emp.employee_number}
                                                              </span>
                                                            )}
                                                          </div>
                                                          {emp.email && (
                                                            <span className="text-[10px] text-slate-400 font-mono truncate max-w-[140px]" title={emp.email}>
                                                              {emp.email}
                                                            </span>
                                                          )}
                                                        </div>
                                                      ))}
                                                      {employees.length === 0 && (
                                                        <div className="text-[10px] text-slate-400 italic">Belum ada karyawan terisi.</div>
                                                      )}
                                                    </div>
                                                  </div>
                                                );
                                              })}
                                            </div>
                                          ) : (
                                            <div className="text-[11px] text-slate-400 italic py-1 pl-6">
                                              Belum ada personil HR yang ditugaskan ke departemen ini.
                                            </div>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}

                                {depts.length === 0 && (
                                  <div className="text-[11px] text-slate-400 italic py-1">Belum ada departemen di bawah BU ini.</div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}

                      {/* Departemen Mandiri / Non-BU */}
                      {departmentsByBU.unassigned.length > 0 && (
                        <div className="border border-dashed border-slate-300 rounded-xl p-3 bg-slate-50/50">
                          <div className="text-[11px] font-bold text-slate-500 mb-2 uppercase tracking-wider flex items-center gap-1.5">
                            <Layers size={13} /> Departemen Mandiri / Non-BU
                          </div>
                          <div className="space-y-2">
                            {departmentsByBU.unassigned.map(dept => {
                              const positions = positionsByDeptId.get(dept.id) || dept.positions || [];
                              const totalPersonnel = positions.reduce((acc, p) => acc + (p.employees?.length ?? 0), 0);

                              return (
                                <div key={dept.id} className="p-2.5 bg-white border border-slate-200 rounded-lg text-xs space-y-1.5">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <Users size={13} className="text-slate-500" />
                                      <span className="font-semibold text-slate-800">{dept.name}</span>
                                      <span className="text-[10px] font-mono text-slate-400">({dept.code})</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      {totalPersonnel > 0 ? (
                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                                          {totalPersonnel} Personil HR
                                        </span>
                                      ) : (
                                        <span className="text-[9px] text-slate-400">Mandiri (0 Personil)</span>
                                      )}
                                    </div>
                                  </div>

                                  {positions.length > 0 && (
                                    <div className="pl-4 border-l border-slate-100 text-[11px] space-y-0.5 text-slate-600">
                                      {positions.map((pos, pIdx) => (
                                        <div key={pIdx} className="flex items-center gap-2">
                                          <span className="font-medium text-slate-800">• {pos.position_title}</span>
                                          <span className="text-[10px] text-slate-500">
                                            ({pos.employees?.map(e => e.full_name).join(", ") || "Kosong"})
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {filteredBUs.length === 0 && (
                        <div className="py-6 text-center text-xs text-slate-400 italic">Tidak ada Business Unit ditemukan.</div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* ================= MODE POHON HIERARKI (TREE LIST) ================= */
            <div className="max-w-3xl mx-auto bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <div className="space-y-2">
                {/* Root Tree Item */}
                <div className="flex items-center justify-between p-2.5 bg-slate-100 rounded-xl font-bold text-slate-900 text-xs">
                  <div className="flex items-center gap-2">
                    <Building2 size={16} className="text-blue-600" />
                    <span>{currentOrg?.name ?? "MSDC Enterprise Organization"}</span>
                    <span className="text-[10px] font-mono text-slate-500 ml-1">({currentOrg?.code ?? "HQ"})</span>
                  </div>
                  <span className="text-[10px] font-semibold text-slate-500 bg-white border border-slate-200 px-2 py-0.5 rounded-full">
                    Total {totalEmployeesCount} Personil HR
                  </span>
                </div>

                <div className="pl-6 border-l-2 border-slate-200 ml-4 space-y-4 mt-2">
                  {/* Grup Branch */}
                  <div>
                    <div 
                      onClick={() => toggleNode("branches")}
                      className="flex items-center gap-2 py-1 text-xs font-bold text-amber-700 uppercase tracking-wider cursor-pointer hover:text-amber-800 select-none"
                    >
                      {collapsedNodes["branches"] ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
                      <Building size={14} /> Cabang / Branches ({filteredBranches.length})
                    </div>
                    {!collapsedNodes["branches"] && (
                      <div className="pl-4 border-l border-amber-200 ml-2 space-y-2 mt-1">
                        {filteredBranches.map(b => (
                          <div key={b.id} className="p-2 bg-amber-50/50 border border-amber-200 rounded-lg flex items-center justify-between text-xs">
                            <span className="font-medium text-slate-800">{b.name} <span className="font-mono text-[10px] text-slate-500">[{b.code}]</span></span>
                            <span className="text-[10px] text-emerald-600 font-bold">{b.is_active ? "Aktif" : "Nonaktif"}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Grup Business Unit & Dept & HR Ranting */}
                  <div>
                    <div 
                      onClick={() => toggleNode("bus")}
                      className="flex items-center gap-2 py-1 text-xs font-bold text-sky-700 uppercase tracking-wider cursor-pointer hover:text-sky-800 select-none"
                    >
                      {collapsedNodes["bus"] ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
                      <Briefcase size={14} /> Business Units & Departemen ({filteredBUs.length})
                    </div>
                    {!collapsedNodes["bus"] && (
                      <div className="pl-4 border-l border-sky-200 ml-2 space-y-3 mt-1">
                        {filteredBUs.map(bu => {
                          const depts = departmentsByBU.map.get(bu.id) || [];
                          const isBuCollapsed = !!collapsedNodes[`bu-${bu.id}`];

                          return (
                            <div key={bu.id} className="space-y-1.5">
                              <div 
                                onClick={() => toggleNode(`bu-${bu.id}`)}
                                className="p-2 bg-sky-50/60 border border-sky-200 rounded-lg flex items-center justify-between text-xs font-semibold text-slate-900 cursor-pointer hover:bg-sky-100/50 select-none transition-colors"
                              >
                                <div className="flex items-center gap-2">
                                  {isBuCollapsed ? <ChevronRight size={13} className="text-slate-400" /> : <ChevronDown size={13} className="text-slate-400" />}
                                  <span>{bu.name} <span className="font-mono text-[10px] text-slate-500">[{bu.code}]</span></span>
                                </div>
                                <span className="text-[10px] font-normal text-slate-500">{depts.length} Departemen</span>
                              </div>

                              {/* Ranting Departemen */}
                              {!isBuCollapsed && depts.length > 0 && (
                                <div className="pl-5 border-l border-slate-200 ml-3 space-y-2">
                                  {depts.map(d => {
                                    const positions = positionsByDeptId.get(d.id) || d.positions || [];
                                    const totalDeptPersonnel = positions.reduce((acc, p) => acc + (p.employees?.length ?? 0), 0);
                                    const isDeptTreeCollapsed = !!collapsedNodes[`dept-tree-${d.id}`];

                                    return (
                                      <div key={d.id} className="space-y-1">
                                        <div 
                                          onClick={() => toggleNode(`dept-tree-${d.id}`)}
                                          className="p-2 bg-slate-50 hover:bg-emerald-50/40 border border-slate-200 rounded-lg text-xs flex items-center justify-between cursor-pointer transition-colors select-none"
                                        >
                                          <div className="flex items-center gap-2">
                                            <span className="text-slate-400">
                                              {isDeptTreeCollapsed ? <ChevronRight size={13} /> : <ChevronDown size={13} />}
                                            </span>
                                            <Users size={13} className="text-emerald-600" />
                                            <span className="font-bold text-slate-800">{d.name}</span>
                                            <span className="font-mono text-[10px] text-slate-400">[{d.code}]</span>
                                          </div>

                                          <div className="flex items-center gap-2">
                                            {totalDeptPersonnel > 0 ? (
                                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                                                {totalDeptPersonnel} Personil
                                              </span>
                                            ) : (
                                              <span className="text-[10px] text-slate-400 italic">0 Personil</span>
                                            )}
                                          </div>
                                        </div>

                                        {/* Anak Ranting: Jabatan & Personil HR */}
                                        {!isDeptTreeCollapsed && (
                                          <div className="pl-5 border-l-2 border-emerald-200 ml-3 space-y-1.5 py-1">
                                            {positions.map((pos, pIdx) => {
                                              const badgeStyle = getPositionLevelBadge(pos.level);
                                              const employees = pos.employees ?? [];

                                              return (
                                                <div key={pos.id ?? pIdx} className="bg-white p-2 rounded-lg border border-slate-200 shadow-2xs space-y-1">
                                                  {/* Nama Jabatan */}
                                                  <div className="flex items-center justify-between gap-1.5 text-xs font-bold text-slate-800">
                                                    <div className="flex items-center gap-1.5">
                                                      <ShieldCheck size={12} className="text-blue-600 shrink-0" />
                                                      <span>{pos.position_title}</span>
                                                    </div>
                                                    {pos.level && (
                                                      <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${badgeStyle.bg} ${badgeStyle.text} ${badgeStyle.border}`}>
                                                        {pos.level}
                                                      </span>
                                                    )}
                                                  </div>

                                                  {/* Nama Karyawan di bawah jabatan */}
                                                  <div className="pl-3.5 border-l border-slate-100 space-y-0.5">
                                                    {employees.map((emp, eIdx) => (
                                                      <div key={emp.id ?? eIdx} className="flex items-center justify-between gap-2 text-[10px] text-slate-600">
                                                        <div className="flex items-center gap-1">
                                                          <User size={11} className="text-slate-400" />
                                                          <span className="font-semibold text-slate-900">{emp.full_name}</span>
                                                          {emp.employee_number && (
                                                            <span className="font-mono text-[9px] text-slate-500 bg-slate-100 px-1 rounded border border-slate-200">
                                                              {emp.employee_number}
                                                            </span>
                                                          )}
                                                        </div>
                                                        {emp.email && (
                                                          <span className="font-mono text-[9px] text-slate-400 truncate max-w-[150px]">{emp.email}</span>
                                                        )}
                                                      </div>
                                                    ))}
                                                    {employees.length === 0 && (
                                                      <div className="text-[10px] text-slate-400 italic">Belum ada karyawan.</div>
                                                    )}
                                                  </div>
                                                </div>
                                              );
                                            })}

                                            {positions.length === 0 && (
                                              <div className="text-[11px] text-slate-400 italic py-1 pl-2">
                                                Belum ada personil HR di departemen ini.
                                              </div>
                                            )}
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* MODAL FOOTER */}
        <div className="px-6 py-3 border-t border-slate-200 bg-white flex items-center justify-between text-xs text-slate-500 shrink-0">
          <div>
            Total: <strong className="text-slate-800">{filteredBranches.length}</strong> Cabang, <strong className="text-slate-800">{filteredBUs.length}</strong> Business Unit, <strong className="text-slate-800">{departments.length}</strong> Departemen, <strong className="text-indigo-700">{totalEmployeesCount}</strong> Personil HR.
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 font-bold rounded-xl transition-all cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}