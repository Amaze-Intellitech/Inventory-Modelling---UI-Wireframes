import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LineChart,
  ScatterChart,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  TrendingUp,
  Activity,
  Layers,
  ChevronRight,
  Sliders,
  BarChart2,
  Info,
  Package,
} from 'lucide-react';
import { ViewHead, KpiTile, WhyDisclosure, Badge, Insight, Card, CardHead } from '../../components/CommonUI';
import DriverHeatmap from '../../components/DriverHeatmap';
import { BivariateScatterChart } from '../../components/Charts';
import { usePlatform } from '../../context/PlatformContext';
import { Button } from '@/components/ui/button';

// ============================================================================
// CANONICAL DEPENDENT VARIABLE DEFINITION: CLOSING STOCK
// Source Field: closing_stock (SAP MBEW / inventory_master)
// Definition: Physical and ledger-verified inventory quantity remaining at the
//             close of each weekly operating period (measured in EA).
// Semantic Role: canonical_inventory_dependent_variable
// ============================================================================
const CANONICAL_DEPENDENT_VARIABLE = {
  name: 'Closing Stock',
  field: 'closing_stock',
  sourceTable: 'SAP MBEW / MARD',
  uom: 'EA',
  definition: 'Inventory quantity physically and ledger-verified remaining at the close of each weekly operating period.',
  semanticRole: 'canonical_inventory_dependent_variable',
};

// Canonical Historical Weekly Closing Stock Time-Series (Trailing 30 Weeks)
const CLOSING_STOCK_SERIES = [
  1180, 1210, 1260, 1190, 1240, 1310, 1290, 1350, 1280, 1330, 
  1400, 1360, 1420, 1390, 1450, 1470, 1430, 1500, 1460, 1520, 
  2410, 1490, 1510, 1540, 1500, 1560, 2050, 1580, 1600, 1620
];

// Baseline parameters for Closing Stock
const HISTORICAL_BASELINE_MEAN = 1284.0; // 104-week historical closing stock mean
const UNIT_COST_BASELINE = 78.65;        // Valuation baseline ($/EA)
const PLANT_CAPACITY_LIMIT = 2000.0;     // Plant 1 storage / operating cap (EA)

// Rolling Window Definitions for Weekly Closing Stock Cadence
const ROLLING_WINDOWS = [
  { key: 4, label: '4-Week Window', shortLabel: '4W (Short-Term)', desc: '1-Month operational closing stock smoothing' },
  { key: 8, label: '8-Week Window', shortLabel: '8W (Medium-Term)', desc: '2-Month closing stock regime baseline' },
  { key: 13, label: '13-Week Window', shortLabel: '13W (Quarterly Cycle)', desc: 'Quarterly seasonal cycle (T=13 weeks)' },
];

// ============================================================================
// BIVARIATE EXPLANATORY RELATIONSHIPS DEFINITIONS
// Canonical Closing Stock vs Explanatory Drivers
// ============================================================================
const BIVARIATE_RELATIONSHIPS = [
  {
    id: 'lt_vs_stockout',
    varA: 'Supplier Lead Time',
    varB: 'Stockout Frequency',
    target: 'Closing Stock Buffer Depletion',
    type: 'Supply Risk Dynamics',
    tag: 'Lead Time Exposure',
    shortDesc: 'Empirical association between supplier transit latency and closing stock depletion / stockout frequency across 142 Class A SKUs',
  },
  {
    id: 'order_qty_vs_cost',
    varA: 'Order Batch Quantity',
    varB: 'Unit Purchase Cost',
    target: 'Closing Stock Valuation',
    type: 'Scale Economics',
    tag: 'Procurement Scale',
    shortDesc: 'Replenishment batch volume scale discounts vs closing stock carrying cost trade-off across batch tiers',
  },
  {
    id: 'demand_vs_ontime',
    varA: 'Demand Volatility (CV)',
    varB: 'Supplier On-Time Rate',
    target: 'Closing Stock Buffer Stability',
    type: 'Fulfillment Strain',
    tag: 'Bullwhip Stress',
    shortDesc: 'Upstream demand volatility relationship with vendor fulfillment reliability and closing stock buffer disruption',
  },
];

// ============================================================================
// STATISTICAL & ROLLING CALCULATION HELPERS
// ============================================================================
function computeSeriesStats(data) {
  const n = data.length;
  if (n === 0) return { mean: 0, median: 0, stdDev: 0, cv: 0, min: 0, max: 0, iqr: 0, p25: 0, p75: 0, slope: 0, r2: 0 };

  const sum = data.reduce((acc, v) => acc + v, 0);
  const mean = sum / n;

  const sorted = [...data].sort((a, b) => a - b);
  const min = sorted[0];
  const max = sorted[n - 1];
  const median = n % 2 === 0 ? (sorted[n / 2 - 1] + sorted[n / 2]) / 2 : sorted[Math.floor(n / 2)];
  
  const p25Index = Math.floor(n * 0.25);
  const p75Index = Math.floor(n * 0.75);
  const p25 = sorted[p25Index];
  const p75 = sorted[p75Index];
  const iqr = p75 - p25;

  const variance = data.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / (n - 1);
  const stdDev = Math.sqrt(variance);
  const cv = mean > 0 ? (stdDev / mean) * 100 : 0;

  // OLS Linear Regression: y = beta0 + beta1 * x
  let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
  for (let i = 0; i < n; i++) {
    sumX += i;
    sumY += data[i];
    sumXY += i * data[i];
    sumXX += i * i;
  }
  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  let ssTot = 0, ssRes = 0;
  for (let i = 0; i < n; i++) {
    const yPred = intercept + slope * i;
    ssTot += Math.pow(data[i] - mean, 2);
    ssRes += Math.pow(data[i] - yPred, 2);
  }
  const r2 = ssTot > 0 ? Math.max(0, 1 - ssRes / ssTot) : 0;

  return { mean, median, stdDev, cv, min, max, iqr, p25, p75, slope, r2 };
}

function computeRollingSeries(data, windowSize) {
  const result = [];
  for (let i = 0; i < data.length; i++) {
    const start = Math.max(0, i - windowSize + 1);
    const windowSlice = data.slice(start, i + 1);
    const wLen = windowSlice.length;
    const wSum = windowSlice.reduce((acc, v) => acc + v, 0);
    const wMean = wSum / wLen;
    
    let wVar = 0;
    if (wLen > 1) {
      wVar = windowSlice.reduce((acc, v) => acc + Math.pow(v - wMean, 2), 0) / (wLen - 1);
    }
    const wStdDev = Math.sqrt(wVar);
    const wCv = wMean > 0 ? (wStdDev / wMean) * 100 : 0;

    result.push({
      index: i,
      week: i + 1,
      actual: data[i],
      mean: wMean,
      stdDev: wStdDev,
      cv: wCv,
      upperBand: wMean + wStdDev,
      lowerBand: Math.max(0, wMean - wStdDev),
    });
  }
  return result;
}

