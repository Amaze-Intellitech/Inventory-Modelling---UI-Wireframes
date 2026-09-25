import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { PIPELINE_STAGES } from './PipelineStrip';

// The five top-level destinations. The nine analytical stages live behind "Analysis" as tabs (PipelineStrip).
const ITEMS = [
  { to: '/app', label: 'Overview', end: true },
  { to: '/app/data-foundation', label: 'Data Foundation' },
  { to: '/app/univariate', label: 'Analysis', matchesStages: true },
  { to: '/app/liquidation', label: 'Liquidation' },
  { to: '/app/prevention', label: 'Prevention' },
];

export default function PrimaryNav() {
  const { pathname } = useLocation();
  const onStage = PIPELINE_STAGES.some((s) => s.to === pathname);
  return (
    <nav className="primary-nav" aria-label="Primary">
      {ITEMS.map(({ to, label, end, matchesStages }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) => ((matchesStages ? onStage : isActive) ? 'active' : '')}
          aria-current={(matchesStages ? onStage : pathname === to) ? 'page' : undefined}
        >
          {label}
        </NavLink>
      ))}
    </nav>
  );
}
