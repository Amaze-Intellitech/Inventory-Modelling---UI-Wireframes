import React, { useState, useMemo } from 'react';
import { Search, Database, RefreshCw, CheckCircle2, Clock, Layers, Filter } from 'lucide-react';
import { ViewHead, KpiTile, Badge, WhyDisclosure, Insight, DrillDown } from '../../components/CommonUI';
import { usePlatform } from '../../context/PlatformContext';
import IngestionStatus from '../../components/IngestionStatus';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { MATERIALS } from '../../data/mockData';

// The lens changes what the page leads with: trust for decisions, what to fix, or how the data was validated.
const READINESS_INSIGHT = {
  exec: (
    <>
      Your data is <span className="metric">99.8%</span> complete, so the numbers on every other screen can be relied on for
      decisions. Two gaps to know about: one material has no unit of measure and the supplier feed is 12% incomplete, which
      will make Optimization less certain.
    </>
  ),
  analyst: (
    <>
      Your data is <span className="metric">99.8%</span> complete and ready for analysis, with two things to look at:
      one material is missing its unit of measure (this must be fixed), and the supplier feed is 12% incomplete
      (this can wait, but it will make Optimization less certain).
    </>
  ),
  ds: (
    <>
      Snapshot v2.40 passes schema and completeness validation at <span className="metric">99.80%</span>, with every
      unit-of-measure conversion and unit-cost field checked against the master catalog. Open gaps: one material without a
      unit of measure, and a 12% incomplete supplier feed that widens the uncertainty on lead-time inputs. Quality inspection
      records arrive with a <span className="metric">2.00h</span> ingestion latency.
    </>
  ),
};

const SOURCES = [
  { name: 'SAP S/4HANA', domain: 'Inventory ledger, cost', records: '3.80M', cadence: 'Every 4.00h', status: 'ok', lastSync: '12 mins ago' },
  { name: 'Manhattan WMS', domain: 'Warehouse movement', records: '1.60M', cadence: 'Every 1.00h', status: 'ok', lastSync: '8 mins ago' },
  { name: 'Coupa', domain: 'Procurement, PO, supplier', records: '640.00K', cadence: 'Nightly', status: 'ok', lastSync: '3 hrs ago' },
  { name: 'Quality Mgmt System', domain: 'Inspection, shelf-life', records: '160.00K', cadence: 'Nightly', status: 'watch', lastSync: '2.00h delayed' },
];

