import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutGrid, Database, LineChart, ScatterChart, PieChart, BarChart3, RefreshCcw,
  TrendingUp, SlidersHorizontal, Settings2, Bot, PackageMinus, ShieldCheck,
} from 'lucide-react';
import aitekLogo from '../aitek_logo_bg_removed-removebg-preview.png';

// Nav follows the canonical pipeline (design bible §4): stage numbers 1–9 match the stage tabs.
const GROUPS = [
  {
    label: 'Understand',
    items: [
      { to: '/app', label: 'Overview', icon: LayoutGrid, end: true },
      { to: '/app/data-foundation', label: 'Data Foundation', icon: Database },
      { to: '/app/univariate', label: 'Univariate Analysis', icon: LineChart, stage: 1 },
      { to: '/app/bivariate', label: 'Bivariate Analysis', icon: ScatterChart, stage: 2 },
    ],
  },
  {
    label: 'Detect & Explain',
    items: [
      { to: '/app/abc', label: 'ABC Classification', icon: PieChart, stage: 3 },
      { to: '/app/eoq', label: 'EOQ Analysis', icon: BarChart3, stage: 4 },
      { to: '/app/rmlc', label: 'RMLC Lifecycle', icon: RefreshCcw, stage: 5 },
    ],
  },
  {
    label: 'Predict & Optimize',
    items: [
      { to: '/app/raw-materials', label: 'Multivariate Forecast', icon: TrendingUp, stage: 6 },
      { to: '/app/optimization', label: 'Optimization Plan', icon: Settings2, stage: 7 },
      { to: '/app/what-if', label: 'What-If Simulation', icon: SlidersHorizontal, stage: 8 },
    ],
  },
  {
    label: 'Get to Green · Stay Green',
    items: [
      { to: '/app/liquidation', label: 'Liquidation', icon: PackageMinus },
      { to: '/app/prevention', label: 'Prevention', icon: ShieldCheck },
    ],
  },
  {
    label: 'Decide & Act',
    items: [{ to: '/app/decisions', label: 'Inventory Agent', icon: Bot, stage: 9 }],
  },
];

export default function Rail({ open = false }) {
  return (
    <nav className={`rail${open ? ' open' : ''}`} aria-label="Main Navigation">
      <div className="rail__brand">
        <img
          src={aitekLogo}
          alt="AITEK Logo"
          style={{ height: 32, width: 'auto', objectFit: 'contain' }}
        />
        <div className="rail__brand-text">
          <span className="rail__brand-name">AITEK</span>
          <span className="rail__brand-sub">Inventory Modelling</span>
        </div>
      </div>
      <div className="rail__groups">
        {GROUPS.map((group) => (
          <div className="rail__group" key={group.label}>
            <div className="rail__group-label">{group.label}</div>
            {group.items.map(({ to, label, icon: Icon, end, stage }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  `rail__item transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary${isActive ? ' active' : ''}`
                }
              >
                <Icon size={16} className="shrink-0" />
                <span className="truncate">{label}</span>
                {stage && <span className="rail__stage" aria-label={`Stage ${stage}`}>{stage}</span>}
              </NavLink>
            ))}
          </div>
        ))}
      </div>
      <div className="rail__footer">
        <span className="text-xs text-faint tracking-wide">Enterprise Suite v2.4</span>
      </div>
    </nav>
  );
}
