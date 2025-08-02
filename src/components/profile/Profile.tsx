
import { UserProfile } from './UserProfile';
import { AchievementsBoard } from './AchievementsBoard';
import { ProgressHistory } from './ProgressHistory';
import { Settings } from './Settings';

export const Profile = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-pp-gold">Il Tuo Profilo</h2>
          <p className="text-white">Monitora i tuoi progressi e risultati</p>
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
