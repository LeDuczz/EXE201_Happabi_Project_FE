import axiosClient from './axiosClient';
import type { AppNotification, NotificationListResponse, NotificationRole } from '../types/notification';

const unwrap = <T>(response: { data: { data: T } }) => response.data.data;

const notificationApi = {
  async getMyNotifications(role?: NotificationRole | null): Promise<NotificationListResponse> {
    const response = await axiosClient.get('/api/v1/notifications', {
      params: role ? { role } : undefined,
    });
    return unwrap<NotificationListResponse>(response);
  },

  async markAsRead(notificationId: string): Promise<AppNotification> {
    const response = await axiosClient.patch(`/api/v1/notifications/${notificationId}/read`);
    return unwrap<AppNotification>(response);
  },
};

export default notificationApi;
