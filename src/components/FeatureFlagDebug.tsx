import { useFeatureFlag } from '@/hooks/useFeatureFlag';
import { FEATURES } from '@/config/features';

export function FeatureFlagDebug() {
  const { useNewLanding } = useFeatureFlag();
  const showNewLanding = useNewLanding();

  if (import.meta.env.PROD) return null;

  return (
    <div className="fixed bottom-4 right-4 bg-black/80 text-white p-4 rounded-lg text-xs z-50 backdrop-blur-sm border border-white/20">
      <div className="font-bold mb-2">Feature Flags Debug</div>
      <div>New Landing: {showNewLanding ? '✅' : '❌'}</div>
      <div>Enabled: {FEATURES.NEW_LANDING.enabled ? 'Yes' : 'No'}</div>
      <div>Percentage: {FEATURES.NEW_LANDING.percentage}%</div>
      <div className="mt-2 space-y-1">
        <a 
          href="/?force-new-landing=true" 
          className="text-[#FFD700] underline block hover:text-[#FFD700]/80"
        >
          Force New Landing
        </a>
        <a 
          href="/?force-old-landing=true" 
          className="text-[#FFD700] underline block hover:text-[#FFD700]/80"
        >
          Force Old Landing
        </a>
      </div>
    </div>
  );
}







