import { LockIcon, StarIcon } from '../art/icons';
import { TopBar } from '../components/TopBar';
import { Button } from '../components/ui';
import { useApp } from '../store/useApp';

export function RestaurantSelect() {
  const player = useApp((s) => s.player);
  const go = useApp((s) => s.go);
  if (!player) return null;
  return (
    <div className="flex h-full flex-col">
      <TopBar title="Restaurants" back="menu" />
      <div className="scroll-area flex flex-1 flex-wrap content-start items-start justify-center gap-5 p-4 lg:content-center">
        {player.restaurants.map(({ restaurant: r, unlocked, stars, levels }) => {
          const playable = r.playable && unlocked;
          const maxStars = levels.length * 3;
          return (
            <div key={r.id} className="panel relative w-[290px] overflow-hidden rounded-[28px]" data-testid={`restaurant-${r.id}`}>
              <div className="relative flex h-36 items-center justify-center" style={{ background: `linear-gradient(160deg, ${r.theme.secondary}, ${r.theme.primary})`, filter: playable ? undefined : 'grayscale(0.75)' }}>
                <div className="text-[84px] drop-shadow-lg">{r.theme.emoji}</div>
                {!playable && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/45 text-white">
                    <LockIcon size={40} />
                    <div className="mt-1 rounded-full bg-black/50 px-3 py-0.5 text-sm font-bold uppercase tracking-wider">{r.playable ? `Needs ${r.unlockRequirement} ★` : 'In development'}</div>
                  </div>
                )}
              </div>
              <div className="p-4">
                <h2 className="text-2xl font-bold text-amber-900">{r.name}</h2>
                <p className="mt-1 min-h-[48px] text-[15px] text-amber-800">{r.description}</p>
                {playable ? (
                  <>
                    <div className="mt-2 flex items-center gap-1 font-bold text-amber-800">
                      <StarIcon size={22} /> {stars} / {maxStars}
                      <span className="ml-auto text-sm">{levels.filter((l) => l.completed).length}/{levels.length} levels</span>
                    </div>
                    <div className="mt-1 h-3 overflow-hidden rounded-full bg-amber-200" style={{ border: '2px solid #4a2c1a' }}>
                      <div className="h-full bg-yellow-400" style={{ width: `${(stars / Math.max(1, maxStars)) * 100}%` }} />
                    </div>
                    <Button color="green" className="mt-3 w-full" onClick={() => go('levels')} testId="restaurant-play">
                      Open diner
                    </Button>
                  </>
                ) : (
                  <div className="mt-3 rounded-xl bg-slate-200 px-3 py-2 text-center text-sm font-semibold text-slate-600">Coming in a future update – not playable yet.</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
