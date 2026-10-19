import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, PieChart, Layers, ShieldCheck, Box } from 'lucide-react';
import { ViewHead, WhyDisclosure, Badge, KpiTile, Insight } from '../../components/CommonUI';
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
import PersonaTop from '../../components/PersonaTop';

// ============================================================================
// CANONICAL MATERIAL INTELLIGENCE & DOWNSTREAM PRODUCT DEMAND BREAKDOWNS
// Each material has its own coherent, mathematically traceable downstream
// product relationships where:
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
    contextTag: 'Class A + High Downstream Dependency + Single-Source Lead Time',
    demandCV: 0.12,
    leadTimeDays: 60,
    supplier: 'HydraTech Dynamics GmbH (Sole Source)',
    criticality: 'Critical (Line-stoppage risk; custom hydraulic interface with zero rapid substitutes)',
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
      },
      {
        product: 'Industrial Loader IL-450',
        type: 'Tier-1 Finished Good',
        bomQty: 1.0,
        productDemand: 1152,
        derivedConsumption: 1152.0,
        sharePct: 24.0,
        derivedValue: 691200.0,
      },
      {
        product: 'Hydraulic Crane HC-80',
        type: 'Tier-1 Finished Good',
        bomQty: 1.0,
        productDemand: 816,
        derivedConsumption: 816.0,
        sharePct: 17.0,
        derivedValue: 489600.0,
      },
      {
        product: 'Mining Dumper MD-120',
        type: 'Specialized Finished Good',
        bomQty: 1.0,
        productDemand: 528,
        derivedConsumption: 528.0,
        sharePct: 11.0,
        derivedValue: 316800.0,
      },
      {
        product: '10 Other Assembly SKUs (Combined)',
        type: 'Secondary Finished Lines (10 SKUs)',
        bomQty: 1.0,
        productDemand: 816,
        derivedConsumption: 816.0,
        sharePct: 17.0,
        derivedValue: 489600.0,
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
    contextTag: 'Class A + High Volume Velocity + Multi-Pack Dependency',
    demandCV: 0.10,
    leadTimeDays: 30,
    supplier: 'Apex Energy Storage Ltd (Dual Sourced)',
    criticality: 'High (Core electrochemical feed for battery packs; strict cell-matching specs)',
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
      },
      {
        product: 'Standard Power Module PM-200',
        type: 'Intermediate Sub-Assembly',
        bomQty: 100.0,
        productDemand: 1176,
        derivedConsumption: 117600.0,
        sharePct: 28.0,
        derivedValue: 604464.0,
      },
      {
        product: 'Grid Storage Module ESS-50',
        type: 'Commercial Energy Storage',
        bomQty: 500.0,
        productDemand: 151.2,
        derivedConsumption: 75600.0,
        sharePct: 18.0,
        derivedValue: 388584.0,
      },
      {
        product: '5 Other Sub-Assembly Packs (Combined)',
        type: 'Auxiliary Battery Assemblies (5 SKUs)',
        bomQty: 50.0,
        productDemand: 1008,
        derivedConsumption: 50400.0,
        sharePct: 12.0,
        derivedValue: 259056.0,
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
    contextTag: 'Class A + Elevated Volatility + Long Supply Latency',
    demandCV: 0.28,
    leadTimeDays: 60,
    supplier: 'SiliconFoundry International (Allocated Supply)',
    criticality: 'Critical (Main embedded processor; semiconductor wafer lead-time risk)',
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
      },
      {
        product: 'Sensor Gateway Hub GW-80',
        type: 'Telematics Module',
        bomQty: 1.0,
        productDemand: 6000,
        derivedConsumption: 6000.0,
        sharePct: 25.0,
        derivedValue: 471900.0,
      },
      {
        product: 'Telematics Control Unit TM-12',
        type: 'IoT Connectivity Box',
        bomQty: 1.0,
        productDemand: 4560,
        derivedConsumption: 4560.0,
        sharePct: 19.0,
        derivedValue: 358644.0,
      },
      {
        product: '16 Other Controller Modules (Combined)',
        type: 'Subsystem Controllers (16 SKUs)',
        bomQty: 1.0,
        productDemand: 4320,
        derivedConsumption: 4320.0,
        sharePct: 18.0,
        derivedValue: 339768.0,
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
    contextTag: 'Class C + Low Economic Exposure + High Shelf-Life Sensitivity',
    demandCV: 0.15,
    leadTimeDays: 21,
    supplier: 'BondTech Polymer Solutions (Multi-Vendor)',
    criticality: 'Moderate (Standard assembly consumable; multiple equivalent approved formulations)',
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
      },
      {
        product: 'Crane & Dumper Line (HC/MD)',
        type: 'Housing Gasket Sealing',
        bomQty: 1.0,
        productDemand: 1920,
        derivedConsumption: 1920.0,
        sharePct: 32.0,
        derivedValue: 78988.8,
      },
      {
        product: 'Auxiliary Component Fabrication',
        type: 'Sub-Assembly Sealing (4 lines)',
        bomQty: 1.0,
        productDemand: 1440,
        derivedConsumption: 1440.0,
        sharePct: 24.0,
        derivedValue: 59241.6,
      },
    ],
  },
};

