import React from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { ViewHead, KpiTile, Insight, Card, CardHead, Badge, AlertBar, DrillDown } from '../../components/CommonUI';
import { Button } from '@/components/ui/button';
import { usePlatform } from '../../context/PlatformContext';

// Phase 4 of the business lifecycle: clear existing excess, ageing and duplicated stock ("Get to Green").
// Screen content is a wireframe proposal derived from design bible §3.4 — pending SME review.

const VS_OPTIMAL = [
  { id: 'MAT-3390', name: 'Steel Housing', pct: 34 },
  { id: 'MAT-1082', name: 'Hydraulic Pump', pct: 19 },
  { id: 'MAT-1177', name: 'Seal Kit', pct: 6 },
  { id: 'MAT-4120', name: 'Microcontroller', pct: -3 },
  { id: 'MAT-2041', name: 'Lithium Cell', pct: -12 },
  { id: 'MAT-5501', name: 'Sealant Paste', pct: -28 },
];

const OPPORTUNITIES = [
  {
    id: 'L-101', material: 'MAT-3390 · Steel Housing', where: 'Plant 1 W-North → Plant 1 W-South',
    issue: 'Stock at sites unaware of each other', tone: 'watch', value: 1_120_000,
    action: 'Transfer', detail: 'W-South has an open PO for 600 EA while W-North holds 812 EA idle behind the boundary wall.',
  },
  {
    id: 'L-102', material: 'MAT-1082 · Hydraulic Pump', where: 'Plant 1 Assembly',
    issue: 'Duplicate procurement', tone: 'risk', value: 940_000,
    action: 'Cancel PO', detail: 'Open PO 4500018233 duplicates stock already on hand for the next 41 days.',
  },
  {
    id: 'L-103', material: 'MAT-5501 · Sealant Paste', where: 'Plant 3 Cold Store',
    issue: 'Expiry risk in 60 days', tone: 'risk', value: 410_000,
    action: 'Consume first', detail: 'Two lots expire inside 60 days; reschedule production to use them first.',
  },
  {
    id: 'L-104', material: 'MAT-2041 · Lithium Cell', where: 'Plant 2 Engine Hub',
    issue: 'Ageing stock over 180 days', tone: 'watch', value: 1_290_000,
    action: 'Sell / liquidate', detail: 'Slow-moving lot; the supplier accepts returns at 82% of cost until quarter end.',
  },
  {
    id: 'L-105', material: 'MAT-1177 · Seal Kit', where: 'Plant 3 Assembly',
    issue: 'Excess above optimal', tone: 'accent', value: 440_000,
    action: 'Pause reorders', detail: 'Stock is 6% above the optimal position; pausing reorders clears it in about 3 weeks.',
  },
];

const fmtMoney = (v) => `$${(v / 1_000_000).toFixed(2)}M`;
const BAR_MAX = 40;

function VsOptimalChart() {
  return (
    <div className="dvbars" role="img" aria-label="Stock versus optimal position by material">
      {VS_OPTIMAL.map((m) => {
        const over = m.pct >= 0;
        const abs = Math.abs(m.pct);
        const level = abs > 25 ? 3 : abs > 10 ? 2 : 1;
        const color = over ? `var(--dv-o${level})` : `var(--dv-u${level})`;
        return (
          <div className="dvbars__row" key={m.id}>
            <span className="dvbars__label">{m.name}</span>
            <span className="dvbars__track">
              <span className="dvbars__mid" />
              <span
                className="dvbars__bar"
                style={{
                  background: color,
                  width: `${(abs / BAR_MAX) * 50}%`,
                  [over ? 'left' : 'right']: '50%',
                }}
              />
            </span>
            <span className="num dvbars__val">{m.pct > 0 ? '+' : m.pct < 0 ? '−' : ''}{abs}%</span>
          </div>
        );
      })}
      <div className="dvbars__legend" aria-hidden="true">
        <span><i style={{ background: 'var(--dv-u3)' }} /> under optimal</span>
        <span><i style={{ background: 'var(--dv-mid)' }} /> on target</span>
        <span><i style={{ background: 'var(--dv-o3)' }} /> over optimal</span>
      </div>
    </div>
  );
}

