import axiosClient from './axiosClient';

export interface MotherDashboardMetrics {
  upcomingSessions: number;
  completedSessions: number;
  paidBookings: number;
  averageRatingGiven?: number | null;
}

export interface MotherDashboardUpcomingSession {
  workSessionId: string;
  bookingId: string;
  nurseName: string;
  nurseAvatarUrl?: string | null;
  serviceName: string;
  scheduledStartAt: string;
  scheduledEndAt: string;
  status: string;
}

export interface MotherDashboardRecommendedNurse {
  nurseProfileId: string;
  fullName: string;
  avatarUrl?: string | null;
  specialty?: 'NURSE' | 'MIDWIFE' | 'CAREGIVER' | null;
  ratingAvg?: number | null;
  totalReviews?: number | null;
  city?: string | null;
}

export interface MotherDashboard {
  metrics: MotherDashboardMetrics;
  upcomingSessions: MotherDashboardUpcomingSession[];
  recommendedNurses: MotherDashboardRecommendedNurse[];
  profileLocationConfigured: boolean;
  generatedAt: string;
}

const unwrap = <T>(response: { data?: { data?: T } }) => response.data?.data as T;

export const getMotherDashboard = async () => {
  const response = await axiosClient.get('/api/v1/mothers/me/dashboard');
  return unwrap<MotherDashboard>(response);
};
