import type { AvailabilityStatus } from './nurseProfile';

export type NurseAvailabilityWindowStatus = 'ACTIVE' | 'CANCELLED' | 'EXPIRED';

export interface NurseAvailabilityWindow {
  id: string;
  startAt: string;
  endAt: string;
  status: NurseAvailabilityWindowStatus;
  nurseAvailabilityStatus?: AvailabilityStatus;
}

export interface CreateAvailabilityWindowPayload {
  startAt: string;
  endAt: string;
}

export interface UpdateAvailabilityPreferencePayload {
  status: AvailabilityStatus;
}
