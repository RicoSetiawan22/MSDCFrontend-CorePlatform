import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { LoadingState } from "@shared/components/LoadingState";
import { PageHeader } from "@shared/components/PageHeader";
import { useDashboardData } from "../api/useDashboardData";

import { SystemStatusBanner } from "../components/dashboard/SystemStatusBanner";
import { StaffDutySection } from "../components/dashboard/StaffDutySection";
import { RackOccupancySection } from "../components/dashboard/RackOccupancySection";
import { ActiveAlarmsSection } from "../components/dashboard/ActiveAlarmsSection";
import { IpAllocationSection } from "../components/dashboard/IpAllocationSection";
import { DeviceInventorySection } from "../components/dashboard/DeviceInventorySection";
import { TicketRemoteHandsSection } from "../components/dashboard/TicketRemoteHandsSection";

export function DashboardPage() {
  const navigate = useNavigate();
  const { summary, details, isLoading, isRefetching, refetchAll, cooldownSeconds } =
    useDashboardData();

  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);

  if (isLoading && !summary) {
    return (
      <div className="min-h-screen bg-[#F5F7FA]">
        <PageHeader
          title="Data Center Overview"
          subtitle="Pemantauan infrastruktur fisik & operasional 24×7"
          containerClassName="px-6 pt-5 pb-2 lg:px-8 mx-auto"
        />

        <div className="px-6 py-12 lg:px-8 max-w-[1600px] mx-auto">
          <LoadingState />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F7FA] pb-16 font-sans">
      <PageHeader
        title="Data Center Overview"
        subtitle="Pemantauan infrastruktur fisik & operasional 24×7"
        containerClassName="px-6 pt-5 pb-2 lg:px-8  mx-auto"
      />

      {/* ── 3. Konten Utama Dashboard ── */}
      <div className="flex flex-col gap-6 px-6 py-6 lg:px-8 lg:py-7 mx-auto">
        {/* ── 3. Overview Card Utama (Status Banner + 6 KPI Cards dalam 1 Card Div Sesuai Figma) ── */}
        <SystemStatusBanner
          status={summary?.system_status}
          lastSyncTime={summary?.last_sync_time}
          isRefetching={isRefetching}
          cooldownSeconds={cooldownSeconds}
          onRefresh={refetchAll}
          summary={summary}
          activeCard={selectedCardId}
          onSelectCard={(id: string) => {
            setSelectedCardId((prev) => (prev === id ? null : id));
          }}
          onAddTicket={() => {
            navigate("/dc/tickets");
          }}
        />

        {/* ── 5. Baris 2: Seksi Petugas Bertugas Hari Ini (Grouped by Site) ── */}
        <StaffDutySection
          data={summary?.staff_on_duty}
          onViewAllStaff={(siteId?: string | number) => {
            console.log("Navigasi lihat semua petugas untuk site:", siteId);
          }}
          onViewStaffProfile={(staffId: string | number) => {
            console.log("Navigasi profil petugas ID:", staffId);
          }}
        />

        {/* ── 5.5. Baris 2.5: Seksi Rack Kosong & Terpakai (Sesuai Desain Figma) ── */}
        <div className="w-full min-w-0">
          <RackOccupancySection
            details={details}
            racks={summary?.racks_list}
            totalKnownRacks={summary?.racks?.total ?? 3}
            onViewRackDetail={(rackId: string | number) => {
              navigate(`/dc/racks?selected=${rackId}`);
            }}
          />
        </div>

        {/* ── 6. Baris 3: Main Card Terpadu (Active Alarms & Infrastructure Status dengan Segmented Control) ── */}
        <div className="w-full min-w-0">
          <ActiveAlarmsSection
            alarms={
              summary?.active_alarms_table?.alarms ??
              details?.alarm_details?.active_alarms ??
              []
            }
            totalActive={
              summary?.active_alarms_table?.total_active ??
              details?.alarm_details?.active_count ??
              summary?.alarms?.open ??
              0
            }
            onViewAll={() => {
              navigate("/dc/monitoring");
            }}
            onViewAlarmDetail={(alarmId: string | number) => {
              console.log("Melihat detail alarm ID:", alarmId);
            }}
            infraData={summary?.infrastructure_status}
            details={details}
            totalDevices={summary?.devices?.total}
            onRefresh={refetchAll}
            isRefreshing={isRefetching}
          />
        </div>

        {/* ── 7. Baris 4: Panel IP Address Terpakai & Oleh Siapa ── */}
        <div className="w-full min-w-0">
          <IpAllocationSection
            details={details}
            totalSubnetCapacity={summary?.ipam?.total_ips ?? 272}
            onPing={(ip: string) => {
              console.log("Ping IP alokasi:", ip);
            }}
          />
        </div>

        {/* ── 8. Baris 5: Device Inventory Milik Sendiri vs Customer ── */}
        <div className="w-full min-w-0">
          <DeviceInventorySection details={details} />
        </div>

        {/* ── 9. Baris 6: Ticket & Remote Hands Open (Sesuai Desain Mockup) ── */}
        <div className="w-full min-w-0">
          <TicketRemoteHandsSection
            tickets={summary?.tickets_list}
            onOpenNewTicket={() => {
              navigate("/dc/tickets?action=create");
            }}
            onRequestRemoteHands={() => {
              navigate("/dc/tickets?action=create&type=remote_hands");
            }}
            onViewTicketDetail={(ticketId) => {
              navigate(`/dc/tickets?selected=${ticketId}`);
            }}
          />
        </div>
      </div>
    </div>
  );
}
