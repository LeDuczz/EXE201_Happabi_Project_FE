export interface WalletResponse {
    balance: number;
    pledgeBalance: number;
}

export interface Transaction {
    id: string;
    type: 'TOP_UP' | 'FEE' | 'REFUND';
    amount: number;
    status: 'PENDING' | 'SUCCESS' | 'FAILED';
    createdAt: string;
    description: string;
}

import axiosClient from './axiosClient';

const walletService = {
    getWallet: () => axiosClient.get('/api/v1/nurses/me/wallet'),
    getTransactions: () => axiosClient.get('/api/v1/nurses/me/wallet/transactions'),
    createTopUpLink: (amount: number, type: string) =>
        axiosClient.post('/api/v1/nurses/me/wallet/top-up', { amount, topUpType: type }),
    checkEligibility: (bookingAmount: number) =>
        axiosClient.get(`/api/v1/nurses/me/wallet/check-eligibility?amount=${bookingAmount}`),
};

export default walletService;
