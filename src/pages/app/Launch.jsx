import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePlatform } from '../../context/PlatformContext';
import { useTheme } from '@/lib/theme';
import { readTicket, currentSession, goToPortal } from '../../lib/portal';

const REASON = {
  missing: 'This page opens from the AITEK portal. Sign in there and choose Inventory Modelling.',
  invalid: 'The sign-in link could not be read.',
  expired: 'Your sign-in link has expired. Open Inventory Modelling again from the portal.',
  audience: 'This sign-in link was issued for a different solution.',
};

// Entry point from the AITEK portal. Accepts the launch ticket, then routes the user the way the old access check
// did: returning users go straight to the dashboard, first-time users through the one-time data setup.
export default function Launch() {
  const navigate = useNavigate();
  const { signInFromTicket, onboarded, setOnboarded, resetSetup, seedReturningSetup } = usePlatform();
  const { setTheme } = useTheme();
  const [error, setError] = useState(null);
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return; // StrictMode runs effects twice; the ticket is single-use
    ran.current = true;
    const result = readTicket();
    const session = result.session || (result.error === 'missing' ? currentSession() : null);
    if (!session) {
      setError(result.error);
      return;
    }
    signInFromTicket(session);
    if (result.session) {
      if (session.theme) setTheme(session.theme);
      // prototype control from the portal: show the first-time or the returning-user path
      if (session.journey === 'first-time') {
        resetSetup();
        setOnboarded(false);
      } else if (session.journey === 'returning' && !onboarded) {
        seedReturningSetup();
        setOnboarded(true);
      }
    }
    const firstTime = result.session ? session.journey === 'first-time' : !onboarded;
    navigate(firstTime ? '/material-selection' : '/app', { replace: true });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (!error) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center text-subtle text-sm gap-2" role="status">
        <Loader2 size={16} className="animate-spin" aria-hidden="true" /> Opening Inventory Modelling…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-surface border border-border rounded-xl p-7 shadow-subtle text-center">
        <div className="w-12 h-12 mx-auto rounded-full bg-warning-bg text-warning-tx flex items-center justify-center mb-4">
          <ShieldAlert size={22} aria-hidden="true" />
        </div>
        <h1 className="text-lg font-bold text-ink mb-1.5">Sign in through the AITEK portal</h1>
        <p className="text-[13px] text-subtle mb-5">{REASON[error] || REASON.missing}</p>
        <Button onClick={() => goToPortal('/')}>Back to AITEK portal</Button>
      </div>
    </div>
  );
}
