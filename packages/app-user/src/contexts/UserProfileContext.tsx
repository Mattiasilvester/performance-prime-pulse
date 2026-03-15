import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import { fetchUserProfile, type UserProfile } from '@/services/userService';
import { useAuth } from '@/hooks/useAuth';

// Cache globale condiviso per evitare flash su remount (es. refresh)
let profileCache: { profile: UserProfile | null; timestamp: number } | null = null;
const CACHE_DURATION = 30000;

interface UserProfileContextValue {
  profile: UserProfile | null;
  profileImage: string | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

const UserProfileContext = createContext<UserProfileContextValue>({
  profile: null,
  profileImage: null,
  loading: false,
  error: null,
  refetch: async () => {},
});

export function UserProfileProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();

  const [profile, setProfile] = useState<UserProfile | null>(() => {
    if (profileCache && Date.now() - profileCache.timestamp < CACHE_DURATION) {
      return profileCache.profile;
    }
    return null;
  });
  const [profileImage, setProfileImage] = useState<string | null>(() =>
    typeof localStorage !== 'undefined' ? localStorage.getItem('pp_profile_image') : null
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadProfile = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const profileData = await fetchUserProfile();
      profileCache = { profile: profileData, timestamp: Date.now() };
      setProfile(profileData);
      const savedImage = localStorage.getItem('pp_profile_image');
      if (savedImage) setProfileImage(savedImage);
    } catch {
      setError('Errore nel caricamento del profilo');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      if (profileCache && Date.now() - profileCache.timestamp < CACHE_DURATION) {
        setProfile(profileCache.profile);
      } else {
        loadProfile();
      }
    } else {
      profileCache = null;
      setProfile(null);
      setProfileImage(null);
    }
  }, [user, loadProfile]);

  return (
    <UserProfileContext.Provider
      value={{
        profile,
        profileImage,
        loading,
        error,
        refetch: loadProfile,
      }}
    >
      {children}
    </UserProfileContext.Provider>
  );
}

export function useUserProfileContext() {
  return useContext(UserProfileContext);
}
