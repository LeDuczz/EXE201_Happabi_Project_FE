import axiosClient from './axiosClient';
import type { AppNotification, NotificationListResponse } from '../types/notification';

const unwrap = <T>(response: { data: { data: T } }) => response.data.data;

const notificationApi = {
  async getMyNotifications(): Promise<NotificationListResponse> {
    const response = await axiosClient.get('/api/v1/notifications');
    return unwrap<NotificationListResponse>(response);
  },

  async markAsRead(notificationId: string): Promise<AppNotification> {
    const response = await axiosClient.patch(`/api/v1/notifications/${notificationId}/read`);
    return unwrap<AppNotification>(response);
  },
};

export default notificationApi;
