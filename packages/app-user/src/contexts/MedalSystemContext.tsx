import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  type ReactNode,
} from 'react';
import { useMedalSystem } from '@/hooks/useMedalSystem';
import { computeUserRank, type UserRank } from '@/hooks/useUserRank';
import { useAuth } from '@/hooks/useAuth';
import { checkAndUnlockMedals } from '@/services/medalCheckService';

type MedalSystemContextValue = ReturnType<typeof useMedalSystem> & { rank: UserRank };

const MedalSystemContext = createContext<MedalSystemContextValue | null>(null);

export function MedalSystemProvider({ children }: { children: ReactNode }) {
  const medalSystemValue = useMedalSystem();
  const { user } = useAuth();

  useEffect(() => {
    if (!user?.id) return;
    const userId = user.id;
    const earnedIds = medalSystemValue.medalSystem.earnedMedals
      .map(m => m.id);

    checkAndUnlockMedals(userId, earnedIds).then(newMedals => {
      if (newMedals.length > 0) {
        medalSystemValue.addEarnedMedals(newMedals);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run only when user id is set
  }, [user?.id]);

  const rank = useMemo(
    () => computeUserRank(medalSystemValue.medalSystem),
    [medalSystemValue.medalSystem]
  );

  const value = useMemo<MedalSystemContextValue>(
    () => ({ ...medalSystemValue, rank }),
    [medalSystemValue, rank]
  );

  return (
    <MedalSystemContext.Provider value={value}>
      {children}
    </MedalSystemContext.Provider>
  );
}

export function useMedalSystemContext(): MedalSystemContextValue {
  const ctx = useContext(MedalSystemContext);
  if (!ctx) {
    throw new Error(
      'useMedalSystemContext must be used within MedalSystemProvider'
    );
  }
  return ctx;
}
