export type NurseStatus =
  | 'PENDING_SUBMIT'
  | 'PENDING_REVIEW'
  | 'REJECTED'
  | 'APPROVED_PENDING_CONTRACT'
  | 'ACTIVE'
  | 'SUSPENDED';

export type NurseSpecialty = 'NURSE' | 'MIDWIFE' | 'CAREGIVER';

export interface CccdOcrExtraction {
  cccdNumber?: string;
  cccdName?: string;
  cccdDob?: string;
  cccdAddress?: string;
  confidence?: number;
  requiresManualReview?: boolean;
  warnings?: string[];
}

export interface NurseKyc {
  id?: string;
  cccdNumber?: string;
  cccdName?: string;
  cccdDob?: string;
  cccdAddress?: string;
  hasFrontImage?: boolean;
  hasBackImage?: boolean;
  ekycStatus?: 'PENDING' | 'PASSED' | 'REVIEW_NEEDED' | 'FAILED';
  reviewNote?: string;
  reviewedAt?: string;
}

export interface NurseCertification {
  id: string;
  certName?: string;
  issuedBy?: string;
  issuedDate?: string;
  expiryDate?: string;
  hasDocument?: boolean;
  verified?: boolean;
  verifiedAt?: string;
}

export interface NurseContract {
  id?: string;
  contractVersion?: string;
  status?: 'PENDING' | 'SIGNED' | 'CANCELLED';
  signedName?: string;
  signedAt?: string;
}

export interface NurseOnboarding {
  profileId?: string;
  userId?: string;
  fullName?: string;
  phone?: string;
  email?: string;
  licenseNumber?: string;
  dateOfBirth?: string;
  specialty?: NurseSpecialty;
  experienceYears?: number;
  bio?: string;
  serviceArea?: string;
  address?: string;
  city?: string;
  nurseStatus?: NurseStatus;
  rejectionReason?: string;
  lastStatusChangedAt?: string;
  profileCompleted?: boolean;
  kycCompleted?: boolean;
  certificationsCompleted?: boolean;
  certificationCount?: number;
  contractSigned?: boolean;
  kyc?: NurseKyc;
  certifications?: NurseCertification[];
  latestContract?: NurseContract;
}
