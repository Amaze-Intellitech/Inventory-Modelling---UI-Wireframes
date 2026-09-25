import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Moon, Sun } from 'lucide-react';
import { Stepper } from '../CommonUI';
import { useTheme } from '@/lib/theme';
import AitekLogo from '../AitekLogo';

export const ONBOARDING_STEPS = ['Material', 'Parameters', 'Data sources', 'Ingestion'];
// Route of each step, in order. Completed steps in the progress bar link back to these.
export const ONBOARDING_ROUTES = ['/material-selection', '/parameter-mapping', '/data-sources', '/ingestion'];

// Shared frame for the steps that come after sign-in: brand header, four-step progress (when `current` is set), content.
export default function OnboardingShell({ current, children }) {
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-bg flex flex-col">
      <header className="h-16 bg-surface border-b border-border shrink-0">
        <div className="page-wrap h-full flex items-center justify-between">
        <div className="flex items-center gap-3">
          <AitekLogo className="h-[42px] w-auto object-contain" />
          <div className="flex flex-col leading-tight">
            <span className="font-display text-xl font-bold text-ink tracking-tight">AITEK</span>
            <span className="text-xs font-medium text-primary">Inventory Modelling</span>
          </div>
        </div>
        <button
          type="button"
          className="theme-toggle"
          onClick={toggleTheme}
          aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
        >
          {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
        </button>
        </div>
      </header>
      <main className="page-wrap py-5 sm:py-8">
        {current ? (
          <div className="max-w-xl mx-auto mb-4 sm:mb-6">
            <Stepper steps={ONBOARDING_STEPS} current={current} className="mb-0" onStepClick={(n) => navigate(ONBOARDING_ROUTES[n - 1])} />
          </div>
        ) : null}
        {children}
      </main>
    </div>
  );
}
