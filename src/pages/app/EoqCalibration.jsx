import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, Sliders, DollarSign, RefreshCw, BarChart3, Info } from 'lucide-react';
import { ViewHead, KpiTile, WhyDisclosure, Badge, Insight } from '../../components/CommonUI';
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
import { usePlatform } from '../../context/PlatformContext';
import { EOQ_INPUTS, FORECAST_INPUTS } from '../../data/mockData';

const ORDERING_COST = 230.0;
const HOLDING_RATE = 0.06;

const MATERIAL_METADATA = {
  'MAT-1082': {
    supplier: 'HydraTech Dynamics GmbH (Sole Source)',
    leadTimeDays: 60,
    contextTag: 'Class A · High Value · Sole Source Supply',
  },
  'MAT-4120': {
    supplier: 'SiliconFoundry International (Allocated Supply)',
    leadTimeDays: 60,
    contextTag: 'Class A · High Volatility · Allocated Latency',
  },
  'MAT-2041': {
    supplier: 'Apex Energy Storage Ltd (Dual Sourced)',
    leadTimeDays: 30,
    contextTag: 'Class A · High Velocity · Dual Sourced Feed',
  },
  'MAT-5501': {
    supplier: 'BondTech Polymer Solutions (Multi-Vendor)',
    leadTimeDays: 21,
    contextTag: 'Class C · Consumable · Shelf-Life Sensitive',
  },
};

