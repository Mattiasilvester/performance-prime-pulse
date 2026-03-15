import { useMemo } from 'react';
import { useMedalSystem } from './useMedalSystem';
import type { MedalSystem } from '@/types/medalSystem';
import {
  MEDALS_PAGE_1,
  MEDALS_PAGE_2,
  MEDALS_PAGE_3,
} from '@/data/medalsConfig';

export type RankLevel = 'rookie' | 'risveglio' | 'costanza' | 'leggenda';

export interface UserRank {
  level: RankLevel;
  label: string;
  borderColor: string;
  nameColor: string;
  page1Complete: boolean;
  page2Complete: boolean;
  page3Complete: boolean;
  totalUnlocked: number;
  totalMedals: number;
}

/** Calcola il rank da medalSystem — usabile senza hook (es. nel Provider) */
export function computeUserRank(medalSystem: MedalSystem): UserRank {
  const earnedMedals = medalSystem.earnedMedals;
  const earnedIds = new Set(
    earnedMedals.map((m) =>
      m.id.startsWith('kickoff_champion') ? 'kickoff_champion' : m.id
    )
  );

  const page1Unlocked = MEDALS_PAGE_1.filter((m) => earnedIds.has(m.id)).length;
  const page2Unlocked = MEDALS_PAGE_2.filter((m) => earnedIds.has(m.id)).length;
  const page3Unlocked = MEDALS_PAGE_3.filter((m) => earnedIds.has(m.id)).length;

  const page1Complete = page1Unlocked >= MEDALS_PAGE_1.length;
  const page2Complete = page2Unlocked >= MEDALS_PAGE_2.length;
  const page3Complete = page3Unlocked >= MEDALS_PAGE_3.length;

  let level: RankLevel = 'rookie';
  let label = 'Rookie';
  let borderColor = '#9ca3af';
  let nameColor = '#F0EDE8';

  if (page3Complete) {
    level = 'leggenda';
    label = 'Leggenda';
    borderColor = '#EEBA2B';
    nameColor = '#EEBA2B';
  } else if (page1Complete && page2Complete) {
    level = 'costanza';
    label = 'Costanza';
    borderColor = '#C0C0C0';
    nameColor = '#C0C0C0';
  } else if (page1Complete) {
    level = 'risveglio';
    label = 'Risveglio';
    borderColor = '#cd7f32';
    nameColor = '#cd7f32';
  }

  return {
    level,
    label,
    borderColor,
    nameColor,
    page1Complete,
    page2Complete,
    page3Complete,
    totalUnlocked: earnedIds.size,
    totalMedals: MEDALS_PAGE_1.length + MEDALS_PAGE_2.length + MEDALS_PAGE_3.length,
  };
}

export function useUserRank(externalMedalSystem?: MedalSystem | null): UserRank {
  const { medalSystem: internalMedalSystem } = useMedalSystem();
  const medalSystem = externalMedalSystem ?? internalMedalSystem;

  return useMemo(() => computeUserRank(medalSystem), [medalSystem]);
}
