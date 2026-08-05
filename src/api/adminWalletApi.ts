import axiosClient from './axiosClient';

export type AdminWalletTransactionType =
  | 'BOOKING_PAYMENT_RECEIVED'
  | 'PAYMENT_GATEWAY_FEE'
  | 'NURSE_PAYOUT'
  | 'BOOKING_REFUND'
  | 'WITHDRAWAL_PAYOUT';

export interface AdminWalletTransaction {
  id: string;
  bookingId: string;
  booking?: {
    id: string;
    bookingKey: string;
    motherName?: string;
    nurseName?: string;
    serviceName?: string;
  };
  transactionType: AdminWalletTransactionType;
  amount: number;
  walletImpact: number;
  balanceAfter: number;
  status: string;
  description?: string;
  createdAt?: string;
}

export interface AdminWalletTransactionPage {
  content: AdminWalletTransaction[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export interface AdminWallet {
  walletId: string;
  balance: number;
  updatedAt?: string;
  transactions: AdminWalletTransactionPage;
}

export interface AdminWalletFilters {
  transactionType?: AdminWalletTransactionType | '';
  direction?: 'IN' | 'OUT' | '';
  fromDate?: string;
  toDate?: string;
}

export const getAdminWallet = async (page = 0, size = 20, filters: AdminWalletFilters = {}) => {
  const response = await axiosClient.get('/api/v1/admin/wallet', {
    params: {
      page,
      size,
      transactionType: filters.transactionType || undefined,
      direction: filters.direction || undefined,
      fromDate: filters.fromDate || undefined,
      toDate: filters.toDate || undefined,
    },
  });
  return response.data?.data as AdminWallet;
};
