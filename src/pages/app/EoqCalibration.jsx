import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, Sliders, DollarSign, RefreshCw, BarChart3, Info } from 'lucide-react';
import { ViewHead, KpiTile, WhyDisclosure, Badge } from '../../components/CommonUI';
import PersonaTop from '../../components/PersonaTop';
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
  const shouldReduceMotion = useReducedMotion();
  const { persona, selectedMaterial } = usePlatform();

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


  const weeklyDemand = demand / 52;
  const intervalVsLt = (days) => `${formatNum(days / leadTimeDays, 2)}× lead time`;
  // One catalog of comparison rows; each persona picks and orders the ones that matter to its decision.
  const POLICY_ROWS = {
    freq: { label: 'Order Frequency', cur: `${formatNum(currentOrderFreq, 1)} orders/yr`, rec: `${formatNum(recOrderFreq, 1)} orders/yr` },
    receipts: { label: 'Receipts per Year', cur: `${formatNum(currentOrderFreq, 1)}`, rec: `${formatNum(recOrderFreq, 1)}` },
    interval: { label: 'Days Between Orders', cur: `~${formatNum(currentOrderIntervalDays, 0)} days`, rec: `~${formatNum(recOrderIntervalDays, 0)} days` },
    vsLeadTime: { label: 'Interval vs Lead Time', cur: intervalVsLt(currentOrderIntervalDays), rec: intervalVsLt(recOrderIntervalDays) },
    supplyDays: { label: 'Days of Supply per Batch', cur: `${formatNum(currentDaysOfSupply, 1)} days`, rec: `${formatNum(recDaysOfSupply, 1)} days` },
    weeksOfDemand: { label: 'Weeks of Demand per Batch', cur: `${formatNum(currentBatchQty / weeklyDemand, 1)} wks`, rec: `${formatNum(qStar / weeklyDemand, 1)} wks` },
    cycleStock: { label: 'Avg Cycle Stock', cur: `${formatNum(currentCycleStockQty, 0)} ${uom}`, rec: `${formatNum(recCycleStockQty, 0)} ${uom}` },
    cycleValue: { label: 'Cycle Stock Value', cur: formatCurrency(currentCycleStockValue), rec: formatCurrency(recCycleStockValue) },
    spendPerOrder: { label: 'Spend per Order', cur: formatCurrency(currentBatchQty * unitCost), rec: formatCurrency(qStar * unitCost) },
    buffer: { label: 'Planning Buffer', cur: '—', rec: `${formatNum(desiredStockQty, 0)} ${uom} (1.5 × Q*)` },
    orderCost: { label: 'Annual Ordering Cost', cur: formatCurrency(currentOrderCost), rec: formatCurrency(recOrderCost) },
    holdCost: { label: 'Annual Holding Cost', cur: formatCurrency(currentHoldCost), rec: formatCurrency(recHoldCost) },
    totalCost: { label: 'Total Relevant Cost', cur: formatCurrency(currentTotalCost), rec: formatCurrency(recTotalCost) },
  };
  const coversLt = recDaysOfSupply >= leadTimeDays;
  const sign = (v, d = 1) => `${v >= 0 ? '+' : ''}${formatNum(v, d)}`;
  const personaPolicy = {
    supervisor: {
      rows: ['supplyDays', 'interval', 'vsLeadTime', 'buffer'], emphasis: 'supplyDays',
      curBadge: `Lot: ${formatNum(currentBatchQty, 0)} ${uom}`, recBadge: `Q*: ${formatNum(qStar, 0)} ${uom}`,
      curNote: `Each ${formatNum(currentBatchQty, 0)} ${uom} receipt covers ${formatNum(currentDaysOfSupply, 1)} days of line consumption.`,
      recNote: `Each Q* receipt covers ${formatNum(recDaysOfSupply, 1)} days; the lead time from ${meta.supplier} is ${leadTimeDays} days.`,
      variance: {
        badge: coversLt ? 'Covers lead time' : 'Below lead time', badgeTone: coversLt ? 'success' : 'risk',
        primary: { label: 'Supply per Batch at Q*', value: `${formatNum(recDaysOfSupply, 1)} days`, sub: `Lead time ${leadTimeDays} days · was ${formatNum(currentDaysOfSupply, 1)} days` },
        secondary: { label: 'Planning Buffer (1.5 × Q*)', value: `${formatNum(desiredStockQty, 0)} ${uom}`, sub: 'Cover target, distinct from safety stock' },
      },
    },
    warehouse: {
      rows: ['receipts', 'cycleStock', 'cycleValue', 'weeksOfDemand'], emphasis: 'cycleStock',
      curBadge: `Lot: ${formatNum(currentBatchQty, 0)} ${uom}`, recBadge: `Q*: ${formatNum(qStar, 0)} ${uom}`,
      curNote: `On average ${formatNum(currentCycleStockQty, 0)} ${uom} of cycle stock sits in storage between receipts.`,
      recNote: `Smaller loads: ${formatNum(recCycleStockQty, 0)} ${uom} on average, but ${formatNum(recOrderFreq, 1)} receipts a year to book in.`,
      variance: {
        badge: 'Space freed', badgeTone: 'success',
        primary: { label: 'Cycle Stock Freed', value: `${formatNum(currentCycleStockQty - recCycleStockQty, 0)} ${uom}`, sub: `${formatNum(currentCycleStockQty > 0 ? ((currentCycleStockQty - recCycleStockQty) / currentCycleStockQty) * 100 : 0, 1)}% less to store` },
        secondary: { label: 'Extra Receipts per Year', value: sign(recOrderFreq - currentOrderFreq), sub: `${formatNum(currentOrderFreq, 1)} → ${formatNum(recOrderFreq, 1)} dock bookings` },
      },
    },
    planner: {
      rows: ['freq', 'interval', 'weeksOfDemand', 'vsLeadTime'], emphasis: 'interval',
      curBadge: `Every ~${formatNum(currentOrderIntervalDays, 0)} days`, recBadge: `Every ~${formatNum(recOrderIntervalDays, 0)} days`,
      curNote: `Today's lot of ${formatNum(currentBatchQty, 0)} ${uom} spans ${formatNum(currentBatchQty / weeklyDemand, 1)} weeks of demand.`,
      recNote: `Q* spans ${formatNum(qStar / weeklyDemand, 1)} weeks of demand; check it against the production plan's build schedule.`,
      variance: {
        badge: 'Cadence change', badgeTone: 'accent',
        primary: { label: 'New Order Interval', value: `~${formatNum(recOrderIntervalDays, 0)} days`, sub: `Was ~${formatNum(currentOrderIntervalDays, 0)} days (${sign(recOrderIntervalDays - currentOrderIntervalDays, 0)} days)` },
        secondary: { label: 'Demand Covered per Q*', value: `${formatNum(qStar / weeklyDemand, 1)} wks`, sub: `${formatNum(weeklyDemand, 1)} ${uom}/wk average demand` },
      },
    },
    procurement: {
      rows: ['freq', 'spendPerOrder', 'orderCost', 'holdCost'], emphasis: 'freq',
      curBadge: `${formatCurrency(currentBatchQty * unitCost, 0)}/order`, recBadge: `${formatCurrency(qStar * unitCost, 0)}/order`,
      curNote: `ERP lot of ${formatNum(currentBatchQty, 0)} ${uom} costs ${formatCurrency(currentHoldCost)}/yr in holding alone.`,
      recNote: `Confirm ${formatNum(qStar, 0)} ${uom} against ${meta.supplier}'s MOQ and packaging increments before updating the material master.`,
      variance: {
        badge: 'Check MOQ', badgeTone: 'watch',
        primary: { label: 'Extra POs per Year', value: sign(recOrderFreq - currentOrderFreq), sub: `Ordering cost ${sign(recOrderCost - currentOrderCost, 2)} per year` },
        secondary: { label: 'Net Annual Policy Savings', value: `${formatCurrency(netAnnualSavings)}/yr`, sub: `${formatNum(netSavingsPercent, 1)}% reduction in relevant cost` },
      },
    },
    finance: {
      rows: ['orderCost', 'holdCost', 'cycleValue', 'totalCost'], emphasis: 'totalCost',
      curBadge: `Lot: ${formatNum(currentBatchQty, 0)} ${uom}`, recBadge: `Q*: ${formatNum(qStar, 0)} ${uom}`,
      curNote: `Current lot sizing fixed at ${formatNum(currentBatchQty, 0)} ${uom} results in holding cost asymmetry.`,
      recNote: `Exact equilibrium where ordering cost (${formatCurrency(recOrderCost)}) equals holding cost (${formatCurrency(recHoldCost)}).`,
      variance: {
        badge: 'Optimal', badgeTone: 'success',
        primary: { label: 'Working Capital Released', value: formatCurrency(workingCapitalReleased), sub: 'Freed from cycle inventory buffer', green: true },
        secondary: { label: 'Net Annual Policy Savings', value: `${formatCurrency(netAnnualSavings)}/yr`, sub: `${formatNum(netSavingsPercent, 1)}% reduction in relevant cost` },
      },
    },
  };
  const policy = personaPolicy[persona] || personaPolicy.supervisor;
  const renderPolicyRows = (side) =>
    policy.rows.map((id) => {
      const row = POLICY_ROWS[id];
      const strong = id === policy.emphasis;
      return (
        <TableRow key={id} className={strong ? (side === 'rec' ? 'bg-success-bg/30 font-bold' : 'bg-bg font-bold') : undefined}>
          <TableCell className={`text-xs ${strong ? 'text-ink' : 'text-body-c'}`}>{row.label}</TableCell>
          <TableCell className={`text-right font-mono ${strong ? (side === 'rec' ? 'text-success' : 'text-ink') : 'font-medium'}`}>{row[side]}</TableCell>
        </TableRow>
      );
    });

  const M = ({ children }) => <span className="font-mono font-bold text-ink">{children}</span>;
  const onHandDays = (onHandQty / demand) * 365;
  const personaTop = {
    supervisor: {
      label: 'Plant Supervisor Lens · Cover After Right-Sizing the Batch',
      headline: (
        <>Moving {selectedMaterial.id}'s lot from <M>{formatNum(currentBatchQty, 0)} {uom}</M> to <M>{formatNum(qStar, 0)} {uom}</M> still leaves <M>{formatNum(recDaysOfSupply, 1)} days</M> of supply per batch against the <M>{leadTimeDays}-day</M> lead time from {meta.supplier} — smaller, more frequent batches don't put the line at more risk.</>
      ),
      kpis: [
        { label: 'Supply per batch after Q*', value: `${formatNum(recDaysOfSupply, 1)} days`, sub: `Was ${formatNum(currentDaysOfSupply, 1)} days per batch` },
        { label: 'Supplier lead time', value: `${leadTimeDays} days`, sub: meta.supplier },
        { label: 'Stock on hand', value: `${formatNum(onHandDays, 1)} days`, delta: onHandDays < leadTimeDays ? `${formatNum(leadTimeDays - onHandDays, 1)}d below lead time` : `+${formatNum(onHandDays - leadTimeDays, 1)}d beyond lead time`, deltaTone: onHandDays < leadTimeDays ? 'down' : 'up', sub: `${formatNum(onHandQty, 0)} ${uom} physical` },
        { label: 'Planning buffer (1.5 × Q*)', value: `${formatNum(desiredStockQty, 0)} ${uom}`, sub: 'Cover target, not statistical safety stock' },
      ],
    },
    warehouse: {
      label: 'Warehouse Manager Lens · Less Cycle Stock to Store',
      headline: (
        <>Average cycle stock drops from <M>{formatNum(currentCycleStockQty, 0)} {uom}</M> to <M>{formatNum(recCycleStockQty, 0)} {uom}</M> once EOQ is applied, freeing shelf and staging space. Batches arrive more often (<M>{formatNum(recOrderFreq, 1)}/yr</M> vs {formatNum(currentOrderFreq, 1)} today) but are smaller each time.</>
      ),
      kpis: [
        { label: 'Avg cycle stock now', value: `${formatNum(currentCycleStockQty, 0)} ${uom}`, sub: `${formatCurrency(currentCycleStockValue)} held` },
        { label: 'Avg cycle stock at Q*', value: `${formatNum(recCycleStockQty, 0)} ${uom}`, valueStyle: { color: 'var(--primary)' }, sub: `${formatCurrency(recCycleStockValue)} held` },
        { label: 'Space freed', value: `${formatNum(currentCycleStockQty - recCycleStockQty, 0)} ${uom}`, delta: `${formatNum(((currentCycleStockQty - recCycleStockQty) / currentCycleStockQty) * 100, 1)}% less to store`, deltaTone: 'up', sub: 'Average shelf and staging footprint' },
        { label: 'Receipts per year', value: `${formatNum(recOrderFreq, 1)}`, delta: `vs ${formatNum(currentOrderFreq, 1)} today`, deltaTone: 'flat', sub: 'More dock appointments, smaller loads' },
      ],
    },
    planner: {
      label: 'Materials Planner Lens · Matching Order Cadence to the Plan',
      headline: (
        <>{selectedMaterial.id} would move from ordering every ~<M>{formatNum(currentOrderIntervalDays, 0)} days</M> to every ~<M>{formatNum(recOrderIntervalDays, 0)} days</M>. Check that cadence still lines up with the production plan's build schedule before it goes into the ERP lot-size field.</>
      ),
      kpis: [
        { label: 'Order interval now', value: `${formatNum(currentOrderIntervalDays, 0)} days`, sub: `${formatNum(currentOrderFreq, 1)} orders/yr at ${formatNum(currentBatchQty, 0)} ${uom}` },
        { label: 'Order interval at Q*', value: `${formatNum(recOrderIntervalDays, 0)} days`, valueStyle: { color: 'var(--primary)' }, sub: `${formatNum(recOrderFreq, 1)} orders/yr at ${formatNum(qStar, 0)} ${uom}` },
        { label: 'Interval vs lead time', value: `${formatNum(recOrderIntervalDays / leadTimeDays, 2)}×`, sub: `${leadTimeDays}-day lead time: ${recOrderIntervalDays < leadTimeDays ? 'orders overlap in transit' : 'one order in transit at a time'}` },
        { label: 'Weekly demand', value: `${formatNum(demand / 52, 1)} ${uom}/wk`, sub: `${formatNum(qStar / (demand / 52), 1)} weeks of demand per Q*` },
      ],
    },
    procurement: {
      label: 'Procurement Officer Lens · Lot-Sizing Governance & Replenishment Execution',
      headline: (
        <>The current ERP lot of <M>{formatNum(currentBatchQty, 0)} {uom}</M> costs <M>{formatCurrency(currentHoldCost)}/yr</M> in holding alone. Recalibrating to <M>{formatNum(qStar, 0)} {uom}</M> lifts order frequency to <M>{formatNum(recOrderFreq, 1)}/yr</M> with {meta.supplier} — confirm the new size against their MOQ and packaging increments before updating the material master.</>
      ),
      kpis: [
        { label: 'POs per year', value: `${formatNum(recOrderFreq, 1)}`, delta: `${recOrderFreq >= currentOrderFreq ? '+' : ''}${formatNum(recOrderFreq - currentOrderFreq, 1)} vs today`, deltaTone: 'flat', sub: `${formatCurrency(recOrderCost)}/yr ordering cost` },
        { label: 'Spend per order', value: formatCurrency(qStar * unitCost, 0), sub: `${formatNum(qStar, 0)} ${uom} at ${formatCurrency(unitCost)}/${uom}` },
        { label: 'Holding cost now', value: `${formatCurrency(currentHoldCost, 0)}/yr`, sub: `Falls to ${formatCurrency(recHoldCost, 0)}/yr at Q*` },
        { label: 'Supplier', value: `${leadTimeDays}-day LT`, sub: meta.supplier },
      ],
    },
    finance: {
      label: 'Finance Controller Lens · Working Capital Velocity & Risk-Balanced Governance',
      headline: (
        <>For <M>{selectedMaterial.id}</M>, this EOQ policy reduces relevant annual ordering and carrying cost by <span className="font-mono font-bold text-success">{formatCurrency(netAnnualSavings)}/yr</span> ({formatNum(netSavingsPercent, 1)}%) and releases an estimated <span className="font-mono font-bold text-success">{formatCurrency(workingCapitalReleased)}</span> of average cycle-stock capital.</>
      ),
      kpis: [
        { label: 'Annual policy cost now', value: formatCurrency(currentTotalCost, 0), sub: `${formatCurrency(currentOrderCost, 0)} ordering + ${formatCurrency(currentHoldCost, 0)} holding` },
        { label: 'Annual policy cost at Q*', value: formatCurrency(recTotalCost, 0), valueStyle: { color: 'var(--primary)' }, sub: `${formatCurrency(recOrderCost, 0)} ordering + ${formatCurrency(recHoldCost, 0)} holding` },
        { label: 'Net annual saving', value: formatCurrency(netAnnualSavings, 0), valueStyle: { color: 'var(--success)' }, delta: `${formatNum(netSavingsPercent, 1)}% cost reduction`, deltaTone: 'up', sub: 'Ordering plus carrying cost' },
        { label: 'Working capital released', value: formatCurrency(workingCapitalReleased, 0), valueStyle: { color: 'var(--success)' }, sub: `Carrying cost at ${formatNum(activeHoldingRate * 100)}%/yr` },
      ],
    },
  };

  return (
    <section className="view max-w-7xl mx-auto">
      <ViewHead
        title="EOQ Analysis"
        subtitle={
          <p className="text-body-c leading-relaxed">
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

      <PersonaTop persona={persona} config={personaTop} />

      {/* Selected SKU Context Header */}
      <div className="card bg-surface border border-border rounded-md p-5 shadow-subtle mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-border">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-base font-bold text-ink m-0">
                {selectedMaterial.id} · {name}
              </h2>
              <Badge tone={abcClass === 'A' ? 'accent' : 'neutral'}>
                {meta.contextTag}
              </Badge>
            </div>
            <p className="text-xs text-body-c m-0">
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
            valueStyle={{ color: 'var(--primary)' }}
          />
        </div>
      </div>

      {/* Policy Comparison & Sensitivity Slider */}
      <motion.div
        key={persona}
        initial={shouldReduceMotion ? false : { opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.18 }}
        className="grid grid-cols-1 lg:grid-cols-12 gap-5 mb-6"
      >
        {/* Current ERP Policy Card */}
        <div className="lg:col-span-4 bg-surface border border-border rounded-md p-5 shadow-subtle flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-border">
              <h3 className="text-sm font-bold text-ink m-0">Current ERP Policy</h3>
              <Badge tone="neutral">{policy.curBadge}</Badge>
            </div>
            <div className="rounded-sm border border-border overflow-hidden mb-3">
              <Table>
                <TableBody>{renderPolicyRows('cur')}</TableBody>
              </Table>
            </div>
          </div>
          <p className="text-xs text-subtle m-0">
            {policy.curNote}
          </p>
        </div>

        {/* Recommended EOQ Policy Card */}
        <div className="lg:col-span-4 bg-surface border-2 border-primary/40 rounded-md p-5 shadow-subtle flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-border">
              <h3 className="text-sm font-bold text-ink m-0">Recommended EOQ Policy</h3>
              <Badge tone="accent">{policy.recBadge}</Badge>
            </div>
            <div className="rounded-sm border border-border overflow-hidden mb-3">
              <Table>
                <TableBody>{renderPolicyRows('rec')}</TableBody>
              </Table>
            </div>
          </div>
          <p className="text-xs text-subtle m-0">
            {policy.recNote}
          </p>
        </div>

        {/* Working Capital Delta & Sensitivity Slider */}
        <div className="lg:col-span-4 bg-gradient-to-b from-surface to-bg/50 border border-border rounded-md p-5 shadow-subtle flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-border">
              <h3 className="text-sm font-bold text-ink m-0">Policy Variance &amp; Release</h3>
              <Badge tone={policy.variance.badgeTone}>{policy.variance.badge}</Badge>
            </div>

            <div className="space-y-3 mb-4">
              <div className={`p-3 rounded border ${policy.variance.badgeTone === 'risk' ? 'bg-error-bg border-error' : 'bg-success-bg border-success'}`}>
                <div className={`text-xs font-bold uppercase tracking-wider mb-0.5 ${policy.variance.badgeTone === 'risk' ? 'text-error' : 'text-success'}`}>
                  {policy.variance.primary.label}
                </div>
                <div className="text-2xl font-bold font-mono text-ink">
                  {policy.variance.primary.value}
                </div>
                <div className="text-xs text-body-c mt-0.5">
                  {policy.variance.primary.sub}
                </div>
              </div>

              <div className="p-3 rounded bg-surface border border-border">
                <div className="text-xs font-bold text-body-c uppercase tracking-wider mb-0.5">
                  {policy.variance.secondary.label}
                </div>
                <div className="text-xl font-bold font-mono text-success">
                  {policy.variance.secondary.value}
                </div>
                <div className="text-xs text-body-c mt-0.5">
                  {policy.variance.secondary.sub}
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
      </motion.div>

      {/* EOQ over time: what changed, and why */}
      <EoqTimeSeries
        demand={demand}
        orderingCost={ORDERING_COST}
        holdingCostPerUnit={unitCost * HOLDING_RATE}
        uom={uom}
        material={`${selectedMaterial.id} · ${selectedMaterial.name}`}
      />

      {/* EOQ Parabola Chart */}
      <div className="card bg-surface border border-border rounded-md p-5 shadow-subtle mb-6">
        <div className="card__head flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-4">
          <div>
            <h2 className="card__title text-sm font-bold text-ink">EOQ Total Cost Parabola &amp; Cost Equilibrium Curve</h2>
            <p className="card__sub text-xs text-body-c">
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

        <p className="text-xs text-subtle m-0 font-mono">
          Canonical Formula: Q* = √(2·D·S / H) = √((2 × {formatNum(demand)} × ${ORDERING_COST.toFixed(2)}) / ${formatNum(holdingCostPerUnit, 4)}) = {formatNum(qStar, 0)} {uom}.
        </p>
      </div>

      {/* Operational Constraints */}
      <div className="card bg-surface border border-border rounded-md p-5 shadow-subtle mb-6">
        <h2 className="card__title text-sm font-bold text-ink mb-1">Operational Constraints &amp; Procurement Execution Context</h2>
        <p className="card__sub text-xs text-body-c mb-4">
          The modeled EOQ economics should be evaluated alongside service-level, safety-stock, lead-time, supplier, MOQ, and packaging constraints before implementation.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="p-3.5 bg-bg rounded-sm border border-border">
            <h3 className="text-xs font-bold text-ink mb-1">1. Minimum Order Quantity &amp; Pack Sizes</h3>
            <p className="text-xs text-body-c m-0 leading-relaxed">
              EOQ ({formatNum(qStar, 0)} {uom}) establishes the unconstrained economic lot size. In procurement execution, Q* may be rounded to master carton increments without significantly degrading cost efficiency.
            </p>
          </div>

          <div className="p-3.5 bg-bg rounded-sm border border-border">
            <h3 className="text-xs font-bold text-ink mb-1">2. Supplier Lead Time &amp; EDI Throughput</h3>
            <p className="text-xs text-body-c m-0 leading-relaxed">
              Ordering frequency increases from {formatNum(currentOrderFreq, 1)} to {formatNum(recOrderFreq, 1)} orders/yr (every ~{formatNum(recOrderIntervalDays, 0)} days). EDI automation supports higher replenishment cadence with low administrative overhead.
            </p>
          </div>

          <div className="p-3.5 bg-bg rounded-sm border border-border">
            <h3 className="text-xs font-bold text-ink mb-1">3. Planning Buffer Assumption (1.5 × Q*)</h3>
            <p className="text-xs text-body-c m-0 leading-relaxed">
              Desired Stock Level of <strong>{formatNum(desiredStockQty, 0)} {uom}</strong> ({formatCurrency(desiredStockValue)}) represents a planning buffer assumption (1.5 × Q*), distinct from statistically derived safety stock.
            </p>
          </div>
        </div>
      </div>

      {/* Driver Breakdown Accordion */}
      <div className="card bg-surface border border-border rounded-md p-5 shadow-subtle mb-6">
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
