import { apiClient } from "../ApiClient";
import { BackendRoutes } from "../BackendRoutes";

export interface NotificationType {
  id: string;
  title?: string;
  message?: string;
  body?: string;
  level?: "info" | "success" | "warning" | "error";
  is_read: boolean;
  created_at?: string;
  updated_at?: string;
  metadata?: Record<string, unknown>;
}

type UnreadCountResponse = {
  count: number;
};

export class NotificationService {
  static async getNotifications(): Promise<NotificationType[]> {
    const res = await apiClient.get<NotificationType[]>(BackendRoutes.notifications, {
      requiresAuth: true,
    });
    return Array.isArray(res.data) ? res.data : [];
  }

  static async getUnreadCount(): Promise<number> {
    const res = await apiClient.get<UnreadCountResponse>(BackendRoutes.notificationsUnreadCount, {
      requiresAuth: true,
    });
    return res.data.count;
  }

  static async markAsRead(id: string): Promise<void> {
    await apiClient.post(BackendRoutes.notificationMarkRead(id), undefined, {
      requiresAuth: true,
    });
  }

  static async markAllAsRead(): Promise<void> {
    await apiClient.post(BackendRoutes.notificationsMarkAllRead, undefined, {
      requiresAuth: true,
    });
  }
}

export default NotificationService;

