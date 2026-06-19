export type WalletTransactionType =
  | 'TOPUP'
  | 'TOPUP_WALLET'
  | 'TOPUP_DEPOSIT'
  | 'COMMISSION'
  | 'FEE_DEDUCTION'
  | 'WITHDRAW'
  | 'PAYOUT'
  | 'BOOKING_EARNING';

export interface WalletTransaction {
  id: string;
  amount: number;
  type: WalletTransactionType;
  status: string;
  createdAt: string;
  description: string;
}

export interface NurseWalletInfo {
  balance: number;
  pledgeAmount: number;
  lockedWithdrawalAmount: number;
  transactions: WalletTransaction[];
}

export type TopUpType = 'TOPUP_WALLET' | 'TOPUP_DEPOSIT';

export interface TopUpLinkResponse {
  checkoutUrl: string;
}
