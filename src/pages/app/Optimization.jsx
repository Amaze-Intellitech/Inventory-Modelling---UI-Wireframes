import React, { useState, useMemo } from 'react';
import OptimizationSetup from '../../components/OptimizationSetup';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ViewHead, KpiTile, WhyDisclosure, Badge } from '../../components/CommonUI';
import { usePlatform } from '../../context/PlatformContext';
import { MATERIALS, EOQ_INPUTS, FORECAST_INPUTS } from '../../data/mockData';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

// Fixed analytical parameters aligned with authoritative EOQ and inventory intelligence models
const ORDERING_COST = 230.0; // S = $230.00/order (fixed EDI-automated replenishment cost)
const HOLDING_RATE = 0.06;   // i = 6.00% annual carrying rate (H = unitCost * 6%)
const SERVICE_FACTOR_Z = 1.65; // Z = 1.65 for 95.00% one-sided service level constraint

// Horizon length definitions
const AUTHORITATIVE_HORIZON_DAYS = 84;  // 12 Weeks = 84 discrete daily forecast points from Multivariate engine
const EXTENDED_HORIZON_DAYS = 182;      // 26 Weeks = 182 days (approx 6 calendar months) modeled extension

// Contextual supplier metadata aligned with enterprise master data
const MATERIAL_METADATA = {
  'MAT-1082': {
    supplier: 'HydraTech Dynamics GmbH (Sole Source)',
    contextTag: 'Class A · High Value · Sole Source Supply',
    downstream: '14 Downstream Finished Lines (HEX-200, IL-450, HC-80, MD-120)',
    strategicPriority: 'High-Value Sole Source Supply Continuity',
  },
  'MAT-4120': {
    supplier: 'SiliconFoundry International (Allocated Supply)',
    contextTag: 'Class A · High Volatility · Allocated Latency',
    downstream: '19 Downstream Controller SKUs (ECU-400, GW-80, TM-12)',
    strategicPriority: 'Critical Microcontroller Depletion Mitigation',
  },
  'MAT-2041': {
    supplier: 'Apex Energy Storage Ltd (Dual Sourced)',
    contextTag: 'Class A · High Velocity · Dual Sourced Feed',
    downstream: '8 Battery Pack Lines (BP-800, PM-200, ESS-50)',
    strategicPriority: 'High-Throughput Cell Working Capital Optimization',
  },
  'MAT-5501': {
    supplier: 'BondTech Polymer Solutions (Multi-Vendor)',
    contextTag: 'Class C · Consumable · Shelf-Life Sensitive',
    downstream: '6 Assembly Lines (Heavy Equipment Flanges, Gasket Sealing)',
    strategicPriority: 'Shelf-Life Expiry Risk Governance',
  },
};

// Formatting helpers
const formatNum = (v, decimals = 2) =>
  Number(v).toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });

const formatCurrency = (v, decimals = 2) =>
  `$${Number(v).toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`;

