import axiosClient from './axiosClient';
import type { NurseWalletInfo, TopUpLinkResponse, TopUpType } from '../types/nurseWallet';

const unwrap = <T>(response: { data?: { data?: T } }) => response.data?.data as T;

const toNumber = (value: unknown) => {
  if (value === null || value === undefined) return 0;
  return Number(value);
};

const walletService = {
  getWalletInfo: async (): Promise<NurseWalletInfo> => {
    const response = await axiosClient.get('/api/v1/wallets/me');
    const data = unwrap<NurseWalletInfo>(response);
    return {
      balance: toNumber(data?.balance),
      pledgeAmount: toNumber(data?.pledgeAmount),
      lockedWithdrawalAmount: toNumber(data?.lockedWithdrawalAmount),
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
