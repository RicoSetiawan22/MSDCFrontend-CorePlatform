export interface QueueStatus {
  driver: string;
  pending_jobs: number | null;
  oldest_pending_seconds: number | null;
  failed_jobs: number | null;
  note: string | null;
}

export interface PendingJob {
  id: number;
  queue: string;
  payload: string;
  attempts: number;
  reserved_at: number | null;
  available_at: number;
  created_at: number;
  job_name: string | null;
  age_seconds: number;
}

export interface FailedJob {
  id: number;
  uuid: string;
  connection: string;
  queue: string;
  payload: string;
  exception: string;
  failed_at: string;
  job_name: string | null;
  exception_summary: string | null;
}
