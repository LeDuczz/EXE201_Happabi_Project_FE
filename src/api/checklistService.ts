import axiosClient from './axiosClient';

export interface ChecklistItem {
    id: string;
    task: string;
    completed: boolean;
    category: 'PRE_PROCEDURE' | 'PROCEDURE' | 'POST_PROCEDURE';
}

const checklistService = {
    getChecklist: (bookingId: string) =>
        axiosClient.get(`/api/v1/bookings/${bookingId}/checklist`),

    toggleItem: (bookingId: string, itemId: string) =>
        axiosClient.post(`/api/v1/bookings/${bookingId}/checklist/${itemId}/toggle`),

    submitReport: (bookingId: string, notes: string) =>
        axiosClient.post(`/api/v1/bookings/${bookingId}/checklist/report`, { notes }),
};

export default checklistService;
