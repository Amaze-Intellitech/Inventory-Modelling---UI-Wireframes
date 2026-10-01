import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useReducedMotion, AnimatePresence } from 'framer-motion';
import { SlidersHorizontal, ArrowRight, RotateCcw, TrendingUp, AlertTriangle, ShieldCheck } from 'lucide-react';
import { ViewHead, KpiTile, Insight, Chip, WhyDisclosure, Badge } from '../../components/CommonUI';
import { Button } from '@/components/ui/button';
import { usePlatform } from '../../context/PlatformContext';
import { Slider } from '@/components/ui/slider';
import PersonaTop from '../../components/PersonaTop';

const LEVERS = [
  { key: 'demand', label: 'Finished-goods demand', min: -30, max: 40, ends: ['-30%', '+40%'], fmt: (v) => `${v > 0 ? '+' : ''}${v.toFixed(2)}%` },
  { key: 'lead', label: 'Supplier lead time', min: -10, max: 30, ends: ['-10 days', '+30 days'], fmt: (v) => `${v > 0 ? '+' : ''}${v.toFixed(0)} days` },
  { key: 'hold', label: 'Holding cost rate', min: -20, max: 25, ends: ['-20%', '+25%'], fmt: (v) => `${v > 0 ? '+' : ''}${v.toFixed(2)}%` },
  { key: 'price', label: 'Material price', min: -20, max: 30, ends: ['-20%', '+30%'], fmt: (v) => `${v > 0 ? '+' : ''}${v.toFixed(2)}%` },
  { key: 'cap', label: 'Supplier capacity', min: -40, max: 20, ends: ['-40%', '+20%'], fmt: (v) => `${v > 0 ? '+' : ''}${v.toFixed(2)}%` },
];

const PERSONA_PRESETS = {
  supervisor: [
    { label: 'Baseline' },
    { label: 'Demand +20.00%', demand: 20 },
    { label: 'Lead Time +15.00 days', lead: 15 },
    { label: 'Supplier Capacity −30%', cap: -30 },
    { label: 'Supplier Disruption', lead: 10, cap: -25 },
  ],
  warehouse: [
    { label: 'Baseline' },
    { label: 'Demand −20.00% (slow-down)', demand: -20 },
    { label: 'Demand +20.00%', demand: 20 },
    { label: 'Lead Time +15.00 days (bunched deliveries)', lead: 15 },
    { label: 'Holding Cost +15.00%', hold: 15 },
  ],
  planner: [
    { label: 'Baseline' },
    { label: 'Demand +20.00%', demand: 20 },
    { label: 'Demand −15.00%', demand: -15 },
    { label: 'Plan Shift: demand +10%, lead +10 days', demand: 10, lead: 10 },
    { label: 'Supplier Capacity −20%', cap: -20 },
  ],
  procurement: [
    { label: 'Baseline' },
    { label: 'Lead Time +15.00 days', lead: 15 },
    { label: 'Material Price +15.00%', price: 15 },
    { label: 'Supplier Capacity −30%', cap: -30 },
    { label: 'Supplier Disruption', lead: 10, cap: -25 },
  ],
  finance: [
    { label: 'Baseline' },
    { label: 'Holding Cost +15.00%', hold: 15 },
    { label: 'Material Price +15.00%', price: 15 },
    { label: 'Demand −20.00% (downturn)', demand: -20 },
    { label: 'Downturn + Costly Capital', demand: -10, hold: 15 },
  ],
};

// Levers the persona controls or watches come first and are tagged.
const LEVER_FOCUS = {
  supervisor: ['lead', 'cap', 'demand'],
  warehouse: ['demand', 'hold', 'lead'],
  planner: ['demand', 'lead', 'cap'],
  procurement: ['lead', 'price', 'cap'],
  finance: ['hold', 'price', 'demand'],
};

