import React, { useMemo, useRef, useState, useEffect } from 'react';
import { useMedalSystemContext } from '@/contexts/MedalSystemContext';
import { MEDALS_CONFIG, MEDALS_PAGES } from '@/data/medalsConfig';

const TREE_URL = 'https://kfxoyucatvvcgmqalxsg.supabase.co/storage/v1/object/public/app-assets/images/tree-of-life.png';
const LAUREL_URL = 'https://kfxoyucatvvcgmqalxsg.supabase.co/storage/v1/object/public/app-assets/laurel-wreath.png';
const FIRST_STEP_ICON_URL = 'https://kfxoyucatvvcgmqalxsg.supabase.co/storage/v1/object/public/app-assets/medal-first-step.png';

const RARITY_STYLES: Record<string, { bg: string; text: string }> = {
  common: { bg: '#2C2C2A', text: '#B4B2A9' },
  rare: { bg: '#0C447C44', text: '#85B7EB' },
  epic: { bg: '#3C348944', text: '#AFA9EC' },
  legendary: { bg: '#41240244', text: '#EF9F27' },
};

export const AchievementsBoard = () => {
  const { medalSystem, rank } = useMedalSystemContext();
  const earnedIds = useMemo(() => new Set(medalSystem.earnedMedals.map((m) => (m.id.startsWith('kickoff_champion') ? 'kickoff_champion' : m.id))), [medalSystem.earnedMedals]);

  const othersUnlocked = useMemo(
    () => MEDALS_CONFIG.filter((m) => m.id !== 'prime_legend').every((m) => earnedIds.has(m.id)),
    [earnedIds]
  );
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activePage, setActivePage] = useState(0);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const handleScroll = () => {
      const width = el.clientWidth;
      const scrollLeft = el.scrollLeft;
      const page = Math.round(scrollLeft / width) || 0;
      setActivePage(Math.min(page, 2));
    };
    el.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => el.removeEventListener('scroll', handleScroll);
  }, []);

  const unlockedCount = useMemo(
    () =>
      MEDALS_CONFIG.filter(
        (m) => earnedIds.has(m.id) || (m.id === 'prime_legend' && othersUnlocked)
      ).length,
    [earnedIds, othersUnlocked]
  );

  return (
    <div
      style={{
        position: 'relative',
        borderRadius: '14px',
        overflow: 'hidden',
        minHeight: '420px',
        background: '#545454',
      }}
    >
      <img
        src={TREE_URL}
        alt=""
        aria-hidden={true}
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          opacity: 0.55,
          pointerEvents: 'none',
          zIndex: 0,
          userSelect: 'none',
        }}
      />

      <div
        style={{
          position: 'relative',
          zIndex: 10,
          padding: '24px',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <h2
            style={{
              fontSize: '22px',
              fontWeight: 700,
              color: '#EEBA2B',
              margin: '0 0 8px',
              fontFamily: 'Outfit, sans-serif',
            }}
          >
            Albo delle Medaglie
          </h2>
          <p
            style={{
              fontSize: '13px',
              color: '#ffffff',
              fontStyle: 'italic',
              lineHeight: 1.6,
              margin: '0 0 14px',
              padding: '0 8px',
              fontFamily: 'Outfit, sans-serif',
            }}
          >
            I tuoi obiettivi, i tuoi risultati.
            <br />
            Il percorso che ti porta in cima è il viaggio che ti spinge oltre i tuoi limiti.
          </p>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(0,0,0,0.4)',
              border: '1px solid rgba(238,186,43,0.4)',
              borderRadius: '20px',
              padding: '5px 14px',
            }}
          >
            <div
              style={{
                width: '6px',
                height: '6px',
                background: '#EEBA2B',
                borderRadius: '50%',
              }}
            />
            <span style={{ fontSize: '12px', color: '#EEBA2B', fontWeight: 600 }}>
              {unlockedCount} / {MEDALS_CONFIG.length} medaglie sbloccate
            </span>
          </div>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              marginTop: '8px',
              padding: '4px 12px',
              borderRadius: '20px',
              background: 'rgba(0,0,0,0.3)',
              border: `1px solid ${rank.borderColor}`,
            }}
          >
            <div
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: rank.borderColor,
              }}
            />
            <span
              style={{
                fontSize: '11px',
                fontWeight: 700,
                color: rank.nameColor,
                letterSpacing: '0.5px',
                textTransform: 'uppercase',
              }}
            >
              {rank.label}
            </span>
          </div>
        </div>

        <style>{`
          .medals-scroll::-webkit-scrollbar { display: none; }
        `}</style>
        <div
          ref={scrollRef}
          className="medals-scroll"
          style={{
            display: 'flex',
            overflowX: 'scroll',
            scrollSnapType: 'x mandatory',
            scrollBehavior: 'smooth',
            WebkitOverflowScrolling: 'touch',
            msOverflowStyle: 'none',
            scrollbarWidth: 'none',
            width: '100%',
          }}
        >
          {MEDALS_PAGES.map((pageMedals, pageIndex) => (
            <div
              key={pageIndex}
              style={{
                scrollSnapAlign: 'start',
                scrollSnapStop: 'always',
                flexShrink: 0,
                width: '100%',
                minWidth: '100%',
                boxSizing: 'border-box',
                padding: '0 2px',
                display: 'grid',
                gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
                gap: '10px',
              }}
            >
              {pageMedals.map((medal) => {
                const unlocked =
                  earnedIds.has(medal.id) || (medal.id === 'prime_legend' && othersUnlocked);
                return <MedalCard key={medal.id} medal={medal} unlocked={unlocked} />;
              })}
            </div>
          ))}
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '8px',
            marginTop: '16px',
          }}
        >
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: activePage === i ? '#EEBA2B' : '#444',
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

