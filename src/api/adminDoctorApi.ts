import axiosClient from './axiosClient';
import type { CreateDoctorAccountPayload, DoctorAccount } from '../types/adminDoctor';

export const adminDoctorApi = {
  async createDoctorAccount(payload: CreateDoctorAccountPayload) {
    const response = await axiosClient.post('/api/v1/admin/doctors', payload);
    return response.data?.data as DoctorAccount;
  },
};
