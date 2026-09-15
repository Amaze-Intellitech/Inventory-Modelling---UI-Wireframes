import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { ViewHead, KpiTile, Chip, Badge, WhyDisclosure, Card, CardHead } from '../../components/CommonUI';
import { usePlatform } from '../../context/PlatformContext';
import {
  DECISION_ROWS,
  MATERIALS,
  EOQ_INPUTS,
  FORECAST_INPUTS,
  RMLC_STAGES,
} from '../../data/mockData';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

// Fixed analytical parameters aligned with upstream intelligence models
const ORDERING_COST = 230.0; // S = $230.00/order (fixed EDI-automated replenishment cost)
const HOLDING_RATE = 0.06;   // i = 6.00% annual carrying rate
const SERVICE_FACTOR_Z = 1.65; // Z = 1.65 for 95.00% one-sided coverage

// Formatting helpers
const formatCurrency = (v, decimals = 2) =>
  `$${Number(v).toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`;

const formatNum = (v, decimals = 0) =>
  Number(v).toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });

// Persona descriptions for context strip
const PERSONA_DESCRIPTIONS = {
  ds: {
    label: 'Data Scientist Lens',
    sub: 'Emphasizing statistical drivers, confidence bounds, model R², and mathematical relationships.',
  },
  analyst: {
    label: 'Inventory Analyst Lens',
    sub: 'Emphasizing operational coverage, lead time gaps, replenishment sizing, and tactical workflow next steps.',
  },
  exec: {
    label: 'Executive / C-Suite Lens',
    sub: 'Emphasizing bottom-line EBITDA impact, working capital release, service level risk, and decision priority.',
  },
};

// 8 Enterprise Prompt Library definitions
const PROMPT_LIBRARY = [
  {
    id: 'explain_health',
    title: 'Explain Inventory Health',
    category: 'Health & Turnover',
    tone: 'accent',
    query: 'Explain Inventory Health',
    desc: 'Evaluate on-hand inventory position, turnover velocity, and coverage health across active SKUs.',
  },
  {
    id: 'stockout_risk',
    title: 'Investigate Stockout Risk',
    category: 'Continuity & Risk',
    tone: 'risk',
    query: 'Investigate Stockout Risk',
    desc: 'Analyze supplier lead times against days of supply to identify unbuffered stockout exposures.',
  },
  {
    id: 'working_capital',
    title: 'Find Working Capital Opportunities',
    category: 'Capital Release',
    tone: 'success',
    query: 'Find Working Capital Opportunities',
    desc: 'Identify excess cycle inventory across Class A materials and quantify cash release potential.',
  },
  {
    id: 'forecast_risk',
    title: 'Explain Forecast Risk',
    category: 'Model & Demand',
    tone: 'watch',
    query: 'Explain Forecast Risk',
    desc: 'Assess 12-week forward demand projections, statistical model fit (R²), and volatility bounds.',
  },
  {
    id: 'lifecycle_risk',
    title: 'Review Lifecycle Risk',
    category: 'Aging & Obsolescence',
    tone: 'risk',
    query: 'Review Lifecycle Risk',
    desc: 'Review 4-stage RMLC distribution, stagnant sub-lots (>90d), and shelf-life expiration windows.',
  },
  {
    id: 'optimize_replenishment',
    title: 'Optimize Replenishment',
    category: 'Lot Sizing',
    tone: 'accent',
    query: 'Optimize Replenishment',
    desc: 'Synthesize EOQ lot sizes and dynamic safety stock buffers for multi-echelon replenishment.',
  },
  {
    id: 'challenge_reco',
    title: 'Challenge the Recommendation',
    category: 'Stress Testing',
    tone: 'neutral',
    query: 'Challenge the Recommendation',
    desc: 'Stress-test policy recommendations against demand surges (+20%) and lead-time disruptions (+15d).',
  },
  {
    id: 'exec_summary',
    title: 'Executive Decision Summary',
    category: 'Executive Synthesis',
    tone: 'success',
    query: 'Executive Decision Summary',
    desc: 'Cross-module briefing on all 4 synthesized enterprise decisions ($5.51M net value identified).',
  },
];

const TAG_TONE = { 'Act now': 'risk', Optimize: 'accent', Monitor: 'watch', Prevent: 'neutral' };

