import axiosClient from './axiosClient';

export type AdminWalletTransactionType = 'BOOKING_PAYMENT_RECEIVED' | 'NURSE_PAYOUT';

export interface AdminWalletTransaction {
  id: string;
  bookingId: string;
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

export const getAdminWallet = async (page = 0, size = 20) => {
  const response = await axiosClient.get('/api/v1/admin/wallet', {
    params: { page, size },
  });
  return response.data?.data as AdminWallet;
};
