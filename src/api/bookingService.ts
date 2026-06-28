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

    cancelByMother: async (id: string, reason: string) => {
        const response = await axiosClient.post(`/api/v1/bookings/${id}/cancel-by-mother`, { reason });
        return response.data?.data as {
            id: string;
            bookingId: string;
            actor: 'MOTHER' | 'NURSE' | 'SYSTEM' | 'ADMIN';
            reason: string;
            refundable: boolean;
            refundableAmount: number;
            policyCutoffAt: string;
            createdAt: string;
        };
    },

    cancelByNurse: async (id: string, reason: string) => {
        const response = await axiosClient.post(`/api/v1/bookings/${id}/cancel-by-nurse`, { reason });
        return response.data?.data as {
            id: string;
            bookingId: string;
            actor: 'MOTHER' | 'NURSE' | 'SYSTEM' | 'ADMIN';
            reason: string;
            refundable: boolean;
            refundableAmount: number;
            policyCutoffAt: string;
            createdAt: string;
        };
    },
};

export default bookingService;

