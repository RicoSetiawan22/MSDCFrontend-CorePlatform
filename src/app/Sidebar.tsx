import { useState, useMemo, useEffect } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  User,
  Server,
  Users,
  Landmark,
  Package,
  UserCheck,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  type LucideIcon,
} from "lucide-react";
import { useAuth } from "@shared/lib/auth-context";
import type { NavItem } from "@shared/types/nav";
import { crmSalesNav } from "@modules/crm-sales/nav";
import { financeAccountingNav } from "@modules/finance-accounting/nav";
import { corePlatformNav } from "@modules/core-platform/nav";
import { procurementInventoryNav } from "@modules/procurement-inventory/nav";
import { dataCenterOpsNav } from "@modules/data-center-ops/nav";
import { hrServiceSupportNav } from "@modules/hr-service-support/nav";
import { getNavItemIcon } from "./navigation/navIcons";

interface ModuleConfig {
  id: string;
  title: string;
  shortLabel: string;
  headerLabel: string;
  icon: LucideIcon;
  defaultPath: string;
  prefixes: string[];
  items: NavItem[];
}

const MODULE_CONFIGS: ModuleConfig[] = [
  {
    id: "dc-ops",
    title: "Data Center Operations",
    shortLabel: "DC Ops",
    headerLabel: "DATA CENTER OPERATIONAL",
    icon: Server,
    defaultPath: "/dc",
    prefixes: ["/dc"],
    items: dataCenterOpsNav,
  },
  {
    id: "crm-sales",
    title: "CRM & Sales",
    shortLabel: "CRM Sales",
    headerLabel: "CRM & SALES",
    icon: Users,
    defaultPath: "/crm-sales",
    prefixes: ["/crm-sales"],
    items: crmSalesNav,
  },
  {
    id: "finance",
    title: "Finance & Accounting",
    shortLabel: "Finance",
    headerLabel: "FINANCE & ACCOUNTING",
    icon: Landmark,
    defaultPath: "/finance/ar-hub",
    prefixes: ["/finance"],
    items: financeAccountingNav,
  },
  {
    id: "procurement",
    title: "Procurement & Inventory",
    shortLabel: "Procurement",
    headerLabel: "PROCUREMENT & INVENTORY",
    icon: Package,
    defaultPath: "/procurement-inventory/dashboard",
    prefixes: ["/procurement-inventory"],
    items: procurementInventoryNav,
  },
  {
    id: "hr",
    title: "HR & Service Support",
    shortLabel: "HR Support",
    headerLabel: "HR & SERVICE SUPPORT",
    icon: UserCheck,
    defaultPath: "/hr/dashboard",
    prefixes: ["/hr"],
    items: hrServiceSupportNav,
  },
  {
    id: "core",
    title: "Core Platform",
    shortLabel: "Core Platform",
    headerLabel: "CORE PLATFORM",
    icon: Settings,
    defaultPath: "/core-platform/my-approvals",
    prefixes: ["/core-platform"],
    items: corePlatformNav,
  },
];

// Konfigurasi khusus untuk Menu Akun / Profil Pengguna
const ACCOUNT_MODULE_CONFIG: ModuleConfig = {
  id: "account",
  title: "Pengaturan Akun",
  shortLabel: "Akun",
  headerLabel: "PENGATURAN AKUN",
  icon: User,
  defaultPath: "/account",
  prefixes: ["/account", "/2fa"],
  items: [
    {
      label: "Profil & Keamanan",
      path: "/account",
      requiredPermissions: [],
    },
  ],
};

