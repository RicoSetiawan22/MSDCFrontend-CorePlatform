/**
 * Tipe data & kontrak antarmuka untuk fitur Visitor Pass & Scanner Pos Jaga (DC Ops)
 */

export type VisitorPassStatus =
  | "pending_registration"
  | "scheduled"
  | "registered"
  | "approved"
  | "active_in_facility"
  | "overstayed"
  | "completed"
  | "expired"
  | "cancelled"
  | "denied";

export type VisitorAccessAction =
  | "invited"
  | "registered"
  | "scheduled"
  | "approved"
  | "check_in"
  | "check_out"
  | "overstay_alert"
  | "denied"
  | "cancelled";

export interface VisitorAccessLog {
  id: number;
  visitor_pass_id: number;
  action: VisitorAccessAction;
  scanner_location?: string | null;
  device_info?: string | null;
  actor_name?: string | null;
  notes?: string | null;
  created_at: string;
}

export interface VisitorPassCustomer {
  id: number;
  name?: string;
  company_name?: string;
  customer_code?: string;
  code?: string;
  email?: string;
  phone?: string;
}

export interface VisitorPassSite {
  id: number;
  name?: string;
  site_name?: string;
  code?: string;
  site_code?: string;
  address?: string;
}

export interface VisitorPassRoom {
  id: number;
  name?: string;
  room_name?: string;
  code?: string;
  room_code?: string;
  floor?: string;
}

export interface VisitorPassRack {
  id: number;
  code: string;
  label?: string;
}

export interface VisitorPassContract {
  id: number;
  contract_number: string;
  status: string;
  days_until_expiry?: number | null;
  start_date?: string | null;
  end_date?: string | null;
  monthly_value?: string | number | null;
}

export interface VisitorPassOfficer {
  id: number;
  name?: string;
  email?: string;
}

export interface VisitorPass {
  id: number;
  pass_number: string;
  customer_id: number;
  customer?: VisitorPassCustomer | null;
  contract_id?: number | null;
  contract?: VisitorPassContract | null;
  site_id: number;
  site?: VisitorPassSite | null;
  site_room_id?: number | null;
  room_id?: number | null;
  room?: VisitorPassRoom | null;
  rack_id?: number | null;
  rack?: VisitorPassRack | null;
  target_rack_ids?: number[];
  visitor_name?: string | null;
  visitor_identity_type?: VisitorIdentityType | null;
  visitor_identity_number?: string | null;
  visitor_id_card?: string | null;
  visitor_company?: string | null;
  visitor_email?: string | null;
  recipient_email?: string | null;
  invited_email?: string | null;
  visitor_phone?: string | null;
  purpose?: string | null;
  equipment_brought_in?: string | null;
  additional_visitors?: AdditionalVisitor[];
  operator_instructions?: string | null;
  safety_nda_agreed_at?: string | null;
  safety_nda_ip?: string | null;
  allowed_start_date?: string | null;
  allowed_end_date?: string | null;
  planned_check_in_at?: string;
  planned_check_out_at?: string;
  valid_from?: string;
  valid_to?: string;
  valid_until?: string;
  check_in_at?: string | null;
  check_out_at?: string | null;
  actual_check_in_at?: string | null;
  actual_check_out_at?: string | null;
  check_in_method?: string | null;
  check_in_officer_id?: number | null;
  check_in_officer?: VisitorPassOfficer | null;
  check_out_officer_id?: number | null;
  check_out_officer?: VisitorPassOfficer | null;
  approved_by?: number | null;
  approved_by_officer_id?: number | null;
  approved_by_officer?: VisitorPassOfficer | null;
  approved_at?: string | null;
  status: VisitorPassStatus;
  notes?: string | null;
  public_url_token?: string | null;
  invitation_token?: string | null;
  raw_qr_token?: string | null;
  qr_payload?: string | null;
  access_logs?: VisitorAccessLog[];
  created_at: string;
  updated_at: string;
}

export interface AdditionalVisitor {
  name: string;
  identity_type: VisitorIdentityType;
  identity_number: string;
  phone?: string;
  company?: string;
}

export interface EligibleCustomerContact {
  id: number;
  name: string;
  position?: string;
  email?: string;
  phone?: string;
  is_primary?: boolean;
}

export interface EligibleCustomerContract {
  contract_id: number;
  contract_number: string;
  service_type: string;
  site_id?: number;
  site_name?: string;
  room_id?: number;
  room_name?: string;
  rack_id?: number;
  rack_code?: string;
}

