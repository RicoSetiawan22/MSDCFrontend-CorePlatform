export interface IpSubnet {
  id: number;
  cidr: string;
  ip_version: "ipv4" | "ipv6";
  subnet_type: "public" | "private";
  vlan_id: number | null;
  site_id: number | null;
  gateway: string | null;
  description: string | null;
  created_at: string;
}

export interface IpSubnetFormValues {
  cidr: string;
  ip_version?: "ipv4" | "ipv6";
  subnet_type?: "public" | "private";
  vlan_id?: number;
  site_id?: number;
  gateway?: string;
  description?: string;
}

export interface IpSubnetListParams {
  page?: number;
  per_page?: number;
  search?: string;
  ip_version?: "ipv4" | "ipv6";
  subnet_type?: "public" | "private";
  site_id?: number;
}

export type IpAddressStatus = "available" | "allocated" | "reserved" | "blocked";

export interface IpAddress {
  id: number;
  subnet_id: number;
  ip_address: string;
  status: IpAddressStatus;
  allocated_to_type: "customer" | "device" | "internal" | null;
  customer_id: number | null;
  device_id: number | null;
  contract_service_id: number | null;
  allocated_date: string | null;
  released_date: string | null;
  notes: string | null;
  created_at: string;
  customer?: { id: number; company_name: string } | null;
  contract_service?: { id: number; contract_id: number; description: string } | null;
}

export interface IpAddressListParams {
  page?: number;
  per_page?: number;
  status?: IpAddressStatus;
  search?: string;
}

export interface IpAddressAllocateValues {
  allocated_to_type?: "customer" | "device" | "internal";
  customer_id?: number | null;
  device_id?: number | null;
  contract_service_id?: number | null;
  notes?: string;
}
