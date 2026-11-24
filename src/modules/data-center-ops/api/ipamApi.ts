import { apiClient } from "@shared/lib/api-client";
import type { PaginatedResponse, ApiMessageResponse } from "@shared/types/api";
import type {
  IpSubnet,
  IpSubnetListParams,
  IpSubnetFormValues,
  IpAddress,
  IpAddressListParams,
  IpAddressAllocateValues,
} from "../types/ipam";

const BASE = "/v1/data-center-ops";

export const ipamApi = {
  subnetList(params: IpSubnetListParams = {}) {
    return apiClient.get<PaginatedResponse<IpSubnet>>(`${BASE}/ip-subnets`, { params });
  },
  subnetShow(id: number) {
    return apiClient.get<{ data: IpSubnet }>(`${BASE}/ip-subnets/${id}`);
  },
  subnetCreate(values: IpSubnetFormValues) {
    return apiClient.post<{ data: IpSubnet; message?: string }>(`${BASE}/ip-subnets`, values);
  },
  /** Cari 1 alamat IP 'available' pertama di subnet ini - TIDAK
   * mengalokasikan, cuma menemukan (lihat IpamService::nextAvailable()
   * backend). Alokasi sebenarnya tetap lewat allocate() terpisah. */
  nextAvailable(subnetId: number) {
    return apiClient.get<{ data: IpAddress }>(`${BASE}/ip-subnets/${subnetId}/next-available`);
  },
  generateAddresses(subnetId: number) {
    return apiClient.post<{ message: string }>(`${BASE}/ip-subnets/${subnetId}/generate-addresses`);
  },
  addresses(subnetId: number, params: IpAddressListParams) {
    return apiClient.get<PaginatedResponse<IpAddress>>(`${BASE}/ip-subnets/${subnetId}/addresses`, { params });
  },
  allocate(addressId: number, values: IpAddressAllocateValues) {
    return apiClient.post<ApiMessageResponse<IpAddress>>(`${BASE}/ip-addresses/${addressId}/allocate`, values);
  },
  release(addressId: number) {
    return apiClient.post<ApiMessageResponse<IpAddress>>(`${BASE}/ip-addresses/${addressId}/release`, {});
  },
};
