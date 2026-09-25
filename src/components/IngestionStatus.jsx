import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { Badge, Card, CardHead, AlertBar } from './CommonUI';
import { StatusShape } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

// Data foundation pipeline (design bible §5.4) and ingestion / data-quality status (Screen D).
// Each step explains itself in a popover; steps that are configured elsewhere link to that screen.
const PIPELINE = [
  { key: 'sources', label: 'Sources', meaning: 'The systems the platform reads from and how often each one syncs.', to: '/data-sources', linkLabel: 'Open data sources' },
  { key: 'mapping', label: 'Source-to-target mapping', meaning: "Says which field in each source system feeds which field in the canonical dataset, including unit and currency conversions, so every system's version of a fact lands in one place.", to: '/parameter-mapping', linkLabel: 'Open parameter mapping' },
  { key: 'canonical', label: 'Canonical dataset', meaning: 'One reconciled table of 3,650 daily rows built from all sources, so every screen reads the same numbers.' },
  { key: 'ingestion', label: 'Ingestion', meaning: 'Loading each source into the canonical dataset, with row counts and gaps per source.' },
  { key: 'quality', label: 'Data quality', meaning: 'Validation, outlier and master-data checks before analysis is allowed to run.' },
  { key: 'analytical', label: 'Analytical dataset', meaning: 'The cleaned, analysis-ready data that every stage from Univariate to Optimization uses.' },
];

// Status is never colour alone: each state has a shape and a word.
const STEP_STATE = {
  done: { shape: 'circle', word: 'Done', color: 'text-success' },
  attention: { shape: 'triangle', word: 'Needs attention', color: 'text-warning' },
  blocked: { shape: 'diamond', word: 'Blocked', color: 'text-error' },
};

const SOURCES = [
  { name: 'SAP S/4HANA', kind: 'Structured', rows: '3,650', missing: 0.0, tone: 'success', label: 'Loaded' },
  { name: 'Manhattan WMS', kind: 'Structured', rows: '3,650', missing: 0.4, tone: 'success', label: 'Loaded' },
  { name: 'DCS feed', kind: 'Unstructured', rows: '3,612', missing: 1.0, tone: 'success', label: 'Normalised' },
  { name: 'Quality management (LIMS)', kind: 'Semi-structured', rows: '3,650', missing: 0.8, tone: 'success', label: 'Loaded' },
  { name: 'Supplier feed', kind: 'Mixed', rows: '3,212', missing: 12.0, tone: 'watch', label: 'Gaps to review' },
];

const CHECKS = [
  { label: 'Validation passed', detail: 'Schema, types and ranges', tone: 'success', state: 'Passed' },
  { label: 'Outliers flagged', detail: '4 values to investigate, none removed automatically', tone: 'watch', state: 'Review' },
  { label: 'Transactional gaps', detail: 'Filled with the median where appropriate', tone: 'success', state: 'Handled' },
];

