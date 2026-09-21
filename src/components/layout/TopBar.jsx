import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Menu, Moon, Sun } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import { usePlatform } from '../../context/PlatformContext';
import { useTheme } from '@/lib/theme';

const PERSONAS = [
  { key: 'ds', label: 'Data Scientist' },
  { key: 'analyst', label: 'Analyst' },
  { key: 'exec', label: 'C-Suite' },
];

export default function TopBar({ onMenu }) {
  const navigate = useNavigate();
  const { persona, setPersona, resetSession } = usePlatform();
  const shouldReduceMotion = useReducedMotion();
  const { theme, toggleTheme } = useTheme();

  function handleSignOut() {
    resetSession();
    navigate('/');
  }

  return (
    <header className="topbar">
      <button type="button" className="topbar__menu-btn" onClick={onMenu} aria-label="Open navigation">
        <Menu size={18} />
      </button>
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
            >
              {isActive && (
                <motion.div
                  layoutId={shouldReduceMotion ? undefined : 'activePersonaPill'}
                  className="absolute inset-0 bg-deep rounded-full -z-10 shadow-sm"
                  transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                />
              )}
              {p.label}
            </button>
          );
        })}
      </div>

      <button
        type="button"
        className="theme-toggle"
        onClick={toggleTheme}
        aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
        title={theme === 'dark' ? 'Light theme' : 'Dark theme'}
      >
        {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
      </button>

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
