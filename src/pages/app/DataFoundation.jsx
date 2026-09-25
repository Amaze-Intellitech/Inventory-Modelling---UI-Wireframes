import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import {
  Database,
  RefreshCw,
  CheckCircle2,
  Clock,
  Layers,
  Filter,
  ShieldCheck,
  AlertTriangle,
  Server,
  ArrowRight,
  FileCheck,
  Building2,
  Cpu,
  Package,
} from 'lucide-react';
import { ViewHead, KpiTile, Badge, WhyDisclosure, Insight, Card, CardHead, AlertBar, DrillDown } from '../../components/CommonUI';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { usePlatform } from '../../context/PlatformContext';

// Data foundation pipeline steps
const PIPELINE_STEPS = [
  'Sources',
  'Source-to-target mapping',
  'Canonical dataset',
  'Ingestion',
  'Data quality',
  'Analytical dataset',
];

// Ingestion status rows for canonical dataset
const INGESTION_SOURCES = [
  { name: 'SAP S/4HANA', kind: 'Structured', rows: '3,650', missing: 0.0, tone: 'success', label: 'Loaded' },
  { name: 'Manhattan WMS', kind: 'Structured', rows: '3,650', missing: 0.4, tone: 'success', label: 'Loaded' },
  { name: 'DCS feed', kind: 'Unstructured', rows: '3,612', missing: 1.0, tone: 'success', label: 'Normalised' },
  { name: 'Quality management (LIMS)', kind: 'Semi-structured', rows: '3,650', missing: 0.8, tone: 'success', label: 'Loaded' },
  { name: 'Supplier feed', kind: 'Mixed', rows: '3,212', missing: 12.0, tone: 'watch', label: 'Gaps to review' },
];

// Data quality checks
const DATA_QUALITY_CHECKS = [
  { label: 'Validation passed', detail: 'Schema, types and ranges', tone: 'success', state: 'Passed' },
  { label: 'Outliers flagged', detail: '4 values to investigate, none removed automatically', tone: 'watch', state: 'Review' },
  { label: 'Transactional gaps', detail: 'Filled with the median where appropriate', tone: 'success', state: 'Handled' },
];

// Connected data source definitions
const SOURCES = [
  { name: 'SAP S/4HANA', domain: 'Inventory ledger, cost', records: '3.80M', cadence: 'Every 4.00h', status: 'ok', lastSync: '12 mins ago', systemType: 'ERP' },
  { name: 'Manhattan WMS', domain: 'Warehouse movement', records: '1.60M', cadence: 'Every 1.00h', status: 'ok', lastSync: '8 mins ago', systemType: 'WMS' },
  { name: 'Coupa', domain: 'Procurement, PO, supplier', records: '640.00K', cadence: 'Nightly', status: 'ok', lastSync: '3 hrs ago', systemType: 'Procurement' },
  { name: 'Quality Mgmt System', domain: 'Inspection, shelf-life', records: '160.00K', cadence: 'Nightly', status: 'watch', lastSync: '2.00h delayed', systemType: 'Quality' },
];

// Material taxonomy distribution in scope
const TAXONOMY_DISTRIBUTION = [
  { label: 'Raw Materials', count: '480 SKUs', pct: 33.8 },
  { label: 'Components & Electronics', count: '320 SKUs', pct: 22.5 },
  { label: 'Finished Goods', count: '240 SKUs', pct: 16.9 },
  { label: 'Spare Parts & MRO', count: '260 SKUs', pct: 18.3 },
  { label: 'Consumables', count: '120 SKUs', pct: 8.5 },
];

