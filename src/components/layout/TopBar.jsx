import React from 'react';
import { Link } from 'react-router-dom';
import { LogOut, LayoutGrid, Menu } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import { usePlatform } from '../../context/PlatformContext';
import { clearSession, goToPortal } from '../../lib/portal';
import { PERSONAS } from '../../data/personas';
import ThemeToggle from '../ThemeToggle';
import PrimaryNav from './PrimaryNav';
import aitekLogo from '../aitek_logo_bg_removed-removebg-preview.png';

export default function TopBar({ onMenu }) {
  const { persona, setPersona, user } = usePlatform();
  const initials = (user?.name || '').split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
  const shouldReduceMotion = useReducedMotion();

  // Single sign-out: end this app's session, then the portal's. The page is leaving, so in-memory state is not
  // reset first; clearing the user would make the route guard race this redirect with its own.
  function handleSignOut() {
    clearSession();
    goToPortal('/signout');
  }

  return (
    <header className="topbar">
      <button type="button" className="topbar__menu-btn" onClick={onMenu} aria-label="Open navigation">
        <Menu size={18} />
      </button>
      <Link to="/app" className="topbar__brand" aria-label="AITEK Inventory Modelling, Overview">
        <img src={aitekLogo} alt="" style={{ height: 28, width: 'auto', objectFit: 'contain' }} />
        <span className="topbar__brand-text">
          <span className="topbar__brand-name">AITEK</span>
          <span className="topbar__brand-sub">Inventory Modelling</span>
        </span>
      </Link>
      <PrimaryNav />
      <div className="topbar__spacer" />

      <div
        className="persona-switch relative p-1 bg-bg rounded-full border border-border-strong flex gap-1 items-center"
        role="tablist"
        aria-label="Persona lens selection"
      >
        {PERSONAS.map((p) => {
          const isActive = persona === p.key;
          return (
            <button
              key={p.key}
              role="tab"
              aria-selected={isActive}
              className={`relative z-10 px-3 py-1 rounded-full text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                isActive ? 'text-white' : 'text-body-c hover:text-ink'
              }`}
              onClick={() => setPersona(p.key)}
              aria-label={p.label}
              title={p.label}
            >
              {isActive && (
                <motion.div
                  layoutId={shouldReduceMotion ? undefined : 'activePersonaPill'}
                  className="absolute inset-0 bg-deep rounded-full -z-10 shadow-sm"
                  transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                />
              )}
              <span className="persona-full">{p.tab}</span>
              <span className="persona-short" aria-hidden="true">{p.short}</span>
            </button>
          );
        })}
      </div>

      <ThemeToggle />

      <button
        type="button"
        className="theme-toggle"
        onClick={() => goToPortal('/apps')}
        aria-label="All AITEK solutions"
        title="All AITEK solutions"
      >
        <LayoutGrid size={15} />
      </button>

      {user && (
        <span
          className="w-8 h-8 rounded-full bg-deep text-white text-xs font-bold flex items-center justify-center shrink-0"
          title={`${user.name} · ${user.tenant}`}
          aria-label={`Signed in as ${user.name}, ${user.tenant}`}
        >
          {initials}
        </span>
      )}

      <div className="topbar__divider" />

      <button
        type="button"
        className="btn btn-ghost btn-sm topbar__signout inline-flex items-center gap-1.5 text-body-c hover:text-error-tx hover:bg-error-bg transition-colors"
        onClick={handleSignOut}
        aria-label="Sign out of platform"
      >
        <LogOut size={14} />
        <span>Sign Out</span>
      </button>
    </header>
  );
}
