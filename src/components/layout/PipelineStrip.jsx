import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';

// The canonical nine-stage analytical pipeline (design bible §4), in fixed order.
// `group` is the lifecycle step each stage belongs to; the tab bar separates the groups.
export const PIPELINE_STAGES = [
  { n: 1, to: '/app/univariate', label: 'Univariate', group: 'Understand' },
  { n: 2, to: '/app/bivariate', label: 'Bivariate', group: 'Understand' },
  { n: 3, to: '/app/abc', label: 'ABC', group: 'Detect & Explain' },
  { n: 4, to: '/app/eoq', label: 'EOQ', group: 'Detect & Explain' },
  { n: 5, to: '/app/rmlc', label: 'RMLC', group: 'Detect & Explain' },
  { n: 6, to: '/app/raw-materials', label: 'Multivariate', group: 'Predict & Optimize' },
  { n: 7, to: '/app/optimization', label: 'Optimization', group: 'Predict & Optimize' },
  { n: 8, to: '/app/what-if', label: 'What-if', group: 'Predict & Optimize' },
  { n: 9, to: '/app/decisions', label: 'Agent', group: 'Decide & Act', ai: true },
];

const STAGE_GROUPS = PIPELINE_STAGES.reduce((groups, stage) => {
  const last = groups[groups.length - 1];
  if (last && last.name === stage.group) last.stages.push(stage);
  else groups.push({ name: stage.group, stages: [stage] });
  return groups;
}, []);

// Tab bar shown on the nine stage pages only, so the sequence stays visible.
export default function PipelineStrip() {
  const { pathname } = useLocation();
  if (!PIPELINE_STAGES.some((s) => s.to === pathname)) return null;
  return (
    <nav className="stage-tabs" aria-label="Analytical pipeline stages">
      {STAGE_GROUPS.map((group, gi) => (
        <React.Fragment key={group.name}>
          {gi > 0 && <span className="stage-tabs__sep" aria-hidden="true" />}
          <div className="stage-tabs__group" role="group" aria-label={group.name}>
            {group.stages.map((s) => (
              <NavLink key={s.to} to={s.to} className={({ isActive }) => `${s.ai ? 'ai ' : ''}${isActive ? 'active' : ''}`}>
                <span className="stage-tabs__num">{s.n}</span>
                {s.label}
              </NavLink>
            ))}
          </div>
        </React.Fragment>
      ))}
    </nav>
  );
}
