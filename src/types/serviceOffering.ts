export type ServiceOfferingType = 'SINGLE';

export interface ServiceOffering {
  id: string;
  serviceCode: string;
  serviceType: ServiceOfferingType;
  groupName?: string;
  serviceName: string;
  fitDescription?: string;
  packageContent?: string;
  durationMinutes?: number;
  durationDays?: number;
  grossAmount: number;
  platformFeeAmount?: number;
  nurseEarningAmount?: number;
  commissionRate?: number;
  isActive: boolean;
  sortOrder: number;
}
