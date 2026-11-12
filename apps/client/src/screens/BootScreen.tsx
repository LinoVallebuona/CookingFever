import { Logo } from '../components/Logo';
import { Button, Spinner } from '../components/ui';
import { useApp } from '../store/useApp';

export function BootScreen() {
  const error = useApp((s) => s.bootError);
  const boot = useApp((s) => s.boot);
  return (
    <div className="flex h-full flex-col items-center justify-center gap-6 p-6">
      <Logo />
      {error ? (
        <div className="max-w-md rounded-3xl bg-white/90 p-5 text-center" style={{ border: '3px solid #4a2c1a' }}>
          <div className="text-xl font-bold text-red-600">Oops! The kitchen is closed.</div>
          <div className="mt-1 text-amber-900">{error}</div>
          <Button className="mt-3" color="orange" onClick={() => void boot()}>
            Try again
          </Button>
        </div>
      ) : (
        <div className="flex items-center gap-3 text-xl font-semibold text-white">
          <Spinner /> Warming up the grill…
        </div>
      )}
    </div>
  );
}