export interface EligibleCustomer {
  customer_id: number;
  customer_name: string;
  company_name?: string;
  email?: string;
  phone?: string;
  contacts?: EligibleCustomerContact[];
  contracts: EligibleCustomerContract[];
}

export type VisitorPassTab = "all" | "upcoming" | "active" | "history";

export interface VisitorPassListParams {
  page?: number;
  per_page?: number;
  search?: string;
  status?: VisitorPassStatus | "all";
  site_id?: number;
  tab?: VisitorPassTab;
  from_date?: string;
  to_date?: string;
}

export type VisitorIdentityType = "ktp" | "sim" | "passport";

export interface CreateVisitorPassPayload {
  customer_id: number;
  contract_id: number;
  site_id: number;
  site_room_id: number;
  visitor_name: string;
  visitor_identity_type: VisitorIdentityType;
  visitor_identity_number: string;
  visitor_phone: string;
  visitor_email?: string | null;
  visitor_company?: string | null;
  purpose: string;
  target_rack_ids?: number[];
  equipment_brought_in?: string;
  additional_visitors?: AdditionalVisitor[];
  operator_instructions?: string;
  planned_check_in_at: string;
  planned_check_out_at: string;
  valid_from?: string;
  valid_until?: string;
  notes?: string;

  // Backward compatibility fields
  room_id?: number | null;
  rack_id?: number | null;
  valid_to?: string;
  visitor_id_card?: string;
}

export interface InviteVisitorPayload {
  customer_id: number;
  contract_id: number;
  site_id: number;
  site_room_id: number;
  target_rack_ids?: number[];
  allowed_start_date: string;
  allowed_end_date: string;
  recipient_type: "crm_contact" | "direct_vendor";
  recipient_contact_id?: number;
  recipient_email: string;
  cc_email?: string;
  operator_instructions?: string;
}

export interface SelfRegisterPayload {
  planned_check_in_at?: string;
  planned_check_out_at?: string;
  visitor_name: string;
  visitor_identity_type: VisitorIdentityType;
  visitor_identity_number: string;
  visitor_id_card?: string;
  visitor_phone: string;
  visitor_email?: string;
  visitor_company?: string;
  purpose: string;
  equipment_brought_in?: string;
  additional_visitors?: AdditionalVisitor[];
  safety_nda_agreed: boolean;
}

export interface VisitorInvitationDetails {
  id: number;
  pass_number: string;
  customer?: { id: number; company_name: string; legal_name?: string; name?: string };
  site?: { id: number; site_name: string; name?: string; address?: string };
  room?: { id: number; room_name: string; name?: string; room_code?: string };
  target_rack_ids?: number[];
  target_racks?: { id: number; code?: string; rack_code?: string; rack_name?: string }[];
  allowed_start_date: string;
  allowed_end_date: string;
  operator_instructions?: string | null;
  status: VisitorPassStatus;
  recipient_email?: string | null;
  invitation_token: string;
  public_url_token?: string | null;
  visitor_name?: string | null;
  visitor_company?: string | null;
  planned_check_in_at?: string | null;
  planned_check_out_at?: string | null;
}

export interface ScanVerifyPayload {
  token: string;
  qr_token?: string;
  scan_method?: "webcam_guard" | "usb_scanner" | "manual_override" | "turnstile_gate";
  scanner_location?: string;
  /** Site lokasi pos jaga. Bila dikirim, backend menolak tiket untuk site lain (denied_wrong_site). */
  site_id?: number;
  device_info?: string;
}

export interface ScanVerifyResult {
  access_granted: boolean;
  status: string;
  message: string;
  visitor_pass?: VisitorPass;
  allocated_racks?: any[];
  // Compatibility fields
  success: boolean;
  action: "check_in" | "check_out";
  pass: VisitorPass;
}

export interface PublicVisitorPassResponse {
  data: {
    pass_number: string;
    visitor_name: string;
    visitor_company?: string | null;
    customer_name?: string;
    site_name?: string;
    room_name?: string | null;
    rack_code?: string | null;
    purpose: string;
    valid_from: string;
    valid_to: string;
    valid_until?: string;
    status: VisitorPassStatus;
    /** Null bila tiket tidak aktif (belum disetujui, sudah dipindai, selesai, kedaluwarsa, dibatalkan). */
    qr_payload: string | null;
    is_valid?: boolean;
    is_consumed?: boolean;
    is_expired?: boolean;
    notes?: string | null;
  };
}
