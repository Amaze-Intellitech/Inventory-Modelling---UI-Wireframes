import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useReducedMotion, AnimatePresence } from 'framer-motion';
import { SlidersHorizontal, ArrowRight, RotateCcw, TrendingUp, AlertTriangle, ShieldCheck } from 'lucide-react';
import { ViewHead, KpiTile, Insight, Chip, WhyDisclosure, Badge } from '../../components/CommonUI';
import { Button } from '@/components/ui/button';
import { usePlatform } from '../../context/PlatformContext';
import { Slider } from '@/components/ui/slider';

const LEVERS = [
  { key: 'demand', label: 'Finished-goods demand', min: -30, max: 40, ends: ['-30%', '+40%'], fmt: (v) => `${v > 0 ? '+' : ''}${v.toFixed(2)}%` },
  { key: 'lead', label: 'Supplier lead time', min: -10, max: 30, ends: ['-10 days', '+30 days'], fmt: (v) => `${v > 0 ? '+' : ''}${v.toFixed(0)} days` },
  { key: 'hold', label: 'Holding cost rate', min: -20, max: 25, ends: ['-20%', '+25%'], fmt: (v) => `${v > 0 ? '+' : ''}${v.toFixed(2)}%` },
  { key: 'price', label: 'Material price', min: -20, max: 30, ends: ['-20%', '+30%'], fmt: (v) => `${v > 0 ? '+' : ''}${v.toFixed(2)}%` },
  { key: 'cap', label: 'Supplier capacity', min: -40, max: 20, ends: ['-40%', '+20%'], fmt: (v) => `${v > 0 ? '+' : ''}${v.toFixed(2)}%` },
];

const PRESETS = [
  { label: 'Baseline', demand: 0, lead: 0, hold: 0 },
  { label: 'Demand +20.00%', demand: 20, lead: 0, hold: 0 },
  { label: 'Lead Time +15.00 days', demand: 0, lead: 15, hold: 0 },
  { label: 'Holding Cost +15.00%', demand: 0, lead: 0, hold: 15 },
  { label: 'Supplier Disruption', demand: -15, lead: 10, hold: 0 },
];

