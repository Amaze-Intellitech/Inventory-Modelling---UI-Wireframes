import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogOut, Menu } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import { usePlatform } from '../../context/PlatformContext';
import { useTheme } from '@/lib/theme';

const PERSONAS = [
  { key: 'ds', label: 'Data Scientist', short: 'DS' },
  { key: 'analyst', label: 'Analyst', short: 'Analyst' },
  { key: 'exec', label: 'C-Suite', short: 'Exec' },
];

export default function TopBar({ onMenu }) {
  const navigate = useNavigate();
  const { persona, setPersona, resetSession } = usePlatform();
  const shouldReduceMotion = useReducedMotion();

  function handleSignOut() {
    resetSession();
    navigate('/');
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
        className="persona-switch relative p-1 bg-bg rounded-full border border-border-strong flex gap-0.5 sm:gap-1 items-center"
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
              className={`relative z-10 px-2 sm:px-3 py-1 rounded-full text-[11px] sm:text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
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
              <span className="hidden sm:inline">{p.label}</span>
              <span className="sm:hidden">{p.short}</span>
            </button>
          );
        })}
      </div>

      <ThemeToggle />

      <div className="topbar__divider" />

      <button
        type="button"
        className="btn btn-ghost btn-sm topbar__signout inline-flex items-center gap-1.5 text-body-c hover:text-error-tx hover:bg-error-bg transition-colors px-2 sm:px-2.5"
        onClick={handleSignOut}
        aria-label="Sign out of platform"
        title="Sign Out"
      >
        <LogOut size={14} />
        <span className="hidden sm:inline">Sign Out</span>
      </button>
    </header>
  );
}
