export type BackupStatus = "running" | "completed" | "failed";
export type BackupTriggerType = "manual" | "pre_restore";

export interface SystemBackup {
  id: number;
  filename: string;
  disk: string;
  size_bytes: number | null;
  status: BackupStatus;
  trigger_type: BackupTriggerType;
  created_by: number | null;
  error_message: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  creator?: { id: number; name: string } | null;
}