export default function IngestionStatus({ material = 'MAT-1082 · Hydraulic Pump', onProceed, proceedLabel = 'Proceed to analysis' }) {
  const navigate = useNavigate();
  const [reviewed, setReviewed] = useState(false);

  // Step status comes from the data on this screen: source gaps and the master-data review.
  const stepStatus = {
    sources: { state: 'done', note: 'All sources are connected.' },
    mapping: { state: 'done', note: 'All required parameters are mapped.' },
    canonical: { state: 'done', note: 'Built from all sources.' },
    ingestion: SOURCES.some((src) => src.tone === 'watch')
      ? { state: 'attention', note: 'The supplier feed is 12% incomplete. You can continue.' }
      : { state: 'done', note: 'Every source loaded.' },
    quality: reviewed
      ? { state: 'done', note: 'Master-data gap reviewed.' }
      : { state: 'blocked', note: 'One material is missing its unit of measure. Review it to continue.' },
    analytical: reviewed
      ? { state: 'done', note: 'Ready to analyse.' }
      : { state: 'blocked', note: 'Not available until the master-data gap is reviewed.' },
  };

  return (
    <div className="space-y-4">
      <ol className="pipeline" aria-label="Data foundation pipeline">
        {PIPELINE.map((step, i) => {
          const { state, note } = stepStatus[step.key];
          const { shape, word, color } = STEP_STATE[state];
          return (
            <li key={step.key}>
              <Popover>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className={i === PIPELINE.length - 1 ? 'pipeline__step pipeline__step--last' : 'pipeline__step'}
                  >
                    <span className="pipeline__num">{i + 1}</span>
                    {step.label}
                    <span className={`inline-flex ${color}`}><StatusShape shape={shape} /></span>
                    <span className="sr-only">{word}</span>
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-[min(340px,calc(100vw-32px))]">
                  <p className="m-0 mb-1 text-[13px] font-semibold text-ink">{step.label}</p>
                  <p className="m-0 mb-2.5">{step.meaning}</p>
                  <p className="m-0 flex items-center gap-1.5 text-xs font-semibold text-ink">
                    <span className={`inline-flex ${color}`}><StatusShape shape={shape} /></span>
                    {word}
                    <span className="font-normal text-body-c">· {note}</span>
                  </p>
                  {step.to && (
                    <Button variant="outline" size="sm" className="mt-3 gap-1.5" onClick={() => navigate(step.to)}>
                      {step.linkLabel} <ArrowRight size={13} aria-hidden="true" />
                    </Button>
                  )}
                </PopoverContent>
              </Popover>
            </li>
          );
        })}
      </ol>

      <Card className="mb-0">
        <CardHead
          title={`Ingestion status · ${material}`}
          sub="Each source is loaded into one canonical dataset of 3,650 daily rows before any analysis runs."
          right={<Badge tone="neutral" shape={false}>Example data</Badge>}
        />
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Source</th>
                <th>Data type</th>
                <th className="num">Rows</th>
                <th className="num">Missing</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {SOURCES.map((s) => (
                <tr key={s.name}>
                  <td><strong className="text-ink">{s.name}</strong></td>
                  <td>{s.kind}</td>
                  <td className="num">{s.rows}</td>
                  <td className="num">{s.missing.toFixed(1)}%</td>
                  <td><Badge tone={s.tone}>{s.label}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="grid-2 mb-0">
        <Card className="mb-0">
          <CardHead title="Data-quality checks" sub="Preparation order: validate, cleanse, impute, transform, normalise, treat outliers." />
          <ul className="checklist">
            {CHECKS.map((c) => (
              <li key={c.label}>
                <span>
                  <strong>{c.label}</strong>
                  <span>{c.detail}</span>
                </span>
                <Badge tone={c.tone}>{c.state}</Badge>
              </li>
            ))}
            <li>
              <span>
                <strong>Master-data gaps</strong>
                <span>Master data is never filled in automatically. 1 material is missing its unit of measure.</span>
              </span>
              <Badge tone={reviewed ? 'success' : 'risk'}>{reviewed ? 'Reviewed' : 'Review required'}</Badge>
            </li>
          </ul>
        </Card>

        <Card className="mb-0">
          <CardHead title="Ready to analyse?" sub="Warnings do not stop you. Unresolved master-data gaps do." />
          {reviewed ? (
            <AlertBar tone="success" title="Master-data gap reviewed">
              The unit of measure for the affected material has been confirmed. You can continue.
            </AlertBar>
          ) : (
            <AlertBar tone="error" title="Master-data gap blocks the run">
              Unit of measure is missing for 1 material. Fix or confirm it before continuing.
            </AlertBar>
          )}
          <AlertBar tone="warning" title="Supplier feed is 12% incomplete">
            Lead-time values are blank for some suppliers. You can continue, but Optimization results will be less certain.
          </AlertBar>
          <div className="flex flex-wrap gap-2 mt-3">
            {!reviewed && (
              <Button variant="outline" onClick={() => { setReviewed(true); toast.success('Master-data gap marked as reviewed'); }}>
                Mark gap as reviewed
              </Button>
            )}
            <Button disabled={!reviewed} onClick={onProceed} className="gap-1.5">
              {proceedLabel} <ArrowRight size={14} aria-hidden="true" />
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
