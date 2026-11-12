import { StarIcon, UserIcon } from '../art/icons';
import { useApp, type Screen } from '../store/useApp';
import { Button, CoinBadge } from './ui';

/** Header for menu screens: back button, title, coins & stars. */
export function TopBar({ title, back }: { title?: string; back?: Screen }) {
  const player = useApp((s) => s.player);
  const go = useApp((s) => s.go);
  return (
    <div className="relative z-10 flex items-center gap-2 px-3 pt-3 sm:px-5">
      {back ? (
        <Button color="cream" size="sm" onClick={() => go(back)} testId="back-button">
          ◀ Back
        </Button>
      ) : (
        <button className="btn-3d flex items-center gap-2 rounded-xl bg-amber-50 px-2 py-1 font-bold text-amber-900" onClick={() => go('profile')}>
          <UserIcon size={26} />
          <span className="max-w-[120px] truncate">{player?.user.username}</span>
        </button>
      )}
      {title && <h1 className="text-outline text-shadow-pop flex-1 truncate text-center text-2xl font-bold text-white sm:text-4xl">{title}</h1>}
      {!title && <div className="flex-1" />}
      {player && (
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xl font-bold text-amber-800" style={{ border: '3px solid #4a2c1a', boxShadow: '0 3px 0 rgba(74,44,26,0.4)' }}>
            <StarIcon size={24} />
            <span className="tabular-nums">{player.profile.totalStars}</span>
          </div>
          <CoinBadge amount={player.profile.coins} />
        </div>
      )}
    </div>
  );
}
