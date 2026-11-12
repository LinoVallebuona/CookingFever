import { motion } from 'framer-motion';
import { useState } from 'react';
import { Logo } from '../components/Logo';
import { TopBar } from '../components/TopBar';
import { Button, Modal, Panel } from '../components/ui';
import { useApp } from '../store/useApp';
import { AuthForm } from './AuthScreen';

export function MainMenu() {
  const go = useApp((s) => s.go);
  const player = useApp((s) => s.player);
  const [registerOpen, setRegisterOpen] = useState(false);
  const diner = player?.restaurants.find((r) => r.restaurant.id === 'diner');
  const nextLevel = diner?.levels.find((l) => l.unlocked && !l.completed)?.levelNumber ?? diner?.levels.filter((l) => l.unlocked).at(-1)?.levelNumber ?? 1;

  return (
    <div className="flex h-full flex-col">
      <TopBar />
      <div className="scroll-area flex-1">
        <div className="flex min-h-full flex-col items-center justify-center gap-5 p-4 [@media(max-height:520px)]:gap-2 [@media(max-height:520px)]:py-2">
        <Logo />
        <motion.div initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 260, damping: 18, delay: 0.1 }}>
          <Button color="green" size="xl" onClick={() => go('levels')} testId="play-button" className="min-w-[260px] [@media(max-height:520px)]:py-2">
            ▶ Play
          </Button>
          <div className="mt-1 text-center font-semibold text-white/90">Sunny&apos;s Diner · Level {nextLevel}</div>
        </motion.div>
        <div className="grid w-full max-w-xl grid-cols-2 gap-3 sm:grid-cols-4">
          <Button color="orange" className="whitespace-nowrap !px-2" onClick={() => go('restaurants')} testId="menu-restaurants">
            🏪 Restaurants
          </Button>
          <Button color="purple" className="whitespace-nowrap !px-2" onClick={() => go('upgrades')} testId="menu-upgrades">
            ⬆ Upgrades
          </Button>
          <Button color="blue" className="whitespace-nowrap !px-2" onClick={() => go('profile')} testId="menu-profile">
            👤 Profile
          </Button>
          <Button color="cream" className="whitespace-nowrap !px-2" onClick={() => go('settings')} testId="menu-settings">
            ⚙ Settings
          </Button>
        </div>
        {player?.user.isGuest && (
          <Panel className="flex max-w-xl flex-col items-center gap-2 p-3 text-center sm:flex-row sm:text-left">
            <div className="flex-1 font-semibold text-amber-900">You are playing as a guest. Create a free account to log in from any device – your progress comes with you.</div>
            <Button size="sm" color="green" onClick={() => setRegisterOpen(true)}>
              Save progress
            </Button>
          </Panel>
        )}
        </div>
      </div>
      <Modal open={registerOpen} onClose={() => setRegisterOpen(false)}>
        <Panel className="p-5">
          <h2 className="mb-3 text-center text-3xl font-bold text-amber-900">Save your progress</h2>
          <AuthForm initialMode="register" onDone={() => setRegisterOpen(false)} />
        </Panel>
      </Modal>
    </div>
  );
}
