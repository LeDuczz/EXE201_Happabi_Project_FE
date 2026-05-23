import axiosClient from './axiosClient';

const adminService = {
    getDailyGmv: () => {
        return axiosClient.get('/api/admin/analytics/gmv/daily');
    },

    getAllNurses: () => {
        return axiosClient.get('/api/admin/nurses');
    },

    verifyNurse: (nurseId: string, status: string) => {
        return axiosClient.post(`/api/admin/nurses/${nurseId}/verify`, { status });
    },

    getAllUsers: () => {
        return axiosClient.get('/api/admin/users');
    },

    getAllBookings: () => {
        return axiosClient.get('/api/admin/bookings');
    }
};

export default adminService;
