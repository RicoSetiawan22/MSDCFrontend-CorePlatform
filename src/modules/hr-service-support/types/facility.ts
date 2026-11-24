export type FacilityType = "meeting_room" | "hall" | "equipment" | "vehicle" | "other";
export type FacilityStatus = "active" | "maintenance" | "inactive";
export type BookingStatus = "pending" | "approved" | "rejected" | "completed" | "cancelled";

export interface GaFacility {
  id: number;
  code: string;
  name: string;
  type: FacilityType;
  location: string | null;
  capacity: number | null;
  status: FacilityStatus;
  notes: string | null;
}

/** code TIDAK ADA di sini - auto-generated dari Number Sequence terpusat
 * (Master Data > Number Sequence, module_code='ga_facility'). */
export interface GaFacilityFormValues {
  name: string;
  type: FacilityType;
  location?: string;
  capacity?: number;
  status?: FacilityStatus;
  notes?: string;
}

export interface GaFacilityBooking {
  id: number;
  facility_id: number;
  facility?: { id: number; name: string; location: string | null } | null;
  requested_by: number;
  requester_name: string;
  purpose: string;
  start_at: string;
  end_at: string;
  status: BookingStatus;
  document_id: number | null;
  created_at: string;
}

export interface GaFacilityBookingFormValues {
  organization_id?: number;
  facility_id: number;
  requested_by: number;
  requester_name?: string;
  purpose: string;
  start_at: string;
  end_at: string;
}

export interface GaBuildingAccessPermit {
  id: number;
  facility_id: number | null;
  facility?: { id: number; name: string; location: string | null } | null;
  visitor_name: string;
  visitor_company: string | null;
  purpose: string;
  visit_date: string;
  host_employee_id: number | null;
  host_name: string | null;
  status: "pending" | "approved" | "rejected";
  document_id: number | null;
  created_at: string;
}

export interface GaBuildingAccessPermitFormValues {
  organization_id?: number;
  facility_id?: number;
  visitor_name: string;
  visitor_company?: string;
  purpose: string;
  visit_date: string;
  host_employee_id?: number;
  host_name?: string;
}

export const FACILITY_TYPE_LABELS: Record<FacilityType, string> = {
  meeting_room: "Ruang Meeting",
  hall: "Aula",
  equipment: "Peralatan",
  vehicle: "Kendaraan",
  other: "Lainnya",
};

export const BOOKING_STATUS_LABELS: Record<BookingStatus, string> = {
  pending: "Menunggu",
  approved: "Disetujui",
  rejected: "Ditolak",
  completed: "Selesai",
  cancelled: "Dibatalkan",
};

export const BOOKING_STATUS_COLORS: Record<BookingStatus, { bg: string; color: string }> = {
  pending: { bg: "#fff7ed", color: "#c2410c" },
  approved: { bg: "#dcfce7", color: "#166534" },
  rejected: { bg: "#fee2e2", color: "#991b1b" },
  completed: { bg: "#eef2ff", color: "#4338ca" },
  cancelled: { bg: "#f3f4f6", color: "#6b7280" },
};