export default function DataFoundation() {
  const { persona } = usePlatform();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredMaterials = useMemo(() => {
    if (!searchQuery.trim()) return MATERIALS;
    const q = searchQuery.toLowerCase();
    return MATERIALS.filter(
      (m) =>
        m.id.toLowerCase().includes(q) ||
        m.name.toLowerCase().includes(q) ||
        m.plant.toLowerCase().includes(q) ||
        m.category.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  return (
    <section className="view max-w-7xl mx-auto">
      <ViewHead
        title="Data Foundation"
        subtitle={
          <p className="text-body-c leading-relaxed">
            What the platform is reading from, at what scale, and how it's organized — before any analysis runs on top of it.
          </p>
        }
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate('/parameter-mapping')}>
              Change parameters
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigate('/data-sources')}>
              Change data sources
            </Button>
          </div>
        }
      />

      <Insight key={persona} label="Data readiness">
        {READINESS_INSIGHT[persona] || READINESS_INSIGHT.analyst}
      </Insight>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mb-6">
        <KpiTile
          label="Transactional Records Ingested"
          value="6.20M"
          sub="Movements, receipts & consumption, trailing 24 months"
        />
        <KpiTile
          label="Active Master Records"
          value="1,420"
          sub="Materials in active management scope"
        />
        <KpiTile
          label="Source Systems Connected"
          value="4"
          sub="ERP · WMS · Procurement · Quality"
        />
        <KpiTile
          label="Data Quality Score"
          value="99.80%"
          sub="Schema & completeness validation, last snapshot"
        />
      </div>

      <div className="mb-6">
        <IngestionStatus onProceed={() => navigate('/app/univariate')} proceedLabel="Continue to Univariate Analysis" />
      </div>

      <DrillDown title="Sources and taxonomy" hint="Connected systems and how materials are classified" className="mb-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Connected Sources */}
        <div className="lg:col-span-7 bg-surface border border-border rounded-md p-5 shadow-subtle flex flex-col justify-between">
          <div>
            <div className="card__head flex items-start justify-between gap-4 mb-3">
              <div>
                <h2 className="card__title text-sm font-bold text-ink">Connected sources</h2>
                <p className="card__sub text-xs text-body-c">Each source syncs on its own cadence into a single reconciled snapshot</p>
              </div>
              <Badge tone="accent" className="gap-1">
                <RefreshCw size={10} className="animate-spin-slow" />
                <span>Reconciled v2.4</span>
              </Badge>
            </div>

            <div className="rounded-sm border border-border overflow-x-auto mb-3">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Source</TableHead>
                    <TableHead>Domain</TableHead>
                    <TableHead className="text-right font-mono">Records</TableHead>
                    <TableHead>Cadence</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {SOURCES.map((s) => (
                    <TableRow key={s.name}>
                      <TableCell className="font-bold text-ink">{s.name}</TableCell>
                      <TableCell className="text-body-c text-xs">{s.domain}</TableCell>
                      <TableCell className="text-right font-mono font-medium">{s.records}</TableCell>
                      <TableCell className="text-xs text-body-c">{s.cadence}</TableCell>
                      <TableCell>
                        <Badge tone={s.status === 'ok' ? 'success' : 'watch'} className="gap-1">
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
            Snapshot v2.40 · frozen at data-read time so every screen in this session reflects the same instant, not a live-moving feed.
          </p>
        </div>

        {/* Taxonomy in Scope */}
        <div className="lg:col-span-5 bg-surface border border-border rounded-md p-5 shadow-subtle">
          <h2 className="card__title text-sm font-bold text-ink mb-1">Taxonomy in scope</h2>
          <p className="card__sub text-xs text-body-c mb-4">How every material is classified before any analytics run</p>

          <div className="space-y-4">
            <div>
              <div className="text-xs font-bold text-body-c uppercase tracking-wider mb-2 flex items-center justify-between">
                <span>Material taxonomy</span>
                <span className="text-xs font-normal text-subtle">1,420 SKUs</span>
              </div>
              <ul className="space-y-1.5 text-xs">
                {[
                  { label: 'Raw Materials', count: '480 SKUs', pct: 33.8 },
                  { label: 'Components & Electronics', count: '320 SKUs', pct: 22.5 },
                  { label: 'Finished Goods', count: '240 SKUs', pct: 16.9 },
                  { label: 'Spare Parts & MRO', count: '260 SKUs', pct: 18.3 },
                  { label: 'Consumables', count: '120 SKUs', pct: 8.5 },
                ].map((item) => (
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
                Organization &amp; cost-center taxonomy
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
      </DrillDown>

      {/* Material Ledger Table with Live Filter */}
      <DrillDown title="Material ledger" hint="Cost and quantity for every material" defaultOpen={persona !== 'exec'} className="mb-6">
      <div className="bg-surface border border-border rounded-md p-5 shadow-subtle">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="card__title text-sm font-bold text-ink m-0">Material ledger</h2>
            <p className="card__sub text-xs text-body-c m-0 mt-0.5">
              Inventory shown in both cost and quantity — the unit of measure always travels with the number
            </p>
          </div>

          <div className="relative w-full sm:w-80">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-subtle h-4 w-4" />
            <Input
              type="text"
              placeholder="Filter by material ID, name, plant..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-8 text-xs bg-bg"
            />
          </div>
        </div>

        <div className="rounded-sm border border-border overflow-hidden mb-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Material</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Plant</TableHead>
                <TableHead className="text-right font-mono">On-Hand Qty</TableHead>
                <TableHead className="text-right font-mono">Unit Cost</TableHead>
                <TableHead className="text-right font-mono">Inventory Value</TableHead>
                <TableHead>Class</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMaterials.length > 0 ? (
                filteredMaterials.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="font-bold text-ink">{m.id} · {m.name}</TableCell>
                    <TableCell>{m.category}</TableCell>
                    <TableCell>{m.plant}</TableCell>
                    <TableCell className="text-right font-mono font-medium">
                      {m.qty.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {m.uom}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      ${m.unitCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="text-right font-mono font-bold text-ink">
                      ${m.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell>
                      <Badge tone={m.abcClass === 'A' ? 'accent' : 'neutral'}>
                        Class {m.abcClass}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-6 text-body-c">
                    No materials matching "{searchQuery}"
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <WhyDisclosure
          summary="Why data foundation quality score is 99.80% (Driver breakdown)"
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
      </div>
      </DrillDown>
    </section>
  );
}
