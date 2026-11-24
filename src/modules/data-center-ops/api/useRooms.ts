import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@shared/lib/api-client";
import type { ApiMessageResponse } from "@shared/types/api";
import type { Site, SiteRoom } from "../types/site";

// room_code TIDAK ADA di sini - auto-generated dari Number Sequence terpusat
// (Master Data > Number Sequence, module_code='site_room'), immutable setelah dibuat.
export interface CreateRoomParams {
  room_code?: string;
  room_name: string;
  floor?: string;
  zone?: string;
  room_type?: string;
  area_sqm?: number;
}

export interface UpdateRoomParams {
  room_code?: string;
  room_name?: string;
  floor?: string;
  zone?: string;
  room_type?: string;
  area_sqm?: number;
}

export function useRoomList(siteId?: number) {
  return useQuery({
    queryKey: ["dcRooms", siteId],
    queryFn: async () => {
      if (siteId) {
        // GET /sites/{id} (show) mengembalikan { data: Site } - Site-nya
        // sendiri yang punya field `rooms`, BUKAN array room langsung -
        // sebelumnya salah tipe & salah ambil (r.data.data), jadi baris ini
        // TIDAK PERNAH benar-benar dipanggil dengan siteId sampai sekarang
        // (semua caller sebelumnya cuma pakai useRoomList() tanpa siteId).
        const r = await apiClient.get<{ data: { rooms: SiteRoom[] } }>(`/v1/data-center-ops/sites/${siteId}`);
        return r.data.data.rooms ?? [];
      }
      // All rooms across all sites — fetch sites and flatten
      const r = await apiClient.get<{ data: Site[] }>("/v1/data-center-ops/sites?per_page=100");
      const rooms = (r.data.data ?? []).flatMap((s: Site) =>
        (s.rooms ?? []).map((room: SiteRoom) => ({
          ...room,
          site_id: room.site_id ?? s.id,
          site_code: s.site_code,
          site_name: s.site_name,
        }))
      );
      return rooms as (SiteRoom & { site_id: number; site_code: string; site_name: string })[];
    },
  });
}

export function useCreateRoom(siteId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (values: CreateRoomParams) =>
      apiClient
        .post<ApiMessageResponse<SiteRoom>>(`/v1/data-center-ops/sites/${siteId}/rooms`, values)
        .then(r => r.data.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["dcSites"] });
      qc.invalidateQueries({ queryKey: ["dcRooms"] });
      qc.invalidateQueries({ queryKey: ["dcRacks"] });
    },
  });
}

export function useUpdateRoom(siteId: number, roomId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (values: UpdateRoomParams) =>
      apiClient
        .put<ApiMessageResponse<SiteRoom>>(`/v1/data-center-ops/sites/${siteId}/rooms/${roomId}`, values)
        .then(r => r.data.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["dcSites"] });
      qc.invalidateQueries({ queryKey: ["dcRooms"] });
      qc.invalidateQueries({ queryKey: ["dcRacks"] });
    },
  });
}

export function useDeleteRoom(siteId: number, roomId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () =>
      apiClient
        .delete<ApiMessageResponse<null>>(`/v1/data-center-ops/sites/${siteId}/rooms/${roomId}`)
        .then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["dcSites"] });
      qc.invalidateQueries({ queryKey: ["dcRooms"] });
      qc.invalidateQueries({ queryKey: ["dcRacks"] });
    },
  });
}
