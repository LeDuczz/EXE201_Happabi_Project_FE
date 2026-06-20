import axiosClient from './axiosClient';
import type { UserRole } from '../contexts/AuthContext';

export type UserFeedbackCategory =
  | 'APP_EXPERIENCE'
  | 'BOOKING'
  | 'PAYMENT'
  | 'CHAT_AI'
  | 'NURSE_ONBOARDING'
  | 'DOCTOR_REVIEW'
  | 'SUGGESTION'
  | 'OTHER';

export type UserFeedbackStatus = 'NEW' | 'REVIEWING' | 'PLANNED' | 'RESOLVED' | 'CLOSED';

export interface UserFeedback {
  id: string;
  submittedByUserId: string;
  submittedByName: string;
  submittedByRole: UserRole;
  category: UserFeedbackCategory;
  status: UserFeedbackStatus;
  rating?: number;
  title: string;
  message: string;
  adminNote?: string;
  reviewedByAdminName?: string;
  reviewedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface FeedbackPage {
  content: UserFeedback[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export interface CreateFeedbackPayload {
  category: UserFeedbackCategory;
  rating?: number;
  title: string;
  message: string;
}

export interface UpdateFeedbackStatusPayload {
  status: Exclude<UserFeedbackStatus, 'NEW'>;
  adminNote?: string;
}

export const feedbackApi = {
  createMine: async (payload: CreateFeedbackPayload) => {
    const response = await axiosClient.post('/api/v1/feedbacks/me', payload);
    return response.data?.data as UserFeedback;
  },

  getMine: async (page = 0, size = 10) => {
    const response = await axiosClient.get('/api/v1/feedbacks/me', {
      params: { page, size },
    });
    return response.data?.data as FeedbackPage;
  },

  getAdminFeedbacks: async (status?: UserFeedbackStatus | 'ALL', page = 0, size = 20) => {
    const response = await axiosClient.get('/api/v1/admin/feedbacks', {
      params: { page, size, status: status && status !== 'ALL' ? status : undefined },
    });
    return response.data?.data as FeedbackPage;
  },

  updateStatus: async (feedbackId: string, payload: UpdateFeedbackStatusPayload) => {
    const response = await axiosClient.patch(`/api/v1/admin/feedbacks/${feedbackId}/status`, payload);
    return response.data?.data as UserFeedback;
  },
};
