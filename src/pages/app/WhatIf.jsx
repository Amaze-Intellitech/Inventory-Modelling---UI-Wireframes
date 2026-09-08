import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ViewHead, KpiTile, Insight, Chip, WhyDisclosure } from '../../components/CommonUI';

const PRESETS = [
  { label: 'Baseline', demand: 0, lead: 0, hold: 0 },
  { label: 'Demand +20.00%', demand: 20, lead: 0, hold: 0 },
  { label: 'Lead Time +15.00 days', demand: 0, lead: 15, hold: 0 },
  { label: 'Holding Cost +15.00%', demand: 0, lead: 0, hold: 15 },
  { label: 'Supplier Disruption', demand: -15, lead: 10, hold: 0 },
];

export default function WhatIf() {
  const navigate = useNavigate();
  const [demand, setDemand] = useState(0);
  const [lead, setLead] = useState(0);
  const [hold, setHold] = useState(0);
  const [activePreset, setActivePreset] = useState('Baseline');

  const applyPreset = (p) => {
    setDemand(p.demand); setLead(p.lead); setHold(p.hold); setActivePreset(p.label);
  };

  const out = useMemo(() => {
    const baseValue = 42.85, baseSafety = 450, baseEoq = 320, baseStockout = 2.6, baseService = 97.4;
    const value = baseValue * (1 + (demand / 100) * 0.42 + (hold / 100) * 0.06);
    const safety = baseSafety * (1 + (demand / 100) * 0.55 + (lead / 100) * 0.035);
    const eoq = baseEoq * Math.sqrt(1 + demand / 100) * Math.max(1 - (hold / 100) * 0.35, 0.4);
    const stockout = Math.max(0.3, baseStockout + demand * 0.09 + lead * 0.14 - hold * 0.01);
    const service = Math.min(99.9, Math.max(80, baseService - demand * 0.05 - lead * 0.09 + hold * 0.01));
    const capitalDelta = value - baseValue;

    let reco = 'Baseline holds — no policy change required at current parameters.';
    if (lead >= 10 && demand <= 0) reco = 'Supplier disruption pattern detected — pre-position safety stock on Class A materials and qualify a secondary supplier before lead time normalizes.';
    else if (demand >= 15) reco = 'Demand surge — recalibrate safety stock now; current EOQ batches will under-cover the projected consumption rate within 3 cycles.';
    else if (hold >= 10) reco = 'Rising capital cost — re-run EOQ across Class A materials; smaller, more frequent batches reduce holding exposure at this rate.';
    else if (lead >= 8) reco = 'Lead time extension — reorder points should move earlier; stockout risk rises faster than safety stock currently compensates for.';

    return { value, safety, eoq, stockout, service, capitalDelta, reco };
  }, [demand, lead, hold]);

  return (
    <section className="view">
      <ViewHead
        title="What-If Simulation"
        subtitle={<p>Move the levers below and watch the portfolio response recompute live — before committing to a real policy change.</p>}
        actions={<button type="button" className="btn btn-primary" onClick={() => navigate('/app/optimization')}>Send to Optimization</button>}
      />

      <div className="chip-row">
        {PRESETS.map((p) => (
          <Chip key={p.label} active={activePreset === p.label} onClick={() => applyPreset(p)}>{p.label}</Chip>
        ))}
      </div>

      <div className="two-col">
        <div className="card">
          <h2 className="card__title" style={{ marginBottom: 16 }}>Scenario levers</h2>

          <div className="slider-row">
            <div className="slider-row__head">
              <strong>Demand change</strong>
              <span className="slider-row__val">{demand > 0 ? '+' : ''}{demand.toFixed(2)}%</span>
            </div>
            <input type="range" min={-30} max={40} value={demand} onChange={(e) => { setDemand(+e.target.value); setActivePreset(''); }} />
          </div>
          <div className="slider-row">
            <div className="slider-row__head">
              <strong>Supplier lead time change</strong>
              <span className="slider-row__val">{lead > 0 ? '+' : ''}{lead.toFixed(2)} days</span>
            </div>
            <input type="range" min={-10} max={30} value={lead} onChange={(e) => { setLead(+e.target.value); setActivePreset(''); }} />
          </div>
          <div className="slider-row">
            <div className="slider-row__head">
              <strong>Holding cost rate change</strong>
              <span className="slider-row__val">{hold > 0 ? '+' : ''}{hold.toFixed(2)}%</span>
            </div>
            <input type="range" min={-20} max={25} value={hold} onChange={(e) => { setHold(+e.target.value); setActivePreset(''); }} />
          </div>
          <p className="footnote">Illustrative sensitivity model for storyboard purposes — the connected engine will substitute the authoritative multivariate + optimization pipeline.</p>
        </div>

        <div className="card">
          <h2 className="card__title" style={{ marginBottom: 14 }}>Portfolio response vs baseline</h2>
          <div className="grid-2" style={{ marginBottom: 0 }}>
            <KpiTile label="Total Inventory Value" value={`$${out.value.toFixed(2)}M`} />
            <KpiTile
              label="Safety Stock Requirement"
              value={`${out.safety.toFixed(2)} EA`}
              sub={`$${((out.safety * 600) / 1000).toFixed(2)}K carrying value`}
            />
            <KpiTile
              label="EOQ Lot Size Shift"
              value={`${out.eoq.toFixed(2)} EA`}
              sub={`$${((out.eoq * 600) / 1000).toFixed(2)}K batch value`}
            />
            <KpiTile label="Stockout Risk" value={`${out.stockout.toFixed(2)}%`} />
            <KpiTile label="Service Level" value={`${out.service.toFixed(2)}%`} />
            <KpiTile
              label="Working Capital Delta"
              value={`${out.capitalDelta >= 0 ? '+' : '-'}$${Math.abs(out.capitalDelta).toFixed(2)}M`}
              valueStyle={{ color: out.capitalDelta > 0.05 ? 'var(--risk)' : out.capitalDelta < -0.05 ? 'var(--success)' : 'var(--text)' }}
            />
          </div>
        </div>
      </div>

      <Insight label="Prescribed countermeasure">{out.reco}</Insight>

      <div className="card">
        <h2 className="card__title">Sensitivity driver breakdown</h2>
        <WhyDisclosure
          defaultOpen
          summary="Why portfolio working capital and stockout risk respond to these levers"
          drivers={[
            'Demand lever (+20.00%): drives safety stock up non-linearly to absorb higher Poisson arrival variance',
            'Lead time lever (+15.00 days): expands the exposure window, raising stockout probability from 2.60% to 4.70%',
            'Holding cost lever (+15.00%): depresses optimal EOQ batch sizes, increasing replenishment frequency from 8.00 to 15.00 orders/yr',
          ]}
          meaning={[
            'Working capital delta compounds across cycle stock and safety buffers simultaneously',
            'Service level degrades rapidly when lead-time variance increases without safety buffer re-indexing',
          ]}
          action={[
            'Export simulated parameter constraints to Optimization Plan',
            'Validate supplier capacity against higher order frequency before activating policy changes',
          ]}
        />
      </div>
    </section>
  );
}
