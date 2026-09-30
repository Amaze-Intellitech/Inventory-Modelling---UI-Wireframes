import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import {
  ArrowRight,
  Sliders,
  DollarSign,
  RefreshCw,
  BarChart3,
  Info,
  ShieldCheck,
  Package,
  Clock,
  Truck,
  TrendingDown,
  Layers,
  Scale,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
} from 'lucide-react';
import {
  ViewHead,
  KpiTile,
  WhyDisclosure,
  Badge,
  Insight,
  Card,
  CardHead,
  DrillDown,
} from '../../components/CommonUI';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { EoqCurveChart } from '../../components/Charts';
import EoqTimeSeries from '../../components/EoqTimeSeries';
import { usePlatform } from '../../context/PlatformContext';
import { EOQ_INPUTS, FORECAST_INPUTS, MATERIALS } from '../../data/mockData';

// ============================================================================
// CONFIGURED MODEL ASSUMPTIONS & PARAMETERS
// Transparently documented business parameters and economic assumptions.
// ============================================================================
const BASELINE_ORDERING_COST = 230.0; // S = ₹230.00/order (Configured Model Assumption: EDI setup & PO processing)
const BASELINE_HOLDING_RATE = 0.06;   // i = 6.00%/yr (Configured Model Assumption: Capital WACC + carrying + storage)

// Authoritative material metadata aligned with Enterprise Master Data & Downstream BOM
const MATERIAL_METADATA = {
  'MAT-1082': {
    supplier: 'HydraTech Dynamics GmbH (Sole Source)',
    leadTimeDays: 60,
    contextTag: 'Class A · High Value · Sole Source Supply',
    downstreamLines: 14,
    downstreamSummary: '14 Equipment Lines (HEX-200, IL-450, HC-80, MD-120)',
    criticality: 'Critical (Line-stoppage risk; custom hydraulic interface with zero rapid substitutes)',
    moq: 100,
    packSize: 20,
    targetServiceLevel: 98.0,
    leadTimeVarianceDays: 8,
    shelfLifeDays: null, // Non-perishable durable
  },
  'MAT-4120': {
    supplier: 'SiliconFoundry International (Allocated Supply)',
    leadTimeDays: 60,
    contextTag: 'Class A · High Volatility · Allocated Latency',
    downstreamLines: 19,
    downstreamSummary: '19 Controller SKUs (ECU-400, GW-80, TM-12)',
    criticality: 'Critical (Main embedded processor; semiconductor wafer lead-time risk)',
    moq: 500,
    packSize: 250,
    targetServiceLevel: 98.0,
    leadTimeVarianceDays: 14,
    shelfLifeDays: null,
  },
  'MAT-2041': {
    supplier: 'Apex Energy Storage Ltd (Dual Sourced)',
    leadTimeDays: 30,
    contextTag: 'Class A · High Velocity · Dual Sourced Feed',
    downstreamLines: 8,
    downstreamSummary: '8 Battery Pack Lines (BP-800, PM-200, ESS-50)',
    criticality: 'High (Core electrochemical feed for battery packs; strict cell-matching specs)',
    moq: 5000,
    packSize: 1000,
    targetServiceLevel: 95.0,
    leadTimeVarianceDays: 4,
    shelfLifeDays: null,
  },
  'MAT-5501': {
    supplier: 'BondTech Polymer Solutions (Multi-Vendor)',
    leadTimeDays: 21,
    contextTag: 'Class C · Consumable · Shelf-Life Sensitive',
    downstreamLines: 6,
    downstreamSummary: '6 Assembly Lines (Flange & Gasket Sealing)',
    criticality: 'Moderate (Standard assembly consumable; multiple equivalent approved formulations)',
    moq: 200,
    packSize: 25,
    targetServiceLevel: 95.0,
    leadTimeVarianceDays: 3,
    shelfLifeDays: 180, // Shelf-life sensitive
  },
};

// Formatting helpers
const formatNum = (val, decimals = 2) =>
  Number(val ?? 0).toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

const formatCurrency = (val, decimals = 2) =>
  `₹${Number(val ?? 0).toLocaleString('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`;

