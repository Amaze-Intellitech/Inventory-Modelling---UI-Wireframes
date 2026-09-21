import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Check } from 'lucide-react';
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

export function LifecycleStrip({ className }) {
  const navigate = useNavigate();
  return (
    <Card className={cn('mb-0', className)}>
      <CardHead
        title="Get to Green → Stay Green"
        sub="Where each raw material portfolio stands across the five lifecycle phases."
        right={<Badge tone="neutral" shape={false}>Example data</Badge>}
      />
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
    </Card>
  );
}
