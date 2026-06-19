import type { WorkSessionStatus } from './workSession';

export interface NurseDashboardTodaySession {
  id: string;
  motherName: string;
  serviceName: string;
  serviceAddress?: string;
  scheduledStartAt: string;
  status: WorkSessionStatus;
  checklistCompletedCount: number;
  checklistTotalCount: number;
}

export interface NurseDashboard {
  todaySessionCount: number;
  checklistCompletionPercent: number;
  todayRevenue: number;
  ratingAvg: number;
  totalReviews: number;
  todaySessions: NurseDashboardTodaySession[];
  activeChecklistPreview: string[];
}
