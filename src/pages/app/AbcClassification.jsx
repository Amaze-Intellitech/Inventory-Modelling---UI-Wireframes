import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { ShieldCheck, X } from 'lucide-react';
import {
  ViewHead,
  WhyDisclosure,
  Badge,
  KpiTile,
  Insight,
  Card,
  CardHead,
  DrillDown,
} from '../../components/CommonUI';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ParetoChart } from '../../components/Charts';
import { usePlatform } from '../../context/PlatformContext';

// ============================================================================
// CANONICAL MATERIAL INTELLIGENCE & DOWNSTREAM PRODUCT DEMAND BREAKDOWNS
// Authoritative material-level intelligence reconciling raw material demand
// with downstream finished and semi-finished product production schedules:
//   Product Demand × BOM Qty = Derived Raw-Material Consumption
//   Sum of Derived Demands = Material Aggregate Annual Demand (100.00%)
//   Annual Consumption Value = Annual Raw-Material Consumption × Unit Cost
// ============================================================================
const MATERIAL_INTELLIGENCE = {
  'MAT-1082': {
    id: 'MAT-1082',
    name: 'Hydraulic Pump 250BAR',
    category: 'Components',
    plant: 'Plant 1 — Assembly',
    uom: 'EA',
    unitCost: 600.0,
    annualDemand: 4800.0,
    annualConsumptionValue: 2880000.0,
    onHandQty: 930.0,
    onHandValue: 558000.0,
    abcClass: 'A',
    valueRank: 2,
    percentile: 98.7,
    contextTag: 'Class A · Sole-Source Supply · 60d Lead Time',
    demandCV: 0.12,
    leadTimeDays: 60,
    supplier: 'HydraTech Dynamics GmbH (Sole Source)',
    criticality: 'Critical (Line-stoppage risk; custom hydraulic interface with zero rapid substitutes)',
    statusTone: 'watch',
    statusTag: 'Sole-Source Latency',
    exceptionSummary: 'Sole-source procurement dependency across 14 finished equipment lines with 60-day transit latency.',
    downstreamProductsCount: 14,
    downstreamSummary: 'Top 4 tracked lines + 10 additional products (14 total)',
    downstreamProducts: [
      {
        product: 'Heavy Excavator HEX-200',
        type: 'Tier-1 Finished Good',
        bomQty: 1.0,
        productDemand: 1488,
        derivedConsumption: 1488.0,
        sharePct: 31.0,
        derivedValue: 892800.0,
        lineRisk: 'High — Core revenue line; zero substitute hydraulic pumps approved.',
      },
      {
        product: 'Industrial Loader IL-450',
        type: 'Tier-1 Finished Good',
        bomQty: 1.0,
        productDemand: 1152,
        derivedConsumption: 1152.0,
        sharePct: 24.0,
        derivedValue: 691200.0,
        lineRisk: 'High — Heavy loader chassis requires synchronized pump delivery.',
      },
      {
        product: 'Hydraulic Crane HC-80',
        type: 'Tier-1 Finished Good',
        bomQty: 1.0,
        productDemand: 816,
        derivedConsumption: 816.0,
        sharePct: 17.0,
        derivedValue: 489600.0,
        lineRisk: 'Medium — High-pressure boom subsystem.',
      },
      {
        product: 'Mining Dumper MD-120',
        type: 'Specialized Finished Good',
        bomQty: 1.0,
        productDemand: 528,
        derivedConsumption: 528.0,
        sharePct: 11.0,
        derivedValue: 316800.0,
        lineRisk: 'Medium — Low volume, high margin mining equipment.',
      },
      {
        product: '10 Other Assembly SKUs (Combined)',
        type: 'Secondary Finished Lines (10 SKUs)',
        bomQty: 1.0,
        productDemand: 816,
        derivedConsumption: 816.0,
        sharePct: 17.0,
        derivedValue: 489600.0,
        lineRisk: 'Low — Auxiliary assemblies with flexible schedule buffering.',
      },
    ],
  },
  'MAT-2041': {
    id: 'MAT-2041',
    name: 'Lithium Cell 21700',
    category: 'Raw Materials',
    plant: 'Plant 2 — Engine Hub',
    uom: 'EA',
    unitCost: 5.14,
    annualDemand: 420000.0,
    annualConsumptionValue: 2158800.0,
    onHandQty: 142000.0,
    onHandValue: 729880.0,
    abcClass: 'A',
    valueRank: 3,
    percentile: 97.9,
    contextTag: 'Class A · High Velocity Feed · Dual Sourced',
    demandCV: 0.10,
    leadTimeDays: 30,
    supplier: 'Apex Energy Storage Ltd (Dual Sourced)',
    criticality: 'High (Core electrochemical feed for battery packs; strict cell-matching specs)',
    statusTone: 'accent',
    statusTag: 'High Velocity Turnover',
    exceptionSummary: 'High-turnover electrochemical cell feed supporting 8 powertrain and commercial energy modules.',
    downstreamProductsCount: 8,
    downstreamSummary: 'Top 3 tracked lines + 5 additional products (8 total)',
    downstreamProducts: [
      {
        product: 'High-Capacity Battery Pack BP-800',
        type: 'Tier-1 Powertrain Pack',
        bomQty: 200.0,
        productDemand: 882,
        derivedConsumption: 176400.0,
        sharePct: 42.0,
        derivedValue: 906696.0,
        lineRisk: 'Critical — Primary powertrain battery pack for electric equipment.',
      },
      {
        product: 'Standard Power Module PM-200',
        type: 'Intermediate Sub-Assembly',
        bomQty: 100.0,
        productDemand: 1176,
        derivedConsumption: 117600.0,
        sharePct: 28.0,
        derivedValue: 604464.0,
        lineRisk: 'High — Modular sub-pack used across hybrid vehicle lines.',
      },
      {
        product: 'Grid Storage Module ESS-50',
        type: 'Commercial Energy Storage',
        bomQty: 500.0,
        productDemand: 151.2,
        derivedConsumption: 75600.0,
        sharePct: 18.0,
        derivedValue: 388584.0,
        lineRisk: 'Medium — Commercial stationary energy storage contracts.',
      },
      {
        product: '5 Other Sub-Assembly Packs (Combined)',
        type: 'Auxiliary Battery Assemblies (5 SKUs)',
        bomQty: 50.0,
        productDemand: 1008,
        derivedConsumption: 50400.0,
        sharePct: 12.0,
        derivedValue: 259056.0,
        lineRisk: 'Low — Auxiliary sub-packs with buffer stock.',
      },
    ],
  },
  'MAT-4120': {
    id: 'MAT-4120',
    name: 'Microcontroller MCU-64',
    category: 'Components',
    plant: 'Plant 3 — Microelectronics',
    uom: 'EA',
    unitCost: 78.65,
    annualDemand: 24000.0,
    annualConsumptionValue: 1887600.0,
    onHandQty: 920.0,
    onHandValue: 72358.0,
    abcClass: 'A',
    valueRank: 4,
    percentile: 96.8,
    contextTag: 'Class A · Elevated Volatility · Buffer Deficit',
    demandCV: 0.28,
    leadTimeDays: 60,
    supplier: 'SiliconFoundry International (Allocated Supply)',
    criticality: 'Critical (Main embedded processor; semiconductor wafer lead-time risk)',
    statusTone: 'risk',
    statusTag: 'Stockout Exposure · 14d DOS',
    exceptionSummary: '14.0 days of supply remaining against 60-day transit lead time with elevated demand volatility (CV 0.28).',
    downstreamProductsCount: 19,
    downstreamSummary: 'Top 3 tracked lines + 16 additional products (19 total)',
    downstreamProducts: [
      {
        product: 'Engine Control Unit ECU-400',
        type: 'Core Vehicle Computer',
        bomQty: 1.0,
        productDemand: 9120,
        derivedConsumption: 9120.0,
        sharePct: 38.0,
        derivedValue: 717288.0,
        lineRisk: 'Critical — Core vehicle computer; missing MCU stops main assembly.',
      },
      {
        product: 'Sensor Gateway Hub GW-80',
        type: 'Telematics Module',
        bomQty: 1.0,
        productDemand: 6000,
        derivedConsumption: 6000.0,
        sharePct: 25.0,
        derivedValue: 471900.0,
        lineRisk: 'High — Telematics hub for connected fleet management.',
      },
      {
        product: 'Telematics Control Unit TM-12',
        type: 'IoT Connectivity Box',
        bomQty: 1.0,
        productDemand: 4560,
        derivedConsumption: 4560.0,
        sharePct: 19.0,
        derivedValue: 358644.0,
        lineRisk: 'Medium — IoT connectivity module across commercial equipment.',
      },
      {
        product: '16 Other Controller Modules (Combined)',
        type: 'Subsystem Controllers (16 SKUs)',
        bomQty: 1.0,
        productDemand: 4320,
        derivedConsumption: 4320.0,
        sharePct: 18.0,
        derivedValue: 339768.0,
        lineRisk: 'Low — Distributed subsystem controllers with alternate builds.',
      },
    ],
  },
  'MAT-5501': {
    id: 'MAT-5501',
    name: 'High-Temp Sealant Paste',
    category: 'Consumables',
    plant: 'Plant 1 — Assembly',
    uom: 'KG',
    unitCost: 41.14,
    annualDemand: 6000.0,
    annualConsumptionValue: 246840.0,
    onHandQty: 1400.0,
    onHandValue: 57596.0,
    abcClass: 'C',
    valueRank: 540,
    percentile: 62.0,
    contextTag: 'Class C · Consumable · Liquidation Stage',
    demandCV: 0.15,
    leadTimeDays: 21,
    supplier: 'BondTech Polymer Solutions (Multi-Vendor)',
    criticality: 'Moderate (Standard assembly consumable; multiple equivalent approved formulations)',
    statusTone: 'neutral',
    statusTag: 'Liquidation Salvage',
    exceptionSummary: 'Class C consumable in RMLC liquidation stage (85.2 days supply); candidate for inter-plant transfer.',
    downstreamProductsCount: 6,
    downstreamSummary: '3 primary tracked lines covering 6 assembly lines (6 total)',
    downstreamProducts: [
      {
        product: 'Heavy Equipment Line 1 (HEX/IL)',
        type: 'Joint Flange Sealing',
        bomQty: 1.0,
        productDemand: 2640,
        derivedConsumption: 2640.0,
        sharePct: 44.0,
        derivedValue: 108609.6,
        lineRisk: 'Low — Standard sealing formulation with alternative vendors.',
      },
      {
        product: 'Crane & Dumper Line (HC/MD)',
        type: 'Housing Gasket Sealing',
        bomQty: 1.0,
        productDemand: 1920,
        derivedConsumption: 1920.0,
        sharePct: 32.0,
        derivedValue: 78988.8,
        lineRisk: 'Low — Multi-vendor qualified consumable.',
      },
      {
        product: 'Auxiliary Component Fabrication',
        type: 'Sub-Assembly Sealing (4 lines)',
        bomQty: 1.0,
        productDemand: 1440,
        derivedConsumption: 1440.0,
        sharePct: 24.0,
        derivedValue: 59241.6,
        lineRisk: 'Low — General fabrication consumable.',
      },
    ],
  },
};

