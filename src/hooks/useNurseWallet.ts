import { useCallback, useEffect, useState } from 'react';
import walletService from '../api/walletService';
import type { NurseWalletInfo, TopUpType } from '../types/nurseWallet';
import { getApiErrorMessage } from '../utils/apiError';

export const useNurseWallet = () => {
  const [wallet, setWallet] = useState<NurseWalletInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isProcessingTopUp, setIsProcessingTopUp] = useState(false);

  const loadWallet = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      setWallet(await walletService.getWalletInfo());
    } catch (err) {
      setError(getApiErrorMessage(err));
      setWallet(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadWallet();
  }, [loadWallet]);

  const createTopUpLink = useCallback(async (amount: number, topUpType: TopUpType = 'TOPUP_WALLET') => {
    setIsProcessingTopUp(true);
    setError('');
    try {
      const checkoutUrl = await walletService.createTopUpLink(amount, topUpType);
      if (checkoutUrl) {
        window.location.href = checkoutUrl;
      }
    } catch (err) {
      setError(getApiErrorMessage(err, 'Không thể tạo link thanh toán. Vui lòng thử lại sau.'));
    } finally {
      setIsProcessingTopUp(false);
    }
  }, []);

  return {
    wallet,
    isLoading,
    error,
    isProcessingTopUp,
    reload: loadWallet,
    createTopUpLink,
  };
};
