import { MAX_UPGRADE_LEVEL, UPGRADES, UPGRADE_TYPES, nextUpgradeCost, type UpgradeType } from '@sizzle/shared';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { CustomerArt } from '../art/Customer';
import { BurgerArt, FriesArt, IngredientIcon, SodaArt } from '../art/food';
import { CoinIcon, StarIcon } from '../art/icons';
import { audio } from '../audio/AudioManager';
import { TopBar } from '../components/TopBar';
import { Button } from '../components/ui';
import { useApp } from '../store/useApp';

function UpgradeArt({ type }: { type: UpgradeType }) {
  switch (type) {
    case 'grillSpeed':
      return <IngredientIcon id="patty" size={64} />;
    case 'fryerSpeed':
      return <FriesArt size={40} />;
    case 'capacity':
      return <BurgerArt size={62} stack={{ bun: true, patty: true, toppings: ['cheese'] }} />;
    case 'foodQuality':
      return <StarIcon size={54} />;
    case 'patience':
      return (
        <div className="h-[62px] w-[52px] overflow-hidden">
          <CustomerArt type="senior" look={7} mood="happy" size={52} />
        </div>
      );
    case 'startingStock':
      return <IngredientIcon id="bun" size={62} />;
    case 'servingEfficiency':
      return <SodaArt size={40} />;
  }
}

export function UpgradesScreen() {
  const player = useApp((s) => s.player);
  const buy = useApp((s) => s.buyUpgrade);
  const toast = useApp((s) => s.toast);
  const [busy, setBusy] = useState<UpgradeType | null>(null);
  const diner = player?.restaurants.find((r) => r.restaurant.id === 'diner');
  if (!player || !diner) return null;
  const coins = player.profile.coins;

  return (
    <div className="flex h-full flex-col">
      <TopBar title="Upgrades" back="menu" />
      <div className="px-4 pt-2 text-center font-semibold text-white/90">Spend coins you earn in the diner on permanent kitchen upgrades. Replay levels anytime to earn more!</div>
      <div className="scroll-area flex-1 p-3 sm:p-5">
        <div className="mx-auto grid max-w-5xl gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {UPGRADE_TYPES.map((type, i) => {
            const def = UPGRADES[type];
            const level = diner.upgrades[type];
            const cost = nextUpgradeCost(type, level);
            const maxed = cost === null;
            const affordable = cost !== null && coins >= cost;
            return (
              <motion.div key={type} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }} className="panel flex flex-col rounded-[24px] p-3" data-testid={`upgrade-${type}`}>
                <div className="flex items-center gap-3">
                  <div className="flex h-[74px] w-[74px] shrink-0 items-center justify-center rounded-2xl bg-gradient-to-b from-sky-100 to-sky-300" style={{ border: '3px solid #4a2c1a' }}>
                    <UpgradeArt type={type} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xl font-bold leading-tight text-amber-900">{def.name}</div>
                    <div className="text-[13px] leading-snug text-amber-800">{def.description}</div>
                  </div>
                </div>
                <div className="mt-2 flex gap-1">
                  {Array.from({ length: MAX_UPGRADE_LEVEL }).map((_, k) => (
                    <div key={k} className="h-3 flex-1 rounded-full" style={{ background: k < level ? 'linear-gradient(180deg,#a3e635,#16a34a)' : '#e2e8f0', border: '2px solid #4a2c1a' }} />
                  ))}
                </div>
                <div className="mt-1.5 text-[13px] font-semibold text-amber-900">
                  Now: <span className="text-green-700">{def.levelEffects[level]}</span>
                  {!maxed && (
                    <>
                      {' '}
                      → Next: <span className="text-sky-700">{def.levelEffects[level + 1]}</span>
                    </>
                  )}
                </div>
                <div className="mt-auto pt-2">
                  {maxed ? (
                    <div className="rounded-2xl bg-gradient-to-b from-yellow-200 to-yellow-400 py-2 text-center text-lg font-bold text-amber-900" style={{ border: '3px solid #4a2c1a' }}>
                      ★ MAXED OUT ★
                    </div>
                  ) : (
                    <Button
                      color={affordable ? 'green' : 'gray'}
                      className="w-full"
                      disabled={!affordable || busy !== null}
                      testId={`buy-${type}`}
                      onClick={async () => {
                        setBusy(type);
                        const ok = await buy(type);
                        setBusy(null);
                        if (ok) {
                          audio.play('purchase');
                          toast(`${def.name} upgraded to level ${level + 1}!`, 'success');
                        }
                      }}
                    >
                      <span className="flex items-center justify-center gap-2">
                        {busy === type ? 'Upgrading…' : `Upgrade to Lv ${level + 1}`}
                        <span className="flex items-center gap-1 rounded-full bg-black/20 px-2">
                          <CoinIcon size={20} />
                          {cost}
                        </span>
                      </span>
                    </Button>
                  )}
                  {!maxed && !affordable && <div className="mt-1 text-center text-xs font-semibold text-amber-800">Earn {cost! - coins} more coins by playing levels</div>}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
