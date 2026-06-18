import axiosClient from './axiosClient';
import type {
  CreateAvailabilityWindowPayload,
  NurseAvailabilityWindow,
  UpdateAvailabilityPreferencePayload,
} from '../types/nurseAvailability';
import type { NurseProfile } from '../types/nurseProfile';

const unwrap = <T>(response: { data?: { data?: T } }) => response.data?.data as T;

export const getMyAvailabilityWindows = async () => {
  const response = await axiosClient.get('/api/v1/nurses/me/availability-windows');
  return unwrap<NurseAvailabilityWindow[]>(response);
};

export const createAvailabilityWindow = async (payload: CreateAvailabilityWindowPayload) => {
  const response = await axiosClient.post('/api/v1/nurses/me/availability-windows', payload);
  return unwrap<NurseAvailabilityWindow>(response);
};

export const cancelAvailabilityWindow = async (windowId: string) => {
  const response = await axiosClient.delete(`/api/v1/nurses/me/availability-windows/${windowId}`);
  return unwrap<NurseAvailabilityWindow>(response);
};

export const setAvailabilityPreference = async (payload: UpdateAvailabilityPreferencePayload) => {
  const response = await axiosClient.patch('/api/v1/nurses/me/availability-windows/preference', payload);
  return unwrap<NurseProfile>(response);
};
