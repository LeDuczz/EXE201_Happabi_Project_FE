import axiosClient from './axiosClient';

export type WithdrawalStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';

export interface WithdrawalRequest {
  id: string;
  nurseProfileId: string;
  bankAccountId?: string;
  nurseName: string;
  amount: number;
  bankName: string;
  bankAccountNumber: string;
  bankAccountHolder: string;
  status: WithdrawalStatus;
  adminNote?: string;
  bankTransactionCode?: string;
  transferEvidenceUrl?: string;
  processedByAdminName?: string;
  createdAt: string;
  updatedAt?: string;
  approvedAt?: string;
  rejectedAt?: string;
  cancelledAt?: string;
}

interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export const withdrawalApi = {
  getMyBankAccount: async () => {
    const response = await axiosClient.get('/api/v1/nurses/me/bank-account');
    return response.data?.data as {
      id: string;
      nurseProfileId: string;
      bankName: string;
      bankAccountNumber: string;
      bankAccountHolder: string;
      status: 'ACTIVE' | 'INACTIVE';
      createdAt?: string;
      updatedAt?: string;
    } | null;
  },

  saveMyBankAccount: (payload: {
    bankName: string;
    bankAccountNumber: string;
    bankAccountHolder: string;
  }) => axiosClient.put('/api/v1/nurses/me/bank-account', payload),

  createMyRequest: (payload: {
    amount: number;
  }) => axiosClient.post('/api/v1/nurses/me/withdrawal-requests', payload),

  getMyRequests: async () => {
    const response = await axiosClient.get('/api/v1/nurses/me/withdrawal-requests', {
      params: { page: 0, size: 5 },
    });
    return response.data?.data as PageResponse<WithdrawalRequest>;
  },

  cancelMyRequest: (requestId: string) =>
    axiosClient.delete(`/api/v1/nurses/me/withdrawal-requests/${requestId}`),

  getAdminRequests: async (status?: WithdrawalStatus) => {
    const response = await axiosClient.get('/api/v1/admin/withdrawal-requests', {
      params: { page: 0, size: 20, status: status || undefined },
    });
    return response.data?.data as PageResponse<WithdrawalRequest>;
  },

  approve: (requestId: string, payload: {
    bankTransactionCode?: string;
    adminNote?: string;
    evidence?: File | null;
  }) => {
    const formData = new FormData();
    if (payload.bankTransactionCode) formData.append('bankTransactionCode', payload.bankTransactionCode);
    if (payload.adminNote) formData.append('adminNote', payload.adminNote);
    if (payload.evidence) formData.append('evidence', payload.evidence);
    return axiosClient.post(`/api/v1/admin/withdrawal-requests/${requestId}/approve`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  reject: (requestId: string, adminNote: string) =>
    axiosClient.post(`/api/v1/admin/withdrawal-requests/${requestId}/reject`, { adminNote }),
};