export default function Optimization() {
  const navigate = useNavigate();
  const { legacyPersona: persona, selectedMaterial } = usePlatform();

  // Horizon selection: '12w' (Authoritative Multivariate Forecast) vs '26w' (Extended Modeled Outlook)
  const [selectedHorizon, setSelectedHorizon] = useState('26w');

  // Chart hover inspection states
  const [hoveredTimelineIdx, setHoveredTimelineIdx] = useState(null);
  const [hoveredCoverageIdx, setHoveredCoverageIdx] = useState(null);
  const [hoveredItrIdx, setHoveredItrIdx] = useState(null);
  const [hoveredCapitalIdx, setHoveredCapitalIdx] = useState(null);

  // 1. Resolve canonical selected material identity (Strict Single Source of Truth)
  const activeMaterial = selectedMaterial || null;

  // 2. Extract base parameters from authoritative upstream contracts
  const activeId = activeMaterial?.id || null;
  const activeMeta = activeId ? (MATERIAL_METADATA[activeId] || {
    supplier: 'Standard Tier-1 Supplier',
    contextTag: `Class ${activeMaterial?.abcClass || 'A'} Raw Material`,
    downstream: 'General Assembly Lines',
    strategicPriority: 'Inventory Policy Governance',
  }) : null;

  const eoqInput = activeId ? (EOQ_INPUTS[activeId] || { demand: 4800.0, currentBatchQty: 600.0 }) : null;
  const forecastInput = activeId ? (FORECAST_INPUTS[activeId] || {
    leadTimeDays: 30,
    demandCV: 0.12,
    trendPerWeek: 0.002,
    modelR2: 0.85,
    rmseRatio: 0.09,
  }) : null;

  const annualDemand = eoqInput?.demand ?? 0; // D (units/year)
  const currentBatchQty = eoqInput?.currentBatchQty ?? 1; // Q_curr (units/order)
  const unitCost = activeMaterial?.unitCost ?? 100.0; // standard cost ($/unit)
  const currentOnHand = activeMaterial?.qty ?? 0.0; // physical on-hand stock (units)
  const currentOnHandValue = activeMaterial?.value ?? (currentOnHand * unitCost); // physical on-hand value ($)
  const uom = activeMaterial?.uom || 'EA';
  const abcClass = activeMaterial?.abcClass || 'A';
  const plant = activeMaterial?.plant || 'Plant 1';
  const category = activeMaterial?.category || 'Components';
  const name = activeMaterial?.name || 'Raw Material';

  const leadTimeDays = forecastInput?.leadTimeDays || 30; // L (days)
  const demandCV = forecastInput?.demandCV || 0.12;       // CV
  const trendPerWeek = forecastInput?.trendPerWeek || 0;   // linear weekly slope from Multivariate
  const modelR2 = forecastInput?.modelR2 ?? 0.85;          // in-sample R2
  const rmseRatio = forecastInput?.rmseRatio || 0.09;

  // 3. Mathematical Base Derivations for Active Material
  const holdingCostPerUnit = HOLDING_RATE * unitCost;
  const qStar = holdingCostPerUnit > 0 ? Math.sqrt((2 * annualDemand * ORDERING_COST) / holdingCostPerUnit) : 0;
  const cycleStockQty = qStar / 2;
  const avgWeeklyDemand = annualDemand / 52;
  const baseDailyDemand = avgWeeklyDemand / 7;
  const sigmaD = baseDailyDemand * demandCV;
  const safetyStock = SERVICE_FACTOR_Z * sigmaD * Math.sqrt(leadTimeDays);
  const safetyStockValue = safetyStock * unitCost;
  const demandDuringLeadTime = baseDailyDemand * leadTimeDays;
  const reorderPoint = demandDuringLeadTime + safetyStock;
  const targetPositionQty = Math.round(safetyStock + qStar);
  const targetPositionValue = targetPositionQty * unitCost;
  const targetAvgInventoryQty = safetyStock + cycleStockQty;
  const modeledAvgInventoryQty = targetAvgInventoryQty;
  const targetAvgInventoryValue = targetAvgInventoryQty * unitCost;

  // Current State (Day 0 / As of Today) Metrics
  const currentCoverageDays = baseDailyDemand > 0 ? currentOnHand / baseDailyDemand : 0;
  const currentCoverageGap = currentCoverageDays - leadTimeDays;
  const currentAnnualConsumptionValue = annualDemand * unitCost;
  const currentITR = currentOnHandValue > 0 ? (currentAnnualConsumptionValue / currentOnHandValue) : 0;
  const targetITR = targetAvgInventoryValue > 0 ? (currentAnnualConsumptionValue / targetAvgInventoryValue) : 0;
  const currentOptimizationGap = currentOnHand - targetPositionQty;
  const currentExcessQty = Math.max(0, currentOptimizationGap);
  const currentExcessValue = currentExcessQty * unitCost;
  const currentDeficitQty = Math.max(0, -currentOptimizationGap);
  const currentDeficitValue = currentDeficitQty * unitCost;
  const currentOrderQty = Math.max(0, targetPositionQty > currentOnHand ? Math.round(targetPositionQty - currentOnHand) : 0);
  const currentOrderValue = currentOrderQty * unitCost;
  const currentOrderFreq = currentBatchQty > 0 ? annualDemand / currentBatchQty : 0;
  const recOrderFreq = qStar > 0 ? annualDemand / qStar : 0;

  // Upstream ABC Analysis Intelligence
  const abcValueContribution = currentAnnualConsumptionValue;
  const abcCumulativeContribution = '[Unavailable]';
  const abcPriority = abcClass === 'A'
    ? 'High Governance / Critical Control'
    : abcClass === 'B'
      ? 'Periodic Control / Standard Optimization'
      : 'Automated Two-Bin / Low Control';
  const abcReviewCadence = abcClass === 'A'
    ? 'Weekly Surveillance'
    : abcClass === 'B'
      ? 'Monthly Calibration'
      : 'Quarterly Review';
  const abcAccuracyTarget = abcClass === 'A'
    ? '99.00% Cycle Counting'
    : abcClass === 'B'
      ? '95.00% Cycle Counting'
      : '90.00% Cycle Counting';

  // Current vs Recommended Policy Costs
  const currentAnnualOrderCost = currentOrderFreq * ORDERING_COST;
  const currentAnnualHoldCost = (currentBatchQty / 2) * holdingCostPerUnit;
  const currentTotalCost = currentAnnualOrderCost + currentAnnualHoldCost;

  const recAnnualOrderCost = recOrderFreq * ORDERING_COST;
  const recAnnualHoldCost = (qStar / 2) * holdingCostPerUnit;
  const recTotalCost = recAnnualOrderCost + recAnnualHoldCost;

  const netAnnualPolicySavings = Math.max(0, currentTotalCost - recTotalCost);
  const annualCarryingCostSavings = Math.max(0, currentAnnualHoldCost - recAnnualHoldCost);
  const modeledCapitalReleaseOpportunity = Math.max(0, currentOnHandValue - targetPositionValue);

  const optimizationConfidence = Math.min(99.9, Math.max(50.0, modelR2 * 100));

  // 4. Build ONE Canonical Daily Time-Phased Optimization Dataset
  const activeHorizonDays = selectedHorizon === '12w' ? AUTHORITATIVE_HORIZON_DAYS : EXTENDED_HORIZON_DAYS;

  const optimizationTimeline = useMemo(() => {
    if (!activeMaterial) return [];

    const asOfDate = new Date();
    const timeline = [];
    const onHandHistory = [currentOnHand];

    // Day 0: Current / Actual Position As of Today
    timeline.push({
      dayIndex: 0,
      date: asOfDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      fullDate: asOfDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }),
      dataStatus: '[Actual]',
      dataStatusLabel: 'Actual Enterprise State',
      statusTone: 'success',
      isAuthoritative: true,
      isToday: true,
      abcClass: abcClass,
      abcValueContribution: abcValueContribution,
      abcCumulativeContribution: abcCumulativeContribution,
      abcPriority: abcPriority,
      forecastDemand: baseDailyDemand,
      projectedOnHand: currentOnHand,
      targetPosition: targetPositionQty,
      safetyStock: safetyStock,
      reorderPoint: reorderPoint,
      eoq: qStar,
      cycleStock: cycleStockQty,
      modeledAvgInventory: modeledAvgInventoryQty,
      optimizationGap: currentOptimizationGap,
      inventoryValue: currentOnHandValue,
      targetValue: targetPositionValue,
      coverageDays: currentCoverageDays,
      coverageGap: currentCoverageGap,
      rollingITR: currentITR,
      isCoverageBreached: currentCoverageDays < leadTimeDays,
      isRopBreached: currentOnHand < reorderPoint,
      isSsBreached: currentOnHand < safetyStock,
      isDepleted: currentOnHand <= 0,
      cumulativeDemand: 0,
      cumulativeHoldingSavings: 0,
    });

    let runningOnHand = currentOnHand;
    let sumDemand = 0;

    for (let t = 1; t <= activeHorizonDays; t++) {
      const dDate = new Date(asOfDate);
      dDate.setDate(asOfDate.getDate() + t);
      const dateStr = dDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const fullDateStr = dDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });

      const isAuthoritative = t <= AUTHORITATIVE_HORIZON_DAYS;
      const dataStatus = isAuthoritative ? '[Forecast]' : '[Modeled Extension]';
      const dataStatusLabel = isAuthoritative ? 'Authoritative Multivariate Forecast' : 'Modeled Optimization Extension';
      const statusTone = isAuthoritative ? 'accent' : 'neutral';

      const dailyDemandRate = baseDailyDemand * (1 + trendPerWeek * (t / 7));
      sumDemand += dailyDemandRate;

      runningOnHand = Math.max(0, runningOnHand - dailyDemandRate);
      onHandHistory.push(runningOnHand);

      const currentDayOnHandVal = runningOnHand * unitCost;
      const dailyCoverageDays = dailyDemandRate > 0 ? (runningOnHand / dailyDemandRate) : 0;
      const dailyCoverageGap = dailyCoverageDays - leadTimeDays;
      const dailyOptGap = runningOnHand - targetPositionQty;
      const dailyRop = (dailyDemandRate * leadTimeDays) + safetyStock;

      const windowStart = Math.max(0, t - 29);
      const windowPoints = onHandHistory.slice(windowStart, t + 1);
      const rollingAvgOnHand30d = windowPoints.reduce((sum, v) => sum + v, 0) / windowPoints.length;
      const rollingAvgOnHandValue30d = rollingAvgOnHand30d * unitCost;
      const projectedRollingITR = rollingAvgOnHandValue30d > 0 ? (currentAnnualConsumptionValue / rollingAvgOnHandValue30d) : 0;

      const dailyHoldingCostSavings = (annualCarryingCostSavings / 365) * t;

      timeline.push({
        dayIndex: t,
        date: dateStr,
        fullDate: fullDateStr,
        dataStatus,
        dataStatusLabel,
        statusTone,
        isAuthoritative,
        isToday: false,
        abcClass: abcClass,
        abcValueContribution: abcValueContribution,
        abcCumulativeContribution: abcCumulativeContribution,
        abcPriority: abcPriority,
        forecastDemand: dailyDemandRate,
        projectedOnHand: runningOnHand,
        targetPosition: targetPositionQty,
        safetyStock: safetyStock,
        reorderPoint: dailyRop,
        eoq: qStar,
        cycleStock: cycleStockQty,
        modeledAvgInventory: modeledAvgInventoryQty,
        optimizationGap: dailyOptGap,
        inventoryValue: currentDayOnHandVal,
        targetValue: targetPositionValue,
        coverageDays: dailyCoverageDays,
        coverageGap: dailyCoverageGap,
        rollingITR: projectedRollingITR,
        isCoverageBreached: dailyCoverageDays < leadTimeDays,
        isRopBreached: runningOnHand < dailyRop,
        isSsBreached: runningOnHand < safetyStock,
        isDepleted: runningOnHand <= 0,
        cumulativeDemand: sumDemand,
        cumulativeHoldingSavings: dailyHoldingCostSavings,
      });
    }

    return timeline;
  }, [
    activeMaterial,
    activeHorizonDays,
    baseDailyDemand,
    currentOnHand,
    targetPositionQty,
    safetyStock,
    reorderPoint,
    qStar,
    cycleStockQty,
    modeledAvgInventoryQty,
    currentOptimizationGap,
    currentOnHandValue,
    targetPositionValue,
    currentCoverageDays,
    currentCoverageGap,
    currentITR,
    leadTimeDays,
    trendPerWeek,
    unitCost,
    currentAnnualConsumptionValue,
    annualCarryingCostSavings,
    abcClass,
    abcValueContribution,
    abcCumulativeContribution,
    abcPriority,
  ]);

  // 5. Derive First Breach Milestones
  const firstCoverageBreach = useMemo(() => {
    return optimizationTimeline.find((pt) => pt.dayIndex > 0 && pt.isCoverageBreached) || null;
  }, [optimizationTimeline]);

  // Active inspected items for charts
  const activeTimelineItem = (hoveredTimelineIdx !== null && optimizationTimeline[hoveredTimelineIdx]) ? optimizationTimeline[hoveredTimelineIdx] : (optimizationTimeline[0] || null);
  const activeCoverageItem = (hoveredCoverageIdx !== null && optimizationTimeline[hoveredCoverageIdx]) ? optimizationTimeline[hoveredCoverageIdx] : (firstCoverageBreach || optimizationTimeline[0] || null);
  const activeItrItem = (hoveredItrIdx !== null && optimizationTimeline[hoveredItrIdx]) ? optimizationTimeline[hoveredItrIdx] : (optimizationTimeline[optimizationTimeline.length - 1] || null);
  const activeCapitalItem = (hoveredCapitalIdx !== null && optimizationTimeline[hoveredCapitalIdx]) ? optimizationTimeline[hoveredCapitalIdx] : (optimizationTimeline[0] || null);

  // 6. Multi-Material Catalog Optimization Dataset
  const catalogOptimizationData = useMemo(() => {
    return MATERIALS.map((mat) => {
      const id = mat.id;
      const eInput = EOQ_INPUTS[id] || { demand: 4800.0, currentBatchQty: 600.0 };
      const fInput = FORECAST_INPUTS[id] || { leadTimeDays: 30, demandCV: 0.12, modelR2: 0.85 };

      const uCost = mat.unitCost ?? 100.0;
      const cStock = mat.qty ?? 0.0;
      const cValue = mat.value ?? (cStock * uCost);
      const d = eInput.demand;
      const lt = fInput.leadTimeDays || 30;
      const cv = fInput.demandCV || 0.12;
      const r2 = fInput.modelR2 ?? 0.85;

      const h = HOLDING_RATE * uCost;
      const qs = h > 0 ? Math.sqrt((2 * d * ORDERING_COST) / h) : 0;
      const dDaily = (d / 52) / 7;
      const sig = dDaily * cv;
      const ss = SERVICE_FACTOR_Z * sig * Math.sqrt(lt);
      const targetBuffer = Math.round(ss + qs);
      const targetVal = targetBuffer * uCost;
      const orderQuantity = Math.max(0, targetBuffer > cStock ? Math.round(targetBuffer - cStock) : 0);
      const orderVal = orderQuantity * uCost;
      const conf = Math.min(99.9, Math.max(50.0, r2 * 100));
      const covDays = dDaily > 0 ? (cStock / dDaily) : 0;

      const abc = mat.abcClass || 'A';
      const abcPrio = abc === 'A' ? 'High Governance' : abc === 'B' ? 'Periodic Control' : 'Automated Two-Bin';

      return {
        id,
        name: `${id} · ${mat.name}`,
        shortLabel: id,
        desc: mat.name,
        plant: mat.plant,
        category: mat.category,
        abcClass: abc,
        abcPriority: abcPrio,
        abcValueContribution: d * uCost,
        abcCumulativeContribution: '[Unavailable]',
        unitCost: uCost,
        uom: mat.uom || 'EA',
        currentStock: cStock,
        currentValue: cValue,
        demand: d,
        leadTimeDays: lt,
        demandCV: cv,
        qStar: qs,
        safetyStock: ss,
        desiredStock: targetBuffer,
        desiredValue: targetVal,
        orderQty: orderQuantity,
        orderValue: orderVal,
        coverageDays: covDays,
        confidence: conf,
        supplierAllocationText: 'Supplier allocation data unavailable',
        statusBadge: 'Allocation Data Unavailable',
        statusTone: 'neutral',
        isSelected: id === activeId,
      };
    });
  }, [activeId]);

  // Dynamic WhyDisclosure generator
  const dynamicDisclosure = useMemo(() => {
    if (!activeMaterial) return null;
    const hasOrder = currentOrderQty > 0;
    return {
      summary: hasOrder
        ? `Optimization rationale for ${activeId} · ${name} (Class ${abcClass}): Recommended replenishment of ${formatNum(currentOrderQty)} ${uom}`
        : `Optimization rationale for ${activeId} · ${name} (Class ${abcClass}): Current inventory position satisfies service requirements (0.00 ${uom} order)`,
      drivers: [
        `Optimal Economic Order Quantity (EOQ Q*) calibrated at ${formatNum(qStar)} ${uom} ($${formatNum(ORDERING_COST, 2)} ordering cost, ${(HOLDING_RATE * 100).toFixed(2)}% annual carrying rate on ${formatCurrency(unitCost)} unit cost).`,
        `Safety stock buffer sized at ${formatNum(safetyStock)} ${uom} to maintain 95.00% service level factor (Z = ${SERVICE_FACTOR_Z}) across ${leadTimeDays}-day lead time (demand CV = ${(demandCV * 100).toFixed(1)}%).`,
        `Current physical inventory of ${formatNum(currentOnHand)} ${uom} (${formatCurrency(currentOnHandValue)}) vs Modeled Target Buffer of ${formatNum(targetPositionQty)} ${uom} (${formatCurrency(targetPositionValue)}).`,
        `Upstream ABC Segmentation: Class ${abcClass} (${abcPriority}) with ${formatCurrency(abcValueContribution)} annual consumption value.`,
      ],
      meaning: [
        hasOrder
          ? `Inventory deficit of ${formatNum(currentDeficitQty)} ${uom} requires a replenishment commitment of ${formatCurrency(currentOrderValue)} to restore stock to the Modeled Target Buffer (SS + Q*).`
          : `Current physical stock of ${formatNum(currentOnHand)} ${uom} exceeds the Modeled Target Buffer (${formatNum(targetPositionQty)} ${uom}), averting immediate capital commitment ($0.00 PO required).`,
        `Authoritative Multivariate forecast model fit yields ${optimizationConfidence.toFixed(2)}% analytical confidence for ${category} (Class ${abcClass}) operations at ${plant}.`,
      ],
      action: [
        hasOrder
          ? `Authorize replenishment purchase order of ${formatNum(currentOrderQty)} ${uom} (${formatCurrency(currentOrderValue)}) in Inventory Agent.`
          : `Maintain standing inventory monitoring; defer replenishment purchase order until inventory approaches reorder threshold (${formatNum(reorderPoint)} ${uom}).`,
        `Review lead-time variations and demand volatility in Multivariate Forecasting and What-If Simulation according to Class ${abcClass} ${abcReviewCadence.toLowerCase()} cadence.`,
      ],
    };
  }, [
    activeMaterial,
    activeId,
    name,
    currentOrderQty,
    uom,
    qStar,
    unitCost,
    safetyStock,
    leadTimeDays,
    demandCV,
    currentOnHand,
    currentOnHandValue,
    targetPositionQty,
    targetPositionValue,
    currentDeficitQty,
    currentOrderValue,
    optimizationConfidence,
    category,
    abcClass,
    abcPriority,
    abcValueContribution,
    abcReviewCadence,
    plant,
    reorderPoint,
  ]);

  if (!activeMaterial) {
    return (
      <section className="view" style={{ minWidth: 0, overflowX: 'hidden', boxSizing: 'border-box' }}>
        <ViewHead
          title="Inventory Optimization Intelligence"
          subtitle={<p>No raw material selected. Please select a raw material from the catalog to generate time-phased predictive optimization intelligence.</p>}
          actions={<button type="button" className="btn btn-primary" onClick={() => navigate('/material-selection')}>Select Raw Material</button>}
        />
        <div className="card text-center p-12 bg-bg border-2 border-dashed border-border ">
          <h2 className="text-lg font-bold text-ink mb-2">No Active Raw Material Selected</h2>
          <p className="text-sm text-subtle max-w-md mx-auto mb-5">
            To view predictive time-phased inventory trajectories, calibrated EOQ lot sizes, coverage runways, and executive opportunity analysis, please select a raw material in Material Master.
          </p>
          <button type="button" className="btn btn-primary" onClick={() => navigate('/material-selection')}>
            Open Material Selection Catalog
          </button>
        </div>
      </section>
    );
  }

  // Chart Coordinate Engines
  const W1 = 920, H1 = 280, ML1 = 76, MR1 = 30, MT1 = 26, MB1 = 48;
  const maxStock1 = Math.max(...optimizationTimeline.map((p) => Math.max(p.projectedOnHand, p.targetPosition, p.reorderPoint)), 100);
  const yMax1 = Math.ceil((maxStock1 * 1.15) / 100) * 100 || 1000;
  const numPts1 = optimizationTimeline.length;
  const x1 = (i) => ML1 + (i / (numPts1 - 1 || 1)) * (W1 - ML1 - MR1);
  const y1 = (v) => MT1 + (1 - Math.max(0, v) / yMax1) * (H1 - MT1 - MB1);

  const baselinePath1 = optimizationTimeline.map((p, i) => `${i === 0 ? 'M' : 'L'}${x1(i).toFixed(1)},${y1(p.projectedOnHand).toFixed(1)}`).join(' ');
  const targetPath1 = optimizationTimeline.map((p, i) => `${i === 0 ? 'M' : 'L'}${x1(i).toFixed(1)},${y1(p.targetPosition).toFixed(1)}`).join(' ');
  const ssPath1 = optimizationTimeline.map((p, i) => `${i === 0 ? 'M' : 'L'}${x1(i).toFixed(1)},${y1(p.safetyStock).toFixed(1)}`).join(' ');
  const ropPath1 = optimizationTimeline.map((p, i) => `${i === 0 ? 'M' : 'L'}${x1(i).toFixed(1)},${y1(p.reorderPoint).toFixed(1)}`).join(' ');

  const W2 = 440, H2 = 220, ML2 = 60, MR2 = 25, MT2 = 24, MB2 = 42;
  const maxCov2 = Math.max(...optimizationTimeline.map((p) => p.coverageDays), leadTimeDays, 10);
  const yMax2 = Math.ceil((maxCov2 * 1.15) / 10) * 10 || 100;
  const x2 = (i) => ML2 + (i / (numPts1 - 1 || 1)) * (W2 - ML2 - MR2);
  const y2 = (v) => MT2 + (1 - Math.max(0, v) / yMax2) * (H2 - MT2 - MB2);
  const coveragePath2 = optimizationTimeline.map((p, i) => `${i === 0 ? 'M' : 'L'}${x2(i).toFixed(1)},${y2(p.coverageDays).toFixed(1)}`).join(' ');

  const W3 = 440, H3 = 220, ML3 = 54, MR3 = 25, MT3 = 24, MB3 = 42;
  const maxItr3 = Math.max(...optimizationTimeline.map((p) => p.rollingITR), targetITR, 5);
  const yMax3 = Math.ceil((maxItr3 * 1.25) / 2) * 2 || 10;
  const x3 = (i) => ML3 + (i / (numPts1 - 1 || 1)) * (W3 - ML3 - MR3);
  const y3 = (v) => MT3 + (1 - Math.max(0, v) / yMax3) * (H3 - MT3 - MB3);
  const itrPath3 = optimizationTimeline.map((p, i) => `${i === 0 ? 'M' : 'L'}${x3(i).toFixed(1)},${y3(p.rollingITR).toFixed(1)}`).join(' ');

  const W4 = 920, H4 = 230, ML4 = 76, MR4 = 30, MT4 = 24, MB4 = 44;
  const maxCap4 = Math.max(...optimizationTimeline.map((p) => Math.max(p.inventoryValue, p.targetValue)), 1000);
  const yMax4 = Math.ceil((maxCap4 * 1.15) / 100000) * 100000 || 1000000;
  const x4 = (i) => ML4 + (i / (numPts1 - 1 || 1)) * (W4 - ML4 - MR4);
  const y4 = (v) => MT4 + (1 - Math.max(0, v) / yMax4) * (H4 - MT4 - MB4);
  const capBaselinePath4 = optimizationTimeline.map((p, i) => `${i === 0 ? 'M' : 'L'}${x4(i).toFixed(1)},${y4(p.inventoryValue).toFixed(1)}`).join(' ');
  const capTargetPath4 = optimizationTimeline.map((p, i) => `${i === 0 ? 'M' : 'L'}${x4(i).toFixed(1)},${y4(p.targetValue).toFixed(1)}`).join(' ');

  return (
    <motion.section 
      className="view" 
      style={{ minWidth: 0, overflowX: 'hidden', boxSizing: 'border-box' }}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* 1. VIEW HEADER & HORIZON SELECTOR */}
      <ViewHead
        title="Optimization Plan"
        subtitle={
          <p>
            Time-phased predictive inventory optimization, lot-sizing economics, lead-time runway, and working-capital intelligence for <strong>{activeId} ({name})</strong>.
            <span className="block mt-1 font-semibold text-ink ">
              Active SKU Context: <span className="text-primary ">{activeId} · {name}</span> — {plant} ({category} · Class {abcClass})
            </span>
          </p>
        }
        actions={
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="inline-flex bg-muted-fill border border-border rounded-lg p-1">
              <button
                type="button"
                className={`text-xs px-3 py-1.5 rounded-md font-medium transition-all ${
                  selectedHorizon === '12w' 
                    ? 'bg-primary-solid text-white shadow-sm' 
                    : 'text-body-c hover:text-ink '
                }`}
                onClick={() => setSelectedHorizon('12w')}
              >
                12-Week Authoritative Forecast (84d)
              </button>
              <button
                type="button"
                className={`text-xs px-3 py-1.5 rounded-md font-medium transition-all ${
                  selectedHorizon === '26w' 
                    ? 'bg-primary-solid text-white shadow-sm' 
                    : 'text-body-c hover:text-ink '
                }`}
                onClick={() => setSelectedHorizon('26w')}
              >
                26-Week Modeled Outlook (182d)
              </button>
            </div>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => navigate('/app/decisions')}
            >
              Send to Inventory Agent
            </button>
          </div>
        }
      />

      <OptimizationSetup
        expected={optimizationTimeline[0]?.projectedOnHand}
        optimal={optimizationTimeline[0]?.targetPosition}
        uom={uom}
        material={`${activeId} · ${name}`}
      />

      {/* 2. CURRENT INVENTORY POSITION — AS OF TODAY */}
      <div className="card mb-4">
        <div className="card__head flex-wrap gap-2 mb-3.5">
          <div>
            <div className="flex flex-wrap items-center gap-2.5 mb-1">
              <h2 className="card__title text-base font-bold text-ink m-0">
                Current Inventory Position — As of Today
              </h2>
              <Badge tone="success">[Actual] Enterprise State</Badge>
              <Badge tone={activeMaterial.abcClass === 'A' ? 'accent' : 'neutral'}>
                {activeMeta.contextTag}
              </Badge>
            </div>
            <p className="card__sub text-xs text-subtle m-0">
              Physical on-hand inventory position, coverage runway, and optimization baseline for <strong>{activeId}</strong> at <strong>{plant}</strong> (Supplier: <strong>{activeMeta.supplier}</strong> · Lead Time: <strong>{leadTimeDays} days</strong>)
            </p>
          </div>
          <div className="text-xs text-subtle font-mono">
            As-Of Date: <strong className="text-body-c ">{optimizationTimeline[0]?.fullDate}</strong>
          </div>
        </div>

        <div className="grid-4 mb-2.5">
          <KpiTile
            label="Physical On-Hand Inventory"
            value={`${formatNum(currentOnHand, 0)} ${uom}`}
            sub={`${formatCurrency(currentOnHandValue)} inventory carrying value`}
          />
          <KpiTile
            label="Modeled Target Buffer (SS + Q*)"
            value={`${formatNum(targetPositionQty, 0)} ${uom}`}
            valueStyle={{ color: 'var(--primary)' }}
            sub={`${formatCurrency(targetPositionValue)} target buffer (SS + EOQ Lot)`}
          />
          <KpiTile
            label="Current Inventory Coverage"
            value={`${formatNum(currentCoverageDays, 1)} Days`}
            valueStyle={{ color: currentCoverageDays < leadTimeDays ? 'var(--error)' : 'var(--success)' }}
            delta={
              currentCoverageDays < leadTimeDays
                ? `LEAN: -${formatNum(leadTimeDays - currentCoverageDays, 1)}d vs ${leadTimeDays}d lead time`
                : `COVERED: +${formatNum(currentCoverageDays - leadTimeDays, 1)}d beyond lead time`
            }
            deltaTone={currentCoverageDays < leadTimeDays ? 'down' : 'up'}
            sub={`Supplier lead time is ${leadTimeDays} days`}
          />
          <KpiTile
            label="Current Optimization Gap"
            value={`${currentOptimizationGap >= 0 ? '+' : ''}${formatNum(currentOptimizationGap, 0)} ${uom}`}
            valueStyle={{ color: currentOptimizationGap > 0 ? 'var(--primary)' : currentOptimizationGap < 0 ? 'var(--error)' : 'var(--ink)' }}
            delta={
              currentOptimizationGap > 0
                ? `${formatCurrency(currentExcessValue)} Capital Release Opportunity`
                : currentOptimizationGap < 0
                  ? `${formatCurrency(currentDeficitValue)} Replenishment Required`
                  : 'Balanced on target'
            }
            deltaTone={currentOptimizationGap > 0 ? 'up' : currentOptimizationGap < 0 ? 'down' : 'flat'}
            sub="Current On-Hand vs Modeled Target Buffer"
          />
        </div>

        <div className="grid-4">
          <KpiTile
            label="Optimal Order Quantity (EOQ Q*)"
            value={`${formatNum(qStar, 0)} ${uom}`}
            delta={`${formatCurrency(qStar * unitCost)} spend/order`}
            deltaTone="flat"
            sub={`vs ERP batch size ${formatNum(currentBatchQty, 0)} ${uom} (${recOrderFreq.toFixed(1)} orders/yr)`}
          />
          <KpiTile
            label="Statistical Safety Stock (SS)"
            value={`${formatNum(safetyStock, 0)} ${uom}`}
            delta={`${formatCurrency(safetyStockValue)} buffer value`}
            deltaTone="flat"
            sub={`Z = 1.65 (95.00% service factor) · ${leadTimeDays}d LT`}
          />
          <KpiTile
            label="Planning Reorder Point (ROP)"
            value={`${formatNum(reorderPoint, 0)} ${uom}`}
            delta={
              currentOnHand < reorderPoint
                ? `Trigger Active: -${formatNum(reorderPoint - currentOnHand, 0)} ${uom}`
                : `Buffer: +${formatNum(currentOnHand - reorderPoint, 0)} ${uom}`
            }
            deltaTone={currentOnHand < reorderPoint ? 'down' : 'up'}
            sub={`${formatNum(demandDuringLeadTime, 0)} ${uom} LT demand + ${formatNum(safetyStock, 0)} ${uom} SS`}
          />
          <KpiTile
            label="Current Inventory Turnover (ITR)"
            value={`${formatNum(currentITR, 2)}×`}
            delta={`Target: ${formatNum(targetITR, 2)}× under calibrated EOQ`}
            deltaTone={targetITR > currentITR ? 'up' : 'flat'}
            sub={`Annualized COGS (${formatCurrency(currentAnnualConsumptionValue)}) / On-Hand Value`}
          />
        </div>
      </div>

      {/* 3. PERSONA-SPECIFIC INTELLIGENCE LENSES */}
      <AnimatePresence mode="wait">
        {persona === 'ds' && (
          <motion.div
            key="ds-opt"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="card mb-4 border-l-4 border-primary"
          >
            <div className="card__head mb-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="card__title text-base font-bold text-ink m-0">
                    Optimization Model Intelligence (Data Scientist Lens)
                  </h2>
                  <Badge tone="accent">Statistical Model & Parameter Derivations</Badge>
                </div>
                <p className="card__sub text-xs text-subtle m-0">
                  Rigorous mathematical breakdown of demand variability, lead-time convolution, safety stock sizing, and EOQ cost equilibrium
                </p>
              </div>
              <span className="badge badge-success font-bold text-xs">
                Forecast Fit: R² = {modelR2.toFixed(2)} ({optimizationConfidence.toFixed(1)}% Confidence)
              </span>
            </div>

            <div className="grid-4 mb-3.5">
              <div className="bg-bg p-2.5 rounded-md border border-border ">
                <span className="text-xs text-subtle uppercase block font-semibold">1. Baseline Daily Demand</span>
                <strong className="num text-sm text-ink block">{formatNum(baseDailyDemand, 2)} {uom}/d</strong>
                <span className="text-xs text-subtle font-mono">{formatNum(annualDemand, 0)} {uom}/yr · Slope: {(trendPerWeek * 100).toFixed(2)}%/wk</span>
              </div>
              <div className="bg-bg p-2.5 rounded-md border border-border ">
                <span className="text-xs text-subtle uppercase block font-semibold">2. Demand Volatility (CV)</span>
                <strong className="num text-sm text-ink block">CV = {(demandCV * 100).toFixed(1)}%</strong>
                <span className="text-xs text-subtle font-mono">σ_D = {formatNum(sigmaD, 2)} {uom}/d · RMSE: {rmseRatio.toFixed(2)}</span>
              </div>
              <div className="bg-bg p-2.5 rounded-md border border-border ">
                <span className="text-xs text-subtle uppercase block font-semibold">3. Holding Cost Rate (H)</span>
                <strong className="num text-sm text-ink block">{formatCurrency(holdingCostPerUnit)}/{uom}/yr</strong>
                <span className="text-xs text-subtle font-mono">i = {(HOLDING_RATE * 100).toFixed(2)}%/yr · S = ${ORDERING_COST}/order</span>
              </div>
              <div className="bg-bg p-2.5 rounded-md border border-border ">
                <span className="text-xs text-subtle uppercase block font-semibold">4. EOQ Variance vs ERP</span>
                <strong className="num text-sm text-primary block">
                  {formatNum(((qStar - currentBatchQty) / currentBatchQty) * 100, 1)}%
                </strong>
                <span className="text-xs text-subtle font-mono">Q* = {formatNum(qStar, 0)} vs Q_curr = {formatNum(currentBatchQty, 0)} {uom}</span>
              </div>
            </div>

            <div className="p-3 bg-[color-mix(in_srgb,var(--bg)_80%,transparent)] border border-border rounded-md mb-3 text-xs leading-relaxed text-body-c ">
              <strong>Horizon Boundary & Model Assumptions:</strong> Days 1–84 represent the authoritative Multivariate autoregressive forecast (R² = {modelR2.toFixed(2)}); Days 85–182 represent a modeled optimization extension continuing the linear trend without in-sample validation. Parameter elasticity demonstrates ∂ ln Q* / ∂ ln D = 0.50, indicating square-root dampening of demand shocks.
            </div>
          </motion.div>
        )}

        {persona === 'analyst' && (
          <motion.div
            key="analyst-opt"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="card mb-4 border-l-4 border-success"
          >
            <div className="card__head mb-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="card__title text-base font-bold text-ink m-0">
                    Operational Optimization Control (Plant Operations Lens)
                  </h2>
                  <Badge tone="success">Tactical Runway, Replenishment & Action Matrix</Badge>
                </div>
                <p className="card__sub text-xs text-subtle m-0">
                  Operational lead-time exposure, baseline breach timeline, lot-size recalibration triggers, and prioritized task matrix
                </p>
              </div>
              <span className={`badge ${currentCoverageDays < leadTimeDays ? 'badge-risk' : 'badge-success'} font-bold text-xs`}>
                {currentCoverageDays < leadTimeDays ? '● Replenishment Action Required' : '● Operational Coverage Protected'}
              </span>
            </div>

            <div className="grid-3 mb-3">
              <div className="bg-[color-mix(in_srgb,var(--error-bg)_70%,transparent)] border border-error rounded-md p-3">
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-xs font-bold text-error-tx">1. ACT NOW</span>
                  <Badge tone="risk">Urgent</Badge>
                </div>
                <div className="text-xs text-ink leading-relaxed">
                  {currentCoverageDays < leadTimeDays ? (
                    <>Class {abcClass} Priority: On-hand coverage (<strong>{formatNum(currentCoverageDays, 1)}d</strong>) is below supplier lead time (<strong>{leadTimeDays}d</strong>). Authorize replenishment order for <strong>{formatNum(currentOrderQty, 0)} {uom}</strong> immediately.</>
                  ) : firstCoverageBreach ? (
                    <>Baseline inventory will cross below lead-time coverage on <strong>{firstCoverageBreach.date}</strong> (in {firstCoverageBreach.dayIndex} days). Queue replenishment before Day {Math.max(1, firstCoverageBreach.dayIndex - leadTimeDays)}.</>
                  ) : (
                    <>On-hand stock is safely buffered. No immediate stockout emergency on this Class {abcClass} SKU.</>
                  )}
                </div>
              </div>

              <div className="bg-[color-mix(in_srgb,var(--info-bg)_70%,transparent)] border border-border rounded-md p-3">
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-xs font-bold text-primary">2. OPTIMIZE</span>
                  <Badge tone="accent">Lot Sizing</Badge>
                </div>
                <div className="text-xs text-ink leading-relaxed">
                  {currentOptimizationGap > 0 ? (
                    <>Surplus inventory of <strong>+{formatNum(currentExcessQty, 0)} {uom}</strong> ({formatCurrency(currentExcessValue)}) above target buffer. Defer PO releases until stock reaches ROP ({formatNum(reorderPoint, 0)} {uom}).</>
                  ) : (
                    <>Class {abcClass} Lot Sizing: Recalibrate ERP batch size from {formatNum(currentBatchQty, 0)} to <strong>{formatNum(qStar, 0)} {uom}</strong> to capture {formatCurrency(netAnnualPolicySavings)}/yr in net policy savings.</>
                  )}
                </div>
              </div>

              <div className="bg-[color-mix(in_srgb,var(--warning-bg)_70%,transparent)] border border-warning rounded-md p-3">
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-xs font-bold text-warning-tx">3. MONITOR</span>
                  <Badge tone="watch">Tracking</Badge>
                </div>
                <div className="text-xs text-ink leading-relaxed">
                  Class {abcClass} Governance: Review cadence ({abcReviewCadence}) with {activeMeta.supplier}. Demand CV of <strong>{(demandCV * 100).toFixed(1)}%</strong> indicates moderate volatility against the {leadTimeDays}-day lead-time SLA.
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {persona === 'exec' && (
          <motion.div
            key="exec-opt"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="card mb-4 border-l-4 border-ink "
          >
            <div className="card__head mb-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="card__title text-base font-bold text-ink m-0">
                    Optimization Executive Summary & 6-Month Opportunity
                  </h2>
                  <Badge tone="accent">EBITDA & Working Capital Governance</Badge>
                </div>
                <p className="card__sub text-xs text-subtle m-0">
                  High-level enterprise working capital release, annual carrying cost savings, and service level assurance
                </p>
              </div>
              <span className="badge badge-accent font-bold text-xs">
                Modeled Opportunity: {formatCurrency(modeledCapitalReleaseOpportunity)} Released
              </span>
            </div>

            <div className="grid-4 mb-3">
              <div className="bg-bg p-3 rounded-md border border-border ">
                <span className="text-xs text-subtle uppercase block font-semibold">1. Current Capital Position</span>
                <strong className="num text-base text-ink block">{formatCurrency(currentOnHandValue)}</strong>
                <span className="text-xs text-subtle font-mono">{formatNum(currentOnHand, 0)} {uom} on-hand ({formatNum(currentCoverageDays, 1)}d)</span>
              </div>
              <div className="bg-bg p-3 rounded-md border border-border ">
                <span className="text-xs text-subtle uppercase block font-semibold">2. Target Buffer Capital (SS + Q*)</span>
                <strong className="num text-base text-primary block">{formatCurrency(targetPositionValue)}</strong>
                <span className="text-xs text-subtle font-mono">Modeled target maintains 95% service level</span>
              </div>
              <div className="bg-bg p-3 rounded-md border border-border ">
                <span className="text-xs text-subtle uppercase block font-semibold">3. Capital Release Opportunity</span>
                <strong className="num text-base text-success-tx block">{formatCurrency(modeledCapitalReleaseOpportunity)}</strong>
                <span className="text-xs text-subtle font-mono">{currentOnHandValue > 0 ? ((modeledCapitalReleaseOpportunity / currentOnHandValue) * 100).toFixed(1) : 0}% unlocked</span>
              </div>
              <div className="bg-bg p-3 rounded-md border border-border ">
                <span className="text-xs text-subtle uppercase block font-semibold">4. Annual Carrying Cost Savings</span>
                <strong className="num text-base text-success-tx block">{formatCurrency(annualCarryingCostSavings)}/yr</strong>
                <span className="text-xs text-subtle font-mono">Direct P&L carrying expense reduction</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 4. PRIMARY TIME-SERIES CHARTS (Projected Inventory Position) */}
      <div className="card mb-4">
        <div className="card__head flex-wrap gap-2.5 mb-3.5">
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h2 className="card__title text-base font-bold text-ink m-0">
                Projected Inventory Position — {selectedHorizon === '12w' ? '12-Week (84-Day)' : '26-Week (182-Day)'} Outlook
              </h2>
              <Badge tone="accent">
                {selectedHorizon === '12w' ? 'Authoritative Forecast Window' : 'Extended Modeled Outlook'}
              </Badge>
            </div>
            <p className="card__sub text-xs text-subtle mt-0.5">
              Daily trajectory comparing Baseline Depletion Projection against Modeled Target Buffer (SS + Q*), Safety Stock, and Reorder Point
            </p>
          </div>
          <div className="chart-legend gap-3.5 flex-wrap text-xs">
            <span><span className="legend-dot" style={{ background: 'var(--primary)', height: 4, width: 14, borderRadius: 2 }} />Baseline Depletion</span>
            <span><span className="legend-dot" style={{ background: 'var(--success)', height: 4, width: 14, borderRadius: 2, borderTop: '2px dashed var(--success)' }} />Target Buffer (SS + Q*)</span>
            <span><span className="legend-dot" style={{ background: 'var(--warning)', height: 3, width: 12, borderRadius: 2 }} />Reorder Point (ROP)</span>
            <span><span className="legend-dot" style={{ background: 'var(--error)', height: 3, width: 12, borderRadius: 2, borderTop: '2px dotted var(--error)' }} />Safety Stock (95% SL)</span>
          </div>
        </div>

        {/* Real-time Interactive Day Inspector */}
        {activeTimelineItem && (
          <div className="flex flex-wrap items-center justify-between gap-2.5 bg-bg border border-border rounded-md px-3.5 py-2 mb-3 text-xs">
            <div className="flex items-center gap-2">
              <span className={`badge badge-${activeTimelineItem.statusTone} font-bold text-xs`}>
                {activeTimelineItem.dataStatus} {activeTimelineItem.isToday ? 'Today' : `Day ${activeTimelineItem.dayIndex}`}
              </span>
              <strong className="text-ink font-mono">{activeTimelineItem.fullDate}</strong>
              <Badge tone={activeTimelineItem.abcClass === 'A' ? 'accent' : 'neutral'}>
                Class {activeTimelineItem.abcClass}
              </Badge>
            </div>
            <div className="flex flex-wrap items-center gap-3.5 font-mono">
              <div>
                <span className="text-subtle mr-1 font-sans">Stock:</span>
                <strong className="text-primary ">{formatNum(activeTimelineItem.projectedOnHand, 0)} {uom}</strong>
              </div>
              <div>
                <span className="text-subtle mr-1 font-sans">Target Buffer:</span>
                <strong className="text-success-tx ">{formatNum(activeTimelineItem.targetPosition, 0)} {uom}</strong>
              </div>
              <div>
                <span className="text-subtle mr-1 font-sans">Gap:</span>
                <strong className={activeTimelineItem.optimizationGap > 0 ? 'text-primary' : activeTimelineItem.optimizationGap < 0 ? 'text-error-tx' : 'text-subtle'}>
                  {activeTimelineItem.optimizationGap >= 0 ? '+' : ''}{formatNum(activeTimelineItem.optimizationGap, 0)} {uom}
                </strong>
              </div>
              <div>
                <span className="text-subtle mr-1 font-sans">Coverage:</span>
                <strong className={activeTimelineItem.isCoverageBreached ? 'text-error-tx' : 'text-success-tx'}>
                  {formatNum(activeTimelineItem.coverageDays, 1)}d
                </strong>
              </div>
            </div>
          </div>
        )}

        {/* SVG Time-Series Chart 1 */}
        <div className="relative w-full overflow-hidden">
          <svg
            viewBox={`0 0 ${W1} ${H1}`}
            preserveAspectRatio="none"
            className="w-full block cursor-crosshair rounded-lg overflow-hidden border border-[color-mix(in_srgb,var(--border)_80%,transparent)] shadow-inner"
            style={{ height: 260 }}
            onMouseMove={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const mouseSvgX = ((e.clientX - rect.left) / rect.width) * W1;
              if (mouseSvgX >= ML1 && mouseSvgX <= W1 - MR1) {
                const approxIdx = Math.round(((mouseSvgX - ML1) / (W1 - ML1 - MR1)) * (numPts1 - 1));
                const clampedIdx = Math.max(0, Math.min(numPts1 - 1, approxIdx));
                setHoveredTimelineIdx(clampedIdx);
              }
            }}
            onMouseLeave={() => setHoveredTimelineIdx(null)}
          >
            {selectedHorizon === '26w' && (
              <g>
                <rect x={ML1} y={MT1} width={x1(AUTHORITATIVE_HORIZON_DAYS) - ML1} height={H1 - MT1 - MB1} fill="var(--info-bg)" opacity={0.35} />
                <rect x={x1(AUTHORITATIVE_HORIZON_DAYS)} y={MT1} width={W1 - MR1 - x1(AUTHORITATIVE_HORIZON_DAYS)} height={H1 - MT1 - MB1} fill="var(--bg)" opacity={0.6} />
                <line x1={x1(AUTHORITATIVE_HORIZON_DAYS)} x2={x1(AUTHORITATIVE_HORIZON_DAYS)} y1={MT1} y2={H1 - MB1} stroke="var(--subtle)" strokeWidth={1} strokeDasharray="4 3" />
                <text x={x1(AUTHORITATIVE_HORIZON_DAYS) - 8} y={MT1 + 14} fontSize={12} fill="var(--info-tx)" fontWeight={700} textAnchor="end">
                  ◀ 84d Authoritative Forecast Window
                </text>
                <text x={x1(AUTHORITATIVE_HORIZON_DAYS) + 8} y={MT1 + 14} fontSize={12} fill="var(--subtle)" fontWeight={700} textAnchor="start">
                  Modeled Optimization Extension ▶
                </text>
              </g>
            )}

            {[0, yMax1 * 0.25, yMax1 * 0.5, yMax1 * 0.75, yMax1].map((v) => (
              <g key={v}>
                <line x1={ML1} x2={W1 - MR1} y1={y1(v)} y2={y1(v)} stroke="var(--muted-fill)" strokeWidth={1} />
                <text x={8} y={y1(v) + 4} fontSize={12} fill="var(--subtle)">
                  {formatNum(v, 0)} {uom}
                </text>
              </g>
            ))}

            {[0, 14, 28, 42, 56, 70, 84, 112, 140, 182].filter((d) => d <= activeHorizonDays).map((d) => (
              <g key={d}>
                <line x1={x1(d)} x2={x1(d)} y1={H1 - MB1} y2={H1 - MB1 + 4} stroke="var(--border-strong)" />
                <text
                  x={x1(d)}
                  y={H1 - MB1 + 15}
                  fontSize={12}
                  fill={d === 0 ? 'var(--primary)' : 'var(--subtle)'}
                  fontWeight={d === 0 || d === 84 || d === activeHorizonDays ? 700 : 500}
                  textAnchor="middle"
                 
                >
                  {d === 0 ? 'Today' : `D+${d}`}
                </text>
                <text x={x1(d)} y={H1 - MB1 + 26} fontSize={12} fill="var(--subtle)" textAnchor="middle">
                  {optimizationTimeline[d]?.date}
                </text>
              </g>
            ))}

            <path d={ssPath1} fill="none" stroke="var(--error)" strokeWidth={1.5} strokeDasharray="3 3" />
            <path d={ropPath1} fill="none" stroke="var(--warning)" strokeWidth={1.5} strokeDasharray="4 3" />
            <path d={targetPath1} fill="none" stroke="var(--success)" strokeWidth={2.5} strokeDasharray="5 4" />
            <path d={baselinePath1} fill="none" stroke="var(--primary)" strokeWidth={3} />
            <circle cx={x1(0)} cy={y1(currentOnHand)} r={5} fill="var(--primary)" stroke="#fff" strokeWidth={2} />

            {hoveredTimelineIdx !== null && activeTimelineItem && (
              <g>
                <line x1={x1(hoveredTimelineIdx)} x2={x1(hoveredTimelineIdx)} y1={MT1} y2={H1 - MB1} stroke="var(--primary)" strokeWidth={1.5} strokeDasharray="2 2" />
                <circle cx={x1(hoveredTimelineIdx)} cy={y1(activeTimelineItem.projectedOnHand)} r={5} fill="var(--primary)" stroke="#fff" strokeWidth={2} />
                <circle cx={x1(hoveredTimelineIdx)} cy={y1(activeTimelineItem.targetPosition)} r={4.5} fill="var(--success)" stroke="#fff" strokeWidth={1.5} />
              </g>
            )}

            <line x1={ML1} x2={W1 - MR1} y1={H1 - MB1} y2={H1 - MB1} stroke="var(--border-strong)" strokeWidth={1} />
            <line x1={ML1} x2={ML1} y1={MT1} y2={H1 - MB1} stroke="var(--border-strong)" strokeWidth={1} />
          </svg>
        </div>
      </div>

      {/* 5. DUAL ROW: COVERAGE RUNWAY & 30-DAY ROLLING ITR CHARTS */}
      <div className="grid-2 mb-4">
        {/* CHART 2: INVENTORY COVERAGE & RUNWAY OUTLOOK */}
        <div className="card flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start gap-2 mb-2.5">
              <div>
                <h3 className="card__title text-sm font-bold text-ink m-0">
                  Inventory Coverage & Runway Outlook
                </h3>
                <p className="card__sub text-xs text-subtle mt-0.5">
                  Days of supply vs {leadTimeDays}-day supplier replenishment lead time threshold
                </p>
              </div>
              <span className={`badge ${firstCoverageBreach ? 'badge-risk' : 'badge-success'} text-xs font-mono`}>
                {firstCoverageBreach ? `Breach: ${firstCoverageBreach.date} (Day ${firstCoverageBreach.dayIndex})` : 'No Breach in Horizon'}
              </span>
            </div>

            {activeCoverageItem && (
              <div className="flex justify-between items-center bg-bg border border-border rounded px-2.5 py-1.5 text-xs mb-2">
                <div>
                  <span className="text-subtle mr-1">Date:</span>
                  <strong className="font-mono text-ink ">{activeCoverageItem.date}</strong> (Day {activeCoverageItem.dayIndex})
                </div>
                <div>
                  <span className="text-subtle mr-1">Coverage:</span>
                  <strong className={`font-mono ${activeCoverageItem.isCoverageBreached ? 'text-error-tx' : 'text-success-tx'}`}>
                    {formatNum(activeCoverageItem.coverageDays, 1)} Days
                  </strong>
                </div>
              </div>
            )}

            <div className="relative w-full overflow-hidden">
              <svg
                viewBox={`0 0 ${W2} ${H2}`}
                preserveAspectRatio="none"
                className="w-full block cursor-crosshair rounded border border-[color-mix(in_srgb,var(--border)_80%,transparent)] "
                style={{ height: 180 }}
                onMouseMove={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const mouseSvgX = ((e.clientX - rect.left) / rect.width) * W2;
                  if (mouseSvgX >= ML2 && mouseSvgX <= W2 - MR2) {
                    const approxIdx = Math.round(((mouseSvgX - ML2) / (W2 - ML2 - MR2)) * (numPts1 - 1));
                    const clampedIdx = Math.max(0, Math.min(numPts1 - 1, approxIdx));
                    setHoveredCoverageIdx(clampedIdx);
                  }
                }}
                onMouseLeave={() => setHoveredCoverageIdx(null)}
              >
                {[0, yMax2 * 0.25, yMax2 * 0.5, yMax2 * 0.75, yMax2].map((v) => (
                  <g key={v}>
                    <line x1={ML2} x2={W2 - MR2} y1={y2(v)} y2={y2(v)} stroke="var(--muted-fill)" strokeWidth={1} />
                    <text x={6} y={y2(v) + 3.5} fontSize={12} fill="var(--subtle)">{formatNum(v, 0)}d</text>
                  </g>
                ))}
                <line x1={ML2} x2={W2 - MR2} y1={y2(leadTimeDays)} y2={y2(leadTimeDays)} stroke="var(--warning)" strokeWidth={1.5} strokeDasharray="4 3" />
                <path d={coveragePath2} fill="none" stroke="var(--primary)" strokeWidth={2.5} />
                {hoveredCoverageIdx !== null && activeCoverageItem && (
                  <circle cx={x2(hoveredCoverageIdx)} cy={y2(activeCoverageItem.coverageDays)} r={5} fill="var(--primary)" stroke="#fff" strokeWidth={2} />
                )}
                <line x1={ML2} x2={W2 - MR2} y1={H2 - MB2} y2={H2 - MB2} stroke="var(--border-strong)" strokeWidth={1} />
                <line x1={ML2} x2={ML2} y1={MT2} y2={H2 - MB2} stroke="var(--border-strong)" strokeWidth={1} />
              </svg>
            </div>
          </div>
        </div>

        {/* CHART 3: 30-DAY ROLLING PROJECTED ITR OUTLOOK */}
        <div className="card flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start gap-2 mb-2.5">
              <div>
                <h3 className="card__title text-sm font-bold text-ink m-0">
                  30-Day Rolling Projected ITR Outlook
                </h3>
                <p className="card__sub text-xs text-subtle mt-0.5">
                  Rolling ITR (COGS / 30-Day Avg Inventory Value) vs target
                </p>
              </div>
              <span className="badge badge-success text-xs font-mono">
                Target ITR: {formatNum(targetITR, 2)}×
              </span>
            </div>

            {activeItrItem && (
              <div className="flex justify-between items-center bg-bg border border-border rounded px-2.5 py-1.5 text-xs mb-2">
                <div>
                  <span className="text-subtle mr-1">Date:</span>
                  <strong className="font-mono text-ink ">{activeItrItem.date}</strong> (Day {activeItrItem.dayIndex})
                </div>
                <div>
                  <span className="text-subtle mr-1">30d Rolling ITR:</span>
                  <strong className="num text-success-tx ">{formatNum(activeItrItem.rollingITR, 2)}×</strong>
                </div>
              </div>
            )}

            <div className="relative w-full overflow-hidden">
              <svg
                viewBox={`0 0 ${W3} ${H3}`}
                preserveAspectRatio="none"
                className="w-full block cursor-crosshair rounded border border-[color-mix(in_srgb,var(--border)_80%,transparent)] "
                style={{ height: 180 }}
                onMouseMove={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const mouseSvgX = ((e.clientX - rect.left) / rect.width) * W3;
                  if (mouseSvgX >= ML3 && mouseSvgX <= W3 - MR3) {
                    const approxIdx = Math.round(((mouseSvgX - ML3) / (W3 - ML3 - MR3)) * (numPts1 - 1));
                    const clampedIdx = Math.max(0, Math.min(numPts1 - 1, approxIdx));
                    setHoveredItrIdx(clampedIdx);
                  }
                }}
                onMouseLeave={() => setHoveredItrIdx(null)}
              >
                {[0, yMax3 * 0.25, yMax3 * 0.5, yMax3 * 0.75, yMax3].map((v) => (
                  <g key={v}>
                    <line x1={ML3} x2={W3 - MR3} y1={y3(v)} y2={y3(v)} stroke="var(--muted-fill)" strokeWidth={1} />
                    <text x={6} y={y3(v) + 3.5} fontSize={12} fill="var(--subtle)">{formatNum(v, 1)}×</text>
                  </g>
                ))}
                <line x1={ML3} x2={W3 - MR3} y1={y3(targetITR)} y2={y3(targetITR)} stroke="var(--success)" strokeWidth={1.5} strokeDasharray="4 3" />
                <path d={itrPath3} fill="none" stroke="var(--success)" strokeWidth={2.5} />
                {hoveredItrIdx !== null && activeItrItem && (
                  <circle cx={x3(hoveredItrIdx)} cy={y3(activeItrItem.rollingITR)} r={5} fill="var(--success)" stroke="#fff" strokeWidth={2} />
                )}
                <line x1={ML3} x2={W3 - MR3} y1={H3 - MB3} y2={H3 - MB3} stroke="var(--border-strong)" strokeWidth={1} />
                <line x1={ML3} x2={ML3} y1={MT3} y2={H3 - MB3} stroke="var(--border-strong)" strokeWidth={1} />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* 6. INVENTORY CAPITAL & CARRYING COST OUTLOOK (CHART 4) */}
      <div className="card mb-4">
        <div className="card__head flex-wrap gap-2.5 mb-3">
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="card__title text-base font-bold text-ink m-0">
                Inventory Capital & Carrying Cost Outlook
              </h2>
              <Badge tone="accent">Financial Valuation Proxy</Badge>
            </div>
            <p className="card__sub text-xs text-subtle mt-0.5">
              Physical inventory capital valuation ($) over the planning horizon vs modeled target buffer ($)
            </p>
          </div>
          <div className="chart-legend gap-3.5 text-xs">
            <span><span className="legend-dot" style={{ background: 'var(--primary)', height: 4, width: 14, borderRadius: 2 }} />Baseline Capital ($)</span>
            <span><span className="legend-dot" style={{ background: 'var(--success)', height: 4, width: 14, borderRadius: 2, borderTop: '2px dashed var(--success)' }} />Target Capital ($)</span>
          </div>
        </div>

        {activeCapitalItem && (
          <div className="flex flex-wrap items-center justify-between gap-2 bg-bg border border-border rounded-md px-3 py-1.5 text-xs mb-2.5 font-mono">
            <div>
              <span className="text-subtle mr-1 font-sans">Day:</span>
              <strong className="text-ink ">{activeCapitalItem.date}</strong> (Day {activeCapitalItem.dayIndex})
            </div>
            <div className="flex flex-wrap items-center gap-3.5">
              <div>
                <span className="text-subtle mr-1 font-sans">Physical Capital:</span>
                <strong className="text-primary ">{formatCurrency(activeCapitalItem.inventoryValue)}</strong>
              </div>
              <div>
                <span className="text-subtle mr-1 font-sans">Target Capital:</span>
                <strong className="text-success-tx ">{formatCurrency(activeCapitalItem.targetValue)}</strong>
              </div>
              <div>
                <span className="text-subtle mr-1 font-sans">Carrying Savings:</span>
                <strong className="text-success-tx ">+{formatCurrency(activeCapitalItem.cumulativeHoldingSavings)}</strong>
              </div>
            </div>
          </div>
        )}

        <div className="relative w-full overflow-hidden">
          <svg
            viewBox={`0 0 ${W4} ${H4}`}
            preserveAspectRatio="none"
            className="w-full block cursor-crosshair rounded-lg overflow-hidden border border-[color-mix(in_srgb,var(--border)_80%,transparent)] shadow-inner"
            style={{ height: 200 }}
            onMouseMove={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const mouseSvgX = ((e.clientX - rect.left) / rect.width) * W4;
              if (mouseSvgX >= ML4 && mouseSvgX <= W4 - MR4) {
                const approxIdx = Math.round(((mouseSvgX - ML4) / (W4 - ML4 - MR4)) * (numPts1 - 1));
                const clampedIdx = Math.max(0, Math.min(numPts1 - 1, approxIdx));
                setHoveredCapitalIdx(clampedIdx);
              }
            }}
            onMouseLeave={() => setHoveredCapitalIdx(null)}
          >
            {[0, yMax4 * 0.25, yMax4 * 0.5, yMax4 * 0.75, yMax4].map((v) => (
              <g key={v}>
                <line x1={ML4} x2={W4 - MR4} y1={y4(v)} y2={y4(v)} stroke="var(--muted-fill)" strokeWidth={1} />
                <text x={8} y={y4(v) + 4} fontSize={12} fill="var(--subtle)">{formatCurrency(v, 0)}</text>
              </g>
            ))}
            <path d={capTargetPath4} fill="none" stroke="var(--success)" strokeWidth={2} strokeDasharray="5 4" />
            <path d={capBaselinePath4} fill="none" stroke="var(--primary)" strokeWidth={2.5} />
            {hoveredCapitalIdx !== null && activeCapitalItem && (
              <g>
                <circle cx={x4(hoveredCapitalIdx)} cy={y4(activeCapitalItem.inventoryValue)} r={5} fill="var(--primary)" stroke="#fff" strokeWidth={2} />
                <circle cx={x4(hoveredCapitalIdx)} cy={y4(activeCapitalItem.targetValue)} r={4.5} fill="var(--success)" stroke="#fff" strokeWidth={1.5} />
              </g>
            )}
            <line x1={ML4} x2={W4 - MR4} y1={H4 - MB4} y2={H4 - MB4} stroke="var(--border-strong)" strokeWidth={1} />
            <line x1={ML4} x2={ML4} y1={MT4} y2={H4 - MB4} stroke="var(--border-strong)" strokeWidth={1} />
          </svg>
        </div>
      </div>

      {/* 7. PER-MATERIAL CATALOG ORDER PLAN & ALLOCATION STATUS */}
      <div className="card mb-4">
        <div className="card__head mb-3">
          <div>
            <h2 className="card__title text-base font-bold text-ink m-0">Per-Material Catalog Order Plan</h2>
            <p className="card__sub text-xs text-subtle mt-0.5">Canonical multi-material optimization parameters, target buffers, and replenishment recommendations</p>
          </div>
          <Badge tone="neutral">Catalog Baseline</Badge>
        </div>

        <div className="border border-border rounded-lg overflow-hidden mb-3.5">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Material</TableHead>
                <TableHead>ABC Class</TableHead>
                <TableHead className="text-right">Current Stock</TableHead>
                <TableHead className="text-right">Target Buffer</TableHead>
                <TableHead className="text-right">Coverage (DOS)</TableHead>
                <TableHead className="text-right">Recommended Order Qty</TableHead>
                <TableHead>Optimization Priority</TableHead>
                <TableHead>Supplier Allocation</TableHead>
                <TableHead className="text-right">Model Confidence</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {catalogOptimizationData.map((m) => (
                <TableRow
                  key={m.id}
                  className={m.isSelected ? 'bg-[color-mix(in_srgb,var(--info-bg)_60%,transparent)] font-medium' : undefined}
                >
                  <TableCell className="font-semibold text-ink font-mono text-xs">
                    {m.name}
                    {m.isSelected && (
                      <span className="badge badge-accent ml-2 text-xs py-0.5 px-1.5 font-sans">
                        Active SKU
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge tone={m.abcClass === 'A' ? 'accent' : 'neutral'}>
                      Class {m.abcClass}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-mono text-xs text-ink ">
                    {formatNum(m.currentStock, 0)} {m.uom} ({formatCurrency(m.currentValue)})
                  </TableCell>
                  <TableCell className="text-right font-mono text-xs text-ink ">
                    {formatNum(m.desiredStock, 0)} {m.uom} ({formatCurrency(m.desiredValue)})
                  </TableCell>
                  <TableCell className="text-right font-mono text-xs">
                    {formatNum(m.coverageDays, 1)}d
                  </TableCell>
                  <TableCell className="text-right font-mono text-xs">
                    <strong className={m.orderQty > 0 ? 'text-ink ' : 'text-subtle'}>
                      {formatNum(m.orderQty, 0)} {m.uom} ({formatCurrency(m.orderValue)})
                    </strong>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs font-semibold text-body-c ">
                      {m.abcPriority}
                    </span>
                  </TableCell>
                  <TableCell className="text-xs text-subtle">{m.supplierAllocationText}</TableCell>
                  <TableCell className="text-right font-mono text-xs">{m.confidence.toFixed(2)}%</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Explainability disclosure for active selected material */}
        {dynamicDisclosure && (
          <WhyDisclosure
            summary={dynamicDisclosure.summary}
            drivers={dynamicDisclosure.drivers}
            meaning={dynamicDisclosure.meaning}
            action={dynamicDisclosure.action}
            defaultOpen={true}
          />
        )}
      </div>
    </motion.section>
  );
}