// XYZ = demand variability class (coefficient of variation). Thresholds are client-configurable.
const XYZ_LIMITS = { X: 0.15, Y: 0.3 };
const xyzClass = (cv) => (cv <= XYZ_LIMITS.X ? 'X' : cv <= XYZ_LIMITS.Y ? 'Y' : 'Z');
const XYZ_LABEL = { X: 'Stable', Y: 'Variable', Z: 'Erratic' };

// Criticality is an explicit model, never inferred from value: line stoppage, substitutability and supply route.
const criticalityFlag = (m) => m.criticality.split(' ')[0];

// Portfolio counts by ABC × XYZ, with how many SKUs in each cell are flagged Critical (illustrative).
const SEGMENT_MATRIX = {
  A: { X: { skus: 62, critical: 9 }, Y: { skus: 54, critical: 11 }, Z: { skus: 26, critical: 6 } },
  B: { X: { skus: 110, critical: 4 }, Y: { skus: 128, critical: 7 }, Z: { skus: 60, critical: 5 } },
  C: { X: { skus: 300, critical: 3 }, Y: { skus: 420, critical: 6 }, Z: { skus: 260, critical: 4 } },
};
// Strategy per cell, and where today's policy does not match it.
const SEGMENT_STRATEGY = {
  A: { X: 'Tight ROP, weekly review', Y: 'Safety stock on variability', Z: 'Order to forecast, expedite plan' },
  B: { X: 'Periodic review', Y: 'Periodic review + buffer', Z: 'Buffer or make-to-order' },
  C: { X: 'Two-bin / Kanban', Y: 'Two-bin, larger bin', Z: 'Order on demand' },
};
const POLICY_GAP = { 'C-Z': 'Critical items still on two-bin', 'A-Z': 'Safety stock not sized for variability' };

const ABC_SAFEGUARD = 'Criticality comes from an explicit model (line stoppage, substitutes, supply route), never from value alone: a low-cost seal can stop a line. ABC and XYZ thresholds are client-configurable.';

const ENTERPRISE_TOTAL_CONSUMPTION_VALUE = 43860000.0;
const ENTERPRISE_PHYSICAL_ON_HAND_VALUE = 13710000.0;

