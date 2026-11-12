import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { CoinIcon, StarIcon } from '../art/icons';
import { CustomerArt } from '../art/Customer';
import { TopBar } from '../components/TopBar';
import { Button, Panel, Stars } from '../components/ui';
import { useApp } from '../store/useApp';
import { AuthForm } from './AuthScreen';

type History = Awaited<ReturnType<typeof api.history>>;

function Stat({ label, value, icon }: { label: string; value: React.ReactNode; icon?: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-white/70 p-2 text-center" style={{ border: '3px solid #4a2c1a' }}>
      <div className="text-[11px] font-bold uppercase tracking-wide text-amber-700">{label}</div>
      <div className="flex items-center justify-center gap-1 text-2xl font-bold text-amber-900 tabular-nums">
        {icon}
        {value}
      </div>
    </div>
  );
}

export function ProfileScreen() {
  const player = useApp((s) => s.player);
  const logout = useApp((s) => s.logout);
  const [history, setHistory] = useState<History | null>(null);
  const [showRegister, setShowRegister] = useState(false);
  useEffect(() => {
    api.history().then(setHistory).catch(() => setHistory([]));
  }, []);
  if (!player) return null;
  const { user, profile } = player;
  const s = profile.stats;
  return (
    <div className="flex h-full flex-col">
      <TopBar title="Profile" back="menu" />
      <div className="scroll-area flex-1 p-3 sm:p-5">
        <div className="mx-auto grid max-w-4xl gap-4 md:grid-cols-[300px_1fr]">
          <Panel className="flex flex-col items-center p-4 text-center">
            <div className="h-[130px] w-[110px] overflow-hidden">
              <CustomerArt type="regular" look={user.username.split('').reduce((a, c) => a + c.charCodeAt(0) * 31, 0)} mood="happy" size={110} />
            </div>
            <div className="mt-1 text-2xl font-bold text-amber-900" data-testid="profile-username">{user.username}</div>
            <div className={`mt-1 rounded-full px-3 py-0.5 text-sm font-bold text-white ${user.isGuest ? 'bg-purple-500' : 'bg-green-600'}`}>{user.isGuest ? 'Guest account' : 'Registered chef'}</div>
            {user.email && <div className="mt-1 text-sm text-amber-800">{user.email}</div>}
            <div className="mt-1 text-xs text-amber-700">Chef since {new Date(user.createdAt).toLocaleDateString()}</div>
            {user.isGuest && !showRegister && (
              <Button color="green" className="mt-3 w-full" onClick={() => setShowRegister(true)}>
                Create account
              </Button>
            )}
            {user.isGuest && showRegister && (
              <div className="mt-3 w-full text-left">
                <AuthForm initialMode="register" onDone={() => setShowRegister(false)} />
              </div>
            )}
            <Button color="red" className="mt-3 w-full" onClick={() => void logout()} testId="logout-button">
              Log out
            </Button>
            {user.isGuest && <div className="mt-1 text-xs text-red-700">Logging out of a guest account cannot be undone.</div>}
          </Panel>
          <div className="flex flex-col gap-4">
            <Panel className="p-4">
              <h2 className="mb-2 text-xl font-bold text-amber-900">Statistics</h2>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                <Stat label="Coins" value={profile.coins} icon={<CoinIcon size={22} />} />
                <Stat label="Stars" value={profile.totalStars} icon={<StarIcon size={22} />} />
                <Stat label="Levels done" value={`${profile.totalLevelsCompleted}/20`} />
                <Stat label="Shifts played" value={s.totalGamesPlayed} />
                <Stat label="Coins earned" value={s.totalCoinsEarned} />
                <Stat label="Served" value={s.totalCustomersServed} />
                <Stat label="Walked out" value={s.totalCustomersLost} />
                <Stat label="Best combo" value={`×${s.bestCombo}`} />
              </div>
            </Panel>
            <Panel className="p-4">
              <h2 className="mb-2 text-xl font-bold text-amber-900">Recent shifts</h2>
              {!history && <div className="text-amber-800">Loading…</div>}
              {history?.length === 0 && <div className="text-amber-800">No shifts yet – go cook something!</div>}
              <div className="flex flex-col gap-1.5">
                {history?.map((h) => (
                  <div key={h.id} className="flex items-center gap-2 rounded-xl bg-white/70 px-3 py-1.5">
                    <span className="w-8 text-center font-bold text-orange-600">{h.levelNumber}</span>
                    <span className="flex-1 truncate font-semibold text-amber-900">{h.levelName}</span>
                    <Stars count={h.stars ?? 0} size={16} />
                    <span className="flex w-20 items-center justify-end gap-1 font-bold tabular-nums text-amber-800">
                      +{h.coinsAwarded}
                      <CoinIcon size={16} />
                    </span>
                  </div>
                ))}
              </div>
            </Panel>
          </div>
        </div>
      </div>
    </div>
  );
}
