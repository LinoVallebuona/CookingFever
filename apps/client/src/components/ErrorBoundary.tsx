import { Component, type ReactNode } from 'react';

export class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  componentDidCatch(error: Error) {
    console.error('UI crashed', error);
  }
  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="app-bg flex h-full items-center justify-center p-6">
        <div className="panel max-w-md rounded-3xl p-6 text-center">
          <div className="text-3xl font-bold text-red-600">Kitchen fire! 🔥</div>
          <p className="mt-2 text-amber-900">Something went wrong. Your saved progress is safe on the server.</p>
          <pre className="mt-2 max-h-32 overflow-auto rounded bg-white/60 p-2 text-left text-xs text-slate-700">{this.state.error.message}</pre>
          <button className="btn-3d mt-4 rounded-2xl bg-orange-500 px-6 py-2 text-xl font-bold text-white" onClick={() => location.reload()}>
            Reload
          </button>
        </div>
      </div>
    );
  }
}
