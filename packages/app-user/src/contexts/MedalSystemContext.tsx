import {
  createContext,
  useContext,
  useMemo,
  type ReactNode,
} from 'react';
import { useMedalSystem } from '@/hooks/useMedalSystem';
import { computeUserRank, type UserRank } from '@/hooks/useUserRank';

type MedalSystemContextValue = ReturnType<typeof useMedalSystem> & { rank: UserRank };

const MedalSystemContext = createContext<MedalSystemContextValue | null>(null);

export function MedalSystemProvider({ children }: { children: ReactNode }) {
  const medalSystemValue = useMedalSystem();
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
