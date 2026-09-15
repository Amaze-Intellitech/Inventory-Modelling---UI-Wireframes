import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import { usePlatform } from '../../context/PlatformContext';

const PERSONAS = [
  { key: 'ds', label: 'Data Scientist' },
  { key: 'analyst', label: 'Analyst' },
  { key: 'exec', label: 'C-Suite' },
];

export default function TopBar() {
  const navigate = useNavigate();
  const { persona, setPersona, resetSession } = usePlatform();
  const shouldReduceMotion = useReducedMotion();

  function handleSignOut() {
    resetSession();
    navigate('/');
  }

  return (
    <header className="topbar">
      <div className="topbar__spacer" />

      <div
        className="persona-switch relative p-1 bg-bg rounded-full border border-line-strong flex gap-1 items-center"
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
              className={`relative z-10 px-3 py-1 rounded-full text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                isActive ? 'text-white' : 'text-muted hover:text-text'
              }`}
              onClick={() => setPersona(p.key)}
            >
              {isActive && (
                <motion.div
                  layoutId={shouldReduceMotion ? undefined : 'activePersonaPill'}
                  className="absolute inset-0 bg-ink rounded-full -z-10 shadow-sm"
                  transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                />
              )}
              {p.label}
            </button>
          );
        })}
      </div>

      <div className="topbar__divider" />

      <button
        type="button"
        className="btn btn-ghost btn-sm topbar__signout inline-flex items-center gap-1.5 text-muted hover:text-risk hover:bg-risk-bg transition-colors"
        onClick={handleSignOut}
        aria-label="Sign out of platform"
      >
        <LogOut size={14} />
        <span>Sign Out</span>
      </button>
    </header>
  );
}
