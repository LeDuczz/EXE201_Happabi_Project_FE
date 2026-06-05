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
  responseRate?: number;
  backgroundChecked?: boolean;
  featured?: boolean;
  certificationCount?: number;
  certifications?: NursePublicCertification[];
}

export interface NurseComparisonCandidate {
  profileId: string;
  fullName?: string;
  specialty?: NurseSpecialty;
  experienceYears?: number;
  city?: string;
  serviceArea?: string;
  availabilityStatus?: AvailabilityStatus;
  ratingAvg?: number;
  totalReviews?: number;
  totalCompletedJobs?: number;
  responseRate?: number;
  backgroundChecked?: boolean;
  featured?: boolean;
  verifiedCertifications?: string[];
  fitScore?: number;
  strengths?: string[];
  watchPoints?: string[];
}

export interface NurseAiComparisonRequest {
  nurseProfileIds: string[];
  careNeed?: string;
  preference?: string;
}

export interface NurseAiComparisonResponse {
  candidates?: NurseComparisonCandidate[];
  suggestedProfileId?: string;
  suggestedNurseName?: string;
  summary?: string;
  modelUsed?: string;
  resolutionSource?: string;
  aiGenerated?: boolean;
}

export interface PageResponse<T> {
  content: T[];
  number: number;
  size: number;
  totalElements: number;
  totalPages: number;
}
