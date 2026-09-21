import React, { useState } from 'react';
import { toast } from 'sonner';
import { Badge, Card, CardHead, Insight, AlertBar } from './CommonUI';
import { Button } from '@/components/ui/button';

// Stage 7: the objective and the full constraint set are confirmed BEFORE a solver is chosen (design bible §4 Stage 7).
// Three modes must stay distinguishable: Static, Dynamic and On-the-fly.
const OBJECTIVES = [
  { id: 'inv', label: 'Minimise inventory', desc: 'Hold as little stock as the constraints allow.' },
  { id: 'cost', label: 'Minimise inventory cost', desc: 'Lowest combined ordering, carrying and shortage cost.' },
  { id: 'service', label: 'Hold service level', desc: 'Protect production and delivery commitments first.' },
  { id: 'wc', label: 'Optimise working capital', desc: 'Free up cash while keeping cover above the floor.' },
  { id: 'proc', label: 'Optimise procurement quantities', desc: 'Best order sizes and timing per supplier.' },
];

const CONSTRAINTS = [
  { id: 'prod', label: 'Production requirements', on: true },
  { id: 'cons', label: 'Raw-material consumption', on: true },
  { id: 'scap', label: 'Supplier capacity', on: true },
  { id: 'slt', label: 'Supplier lead time', on: true },
  { id: 'stor', label: 'Storage capacity', on: true },
  { id: 'pcost', label: 'Procurement cost', on: false },
  { id: 'price', label: 'Price', on: false },
  { id: 'qty', label: 'Quantity limits', on: true },
];

const MODES = [
  { id: 'static', label: 'Static', desc: 'One point-in-time run.' },
  { id: 'dynamic', label: 'Dynamic', desc: 'Re-optimises as conditions change over the same horizon, e.g. a shipment due in 3–6 days instead of a fixed 5.' },
  { id: 'live', label: 'On-the-fly', desc: 'Takes a new constraint mid-execution without restarting the plan.' },
];

export default function OptimizationSetup({ expected, optimal, uom = 'EA', material }) {
  const [objective, setObjective] = useState('wc');
  const [constraints, setConstraints] = useState(() => Object.fromEntries(CONSTRAINTS.map((c) => [c.id, c.on])));
  const [mode, setMode] = useState('static');
  const [confirmed, setConfirmed] = useState(false);
  const [extra, setExtra] = useState(false);

  const active = Object.values(constraints).filter(Boolean).length + (extra ? 1 : 0);
  const objectiveLabel = OBJECTIVES.find((o) => o.id === objective).label.toLowerCase();
  const fmt = (v) => (typeof v === 'number' ? v.toLocaleString(undefined, { maximumFractionDigits: 0 }) : '—');

  const touch = (fn) => (...args) => { setConfirmed(false); fn(...args); };

  return (
    <div className="space-y-4 mb-6">
      <Insight label="Expected vs optimal">
        The Multivariate stage expects about <span className="metric">{fmt(expected)} {uom}</span> of {material} on hand. Given your
        objective and constraints, the best position is about <span className="metric">{fmt(optimal)} {uom}</span>. Confirm what
        you are optimising for and what limits apply, then run the optimizer.
      </Insight>

      <Card className="mb-0">
        <CardHead
          title="Set up the optimization"
          sub="Step 1 objective, step 2 constraints, step 3 mode. The solver is chosen only after you confirm."
          right={<Badge tone={confirmed ? 'success' : 'watch'}>{confirmed ? 'Confirmed' : 'Not confirmed'}</Badge>}
        />

        <div className="opt-setup">
          <fieldset className="opt-setup__col">
            <legend className="eyebrow">1 · Objective</legend>
            {OBJECTIVES.map((o) => (
              <label key={o.id} className={`opt-option ${objective === o.id ? 'opt-option--on' : ''}`}>
                <input type="radio" name="objective" checked={objective === o.id} onChange={touch(() => setObjective(o.id))} />
                <span><strong>{o.label}</strong><span>{o.desc}</span></span>
              </label>
            ))}
          </fieldset>

          <fieldset className="opt-setup__col">
            <legend className="eyebrow">2 · Constraints ({active} active)</legend>
            {CONSTRAINTS.map((c) => (
              <label key={c.id} className="opt-check">
                <input type="checkbox" checked={constraints[c.id]} onChange={touch(() => setConstraints((p) => ({ ...p, [c.id]: !p[c.id] })))} />
                {c.label}
              </label>
            ))}
            {extra && (
              <label className="opt-check">
                <input type="checkbox" checked readOnly />
                Expedited freight capped at 2 trucks <Badge tone="ai" shape={false}>added live</Badge>
              </label>
            )}
          </fieldset>

          <fieldset className="opt-setup__col">
            <legend className="eyebrow">3 · Mode</legend>
            {MODES.map((m) => (
              <label key={m.id} className={`opt-option ${mode === m.id ? 'opt-option--on' : ''}`}>
                <input type="radio" name="mode" checked={mode === m.id} onChange={touch(() => setMode(m.id))} />
                <span><strong>{m.label}</strong><span>{m.desc}</span></span>
              </label>
            ))}
            {mode === 'live' && confirmed && !extra && (
              <Button size="sm" variant="outline" onClick={() => { setExtra(true); toast.success('Constraint added without restarting the plan'); }}>
                Add a constraint mid-run
              </Button>
            )}
          </fieldset>
        </div>

        {confirmed ? (
          <AlertBar tone="success" title="Objective and constraints confirmed">
            Optimising to <strong>{objectiveLabel}</strong> with {active} constraints in <strong>{mode === 'live' ? 'on-the-fly' : mode}</strong> mode.
            A linear-programming solver has been selected for this problem.
          </AlertBar>
        ) : (
          <AlertBar tone="info" title="Nothing has run yet">
            Confirm the setup to select a solver and produce the plan below.
          </AlertBar>
        )}
        <div className="flex gap-2 mt-2">
          <Button onClick={() => { setConfirmed(true); toast.success('Setup confirmed'); }} disabled={confirmed}>
            {confirmed ? 'Setup confirmed' : 'Confirm and run'}
          </Button>
        </div>
      </Card>
    </div>
  );
}