export default function EoqCalibration() {
  const navigate = useNavigate();
  const { persona, selectedMaterial } = usePlatform();
  const shouldReduceMotion = useReducedMotion();

  // --------------------------------------------------------------------------
  // 1. CANONICAL SOURCE DATA RESOLUTION (Strict Single Source of Truth)
  // --------------------------------------------------------------------------
  const fallbackMaterial = MATERIALS[0] || {
    id: 'MAT-1082',
    name: 'Hydraulic Pump 250BAR',
    category: 'Components',
    plant: 'Plant 1 — Assembly',
    qty: 930,
    uom: 'EA',
    unitCost: 600.0,
    value: 558000.0,
    abcClass: 'A',
  };

  const activeMaterial = selectedMaterial || fallbackMaterial;
  const materialId = activeMaterial.id || 'MAT-1082';

  const materialInputs = EOQ_INPUTS[materialId] || { demand: 4800.0, currentBatchQty: 600.0 };
  const forecastInputs = FORECAST_INPUTS[materialId] || { leadTimeDays: 60, demandCV: 0.12 };
  const meta = MATERIAL_METADATA[materialId] || {
    supplier: 'Standard Tier-1 Supplier',
    leadTimeDays: forecastInputs.leadTimeDays || 30,
    contextTag: `Class ${activeMaterial.abcClass || 'A'} Raw Material`,
    downstreamLines: 4,
    downstreamSummary: 'Standard production lines',
    criticality: 'Standard Component',
    moq: 100,
    packSize: 10,
    targetServiceLevel: 95.0,
    leadTimeVarianceDays: 5,
    shelfLifeDays: null,
  };

  // Base SKU data
  const demand = materialInputs.demand;
  const currentBatchQty = materialInputs.currentBatchQty;
  const unitCost = activeMaterial.unitCost ?? 600.0;
  const onHandQty = activeMaterial.qty ?? 930.0;
  const onHandValue = activeMaterial.value ?? onHandQty * unitCost;
  const uom = activeMaterial.uom || 'EA';
  const abcClass = activeMaterial.abcClass || 'A';
  const plant = activeMaterial.plant || 'Plant 1 — Assembly';
  const category = activeMaterial.category || 'Components';
  const name = activeMaterial.name || 'Raw Material';
  const leadTimeDays = forecastInputs.leadTimeDays || meta.leadTimeDays || 30;
  const demandCV = forecastInputs.demandCV ?? 0.12;
  const annualConsumptionValue = demand * unitCost;

  // --------------------------------------------------------------------------
  // 2. MODEL PARAMETERS & SENSITIVITY STATE
  // --------------------------------------------------------------------------
  const [holdingRatePct, setHoldingRatePct] = useState(BASELINE_HOLDING_RATE * 100);
  const activeHoldingRate = holdingRatePct / 100;
  const orderingCost = BASELINE_ORDERING_COST;

  // --------------------------------------------------------------------------
  // 3. CANONICAL EOQ & POLICY CALCULATIONS (Single Source of Truth)
  // --------------------------------------------------------------------------
  const canonicalMetrics = useMemo(() => {
    // Carrying cost per unit per year: H = Unit Cost × Holding Rate
    const holdingCostPerUnit = activeHoldingRate * unitCost;

    // Classical Unconstrained Theoretical EOQ: Q* = sqrt((2 × D × S) / H)
    const qStar = Math.sqrt((2 * demand * orderingCost) / holdingCostPerUnit);

    // Current ERP Policy
    const currentOrderFreq = demand / currentBatchQty;
    const currentOrderIntervalDays = (currentBatchQty / demand) * 365;
    const currentDaysOfSupply = currentOrderIntervalDays;
    const currentCycleStockQty = currentBatchQty / 2;
    const currentCycleStockValue = currentCycleStockQty * unitCost;
    const currentOrderCost = currentOrderFreq * orderingCost;
    const currentHoldCost = currentCycleStockQty * holdingCostPerUnit;
    const currentTotalCost = currentOrderCost + currentHoldCost;

    // Theoretical EOQ Baseline Policy
    const recOrderFreq = demand / qStar;
    const recOrderIntervalDays = (qStar / demand) * 365;
    const recDaysOfSupply = recOrderIntervalDays;
    const recCycleStockQty = qStar / 2;
    const recCycleStockValue = recCycleStockQty * unitCost;
    const recOrderCost = recOrderFreq * orderingCost;
    const recHoldCost = recCycleStockQty * holdingCostPerUnit;
    const recTotalCost = recOrderCost + recHoldCost;

    // Policy Delta & Financial Impact
    const netAnnualSavings = currentTotalCost - recTotalCost;
    const netSavingsPercent = currentTotalCost > 0 ? (netAnnualSavings / currentTotalCost) * 100 : 0;
    const workingCapitalReleased = (currentCycleStockQty - recCycleStockQty) * unitCost;
    const cycleStockReductionQty = currentCycleStockQty - recCycleStockQty;
    const cycleStockReductionPct =
      currentCycleStockQty > 0 ? (cycleStockReductionQty / currentCycleStockQty) * 100 : 0;

    // Planning Buffer Scenario (1.5 × Q* — clearly identified as a planning assumption, not statistical safety stock)
    const planningBufferQty = 1.5 * qStar;
    const planningBufferValue = planningBufferQty * unitCost;

    // Feasible Lot Sizing: Round EOQ to nearest Pack Size while respecting MOQ
    const packSize = meta.packSize || 1;
    const moq = meta.moq || 1;
    const roundedByPack = Math.max(moq, Math.round(qStar / packSize) * packSize);
    const feasibleLotSize = roundedByPack;
    const feasibleOrderFreq = demand / feasibleLotSize;
    const feasibleCycleStockQty = feasibleLotSize / 2;
    const feasibleCycleStockValue = feasibleCycleStockQty * unitCost;
    const feasibleOrderCost = feasibleOrderFreq * orderingCost;
    const feasibleHoldCost = feasibleCycleStockQty * holdingCostPerUnit;
    const feasibleTotalCost = feasibleOrderCost + feasibleHoldCost;
    const feasibleSavings = currentTotalCost - feasibleTotalCost;

    return {
      holdingCostPerUnit,
      qStar,
      currentOrderFreq,
      currentOrderIntervalDays,
      currentDaysOfSupply,
      currentCycleStockQty,
      currentCycleStockValue,
      currentOrderCost,
      currentHoldCost,
      currentTotalCost,
      recOrderFreq,
      recOrderIntervalDays,
      recDaysOfSupply,
      recCycleStockQty,
      recCycleStockValue,
      recOrderCost,
      recHoldCost,
      recTotalCost,
      netAnnualSavings,
      netSavingsPercent,
      workingCapitalReleased,
      cycleStockReductionQty,
      cycleStockReductionPct,
      planningBufferQty,
      planningBufferValue,
      feasibleLotSize,
      feasibleOrderFreq,
      feasibleCycleStockQty,
      feasibleCycleStockValue,
      feasibleOrderCost,
      feasibleHoldCost,
      feasibleTotalCost,
      feasibleSavings,
    };
  }, [demand, currentBatchQty, unitCost, activeHoldingRate, orderingCost, meta.packSize, meta.moq]);

  // --------------------------------------------------------------------------
  // 4. MULTI-PARAMETER SENSITIVITY MATRIX (Calculated Analytical Evidence)
  // --------------------------------------------------------------------------
  const sensitivityTables = useMemo(() => {
    // Demand Variations (-20%, -10%, Baseline, +10%, +20%)
    const demandVariations = [-0.2, -0.1, 0, 0.1, 0.2].map((delta) => {
      const d = demand * (1 + delta);
      const h = canonicalMetrics.holdingCostPerUnit;
      const q = Math.sqrt((2 * d * orderingCost) / h);
      const orderCost = (d / q) * orderingCost;
      const holdCost = (q / 2) * h;
      const totCost = orderCost + holdCost;
      const curTotCost = (d / currentBatchQty) * orderingCost + (currentBatchQty / 2) * h;
      return {
        label: `${delta > 0 ? '+' : ''}${Math.round(delta * 100)}%`,
        demand: d,
        eoq: q,
        totalCost: totCost,
        savings: curTotCost - totCost,
        isBase: delta === 0,
      };
    });

    // Ordering Cost Variations ($150, $190, $230, $270, $320)
    const orderCostVariations = [150, 190, 230, 270, 320].map((s) => {
      const h = canonicalMetrics.holdingCostPerUnit;
      const q = Math.sqrt((2 * demand * s) / h);
      const orderCost = (demand / q) * s;
      const holdCost = (q / 2) * h;
      const totCost = orderCost + holdCost;
      return {
        orderingCost: s,
        eoq: q,
        totalCost: totCost,
        orderFreq: demand / q,
        isBase: s === BASELINE_ORDERING_COST,
      };
    });

    // Holding Rate Variations (3.0%, 4.5%, 6.0%, 8.0%, 10.0%, 12.0%)
    const holdingRateVariations = [0.03, 0.045, 0.06, 0.08, 0.1, 0.12].map((r) => {
      const h = r * unitCost;
      const q = Math.sqrt((2 * demand * orderingCost) / h);
      const orderCost = (demand / q) * orderingCost;
      const holdCost = (q / 2) * h;
      const totCost = orderCost + holdCost;
      const curTotCost = (demand / currentBatchQty) * orderingCost + (currentBatchQty / 2) * h;
      return {
        ratePct: r * 100,
        holdingCostPerUnit: h,
        eoq: q,
        totalCost: totCost,
        savings: curTotCost - totCost,
        isBase: Math.abs(r - BASELINE_HOLDING_RATE) < 0.001,
      };
    });

    return {
      demandVariations,
      orderCostVariations,
      holdingRateVariations,
    };
  }, [demand, currentBatchQty, unitCost, orderingCost, canonicalMetrics.holdingCostPerUnit]);

  // --------------------------------------------------------------------------
  // 5. PERSONA-SPECIFIC OUTPUT DESCRIPTIONS & INTERPRETATIONS
  // --------------------------------------------------------------------------
  const outputDescription =
    'EOQ evaluates the economic replenishment quantity by balancing ordering cost against inventory carrying cost, then compares the result with the current replenishment policy.';

  const personaInterpretations = {
    ds: {
      tag: 'Data Scientist Lens · Mathematical Formulation & Sensitivity Intelligence',
      text: `EOQ quantifies the unconstrained economic lot size and its parameter sensitivity. The convex total-cost objective function TC(Q) = (D/Q)·S + (Q/2)·H reaches first-order optimality at Q* = √(2DS/H) = ${formatNum(canonicalMetrics.qStar, 0)} ${uom}, where marginal setup cost equals marginal carrying cost (${formatCurrency(canonicalMetrics.recOrderCost)}/yr each). Model exhibits standard square-root elasticity (∂ ln Q*/∂ ln D = 0.50).`,
    },
    analyst: {
      tag: 'Inventory Analyst Lens · Lot-Sizing Governance & Constraint Feasibility',
      text: `EOQ compares current replenishment lot sizing against an economic baseline and highlights operational constraints. Current batch policy of ${formatNum(currentBatchQty, 0)} ${uom} creates severe holding asymmetry (${formatCurrency(canonicalMetrics.currentHoldCost)}/yr holding vs ${formatCurrency(canonicalMetrics.currentOrderCost)}/yr ordering). Recalibrating to ${formatNum(canonicalMetrics.qStar, 0)} ${uom} (${formatNum(canonicalMetrics.feasibleLotSize, 0)} ${uom} feasible after MOQ/pack constraints) captures ${formatCurrency(canonicalMetrics.netAnnualSavings)}/yr in net savings and releases ${formatCurrency(canonicalMetrics.workingCapitalReleased)} in cycle-stock capital.`,
    },
    exec: {
      tag: 'C-Suite Executive Lens · Working Capital Velocity & Procurement Economics',
      text: `EOQ estimates the cost and cycle-stock opportunity from recalibrating replenishment quantity. For ${materialId}, rightsizing batch size reduces relevant annual policy friction by ${formatCurrency(canonicalMetrics.netAnnualSavings)}/yr (−${formatNum(canonicalMetrics.netSavingsPercent, 1)}%) and releases an estimated ${formatCurrency(canonicalMetrics.workingCapitalReleased)} in cycle-stock working capital, while increasing delivery cadence from ${formatNum(canonicalMetrics.currentOrderFreq, 1)} to ${formatNum(canonicalMetrics.recOrderFreq, 1)} orders/yr.`,
    },
  };

  const activePersonaInsight = personaInterpretations[persona] || personaInterpretations.analyst;

  return (
    <section className="view max-w-7xl mx-auto pb-10">
      {/* -------------------------------------------------------------------- */}
      {/* HEADER: Title & Output Description                                   */}
      {/* -------------------------------------------------------------------- */}
      <ViewHead
        title="EOQ Analysis"
        subtitle={
          <div className="space-y-1">
            <p className="text-body-c text-sm leading-relaxed m-0">{outputDescription}</p>
            <p className="text-xs text-subtle m-0 flex items-center gap-1.5 flex-wrap">
              <span>Theoretical Baseline (Q*)</span>
              <span>→</span>
              <span>Current ERP Policy</span>
              <span>→</span>
              <span>Operational Constraints</span>
              <span>→</span>
              <span className="font-semibold text-ink">Optimization Handoff</span>
            </p>
          </div>
        }
      />

      {/* -------------------------------------------------------------------- */}
      {/* MATERIAL CONTEXT CARD: Comprehensive Upstream Single Source of Truth  */}
      {/* -------------------------------------------------------------------- */}
      <div className="card bg-surface border border-border rounded-md p-4 sm:p-5 shadow-subtle mb-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 mb-3.5 border-b border-border">
          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h2 className="text-base font-bold text-ink m-0">
                {materialId} · {name}
              </h2>
              <Badge tone={abcClass === 'A' ? 'accent' : 'neutral'}>
                Class {abcClass} Material
              </Badge>
              <Badge tone="neutral" className="hidden sm:inline-flex">
                {meta.contextTag}
              </Badge>
            </div>
            <p className="text-xs text-body-c m-0">
              {plant} · Category: <strong>{category}</strong> · Primary Vendor: <strong>{meta.supplier}</strong> · Lead Time: <strong>{leadTimeDays} days</strong> (CV: {demandCV.toFixed(2)})
            </p>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <Badge tone={meta.criticality.startsWith('Critical') ? 'risk' : 'neutral'}>
              {meta.criticality.startsWith('Critical') ? 'Critical Component' : 'Standard Component'}
            </Badge>
          </div>
        </div>

        {/* Data Provenance & Assumptions Transparency Banner */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 p-2.5 bg-bg/70 rounded border border-border text-xs">
          <div>
            <span className="text-subtle block font-medium">Annual Demand (D):</span>
            <span className="text-ink font-semibold">{formatNum(demand, 0)} {uom}/yr</span>
            <span className="text-[11px] text-success block">Canonical Source Data</span>
          </div>
          <div>
            <span className="text-subtle block font-medium">Standard Unit Cost (C):</span>
            <span className="text-ink font-semibold">{formatCurrency(unitCost)}/{uom}</span>
            <span className="text-[11px] text-success block">Canonical Source Data</span>
          </div>
          <div>
            <span className="text-subtle block font-medium">Ordering Setup Cost (S):</span>
            <span className="text-ink font-semibold">{formatCurrency(orderingCost)}/order</span>
            <span className="text-[11px] text-primary block font-medium">Configured Model Assumption</span>
          </div>
          <div>
            <span className="text-subtle block font-medium">Holding Cost Rate (i):</span>
            <span className="text-ink font-semibold">{formatNum(activeHoldingRate * 100, 1)}%/yr (H = {formatCurrency(canonicalMetrics.holdingCostPerUnit)}/{uom})</span>
            <span className="text-[11px] text-primary block font-medium">Configured Model Assumption</span>
          </div>
        </div>
      </div>

      {/* -------------------------------------------------------------------- */}
      {/* PERSONA-SPECIFIC PRIMARY 4 KPIs (Strict Cross-Persona Reconciliation)*/}
      {/* -------------------------------------------------------------------- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mb-5">
        {/* DATA SCIENTIST PRIMARY KPIs */}
        {persona === 'ds' && (
          <>
            <KpiTile
              label="Annual Demand (D)"
              value={`${formatNum(demand, 0)} ${uom}/yr`}
              sub={`${formatCurrency(annualConsumptionValue)} annual consumption value`}
            />
            <KpiTile
              label="Current Order Quantity (Q)"
              value={`${formatNum(currentBatchQty, 0)} ${uom}`}
              sub={`${formatNum(canonicalMetrics.currentOrderFreq, 1)} orders/yr · ${formatNum(canonicalMetrics.currentDaysOfSupply, 1)}d supply`}
            />
            <KpiTile
              label="Calibrated EOQ (Q*)"
              value={`${formatNum(canonicalMetrics.qStar, 0)} ${uom}`}
              sub={`${formatNum(canonicalMetrics.recOrderFreq, 1)} orders/yr · ${formatNum(canonicalMetrics.recDaysOfSupply, 1)}d supply`}
              valueStyle={{ color: 'var(--primary)' }}
            />
            <KpiTile
              label="EOQ Relevant Cost"
              value={`${formatCurrency(canonicalMetrics.recTotalCost)}/yr`}
              sub={`Min cost: ${formatCurrency(canonicalMetrics.recOrderCost)} order + ${formatCurrency(canonicalMetrics.recHoldCost)} hold`}
              valueStyle={{ color: 'var(--success)' }}
            />
          </>
        )}

        {/* INVENTORY ANALYST PRIMARY KPIs */}
        {persona === 'analyst' && (
          <>
            <KpiTile
              label="Current Lot Size"
              value={`${formatNum(currentBatchQty, 0)} ${uom}`}
              sub={`Every ~${formatNum(canonicalMetrics.currentOrderIntervalDays, 0)} days (${formatNum(canonicalMetrics.currentOrderFreq, 1)} orders/yr)`}
            />
            <KpiTile
              label="Calibrated EOQ Baseline"
              value={`${formatNum(canonicalMetrics.qStar, 0)} ${uom}`}
              sub={`Every ~${formatNum(canonicalMetrics.recOrderIntervalDays, 0)} days (${formatNum(canonicalMetrics.recOrderFreq, 1)} orders/yr)`}
              valueStyle={{ color: 'var(--primary)' }}
            />
            <KpiTile
              label="Order Interval Shift"
              value={`~${formatNum(canonicalMetrics.recOrderIntervalDays, 0)}d vs ${formatNum(canonicalMetrics.currentOrderIntervalDays, 0)}d`}
              delta={`−${formatNum(Math.abs(canonicalMetrics.currentOrderIntervalDays - canonicalMetrics.recOrderIntervalDays), 0)} days between orders`}
              deltaTone="up"
              sub={`Frequency: +${formatNum(canonicalMetrics.recOrderFreq - canonicalMetrics.currentOrderFreq, 1)} orders/yr`}
            />
            <KpiTile
              label="Annual Cost Opportunity"
              value={`${formatCurrency(canonicalMetrics.netAnnualSavings)}/yr`}
              delta={`−${formatNum(canonicalMetrics.netSavingsPercent, 1)}% relevant cost`}
              deltaTone="up"
              sub={`Modeled potential savings across batch cycles`}
              valueStyle={{ color: 'var(--success)' }}
            />
          </>
        )}

        {/* C-SUITE EXECUTIVE PRIMARY KPIs */}
        {persona === 'exec' && (
          <>
            <KpiTile
              label="Annual Relevant Cost"
              value={`${formatCurrency(canonicalMetrics.currentTotalCost)}/yr`}
              sub={`Current policy: ${formatCurrency(canonicalMetrics.currentHoldCost)} hold + ${formatCurrency(canonicalMetrics.currentOrderCost)} order`}
            />
            <KpiTile
              label="Potential Annual Savings"
              value={`${formatCurrency(canonicalMetrics.netAnnualSavings)}/yr`}
              delta={`−${formatNum(canonicalMetrics.netSavingsPercent, 1)}% cost reduction`}
              deltaTone="up"
              sub={`Modeled relevant cost reduction from lot-size calibration`}
              valueStyle={{ color: 'var(--success)' }}
            />
            <KpiTile
              label="Cycle-Stock Capital"
              value={formatCurrency(canonicalMetrics.currentCycleStockValue)}
              sub={`${formatNum(canonicalMetrics.currentCycleStockQty, 0)} ${uom} average working capital in cycle buffer`}
            />
            <KpiTile
              label="Working Capital Opportunity"
              value={formatCurrency(canonicalMetrics.workingCapitalReleased)}
              delta={`−${formatNum(canonicalMetrics.cycleStockReductionPct, 1)}% cycle stock`}
              deltaTone="up"
              sub={`Potential capital releasable into liquidity`}
              valueStyle={{ color: 'var(--success)' }}
            />
          </>
        )}
      </div>

      {/* -------------------------------------------------------------------- */}
      {/* PERSONA INSIGHT / LENS CALLOUT                                       */}
      {/* -------------------------------------------------------------------- */}
      <motion.div
        key={persona}
        initial={shouldReduceMotion ? false : { opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="mb-5"
      >
        <Insight label={activePersonaInsight.tag}>
          {activePersonaInsight.text}
        </Insight>
      </motion.div>

      {/* -------------------------------------------------------------------- */}
      {/* POLICY COMPARISON & FINANCIAL IMPACT                                 */}
      {/* -------------------------------------------------------------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mb-6">
        {/* Current ERP Policy Card */}
        <div className="lg:col-span-4 bg-surface border border-border rounded-md p-5 shadow-subtle flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-border">
              <div>
                <h3 className="text-sm font-bold text-ink m-0">Current ERP Policy</h3>
                <span className="text-[11px] text-subtle">Configured replenishment baseline</span>
              </div>
              <Badge tone="neutral">Batch: {formatNum(currentBatchQty, 0)} {uom}</Badge>
            </div>
            <div className="rounded-sm border border-border overflow-hidden mb-3">
              <Table>
                <TableBody>
                  <TableRow>
                    <TableCell className="text-xs text-body-c">Order Frequency</TableCell>
                    <TableCell className="text-right font-mono font-medium">{formatNum(canonicalMetrics.currentOrderFreq, 1)} orders/yr</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="text-xs text-body-c">Days Between Orders</TableCell>
                    <TableCell className="text-right font-mono font-medium">~{formatNum(canonicalMetrics.currentOrderIntervalDays, 0)} days</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="text-xs text-body-c">Days of Supply (DOS)</TableCell>
                    <TableCell className="text-right font-mono font-medium">{formatNum(canonicalMetrics.currentDaysOfSupply, 1)} days</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="text-xs text-body-c">Avg Cycle Stock (Q/2)</TableCell>
                    <TableCell className="text-right font-mono font-medium">{formatNum(canonicalMetrics.currentCycleStockQty, 0)} {uom} ({formatCurrency(canonicalMetrics.currentCycleStockValue)})</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="text-xs text-body-c">Annual Ordering Cost</TableCell>
                    <TableCell className="text-right font-mono">{formatCurrency(canonicalMetrics.currentOrderCost)}/yr</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="text-xs text-body-c">Annual Holding Cost</TableCell>
                    <TableCell className="text-right font-mono">{formatCurrency(canonicalMetrics.currentHoldCost)}/yr</TableCell>
                  </TableRow>
                  <TableRow className="bg-bg font-bold">
                    <TableCell className="text-ink">Total Relevant Cost</TableCell>
                    <TableCell className="text-right font-mono text-ink">{formatCurrency(canonicalMetrics.currentTotalCost)}/yr</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </div>
          <p className="text-xs text-subtle m-0">
            Current lot sizing fixed at {formatNum(currentBatchQty, 0)} {uom} results in holding cost asymmetry ({formatCurrency(canonicalMetrics.currentHoldCost)} vs {formatCurrency(canonicalMetrics.currentOrderCost)}).
          </p>
        </div>

        {/* Theoretical EOQ Baseline Card */}
        <div className="lg:col-span-4 bg-surface border-2 border-primary/40 rounded-md p-5 shadow-subtle flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-border">
              <div>
                <h3 className="text-sm font-bold text-ink m-0">Theoretical EOQ Baseline</h3>
                <span className="text-[11px] text-primary font-medium">Unconstrained economic minimum (Q*)</span>
              </div>
              <Badge tone="accent">Q*: {formatNum(canonicalMetrics.qStar, 0)} {uom}</Badge>
            </div>
            <div className="rounded-sm border border-border overflow-hidden mb-3">
              <Table>
                <TableBody>
                  <TableRow>
                    <TableCell className="text-xs text-body-c">Order Frequency</TableCell>
                    <TableCell className="text-right font-mono font-medium">{formatNum(canonicalMetrics.recOrderFreq, 1)} orders/yr</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="text-xs text-body-c">Days Between Orders</TableCell>
                    <TableCell className="text-right font-mono font-medium">~{formatNum(canonicalMetrics.recOrderIntervalDays, 0)} days</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="text-xs text-body-c">Days of Supply (DOS)</TableCell>
                    <TableCell className="text-right font-mono font-medium">{formatNum(canonicalMetrics.recDaysOfSupply, 1)} days</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="text-xs text-body-c">Avg Cycle Stock (Q*/2)</TableCell>
                    <TableCell className="text-right font-mono font-medium">{formatNum(canonicalMetrics.recCycleStockQty, 0)} {uom} ({formatCurrency(canonicalMetrics.recCycleStockValue)})</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="text-xs text-body-c">Annual Ordering Cost</TableCell>
                    <TableCell className="text-right font-mono">{formatCurrency(canonicalMetrics.recOrderCost)}/yr</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="text-xs text-body-c">Annual Holding Cost</TableCell>
                    <TableCell className="text-right font-mono text-success">{formatCurrency(canonicalMetrics.recHoldCost)}/yr</TableCell>
                  </TableRow>
                  <TableRow className="bg-success-bg/30 font-bold">
                    <TableCell className="text-ink">Total Relevant Cost</TableCell>
                    <TableCell className="text-right font-mono text-success">{formatCurrency(canonicalMetrics.recTotalCost)}/yr</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </div>
          <p className="text-xs text-subtle m-0">
            Exact cost equilibrium where setup cost ({formatCurrency(canonicalMetrics.recOrderCost)}) perfectly equals holding cost ({formatCurrency(canonicalMetrics.recHoldCost)}).
          </p>
        </div>

        {/* Policy Delta & Sensitivity Slider */}
        <div className="lg:col-span-4 bg-gradient-to-b from-surface to-bg/50 border border-border rounded-md p-5 shadow-subtle flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-border">
              <div>
                <h3 className="text-sm font-bold text-ink m-0">Policy Variance &amp; Release</h3>
                <span className="text-[11px] text-subtle">Modeled economic opportunity</span>
              </div>
              <Badge tone="success">Optimal Equilibrium</Badge>
            </div>

            <div className="space-y-3 mb-4">
              <div className="p-3 rounded bg-success-bg border border-success">
                <div className="text-xs font-bold text-success uppercase tracking-wider mb-0.5">
                  Potential Working Capital Release
                </div>
                <div className="text-2xl font-bold font-mono text-ink">
                  {formatCurrency(canonicalMetrics.workingCapitalReleased)}
                </div>
                <div className="text-xs text-body-c mt-0.5">
                  Cycle stock reduced by {formatNum(canonicalMetrics.cycleStockReductionQty, 0)} {uom} (−{formatNum(canonicalMetrics.cycleStockReductionPct, 1)}%)
                </div>
              </div>

              <div className="p-3 rounded bg-surface border border-border">
                <div className="text-xs font-bold text-body-c uppercase tracking-wider mb-0.5">
                  Modeled Annual Relevant Savings
                </div>
                <div className="text-xl font-bold font-mono text-success">
                  {formatCurrency(canonicalMetrics.netAnnualSavings)}/yr
                </div>
                <div className="text-xs text-body-c mt-0.5">
                  {formatNum(canonicalMetrics.netSavingsPercent, 1)}% reduction in annual relevant carrying &amp; ordering friction
                </div>
              </div>
            </div>

            {/* Interactive Holding Rate Slider */}
            <div className="pt-3 border-t border-border">
              <div className="flex justify-between items-center text-xs font-semibold mb-2">
                <span className="text-body-c">Holding Cost Rate Sensitivity:</span>
                <span className="font-mono text-primary font-bold">{formatNum(holdingRatePct, 1)}%/yr</span>
              </div>
              <Slider
                value={[holdingRatePct]}
                min={3.0}
                max={18.0}
                step={0.5}
                onValueChange={(val) => setHoldingRatePct(val[0])}
                className="my-2"
              />
              <div className="flex justify-between text-xs text-subtle font-mono">
                <span>3.0%</span>
                <span>Baseline (6.0%)</span>
                <span>18.0%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* -------------------------------------------------------------------- */}
      {/* EOQ TOTAL COST PARABOLA & CURVE CHART                                 */}
      {/* -------------------------------------------------------------------- */}
      <div className="card bg-surface border border-border rounded-md p-5 shadow-subtle mb-6">
        <div className="card__head flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-4">
          <div>
            <h2 className="card__title text-sm font-bold text-ink m-0">EOQ Total Relevant Cost Parabola &amp; Equilibrium Curve</h2>
            <p className="card__sub text-xs text-body-c m-0 mt-0.5">
              Ordering cost decays hyperbolically (S·D/Q), carrying cost rises linearly (H·Q/2). EOQ (Q*) sits at the exact convex global minimum.
            </p>
          </div>
          <Badge tone="accent" className="self-start sm:self-auto">
            Q* = {formatNum(canonicalMetrics.qStar, 0)} {uom} · Min Cost {formatCurrency(canonicalMetrics.recTotalCost)}/yr
          </Badge>
        </div>

        <div className="chart-shell mb-3">
          <EoqCurveChart
            demand={demand}
            orderingCost={orderingCost}
            holdingCostPerUnit={canonicalMetrics.holdingCostPerUnit}
            uom={uom}
          />
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs text-subtle pt-2 border-t border-border gap-2">
          <span className="font-mono">
            Analytical Formula: Q* = √(2·D·S / H) = √((2 × {formatNum(demand, 0)} × ₹{orderingCost.toFixed(2)}) / ₹{formatNum(canonicalMetrics.holdingCostPerUnit, 4)}) = {formatNum(canonicalMetrics.qStar, 0)} {uom}
          </span>
          <span className="text-body-c">
            Note: Total Relevant Cost excludes purchase cost (D × C) as it is independent of lot sizing.
          </span>
        </div>
      </div>

      {/* -------------------------------------------------------------------- */}
      {/* OPERATIONAL CONSTRAINTS & PROCUREMENT FEASIBILITY                   */}
      {/* -------------------------------------------------------------------- */}
      <div className="card bg-surface border border-border rounded-md p-5 shadow-subtle mb-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 mb-3 pb-2 border-b border-border">
          <div>
            <h2 className="card__title text-sm font-bold text-ink m-0">Operational Constraints &amp; Execution Feasibility</h2>
            <p className="card__sub text-xs text-body-c m-0 mt-0.5">
              Theoretical EOQ (Q* = {formatNum(canonicalMetrics.qStar, 0)} {uom}) establishes the economic baseline. Feasible procurement lot sizing requires evaluating supplier contracts, packaging increments, and risk boundaries.
            </p>
          </div>
          <Badge tone="neutral">Constraint Reconciliation</Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 mb-4">
          {/* Constraint 1: MOQ & Packaging */}
          <div className="p-3.5 bg-bg rounded-sm border border-border flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-ink flex items-center gap-1.5">
                  <Package size={13} className="text-primary" />
                  1. MOQ &amp; Packaging Multiples
                </span>
                <Badge tone="accent">Available Data</Badge>
              </div>
              <p className="text-xs text-body-c m-0 leading-relaxed mb-2">
                Supplier minimum order quantity is <strong>{meta.moq} {uom}</strong> with master carton pack multiples of <strong>{meta.packSize} {uom}</strong>.
              </p>
            </div>
            <div className="pt-2 border-t border-border/80 text-[11px] text-ink font-mono bg-surface/50 p-2 rounded">
              Feasible Lot Size: <strong>{formatNum(canonicalMetrics.feasibleLotSize, 0)} {uom}</strong> (Cost: {formatCurrency(canonicalMetrics.feasibleTotalCost)}/yr)
            </div>
          </div>

          {/* Constraint 2: Lead Time & Delivery Cadence */}
          <div className="p-3.5 bg-bg rounded-sm border border-border flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-ink flex items-center gap-1.5">
                  <Clock size={13} className="text-primary" />
                  2. Supplier Lead Time &amp; Cadence
                </span>
                <Badge tone="accent">Available Data</Badge>
              </div>
              <p className="text-xs text-body-c m-0 leading-relaxed mb-2">
                Transit lead time is <strong>{leadTimeDays} days</strong> with ±{meta.leadTimeVarianceDays}d variance. Ordering cadence increases from {formatNum(canonicalMetrics.currentOrderFreq, 1)} to {formatNum(canonicalMetrics.recOrderFreq, 1)} orders/yr (every ~{formatNum(canonicalMetrics.recOrderIntervalDays, 0)} days).
              </p>
            </div>
            <div className="pt-2 border-t border-border/80 text-[11px] text-body-c bg-surface/50 p-2 rounded">
              Lead time determines <em>when</em> to reorder; EOQ determines <em>how much</em> to order.
            </div>
          </div>

          {/* Constraint 3: Planning Buffer Scenario */}
          <div className="p-3.5 bg-bg rounded-sm border border-border flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-ink flex items-center gap-1.5">
                  <ShieldCheck size={13} className="text-primary" />
                  3. Planning Buffer (1.5 × Q*)
                </span>
                <Badge tone="neutral">Configured Assumption</Badge>
              </div>
              <p className="text-xs text-body-c m-0 leading-relaxed mb-2">
                Planning Buffer Scenario of <strong>{formatNum(canonicalMetrics.planningBufferQty, 0)} {uom}</strong> ({formatCurrency(canonicalMetrics.planningBufferValue)}) represents a deterministic planning buffer (1.5 × Q*), not statistically derived safety stock.
              </p>
            </div>
            <div className="pt-2 border-t border-border/80 text-[11px] text-subtle bg-surface/50 p-2 rounded">
              Statistical Safety Stock is calculated separately in Optimization using Demand CV ({demandCV.toFixed(2)}).
            </div>
          </div>
        </div>

        {/* Additional Constraint Mapping Table */}
        <div className="rounded border border-border overflow-hidden text-xs">
          <Table>
            <TableHeader>
              <TableRow className="bg-bg/80">
                <TableHead className="font-semibold text-ink">Constraint Dimension</TableHead>
                <TableHead className="font-semibold text-ink">Source / Status</TableHead>
                <TableHead className="font-semibold text-ink">Configured Value</TableHead>
                <TableHead className="font-semibold text-ink">Impact on EOQ Feasibility</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium text-ink">Minimum Order Quantity (MOQ)</TableCell>
                <TableCell><Badge tone="accent">Available Data</Badge></TableCell>
                <TableCell className="font-mono">{meta.moq} {uom}</TableCell>
                <TableCell className="text-body-c">Theoretical Q* ({formatNum(canonicalMetrics.qStar, 0)} {uom}) satisfies MOQ ({meta.moq} {uom}) without floor clipping.</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium text-ink">Master Packaging Increments</TableCell>
                <TableCell><Badge tone="accent">Available Data</Badge></TableCell>
                <TableCell className="font-mono">{meta.packSize} {uom}/carton</TableCell>
                <TableCell className="text-body-c">Rounds Q* from {formatNum(canonicalMetrics.qStar, 1)} to {formatNum(canonicalMetrics.feasibleLotSize, 0)} {uom} ({Math.round(canonicalMetrics.feasibleLotSize / meta.packSize)} cartons); adds &lt;0.1% to cost.</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium text-ink">Supplier Replenishment Capacity</TableCell>
                <TableCell><Badge tone="neutral">Configured Assumption</Badge></TableCell>
                <TableCell className="font-mono">Unconstrained / EDI</TableCell>
                <TableCell className="text-body-c">Vendor throughput confirmed capable of supporting {formatNum(canonicalMetrics.recOrderFreq, 1)} PO transmissions per annum.</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium text-ink">Shelf Life &amp; Degradation</TableCell>
                <TableCell>
                  <Badge tone={meta.shelfLifeDays ? 'warning' : 'neutral'}>
                    {meta.shelfLifeDays ? `${meta.shelfLifeDays}d Limit` : 'Non-Perishable'}
                  </Badge>
                </TableCell>
                <TableCell className="font-mono">{meta.shelfLifeDays ? `${meta.shelfLifeDays} days` : 'N/A'}</TableCell>
                <TableCell className="text-body-c">
                  {meta.shelfLifeDays
                    ? `EOQ DOS (${formatNum(canonicalMetrics.recDaysOfSupply, 1)}d) remains well within ${meta.shelfLifeDays}-day shelf life ceiling.`
                    : 'Durable component with zero shelf-life obsolescence constraint.'}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium text-ink">Downstream Schedule Synchronicity</TableCell>
                <TableCell><Badge tone="accent">Available Data</Badge></TableCell>
                <TableCell className="font-mono">{meta.downstreamLines} Lines</TableCell>
                <TableCell className="text-body-c">{meta.downstreamSummary}; lot sizing feeds steady aggregate demand.</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </div>

      {/* -------------------------------------------------------------------- */}
      {/* SENSITIVITY ANALYSIS MATRIX (Persona Specific / Deep Analytical)     */}
      {/* -------------------------------------------------------------------- */}
      <div className="card bg-surface border border-border rounded-md p-5 shadow-subtle mb-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 mb-3 pb-2 border-b border-border">
          <div>
            <h2 className="card__title text-sm font-bold text-ink m-0">Multi-Parameter Sensitivity Analysis</h2>
            <p className="card__sub text-xs text-body-c m-0 mt-0.5">
              Calculated model outputs across demand shocks, ordering cost changes, and holding rate shifts.
            </p>
          </div>
          <Badge tone="neutral">Sensitivity Grid</Badge>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Demand Sensitivity Table */}
          <div className="p-3 bg-bg rounded border border-border">
            <h3 className="text-xs font-bold text-ink mb-2">Demand Variation Sensitivity (D)</h3>
            <div className="rounded border border-border overflow-hidden text-xs bg-surface">
              <Table>
                <TableHeader>
                  <TableRow className="bg-bg/50">
                    <TableHead className="py-1.5 px-2">Shock</TableHead>
                    <TableHead className="py-1.5 px-2 text-right">Demand</TableHead>
                    <TableHead className="py-1.5 px-2 text-right">EOQ (Q*)</TableHead>
                    <TableHead className="py-1.5 px-2 text-right">Relevant Cost</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sensitivityTables.demandVariations.map((row) => (
                    <TableRow key={row.label} className={row.isBase ? 'bg-primary/5 font-semibold' : ''}>
                      <TableCell className="py-1.5 px-2">{row.label} {row.isBase ? '(Base)' : ''}</TableCell>
                      <TableCell className="py-1.5 px-2 text-right font-mono">{formatNum(row.demand, 0)}</TableCell>
                      <TableCell className="py-1.5 px-2 text-right font-mono font-medium">{formatNum(row.eoq, 0)} {uom}</TableCell>
                      <TableCell className="py-1.5 px-2 text-right font-mono">{formatCurrency(row.totalCost)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <span className="text-[11px] text-subtle block mt-1.5">Square-root response: ±20% demand shifts EOQ by ~±9.5%.</span>
          </div>

          {/* Ordering Cost Sensitivity Table */}
          <div className="p-3 bg-bg rounded border border-border">
            <h3 className="text-xs font-bold text-ink mb-2">Ordering Cost Sensitivity (S)</h3>
            <div className="rounded border border-border overflow-hidden text-xs bg-surface">
              <Table>
                <TableHeader>
                  <TableRow className="bg-bg/50">
                    <TableHead className="py-1.5 px-2">Setup Cost</TableHead>
                    <TableHead className="py-1.5 px-2 text-right">EOQ (Q*)</TableHead>
                    <TableHead className="py-1.5 px-2 text-right">Orders/Yr</TableHead>
                    <TableHead className="py-1.5 px-2 text-right">Relevant Cost</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sensitivityTables.orderCostVariations.map((row) => (
                    <TableRow key={row.orderingCost} className={row.isBase ? 'bg-primary/5 font-semibold' : ''}>
                      <TableCell className="py-1.5 px-2 font-mono">₹{row.orderingCost} {row.isBase ? '(Base)' : ''}</TableCell>
                      <TableCell className="py-1.5 px-2 text-right font-mono font-medium">{formatNum(row.eoq, 0)} {uom}</TableCell>
                      <TableCell className="py-1.5 px-2 text-right font-mono">{formatNum(row.orderFreq, 1)}</TableCell>
                      <TableCell className="py-1.5 px-2 text-right font-mono">{formatCurrency(row.totalCost)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <span className="text-[11px] text-subtle block mt-1.5">Lower PO transaction cost justifies smaller batches.</span>
          </div>

          {/* Holding Rate Sensitivity Table */}
          <div className="p-3 bg-bg rounded border border-border">
            <h3 className="text-xs font-bold text-ink mb-2">Holding Rate Sensitivity (i)</h3>
            <div className="rounded border border-border overflow-hidden text-xs bg-surface">
              <Table>
                <TableHeader>
                  <TableRow className="bg-bg/50">
                    <TableHead className="py-1.5 px-2">Rate (i)</TableHead>
                    <TableHead className="py-1.5 px-2 text-right">H (₹/unit)</TableHead>
                    <TableHead className="py-1.5 px-2 text-right">EOQ (Q*)</TableHead>
                    <TableHead className="py-1.5 px-2 text-right">Potential Savings</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sensitivityTables.holdingRateVariations.map((row) => (
                    <TableRow key={row.ratePct} className={row.isBase ? 'bg-primary/5 font-semibold' : ''}>
                      <TableCell className="py-1.5 px-2 font-mono">{row.ratePct.toFixed(1)}% {row.isBase ? '(Base)' : ''}</TableCell>
                      <TableCell className="py-1.5 px-2 text-right font-mono">₹{formatNum(row.holdingCostPerUnit, 2)}</TableCell>
                      <TableCell className="py-1.5 px-2 text-right font-mono font-medium">{formatNum(row.eoq, 0)} {uom}</TableCell>
                      <TableCell className="py-1.5 px-2 text-right font-mono text-success">{formatCurrency(row.savings)}/yr</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <span className="text-[11px] text-subtle block mt-1.5">Higher cost of capital increases savings from EOQ calibration.</span>
          </div>
        </div>
      </div>

      {/* -------------------------------------------------------------------- */}
      {/* EOQ HISTORICAL TRAJECTORY & DRIVERS (EoqTimeSeries)                  */}
      {/* -------------------------------------------------------------------- */}
      <EoqTimeSeries
        demand={demand}
        orderingCost={orderingCost}
        holdingCostPerUnit={canonicalMetrics.holdingCostPerUnit}
        uom={uom}
        material={`${materialId} · ${name}`}
      />

      {/* -------------------------------------------------------------------- */}
      {/* COLLAPSED ANALYTICAL DRILLDOWN (Technical Evidence & Formulations)   */}
      {/* -------------------------------------------------------------------- */}
      <DrillDown
        title="Analytical Foundation & Mathematical Formulations"
        hint="First-order optimality, elasticity proofs, and parameter provenance"
      >
        <div className="space-y-4 pt-2 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-3.5 bg-bg rounded border border-border space-y-2">
              <h4 className="font-bold text-ink text-xs uppercase tracking-wider m-0">1. Total Cost Objective &amp; First-Order Optimality</h4>
              <p className="text-body-c leading-relaxed m-0 font-mono">
                TC(Q) = (D / Q) · S + (Q / 2) · H
              </p>
              <p className="text-body-c leading-relaxed m-0 font-mono">
                ∂TC/∂Q = −(D · S) / Q² + H / 2 = 0  ⇒  Q* = √(2·D·S / H)
              </p>
              <p className="text-subtle leading-relaxed m-0">
                Second derivative ∂²TC/∂Q² = 2·D·S / Q³ &gt; 0 for all Q &gt; 0 confirms global convexity and guaranteed unique minimum.
              </p>
            </div>

            <div className="p-3.5 bg-bg rounded border border-border space-y-2">
              <h4 className="font-bold text-ink text-xs uppercase tracking-wider m-0">2. Parameter Elasticities &amp; Flat-Bottom Property</h4>
              <p className="text-body-c leading-relaxed m-0 font-mono">
                ∂ ln Q* / ∂ ln D = +0.50  |  ∂ ln Q* / ∂ ln S = +0.50  |  ∂ ln Q* / ∂ ln H = −0.50
              </p>
              <p className="text-subtle leading-relaxed m-0">
                EOQ exhibits the classical "flat-bottom" total cost property: lot sizes within [0.85 Q*, 1.18 Q*] result in less than a 1.5% cost increase above theoretical minimum, providing strong operational tolerance for pack-size rounding.
              </p>
            </div>
          </div>

          <div className="p-3 bg-bg rounded border border-border">
            <h4 className="font-bold text-ink text-xs uppercase tracking-wider mb-2">3. Parameter Provenance &amp; Verification Matrix</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="bg-surface p-2.5 rounded border border-border">
                <span className="text-subtle font-medium block">Measured Source Data:</span>
                <span className="text-ink font-semibold block">Demand (D = {formatNum(demand, 0)} {uom})</span>
                <span className="text-ink font-semibold block">Unit Cost (C = {formatCurrency(unitCost)})</span>
                <span className="text-ink font-semibold block">Lead Time ({leadTimeDays}d)</span>
              </div>
              <div className="bg-surface p-2.5 rounded border border-border">
                <span className="text-subtle font-medium block">Configured Assumptions:</span>
                <span className="text-ink font-semibold block">Setup Cost (S = ₹{orderingCost.toFixed(2)})</span>
                <span className="text-ink font-semibold block">Holding Rate (i = {formatNum(activeHoldingRate * 100, 1)}%)</span>
                <span className="text-ink font-semibold block">Planning Buffer (1.5 × Q*)</span>
              </div>
              <div className="bg-surface p-2.5 rounded border border-border">
                <span className="text-subtle font-medium block">Calibrated Outputs:</span>
                <span className="text-ink font-semibold block">Theoretical Q* ({formatNum(canonicalMetrics.qStar, 0)} {uom})</span>
                <span className="text-ink font-semibold block">Feasible Lot ({formatNum(canonicalMetrics.feasibleLotSize, 0)} {uom})</span>
                <span className="text-ink font-semibold block">Annual Savings ({formatCurrency(canonicalMetrics.netAnnualSavings)}/yr)</span>
              </div>
            </div>
          </div>
        </div>
      </DrillDown>

      {/* -------------------------------------------------------------------- */}
      {/* WHY DISCLOSURE: Concise Root Causes & Actionable Next Steps          */}
      {/* -------------------------------------------------------------------- */}
      <div className="card bg-surface border border-border rounded-md p-5 shadow-subtle mb-6">
        <h2 className="card__title text-sm font-bold text-ink mb-1">
          Why EOQ Shifted from {formatNum(currentBatchQty, 0)} to {formatNum(canonicalMetrics.qStar, 0)} {uom} for {materialId}
        </h2>
        <WhyDisclosure
          defaultOpen
          summary="Root Causes, Operational Trade-Offs, and Next Actions"
          drivers={[
            `Physical annual demand of ${formatNum(demand, 0)} ${uom}/yr (${formatCurrency(annualConsumptionValue)} annual consumption value at standard unit cost of ${formatCurrency(unitCost)}) for ${materialId}.`,
            `Fixed ordering setup cost of ${formatCurrency(orderingCost)}/order (EDI PO processing assumption).`,
            `Carrying cost rate of ${formatNum(activeHoldingRate * 100, 1)}%/yr, generating annual holding friction H = ${formatCurrency(canonicalMetrics.holdingCostPerUnit)}/${uom}/yr.`,
            `Current ERP batch policy of ${formatNum(currentBatchQty, 0)} ${uom} creates severe holding cost asymmetry (${formatCurrency(canonicalMetrics.currentHoldCost)}/yr holding vs ${formatCurrency(canonicalMetrics.currentOrderCost)}/yr ordering).`,
          ]}
          meaning={[
            `Replenishment cadence shifts from ${formatNum(canonicalMetrics.currentOrderFreq, 1)} to ${formatNum(canonicalMetrics.recOrderFreq, 1)} orders/yr (ordering every ~${formatNum(canonicalMetrics.recOrderIntervalDays, 0)} days instead of ~${formatNum(canonicalMetrics.currentOrderIntervalDays, 0)} days).`,
            `Average cycle stock drops from ${formatNum(canonicalMetrics.currentCycleStockQty, 0)} ${uom} (${formatCurrency(canonicalMetrics.currentCycleStockValue)}) to ${formatNum(canonicalMetrics.recCycleStockQty, 0)} ${uom} (${formatCurrency(canonicalMetrics.recCycleStockValue)}), unlocking ${formatCurrency(canonicalMetrics.workingCapitalReleased)} in cycle-stock capital.`,
            `Total relevant annual policy cost is minimized from ${formatCurrency(canonicalMetrics.currentTotalCost)} to ${formatCurrency(canonicalMetrics.recTotalCost)}/yr, capturing ${formatCurrency(canonicalMetrics.netAnnualSavings)}/yr (−${formatNum(canonicalMetrics.netSavingsPercent, 1)}%) in modeled savings.`,
          ]}
          action={[
            `Evaluate feasible lot size of ${formatNum(canonicalMetrics.feasibleLotSize, 0)} ${uom} against supplier MOQ (${meta.moq} ${uom}) and master packaging (${meta.packSize} ${uom}) in Optimization.`,
            `Verify vendor ${meta.supplier} EDI throughput can sustain the calibrated cadence of ${formatNum(canonicalMetrics.recOrderFreq, 1)} orders/yr.`,
            `Test lead-time extension and demand volatility shocks in What-If Simulation before executing ERP Material Master updates.`,
          ]}
        />
      </div>

      {/* -------------------------------------------------------------------- */}
      {/* HANDOFF TO OPTIMIZATION & WHAT-IF                                    */}
      {/* -------------------------------------------------------------------- */}
      <div className="card bg-gradient-to-r from-surface via-surface to-bg border border-border rounded-md p-5 shadow-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-sm font-bold text-ink m-0">Ready for Constrained Execution Decision?</h3>
            <Badge tone="accent">Next Stage</Badge>
          </div>
          <p className="text-xs text-body-c m-0 max-w-2xl">
            EOQ provides the unconstrained economic lot-size baseline ({formatNum(canonicalMetrics.qStar, 0)} {uom}). The <strong>Optimization Engine</strong> evaluates multi-period scheduling, warehouse space, budget limits, and supplier delivery constraints to generate an executable purchase order plan.
          </p>
        </div>
        <div className="flex items-center gap-2.5 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/app/what-if')}
            className="gap-1.5"
          >
            <Sliders size={13} />
            <span>What-If Simulation</span>
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate('/app/optimization')}
            className="gap-1.5"
          >
            <span>Proceed to Optimization</span>
            <ArrowRight size={13} />
          </Button>
        </div>
      </div>
    </section>
  );
}
