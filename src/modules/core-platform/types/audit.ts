interface AuditUserRef {
  id: number;
  name: string;
  email: string;
}

/** Field-field ini HARUS cocok persis dengan AuditLoginController.php /
 * AuditLogin entity - tidak ada kolom browser/os/country terpisah,
 * cuma user_agent mentah. */
export interface AuditLoginEntry {
  id: number;
  user_id: number | null;
  user: AuditUserRef | null;
  email_attempted: string | null;
  ip_address: string;
  user_agent: string | null;
  device: string | null;
  status: "success" | "failed";
  failure_reason: string | null;
  created_at: string;
}

/** Field-field ini HARUS cocok persis dengan AuditDataChangeController.php /
 * AuditLog entity (tabel cp_at_data_change). */
export interface AuditDataChangeEntry {
  id: number;
  user_id: number | null;
  user: AuditUserRef | null;
  module: string;
  action: string;
  auditable_type: string;
  auditable_id: number | string | null;
  old_values: Record<string, unknown> | null;
  new_values: Record<string, unknown> | null;
  ip_address: string;
  created_at: string;
}

export interface AuditPermissionEntry {
  id: number;
  user_id: number | null;
  user: AuditUserRef | null;
  action: string;
  role_id: number | null;
  role_name: string | null;
  permission_name: string | null;
  resource: string | null;
  result: "granted" | "denied" | "revoked";
  ip_address: string;
  created_at: string;
}

/** Field-field ini HARUS cocok persis dengan AuditNotificationController.php
 * (tabel cp_ntf_queue, join ke cp_ntf_notification untuk title/body/module/
 * event/creator). "Siapa mengirim apa ke siapa, lewat channel apa, berhasil
 * atau tidak" - dibaca-saja dari data yang sudah dicatat NotificationService::send()
 * setiap kali notifikasi dibuat, jadi TIDAK ADA jalur pencatatan baru di sini. */
export interface AuditNotificationEntry {
  id: number;
  channel: "email" | "whatsapp" | "in_app" | "sms" | "push" | "telegram" | "slack" | "teams";
  recipient_type: string;
  recipient_ref: string;
  status: "pending" | "scheduled" | "sent" | "failed" | "cancelled" | "skipped";
  scheduled_at: string | null;
  sent_at: string | null;
  attempts: number;
  max_attempts: number;
  last_error: string | null;
  attachment_name: string | null;
  created_at: string;
  notification: {
    id: number;
    module_code: string | null;
    event_code: string | null;
    title: string | null;
    body?: string | null;
    created_by: number | null;
    creator: AuditUserRef | null;
  } | null;
}

export interface AuditListParams {
  page?: number;
  per_page?: number;
  user_id?: number;
  search?: string;
  module?: string;
  action?: string;
  auditable_type?: string;
  auditable_id?: number;
  date_from?: string;
  date_to?: string;
}

export interface AuditNotificationListParams extends AuditListParams {
  status?: AuditNotificationEntry["status"];
  channel?: AuditNotificationEntry["channel"];
  module?: string;
  event?: string;
  recipient?: string;
  created_by?: number;
}
