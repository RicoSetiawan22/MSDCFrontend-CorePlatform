import React from "react";
import {
  Building2,
  Globe,
  Server,
  Cpu,
  Ticket,
  Bell,
} from "lucide-react";
import type { DashboardSummaryData } from "../../types/dashboard";
import { formatNumber } from "@shared/lib/format";

interface KPICardGridProps {
  data?: DashboardSummaryData | null;
  activeCard?: string | null;
  onSelectCard?: (cardId: string) => void;
}

interface SingleCardProps {
  id: string;
  title: string;
  icon: React.ReactNode;
  iconColor: string;
  iconBg: string;
  primaryValue: string | number;
  primaryValueColor?: string;
  staticLabel: string;
  subMetrics: { label: string; value: string | number; color?: string }[];
  active?: boolean;
  onClick?: () => void;
}

const SingleCard: React.FC<SingleCardProps> = ({
  title,
  icon,
  iconColor,
  iconBg,
  primaryValue,
  primaryValueColor,
  staticLabel,
  subMetrics,
  active,
  onClick,
}) => {
  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-2xl p-4 sm:p-5 border transition-all duration-200 flex flex-col justify-between min-h-[190px] relative ${
        active
          ? "border-blue-500 ring-2 ring-blue-500/20 shadow-md"
          : "border-slate-200/80 shadow-2xs hover:shadow-sm hover:-translate-y-0.5 hover:border-slate-300"
      } ${onClick ? "cursor-pointer" : "cursor-default"}`}
    >
      {/* ── 1. Baris Atas: Icon Badge & Judul (Kiri) ── */}
      <div className="flex items-center gap-2.5">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border"
          style={{
            backgroundColor: iconBg,
            color: iconColor,
            borderColor: "rgba(0, 0, 0, 0.04)",
          }}
        >
          {icon}
        </div>
        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
          {title}
        </span>
      </div>

      {/* ── 2. Tengah: Angka Utama Terpusat & Keterangan Statis ── */}
      <div className="flex flex-col items-center justify-center my-3">
        <span
          className="text-3xl font-black tracking-tight"
          style={{ color: primaryValueColor || "#0f172a" }}
        >
          {primaryValue}
        </span>
        <span className="text-xs font-semibold text-slate-400 mt-0.5">
          {staticLabel}
        </span>
      </div>

      {/* ── 3. Baris Bawah: Sub-Metrik Grid ── */}
      <div className="pt-3 border-t border-slate-100 w-full flex items-center justify-around gap-1">
        {subMetrics.map((m, idx) => (
          <div
            key={idx}
            className="flex flex-col items-center text-center flex-1 min-w-0"
          >
            <span
              className="text-xs font-bold leading-tight truncate w-full"
              style={{ color: m.color ?? "#1e293b" }}
            >
              {m.value}
            </span>
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mt-0.5 truncate w-full">
              {m.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export const KPICardGrid: React.FC<KPICardGridProps> = ({
  data,
  activeCard,
  onSelectCard,
}) => {
  if (!data) return null;

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3.5 w-full">
      {/* 1. Sites */}
      <SingleCard
        id="sites"
        title="SITE"
        icon={<Building2 size={16} strokeWidth={2.2} />}
        iconColor="#2563EB"
        iconBg="#EFF6FF"
        primaryValue={data.sites?.total ?? 2}
        staticLabel="Total"
        subMetrics={[
          { label: "Aktif", value: data.sites?.active ?? 2, color: "#059669" },
          { label: "Maint.", value: data.sites?.maintenance ?? 0, color: "#D97706" },
        ]}
        active={activeCard === "sites"}
        onClick={() => onSelectCard?.("sites")}
      />

      {/* 2. Racks */}
      <SingleCard
        id="racks"
        title="RACK"
        icon={<Server size={16} strokeWidth={2.2} />}
        iconColor="#9333EA"
        iconBg="#FAF5FF"
        primaryValue={data.racks?.total ?? 3}
        staticLabel="Total Rack"
        subMetrics={[
          { label: "Used", value: data.racks?.total_u ?? 126, color: "#7C3AED" },
          { label: "Unsed", value: data.racks?.used_u ?? 28, color: "#DC2626" },
          { label: "Free", value: data.racks?.free_u ?? 98, color: "#059669" },
        ]}
        active={activeCard === "racks"}
        onClick={() => onSelectCard?.("racks")}
      />

      {/* 3. IP Address (IPAM) */}
      {(() => {
        const ipam = data.ipam;
        const totalIps = ipam?.total_ips ?? 0;
        const allocatedIps = ipam?.allocated_ips ?? 0;
        const availableIps = ipam?.available_ips ?? 0;
        const totalSubnets = ipam?.total_subnets ?? 0;

        return (
          <SingleCard
            id="ipam"
            title="IP ADDRESS"
            icon={<Globe size={16} strokeWidth={2.2} />}
            iconColor="#0D9488"
            iconBg="#F0FDFA"
            primaryValue={formatNumber(totalIps)}
            staticLabel="Total IP"
            subMetrics={[
              {
                label: "Subnet",
                value: formatNumber(totalSubnets),
                color: "#0D9488",
              },
              {
                label: "Allocated",
                value: formatNumber(allocatedIps),
                color: "#0284C7",
              },
              {
                label: "Available",
                value: formatNumber(availableIps),
                color: "#0F172A",
              },
            ]}
            active={activeCard === "ipam"}
            onClick={() => onSelectCard?.("ipam")}
          />
        );
      })()}

      {/* 4. Devices */}
      <SingleCard
        id="devices"
        title="DEVICE"
        icon={<Cpu size={16} strokeWidth={2.2} />}
        iconColor="#2563EB"
        iconBg="#EFF6FF"
        primaryValue={data.devices?.total ?? 3}
        staticLabel="Total"
        subMetrics={[
          { label: "Aktif", value: data.devices?.active ?? 3, color: "#059669" },
          { label: "Spare", value: data.devices?.spare ?? 0, color: "#D97706" },
        ]}
        active={activeCard === "devices"}
        onClick={() => onSelectCard?.("devices")}
      />

      {/* 5. Tickets & Remote Hands (ITIL & SLA Health) */}
      <SingleCard
        id="tickets"
        title="TICKET"
        icon={<Ticket size={16} strokeWidth={2.2} />}
        iconColor={
          (data.tickets?.open ?? 0) > 0 ? "#D97706" : "#059669"
        }
        iconBg={
          (data.tickets?.open ?? 0) > 0 ? "#FFFBEB" : "#ECFDF5"
        }
        primaryValue={data.tickets?.open ?? 0}
        primaryValueColor={
          (data.tickets?.open ?? 0) > 0 ? "#D97706" : "#059669"
        }
        staticLabel="Open"
        subMetrics={[
          {
            label: "Overdue",
            value: data.tickets?.overdue_sla ?? 0,
            color:
              (data.tickets?.overdue_sla ?? 0) > 0
                ? "#DC2626"
                : "#64748B",
          },
          {
            label: "Resolved",
            value: data.tickets?.resolved ?? 0,
            color: "#059669",
          },
          {
            label: "Closed",
            value: data.tickets?.closed ?? 0,
            color: "#64748B",
          },
        ]}
        active={activeCard === "tickets"}
        onClick={() => onSelectCard?.("tickets")}
      />

      {/* 6. Active Alarms (100% Sinkron dengan ActiveAlarmsSection) */}
      {(() => {
        const alarmsList = data.active_alarms_table?.alarms;
        const totalOpen =
          data.active_alarms_table?.total_active ??
          data.alarms?.open ??
          (alarmsList ? alarmsList.length : 0);

        const criticalCount =
          alarmsList !== undefined
            ? alarmsList.filter(
                (a) => (a.severity || "").toLowerCase() === "critical",
              ).length
            : (data.alarms?.open_critical ?? 0);

        const warningCount =
          alarmsList !== undefined
            ? alarmsList.filter(
                (a) => (a.severity || "").toLowerCase() === "warning",
              ).length
            : (data.alarms?.open_warning ?? 0);

        return (
          <SingleCard
            id="alarms"
            title="ALARM"
            icon={<Bell size={16} strokeWidth={2.2} />}
            iconColor={totalOpen > 0 ? "#DC2626" : "#059669"}
            iconBg={totalOpen > 0 ? "#FEF2F2" : "#ECFDF5"}
            primaryValue={totalOpen}
            primaryValueColor={totalOpen > 0 ? "#DC2626" : "#059669"}
            staticLabel="Open"
            subMetrics={[
              {
                label: "Critical",
                value: criticalCount,
                color: criticalCount > 0 ? "#DC2626" : "#64748B",
              },
              {
                label: "Warning",
                value: warningCount,
                color: warningCount > 0 ? "#D97706" : "#64748B",
              },
            ]}
            active={activeCard === "alarms"}
            onClick={() => onSelectCard?.("alarms")}
          />
        );
      })()}
    </div>
  );
};
