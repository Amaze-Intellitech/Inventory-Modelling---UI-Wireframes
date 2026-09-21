import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Check, Loader2 } from 'lucide-react';
import { Badge } from './CommonUI';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { usePlatform } from '../context/PlatformContext';

// Shown when the user picks a solution. The user is already signed in through SSO, so there is no second login:
// this is the entitlement check (authentication is not authorization). It decides where the user goes next.
//   returning user  → straight to the dashboard
//   first-time user → one-time data setup (material, parameters, data sources, ingestion)
const CHECKS = [
  { id: 'who', label: 'Signed in with SSO', detail: 'Alex Vance · alex.vance@enterprisecorp.com' },
  { id: 'tenant', label: 'Organisation licence', detail: 'Enterprise Corp holds an active Inventory Modelling licence' },
  { id: 'plants', label: 'Your plants', detail: 'Plant 1 · Plant 2 · Plant 3' },
  { id: 'solutions', label: 'Your solutions', detail: 'Inventory Modelling (assigned) · Demand Forecasting (not assigned)' },
];

export default function AccessCheckDialog({ open, onOpenChange }) {
  const navigate = useNavigate();
  const { onboarded } = usePlatform();
  const [done, setDone] = useState(0);
  const finished = done >= CHECKS.length;

  // Every time the dialog opens, the check starts again.
  useEffect(() => {
    if (open) setDone(0);
  }, [open]);

  // Reveal the checks one by one, as the entitlement lookup would return them.
  useEffect(() => {
    if (!open || finished) return undefined;
    const t = setTimeout(() => setDone((n) => n + 1), 450);
    return () => clearTimeout(t);
  }, [open, done, finished]);

  // Returning users do not see onboarding again. Closing the dialog first cancels the redirect (the timer is cleared).
  useEffect(() => {
    if (!open || !finished || !onboarded) return undefined;
    const t = setTimeout(() => {
      onOpenChange(false);
      navigate('/app', { replace: true });
    }, 800);
    return () => clearTimeout(t);
  }, [open, finished, onboarded, navigate, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>{finished ? (onboarded ? 'Welcome back' : 'Access confirmed') : 'Checking your access'}</DialogTitle>
          <DialogDescription>
            {finished
              ? onboarded
                ? 'Your data is already loaded. Opening your dashboard.'
                : 'This is your first time here, so we load your data once. After that you land straight on the dashboard.'
              : 'We check your organisation licence and which plants and solutions you can open.'}
          </DialogDescription>
        </DialogHeader>

        <ul className="checklist" aria-live="polite">
          {CHECKS.map((c, i) => {
            const ready = i < done;
            const notAssigned = c.id === 'solutions';
            return (
              <li key={c.id}>
                <span>
                  <strong>{c.label}</strong>
                  <span>{ready ? c.detail : 'Checking…'}</span>
                </span>
                {ready ? (
                  <Badge tone={notAssigned ? 'accent' : 'success'}>
                    <Check size={12} aria-hidden="true" /> {notAssigned ? 'Resolved' : 'Confirmed'}
                  </Badge>
                ) : (
                  <Badge tone="neutral" shape={false}>
                    <Loader2 size={12} className="animate-spin" aria-hidden="true" /> Checking
                  </Badge>
                )}
              </li>
            );
          })}
        </ul>

        <div className="flex flex-wrap items-center justify-between gap-3">
          {!finished || onboarded ? (
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          ) : (
            <Button variant="outline" onClick={() => onOpenChange(false)}>Not now</Button>
          )}
          {finished && !onboarded && (
            <Button onClick={() => { onOpenChange(false); navigate('/material-selection'); }} className="gap-1.5">
              Set up your data <ArrowRight size={14} aria-hidden="true" />
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
