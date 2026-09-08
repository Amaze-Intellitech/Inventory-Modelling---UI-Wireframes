import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { usePlatform } from '../../context/PlatformContext';

const PERSONAS = [
  { key: 'ds', label: 'Data Scientist' },
  { key: 'analyst', label: 'Analyst' },
  { key: 'exec', label: 'C-Suite' },
];

export default function TopBar() {
  const navigate = useNavigate();
  const { persona, setPersona, resetSession } = usePlatform();

  function handleSignOut() {
    resetSession();
    navigate('/');
  }

  return (
    <header className="topbar">
      <div className="topbar__spacer" />

      <div className="persona-switch" role="tablist" aria-label="Persona lens">
        {PERSONAS.map((p) => (
          <button
            key={p.key}
            role="tab"
            className={persona === p.key ? 'active' : ''}
            onClick={() => setPersona(p.key)}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="topbar__divider" />

      <button
        type="button"
        className="btn btn-ghost btn-sm topbar__signout"
        onClick={handleSignOut}
        aria-label="Sign out"
      >
        <LogOut size={14} />
        Sign Out
      </button>
    </header>
  );
}

