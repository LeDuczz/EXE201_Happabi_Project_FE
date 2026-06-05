import axiosClient from './axiosClient';
import type { ServiceOffering, ServiceOfferingType } from '../types/serviceOffering';

export const getServiceOfferings = async (type?: ServiceOfferingType) => {
  const response = await axiosClient.get('/api/v1/service-offerings', {
    params: type ? { type } : undefined,
  });
  return response.data?.data as ServiceOffering[];
};

export const getServiceOffering = async (serviceId: string) => {
  const response = await axiosClient.get(`/api/v1/service-offerings/${serviceId}`);
  return response.data?.data as ServiceOffering;
};
