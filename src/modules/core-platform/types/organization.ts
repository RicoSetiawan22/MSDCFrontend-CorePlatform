/** Field-field ini HARUS cocok persis dengan OrganizationStructureController.php
 * (Branch/BusinessUnit/Department semuanya nunjuk ke organization_id ->
 * Organization, BUKAN ke cp_md_company yang sudah tidak dipakai lagi). */
interface OrgRef {
  id: number;
  name: string;
  code: string;
  type?: string;
}

export interface Branch {
  id: number;
  organization_id: number;
  organization?: OrgRef;
  code: string;
  name: string;
  address: string | null;
  phone: string | null;
  is_active: boolean;
  created_at: string;
}

export interface BusinessUnit {
  id: number;
  organization_id: number;
  organization?: OrgRef;
  code: string;
  name: string;
  is_active: boolean;
  created_at: string;
}

export interface EmployeeRef {
  id?: number;
  full_name: string;
  email?: string | null;
  employee_number?: string | null;
}
export interface PositionRef {
  id?: number;
  position_title: string;
  level?: string | null;
  employees?: EmployeeRef[];
}
export interface Department {
  id: number;
  organization_id: number | null;
  organization?: OrgRef;
  business_unit_id: number | null;
  business_unit?: { id: number; name: string; code: string } | null;
  parent_id: number | null;
  parent?: { id: number; name: string } | null;
  code: string;
  name: string;
  is_active: boolean;
  created_at: string;
  positions?: PositionRef[];
}
