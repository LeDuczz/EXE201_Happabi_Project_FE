import axiosClient from './axiosClient';

export interface WalletInfo {
    balance: number;
    pledgeAmount: number;
    transactions: Array<{
        id: string;
        amount: number;
        type: 'TOPUP' | 'COMMISSION' | 'WITHDRAW';
        status: string;
        createdAt: string;
        description: string;
    }>;
}

const walletService = {
    getWalletInfo: () => axiosClient.get('/api/v1/wallets/me'),

    createTopUpLink: (amount: number, topUpType: string) =>
        axiosClient.post('/api/v1/payments/create-topup-link', { amount, topUpType }),
};

export default walletService;