export default function WhatIf() {
  const { persona } = usePlatform();
  const navigate = useNavigate();
  // Raw lever positions, and which levers are actually moving. Levers that are not active are held at baseline.
  const ZERO = { demand: 0, lead: 0, hold: 0, price: 0, cap: 0 };
  const [vals, setVals] = useState(ZERO);
  const [mode, setMode] = useState('single'); // 'single' | 'multi'
  const [act, setAct] = useState({ demand: true, lead: false, hold: false, price: false, cap: false });
  const [activePreset, setActivePreset] = useState('Baseline');
  const shouldReduceMotion = useReducedMotion();

  const demand = act.demand ? vals.demand : 0;
  const lead = act.lead ? vals.lead : 0;
  const hold = act.hold ? vals.hold : 0;
  const price = act.price ? vals.price : 0;
  const cap = act.cap ? vals.cap : 0;

  const setVal = (key, v) => {
    setVals((p) => ({ ...p, [key]: v }));
    setActivePreset('');
  };

  // Single-variable mode moves exactly one lever; multi-variable mode moves any subset together.
  const toggleLever = (key) => {
    setActivePreset('');
    if (mode === 'single') {
      setAct({ demand: false, lead: false, hold: false, price: false, cap: false, [key]: true });
    } else {
      setAct((p) => ({ ...p, [key]: !p[key] }));
    }
  };

  const changeMode = (next) => {
    setMode(next);
    setActivePreset('');
    if (next === 'single') {
      // keep only the first active lever
      const first = Object.keys(act).find((k) => act[k]) || 'demand';
      setAct({ demand: false, lead: false, hold: false, price: false, cap: false, [first]: true });
    }
  };

  const applyPreset = (p) => {
    setVals({ ...ZERO, demand: p.demand, lead: p.lead, hold: p.hold });
    const on = { demand: p.demand !== 0, lead: p.lead !== 0, hold: p.hold !== 0, price: false, cap: false };
    const count = Object.values(on).filter(Boolean).length;
    setMode(count > 1 ? 'multi' : 'single');
    setAct(count === 0 ? { ...on, demand: true } : on);
    setActivePreset(p.label);
  };

  const resetToBaseline = () => {
    setVals(ZERO);
    setMode('single');
    setAct({ demand: true, lead: false, hold: false, price: false, cap: false });
    setActivePreset('Baseline');
  };

  const out = useMemo(() => {
    const baseValue = 42.85, baseSafety = 450, baseEoq = 320, baseStockout = 2.6, baseService = 97.4;

    const value = baseValue * (1 + (demand / 100) * 0.42 + (hold / 100) * 0.06 + (price / 100) * 0.8 - (cap / 100) * 0.05);
    const safety = baseSafety * (1 + (demand / 100) * 0.55 + (lead / 100) * 0.035 - (cap / 100) * 0.3);
    const eoq = baseEoq * Math.sqrt(1 + demand / 100) * Math.max(1 - (hold / 100) * 0.35, 0.4);
    const stockout = Math.max(0.3, baseStockout + demand * 0.09 + lead * 0.14 - hold * 0.01 - cap * 0.06);
    const service = Math.min(99.9, Math.max(80, baseService - demand * 0.05 - lead * 0.09 + hold * 0.01));
    // Coverage (days of consumption held) and turnover follow from projected inventory and daily consumption.
    const icr = 22 * (value / baseValue) / (1 + demand / 100);
    const turnover = 4.1 * (1 + demand / 100) / (value / baseValue);
    const capitalDelta = value - baseValue;
    const invValuePct = (capitalDelta / baseValue) * 100;

    let reco = 'Baseline holds — no policy change required at current parameters.';
    if (lead >= 10 && demand <= 0)
      reco = 'Supplier disruption pattern detected — pre-position safety stock on Class A materials and qualify a secondary supplier before lead time normalizes.';
    else if (demand >= 15)
      reco = 'Demand surge — recalibrate safety stock now; current EOQ batches will under-cover the projected consumption rate within 3 cycles.';
    else if (hold >= 10)
      reco = 'Rising capital cost — re-run EOQ across Class A materials; smaller, more frequent batches reduce holding exposure at this rate.';
    else if (lead >= 8)
      reco = 'Lead time extension — reorder points should move earlier; stockout risk rises faster than safety stock currently compensates for.';

    return { value, safety, eoq, stockout, service, capitalDelta, invValuePct, reco, icr, turnover };
  }, [demand, lead, hold, price, cap]);

  const changedLevers = LEVERS.filter((l) => act[l.key] && vals[l.key] !== 0).map((l) => `${l.label.toLowerCase()} ${l.fmt(vals[l.key])}`);

  const BL = { value: 42.85, safety: 450, eoq: 320, stockout: 2.6, service: 97.4 };
  const [hoveredRow, setHoveredRow] = useState(null);

  const chartRows = [
    {
      key: 'value',
      label: 'Inventory Value',
      blIdx: 100,
      scIdx: (out.value / BL.value) * 100,
      blActual: `$${BL.value.toFixed(2)}M`,
      scActual: `$${out.value.toFixed(2)}M`,
      delta: () => {
        const d = out.value - BL.value;
        const p = (d / BL.value) * 100;
        return `${d >= 0 ? '+' : ''}$${Math.abs(d).toFixed(2)}M (${p >= 0 ? '+' : ''}${p.toFixed(1)}%)`;
      },
      isGoodWhenHigh: false,
    },
    {
      key: 'safety',
      label: 'Safety Stock',
      blIdx: 100,
      scIdx: (out.safety / BL.safety) * 100,
      blActual: `${BL.safety.toFixed(0)} EA`,
      scActual: `${out.safety.toFixed(2)} EA`,
      delta: () => {
        const d = out.safety - BL.safety;
        const p = (d / BL.safety) * 100;
        return `${d >= 0 ? '+' : ''}${d.toFixed(2)} EA (${p >= 0 ? '+' : ''}${p.toFixed(1)}%)`;
      },
      isGoodWhenHigh: false,
    },
    {
      key: 'eoq',
      label: 'EOQ Lot Size',
      blIdx: 100,
      scIdx: (out.eoq / BL.eoq) * 100,
      blActual: `${BL.eoq.toFixed(0)} EA`,
      scActual: `${out.eoq.toFixed(2)} EA`,
      delta: () => {
        const d = out.eoq - BL.eoq;
        const p = (d / BL.eoq) * 100;
        return `${d >= 0 ? '+' : ''}${d.toFixed(2)} EA (${p >= 0 ? '+' : ''}${p.toFixed(1)}%)`;
      },
      isGoodWhenHigh: false,
    },
    {
      key: 'stockout',
      label: 'Stockout Risk',
      blIdx: 100,
      scIdx: (out.stockout / BL.stockout) * 100,
      blActual: `${BL.stockout.toFixed(2)}%`,
      scActual: `${out.stockout.toFixed(2)}%`,
      delta: () => {
        const pp = out.stockout - BL.stockout;
        return `${pp >= 0 ? '+' : ''}${pp.toFixed(2)} pp`;
      },
      isGoodWhenHigh: false,
    },
    {
      key: 'service',
      label: 'Service Level',
      blIdx: 100,
      scIdx: (out.service / BL.service) * 100,
      blActual: `${BL.service.toFixed(2)}%`,
      scActual: `${out.service.toFixed(2)}%`,
      delta: () => {
        const pp = out.service - BL.service;
        return `${pp >= 0 ? '+' : ''}${pp.toFixed(2)} pp`;
      },
      isGoodWhenHigh: true,
    },
  ];

  const allIdx = chartRows.map((r) => r.scIdx);
  const minIdx = Math.min(100, ...allIdx);
  const maxIdx = Math.max(100, ...allIdx);
  const padding = Math.max(5, (maxIdx - minIdx) * 0.15);
  const xMin = Math.max(0, minIdx - padding);
  const xMax = maxIdx + padding;
  const xRange = xMax - xMin;
  const toX = (idx) => ((idx - xMin) / xRange) * 100;
  const refX = toX(100);

  return (
    <section className="view max-w-7xl mx-auto">
      <ViewHead
        title="What-If Scenario Analysis"
        subtitle={
          <p className="text-body-c leading-relaxed">
            Move the levers below and watch the portfolio response recompute live — before committing to a real policy change.
          </p>
        }
        actions={
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={resetToBaseline}
              className="gap-1.5"
            >
              <RotateCcw size={13} />
              <span>Reset Levers</span>
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate('/app/optimization')}
              className="gap-1.5"
            >
              <span>Send to Optimization</span>
              <ArrowRight size={13} />
            </Button>
          </div>
        }
      />

      {/* KPI impact: projected inventory, coverage ratio, turnover — always paired with an AI interpretation */}
      <Insight label="Scenario result" defaultOpen>
        {changedLevers.length === 0
          ? 'With every assumption at baseline, projected inventory is $42.85M, covering 22 days of consumption and turning 4.1 times a year. Move a variable to see what changes.'
          : `If ${changedLevers.join(' and ')}, projected inventory moves to $${out.value.toFixed(2)}M (${out.invValuePct >= 0 ? '+' : ''}${out.invValuePct.toFixed(1)}%), coverage ${out.icr >= 22 ? 'rises' : 'falls'} to ${out.icr.toFixed(0)} days and turnover ${out.turnover >= 4.1 ? 'improves' : 'slows'} to ${out.turnover.toFixed(1)}×. ${out.reco}`}
      </Insight>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mb-6">
        <KpiTile
          label="Projected inventory"
          value={`$${out.value.toFixed(2)}M`}
          delta={Math.abs(out.capitalDelta) < 0.005 ? '● No change vs baseline' : `${out.capitalDelta >= 0 ? '▲ +' : '▼ −'}$${Math.abs(out.capitalDelta).toFixed(2)}M vs baseline`}
          deltaTone={out.capitalDelta > 0.05 ? 'down' : out.capitalDelta < -0.05 ? 'up' : 'flat'}
        />
        <KpiTile
          label="Inventory coverage ratio (ICR)"
          value={`${out.icr.toFixed(0)} days`}
          delta={Math.abs(out.icr - 22) < 0.5 ? '● No change vs baseline (22)' : `${out.icr >= 22 ? '▲' : '▼'} ${Math.abs(out.icr - 22).toFixed(0)} days vs baseline (22)`}
          deltaTone={Math.abs(out.icr - 22) < 0.5 ? 'flat' : out.icr < 22 ? 'down' : 'up'}
        />
        <KpiTile
          label="Inventory turnover ratio"
          value={`${out.turnover.toFixed(1)}×`}
          delta={Math.abs(out.turnover - 4.1) < 0.05 ? '● No change vs baseline (4.1×)' : `${out.turnover >= 4.1 ? '▲' : '▼'} ${Math.abs(out.turnover - 4.1).toFixed(1)}× vs baseline (4.1×)`}
          deltaTone={Math.abs(out.turnover - 4.1) < 0.05 ? 'flat' : out.turnover < 4.1 ? 'down' : 'up'}
        />
      </div>

      {/* Presets Row */}
      <div className="flex flex-wrap gap-2 mb-6">
        {PRESETS.map((p) => (
          <Chip
            key={p.label}
            active={activePreset === p.label}
            onClick={() => applyPreset(p)}
          >
            {p.label}
          </Chip>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mb-6">
        {/* Scenario Levers Card */}
        <div className="lg:col-span-5 bg-surface border border-border rounded-md p-5 shadow-subtle flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-border">
              <h2 className="card__title text-sm font-bold text-ink m-0">Scenario levers</h2>
              <Badge tone="accent">Interactive</Badge>
            </div>

            <div className="whatif-mode" role="group" aria-label="Scenario mode">
              <button type="button" aria-pressed={mode === 'single'} className={mode === 'single' ? 'active' : ''} onClick={() => changeMode('single')}>
                Single variable
              </button>
              <button type="button" aria-pressed={mode === 'multi'} className={mode === 'multi' ? 'active' : ''} onClick={() => changeMode('multi')}>
                Multi variable
              </button>
            </div>
            <p className="text-xs text-subtle mt-0 mb-3">
              {mode === 'single'
                ? 'Move one variable; every other assumption stays at baseline.'
                : 'Tick the variables to move together; the rest stay at baseline.'}
            </p>

            <div className="space-y-3">
              {LEVERS.map((lv) => {
                const on = act[lv.key];
                const v = vals[lv.key];
                return (
                  <div key={lv.key} className={`p-3 rounded border ${on ? 'bg-bg border-border-strong' : 'bg-surface border-border opacity-80'}`}>
                    <div className="flex justify-between items-center text-xs font-semibold mb-2">
                      <label className="inline-flex items-center gap-2 cursor-pointer text-ink">
                        <input
                          type={mode === 'single' ? 'radio' : 'checkbox'}
                          name="whatif-lever"
                          checked={on}
                          onChange={() => toggleLever(lv.key)}
                          style={{ accentColor: 'var(--primary)' }}
                        />
                        {lv.label}
                      </label>
                      <span className="num text-primary font-bold">{on ? lv.fmt(v) : 'Held at baseline'}</span>
                    </div>
                    <Slider
                      value={[v]}
                      min={lv.min}
                      max={lv.max}
                      step={1}
                      disabled={!on}
                      onValueChange={(val) => setVal(lv.key, val[0])}
                      className="my-2"
                    />
                    <div className="flex justify-between text-xs text-subtle num">
                      <span>{lv.ends[0]}</span>
                      <span>Baseline</span>
                      <span>{lv.ends[1]}</span>
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="text-xs text-subtle mt-3 mb-0">Any of the ~40 catalogued drivers can be added here once connected.</p>
          </div>

          <p className="text-xs text-subtle mt-4 m-0">
            Illustrative sensitivity model for storyboard calibration — the connected engine dynamically updates mathematical optimization constraints.
          </p>
        </div>

        {/* Portfolio Response Grid */}
        <div className="lg:col-span-7 bg-surface border border-border rounded-md p-5 shadow-subtle">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-border">
            <h2 className="card__title text-sm font-bold text-ink m-0">Portfolio response vs baseline</h2>
            <Badge tone={out.capitalDelta > 0 ? 'watch' : 'success'}>
              {out.capitalDelta > 0 ? 'Expansion' : 'Contraction'}
            </Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <KpiTile
              label="Demand Change (Scenario Δ)"
              value={`${demand > 0 ? '+' : ''}${demand.toFixed(2)}%`}
              sub="vs baseline (0.00%)"
              valueStyle={{ color: demand > 0 ? 'var(--error)' : demand < 0 ? 'var(--success)' : 'var(--ink)' }}
            />
            <KpiTile
              label="Lead-Time Change (Scenario Δ)"
              value={`${lead > 0 ? '+' : ''}${lead.toFixed(0)} days`}
              sub="vs baseline (0 days)"
              valueStyle={{ color: lead > 0 ? 'var(--error)' : lead < 0 ? 'var(--success)' : 'var(--ink)' }}
            />

            <KpiTile
              label="Total Inventory Value"
              value={`$${out.value.toFixed(2)}M`}
              sub={`Baseline $42.85M · Δ ${out.capitalDelta >= 0 ? '+' : ''}$${out.capitalDelta.toFixed(2)}M (${out.invValuePct >= 0 ? '+' : ''}${out.invValuePct.toFixed(1)}%)`}
              valueStyle={{ color: out.capitalDelta > 0.05 ? 'var(--error)' : out.capitalDelta < -0.05 ? 'var(--success)' : 'var(--ink)' }}
            />
            <KpiTile
              label="Working Capital Delta"
              value={`${out.capitalDelta >= 0 ? '+' : '-'}$${Math.abs(out.capitalDelta).toFixed(2)}M`}
              sub="vs baseline working capital"
              valueStyle={{ color: out.capitalDelta > 0.05 ? 'var(--error)' : out.capitalDelta < -0.05 ? 'var(--success)' : 'var(--ink)' }}
            />

            <KpiTile
              label="Safety Stock Requirement"
              value={`${out.safety.toFixed(2)} EA`}
              sub={`$${((out.safety * 600) / 1000).toFixed(2)}K carrying value`}
            />
            <KpiTile
              label="Stockout Risk"
              value={`${out.stockout.toFixed(2)}%`}
              sub="modeled portfolio stockout probability"
              valueStyle={{ color: out.stockout > 5 ? 'var(--error)' : out.stockout < 2 ? 'var(--success)' : 'var(--ink)' }}
            />

            <KpiTile
              label="EOQ Lot Size"
              value={`${out.eoq.toFixed(2)} EA`}
              sub={`$${((out.eoq * 600) / 1000).toFixed(2)}K batch value`}
            />
            <KpiTile
              label="Service Level"
              value={`${out.service.toFixed(2)}%`}
              sub="modeled portfolio fill rate"
              valueStyle={{ color: out.service < 90 ? 'var(--error)' : out.service >= 97 ? 'var(--success)' : 'var(--ink)' }}
            />
          </div>
        </div>
      </div>

      {/* Scenario Impact vs Baseline Indexed Bar Chart */}
      <div className="card bg-surface border border-border rounded-md p-5 shadow-subtle mb-6">
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 mb-4">
          <div>
            <h2 className="card__title text-sm font-bold text-ink m-0">Scenario Impact vs Baseline</h2>
            <p className="text-xs text-body-c mt-0.5">Modeled change in key inventory outcomes relative to baseline (100 = baseline index)</p>
          </div>
          <div className="flex gap-4 items-center text-xs text-body-c">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-border-strong inline-block" />
              <span>Baseline</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-primary-solid inline-block" />
              <span>Scenario</span>
            </span>
          </div>
        </div>

        <div className="space-y-3.5 pt-2">
          {chartRows.map((row) => {
            const isHovered = hoveredRow === row.key;
            const deltaStr = row.delta();
            const scHigherThanBl = row.scIdx > 100;
            const scColor =
              row.scIdx === 100
                ? 'var(--subtle)'
                : row.isGoodWhenHigh
                ? scHigherThanBl ? 'var(--success)' : 'var(--error)'
                : scHigherThanBl ? 'var(--error)' : 'var(--success)';

            const blWidth = toX(100) - toX(xMin);
            const scWidth = Math.abs(toX(row.scIdx) - toX(100));
            const scStartX = row.scIdx >= 100 ? toX(100) : toX(row.scIdx);

            return (
              <div
                key={row.key}
                className="group relative"
                onMouseEnter={() => setHoveredRow(row.key)}
                onMouseLeave={() => setHoveredRow(null)}
              >
                <div className="grid grid-cols-[130px_1fr] items-center gap-3">
                  <span className="text-xs text-body-c text-right font-medium truncate">
                    {row.label}
                  </span>

                  <div className="relative h-7 flex items-center">
                    {/* Baseline Bar */}
                    <div
                      className="absolute top-1 h-2 bg-border rounded-l-sm"
                      style={{ width: `${blWidth}%` }}
                    />

                    {/* Scenario Bar */}
                    <div
                      className="absolute bottom-1 h-2 rounded-sm transition-all duration-300"
                      style={{
                        left: `${scStartX}%`,
                        width: `${scWidth}%`,
                        backgroundColor: scColor,
                        opacity: 0.85,
                      }}
                    />

                    {/* 100 Reference Center Line */}
                    <div
                      className="absolute top-0 bottom-0 w-[2px] bg-ink z-10"
                      style={{ left: `${refX}%` }}
                    />

                    {/* Value readout */}
                    <span
                      className="absolute text-xs font-mono font-semibold"
                      style={{
                        left: `calc(${refX}% + 8px)`,
                        color: scColor,
                      }}
                    >
                      {row.scIdx === 100 ? '100' : `${row.scIdx.toFixed(1)}`}
                    </span>
                  </div>
                </div>

                {/* Tooltip on Hover */}
                {isHovered && (
                  <div className="absolute left-36 top-8 z-30 bg-ink text-white rounded p-2.5 text-xs font-mono shadow-elevated pointer-events-none max-w-xs animate-in fade-in-0 zoom-in-95">
                    <div className="font-sans font-bold text-info-bg mb-1">{row.label}</div>
                    <div className="text-subtle">Baseline: {row.blActual}</div>
                    <div className="text-success-tx font-semibold">Scenario: {row.scActual}</div>
                    <div className="border-t border-border-strong mt-1 pt-1 text-warning-tx">
                      Change: {deltaStr}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <p className="text-xs text-subtle mt-4 pt-3 border-t border-border m-0">
          Baseline = 100. Scenario values show relative movement; hover each row for actual business values.
        </p>
      </div>

      <Insight key={persona} label="Prescribed countermeasure">
        {persona === 'finance'
          ? `Bottom line: projected inventory is $${out.value.toFixed(2)}M${changedLevers.length ? ` (${out.invValuePct >= 0 ? '+' : ''}${out.invValuePct.toFixed(1)}%)` : ''} with ${out.icr.toFixed(0)} days of cover. ${out.reco}`
          : persona === 'planner'
          ? `Reading: safety stock responds non-linearly to demand variance and the lead-time lever widens the exposure window; the driver breakdown below shows each contribution. ${out.reco}`
          : `${out.reco}${changedLevers.length ? ' Check supplier capacity against the new order frequency before changing the policy.' : ''}`}
      </Insight>

      <div className="card bg-surface border border-border rounded-md p-5 shadow-subtle mb-6">
        <h2 className="card__title text-sm font-bold text-ink mb-1">Sensitivity driver breakdown</h2>
        <WhyDisclosure
          key={persona}
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
