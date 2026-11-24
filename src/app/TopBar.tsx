import { useState, useEffect, useMemo, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Search,
  Clock,
  Bell,
  Globe,
  LogOut,
  User,
  PhoneCall,
  Mail,
  ChevronDown,
} from "lucide-react";
import { useAuth } from "@shared/lib/auth-context";
import { useOrganization } from "@shared/lib/organization-context";
import { useUnreadNotificationCount } from "@modules/core-platform/api/useNotifications";

export function TopBar() {
  const { user, logout } = useAuth();
  const { activeOrg } = useOrganization();
  const { data: unreadCount } = useUnreadNotificationCount();
  const location = useLocation();
  const navigate = useNavigate();

  // State menu user & modal CS
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isCsModalOpen, setIsCsModalOpen] = useState(false);

  // State & Ref pencarian global
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Shortcut Ctrl+K / Cmd+K untuk fokus langsung ke search bar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Jam digital realtime (format HH:mm:ss)
  const [currentTime, setCurrentTime] = useState(() => {
    const now = new Date();
    return now.toTimeString().split(" ")[0]; // "06:21:43"
  });

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now.toTimeString().split(" ")[0]);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Deteksi modul aktif untuk judul navbar kiri
  const activeModuleTitle = useMemo(() => {
    const p = location.pathname;
    if (p === "/" || p.startsWith("/finance")) return "Finance & Accounting";
    if (p.startsWith("/dc")) return "Data Center Operations";
    if (p.startsWith("/crm-sales")) return "CRM & Sales";
    if (p.startsWith("/procurement-inventory")) return "Procurement & Inventory";
    if (p.startsWith("/hr")) return "HR & Service Support";
    if (
      p.startsWith("/core-platform/surat") ||
      p.startsWith("/core-platform/template-surat") ||
      p.startsWith("/core-platform/arsip-surat") ||
      p.startsWith("/core-platform/jenis-surat")
    )
      return "Document Management";
    if (p.startsWith("/core-platform")) return "Core Platform";
    if (p.startsWith("/account")) return "Pengaturan Akun";
    return "Data Center Operations";
  }, [location.pathname]);

  // Format inisial avatar
  const initials = useMemo(() => {
    if (!user?.name) return "JC";
    return user.name
      .split(" ")
      .map((w) => w[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  }, [user?.name]);

  const userName = user?.name || "Jonatan Christie";
  const userRole = user?.roles?.[0] || "Ops Engineer";

  return (
    <header
      className="msdc-topbar-root topbar"
      style={{
        height: 60,
        backgroundColor: "#FFFFFF",
        borderBottom: "1px solid #E2E8F0",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 1.5rem",
        position: "relative",
        zIndex: 40,
        boxShadow: "0 1px 3px rgba(15, 23, 42, 0.02)",
      }}
    >
      {/* ── BAGIAN KIRI: Judul Modul & Organisasi ── */}
      <div style={{ display: "flex", flexDirection: "column", minWidth: 180 }}>
        <h1
          style={{
            margin: 0,
            fontSize: "0.92rem",
            fontWeight: 800,
            color: "#0F172A",
            letterSpacing: "-0.01em",
            lineHeight: 1.2,
          }}
        >
          {activeModuleTitle}
        </h1>
        <span
          style={{
            fontSize: "0.72rem",
            color: "#64748B",
            fontWeight: 500,
            lineHeight: 1.2,
            marginTop: "0.15rem",
          }}
        >
          {activeOrg?.name || "MSDC ERP JTV"}
        </span>
      </div>

      {/* ── BAGIAN TENGAH: Global Search Bar ── */}
      <div
        style={{
          flex: 1,
          maxWidth: 460,
          margin: "0 1.5rem",
          position: "relative",
          display: "flex",
          alignItems: "center",
        }}
      >
        <div
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            backgroundColor: "#F8FAFC",
            border: "1px solid #E2E8F0",
            borderRadius: "8px",
            padding: "0.42rem 0.85rem",
            gap: "0.55rem",
            transition: "all 0.15s ease",
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = "#F2A602";
            e.currentTarget.style.backgroundColor = "#FFFFFF";
            e.currentTarget.style.boxShadow = "0 0 0 3px rgba(242, 166, 2, 0.15)";
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = "#E2E8F0";
            e.currentTarget.style.backgroundColor = "#F8FAFC";
            e.currentTarget.style.boxShadow = "none";
          }}
        >
          <Search size={15} color="#94A3B8" style={{ flexShrink: 0 }} />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Cari data, modul, atau ID transaksi..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: "100%",
              border: "none",
              background: "transparent",
              outline: "none",
              fontSize: "0.8rem",
              color: "#0F172A",
            }}
          />
          <kbd
            style={{
              fontSize: "0.65rem",
              fontWeight: 600,
              color: "#94A3B8",
              backgroundColor: "#EDF2F7",
              padding: "0.1rem 0.35rem",
              borderRadius: "4px",
              border: "1px solid #CBD5E1",
              fontFamily: "ui-monospace, monospace",
            }}
          >
            Ctrl+K
          </kbd>
        </div>
      </div>

      {/* ── BAGIAN KANAN: Jam Digital, Notif, NOC Help, User Profile ── */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
        {/* 1. Jam Digital Realtime */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.45rem",
            backgroundColor: "#F8FAFC",
            border: "1px solid #E2E8F0",
            borderRadius: "6px",
            padding: "0.35rem 0.65rem",
          }}
          title="Waktu Sistem Realtime"
        >
          <Clock size={14} color="#64748B" />
          <span
            style={{
              fontSize: "0.78rem",
              fontWeight: 700,
              fontFamily: "ui-monospace, monospace",
              color: "#0F172A",
              letterSpacing: "0.03em",
            }}
          >
            {currentTime}
          </span>
        </div>

        {/* 2. Tombol Notifikasi dengan Titik Kuning Oranye */}
        <button
          type="button"
          onClick={() => navigate("/core-platform/notifications")}
          style={{
            position: "relative",
            width: 36,
            height: 36,
            borderRadius: "8px",
            border: "1px solid #E2E8F0",
            backgroundColor: "#FFFFFF",
            color: "#64748B",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            transition: "all 0.15s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "#F8FAFC";
            e.currentTarget.style.color = "#0F172A";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "#FFFFFF";
            e.currentTarget.style.color = "#64748B";
          }}
          title="Notifikasi Sistem"
        >
          <Bell size={17} />
          {/* Badge Amber Glowing */}
          {unreadCount && unreadCount > 0 ? (
            <span
              style={{
                position: "absolute",
                top: 5,
                right: 5,
                width: 8,
                height: 8,
                borderRadius: "50%",
                backgroundColor: "#F2A602",
                boxShadow: "0 0 6px rgba(242, 166, 2, 0.8)",
              }}
            />
          ) : (
            <span
              style={{
                position: "absolute",
                top: 6,
                right: 6,
                width: 6,
                height: 6,
                borderRadius: "50%",
                backgroundColor: "#F2A602",
              }}
            />
          )}
        </button>

        {/* 3. Tombol CS & NOC Support (Globe) */}
        <div style={{ position: "relative" }}>
          <button
            type="button"
            onClick={() => setIsCsModalOpen((v) => !v)}
            style={{
              width: 36,
              height: 36,
              borderRadius: "8px",
              border: "1px solid #E2E8F0",
              backgroundColor: isCsModalOpen ? "#F8FAFC" : "#FFFFFF",
              color: isCsModalOpen ? "#F2A602" : "#64748B",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#F8FAFC";
              e.currentTarget.style.color = "#0F172A";
            }}
            onMouseLeave={(e) => {
              if (!isCsModalOpen) {
                e.currentTarget.style.backgroundColor = "#FFFFFF";
                e.currentTarget.style.color = "#64748B";
              }
            }}
            title="Customer Service & NOC Emergency Support"
          >
            <Globe size={17} />
          </button>

          {/* Modal Popup NOC Emergency Support */}
          {isCsModalOpen && (
            <div
              style={{
                position: "absolute",
                right: 0,
                top: "2.7rem",
                width: 270,
                backgroundColor: "#FFFFFF",
                border: "1px solid #E2E8F0",
                borderRadius: "10px",
                padding: "0.95rem",
                boxShadow: "0 10px 25px rgba(15, 23, 42, 0.12)",
                zIndex: 100,
              }}
              onMouseLeave={() => setIsCsModalOpen(false)}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  paddingBottom: "0.55rem",
                  borderBottom: "1px solid #F1F5F9",
                }}
              >
                <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "#0F2D52" }}>
                  Customer Service & NOC
                </span>
                <span
                  style={{
                    fontSize: "0.62rem",
                    fontWeight: 700,
                    color: "#10B981",
                    backgroundColor: "#ECFDF5",
                    padding: "0.12rem 0.4rem",
                    borderRadius: "9999px",
                  }}
                >
                  24×7 ONLINE
                </span>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginTop: "0.75rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <PhoneCall size={14} color="#F2A602" />
                  <div style={{ fontSize: "0.75rem", color: "#334155" }}>
                    Hotline: <strong>+62 811-300-MSDC</strong>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <Mail size={14} color="#F2A602" />
                  <div style={{ fontSize: "0.75rem", color: "#334155" }}>
                    Email: <strong>noc@msdc.co.id</strong>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setIsCsModalOpen(false);
                  navigate("/dc/tickets");
                }}
                style={{
                  width: "100%",
                  marginTop: "0.85rem",
                  padding: "0.45rem",
                  backgroundColor: "#FEF3C7",
                  color: "#92400E",
                  border: "none",
                  borderRadius: "6px",
                  fontSize: "0.74rem",
                  fontWeight: 700,
                  cursor: "pointer",
                  transition: "background-color 0.15s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "#FDE68A";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "#FEF3C7";
                }}
              >
                Buka Tiket Bantuan NOC
              </button>
            </div>
          )}
        </div>

        {/* Divider Vertikal Halus */}
        <div style={{ width: 1, height: 26, backgroundColor: "#E2E8F0", margin: "0 0.2rem" }} />

        {/* 4. Profil Pengguna (Avatar JC, Jonatan Christie, Ops Engineer) */}
        <div style={{ position: "relative" }}>
          <button
            type="button"
            onClick={() => setIsUserMenuOpen((v) => !v)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.6rem",
              background: "none",
              border: "none",
              padding: "0.2rem 0.4rem",
              borderRadius: "8px",
              cursor: "pointer",
              transition: "background-color 0.15s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#F8FAFC";
            }}
            onMouseLeave={(e) => {
              if (!isUserMenuOpen) {
                e.currentTarget.style.backgroundColor = "transparent";
              }
            }}
          >
            {/* Avatar Lingkaran Inisial JC */}
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: "50%",
                backgroundColor: "#CBD5E1",
                color: "#0F172A",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "0.78rem",
                fontWeight: 800,
                flexShrink: 0,
                border: "1px solid #CBD5E1",
              }}
            >
              {initials}
            </div>

            {/* Nama & Role Pengguna */}
            <div style={{ display: "flex", flexDirection: "column", textAlign: "left" }}>
              <span
                style={{
                  fontSize: "0.82rem",
                  fontWeight: 700,
                  color: "#0F172A",
                  lineHeight: 1.15,
                  whiteSpace: "nowrap",
                }}
              >
                {userName}
              </span>
              <span
                style={{
                  fontSize: "0.68rem",
                  color: "#64748B",
                  fontWeight: 500,
                  lineHeight: 1.15,
                }}
              >
                {userRole}
              </span>
            </div>

            <ChevronDown size={14} color="#94A3B8" />
          </button>

          {/* Dropdown Menu Pengguna */}
          {isUserMenuOpen && (
            <div
              style={{
                position: "absolute",
                right: 0,
                top: "2.7rem",
                minWidth: 210,
                backgroundColor: "#FFFFFF",
                borderRadius: "10px",
                padding: "0.55rem",
                border: "1px solid #E2E8F0",
                boxShadow: "0 10px 25px rgba(15, 23, 42, 0.12)",
                zIndex: 100,
              }}
              onMouseLeave={() => setIsUserMenuOpen(false)}
            >
              <div
                style={{
                  padding: "0.55rem 0.65rem",
                  borderBottom: "1px solid #F1F5F9",
                  marginBottom: "0.4rem",
                }}
              >
                <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "#0F172A" }}>
                  {userName}
                </div>
                <div style={{ fontSize: "0.7rem", color: "#64748B", marginTop: "0.1rem" }}>
                  {userRole} • {activeOrg?.name || "MSDC ERP JTV"}
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setIsUserMenuOpen(false);
                  navigate("/account");
                }}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.55rem",
                  textAlign: "left",
                  padding: "0.5rem 0.65rem",
                  background: "none",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontSize: "0.78rem",
                  fontWeight: 600,
                  color: "#334155",
                  transition: "background-color 0.15s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "#F8FAFC";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent";
                }}
              >
                <User size={15} color="#64748B" />
                <span>Pengaturan Akun</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsUserMenuOpen(false);
                  logout();
                }}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.55rem",
                  textAlign: "left",
                  padding: "0.5rem 0.65rem",
                  background: "none",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontSize: "0.78rem",
                  fontWeight: 600,
                  color: "#EF4444",
                  transition: "background-color 0.15s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "#FEF2F2";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent";
                }}
              >
                <LogOut size={15} />
                <span>Keluar (Logout)</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
