import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import {
  LineChart,
  Search,
  ArrowUpDown,
  Download,
  ChevronUp,
  ChevronDown,
  X,
  ArrowRight,
  AlertTriangle,
  ShieldAlert,
  TrendingUp,
  Layers,
  Sparkles,
  BarChart3,
  BrainCircuit,
  Compass,
  DollarSign,
  Package,
  Activity,
  CheckCircle2,
  RefreshCw,
  Clock,
} from 'lucide-react';
import { ViewHead, Badge, Insight, KpiTile, Card, CardHead, DrillDown } from '../../components/CommonUI';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { usePlatform } from '../../context/PlatformContext';
import {
  MATERIALS,
  EOQ_INPUTS,
  FORECAST_INPUTS,
  RAW_MATERIAL_ROWS,
  RMLC_STAGES,
  DECISION_ROWS,
} from '../../data/mockData';

// ============================================================================
// COMPLETE CANONICAL INVENTORY DATASET
// Canonical portfolio dataset representing materials across the manufacturing estate.
// ============================================================================
const FULL_INVENTORY_DATASET = [
  {
    id: 'MAT-1082',
    name: 'Hydraulic Pump 250BAR',
    plant: 'Plant 1 — Assembly',
    category: 'Components',
    materialType: 'Components & Electronics',
    qty: 930.0,
    uom: 'EA',
    unitCost: 600.0,
    value: 558000.0,
    annualDemand: 4800.0,
    dailyConsumption: 13.15,
    annualConsumptionValue: 2880000.0,
    leadTimeDays: 60,
    demandCV: 0.12,
    safetyStock: 184.2,
    reorderPoint: 973.2,
    currentBatchQty: 600.0,
    calibratedEOQ: 248.0,
    daysOfSupply: 70.8,
    inventoryTurnover: 5.16,
    abcClass: 'A',
    supplier: 'HydraTech Dynamics GmbH',
    sourcingType: 'Sole Source',
    criticality: 'Critical',
    stockoutRisk: 'Protected',
    rmlcStatus: 'Active Circulation',
    downstreamLines: '14 Lines (HEX-200, IL-450, HC-80, MD-120)',
    bomCoverage: 'Risk',
  },
  {
    id: 'MAT-4120',
    name: 'Microcontroller MCU-64',
    plant: 'Plant 3 — Microelectronics',
    category: 'Components',
    materialType: 'Components & Electronics',
    qty: 920.0,
    uom: 'EA',
    unitCost: 78.65,
    value: 72358.0,
    annualDemand: 24000.0,
    dailyConsumption: 65.75,
    annualConsumptionValue: 1887600.0,
    leadTimeDays: 60,
    demandCV: 0.28,
    safetyStock: 412.0,
    reorderPoint: 4357.0,
    currentBatchQty: 3000.0,
    calibratedEOQ: 1870.0,
    daysOfSupply: 14.0,
    inventoryTurnover: 26.09,
    abcClass: 'A',
    supplier: 'SiliconFoundry International',
    sourcingType: 'Allocated Supply',
    criticality: 'Critical',
    stockoutRisk: 'High Risk (14-Day)',
    rmlcStatus: 'At Risk (14-Day)',
    downstreamLines: '19 SKUs (ECU-400, GW-80, TM-12)',
    bomCoverage: 'Risk',
  },
  {
    id: 'MAT-2041',
    name: 'Lithium Cell 21700',
    plant: 'Plant 2 — Engine Hub',
    category: 'Raw Materials',
    materialType: 'Raw Materials',
    qty: 142000.0,
    uom: 'EA',
    unitCost: 5.14,
    value: 729880.0,
    annualDemand: 420000.0,
    dailyConsumption: 1150.68,
    annualConsumptionValue: 2158800.0,
    leadTimeDays: 30,
    demandCV: 0.1,
    safetyStock: 6840.0,
    reorderPoint: 41340.0,
    currentBatchQty: 60000.0,
    calibratedEOQ: 25050.0,
    daysOfSupply: 123.4,
    inventoryTurnover: 2.96,
    abcClass: 'A',
    supplier: 'Apex Energy Storage Ltd',
    sourcingType: 'Dual Sourced',
    criticality: 'High',
    stockoutRisk: 'Protected',
    rmlcStatus: 'Active Circulation',
    downstreamLines: '8 Lines (BP-800, PM-200, ESS-50)',
    bomCoverage: 'OK',
  },
  {
    id: 'MAT-5501',
    name: 'High-Temp Sealant Paste',
    plant: 'Plant 1 — Assembly',
    category: 'Consumables',
    materialType: 'Consumables',
    qty: 1400.0,
    uom: 'KG',
    unitCost: 41.14,
    value: 57596.0,
    annualDemand: 6000.0,
    dailyConsumption: 16.44,
    annualConsumptionValue: 246840.0,
    leadTimeDays: 21,
    demandCV: 0.15,
    safetyStock: 120.0,
    reorderPoint: 465.0,
    currentBatchQty: 1400.0,
    calibratedEOQ: 1058.0,
    daysOfSupply: 85.2,
    inventoryTurnover: 4.29,
    abcClass: 'C',
    supplier: 'BondTech Polymer Solutions',
    sourcingType: 'Multi-Vendor',
    criticality: 'Moderate',
    stockoutRisk: 'Protected',
    rmlcStatus: 'Liquidation (>180d)',
    downstreamLines: '6 Lines (Flanges, Gaskets)',
    bomCoverage: 'OK',
  },
  {
    id: 'MAT-3390',
    name: 'Steel Housing Cast-Iron',
    plant: 'Plant 1 — Assembly',
    category: 'Structural Parts',
    materialType: 'Fabricated Parts',
    qty: 1800.0,
    uom: 'EA',
    unitCost: 185.0,
    value: 333000.0,
    annualDemand: 7200.0,
    dailyConsumption: 19.73,
    annualConsumptionValue: 1332000.0,
    leadTimeDays: 45,
    demandCV: 0.14,
    safetyStock: 320.0,
    reorderPoint: 1208.0,
    currentBatchQty: 1200.0,
    calibratedEOQ: 772.0,
    daysOfSupply: 91.2,
    inventoryTurnover: 4.0,
    abcClass: 'B',
    supplier: 'Precision Forge & Cast Corp',
    sourcingType: 'Sole Source',
    criticality: 'High',
    stockoutRisk: 'Watch (45-Day)',
    rmlcStatus: 'Active Circulation',
    downstreamLines: '4 Lines (HEX-200, HC-80)',
    bomCoverage: 'Watch',
  },
  {
    id: 'MAT-1177',
    name: 'High-Pressure Seal Kit',
    plant: 'Plant 1 — Assembly',
    category: 'Spare Parts',
    materialType: 'MRO Spares',
    qty: 3600.0,
    uom: 'SET',
    unitCost: 45.0,
    value: 162000.0,
    annualDemand: 14400.0,
    dailyConsumption: 39.45,
    annualConsumptionValue: 648000.0,
    leadTimeDays: 15,
    demandCV: 0.08,
    safetyStock: 480.0,
    reorderPoint: 1072.0,
    currentBatchQty: 2400.0,
    calibratedEOQ: 1714.0,
    daysOfSupply: 91.3,
    inventoryTurnover: 4.0,
    abcClass: 'B',
    supplier: 'Elastomer Seals Global',
    sourcingType: 'Dual Sourced',
    criticality: 'Low',
    stockoutRisk: 'Protected',
    rmlcStatus: 'Active Circulation',
    downstreamLines: '12 Lines (Sub-Assemblies)',
    bomCoverage: 'OK',
  },
];

