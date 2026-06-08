export type NotificationType =
  | 'NURSE_PROFILE_REJECTED'
  | 'NURSE_PROFILE_APPROVED_PENDING_CONTRACT'
  | 'NURSE_PROFILE_ACTIVE'
  | 'NURSE_SUSPENDED'
  | 'NURSE_REACTIVATED'
  | 'WORK_SESSION_UPDATED';

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  resourceType?: string;
  resourceId?: string;
  read: boolean;
  readAt?: string;
  createdAt: string;
}

export interface NotificationListResponse {
  unreadCount: number;
  notifications: AppNotification[];
}

export interface RealtimeNotificationPayload {
  notificationId: string;
  targetUserId: string;
  type: NotificationType;
  title: string;
  message: string;
  resourceType?: string;
  resourceId?: string;
  unreadCount: number;
  createdAt: string;
}
