import axiosClient from './axiosClient';
import type { CreateNurseReviewPayload, NurseReview } from '../types/nurseReview';

const unwrap = <T>(response: { data?: { data?: T } }) => response.data?.data as T;

const nurseReviewApi = {
  getMyWorkSessionReview: async (workSessionId: string) => {
    const response = await axiosClient.get(`/api/v1/mothers/me/work-sessions/${workSessionId}/review`);
    return unwrap<NurseReview>(response);
  },

  createMyWorkSessionReview: async (workSessionId: string, payload: CreateNurseReviewPayload) => {
    const response = await axiosClient.post(`/api/v1/mothers/me/work-sessions/${workSessionId}/review`, payload);
    return unwrap<NurseReview>(response);
  },
};

export default nurseReviewApi;