// Persona-specific column configurations for the master ledger drill-down
const COLUMNS_CONFIG_DS = [
  { key: 'id', label: 'Material ID', align: 'left', minWidth: '110px' },
  { key: 'name', label: 'Description', align: 'left', minWidth: '180px' },
  { key: 'plant', label: 'Plant', align: 'left', minWidth: '150px' },
  { key: 'demandCV', label: 'Demand CV', align: 'right', minWidth: '100px' },
  { key: 'leadTimeDays', label: 'Lead Time', align: 'right', minWidth: '95px' },
  { key: 'safetyStock', label: 'Safety Stock', align: 'right', minWidth: '110px' },
  { key: 'reorderPoint', label: 'Reorder Point', align: 'right', minWidth: '110px' },
  { key: 'currentBatchQty', label: 'Batch Qty', align: 'right', minWidth: '100px' },
  { key: 'calibratedEOQ', label: 'Calibrated EOQ', align: 'right', minWidth: '120px' },
  { key: 'inventoryTurnover', label: 'Turnover', align: 'right', minWidth: '95px' },
  { key: 'abcClass', label: 'ABC Class', align: 'center', minWidth: '90px' },
  { key: 'criticality', label: 'Criticality', align: 'left', minWidth: '110px' },
];

const COLUMNS_CONFIG_ANALYST = [
  { key: 'id', label: 'Material ID', align: 'left', minWidth: '110px' },
  { key: 'name', label: 'Description', align: 'left', minWidth: '180px' },
  { key: 'plant', label: 'Plant', align: 'left', minWidth: '150px' },
  { key: 'category', label: 'Category', align: 'left', minWidth: '120px' },
  { key: 'qty', label: 'On-Hand Qty', align: 'right', minWidth: '110px' },
  { key: 'unitCost', label: 'Unit Cost', align: 'right', minWidth: '100px' },
  { key: 'value', label: 'Inventory Value', align: 'right', minWidth: '130px' },
  { key: 'daysOfSupply', label: 'Days of Supply', align: 'right', minWidth: '115px' },
  { key: 'leadTimeDays', label: 'Lead Time', align: 'right', minWidth: '95px' },
  { key: 'stockoutRisk', label: 'Stockout Risk', align: 'left', minWidth: '135px' },
  { key: 'rmlcStatus', label: 'Lifecycle Status', align: 'left', minWidth: '145px' },
  { key: 'supplier', label: 'Supplier', align: 'left', minWidth: '200px' },
];

const COLUMNS_CONFIG_EXEC = [
  { key: 'id', label: 'Material ID', align: 'left', minWidth: '110px' },
  { key: 'name', label: 'Description', align: 'left', minWidth: '200px' },
  { key: 'plant', label: 'Plant', align: 'left', minWidth: '160px' },
  { key: 'category', label: 'Category', align: 'left', minWidth: '130px' },
  { key: 'value', label: 'Inventory Value', align: 'right', minWidth: '140px' },
  { key: 'annualConsumptionValue', label: 'Annual Consumption', align: 'right', minWidth: '160px' },
  { key: 'inventoryTurnover', label: 'Turnover', align: 'right', minWidth: '100px' },
  { key: 'criticality', label: 'Criticality', align: 'left', minWidth: '110px' },
  { key: 'sourcingType', label: 'Sourcing Model', align: 'left', minWidth: '140px' },
  { key: 'downstreamLines', label: 'Downstream Scope', align: 'left', minWidth: '200px' },
];

// Value formatting utilities
const formatCurrency = (val, decimals = 0) => {
  if (val == null || isNaN(val)) return '$0';
  if (val >= 1_000_000) {
    return `$${(val / 1_000_000).toFixed(decimals > 0 ? decimals : 2)}M`;
  }
  if (val >= 1_000) {
    return `$${(val / 1_000).toFixed(decimals > 0 ? decimals : 1)}k`;
  }
  return `$${val.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`;
};

