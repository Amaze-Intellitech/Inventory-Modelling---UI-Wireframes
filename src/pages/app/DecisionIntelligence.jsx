import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Bot } from 'lucide-react';
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
    id: 'canon_why',
    title: 'Why is inventory increasing?',
    category: 'Diagnose',
    tone: 'accent',
    query: 'Why is the inventory for this material increasing?',
    desc: 'Finds which drivers pushed stock up. Uses Bivariate and Multivariate analysis.',
  },
  {
    id: 'canon_position',
    title: 'What should my inventory position be next month?',
    category: 'Recommend',
    tone: 'accent',
    query: 'What should my inventory position be for next month?',
    desc: 'Recommends a stock level and its coverage and turnover impact. Uses Multivariate, Optimization and KPIs.',
  },
  {
    id: 'canon_leadtime',
    title: 'What if supplier lead time goes from 5 to 8 days?',
    category: 'Simulate',
    tone: 'accent',
    query: 'What happens if supplier lead time increases from 5 to 8 days?',
    desc: 'Simulates the change and interprets it in business terms. Uses Multivariate, Optimization and What-if.',
  },
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
        <div className="bg-bg p-2 rounded border border-border ">
          <span className="text-xs text-subtle uppercase block font-semibold">Current On-Hand</span>
          <strong className="num text-sm text-ink block">{formatNum(ctx.qty)} {ctx.uom}</strong>
          <span className="text-xs text-subtle">{formatCurrency(ctx.value)}</span>
        </div>
        <div className="bg-bg p-2 rounded border border-border ">
          <span className="text-xs text-subtle uppercase block font-semibold">Safety Stock</span>
          <strong className="num text-sm text-warning-tx block">{formatNum(ctx.safetyStock)} {ctx.uom}</strong>
          <span className="text-xs text-subtle">Z=1.65 buffer</span>
        </div>
        <div className="bg-bg p-2 rounded border border-border ">
          <span className="text-xs text-subtle uppercase block font-semibold">Calibrated EOQ (Q*)</span>
          <strong className="num text-sm text-primary block">{formatNum(ctx.qStar)} {ctx.uom}</strong>
          <span className="text-xs text-subtle">Optimal lot</span>
        </div>
      </div>

      <div className="flex flex-col gap-2.5 bg-[color-mix(in_srgb,var(--bg)_70%,transparent)] p-3 rounded-md border border-border ">
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="font-semibold text-body-c ">Current Position</span>
            <span className="font-mono font-bold text-ink ">{formatNum(ctx.qty)} {ctx.uom}</span>
          </div>
          <div className="h-5 w-full bg-border rounded overflow-hidden flex">
            <div
              style={{ width: `${currentPct}%` }}
              className="bg-deep rounded text-white text-xs font-semibold flex items-center px-2"
            >
              On-Hand
            </div>
          </div>
        </div>

        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="font-semibold text-body-c ">Target Buffer (SS + EOQ)</span>
            <span className="font-mono font-bold text-primary ">{formatNum(ctx.targetBuffer)} {ctx.uom} ({formatCurrency(ctx.targetBuffer * ctx.unitCost)})</span>
          </div>
          <div className="h-5 w-full bg-border rounded overflow-hidden flex">
            <div
              style={{ width: `${targetPct * ssFraction}%` }}
              className="bg-warning text-white text-xs font-bold flex items-center justify-center border-r border-[color-mix(in_srgb,var(--surface)_40%,transparent)]"
              title="Safety Stock"
            >
              SS
            </div>
            <div
              style={{ width: `${targetPct * eoqFraction}%` }}
              className="bg-primary-solid text-white text-xs font-bold flex items-center px-2"
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
        <div className="bg-bg p-2 rounded border border-border ">
          <span className="text-xs text-subtle uppercase block font-semibold">Model Fit</span>
          <strong className="num text-sm text-primary block">{ctx.modelR2.toFixed(2)}</strong>
          <span className="text-xs text-subtle">{ctx.confidencePct}% conf</span>
        </div>
        <div className="bg-bg p-2 rounded border border-border ">
          <span className="text-xs text-subtle uppercase block font-semibold">Demand Volatility</span>
          <strong className="num text-sm text-ink block">CV {ctx.demandCV.toFixed(2)}</strong>
          <span className="text-xs text-subtle font-mono">σ={ctx.sigmaD.toFixed(1)}/d</span>
        </div>
        <div className="bg-bg p-2 rounded border border-border ">
          <span className="text-xs text-subtle uppercase block font-semibold">Daily Rate</span>
          <strong className="num text-sm text-ink block">{ctx.dailyDemand.toFixed(1)} {ctx.uom}</strong>
          <span className="text-xs text-subtle">{formatNum(ctx.demand)}/yr</span>
        </div>
        <div className="bg-bg p-2 rounded border border-border ">
          <span className="text-xs text-subtle uppercase block font-semibold">Trend</span>
          <strong className="num text-sm text-ink block">{(ctx.trendPerWeek * 100).toFixed(2)}%</strong>
          <span className="text-xs text-subtle">per week</span>
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
        <div className="bg-bg p-2 rounded border border-border ">
          <span className="text-xs text-subtle uppercase block font-semibold">Days of Supply</span>
          <strong className={`num text-sm block ${isDeficit ? 'text-error-tx' : 'text-success-tx'}`}>{ctx.dos.toFixed(1)} Days</strong>
          <span className="text-xs text-subtle">{formatNum(ctx.qty)} {ctx.uom}</span>
        </div>
        <div className="bg-bg p-2 rounded border border-border ">
          <span className="text-xs text-subtle uppercase block font-semibold">Lead Time</span>
          <strong className="num text-sm text-ink block">{ctx.leadTimeDays} Days</strong>
          <span className="text-xs text-subtle">Replenishment window</span>
        </div>
        <div className="bg-bg p-2 rounded border border-border ">
          <span className="text-xs text-subtle uppercase block font-semibold">Buffer Status</span>
          <strong className={`text-sm block ${isDeficit ? 'text-error-tx' : 'text-success-tx'}`}>{isDeficit ? `-${gapDays}d Deficit` : `+${gapDays}d Buffer`}</strong>
          <span className="text-xs text-subtle">{isDeficit ? 'Risk active' : 'Protected'}</span>
        </div>
      </div>

      <div className="flex flex-col gap-2.5 bg-[color-mix(in_srgb,var(--bg)_70%,transparent)] p-3 rounded-md border border-border ">
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="font-semibold text-body-c ">On-Hand Days of Supply</span>
            <span className={`font-mono font-bold ${isDeficit ? 'text-error-tx' : 'text-success-tx'}`}>{ctx.dos.toFixed(1)} Days</span>
          </div>
          <div className="h-5 w-full bg-border rounded overflow-hidden">
            <div
              style={{ width: `${dosPct}%` }}
              className={`h-full ${isDeficit ? 'bg-error' : 'bg-success'} text-white text-xs font-bold flex items-center px-2`}
            >
              {ctx.dos.toFixed(1)}d Runway
            </div>
          </div>
        </div>

        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="font-semibold text-body-c ">Supplier Lead Time ({ctx.supplierName.split('(')[0].trim()})</span>
            <span className="font-mono font-bold text-ink ">{ctx.leadTimeDays} Days</span>
          </div>
          <div className="h-5 w-full bg-border rounded overflow-hidden">
            <div
              style={{ width: `${leadPct}%` }}
              className="h-full bg-body-c text-white text-xs font-bold flex items-center px-2"
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
      <div className="flex justify-between items-center bg-bg p-2.5 rounded border border-border ">
        <div>
          <span className="text-xs text-subtle uppercase block font-semibold">Total Identified Net Value</span>
          <strong className="num text-base text-success-tx ">$5.51M</strong>
        </div>
        <Badge tone="success">95.80% Average Confidence</Badge>
      </div>

      <div className="h-5 w-full bg-border rounded overflow-hidden flex">
        {parsedDecisions.filter((d) => d.numericVal > 0).map((d) => {
          const pct = totalNumeric > 0 ? (d.numericVal / totalNumeric) * 100 : 33;
          const bg = d.tag === 'Optimize' ? 'bg-success' : d.tag === 'Act now' ? 'bg-primary-solid' : 'bg-warning';
          return (
            <div
              key={d.id}
              style={{ width: `${pct}%` }}
              className={`${bg} h-full flex items-center justify-center text-white text-xs font-bold border-r border-[color-mix(in_srgb,var(--surface)_30%,transparent)]`}
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
      <div className="h-5 w-full bg-border rounded overflow-hidden flex">
        {RMLC_STAGES.map((s) => {
          const pct = totalRmlcValue > 0 ? (s.value / totalRmlcValue) * 100 : 25;
          const bg = s.tone === 'ok' ? 'bg-success' : s.tone === 'watch' ? 'bg-warning' : 'bg-error';
          return (
            <div
              key={s.key}
              style={{ width: `${pct}%` }}
              className={`${bg} h-full flex items-center justify-center text-white text-xs font-bold border-r border-[color-mix(in_srgb,var(--surface)_30%,transparent)]`}
              title={`${s.label}: $${s.value.toFixed(2)}M`}
            >
              {pct > 15 ? `$${s.value.toFixed(1)}M` : ''}
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-2 gap-2">
        {RMLC_STAGES.map((s) => (
          <div key={s.key} className="p-2 bg-bg rounded border border-border flex justify-between items-center">
            <div>
              <span className="font-semibold text-ink block">{s.label}</span>
              <span className="text-xs text-subtle">{s.count} SKUs</span>
            </div>
            <strong className="num text-ink ">${s.value.toFixed(2)}M</strong>
          </div>
        ))}
      </div>
    </div>
  );
}

// Response Dispatcher
// Stage names the Agent can orchestrate, and where each one lives. `null` = no page (a calculation only).
const STAGE_ROUTES = {
  Univariate: '/app/univariate',
  Bivariate: '/app/bivariate',
  ABC: '/app/abc',
  EOQ: '/app/eoq',
  RMLC: '/app/rmlc',
  Multivariate: '/app/raw-materials',
  Optimization: '/app/optimization',
  'What-if': '/app/what-if',
  'KPI calculation': null,
};

// Which analytical components the Agent invoked for each intent — always shown, so the answer is never a black box.
const TRACE_BY_INTENT = {
  why_increasing: ['Bivariate', 'Multivariate'],
  position_next_month: ['Multivariate', 'Optimization', 'KPI calculation'],
  leadtime_whatif: ['Multivariate', 'Optimization', 'What-if'],
  explain_health: ['Univariate', 'ABC', 'RMLC'],
  stockout_risk: ['Bivariate', 'Multivariate', 'Optimization'],
  working_capital: ['ABC', 'EOQ', 'Optimization'],
  forecast_risk: ['Multivariate'],
  lifecycle_risk: ['RMLC'],
  optimize_replenishment: ['EOQ', 'Optimization'],
  challenge_reco: ['Multivariate', 'Optimization', 'What-if'],
  exec_summary: ['ABC', 'Multivariate', 'Optimization', 'KPI calculation'],
  unknown: ['Multivariate', 'Optimization'],
};

function detectIntent(qLower) {
  let intent = 'unknown';
  let chartType = null;
  let chartTitle = '';

  // Canonical worked examples first (design bible §9).
  if (qLower.includes('why') && qLower.includes('inventory') && (qLower.includes('increas') || qLower.includes('rising') || qLower.includes('growing'))) {
    return { intent: 'why_increasing', chartType: 'inventory_position', chartTitle: 'Inventory Position vs Optimal' };
  }
  if ((qLower.includes('next month') || qLower.includes('should be my inventory') || qLower.includes('should my inventory')) && qLower.includes('position')) {
    return { intent: 'position_next_month', chartType: 'inventory_position', chartTitle: 'Inventory Position vs Optimal' };
  }
  if (qLower.includes('lead time') && (qLower.includes('from 5 to 8') || qLower.includes('increases') || qLower.includes('what happens'))) {
    return { intent: 'leadtime_whatif', chartType: 'coverage_leadtime', chartTitle: 'Inventory Coverage vs Supplier Lead Time' };
  }

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

  return { intent, chartType, chartTitle };
}

function buildAgentResponse(query, ctx, persona) {
  const qLower = (query || '').toLowerCase().trim();

  const { intent, chartType, chartTitle } = detectIntent(qLower);

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

// Canonical worked examples (design bible §9) get purpose-written answers; everything else uses the intent responses above.
function canonicalResponse(intent, ctx) {
  const base = { evidence: [], suggestedActions: [{ label: 'Send to Approval Queue', action: 'send_queue', tone: 'accent' }], confidence: `${ctx.confidencePct}%`, confidenceTone: 'success' };
  if (intent === 'why_increasing') {
    return {
      ...base,
      title: `Why is inventory rising — ${ctx.id}`,
      chartType: 'inventory_position',
      chartTitle: 'Inventory Position vs Optimal',
      summary: `Stock for ${ctx.name} has risen mainly because production volume went up 18% while supplier lead time stayed flat, so you are carrying more safety stock than you need.`,
      evidence: [
        'Bivariate analysis: finished-goods demand (r = 0.91) and supplier lead time (r = 0.82) are the strongest links to stock.',
        'Multivariate model: demand explains 41% of the movement and lead time 24%; price explains only 6%.',
      ],
      reasoning: 'The rise is not a demand spike. It comes from reordering earlier than lead times require.',
      recommendation: 'Move the next order out by about 9 days and reset the order size to the current EOQ.',
      impact: 'Releases roughly $0.62M of working capital over the next six weeks.',
      suggestedActions: [
        { label: 'Send to Approval Queue', action: 'send_queue', tone: 'accent' },
        { label: 'Open the analysis', action: 'nav_forecast', tone: 'neutral' },
      ],
      followUps: ['What should my inventory position be for next month?', 'What happens if supplier lead time increases from 5 to 8 days?'],
    };
  }
  if (intent === 'position_next_month') {
    return {
      ...base,
      title: `Recommended position for next month — ${ctx.id}`,
      chartType: 'inventory_position',
      chartTitle: 'Inventory Position vs Optimal',
      summary: `Aim for about ${formatNum(ctx.safetyStock + ctx.qStar)} ${ctx.uom} next month. That is lower than the ${formatNum(ctx.qty)} ${ctx.uom} you hold today.`,
      evidence: [
        `Multivariate forecast expects ${formatNum(ctx.qty)} ${ctx.uom} if nothing changes.`,
        'Optimization result: the lowest-cost position that keeps production running is the recommended level, given your objective and constraints.',
      ],
      reasoning: `At the recommended level, coverage falls from ${ctx.dos.toFixed(0)} to about 22 days and turnover rises from 4.1× to about 4.6×.`,
      recommendation: `Hold ${formatNum(ctx.safetyStock)} ${ctx.uom} of safety stock and order in lots of ${formatNum(ctx.qStar)} ${ctx.uom}.`,
      impact: 'Coverage stays above the 20-day floor while turnover improves.',
      suggestedActions: [
        { label: 'Send to Approval Queue', action: 'send_queue', tone: 'accent' },
        { label: 'Open the Optimization Plan', action: 'nav_opt', tone: 'neutral' },
      ],
      followUps: ['Why is the inventory for this material increasing?', 'What happens if supplier lead time increases from 5 to 8 days?'],
    };
  }
  return {
    ...base,
    title: `Lead time 5 → 8 days — ${ctx.id}`,
    chartType: 'coverage_leadtime',
    chartTitle: 'Inventory Coverage vs Supplier Lead Time',
    summary: 'If supplier lead time rises from 5 to 8 days, projected inventory grows by about $0.31M and turnover falls from 4.1× to about 3.8×. Coverage drops by roughly 3 days.',
    evidence: [
      'Multivariate model: each extra lead-time day adds about 1.4% to required safety stock.',
      'Optimization result: the recommended order point moves 3 days earlier.',
    ],
    reasoning: 'The buffer you hold today absorbs about half of the change; the rest shows up as extra stock.',
    recommendation: 'Move the reorder point 3 days earlier, or qualify a second supplier before the change lands.',
    impact: 'About $0.31M more stock, and a stock-out risk that rises from 2.6% to about 3.0% without action.',
    suggestedActions: [
      { label: 'Send to Approval Queue', action: 'send_queue', tone: 'accent' },
      { label: 'Explore in What-If', action: 'nav_whatif', tone: 'neutral' },
    ],
    followUps: ['Why is the inventory for this material increasing?', 'What should my inventory position be for next month?'],
  };
}

function generateDeterministicAgentResponse(query, ctx, persona) {
  const { intent } = detectIntent((query || '').toLowerCase().trim());
  const res = ['why_increasing', 'position_next_month', 'leadtime_whatif'].includes(intent)
    ? canonicalResponse(intent, ctx)
    : buildAgentResponse(query, ctx, persona);
  return { ...res, trace: TRACE_BY_INTENT[intent] || TRACE_BY_INTENT.unknown };
}

// The orchestration trace: which stages the Agent invoked, in order, each linking back to its page.
function AgentTrace({ trace }) {
  if (!trace || trace.length === 0) return null;
  return (
    <div className="agent-trace" aria-label="Analytical components invoked">
      <span className="agent-trace__label">Invoked</span>
      {trace.map((name, i) => (
        <React.Fragment key={name}>
          {i > 0 && <span className="agent-trace__arrow" aria-hidden="true">→</span>}
          {STAGE_ROUTES[name] ? (
            <Link to={STAGE_ROUTES[name]} className="agent-trace__chip">{name}</Link>
          ) : (
            <span className="agent-trace__chip agent-trace__chip--static">{name}</span>
          )}
        </React.Fragment>
      ))}
    </div>
  );
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
        summary: `I continuously synthesize intelligence across Material Foundation, Descriptive Analytics, ABC Classification, EOQ Analysis, RMLC Lifecycle, Multivariate Forecasting, What-If Sensitivity, and Optimization.`,
        evidence: [
          `Active Catalog Scope: 4 Plants · 142 Class A Materials holding $34.28M (78.30% of catalog value).`,
          `Current Material Focus: ${materialCtx.id} · ${materialCtx.name} (${materialCtx.plant}) — ${formatNum(materialCtx.qty)} ${materialCtx.uom} on-hand (${formatCurrency(materialCtx.value)}).`,
          `Synthesis Engines Connected: Descriptive, ABC Pareto, EOQ Analysis, RMLC Lifecycle, Multivariate Forecast, What-If Simulation, Optimization Solver.`,
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
      navigate('/app/univariate');
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
        title="Inventory Agent"
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
              <div className="p-3.5 bg-bg border-b border-border flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-success shadow-[0_0_0_3px_rgba(16,185,129,0.2)]" />
                  <div>
                    <span className="font-bold text-sm text-ink ">Inventory Intelligence Agent</span>
                    <span className="ml-2 text-xs text-subtle">Multi-Echelon Synthesis</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <Badge tone={materialCtx.abcClass === 'A' ? 'accent' : 'neutral'}>
                    {materialCtx.id} · {materialCtx.plant}
                  </Badge>
                  <Badge tone="neutral">{personaMeta.label}</Badge>
                  <button
                    type="button"
                    className="text-xs text-subtle hover:text-ink px-2 py-1 rounded hover:bg-border transition-colors"
                    onClick={handleResetConversation}
                    title="Reset conversation"
                  >
                    Reset
                  </button>
                </div>
              </div>

              {/* Scrollable Conversation Container */}
              <div className="h-[620px] overflow-y-auto p-4 bg-[color-mix(in_srgb,var(--bg)_50%,transparent)] flex flex-col gap-4">
                {messages.map((msg, index) => {
                  const isLatest = index === messages.length - 1;

                  if (msg.sender === 'user') {
                    return (
                      <div key={msg.id} className="self-end max-w-[82%] flex flex-col items-end">
                        <div className="bg-deep text-white rounded-2xl rounded-tr-sm px-4 py-2.5 text-sm font-medium leading-relaxed shadow-sm">
                          {msg.text}
                        </div>
                        <span className="text-xs text-subtle mt-1 mr-1">You · {msg.timestamp}</span>
                      </div>
                    );
                  }

                  return (
                    <motion.div
                      key={msg.id}
                      ref={isLatest ? latestMsgRef : null}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="self-start w-full bg-surface border border-border border-l-[3px] border-l-ai rounded-xl p-4 shadow-sm"
                    >
                      <div className="flex items-center justify-between gap-2.5 pb-2.5 mb-3 border-b border-border flex-wrap">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-semibold uppercase tracking-[0.08em] text-ai-tx inline-flex items-center gap-1.5">
                            <Bot size={12} aria-hidden="true" /> Inventory Agent
                          </span>
                          <span className="text-sm font-bold text-ink ">
                            {msg.title}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {msg.confidence && (
                            <Badge tone={msg.confidenceTone || 'neutral'}>
                              {msg.confidence} Confidence
                            </Badge>
                          )}
                          <span className="text-xs text-subtle font-mono">{msg.timestamp}</span>
                        </div>
                      </div>

                      <p className="text-[13px] text-ink leading-relaxed mb-3 font-medium">
                        {msg.summary}
                      </p>

                      <AgentTrace trace={msg.trace} />

                      {/* Evidence Box */}
                      {msg.evidence && msg.evidence.length > 0 && (
                        <div className="bg-bg border border-border rounded-lg p-3 mb-3 text-xs">
                          <div className="text-xs font-bold uppercase text-subtle tracking-wider mb-1.5">
                            Evidence & Data Signals
                          </div>
                          <ul className="list-disc list-inside space-y-1 text-body-c ">
                            {msg.evidence.map((item, idx) => (
                              <li key={idx} className="leading-snug">{item}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Visual Evidence */}
                      {msg.chartType && (
                        <div className="border border-border rounded-lg overflow-hidden mb-3 bg-surface shadow-sm">
                          <div className="px-3 py-1.5 bg-bg border-b border-border flex justify-between items-center text-xs">
                            <span className="font-bold text-primary uppercase tracking-wide text-xs flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-primary-solid" />
                              Visual Evidence: {msg.chartTitle}
                            </span>
                            <span className="text-xs text-subtle font-mono">Authoritative Data</span>
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
                        <div className="bg-[color-mix(in_srgb,var(--info-bg)_50%,transparent)] border-l-4 border-primary rounded-r-md p-3 mb-3 text-xs">
                          <div className="text-xs font-bold uppercase text-primary tracking-wider mb-1">
                            Recommendation
                          </div>
                          <div className="font-semibold text-ink leading-relaxed">
                            {msg.recommendation}
                          </div>
                        </div>
                      )}

                      {/* Impact / Risk Box */}
                      {msg.impact && (
                        <div className="bg-[color-mix(in_srgb,var(--success-bg)_70%,transparent)] border border-success rounded-md p-2.5 mb-3 flex items-baseline gap-2 text-xs">
                          <span className="text-xs font-bold uppercase tracking-wider text-success-tx shrink-0">Impact:</span>
                          <span className="font-semibold text-ink ">{msg.impact}</span>
                        </div>
                      )}

                      {/* Action Buttons */}
                      {msg.suggestedActions && msg.suggestedActions.length > 0 && (
                        <div className="flex flex-wrap items-center gap-2 mb-3">
                          <span className="text-xs font-bold uppercase tracking-wider text-subtle mr-1">Action:</span>
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
                        <div className="pt-2.5 border-t border-dashed border-border ">
                          <div className="text-xs text-subtle font-semibold mb-1.5">Suggested Inquiries:</div>
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
                className="p-3 bg-surface border-t border-border flex items-center gap-2.5"
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
                    className="border border-border rounded-lg p-2.5 bg-surface hover:border-primary hover:bg-bg transition-all cursor-pointer flex flex-col justify-between gap-1 shadow-sm hover:shadow"
                  >
                    <span className="font-semibold text-xs text-ink leading-tight">
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
                <div className="bg-bg p-2.5 rounded border border-border ">
                  <span className="text-xs text-subtle uppercase block font-semibold mb-0.5">Selected Material</span>
                  <strong className="text-xs text-ink block">{materialCtx.id} · {materialCtx.name}</strong>
                  <span className="text-xs text-subtle">{materialCtx.plant} · Class {materialCtx.abcClass}</span>
                </div>

                <div className="bg-bg p-2.5 rounded border border-border ">
                  <span className="text-xs text-subtle uppercase block font-semibold mb-0.5">On-Hand Stock</span>
                  <strong className="num text-xs text-ink block">{formatNum(materialCtx.qty)} {materialCtx.uom}</strong>
                  <span className="text-xs text-subtle font-mono">{formatCurrency(materialCtx.value)}</span>
                </div>

                <div className="bg-bg p-2.5 rounded border border-border ">
                  <span className="text-xs text-subtle uppercase block font-semibold mb-0.5">Days of Supply</span>
                  <strong className={`num text-xs block ${materialCtx.dos < materialCtx.leadTimeDays ? 'text-error-tx' : 'text-ink '}`}>
                    {materialCtx.dos.toFixed(1)} Days
                  </strong>
                  <span className="text-xs text-subtle">Lead Time: {materialCtx.leadTimeDays}d</span>
                </div>

                <div className="bg-bg p-2.5 rounded border border-border ">
                  <span className="text-xs text-subtle uppercase block font-semibold mb-0.5">Optimal Order (EOQ)</span>
                  <strong className="num text-xs text-primary block">{formatNum(materialCtx.qStar)} {materialCtx.uom}</strong>
                  <span className="text-xs text-subtle">Target: {formatNum(materialCtx.targetBuffer)} {materialCtx.uom}</span>
                </div>
              </div>

              <div className="border-t border-border pt-2.5 flex flex-col gap-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-subtle">Active Persona Lens:</span>
                  <Badge tone="neutral">{personaMeta.label}</Badge>
                </div>
                <div className="p-2 bg-bg rounded border border-border text-xs text-subtle leading-relaxed">
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
                className="bg-surface border border-border rounded-xl p-4 flex flex-wrap items-center justify-between gap-3 shadow-sm hover:border-[color-mix(in_srgb,var(--primary)_60%,transparent)] transition-all"
              >
                <div className="flex flex-col gap-1 min-w-[280px]">
                  <div className="flex items-center gap-2">
                    <Badge tone={TAG_TONE[d.tag]}>{d.tag}</Badge>
                    <span className="font-bold text-sm text-ink ">{d.title}</span>
                  </div>
                  <span className="text-xs text-subtle ">{d.meta}</span>
                </div>
                
                <div className="flex items-center gap-4">
                  <span className="text-sm font-bold font-mono text-success-tx ">{d.impact}</span>
                  <button
                    type="button"
                    className="text-xs text-primary font-medium hover:underline"
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
              <div className="p-3 bg-bg rounded-lg border border-border flex justify-between items-center">
                <span className="text-subtle font-medium">Estimated Financial Impact:</span>
                <strong className="text-success-tx font-mono text-sm">{inspectDecision.impact}</strong>
              </div>

              <div className="space-y-1.5 text-body-c ">
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
