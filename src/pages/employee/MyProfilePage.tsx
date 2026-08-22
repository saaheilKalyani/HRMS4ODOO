import { useEffect } from 'react';
import { useProfile } from '@/features/profile/useProfile';

export default function MyProfilePage() {
  const { profileData, loading, error, loadProfile, updateProfile } = useProfile();

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h1>My Profile</h1>
      {profileData && (
        <>
          <p>Name: {profileData.profile.display_name}</p>
          <p>Email: {profileData.profile.email}</p>
          {profileData.employee && (
            <>
              <p>Phone: {profileData.employee.phone ?? '-'}</p>
              <p>Address: {profileData.employee.address ?? '-'}</p>
              <p>
                Profile Picture: {profileData.employee.profile_picture_url ?? 'Not set'}
              </p>
            </>
          )}
        </>
      )}

      <button onClick={() => updateProfile({ phone: '9876543210' })}>
        Update Phone
      </button>
    </div>
  );
}