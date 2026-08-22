import { useCallback, useState } from 'react';
import {
  getMyProfile,
  updateMyProfile,
  type GetMyProfileResult,
  type UpdateMyProfileInput,
} from './profile.service';
import type { Employee } from '@/types';

export function useProfile() {
  const [profileData, setProfileData] = useState<GetMyProfileResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadProfile = useCallback(async () => {
    setLoading(true);
    setError(null);
    const result = await getMyProfile();
    if (result.error) {
      setError(result.error.message);
      setProfileData(null);
    } else {
      setProfileData(result.data);
    }
    setLoading(false);
  }, []);

  const updateProfile = useCallback(
    async (input: UpdateMyProfileInput): Promise<Employee | null> => {
      setLoading(true);
      setError(null);
      const result = await updateMyProfile(input);
      if (result.error) {
        setError(result.error.message);
        setLoading(false);
        return null;
      }
      // Optionally reload profile to reflect changes
      await loadProfile();
      setLoading(false);
      return result.data as Employee;
    },
    [loadProfile]
  );

  return { profileData, loading, error, loadProfile, updateProfile };
}