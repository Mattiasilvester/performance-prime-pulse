import { useLayoutEffect, useState } from 'react';
import { UserProfile } from './UserProfile';
import { AchievementsBoard } from './AchievementsBoard';
import { ProgressHistory } from './ProgressHistory';
import { Settings } from './Settings';

export const Profile = () => {
  const [isReady, setIsReady] = useState(() => {
    return !sessionStorage.getItem('settingsScrollPosition');
  });

  useLayoutEffect(() => {
    const savedPosition = sessionStorage.getItem('settingsScrollPosition');
    if (savedPosition) {
      const y = parseInt(savedPosition, 10);
      history.scrollRestoration = 'manual';
      const html = document.documentElement;
      const body = document.body;
      const prevScrollBehavior = html.style.scrollBehavior;
      html.style.scrollBehavior = 'auto';
      window.scrollTo(0, y);
      html.scrollTop = y;
      body.scrollTop = y;
      html.style.scrollBehavior = prevScrollBehavior;
      sessionStorage.removeItem('settingsScrollPosition');
      requestAnimationFrame(() => {
        setIsReady(true);
      });
    }
  }, []);

  return (
    <div
      className="flex flex-col gap-6 px-5 pb-6 bg-background min-h-screen"
      style={{
        visibility: isReady ? 'visible' : 'hidden',
        transition: 'none',
      }}
    >
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[#F0EDE8]">Il Tuo Profilo</h2>
          <p className="text-[13px] text-[#8A8A96]">Monitora i tuoi progressi e risultati</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <UserProfile />
          <AchievementsBoard />
          <ProgressHistory />
        </div>
        <div>
          <Settings />
        </div>
      </div>
    </div>
  );
};
