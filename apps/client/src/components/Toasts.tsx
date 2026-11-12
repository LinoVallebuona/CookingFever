import { AnimatePresence, motion } from 'framer-motion';
import { useApp } from '../store/useApp';

export function Toasts() {
  const toasts = useApp((s) => s.toasts);
  const dismiss = useApp((s) => s.dismissToast);
  return (
    <div className="pointer-events-none fixed inset-x-0 top-3 z-[100] flex flex-col items-center gap-2 px-3">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.button
            key={t.id}
            initial={{ y: -40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -30, opacity: 0 }}
            onClick={() => dismiss(t.id)}
            className={`pointer-events-auto max-w-md rounded-2xl px-4 py-2 text-center font-semibold text-white shadow-xl ${t.kind === 'error' ? 'bg-red-600' : t.kind === 'success' ? 'bg-green-600' : 'bg-slate-800'}`}
            style={{ border: '3px solid #4a2c1a' }}
            role="status"
          >
            {t.message}
          </motion.button>
        ))}
      </AnimatePresence>
    </div>
  );
}