export function Sidebar() {
  const { user, hasPermission, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // State collapse untuk Tier 2 (Sub-menu panel)
  const [isSubmenuCollapsed, setIsSubmenuCollapsed] = useState(false);

  // State tooltip untuk hover pada rail utama (Tier 1)
  const [hoveredModule, setHoveredModule] = useState<{ id: string; title: string; top: number } | null>(null);

  // State tooltip untuk hover pada sub-menu saat sedang collapsed
  const [hoveredSubItem, setHoveredSubItem] = useState<{ label: string; top: number } | null>(null);

  // Cek apakah user sedang berada di halaman akun / profil
  const isAccountActive =
    location.pathname === "/account" ||
    location.pathname.startsWith("/account/") ||
    location.pathname.startsWith("/2fa");

  // Filter modul berdasar visible_sections role user (jika ada batasan)
  const allowedSections = user?.visible_sections;
  const availableModules = useMemo(() => {
    return MODULE_CONFIGS.filter(
      (m) => !allowedSections || allowedSections.includes(m.title)
    );
  }, [allowedSections]);

  // Deteksi modul yang sedang aktif berdasarkan path URL saat ini
  const detectedModuleId = useMemo(() => {
    if (isAccountActive) {
      return "account";
    }
    const current = availableModules.find((m) =>
      m.prefixes.some((p) => location.pathname === p || location.pathname.startsWith(`${p}/`))
    );
    return current?.id ?? availableModules[0]?.id ?? "dc-ops";
  }, [availableModules, location.pathname, isAccountActive]);

  // State modul aktif manual
  const [activeModuleId, setActiveModuleId] = useState<string>(detectedModuleId);

  // Selalu sinkronkan activeModuleId saat route URL berubah
  useEffect(() => {
    setActiveModuleId(detectedModuleId);
  }, [detectedModuleId]);

  // Sinkronkan activeModule untuk Tier 2 (Sub-menu panel)
  const activeModule = useMemo(() => {
    if (isAccountActive || activeModuleId === "account") {
      return ACCOUNT_MODULE_CONFIG;
    }
    const fromId = availableModules.find((m) => m.id === activeModuleId);
    if (fromId) return fromId;
    return availableModules.find((m) => m.id === detectedModuleId) ?? availableModules[0];
  }, [availableModules, activeModuleId, detectedModuleId, isAccountActive]);

  // Filter item sub-menu berdasar permission user
  const visibleSubItems = useMemo(() => {
    if (!activeModule) return [];
    return activeModule.items.filter(
      (item) => item.requiredPermissions.length === 0 || item.requiredPermissions.some(hasPermission)
    );
  }, [activeModule, hasPermission]);

  // Kelompokkan visibleSubItems berdasarkan group (mis. Master, Transaksi, Report)
  const groupedNavSections = useMemo(() => {
    const sections: { groupName?: string; items: NavItem[] }[] = [];
    const groupMap = new Map<string, NavItem[]>();
    const standaloneItems: NavItem[] = [];

    for (const item of visibleSubItems) {
      if (!item.group || item.group.toLowerCase() === "overview") {
        standaloneItems.push(item);
      } else {
        const list = groupMap.get(item.group);
        if (list) {
          list.push(item);
        } else {
          const newList = [item];
          groupMap.set(item.group, newList);
          sections.push({ groupName: item.group, items: newList });
        }
      }
    }

    if (standaloneItems.length > 0) {
      sections.unshift({ groupName: undefined, items: standaloneItems });
    }

    return sections;
  }, [visibleSubItems]);

  // Deteksi item sub-menu yang paling spesifik (longest match) sesuai URL saat ini
  const activeSubItemPath = useMemo(() => {
    const currentPath = location.pathname;
    let bestMatch: string | null = null;
    let bestMatchLength = 0;

    for (const item of visibleSubItems) {
      const rawPath = item.path.startsWith("/") ? item.path : `/${item.path}`;
      // Khusus root dashboard ("/dc", "/procurement-inventory/dashboard", dsb.), hanya aktif bila exact match
      const isRootDashboard =
        item.label.toLowerCase().trim() === "dashboard" ||
        rawPath === "/dc" ||
        rawPath.endsWith("/dashboard");

      if (isRootDashboard) {
        if (currentPath === rawPath || (rawPath !== "/" && currentPath === `${rawPath}/`)) {
          if (rawPath.length > bestMatchLength) {
            bestMatch = rawPath;
            bestMatchLength = rawPath.length;
          }
        }
      } else {
        if (currentPath === rawPath || (rawPath !== "/" && currentPath.startsWith(`${rawPath}/`))) {
          if (rawPath.length > bestMatchLength) {
            bestMatch = rawPath;
            bestMatchLength = rawPath.length;
          }
        }
      }
    }

    return bestMatch;
  }, [visibleSubItems, location.pathname]);

  // Klik icon modul di Tier 1 (Rail Utama)
  const handleSelectModule = (mod: ModuleConfig) => {
    setActiveModuleId(mod.id);
    // Buka sub-menu jika sedang collapsed agar user bisa melihat isinya
    if (isSubmenuCollapsed) {
      setIsSubmenuCollapsed(false);
    }
    // Jika belum berada di dalam prefix modul tersebut, navigasikan ke defaultPath modul
    const isAlreadyInModule = mod.prefixes.some(
      (p) => location.pathname === p || location.pathname.startsWith(`${p}/`)
    );
    if (!isAlreadyInModule) {
      navigate(mod.defaultPath);
    }
  };

  // Klik icon Akun / Profil di paling bawah Tier 1
  const handleSelectAccount = () => {
    setActiveModuleId("account");
    if (isSubmenuCollapsed) {
      setIsSubmenuCollapsed(false);
    }
    if (!isAccountActive) {
      navigate("/account");
    }
  };

  return (
    <aside
      className="msdc-sidebar-root"
      style={{
        display: "flex",
        height: "100vh",
        flexShrink: 0,
        userSelect: "none",
        zIndex: 50,
      }}
    >
      {/* ══════════════════════════════════════════════════════════════════════
          TIER 1: RAIL MENU UTAMA (Paling Kiri, 68px, Darkest Navy #061224)
          Fixed, TIDAK BISA COLLAPSE sesuai instruksi mentee
          ══════════════════════════════════════════════════════════════════════ */}
      <div
        className="msdc-sidebar-rail"
        style={{
          width: 68,
          backgroundColor: "#061224",
          borderRight: "1px solid rgba(255, 255, 255, 0.05)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          paddingBottom: "1rem",
          position: "relative",
          zIndex: 52,
        }}
      >
        {/* Header spacer Tier 1 yang sejajar tepat dengan batas header logo di Tier 2 (85px) */}
        <div
          style={{
            height: 85,
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
            flexShrink: 0,
          }}
        />

        {/* Tombol modul stack vertikal - dimulai tepat di bawah logo */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "0.5rem",
            width: "100%",
            flex: 1,
            overflowY: "auto",
            paddingTop: "0.85rem",
            scrollbarWidth: "none",
          }}
        >
          {availableModules.map((mod) => {
            const isActive = !isAccountActive && activeModule?.id === mod.id;
            const Icon = mod.icon;

            return (
              <div
                key={mod.id}
                style={{ width: "100%", position: "relative" }}
                onMouseEnter={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  setHoveredModule({ id: mod.id, title: mod.title, top: rect.top + rect.height / 2 });
                }}
                onMouseLeave={() => setHoveredModule(null)}
              >
                {/* Garis Aksen Vertikal Kuning Emas di Tepi Kiri saat Aktif */}
                {isActive && (
                  <div
                    style={{
                      position: "absolute",
                      left: 0,
                      top: "15%",
                      bottom: "15%",
                      width: "3.5px",
                      backgroundColor: "#F2A602",
                      borderTopRightRadius: "3px",
                      borderBottomRightRadius: "3px",
                    }}
                  />
                )}

                <button
                  type="button"
                  onClick={() => handleSelectModule(mod)}
                  style={{
                    width: 48,
                    height: 48,
                    margin: "0 auto",
                    borderRadius: "10px",
                    border: "none",
                    backgroundColor: isActive ? "rgba(242, 166, 2, 0.12)" : "transparent",
                    color: isActive ? "#F2A602" : "#94A3B8",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    transition: "all 0.18s ease",
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.06)";
                      e.currentTarget.style.color = "#FFFFFF";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.backgroundColor = "transparent";
                      e.currentTarget.style.color = "#94A3B8";
                    }
                  }}
                  aria-label={mod.title}
                >
                  <Icon size={21} strokeWidth={isActive ? 2.4 : 1.9} />
                </button>
              </div>
            );
          })}
        </div>

        {/* Tombol Pengaturan Akun di paling bawah rail utama */}
        <div
          style={{
            width: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            paddingTop: "0.5rem",
            borderTop: "1px solid rgba(255, 255, 255, 0.05)",
            position: "relative",
          }}
          onMouseEnter={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            setHoveredModule({ id: "account", title: "Pengaturan Akun", top: rect.top + rect.height / 2 });
          }}
          onMouseLeave={() => setHoveredModule(null)}
        >
          {isAccountActive && (
            <div
              style={{
                position: "absolute",
                left: 0,
                top: "15%",
                bottom: "15%",
                width: "3.5px",
                backgroundColor: "#F2A602",
                borderTopRightRadius: "3px",
                borderBottomRightRadius: "3px",
              }}
            />
          )}

          <button
            type="button"
            onClick={handleSelectAccount}
            style={{
              width: 48,
              height: 48,
              margin: "0 auto",
              borderRadius: "10px",
              border: "none",
              backgroundColor: isAccountActive ? "rgba(242, 166, 2, 0.12)" : "transparent",
              color: isAccountActive ? "#F2A602" : "#94A3B8",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              transition: "all 0.18s ease",
            }}
            onMouseEnter={(e) => {
              if (!isAccountActive) {
                e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.06)";
                e.currentTarget.style.color = "#FFFFFF";
              }
            }}
            onMouseLeave={(e) => {
              if (!isAccountActive) {
                e.currentTarget.style.backgroundColor = "transparent";
                e.currentTarget.style.color = "#94A3B8";
              }
            }}
            aria-label="Pengaturan Akun"
          >
            <User size={21} strokeWidth={isAccountActive ? 2.4 : 1.9} />
          </button>
        </div>
      </div>

      {/* Floating Tooltip untuk Tier 1 (Muncul di sebelah kanan rail saat hover) */}
      {hoveredModule && (
        <div
          style={{
            position: "fixed",
            left: 76,
            top: hoveredModule.top,
            transform: "translateY(-50%)",
            backgroundColor: "#0F172A",
            border: "1px solid rgba(255, 255, 255, 0.12)",
            color: "#FFFFFF",
            padding: "0.35rem 0.75rem",
            borderRadius: "6px",
            fontSize: "0.75rem",
            fontWeight: 600,
            whiteSpace: "nowrap",
            boxShadow: "0 6px 20px rgba(0, 0, 0, 0.35)",
            pointerEvents: "none",
            zIndex: 9999,
          }}
        >
          {hoveredModule.title}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          TIER 2: PANEL SUB-MENU (230px / 64px Collapsed, Deep Navy #0A1C33)
          Memiliki fitur Collapse sesuai instruksi mentee
          ══════════════════════════════════════════════════════════════════════ */}
      <div
        className="msdc-sidebar-submenu"
        style={{
          width: isSubmenuCollapsed ? 64 : 230,
          backgroundColor: "#0A1C33",
          borderRight: "1px solid rgba(255, 255, 255, 0.06)",
          display: "flex",
          flexDirection: "column",
          transition: "width 0.22s cubic-bezier(0.4, 0, 0.2, 1)",
          overflow: "hidden",
          position: "relative",
          zIndex: 51,
        }}
      >
        {/* ── 1. HEADER BRAND (Logo MSDC Surabaya Global Operations) ── */}
        <div
          style={{
            height: 85,
            padding: isSubmenuCollapsed ? "0.85rem 0.4rem" : "0.85rem 1.1rem",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: isSubmenuCollapsed ? "center" : "flex-start",
            borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
            position: "relative",
            boxSizing: "border-box",
            flexShrink: 0,
          }}
        >
          {!isSubmenuCollapsed ? (
            <div style={{ display: "flex", flexDirection: "column", width: "100%" }}>
              {/* Logo MSDC Surabaya Putih Bersih */}
              <img
                src="/images/logo.png"
                alt="MSDC Surabaya"
                style={{
                  height: 50,
                  width: "auto",
                  display: "block",
                  objectFit: "contain",
                }}
              />
              <div
                style={{
                  fontSize: "0.7rem",
                  fontWeight: 700,
                  textAlign: "center",
                  color: "#94A3B8",
                  letterSpacing: "0.22em",
                  textTransform: "uppercase",
                  marginTop: "0.35rem",
                  paddingLeft: "0.1rem",
                }}
              >
                Global Operations
              </div>
            </div>
          ) : (
            /* Logo ringkas saat collapsed */
            <img
              src="/images/logo.png"
              alt="MSDC"
              style={{ height: 26, width: "auto", display: "block", objectFit: "contain" }}
            />
          )}
        </div>

        {/* ── 2. LABEL MODUL AKTIF (Contoh: ● DATA CENTER OPERATIONAL) ── */}
        {!isSubmenuCollapsed ? (
          <div
            style={{
              padding: "0.85rem 1.1rem 0.45rem",
              display: "flex",
              alignItems: "center",
              gap: "0.45rem",
            }}
          >
            <div
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                backgroundColor: "#F2A602",
                boxShadow: "0 0 8px rgba(242, 166, 2, 0.7)",
                flexShrink: 0,
              }}
            />
            <span
              style={{
                fontSize: "0.68rem",
                fontWeight: 800,
                color: "#F2A602",
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {activeModule?.headerLabel || activeModule?.title}
            </span>
          </div>
        ) : (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              padding: "0.6rem 0 0.3rem",
            }}
          >
            <div
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                backgroundColor: "#F2A602",
                boxShadow: "0 0 6px rgba(242, 166, 2, 0.7)",
              }}
            />
          </div>
        )}

        {/* ── 3. LIST SUB-MENU DENGAN KUNING EMAS AKTIF (#F2A602) & KATEGORI ── */}
        <nav
          style={{
            flex: 1,
            overflowY: "auto",
            padding: isSubmenuCollapsed ? "0.45rem 0.35rem" : "0.45rem 0.65rem",
            display: "flex",
            flexDirection: "column",
            gap: "0.25rem",
            scrollbarWidth: "none",
          }}
        >
          {groupedNavSections.map((section, sIdx) => (
            <div key={section.groupName ?? `standalone-${sIdx}`} style={{ width: "100%" }}>
              {/* Header Kategori */}
              {section.groupName && (
                !isSubmenuCollapsed ? (
                  <div
                    style={{
                      fontSize: "0.68rem",
                      fontWeight: 800,
                      color: "#CBD5E1",
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                      padding: "0.45rem 0.75rem 0.3rem",
                      marginTop: sIdx > 0 ? "0.75rem" : "0.2rem",
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    {section.groupName}
                  </div>
                ) : (
                  sIdx > 0 && (
                    <div
                      style={{
                        height: 1,
                        backgroundColor: "rgba(255, 255, 255, 0.08)",
                        margin: "0.45rem 0.5rem",
                      }}
                    />
                  )
                )
              )}

              {/* Daftar item di dalam kelompok / section */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.35rem",
                  width: "100%",
                }}
              >
                {section.items.map((item) => {
                  const rawPath = item.path.startsWith("/") ? item.path : `/${item.path}`;
                  const SubIcon = getNavItemIcon(item, activeModule?.title);

                  // Deteksi keaktifan item berdasar best match (longest match) agar rute bersarang tidak saling bentrok
                  const isActive = activeSubItemPath === rawPath;

                  return (
                    <div
                      key={rawPath}
                      style={{ width: "100%", position: "relative" }}
                      onMouseEnter={(e) => {
                        if (isSubmenuCollapsed) {
                          const rect = e.currentTarget.getBoundingClientRect();
                          setHoveredSubItem({ label: item.label, top: rect.top + rect.height / 2 });
                        }
                      }}
                      onMouseLeave={() => setHoveredSubItem(null)}
                    >
                      <NavLink
                        to={rawPath}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: isSubmenuCollapsed ? 0 : "0.7rem",
                          justifyContent: isSubmenuCollapsed ? "center" : "flex-start",
                          padding: isSubmenuCollapsed ? "0.55rem 0" : "0.52rem 0.75rem",
                          borderRadius: "8px",
                          textDecoration: "none",
                          fontSize: "0.8rem",
                          fontWeight: isActive ? 700 : 500,
                          color: isActive ? "#FFFFFF" : "#94A3B8",
                          backgroundColor: isActive ? "#F2A602" : "transparent",
                          boxShadow: isActive ? "0 2px 8px rgba(242, 166, 2, 0.35)" : "none",
                          transition: "all 0.15s ease",
                          position: "relative",
                        }}
                        onMouseEnter={(e) => {
                          if (!isActive) {
                            e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.06)";
                            e.currentTarget.style.color = "#FFFFFF";
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isActive) {
                            e.currentTarget.style.backgroundColor = "transparent";
                            e.currentTarget.style.color = "#94A3B8";
                          }
                        }}
                      >
                        <SubIcon
                          size={16}
                          strokeWidth={isActive ? 2.4 : 1.9}
                          style={{ flexShrink: 0 }}
                        />

                        {!isSubmenuCollapsed && (
                          <>
                            <span
                              style={{
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                flex: 1,
                              }}
                            >
                              {item.label}
                            </span>

                            {/* Dot putih di sebelah kanan untuk item aktif persis gambar */}
                            {isActive && (
                              <div
                                style={{
                                  width: 6,
                                  height: 6,
                                  borderRadius: "50%",
                                  backgroundColor: "#FFFFFF",
                                  flexShrink: 0,
                                }}
                              />
                            )}
                          </>
                        )}
                      </NavLink>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Floating Tooltip untuk Sub-menu saat Tier 2 Collapsed */}
        {isSubmenuCollapsed && hoveredSubItem && (
          <div
            style={{
              position: "fixed",
              left: 68 + 64 + 8,
              top: hoveredSubItem.top,
              transform: "translateY(-50%)",
              backgroundColor: "#0F172A",
              border: "1px solid rgba(255, 255, 255, 0.12)",
              color: "#FFFFFF",
              padding: "0.35rem 0.75rem",
              borderRadius: "6px",
              fontSize: "0.75rem",
              fontWeight: 600,
              whiteSpace: "nowrap",
              boxShadow: "0 6px 20px rgba(0, 0, 0, 0.35)",
              pointerEvents: "none",
              zIndex: 9999,
            }}
          >
            {hoveredSubItem.label}
          </div>
        )}

        {/* ── 4. FOOTER: KELUAR & TOGGLE COLLAPSE ── */}
        <div
          style={{
            borderTop: "1px solid rgba(255, 255, 255, 0.07)",
            padding: isSubmenuCollapsed ? "0.6rem 0.35rem" : "0.65rem 0.65rem",
            display: "flex",
            flexDirection: "column",
            gap: "0.2rem",
          }}
        >
          {/* Tombol Keluar (Logout) */}
          <button
            type="button"
            onClick={() => logout()}
            style={{
              display: "flex",
              alignItems: "center",
              gap: isSubmenuCollapsed ? 0 : "0.7rem",
              justifyContent: isSubmenuCollapsed ? "center" : "flex-start",
              padding: isSubmenuCollapsed ? "0.5rem 0" : "0.5rem 0.75rem",
              borderRadius: "8px",
              border: "none",
              background: "none",
              cursor: "pointer",
              fontSize: "0.8rem",
              fontWeight: 500,
              color: "#94A3B8",
              transition: "all 0.15s ease",
              width: "100%",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "rgba(239, 68, 68, 0.12)";
              e.currentTarget.style.color = "#EF4444";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
              e.currentTarget.style.color = "#94A3B8";
            }}
            title={isSubmenuCollapsed ? "Keluar (Logout)" : undefined}
          >
            <LogOut size={16} strokeWidth={1.9} />
            {!isSubmenuCollapsed && <span>Keluar</span>}
          </button>

          {/* Tombol Toggle Collapse Submenu */}
          <button
            type="button"
            onClick={() => setIsSubmenuCollapsed((prev) => !prev)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: isSubmenuCollapsed ? 0 : "0.6rem",
              justifyContent: isSubmenuCollapsed ? "center" : "flex-start",
              padding: isSubmenuCollapsed ? "0.45rem 0" : "0.45rem 0.75rem",
              marginTop: "0.2rem",
              borderRadius: "6px",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              backgroundColor: "rgba(255, 255, 255, 0.03)",
              cursor: "pointer",
              fontSize: "0.72rem",
              fontWeight: 600,
              color: "#94A3B8",
              transition: "all 0.15s ease",
              width: "100%",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.08)";
              e.currentTarget.style.color = "#FFFFFF";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.03)";
              e.currentTarget.style.color = "#94A3B8";
            }}
            title={isSubmenuCollapsed ? "Perluas Submenu" : "Perkecil Submenu"}
          >
            {isSubmenuCollapsed ? (
              <ChevronRight size={14} />
            ) : (
              <>
                <ChevronLeft size={14} />
                <span>Perkecil Menu</span>
              </>
            )}
          </button>
        </div>
      </div>
    </aside>
  );
}
