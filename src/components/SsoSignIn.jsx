import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Building2, Loader2, ShieldCheck } from 'lucide-react';
import { AlertBar } from './CommonUI';
import { Button } from '@/components/ui/button';

// Sign-in is always single sign-on (Microsoft Entra ID, or the organisation's own SAML / OIDC provider).
// There is no password field in the app: the user authenticates at the identity provider and comes back signed in.
// Access to plants and solutions is a separate check after sign-in (authentication is not authorization).
const PHASES = {
  discovering: { label: 'Finding your organisation', detail: 'Matching your email domain to its identity provider.' },
  redirecting: { label: 'Redirecting to Microsoft Entra ID', detail: 'You will sign in with your organisation account.' },
  returning: { label: 'Signed in', detail: 'Checking which plants and solutions you can open.' },
};

function isEmail(v) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
}

export default function SsoSignIn() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('alex.vance@enterprisecorp.com');
  const [error, setError] = useState('');
  const [phase, setPhase] = useState(null); // null | 'discovering' | 'redirecting' | 'returning'
  const timers = useRef([]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const run = (steps) => {
    let t = 0;
    steps.forEach(([name, ms]) => {
      timers.current.push(setTimeout(() => setPhase(name), t));
      t += ms;
    });
    timers.current.push(setTimeout(() => navigate('/solutions'), t));
  };

  // "Continue with SSO": find the organisation's identity provider from the email domain, then redirect.
  const continueWithEmail = (e) => {
    e.preventDefault();
    if (!isEmail(email)) {
      setError('Enter your work email so we can find your organisation’s sign-in.');
      return;
    }
    setError('');
    run([['discovering', 700], ['redirecting', 900], ['returning', 700]]);
  };

  // "Sign in with Microsoft": skip discovery for organisations that already use Microsoft 365 / Entra ID.
  const continueWithMicrosoft = () => {
    setError('');
    run([['redirecting', 900], ['returning', 700]]);
  };

  if (phase) {
    const p = PHASES[phase];
    return (
      <div className="sso" role="status" aria-live="polite">
        <div className="sso__spinner">
          {phase === 'returning' ? <ShieldCheck size={26} aria-hidden="true" /> : <Loader2 size={26} className="animate-spin" aria-hidden="true" />}
        </div>
        <h2>{p.label}</h2>
        <p className="sub">{p.detail}</p>
      </div>
    );
  }

  return (
    <div className="sso">
      <span className="eyebrow">Single sign-on</span>
      <h2>Sign in to AITEK</h2>
      <p className="sub">
        Use your organisation’s account. Your password is never entered or stored here.
      </p>

      <Button type="button" variant="outline" className="sso__ms" onClick={continueWithMicrosoft}>
        <svg width="18" height="18" viewBox="0 0 21 21" aria-hidden="true">
          <rect x="1" y="1" width="9" height="9" fill="#F25022" />
          <rect x="11" y="1" width="9" height="9" fill="#7FBA00" />
          <rect x="1" y="11" width="9" height="9" fill="#00A4EF" />
          <rect x="11" y="11" width="9" height="9" fill="#FFB900" />
        </svg>
        Sign in with Microsoft
      </Button>

      <div className="sso__or"><span>or use your work email</span></div>

      <form onSubmit={continueWithEmail} noValidate>
        <div className="field-group">
          <label className="field-label" htmlFor="sso-email">Work email</label>
          <div className="field-input-wrap">
            <input
              id="sso-email"
              type="email"
              className="field-input"
              autoComplete="username"
              value={email}
              aria-invalid={Boolean(error)}
              aria-describedby={error ? 'sso-email-error' : undefined}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          {error && <AlertBar tone="error" title={error} className="sso__error" />}
        </div>
        <Button type="submit" className="btn-block gap-2">
          Continue with SSO <ArrowRight size={15} aria-hidden="true" />
        </Button>
      </form>

      <p className="sso__note">
        <Building2 size={14} aria-hidden="true" />
        <span>
          Works with Microsoft Entra ID, Okta, ADFS and Ping. After sign-in we check which plants and solutions you can open.
        </span>
      </p>
    </div>
  );
}
