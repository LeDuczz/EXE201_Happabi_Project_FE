import { useCallback, useEffect, useState } from 'react';
import { getNurseDashboard } from '../api/nurseDashboardApi';
import type { NurseDashboard } from '../types/nurseDashboard';
import { getApiErrorMessage } from '../utils/apiError';

export const useNurseDashboard = () => {
  const [dashboard, setDashboard] = useState<NurseDashboard | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const loadDashboard = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      setDashboard(await getNurseDashboard());
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  return { dashboard, isLoading, error, reload: loadDashboard };
};