// Order of the portfolio response tiles and of the impact-chart rows, per persona. The first entries are the persona's headline measures.
const RESPONSE_ORDER = {
  supervisor: ['stockout', 'service', 'safety', 'lead', 'demand', 'eoq', 'value', 'wc'],
  warehouse: ['value', 'safety', 'eoq', 'demand', 'wc', 'lead', 'service', 'stockout'],
  planner: ['demand', 'safety', 'eoq', 'lead', 'service', 'stockout', 'value', 'wc'],
  procurement: ['lead', 'eoq', 'stockout', 'safety', 'demand', 'value', 'wc', 'service'],
  finance: ['wc', 'value', 'service', 'eoq', 'safety', 'stockout', 'demand', 'lead'],
};
const CHART_FOCUS = {
  supervisor: ['stockout', 'service', 'safety'],
  warehouse: ['value', 'safety', 'eoq'],
  planner: ['safety', 'eoq', 'service'],
  procurement: ['eoq', 'stockout', 'value'],
  finance: ['value', 'service', 'safety'],
};
const RESPONSE_COPY = {
  supervisor: { title: 'Line-continuity response', chartSub: 'Highlighted: the outcomes that decide whether the lines keep running' },
  warehouse: { title: 'Stock and space response', chartSub: 'Highlighted: the outcomes that change what sits on the shelves' },
  planner: { title: 'Plan response', chartSub: 'Highlighted: the outcomes the production plan has to absorb' },
  procurement: { title: 'Order and supply response', chartSub: 'Highlighted: the outcomes that change what and when you order' },
  finance: { title: 'Capital response', chartSub: 'Highlighted: the outcomes that move cash and service' },
};

