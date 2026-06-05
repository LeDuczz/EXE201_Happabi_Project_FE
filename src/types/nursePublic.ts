import type { AvailabilityStatus } from './nurseProfile';
import type { NurseSpecialty } from './nurseOnboarding';

export interface NursePublicCertification {
  id: string;
  certName?: string;
  issuedBy?: string;
  issuedDate?: string;
  expiryDate?: string;
}

export interface NursePublicProfile {
  profileId: string;
  fullName?: string;
  avatarUrl?: string;
  specialty?: NurseSpecialty;
  experienceYears?: number;
  bio?: string;
  serviceArea?: string;
  city?: string;
  availabilityStatus?: AvailabilityStatus;
  ratingAvg?: number;
  totalReviews?: number;
  totalCompletedJobs?: number;
  backgroundChecked?: boolean;
  featured?: boolean;
  certificationCount?: number;
  certifications?: NursePublicCertification[];
}

export interface PageResponse<T> {
  content: T[];
  number: number;
  size: number;
  totalElements: number;
  totalPages: number;
}
