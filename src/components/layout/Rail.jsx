import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutGrid, Database, LineChart, PieChart, BarChart3, RefreshCcw,
  TrendingUp, SlidersHorizontal, Settings2, Bot, PackageMinus, ShieldCheck, X,
} from 'lucide-react';
import AitekLogo from '../AitekLogo';

const GROUPS = [
  {
    label: 'Understand',
    items: [
      { to: '/app', label: 'Overview', icon: LayoutGrid, end: true },
      { to: '/app/data-foundation', label: 'Data Foundation', icon: Database },
      { to: '/app/descriptive', label: 'Descriptive Analytics', icon: LineChart },
    ],
  },
  {
    label: 'Detect & Explain',
    items: [
      { to: '/app/abc', label: 'ABC Classification', icon: PieChart },
      { to: '/app/eoq', label: 'EOQ Analysis', icon: BarChart3 },
      { to: '/app/rmlc', label: 'RMLC Lifecycle', icon: RefreshCcw },
    ],
  },
  {
    label: 'Predict & Optimize',
    items: [
      { to: '/app/raw-materials', label: 'Multivariate Forecast', icon: TrendingUp },
      { to: '/app/optimization', label: 'Optimization Plan', icon: Settings2 },
      { to: '/app/what-if', label: 'What-If Simulation', icon: SlidersHorizontal },
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
    items: [{ to: '/app/decisions', label: 'Inventory Agent', icon: Bot }],
  },
];

export default function Rail({ open = false, onClose }) {
  return (
    <nav className={`rail${open ? ' open' : ''}`} aria-label="Main Navigation">
      <div className="rail__brand">
        <div className="rail__brand-left">
          <AitekLogo
            variant="dark"
            className="rail__logo-img h-8 w-auto object-contain"
          />
          <div className="rail__brand-text">
            <span className="rail__brand-name">AITEK</span>
            <span className="rail__brand-sub">Inventory Modelling</span>
          </div>
        </div>
        {onClose && (
          <button
            type="button"
            className="rail__close-btn"
            onClick={onClose}
            aria-label="Close navigation"
          >
            <X size={18} />
          </button>
        )}
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
                  `rail__item transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary${isActive ? ' active' : ''}`
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
        <span className="text-xs text-faint tracking-wide">Enterprise Suite v2.4</span>
      </div>
    </nav>
  );
}