export default function WhatIf() {
  const { persona } = usePlatform();
  const presets = PERSONA_PRESETS[persona] || PERSONA_PRESETS.supervisor;
  const leverFocus = LEVER_FOCUS[persona] || [];
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
    const next = { ...ZERO, ...Object.fromEntries(Object.entries(p).filter(([k]) => k !== 'label')) };
    setVals(next);
    const on = { demand: next.demand !== 0, lead: next.lead !== 0, hold: next.hold !== 0, price: next.price !== 0, cap: next.cap !== 0 };
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


  const sgn = (v, d = 1) => `${v >= 0 ? '+' : ''}${v.toFixed(d)}`;
  const scenarioIs = changedLevers.length === 0 ? 'At baseline' : `If ${changedLevers.join(' and ')}`;
  const resultLine = `${scenarioIs}, projected inventory is $${out.value.toFixed(2)}M (${sgn(out.invValuePct)}%), covering ${out.icr.toFixed(0)} days and turning ${out.turnover.toFixed(1)}×.`;
  const personaTop = {
    supervisor: {
      label: 'Plant Supervisor Lens · Line Continuity Under This Scenario',
      headline: `${resultLine} Stockout risk moves to ${out.stockout.toFixed(2)}% (baseline ${BL.stockout.toFixed(2)}%) and service level to ${out.service.toFixed(1)}%. ${out.reco}`,
      kpis: [
        { label: 'Stockout risk', value: `${out.stockout.toFixed(2)}%`, delta: `${sgn(out.stockout - BL.stockout, 2)} pp vs baseline`, deltaTone: out.stockout - BL.stockout > 0.05 ? 'down' : out.stockout - BL.stockout < -0.05 ? 'up' : 'flat', sub: 'Chance a line waits on this material' },
        { label: 'Service level', value: `${out.service.toFixed(1)}%`, delta: `${sgn(out.service - BL.service, 2)} pp vs baseline`, deltaTone: out.service - BL.service < -0.05 ? 'down' : out.service - BL.service > 0.05 ? 'up' : 'flat', sub: `Baseline ${BL.service.toFixed(1)}%` },
        { label: 'Days of cover', value: `${out.icr.toFixed(0)} days`, delta: `${sgn(out.icr - 22, 0)} days vs baseline (22)`, deltaTone: out.icr - 22 < -0.5 ? 'down' : out.icr - 22 > 0.5 ? 'up' : 'flat', sub: 'Consumption held in stock' },
        { label: 'Safety stock needed', value: `${out.safety.toFixed(0)} EA`, delta: `${sgn(out.safety - BL.safety, 0)} EA vs baseline`, deltaTone: 'flat', sub: 'Buffer to hold the service level' },
      ],
    },
    warehouse: {
      label: 'Warehouse Manager Lens · Stock to Hold Under This Scenario',
      headline: `${resultLine} Safety stock moves to ${out.safety.toFixed(0)} EA and the EOQ lot to ${out.eoq.toFixed(0)} EA, which changes how much you store and how often loads arrive.`,
      kpis: [
        { label: 'Projected inventory', value: `$${out.value.toFixed(2)}M`, delta: `${sgn(out.capitalDelta, 2)}M vs baseline`, deltaTone: out.capitalDelta > 0.05 ? 'down' : out.capitalDelta < -0.05 ? 'up' : 'flat', sub: 'Value on the shelf' },
        { label: 'Safety stock', value: `${out.safety.toFixed(0)} EA`, delta: `${sgn(out.safety - BL.safety, 0)} EA vs baseline`, deltaTone: 'flat', sub: 'Held in reserve' },
        { label: 'EOQ lot size', value: `${out.eoq.toFixed(0)} EA`, delta: `${sgn(out.eoq - BL.eoq, 0)} EA vs baseline`, deltaTone: 'flat', sub: 'Quantity per receipt' },
        { label: 'Days of cover', value: `${out.icr.toFixed(0)} days`, delta: `${sgn(out.icr - 22, 0)} days vs baseline (22)`, deltaTone: 'flat', sub: 'Consumption held in stock' },
      ],
    },
    planner: {
      label: 'Materials Planner Lens · Plan Response to This Scenario',
      headline: `${resultLine} Safety stock responds non-linearly to demand variance and the lead-time lever widens the exposure window. ${out.reco}`,
      kpis: [
        { label: 'Safety stock', value: `${out.safety.toFixed(0)} EA`, delta: `${sgn(out.safety - BL.safety, 0)} EA vs baseline`, deltaTone: 'flat', sub: 'Re-index reorder points to this' },
        { label: 'EOQ lot size', value: `${out.eoq.toFixed(0)} EA`, delta: `${sgn(out.eoq - BL.eoq, 0)} EA vs baseline`, deltaTone: 'flat', sub: 'Order cadence changes with it' },
        { label: 'Stockout risk', value: `${out.stockout.toFixed(2)}%`, delta: `${sgn(out.stockout - BL.stockout, 2)} pp vs baseline`, deltaTone: out.stockout - BL.stockout > 0.05 ? 'down' : out.stockout - BL.stockout < -0.05 ? 'up' : 'flat', sub: 'If reorder points are not moved' },
        { label: 'Turnover', value: `${out.turnover.toFixed(1)}×`, delta: `${sgn(out.turnover - 4.1)}× vs baseline (4.1×)`, deltaTone: out.turnover - 4.1 < -0.05 ? 'down' : out.turnover - 4.1 > 0.05 ? 'up' : 'flat', sub: 'Annual stock turns' },
      ],
    },
    procurement: {
      label: 'Procurement Officer Lens · Ordering Under This Scenario',
      headline: `${resultLine} The EOQ lot moves to ${out.eoq.toFixed(0)} EA (baseline ${BL.eoq}), so order frequency and supplier load change. Check supplier capacity before changing the policy.`,
      kpis: [
        { label: 'EOQ lot size', value: `${out.eoq.toFixed(0)} EA`, delta: `${sgn(out.eoq - BL.eoq, 0)} EA vs baseline`, deltaTone: 'flat', sub: 'Quantity per PO' },
        { label: 'Stockout risk', value: `${out.stockout.toFixed(2)}%`, delta: `${sgn(out.stockout - BL.stockout, 2)} pp vs baseline`, deltaTone: out.stockout - BL.stockout > 0.05 ? 'down' : out.stockout - BL.stockout < -0.05 ? 'up' : 'flat', sub: 'Exposure to lead time and capacity' },
        { label: 'Safety stock', value: `${out.safety.toFixed(0)} EA`, delta: `${sgn(out.safety - BL.safety, 0)} EA vs baseline`, deltaTone: 'flat', sub: 'Extra to buy up front' },
        { label: 'Projected inventory', value: `$${out.value.toFixed(2)}M`, delta: `${sgn(out.capitalDelta, 2)}M vs baseline`, deltaTone: out.capitalDelta > 0.05 ? 'down' : out.capitalDelta < -0.05 ? 'up' : 'flat', sub: 'Spend this implies' },
      ],
    },
    finance: {
      label: 'Finance Controller Lens · Capital Under This Scenario',
      headline: `Bottom line: ${resultLine} ${out.reco}`,
      kpis: [
        { label: 'Projected inventory', value: `$${out.value.toFixed(2)}M`, delta: `${sgn(out.capitalDelta, 2)}M vs baseline`, deltaTone: out.capitalDelta > 0.05 ? 'down' : out.capitalDelta < -0.05 ? 'up' : 'flat', sub: `${sgn(out.invValuePct)}% vs baseline $${BL.value.toFixed(2)}M` },
        { label: 'Turnover', value: `${out.turnover.toFixed(1)}×`, delta: `${sgn(out.turnover - 4.1)}× vs baseline (4.1×)`, deltaTone: out.turnover - 4.1 < -0.05 ? 'down' : out.turnover - 4.1 > 0.05 ? 'up' : 'flat', sub: 'Annual stock turns' },
        { label: 'Days of cover', value: `${out.icr.toFixed(0)} days`, delta: `${sgn(out.icr - 22, 0)} days vs baseline (22)`, deltaTone: 'flat', sub: 'Cash tied up in consumption days' },
        { label: 'Safety-stock capital', value: `${out.safety.toFixed(0)} EA`, delta: `${sgn(out.safety - BL.safety, 0)} EA vs baseline`, deltaTone: 'flat', sub: 'Buffer held against variability' },
      ],
    },
  };

  const respOrder = RESPONSE_ORDER[persona] || RESPONSE_ORDER.supervisor;
  const respTiles = {
    demand: { label: 'Demand Change (Scenario Δ)', value: `${demand > 0 ? '+' : ''}${demand.toFixed(2)}%`, sub: 'vs baseline (0.00%)', valueStyle: { color: demand > 0 ? 'var(--error)' : demand < 0 ? 'var(--success)' : 'var(--ink)' } },
    lead: { label: 'Lead-Time Change (Scenario Δ)', value: `${lead > 0 ? '+' : ''}${lead.toFixed(0)} days`, sub: 'vs baseline (0 days)', valueStyle: { color: lead > 0 ? 'var(--error)' : lead < 0 ? 'var(--success)' : 'var(--ink)' } },
    value: { label: 'Total Inventory Value', value: `$${out.value.toFixed(2)}M`, sub: `Baseline $42.85M · Δ ${out.capitalDelta >= 0 ? '+' : ''}$${out.capitalDelta.toFixed(2)}M (${out.invValuePct >= 0 ? '+' : ''}${out.invValuePct.toFixed(1)}%)`, valueStyle: { color: out.capitalDelta > 0.05 ? 'var(--error)' : out.capitalDelta < -0.05 ? 'var(--success)' : 'var(--ink)' } },
    wc: { label: 'Working Capital Delta', value: `${out.capitalDelta >= 0 ? '+' : '-'}$${Math.abs(out.capitalDelta).toFixed(2)}M`, sub: 'vs baseline working capital', valueStyle: { color: out.capitalDelta > 0.05 ? 'var(--error)' : out.capitalDelta < -0.05 ? 'var(--success)' : 'var(--ink)' } },
    safety: { label: 'Safety Stock Requirement', value: `${out.safety.toFixed(2)} EA`, sub: `$${((out.safety * 600) / 1000).toFixed(2)}K carrying value` },
    stockout: { label: 'Stockout Risk', value: `${out.stockout.toFixed(2)}%`, sub: 'modeled portfolio stockout probability', valueStyle: { color: out.stockout > 5 ? 'var(--error)' : out.stockout < 2 ? 'var(--success)' : 'var(--ink)' } },
    eoq: { label: 'EOQ Lot Size', value: `${out.eoq.toFixed(2)} EA`, sub: `$${((out.eoq * 600) / 1000).toFixed(2)}K batch value` },
    service: { label: 'Service Level', value: `${out.service.toFixed(2)}%`, sub: 'modeled portfolio fill rate', valueStyle: { color: out.service < 90 ? 'var(--error)' : out.service >= 97 ? 'var(--success)' : 'var(--ink)' } },
  };
  const chartFocus = CHART_FOCUS[persona] || [];
  const orderedChartRows = [...chartRows].sort((a, b) => (chartFocus.indexOf(a.key) === -1 ? 9 : chartFocus.indexOf(a.key)) - (chartFocus.indexOf(b.key) === -1 ? 9 : chartFocus.indexOf(b.key)));
  const scenarioMoved = changedLevers.length > 0;
  const driverLines = scenarioMoved
    ? [
        act.demand && demand !== 0 && `Demand ${LEVERS[0].fmt(demand)}: safety stock moves to ${out.safety.toFixed(0)} EA (baseline ${BL.safety}) to absorb the change in arrival variance`,
        act.lead && lead !== 0 && `Lead time ${LEVERS[1].fmt(lead)}: stockout probability moves to ${out.stockout.toFixed(2)}% (baseline ${BL.stockout.toFixed(2)}%) as the exposure window changes`,
        act.hold && hold !== 0 && `Holding cost ${LEVERS[2].fmt(hold)}: EOQ lot moves to ${out.eoq.toFixed(0)} EA (baseline ${BL.eoq}), changing how often you replenish`,
        act.price && price !== 0 && `Material price ${LEVERS[3].fmt(price)}: projected inventory moves to $${out.value.toFixed(2)}M (${out.invValuePct >= 0 ? '+' : ''}${out.invValuePct.toFixed(1)}%)`,
        act.cap && cap !== 0 && `Supplier capacity ${LEVERS[4].fmt(cap)}: safety stock and stockout risk shift to ${out.safety.toFixed(0)} EA and ${out.stockout.toFixed(2)}% as supply becomes less dependable`,
      ].filter(Boolean)
    : ['All levers are at baseline, so nothing is driving a change. Move a lever or pick a scenario above to see which drivers respond.'];
  const COUNTERMEASURES = {
    supervisor: {
      label: 'Plant Supervisor Lens · Protect the Lines',
      body: `${out.reco} Service level ${out.service.toFixed(1)}% and stockout risk ${out.stockout.toFixed(2)}% are the numbers to hold.${scenarioMoved ? ' Brief the line leads if cover falls below lead time.' : ''}`,
      summary: 'Why line continuity responds to these levers',
      meaning: ['Stockout risk climbs faster than safety stock follows when lead time or supplier capacity worsens', 'A lower service level means more line waits for material'],
      action: ['Pre-position safety stock on the materials that feed the busiest lines', 'Agree an expedite route with the supplier before the lever becomes real'],
    },
    warehouse: {
      label: 'Warehouse Manager Lens · Stock and Space',
      body: `${out.reco} Projected inventory is $${out.value.toFixed(2)}M (${out.invValuePct >= 0 ? '+' : ''}${out.invValuePct.toFixed(1)}%), safety stock ${out.safety.toFixed(0)} EA and lot size ${out.eoq.toFixed(0)} EA.${scenarioMoved ? ' Check bin and dock capacity against those quantities.' : ''}`,
      summary: 'Why stock on the shelf responds to these levers',
      meaning: ['Safety stock and cycle stock both change, so shelf space needed changes with them', 'Smaller lots mean more receipts to book in'],
      action: ['Check storage capacity against the new safety-stock and lot sizes', 'Schedule receipts so deliveries do not bunch at the dock'],
    },
    planner: {
      label: 'Materials Planner Lens · Plan Response',
      body: `Reading: safety stock responds non-linearly to demand variance and the lead-time lever widens the exposure window. ${out.reco}`,
      summary: 'Why the plan has to move with these levers',
      meaning: ['Reorder points should move whenever demand or lead time moves; stale reorder points are where stockouts come from', 'Lot size and order cadence change together'],
      action: ['Re-index reorder points and safety stock in the plan', 'Send the simulated parameters to Optimization to see the time-phased impact'],
    },
    procurement: {
      label: 'Procurement Officer Lens · Orders and Suppliers',
      body: `${out.reco}${scenarioMoved ? ` Lot size moves to ${out.eoq.toFixed(0)} EA: check supplier capacity against the new order frequency before changing the policy.` : ''}`,
      summary: 'Why ordering responds to these levers',
      meaning: ['Order size and frequency move with holding cost and demand', 'Lead time and capacity decide how much safety stock you must buy up front'],
      action: ['Validate supplier capacity and MOQ against the new order frequency', 'Qualify a secondary supplier where lead time or capacity worsens'],
    },
    finance: {
      label: 'Finance Controller Lens · Capital Impact',
      body: `Bottom line: projected inventory is $${out.value.toFixed(2)}M${scenarioMoved ? ` (${out.invValuePct >= 0 ? '+' : ''}${out.invValuePct.toFixed(1)}%)` : ''} with ${out.icr.toFixed(0)} days of cover and ${out.turnover.toFixed(1)}× turnover. ${out.reco}`,
      summary: 'Why working capital responds to these levers',
      meaning: ['Working-capital change compounds across cycle stock and safety buffers at once', 'Higher holding cost or price raises the cost of every day of cover'],
      action: ['Confirm funding headroom before a policy change that raises inventory', 'Track turnover against the 4.1× baseline after the change'],
    },
  };
  const countermeasure = COUNTERMEASURES[persona] || COUNTERMEASURES.supervisor;
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

      {/* Persona headline + tiles lead the page; the three portfolio KPIs below are the shared evidence */}
      <PersonaTop persona={persona} config={personaTop} />

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
        {presets.map((p) => (
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
              {[...LEVERS].sort((a, b) => (leverFocus.indexOf(a.key) === -1 ? 9 : leverFocus.indexOf(a.key)) - (leverFocus.indexOf(b.key) === -1 ? 9 : leverFocus.indexOf(b.key))).map((lv) => {
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
                        {leverFocus.includes(lv.key) && <Badge tone="accent" shape={false}>key lever</Badge>}
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
            <p className="text-xs text-subtle mt-3 mb-0">Levers you control or watch are listed first. Any of the ~40 catalogued drivers can be added here once connected.</p>
          </div>

          <p className="text-xs text-subtle mt-4 m-0">
            Illustrative sensitivity model for storyboard calibration — the connected engine dynamically updates mathematical optimization constraints.
          </p>
        </div>

        {/* Portfolio Response Grid */}
        <div className="lg:col-span-7 bg-surface border border-border rounded-md p-5 shadow-subtle">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-border">
            <h2 className="card__title text-sm font-bold text-ink m-0">{RESPONSE_COPY[persona]?.title || 'Portfolio response'} · vs baseline</h2>
            <Badge tone={out.capitalDelta > 0 ? 'watch' : 'success'}>
              {out.capitalDelta > 0 ? 'Expansion' : 'Contraction'}
            </Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {respOrder.map((id, i) => (
              <KpiTile key={id} {...respTiles[id]} className={i < 2 ? 'ring-1 ring-primary' : undefined} />
            ))}
          </div>
        </div>
      </div>

      {/* Scenario Impact vs Baseline Indexed Bar Chart */}
      <div className="card bg-surface border border-border rounded-md p-5 shadow-subtle mb-6">
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 mb-4">
          <div>
            <h2 className="card__title text-sm font-bold text-ink m-0">Scenario Impact vs Baseline</h2>
            <p className="text-xs text-body-c mt-0.5">Modeled change relative to baseline (100 = baseline index). {RESPONSE_COPY[persona]?.chartSub}</p>
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
          {orderedChartRows.map((row) => {
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
                style={{ opacity: chartFocus.includes(row.key) ? 1 : 0.45 }}
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

      <Insight key={persona} label={countermeasure.label}>
        {countermeasure.body}
      </Insight>

      <div className="card bg-surface border border-border rounded-md p-5 shadow-subtle mb-6">
        <h2 className="card__title text-sm font-bold text-ink mb-1">Sensitivity driver breakdown</h2>
        <WhyDisclosure
          key={persona}
          summary={countermeasure.summary}
          drivers={driverLines}
          meaning={countermeasure.meaning}
          action={countermeasure.action}
        />
      </div>
    </section>
  );
}
