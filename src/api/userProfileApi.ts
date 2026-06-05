import axiosClient from './axiosClient';
import type { UserProfile } from '../contexts/AuthContext';

export const getMyProfile = async () => {
  const response = await axiosClient.get('/api/v1/users/me');
  return response.data?.data as UserProfile;
};

export const uploadMyProfileAvatar = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await axiosClient.post('/api/v1/users/me/avatar', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

  return response.data?.data as string;
};