// ============================================================================
// CANONICAL PORTFOLIO ABC & INVENTORY CONSTANTS
// Strict distinction between:
//   1. Annual Consumption Value ($43.86M) = Economic Importance / ABC Basis
//   2. Physical Inventory Value ($13.71M) = Working Capital Tied Up in Stock
// ============================================================================
const ENTERPRISE_TOTAL_CONSUMPTION_VALUE = 43860000.0;
const ENTERPRISE_PHYSICAL_ON_HAND_VALUE = 13710000.0;
const TOTAL_CATALOG_SKUS = 1420;
const GINI_COEFFICIENT = 0.81;

const PORTFOLIO_SEGMENTS = {
  A: {
    label: 'Class A',
    tierName: 'Class A · High Economic Priority',
    annualConsumptionValue: 34280000.0,
    consumptionSharePct: 78.3,
    skuCount: 142,
    skuSharePct: 10.0,
    physicalStockValue: 9820000.0,
    physicalStockSharePct: 71.63,
    policySummary: 'Configured Control Policy: Weekly review · 99.00% count accuracy · 98.00–99.00% service target.',
  },
  B: {
    label: 'Class B',
    tierName: 'Class B · Moderate Economic Priority',
    annualConsumptionValue: 6710000.0,
    consumptionSharePct: 15.3,
    skuCount: 298,
    skuSharePct: 21.0,
    physicalStockValue: 2640000.0,
    physicalStockSharePct: 19.26,
    policySummary: 'Configured Control Policy: Monthly review · 95.00% count accuracy · 95.00% service target.',
  },
  C: {
    label: 'Class C',
    tierName: 'Class C · Bulk / Automated Priority',
    annualConsumptionValue: 2870000.0,
    consumptionSharePct: 6.4,
    skuCount: 980,
    skuSharePct: 69.0,
    physicalStockValue: 1250000.0,
    physicalStockSharePct: 9.12,
    policySummary: 'Configured Control Policy: Quarterly / two-bin review · 90.00–95.00% service target.',
  },
};

