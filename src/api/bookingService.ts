import axiosClient from './axiosClient';

export interface CreateBookingDraftPayload {
    nurseProfileId: string;
    serviceOfferingId: string;
    startAt: string;
    serviceAddress: string;
    motherNote?: string;
    paymentOption?: 'DEPOSIT_30_PERCENT' | 'FULL_APP_PAYMENT';
}

export interface BookingDraft {
    draftId: string;
    bookingId?: string;
    slotId?: string;
    nurseProfileId: string;
    nurseName: string;
    serviceOfferingId: string;
    serviceName: string;
    status: 'DRAFT' | 'PENDING_PAYMENT' | 'PENDING_NURSE_ACCEPTANCE' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED' | 'COMPLETED';
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
    createDraft: async (payload: CreateBookingDraftPayload) => {
        const response = await axiosClient.post('/api/v1/bookings/drafts', payload);
        return response.data?.data as BookingDraft;
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
