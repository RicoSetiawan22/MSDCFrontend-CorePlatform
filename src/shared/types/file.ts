export interface FileVersion {
  id: number;
  version_number: number;
  stored_path: string;
  size_bytes: number;
  mime_type: string;
}

export interface FileThumbnail {
  id: number;
  size_label: string;
  width: number | null;
  height: number | null;
}

export interface FileRecord {
  id: number;
  original_name: string;
  mime_type: string;
  extension: string;
  size_bytes: number;
  folder_id?: number | null;
  module_code: string | null;
  reference_type: string | null;
  reference_id: number | null;
  status: string;
  virus_scan_status?: string;
  is_signed?: boolean;
  created_at?: string;
  current_version?: FileVersion;
  uploader?: { id: number; name: string } | null;
  folder?: { id: number; name: string; path: string } | null;
  thumbnails?: FileThumbnail[];
}

export interface FileFolder {
  id: number;
  parent_id: number | null;
  name: string;
  module_code: string | null;
  owner_id: number | null;
  path: string;
  is_active: boolean;
  children?: FileFolder[];
}

export interface FileStorageConfig {
  id: number;
  disk_name: string;
  driver: "local" | "s3" | "gcs" | "azure";
  config: Record<string, unknown> | null;
  is_default: boolean;
  is_active: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  current_page: number;
  last_page: number;
  total: number;
  per_page: number;
}
