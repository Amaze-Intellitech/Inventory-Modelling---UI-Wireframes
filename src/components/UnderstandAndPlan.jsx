import React, { useMemo, useState } from 'react';
import { ArrowRight, Scale } from 'lucide-react';
import { Badge, Card, CardHead, Chip, Insight } from './CommonUI';
import { CompareBars, RunwayLines } from './PersonaCharts';
import SourcingDialog from './SourcingDialog';
import { hasSourcingData } from '../data/sourcingOptions';
import { usePlatform } from '../context/PlatformContext';
import { buildPlan } from '../data/personaPlans';
import { personaLabel } from '../data/personas';

const MODES = [
  { key: 'nothing', label: 'Do nothing' },
  { key: 'act', label: 'Act on the plan' },
];

const OUTCOME_TONE = { risk: 'risk', watch: 'watch', ok: 'success' };

// Three steps for the active persona: what is happening, what could happen (do nothing vs act),
// and what to do next. Actions can hand the item to another persona, which switches the lens.
export default function UnderstandAndPlan({ rows }) {
  const { persona, setPersona } = usePlatform();
  const [mode, setMode] = useState('nothing');
  const [compareId, setCompareId] = useState(null);
  const plan = useMemo(() => buildPlan(persona, rows), [persona, rows]);
  const { chart, outcome } = plan;
  const result = outcome[mode];

  return (
    <Card className="mb-0">
      <CardHead
        title="Understand & plan"
        sub={`${plan.title}. Read what is happening, compare doing nothing with acting, then pick the next step. Projections use illustrative assumptions.`}
        right={<Badge tone="neutral" shape={false}>{personaLabel(persona)}</Badge>}
      />

      <div className="uap">
        <section aria-labelledby="uap-1">
          <h3 id="uap-1" className="uap__step"><span>1</span> What&apos;s happening</h3>
          <Insight key={persona} label={plan.title} defaultOpen>
            {plan.insight}
          </Insight>
        </section>

        <section aria-labelledby="uap-2">
          <div className="uap__step-row">
            <h3 id="uap-2" className="uap__step"><span>2</span> What could happen</h3>
            <div role="group" aria-label="Scenario" className="uap__modes">
              {MODES.map((m) => (
                <Chip key={m.key} active={mode === m.key} onClick={() => setMode(m.key)} className="!py-1 !px-3 !text-xs">
                  {m.label}
                </Chip>
              ))}
            </div>
          </div>
          {chart.kind === 'runway' ? (
            <RunwayLines
              label={chart.label}
              unit={chart.unit}
              weeks={chart.weeks}
              series={chart.series[mode]}
              threshold={chart.threshold}
              table={chart.table}
            />
          ) : (
            <CompareBars {...chart} mode={mode} />
          )}
          <div className="uap__result" role="status">
            <Badge tone={OUTCOME_TONE[result.tone]}>{mode === 'act' ? 'If you act' : 'If nothing changes'}</Badge>
            <div>
              <strong className="text-ink">{result.headline}</strong>
              <p className="uap__detail">{result.detail}</p>
            </div>
          </div>
        </section>

        <section aria-labelledby="uap-3">
          <h3 id="uap-3" className="uap__step"><span>3</span> What to do next</h3>
          <ol className="uap__actions">
            {plan.actions.map((a, i) => (
              <li key={a.title}>
                <span className="uap__rank" aria-hidden="true">{i + 1}</span>
                <div className="uap__body">
                  <strong className="text-ink">{a.title}</strong>
                  <span className="uap__meta">
                    <Badge tone="neutral" shape={false}>{a.owner}</Badge>
                    <span>{a.due}</span>
                    <span className="uap__effect">{a.effect}</span>
                  </span>
                </div>
                {a.compare && hasSourcingData(a.compare) && (
                  <button type="button" className="btn btn-secondary btn-sm uap__handoff" onClick={() => setCompareId(a.compare)}>
                    <Scale size={13} aria-hidden="true" />
                    Compare sourcing options
                  </button>
                )}
                {a.handoff && a.handoff !== persona && (
                  <button type="button" className="btn btn-ghost btn-sm uap__handoff" onClick={() => setPersona(a.handoff)}>
                    Hand off to {personaLabel(a.handoff)}
                    <ArrowRight size={13} aria-hidden="true" />
                  </button>
                )}
              </li>
            ))}
          </ol>
        </section>
      </div>
      <SourcingDialog open={Boolean(compareId)} onOpenChange={(v) => !v && setCompareId(null)} row={rows.find((r) => r.id === compareId)} />
    </Card>
  );
}
