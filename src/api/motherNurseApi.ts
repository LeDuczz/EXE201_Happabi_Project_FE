import axiosClient from './axiosClient';
import type { NurseSpecialty } from '../types/nurseOnboarding';
import type {
  NurseAiComparisonRequest,
  NurseAiComparisonResponse,
  NursePublicProfile,
  PageResponse,
} from '../types/nursePublic';

export interface SearchMotherNursesParams {
  keyword?: string;
  city?: string;
  specialty?: NurseSpecialty | '';
  availableOnly?: boolean;
  page?: number;
  size?: number;
}

export const searchMotherNurses = async (params: SearchMotherNursesParams) => {
  const response = await axiosClient.get('/api/v1/mothers/nurses', {
    params: {
      keyword: params.keyword || undefined,
      city: params.city || undefined,
      specialty: params.specialty || undefined,
      availableOnly: params.availableOnly || undefined,
      page: params.page ?? 0,
      size: params.size ?? 12,
    },
  });

  return response.data?.data as PageResponse<NursePublicProfile>;
};

export const getMotherNurseProfile = async (profileId: string) => {
  const response = await axiosClient.get(`/api/v1/mothers/nurses/${profileId}`);
  return response.data?.data as NursePublicProfile;
};

export const compareMotherNursesWithAi = async (payload: NurseAiComparisonRequest) => {
  const response = await axiosClient.post('/api/v1/mothers/nurses/ai-comparison', payload);
  return response.data?.data as NurseAiComparisonResponse;
};