export default function DataFoundation() {
  const navigate = useNavigate();
  const { persona } = usePlatform();
  const shouldReduceMotion = useReducedMotion();

  // Derived metrics from existing canonical data
  const totalSources = SOURCES.length;
  const syncedSources = SOURCES.filter((s) => s.status === 'ok').length;

  // Persona-specific subtitle
  const subtitle = {
    exec: 'Executive governance view · Verifying data foundation integrity, source system health, and decision-readiness across enterprise operations.',
    analyst: 'Operational readiness view · Verifying inventory master records, source synchronization, and operational data quality for daily decision-making.',
    ds: 'Statistical & analytical view · Verifying schema compliance, source latency, completeness metrics, and statistical data inputs before modelling.',
  }[persona] || 'Verifying data foundation integrity, source systems, and data completeness.';

  // Render Ingestion Pipeline & Quality Checks with clean Alert format (No card action field)
  const renderIngestionPipeline = () => (
    <div className="space-y-4">
      <ol className="pipeline" aria-label="Data foundation pipeline">
        {PIPELINE_STEPS.map((step, i) => (
          <li
            key={step}
            className={i === PIPELINE_STEPS.length - 1 ? 'pipeline__step pipeline__step--last' : 'pipeline__step'}
          >
            <span className="pipeline__num">{i + 1}</span>
            {step}
          </li>
        ))}
      </ol>

      <Card className="mb-0">
        <CardHead
          title="Canonical Ingestion Status · MAT-1082 · Hydraulic Pump"
          sub="Each source is loaded into one canonical dataset of 3,650 daily rows before any analysis runs."
          right={<Badge tone="neutral" shape={false}>Reconciled v2.4</Badge>}
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
              {INGESTION_SOURCES.map((s) => (
                <tr key={s.name}>
                  <td><strong className="text-ink">{s.name}</strong></td>
                  <td>{s.kind}</td>
                  <td className="num font-mono">{s.rows}</td>
                  <td className="num font-mono">{s.missing.toFixed(1)}%</td>
                  <td><Badge tone={s.tone}>{s.label}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="grid-2 mb-0">
        <Card className="mb-0">
          <CardHead
            title="Data-quality checks"
            sub="Preparation order: validate, cleanse, impute, transform, normalise, treat outliers."
          />
          <ul className="checklist">
            {DATA_QUALITY_CHECKS.map((c) => (
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
              <Badge tone="watch">Review recommended</Badge>
            </li>
          </ul>
        </Card>

        {/* Ingestion & Quality Readiness displayed directly in Alert format */}
        <div className="flex flex-col justify-between space-y-2.5">
          <AlertBar tone="warning" title="Master-data gap notice">
            Unit of measure is missing for 1 material. Confirm in parameter mapping before automated PO generation.
          </AlertBar>
          <AlertBar tone="warning" title="Supplier feed is 12% incomplete">
            Lead-time values are blank for some suppliers. Analysis continues with default safety stock buffers.
          </AlertBar>
          <AlertBar tone="success" title="Reconciled Snapshot v2.40 Active">
            Baseline verified across ERP, WMS, and Procurement feeds. Certified for downstream inventory intelligence.
          </AlertBar>
        </div>
      </div>
    </div>
  );

  return (
    <section className="view max-w-7xl mx-auto space-y-6">
      {/* ===================================================================== */}
      {/* 1. VIEWHEAD & PERSONA-SPECIFIC READINESS INSIGHT                      */}
      {/* ===================================================================== */}
      <ViewHead
        title="Data Foundation"
        subtitle={<p className="text-body-c leading-relaxed">{subtitle}</p>}
        actions={
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" size="sm" onClick={() => navigate('/parameter-mapping')} className="cursor-pointer text-xs">
              Change parameters
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigate('/data-sources')} className="cursor-pointer text-xs">
              Change data sources
            </Button>
          </div>
        }
      />

      {persona === 'exec' && (
        <Insight label="Executive Data Readiness">
          Enterprise data foundation is <span className="metric">verified and synchronized</span> across 4 core business systems (ERP, WMS, Procurement, Quality), with 0 critical blocking issues for downstream decision intelligence.
        </Insight>
      )}

      {persona === 'analyst' && (
        <Insight label="Operational Data Readiness">
          Inventory data is <span className="metric">99.8% complete</span> and approved for operational analysis. One material requires unit-of-measure review, while minor QMS latency does not alter Class A material availability.
        </Insight>
      )}

      {persona === 'ds' && (
        <Insight label="Statistical & Schema Readiness">
          Dataset is <span className="metric">99.8% complete</span> across 6.20M transactional records with schema validation passed. Note 1 missing UoM master attribute and 12% supplier lead-time feed sparsity affecting optimization variance.
        </Insight>
      )}

      {/* ===================================================================== */}
      {/* 2. PERSONA-SPECIFIC PRIMARY KPIS (Meaningful, non-redundant)          */}
      {/* ===================================================================== */}
      {persona === 'exec' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mb-0">
          <KpiTile
            label="Enterprise Data Foundation"
            value="Verified"
            delta="Snapshot v2.40 frozen"
            deltaTone="up"
            sub="Reconciled ledger approved for capital decision models"
          />
          <KpiTile
            label="Connected Core Systems"
            value={`${totalSources} of ${totalSources} Active`}
            delta="ERP · WMS · Procurement · QMS"
            deltaTone="neutral"
            sub="All enterprise transactional feeds connected"
          />
          <KpiTile
            label="Operational Scope"
            value="4 Plants"
            delta="1,420 SKUs · 3 Regions"
            deltaTone="neutral"
            sub="Enterprise-wide manufacturing estate coverage"
          />
          <KpiTile
            label="Critical Blocking Issues"
            value="0 Blocking"
            delta="1 non-blocking review item"
            deltaTone="up"
            sub="No data pipeline errors halting optimization run"
          />
        </div>
      )}

      {persona === 'analyst' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mb-0">
          <KpiTile
            label="Operational Data Readiness"
            value="Ready"
            delta="Reconciled snapshot v2.40"
            deltaTone="up"
            sub="Inventory counts and cost valuations verified"
          />
          <KpiTile
            label="Active Materials in Scope"
            value="1,420 SKUs"
            delta="Across 4 manufacturing plants"
            deltaTone="neutral"
            sub="Raw materials, components, spares & consumables"
          />
          <KpiTile
            label="Source Sync Health"
            value={`${syncedSources} / ${totalSources} Sync`}
            delta="QMS 2.0h delayed"
            deltaTone="watch"
            sub="ERP and WMS feeds running on schedule"
          />
          <KpiTile
            label="Data Exceptions to Review"
            value="1 Master Gap"
            delta="Missing UoM on 1 material"
            deltaTone="watch"
            sub="Confirm unit of measure before PO run"
            onClick={() => navigate('/parameter-mapping')}
          />
        </div>
      )}

      {persona === 'ds' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mb-0">
          <KpiTile
            label="Data Quality Score"
            value="99.80%"
            delta="Schema & range checks passed"
            deltaTone="up"
            sub="Validation against master catalog definitions"
          />
          <KpiTile
            label="Transactional Records"
            value="6.20M"
            delta="Trailing 24 months"
            deltaTone="neutral"
            sub="Movements, receipts, and consumption events"
          />
          <KpiTile
            label="Source Sync & Latency"
            value={`${syncedSources} / ${totalSources} Sync`}
            delta="1 source with 2.0h latency"
            deltaTone="watch"
            sub="Quality Mgmt System batch delayed"
          />
          <KpiTile
            label="Active Master SKUs"
            value="1,420 Records"
            delta="5 material taxonomy classes"
            deltaTone="neutral"
            sub="Complete BOM and parameter mapping scope"
          />
        </div>
      )}

      {/* ===================================================================== */}
      {/* 3. PERSONA-SPECIFIC SUPPORTING SECTIONS                              */}
      {/* ===================================================================== */}

      {/* --- C-SUITE: Streamlined Executive Readiness & Source Health --- */}
      {persona === 'exec' && (
        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="space-y-6"
        >
          {/* Executive System Health Radar */}
          <Card>
            <CardHead
              title="Enterprise Source Systems Status"
              sub="Operational status of all upstream enterprise systems feeding inventory intelligence."
              right={
                <Badge tone="success" className="gap-1 text-xs">
                  <CheckCircle2 size={11} />
                  <span>All Feeds Operational</span>
                </Badge>
              }
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {SOURCES.map((s) => (
                <div key={s.name} className="p-3.5 rounded-lg border border-border bg-bg/60 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between gap-1 mb-1.5">
                      <span className="text-xs font-bold text-ink">{s.name}</span>
                      <Badge tone={s.status === 'ok' ? 'success' : 'watch'} className="text-[11px]">
                        {s.systemType}
                      </Badge>
                    </div>
                    <p className="text-[12px] text-body-c m-0 mb-2">{s.domain}</p>
                  </div>
                  <div className="pt-2 border-t border-border flex items-center justify-between text-xs">
                    <span className="text-subtle">Sync: {s.lastSync}</span>
                    <span className="font-mono font-medium text-ink">{s.records}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Enterprise Organizational Scope Summary */}
          <Card>
            <CardHead
              title="Enterprise Governance & Organizational Scope"
              sub="Validated enterprise boundaries and cost center hierarchy in snapshot v2.40."
            />
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-bg/60 border border-border">
                <span className="text-body-c block mb-1">Enterprise Org</span>
                <strong className="text-sm font-mono text-ink">1 Organization</strong>
              </div>
              <div className="p-3 rounded-lg bg-bg/60 border border-border">
                <span className="text-body-c block mb-1">Geographic Regions</span>
                <strong className="text-sm font-mono text-ink">3 Operating Regions</strong>
              </div>
              <div className="p-3 rounded-lg bg-bg/60 border border-border">
                <span className="text-body-c block mb-1">Manufacturing Plants</span>
                <strong className="text-sm font-mono text-ink">4 Active Plants</strong>
              </div>
              <div className="p-3 rounded-lg bg-bg/60 border border-border">
                <span className="text-body-c block mb-1">Cost Center Scope</span>
                <strong className="text-sm font-mono text-ink">22 Cost Centers</strong>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <p className="text-xs text-subtle m-0">
                Deterministic Snapshot v2.40 · All inventory models, working capital metrics, and risk projections reflect this verified baseline.
              </p>
              <Button
                size="sm"
                onClick={() => navigate('/app/descriptive')}
                className="gap-1.5 text-xs font-semibold cursor-pointer shrink-0"
              >
                <span>Continue to Descriptive Analytics</span>
                <ArrowRight size={13} />
              </Button>
            </div>
          </Card>

          {/* Executive WhyDisclosure */}
          <WhyDisclosure
            summary="Executive Data Trust & Decision Certification (Governance Breakdown)"
            drivers={[
              'Unified ledger reconciliation across SAP ERP, Manhattan WMS, and Coupa Procurement',
              'Zero critical data pipeline halts; 1 non-blocking UoM review item identified',
              'Enterprise-wide scope validated across 4 manufacturing plants and 3 operating regions',
            ]}
            meaning={[
              'Enterprise working capital figures and safety stock recommendations are certified on verified data',
              'Capital allocation decisions can proceed with full governance compliance',
            ]}
            action={[
              'Proceed with portfolio capital optimization and descriptive analytics',
              'Retain quarterly data governance snapshot review',
            ]}
          />

          {/* Collapsible Secondary Technical Drill-down for C-Suite */}
          <DrillDown
            title="Supporting Technical Evidence & Source Architecture"
            hint="Detailed feed schemas and data pipeline logs"
            defaultOpen={false}
          >
            <div className="pt-2">
              {renderIngestionPipeline()}
            </div>
          </DrillDown>
        </motion.div>
      )}

      {/* --- INVENTORY ANALYST: Operational Data Readiness & Material Inspection --- */}
      {persona === 'analyst' && (
        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="space-y-6"
        >
          {/* Ingestion Status Pipeline Component with Alert Format */}
          {renderIngestionPipeline()}

          {/* Connected Sources & Taxonomy Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Connected Sources Table */}
            <div className="lg:col-span-7 bg-surface border border-border rounded-md p-5 shadow-subtle flex flex-col justify-between">
              <div>
                <div className="card__head flex items-start justify-between gap-4 mb-3">
                  <div>
                    <h2 className="card__title text-sm font-bold text-ink m-0 mb-0.5">Connected Sources</h2>
                    <p className="card__sub text-xs text-body-c m-0">Upstream sources synchronized into the operational baseline.</p>
                  </div>
                  <Badge tone="accent" className="gap-1 text-xs">
                    <RefreshCw size={10} className="animate-spin-slow" />
                    <span>Reconciled v2.4</span>
                  </Badge>
                </div>

                <div className="rounded-sm border border-border overflow-x-auto mb-3">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs font-bold uppercase">Source</TableHead>
                        <TableHead className="text-xs font-bold uppercase">Domain</TableHead>
                        <TableHead className="text-xs font-bold uppercase">Cadence</TableHead>
                        <TableHead className="text-xs font-bold uppercase">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {SOURCES.map((s) => (
                        <TableRow key={s.name} className="hover:bg-bg/50">
                          <TableCell className="font-bold text-ink text-xs">{s.name}</TableCell>
                          <TableCell className="text-body-c text-xs">{s.domain}</TableCell>
                          <TableCell className="text-xs text-body-c">{s.cadence}</TableCell>
                          <TableCell>
                            <Badge tone={s.status === 'ok' ? 'success' : 'watch'} className="gap-1 text-xs">
                              {s.status === 'ok' ? <CheckCircle2 size={10} /> : <Clock size={10} />}
                              <span>{s.status === 'ok' ? 'Synchronized' : s.lastSync}</span>
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              <p className="text-xs text-subtle m-0">
                Snapshot v2.40 · All operational calculations and replenishment baselines reflect verified inventory levels.
              </p>
            </div>

            {/* Taxonomy in Scope */}
            <div className="lg:col-span-5 bg-surface border border-border rounded-md p-5 shadow-subtle">
              <h2 className="card__title text-sm font-bold text-ink m-0 mb-0.5">Operational Taxonomy & Scope</h2>
              <p className="card__sub text-xs text-body-c m-0 mb-4">Material classification and manufacturing plants in active scope.</p>

              <div className="space-y-4">
                <div>
                  <div className="text-xs font-bold text-body-c uppercase tracking-wider mb-2 flex items-center justify-between">
                    <span>Material Categories</span>
                    <span className="text-xs font-normal text-subtle">1,420 SKUs</span>
                  </div>
                  <ul className="space-y-1.5 text-xs">
                    {TAXONOMY_DISTRIBUTION.map((item) => (
                      <li key={item.label} className="flex flex-col gap-1 p-1.5 rounded bg-bg/60 border border-border/60">
                        <div className="flex justify-between items-center text-ink font-medium">
                          <span>{item.label}</span>
                          <span className="font-mono text-body-c">{item.count}</span>
                        </div>
                        <div className="w-full bg-border h-1 rounded-full overflow-hidden">
                          <div className="bg-primary-solid h-full rounded-full" style={{ width: `${item.pct}%` }} />
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-2 border-t border-border">
                  <div className="text-xs font-bold text-body-c uppercase tracking-wider mb-2">
                    Plant Coverage
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2 rounded bg-bg border border-border">
                      <span className="text-body-c block text-xs">Plant 1</span>
                      <strong className="text-ink font-medium">Assembly Hub</strong>
                    </div>
                    <div className="p-2 rounded bg-bg border border-border">
                      <span className="text-body-c block text-xs">Plant 2</span>
                      <strong className="text-ink font-medium">Engine Hub</strong>
                    </div>
                    <div className="p-2 rounded bg-bg border border-border">
                      <span className="text-body-c block text-xs">Plant 3</span>
                      <strong className="text-ink font-medium">Microelectronics</strong>
                    </div>
                    <div className="p-2 rounded bg-bg border border-border">
                      <span className="text-body-c block text-xs">Plant 4</span>
                      <strong className="text-ink font-medium">Fastener Depot</strong>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Operational WhyDisclosure */}
          <WhyDisclosure
            summary="Why Data Foundation is Approved for Operational Decisions (Operational Drivers)"
            drivers={[
              'Automated cross-system reconciliation across ERP (SAP S/4HANA), WMS (Manhattan), Procurement (Coupa)',
              'Validation confirms core inventory counts and costs for 1,420 materials across 4 plants',
              'Quality Management System delay (2.0h) is isolated to secondary inspection and does not alter stock counts',
            ]}
            meaning={[
              'Master dataset is certified safe for operational replenishment and inventory planning',
              'Material availability for core assembly lines is unaffected by secondary inspection delay',
            ]}
            action={[
              'Review single material UoM confirmation in parameter mapping if required',
              'Proceed to Descriptive Analytics and exception monitoring',
            ]}
          />
        </motion.div>
      )}

      {/* --- DATA SCIENTIST: Statistical & Schema Technical Evidence --- */}
      {persona === 'ds' && (
        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="space-y-6"
        >
          {/* Ingestion Status Pipeline Component with Alert Format */}
          {renderIngestionPipeline()}

          {/* Connected Sources & Taxonomy Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Connected Sources Table */}
            <div className="lg:col-span-7 bg-surface border border-border rounded-md p-5 shadow-subtle flex flex-col justify-between">
              <div>
                <div className="card__head flex items-start justify-between gap-4 mb-3">
                  <div>
                    <h2 className="card__title text-sm font-bold text-ink m-0 mb-0.5">Connected Sources</h2>
                    <p className="card__sub text-xs text-body-c m-0">Each upstream source synchronizes into a single reconciled snapshot.</p>
                  </div>
                  <Badge tone="accent" className="gap-1 text-xs">
                    <RefreshCw size={10} className="animate-spin-slow" />
                    <span>Reconciled v2.4</span>
                  </Badge>
                </div>

                <div className="rounded-sm border border-border overflow-x-auto mb-3">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs font-bold uppercase">Source</TableHead>
                        <TableHead className="text-xs font-bold uppercase">Domain</TableHead>
                        <TableHead className="text-right font-mono text-xs font-bold uppercase">Records</TableHead>
                        <TableHead className="text-xs font-bold uppercase">Cadence</TableHead>
                        <TableHead className="text-xs font-bold uppercase">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {SOURCES.map((s) => (
                        <TableRow key={s.name} className="hover:bg-bg/50">
                          <TableCell className="font-bold text-ink text-xs">{s.name}</TableCell>
                          <TableCell className="text-body-c text-xs">{s.domain}</TableCell>
                          <TableCell className="text-right font-mono font-medium text-xs">{s.records}</TableCell>
                          <TableCell className="text-xs text-body-c">{s.cadence}</TableCell>
                          <TableCell>
                            <Badge tone={s.status === 'ok' ? 'success' : 'watch'} className="gap-1 text-xs">
                              {s.status === 'ok' ? <CheckCircle2 size={10} /> : <Clock size={10} />}
                              <span>{s.status === 'ok' ? 'Synchronized' : s.lastSync}</span>
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              <p className="text-xs text-subtle m-0">
                Snapshot v2.40 · frozen at data-read time so every downstream module reflects the exact same baseline.
              </p>
            </div>

            {/* Taxonomy in Scope */}
            <div className="lg:col-span-5 bg-surface border border-border rounded-md p-5 shadow-subtle">
              <h2 className="card__title text-sm font-bold text-ink m-0 mb-0.5">Taxonomy in Scope</h2>
              <p className="card__sub text-xs text-body-c m-0 mb-4">Material and organizational classification in scope.</p>

              <div className="space-y-4">
                <div>
                  <div className="text-xs font-bold text-body-c uppercase tracking-wider mb-2 flex items-center justify-between">
                    <span>Material Taxonomy</span>
                    <span className="text-xs font-normal text-subtle">1,420 SKUs</span>
                  </div>
                  <ul className="space-y-1.5 text-xs">
                    {TAXONOMY_DISTRIBUTION.map((item) => (
                      <li key={item.label} className="flex flex-col gap-1 p-1.5 rounded bg-bg/60 border border-border/60">
                        <div className="flex justify-between items-center text-ink font-medium">
                          <span>{item.label}</span>
                          <span className="font-mono text-body-c">{item.count}</span>
                        </div>
                        <div className="w-full bg-border h-1 rounded-full overflow-hidden">
                          <div className="bg-primary-solid h-full rounded-full" style={{ width: `${item.pct}%` }} />
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-2 border-t border-border">
                  <div className="text-xs font-bold text-body-c uppercase tracking-wider mb-2">
                    Organization Scope
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2 rounded bg-bg border border-border">
                      <span className="text-body-c block text-xs">Enterprise</span>
                      <strong className="text-ink font-mono">1 Org</strong>
                    </div>
                    <div className="p-2 rounded bg-bg border border-border">
                      <span className="text-body-c block text-xs">Region</span>
                      <strong className="text-ink font-mono">3 Regions</strong>
                    </div>
                    <div className="p-2 rounded bg-bg border border-border">
                      <span className="text-body-c block text-xs">Plant</span>
                      <strong className="text-ink font-mono">4 Plants</strong>
                    </div>
                    <div className="p-2 rounded bg-bg border border-border">
                      <span className="text-body-c block text-xs">Cost Center</span>
                      <strong className="text-ink font-mono">22 Centers</strong>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Persona-Aware WhyDisclosure */}
          <WhyDisclosure
            summary="Why Data Quality Score is 99.80% (Reconciliation & Validation Evidence)"
            drivers={[
              'Automated cross-system reconciliation across ERP (SAP S/4HANA), WMS (Manhattan), Procurement (Coupa)',
              'Validation checks 100.00% of unit-of-measure conversions and unit cost fields against master catalog',
              'Quality Management System has a 2.00h ingestion latency on 160.00K inspection records',
            ]}
            meaning={[
              'Inventory counts and cost valuations are reconciled to frozen ledger snapshot v2.40',
              'Minor latency in QMS does not alter Class A material availability or cost baselines',
            ]}
            action={[
              'Maintain scheduled batch sync for QMS inspection lot release',
              'Proceed with downstream lot-sizing and RMLC analytics off verified snapshot',
            ]}
          />
        </motion.div>
      )}
    </section>
  );
}
