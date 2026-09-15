import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutGrid, Database, LineChart, PieChart, BarChart3, RefreshCcw,
  TrendingUp, SlidersHorizontal, Settings2, Layers,
} from 'lucide-react';
import aitekLogo from '../aitek_logo_bg_removed-removebg-preview.png';

const GROUPS = [
  {
    label: 'Understand',
    items: [
      { to: '/app', label: 'Overview', icon: LayoutGrid, end: true },
      { to: '/app/data-foundation', label: 'Data Foundation', icon: Database },
      { to: '/app/descriptive', label: 'Descriptive Intelligence', icon: LineChart },
    ],
  },
  {
    label: 'Detect & Explain',
    items: [
      { to: '/app/abc', label: 'ABC Classification', icon: PieChart },
      { to: '/app/eoq', label: 'EOQ Calibration', icon: BarChart3 },
      { to: '/app/rmlc', label: 'RMLC Lifecycle', icon: RefreshCcw },
    ],
  },
  {
    label: 'Predict & Optimize',
    items: [
      { to: '/app/raw-materials', label: 'Multivariate Forecast', icon: TrendingUp },
      { to: '/app/what-if', label: 'What-If Simulation', icon: SlidersHorizontal },
      { to: '/app/optimization', label: 'Optimization Plan', icon: Settings2 },
    ],
  },
  {
    label: 'Decide & Act',
    items: [{ to: '/app/decisions', label: 'Decision Intelligence', icon: Layers }],
  },
];

export default function Rail() {
  return (
    <nav className="rail" aria-label="Main Navigation">
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
            {group.items.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  `rail__item transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent${isActive ? ' active' : ''}`
                }
              >
                <Icon size={16} className="shrink-0" />
                <span className="truncate">{label}</span>
              </NavLink>
            ))}
          </div>
        ))}
      </div>
      <div className="rail__footer">
        <span className="text-[10.5px] text-[#6E84A6] tracking-wide">Enterprise Suite v2.4</span>
      </div>
    </nav>
  );
}
