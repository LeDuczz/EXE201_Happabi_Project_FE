import { useCallback, useEffect, useState } from 'react';
import workSessionApi from '../api/workSessionApi';
import type { WorkSession } from '../types/workSession';
import { getApiErrorMessage } from '../utils/apiError';

export const useNurseWorkSessions = () => {
  const [sessions, setSessions] = useState<WorkSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const loadSessions = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      setSessions(await workSessionApi.getNurseSessions());
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadSessions();
  }, [loadSessions]);

  return { sessions, isLoading, error, reload: loadSessions };
};

export const useNurseWorkSession = (workSessionId?: string) => {
  const [session, setSession] = useState<WorkSession | null>(null);
  const [isLoading, setIsLoading] = useState(Boolean(workSessionId));
  const [error, setError] = useState('');

  const loadSession = useCallback(async () => {
    if (!workSessionId) return;
    setIsLoading(true);
    setError('');
    try {
      setSession(await workSessionApi.getNurseSession(workSessionId));
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, [workSessionId]);

  useEffect(() => {
    void loadSession();
  }, [loadSession]);

  return { session, setSession, isLoading, error, reload: loadSession };
};