export default function AbcClassification() {
  const { persona, selectedMaterial, setSelectedMaterialId } = usePlatform();
  const shouldReduceMotion = useReducedMotion();
  const [activeKpiDrilldown, setActiveKpiDrilldown] = React.useState(null);

  const matKey = selectedMaterial?.id || 'MAT-1082';
  const mat = MATERIAL_INTELLIGENCE[matKey] || MATERIAL_INTELLIGENCE['MAT-1082'];

  const formatNum = (val, decimals = 2) =>
    val.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  const formatCurrency = (val, decimals = 2) =>
    `$${val.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`;

  const enterpriseValueShare = (mat.annualConsumptionValue / ENTERPRISE_TOTAL_CONSUMPTION_VALUE) * 100;
  const physicalStockShare = (mat.onHandValue / ENTERPRISE_PHYSICAL_ON_HAND_VALUE) * 100;

  // Days of supply calculation
  const dailyDemand = mat.annualDemand > 0 ? mat.annualDemand / 365 : 0;
  const daysOfSupply = dailyDemand > 0 ? mat.onHandQty / dailyDemand : 0;

  const totalDerivedDemand = mat.downstreamProducts.reduce((sum, p) => sum + p.derivedConsumption, 0);
  const totalDerivedValue = mat.downstreamProducts.reduce((sum, p) => sum + p.derivedValue, 0);
  const totalSharePct = mat.downstreamProducts.reduce((sum, p) => sum + p.sharePct, 0);

  // Highest downstream exposure line
  const highestExposureProduct = [...mat.downstreamProducts].sort((a, b) => b.derivedValue - a.derivedValue)[0];

  // Dynamic exception audit from canonical material intelligence
  const classAExceptionItems = Object.values(MATERIAL_INTELLIGENCE).filter(
    (item) => item.abcClass === 'A' && item.statusTone !== 'neutral'
  );
  const activeExceptionsCount = classAExceptionItems.length;
  const activeExceptionSummary = classAExceptionItems.map((item) => item.statusTag.split('·')[0].trim()).join(' · ');

  // Filtered population for interactive KPI drilldown
  const drilldownItems = React.useMemo(() => {
    const allItems = Object.values(MATERIAL_INTELLIGENCE);
    if (activeKpiDrilldown === 'classA_spend') {
      return allItems
        .filter((m) => m.abcClass === 'A')
        .sort((a, b) => b.annualConsumptionValue - a.annualConsumptionValue);
    }
    if (activeKpiDrilldown === 'classA_capital') {
      return allItems
        .filter((m) => m.abcClass === 'A')
        .sort((a, b) => b.onHandValue - a.onHandValue);
    }
    if (activeKpiDrilldown === 'capital') {
      return [...allItems].sort((a, b) => b.onHandValue - a.onHandValue);
    }
    // 'spend' or default
    return [...allItems].sort((a, b) => b.annualConsumptionValue - a.annualConsumptionValue);
  }, [activeKpiDrilldown]);

  return (
    <section className="view max-w-7xl mx-auto space-y-6">
      {/* ===================================================================== */}
      {/* 1. HEADER                                                             */}
      {/* ===================================================================== */}
      <ViewHead
        title="ABC Classification & Economic Segmentation"
        subtitle={
          persona === 'ds' ? (
            <p className="text-body-c leading-relaxed">
              Empirical Pareto distribution of Annual Consumption Value (Annual Demand × Unit Cost) across {formatNum(TOTAL_CATALOG_SKUS, 0)} catalog materials ({formatCurrency(ENTERPRISE_TOTAL_CONSUMPTION_VALUE, 2)} total value).
            </p>
          ) : persona === 'analyst' ? (
            <p className="text-body-c leading-relaxed">
              Economic importance segmentation across {formatNum(TOTAL_CATALOG_SKUS, 0)} materials prioritizing {PORTFOLIO_SEGMENTS.A.skuCount} Class A SKUs ({formatCurrency(PORTFOLIO_SEGMENTS.A.annualConsumptionValue, 2)}) for weekly operational governance.
            </p>
          ) : (
            <p className="text-body-c leading-relaxed">
              Annual consumption spend concentration ({formatCurrency(ENTERPRISE_TOTAL_CONSUMPTION_VALUE, 2)}) vs on-hand physical inventory capital ({formatCurrency(ENTERPRISE_PHYSICAL_ON_HAND_VALUE, 2)}) across {formatNum(TOTAL_CATALOG_SKUS, 0)} catalog items.
            </p>
          )
        }
      />

      {/* ===================================================================== */}
      {/* 2. PERSONA HEADLINE INSIGHT (1–2 SHORT SENTENCES MAX)                */}
      {/* ===================================================================== */}
      <motion.div
        key={persona}
        initial={shouldReduceMotion ? false : { opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        {persona === 'ds' && (
          <Insight label="Data Scientist Lens · Output Interpretation">
            ABC classification describes the distribution of annual consumption value across {formatNum(TOTAL_CATALOG_SKUS, 0)} materials: Class A captures {formatNum(PORTFOLIO_SEGMENTS.A.consumptionSharePct)}% ({formatCurrency(PORTFOLIO_SEGMENTS.A.annualConsumptionValue, 2)}) across {formatNum(PORTFOLIO_SEGMENTS.A.skuSharePct)}% ({PORTFOLIO_SEGMENTS.A.skuCount}) of SKUs (Gini = {GINI_COEFFICIENT.toFixed(2)}).
          </Insight>
        )}
        {persona === 'analyst' && (
          <Insight label="Supply Chain Analyst Lens · Output Interpretation">
            ABC classification identifies materials generating {formatNum(PORTFOLIO_SEGMENTS.A.consumptionSharePct)}% ({formatCurrency(PORTFOLIO_SEGMENTS.A.annualConsumptionValue, 2)}) of consumption value; combine ABC priority with stock buffer, lead-time, and downstream dependency signals to resolve operational exceptions.
          </Insight>
        )}
        {persona === 'exec' && (
          <Insight label="C-Suite Executive Lens · Output Interpretation">
            ABC classification highlights where annual material consumption value is concentrated ({formatCurrency(PORTFOLIO_SEGMENTS.A.annualConsumptionValue, 2)} in Class A), while distinguishing the physical inventory capital currently tied up in stock ({formatCurrency(PORTFOLIO_SEGMENTS.A.physicalStockValue, 2)}).
          </Insight>
        )}
      </motion.div>

      {/* ===================================================================== */}
      {/* 3. PRIMARY KPI GROUP (INTERACTIVE DRILLDOWN ENTRY POINTS)            */}
      {/* ===================================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {persona === 'ds' && (
          <>
            <KpiTile
              label="Total Annual Consumption Value"
              value={formatCurrency(ENTERPRISE_TOTAL_CONSUMPTION_VALUE, 2)}
              sub={activeKpiDrilldown === 'spend' ? '▼ Breakdown Open' : `${formatNum(TOTAL_CATALOG_SKUS, 0)} catalog materials · Click to drill down`}
              onClick={() => setActiveKpiDrilldown((prev) => (prev === 'spend' ? null : 'spend'))}
              className={activeKpiDrilldown === 'spend' ? 'ring-2 ring-primary border-primary bg-primary-subtle/10' : ''}
            />
            <KpiTile
              label="Class A Value Contribution"
              value={`${formatNum(PORTFOLIO_SEGMENTS.A.consumptionSharePct)}%`}
              sub={activeKpiDrilldown === 'classA_spend' ? '▼ Breakdown Open' : `${formatCurrency(PORTFOLIO_SEGMENTS.A.annualConsumptionValue, 2)} across ${PORTFOLIO_SEGMENTS.A.skuCount} SKUs · Drill down`}
              onClick={() => setActiveKpiDrilldown((prev) => (prev === 'classA_spend' ? null : 'classA_spend'))}
              className={activeKpiDrilldown === 'classA_spend' ? 'ring-2 ring-primary border-primary bg-primary-subtle/10' : ''}
            />
            <KpiTile
              label="Class A SKU Concentration"
              value={`${formatNum(PORTFOLIO_SEGMENTS.A.skuSharePct)}%`}
              sub={activeKpiDrilldown === 'classA_spend' ? '▼ Breakdown Open' : `${PORTFOLIO_SEGMENTS.A.skuCount} of ${formatNum(TOTAL_CATALOG_SKUS, 0)} materials · Drill down`}
              onClick={() => setActiveKpiDrilldown((prev) => (prev === 'classA_spend' ? null : 'classA_spend'))}
              className={activeKpiDrilldown === 'classA_spend' ? 'ring-2 ring-primary border-primary bg-primary-subtle/10' : ''}
            />
            <KpiTile
              label="Gini Concentration Index"
              value={GINI_COEFFICIENT.toFixed(2)}
              sub="Empirical log-value distribution"
            />
          </>
        )}

        {persona === 'analyst' && (
          <>
            <KpiTile
              label="Class A Control Scope"
              value={`${PORTFOLIO_SEGMENTS.A.skuCount} SKUs`}
              sub={activeKpiDrilldown === 'classA_spend' ? '▼ Breakdown Open' : `${formatNum(PORTFOLIO_SEGMENTS.A.skuSharePct)}% under weekly surveillance · Drill down`}
              onClick={() => setActiveKpiDrilldown((prev) => (prev === 'classA_spend' ? null : 'classA_spend'))}
              className={activeKpiDrilldown === 'classA_spend' ? 'ring-2 ring-primary border-primary bg-primary-subtle/10' : ''}
            />
            <KpiTile
              label="Class A Annual Consumption"
              value={formatCurrency(PORTFOLIO_SEGMENTS.A.annualConsumptionValue, 2)}
              sub={activeKpiDrilldown === 'classA_spend' ? '▼ Breakdown Open' : `${formatNum(PORTFOLIO_SEGMENTS.A.consumptionSharePct)}% of portfolio consumption · Drill down`}
              onClick={() => setActiveKpiDrilldown((prev) => (prev === 'classA_spend' ? null : 'classA_spend'))}
              className={activeKpiDrilldown === 'classA_spend' ? 'ring-2 ring-primary border-primary bg-primary-subtle/10' : ''}
            />
            <KpiTile
              label="Class A Physical Inventory"
              value={formatCurrency(PORTFOLIO_SEGMENTS.A.physicalStockValue, 2)}
              sub={activeKpiDrilldown === 'classA_capital' ? '▼ Breakdown Open' : `${formatNum(PORTFOLIO_SEGMENTS.A.physicalStockSharePct)}% of physical stock (${formatCurrency(ENTERPRISE_PHYSICAL_ON_HAND_VALUE, 2)}) · Drill down`}
              onClick={() => setActiveKpiDrilldown((prev) => (prev === 'classA_capital' ? null : 'classA_capital'))}
              className={activeKpiDrilldown === 'classA_capital' ? 'ring-2 ring-primary border-primary bg-primary-subtle/10' : ''}
            />
            <KpiTile
              label="Class A Exception Queue"
              value={`${activeExceptionsCount} Active Triggers`}
              sub={activeExceptionSummary}
            />
          </>
        )}

        {persona === 'exec' && (
          <>
            <KpiTile
              label="Annual Consumption Spend"
              value={formatCurrency(ENTERPRISE_TOTAL_CONSUMPTION_VALUE, 2)}
              sub={activeKpiDrilldown === 'spend' ? '▼ Breakdown Open' : 'Enterprise material requirement · Click to drill down'}
              onClick={() => setActiveKpiDrilldown((prev) => (prev === 'spend' ? null : 'spend'))}
              className={activeKpiDrilldown === 'spend' ? 'ring-2 ring-primary border-primary bg-primary-subtle/10' : ''}
            />
            <KpiTile
              label="Physical Inventory Capital"
              value={formatCurrency(ENTERPRISE_PHYSICAL_ON_HAND_VALUE, 2)}
              sub={activeKpiDrilldown === 'capital' ? '▼ Breakdown Open' : 'Current on-hand working capital · Click to drill down'}
              onClick={() => setActiveKpiDrilldown((prev) => (prev === 'capital' ? null : 'capital'))}
              className={activeKpiDrilldown === 'capital' ? 'ring-2 ring-primary border-primary bg-primary-subtle/10' : ''}
            />
            <KpiTile
              label="Class A Spend Concentration"
              value={`${formatNum(PORTFOLIO_SEGMENTS.A.consumptionSharePct)}%`}
              sub={activeKpiDrilldown === 'classA_spend' ? '▼ Breakdown Open' : `${formatCurrency(PORTFOLIO_SEGMENTS.A.annualConsumptionValue, 2)} across ${PORTFOLIO_SEGMENTS.A.skuCount} SKUs · Drill down`}
              onClick={() => setActiveKpiDrilldown((prev) => (prev === 'classA_spend' ? null : 'classA_spend'))}
              className={activeKpiDrilldown === 'classA_spend' ? 'ring-2 ring-primary border-primary bg-primary-subtle/10' : ''}
            />
            <KpiTile
              label="Class A Capital Tied Up"
              value={formatCurrency(PORTFOLIO_SEGMENTS.A.physicalStockValue, 2)}
              sub={activeKpiDrilldown === 'classA_capital' ? '▼ Breakdown Open' : `${formatNum(PORTFOLIO_SEGMENTS.A.physicalStockSharePct)}% of enterprise stock · Drill down`}
              onClick={() => setActiveKpiDrilldown((prev) => (prev === 'classA_capital' ? null : 'classA_capital'))}
              className={activeKpiDrilldown === 'classA_capital' ? 'ring-2 ring-primary border-primary bg-primary-subtle/10' : ''}
            />
          </>
        )}
      </div>

      {/* ===================================================================== */}
      {/* 3.1 INTERACTIVE KPI DRILLDOWN BREAKDOWN (PROGRESSIVE DISCLOSURE)     */}
      {/* ===================================================================== */}
      {activeKpiDrilldown && (
        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.18 }}
          className="card bg-surface border-2 border-primary/50 rounded-md p-4 sm:p-5 shadow-md space-y-3"
        >
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-3 border-b border-border">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge tone="accent" className="font-mono text-xs">
                  KPI Drilldown
                </Badge>
                <h3 className="text-sm font-bold text-ink m-0">
                  {activeKpiDrilldown === 'spend' && 'Annual Consumption Spend — Material Breakdown'}
                  {activeKpiDrilldown === 'capital' && 'Physical Inventory Capital — Material Breakdown'}
                  {activeKpiDrilldown === 'classA_spend' && 'Class A Spend Concentration — Material Breakdown'}
                  {activeKpiDrilldown === 'classA_capital' && 'Class A Capital Tied Up — Material Breakdown'}
                </h3>
              </div>
              <p className="text-xs text-body-c mt-1 mb-0 leading-relaxed">
                {activeKpiDrilldown === 'spend' &&
                  `Showing ${drilldownItems.length} tracked catalog materials contributing to enterprise annual consumption spend (${formatCurrency(ENTERPRISE_TOTAL_CONSUMPTION_VALUE, 2)}). Click any row to inspect material-level intelligence.`}
                {activeKpiDrilldown === 'capital' &&
                  `Showing ${drilldownItems.length} tracked catalog materials contributing to on-hand physical working capital (${formatCurrency(ENTERPRISE_PHYSICAL_ON_HAND_VALUE, 2)}). Click any row to inspect inventory position.`}
                {activeKpiDrilldown === 'classA_spend' &&
                  `Showing ${drilldownItems.length} tracked Class A materials driving ${formatNum(PORTFOLIO_SEGMENTS.A.consumptionSharePct)}% (${formatCurrency(PORTFOLIO_SEGMENTS.A.annualConsumptionValue, 2)}) of enterprise consumption spend across ${PORTFOLIO_SEGMENTS.A.skuCount} SKUs.`}
                {activeKpiDrilldown === 'classA_capital' &&
                  `Showing ${drilldownItems.length} tracked Class A materials accounting for ${formatNum(PORTFOLIO_SEGMENTS.A.physicalStockSharePct)}% (${formatCurrency(PORTFOLIO_SEGMENTS.A.physicalStockValue, 2)}) of on-hand physical inventory capital.`}
              </p>
            </div>
            <Button
              variant="outline"
              size="xs"
              onClick={() => setActiveKpiDrilldown(null)}
              className="self-start sm:self-auto shrink-0 flex items-center gap-1"
            >
              <X size={13} />
              Close Breakdown
            </Button>
          </div>

          {/* Granular Source Table Reconciling to Enterprise KPI */}
          <div className="rounded-sm border border-border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Material / SKU</TableHead>
                  <TableHead>ABC Class</TableHead>
                  {activeKpiDrilldown === 'capital' || activeKpiDrilldown === 'classA_capital' ? (
                    <>
                      <TableHead className="text-right font-mono">On-Hand Stock</TableHead>
                      <TableHead className="text-right font-mono">Unit Cost</TableHead>
                      <TableHead className="text-right font-mono">Physical Stock Value</TableHead>
                      <TableHead className="text-right font-mono">% Enterprise Stock</TableHead>
                      <TableHead className="text-right font-mono">Days of Supply</TableHead>
                      <TableHead className="text-right font-mono">Lead Time</TableHead>
                    </>
                  ) : (
                    <>
                      <TableHead className="text-right font-mono">Annual Demand</TableHead>
                      <TableHead className="text-right font-mono">Unit Cost</TableHead>
                      <TableHead className="text-right font-mono">Annual Consumption Value</TableHead>
                      <TableHead className="text-right font-mono">% Enterprise Spend</TableHead>
                      <TableHead className="text-right font-mono">Physical Stock Value</TableHead>
                      <TableHead className="text-right font-mono">Downstream Lines</TableHead>
                    </>
                  )}
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {drilldownItems.map((item) => {
                  const isSelected = item.id === mat.id;
                  const itemDailyDemand = item.annualDemand > 0 ? item.annualDemand / 365 : 0;
                  const itemDos = itemDailyDemand > 0 ? item.onHandQty / itemDailyDemand : 0;
                  const itemSpendShare = (item.annualConsumptionValue / ENTERPRISE_TOTAL_CONSUMPTION_VALUE) * 100;
                  const itemStockShare = (item.onHandValue / ENTERPRISE_PHYSICAL_ON_HAND_VALUE) * 100;

                  return (
                    <TableRow
                      key={item.id}
                      className={`cursor-pointer transition-colors ${
                        isSelected ? 'bg-primary-subtle/25 font-medium' : 'hover:bg-surface-hover'
                      }`}
                      onClick={() => setSelectedMaterialId && setSelectedMaterialId(item.id)}
                    >
                      <TableCell className="font-bold text-ink">
                        {item.id} · <span className="font-normal text-body-c">{item.name}</span>
                      </TableCell>
                      <TableCell>
                        <Badge tone={item.abcClass === 'A' ? 'accent' : 'neutral'}>
                          Class {item.abcClass}
                        </Badge>
                      </TableCell>
                      {activeKpiDrilldown === 'capital' || activeKpiDrilldown === 'classA_capital' ? (
                        <>
                          <TableCell className="text-right font-mono">
                            {formatNum(item.onHandQty, 0)} {item.uom}
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            {formatCurrency(item.unitCost)}
                          </TableCell>
                          <TableCell className="text-right font-mono font-bold text-ink">
                            {formatCurrency(item.onHandValue)}
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            <Badge tone="neutral">{formatNum(itemStockShare, 2)}%</Badge>
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            <span className={itemDos < item.leadTimeDays ? 'text-error-tx font-bold' : ''}>
                              {formatNum(itemDos, 1)}d
                            </span>
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            {item.leadTimeDays}d
                          </TableCell>
                        </>
                      ) : (
                        <>
                          <TableCell className="text-right font-mono">
                            {formatNum(item.annualDemand, 0)} {item.uom}/yr
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            {formatCurrency(item.unitCost)}
                          </TableCell>
                          <TableCell className="text-right font-mono font-bold text-ink">
                            {formatCurrency(item.annualConsumptionValue)}/yr
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            <Badge tone="accent">{formatNum(itemSpendShare, 2)}%</Badge>
                          </TableCell>
                          <TableCell className="text-right font-mono text-body-c">
                            {formatCurrency(item.onHandValue)}
                          </TableCell>
                          <TableCell className="text-right font-mono text-ink">
                            {item.downstreamProductsCount} lines
                          </TableCell>
                        </>
                      )}
                      <TableCell className="text-right">
                        <Button
                          variant={isSelected ? 'primary' : 'outline'}
                          size="xs"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedMaterialId && setSelectedMaterialId(item.id);
                          }}
                        >
                          {isSelected ? 'Active' : 'Inspect'}
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableCell colSpan={2} className="font-bold text-ink">
                    {activeKpiDrilldown === 'classA_spend' || activeKpiDrilldown === 'classA_capital'
                      ? `Tracked Class A SKUs Subtotal (${drilldownItems.length} Materials)`
                      : `Tracked Materials Subtotal (${drilldownItems.length} Materials)`}
                  </TableCell>
                  {activeKpiDrilldown === 'capital' || activeKpiDrilldown === 'classA_capital' ? (
                    <>
                      <TableCell colSpan={2} />
                      <TableCell className="text-right font-mono font-bold text-primary">
                        {formatCurrency(drilldownItems.reduce((sum, i) => sum + i.onHandValue, 0))}
                      </TableCell>
                      <TableCell className="text-right font-mono font-bold text-ink">
                        {formatNum(
                          drilldownItems.reduce(
                            (sum, i) => sum + (i.onHandValue / ENTERPRISE_PHYSICAL_ON_HAND_VALUE) * 100,
                            0
                          ),
                          2
                        )}%
                      </TableCell>
                      <TableCell colSpan={3} className="text-xs text-body-c">
                        Reconciles to {activeKpiDrilldown === 'classA_capital' ? 'Class A' : 'Enterprise'} stock base
                      </TableCell>
                    </>
                  ) : (
                    <>
                      <TableCell colSpan={2} />
                      <TableCell className="text-right font-mono font-bold text-primary">
                        {formatCurrency(drilldownItems.reduce((sum, i) => sum + i.annualConsumptionValue, 0))}/yr
                      </TableCell>
                      <TableCell className="text-right font-mono font-bold text-ink">
                        {formatNum(
                          drilldownItems.reduce(
                            (sum, i) => sum + (i.annualConsumptionValue / ENTERPRISE_TOTAL_CONSUMPTION_VALUE) * 100,
                            0
                          ),
                          2
                        )}%
                      </TableCell>
                      <TableCell colSpan={3} className="text-xs text-body-c">
                        Reconciles to {activeKpiDrilldown === 'classA_spend' ? 'Class A' : 'Enterprise'} consumption base
                      </TableCell>
                    </>
                  )}
                </TableRow>
              </TableFooter>
            </Table>
          </div>
        </motion.div>
      )}

      {/* ===================================================================== */}
      {/* 4. PORTFOLIO ECONOMIC SEGMENTATION & CONTROL POLICY CARDS             */}
      {/* ===================================================================== */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-sm font-bold text-ink uppercase tracking-wider">
              Portfolio Economic Segmentation
            </h2>
            <p className="text-xs text-body-c">
              Segments {formatNum(TOTAL_CATALOG_SKUS, 0)} materials by Annual Consumption Value (Annual Demand × Unit Cost) into economic tiers. ABC measures economic importance, not standalone stockout risk.
            </p>
          </div>
          <Badge tone="neutral" className="hidden sm:inline-flex">
            {formatNum(TOTAL_CATALOG_SKUS, 0)} SKUs Total
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Class A */}
          <div className="card bg-surface border-2 border-primary/40 rounded-md p-4 shadow-subtle flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-2">
                <Badge tone="accent">{PORTFOLIO_SEGMENTS.A.tierName}</Badge>
                <span className="font-mono text-xs font-bold text-primary">A-Tier</span>
              </div>
              <div className="kpi__value text-2xl font-bold font-mono text-ink mt-2 mb-1">
                {formatCurrency(PORTFOLIO_SEGMENTS.A.annualConsumptionValue, 2)}/yr
              </div>
              <p className="card__sub text-xs text-body-c leading-normal">
                {formatNum(PORTFOLIO_SEGMENTS.A.consumptionSharePct)}% value · {PORTFOLIO_SEGMENTS.A.skuCount} SKUs ({formatNum(PORTFOLIO_SEGMENTS.A.skuSharePct)}%) · {formatCurrency(PORTFOLIO_SEGMENTS.A.physicalStockValue, 2)} physical stock
              </p>
            </div>
            <div className="mt-3 pt-2.5 border-t border-border">
              <p className="text-xs text-ink leading-snug">
                {PORTFOLIO_SEGMENTS.A.policySummary}
              </p>
            </div>
          </div>

          {/* Class B */}
          <div className="card bg-surface border border-border rounded-md p-4 shadow-subtle flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-2">
                <Badge tone="neutral">{PORTFOLIO_SEGMENTS.B.tierName}</Badge>
                <span className="font-mono text-xs font-bold text-subtle">B-Tier</span>
              </div>
              <div className="kpi__value text-2xl font-bold font-mono text-ink mt-2 mb-1">
                {formatCurrency(PORTFOLIO_SEGMENTS.B.annualConsumptionValue, 2)}/yr
              </div>
              <p className="card__sub text-xs text-body-c leading-normal">
                {formatNum(PORTFOLIO_SEGMENTS.B.consumptionSharePct)}% value · {PORTFOLIO_SEGMENTS.B.skuCount} SKUs ({formatNum(PORTFOLIO_SEGMENTS.B.skuSharePct)}%) · {formatCurrency(PORTFOLIO_SEGMENTS.B.physicalStockValue, 2)} physical stock
              </p>
            </div>
            <div className="mt-3 pt-2.5 border-t border-border">
              <p className="text-xs text-ink leading-snug">
                {PORTFOLIO_SEGMENTS.B.policySummary}
              </p>
            </div>
          </div>

          {/* Class C */}
          <div className="card bg-surface border border-border rounded-md p-4 shadow-subtle flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-2">
                <Badge tone="neutral">{PORTFOLIO_SEGMENTS.C.tierName}</Badge>
                <span className="font-mono text-xs font-bold text-subtle">C-Tier</span>
              </div>
              <div className="kpi__value text-2xl font-bold font-mono text-ink mt-2 mb-1">
                {formatCurrency(PORTFOLIO_SEGMENTS.C.annualConsumptionValue, 2)}/yr
              </div>
              <p className="card__sub text-xs text-body-c leading-normal">
                {formatNum(PORTFOLIO_SEGMENTS.C.consumptionSharePct)}% value · {PORTFOLIO_SEGMENTS.C.skuCount} SKUs ({formatNum(PORTFOLIO_SEGMENTS.C.skuSharePct)}%) · {formatCurrency(PORTFOLIO_SEGMENTS.C.physicalStockValue, 2)} physical stock
              </p>
            </div>
            <div className="mt-3 pt-2.5 border-t border-border">
              <p className="text-xs text-ink leading-snug">
                {PORTFOLIO_SEGMENTS.C.policySummary}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* 5. CUMULATIVE VALUE PARETO VISUALIZATION                              */}
      {/* ===================================================================== */}
      <div className="card bg-surface border border-border rounded-md p-5 shadow-subtle">
        <div className="card__head flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-3">
          <div>
            <h2 className="card__title text-sm font-bold text-ink">
              Cumulative Annual Consumption Value Contribution (Pareto)
            </h2>
            <p className="card__sub text-xs text-body-c">
              {persona === 'ds'
                ? `Empirical cumulative distribution: Class A (${formatNum(PORTFOLIO_SEGMENTS.A.consumptionSharePct)}%), Class B (${formatNum(PORTFOLIO_SEGMENTS.A.consumptionSharePct + PORTFOLIO_SEGMENTS.B.consumptionSharePct)}%), Class C tail (100.00%).`
                : persona === 'analyst'
                ? `${PORTFOLIO_SEGMENTS.A.skuCount} Class A materials (${formatCurrency(PORTFOLIO_SEGMENTS.A.annualConsumptionValue, 2)} consumption value) prioritize weekly review queues.`
                : `Class A materials represent ${formatNum(PORTFOLIO_SEGMENTS.A.consumptionSharePct)}% (${formatCurrency(PORTFOLIO_SEGMENTS.A.annualConsumptionValue, 2)}) of total annual consumption spend.`}
            </p>
          </div>
          {persona === 'ds' && (
            <Badge tone="neutral" className="self-start sm:self-auto">
              Gini Index {GINI_COEFFICIENT.toFixed(2)}
            </Badge>
          )}
          {persona === 'analyst' && (
            <Badge tone="accent" className="self-start sm:self-auto">
              {PORTFOLIO_SEGMENTS.A.skuCount} Class A SKUs
            </Badge>
          )}
          {persona === 'exec' && (
            <Badge tone="neutral" className="self-start sm:self-auto">
              {formatNum(PORTFOLIO_SEGMENTS.A.consumptionSharePct)}% Value in {formatNum(PORTFOLIO_SEGMENTS.A.skuSharePct)}% SKUs
            </Badge>
          )}
        </div>

        <div className="chart-shell mb-1">
          <ParetoChart />
        </div>

        {/* DS Deep Analytical Boundary & Sensitivity Inspection (Collapsed) */}
        {persona === 'ds' && (
          <DrillDown
            defaultOpen={false}
            title="Classification Boundary & Parameter Sensitivity Analysis"
            hint="Cutoffs, cumulative percentiles, and boundary stability"
            className="mt-3"
          >
            <div className="space-y-3 pt-2">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                <div className="p-3 bg-bg rounded border border-border">
                  <span className="text-subtle font-semibold uppercase tracking-wider block mb-1">
                    Class A Boundary
                  </span>
                  <div className="font-mono font-bold text-ink text-sm">
                    ≤ {formatNum(PORTFOLIO_SEGMENTS.A.consumptionSharePct)}% Cumulative ({formatCurrency(PORTFOLIO_SEGMENTS.A.annualConsumptionValue, 2)})
                  </div>
                  <p className="text-body-c mt-1 leading-snug">
                    {PORTFOLIO_SEGMENTS.A.skuCount} materials · Steepest gradient on Pareto curve.
                  </p>
                </div>
                <div className="p-3 bg-bg rounded border border-border">
                  <span className="text-subtle font-semibold uppercase tracking-wider block mb-1">
                    Class B Boundary
                  </span>
                  <div className="font-mono font-bold text-ink text-sm">
                    {formatNum(PORTFOLIO_SEGMENTS.A.consumptionSharePct)}% – {formatNum(PORTFOLIO_SEGMENTS.A.consumptionSharePct + PORTFOLIO_SEGMENTS.B.consumptionSharePct)}% ({formatCurrency(PORTFOLIO_SEGMENTS.A.annualConsumptionValue + PORTFOLIO_SEGMENTS.B.annualConsumptionValue, 2)})
                  </div>
                  <p className="text-body-c mt-1 leading-snug">
                    {PORTFOLIO_SEGMENTS.B.skuCount} materials · Transition regime.
                  </p>
                </div>
                <div className="p-3 bg-bg rounded border border-border">
                  <span className="text-subtle font-semibold uppercase tracking-wider block mb-1">
                    Class C Tail
                  </span>
                  <div className="font-mono font-bold text-ink text-sm">
                    {formatNum(PORTFOLIO_SEGMENTS.A.consumptionSharePct + PORTFOLIO_SEGMENTS.B.consumptionSharePct)}% – 100.00% ({formatCurrency(ENTERPRISE_TOTAL_CONSUMPTION_VALUE, 2)})
                  </div>
                  <p className="text-body-c mt-1 leading-snug">
                    {PORTFOLIO_SEGMENTS.C.skuCount} materials · Asymptotic tail ({formatNum(PORTFOLIO_SEGMENTS.C.skuSharePct)}% of catalog).
                  </p>
                </div>
              </div>
              <p className="text-xs text-body-c leading-relaxed bg-bg/50 p-2.5 rounded border border-dashed border-border">
                <strong className="text-ink">Boundary Invariance:</strong> Stability analysis across trailing quarters shows empirical boundary cutoff consistency with zero unexpected tier migrations among threshold-adjacent materials.
              </p>
            </div>
          </DrillDown>
        )}
      </div>

      {/* ===================================================================== */}
      {/* 6. INVENTORY ANALYST CLASS A EXCEPTION QUEUE (FOR ANALYST ONLY)       */}
      {/* ===================================================================== */}
      {persona === 'analyst' && (
        <Card className="border-border">
          <CardHead
            title="Class A Operational Exception Queue"
            sub="Prioritized material surveillance matrix cross-referencing ABC class with stock buffer status, lead-time latency, and downstream exposure."
            right={
              <Badge tone="accent">
                {activeExceptionsCount} Active Exceptions
              </Badge>
            }
          />
          <div className="rounded-sm border border-border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Material</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead className="text-right font-mono">Stock / DOS</TableHead>
                  <TableHead className="text-right font-mono">Lead Time</TableHead>
                  <TableHead className="text-right font-mono">Demand CV</TableHead>
                  <TableHead className="text-right font-mono">Downstream</TableHead>
                  <TableHead>Exception Signal</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.values(MATERIAL_INTELLIGENCE).map((item) => {
                  const isSelected = item.id === mat.id;
                  const itemDailyDemand = item.annualDemand > 0 ? item.annualDemand / 365 : 0;
                  const itemDos = itemDailyDemand > 0 ? item.onHandQty / itemDailyDemand : 0;
                  return (
                    <TableRow key={item.id} className={isSelected ? 'bg-primary-subtle/20 font-medium' : ''}>
                      <TableCell className="font-bold text-ink">
                        {item.id} · <span className="font-normal text-body-c">{item.name}</span>
                      </TableCell>
                      <TableCell><Badge tone={item.abcClass === 'A' ? 'accent' : 'neutral'}>Class {item.abcClass}</Badge></TableCell>
                      <TableCell className="text-right font-mono">{formatNum(itemDos, 1)}d DOS</TableCell>
                      <TableCell className="text-right font-mono">{item.leadTimeDays}d</TableCell>
                      <TableCell className="text-right font-mono">{formatNum(item.demandCV)}</TableCell>
                      <TableCell className="text-right font-mono">{item.downstreamProductsCount} lines</TableCell>
                      <TableCell><Badge tone={item.statusTone}>{item.statusTag}</Badge></TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant={isSelected ? 'primary' : 'outline'}
                          size="xs"
                          onClick={() => setSelectedMaterialId && setSelectedMaterialId(item.id)}
                        >
                          {isSelected ? 'Active' : 'Inspect'}
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}

      {/* ===================================================================== */}
      {/* 7. SELECTED MATERIAL CONTEXTUAL INTELLIGENCE LAYER                    */}
      {/* ===================================================================== */}
      <div className="card bg-surface border border-border rounded-md p-5 shadow-subtle">
        {/* Material Selection Pills & Active Context Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 mb-3 border-b border-border">
          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h2 className="text-base font-bold text-ink m-0">
                {mat.id} · {mat.name}
              </h2>
              <Badge tone={mat.abcClass === 'A' ? 'accent' : 'neutral'}>
                Class {mat.abcClass}
              </Badge>
              <Badge tone="neutral">{mat.category}</Badge>
            </div>
            <p className="text-xs text-body-c m-0">
              {mat.plant} · Feeds {mat.downstreamProductsCount} downstream product lines.
            </p>
          </div>

          {/* Material Switcher Pills */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs text-subtle font-medium mr-1">Switch:</span>
            {Object.values(MATERIAL_INTELLIGENCE).map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setSelectedMaterialId && setSelectedMaterialId(m.id)}
                className={`px-2.5 py-1 text-xs font-mono font-medium rounded-sm border transition-all ${
                  m.id === mat.id
                    ? 'bg-primary-solid text-white border-primary shadow-sm'
                    : 'bg-bg text-ink border-border hover:border-primary/60'
                }`}
              >
                {m.id}
              </button>
            ))}
          </div>
        </div>

        {/* Selected Material Persona Output Interpretation Statement */}
        <div className="mb-4 px-3.5 py-2.5 bg-bg/80 rounded-sm border border-border text-xs text-body-c leading-relaxed">
          {persona === 'ds' && (
            <p className="m-0">
              <strong className="text-ink">Analytical Output:</strong> {mat.id} ranks #{mat.valueRank} (top {formatNum(100 - mat.percentile, 1)}% percentile) with {formatCurrency(mat.annualConsumptionValue)}/yr consumption value ({formatNum(enterpriseValueShare)}% portfolio share), reconciling derived demand across {mat.downstreamProductsCount} downstream lines.
            </p>
          )}
          {persona === 'analyst' && (
            <p className="m-0">
              <strong className="text-ink">Operational Output:</strong> {mat.id} generates {formatCurrency(mat.annualConsumptionValue)}/yr consumption value ({formatNum(mat.annualDemand, 0)} {mat.uom}/yr); current on-hand stock ({formatNum(daysOfSupply, 1)}d DOS) {daysOfSupply < mat.leadTimeDays ? `is below the ${mat.leadTimeDays}d transit lead time, exposing ${mat.downstreamProductsCount} lines to stockout latency.` : `covers the ${mat.leadTimeDays}d transit lead time across ${mat.downstreamProductsCount} assembly lines.`}
            </p>
          )}
          {persona === 'exec' && (
            <p className="m-0">
              <strong className="text-ink">Executive Output:</strong> {mat.id} accounts for {formatCurrency(mat.annualConsumptionValue)} ({formatNum(enterpriseValueShare)}%) of annual consumption spend and {formatCurrency(mat.onHandValue)} physical inventory capital, anchoring {mat.downstreamProductsCount} commercial product lines.
            </p>
          )}
        </div>

        {/* Selected Material KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mb-5">
          {persona === 'ds' && (
            <>
              <KpiTile
                label="Annual Consumption Value"
                value={formatCurrency(mat.annualConsumptionValue)}
                sub={`Rank #${mat.valueRank} · Top ${formatNum(100 - mat.percentile, 1)}% percentile`}
              />
              <KpiTile
                label="Classification Position"
                value={`Class ${mat.abcClass}`}
                sub={`A-cutoff at ${formatNum(PORTFOLIO_SEGMENTS.A.consumptionSharePct)}% cumulative value`}
              />
              <KpiTile
                label="Physical Inventory Value"
                value={formatCurrency(mat.onHandValue)}
                sub={`${formatNum(mat.onHandQty, 0)} ${mat.uom} on-hand`}
              />
              <KpiTile
                label="Demand CV & Lead Time"
                value={`CV ${formatNum(mat.demandCV)} · ${mat.leadTimeDays}d LT`}
                sub={mat.demandCV <= 0.15 ? 'Stable demand profile' : 'Elevated volatility'}
              />
            </>
          )}

          {persona === 'analyst' && (
            <>
              <KpiTile
                label="Annual Consumption Value"
                value={formatCurrency(mat.annualConsumptionValue)}
                sub={`${formatNum(mat.annualDemand, 0)} ${mat.uom}/yr × ${formatCurrency(mat.unitCost)}`}
              />
              <KpiTile
                label="Stock & Days of Supply"
                value={formatCurrency(mat.onHandValue)}
                sub={`${formatNum(mat.onHandQty, 0)} ${mat.uom} · ${formatNum(daysOfSupply, 1)}d DOS`}
              />
              <KpiTile
                label="Lead Time & Buffer Status"
                value={`${mat.leadTimeDays} Days LT`}
                sub={daysOfSupply < mat.leadTimeDays ? `Buffer deficit (${formatNum(daysOfSupply, 1)}d < ${mat.leadTimeDays}d)` : `Buffer covers lead time (${formatNum(daysOfSupply, 1)}d >= ${mat.leadTimeDays}d)`}
                valueStyle={daysOfSupply < mat.leadTimeDays ? { color: 'var(--error-tx)' } : undefined}
              />
              <KpiTile
                label="Control Policy"
                value={mat.abcClass === 'A' ? 'Weekly Review' : 'Quarterly Review'}
                sub={`Configured Target: ${mat.abcClass === 'A' ? '98.50%' : '90.00%'} service`}
              />
            </>
          )}

          {persona === 'exec' && (
            <>
              <KpiTile
                label="Annual Consumption Spend"
                value={formatCurrency(mat.annualConsumptionValue)}
                sub={`${formatNum(enterpriseValueShare)}% of total enterprise spend`}
              />
              <KpiTile
                label="Physical Inventory Capital"
                value={formatCurrency(mat.onHandValue)}
                sub={`${formatNum(physicalStockShare)}% of enterprise stock`}
              />
              <KpiTile
                label="Downstream Lines Exposed"
                value={`${mat.downstreamProductsCount} Lines`}
                sub={`Top line: ${highestExposureProduct?.product.split('(')[0].trim()}`}
              />
              <KpiTile
                label="Sourcing Risk"
                value={mat.supplier.includes('Sole Source') ? 'Sole Source' : mat.supplier.includes('Allocated') ? 'Allocated' : 'Dual Sourced'}
                sub={mat.criticality.split('(')[0].trim()}
                valueStyle={mat.supplier.includes('Sole Source') || mat.supplier.includes('Allocated') ? { color: 'var(--warning-tx)' } : undefined}
              />
            </>
          )}
        </div>

        {/* =================================================================== */}
        {/* 8. DOWNSTREAM PRODUCT DEPENDENCY PRESENTATION                       */}
        {/* =================================================================== */}

        {/* --- DATA SCIENTIST: Collapsed Demand Reconciliation DrillDown --- */}
        {persona === 'ds' && (
          <DrillDown
            defaultOpen={false}
            title="View Downstream Demand Reconciliation"
            hint="Product demand, BOM usage, derived material demand, and value contribution"
          >
            <div className="rounded-sm border border-border overflow-x-auto mt-2">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Downstream Product / Assembly</TableHead>
                    <TableHead>Product Category / Line</TableHead>
                    <TableHead className="text-right font-mono">BOM Usage</TableHead>
                    <TableHead className="text-right font-mono">Product Plan</TableHead>
                    <TableHead className="text-right font-mono">Derived Demand</TableHead>
                    <TableHead className="text-right font-mono">Share</TableHead>
                    <TableHead className="text-right font-mono">Annual Value</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mat.downstreamProducts.map((p, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="font-bold text-ink">{p.product}</TableCell>
                      <TableCell>
                        <Badge tone="neutral">{p.type}</Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {formatNum(p.bomQty, p.bomQty < 1 ? 2 : 1)} {mat.uom}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {formatNum(p.productDemand, p.productDemand % 1 === 0 ? 0 : 1)} units/yr
                      </TableCell>
                      <TableCell className="text-right font-mono font-bold text-ink">
                        {formatNum(p.derivedConsumption, 0)} {mat.uom}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        <Badge tone="accent">{formatNum(p.sharePct)}%</Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono font-bold text-ink">
                        {formatCurrency(p.derivedValue)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                <TableFooter>
                  <TableRow>
                    <TableCell colSpan={4} className="font-bold text-ink">
                      Aggregate Reconciled Demand Across All {mat.downstreamProductsCount} Products
                    </TableCell>
                    <TableCell className="text-right font-mono font-bold text-primary">
                      {formatNum(totalDerivedDemand, 0)} {mat.uom}/yr
                    </TableCell>
                    <TableCell className="text-right font-mono font-bold text-ink">
                      <Badge tone="neutral">{formatNum(totalSharePct)}%</Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono font-bold text-ink">
                      {formatCurrency(totalDerivedValue)}/yr
                    </TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            </div>
          </DrillDown>
        )}

        {/* --- INVENTORY ANALYST: Concise Operational Dependency Table --- */}
        {persona === 'analyst' && (
          <div className="mb-2">
            <div className="flex justify-between items-baseline mb-2">
              <h3 className="text-xs font-bold text-ink uppercase tracking-wider">
                Operational Dependency & Line Exposure ({mat.id})
              </h3>
              <span className="text-xs text-body-c font-mono">
                {mat.downstreamProductsCount} Dependent Assembly Lines
              </span>
            </div>

            <div className="rounded-sm border border-border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Downstream Equipment Line</TableHead>
                    <TableHead>Line Classification</TableHead>
                    <TableHead className="text-right font-mono">BOM Usage & Demand</TableHead>
                    <TableHead className="text-right font-mono">Volume Share</TableHead>
                    <TableHead className="text-right font-mono">Annual Value</TableHead>
                    <TableHead>Line Stoppage Exposure</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mat.downstreamProducts.map((p, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="font-bold text-ink">{p.product}</TableCell>
                      <TableCell>
                        <Badge tone="neutral">{p.type}</Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs">
                        <span className="font-bold text-ink">{formatNum(p.derivedConsumption, 0)} {mat.uom}/yr</span>
                        <span className="text-subtle block text-[11px]">({formatNum(p.bomQty, p.bomQty < 1 ? 2 : 1)} / unit)</span>
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        <Badge tone={p.sharePct >= 30 ? 'accent' : 'neutral'}>
                          {formatNum(p.sharePct)}%
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono font-bold text-ink">
                        {formatCurrency(p.derivedValue)}
                      </TableCell>
                      <TableCell className="text-xs text-body-c leading-tight">
                        {p.lineRisk}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                <TableFooter>
                  <TableRow>
                    <TableCell colSpan={2} className="font-bold text-ink">
                      Total Operational Commitment
                    </TableCell>
                    <TableCell className="text-right font-mono font-bold text-primary">
                      {formatNum(totalDerivedDemand, 0)} {mat.uom}/yr
                    </TableCell>
                    <TableCell className="text-right font-mono font-bold text-ink">
                      100.00%
                    </TableCell>
                    <TableCell className="text-right font-mono font-bold text-ink">
                      {formatCurrency(totalDerivedValue)}/yr
                    </TableCell>
                    <TableCell className="text-xs font-semibold text-primary">
                      {mat.downstreamProductsCount} Assembly Lines Protected
                    </TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            </div>
          </div>
        )}

        {/* --- C-SUITE: Compact Business Exposure Summary + Collapsed DrillDown --- */}
        {persona === 'exec' && (
          <div className="space-y-3">
            <div className="p-3.5 bg-bg/80 rounded-md border border-border">
              <h3 className="text-xs font-bold text-ink uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                <ShieldCheck size={14} className="text-primary" />
                Downstream Revenue Line Exposure
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="p-3 bg-surface rounded border border-border">
                  <span className="text-[11px] text-subtle font-semibold uppercase tracking-wider block mb-0.5">
                    Dependent Finished Lines
                  </span>
                  <div className="text-base font-bold text-ink font-mono">
                    {mat.downstreamProductsCount} Product Lines
                  </div>
                  <p className="text-xs text-body-c mt-0.5">
                    {mat.downstreamSummary}
                  </p>
                </div>
                <div className="p-3 bg-surface rounded border border-border">
                  <span className="text-[11px] text-subtle font-semibold uppercase tracking-wider block mb-0.5">
                    Highest Exposed Line
                  </span>
                  <div className="text-sm font-bold text-ink truncate">
                    {highestExposureProduct?.product}
                  </div>
                  <p className="text-xs text-body-c mt-0.5">
                    {formatCurrency(highestExposureProduct?.derivedValue ?? 0)} ({formatNum(highestExposureProduct?.sharePct ?? 0)}% share)
                  </p>
                </div>
                <div className="p-3 bg-surface rounded border border-border">
                  <span className="text-[11px] text-subtle font-semibold uppercase tracking-wider block mb-0.5">
                    Aggregate Spend Exposed
                  </span>
                  <div className="text-base font-bold text-primary font-mono">
                    {formatCurrency(totalDerivedValue)}/yr
                  </div>
                  <p className="text-xs text-body-c mt-0.5">
                    100.00% derived demand reconciliation
                  </p>
                </div>
              </div>
            </div>

            {/* Drill-down for full BOM breakdown on demand */}
            <DrillDown
              defaultOpen={false}
              title={`View SKU-Level BOM Breakdown (${mat.downstreamProductsCount} Products)`}
              hint="Line-by-line derived demand reconciliation"
            >
              <div className="rounded-sm border border-border overflow-x-auto mt-2">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Downstream Product / Assembly</TableHead>
                      <TableHead>Category / Line</TableHead>
                      <TableHead className="text-right font-mono">BOM Usage</TableHead>
                      <TableHead className="text-right font-mono">Derived Demand</TableHead>
                      <TableHead className="text-right font-mono">Share</TableHead>
                      <TableHead className="text-right font-mono">Annual Value</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mat.downstreamProducts.map((p, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="font-bold text-ink">{p.product}</TableCell>
                        <TableCell>
                          <Badge tone="neutral">{p.type}</Badge>
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {formatNum(p.bomQty, p.bomQty < 1 ? 2 : 1)} {mat.uom}
                        </TableCell>
                        <TableCell className="text-right font-mono font-bold text-ink">
                          {formatNum(p.derivedConsumption, 0)} {mat.uom}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          <Badge tone="accent">{formatNum(p.sharePct)}%</Badge>
                        </TableCell>
                        <TableCell className="text-right font-mono font-bold text-ink">
                          {formatCurrency(p.derivedValue)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                  <TableFooter>
                    <TableRow>
                      <TableCell colSpan={3} className="font-bold text-ink">
                        Aggregate Reconciled Demand
                      </TableCell>
                      <TableCell className="text-right font-mono font-bold text-primary">
                        {formatNum(totalDerivedDemand, 0)} {mat.uom}/yr
                      </TableCell>
                      <TableCell className="text-right font-mono font-bold text-ink">
                        100.00%
                      </TableCell>
                      <TableCell className="text-right font-mono font-bold text-ink">
                        {formatCurrency(totalDerivedValue)}/yr
                      </TableCell>
                    </TableRow>
                  </TableFooter>
                </Table>
              </div>
            </DrillDown>
          </div>
        )}
      </div>

      {/* ===================================================================== */}
      {/* 9. PERSONA-TUNED MULTI-DIMENSIONAL WHY DISCLOSURE (COLLAPSED DEFAULT) */}
      {/* ===================================================================== */}
      <div className="card bg-surface border border-border rounded-md p-5 shadow-subtle">
        <h2 className="card__title text-sm font-bold text-ink mb-1">
          Why {mat.id} ({mat.name}) Anchors ABC Class {mat.abcClass} Governance
        </h2>
        <WhyDisclosure
          defaultOpen={false}
          summary="Driver breakdown & Multi-Dimensional Segmentation Rationale"
          drivers={[
            `Economic Importance (ABC Basis): ${formatCurrency(mat.annualConsumptionValue)} Annual Consumption Value (${formatNum(mat.annualDemand, 0)} ${mat.uom}/yr × ${formatCurrency(mat.unitCost)} · ${formatNum(enterpriseValueShare)}% portfolio share).`,
            `Physical Inventory Capital: ${formatCurrency(mat.onHandValue)} Physical On-Hand Stock (${formatNum(mat.onHandQty, 0)} ${mat.uom} · ${formatNum(daysOfSupply, 1)}d DOS · ${formatNum(physicalStockShare)}% of enterprise physical stock).`,
            `Downstream Business Dependency: Feeds ${mat.downstreamProductsCount} finished and semi-finished product lines (${mat.downstreamSummary}) reconciling 100.00% of material demand.`,
            `Operating & Risk Context: ${mat.leadTimeDays}d procurement lead time (${mat.supplier}) · Demand CV ${formatNum(mat.demandCV)} · Criticality: ${mat.criticality.split('(')[0].trim()}.`,
          ]}
          meaning={[
            persona === 'ds'
              ? 'Economic importance (Annual Demand × Unit Cost) strictly defines ABC classification without distortion from secondary inventory buffers or lead-time covariates.'
              : persona === 'analyst'
              ? `ABC classification establishes economic priority, while on-hand buffer (${formatNum(daysOfSupply, 1)}d DOS) against lead time (${mat.leadTimeDays}d) determines operational risk across ${mat.downstreamProductsCount} assembly lines.`
              : `High annual spend concentration (${formatCurrency(mat.annualConsumptionValue)}) and single-source dependency justify executive vendor oversight and capital monitoring.`,
            'Downstream production schedules act as derived demand drivers explaining 100.00% of aggregate material demand.',
          ]}
          action={[
            `Calibrate order batch quantities and replenishment intervals in lot-sizing analysis.`,
            mat.abcClass === 'A'
              ? 'Enforce weekly replenishment audits and 99.00% cycle-count verification.'
              : 'Maintain standard periodic review policy with automated replenishment triggers.',
            persona === 'exec'
              ? 'Evaluate vendor-managed inventory agreements to mitigate lead-time exposure.'
              : 'Synchronize procurement lead times with downstream Master Production Schedules.',
          ]}
        />
      </div>
    </section>
  );
}


