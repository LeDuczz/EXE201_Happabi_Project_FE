import axiosClient from './axiosClient';
import type {
  CccdOcrExtraction,
  NurseCertification,
  NurseOnboarding,
  NurseSkillCode,
  NurseSpecialty,
} from '../types/nurseOnboarding';

const unwrap = <T>(response: { data?: { data?: T } }) => response.data?.data as T;
const MAX_UPLOAD_SIZE_BYTES = 5 * 1024 * 1024;

const assertFileSize = (file?: File | null) => {
  if (file && file.size > MAX_UPLOAD_SIZE_BYTES) {
    throw new Error('File tải lên quá lớn. Vui lòng chọn file nhỏ hơn 5MB mỗi file.');
  }
};

export interface UpdateNurseProfilePayload {
  licenseNumber?: string;
  dateOfBirth?: string;
  specialty?: NurseSpecialty;
  experienceYears?: number | null;
  bio?: string;
  serviceArea?: string;
  address?: string;
  city?: string;
  skills?: NurseSkillCode[];
}

export interface UpdateNurseKycPayload {
  cccdNumber: string;
  cccdName: string;
  cccdDob: string;
  cccdAddress: string;
  frontImage?: File | null;
  backImage?: File | null;
}

export interface CreateNurseCertificationPayload {
  certName?: string;
  issuedBy?: string;
  issuedDate?: string;
  expiryDate?: string;
  document: File;
}

export interface SignNurseContractPayload {
  agreed: boolean;
  signedName: string;
}

export const getMyOnboarding = async () => {
  const response = await axiosClient.get('/api/v1/nurses/me/onboarding');
  return unwrap<NurseOnboarding>(response);
};

export const updateMyOnboardingProfile = async (payload: UpdateNurseProfilePayload) => {
  const response = await axiosClient.patch('/api/v1/nurses/me/onboarding/profile', payload);
  return unwrap<NurseOnboarding>(response);
};

export const updateMyOnboardingKyc = async (payload: UpdateNurseKycPayload) => {
  assertFileSize(payload.frontImage);
  assertFileSize(payload.backImage);
  const formData = new FormData();
  formData.append('cccdNumber', payload.cccdNumber);
  formData.append('cccdName', payload.cccdName);
  formData.append('cccdDob', payload.cccdDob);
  formData.append('cccdAddress', payload.cccdAddress);
  if (payload.frontImage) formData.append('frontImage', payload.frontImage);
  if (payload.backImage) formData.append('backImage', payload.backImage);

  const response = await axiosClient.post('/api/v1/nurses/me/onboarding/kyc', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return unwrap<NurseOnboarding>(response);
};

export const addMyCertification = async (payload: CreateNurseCertificationPayload) => {
  assertFileSize(payload.document);
  const formData = new FormData();
  if (payload.certName) formData.append('certName', payload.certName);
  if (payload.issuedBy) formData.append('issuedBy', payload.issuedBy);
  if (payload.issuedDate) formData.append('issuedDate', payload.issuedDate);
  if (payload.expiryDate) formData.append('expiryDate', payload.expiryDate);
  formData.append('document', payload.document);

  const response = await axiosClient.post('/api/v1/nurses/me/onboarding/certifications', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return unwrap<NurseCertification>(response);
};

export const submitMyOnboarding = async () => {
  const response = await axiosClient.post('/api/v1/nurses/me/onboarding/submit');
  return unwrap<NurseOnboarding>(response);
};

export const signMyContract = async (payload: SignNurseContractPayload) => {
  const response = await axiosClient.post('/api/v1/nurses/me/onboarding/contract/sign', payload);
  return unwrap<NurseOnboarding>(response);
};

export const createNurseDepositPaymentLink = async () => {
  const response = await axiosClient.post('/api/v1/payments/nurse-deposit-link');
  return unwrap<{ checkoutUrl: string }>(response);
};

export type { CccdOcrExtraction };
