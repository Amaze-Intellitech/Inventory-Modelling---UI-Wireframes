import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ViewHead, Badge, WhyDisclosure } from '../../components/CommonUI';
import { RMLC_STAGES } from '../../data/mockData';

const TONE_BADGE = { watch: 'watch', ok: 'success', risk: 'risk' };
const TONE_BORDER = { watch: 'var(--watch)', ok: 'var(--success)', risk: 'var(--risk)' };

export default function RmlcLifecycle() {
  const navigate = useNavigate();
  return (
    <section className="view">
      <ViewHead
        title="Raw Material Lifecycle"
        subtitle={<p>Tracks materials through accumulation, healthy circulation, at-risk aging and liquidation — with the threshold rule behind each stage.</p>}
        actions={<button type="button" className="btn btn-primary" onClick={() => navigate('/app/raw-materials')}>View Multivariate Forecast</button>}
      />

      <div className="grid-4">
        {RMLC_STAGES.map((s) => (
          <div className="card" key={s.key} style={{ borderTop: `3px solid ${TONE_BORDER[s.tone]}` }}>
            <Badge tone={TONE_BADGE[s.tone]}>{s.label}</Badge>
            <div className="kpi__value" style={{ fontSize: 22, margin: '10px 0 2px' }}>${s.value.toFixed(2)}M</div>
            <p className="card__sub">{s.count} materials · {s.desc}</p>
            <p style={{ fontSize: 12, marginTop: 8, color: 'var(--muted)' }}>{s.rule}</p>
          </div>
        ))}
      </div>

      <div className="insight">
        <div className="insight__label">Prevention window</div>
        <p>76 "At Risk" materials ($1.94M carrying value) can still be redirected before reaching liquidation. Early-warning rules monitor a 60-day consumption deceleration to throttle upstream replenishment before surplus accumulates.</p>
      </div>

      <div className="card">
        <div className="card__head">
          <div><h2 className="card__title">Liquidation-stage materials</h2><p className="card__sub">Shown in both quantity and value, with triggered lifecycle rule and prescribed action</p></div>
          <Badge tone="risk">$2.10M total exposure</Badge>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Material</th>
                <th>Plant</th>
                <th>Triggered Alert Rule</th>
                <th className="num text-right">Days Stagnant</th>
                <th className="num text-right">Quantity</th>
                <th className="num text-right">Holding Value</th>
                <th>Prescribed Action</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="font-semibold">MAT-5501 · Sealant Paste</td>
                <td>Plant 1</td>
                <td><span style={{ fontSize: 11.5, color: 'var(--muted)' }}>Rule: Remaining shelf life &lt; 30 days (expiring stock)</span></td>
                <td className="num text-right" style={{ color: 'var(--risk)' }}>165</td>
                <td className="num text-right">1,400.00 KG</td>
                <td className="num text-right">$57,600.00</td>
                <td>Transfer to Plant 2</td>
              </tr>
              <tr>
                <td className="font-semibold">MAT-2041 · Lithium Cell 21700 (Lot L-2241)</td>
                <td>Plant 2</td>
                <td><span style={{ fontSize: 11.5, color: 'var(--muted)' }}>Rule: 0 consumption events in 90–180 days</span></td>
                <td className="num text-right" style={{ color: 'var(--watch)' }}>95</td>
                <td className="num text-right">18,500.00 EA</td>
                <td className="num text-right">$95,090.00</td>
                <td>Redirect batch to Plant 1 assembly demand</td>
              </tr>
            </tbody>
          </table>
        </div>
        <WhyDisclosure
          summary="Why $2.10M in inventory has progressed to liquidation stage"
          drivers={[
            '118 materials passed 180 days with zero consumption events following product engineering revisions',
            'Minimum order quantities (MOQs) on MAT-5501 forced procurement of a 3-year supply batch',
            'Lack of automated inter-plant transfer visibility between Plant 1 and Plant 2 left stock stagnant',
          ]}
          meaning={[
            'Carrying costs compound at 12.00%/yr on stagnant stock while salvage value degrades by 25.00%/quarter',
            '76 At Risk materials ($1.94M) will enter liquidation within 90 days if consumption is not accelerated',
          ]}
          action={[
            'Execute immediate inter-plant transfer of MAT-5501 to Plant 2 to capture $57,600.00 salvage value',
            'Set automated 60-day consumption velocity throttle to stop upstream purchasing on all 76 At Risk SKUs',
          ]}
        />
      </div>
    </section>
  );
}
