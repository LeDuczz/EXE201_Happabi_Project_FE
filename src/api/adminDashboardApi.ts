import axiosClient from './axiosClient';

export interface AdminDashboardActionQueue {
  pendingNurseProfiles: number;
  pendingWithdrawals: number;
  pendingRefunds: number;
  pendingIncidents: number;
  newFeedbacks: number;
  pendingKnowledgeItems: number;
  pendingPayments: number;
  waitingMotherConfirmations: number;
}

export interface AdminDashboardBookingOperations {
  todayBookings: number;
  upcoming24hBookings: number;
  pendingPaymentBookings: number;
  paidBookingsToday: number;
  cancelledBookingsToday: number;
  activeWorkSessions: number;
  waitingCheckInSessions: number;
  inProgressSessions: number;
  waitingMotherConfirmationSessions: number;
  reportedSessions: number;
}

export interface AdminDashboardFinancialControl {
  adminWalletBalance: number;
  todayGrossMerchandiseValue: number;
  last7DaysGrossMerchandiseValue: number;
  last30DaysGrossMerchandiseValue: number;
  todayAppPayments: number;
  last7DaysAppPayments: number;
  last30DaysAppPayments: number;
  todayPlatformRevenue: number;
  last30DaysPlatformRevenue: number;
  last30DaysPaymentGatewayFees: number;
  last30DaysNursePayouts: number;
  last30DaysNetCashContribution: number;
  pendingWithdrawalAmount: number;
  pendingRefundAmount: number;
  pendingWithdrawals: number;
  pendingRefunds: number;
}

export interface AdminDashboardNurseSupplyHealth {
  totalNurses: number;
  activeNurses: number;
  availableNurses: number;
  busyNurses: number;
  offlineNurses: number;
  suspendedNurses: number;
  pendingReviewNurses: number;
  pendingContractNurses: number;
  pendingDepositNurses: number;
  penalizedNurses: number;
}

export interface AdminDashboardLatestFeedback {
  id: string;
  title: string;
  category: string;
  status: string;
  submittedByName: string;
  submittedByRole: string;
  rating?: number;
  createdAt: string;
}

export interface AdminDashboardFeedbackInsight {
  newFeedbacks: number;
  reviewingFeedbacks: number;
  plannedFeedbacks: number;
  resolvedFeedbacks: number;
  averageRating: number;
  latestFeedbacks: AdminDashboardLatestFeedback[];
}

export interface AdminDashboardRiskAlert {
  severity: 'HIGH' | 'MEDIUM' | 'LOW' | string;
  title: string;
  message: string;
  targetPath: string;
  count: number;
}

export interface AdminDashboardDailyMetric {
  date: string;
  value: number;
}

export interface AdminDashboardFinancialDailyMetric {
  date: string;
  platformRevenue: number;
  paymentGatewayFee: number;
  netPlatformRevenue: number;
}

export interface AdminOperationsDashboard {
  actionQueue: AdminDashboardActionQueue;
  bookingOperations: AdminDashboardBookingOperations;
  financialControl: AdminDashboardFinancialControl;
  nurseSupplyHealth: AdminDashboardNurseSupplyHealth;
  feedbackInsight: AdminDashboardFeedbackInsight;
  riskAlerts: AdminDashboardRiskAlert[];
  gmvTrend: AdminDashboardDailyMetric[];
  generatedAt: string;
}

const unwrap = <T>(response: { data?: { data?: T } }) => response.data?.data as T;

const toNumber = (value: unknown) => Number(value ?? 0);

const normalizeDashboard = (data: AdminOperationsDashboard): AdminOperationsDashboard => ({
  ...data,
  financialControl: {
    ...data.financialControl,
    adminWalletBalance: toNumber(data.financialControl?.adminWalletBalance),
    todayGrossMerchandiseValue: toNumber(data.financialControl?.todayGrossMerchandiseValue),
    last7DaysGrossMerchandiseValue: toNumber(data.financialControl?.last7DaysGrossMerchandiseValue),
    last30DaysGrossMerchandiseValue: toNumber(data.financialControl?.last30DaysGrossMerchandiseValue),
    todayAppPayments: toNumber(data.financialControl?.todayAppPayments),
    last7DaysAppPayments: toNumber(data.financialControl?.last7DaysAppPayments),
    last30DaysAppPayments: toNumber(data.financialControl?.last30DaysAppPayments),
    todayPlatformRevenue: toNumber(data.financialControl?.todayPlatformRevenue),
    last30DaysPlatformRevenue: toNumber(data.financialControl?.last30DaysPlatformRevenue),
    last30DaysPaymentGatewayFees: toNumber(data.financialControl?.last30DaysPaymentGatewayFees),
    last30DaysNursePayouts: toNumber(data.financialControl?.last30DaysNursePayouts),
    last30DaysNetCashContribution: toNumber(data.financialControl?.last30DaysNetCashContribution),
    pendingWithdrawalAmount: toNumber(data.financialControl?.pendingWithdrawalAmount),
    pendingRefundAmount: toNumber(data.financialControl?.pendingRefundAmount),
  },
  feedbackInsight: {
    ...data.feedbackInsight,
    averageRating: toNumber(data.feedbackInsight?.averageRating),
    latestFeedbacks: data.feedbackInsight?.latestFeedbacks ?? [],
  },
  riskAlerts: data.riskAlerts ?? [],
  gmvTrend: (data.gmvTrend ?? []).map((item) => ({
    ...item,
    value: toNumber(item.value),
  })),
});

export const getAdminOperationsDashboard = async () => {
  const response = await axiosClient.get('/api/v1/admin/dashboard/overview');
  return normalizeDashboard(unwrap<AdminOperationsDashboard>(response));
};
