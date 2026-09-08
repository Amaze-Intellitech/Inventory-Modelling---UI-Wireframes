import React from 'react';

export function Badge({ tone = 'neutral', children }) {
  return <span className={`badge badge-${tone}`}>{children}</span>;
}

export function Card({ children, style }) {
  return <div className="card" style={style}>{children}</div>;
}

export function CardHead({ title, sub, right }) {
  return (
    <div className="card__head">
      <div>
        <h2 className="card__title">{title}</h2>
        {sub && <p className="card__sub">{sub}</p>}
      </div>
      {right}
    </div>
  );
}

export function KpiTile({ label, value, sub, delta, deltaTone, onClick, valueStyle }) {
  const isClickable = typeof onClick === 'function';

  const handleKeyDown = (e) => {
    if (isClickable && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      onClick();
    }
  };

  return (
    <div
      className="kpi"
      onClick={onClick}
      onKeyDown={handleKeyDown}
      tabIndex={isClickable ? 0 : undefined}
      role={isClickable ? 'button' : undefined}
      style={isClickable ? { cursor: 'pointer' } : undefined}
    >
      <span className="kpi__label">{label}</span>
      <span className="kpi__value" style={valueStyle}>{value}</span>
      {delta && <span className={`kpi__delta ${deltaTone || 'flat'}`}>{delta}</span>}
      {sub && <span className="kpi__sub">{sub}</span>}
    </div>
  );
}

export function Insight({ label, children }) {
  return (
    <div className="insight">
      <div className="insight__label">{label}</div>
      <p>{children}</p>
    </div>
  );
}

// The "Why did this change?" driver-breakdown disclosure used across
// every analysis screen — one reusable pattern, not a one-off per page.
export function WhyDisclosure({ summary, drivers, meaning, action, defaultOpen }) {
  return (
    <details className="why" open={defaultOpen}>
      <summary>{summary}</summary>
      <div className="why__chain">
        <div className="why__col"><h4>Drivers</h4><ul>{drivers.map((d, i) => <li key={i}>{d}</li>)}</ul></div>
        <div className="why__col"><h4>What it means</h4><ul>{meaning.map((d, i) => <li key={i}>{d}</li>)}</ul></div>
        <div className="why__col"><h4>Suggested action</h4><ul>{action.map((d, i) => <li key={i}>{d}</li>)}</ul></div>
      </div>
    </details>
  );
}

export function SectionTitle({ children }) {
  return <div className="section-title">{children}</div>;
}

export function Stepper({ steps, current }) {
  return (
    <div className="stepper">
      {steps.map((label, i) => {
        const stepNum = i + 1;
        const state = stepNum < current ? 'done' : stepNum === current ? 'current' : '';
        return (
          <React.Fragment key={label}>
            <div className={`stepper__item ${state}`}>
              <span className="stepper__num">{stepNum < current ? '✓' : stepNum}</span>
              <span className="stepper__label">{label}</span>
            </div>
            {i < steps.length - 1 && <div className="stepper__line" />}
          </React.Fragment>
        );
      })}
    </div>
  );
}

export function Chip({ active, onClick, children }) {
  return (
    <button type="button" className={`chip ${active ? 'active' : ''}`} onClick={onClick}>
      {children}
    </button>
  );
}

export function ViewHead({ title, subtitle, actions }) {
  return (
    <div className="view-head">
      <div>
        <h1>{title}</h1>
        {subtitle}
      </div>
      {actions && <div className="view-actions">{actions}</div>}
    </div>
  );
}
