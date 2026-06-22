export type NurseStatus =
  | 'PENDING_SUBMIT'
  | 'PENDING_REVIEW'
  | 'REJECTED'
  | 'APPROVED_PENDING_CONTRACT'
  | 'PENDING_DEPOSIT'
  | 'ACTIVE'
  | 'SUSPENDED';

export type NurseSpecialty = 'NURSE' | 'MIDWIFE' | 'CAREGIVER';

export type NurseSkillCode =
  | 'POSTPARTUM_RECOVERY_MASSAGE'
  | 'PRENATAL_RELAXATION_MASSAGE'
  | 'FOOT_PAIN_RELIEF_MASSAGE'
  | 'POSTPARTUM_BACK_SHOULDER_NECK_MASSAGE'
  | 'LACTATION_STIMULATION'
  | 'BLOCKED_MILK_DUCT_SUPPORT'
  | 'BREAST_CARE'
  | 'BREASTFEEDING_POSITION_GUIDANCE'
  | 'POSTPARTUM_HEALTH_MONITORING'
  | 'NEWBORN_BATHING'
  | 'NEWBORN_BASIC_CARE'
  | 'NEWBORN_HEALTH_MONITORING'
  | 'NEWBORN_SKIN_CARE'
  | 'HOME_NEWBORN_CARE_GUIDANCE'
  | 'NEWBORN_WARNING_SIGN_RECOGNITION'
  | 'PARENT_COMMUNICATION'
  | 'MOTHER_BABY_CONSULTING'
  | 'SITUATION_HANDLING'
  | 'CUSTOMER_CARE'
  | 'SCHEDULE_MANAGEMENT';

export interface NurseSkill {
  skill: NurseSkillCode;
  label?: string;
  groupName?: string;
  verified?: boolean;
  verifiedAt?: string;
}

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
  skills?: NurseSkill[];
  latestContract?: NurseContract;
}
