import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { ViewHead, KpiTile, Insight, Card, CardHead, Badge, DrillDown } from '../../components/CommonUI';
import { Button } from '@/components/ui/button';
import { usePlatform } from '../../context/PlatformContext';

// Phase 5 of the business lifecycle: keep inventory healthy ("Stay Green") by catching re-accumulation early.
// Screen content is a wireframe proposal derived from design bible §3.4 — pending SME review.

const RULES = [
  { id: 'r1', name: 'Lead time creeping up', condition: 'Supplier lead time is above plan for 3 weeks in a row', armed: true, lastFired: '2 days ago' },
  { id: 'r2', name: 'Production below plan', condition: 'Consumption is more than 10% under plan while receipts stay on schedule', armed: true, lastFired: '9 days ago' },
  { id: 'r3', name: 'Cover above ceiling', condition: 'Inventory coverage exceeds 45 days for a Class A material', armed: false, lastFired: 'Never' },
];

const INITIAL_ALERTS = [
  {
    id: 'A-31', severity: 'risk', label: 'High', material: 'MAT-1082 · Hydraulic Pump',
    signal: 'Lead time up 3 days for 3 weeks in a row', impact: '+$0.62M by week 6', action: 'Move the next order out by 9 days and cut the order size by 15%.',
  },
  {
    id: 'A-32', severity: 'watch', label: 'Medium', material: 'MAT-3390 · Steel Housing',
    signal: 'Production 12% under plan, receipts on schedule', impact: '+$0.31M by week 5', action: 'Ask the supplier to defer two deliveries.',
  },
  {
    id: 'A-33', severity: 'watch', label: 'Medium', material: 'MAT-1177 · Seal Kit',
    signal: 'Order size drifting above the economic order quantity', impact: '+$0.12M by week 8', action: 'Reset the order size to the current EOQ.',
  },
  {
    id: 'A-34', severity: 'accent', label: 'Low', material: 'MAT-5501 · Sealant Paste',
    signal: 'Storage occupancy above 85% at Plant 3 cold store', impact: 'Space risk, no cost yet', action: 'Watch for two more weeks.',
  },
];

export default function Prevention() {
  const { persona } = usePlatform();
  const [alerts, setAlerts] = useState(INITIAL_ALERTS);
  const [rules, setRules] = useState(RULES);

  const resolve = (a, verb) => {
    setAlerts((prev) => prev.filter((x) => x.id !== a.id));
    toast.success(`${verb}: ${a.material}`);
  };

  return (
    <motion.section className="view" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <ViewHead
        title="Prevention"
        subtitle="Catch the conditions that cause stock to build up again, and act before it does."
        actions={<Badge tone="ai" shape={false}>Proposal · pending SME review</Badge>}
      />

      <Insight key={persona} label="Stay Green">
        {persona === 'analyst' ? (
          <>
            Start with <span className="metric">MAT-1082</span>: its lead time has been up 3 days for three weeks in a row, so move the next
            order out by 9 days and cut its size by 15% to avoid <span className="metric">+$0.62M</span> by week 6. Steel Housing and Seal Kit
            follow. The &quot;Cover above ceiling&quot; rule is not armed, so a slow build-up on a Class A material will not raise a warning yet.
          </>
        ) : persona === 'ds' ? (
          <>
            Warnings come from three rules: supplier lead time above plan, consumption below plan, and coverage above a ceiling. Two of the{' '}
            {alerts.length} open warnings share one root cause, longer lead times. The lead-time and production rules are armed and last fired 2
            and 9 days ago; the <span className="metric">45-day</span> coverage ceiling for Class A has never fired because it is not armed.
          </>
        ) : (
          <>
            {alerts.length} early warnings could add about <span className="metric">$1.05M</span> of excess stock within eight
            weeks if nothing changes. The hydraulic pump is the most urgent: lead times have crept up three weeks in a row
            while consumption stayed flat.
          </>
        )}
      </Insight>

      <div className="grid-3">
        <KpiTile label="Open early warnings" value={String(alerts.length)} delta="▲ 2 since last week" deltaTone="down" sub="AI: two of them share the same root cause, longer lead times." />
        <KpiTile label="Excess avoided if acted on" value="$1.05M" sub="AI: based on the projected build-up over eight weeks." />
        <KpiTile label="Rules monitoring" value={`${rules.filter((r) => r.armed).length} of ${rules.length}`} sub="AI: arm the coverage ceiling rule to catch slow build-ups." />
      </div>

      <div className="two-col">
        <Card>
          <CardHead title="Early warnings" sub="Highest impact first. Acting removes the warning; nothing is executed without approval." />
          {alerts.length === 0 ? (
            <p className="text-[13px] text-subtle m-0">No open warnings. Inventory is on track to stay green.</p>
          ) : (
            <ul className="alertlist">
              {alerts.map((a) => (
                <li key={a.id}>
                  <div className="alertlist__main">
                    <span className="alertlist__title">
                      <Badge tone={a.severity}>{a.label}</Badge>
                      <strong>{a.material}</strong>
                    </span>
                    <span className="alertlist__signal">{a.signal}</span>
                    <span className="alertlist__rec"><b>Suggested:</b> {a.action}</span>
                  </div>
                  <div className="alertlist__side">
                    <span className="num alertlist__impact">{a.impact}</span>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => resolve(a, 'Action approved')}>Act on it</Button>
                      <Button size="sm" variant="ghost" onClick={() => resolve(a, 'Snoozed for 7 days')}>Snooze</Button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <CardHead title="Monitoring rules" sub="Turn a rule on to be warned automatically." />
          <ul className="ruleslist">
            {rules.map((r) => (
              <li key={r.id}>
                <div>
                  <strong className="text-[13px] text-ink">{r.name}</strong>
                  <span className="block text-xs text-subtle">{r.condition}</span>
                  <span className="block text-xs text-subtle">Last fired: {r.lastFired}</span>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={r.armed}
                  aria-label={`${r.name} monitoring`}
                  className={`switch ${r.armed ? 'switch--on' : ''}`}
                  onClick={() => setRules((prev) => prev.map((x) => (x.id === r.id ? { ...x, armed: !x.armed } : x)))}
                >
                  <span className="switch__knob" />
                  <span className="switch__label">{r.armed ? 'On' : 'Off'}</span>
                </button>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <DrillDown title="How warnings are produced" hint="Signals and thresholds">
        <p className="text-[13px] text-body-c m-0">
          Each rule watches a driver that the Multivariate model found to matter, compares it with plan, and projects the
          stock impact over eight weeks using the same model. A warning appears only when the projected build-up is
          larger than the noise in the forecast.
        </p>
      </DrillDown>
    </motion.section>
  );
}
