import type { NurseCertification, NurseSpecialty, NurseStatus } from './nurseOnboarding';

export type AvailabilityStatus = 'AVAILABLE' | 'BUSY' | 'OFFLINE';
export type NurseAvailabilityWindowStatus = 'ACTIVE' | 'CANCELLED' | 'EXPIRED';
export type EkycStatus = 'PENDING' | 'PASSED' | 'REVIEW_NEEDED' | 'FAILED';
export type NurseContractStatus = 'PENDING' | 'SIGNED' | 'CANCELLED';

export interface NurseProfile {
  id: string;
  profileId?: string;
  fullName?: string;
  phone?: string;
  email?: string;
  dayOfBirth?: string;
  licenseNumber?: string;
  specialty?: NurseSpecialty;
  experienceYears?: number;
  bio?: string;
  serviceArea?: string;
  address?: string;
  city?: string;
  avatarUrl?: string;
  nurseStatus?: NurseStatus;
  availabilityStatus?: AvailabilityStatus;
  ratingAvg?: number;
  totalReviews?: number;
  totalCompletedJobs?: number;
  responseRate?: number;
  backgroundChecked?: boolean;
  featured?: boolean;
  kycStatus?: EkycStatus;
  kycVerified?: boolean;
  kycHasFrontImage?: boolean;
  kycHasBackImage?: boolean;
  contractStatus?: NurseContractStatus;
  contractSigned?: boolean;
  contractSignedAt?: string;
  profileCompleted?: boolean;
  certificationsCompleted?: boolean;
  certificationCount?: number;
  certifications?: NurseCertification[];
  canEditProfessionalInfo?: boolean;
}

export interface NurseAvailabilityWindow {
  id: string;
  startAt: string;
  endAt: string;
  status: NurseAvailabilityWindowStatus;
  nurseAvailabilityStatus?: AvailabilityStatus;
}
