import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogOut, Menu } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import { usePlatform } from '../../context/PlatformContext';
import ThemeToggle from '../ThemeToggle';
import PrimaryNav from './PrimaryNav';
import aitekLogo from '../aitek_logo_bg_removed-removebg-preview.png';

const PERSONAS = [
  { key: 'ds', label: 'Data Scientist', short: 'DS' },
  { key: 'analyst', label: 'Analyst' },
  { key: 'exec', label: 'C-Suite' },
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
              <span className="persona-full">{p.label}</span>
              <span className="persona-short" aria-hidden="true">{p.short || p.label}</span>
            </button>
          );
        })}
      </div>

      <ThemeToggle />

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
