import axiosClient from './axiosClient';
import type { NurseDashboard } from '../types/nurseDashboard';

const unwrap = <T>(response: { data?: { data?: T } }) => response.data?.data as T;

export const getNurseDashboard = async () => {
  const response = await axiosClient.get('/api/v1/nurses/me/dashboard');
  return unwrap<NurseDashboard>(response);
};
