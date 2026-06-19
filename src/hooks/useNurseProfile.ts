import { useCallback, useEffect, useState } from 'react';
import { getMyNurseProfile, updateMyNurseProfileDisplay, uploadMyAvatar } from '../api/nurseProfileApi';
import { setAvailabilityPreference } from '../api/nurseAvailabilityApi';
import type { AvailabilityStatus, NurseProfile } from '../types/nurseProfile';
import { getApiErrorMessage } from '../utils/apiError';

const emptyProfile: NurseProfile = {
  id: '',
  fullName: '',
  phone: '',
  email: '',
  avatarUrl: '',
  certifications: [],
};

export const useNurseProfile = () => {
  const [profile, setProfile] = useState<NurseProfile>(emptyProfile);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const loadProfile = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const data = await getMyNurseProfile();
      setProfile({ ...emptyProfile, ...data, certifications: data?.certifications ?? [] });
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  const saveDisplayProfile = useCallback(async (payload: { bio?: string; serviceArea?: string }) => {
    const data = await updateMyNurseProfileDisplay(payload);
    const nextProfile = { ...emptyProfile, ...data, certifications: data?.certifications ?? [] };
    setProfile(nextProfile);
    return nextProfile;
  }, []);

  const saveAvailabilityStatus = useCallback(async (status: AvailabilityStatus) => {
    const data = await setAvailabilityPreference({ status });
    const nextProfile = { ...emptyProfile, ...data, certifications: data?.certifications ?? [] };
    setProfile(nextProfile);
    return nextProfile;
  }, []);

  const uploadAvatar = useCallback(async (file: File) => {
    const avatarUrl = await uploadMyAvatar(file);
    setProfile((current) => ({ ...current, avatarUrl }));
    return avatarUrl;
  }, []);

  return {
    profile,
    setProfile,
    isLoading,
    error,
    setError,
    reload: loadProfile,
    saveDisplayProfile,
    saveAvailabilityStatus,
    uploadAvatar,
  };
};
