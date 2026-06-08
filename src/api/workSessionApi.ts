import axiosClient from './axiosClient';
import type { WorkSession } from '../types/workSession';

const unwrap = <T>(response: { data?: { data?: T } }) => response.data?.data as T;

const toFormData = (images: File[], extra?: Record<string, string | undefined>) => {
  const formData = new FormData();
  images.forEach((file) => formData.append('images', file));
  Object.entries(extra ?? {}).forEach(([key, value]) => {
    if (value !== undefined && value.trim()) {
      formData.append(key, value.trim());
    }
  });
  return formData;
};

const workSessionApi = {
  getNurseSessions: async () => {
    const response = await axiosClient.get('/api/v1/nurses/me/work-sessions');
    return unwrap<WorkSession[]>(response);
  },

  getNurseSession: async (id: string) => {
    const response = await axiosClient.get(`/api/v1/nurses/me/work-sessions/${id}`);
    return unwrap<WorkSession>(response);
  },

  checkIn: async (id: string, images: File[]) => {
    const response = await axiosClient.post(
      `/api/v1/nurses/me/work-sessions/${id}/check-in`,
      toFormData(images),
      { headers: { 'Content-Type': 'multipart/form-data' } },
    );
    return unwrap<WorkSession>(response);
  },

  completeChecklistItem: async (sessionId: string, itemId: string, images: File[], note?: string) => {
    const response = await axiosClient.post(
      `/api/v1/nurses/me/work-sessions/${sessionId}/checklist/${itemId}/complete`,
      toFormData(images, { note }),
      { headers: { 'Content-Type': 'multipart/form-data' } },
    );
    return unwrap<WorkSession>(response);
  },

  undoChecklistItem: async (sessionId: string, itemId: string) => {
    const response = await axiosClient.post(
      `/api/v1/nurses/me/work-sessions/${sessionId}/checklist/${itemId}/undo`,
    );
    return unwrap<WorkSession>(response);
  },

  checkout: async (id: string) => {
    const response = await axiosClient.post(`/api/v1/nurses/me/work-sessions/${id}/checkout`);
    return unwrap<WorkSession>(response);
  },

  getMotherSessions: async () => {
    const response = await axiosClient.get('/api/v1/mothers/me/work-sessions');
    return unwrap<WorkSession[]>(response);
  },

  getMotherSession: async (id: string) => {
    const response = await axiosClient.get(`/api/v1/mothers/me/work-sessions/${id}`);
    return unwrap<WorkSession>(response);
  },

  confirmByMother: async (id: string) => {
    const response = await axiosClient.post(`/api/v1/mothers/me/work-sessions/${id}/confirm`);
    return unwrap<WorkSession>(response);
  },

  reportByMother: async (id: string, reason: string) => {
    const response = await axiosClient.post(`/api/v1/mothers/me/work-sessions/${id}/report`, { reason });
    return unwrap<WorkSession>(response);
  },
};

export default workSessionApi;
