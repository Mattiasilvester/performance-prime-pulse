import { useMedalSystemContext } from '@/contexts/MedalSystemContext';
import { useUserProfileContext } from '@/contexts/UserProfileContext';

interface ProfileAvatarProps {
  size?: number;
  showShimmer?: boolean;
}

export function ProfileAvatar({ size = 36, showShimmer = true }: ProfileAvatarProps) {
  const { rank } = useMedalSystemContext();
  const { profile } = useUserProfileContext();

  const displayAvatar =
    profile?.avatarUrl &&
    (profile.avatarUrl.startsWith('http') || profile.avatarUrl.startsWith('data:image/'))
      ? profile.avatarUrl
      : null;

  const initial =
    (profile?.name?.[0] || '') + (profile?.surname?.[0] || '') || '?';
  const innerSize = size - 8;

  return (
    <>
      <style>{`
        @keyframes rankSpin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
      <div
        style={{
          position: 'relative',
          width: `${size}px`,
          height: `${size}px`,
          borderRadius: '50%',
          padding: '3px',
          background: rank.level === 'rookie' ? '#3a3a3a' : rank.borderColor,
          boxSizing: 'border-box',
          flexShrink: 0,
        }}
      >
        {showShimmer && rank.level !== 'rookie' && (
          <div
            style={{
              position: 'absolute',
              inset: '-2px',
              borderRadius: '50%',
              background: `conic-gradient(
                ${rank.borderColor} 0deg,
                ${rank.borderColor}44 90deg,
                transparent 120deg,
                ${rank.borderColor}44 200deg,
                ${rank.borderColor} 280deg,
                ${rank.borderColor}44 320deg,
                ${rank.borderColor} 360deg
              )`,
              animation: 'rankSpin 2s linear infinite',
              zIndex: 0,
            }}
          />
        )}
        <div
          style={{
            position: 'relative',
            zIndex: 1,
            width: '100%',
            height: '100%',
            borderRadius: '50%',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            outline: '2px solid #0A0A0C',
            background: displayAvatar
              ? 'transparent'
              : 'linear-gradient(135deg, #EEBA2B 0%, #C99A1E 100%)',
          }}
        >
          {displayAvatar ? (
            <img
              src={displayAvatar}
              alt="Profilo"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
            />
          ) : (
            <span
              style={{
                fontSize: `${innerSize * 0.4}px`,
                fontWeight: 700,
                color: '#0A0A0C',
              }}
            >
              {initial}
            </span>
          )}
        </div>
      </div>
    </>
  );
}
