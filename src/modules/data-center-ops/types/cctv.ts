/**
 * Modul 03: CCTV Racks & Surveillance Grid
 * Kontrak data TypeScript yang selaras dengan backend CctvCameraResource & spesifikasi docs/07-frontend-plan-cctv-racks.md
 */

export type CctvCameraStatus = "unknown" | "online" | "offline" | "maintenance";
export type CctvSourceType = "rtmp" | "hls";
export type CctvPlaybackType = "hls";

export interface CctvStreamWarning {
  code: string;
  message: string;
}

export interface CctvStreamTestResult {
  ok: boolean;
  source_type?: CctvSourceType;
  playable_in_browser?: boolean;
  video_codec?: string | null;
  resolution?: string | null;
  warnings?: CctvStreamWarning[];
  error_code?: string | null;
  message?: string;
  errors?: Record<string, string[]>;
}

export interface CctvCamera {
  id: number;
  camera_name: string;
  site_id: number;
  site_room_id: number;
  rack_id?: number | null;
  site?: {
    id: number;
    site_code?: string;
    site_name: string;
  } | null;
  site_room?: {
    id: number;
    room_code?: string;
    room_name: string;
  } | null;
  rack?: {
    id: number;
    rack_code: string;
    rack_name?: string;
  } | null;
  device_brand: string | null;
  model_series: string | null;
  nvr_name: string | null;
  nvr_channel: number | null;
  source_type: CctvSourceType;
  source_url_masked: string;
  playback_url: string | null;
  playback_type: CctvPlaybackType | null;
  playable_in_browser: boolean;
  video_codec: string | null;
  resolution: string | null;
  status: CctvCameraStatus;
  last_checked_at: string | null;
  last_online_at: string | null;
  last_error: string | null;
  is_active: boolean;
  notes: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface CctvCheckResult extends CctvStreamTestResult {
  camera: CctvCamera;
}

/** Jumlah kamera per status untuk seluruh hasil filter (bukan hanya halaman aktif). */
export interface CctvStatusSummary {
  total: number;
  online: number;
  offline: number;
  maintenance: number;
  unknown: number;
}

export interface CctvFilterParams {
  site_id?: number;
  site_room_id?: number;
  rack_id?: number;
  status?: CctvCameraStatus | string;
  source_type?: CctvSourceType | string;
  search?: string;
  page?: number;
  per_page?: number;
}

export interface CreateCctvPayload {
  camera_name: string;
  site_id: number;
  site_room_id: number;
  rack_id?: number | null;
  device_brand?: string | null;
  model_series?: string | null;
  nvr_name?: string | null;
  nvr_channel?: number | null;
  source_url: string;
  is_active?: boolean;
  notes?: string | null;
}

export interface UpdateCctvPayload {
  camera_name?: string;
  site_id?: number;
  site_room_id?: number;
  rack_id?: number | null;
  device_brand?: string | null;
  model_series?: string | null;
  nvr_name?: string | null;
  nvr_channel?: number | null;
  source_url?: string;
  is_active?: boolean;
  notes?: string | null;
  maintenance?: boolean | null;
}

