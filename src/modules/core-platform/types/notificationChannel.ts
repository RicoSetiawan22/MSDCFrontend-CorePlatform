export type NotificationChannel = "email" | "sms" | "whatsapp" | "push" | "telegram" | "slack" | "teams" | "in_app";

export interface NotificationChannelConfig {
  id: number;
  channel: NotificationChannel;
  provider: string;
  config: Record<string, string> | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface NotificationChannelConfigUpdateValues {
  provider?: string;
  config?: Record<string, string>;
  is_active?: boolean;
}
