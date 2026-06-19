import axiosClient from './axiosClient';
import type { NurseWalletInfo, TopUpLinkResponse, TopUpType } from '../types/nurseWallet';

<<<<<<< HEAD
export interface WalletInfo {
    balance: number;
    pledgeAmount: number;
    lockedWithdrawalAmount: number;
    transactions: Array<{
        id: string;
        amount: number;
        type: 'TOPUP_WALLET' | 'TOPUP_DEPOSIT' | 'BOOKING_EARNING' | 'FEE_DEDUCTION' | 'PAYOUT';
        status: string;
        createdAt: string;
        description: string;
    }>;
}
=======
const unwrap = <T>(response: { data?: { data?: T } }) => response.data?.data as T;

const toNumber = (value: unknown) => {
  if (value === null || value === undefined) return 0;
  return Number(value);
};
>>>>>>> c784401b4f3e1c0ad07b911f7dd89f989a5ece9b

const walletService = {
  getWalletInfo: async (): Promise<NurseWalletInfo> => {
    const response = await axiosClient.get('/api/v1/wallets/me');
    const data = unwrap<NurseWalletInfo>(response);
    return {
      balance: toNumber(data?.balance),
      pledgeAmount: toNumber(data?.pledgeAmount),
      transactions: (data?.transactions ?? []).map((tx) => ({
        ...tx,
        amount: toNumber(tx.amount),
      })),
    };
  },

  createTopUpLink: async (amount: number, topUpType: TopUpType) => {
    const response = await axiosClient.post('/api/v1/payments/create-topup-link', {
      amount,
      topUpType,
    });
    const data = unwrap<TopUpLinkResponse>(response);
    return data?.checkoutUrl;
  },
};

export default walletService;
