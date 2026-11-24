import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ipamApi } from "./ipamApi";
import type {
  IpAddressAllocateValues,
  IpAddressListParams,
  IpSubnetListParams,
  IpSubnetFormValues,
} from "../types/ipam";

const ipamKeys = {
  all: ["dcIpam"] as const,
  subnets: () => [...ipamKeys.all, "subnets"] as const,
  subnetList: (params: IpSubnetListParams) => [...ipamKeys.subnets(), "list", params] as const,
  subnet: (id: number) => [...ipamKeys.all, "subnet", id] as const,
  addresses: (subnetId: number, params: IpAddressListParams) => [...ipamKeys.all, "addresses", subnetId, params] as const,
};

export function useIpSubnetList(params: IpSubnetListParams = {}) {
  return useQuery({
    queryKey: ipamKeys.subnetList(params),
    queryFn: () => ipamApi.subnetList(params).then((r) => r.data),
    placeholderData: (prev) => prev,
  });
}

export function useCreateIpSubnet() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (values: IpSubnetFormValues) => ipamApi.subnetCreate(values).then((r) => r.data.data),
    onSuccess: () => invalidateAll(qc),
  });
}

/** Cari 1 IP kosong di subnet terpilih - dipakai alur "Alokasi IP" di
 * Perintah Kerja (cari dulu, baru useAllocateIpAddress() untuk kunci-nya). */
export function useNextAvailableIp() {
  return useMutation({
    mutationFn: (subnetId: number) => ipamApi.nextAvailable(subnetId).then((r) => r.data.data),
  });
}

export function useIpSubnet(id: number | undefined) {
  return useQuery({
    queryKey: ipamKeys.subnet(id ?? 0),
    queryFn: () => ipamApi.subnetShow(id!).then((r) => r.data.data),
    enabled: !!id,
  });
}

export function useIpAddresses(subnetId: number | undefined, params: IpAddressListParams) {
  return useQuery({
    queryKey: ipamKeys.addresses(subnetId ?? 0, params),
    queryFn: () => ipamApi.addresses(subnetId!, params).then((r) => r.data),
    enabled: !!subnetId,
    placeholderData: (prev) => prev,
  });
}

function invalidateAll(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: ipamKeys.all });
}

export function useGenerateIpAddresses() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (subnetId: number) => ipamApi.generateAddresses(subnetId).then((r) => r.data.message),
    onSuccess: () => invalidateAll(qc),
  });
}

export function useAllocateIpAddress() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ addressId, values }: { addressId: number; values: IpAddressAllocateValues }) => ipamApi.allocate(addressId, values).then((r) => r.data.data),
    onSuccess: () => invalidateAll(qc),
  });
}

export function useReleaseIpAddress() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (addressId: number) => ipamApi.release(addressId).then((r) => r.data.data),
    onSuccess: () => invalidateAll(qc),
  });
}
