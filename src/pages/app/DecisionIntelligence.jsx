import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ViewHead, KpiTile, Chip, Badge, WhyDisclosure } from '../../components/CommonUI';
import { DECISION_ROWS } from '../../data/mockData';

const QUESTIONS = [
  'Which materials are driving excess working capital?',
  'Where is stockout risk concentrated this month?',
  'Which liquidation-stage items are still recoverable?',
];

const STEPS = [
  ['Question', 'Which materials are driving excess working capital?'],
  ['Evidence', (
    <ul>
      <li>ABC Classification — 142 Class A materials hold $34.28M, 78.30% of total catalog value</li>
      <li>EOQ Calibration — 46 of those materials are ordered above their calibrated EOQ batch sizes</li>
      <li>RMLC Lifecycle — 12 of the 46 are also aging past 90 days without full consumption ($1.94M at-risk band)</li>
    </ul>
  )],
  ['Drivers', (
    <ul>
      <li>Legacy batch-purchasing policy pre-dating current EDI ordering cadence</li>
      <li>Demand re-basing on 3 SKUs (+22.00% velocity ramp) not yet reflected in standing order size</li>
    </ul>
  )],
  ['Reasoning', 'Oversized batches on high-value, slower-turning SKUs compound: capital sits longer, and a subset is now also aging toward at-risk status. Correcting lot size on the 46 flagged materials addresses both the working-capital ($3.65M) and lifecycle-risk findings with one action.'],
  ['Recommendation', 'Recalibrate order quantity to EOQ for the 46 flagged Class A materials, prioritized by holding-cost exposure.'],
  ['Expected Financial Impact', (<><span className="num" style={{ color: 'var(--success)', fontWeight: 600 }}>$3.65M working capital released</span> · $142,800.00/yr recurring holding-cost saving</>)],
  ['Risk / Trade-off', 'Order frequency increases roughly 2.00× (from 8.00 to 15.00 orders/yr), adding administrative load unless EDI auto-dispatch is confirmed for all 46 SKUs.'],
  ['Confidence', (<><Badge tone="success">94.80%</Badge> — based on 104 weeks of consumption history and current supplier terms</>)],
];

const TAG_TONE = { 'Act now': 'risk', Optimize: 'accent', Monitor: 'watch', Prevent: 'neutral' };

export default function DecisionIntelligence() {
  const navigate = useNavigate();
  const [tab, setTab] = useState('ws');
  const [activeQ, setActiveQ] = useState(0);
  const [authorized, setAuthorized] = useState({});

  const toggle = (id) => setAuthorized((prev) => ({ ...prev, [id]: !prev[id] }));
  const authCount = Object.values(authorized).filter(Boolean).length;

  return (
    <section className="view">
      <ViewHead
        title="Decision Intelligence"
        subtitle={<p>Synthesizes evidence across every module above into a single reasoned recommendation — a workspace to interrogate, not a chat window.</p>}
      />

      <div className="tabbar">
        <button type="button" className={tab === 'ws' ? 'active' : ''} onClick={() => setTab('ws')}>Agent Workspace</button>
        <button type="button" className={tab === 'queue' ? 'active' : ''} onClick={() => setTab('queue')}>
          Approval Queue <span className="badge badge-neutral" style={{ marginLeft: 4 }}>{DECISION_ROWS.length}</span>
        </button>
      </div>

      {tab === 'ws' && (
        <div>
          <p className="card__sub" style={{ marginBottom: 10 }}>Choose a standing question — the platform assembles the answer from what it already knows</p>
          <div className="chip-row">
            {QUESTIONS.map((q, i) => <Chip key={q} active={activeQ === i} onClick={() => setActiveQ(i)}>{q}</Chip>)}
          </div>

          <div className="workspace-block">
            {STEPS.map(([label, body]) => (
              <div className="workspace-step" key={label}>
                <div className="workspace-step__label">{label}</div>
                <div className="workspace-step__body">{body}</div>
              </div>
            ))}
            <div className="workspace-step">
              <div className="workspace-step__label">Suggested Action</div>
              <div className="workspace-step__body">
                <button type="button" className="btn btn-accent btn-sm" onClick={() => setTab('queue')}>Send to Approval Queue</button>{' '}
                <button type="button" className="btn btn-sm" onClick={() => navigate('/app/optimization')}>Open in Optimization Plan</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === 'queue' && (
        <div>
          <div className="grid-4">
            <KpiTile label="Decisions Synthesized" value={DECISION_ROWS.length} />
            <KpiTile label="Net Value Identified" value="$5.51M" valueStyle={{ color: 'var(--success)' }} />
            <KpiTile label="Authorized" value={`${authCount} of ${DECISION_ROWS.length}`} />
            <KpiTile label="Average Confidence" value="95.80%" />
          </div>

          {DECISION_ROWS.map((d) => (
            <div className="decision-row" key={d.id}>
              <div className="decision-row__main">
                <Badge tone={TAG_TONE[d.tag]}>{d.tag}</Badge>
                <span className="decision-row__title">{d.title}</span>
                <span className="decision-row__meta">{d.meta}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <span className="decision-row__impact">{d.impact}</span>
                <button type="button" className={`btn btn-sm ${authorized[d.id] ? 'btn-primary' : ''}`} onClick={() => toggle(d.id)}>
                  {authorized[d.id] ? 'Authorized' : 'Authorize'}
                </button>
              </div>
            </div>
          ))}

          <div className="card" style={{ marginTop: 16 }}>
            <h2 className="card__title">Decision synthesis breakdown</h2>
            <WhyDisclosure
              defaultOpen
              summary="Why these 4 decisions synthesize $5.51M in net enterprise value"
              drivers={[
                'Class A EOQ calibration: releases $3.65M across 46 materials through batch size normalization',
                'Expedited procurement on MAT-4120: protects $1.82M finished-goods revenue ahead of 14-day stockout horizon',
                'Inter-plant transfer of MAT-5501: captures $57,600.00 salvage value before shelf-life expiration',
              ]}
              meaning={[
                'Multi-echelon intelligence solves working capital release and stockout prevention in a single synchronized schedule',
                'High average confidence (95.80%) established through 104 weeks of reconciled ERP and WMS transaction history',
              ]}
              action={[
                'Authorize decisions in order of operational urgency (Act now → Optimize → Prevent)',
                'Sync authorized decision payload directly to ERP procurement workbench',
              ]}
            />
          </div>
        </div>
      )}
    </section>
  );
}
