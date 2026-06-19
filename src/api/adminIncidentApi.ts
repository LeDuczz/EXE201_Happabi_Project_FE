import axiosClient from './axiosClient';
import type { WorkSessionIncident } from '../types/workSession';

interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export type WorkSessionIncidentStatus = 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED';

export const adminIncidentApi = {
  getIncidents: async (status?: WorkSessionIncidentStatus) => {
    const response = await axiosClient.get('/api/v1/admin/work-session-incidents', {
      params: { page: 0, size: 20, status: status || undefined },
    });
    return response.data?.data as PageResponse<WorkSessionIncident>;
  },

  approve: async (incidentId: string, adminNote?: string) => {
    const response = await axiosClient.post(`/api/v1/admin/work-session-incidents/${incidentId}/approve`, {
      adminNote: adminNote?.trim() || undefined,
    });
    return response.data?.data as WorkSessionIncident;
  },

  reject: async (incidentId: string, adminNote?: string) => {
    const response = await axiosClient.post(`/api/v1/admin/work-session-incidents/${incidentId}/reject`, {
      adminNote: adminNote?.trim() || undefined,
    });
    return response.data?.data as WorkSessionIncident;
  },

  markNurseNoShow: async (workSessionId: string, adminNote?: string) => {
    const response = await axiosClient.post(`/api/v1/admin/work-session-incidents/work-sessions/${workSessionId}/nurse-no-show`, {
      adminNote: adminNote?.trim() || undefined,
    });
    return response.data?.data as WorkSessionIncident;
  },
};
