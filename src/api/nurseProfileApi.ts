import axiosClient from './axiosClient';
import type { NurseProfile } from '../types/nurseProfile';

export interface UpdateNurseProfileDisplayPayload {
  bio?: string | null;
  serviceArea?: string | null;
}

export const getMyNurseProfile = async () => {
  const response = await axiosClient.get('/api/v1/users/me/nurse-profile');
  return response.data?.data as NurseProfile;
};

export const uploadMyAvatar = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await axiosClient.post('/api/v1/users/me/avatar', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

  return response.data?.data as string;
};

export const updateMyNurseProfileDisplay = async (payload: UpdateNurseProfileDisplayPayload) => {
  const response = await axiosClient.patch('/api/v1/users/me/nurse-profile/display', payload);
  return response.data?.data as NurseProfile;
};
