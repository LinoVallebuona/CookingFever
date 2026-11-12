import { AnimatePresence, motion } from 'framer-motion';
import { useEffect } from 'react';
import { audio } from './audio/AudioManager';
import { Toasts } from './components/Toasts';
import { GameScreen } from './game/GameScreen';
import { AuthScreen } from './screens/AuthScreen';
import { BootScreen } from './screens/BootScreen';
import { LevelMap } from './screens/LevelMap';
import { MainMenu } from './screens/MainMenu';
import { ProfileScreen } from './screens/ProfileScreen';
import { RestaurantSelect } from './screens/RestaurantSelect';
import { SettingsScreen } from './screens/SettingsScreen';
import { UpgradesScreen } from './screens/UpgradesScreen';
import { useApp } from './store/useApp';

export function App() {
  const screen = useApp((s) => s.screen);
  const run = useApp((s) => s.run);
  const boot = useApp((s) => s.boot);

  useEffect(() => {
    void boot();
    audio.playMusic('menu');
    // Browsers only allow audio after a user gesture.
    const unlock = () => audio.unlock();
    window.addEventListener('pointerdown', unlock);
    window.addEventListener('keydown', unlock);
    return () => {
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
    };
  }, [boot]);

  if (screen === 'game' && run) {
    return (
      <div className="h-full w-full">
        <GameScreen key={run.sessionId} />
        <Toasts />
      </div>
    );
  }

  return (
    <div className="app-bg relative h-full w-full overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.div key={screen} className="absolute inset-0" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.18 }}>
          {screen === 'boot' && <BootScreen />}
          {screen === 'auth' && <AuthScreen />}
          {screen === 'menu' && <MainMenu />}
          {screen === 'restaurants' && <RestaurantSelect />}
          {screen === 'levels' && <LevelMap />}
          {screen === 'upgrades' && <UpgradesScreen />}
          {screen === 'profile' && <ProfileScreen />}
          {screen === 'settings' && <SettingsScreen />}
        </motion.div>
      </AnimatePresence>
      <Toasts />
    </div>
  );
}
