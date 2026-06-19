export type NotificationType =
  | 'NURSE_PROFILE_REJECTED'
  | 'NURSE_PROFILE_APPROVED_PENDING_CONTRACT'
  | 'NURSE_PROFILE_ACTIVE'
  | 'NURSE_SUSPENDED'
  | 'NURSE_REACTIVATED'
  | 'BOOKING_PAYMENT_PENDING'
  | 'BOOKING_PAYMENT_SUCCESS'
  | 'BOOKING_PAYMENT_FAILED'
  | 'BOOKING_PAYMENT_EXPIRED'
  | 'NURSE_BOOKING_ASSIGNED'
  | 'NURSE_AVAILABILITY_WINDOW_OPENED'
  | 'NURSE_AVAILABILITY_WINDOW_CANCELLED'
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
