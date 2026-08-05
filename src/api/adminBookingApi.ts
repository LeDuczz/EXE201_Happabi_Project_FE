import axiosClient from './axiosClient';

export type AdminBookingStatus =
  | 'PENDING_PAYMENT'
  | 'PENDING_NURSE_ACCEPTANCE'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'CANCELLED'
  | 'COMPLETED';

export type AdminBookingPaymentOption = 'DEPOSIT_30_PERCENT' | 'FULL_APP_PAYMENT';

export interface AdminBookingParty {
  id: string;
  fullName?: string;
  phone?: string;
  email?: string;
}

export interface AdminBookingServiceSummary {
  id: string;
  serviceCode: string;
  serviceName: string;
  groupName?: string;
}

export interface AdminBooking {
  id: string;
  bookingKey: string;
  status: AdminBookingStatus;
  paymentOption: AdminBookingPaymentOption;
  startAt: string;
  endAt: string;
  createdAt: string;
  updatedAt: string;
  grossAmount: number;
  appPaymentAmount: number;
  depositAmount: number;
  remainingCashAmount: number;
  platformFeeAmount: number;
  nurseEarningAmount: number;
  serviceAddress: string;
  motherNote?: string;
  mother?: AdminBookingParty;
  nurse?: AdminBookingParty;
  service?: AdminBookingServiceSummary;
}

export interface AdminBookingFilters {
  query?: string;
  status?: AdminBookingStatus | '';
  paymentOption?: AdminBookingPaymentOption | '';
  createdFrom?: string;
  createdTo?: string;
  serviceFrom?: string;
  serviceTo?: string;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export const getAdminBookings = async (
  page = 0,
  size = 12,
  filters: AdminBookingFilters = {}
): Promise<PageResponse<AdminBooking>> => {
  const params = new URLSearchParams({
    page: String(page),
    size: String(size),
    sort: 'createdAt,desc',
  });

  Object.entries(filters).forEach(([key, value]) => {
    if (value) params.set(key, value);
  });

  const response = await axiosClient.get(`/api/v1/admin/bookings?${params.toString()}`);
  return response.data?.data;
};

export const getAdminBookingDetail = async (bookingId: string): Promise<AdminBooking> => {
  const response = await axiosClient.get(`/api/v1/admin/bookings/${bookingId}`);
  return response.data?.data;
};
