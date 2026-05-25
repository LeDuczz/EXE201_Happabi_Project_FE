import axiosClient from './axiosClient';

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
