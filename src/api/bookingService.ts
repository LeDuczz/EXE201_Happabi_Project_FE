import axiosClient from './axiosClient';

export interface Booking {
    id: string;
    motherId: string;
    nurseId: string;
    nurseName: string;
    nurseAvatar: string;
    service: string;
    date: string;
    time: string;
    status: 'PENDING' | 'UPCOMING' | 'COMPLETED' | 'CANCELLED';
    price: number;
    paymentType: 'CASH' | 'WALLET';
    address: string;
    note?: string;
}

export interface SearchParams {
    query?: string;
    skill?: string;
    sort?: string;
    availableOnly?: boolean;
    verifiedOnly?: boolean;
}

const bookingService = {
    searchNurses: (params: SearchParams) => {
        return axiosClient.get('/api/v1/nurses/search', { params });
    },

    createBooking: (data: Partial<Booking>) => {
        return axiosClient.post('/api/v1/bookings', data);
    },

    getMyBookings: () => {
        return axiosClient.get('/api/v1/bookings/me');
    },

    getBookingDetails: (id: string) => {
        return axiosClient.get(`/api/v1/bookings/${id}`);
    },

    acceptBooking: (id: string) => {
        return axiosClient.post(`/api/v1/bookings/${id}/accept`);
    },

    rejectBooking: (id: string, reason: string) => {
        return axiosClient.post(`/api/v1/bookings/${id}/reject`, { reason });
    },

    completeBooking: (id: string) => {
        return axiosClient.post(`/api/v1/bookings/${id}/complete`);
    }
};

export default bookingService;