// ============================================================================
// CONTEXTUAL INTELLIGENCE SYNTHESIS ENGINE
// ============================================================================
function buildMaterialContext(selectedMaterial) {
  const mat = selectedMaterial || MATERIALS[0];
  const id = mat.id;
  const name = mat.name;
  const plant = mat.plant;
  const category = mat.category;
  const uom = mat.uom || 'EA';
  const unitCost = mat.unitCost ?? 100.0;
  const qty = mat.qty ?? 0;
  const value = mat.value ?? (qty * unitCost);
  const abcClass = mat.abcClass || 'A';

  const eoqInput = EOQ_INPUTS[id] || { demand: 4800.0, currentBatchQty: 600.0 };
  const forecastInput = FORECAST_INPUTS[id] || { leadTimeDays: 30, demandCV: 0.12, trendPerWeek: 0.002, modelR2: 0.85, rmseRatio: 0.09 };

  const demand = eoqInput.demand;
  const currentBatchQty = eoqInput.currentBatchQty;
  const leadTimeDays = forecastInput.leadTimeDays || 30;
  const demandCV = forecastInput.demandCV || 0.12;
  const trendPerWeek = forecastInput.trendPerWeek || 0;
  const modelR2 = forecastInput.modelR2 ?? 0.85;
  const rmseRatio = forecastInput.rmseRatio || 0.09;

  const holdingCostPerUnit = HOLDING_RATE * unitCost;
  const qStar = holdingCostPerUnit > 0 ? Math.round(Math.sqrt((2 * demand * ORDERING_COST) / holdingCostPerUnit)) : 0;

  const dailyDemand = demand / 365;
  const dos = dailyDemand > 0 ? (qty / dailyDemand) : 0;
  const turnsPerYear = qty > 0 ? (demand / qty) : 0;

  const sigmaD = dailyDemand * demandCV;
  const safetyStock = Math.round(SERVICE_FACTOR_Z * sigmaD * Math.sqrt(leadTimeDays));
  const targetBuffer = safetyStock + qStar;
  const orderQty = Math.max(0, targetBuffer > qty ? Math.round(targetBuffer - qty) : 0);
  const orderValue = orderQty * unitCost;

  const confidencePct = (Math.min(99.9, Math.max(50.0, modelR2 * 100))).toFixed(1);

  let lifecycleStateLabel = 'Active Circulation';
  let daysStagnant = 0;
  let stagnantLot = null;
  let supplierName = 'Qualified Tier-1 Supplier';

  if (id === 'MAT-1082') {
    supplierName = 'HydraTech Dynamics GmbH (Sole Source)';
    lifecycleStateLabel = 'Active Circulation';
    daysStagnant = 0;
  } else if (id === 'MAT-4120') {
    supplierName = 'SiliconFoundry International (Allocated Supply)';
    lifecycleStateLabel = 'Active Circulation (Depletion Alert)';
    daysStagnant = 0;
  } else if (id === 'MAT-2041') {
    supplierName = 'Apex Energy Storage Ltd (Dual Sourced)';
    lifecycleStateLabel = 'At Risk (Sub-Batch Stagnation)';
    daysStagnant = 95;
    stagnantLot = 'Lot L-2241 (18,500 EA / $95,090.00)';
  } else if (id === 'MAT-5501') {
    supplierName = 'BondTech Polymer Solutions (Multi-Vendor)';
    lifecycleStateLabel = 'Liquidation (Shelf-Life Expiry)';
    daysStagnant = 165;
    stagnantLot = 'Batch SP-5501 (1,400 KG / $57,600.00)';
  }

  return {
    id,
    name,
    plant,
    category,
    uom,
    unitCost,
    qty,
    value,
    abcClass,
    demand,
    currentBatchQty,
    leadTimeDays,
    demandCV,
    trendPerWeek,
    modelR2,
    rmseRatio,
    holdingCostPerUnit,
    qStar,
    dailyDemand,
    dos,
    turnsPerYear,
    sigmaD,
    safetyStock,
    targetBuffer,
    orderQty,
    orderValue,
    confidencePct,
    lifecycleStateLabel,
    daysStagnant,
    stagnantLot,
    supplierName,
  };
}