export default function AbcClassification() {
  const navigate = useNavigate();
  const { persona, selectedMaterial } = usePlatform();
  const shouldReduceMotion = useReducedMotion();

  const matKey = selectedMaterial?.id || 'MAT-1082';
  const mat = MATERIAL_INTELLIGENCE[matKey] || MATERIAL_INTELLIGENCE['MAT-1082'];

  const formatNum = (val, decimals = 2) =>
    val.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  const formatCurrency = (val, decimals = 2) =>
    `$${val.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`;

  const trackedMaterials = Object.values(MATERIAL_INTELLIGENCE);
  const criticalMaterials = trackedMaterials.filter((m) => m.criticality.startsWith('Critical'));
  const classAMaterials = trackedMaterials.filter((m) => m.abcClass === 'A');
  const classACVMin = Math.min(...classAMaterials.map((m) => m.demandCV));
  const classACVMax = Math.max(...classAMaterials.map((m) => m.demandCV));
  const constrainedSourceCount = trackedMaterials.filter((m) => /Sole|Allocated|Dual/.test(m.supplier)).length;

  const enterpriseValueShare = (mat.annualConsumptionValue / ENTERPRISE_TOTAL_CONSUMPTION_VALUE) * 100;
  const physicalStockShare = (mat.onHandValue / ENTERPRISE_PHYSICAL_ON_HAND_VALUE) * 100;

  const totalDerivedDemand = mat.downstreamProducts.reduce((sum, p) => sum + p.derivedConsumption, 0);
  const totalDerivedValue = mat.downstreamProducts.reduce((sum, p) => sum + p.derivedValue, 0);
  const totalSharePct = mat.downstreamProducts.reduce((sum, p) => sum + p.sharePct, 0);

  const coverDays = (m) => m.onHandQty / (m.annualDemand / 365);
  const weakCover = trackedMaterials.filter((m) => criticalityFlag(m) === 'Critical' && coverDays(m) < m.leadTimeDays);
  const M = ({ children }) => <span className="font-mono font-bold text-ink">{children}</span>;

  // Blueprint P0 for Screen 3: which materials need most attention, and what strategy each needs.
  const abcTop = {
    head: {
      label: 'Head of Supply Chain · Valuable and Critical Materials With Weak Coverage',
      headline: <><M>7 critical materials</M> across the network have less cover than their lead time, putting <M>12 production orders</M> and <M>$1.82M</M> at risk. Value is concentrated: <M>10%</M> of materials hold <M>78%</M> of consumption value, but 13 of the 55 critical materials sit in Class B or C.</>,
      kpis: [
        { label: 'Critical below coverage', value: '7 materials', delta: 'cover < lead time', deltaTone: 'down', sub: `${weakCover.map((m) => m.id).join(', ')} among them` },
        { label: 'Orders affected', value: '12 orders', sub: 'Next 30 days' },
        { label: 'Value at risk', value: '$1.82M', sub: 'Revenue on affected orders' },
        { label: 'Class A share', value: '78.3%', sub: '$34.28M · 142 of 1,420 SKUs' },
      ],
      next: { action: 'Approve a coverage exception review for the 7 critical materials', owner: 'Head of Supply Chain', due: 'This week' },
    },
    inventory: {
      label: 'Inventory / Materials Manager · Classes, Criticality Flags and Count Priorities',
      headline: <>The count plan follows value only, so <M>10 critical Class C items</M> are counted quarterly. Move them, and the <M>26 erratic Class A items</M>, to the weekly cycle count. Class C still holds <M>980 SKUs</M> for 6.4% of value.</>,
      kpis: [
        { label: 'A / B / C share of value', value: '78 / 15 / 6%', sub: '142 / 298 / 980 SKUs' },
        { label: 'Critical flags', value: '55 materials', sub: '26 A · 16 B · 13 C' },
        { label: 'Count priority gaps', value: '10 items', delta: 'critical C on quarterly count', deltaTone: 'down', sub: 'Move to weekly' },
        { label: 'Erratic (Z) Class A', value: '26 SKUs', sub: 'Highest count-error exposure' },
      ],
      next: { action: 'Re-sequence the cycle-count plan by criticality, then value', owner: 'Inventory / Materials Manager', due: 'Before next count cycle' },
    },
    planner: {
      label: 'Production / Materials Planner · Critical, Volatile or Unreliable-Supply Components',
      headline: <><M>MAT-4120</M> is critical, variable (CV 0.28) and on allocated supply, with <M>14 days</M> of cover against a 60-day lead time. It feeds 19 controller SKUs. <M>17 critical materials</M> are in the Y or Z demand classes and need buffers sized for variability.</>,
      kpis: [
        { label: 'Critical + variable (Y/Z)', value: '17 materials', sub: '11 AY · 6 AZ' },
        { label: 'Critical below coverage', value: '7 materials', delta: '12 orders affected', deltaTone: 'down', sub: 'Next 30 days' },
        { label: 'Unreliable supply', value: '3 of 4 tracked', sub: 'Sole, allocated or dual source' },
        { label: 'Worst case', value: 'MAT-4120', delta: '14d cover vs 60d LT', deltaTone: 'down', sub: '19 downstream SKUs' },
      ],
      next: { action: 'Put MAT-4120 on daily shortage review and resequence orders that do not use it', owner: 'Production / Materials Planner', due: 'Today' },
    },
    procurement: {
      label: 'Procurement / Sourcing Manager · High-Value, Long-Lead, Single-Source Materials',
      headline: <><M>{constrainedSourceCount} of {trackedMaterials.length}</M> tracked materials come from a sole, allocated or limited source, all with <M>60-day</M> lead times. Across the portfolio, <M>38 Class A materials</M> are single-sourced with lead times over 45 days: a delay there has no buffer to absorb it.</>,
      kpis: [
        { label: 'Single-source Class A', value: '38 materials', sub: '$11.6M consumption value' },
        { label: 'Long lead (> 45 days)', value: '52 materials', sub: '31 also critical' },
        { label: 'Tracked constrained sources', value: `${constrainedSourceCount} of ${trackedMaterials.length}`, sub: 'Sole · allocated · dual' },
        { label: 'Second-source candidates', value: '9 materials', delta: 'Critical + sole + A', deltaTone: 'down', sub: 'Qualify first' },
      ],
      next: { action: 'Start second-source qualification on the 9 critical, sole-source Class A materials', owner: 'Procurement / Sourcing Manager', due: 'This quarter' },
    },
  };

  return (
    <section className="view max-w-7xl mx-auto">
      <ViewHead
        title="ABC–XYZ & Criticality"
        subtitle={
          <p className="text-body-c leading-relaxed">
            Which materials need most attention, and what strategy each needs: <strong>ABC</strong> by annual consumption value across the $43.86M portfolio, <strong>XYZ</strong> by demand variability, and an explicit <strong>criticality</strong> flag.
          </p>
        }
        actions={
          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate('/app/eoq')}
            className="gap-1.5"
          >
            <span>Open EOQ for {mat.id}</span>
            <ArrowRight size={13} />
          </Button>
        }
      />

      <PersonaTop persona={persona} config={abcTop} safeguard={ABC_SAFEGUARD} />

      {/* 1. Portfolio Segmentation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="card bg-surface border-2 border-primary/40 rounded-md p-5 shadow-subtle relative overflow-hidden">
          <Badge tone="accent">Class A · High Governance</Badge>
          <div className="kpi__value text-2xl font-bold font-mono text-ink mt-2.5 mb-1">$34.28M</div>
          <p className="card__sub text-xs text-body-c">78.30% of annual consumption value · 142 SKUs (10.00% of catalog)</p>
          <p className="text-xs text-ink mt-3 pt-3 border-t border-border leading-relaxed">
            Weekly review cadence · Cycle-counting accuracy target 99.00% · Target service level 98.00–99.00% · High-governance replenishment control.
          </p>
        </div>

        <div className="card bg-surface border border-border rounded-md p-5 shadow-subtle">
          <Badge tone="neutral">Class B · Periodic Control</Badge>
          <div className="kpi__value text-2xl font-bold font-mono text-ink mt-2.5 mb-1">$6.71M</div>
          <p className="card__sub text-xs text-body-c">15.30% of annual consumption value · 298 SKUs (21.00% of catalog)</p>
          <p className="text-xs text-ink mt-3 pt-3 border-t border-border leading-relaxed">
            Monthly review cadence · Cycle-counting accuracy target 95.00% · Target service level 95.00% · Standard batch replenishment policy.
          </p>
        </div>

        <div className="card bg-surface border border-border rounded-md p-5 shadow-subtle">
          <Badge tone="neutral">Class C · Automated / Two-Bin</Badge>
          <div className="kpi__value text-2xl font-bold font-mono text-ink mt-2.5 mb-1">$2.87M</div>
          <p className="card__sub text-xs text-body-c">6.40% of annual consumption value · 980 SKUs (69.00% of catalog)</p>
          <p className="text-xs text-ink mt-3 pt-3 border-t border-border leading-relaxed">
            Quarterly or visual two-bin review · Minimal administrative oversight · Target service level 90.00–95.00% · Bulk order processing.
          </p>
        </div>
      </div>

      {/* P1: ABC × XYZ × criticality matrix — strategy per segment and where policy does not match */}
      <div className="card bg-surface border border-border rounded-md p-5 shadow-subtle mb-6">
        <div className="card__head mb-4">
          <h2 className="card__title text-sm font-bold text-ink">ABC × XYZ × Criticality</h2>
          <p className="card__sub text-xs text-body-c">
            SKUs per segment, how many are flagged Critical, and the replenishment strategy each segment needs. XYZ: X CV ≤ {XYZ_LIMITS.X}, Y ≤ {XYZ_LIMITS.Y}, Z above.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse min-w-[560px]">
            <thead>
              <tr>
                <th className="text-left font-semibold text-subtle p-2 w-20" />
                {['X', 'Y', 'Z'].map((x) => (
                  <th key={x} className="text-left font-semibold text-subtle p-2">{x} · {XYZ_LABEL[x]}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {['A', 'B', 'C'].map((a) => (
                <tr key={a} className="border-t border-border">
                  <th className="text-left font-bold text-ink p-2 align-top">Class {a}</th>
                  {['X', 'Y', 'Z'].map((x) => {
                    const cell = SEGMENT_MATRIX[a][x];
                    const gap = POLICY_GAP[`${a}-${x}`];
                    const isSelected = mat.abcClass === a && xyzClass(mat.demandCV) === x;
                    return (
                      <td key={x} className={`p-2 align-top ${isSelected ? 'bg-info-bg' : ''}`}>
                        <div className="font-mono font-bold text-ink">{cell.skus} SKUs</div>
                        <div className={cell.critical ? 'text-error-tx font-semibold' : 'text-subtle'}>{cell.critical} critical</div>
                        <div className="text-subtle mt-0.5">{SEGMENT_STRATEGY[a][x]}</div>
                        {gap && <Badge tone="watch" className="mt-1">Policy gap · {gap}</Badge>}
                        {isSelected && <div className="text-primary font-semibold mt-1">{mat.id} is here</div>}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-xs border-collapse min-w-[560px]">
            <thead>
              <tr className="text-subtle">
                <th className="text-left font-semibold p-2">Tracked material</th>
                <th className="text-left font-semibold p-2">ABC</th>
                <th className="text-left font-semibold p-2">XYZ (CV)</th>
                <th className="text-left font-semibold p-2">Criticality</th>
                <th className="text-right font-semibold p-2">Cover vs lead time</th>
              </tr>
            </thead>
            <tbody>
              {trackedMaterials.map((m) => {
                const cover = coverDays(m);
                const short = cover < m.leadTimeDays;
                return (
                  <tr key={m.id} className="border-t border-border">
                    <td className="p-2 text-ink"><span className="font-mono font-bold">{m.id}</span> · {m.name}</td>
                    <td className="p-2">{m.abcClass}</td>
                    <td className="p-2">{xyzClass(m.demandCV)} ({formatNum(m.demandCV)})</td>
                    <td className="p-2">
                      <Badge tone={criticalityFlag(m) === 'Critical' ? 'risk' : 'neutral'}>{criticalityFlag(m)}</Badge>
                    </td>
                    <td className={`p-2 text-right font-mono ${short ? 'text-error-tx font-bold' : 'text-body-c'}`}>
                      {formatNum(cover, 0)}d / {m.leadTimeDays}d
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 2. Cumulative Value Pareto Chart */}
      <div className="card bg-surface border border-border rounded-md p-5 shadow-subtle mb-6">
        <div className="card__head flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-4">
          <div>
            <h2 className="card__title text-sm font-bold text-ink">Cumulative Annual Consumption Value Contribution (Pareto)</h2>
            <p className="card__sub text-xs text-body-c">
              Empirical distribution: Class A boundary at 78.30% ($34.28M), Class B at 93.60% ($40.99M), and Class C tail at 100.00% ($43.86M).
            </p>
          </div>
          {persona === 'planner' && (
            <Badge tone="accent" className="self-start sm:self-auto">{criticalMaterials.length} of {trackedMaterials.length} tracked materials are Critical</Badge>
          )}
          {persona === 'inventory' && (
            <Badge tone="neutral" className="self-start sm:self-auto">980 Class C SKUs, 6.40% of value</Badge>
          )}
          {persona === 'procurement' && (
            <Badge tone="accent" className="self-start sm:self-auto">{constrainedSourceCount} of {trackedMaterials.length} tracked materials sole/allocated/dual-sourced</Badge>
          )}
          {persona === 'head' && (
            <Badge tone="neutral" className="self-start sm:self-auto">78.30% Value Concentrated in 10.00% of SKUs</Badge>
          )}
        </div>

        <div className="chart-shell mb-4">
          <ParetoChart />
        </div>

        {/* Persona-specific lens insights */}
        <motion.div
          key={persona}
          initial={shouldReduceMotion ? false : { opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          {persona === 'planner' && (
            <Insight label="Production / Materials Planner Lens · Class A Materials at Stockout Risk">
              2 of the 4 tracked Class A materials — <span className="font-mono font-bold text-ink">MAT-1082</span> and <span className="font-mono font-bold text-ink">MAT-4120</span> — are flagged Critical: a stockout on either stops a downstream line. MAT-1082 feeds 14 finished-good lines on a 60-day sole-source lead time; MAT-4120 feeds 19 controller SKUs on a 60-day allocated-supply lead time. Both get the weekly Class A review cadence, but line-stoppage risk — not just $ value — is what should set the review priority.
            </Insight>
          )}
          {persona === 'inventory' && (
            <Insight label="Inventory / Materials Manager Lens · Where Physical Stock Sits Across Classes">
              Class C holds 980 SKUs (69.00% of the catalog) for just 6.40% of value ($2.87M) — a lot of shelf space and pick locations for little economic weight. High-Temp Sealant Paste (MAT-5501) is a Class C consumable with shelf-life sensitivity, so it's a candidate for the quarterly two-bin review rather than active tracking. Class A's 142 SKUs, by contrast, carry $34.28M of value in a tight physical footprint.
            </Insight>
          )}
          {persona === 'procurement' && (
            <Insight label="Procurement / Sourcing Manager Lens · Sourcing Risk Concentrated in Class A">
              {constrainedSourceCount} of the {trackedMaterials.length} tracked materials come from a Sole, Allocated or limited-vendor source: MAT-1082 (Sole Source), MAT-4120 (Allocated Supply), MAT-2041 (Dual Sourced). Only MAT-5501 has a genuine multi-vendor fallback. Because Class A materials get the tightest governance, any delay on a sole or allocated source there has no buffer to absorb it.
            </Insight>
          )}
          {persona === 'head' && (
            <Insight label="Head of Supply Chain Lens · Economic Concentration & Risk Governance">
              78.30% of annual raw-material consumption value is concentrated in 10.00% of SKUs (142 materials out of 1,420 catalog SKUs totaling <span className="font-mono font-bold text-ink">$34.28M</span>). This high economic concentration justifies dedicated executive supplier governance, disciplined review cadences, and prioritized working-capital control to protect enterprise manufacturing throughput across all plants.
            </Insight>
          )}
        </motion.div>
      </div>

      {/* 3. Selected Material Contextual Intelligence Layer */}
      <div className="card bg-surface border border-border rounded-md p-5 shadow-subtle mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-border">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-base font-bold text-ink m-0">
                {mat.id} · {mat.name}
              </h2>
              <Badge tone={mat.abcClass === 'A' ? 'accent' : 'neutral'}>
                {mat.contextTag}
              </Badge>
            </div>
            <p className="text-xs text-body-c m-0">
              {mat.plant} · Category: <strong>{mat.category}</strong> · Single Raw Material Inventory Object supporting <strong>{mat.downstreamProductsCount} Downstream Products</strong> ({mat.downstreamSummary})
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mb-6">
          <KpiTile
            label="Annual Consumption Value"
            value={formatCurrency(mat.annualConsumptionValue)}
            sub={`${formatNum(mat.annualDemand, 0)} ${mat.uom}/yr × ${formatCurrency(mat.unitCost)} · ${formatNum(enterpriseValueShare)}% of enterprise consumption`}
          />
          <KpiTile
            label="Physical On-Hand Inventory"
            value={formatCurrency(mat.onHandValue)}
            sub={`${formatNum(mat.onHandQty, 0)} ${mat.uom} on-hand · ${formatNum(physicalStockShare)}% of enterprise physical stock ($13.71M)`}
          />
          <KpiTile
            label="Downstream Product Dependency"
            value={`${mat.downstreamProductsCount} Products`}
            sub={`${mat.downstreamSummary} · 100.00% demand reconciliation`}
          />
          <KpiTile
            label="Demand Behavior & Latency"
            value={`CV ${formatNum(mat.demandCV)} · ${mat.leadTimeDays}d LT`}
            sub={`${mat.demandCV <= 0.15 ? 'Stable consumption' : 'Elevated volatility'} · ${mat.supplier.split('(')[0].trim()}`}
          />
        </div>

        {/* Downstream Products Table */}
        <div className="mb-4">
          <div className="flex justify-between items-baseline mb-2">
            <h3 className="text-xs font-bold text-ink uppercase tracking-wider">
              Downstream Product Demand Drivers ({mat.downstreamSummary} Consuming {mat.id})
            </h3>
            <span className="text-xs text-body-c font-mono">
              Product Demand × BOM Usage Rate = Derived Raw-Material Demand
            </span>
          </div>

          <div className="rounded-sm border border-border overflow-hidden">
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
                    <TableCell><Badge tone="neutral">{p.type}</Badge></TableCell>
                    <TableCell className="text-right font-mono">{formatNum(p.bomQty, p.bomQty < 1 ? 2 : 1)} {mat.uom}</TableCell>
                    <TableCell className="text-right font-mono">{formatNum(p.productDemand, p.productDemand % 1 === 0 ? 0 : 1)} units/yr</TableCell>
                    <TableCell className="text-right font-mono font-bold text-ink">{formatNum(p.derivedConsumption, 0)} {mat.uom}</TableCell>
                    <TableCell className="text-right font-mono">
                      <Badge tone="accent">{formatNum(p.sharePct)}%</Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono font-bold text-ink">{formatCurrency(p.derivedValue)}</TableCell>
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
        </div>

        <div className="p-3 bg-bg rounded-sm border border-border text-xs text-body-c leading-relaxed">
          <strong className="text-ink">Architectural Boundary & Downstream Driver Model:</strong> Downstream finished goods are <em>demand drivers</em> whose production schedules generate aggregate raw-material demand ({formatNum(mat.annualDemand, 0)} {mat.uom}/yr). {mat.id} is the <em>inventory and procurement object</em> classified into ABC Class {mat.abcClass}. This page determines <strong>Control Priority and Governance Cadence</strong>; optimal batch lot sizes are calculated on the <strong>EOQ Analysis</strong> page.
        </div>
      </div>

      {/* 4. Driver Breakdown (WhyDisclosure) */}
      <div className="card bg-surface border border-border rounded-md p-5 shadow-subtle mb-6">
        <h2 className="card__title text-sm font-bold text-ink mb-1">
          Why {mat.id} ({mat.name}) Anchors ABC Class {mat.abcClass} Governance
        </h2>
        <WhyDisclosure
          defaultOpen
          summary="Driver breakdown & Multi-Dimensional Segmentation Rationale"
          drivers={[
            `Annual consumption value of ${formatCurrency(mat.annualConsumptionValue)} (${formatNum(mat.annualDemand, 0)} ${mat.uom}/yr × ${formatCurrency(mat.unitCost)}) places ${mat.id} in Class ${mat.abcClass}, representing ${formatNum(enterpriseValueShare)}% of total enterprise raw-material consumption value ($43.86M).`,
            `Physical on-hand inventory value of ${formatCurrency(mat.onHandValue)} (${formatNum(mat.onHandQty, 0)} ${mat.uom}) represents ${formatNum(physicalStockShare)}% of total enterprise physical inventory ($13.71M).`,
            `Downstream product dependency: ${mat.id} feeds ${mat.downstreamProductsCount} finished products/assemblies (${mat.downstreamSummary}); all derived product requirements reconcile to 100.00% of aggregate material demand, linking raw-material availability directly to multi-product delivery continuity.`,
            `Operational risk dimensions: ${mat.leadTimeDays}-day supplier lead time from ${mat.supplier} combined with demand CV of ${formatNum(mat.demandCV)} and ${mat.criticality.toLowerCase()}.`,
          ]}
          meaning={[
            persona === 'planner'
              ? `A stockout on ${mat.id} cascades across ${mat.downstreamProductsCount} downstream production lines simultaneously — line continuity, not just $ value, is why it gets the weekly Class ${mat.abcClass} review cadence.`
              : persona === 'inventory'
              ? `${mat.id}'s classification sets how much physical review and shelf discipline it gets: Class ${mat.abcClass} means ${mat.abcClass === 'A' ? 'weekly cycle counts and tight shelf discipline' : 'the lighter, largely automated two-bin rhythm'}.`
              : persona === 'procurement'
              ? `${mat.supplier} supplies ${mat.id} — that sourcing constraint, not just consumption value, is why Class ${mat.abcClass} materials like this one get the tightest governance and least room to absorb a delay.`
              : `Material ${mat.id} accounts for ${formatCurrency(mat.annualConsumptionValue)} of annual raw-material consumption value (${mat.abcClass === 'A' ? 'within the $34.28M Class A portfolio' : 'within the enterprise raw-material portfolio'}), directly feeding key downstream product lines where supplier latency and availability require executive governance.`,
            'Downstream product demand streams act as derived demand drivers—they explain aggregate consumption volume while the raw material remains the single inventory/procurement object.',
          ]}
          action={[
            `Queue ${mat.id} into EOQ Analysis to determine total-cost minimizing batch quantities and order frequencies.`,
            mat.abcClass === 'A'
              ? 'Enforce weekly replenishment reviews, 99.00% cycle-count verification, and maintain a 98.00–99.00% target service-level buffer.'
              : 'Maintain standard periodic review policy with automated two-bin replenishment triggers.',
            'Synchronize raw-material procurement lead times with downstream Master Production Schedules (MPS) across dependent finished product lines.',
          ]}
        />
      </div>
    </section>
  );
}
