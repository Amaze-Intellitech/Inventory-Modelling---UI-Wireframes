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
    moq: 200, openPoQty: 600, openPoDueDays: 45, reservedPct: 0.08,
  },
  'MAT-4120': {
    supplier: 'SiliconFoundry International (Allocated Supply)',
    leadTimeDays: 60,
    contextTag: 'Class A · High Volatility · Allocated Latency',
    moq: 1000, openPoQty: 3000, openPoDueDays: 52, reservedPct: 0.08,
  },
  'MAT-2041': {
    supplier: 'Apex Energy Storage Ltd (Dual Sourced)',
    leadTimeDays: 30,
    contextTag: 'Class A · High Velocity · Dual Sourced Feed',
    moq: 20000, openPoQty: 60000, openPoDueDays: 12, reservedPct: 0.05,
  },
  'MAT-5501': {
    supplier: 'BondTech Polymer Solutions (Multi-Vendor)',
    leadTimeDays: 21,
    contextTag: 'Class C · Consumable · Shelf-Life Sensitive',
    moq: 500, openPoQty: 0, openPoDueDays: null, reservedPct: 0.1,
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
    planner: {
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
    inventory: {
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
    head: {
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
  const policy = personaPolicy[persona] || personaPolicy.planner;
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
  // Replenishment policy (the decision); EOQ is only the lot-size benchmark inside it.
  const serviceLevel = abcClass === 'A' ? 0.98 : 0.95;
  const z = abcClass === 'A' ? 2.05 : 1.65;
  const dailyDemand = demand / 365;
  const demandCV = forecastInputs.demandCV ?? 0.2;
  const safetyStock = z * dailyDemand * demandCV * Math.sqrt(leadTimeDays);
  const reorderPoint = dailyDemand * leadTimeDays + safetyStock;
  const moq = meta.moq ?? 0;
  const orderQty = Math.max(moq, moq ? Math.ceil(qStar / moq) * moq : qStar);
  const openPoQty = meta.openPoQty ?? 0;
  const openPoDueDays = meta.openPoDueDays;
  const netAvailable = onHandQty * (1 - (meta.reservedPct ?? 0)); // net of reservations
  const daysToStockout = netAvailable / dailyDemand;
  const shortageBeforeReceipt = openPoDueDays == null ? 0 : Math.max(0, dailyDemand * openPoDueDays - netAvailable);
  const releaseInDays = Math.max(0, (netAvailable + openPoQty - reorderPoint) / dailyDemand);
  const releaseOverdue = netAvailable + openPoQty < reorderPoint;
  const receiptInDays = releaseInDays + leadTimeDays;
  const dateIn = (days) => new Date(Date.now() + days * 86400000).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
  const stockoutTile = {
    label: 'Projected stockout',
    value: shortageBeforeReceipt > 0 ? dateIn(daysToStockout) : 'None before receipt',
    delta: shortageBeforeReceipt > 0 ? `${formatNum(shortageBeforeReceipt, 0)} ${uom} short before next receipt` : `${formatNum(daysToStockout, 0)} days of net available`,
    deltaTone: shortageBeforeReceipt > 0 ? 'down' : 'up',
    sub: openPoDueDays == null ? 'No open PO' : `Open PO ${formatNum(openPoQty, 0)} ${uom} due ${dateIn(openPoDueDays)}`,
  };
  const releaseTile = {
    label: 'Release next order',
    value: releaseOverdue ? 'Now (overdue)' : dateIn(releaseInDays),
    deltaTone: releaseOverdue ? 'down' : 'flat',
    delta: releaseOverdue ? 'Stock + open PO already below ROP' : `in ${formatNum(releaseInDays, 0)} days`,
    sub: `Receipt ${dateIn(receiptInDays)} at ${leadTimeDays}-day lead time`,
  };
  const policyTile = { label: 'ROP / safety stock', value: `${formatNum(reorderPoint, 0)} / ${formatNum(safetyStock, 0)} ${uom}`, sub: `${formatNum(serviceLevel * 100, 0)}% service level · CV ${formatNum(demandCV)}` };
  const orderTile = { label: 'Order quantity', value: `${formatNum(orderQty, 0)} ${uom}`, sub: `EOQ ${formatNum(qStar, 0)} rounded to MOQ ${formatNum(moq, 0)}` };
  const shortageLine = shortageBeforeReceipt > 0
    ? <>Net available stock runs out on <M>{dateIn(daysToStockout)}</M>, <M>{formatNum(shortageBeforeReceipt, 0)} {uom}</M> short before the open PO lands on {dateIn(openPoDueDays)}.</>
    : <>No shortage before the next receipt: <M>{formatNum(netAvailable, 0)} {uom}</M> net available covers <M>{formatNum(daysToStockout, 0)} days</M>.</>;
  const releaseLine = releaseOverdue
    ? <>The next order of <M>{formatNum(orderQty, 0)} {uom}</M> should be released <M>now</M>; it would arrive {dateIn(receiptInDays)}.</>
    : <>Release the next order of <M>{formatNum(orderQty, 0)} {uom}</M> on <M>{dateIn(releaseInDays)}</M> for receipt on {dateIn(receiptInDays)}.</>;

  // Blueprint P0 for Screen 4: what to order, when it must arrive, and what follows.
  const personaTop = {
    head: {
      label: 'Head of Supply Chain · Service and Inventory Impact of the Policy',
      headline: <>{shortageLine} At a <M>{formatNum(serviceLevel * 100, 0)}%</M> service target the policy holds <M>{formatCurrency(safetyStock * unitCost, 0)}</M> of safety stock; right-sizing the lot to the EOQ benchmark saves <span className="font-mono font-bold text-success">{formatCurrency(netAnnualSavings, 0)}/yr</span>.</>,
      kpis: [
        stockoutTile,
        { label: 'Service level target', value: `${formatNum(serviceLevel * 100, 0)}%`, sub: `Class ${abcClass} policy` },
        { label: 'Safety stock value', value: formatCurrency(safetyStock * unitCost, 0), sub: `${formatNum(safetyStock, 0)} ${uom} at ${formatCurrency(unitCost)}/${uom}` },
        { label: 'Policy cost saving (benchmark)', value: `${formatCurrency(netAnnualSavings, 0)}/yr`, valueStyle: { color: 'var(--success)' }, sub: `${formatCurrency(workingCapitalReleased, 0)} cycle stock released` },
      ],
      next: { action: releaseOverdue ? `Approve the expedited release for ${selectedMaterial.id}` : `Approve the ${formatNum(serviceLevel * 100, 0)}% service policy for ${selectedMaterial.id}`, owner: 'Head of Supply Chain', due: releaseOverdue ? 'Today' : 'This planning cycle' },
    },
    inventory: {
      label: 'Inventory / Materials Manager · Order Quantity, Reorder Point and Exceptions',
      headline: <>{selectedMaterial.id} reorders at <M>{formatNum(reorderPoint, 0)} {uom}</M> with <M>{formatNum(safetyStock, 0)} {uom}</M> of safety stock, in lots of <M>{formatNum(orderQty, 0)} {uom}</M>. Across the portfolio, <M>18 materials</M> sit below their reorder point with no open order: those are today's exceptions.</>,
      kpis: [
        orderTile,
        policyTile,
        { label: 'Net available', value: `${formatNum(netAvailable, 0)} ${uom}`, sub: `On hand ${formatNum(onHandQty, 0)} less reservations` },
        { label: 'Exceptions', value: '18 materials', delta: 'below ROP, no open order', deltaTone: 'down', sub: '6 are Class A' },
      ],
      next: { action: 'Work the 18 below-ROP exceptions, Class A first', owner: 'Inventory / Materials Manager', due: 'Today' },
    },
    planner: {
      label: 'Production / Materials Planner · Arrivals, Net Available and Shortages',
      headline: <>{shortageLine} {releaseLine}</>,
      kpis: [
        stockoutTile,
        { label: 'Net available', value: `${formatNum(netAvailable, 0)} ${uom}`, sub: `${formatNum(daysToStockout, 0)} days at ${formatNum(dailyDemand, 1)} ${uom}/day` },
        { label: 'Next arrival', value: openPoDueDays == null ? 'None open' : dateIn(openPoDueDays), sub: openPoDueDays == null ? 'Next order not released' : `${formatNum(openPoQty, 0)} ${uom} on open PO` },
        releaseTile,
      ],
      next: shortageBeforeReceipt > 0
        ? { action: `Ask procurement to expedite the open PO, and resequence orders that use ${selectedMaterial.id}`, owner: 'Production / Materials Planner', due: 'Today' }
        : { action: 'Check the arrival date against the next production orders in MRP', owner: 'Production / Materials Planner', due: 'Next MRP run' },
    },
    procurement: {
      label: 'Procurement / Sourcing Manager · Order Quantity, Release Date, Lead Time and MOQ',
      headline: <>{releaseLine} The quantity is the EOQ benchmark of {formatNum(qStar, 0)} {uom} rounded up to {meta.supplier.split(' (')[0]}'s MOQ of <M>{formatNum(moq, 0)} {uom}</M>.</>,
      kpis: [
        orderTile,
        releaseTile,
        { label: 'Supplier lead time', value: `${leadTimeDays} days`, sub: meta.supplier },
        { label: 'MOQ', value: `${formatNum(moq, 0)} ${uom}`, sub: `${formatNum(orderQty / moq, 0)} × MOQ per order` },
      ],
      next: { action: releaseOverdue ? `Release a PO for ${formatNum(orderQty, 0)} ${uom} and request an expedite` : `Schedule the PO release for ${dateIn(releaseInDays)}`, owner: 'Procurement / Sourcing Manager', due: releaseOverdue ? 'Today' : dateIn(releaseInDays) },
    },
  };

  return (
    <section className="view max-w-7xl mx-auto">
      <ViewHead
        title="EOQ & Replenishment"
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

      <PersonaTop persona={persona} config={personaTop} safeguard="EOQ is a benchmark only. Dependent-demand components follow MRP and production-order requirements; open orders and reservations are netted off before any release date is set." />

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
