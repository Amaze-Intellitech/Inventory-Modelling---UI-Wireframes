import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Check, ChevronDown } from 'lucide-react';
import { Badge, Card, CardHead } from './CommonUI';
import { cn } from '@/lib/utils';

// The five-phase business lifecycle (design bible §3.3), summarised for executives as "Get to Green → Stay Green".
// Statuses are illustrative mock data for the wireframe.
export const LIFECYCLE_PHASES = [
  {
    id: 'select',
    n: 1,
    title: 'Material Selection',
    question: 'Which materials justify full modelling?',
    status: 'done',
    detail: '3 tiers assigned · 142 Class A SKUs in scope',
    to: '/app/abc',
    group: 'green',
  },
  {
    id: 'level',
    n: 2,
    title: 'Desired Stock Level',
    question: 'What is the target stock position?',
    status: 'done',
    detail: 'EOQ calibrated · order size moved +11% since 2025',
    to: '/app/eoq',
    group: 'green',
  },
  {
    id: 'accumulate',
    n: 3,
    title: 'Accumulation',
    question: 'Why did stock build up?',
    status: 'attention',
    detail: 'Production volume and lead time explain most of the build-up',
    to: '/app/raw-materials',
    group: 'green',
  },
  {
    id: 'liquidate',
    n: 4,
    title: 'Liquidation',
    question: 'How do we clear excess and ageing stock?',
    status: 'attention',
    detail: '$4.2M above optimal · 3 transfer opportunities',
    to: '/app/liquidation',
    group: 'green',
  },
  {
    id: 'prevent',
    n: 5,
    title: 'Prevention',
    question: 'How do we keep it green?',
    status: 'watch',
    detail: '4 early-warning alerts · monitoring armed on 2 of 3 rules',
    to: '/app/prevention',
    group: 'stay',
  },
];

const STATUS = {
  done: { tone: 'success', label: 'Complete' },
  attention: { tone: 'watch', label: 'Needs attention' },
  watch: { tone: 'accent', label: 'Monitoring' },
};

// Collapsed by default to a single row of phase chips; "Show details" opens the full phase cards.
export function LifecycleStrip({ className, defaultOpen = false }) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Card className={cn('mb-0', className)}>
      <CardHead
        className={open ? undefined : 'mb-2.5'}
        title="Get to Green → Stay Green"
        sub="Where each raw material portfolio stands across the five lifecycle phases."
        right={
          <div className="flex items-center gap-2">
            <Badge tone="neutral" shape={false}>Example data</Badge>
            <button
              type="button"
              onClick={() => setOpen((o) => !o)}
              aria-expanded={open}
              className="inline-flex items-center gap-1 rounded-sm px-1.5 py-0.5 text-xs font-semibold text-primary hover:bg-muted-fill focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              {open ? 'Hide details' : 'Show details'}
              <ChevronDown size={13} aria-hidden="true" className={cn('transition-transform', open && 'rotate-180')} />
            </button>
          </div>
        }
      />
      {!open && (
        <ol className="lifecycle-compact" aria-label="Inventory lifecycle phases">
          {LIFECYCLE_PHASES.map((p) => {
            const s = STATUS[p.status];
            return (
              <li key={p.id}>
                <button type="button" className="lifecycle-compact__chip" onClick={() => navigate(p.to)} title={`${p.question} ${p.detail}`}>
                  <span className={cn('lifecycle__num', p.status === 'done' && 'lifecycle__num--done')}>
                    {p.status === 'done' ? <Check size={12} aria-hidden="true" /> : p.n}
                  </span>
                  <span className="lifecycle-compact__title">{p.title}</span>
                  <Badge tone={s.tone}>{s.label}</Badge>
                </button>
              </li>
            );
          })}
        </ol>
      )}
      {open && (
      <>
      <ol className="lifecycle" aria-label="Inventory lifecycle phases">
        {LIFECYCLE_PHASES.map((p, i) => {
          const s = STATUS[p.status];
          return (
            <li key={p.id} className={cn('lifecycle__item', `lifecycle__item--${p.group}`)}>
              <button type="button" className="lifecycle__card" onClick={() => navigate(p.to)}>
                <span className="lifecycle__head">
                  <span className={cn('lifecycle__num', p.status === 'done' && 'lifecycle__num--done')}>
                    {p.status === 'done' ? <Check size={12} aria-hidden="true" /> : p.n}
                  </span>
                  <span className="lifecycle__title">{p.title}</span>
                </span>
                <span className="lifecycle__q">{p.question}</span>
                <Badge tone={s.tone}>{s.label}</Badge>
                <span className="lifecycle__detail">{p.detail}</span>
                <span className="lifecycle__go">
                  Open <ArrowRight size={12} aria-hidden="true" />
                </span>
              </button>
              {i < LIFECYCLE_PHASES.length - 1 && <span className="lifecycle__link" aria-hidden="true" />}
            </li>
          );
        })}
      </ol>
      <div className="lifecycle__legend">
        <span><span className="lifecycle__bar lifecycle__bar--green" /> Get to Green — phases 1–4</span>
        <span><span className="lifecycle__bar lifecycle__bar--stay" /> Stay Green — phase 5</span>
      </div>
      </>
      )}
    </Card>
  );
}
