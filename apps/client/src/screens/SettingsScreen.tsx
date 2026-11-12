import { audio } from '../audio/AudioManager';
import { TopBar } from '../components/TopBar';
import { Panel, Toggle } from '../components/ui';
import { useApp } from '../store/useApp';

export function SettingsScreen() {
  const settings = useApp((s) => s.settings);
  const update = useApp((s) => s.updateSettings);
  const a = settings.audio;
  return (
    <div className="flex h-full flex-col">
      <TopBar title="Settings" back="menu" />
      <div className="scroll-area flex-1 p-3 sm:p-5">
        <div className="mx-auto grid max-w-3xl gap-4 md:grid-cols-2">
          <Panel className="flex flex-col gap-2.5 p-4">
            <h2 className="text-xl font-bold text-amber-900">Audio</h2>
            <label className="rounded-2xl bg-white/70 px-4 py-2.5" style={{ border: '3px solid #4a2c1a' }}>
              <div className="flex justify-between text-lg font-semibold text-amber-900">
                <span>Master volume</span>
                <span className="tabular-nums">{Math.round(a.master * 100)}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={Math.round(a.master * 100)}
                onChange={(e) => update({ audio: { ...a, master: Number(e.target.value) / 100 } })}
                onPointerUp={() => {
                  audio.unlock();
                  audio.play('coins');
                }}
                className="mt-1 w-full accent-orange-500"
                aria-label="Master volume"
              />
            </label>
            <Toggle label="Background music" checked={a.music} onChange={(v) => update({ audio: { ...a, music: v } })} />
            <Toggle label="Cooking & kitchen sounds" checked={a.sfx} onChange={(v) => update({ audio: { ...a, sfx: v } })} />
            <Toggle label="Customer reactions" checked={a.voices} onChange={(v) => update({ audio: { ...a, voices: v } })} />
            <Toggle label="Interface clicks" checked={a.ui} onChange={(v) => update({ audio: { ...a, ui: v } })} />
          </Panel>
          <div className="flex flex-col gap-4">
            <Panel className="flex flex-col gap-2.5 p-4">
              <h2 className="text-xl font-bold text-amber-900">Gameplay</h2>
              <Toggle label="Show level tips" checked={settings.showHints} onChange={(v) => update({ showHints: v })} />
              <Toggle label="Reduce motion" checked={settings.reducedMotion} onChange={(v) => update({ reducedMotion: v })} />
              <div className="text-sm text-amber-800">Settings are saved to your account automatically.</div>
            </Panel>
            <Panel className="p-4 text-amber-900">
              <h2 className="text-xl font-bold">How to play</h2>
              <ul className="mt-1 list-disc space-y-0.5 pl-5 text-[15px]">
                <li>Tap stations to cook; tap finished food to serve it to whoever ordered it.</li>
                <li>Drag ingredients onto a specific plate, or food onto a specific customer.</li>
                <li>Watch the rings: green = cooking, orange/red = about to burn!</li>
                <li>Empty bins must be restocked – tap them.</li>
                <li>Drag mistakes to the trash (or tap the trash, then the item).</li>
                <li>Press P or Esc to pause.</li>
              </ul>
              <div className="mt-3 rounded-xl bg-green-100 p-2 text-sm font-semibold text-green-800">Sizzle Shift is 100% free: no ads, no purchases, no energy timers. Everything is earned by playing.</div>
            </Panel>
          </div>
        </div>
      </div>
    </div>
  );
}
