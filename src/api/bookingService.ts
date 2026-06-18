import axiosClient from './axiosClient';

export interface CreateBookingPayload {
    nurseProfileId: string;
    serviceOfferingId: string;
    startAt: string;
    serviceAddress: string;
    motherNote?: string;
    paymentOption?: 'DEPOSIT_30_PERCENT' | 'FULL_APP_PAYMENT';
}

export interface BookingSummary {
    bookingId: string;
    slotId?: string;
    nurseProfileId: string;
    nurseName: string;
    serviceOfferingId: string;
    serviceName: string;
    status: 'PENDING_PAYMENT' | 'PENDING_NURSE_ACCEPTANCE' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED' | 'COMPLETED';
    startAt: string;
    endAt: string;
    paymentExpiresAt: string;
    grossAmount: number;
    depositAmount?: number;
    remainingCashAmount?: number;
    appPaymentAmount?: number;
    paymentOption?: 'DEPOSIT_30_PERCENT' | 'FULL_APP_PAYMENT';
    serviceAddress: string;
    motherNote?: string;
}

export interface BookingPaymentLink {
    bookingId: string;
    transactionId: number;
    amount: number;
    checkoutUrl: string;
    paymentExpiresAt: string;
}

export interface Booking {
    id: string;
    motherName: string;
    service: string;
    dateTime: string;
    status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'COMPLETED' | 'CANCELLED';
    price: number;
    address: string;
    nurseId?: string;
    motherAvatar?: string;
}

const bookingService = {
    createBooking: async (payload: CreateBookingPayload) => {
        const response = await axiosClient.post('/api/v1/bookings', payload);
        return response.data?.data as BookingSummary;
    },

    createPaymentLink: async (bookingId: string) => {
        const response = await axiosClient.post(`/api/v1/payments/bookings/${bookingId}/payos-link`);
        return response.data?.data as BookingPaymentLink;
    },

    getPendingPayments: async () => {
        const response = await axiosClient.get('/api/v1/bookings/me/pending-payments');
        return response.data?.data as BookingSummary[];
    },

    getMyBookings: () => axiosClient.get('/api/v1/bookings/me'),

    getNurseSchedule: () => axiosClient.get('/api/v1/nurses/me/bookings'),

    updateBookingStatus: (id: string, status: string) =>
        axiosClient.patch(`/api/v1/bookings/${id}/status`, { status }),

    acceptBooking: (id: string) =>
        axiosClient.post(`/api/v1/bookings/${id}/accept`),

    rejectBooking: (id: string) =>
        axiosClient.post(`/api/v1/bookings/${id}/reject`),
};

export default bookingService;