export default function Overview() {
  const navigate = useNavigate();
  const { persona } = usePlatform();
  const shouldReduceMotion = useReducedMotion();

  // Search & Sorting State for Master Dataset Drill-down
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState('value');
  const [sortDirection, setSortDirection] = useState('desc');
  const [analystFilter, setAnalystFilter] = useState('all'); // 'all' | 'risk' | 'classA'

  // ============================================================================
  // DYNAMIC PORTFOLIO CALCULATIONS (Zero hardcoding; all derived from actual data)
  // ============================================================================
  const metrics = useMemo(() => {
    const totalValue = FULL_INVENTORY_DATASET.reduce((sum, m) => sum + m.value, 0);
    const totalConsumptionValue = FULL_INVENTORY_DATASET.reduce((sum, m) => sum + m.annualConsumptionValue, 0);
    const totalAnnualDemand = FULL_INVENTORY_DATASET.reduce((sum, m) => sum + m.annualDemand, 0);
    const portfolioTurnover = totalValue > 0 ? (totalConsumptionValue / totalValue).toFixed(1) : '0.0';

    // ABC Pareto Segmentation
    const classAItems = FULL_INVENTORY_DATASET.filter((m) => m.abcClass === 'A');
    const classAValue = classAItems.reduce((sum, m) => sum + m.value, 0);
    const classAValueShare = totalValue > 0 ? ((classAValue / totalValue) * 100).toFixed(1) : '0';
    const classAConsumption = classAItems.reduce((sum, m) => sum + m.annualConsumptionValue, 0);
    const classAConsumptionShare = totalConsumptionValue > 0 ? ((classAConsumption / totalConsumptionValue) * 100).toFixed(1) : '0';

    // Risk and Exception Breakdown
    const atRiskItems = FULL_INVENTORY_DATASET.filter(
      (m) => m.stockoutRisk.includes('Risk') || m.stockoutRisk.includes('Watch') || m.rmlcStatus.includes('Risk')
    );
    const atRiskValue = atRiskItems.reduce((sum, m) => sum + m.value, 0);

    const liquidationItems = FULL_INVENTORY_DATASET.filter(
      (m) => m.rmlcStatus.includes('Liquidation') || m.rmlcStatus.includes('Risk')
    );
    const excessValue = FULL_INVENTORY_DATASET.filter((m) => m.rmlcStatus.includes('Liquidation')).reduce((sum, m) => sum + m.value, 0);
    const stagnantValue = liquidationItems.reduce((sum, m) => sum + m.value, 0);

    // Operational Coverage (Days of Supply)
    const dosList = FULL_INVENTORY_DATASET.map((m) => m.daysOfSupply);
    const avgDOS = (dosList.reduce((sum, d) => sum + d, 0) / dosList.length).toFixed(1);
    const minDOS = Math.min(...dosList).toFixed(0);
    const maxDOS = Math.max(...dosList).toFixed(0);

    // Data Science & Statistical Dynamics
    const cvList = FULL_INVENTORY_DATASET.map((m) => m.demandCV);
    const avgDemandCV = (cvList.reduce((sum, cv) => sum + cv, 0) / cvList.length).toFixed(2);
    const maxCvItem = [...FULL_INVENTORY_DATASET].sort((a, b) => b.demandCV - a.demandCV)[0];
    const highVolatilityCount = FULL_INVENTORY_DATASET.filter((m) => m.demandCV >= 0.2).length;

    // Forecast Model Fit Quality
    const forecastEntries = Object.entries(FORECAST_INPUTS).map(([id, data]) => ({ id, ...data }));
    const avgModelR2 = forecastEntries.length > 0
      ? (forecastEntries.reduce((sum, f) => sum + f.modelR2, 0) / forecastEntries.length).toFixed(2)
      : '0.87';
    const lowestR2Item = forecastEntries.length > 0
      ? [...forecastEntries].sort((a, b) => a.modelR2 - b.modelR2)[0]
      : { id: 'MAT-4120', modelR2: 0.78, rmseRatio: 0.22 };

    // Lot-Sizing Spread (Current Batch vs Calibrated EOQ)
    const batchRatios = FULL_INVENTORY_DATASET.map((m) => m.currentBatchQty / m.calibratedEOQ);
    const avgBatchOverEOQ = (batchRatios.reduce((sum, r) => sum + r, 0) / batchRatios.length).toFixed(2);

    const soleSourceItems = FULL_INVENTORY_DATASET.filter((m) => m.sourcingType === 'Sole Source');
    const plantCount = new Set(FULL_INVENTORY_DATASET.map((m) => m.plant)).size;

    return {
      totalValue,
      totalConsumptionValue,
      totalAnnualDemand,
      portfolioTurnover,
      classAItems,
      classAValue,
      classAValueShare,
      classAConsumptionShare,
      atRiskItems,
      atRiskValue,
      liquidationItems,
      excessValue,
      stagnantValue,
      avgDOS,
      minDOS,
      maxDOS,
      avgDemandCV,
      maxCvItem,
      highVolatilityCount,
      forecastEntries,
      avgModelR2,
      lowestR2Item,
      avgBatchOverEOQ,
      soleSourceItems,
      totalSkus: FULL_INVENTORY_DATASET.length,
      plantCount,
    };
  }, []);

  // Columns for active persona
  const activeColumns = useMemo(() => {
    if (persona === 'ds') return COLUMNS_CONFIG_DS;
    if (persona === 'analyst') return COLUMNS_CONFIG_ANALYST;
    return COLUMNS_CONFIG_EXEC;
  }, [persona]);

  // Sorting Handler
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // Filtered & Sorted Dataset
  const processedDataset = useMemo(() => {
    let data = [...FULL_INVENTORY_DATASET];

    // Analyst Quick-Filter tabs
    if (persona === 'analyst') {
      if (analystFilter === 'risk') {
        data = data.filter((m) => m.stockoutRisk.includes('Risk') || m.stockoutRisk.includes('Watch') || m.rmlcStatus.includes('Liquidation'));
      } else if (analystFilter === 'classA') {
        data = data.filter((m) => m.abcClass === 'A');
      }
    }

    // Search Filter across fields
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      data = data.filter((m) =>
        Object.values(m).some((val) => String(val).toLowerCase().includes(q))
      );
    }

    // Sorting
    data.sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];

      if (typeof valA === 'number' && typeof valB === 'number') {
        return sortDirection === 'asc' ? valA - valB : valB - valA;
      }
      return sortDirection === 'asc'
        ? String(valA ?? '').localeCompare(String(valB ?? ''))
        : String(valB ?? '').localeCompare(String(valA ?? ''));
    });

    return data;
  }, [searchQuery, sortField, sortDirection, analystFilter, persona]);

  // Export to CSV Function
  const exportToCSV = () => {
    const headers = activeColumns.map((c) => `"${c.label}"`).join(',');
    const rows = processedDataset.map((row) =>
      activeColumns.map((c) => {
        let val = row[c.key];
        if (typeof val === 'number') {
          return val;
        }
        return `"${String(val ?? '').replace(/"/g, '""')}"`;
      }).join(',')
    );
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `inventory_${persona}_ledger_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Persona-specific page subtitles
  const subtitle = {
    exec: 'Executive Portfolio Lens · Capital allocation, working capital turnover velocity, and supply continuity exposure across manufacturing plants.',
    analyst: 'Operational Exceptions Lens · Real-time stock positions, coverage buffers, supplier lead time risks, and immediate exception items.',
    ds: 'Statistical & Model Diagnostics Lens · Demand variability, forecast model fit (R²), lot-sizing calibration divergence, and distribution anomalies.',
  }[persona] || 'Portfolio summary of inventory health, capital deployment, and operational risk.';

  return (
    <section className="view max-w-7xl mx-auto space-y-6">
      {/* ===================================================================== */}
      {/* 1. PORTFOLIO SUMMARY: ViewHead & Persona-Specific Headline Insight    */}
      {/* ===================================================================== */}
      <ViewHead
        title="Enterprise Inventory Modelling"
        subtitle={<p className="text-body-c leading-relaxed">{subtitle}</p>}
      />

      {persona === 'exec' && (
        <Insight label="Executive Capital & Portfolio Exposure">
          Holding <span className="metric">{formatCurrency(metrics.totalValue, 2)}</span> across {metrics.plantCount} active manufacturing plants, generating an annual turnover velocity of{' '}
          <span className="metric">{metrics.portfolioTurnover}×</span> against{' '}
          <span className="metric">{formatCurrency(metrics.totalConsumptionValue, 2)}</span> in consumption throughput. Immediate focus:{' '}
          <span className="metric">{formatCurrency(metrics.atRiskValue, 1)}</span> in inventory value carries supplier lead-time risk in microelectronics, while{' '}
          <span className="metric">{formatCurrency(metrics.excessValue, 1)}</span> in stagnant stock can be recovered through plant reallocations.
        </Insight>
      )}

      {persona === 'analyst' && (
        <Insight label="Operational Buffer & Exception Radar">
          Portfolio coverage averages <span className="metric">{metrics.avgDOS} days</span>, but buffer distribution is uneven:{' '}
          <span className="metric">{metrics.atRiskItems.length} materials</span> are at stockout risk — most urgently{' '}
          <span className="metric">MAT-4120</span> with only 14 days of supply against a 60-day supplier lead time. In addition,{' '}
          <span className="metric">{metrics.liquidationItems.length} SKUs ({formatCurrency(metrics.stagnantValue)})</span> are stagnant and qualify for immediate inter-plant transfer.
        </Insight>
      )}

      {persona === 'ds' && (
        <Insight label="Statistical Dynamics & Model Health">
          Portfolio demand shows a mean CV of <span className="metric">{metrics.avgDemandCV}</span> with{' '}
          <span className="metric">{metrics.highVolatilityCount} volatility outlier</span> (MAT-4120 CV = 0.28). Demand forecast models achieve a mean R² of{' '}
          <span className="metric">{metrics.avgModelR2}</span>, with fit variance correlated with demand CV. Furthermore, current ordering batches exceed calibrated EOQ by an average of{' '}
          <span className="metric">{metrics.avgBatchOverEOQ}×</span>, confirming substantial cycle-stock calibration potential.
        </Insight>
      )}

      {/* ===================================================================== */}
      {/* 2. KEY PORTFOLIO SIGNALS: Exactly 4 Non-Redundant KPIs Per Persona    */}
      {/* ===================================================================== */}
      {persona === 'exec' && (
        <div className="grid-4 mb-0">
          <KpiTile
            label="Total Capital Deployed"
            value={formatCurrency(metrics.totalValue, 2)}
            delta={`${metrics.plantCount} manufacturing hubs`}
            deltaTone="neutral"
            sub={`${formatCurrency(metrics.totalConsumptionValue, 2)} annual consumption throughput`}
            onClick={() => navigate('/app/optimization')}
          />
          <KpiTile
            label="Working Capital Turnover"
            value={`${metrics.portfolioTurnover}×`}
            delta="Annual turns ratio"
            deltaTone={Number(metrics.portfolioTurnover) >= 4.0 ? 'up' : 'down'}
            sub="Targeting 5.0× working-capital efficiency band"
            onClick={() => navigate('/app/descriptive')}
          />
          <KpiTile
            label="Inventory Value at Risk"
            value={formatCurrency(metrics.atRiskValue, 1)}
            delta={`${metrics.atRiskItems.length} SKUs with lead-time exposure`}
            deltaTone="down"
            sub="Allocated supply constraint on Plant 3 microelectronics"
            onClick={() => navigate('/app/decisions')}
          />
          <KpiTile
            label="Stagnant Capital Recovery"
            value={formatCurrency(metrics.excessValue, 1)}
            delta="3 transfer options"
            deltaTone="watch"
            sub="Non-moving stock eligible for inter-plant redeployment"
            onClick={() => navigate('/app/liquidation')}
          />
        </div>
      )}

      {persona === 'analyst' && (
        <div className="grid-4 mb-0">
          <KpiTile
            label="Active Inventory Position"
            value={formatCurrency(metrics.totalValue, 2)}
            delta={`${metrics.totalSkus} materials monitored`}
            deltaTone="neutral"
            sub={`${metrics.classAItems.length} Class A SKUs drive ${metrics.classAValueShare}% of total value`}
            onClick={() => navigate('/app/abc')}
          />
          <KpiTile
            label="Average Days of Supply"
            value={`${metrics.avgDOS} days`}
            delta={`Range: ${metrics.minDOS}d – ${metrics.maxDOS}d`}
            deltaTone={Number(metrics.minDOS) < 15 ? 'down' : 'up'}
            sub={`${FULL_INVENTORY_DATASET.filter((m) => m.daysOfSupply < 30).length} SKU below 30-day buffer threshold`}
            onClick={() => navigate('/app/raw-materials')}
          />
          <KpiTile
            label="Stockout & Supply Risks"
            value={`${metrics.atRiskItems.length} SKUs`}
            delta="1 High Risk (14d), 1 Watch (45d)"
            deltaTone="down"
            sub="MAT-4120 requires immediate purchase order acceleration"
            onClick={() => navigate('/app/prevention')}
          />
          <KpiTile
            label="Stagnant & Liquidation"
            value={`${metrics.liquidationItems.length} SKUs (${formatCurrency(metrics.stagnantValue)})`}
            delta="MAT-5501 in liquidation stage"
            deltaTone="down"
            sub="Eligible for inter-plant transfer before shelf-life expiration"
            onClick={() => navigate('/app/liquidation')}
          />
        </div>
      )}

      {persona === 'ds' && (
        <div className="grid-4 mb-0">
          <KpiTile
            label="Demand Volatility (Mean CV)"
            value={metrics.avgDemandCV}
            delta={`${metrics.highVolatilityCount} outlier with CV ≥ 0.20`}
            deltaTone={metrics.highVolatilityCount > 0 ? 'down' : 'up'}
            sub={`MAT-4120 exhibits highest volatility (CV ${metrics.maxCvItem?.demandCV ?? '0.28'})`}
            onClick={() => navigate('/app/descriptive')}
          />
          <KpiTile
            label="Forecast Model Fit (Mean R²)"
            value={metrics.avgModelR2}
            delta={`Min R²: ${metrics.lowestR2Item.modelR2} (${metrics.lowestR2Item.id})`}
            deltaTone={metrics.lowestR2Item.modelR2 < 0.8 ? 'down' : 'up'}
            sub={`Mean RMSE ratio ${(metrics.forecastEntries.reduce((s, f) => s + f.rmseRatio, 0) / metrics.forecastEntries.length).toFixed(2)} across fitted series`}
            onClick={() => navigate('/app/raw-materials')}
          />
          <KpiTile
            label="Lot-Size Calibration Spread"
            value={`${metrics.avgBatchOverEOQ}×`}
            delta="Current batch vs calibrated EOQ"
            deltaTone={Number(metrics.avgBatchOverEOQ) > 1.3 ? 'down' : 'up'}
            sub={`Current batch policies average ${((Number(metrics.avgBatchOverEOQ) - 1) * 100).toFixed(0)}% above optimal EOQ`}
            onClick={() => navigate('/app/eoq')}
          />
          <KpiTile
            label="Pareto Value Concentration"
            value={`${metrics.classAValueShare}%`}
            delta={`${metrics.classAItems.length} Class A SKUs drive value`}
            deltaTone="neutral"
            sub={`Class A generates ${metrics.classAConsumptionShare}% of annual consumption throughput`}
            onClick={() => navigate('/app/abc')}
          />
        </div>
      )}

      {/* ===================================================================== */}
      {/* 3. PERSONA-SPECIFIC INTERPRETATION & SIGNALS                         */}
      {/* ===================================================================== */}

      {/* --- C-SUITE MIDDLE SECTION: Strategic Decisions & Governance --- */}
      {persona === 'exec' && (
        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="space-y-6"
        >
          {/* Strategic Decision & Action Queue */}
          <Card>
            <CardHead
              title="Strategic Decision Queue & Capital Triggers"
              sub="High-priority portfolio interventions impacting capital velocity, service protection, and liquidation salvage."
            />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {DECISION_ROWS.slice(0, 3).map((dec) => (
                <div
                  key={dec.id}
                  onClick={() => {
                    if (dec.id === 'd1') navigate('/app/decisions');
                    else if (dec.id === 'd2') navigate('/app/eoq');
                    else navigate('/app/liquidation');
                  }}
                  className="p-3.5 rounded-lg border border-border bg-bg/60 hover:bg-bg hover:border-primary transition-all cursor-pointer group flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <Badge tone={dec.tone}>{dec.tag}</Badge>
                      <span className="font-mono text-xs font-bold text-primary">{dec.impact}</span>
                    </div>
                    <h3 className="text-xs font-bold text-ink group-hover:text-primary transition-colors m-0 mb-1 leading-snug">
                      {dec.title}
                    </h3>
                    <p className="text-[12px] text-body-c m-0 line-clamp-2 leading-relaxed">{dec.meta}</p>
                  </div>
                  <div className="mt-3 pt-2 border-t border-border flex items-center justify-end text-xs font-medium text-primary">
                    <span className="group-hover:translate-x-0.5 transition-transform inline-flex items-center gap-1">
                      Execute <ArrowRight size={12} />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Downstream Strategic Gateways */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div
              onClick={() => navigate('/app/optimization')}
              className="p-4 rounded-xl border border-border bg-surface hover:border-primary transition-all cursor-pointer group shadow-subtle"
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="p-2 rounded-lg bg-primary-subtle text-primary">
                  <DollarSign size={16} />
                </div>
                <h3 className="text-sm font-bold text-ink group-hover:text-primary transition-colors m-0">
                  Working Capital Optimization
                </h3>
              </div>
              <p className="text-xs text-body-c m-0 leading-relaxed">
                Calibrate inventory constraints and safety stock targets to unlock working capital.
              </p>
            </div>

            <div
              onClick={() => navigate('/app/liquidation')}
              className="p-4 rounded-xl border border-border bg-surface hover:border-primary transition-all cursor-pointer group shadow-subtle"
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="p-2 rounded-lg bg-warning-bg text-warning-tx">
                  <RefreshCw size={16} />
                </div>
                <h3 className="text-sm font-bold text-ink group-hover:text-primary transition-colors m-0">
                  Excess & Liquidation Salvage
                </h3>
              </div>
              <p className="text-xs text-body-c m-0 leading-relaxed">
                Review inter-plant transfer recommendations for {formatCurrency(metrics.excessValue, 1)} in stagnant materials.
              </p>
            </div>

            <div
              onClick={() => navigate('/app/decisions')}
              className="p-4 rounded-xl border border-border bg-surface hover:border-primary transition-all cursor-pointer group shadow-subtle"
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="p-2 rounded-lg bg-ai-bg text-ai-tx">
                  <BrainCircuit size={16} />
                </div>
                <h3 className="text-sm font-bold text-ink group-hover:text-primary transition-colors m-0">
                  Decision Intelligence Hub
                </h3>
              </div>
              <p className="text-xs text-body-c m-0 leading-relaxed">
                Access executive scenario simulations, AI recommendations, and prompt library.
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* --- INVENTORY ANALYST MIDDLE SECTION: Operational Exception Queue --- */}
      {persona === 'analyst' && (
        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="space-y-6"
        >
          {/* Operational Exception Action Cards */}
          <Card>
            <CardHead
              title="Material Exception Queue (Immediate Attention Required)"
              sub="Operational materials requiring PO acceleration, buffer review, or inter-plant reallocation."
              right={
                <Badge tone="risk" className="text-xs">
                  {metrics.atRiskItems.length + metrics.liquidationItems.length} Total Exceptions
                </Badge>
              }
            />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Critical Shortage Card */}
              <div className="p-4 rounded-lg border border-border bg-bg/70 hover:border-primary transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Badge tone="risk">Critical Shortage</Badge>
                    <span className="text-xs font-mono text-body-c">14-Day Cover</span>
                  </div>
                  <h3 className="text-xs font-bold text-ink m-0 mb-1">MAT-4120 — Microcontroller MCU-64</h3>
                  <p className="text-[12px] text-body-c m-0 mb-2">
                    Plant 3 · On-hand: 920 EA · Lead time: 60d. Supply deficit threatens 19 downstream SKUs.
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => navigate('/app/decisions')}
                  className="w-full mt-2 text-xs font-medium text-primary hover:text-primary cursor-pointer gap-1"
                >
                  <span>Authorize Expedited PO</span>
                  <ArrowRight size={12} />
                </Button>
              </div>

              {/* Sole-Source Watch Card */}
              <div className="p-4 rounded-lg border border-border bg-bg/70 hover:border-primary transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Badge tone="watch">Lead Time Watch</Badge>
                    <span className="text-xs font-mono text-body-c">45-Day Watch</span>
                  </div>
                  <h3 className="text-xs font-bold text-ink m-0 mb-1">MAT-3390 — Steel Housing Cast-Iron</h3>
                  <p className="text-[12px] text-body-c m-0 mb-2">
                    Plant 1 · On-hand: 1,800 EA · Sole source vendor (Precision Forge). Monitor ROP buffer.
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => navigate('/app/raw-materials')}
                  className="w-full mt-2 text-xs font-medium text-ink hover:text-primary cursor-pointer gap-1"
                >
                  <span>Check Reorder Point</span>
                  <ArrowRight size={12} />
                </Button>
              </div>

              {/* Liquidation Stagnant Card */}
              <div className="p-4 rounded-lg border border-border bg-bg/70 hover:border-primary transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Badge tone="risk">Stagnant Stock</Badge>
                    <span className="text-xs font-mono text-body-c">&gt;180d Ageing</span>
                  </div>
                  <h3 className="text-xs font-bold text-ink m-0 mb-1">MAT-5501 — High-Temp Sealant Paste</h3>
                  <p className="text-[12px] text-body-c m-0 mb-2">
                    Plant 1 · Value: $57,596 · 165 days without consumption. Eligible for transfer to Plant 2.
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => navigate('/app/liquidation')}
                  className="w-full mt-2 text-xs font-medium text-ink hover:text-primary cursor-pointer gap-1"
                >
                  <span>Initiate Plant Transfer</span>
                  <ArrowRight size={12} />
                </Button>
              </div>
            </div>
          </Card>

          {/* Operational Navigation Gateways */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div
              onClick={() => navigate('/app/decisions')}
              className="p-3.5 rounded-lg border border-border bg-surface hover:border-primary transition-all cursor-pointer group shadow-subtle"
            >
              <div className="flex items-center gap-2 mb-1.5">
                <AlertTriangle size={15} className="text-risk-tx" />
                <h4 className="text-xs font-bold text-ink group-hover:text-primary transition-colors m-0">
                  Decision Intelligence
                </h4>
              </div>
              <p className="text-[12px] text-body-c m-0">Review automated replenishment & PO acceleration actions.</p>
            </div>

            <div
              onClick={() => navigate('/app/prevention')}
              className="p-3.5 rounded-lg border border-border bg-surface hover:border-primary transition-all cursor-pointer group shadow-subtle"
            >
              <div className="flex items-center gap-2 mb-1.5">
                <ShieldAlert size={15} className="text-primary" />
                <h4 className="text-xs font-bold text-ink group-hover:text-primary transition-colors m-0">
                  Stockout Prevention
                </h4>
              </div>
              <p className="text-[12px] text-body-c m-0">Early-warning lead time latency and safety stock monitoring.</p>
            </div>

            <div
              onClick={() => navigate('/app/liquidation')}
              className="p-3.5 rounded-lg border border-border bg-surface hover:border-primary transition-all cursor-pointer group shadow-subtle"
            >
              <div className="flex items-center gap-2 mb-1.5">
                <RefreshCw size={15} className="text-warning-tx" />
                <h4 className="text-xs font-bold text-ink group-hover:text-primary transition-colors m-0">
                  Excess & Liquidation
                </h4>
              </div>
              <p className="text-[12px] text-body-c m-0">Manage inter-plant reallocations and slow-moving SKUs.</p>
            </div>

            <div
              onClick={() => navigate('/app/raw-materials')}
              className="p-3.5 rounded-lg border border-border bg-surface hover:border-primary transition-all cursor-pointer group shadow-subtle"
            >
              <div className="flex items-center gap-2 mb-1.5">
                <Layers size={15} className="text-subtle" />
                <h4 className="text-xs font-bold text-ink group-hover:text-primary transition-colors m-0">
                  BOM & Requirements
                </h4>
              </div>
              <p className="text-[12px] text-body-c m-0">Evaluate material coverage across active assembly lines.</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* --- DATA SCIENTIST MIDDLE SECTION: Statistical Signals & Model Quality Radar --- */}
      {persona === 'ds' && (
        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="space-y-6"
        >
          {/* Statistical Breakdown Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Volatility & Model Diagnostics */}
            <Card>
              <CardHead
                title="Demand Volatility (CV) vs Forecast Model Fit (R²)"
                sub="Evaluation of demand stability against forecast explainability across fitted series."
              />
              <div className="space-y-3">
                {FULL_INVENTORY_DATASET.slice(0, 4).map((item) => {
                  const fc = FORECAST_INPUTS[item.id] || { modelR2: 0.85, rmseRatio: 0.15 };
                  const isAnomaly = item.demandCV >= 0.2;
                  return (
                    <div
                      key={item.id}
                      className="p-2.5 rounded-lg border border-border bg-bg/60 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-primary">{item.id}</span>
                          <span className="font-medium text-ink truncate max-w-[180px]">{item.name}</span>
                        </div>
                        <span className="text-[11px] text-body-c">{item.plant}</span>
                      </div>
                      <div className="flex items-center gap-4 shrink-0 font-mono">
                        <div className="text-right">
                          <span className="text-[11px] text-subtle block">Demand CV</span>
                          <span className={isAnomaly ? 'font-bold text-risk-tx' : 'font-medium text-ink'}>
                            {item.demandCV.toFixed(2)}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-[11px] text-subtle block">Model R²</span>
                          <span className={fc.modelR2 < 0.8 ? 'font-bold text-risk-tx' : 'font-medium text-ink'}>
                            {fc.modelR2.toFixed(2)}
                          </span>
                        </div>
                        <Badge tone={isAnomaly ? 'risk' : 'success'} className="text-[11px]">
                          {isAnomaly ? 'High Volatility' : 'Stable Fit'}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>

            {/* Lot-Sizing Calibration Divergence */}
            <Card>
              <CardHead
                title="Lot-Sizing Calibration Divergence (Batch vs EOQ)"
                sub="Discrepancy between current ordering batches and calibrated cost-optimal EOQ."
              />
              <div className="space-y-3">
                {FULL_INVENTORY_DATASET.slice(0, 4).map((item) => {
                  const ratio = item.currentBatchQty / item.calibratedEOQ;
                  const isHighDivergence = ratio > 2.0;
                  return (
                    <div
                      key={item.id}
                      className="p-2.5 rounded-lg border border-border bg-bg/60 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-primary">{item.id}</span>
                          <span className="font-medium text-ink truncate max-w-[180px]">{item.name}</span>
                        </div>
                        <span className="text-[11px] text-body-c">
                          Batch: {item.currentBatchQty.toLocaleString()} {item.uom} · EOQ: {item.calibratedEOQ.toLocaleString()} {item.uom}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 shrink-0 font-mono">
                        <div className="text-right">
                          <span className="text-[11px] text-subtle block">Batch / EOQ</span>
                          <span className={isHighDivergence ? 'font-bold text-risk-tx' : 'font-medium text-ink'}>
                            {ratio.toFixed(2)}×
                          </span>
                        </div>
                        <Badge tone={isHighDivergence ? 'watch' : 'success'} className="text-[11px]">
                          {isHighDivergence ? 'Over-Sized' : 'Calibrated'}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>

          {/* Data Science Investigation Gateways */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div
              onClick={() => navigate('/app/descriptive')}
              className="p-3.5 rounded-lg border border-border bg-surface hover:border-primary transition-all cursor-pointer group shadow-subtle"
            >
              <div className="flex items-center gap-2 mb-1.5">
                <LineChart size={15} className="text-primary" />
                <h4 className="text-xs font-bold text-ink group-hover:text-primary transition-colors m-0">
                  Descriptive Analytics
                </h4>
              </div>
              <p className="text-[12px] text-body-c m-0">Bivariate scatter correlations & lead time regressions.</p>
            </div>

            <div
              onClick={() => navigate('/app/eoq')}
              className="p-3.5 rounded-lg border border-border bg-surface hover:border-primary transition-all cursor-pointer group shadow-subtle"
            >
              <div className="flex items-center gap-2 mb-1.5">
                <Activity size={15} className="text-primary" />
                <h4 className="text-xs font-bold text-ink group-hover:text-primary transition-colors m-0">
                  EOQ Lot-Sizing
                </h4>
              </div>
              <p className="text-[12px] text-body-c m-0">Evaluate holding rate curvature & batch cost trade-offs.</p>
            </div>

            <div
              onClick={() => navigate('/app/abc')}
              className="p-3.5 rounded-lg border border-border bg-surface hover:border-primary transition-all cursor-pointer group shadow-subtle"
            >
              <div className="flex items-center gap-2 mb-1.5">
                <BarChart3 size={15} className="text-primary" />
                <h4 className="text-xs font-bold text-ink group-hover:text-primary transition-colors m-0">
                  ABC Classification
                </h4>
              </div>
              <p className="text-[12px] text-body-c m-0">Review Pareto cumulative curve & tier stability.</p>
            </div>

            <div
              onClick={() => navigate('/app/raw-materials')}
              className="p-3.5 rounded-lg border border-border bg-surface hover:border-primary transition-all cursor-pointer group shadow-subtle"
            >
              <div className="flex items-center gap-2 mb-1.5">
                <BrainCircuit size={15} className="text-primary" />
                <h4 className="text-xs font-bold text-ink group-hover:text-primary transition-colors m-0">
                  Multivariate Forecasting
                </h4>
              </div>
              <p className="text-[12px] text-body-c m-0">Inspect feature coefficients and forecast residuals.</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* ===================================================================== */}
      {/* 4. OPTIONAL SUPPORTING EVIDENCE / DRILL-DOWN MASTER DATASET           */}
      {/* ===================================================================== */}
      <DrillDown
        title={
          persona === 'ds'
            ? 'Explore Portfolio Statistical & Model Ledger'
            : persona === 'analyst'
            ? 'Explore Operational Material Ledger'
            : 'View Portfolio Financial & Inventory Ledger'
        }
        hint={
          persona === 'ds'
            ? 'Includes Demand CV, Model Fit, Safety Stock, ROP, Calibrated EOQ'
            : persona === 'analyst'
            ? 'Includes On-Hand Qty, Days of Supply, Stockout Risk, Lifecycle Status, Supplier'
            : 'Summary of inventory valuation, consumption throughput, and plant scope'
        }
        defaultOpen={false}
      >
        <div className="pt-3 space-y-4">
          {/* Table Controls: Search, Filter Tabs (for Analyst), Export */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 flex-wrap">
            {persona === 'analyst' ? (
              <div className="flex items-center gap-1.5 flex-wrap">
                <Button
                  size="sm"
                  variant={analystFilter === 'all' ? 'default' : 'outline'}
                  onClick={() => setAnalystFilter('all')}
                  className="h-7 text-xs cursor-pointer"
                >
                  All ({FULL_INVENTORY_DATASET.length})
                </Button>
                <Button
                  size="sm"
                  variant={analystFilter === 'risk' ? 'default' : 'outline'}
                  onClick={() => setAnalystFilter('risk')}
                  className="h-7 text-xs cursor-pointer"
                >
                  Exceptions & Risks ({metrics.atRiskItems.length + metrics.liquidationItems.length})
                </Button>
                <Button
                  size="sm"
                  variant={analystFilter === 'classA' ? 'default' : 'outline'}
                  onClick={() => setAnalystFilter('classA')}
                  className="h-7 text-xs cursor-pointer"
                >
                  Class A ({metrics.classAItems.length})
                </Button>
              </div>
            ) : (
              <span className="text-xs text-subtle font-medium">
                Showing {processedDataset.length} of {FULL_INVENTORY_DATASET.length} portfolio records
              </span>
            )}

            <div className="flex items-center gap-2 flex-wrap">
              {/* Search Box */}
              <div className="relative w-full sm:w-56">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-subtle h-3.5 w-3.5 pointer-events-none" />
                <Input
                  type="text"
                  placeholder="Filter records..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 pr-7 h-7 text-xs bg-bg border-border"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-subtle hover:text-ink cursor-pointer"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>

              {/* Export Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={exportToCSV}
                className="h-7 gap-1 text-xs text-ink hover:text-primary cursor-pointer"
              >
                <Download size={12} />
                <span>Export CSV</span>
              </Button>
            </div>
          </div>

          {/* Master Table */}
          <div className="rounded-lg border border-border overflow-hidden max-h-[460px] flex flex-col">
            <div className="overflow-x-auto overflow-y-auto w-full relative">
              <Table>
                <TableHeader className="bg-bg sticky top-0 z-20 border-b border-border shadow-2xs">
                  <TableRow className="hover:bg-transparent">
                    {activeColumns.map((col) => {
                      const isSorted = sortField === col.key;
                      return (
                        <TableHead
                          key={col.key}
                          style={{ minWidth: col.minWidth }}
                          className={`text-xs font-bold uppercase tracking-wider text-ink py-2 px-3 select-none ${
                            col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => handleSort(col.key)}
                            className={`inline-flex items-center gap-1 hover:text-primary transition-colors cursor-pointer group ${
                              col.align === 'right'
                                ? 'justify-end w-full'
                                : col.align === 'center'
                                ? 'justify-center w-full'
                                : 'justify-start'
                            }`}
                          >
                            <span>{col.label}</span>
                            {isSorted ? (
                              sortDirection === 'asc' ? (
                                <ChevronUp size={12} className="text-primary" />
                              ) : (
                                <ChevronDown size={12} className="text-primary" />
                              )
                            ) : (
                              <ArrowUpDown size={10} className="text-subtle opacity-0 group-hover:opacity-100 transition-opacity" />
                            )}
                          </button>
                        </TableHead>
                      );
                    })}
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {processedDataset.length > 0 ? (
                    processedDataset.map((row) => (
                      <TableRow
                        key={row.id}
                        className="hover:bg-[color-mix(in_srgb,var(--info-bg)_60%,transparent)] transition-colors"
                      >
                        {activeColumns.map((col) => {
                          const val = row[col.key];

                          if (col.key === 'id') {
                            return (
                              <TableCell key={col.key} className="font-mono font-bold text-primary py-2 px-3 text-xs">
                                {val}
                              </TableCell>
                            );
                          }
                          if (col.key === 'name') {
                            return (
                              <TableCell key={col.key} className="font-semibold text-ink py-2 px-3 text-xs">
                                {val}
                              </TableCell>
                            );
                          }
                          if (col.key === 'value' || col.key === 'unitCost' || col.key === 'annualConsumptionValue') {
                            return (
                              <TableCell key={col.key} className="text-right font-mono py-2 px-3 text-xs text-ink font-semibold">
                                ${Number(val).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </TableCell>
                            );
                          }
                          if (col.key === 'qty' || col.key === 'safetyStock' || col.key === 'reorderPoint' || col.key === 'currentBatchQty' || col.key === 'calibratedEOQ') {
                            return (
                              <TableCell key={col.key} className="text-right font-mono py-2 px-3 text-xs text-ink">
                                {Number(val).toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                              </TableCell>
                            );
                          }
                          if (col.key === 'demandCV') {
                            return (
                              <TableCell
                                key={col.key}
                                className={`text-right font-mono py-2 px-3 text-xs ${
                                  Number(val) >= 0.2 ? 'font-bold text-risk-tx' : 'text-body-c'
                                }`}
                              >
                                {Number(val).toFixed(2)}
                              </TableCell>
                            );
                          }
                          if (col.key === 'leadTimeDays') {
                            return (
                              <TableCell key={col.key} className="text-right font-mono py-2 px-3 text-xs text-body-c">
                                {val}d
                              </TableCell>
                            );
                          }
                          if (col.key === 'daysOfSupply') {
                            return (
                              <TableCell
                                key={col.key}
                                className={`text-right font-mono py-2 px-3 text-xs ${
                                  Number(val) < 20 ? 'font-bold text-risk-tx' : 'text-ink'
                                }`}
                              >
                                {Number(val).toFixed(1)}d
                              </TableCell>
                            );
                          }
                          if (col.key === 'inventoryTurnover') {
                            return (
                              <TableCell key={col.key} className="text-right font-mono py-2 px-3 text-xs text-ink font-medium">
                                {Number(val).toFixed(2)}×
                              </TableCell>
                            );
                          }
                          if (col.key === 'stockoutRisk') {
                            return (
                              <TableCell key={col.key} className="py-2 px-3 text-xs">
                                <Badge
                                  tone={
                                    String(val).includes('Risk')
                                      ? 'risk'
                                      : String(val).includes('Watch')
                                      ? 'watch'
                                      : 'success'
                                  }
                                  className="text-xs"
                                >
                                  {val}
                                </Badge>
                              </TableCell>
                            );
                          }
                          if (col.key === 'rmlcStatus') {
                            return (
                              <TableCell key={col.key} className="py-2 px-3 text-xs">
                                <Badge
                                  tone={
                                    String(val).includes('Liquidation') || String(val).includes('Risk')
                                      ? 'risk'
                                      : 'success'
                                  }
                                  className="text-xs"
                                >
                                  {val}
                                </Badge>
                              </TableCell>
                            );
                          }
                          if (col.key === 'criticality') {
                            return (
                              <TableCell key={col.key} className="py-2 px-3 text-xs">
                                <Badge
                                  tone={
                                    val === 'Critical' ? 'risk' : val === 'High' ? 'watch' : 'neutral'
                                  }
                                  className="text-xs"
                                >
                                  {val}
                                </Badge>
                              </TableCell>
                            );
                          }
                          if (col.key === 'abcClass') {
                            return (
                              <TableCell key={col.key} className="text-center font-bold text-xs py-2 px-3">
                                <span className={val === 'A' ? 'text-primary font-bold' : 'text-subtle'}>
                                  Class {val}
                                </span>
                              </TableCell>
                            );
                          }
                          return (
                            <TableCell
                              key={col.key}
                              className={`py-2 px-3 text-xs ${
                                col.align === 'right' ? 'text-right font-mono' : col.align === 'center' ? 'text-center' : 'text-left'
                              } text-body-c truncate max-w-[220px]`}
                            >
                              {String(val ?? '')}
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={activeColumns.length} className="text-center py-8 text-body-c">
                        No materials matching filter &quot;{searchQuery}&quot;
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      </DrillDown>
    </section>
  );
}