export default function EoqCalibration() {
  const navigate = useNavigate();
  const { persona, selectedMaterial } = usePlatform();
  const shouldReduceMotion = useReducedMotion();

  const materialId = selectedMaterial?.id || 'MAT-1082';
  const materialInputs = EOQ_INPUTS[materialId] || { demand: 4800.0, currentBatchQty: 600.0 };
  const forecastInputs = FORECAST_INPUTS[materialId] || { leadTimeDays: 60, demandCV: 0.12 };
  const meta = MATERIAL_METADATA[materialId] || {
    supplier: 'Standard Supplier',
    leadTimeDays: forecastInputs.leadTimeDays || 30,
    contextTag: `Class ${selectedMaterial?.abcClass || 'A'} Raw Material`,
  };

  // Holding rate slider sensitivity state (default 6.0%)
  const [holdingRatePct, setHoldingRatePct] = useState(HOLDING_RATE * 100);
  const activeHoldingRate = holdingRatePct / 100;

  const demand = materialInputs.demand;
  const currentBatchQty = materialInputs.currentBatchQty;
  const unitCost = selectedMaterial?.unitCost ?? 600.0;
  const onHandQty = selectedMaterial?.qty ?? 930.0;
  const onHandValue = selectedMaterial?.value ?? (onHandQty * unitCost);
  const uom = selectedMaterial?.uom || 'EA';
  const abcClass = selectedMaterial?.abcClass || 'A';
  const plant = selectedMaterial?.plant || 'Plant 1';
  const category = selectedMaterial?.category || 'Components';
  const name = selectedMaterial?.name || 'Raw Material';
  const leadTimeDays = forecastInputs.leadTimeDays || meta.leadTimeDays || 30;
  const annualConsumptionValue = demand * unitCost;

  // Calibrations
  const holdingCostPerUnit = activeHoldingRate * unitCost;
  const qStar = Math.sqrt((2 * demand * ORDERING_COST) / holdingCostPerUnit);

  // Current Policy metrics
  const currentOrderFreq = demand / currentBatchQty;
  const currentOrderCost = currentOrderFreq * ORDERING_COST;
  const currentHoldCost = (currentBatchQty / 2) * holdingCostPerUnit;
  const currentTotalCost = currentOrderCost + currentHoldCost;
  const currentCycleStockQty = currentBatchQty / 2;
  const currentCycleStockValue = currentCycleStockQty * unitCost;
  const currentDaysOfSupply = (currentBatchQty / demand) * 365;
  const currentOrderIntervalDays = 365 / currentOrderFreq;

  // Recommended EOQ Policy metrics
  const recOrderFreq = demand / qStar;
  const recOrderCost = recOrderFreq * ORDERING_COST;
  const recHoldCost = (qStar / 2) * holdingCostPerUnit;
  const recTotalCost = recOrderCost + recHoldCost;
  const recCycleStockQty = qStar / 2;
  const recCycleStockValue = recCycleStockQty * unitCost;
  const recDaysOfSupply = (qStar / demand) * 365;
  const recOrderIntervalDays = 365 / recOrderFreq;

  // Variances & Planning Buffer
  const netAnnualSavings = currentTotalCost - recTotalCost;
  const netSavingsPercent = currentTotalCost > 0 ? (netAnnualSavings / currentTotalCost) * 100 : 0;
  const workingCapitalReleased = (currentCycleStockQty - recCycleStockQty) * unitCost;
  const desiredStockQty = 1.5 * qStar;
  const desiredStockValue = desiredStockQty * unitCost;

  const formatNum = (val, decimals = 2) =>
    val.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  const formatCurrency = (val, decimals = 2) =>
    `$${val.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`;

  return (
    <section className="view max-w-7xl mx-auto">
      <ViewHead
        title="EOQ Calibration"
        subtitle={
          <p className="text-muted leading-relaxed">
            Economic Order Quantity optimization and lot-size recalibration across Class A materials, balancing ordering setup costs against capital carrying costs to minimize total relevant inventory cost.
          </p>
        }
        actions={
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/app/what-if')}
              className="gap-1.5"
            >
              <Sliders size={13} />
              <span>Simulate in What-If</span>
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate('/app/optimization')}
              className="gap-1.5"
            >
              <span>View Optimization Plan</span>
              <ArrowRight size={13} />
            </Button>
          </div>
        }
      />

      {/* Selected SKU Context Header */}
      <div className="card bg-surface border border-line rounded-md p-5 shadow-subtle mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-line">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-base font-bold text-ink m-0">
                {selectedMaterial.id} · {name}
              </h2>
              <Badge tone={abcClass === 'A' ? 'accent' : 'neutral'}>
                {meta.contextTag}
              </Badge>
            </div>
            <p className="text-xs text-muted m-0">
              {plant} · Category: <strong>{category}</strong> · Primary Vendor: <strong>{meta.supplier}</strong> · Lead Time: <strong>{leadTimeDays} days</strong>
            </p>
          </div>
          <Badge tone="accent">
            Class {abcClass} Material
          </Badge>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mb-2">
          <KpiTile
            label="Annual Demand (D)"
            value={`${formatNum(demand, 0)} ${uom}/yr`}
            sub={`${formatCurrency(annualConsumptionValue)} annual consumption value`}
          />
          <KpiTile
            label="Standard Unit Cost"
            value={formatCurrency(unitCost)}
            sub={`Carrying cost: ${formatCurrency(holdingCostPerUnit)}/${uom}/yr (${formatNum(activeHoldingRate * 100)}%)`}
          />
          <KpiTile
            label="Current Order Batch (Q)"
            value={`${formatNum(currentBatchQty, 0)} ${uom}`}
            sub={`${formatNum(currentDaysOfSupply, 1)} days of supply per replenishment`}
          />
          <KpiTile
            label="Calibrated EOQ (Q*)"
            value={`${formatNum(qStar, 0)} ${uom}`}
            sub={`${formatNum(recDaysOfSupply, 1)} days of supply (${formatNum(recOrderFreq, 1)} orders/yr)`}
            valueStyle={{ color: 'var(--accent)' }}
          />
        </div>
      </div>

      {/* Policy Comparison & Sensitivity Slider */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mb-6">
        {/* Current ERP Policy Card */}
        <div className="lg:col-span-4 bg-surface border border-line rounded-md p-5 shadow-subtle flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-line">
              <h3 className="text-sm font-bold text-ink m-0">Current ERP Policy</h3>
              <Badge tone="neutral">Lot: {formatNum(currentBatchQty, 0)} {uom}</Badge>
            </div>
            <div className="rounded-sm border border-line overflow-hidden mb-3">
              <Table>
                <TableBody>
                  <TableRow>
                    <TableCell className="text-xs text-muted">Order Frequency</TableCell>
                    <TableCell className="text-right font-mono font-medium">{formatNum(currentOrderFreq, 1)} orders/yr</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="text-xs text-muted">Days Between Orders</TableCell>
                    <TableCell className="text-right font-mono font-medium">~{formatNum(currentOrderIntervalDays, 0)} days</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="text-xs text-muted">Avg Cycle Stock</TableCell>
                    <TableCell className="text-right font-mono font-medium">{formatNum(currentCycleStockQty, 0)} {uom} ({formatCurrency(currentCycleStockValue)})</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="text-xs text-muted">Annual Ordering Cost</TableCell>
                    <TableCell className="text-right font-mono">{formatCurrency(currentOrderCost)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="text-xs text-muted">Annual Holding Cost</TableCell>
                    <TableCell className="text-right font-mono">{formatCurrency(currentHoldCost)}</TableCell>
                  </TableRow>
                  <TableRow className="bg-bg font-bold">
                    <TableCell className="text-ink">Total Relevant Cost</TableCell>
                    <TableCell className="text-right font-mono text-ink">{formatCurrency(currentTotalCost)}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </div>
          <p className="text-[11px] text-muted-2 m-0">
            Current lot sizing fixed at {formatNum(currentBatchQty, 0)} {uom} results in holding cost asymmetry.
          </p>
        </div>

        {/* Recommended EOQ Policy Card */}
        <div className="lg:col-span-4 bg-surface border-2 border-accent/40 rounded-md p-5 shadow-subtle flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-line">
              <h3 className="text-sm font-bold text-ink m-0">Recommended EOQ Policy</h3>
              <Badge tone="accent">Q*: {formatNum(qStar, 0)} {uom}</Badge>
            </div>
            <div className="rounded-sm border border-line overflow-hidden mb-3">
              <Table>
                <TableBody>
                  <TableRow>
                    <TableCell className="text-xs text-muted">Order Frequency</TableCell>
                    <TableCell className="text-right font-mono font-medium">{formatNum(recOrderFreq, 1)} orders/yr</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="text-xs text-muted">Days Between Orders</TableCell>
                    <TableCell className="text-right font-mono font-medium">~{formatNum(recOrderIntervalDays, 0)} days</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="text-xs text-muted">Avg Cycle Stock</TableCell>
                    <TableCell className="text-right font-mono font-medium">{formatNum(recCycleStockQty, 0)} {uom} ({formatCurrency(recCycleStockValue)})</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="text-xs text-muted">Annual Ordering Cost</TableCell>
                    <TableCell className="text-right font-mono">{formatCurrency(recOrderCost)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="text-xs text-muted">Annual Holding Cost</TableCell>
                    <TableCell className="text-right font-mono text-success">{formatCurrency(recHoldCost)}</TableCell>
                  </TableRow>
                  <TableRow className="bg-success-bg/30 font-bold">
                    <TableCell className="text-ink">Total Relevant Cost</TableCell>
                    <TableCell className="text-right font-mono text-success">{formatCurrency(recTotalCost)}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </div>
          <p className="text-[11px] text-muted-2 m-0">
            Exact equilibrium where ordering cost ({formatCurrency(recOrderCost)}) equals holding cost ({formatCurrency(recHoldCost)}).
          </p>
        </div>

        {/* Working Capital Delta & Sensitivity Slider */}
        <div className="lg:col-span-4 bg-gradient-to-b from-surface to-bg/50 border border-line rounded-md p-5 shadow-subtle flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-line">
              <h3 className="text-sm font-bold text-ink m-0">Policy Variance &amp; Release</h3>
              <Badge tone="success">Optimal</Badge>
            </div>

            <div className="space-y-3 mb-4">
              <div className="p-3 rounded bg-success-bg border border-[#C6EFDE]">
                <div className="text-[11px] font-bold text-success uppercase tracking-wider mb-0.5">
                  Working Capital Released
                </div>
                <div className="text-2xl font-bold font-mono text-ink">
                  {formatCurrency(workingCapitalReleased)}
                </div>
                <div className="text-xs text-muted mt-0.5">
                  Freed from cycle inventory buffer
                </div>
              </div>

              <div className="p-3 rounded bg-surface border border-line">
                <div className="text-[11px] font-bold text-muted uppercase tracking-wider mb-0.5">
                  Net Annual Policy Savings
                </div>
                <div className="text-xl font-bold font-mono text-success">
                  {formatCurrency(netAnnualSavings)}/yr
                </div>
                <div className="text-xs text-muted mt-0.5">
                  {formatNum(netSavingsPercent, 1)}% reduction in relevant cost
                </div>
              </div>
            </div>

            {/* Interactive Holding Rate Slider */}
            <div className="pt-3 border-t border-line">
              <div className="flex justify-between items-center text-xs font-semibold mb-2">
                <span className="text-muted">Holding Cost Rate Sensitivity:</span>
                <span className="font-mono text-accent font-bold">{formatNum(holdingRatePct, 1)}%/yr</span>
              </div>
              <Slider
                value={[holdingRatePct]}
                min={3.0}
                max={18.0}
                step={0.5}
                onValueChange={(val) => setHoldingRatePct(val[0])}
                className="my-2"
              />
              <div className="flex justify-between text-[10px] text-muted-2 font-mono">
                <span>3.0%</span>
                <span>Baseline (6.0%)</span>
                <span>18.0%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* EOQ Parabola Chart */}
      <div className="card bg-surface border border-line rounded-md p-5 shadow-subtle mb-6">
        <div className="card__head flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-4">
          <div>
            <h2 className="card__title text-sm font-bold text-ink">EOQ Total Cost Parabola &amp; Cost Equilibrium Curve</h2>
            <p className="card__sub text-xs text-muted">
              Fixed ordering cost decays hyperbolically (S·D/Q), holding cost rises linearly (H·Q/2) — EOQ (Q*) sits at the exact convex minimum.
            </p>
          </div>
          <Badge tone="accent" className="self-start sm:self-auto">
            Q* = {formatNum(qStar, 0)} {uom} · Min Cost {formatCurrency(recTotalCost)}/yr
          </Badge>
        </div>

        <div className="chart-shell mb-3">
          <EoqCurveChart
            demand={demand}
            orderingCost={ORDERING_COST}
            holdingCostPerUnit={holdingCostPerUnit}
            uom={uom}
          />
        </div>

        <p className="text-[11px] text-muted-2 m-0 font-mono">
          Canonical Formula: Q* = √(2·D·S / H) = √((2 × {formatNum(demand)} × ${ORDERING_COST.toFixed(2)}) / ${formatNum(holdingCostPerUnit, 4)}) = {formatNum(qStar, 0)} {uom}.
        </p>
      </div>

      {/* Operational Constraints */}
      <div className="card bg-surface border border-line rounded-md p-5 shadow-subtle mb-6">
        <h2 className="card__title text-sm font-bold text-ink mb-1">Operational Constraints &amp; Procurement Execution Context</h2>
        <p className="card__sub text-xs text-muted mb-4">
          The modeled EOQ economics should be evaluated alongside service-level, safety-stock, lead-time, supplier, MOQ, and packaging constraints before implementation.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="p-3.5 bg-bg rounded-sm border border-line">
            <h3 className="text-xs font-bold text-ink mb-1">1. Minimum Order Quantity &amp; Pack Sizes</h3>
            <p className="text-xs text-muted m-0 leading-relaxed">
              EOQ ({formatNum(qStar, 0)} {uom}) establishes the unconstrained economic lot size. In procurement execution, Q* may be rounded to master carton increments without significantly degrading cost efficiency.
            </p>
          </div>

          <div className="p-3.5 bg-bg rounded-sm border border-line">
            <h3 className="text-xs font-bold text-ink mb-1">2. Supplier Lead Time &amp; EDI Throughput</h3>
            <p className="text-xs text-muted m-0 leading-relaxed">
              Ordering frequency increases from {formatNum(currentOrderFreq, 1)} to {formatNum(recOrderFreq, 1)} orders/yr (every ~{formatNum(recOrderIntervalDays, 0)} days). EDI automation supports higher replenishment cadence with low administrative overhead.
            </p>
          </div>

          <div className="p-3.5 bg-bg rounded-sm border border-line">
            <h3 className="text-xs font-bold text-ink mb-1">3. Planning Buffer Assumption (1.5 × Q*)</h3>
            <p className="text-xs text-muted m-0 leading-relaxed">
              Desired Stock Level of <strong>{formatNum(desiredStockQty, 0)} {uom}</strong> ({formatCurrency(desiredStockValue)}) represents a planning buffer assumption (1.5 × Q*), distinct from statistically derived safety stock.
            </p>
          </div>
        </div>
      </div>

      {/* Persona Lens */}
      <motion.div
        key={persona}
        initial={shouldReduceMotion ? false : { opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="mb-6"
      >
        {persona === 'ds' && (
          <Insight label="Data Scientist Lens · Mathematical Formulation & Sensitivity Intelligence">
            The calibrated lot size <span className="font-mono font-bold text-ink">{formatNum(qStar, 0)} {uom}</span> minimizes the convex total-cost objective function <span className="font-mono font-bold text-ink">TC(Q) = (D/Q)·S + (Q/2)·H</span>, achieving exact first-order optimality where <span className="font-mono font-bold text-ink">∂TC/∂Q = -DS/Q² + H/2 = 0</span>. Parameter sensitivity demonstrates square-root elasticity: <span className="font-mono font-bold text-ink">∂ ln Q* / ∂ ln D = 0.50</span>.
          </Insight>
        )}
        {persona === 'analyst' && (
          <Insight label="Supply Chain Analyst Lens · Lot-Sizing Governance & Replenishment Execution">
            Current ERP lot sizing of <span className="font-mono font-bold text-ink">{formatNum(currentBatchQty, 0)} {uom}</span> incurs <span className="font-mono font-bold text-ink">{formatCurrency(currentHoldCost)}/yr</span> in annual holding costs. Calibrating lot sizing to <span className="font-mono font-bold text-ink">{formatNum(qStar, 0)} {uom}</span> rightsizes replenishment to <span className="font-mono font-bold text-ink">{formatNum(recDaysOfSupply, 1)} days</span> of supply, capturing <span className="font-mono font-bold text-success">{formatCurrency(netAnnualSavings)}/yr</span> in net savings.
          </Insight>
        )}
        {persona === 'exec' && (
          <Insight label="C-Suite Executive Lens · Working Capital Velocity & Risk-Balanced Governance">
            For <span className="font-mono font-bold text-ink">{selectedMaterial.id}</span>, this modeled EOQ policy reduces relevant annual ordering and carrying cost by <span className="font-mono font-bold text-success">{formatCurrency(netAnnualSavings)}/yr</span> ({formatNum(netSavingsPercent, 1)}% policy cost reduction) and releases an estimated <span className="font-mono font-bold text-success">{formatCurrency(workingCapitalReleased)}</span> in average cycle-stock capital.
          </Insight>
        )}
      </motion.div>

      {/* Driver Breakdown Accordion */}
      <div className="card bg-surface border border-line rounded-md p-5 shadow-subtle mb-6">
        <h2 className="card__title text-sm font-bold text-ink mb-1">
          Why EOQ Shifted from {formatNum(currentBatchQty, 0)} to {formatNum(qStar, 0)} {uom} for {selectedMaterial.id}
        </h2>
        <WhyDisclosure
          defaultOpen
          summary="Driver Breakdown & Analytical Trade-Off Rationalization"
          drivers={[
            `Physical annual demand of ${formatNum(demand)} ${uom}/yr (${formatCurrency(annualConsumptionValue)} annual consumption value at unit cost of ${formatCurrency(unitCost)}) for ${selectedMaterial.id}.`,
            `Fixed ordering cost of ${formatCurrency(ORDERING_COST)}/order supported by EDI-automated transaction processing.`,
            `Holding cost rate of ${formatNum(activeHoldingRate * 100)}%/yr, generating annual carrying cost H = ${formatCurrency(holdingCostPerUnit)}/${uom}/yr.`,
            `Current ERP batch policy of ${formatNum(currentBatchQty)} ${uom} created severe cost asymmetry (${formatCurrency(currentHoldCost)}/yr holding cost vs ${formatCurrency(currentOrderCost)}/yr ordering cost).`,
          ]}
          meaning={[
            `Replenishment cadence shifts from ${formatNum(currentOrderFreq, 1)} to ${formatNum(recOrderFreq, 1)} orders/yr (ordering every ~${formatNum(recOrderIntervalDays, 0)} days instead of ~${formatNum(currentOrderIntervalDays, 0)} days).`,
            `Average cycle stock drops from ${formatNum(currentCycleStockQty, 0)} ${uom} (${formatCurrency(currentCycleStockValue)}) to ${formatNum(recCycleStockQty, 0)} ${uom} (${formatCurrency(recCycleStockValue)}), unlocking an estimated ${formatCurrency(workingCapitalReleased)} working-capital opportunity.`,
            `Total relevant annual policy cost is minimized from ${formatCurrency(currentTotalCost)} to ${formatCurrency(recTotalCost)}/yr, capturing ${formatCurrency(netAnnualSavings)}/yr (${formatNum(netSavingsPercent, 1)}%) in net savings.`,
          ]}
          action={[
            `Update ERP Material Master replenishment lot sizing for ${selectedMaterial.id} to ${formatNum(qStar, 0)} ${uom}, reconciling with supplier packaging increments and lead-time constraints.`,
            `Verify supplier ${meta.supplier} and EDI throughput can support the calibrated order cadence of ${formatNum(recOrderFreq, 1)} orders/yr.`,
            `Transition to RMLC Lifecycle to inspect material shelf-life staging and prevent inventory accumulation.`,
          ]}
        />
      </div>
    </section>
  );
}