function MedalCard({
  medal,
  unlocked,
}: {
  medal: (typeof MEDALS_CONFIG)[0];
  unlocked: boolean;
}) {
  const rarityStyle = RARITY_STYLES[medal.rarity] || RARITY_STYLES.common;
  return (
    <div
      className="relative rounded-[14px] p-3 flex flex-col items-center justify-center min-h-[140px]"
      style={{
        background: '#16161A',
        border: unlocked ? '1.5px solid #EEBA2B44' : '1px solid rgba(255,255,255,0.06)',
        overflow: 'visible',
      }}
    >
      {unlocked ? (
        <div
          className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold"
          style={{ background: '#EEBA2B', color: '#0A0A0C' }}
        >
          ✓
        </div>
      ) : (
        <div className="absolute top-2 right-2 text-lg">🔒</div>
      )}

      <div
        style={{
          position: 'relative',
          width: '80px',
          height: '80px',
          margin: '0 auto 10px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <img
          src={LAUREL_URL}
          alt=""
          aria-hidden={true}
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -45%)',
            width: '110px',
            height: '110px',
            objectFit: 'contain',
            zIndex: 2,
            opacity: unlocked ? 1 : 0.2,
            pointerEvents: 'none',
          }}
        />
        <div
          style={{
            position: 'relative',
            zIndex: 1,
            width: '68px',
            height: '68px',
            borderRadius: '50%',
            background: unlocked ? '#F5F0E8' : '#2a2a2a',
            border: unlocked ? 'none' : '1px solid #555',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '30px',
            opacity: unlocked ? 1 : 0.5,
          }}
        >
          {medal.id === 'first_step' ? (
            <img
              src={FIRST_STEP_ICON_URL}
              alt="First Step"
              style={{
                width: '52px',
                height: '52px',
                objectFit: 'contain',
                filter: unlocked ? 'none' : 'grayscale(1)',
                opacity: unlocked ? 1 : 0.5,
              }}
            />
          ) : (
            <span style={{ fontSize: '26px', lineHeight: 1 }}>
              {medal.icon}
            </span>
          )}
        </div>
      </div>

      <span className="text-[10px] font-bold text-center leading-tight mb-0.5" style={{ color: unlocked ? '#EEBA2B' : '#555555' }}>
        {medal.name}
      </span>
      <span className="text-[9px] text-center leading-tight mb-2" style={{ color: unlocked ? '#8A8A96' : '#555555' }}>
        {medal.description}
      </span>
      <span
        className="text-[9px] px-2 py-0.5 rounded font-medium"
        style={{ background: rarityStyle.bg, color: rarityStyle.text }}
      >
        {medal.rarity}
      </span>
    </div>
  );
}
