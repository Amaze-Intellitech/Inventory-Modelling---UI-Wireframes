import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';

// The canonical nine-stage analytical pipeline (design bible §4), in fixed order.
export const PIPELINE_STAGES = [
  { n: 1, to: '/app/univariate', label: 'Univariate' },
  { n: 2, to: '/app/bivariate', label: 'Bivariate' },
  { n: 3, to: '/app/abc', label: 'ABC' },
  { n: 4, to: '/app/eoq', label: 'EOQ' },
  { n: 5, to: '/app/rmlc', label: 'RMLC' },
  { n: 6, to: '/app/raw-materials', label: 'Multivariate' },
  { n: 7, to: '/app/optimization', label: 'Optimization' },
  { n: 8, to: '/app/what-if', label: 'What-if' },
  { n: 9, to: '/app/decisions', label: 'Agent', ai: true },
];

// Tab bar shown on the nine stage pages only, so the sequence stays visible.
export default function PipelineStrip() {
  const { pathname } = useLocation();
  if (!PIPELINE_STAGES.some((s) => s.to === pathname)) return null;
  return (
    <nav className="stage-tabs" aria-label="Analytical pipeline stages">
      {PIPELINE_STAGES.map((s) => (
        <NavLink key={s.to} to={s.to} className={({ isActive }) => `${s.ai ? 'ai ' : ''}${isActive ? 'active' : ''}`}>
          <span className="stage-tabs__num">{s.n}</span>
          {s.label}
        </NavLink>
      ))}
    </nav>
  );
}