// Visual Evidence Charts
function InventoryPositionChart({ ctx }) {
  const maxBarVal = Math.max(ctx.qty, ctx.targetBuffer, 1) * 1.15;
  const currentPct = Math.min(100, Math.max(8, (ctx.qty / maxBarVal) * 100));
  const targetPct = Math.min(100, Math.max(8, (ctx.targetBuffer / maxBarVal) * 100));
  const ssFraction = ctx.targetBuffer > 0 ? (ctx.safetyStock / ctx.targetBuffer) : 0.3;
  const eoqFraction = ctx.targetBuffer > 0 ? (ctx.qStar / ctx.targetBuffer) : 0.7;

  return (
    <div className="flex flex-col gap-3 text-xs">
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-slate-50 dark:bg-navy-900/60 p-2 rounded border border-slate-200 dark:border-navy-700">
          <span className="text-[10px] text-slate-400 uppercase block font-semibold">Current On-Hand</span>
          <strong className="num text-sm text-slate-900 dark:text-slate-100 block">{formatNum(ctx.qty)} {ctx.uom}</strong>
          <span className="text-[11px] text-slate-500">{formatCurrency(ctx.value)}</span>
        </div>
        <div className="bg-slate-50 dark:bg-navy-900/60 p-2 rounded border border-slate-200 dark:border-navy-700">
          <span className="text-[10px] text-slate-400 uppercase block font-semibold">Safety Stock</span>
          <strong className="num text-sm text-amber-600 dark:text-amber-400 block">{formatNum(ctx.safetyStock)} {ctx.uom}</strong>
          <span className="text-[11px] text-slate-500">Z=1.65 buffer</span>
        </div>
        <div className="bg-slate-50 dark:bg-navy-900/60 p-2 rounded border border-slate-200 dark:border-navy-700">
          <span className="text-[10px] text-slate-400 uppercase block font-semibold">Calibrated EOQ (Q*)</span>
          <strong className="num text-sm text-cyan-600 dark:text-cyan-400 block">{formatNum(ctx.qStar)} {ctx.uom}</strong>
          <span className="text-[11px] text-slate-500">Optimal lot</span>
        </div>
      </div>

      <div className="flex flex-col gap-2.5 bg-slate-50/70 dark:bg-navy-900/40 p-3 rounded-md border border-slate-200 dark:border-navy-700">
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="font-semibold text-slate-700 dark:text-slate-300">Current Position</span>
            <span className="font-mono font-bold text-slate-900 dark:text-slate-100">{formatNum(ctx.qty)} {ctx.uom}</span>
          </div>
          <div className="h-5 w-full bg-slate-200 dark:bg-navy-800 rounded overflow-hidden flex">
            <div
              style={{ width: `${currentPct}%` }}
              className="bg-slate-800 dark:bg-slate-300 rounded text-white dark:text-slate-900 text-[10px] font-semibold flex items-center px-2"
            >
              On-Hand
            </div>
          </div>
        </div>

        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="font-semibold text-slate-700 dark:text-slate-300">Target Buffer (SS + EOQ)</span>
            <span className="font-mono font-bold text-cyan-600 dark:text-cyan-400">{formatNum(ctx.targetBuffer)} {ctx.uom} ({formatCurrency(ctx.targetBuffer * ctx.unitCost)})</span>
          </div>
          <div className="h-5 w-full bg-slate-200 dark:bg-navy-800 rounded overflow-hidden flex">
            <div
              style={{ width: `${targetPct * ssFraction}%` }}
              className="bg-amber-600 text-white text-[10px] font-bold flex items-center justify-center border-r border-white/40"
              title="Safety Stock"
            >
              SS
            </div>
            <div
              style={{ width: `${targetPct * eoqFraction}%` }}
              className="bg-cyan-600 text-white text-[10px] font-bold flex items-center px-2"
              title="Calibrated EOQ"
            >
              EOQ Lot ({formatNum(ctx.qStar)} {ctx.uom})
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DemandForecastChart({ ctx }) {
  return (
    <div className="flex flex-col gap-3 text-xs">
      <div className="grid grid-cols-4 gap-2">
        <div className="bg-slate-50 dark:bg-navy-900/60 p-2 rounded border border-slate-200 dark:border-navy-700">
          <span className="text-[10px] text-slate-400 uppercase block font-semibold">Model Fit</span>
          <strong className="num text-sm text-cyan-600 dark:text-cyan-400 block">{ctx.modelR2.toFixed(2)}</strong>
          <span className="text-[10.5px] text-slate-500">{ctx.confidencePct}% conf</span>
        </div>
        <div className="bg-slate-50 dark:bg-navy-900/60 p-2 rounded border border-slate-200 dark:border-navy-700">
          <span className="text-[10px] text-slate-400 uppercase block font-semibold">Demand Volatility</span>
          <strong className="num text-sm text-slate-900 dark:text-slate-100 block">CV {ctx.demandCV.toFixed(2)}</strong>
          <span className="text-[10.5px] text-slate-500 font-mono">σ={ctx.sigmaD.toFixed(1)}/d</span>
        </div>
        <div className="bg-slate-50 dark:bg-navy-900/60 p-2 rounded border border-slate-200 dark:border-navy-700">
          <span className="text-[10px] text-slate-400 uppercase block font-semibold">Daily Rate</span>
          <strong className="num text-sm text-slate-900 dark:text-slate-100 block">{ctx.dailyDemand.toFixed(1)} {ctx.uom}</strong>
          <span className="text-[10.5px] text-slate-500">{formatNum(ctx.demand)}/yr</span>
        </div>
        <div className="bg-slate-50 dark:bg-navy-900/60 p-2 rounded border border-slate-200 dark:border-navy-700">
          <span className="text-[10px] text-slate-400 uppercase block font-semibold">Trend</span>
          <strong className="num text-sm text-slate-900 dark:text-slate-100 block">{(ctx.trendPerWeek * 100).toFixed(2)}%</strong>
          <span className="text-[10.5px] text-slate-500">per week</span>
        </div>
      </div>
    </div>
  );
}

function CoverageLeadTimeChart({ ctx }) {
  const isDeficit = ctx.dos < ctx.leadTimeDays;
  const gapDays = Math.abs(ctx.dos - ctx.leadTimeDays).toFixed(1);
  const maxDays = Math.max(ctx.dos, ctx.leadTimeDays, 1) * 1.25;

  const dosPct = Math.min(100, Math.max(6, (ctx.dos / maxDays) * 100));
  const leadPct = Math.min(100, Math.max(6, (ctx.leadTimeDays / maxDays) * 100));

  return (
    <div className="flex flex-col gap-3 text-xs">
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-slate-50 dark:bg-navy-900/60 p-2 rounded border border-slate-200 dark:border-navy-700">
          <span className="text-[10px] text-slate-400 uppercase block font-semibold">Days of Supply</span>
          <strong className={`num text-sm block ${isDeficit ? 'text-rose-600' : 'text-emerald-600'}`}>{ctx.dos.toFixed(1)} Days</strong>
          <span className="text-[11px] text-slate-500">{formatNum(ctx.qty)} {ctx.uom}</span>
        </div>
        <div className="bg-slate-50 dark:bg-navy-900/60 p-2 rounded border border-slate-200 dark:border-navy-700">
          <span className="text-[10px] text-slate-400 uppercase block font-semibold">Lead Time</span>
          <strong className="num text-sm text-slate-900 dark:text-slate-100 block">{ctx.leadTimeDays} Days</strong>
          <span className="text-[11px] text-slate-500">Replenishment window</span>
        </div>
        <div className="bg-slate-50 dark:bg-navy-900/60 p-2 rounded border border-slate-200 dark:border-navy-700">
          <span className="text-[10px] text-slate-400 uppercase block font-semibold">Buffer Status</span>
          <strong className={`text-sm block ${isDeficit ? 'text-rose-600' : 'text-emerald-600'}`}>{isDeficit ? `-${gapDays}d Deficit` : `+${gapDays}d Buffer`}</strong>
          <span className="text-[11px] text-slate-500">{isDeficit ? 'Risk active' : 'Protected'}</span>
        </div>
      </div>

      <div className="flex flex-col gap-2.5 bg-slate-50/70 dark:bg-navy-900/40 p-3 rounded-md border border-slate-200 dark:border-navy-700">
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="font-semibold text-slate-700 dark:text-slate-300">On-Hand Days of Supply</span>
            <span className={`font-mono font-bold ${isDeficit ? 'text-rose-600' : 'text-emerald-600'}`}>{ctx.dos.toFixed(1)} Days</span>
          </div>
          <div className="h-5 w-full bg-slate-200 dark:bg-navy-800 rounded overflow-hidden">
            <div
              style={{ width: `${dosPct}%` }}
              className={`h-full ${isDeficit ? 'bg-rose-600' : 'bg-emerald-600'} text-white text-[10px] font-bold flex items-center px-2`}
            >
              {ctx.dos.toFixed(1)}d Runway
            </div>
          </div>
        </div>

        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="font-semibold text-slate-700 dark:text-slate-300">Supplier Lead Time ({ctx.supplierName.split('(')[0].trim()})</span>
            <span className="font-mono font-bold text-slate-900 dark:text-slate-100">{ctx.leadTimeDays} Days</span>
          </div>
          <div className="h-5 w-full bg-slate-200 dark:bg-navy-800 rounded overflow-hidden">
            <div
              style={{ width: `${leadPct}%` }}
              className="h-full bg-slate-600 text-white text-[10px] font-bold flex items-center px-2"
            >
              {ctx.leadTimeDays}d Lead Time
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DecisionValueChart() {
  const parsedDecisions = useMemo(() => {
    return DECISION_ROWS.map((d) => {
      let numericVal = 0;
      if (d.impact.includes('$3.65M')) numericVal = 3.65;
      else if (d.impact.includes('$1.82M')) numericVal = 1.82;
      else if (d.impact.includes('$57,600')) numericVal = 0.0576;
      return { ...d, numericVal };
    });
  }, []);

  const totalNumeric = parsedDecisions.reduce((sum, d) => sum + d.numericVal, 0);

  return (
    <div className="flex flex-col gap-3 text-xs">
      <div className="flex justify-between items-center bg-slate-50 dark:bg-navy-900/60 p-2.5 rounded border border-slate-200 dark:border-navy-700">
        <div>
          <span className="text-[10px] text-slate-400 uppercase block font-semibold">Total Identified Net Value</span>
          <strong className="num text-base text-emerald-600 dark:text-emerald-400">$5.51M</strong>
        </div>
        <Badge tone="success">95.80% Average Confidence</Badge>
      </div>

      <div className="h-5 w-full bg-slate-200 dark:bg-navy-800 rounded overflow-hidden flex">
        {parsedDecisions.filter((d) => d.numericVal > 0).map((d) => {
          const pct = totalNumeric > 0 ? (d.numericVal / totalNumeric) * 100 : 33;
          const bg = d.tag === 'Optimize' ? 'bg-emerald-600' : d.tag === 'Act now' ? 'bg-cyan-600' : 'bg-amber-600';
          return (
            <div
              key={d.id}
              style={{ width: `${pct}%` }}
              className={`${bg} h-full flex items-center justify-center text-white text-[10px] font-bold border-r border-white/30`}
              title={`${d.title}: ${d.impact}`}
            >
              {pct > 18 ? `$${d.numericVal.toFixed(2)}M` : ''}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function LifecycleDistributionChart() {
  const totalRmlcValue = useMemo(() => {
    return RMLC_STAGES.reduce((sum, s) => sum + s.value, 0);
  }, []);

  return (
    <div className="flex flex-col gap-3 text-xs">
      <div className="h-5 w-full bg-slate-200 dark:bg-navy-800 rounded overflow-hidden flex">
        {RMLC_STAGES.map((s) => {
          const pct = totalRmlcValue > 0 ? (s.value / totalRmlcValue) * 100 : 25;
          const bg = s.tone === 'ok' ? 'bg-emerald-600' : s.tone === 'watch' ? 'bg-amber-600' : 'bg-rose-600';
          return (
            <div
              key={s.key}
              style={{ width: `${pct}%` }}
              className={`${bg} h-full flex items-center justify-center text-white text-[10px] font-bold border-r border-white/30`}
              title={`${s.label}: $${s.value.toFixed(2)}M`}
            >
              {pct > 15 ? `$${s.value.toFixed(1)}M` : ''}
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-2 gap-2">
        {RMLC_STAGES.map((s) => (
          <div key={s.key} className="p-2 bg-slate-50 dark:bg-navy-900/60 rounded border border-slate-200 dark:border-navy-700 flex justify-between items-center">
            <div>
              <span className="font-semibold text-slate-900 dark:text-slate-100 block">{s.label}</span>
              <span className="text-[10.5px] text-slate-400">{s.count} SKUs</span>
            </div>
            <strong className="num text-slate-800 dark:text-slate-200">${s.value.toFixed(2)}M</strong>
          </div>
        ))}
      </div>
    </div>
  );
}

// Response Dispatcher
function generateDeterministicAgentResponse(query, ctx, persona) {
  const qLower = (query || '').toLowerCase().trim();

  let intent = 'unknown';
  let chartType = null;
  let chartTitle = '';

  if (qLower.includes('health') || qLower.includes('turnover') || qLower.includes('position')) {
    intent = 'explain_health';
    chartType = 'inventory_position';
    chartTitle = 'Inventory Position vs Optimal';
  } else if (qLower.includes('stockout') || qLower.includes('shortage') || qLower.includes('deplet') || qLower.includes('run out')) {
    intent = 'stockout_risk';
    chartType = 'coverage_leadtime';
    chartTitle = 'Inventory Coverage vs Supplier Lead Time';
  } else if (qLower.includes('working capital') || qLower.includes('capital') || qLower.includes('cash') || qLower.includes('holding cost') || qLower.includes('excess')) {
    intent = 'working_capital';
    chartType = 'inventory_position';
    chartTitle = 'Inventory Position vs Optimal';
  } else if (qLower.includes('forecast') || qLower.includes('model') || qLower.includes('r2') || qLower.includes('predict') || qLower.includes('trend')) {
    intent = 'forecast_risk';
    chartType = 'forecast_outlook';
    chartTitle = 'Demand & Forecast Outlook';
  } else if (qLower.includes('lifecycle') || qLower.includes('rmlc') || qLower.includes('aging') || qLower.includes('stagnan') || qLower.includes('shelf') || qLower.includes('liquidation')) {
    intent = 'lifecycle_risk';
    chartType = 'lifecycle_breakdown';
    chartTitle = 'Enterprise RMLC Lifecycle Distribution';
  } else if (qLower.includes('replenish') || qLower.includes('eoq') || qLower.includes('order size') || qLower.includes('batch') || qLower.includes('reorder')) {
    intent = 'optimize_replenishment';
    chartType = 'inventory_position';
    chartTitle = 'Inventory Position vs Optimal';
  } else if (qLower.includes('challenge') || qLower.includes('stress') || qLower.includes('sensitivity') || qLower.includes('what-if') || qLower.includes('what if')) {
    intent = 'challenge_reco';
    chartType = 'coverage_leadtime';
    chartTitle = 'Inventory Coverage vs Supplier Lead Time';
  } else if (qLower.includes('executive') || qLower.includes('summary') || qLower.includes('c-suite') || qLower.includes('decision summary')) {
    intent = 'exec_summary';
    chartType = 'decision_value';
    chartTitle = 'Decision Value Breakdown';
  }

  // 1. INVENTORY HEALTH
  if (intent === 'explain_health') {
    return {
      title: `Inventory Health Assessment — ${ctx.id}`,
      summary: `Synthesized inventory health profile across Material Foundation, ABC Pareto, and RMLC telemetry for ${ctx.id} (${ctx.name}).`,
      evidence: [
        `Active Material: ${ctx.id} · ${ctx.name} (${ctx.plant}) — Physical on-hand stock is ${formatNum(ctx.qty)} ${ctx.uom} valued at ${formatCurrency(ctx.value)}.`,
        `Turnover & Coverage: Annual demand of ${formatNum(ctx.demand)} ${ctx.uom}/yr yields ${ctx.dos.toFixed(1)} Days of Supply (DOS) and turns at ${ctx.turnsPerYear.toFixed(2)} turns/yr.`,
        `Classification & Lifecycle: Class ${ctx.abcClass} Pareto tier with ${ctx.lifecycleStateLabel} lifecycle status.`,
      ],
      chartType,
      chartTitle,
      reasoning: `Operational telemetry is reconciled through 104 weeks of ERP history. Coverage of ${ctx.dos.toFixed(1)} days buffers the ${ctx.leadTimeDays}-day supplier lead time without surplus stagnation.`,
      recommendation: `Maintain statistical safety stock buffer of ${formatNum(ctx.safetyStock)} ${ctx.uom} (Z=1.65, 95.0% service target) while transitioning lot sizing toward calibrated EOQ (${formatNum(ctx.qStar)} ${ctx.uom}).`,
      impact: `${formatCurrency(ctx.value)} active operating capital with ${ctx.confidencePct}% statistical forecast confidence.`,
      confidence: `${ctx.confidencePct}%`,
      confidenceTone: 'success',
      suggestedActions: [
        { label: 'Send to Approval Queue', action: 'send_queue', tone: 'accent' },
        { label: 'Open in Optimization Plan', action: 'nav_opt', tone: 'neutral' },
      ],
      followUps: [
        'Investigate Stockout Risk',
        'Find Working Capital Opportunities',
        'Review Lifecycle Risk',
        'Optimize Replenishment',
      ],
    };
  }

  // Fallback / standard responses
  return {
    title: `Intelligence Synthesis — ${query.slice(0, 40)}...`,
    summary: `Synthesizing available enterprise intelligence for "${query}" on active material ${ctx.id} (${ctx.name}).`,
    evidence: [
      `Active Material: ${ctx.id} · ${ctx.name} (${ctx.plant}) — Physical on-hand stock is ${formatNum(ctx.qty)} ${ctx.uom} valued at ${formatCurrency(ctx.value)}.`,
      `Consumption & Buffer: Annual demand of ${formatNum(ctx.demand)} ${ctx.uom}/yr provides ${ctx.dos.toFixed(1)} Days of Supply against a ${ctx.leadTimeDays}-day supplier lead time.`,
      `Calibrated Parameters: EOQ lot size Q* = ${formatNum(ctx.qStar)} ${ctx.uom} · Safety stock buffer = ${formatNum(ctx.safetyStock)} ${ctx.uom} (95.0% service target).`,
    ],
    chartType: chartType || 'decision_value',
    chartTitle: chartTitle || 'Decision Value Breakdown',
    reasoning: `Based on upstream models, current operational status for ${ctx.id} shows ${ctx.dos.toFixed(1)} days of coverage with ${ctx.confidencePct}% forecast confidence.`,
    recommendation: `Interrogate specific intelligence domains using the Prompt Library on the right (e.g. Stockout Risk, Working Capital, Replenishment Optimization, or Executive Decision Summary).`,
    impact: `+$5.51M net enterprise value currently synthesized across 4 decisions in the Approval Queue.`,
    confidence: `${ctx.confidencePct}%`,
    confidenceTone: 'success',
    suggestedActions: [
      { label: 'Send to Approval Queue', action: 'send_queue', tone: 'accent' },
      { label: 'Open in Optimization Plan', action: 'nav_opt', tone: 'neutral' },
    ],
    followUps: [
      'Explain Inventory Health',
      'Investigate Stockout Risk',
      'Find Working Capital Opportunities',
      'Executive Decision Summary',
    ],
  };
}

export default function DecisionIntelligence() {
  const navigate = useNavigate();
  const { persona, selectedMaterial } = usePlatform();

  const [tab, setTab] = useState('ws');
  const [authorized, setAuthorized] = useState({});
  const [inputText, setInputText] = useState('');
  const [inspectDecision, setInspectDecision] = useState(null);

  const latestMsgRef = useRef(null);

  const materialCtx = useMemo(() => buildMaterialContext(selectedMaterial), [selectedMaterial]);

  const initialMessages = useMemo(() => {
    return [
      {
        id: 'msg-init',
        sender: 'agent',
        timestamp: '10:00 AM',
        title: 'Inventory Intelligence Agent Ready',
        summary: `I continuously synthesize intelligence across Material Foundation, Descriptive Analytics, ABC Classification, EOQ Calibration, RMLC Lifecycle, Multivariate Forecasting, What-If Sensitivity, and Optimization.`,
        evidence: [
          `Active Catalog Scope: 4 Plants · 142 Class A Materials holding $34.28M (78.30% of catalog value).`,
          `Current Material Focus: ${materialCtx.id} · ${materialCtx.name} (${materialCtx.plant}) — ${formatNum(materialCtx.qty)} ${materialCtx.uom} on-hand (${formatCurrency(materialCtx.value)}).`,
          `Synthesis Engines Connected: Descriptive, ABC Pareto, EOQ Calibration, RMLC Lifecycle, Multivariate Forecast, What-If Simulation, Optimization Solver.`,
        ],
        chartType: 'decision_value',
        chartTitle: 'Decision Value Breakdown',
        reasoning: `Operational telemetry is reconciled through 104 weeks of ERP and WMS transaction history. I can evaluate inventory health, investigate stockout vulnerabilities, quantify working capital release opportunities, stress-test recommendations, or generate executive decision briefings.`,
        recommendation: `Select a structured prompt from the Prompt Library on the right, or enter a custom question below to interrogate the synthesis engine.`,
        impact: `$5.51M net enterprise value currently identified across 4 actionable decisions in the Approval Queue.`,
        confidence: '95.80%',
        confidenceTone: 'success',
        suggestedActions: [
          { label: 'Send to Approval Queue', action: 'send_queue', tone: 'accent' },
          { label: 'Open in Optimization Plan', action: 'nav_opt', tone: 'neutral' },
          { label: 'Investigate in Forecast', action: 'nav_forecast', tone: 'neutral' },
        ],
        followUps: [
          'Explain Inventory Health',
          'Investigate Stockout Risk',
          'Find Working Capital Opportunities',
          'Executive Decision Summary',
        ],
      },
    ];
  }, [materialCtx]);

  const [messages, setMessages] = useState(initialMessages);

  useEffect(() => {
    setMessages((prev) => {
      if (prev.length === 1 && prev[0].id === 'msg-init') {
        return initialMessages;
      }
      return prev;
    });
  }, [initialMessages]);

  useEffect(() => {
    if (tab === 'ws' && messages.length > 1 && latestMsgRef.current) {
      latestMsgRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [messages, tab]);

  const toggle = (id, decision) => {
    setAuthorized((prev) => {
      const nextState = !prev[id];
      if (nextState) {
        toast.success(`Decision ${id.toUpperCase()} Authorized: ${decision?.title || 'Execution Queued'}`, {
          description: `Impact of ${decision?.impact || '$0.00'} verified and routed to ERP workbench.`,
        });
      }
      return { ...prev, [id]: nextState };
    });
  };

  const authCount = Object.values(authorized).filter(Boolean).length;

  const handleSendMessage = (textToSend) => {
    const text = (textToSend || inputText).trim();
    if (!text) return;

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const userMsg = {
      id: `user-${Date.now()}`,
      sender: 'user',
      timestamp: timeStr,
      text,
    };

    const agentResponse = generateDeterministicAgentResponse(text, materialCtx, persona);
    const agentMsg = {
      id: `agent-${Date.now() + 1}`,
      sender: 'agent',
      timestamp: timeStr,
      ...agentResponse,
    };

    setMessages((prev) => [...prev, userMsg, agentMsg]);
    setInputText('');
  };

  const handleActionClick = (actionKey) => {
    if (actionKey === 'send_queue') {
      setTab('queue');
    } else if (actionKey === 'nav_opt') {
      navigate('/app/optimization');
    } else if (actionKey === 'nav_forecast') {
      navigate('/app/raw-materials');
    } else if (actionKey === 'nav_eoq') {
      navigate('/app/eoq');
    } else if (actionKey === 'nav_rmlc') {
      navigate('/app/rmlc');
    } else if (actionKey === 'nav_whatif') {
      navigate('/app/what-if');
    } else if (actionKey === 'nav_abc') {
      navigate('/app/abc');
    } else if (actionKey === 'nav_desc') {
      navigate('/app/descriptive');
    } else {
      handleSendMessage(actionKey);
    }
  };

  const handleResetConversation = () => {
    setMessages(initialMessages);
    setInputText('');
  };

  const personaMeta = PERSONA_DESCRIPTIONS[persona] || PERSONA_DESCRIPTIONS.analyst;

  return (
    <motion.section 
      className="view"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <ViewHead
        title="Decision Intelligence"
        subtitle={
          <p>
            Autonomous inventory intelligence agent synthesizing evidence across Material Foundation, Descriptive, ABC, EOQ, RMLC, Forecast, What-If, and Optimization.
          </p>
        }
      />

      {/* Primary Tab Bar */}
      <div className="tabbar">
        <button
          type="button"
          className={tab === 'ws' ? 'active' : ''}
          onClick={() => setTab('ws')}
        >
          Agent Workspace
        </button>
        <button
          type="button"
          className={tab === 'queue' ? 'active' : ''}
          onClick={() => setTab('queue')}
        >
          Approval Queue <span className="badge badge-neutral ml-1.5">{DECISION_ROWS.length}</span>
        </button>
      </div>

      {/* TAB 1: CONVERSATIONAL AGENT WORKSPACE */}
      {tab === 'ws' && (
        <div className="two-col">
          {/* LEFT COLUMN: Conversational Agent Interface */}
          <div>
            <div className="card p-0 overflow-hidden flex flex-col shadow-md">
              {/* Agent Header */}
              <div className="p-3.5 bg-slate-50 dark:bg-navy-900 border-b border-slate-200 dark:border-navy-700 flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_0_3px_rgba(16,185,129,0.2)]" />
                  <div>
                    <span className="font-bold text-sm text-slate-900 dark:text-slate-100">Inventory Intelligence Agent</span>
                    <span className="ml-2 text-xs text-slate-400">Multi-Echelon Synthesis</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <Badge tone={materialCtx.abcClass === 'A' ? 'accent' : 'neutral'}>
                    {materialCtx.id} · {materialCtx.plant}
                  </Badge>
                  <Badge tone="neutral">{personaMeta.label}</Badge>
                  <button
                    type="button"
                    className="text-xs text-slate-500 hover:text-slate-900 dark:hover:text-white px-2 py-1 rounded hover:bg-slate-200 dark:hover:bg-navy-800 transition-colors"
                    onClick={handleResetConversation}
                    title="Reset conversation"
                  >
                    Reset
                  </button>
                </div>
              </div>

              {/* Scrollable Conversation Container */}
              <div className="h-[620px] overflow-y-auto p-4 bg-slate-50/50 dark:bg-navy-950/40 flex flex-col gap-4">
                {messages.map((msg, index) => {
                  const isLatest = index === messages.length - 1;

                  if (msg.sender === 'user') {
                    return (
                      <div key={msg.id} className="self-end max-w-[82%] flex flex-col items-end">
                        <div className="bg-slate-900 dark:bg-cyan-900 text-white rounded-2xl rounded-tr-sm px-4 py-2.5 text-sm font-medium leading-relaxed shadow-sm">
                          {msg.text}
                        </div>
                        <span className="text-[10px] text-slate-400 mt-1 mr-1">You · {msg.timestamp}</span>
                      </div>
                    );
                  }

                  return (
                    <motion.div
                      key={msg.id}
                      ref={isLatest ? latestMsgRef : null}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="self-start w-full bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-700/80 rounded-xl p-4 shadow-sm"
                    >
                      <div className="flex items-center justify-between gap-2.5 pb-2.5 mb-3 border-b border-slate-100 dark:border-navy-700 flex-wrap">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[10.5px] font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400">
                            Agent Synthesis
                          </span>
                          <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                            {msg.title}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {msg.confidence && (
                            <Badge tone={msg.confidenceTone || 'neutral'}>
                              {msg.confidence} Confidence
                            </Badge>
                          )}
                          <span className="text-[10px] text-slate-400 font-mono">{msg.timestamp}</span>
                        </div>
                      </div>

                      <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed mb-3">
                        {msg.summary}
                      </p>

                      {/* Evidence Box */}
                      {msg.evidence && msg.evidence.length > 0 && (
                        <div className="bg-slate-50 dark:bg-navy-950/60 border border-slate-200 dark:border-navy-800 rounded-lg p-3 mb-3 text-xs">
                          <div className="text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-1.5">
                            Evidence & Data Signals
                          </div>
                          <ul className="list-disc list-inside space-y-1 text-slate-700 dark:text-slate-300">
                            {msg.evidence.map((item, idx) => (
                              <li key={idx} className="leading-snug">{item}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Visual Evidence */}
                      {msg.chartType && (
                        <div className="border border-slate-200 dark:border-navy-700 rounded-lg overflow-hidden mb-3 bg-white dark:bg-navy-900 shadow-sm">
                          <div className="px-3 py-1.5 bg-slate-50 dark:bg-navy-800/60 border-b border-slate-200 dark:border-navy-700 flex justify-between items-center text-xs">
                            <span className="font-bold text-cyan-600 dark:text-cyan-400 uppercase tracking-wide text-[10px] flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-cyan-500" />
                              Visual Evidence: {msg.chartTitle}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">Authoritative Data</span>
                          </div>
                          <div className="p-3">
                            {msg.chartType === 'inventory_position' && <InventoryPositionChart ctx={materialCtx} />}
                            {msg.chartType === 'forecast_outlook' && <DemandForecastChart ctx={materialCtx} />}
                            {msg.chartType === 'coverage_leadtime' && <CoverageLeadTimeChart ctx={materialCtx} />}
                            {msg.chartType === 'decision_value' && <DecisionValueChart />}
                            {msg.chartType === 'lifecycle_breakdown' && <LifecycleDistributionChart />}
                          </div>
                        </div>
                      )}

                      {/* Recommendation Box */}
                      {msg.recommendation && (
                        <div className="bg-cyan-50/50 dark:bg-cyan-950/20 border-l-4 border-cyan-500 rounded-r-md p-3 mb-3 text-xs">
                          <div className="text-[10px] font-bold uppercase text-cyan-600 dark:text-cyan-400 tracking-wider mb-1">
                            Recommendation
                          </div>
                          <div className="font-semibold text-slate-900 dark:text-slate-100 leading-relaxed">
                            {msg.recommendation}
                          </div>
                        </div>
                      )}

                      {/* Impact / Risk Box */}
                      {msg.impact && (
                        <div className="bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/50 rounded-md p-2.5 mb-3 flex items-baseline gap-2 text-xs">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 shrink-0">Impact:</span>
                          <span className="font-semibold text-slate-900 dark:text-slate-100">{msg.impact}</span>
                        </div>
                      )}

                      {/* Action Buttons */}
                      {msg.suggestedActions && msg.suggestedActions.length > 0 && (
                        <div className="flex flex-wrap items-center gap-2 mb-3">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mr-1">Action:</span>
                          {msg.suggestedActions.map((act, i) => (
                            <button
                              key={i}
                              type="button"
                              className={`btn btn-sm ${act.tone === 'accent' ? 'btn-accent' : act.tone === 'risk' ? 'btn-primary' : ''}`}
                              onClick={() => handleActionClick(act.action)}
                            >
                              {act.label}
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Follow-up Chips */}
                      {msg.followUps && msg.followUps.length > 0 && (
                        <div className="pt-2.5 border-t border-dashed border-slate-200 dark:border-navy-700">
                          <div className="text-[11px] text-slate-400 font-semibold mb-1.5">Suggested Inquiries:</div>
                          <div className="chip-row gap-1.5 mb-0">
                            {msg.followUps.map((chipText, cIdx) => (
                              <Chip key={cIdx} onClick={() => handleSendMessage(chipText)}>
                                {chipText}
                              </Chip>
                            ))}
                          </div>
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>

              {/* Chat Input Bar */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="p-3 bg-white dark:bg-navy-900 border-t border-slate-200 dark:border-navy-700 flex items-center gap-2.5"
              >
                <input
                  type="text"
                  className="field-input flex-1 px-3.5 py-2 text-xs rounded-lg"
                  placeholder="Ask the Inventory Intelligence Agent (e.g., Explain working capital, investigate stockout)..."
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                />
                <button
                  type="submit"
                  className="btn btn-accent shrink-0 text-xs py-2 px-4"
                  disabled={!inputText.trim()}
                >
                  Send
                </button>
              </form>
            </div>
          </div>

          {/* RIGHT COLUMN: Prompt Library + Active Context */}
          <div>
            <Card className="mb-4">
              <CardHead
                title="Prompt Library"
                sub="Select any enterprise prompt to interrogate the synthesis engine"
              />

              <div className="grid grid-cols-2 gap-2">
                {PROMPT_LIBRARY.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleSendMessage(item.query)}
                    className="border border-slate-200 dark:border-navy-700/80 rounded-lg p-2.5 bg-white dark:bg-navy-900 hover:border-cyan-500 hover:bg-slate-50 dark:hover:bg-navy-800 transition-all cursor-pointer flex flex-col justify-between gap-1 shadow-sm hover:shadow"
                  >
                    <span className="font-semibold text-xs text-slate-900 dark:text-slate-100 leading-tight">
                      {item.title}
                    </span>
                    <div className="flex justify-between items-center mt-1">
                      <Badge tone={item.tone}>{item.category}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card>
              <CardHead
                title="Active Intelligence Context"
                sub="Live parameter telemetry connected to the Agent Workspace"
              />

              <div className="grid grid-cols-2 gap-2.5 mb-3 text-xs">
                <div className="bg-slate-50 dark:bg-navy-900/60 p-2.5 rounded border border-slate-200 dark:border-navy-700">
                  <span className="text-[10px] text-slate-400 uppercase block font-semibold mb-0.5">Selected Material</span>
                  <strong className="text-xs text-slate-900 dark:text-slate-100 block">{materialCtx.id} · {materialCtx.name}</strong>
                  <span className="text-[11px] text-slate-500">{materialCtx.plant} · Class {materialCtx.abcClass}</span>
                </div>

                <div className="bg-slate-50 dark:bg-navy-900/60 p-2.5 rounded border border-slate-200 dark:border-navy-700">
                  <span className="text-[10px] text-slate-400 uppercase block font-semibold mb-0.5">On-Hand Stock</span>
                  <strong className="num text-xs text-slate-900 dark:text-slate-100 block">{formatNum(materialCtx.qty)} {materialCtx.uom}</strong>
                  <span className="text-[11px] text-slate-500 font-mono">{formatCurrency(materialCtx.value)}</span>
                </div>

                <div className="bg-slate-50 dark:bg-navy-900/60 p-2.5 rounded border border-slate-200 dark:border-navy-700">
                  <span className="text-[10px] text-slate-400 uppercase block font-semibold mb-0.5">Days of Supply</span>
                  <strong className={`num text-xs block ${materialCtx.dos < materialCtx.leadTimeDays ? 'text-rose-600' : 'text-slate-900 dark:text-slate-100'}`}>
                    {materialCtx.dos.toFixed(1)} Days
                  </strong>
                  <span className="text-[11px] text-slate-500">Lead Time: {materialCtx.leadTimeDays}d</span>
                </div>

                <div className="bg-slate-50 dark:bg-navy-900/60 p-2.5 rounded border border-slate-200 dark:border-navy-700">
                  <span className="text-[10px] text-slate-400 uppercase block font-semibold mb-0.5">Optimal Order (EOQ)</span>
                  <strong className="num text-xs text-cyan-600 dark:text-cyan-400 block">{formatNum(materialCtx.qStar)} {materialCtx.uom}</strong>
                  <span className="text-[11px] text-slate-500">Target: {formatNum(materialCtx.targetBuffer)} {materialCtx.uom}</span>
                </div>
              </div>

              <div className="border-t border-slate-200 dark:border-navy-700 pt-2.5 flex flex-col gap-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">Active Persona Lens:</span>
                  <Badge tone="neutral">{personaMeta.label}</Badge>
                </div>
                <div className="p-2 bg-slate-50 dark:bg-navy-900/60 rounded border border-slate-200 dark:border-navy-700 text-[11px] text-slate-500 leading-relaxed">
                  {personaMeta.sub}
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* TAB 2: APPROVAL QUEUE */}
      {tab === 'queue' && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          <div className="grid-4 mb-4">
            <KpiTile label="Decisions Synthesized" value={DECISION_ROWS.length} />
            <KpiTile label="Net Value Identified" value="$5.51M" valueStyle={{ color: 'var(--success)' }} />
            <KpiTile label="Authorized" value={`${authCount} of ${DECISION_ROWS.length}`} />
            <KpiTile label="Average Confidence" value="95.80%" />
          </div>

          <div className="space-y-3">
            {DECISION_ROWS.map((d) => (
              <div 
                key={d.id}
                className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-700 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3 shadow-sm hover:border-cyan-500/60 transition-all"
              >
                <div className="flex flex-col gap-1 min-w-[280px]">
                  <div className="flex items-center gap-2">
                    <Badge tone={TAG_TONE[d.tag]}>{d.tag}</Badge>
                    <span className="font-bold text-sm text-slate-900 dark:text-slate-100">{d.title}</span>
                  </div>
                  <span className="text-xs text-slate-500 dark:text-slate-400">{d.meta}</span>
                </div>
                
                <div className="flex items-center gap-4">
                  <span className="text-sm font-bold font-mono text-emerald-600 dark:text-emerald-400">{d.impact}</span>
                  <button
                    type="button"
                    className="text-xs text-cyan-600 dark:text-cyan-400 font-medium hover:underline"
                    onClick={() => setInspectDecision(d)}
                  >
                    Inspect Detail
                  </button>
                  <button
                    type="button"
                    className={`btn btn-sm ${authorized[d.id] ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => toggle(d.id, d)}
                  >
                    {authorized[d.id] ? '✓ Authorized' : 'Authorize / Execute'}
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="card mt-4">
            <h2 className="card__title mb-3">Decision Synthesis Breakdown</h2>
            <WhyDisclosure
              defaultOpen
              summary="Why these 4 decisions synthesize $5.51M in net enterprise value"
              drivers={[
                'Class A EOQ calibration: releases $3.65M across 46 materials through batch size normalization',
                'Expedited procurement on MAT-4120: protects $1.82M finished-goods revenue ahead of 14-day stockout horizon',
                'Inter-plant transfer of MAT-5501: captures $57,600.00 salvage value before shelf-life expiration',
              ]}
              meaning={[
                'Multi-echelon intelligence solves working capital release and stockout prevention in a single synchronized schedule',
                'High average confidence (95.80%) established through 104 weeks of reconciled ERP and WMS transaction history',
              ]}
              action={[
                'Authorize decisions in order of operational urgency (Act now → Optimize → Prevent)',
                'Sync authorized decision payload directly to ERP procurement workbench',
              ]}
            />
          </div>

          <div className="mt-4 flex gap-2.5">
            <button
              type="button"
              className="btn btn-accent"
              onClick={() => setTab('ws')}
            >
              Return to Agent Workspace
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => navigate('/app/optimization')}
            >
              Open in Optimization Plan
            </button>
          </div>
        </motion.div>
      )}

      {/* Decision Inspection Dialog */}
      <Dialog open={!!inspectDecision} onOpenChange={(open) => !open && setInspectDecision(null)}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <div className="flex items-center gap-2 mb-1">
              <Badge tone={TAG_TONE[inspectDecision?.tag] || 'neutral'}>{inspectDecision?.tag}</Badge>
              <DialogTitle className="text-base">{inspectDecision?.title}</DialogTitle>
            </div>
            <DialogDescription className="text-xs">
              {inspectDecision?.meta}
            </DialogDescription>
          </DialogHeader>

          {inspectDecision && (
            <div className="space-y-3 py-2 text-xs">
              <div className="p-3 bg-slate-50 dark:bg-navy-900 rounded-lg border border-slate-200 dark:border-navy-700 flex justify-between items-center">
                <span className="text-slate-500 font-medium">Estimated Financial Impact:</span>
                <strong className="text-emerald-600 dark:text-emerald-400 font-mono text-sm">{inspectDecision.impact}</strong>
              </div>

              <div className="space-y-1.5 text-slate-700 dark:text-slate-300">
                <p><strong>Governance Mandate:</strong> Authorizing this decision directs the automated API dispatch queue to post validated purchase parameters directly into the connected ERP procurement workbench.</p>
                <p><strong>Verification Proof:</strong> Mathematical reconciliation validated across 104 weeks of historical ERP transaction logs with 95.80% average synthesis confidence.</p>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  className="btn btn-sm btn-ghost"
                  onClick={() => setInspectDecision(null)}
                >
                  Close
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-primary"
                  onClick={() => {
                    toggle(inspectDecision.id, inspectDecision);
                    setInspectDecision(null);
                  }}
                >
                  {authorized[inspectDecision.id] ? 'Re-authorize' : 'Authorize Decision Now'}
                </button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </motion.section>
  );
}
