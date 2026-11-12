import { DINER_LEVELS, GameEngine, emptyUpgradeLevels, UPGRADE_TYPES, expectedCustomerValue } from '../src';
import { playWithBot } from '../src/bot';
const up = Number(process.argv[2] ?? 0);
const reactions = [24, 40, 60];
const lv = Object.fromEntries(UPGRADE_TYPES.map((t) => [t, up])) as any;
const N = 10;
for (const level of DINER_LEVELS) {
  const parts: string[] = [];
  for (const reaction of reactions) {
    let stars = 0, rev = 0, lost = 0;
    for (let seed = 1; seed <= N; seed++) {
      const e = GameEngine.create(level, up ? lv : emptyUpgradeLevels(), seed * 7919);
      playWithBot(e, reaction);
      const r = e.result();
      stars += r.stars; rev += r.revenue; lost += r.lost;
    }
    parts.push(`r${reaction}: rev=${Math.round(rev / N)} (${(rev / N / (expectedCustomerValue(level) * level.customers)).toFixed(2)}) lost=${(lost / N).toFixed(1)} ★${(stars / N).toFixed(1)}`);
  }
  console.log(`L${level.number} [${level.targets.join('/')}] ${parts.join(' | ')}`);
}
