import { AnimatePresence, motion } from 'framer-motion';
import type { ReactNode } from 'react';
import { CoinIcon, StarIcon } from '../art/icons';
import { audio } from '../audio/AudioManager';

const BTN_COLORS = {
  orange: 'bg-gradient-to-b from-orange-400 to-orange-600 text-white',
  green: 'bg-gradient-to-b from-lime-400 to-green-600 text-white',
  blue: 'bg-gradient-to-b from-sky-400 to-blue-600 text-white',
  red: 'bg-gradient-to-b from-rose-400 to-red-600 text-white',
  purple: 'bg-gradient-to-b from-fuchsia-400 to-purple-600 text-white',
  cream: 'bg-gradient-to-b from-amber-50 to-amber-200 text-amber-900',
  gray: 'bg-gradient-to-b from-slate-300 to-slate-500 text-white',
} as const;

export type ButtonColor = keyof typeof BTN_COLORS;

export function Button({
  children,
  onClick,
  color = 'orange',
  size = 'md',
  disabled,
  className = '',
  type = 'button',
  testId,
}: {
  children: ReactNode;
  onClick?: () => void;
  color?: ButtonColor;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  disabled?: boolean;
  className?: string;
  type?: 'button' | 'submit';
  testId?: string;
}) {
  const sz = { sm: 'px-3 py-1.5 text-base rounded-xl', md: 'px-5 py-2.5 text-lg rounded-2xl', lg: 'px-7 py-3 text-2xl rounded-2xl', xl: 'px-10 py-4 text-3xl rounded-3xl' }[size];
  return (
    <button
      type={type}
      data-testid={testId}
      disabled={disabled}
      onClick={() => {
        audio.unlock();
        audio.play('click');
        onClick?.();
      }}
      className={`btn-3d font-bold tracking-wide ${BTN_COLORS[color]} ${sz} ${className}`}
      style={{ textShadow: color === 'cream' ? undefined : '0 2px 0 rgba(0,0,0,0.25)' }}
    >
      {children}
    </button>
  );
}

export function Panel({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`panel rounded-[28px] ${className}`}>{children}</div>;
}

export function Modal({ open, children, onClose, wide }: { open: boolean; children: ReactNode; onClose?: () => void; wide?: boolean }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
          <motion.div
            initial={{ scale: 0.8, y: 30 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.85, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 320, damping: 24 }}
            onClick={(e) => e.stopPropagation()}
            className={`scroll-area w-full ${wide ? 'max-w-2xl' : 'max-w-md'} max-h-[94vh] rounded-[28px]`}
          >
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function Stars({ count, size = 28, max = 3 }: { count: number; size?: number; max?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: max }).map((_, i) => (
        <StarIcon key={i} size={size} filled={i < count} />
      ))}
    </div>
  );
}

export function CoinBadge({ amount, size = 'md' }: { amount: number; size?: 'sm' | 'md' }) {
  return (
    <div className={`flex items-center gap-1.5 rounded-full bg-amber-50 font-bold text-amber-800 ${size === 'sm' ? 'px-2 py-0.5 text-base' : 'px-3 py-1 text-xl'}`} style={{ border: '3px solid #4a2c1a', boxShadow: '0 3px 0 rgba(74,44,26,0.4)' }}>
      <CoinIcon size={size === 'sm' ? 20 : 26} />
      <span className="tabular-nums" data-testid="coin-balance">{amount.toLocaleString()}</span>
    </div>
  );
}

export function ScreenTitle({ children }: { children: ReactNode }) {
  return <h1 className="text-outline text-shadow-pop text-center text-4xl font-bold text-white sm:text-5xl">{children}</h1>;
}

export function Spinner({ size = 40 }: { size?: number }) {
  return <div className="anim-spin rounded-full border-4 border-white/30 border-t-white" style={{ width: size, height: size }} />;
}

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange(v: boolean): void; label: string }) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4 rounded-2xl bg-white/70 px-4 py-2.5" style={{ border: '3px solid #4a2c1a' }}>
      <span className="text-lg font-semibold text-amber-900">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => {
          audio.unlock();
          onChange(!checked);
          audio.play('click');
        }}
        className={`relative h-8 w-14 rounded-full transition-colors ${checked ? 'bg-green-500' : 'bg-slate-400'}`}
        style={{ border: '3px solid #4a2c1a' }}
      >
        <span className="absolute top-[1px] h-6 w-6 rounded-full bg-white shadow transition-all" style={{ left: checked ? 26 : 2 }} />
      </button>
    </label>
  );
}
