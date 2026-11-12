import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { ErrorBoundary } from './components/ErrorBoundary';
import './index.css';

if (import.meta.env.DEV) {
  // Expose the heuristic test bot for automated end-to-end play-throughs.
  void import('@sizzle/shared/bot').then((m) => ((window as unknown as { __sizzleBot?: unknown }).__sizzleBot = m));
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
