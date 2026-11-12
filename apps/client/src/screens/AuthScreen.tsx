import { useState } from 'react';
import { Logo } from '../components/Logo';
import { Button, Panel } from '../components/ui';
import { useApp } from '../store/useApp';

function Field({ label, ...props }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-bold uppercase tracking-wide text-amber-800">{label}</span>
      <input {...props} className="w-full rounded-xl bg-white px-3 py-2 text-lg text-slate-800 outline-none focus:ring-4 focus:ring-orange-300" style={{ border: '3px solid #4a2c1a' }} />
    </label>
  );
}

export function AuthForm({ initialMode = 'login', onDone }: { initialMode?: 'login' | 'register'; onDone?: () => void }) {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [identifier, setIdentifier] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const login = useApp((s) => s.login);
  const register = useApp((s) => s.register);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      if (mode === 'login') await login(identifier, password);
      else await register(username, email, password);
      onDone?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-1 rounded-2xl bg-amber-200/70 p-1" style={{ border: '3px solid #4a2c1a' }}>
        {(['login', 'register'] as const).map((m) => (
          <button key={m} type="button" onClick={() => setMode(m)} className={`rounded-xl py-1.5 text-lg font-bold ${mode === m ? 'bg-orange-500 text-white shadow' : 'text-amber-900'}`}>
            {m === 'login' ? 'Log in' : 'Sign up'}
          </button>
        ))}
      </div>
      {mode === 'login' ? (
        <Field label="Username or email" value={identifier} onChange={(e) => setIdentifier(e.target.value)} autoComplete="username" required name="identifier" />
      ) : (
        <>
          <Field label="Username" value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" required minLength={3} maxLength={20} name="username" />
          <Field label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required name="email" />
        </>
      )}
      <Field label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} required minLength={mode === 'register' ? 8 : 1} name="password" />
      {mode === 'register' && <div className="-mt-2 text-sm text-amber-800">At least 8 characters.</div>}
      {error && (
        <div className="rounded-xl bg-red-100 px-3 py-2 font-semibold text-red-700" style={{ border: '2px solid #b91c1c' }} role="alert">
          {error}
        </div>
      )}
      <Button type="submit" color="green" size="lg" disabled={busy} testId="auth-submit">
        {busy ? 'Please wait…' : mode === 'login' ? 'Log in' : 'Create account'}
      </Button>
    </form>
  );
}

export function AuthScreen() {
  const playAsGuest = useApp((s) => s.playAsGuest);
  const toast = useApp((s) => s.toast);
  const [busy, setBusy] = useState(false);
  return (
    <div className="scroll-area h-full">
    <div className="flex min-h-full flex-col items-center justify-center gap-4 p-4 sm:flex-row sm:gap-10">
      <div className="shrink-0">
        <Logo />
      </div>
      <Panel className="w-full max-w-sm p-5">
        <AuthForm />
        <div className="my-3 flex items-center gap-2 text-sm font-semibold text-amber-800">
          <div className="h-[2px] flex-1 bg-amber-800/30" /> or <div className="h-[2px] flex-1 bg-amber-800/30" />
        </div>
        <Button
          color="purple"
          className="w-full"
          disabled={busy}
          testId="guest-button"
          onClick={async () => {
            setBusy(true);
            try {
              await playAsGuest();
            } catch (e) {
              toast(e instanceof Error ? e.message : 'Could not start guest mode', 'error');
            } finally {
              setBusy(false);
            }
          }}
        >
          Play as guest
        </Button>
        <div className="mt-2 text-center text-xs text-amber-800">Guest progress is saved on the server – sign up later to keep it.</div>
      </Panel>
    </div>
    </div>
  );
}