export default function Liquidation() {
  const { persona } = usePlatform();
  const total = OPPORTUNITIES.reduce((sum, o) => sum + o.value, 0);

  return (
    <motion.section className="view" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <ViewHead
        title="Liquidation"
        subtitle="Find excess, ageing and duplicated stock — and decide how to clear it — before you trust the forecasts."
        actions={<Badge tone="ai" shape={false}>Proposal · pending SME review</Badge>}
      />

      <Insight key={persona} label="Get to Green">
        {persona === 'warehouse' ? (
          <>
            {OPPORTUNITIES.length} actions are ready, worth <span className="metric">{fmtMoney(total)}</span> in total. The largest is
            moving <span className="metric">$1.12M</span> of MAT-3390 between the two Plant 1 warehouses, and the Sealant Paste lots on
            MAT-5501 expire inside 60 days, so ship or consume those first.
          </>
        ) : persona === 'supervisor' ? (
          <>
            Before approving a transfer, check it does not take cover below lead time on a material that feeds a critical line. The
            Sealant Paste lots on MAT-5501 expire inside 60 days, so have the lines that use it consume those lots first.
          </>
        ) : persona === 'planner' ? (
          <>
            Steel Housing sits <span className="metric">34% over</span> its optimal position and Sealant Paste{' '}
            <span className="metric">28% under</span>, so plan the next production runs to use the older Sealant Paste lots and hold new
            Steel Housing purchases until the excess is worked down.
          </>
        ) : persona === 'procurement' ? (
          <>
            Two actions stop new spend straight away: cancel the duplicate PO on MAT-1082 (<span className="metric">$0.94M</span>) and pause
            Seal Kit reorders on MAT-1177. Stock on hand already covers the next 41 days on MAT-1082.
          </>
        ) : (
          <>
            You can release about <span className="metric">{fmtMoney(total)}</span> without buying or writing off anything new.
            The biggest single win is moving <span className="metric">$1.12M</span> of steel housings between two Plant 1
            warehouses that cannot see each other's stock, and cancelling one duplicate purchase order.
          </>
        )}
      </Insight>

      <div className="grid-4">
        <KpiTile label="Excess above optimal" value="$4.2M" delta="▲ 9.6% of stock" deltaTone="down" sub="AI: concentrated in three Class A materials." />
        <KpiTile label="Ageing over 180 days" value="$1.29M" delta="1 lot" sub="AI: supplier will take it back at 82% until quarter end." />
        <KpiTile label="Expiry risk · next 60 days" value="$0.41M" delta="2 lots" deltaTone="down" sub="AI: consuming them first avoids the write-off." />
        <KpiTile label="Duplicate procurement" value="$0.94M" delta="1 open PO" deltaTone="down" sub="AI: stock on hand already covers the next 41 days." />
      </div>

      <div>
        <Card>
          <CardHead title="Opportunities to clear" sub="Ranked by value released. Every action is a recommendation until someone approves it." />
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Material</th>
                  <th>Issue</th>
                  <th className="num">Value</th>
                  <th>Recommended action</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {OPPORTUNITIES.slice().sort((a, b) => b.value - a.value).map((o) => (
                  <tr key={o.id}>
                    <td>
                      <strong className="block text-[13px] text-ink">{o.material}</strong>
                      <span className="text-xs text-subtle">{o.where}</span>
                    </td>
                    <td><Badge tone={o.tone}>{o.issue}</Badge></td>
                    <td className="num">{fmtMoney(o.value)}</td>
                    <td>{o.action}</td>
                    <td>
                      <Button size="sm" variant="outline" onClick={() => toast.success(`${o.action} sent for approval`, { description: `${o.material} · ${fmtMoney(o.value)}` })}>
                        Send for approval
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      <div className="grid-2">
        <Card>
          <CardHead title="Stock vs optimal position" sub="Direction, not good or bad: over-stocked (orange) or under-stocked (blue)." />
          <VsOptimalChart />
          <AlertBar tone="warning" title="Two materials are under-stocked">
            Sealant Paste is 28% under optimal. Clear expiring lots with care so you do not create a shortage.
          </AlertBar>
        </Card>

        <Card>
          <CardHead title="Two warehouses that cannot see each other" sub="MAT-3390 · Steel Housing, Plant 1" />
          <div className="sites">
            <div className="sites__site">
              <span className="eyebrow">W-North</span>
              <span className="num sites__big">812 EA</span>
              <Badge tone="watch">Idle for 74 days</Badge>
            </div>
            <span className="sites__wall">boundary wall</span>
            <div className="sites__site">
              <span className="eyebrow">W-South</span>
              <span className="num sites__big">600 EA</span>
              <Badge tone="accent">Open PO in transit</Badge>
            </div>
          </div>
          <AlertBar tone="info" title="Recommendation">
            Transfer 600 EA from W-North to W-South and cancel the open PO. This releases $1.12M with no new purchase.
          </AlertBar>
        </Card>
      </div>

      <DrillDown title="Why each opportunity was flagged" hint="Rules and thresholds">
        <ul className="m-0 pl-5 text-[13px] text-ink space-y-1.5 list-disc">
          {OPPORTUNITIES.map((o) => (
            <li key={o.id}><strong>{o.material}</strong> — {o.detail}</li>
          ))}
        </ul>
      </DrillDown>
    </motion.section>
  );
}
