import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { facilityApi } from "./facilityApi";
import type { GaFacilityFormValues, GaFacilityBookingFormValues, GaBuildingAccessPermitFormValues } from "../types/facility";

const gaKeys = {
  all: ["gaFacilities"] as const,
  bookings: (params?: object) => ["gaBookings", params] as const,
  permits: (params?: object) => ["gaAccessPermits", params] as const,
};

export function useFacilityList(params?: { status?: string; type?: string }) {
  return useQuery({
    queryKey: [...gaKeys.all, params],
    queryFn: () => facilityApi.list(params).then(r => r.data.data),
  });
}

export function useCreateFacility() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (values: GaFacilityFormValues) => facilityApi.create(values).then(r => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: gaKeys.all }),
  });
}

export function useUpdateFacility() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, values }: { id: number; values: Partial<GaFacilityFormValues> }) => facilityApi.update(id, values).then(r => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: gaKeys.all }),
  });
}

export function useDeleteFacility() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => facilityApi.delete(id).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: gaKeys.all }),
  });
}

export function useFacilityBookings(params?: { status?: string; facility_id?: number; page?: number; per_page?: number }) {
  return useQuery({
    queryKey: gaKeys.bookings(params),
    queryFn: () => facilityApi.bookings(params).then(r => r.data),
    placeholderData: prev => prev,
  });
}

export function useCreateFacilityBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (values: GaFacilityBookingFormValues) => facilityApi.createBooking(values).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["gaBookings"] }),
  });
}

export function useAccessPermits(params?: { status?: string; page?: number; per_page?: number }) {
  return useQuery({
    queryKey: gaKeys.permits(params),
    queryFn: () => facilityApi.accessPermits(params).then(r => r.data),
    placeholderData: prev => prev,
  });
}

export function useCreateAccessPermit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (values: GaBuildingAccessPermitFormValues) => facilityApi.createAccessPermit(values).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["gaAccessPermits"] }),
  });
}
