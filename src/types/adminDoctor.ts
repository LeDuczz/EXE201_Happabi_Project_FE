export interface CreateDoctorAccountPayload {
  fullName: string;
  phone: string;
  email?: string;
}

export interface DoctorAccount {
  userId: string;
  fullName: string;
  phone: string;
  email?: string;
  role: 'DOCTOR';
  initialPassword: string;
}