// ============================================================================
// DEDICATED CLOSING STOCK TIME-SERIES & ROLLING DYNAMICS CHART
// ============================================================================
function ClosingStockRollingTrendChart({ data, rollingData, windowSize, persona, showVolatilityBand = true }) {
  const W = 900, H = 280, ML = 64, MR = 28, MT = 28, MB = 36;
  const yMax = 2600, yMin = 900;
  const cap = PLANT_CAPACITY_LIMIT;

  const x = (i) => ML + (i / (data.length - 1)) * (W - ML - MR);
  const y = (v) => MT + (1 - (v - yMin) / (yMax - yMin)) * (H - MT - MB);

  // Path for Actual Closing Stock Line
  const actualLinePath = data.map((v, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');

  // Path for Rolling Mean Line
  const rollingLinePath = rollingData.map((d, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(d.mean).toFixed(1)}`).join(' ');

  // Area Path for Volatility Ribbon (+/- 1 Std Dev)
  const upperPoints = rollingData.map((d, i) => `${x(i).toFixed(1)},${y(d.upperBand).toFixed(1)}`);
  const lowerPoints = [...rollingData].reverse().map((d, i) => {
    const originalIdx = rollingData.length - 1 - i;
    return `${x(originalIdx).toFixed(1)},${y(d.lowerBand).toFixed(1)}`;
  });
  const volatilityBandPath = `M ${upperPoints.join(' L ')} L ${lowerPoints.join(' L ')} Z`;

  return (
    <div className="w-full">
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="w-full block" role="img" aria-label="Weekly closing stock trend with rolling baseline and capacity ceiling">
        <defs>
          <linearGradient id="volatilityGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.16" />
            <stop offset="100%" stopColor="var(--primary)" stopOpacity="0.03" />
          </linearGradient>
        </defs>

        {/* Y-Axis Grid Lines & Tick Labels */}
        {[1000, 1500, 2000, 2500].map((v) => (
          <g key={v}>
            <line x1={ML} x2={W - MR} y1={y(v)} y2={y(v)} stroke="var(--border)" strokeWidth={1} strokeDasharray={v === 2000 ? "none" : "2 2"} />
            <text x={8} y={y(v) + 4} fontSize={11} fill="var(--subtle)" className="font-mono">
              {v.toLocaleString()} EA
            </text>
          </g>
        ))}

        {/* Policy/Capacity Ceiling Line */}
        <line x1={ML} x2={W - MR} y1={y(cap)} y2={y(cap)} stroke="var(--warning)" strokeDasharray="4 4" strokeWidth={1.5} />
        <text x={ML + 8} y={y(cap) - 6} fontSize={11} fill="var(--warning-tx)" textAnchor="start" fontWeight={600}>
          ■ Plant 1 Storage Policy Ceiling: {cap.toLocaleString()} EA
        </text>

        {/* Rolling Volatility Band (Ribbon) */}
        {showVolatilityBand && (
          <path d={volatilityBandPath} fill="url(#volatilityGrad)" stroke="none" />
        )}

        {/* Rolling Closing Stock Mean Line */}
        <path d={rollingLinePath} fill="none" stroke="var(--info-tx)" strokeWidth={2.2} strokeDasharray="5 3" />

        {/* Actual Closing Stock Line */}
        <path d={actualLinePath} fill="none" stroke="var(--primary)" strokeWidth={2} />

        {/* Data Point Markers & Anomalies */}
        {data.map((v, i) => {
          const isStatSpike = v > 2200; // Week 21 (2,410 EA, z=3.61 stock build)
          const isCapBreach = !isStatSpike && v > cap; // Week 27 (2,050 EA cap breach)
          const cx = x(i);
          const cy = y(v);

          if (isStatSpike) {
            const dSize = 6.5;
            const points = `${cx},${cy - dSize} ${cx + dSize},${cy} ${cx},${cy + dSize} ${cx - dSize},${cy}`;
            return (
              <g key={i}>
                <polygon points={points} fill="var(--error)" stroke="#fff" strokeWidth={1.5} />
                <text x={cx} y={cy - 12} fontSize={11} fill="var(--error-tx)" textAnchor="middle" fontWeight={700}>
                  ◆ Wk {i + 1} · {persona === 'ds' ? 'Anomaly (z=3.61, 2,410 EA)' : 'Stock Surge (2,410 EA)'}
                </text>
              </g>
            );
          }

          if (isCapBreach) {
            const sSize = 9;
            return (
              <g key={i}>
                <rect x={cx - sSize / 2} y={cy - sSize / 2} width={sSize} height={sSize} rx={1.5} fill="var(--warning)" stroke="#fff" strokeWidth={1.5} />
                <text x={cx} y={cy - 12} fontSize={11} fill="var(--warning-tx)" textAnchor="middle" fontWeight={700}>
                  ■ Wk {i + 1} · Cap Breach ({v.toLocaleString()} EA)
                </text>
              </g>
            );
          }

          return (
            <circle key={i} cx={cx} cy={cy} r={2.5} fill="var(--primary)" />
          );
        })}

        {/* Baseline Axis */}
        <line x1={ML} x2={W - MR} y1={H - MB} y2={H - MB} stroke="var(--border-strong)" />

        {/* X-Axis Ticks */}
        {[1, 5, 10, 15, 20, 25, 30].map((wk) => {
          const tickX = x(wk - 1);
          return (
            <g key={wk}>
              <line x1={tickX} x2={tickX} y1={H - MB} y2={H - MB + 5} stroke="var(--border-strong)" />
              <text x={tickX} y={H - MB + 18} fontSize={11} fill="var(--subtle)" textAnchor="middle" className="font-mono">
                Wk {wk}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Chart Legend */}
      <div className="flex items-center justify-between flex-wrap gap-3 pt-2 px-1 text-xs border-t border-border mt-1">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-0.5 bg-primary inline-block rounded" />
            <span className="text-ink font-medium">Weekly Closing Stock</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-0.5 border-t-2 border-dashed border-info-tx inline-block" />
            <span className="text-info-tx font-medium">{windowSize}-Week Rolling Baseline</span>
          </div>
          {showVolatilityBand && (
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-2 bg-primary/20 inline-block rounded-sm" />
              <span className="text-subtle">Rolling Stock Dispersion (±1σ)</span>
            </div>
          )}
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-0.5 border-t border-dashed border-warning inline-block" />
            <span className="text-warning-tx font-medium">Storage Policy Cap (2,000 EA)</span>
          </div>
        </div>
        <div className="flex items-center gap-3 text-subtle font-mono text-[11px]">
          <span>◆ Outlier (&gt;3σ)</span>
          <span>■ Capacity Breach</span>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// AUXILIARY BIVARIATE SCATTER CHARTS
// ============================================================================
function OrderQtyVsCostScatterChart() {
  const W = 500, H = 300, ML = 55, MR = 20, MT = 20, MB = 38;
  const x = (v) => ML + ((v - 200) / 2800) * (W - ML - MR);
  const y = (v) => MT + (1 - (v - 65) / 35) * (H - MT - MB);

  const points = [
    [300, 95.0], [400, 91.0], [500, 88.0], [600, 85.5], [700, 83.0], [800, 81.5],
    [900, 80.0], [1000, 79.0], [1200, 76.5], [1400, 74.5], [1600, 73.0], [1800, 72.2],
    [2000, 71.5], [2200, 71.0], [2400, 70.5], [2600, 70.2], [2800, 70.0], [3000, 69.8],
  ];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="w-full" role="img" aria-label="Scatter of order batch quantity against unit purchase cost">
      {[500, 1000, 2000, 3000].map((v) => (
        <g key={v}>
          <line x1={x(v)} x2={x(v)} y1={MT} y2={H - MB} stroke="var(--muted-fill)" />
          <text x={x(v)} y={H - MB + 16} fontSize={11} fill="var(--subtle)" textAnchor="middle" className="font-mono">{v}</text>
        </g>
      ))}
      {[70, 80, 90, 100].map((v) => (
        <g key={v}>
          <line x1={ML} x2={W - MR} y1={y(v)} y2={y(v)} stroke="var(--muted-fill)" />
          <text x={8} y={y(v) + 4} fontSize={11} fill="var(--subtle)" className="font-mono">${v}</text>
        </g>
      ))}
      <line x1={x(300)} y1={y(95)} x2={x(2900)} y2={y(70)} stroke="var(--primary)" strokeWidth={2} strokeDasharray="5 4" />
      {points.map((p, i) => (
        <circle key={i} cx={x(p[0])} cy={y(p[1])} r={3.5} fill="var(--ink)" fillOpacity={0.65} />
      ))}
      <text x={x(1300)} y={y(83)} fontSize={11} fill="var(--info-tx)" fontWeight={600} textAnchor="start">
        Power-law empirical fit: r = -0.68
      </text>
      <line x1={x(1200)} x2={x(1200)} y1={MT} y2={H - MB} stroke="var(--success)" strokeWidth={1} strokeDasharray="3 3" />
      <text x={x(1220)} y={MT + 14} fontSize={11} fill="var(--success)" fontWeight={600}>
        Observed discount threshold (≥1,200 EA)
      </text>
      <line x1={ML} x2={W - MR} y1={H - MB} y2={H - MB} stroke="var(--border-strong)" />
      <line x1={ML} x2={ML} y1={MT} y2={H - MB} stroke="var(--border-strong)" />
      <text x={(ML + W - MR) / 2} y={H - 4} fontSize={11} fill="var(--subtle)" textAnchor="middle">Order Batch Quantity (EA)</text>
    </svg>
  );
}

function DemandVsOnTimeScatterChart() {
  const W = 500, H = 300, ML = 55, MR = 20, MT = 20, MB = 38;
  const x = (v) => ML + ((v - 5) / 45) * (W - ML - MR);
  const y = (v) => MT + (1 - (v - 75) / 25) * (H - MT - MB);

  const points = [
    [8, 98.5], [10, 97.8], [12, 98.0], [14, 96.5], [16, 95.8], [18, 96.0],
    [20, 94.5], [22, 93.8], [24, 93.0], [26, 90.5], [28, 88.2], [30, 87.5],
    [33, 85.0], [36, 83.5], [40, 81.0], [44, 79.2], [48, 77.0],
  ];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="w-full" role="img" aria-label="Scatter of demand volatility against supplier on-time rate">
      {[10, 20, 30, 40, 50].map((v) => (
        <g key={v}>
          <line x1={x(v)} x2={x(v)} y1={MT} y2={H - MB} stroke="var(--muted-fill)" />
          <text x={x(v)} y={H - MB + 16} fontSize={11} fill="var(--subtle)" textAnchor="middle" className="font-mono">{v}%</text>
        </g>
      ))}
      {[80, 85, 90, 95, 100].map((v) => (
        <g key={v}>
          <line x1={ML} x2={W - MR} y1={y(v)} y2={y(v)} stroke="var(--muted-fill)" />
          <text x={8} y={y(v) + 4} fontSize={11} fill="var(--subtle)" className="font-mono">{v}%</text>
        </g>
      ))}
      <line x1={x(8)} y1={y(98)} x2={x(48)} y2={y(77)} stroke="var(--primary)" strokeWidth={2} strokeDasharray="5 4" />
      {points.map((p, i) => (
        <circle key={i} cx={x(p[0])} cy={y(p[1])} r={3.5} fill="var(--ink)" fillOpacity={0.65} />
      ))}
      <text x={x(22)} y={y(95)} fontSize={11} fill="var(--info-tx)" fontWeight={600} textAnchor="start">
        Empirical relationship: r = -0.61
      </text>
      <line x1={x(25)} x2={x(25)} y1={MT} y2={H - MB} stroke="var(--error)" strokeWidth={1} strokeDasharray="3 3" />
      <text x={x(26)} y={MT + 14} fontSize={11} fill="var(--error)" fontWeight={600}>
        Volatility risk threshold (CV &gt; 25%)
      </text>
      <line x1={ML} x2={W - MR} y1={H - MB} y2={H - MB} stroke="var(--border-strong)" />
      <line x1={ML} x2={ML} y1={MT} y2={H - MB} stroke="var(--border-strong)" />
      <text x={(ML + W - MR) / 2} y={H - 4} fontSize={11} fill="var(--subtle)" textAnchor="middle">Demand Coefficient of Variation (CV %)</text>
    </svg>
  );
}

// ============================================================================
// MAIN DESCRIPTIVE ANALYTICS VIEW
// ============================================================================
export default function Descriptive({ defaultSection = 'univariate' }) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { persona, selectedMaterial } = usePlatform();

  const urlSection = searchParams.get('section');
  const initialSection = urlSection === 'bivariate' || urlSection === 'bi' 
    ? 'bivariate' 
    : defaultSection === 'bivariate' || defaultSection === 'bi' 
    ? 'bivariate' 
    : 'univariate';

  const [activeSection, setActiveSection] = useState(initialSection);
  const [selectedRollingWindow, setSelectedRollingWindow] = useState(4); // Default to 4-week window
  const [selectedRelId, setSelectedRelId] = useState('lt_vs_stockout');

  // Sync state with URL parameter if it changes
  useEffect(() => {
    if (urlSection === 'bivariate' || urlSection === 'bi') {
      setActiveSection('bivariate');
    } else if (urlSection === 'univariate' || urlSection === 'uni') {
      setActiveSection('univariate');
    }
  }, [urlSection]);

  const handleSectionChange = (sectionKey) => {
    setActiveSection(sectionKey);
    setSearchParams({ section: sectionKey });
  };

  // Compute canonical summary stats and rolling data for Closing Stock
  const seriesStats = useMemo(() => computeSeriesStats(CLOSING_STOCK_SERIES), []);
  const rollingData = useMemo(() => computeRollingSeries(CLOSING_STOCK_SERIES, selectedRollingWindow), [selectedRollingWindow]);
  const currentRollingPoint = rollingData[rollingData.length - 1];
  const currentClosingStock = CLOSING_STOCK_SERIES[CLOSING_STOCK_SERIES.length - 1];

  // Derived business metrics for executive/analyst personas
  const stockGrowthVsBaseline = ((currentClosingStock - HISTORICAL_BASELINE_MEAN) / HISTORICAL_BASELINE_MEAN) * 100;
  const currentClosingStockValuationM = (currentClosingStock * UNIT_COST_BASELINE) / 1000;
  const totalWarehouseWorkingCapitalM = (13000.0 * UNIT_COST_BASELINE) / 1000000; // $1.02M total physical position
  const weeklyStockSpreadValueK = (seriesStats.stdDev * UNIT_COST_BASELINE) / 1000;
  const storageCapacityUtilizationPct = (currentClosingStock / PLANT_CAPACITY_LIMIT) * 100;
  const storageCapacityHeadroomPct = 100 - storageCapacityUtilizationPct;

  const subtitleText = {
    ds: 'Statistical properties, stationarity diagnostics, rolling baseline moments, and empirical cross-variable correlation matrices for Closing Stock modeling.',
    analyst: 'Operational closing stock levels, rolling buffer baselines, storage capacity breach events, and driver discovery for lot-size calibration.',
    exec: 'Executive closing stock momentum, warehouse capital commitment, plant storage headroom, and catalog supply chain risk exposure.',
  }[persona] || 'Canonical Closing Stock profiling, rolling buffer dynamics, and cross-variable relationship discovery.';

  return (
    <motion.section 
      className="view max-w-7xl mx-auto space-y-5"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22 }}
    >
      {/* Top Header */}
      <ViewHead
        title="Descriptive Analytics"
        subtitle={<p className="text-sm text-body-c leading-relaxed">{subtitleText}</p>}
        actions={
          <div className="flex items-center gap-2">
            <Badge tone={selectedMaterial.abcClass === 'A' ? 'accent' : 'neutral'} className="font-mono text-xs">
              <span className="font-mono">{selectedMaterial.id}</span> · Class {selectedMaterial.abcClass}
            </Badge>
            <Badge tone="neutral" className="text-xs font-mono">
              104 Wks Signal
            </Badge>
          </div>
        }
      />

      {/* ===================================================================== */}
      {/* SECTION SWITCHER: UNIVARIATE VS BIVARIATE                             */}
      {/* ===================================================================== */}
      <div className="bg-surface border border-border rounded-xl p-1.5 shadow-subtle">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {/* Section 1: Univariate Analysis Button */}
          <button
            type="button"
            onClick={() => handleSectionChange('univariate')}
            className={`p-3 sm:p-3.5 rounded-lg text-left transition-all relative flex items-start gap-3 cursor-pointer ${
              activeSection === 'univariate'
                ? 'bg-info-bg/70 border border-primary text-ink shadow-sm'
                : 'bg-transparent border border-transparent hover:bg-bg text-subtle hover:text-ink'
            }`}
          >
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border transition-colors ${
                activeSection === 'univariate'
                  ? 'bg-primary-solid text-white border-primary'
                  : 'bg-bg text-subtle border-border'
              }`}
            >
              <LineChart size={16} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 mb-0.5">
                <span className="font-heading text-sm font-bold tracking-tight text-ink">
                  Univariate Analysis
                </span>
                {activeSection === 'univariate' ? (
                  <Badge tone="accent" className="text-[10px] uppercase font-bold py-0.5">
                    Active
                  </Badge>
                ) : (
                  <span className="text-xs font-mono text-subtle">Closing Stock</span>
                )}
              </div>
              <p className="text-xs text-body-c leading-snug line-clamp-1 m-0">
                Deep temporal & rolling analysis of the canonical dependent variable: Weekly Closing Stock.
              </p>
            </div>
          </button>

          {/* Section 2: Bivariate Analysis Button */}
          <button
            type="button"
            onClick={() => handleSectionChange('bivariate')}
            className={`p-3 sm:p-3.5 rounded-lg text-left transition-all relative flex items-start gap-3 cursor-pointer ${
              activeSection === 'bivariate'
                ? 'bg-info-bg/70 border border-primary text-ink shadow-sm'
                : 'bg-transparent border border-transparent hover:bg-bg text-subtle hover:text-ink'
            }`}
          >
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border transition-colors ${
                activeSection === 'bivariate'
                  ? 'bg-primary-solid text-white border-primary'
                  : 'bg-bg text-subtle border-border'
              }`}
            >
              <ScatterChart size={16} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 mb-0.5">
                <span className="font-heading text-sm font-bold tracking-tight text-ink">
                  Bivariate Analysis
                </span>
                {activeSection === 'bivariate' ? (
                  <Badge tone="accent" className="text-[10px] uppercase font-bold py-0.5">
                    Active
                  </Badge>
                ) : (
                  <span className="text-xs font-mono text-subtle">Driver Heatmap</span>
                )}
              </div>
              <p className="text-xs text-body-c leading-snug line-clamp-1 m-0">
                Cross-variable correlation matrix and empirical scatter diagnostics between Closing Stock and candidate drivers.
              </p>
            </div>
          </button>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* SECTION 1: UNIVARIATE ANALYSIS (CANONICAL CLOSING STOCK)              */}
      {/* ===================================================================== */}
      {activeSection === 'univariate' && (
        <motion.div
          key="section-univariate"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="space-y-4"
        >
          {/* Canonical Dependent Variable Context Header */}
          <div className="card p-3.5 mb-0 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="font-heading text-xs font-bold text-ink flex items-center gap-1.5">
                <Package size={14} className="text-primary" />
                Dependent Variable: <span className="text-primary font-bold">Closing Stock</span>
              </span>
              <span className="text-xs text-subtle font-mono">
                · {selectedMaterial.id} ({selectedMaterial.name}) · {selectedMaterial.plant}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Badge tone="neutral" className="text-[10px] font-mono py-0.5">Field: {CANONICAL_DEPENDENT_VARIABLE.field}</Badge>
              <Badge tone="accent" className="text-[10px] font-mono py-0.5">Source: {CANONICAL_DEPENDENT_VARIABLE.sourceTable}</Badge>
            </div>
          </div>

          {/* Persona-Specific Primary KPI Group */}
          <AnimatePresence mode="wait">
            {persona === 'ds' && (
              <motion.div
                key="ds-uni-kpis"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3"
              >
                <KpiTile
                  label="Central Tendency & Median"
                  value={`${seriesStats.mean.toFixed(2)} EA`}
                  sub={`Median ${seriesStats.median.toFixed(2)} EA · IQR ${seriesStats.iqr.toFixed(2)} EA (P25: ${seriesStats.p25.toFixed(0)} · P75: ${seriesStats.p75.toFixed(0)})`}
                />
                <KpiTile
                  label="OLS Drift Slope (β₁)"
                  value={`+${seriesStats.slope.toFixed(2)} EA/wk`}
                  delta={`+${((seriesStats.slope / HISTORICAL_BASELINE_MEAN) * 100).toFixed(2)}%/wk (p < 0.001)`}
                  deltaTone="up"
                  sub={`R² = ${seriesStats.r2.toFixed(3)} · Significant upward stock drift`}
                />
                <KpiTile
                  label="Dispersion & Distribution (σ)"
                  value={`${seriesStats.stdDev.toFixed(2)} EA`}
                  sub={`CV = ${seriesStats.cv.toFixed(2)}% · Skewness = +1.18 · Kurtosis = 4.22`}
                />
                <KpiTile
                  label="Rolling Volatility & Periodicity"
                  value={`${currentRollingPoint.cv.toFixed(1)}% CV`}
                  sub={`Selected ${selectedRollingWindow}W window · T=13 stock cycle (ACF₁ = 0.68)`}
                />
              </motion.div>
            )}

            {persona === 'analyst' && (
              <motion.div
                key="analyst-uni-kpis"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3"
              >
                <KpiTile
                  label="Current Closing Stock Position"
                  value={`${currentClosingStock.toFixed(2)} EA`}
                  delta={`+${stockGrowthVsBaseline.toFixed(2)}% vs baseline`}
                  deltaTone="up"
                  sub={`Historical 104-wk baseline: ${HISTORICAL_BASELINE_MEAN.toFixed(2)} EA`}
                />
                <KpiTile
                  label={`${selectedRollingWindow}-Week Rolling Baseline`}
                  value={`${currentRollingPoint.mean.toFixed(2)} EA`}
                  delta={`Trajectory: +${seriesStats.slope.toFixed(2)} EA/wk`}
                  deltaTone="up"
                  sub={`${selectedRollingWindow}W moving average smooths weekly stock fluctuation`}
                />
                <KpiTile
                  label="Closing Stock Volatility"
                  value={`Moderate (CV ${seriesStats.cv.toFixed(1)}%)`}
                  sub={`Weekly spread ±${seriesStats.stdDev.toFixed(2)} EA (±$${weeklyStockSpreadValueK.toFixed(2)}K/wk)`}
                />
                <KpiTile
                  label="Operational Exception Weeks"
                  value="2 Breach Weeks"
                  delta="1 surge · 1 cap breach"
                  deltaTone="down"
                  sub="Wk 21 surge (2,410 EA) · Wk 27 cap (2,050 EA)"
                />
              </motion.div>
            )}

            {persona === 'exec' && (
              <motion.div
                key="exec-uni-kpis"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3"
              >
                <KpiTile
                  label="Closing Stock Momentum"
                  value={`EXPANDING (+${stockGrowthVsBaseline.toFixed(1)}%)`}
                  delta="Positive Buffer Build"
                  deltaTone="up"
                  sub={`Current ${currentClosingStock.toLocaleString()} EA vs ${HISTORICAL_BASELINE_MEAN.toFixed(0)} EA baseline`}
                />
                <KpiTile
                  label="Warehouse Working Capital"
                  value={`$${totalWarehouseWorkingCapitalM.toFixed(2)}M Total`}
                  sub={`Current position valuation ($${UNIT_COST_BASELINE}/EA unit cost)`}
                />
                <KpiTile
                  label="Volatility Capital Exposure"
                  value={`±$${weeklyStockSpreadValueK.toFixed(2)}K / Week`}
                  sub={`Moderate variance (CV ${seriesStats.cv.toFixed(1)}%) requires active buffer sizing`}
                />
                <KpiTile
                  label="Plant Storage Headroom"
                  value={`${storageCapacityHeadroomPct.toFixed(1)}% Remaining`}
                  delta={`${storageCapacityUtilizationPct.toFixed(1)}% Storage Utilization`}
                  deltaTone="down"
                  sub={`Current rate approaching ${PLANT_CAPACITY_LIMIT.toLocaleString()} EA storage limit`}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Primary Visualization Card with Rolling Controls */}
          <div className="card mb-0 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-2.5 border-b border-border">
              <div>
                <h2 className="card__title font-heading text-base font-bold text-ink m-0">
                  {persona === 'ds'
                    ? 'Closing Stock Series Decomposition & Rolling Statistical Dynamics'
                    : persona === 'analyst'
                    ? 'Weekly Closing Stock Trajectory & Rolling Buffer Baseline'
                    : 'Closing Stock Trajectory & Plant Storage Policy Envelope'}
                </h2>
                <p className="card__sub text-xs text-subtle mt-0.5">
                  {persona === 'ds'
                    ? `Trailing closing stock series showing linear drift (+${seriesStats.slope.toFixed(2)} EA/wk, R²=${seriesStats.r2.toFixed(2)}) with ${selectedRollingWindow}-week rolling mean & dispersion band`
                    : persona === 'analyst'
                    ? `Comparing weekly closing stock against ${selectedRollingWindow}-week moving baseline with flagged operational surge thresholds`
                    : `Sustained closing stock buffer build ($${totalWarehouseWorkingCapitalM.toFixed(2)}M capital commitment) operating within Plant 1 storage envelope`}
                </p>
              </div>

              {/* Interactive Rolling Window Selector */}
              <div className="flex items-center gap-1.5 self-start sm:self-auto bg-bg p-1 rounded-lg border border-border">
                <span className="text-[11px] text-subtle font-medium px-2 flex items-center gap-1">
                  <Sliders size={12} />
                  Rolling Window:
                </span>
                {ROLLING_WINDOWS.map((rw) => (
                  <button
                    key={rw.key}
                    type="button"
                    onClick={() => setSelectedRollingWindow(rw.key)}
                    className={`px-2.5 py-1 text-xs font-semibold rounded transition-all cursor-pointer ${
                      selectedRollingWindow === rw.key
                        ? 'bg-primary text-white shadow-xs'
                        : 'text-subtle hover:text-ink hover:bg-surface'
                    }`}
                  >
                    {rw.shortLabel}
                  </button>
                ))}
              </div>
            </div>

            {/* Rolling Visual Display */}
            <div className="chart-shell">
              <ClosingStockRollingTrendChart
                data={CLOSING_STOCK_SERIES}
                rollingData={rollingData}
                windowSize={selectedRollingWindow}
                persona={persona}
                showVolatilityBand={persona !== 'exec'}
              />
            </div>
          </div>

          {/* Persona-Specific Concise Interpretation & Optional Evidence */}
          <div className="card mb-0 space-y-3">
            {persona === 'ds' && (
              <>
                <Insight label="Statistical Process & Temporal Behavior">
                  Historical closing stock demonstrates a statistically significant positive linear drift (OLS β₁ = +{seriesStats.slope.toFixed(2)} EA/wk, R² = {seriesStats.r2.toFixed(3)}, p &lt; 0.001) with moderate dispersion (CV {seriesStats.cv.toFixed(2)}%). The {selectedRollingWindow}-week rolling baseline highlights non-stationarity and persistence (ACF₁ = 0.68, quarterly cycle T=13), confirming closing stock is non-stationary and requires first-order differencing or trend terms in downstream multivariate forecasting.
                </Insight>
                <WhyDisclosure
                  summary="Statistical Diagnostics & Parameter Decomposition"
                  drivers={[
                    `OLS Linear Drift: +${seriesStats.slope.toFixed(2)} EA/wk (Normalized +${((seriesStats.slope / HISTORICAL_BASELINE_MEAN) * 100).toFixed(2)}%/wk of baseline, R² = ${seriesStats.r2.toFixed(3)}, p < 0.001)`,
                    `Distributional Moments: Mean = ${seriesStats.mean.toFixed(2)} EA, Median = ${seriesStats.median.toFixed(2)} EA, σ = ${seriesStats.stdDev.toFixed(2)} EA, Skewness = +1.18, Kurtosis = 4.22`,
                    `Rolling Dynamics (${selectedRollingWindow}W): Current rolling closing stock mean = ${currentRollingPoint.mean.toFixed(2)} EA, rolling CV = ${currentRollingPoint.cv.toFixed(2)}%`,
                    `Autocorrelation & Seasonality: ACF(1) = 0.68, dominant Fourier spectral harmonic T = 13 weeks (strength 0.31)`,
                  ]}
                  meaning={[
                    'Non-Stationary Target: Mean and rolling variance of closing stock drift upward over time; the raw series requires explicit trend modeling or differencing',
                    'Right-Tail Asymmetry: Positive skewness (+1.18) indicates stock accumulation surges occur more abruptly than gradual depletion runs',
                    'Autoregressive Persistence: High lag-1 autocorrelation confirms strong temporal dependency across consecutive weekly closing balances',
                  ]}
                  action={[
                    'Pass OLS trend coefficient and rolling closing stock baseline to Multivariate Forecast as the primary dependent variable target parameters',
                    'Incorporate 13-week harmonic terms to capture quarterly cyclical inventory buildup cycles',
                    'Treat Week 21 observation (z=3.61, 2,410 EA) as an exogenous accumulation shock rather than standard Gaussian noise',
                  ]}
                />
              </>
            )}

            {persona === 'analyst' && (
              <>
                <Insight label="Operational Closing Stock Velocity & Baseline Finding">
                  Closing stock is running +{stockGrowthVsBaseline.toFixed(2)}% above historical baseline at {currentClosingStock.toLocaleString()} EA, supported by an expanding {selectedRollingWindow}-week rolling baseline of {currentRollingPoint.mean.toFixed(2)} EA. Historical stock accumulation breached the {PLANT_CAPACITY_LIMIT.toLocaleString()} EA Plant 1 storage cap in Week 27 (2,050 EA), signaling that current replenishment parameters require lot-size recalibration.
                </Insight>
                <WhyDisclosure
                  summary="Operational Driver Breakdown & Replenishment Signals"
                  drivers={[
                    `Current closing stock position is elevated at ${currentClosingStock.toLocaleString()} EA vs ${HISTORICAL_BASELINE_MEAN.toFixed(0)} EA baseline (+${stockGrowthVsBaseline.toFixed(1)}% buffer accumulation)`,
                    `The ${selectedRollingWindow}-week moving average currently sits at ${currentRollingPoint.mean.toFixed(2)} EA, confirming a sustained upward stock regime`,
                    `Week 21 stock buildup reached 2,410 EA ($${((2410 * UNIT_COST_BASELINE) / 1000).toFixed(1)}K valuation), exceeding normal warehouse staging space`,
                    `Week 27 peak hit 2,050 EA, breaching the ${PLANT_CAPACITY_LIMIT.toLocaleString()} EA physical warehouse storage cap by 2.50%`,
                  ]}
                  meaning={[
                    'Current operational closing stock is systematically drifting above historical baseline averages',
                    'Fixed ordering policies based on trailing 104-week means risk inventory bloat during sustained expansion runs',
                    'Plant 1 warehouse storage capacity limits create a physical bottleneck during peak replenishment cycles',
                  ]}
                  action={[
                    'Review reorder point (ROP) and safety stock buffers in downstream EOQ lot-size calibration',
                    'Coordinate with Plant 1 warehouse operations regarding the 2,000 EA storage cap',
                  ]}
                />
              </>
            )}

            {persona === 'exec' && (
              <>
                <Insight label="Executive Closing Stock Momentum & Capital Summary">
                  Warehouse working capital committed to this material stands at ${totalWarehouseWorkingCapitalM.toFixed(2)}M across active inventory, with sustained buffer growth (+{stockGrowthVsBaseline.toFixed(1)}% over historical baseline). Plant 1 warehouse is operating at {storageCapacityUtilizationPct.toFixed(1)}% storage capacity utilization, leaving {storageCapacityHeadroomPct.toFixed(1)}% headroom before physical storage limits bind.
                </Insight>
                <WhyDisclosure
                  summary="Business Risk & Capital Allocation Signals"
                  drivers={[
                    `Closing stock position expanding at +${stockGrowthVsBaseline.toFixed(1)}% pace across $${totalWarehouseWorkingCapitalM.toFixed(2)}M in warehouse working capital`,
                    `Weekly closing stock valuation sits at $${currentClosingStockValuationM.toFixed(1)}K with a ±$${weeklyStockSpreadValueK.toFixed(1)}K weekly volatility band`,
                    `Plant 1 storage utilization at ${storageCapacityUtilizationPct.toFixed(1)}% ($${((PLANT_CAPACITY_LIMIT * UNIT_COST_BASELINE) / 1000).toFixed(1)}K capacity threshold)`,
                  ]}
                  meaning={[
                    'Closing stock growth reflects deliberate buffer building to protect production against upstream supplier volatility',
                    'Current working capital buffer is sufficient for normal demand variability but tight against storage caps during peak batches',
                    `Operating headroom (${storageCapacityHeadroomPct.toFixed(1)}%) provides runway for near-term inventory positioning before warehouse space expansion is required`,
                  ]}
                  action={[
                    'Maintain active buffer sizing to balance service-level protection against working capital lockup',
                    'Monitor warehouse storage headroom in executive supply chain reviews',
                  ]}
                />
              </>
            )}
          </div>

          {/* Section Transition Footer */}
          <div className="flex items-center justify-between pt-3 border-t border-border">
            <span className="text-xs text-subtle">
              Finished Single-Variable Closing Stock profiling? Next explore cross-variable explanatory drivers.
            </span>
            <Button
              type="button"
              variant="primary"
              onClick={() => handleSectionChange('bivariate')}
              className="gap-2 text-xs font-semibold cursor-pointer"
            >
              <span>Explore Bivariate Relationships</span>
              <ArrowRight size={14} />
            </Button>
          </div>
        </motion.div>
      )}

      {/* ===================================================================== */}
      {/* SECTION 2: BIVARIATE ANALYSIS (CROSS-VARIABLE RELATIONSHIPS)          */}
      {/* ===================================================================== */}
      {activeSection === 'bivariate' && (
        <motion.div
          key="section-bivariate"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="space-y-4"
        >
          {/* Driver Heatmap Matrix */}
          <DriverHeatmap />

          {/* Compact Relationship Selector */}
          <div className="card p-3.5 mb-0">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-2.5 mb-2.5 border-b border-border">
              <span className="font-heading text-xs font-bold text-ink">
                Candidate Explanatory Relationships (Drivers vs Closing Stock)
              </span>
              <span className="text-[11px] text-subtle">
                Select relationship to inspect empirical scatter diagnostics & driver evidence
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {BIVARIATE_RELATIONSHIPS.map((r) => {
                const isSelected = selectedRelId === r.id;
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setSelectedRelId(r.id)}
                    className={`p-2.5 rounded-lg text-left transition-all border cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'border-primary bg-info-bg/40 shadow-sm ring-1 ring-primary'
                        : 'border-border bg-surface hover:border-border-strong hover:bg-bg/50'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1.5 w-full mb-1">
                      <span className={`font-heading text-xs font-bold truncate ${isSelected ? 'text-primary' : 'text-ink'}`}>
                        {r.varA} vs {r.varB}
                      </span>
                      <Badge tone={isSelected ? 'accent' : 'neutral'} className="text-[10px] py-0 px-1 shrink-0">
                        {r.tag}
                      </Badge>
                    </div>
                    <span className="text-[11px] text-subtle font-mono truncate">
                      {r.type}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* RELATIONSHIP 1: LEAD TIME VS STOCKOUT FREQUENCY */}
          {selectedRelId === 'lt_vs_stockout' && (
            <div className="space-y-4">
              {/* Persona-Specific Relationship KPIs */}
              <AnimatePresence mode="wait">
                {persona === 'ds' && (
                  <motion.div
                    key="ds-bi-kpi"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3"
                  >
                    <KpiTile
                      label="Pearson Correlation (r)"
                      value="0.74"
                      delta="t = 6.24 · p < 0.0001"
                      deltaTone="up"
                      sub="Strong linear association with stockout risk"
                    />
                    <KpiTile
                      label="Determination (R²)"
                      value="0.548"
                      sub="54.80% of stockout variance explained"
                    />
                    <KpiTile
                      label="Spearman Rank (ρ)"
                      value="0.71"
                      sub="Monotonic rank agreement across tail"
                    />
                    <KpiTile
                      label="OLS Regression Fit"
                      value="y = 0.218x - 1.78"
                      sub="SE(β₁) = 0.035 · RMSE 1.94%"
                    />
                  </motion.div>
                )}

                {persona === 'analyst' && (
                  <motion.div
                    key="analyst-bi-kpi"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3"
                  >
                    <KpiTile
                      label="Operational Driver"
                      value="Lead Time → Stockout"
                      delta="Primary stockout driver"
                      deltaTone="down"
                      sub="Empirical link across 142 Class A SKUs"
                    />
                    <KpiTile
                      label="Association Strength"
                      value="Strong (r = 0.74)"
                      sub="54.80% of stockout variance explained"
                    />
                    <KpiTile
                      label="Critical Latency Threshold"
                      value=">45 Days Transit"
                      delta="3.2× delivery variance"
                      deltaTone="down"
                      sub="Suppliers >45d exhibit sharp failure spikes"
                    />
                    <KpiTile
                      label="High-Exposure Materials"
                      value="28 Materials"
                      sub="$11.85M spend single-sourced >45d"
                    />
                  </motion.div>
                )}

                {persona === 'exec' && (
                  <motion.div
                    key="exec-bi-kpi"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="grid grid-cols-1 sm:grid-cols-3 gap-3"
                  >
                    <KpiTile
                      label="Supply Chain Risk Signal"
                      value="HIGH EXPOSURE"
                      delta="Lead Time → Stockout Driver"
                      deltaTone="down"
                      sub="Strong correlation (r = 0.74) across catalog"
                    />
                    <KpiTile
                      label="Capital Value at Risk"
                      value="$34.28M in Scope"
                      sub="142 Class A materials subject to transit latency risk"
                    />
                    <KpiTile
                      label="Critical Vendor Cohort"
                      value="28 Single-Sourced"
                      sub="$11.85M spend tied to overseas transit >45 days"
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Scatter Visualization & Relationship Intelligence */}
              <div className="two-col">
                <div className="card mb-0">
                  <div className="card__head mb-2.5">
                    <div>
                      <h2 className="card__title font-heading text-base font-bold text-ink m-0">Supplier Lead Time vs Stockout Frequency</h2>
                      <p className="card__sub text-xs text-subtle mt-0.5">142 Class A materials ($34.28M value), trailing 12 months</p>
                    </div>
                    <Badge tone="risk">Critical Risk: &gt;45 Days</Badge>
                  </div>
                  <div className="chart-shell">
                    <BivariateScatterChart />
                  </div>
                </div>

                <div className="card mb-0 space-y-3">
                  <h2 className="card__title font-heading text-base font-bold text-ink m-0">Relationship Intelligence</h2>
                  
                  {persona === 'ds' && (
                    <>
                      <Insight label="Statistical Diagnostics">
                        Empirical correlation (r = 0.74, R² = 0.548, p &lt; 0.0001) confirms significant linear association between supplier lead time and closing stock depletion / stockout frequency across 142 Class A materials. Monotonic rank agreement (ρ = 0.71) indicates transit latency is a primary candidate feature for downstream predictive modeling.
                      </Insight>
                      <WhyDisclosure
                        summary="Statistical Methodology & Regression Diagnostics"
                        drivers={[
                          'Pearson linear correlation r = 0.74 (t = 6.24, p < 0.0001, N = 142 Class A SKUs)',
                          'Coefficient of determination R² = 0.548 (54.80% variance explained by linear transit term)',
                          'Spearman rank correlation ρ = 0.71 confirms monotonic agreement without undue leverage from outliers',
                        ]}
                        meaning={[
                          'Correlation indicates empirical covariance; unobserved confounders include supplier tiering and customs clearance variance',
                          'Residual standard error (RMSE = 1.94%) indicates moderate dispersion around linear fit',
                          'Lead time variance (σ_LT) exhibits right-skewed tail requiring non-Gaussian treatment in safety buffer models',
                        ]}
                        action={[
                          'Carry supplier lead time into Multivariate Model as a primary explanatory covariate for closing stock buffer sizing',
                          'Evaluate log-transformed lead time to linearize right-tail extreme transit events',
                        ]}
                      />
                    </>
                  )}

                  {persona === 'analyst' && (
                    <>
                      <Insight label="Operational Risk Finding">
                        Supplier transit times exceeding 45 days drive 3.2× higher delivery variance and closing stock buffer depletions. 28 single-sourced Class A materials ($11.85M exposure) account for the majority of historical stockout events.
                      </Insight>
                      <WhyDisclosure
                        summary="Operational Breakdown & Buffer Sizing Evidence"
                        drivers={[
                          'Lead times >45 days exhibit 3.20× higher delivery variance than suppliers with <20-day transit',
                          'Static safety stock models fail to account for right-skewed supplier delivery tails',
                          '28 Class A materials ($11.85M exposure) currently single-sourced without regional buffer stocking',
                        ]}
                        meaning={[
                          'Closing stock depletions originate primarily in transit latency variance rather than internal consumption spikes',
                          'Buffer sizing must scale with lead-time standard deviation rather than static averages',
                          'Operational focus on these 28 materials directly addresses the primary source of historical stockouts',
                        ]}
                        action={[
                          'Incorporate lead-time variance into safety buffer calculations in downstream EOQ/Safety Stock',
                          'Investigate dual-sourcing options for SKUs with >45-day lead times',
                        ]}
                      />
                    </>
                  )}

                  {persona === 'exec' && (
                    <>
                      <Insight label="Executive Supply Chain Risk Signal">
                        Supplier delivery latency is the single largest external predictor of inventory stockouts across $34.28M in Class A inventory, with transit delays over 45 days creating severe stockout exposure across 28 single-sourced materials.
                      </Insight>
                      <WhyDisclosure
                        summary="Executive Risk Drivers & Downstream Governance"
                        drivers={[
                          'Supplier transit latency directly drives stockout exposure across $34.28M in Class A catalog value',
                          '28 critical overseas materials ($11.85M spend) lack regional safety buffers or secondary suppliers',
                        ]}
                        meaning={[
                          'Supply chain vulnerability is concentrated in extended-transit overseas supply lines',
                          'Mitigating transit risk requires strategic vendor agreements and localized buffer sizing',
                        ]}
                        action={[
                          'Prioritize supply assurance agreements and vendor-managed buffers for top-tier Class A suppliers',
                          'Pass risk evidence to ABC & Inventory Policy for governance review',
                        ]}
                      />
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* RELATIONSHIP 2: ORDER QUANTITY VS UNIT COST */}
          {selectedRelId === 'order_qty_vs_cost' && (
            <div className="two-col">
              <div className="card mb-0">
                <div className="card__head mb-2.5">
                  <div>
                    <h2 className="card__title font-heading text-base font-bold text-ink m-0">Order Quantity vs Unit Purchase Cost</h2>
                    <p className="card__sub text-xs text-subtle mt-0.5">Scale discounts vs holding cost trade-off across catalog order batches</p>
                  </div>
                  <Badge tone="accent">r = -0.68 · Scale Economics</Badge>
                </div>
                <div className="chart-shell"><OrderQtyVsCostScatterChart /></div>
              </div>

              <div className="card mb-0 space-y-3">
                <h2 className="card__title font-heading text-base font-bold text-ink m-0">Batch Sizing Summary</h2>
                <Insight label="Scale Elasticity">
                  {persona === 'ds'
                    ? 'Unit purchase price exhibits an empirical inverse relationship with batch size (r = -0.68). Marginal savings plateau above 1,200 EA while holding costs scale linearly.'
                    : persona === 'analyst'
                    ? 'Supplier volume discounts plateau at 1,200 EA batch sizes. Ordering beyond 1,200 EA increases carrying cost without delivering meaningful unit price savings.'
                    : 'Procurement scale discounts deliver savings up to 1,200 EA batch tiers; order quantities beyond this threshold tie up working capital with diminishing price returns.'}
                </Insight>
                <WhyDisclosure
                  summary="Scale Elasticity & Lot Sizing Evidence"
                  drivers={[
                    'Suppliers offer tiered pricing discounts up to 1,200 EA batch thresholds',
                    'Holding costs scale at 6.00% annual carrying rate on average warehouse closing stock valuation',
                  ]}
                  meaning={[
                    'Optimal lot sizing balances supplier volume discounts against working capital carrying costs',
                    'Batch recalibration delivers working capital release without sacrificing contractual discount tiers',
                  ]}
                  action={[
                    'Pass scale curve to EOQ Optimization for mathematical lot-size calibration',
                  ]}
                />
              </div>
            </div>
          )}

          {/* RELATIONSHIP 3: DEMAND VOLATILITY VS SUPPLIER ON-TIME RATE */}
          {selectedRelId === 'demand_vs_ontime' && (
            <div className="two-col">
              <div className="card mb-0">
                <div className="card__head mb-2.5">
                  <div>
                    <h2 className="card__title font-heading text-base font-bold text-ink m-0">Demand Volatility (CV) vs Supplier On-Time Rate</h2>
                    <p className="card__sub text-xs text-subtle mt-0.5">Fulfillment strain: High-volatility SKUs exhibit lower supplier on-time delivery</p>
                  </div>
                  <Badge tone="watch">r = -0.61 · Fulfillment Stress</Badge>
                </div>
                <div className="chart-shell"><DemandVsOnTimeScatterChart /></div>
              </div>

              <div className="card mb-0 space-y-3">
                <h2 className="card__title font-heading text-base font-bold text-ink m-0">Volatility Impact Summary</h2>
                <Insight label="Bullwhip Stress">
                  {persona === 'ds'
                    ? 'Empirical relationship indicates demand volatility is negatively associated with vendor on-time delivery (r = -0.61). High-CV SKUs (>25%) experience amplified fulfillment latency.'
                    : persona === 'analyst'
                    ? 'Erratic order patterns disrupt supplier schedules: materials with demand CV >25% suffer a drop in on-time delivery from 98.5% to 77.0%.'
                    : 'Internal order volatility directly degrades supplier reliability, dropping vendor on-time rates from 98% to 77% on high-variability SKUs.'}
                </Insight>
                <WhyDisclosure
                  summary="Bullwhip Volatility Drivers & Fulfillment Evidence"
                  drivers={[
                    'Erratic purchase orders exceed supplier planned safety capacity buffers',
                    'Suppliers prioritize steady-demand clients during raw material allocation constraints',
                  ]}
                  meaning={[
                    'Internal order volatility is strongly associated with degraded external vendor fulfillment reliability',
                    'Stabilizing replenishment cadence supports vendor on-time recovery to >95.00%',
                  ]}
                  action={[
                    'Pass volatility classification to ABC Classification & Multivariate Forecast',
                  ]}
                />
              </div>
            </div>
          )}

          {/* Section Transition Footer */}
          <div className="flex items-center justify-between pt-3 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleSectionChange('univariate')}
              className="gap-2 text-xs font-semibold cursor-pointer"
            >
              <ArrowLeft size={14} />
              <span>Back to Univariate</span>
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={() => navigate('/app/abc')}
              className="gap-2 text-xs font-semibold cursor-pointer"
            >
              <span>Continue to ABC Classification</span>
              <ArrowRight size={14} />
            </Button>
          </div>
        </motion.div>
      )}
    </motion.section>
  );
}
