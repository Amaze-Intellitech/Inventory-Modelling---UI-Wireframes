import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ViewHead, KpiTile, WhyDisclosure, Badge, Insight } from '../../components/CommonUI';
import { UnivariateTrendChart, BivariateScatterChart } from '../../components/Charts';
import { usePlatform } from '../../context/PlatformContext';

// ============================================================================
// PRE-SELECTED UNIVARIATE VARIABLES DEFINITION
// ============================================================================
const UNIVARIATE_VARIABLES = [
  {
    id: 'weekly_consumption',
    name: 'Weekly Consumption',
    type: 'Continuous · Time-Series',
    desc: 'Primary operational demand signal & consumption velocity across trailing 104 weeks',
    tag: 'Primary Demand',
  },
  {
    id: 'unit_cost',
    name: 'Unit Purchase Price',
    type: 'Continuous · Financial',
    desc: 'Procurement contract cost baseline & inventory valuation driver across purchase tranches',
    tag: 'Valuation & Cost',
  },
  {
    id: 'lead_time',
    name: 'Supplier Lead Time',
    type: 'Discrete · Duration',
    desc: 'Supplier fulfillment latency & transit exposure from purchase order to dock receipt',
    tag: 'Supply Latency',
  },
  {
    id: 'on_hand_stock',
    name: 'On-Hand Stock Level',
    type: 'Continuous · Physical Level',
    desc: 'Physical warehouse stock buffer position & working capital absorption over time',
    tag: 'Buffer Position',
  },
];

// ============================================================================
// PRE-SELECTED BIVARIATE RELATIONSHIPS DEFINITION
// ============================================================================
const BIVARIATE_RELATIONSHIPS = [
  {
    id: 'lt_vs_stockout',
    varA: 'Supplier Lead Time',
    varB: 'Stockout Frequency',
    type: 'Supplier Risk Dynamics',
    meaning: 'Empirical association between transit latency and stockout frequency across 142 Class A SKUs',
    tag: 'Lead Time Exposure',
  },
  {
    id: 'order_qty_vs_cost',
    varA: 'Order Batch Quantity',
    varB: 'Unit Purchase Cost',
    type: 'Scale Economics',
    meaning: 'Volume scale discounts vs inventory carrying cost trade-off across batch tiers',
    tag: 'Procurement Scale',
  },
  {
    id: 'demand_vs_ontime',
    varA: 'Demand Volatility (CV)',
    varB: 'Supplier On-Time Rate',
    type: 'Fulfillment Strain',
    meaning: 'Demand surge volatility relationship with vendor fulfillment reliability & delivery slippage',
    tag: 'Bullwhip Stress',
  },
];

// Auxiliary Charts
function UnitCostTrendChart() {
  const W = 900, H = 260, ML = 60, MR = 24, MT = 24, MB = 32;
  const data = [76.0, 76.0, 76.0, 77.5, 77.5, 77.5, 78.0, 78.0, 78.65, 78.65, 78.65, 78.65, 78.65, 78.65, 78.65, 78.65, 78.65, 78.65, 78.65, 78.65, 92.0, 78.65, 78.65, 78.65, 79.5, 79.5, 78.65, 78.65, 78.65, 78.65];
  const yMax = 100, yMin = 60, baseline = 78.65;
  const x = (i) => ML + (i / (data.length - 1)) * (W - ML - MR);
  const y = (v) => MT + (1 - (v - yMin) / (yMax - yMin)) * (H - MT - MB);
  const linePath = data.map((v, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');

  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="w-full">
      {[60, 70, 80, 90, 100].map((v) => (
        <g key={v}>
          <line x1={ML} x2={W - MR} y1={y(v)} y2={y(v)} stroke="#EEF2F7" />
          <text x={8} y={y(v) + 4} fontSize={10} fill="#8896A8" fontFamily="IBM Plex Mono">
            ${v.toFixed(2)}
          </text>
        </g>
      ))}
      <line x1={ML} x2={W - MR} y1={y(baseline)} y2={y(baseline)} stroke="#0C7EBE" strokeDasharray="4 4" strokeWidth={1.5} />
      <text x={ML + 8} y={y(baseline) - 6} fontSize={10} fill="#0C7EBE" textAnchor="start" fontFamily="IBM Plex Mono" fontWeight={600}>
        ■ Master Service Agreement Baseline: $78.65 / EA
      </text>
      <path d={linePath} fill="none" stroke="#0EA5E9" strokeWidth={2} />
      {data.map((v, i) => {
        const isSpike = v > 85;
        const cx = x(i);
        const cy = y(v);
        if (isSpike) {
          const dSize = 6.5;
          const points = `${cx},${cy - dSize} ${cx + dSize},${cy} ${cx},${cy + dSize} ${cx - dSize},${cy}`;
          return (
            <g key={i}>
              <polygon points={points} fill="#C0362C" stroke="#fff" strokeWidth={1.5} />
              <text x={cx} y={cy - 12} fontSize={10} fill="#C0362C" textAnchor="middle" fontFamily="IBM Plex Mono" fontWeight={600}>
                ◆ Wk {i + 1} · Spot PO Expedited Surcharge ($92.00)
              </text>
            </g>
          );
        }
        return <circle key={i} cx={cx} cy={cy} r={2.5} fill="#0EA5E9" />;
      })}
      <line x1={ML} x2={W - MR} y1={H - MB} y2={H - MB} stroke="#CBD5E1" />
    </svg>
  );
}

function LeadTimeTrendChart() {
  const W = 900, H = 260, ML = 60, MR = 24, MT = 24, MB = 32;
  const data = [56, 58, 60, 57, 61, 59, 60, 58, 60, 62, 59, 60, 61, 64, 60, 58, 63, 61, 60, 62, 88, 63, 61, 60, 63, 62, 75, 61, 60, 62];
  const cap = 70, yMax = 100, yMin = 40;
  const x = (i) => ML + (i / (data.length - 1)) * (W - ML - MR);
  const y = (v) => MT + (1 - (v - yMin) / (yMax - yMin)) * (H - MT - MB);
  const linePath = data.map((v, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');

  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="w-full">
      {[40, 60, 80, 100].map((v) => (
        <g key={v}>
          <line x1={ML} x2={W - MR} y1={y(v)} y2={y(v)} stroke="#EEF2F7" />
          <text x={8} y={y(v) + 4} fontSize={10} fill="#8896A8" fontFamily="IBM Plex Mono">
            {v}d
          </text>
        </g>
      ))}
      <line x1={ML} x2={W - MR} y1={y(cap)} y2={y(cap)} stroke="#C0362C" strokeDasharray="4 4" strokeWidth={1.5} />
      <text x={ML + 8} y={y(cap) - 6} fontSize={10} fill="#C0362C" textAnchor="start" fontFamily="IBM Plex Mono" fontWeight={600}>
        ■ High Risk Latency Threshold: 70 Days
      </text>
      <path d={linePath} fill="none" stroke="#0EA5E9" strokeWidth={2} />
      {data.map((v, i) => {
        const isAnomaly = v > 80;
        const isBreach = !isAnomaly && v >= cap;
        const cx = x(i);
        const cy = y(v);
        if (isAnomaly) {
          const dSize = 6.5;
          const points = `${cx},${cy - dSize} ${cx + dSize},${cy} ${cx},${cy + dSize} ${cx - dSize},${cy}`;
          return (
            <g key={i}>
              <polygon points={points} fill="#C0362C" stroke="#fff" strokeWidth={1.5} />
              <text x={cx} y={cy - 12} fontSize={10} fill="#C0362C" textAnchor="middle" fontFamily="IBM Plex Mono" fontWeight={600}>
                ◆ Wk {i + 1} · Port Congestion Delay (88d)
              </text>
            </g>
          );
        }
        if (isBreach) {
          const sSize = 9;
          return (
            <g key={i}>
              <rect x={cx - sSize / 2} y={cy - sSize / 2} width={sSize} height={sSize} rx={1.5} fill="#B7791F" stroke="#fff" strokeWidth={1.5} />
              <text x={cx} y={cy - 12} fontSize={10} fill="#B7791F" textAnchor="middle" fontFamily="IBM Plex Mono" fontWeight={600}>
                ■ Wk {i + 1} · Customs Latency (75d)
              </text>
            </g>
          );
        }
        return <circle key={i} cx={cx} cy={cy} r={2.5} fill="#0EA5E9" />;
      })}
      <line x1={ML} x2={W - MR} y1={H - MB} y2={H - MB} stroke="#CBD5E1" />
    </svg>
  );
}

function OnHandStockTrendChart() {
  const W = 900, H = 260, ML = 60, MR = 24, MT = 24, MB = 32;
  const data = [13200, 13000, 12600, 12100, 11800, 15400, 14800, 14200, 13600, 13100, 12400, 11900, 11500, 15800, 15100, 14300, 13700, 13100, 12500, 11800, 7200, 15200, 14600, 13900, 13300, 12700, 13400, 13200, 13100, 13000];
  const rop = 11500, yMax = 18000, yMin = 5000;
  const x = (i) => ML + (i / (data.length - 1)) * (W - ML - MR);
  const y = (v) => MT + (1 - (v - yMin) / (yMax - yMin)) * (H - MT - MB);
  const linePath = data.map((v, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');

  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="w-full">
      {[5000, 10000, 15000].map((v) => (
        <g key={v}>
          <line x1={ML} x2={W - MR} y1={y(v)} y2={y(v)} stroke="#EEF2F7" />
          <text x={8} y={y(v) + 4} fontSize={10} fill="#8896A8" fontFamily="IBM Plex Mono">
            {v.toLocaleString()} EA
          </text>
        </g>
      ))}
      <line x1={ML} x2={W - MR} y1={y(rop)} y2={y(rop)} stroke="#B7791F" strokeDasharray="4 4" strokeWidth={1.5} />
      <text x={ML + 8} y={y(rop) - 6} fontSize={10} fill="#B7791F" textAnchor="start" fontFamily="IBM Plex Mono" fontWeight={600}>
        ■ Reorder Point (ROP): 11,500.00 EA (62.7 Days Buffer)
      </text>
      <path d={linePath} fill="none" stroke="#0EA5E9" strokeWidth={2} />
      {data.map((v, i) => {
        const isDepletion = v < rop;
        const cx = x(i);
        const cy = y(v);
        if (isDepletion) {
          const dSize = 6.5;
          const points = `${cx},${cy - dSize} ${cx + dSize},${cy} ${cx},${cy + dSize} ${cx - dSize},${cy}`;
          return (
            <g key={i}>
              <polygon points={points} fill="#C0362C" stroke="#fff" strokeWidth={1.5} />
              <text x={cx} y={cy + 16} fontSize={10} fill="#C0362C" textAnchor="middle" fontFamily="IBM Plex Mono" fontWeight={600}>
                ◆ Wk {i + 1} · Buffer Dip ({v.toLocaleString()} EA)
              </text>
            </g>
          );
        }
        return <circle key={i} cx={cx} cy={cy} r={2.5} fill="#0EA5E9" />;
      })}
      <line x1={ML} x2={W - MR} y1={H - MB} y2={H - MB} stroke="#CBD5E1" />
    </svg>
  );
}

function OrderQtyVsCostScatterChart() {
  const W = 500, H = 320, ML = 55, MR = 20, MT = 20, MB = 38;
  const x = (v) => ML + ((v - 200) / 2800) * (W - ML - MR);
  const y = (v) => MT + (1 - (v - 65) / 35) * (H - MT - MB);

  const points = [
    [300, 95.0], [400, 91.0], [500, 88.0], [600, 85.5], [700, 83.0], [800, 81.5],
    [900, 80.0], [1000, 79.0], [1200, 76.5], [1400, 74.5], [1600, 73.0], [1800, 72.2],
    [2000, 71.5], [2200, 71.0], [2400, 70.5], [2600, 70.2], [2800, 70.0], [3000, 69.8],
  ];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="w-full">
      {[500, 1000, 2000, 3000].map((v) => (
        <g key={v}>
          <line x1={x(v)} x2={x(v)} y1={MT} y2={H - MB} stroke="#EEF2F7" />
          <text x={x(v)} y={H - MB + 16} fontSize={10} fill="#8896A8" textAnchor="middle" fontFamily="IBM Plex Mono">{v}</text>
        </g>
      ))}
      {[70, 80, 90, 100].map((v) => (
        <g key={v}>
          <line x1={ML} x2={W - MR} y1={y(v)} y2={y(v)} stroke="#EEF2F7" />
          <text x={8} y={y(v) + 4} fontSize={10} fill="#8896A8" fontFamily="IBM Plex Mono">${v}</text>
        </g>
      ))}
      <line x1={x(300)} y1={y(95)} x2={x(2900)} y2={y(70)} stroke="#0EA5E9" strokeWidth={2} strokeDasharray="5 4" />
      {points.map((p, i) => (
        <circle key={i} cx={x(p[0])} cy={y(p[1])} r={3.5} fill="#132038" fillOpacity={0.65} />
      ))}
      <text x={x(1300)} y={y(83)} fontSize={10} fill="#0C7EBE" fontWeight={600} fontFamily="IBM Plex Mono" textAnchor="start">
        Power-law empirical fit: r = -0.68
      </text>
      <line x1={x(1200)} x2={x(1200)} y1={MT} y2={H - MB} stroke="#0F9D6C" strokeWidth={1} strokeDasharray="3 3" />
      <text x={x(1220)} y={MT + 14} fontSize={9.5} fill="#0F9D6C" fontWeight={600} fontFamily="IBM Plex Mono">
        Observed discount threshold (≥1,200 EA)
      </text>
      <line x1={ML} x2={W - MR} y1={H - MB} y2={H - MB} stroke="#CBD5E1" />
      <line x1={ML} x2={ML} y1={MT} y2={H - MB} stroke="#CBD5E1" />
      <text x={(ML + W - MR) / 2} y={H - 4} fontSize={10.5} fill="#5B6B82" textAnchor="middle">Order Batch Quantity (EA)</text>
    </svg>
  );
}

function DemandVsOnTimeScatterChart() {
  const W = 500, H = 320, ML = 55, MR = 20, MT = 20, MB = 38;
  const x = (v) => ML + ((v - 5) / 45) * (W - ML - MR);
  const y = (v) => MT + (1 - (v - 75) / 25) * (H - MT - MB);

  const points = [
    [8, 98.5], [10, 97.8], [12, 98.0], [14, 96.5], [16, 95.8], [18, 96.0],
    [20, 94.5], [22, 93.8], [24, 93.0], [26, 90.5], [28, 88.2], [30, 87.5],
    [33, 85.0], [36, 83.5], [40, 81.0], [44, 79.2], [48, 77.0],
  ];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="w-full">
      {[10, 20, 30, 40, 50].map((v) => (
        <g key={v}>
          <line x1={x(v)} x2={x(v)} y1={MT} y2={H - MB} stroke="#EEF2F7" />
          <text x={x(v)} y={H - MB + 16} fontSize={10} fill="#8896A8" textAnchor="middle" fontFamily="IBM Plex Mono">{v}%</text>
        </g>
      ))}
      {[80, 85, 90, 95, 100].map((v) => (
        <g key={v}>
          <line x1={ML} x2={W - MR} y1={y(v)} y2={y(v)} stroke="#EEF2F7" />
          <text x={8} y={y(v) + 4} fontSize={10} fill="#8896A8" fontFamily="IBM Plex Mono">{v}%</text>
        </g>
      ))}
      <line x1={x(8)} y1={y(98)} x2={x(48)} y2={y(77)} stroke="#0EA5E9" strokeWidth={2} strokeDasharray="5 4" />
      {points.map((p, i) => (
        <circle key={i} cx={x(p[0])} cy={y(p[1])} r={3.5} fill="#132038" fillOpacity={0.65} />
      ))}
      <text x={x(22)} y={y(95)} fontSize={10} fill="#0C7EBE" fontWeight={600} fontFamily="IBM Plex Mono" textAnchor="start">
        Empirical relationship: r = -0.61
      </text>
      <line x1={x(25)} x2={x(25)} y1={MT} y2={H - MB} stroke="#C0362C" strokeWidth={1} strokeDasharray="3 3" />
      <text x={x(26)} y={MT + 14} fontSize={9.5} fill="#C0362C" fontWeight={600} fontFamily="IBM Plex Mono">
        Volatility risk threshold (CV &gt; 25%)
      </text>
      <line x1={ML} x2={W - MR} y1={H - MB} y2={H - MB} stroke="#CBD5E1" />
      <line x1={ML} x2={ML} y1={MT} y2={H - MB} stroke="#CBD5E1" />
      <text x={(ML + W - MR) / 2} y={H - 4} fontSize={10.5} fill="#5B6B82" textAnchor="middle">Demand Coefficient of Variation (CV %)</text>
    </svg>
  );
}

export default function Descriptive() {
  const { persona, selectedMaterial } = usePlatform();
  const [tab, setTab] = useState('uni');
  const [selectedVarId, setSelectedVarId] = useState('weekly_consumption');
  const [selectedRelId, setSelectedRelId] = useState('lt_vs_stockout');

  const subtitleText = {
    ds: 'Statistical evidence, stationarity tests, and distributional diagnostics on the raw demand signal before downstream model fitting.',
    analyst: 'Trend velocity, operational volatility, and outlier investigations to baseline SKU consumption behavior before classification.',
    exec: 'Executive business signals, revenue throughput exposure, and capacity risk across core catalog materials.',
  }[persona] || 'Trend, seasonality and relationship analysis on the raw signal — run before any classification or lot-sizing.';

  return (
    <motion.section 
      className="view"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <ViewHead
        title="Descriptive Intelligence"
        subtitle={<p>{subtitleText}</p>}
      />

      {/* Main Tab Bar */}
      <div className="tabbar">
        <button
          type="button"
          className={tab === 'uni' ? 'active' : ''}
          onClick={() => setTab('uni')}
        >
          Single-Variable Trend
        </button>
        <button
          type="button"
          className={tab === 'bi' ? 'active' : ''}
          onClick={() => setTab('bi')}
        >
          Relationship Explorer
        </button>
      </div>

      {/* TAB 1: UNIVARIATE ANALYSIS */}
      {tab === 'uni' && (
        <div>
          {/* Material Context Bar */}
          <div className="card__head mb-3">
            <span className="font-semibold text-slate-900 dark:text-slate-100">
              {selectedMaterial.id} · {selectedMaterial.name} — {selectedMaterial.plant}
            </span>
            <div className="flex items-center gap-2">
              <Badge tone={selectedMaterial.abcClass === 'A' ? 'accent' : 'neutral'}>
                Class {selectedMaterial.abcClass} Material
              </Badge>
              <span className="badge badge-neutral text-xs">104 weeks historical signal</span>
            </div>
          </div>

          {/* PRE-SELECTED VARIABLES SECTION */}
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Pre-Selected Variables
              </span>
              <span className="text-xs text-slate-400">
                Click a variable card to inspect its analytical profile
              </span>
            </div>
            <div className="grid-4">
              {UNIVARIATE_VARIABLES.map((v) => {
                const isSelected = selectedVarId === v.id;
                return (
                  <div
                    key={v.id}
                    onClick={() => setSelectedVarId(v.id)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setSelectedVarId(v.id);
                      }
                    }}
                    className={`card p-3.5 mb-0 cursor-pointer transition-all ${
                      isSelected 
                        ? 'border-cyan-500 bg-cyan-50/20 dark:bg-cyan-950/20 shadow-sm ring-1 ring-cyan-500' 
                        : 'border-slate-200 dark:border-navy-700/80 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-1.5">
                      <span className={`text-xs font-bold ${isSelected ? 'text-cyan-600 dark:text-cyan-400' : 'text-slate-900 dark:text-slate-100'}`}>
                        {v.name}
                      </span>
                      <Badge tone={isSelected ? 'accent' : 'neutral'}>{v.tag}</Badge>
                    </div>
                    <div className="text-[10px] font-mono text-slate-400 mb-1.5">
                      {v.type}
                    </div>
                    <p className="text-xs text-slate-500 leading-snug m-0">
                      {v.desc}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* UNIVARIATE ANALYSIS CONTENT */}
          {selectedVarId === 'weekly_consumption' && (
            <div>
              {/* PRIMARY PERSONA KPIs */}
              <AnimatePresence mode="wait">
                {persona === 'ds' && (
                  <motion.div
                    key="ds-kpi"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="grid-4 mb-4"
                  >
                    <KpiTile
                      label="Mean & Central Tendency"
                      value="1,284.00 EA"
                      sub="Median 1,190.00 EA · IQR 360.00 EA (P25: 1,120 · P75: 1,480)"
                    />
                    <KpiTile
                      label="Normalized Trend Slope (OLS β₁)"
                      value="+2.40%/wk"
                      delta="+30.82 EA/wk (t=4.82, p < 0.001)"
                      deltaTone="up"
                      sub="R² = 0.84 · Statistically significant linear ramp"
                    />
                    <KpiTile
                      label="Variance & Distribution (σ)"
                      value="312.00 EA"
                      sub="CV = 24.30% · Skewness = +1.18 · Kurtosis = 4.22"
                    />
                    <KpiTile
                      label="Seasonality & Spectral"
                      value="0.31 Strength"
                      sub="Quarterly cycle (T=13 wks) · ACF(1) = 0.68"
                    />
                  </motion.div>
                )}

                {persona === 'analyst' && (
                  <motion.div
                    key="analyst-kpi"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="grid-4 mb-4"
                  >
                    <KpiTile
                      label="Current Consumption Velocity"
                      value="1,620.00 EA/wk"
                      delta="+26.17% vs 104-wk baseline"
                      deltaTone="up"
                      sub="Baseline 1,284.00 EA/wk (+$26.43K/wk volume)"
                    />
                    <KpiTile
                      label="Demand Expansion Trajectory"
                      value="+30.82 EA/wk"
                      delta="Sustained ramp, 9 of last 12 weeks"
                      deltaTone="up"
                      sub="+2.40% of baseline/wk linear velocity"
                    />
                    <KpiTile
                      label="Demand Volatility"
                      value="Moderate (CV 24.30%)"
                      sub="Std dev ±312.00 EA (±$24.54K/wk value spread)"
                    />
                    <KpiTile
                      label="Flagged Operational Events"
                      value="2 Breach Weeks"
                      delta="1 extreme surge · 1 cap breach"
                      deltaTone="down"
                      sub="Investigation required before lot-size calibration"
                    />
                  </motion.div>
                )}

                {persona === 'exec' && (
                  <motion.div
                    key="exec-kpi"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="grid-4 mb-4"
                  >
                    <KpiTile
                      label="Demand Health & Momentum"
                      value="EXPANDING (+26.17%)"
                      delta="Positive Market Momentum"
                      deltaTone="up"
                      sub="Current 1,620 EA/wk vs 1,284 EA historical baseline"
                    />
                    <KpiTile
                      label="Annual Throughput Value"
                      value="$5.25M / Year"
                      sub="Weekly throughput $100.99K/wk ($78.65/EA unit cost)"
                    />
                    <KpiTile
                      label="Demand Volatility Exposure"
                      value="±$24.54K / Week"
                      sub="Moderate variance (CV 24.30%) requires active buffer sizing"
                    />
                    <KpiTile
                      label="Plant Capacity Utilization"
                      value="81.00% of Limit"
                      delta="19.00% Headroom Remaining"
                      deltaTone="down"
                      sub="Current 1,620 EA/wk approaching 2,000 EA line cap"
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* MAIN VISUALIZATION CARD */}
              <div className="card mb-4">
                <div className="card__head mb-3">
                  <div>
                    <h2 className="card__title text-base font-bold text-slate-900 dark:text-slate-100 m-0">
                      {persona === 'ds'
                        ? '104-Week Demand Series Decomposition & Anomaly Identification'
                        : persona === 'analyst'
                        ? 'Weekly Consumption Velocity with Flagged Operational Breaches'
                        : 'Consumption Demand Trajectory & Plant Operating Envelope'}
                    </h2>
                    <p className="card__sub text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {persona === 'ds'
                        ? 'Raw time-series exhibiting OLS linear drift (+30.82 EA/wk, +2.40%/wk of baseline) with distinct statistical anomaly (>3σ)'
                        : persona === 'analyst'
                        ? 'Two distinct operational outliers surfaced: statistical demand shock vs plant policy capacity breach'
                        : 'Strong expansion trajectory with capacity ceiling alert at Plant 1 assembly line ($157.30K/wk threshold)'}
                    </p>
                  </div>
                  <div className="chart-legend mt-0 text-xs">
                    <span><span className="legend-dot" style={{ background: 'var(--accent)' }} />● Actual Weekly Consumption</span>
                    <span><span className="legend-dot" style={{ background: 'var(--risk)', transform: 'rotate(45deg)' }} />◆ Statistical outlier (&gt;3σ)</span>
                    <span><span className="legend-dot" style={{ background: 'var(--watch)' }} />■ Policy cap breach (&gt;2,000 EA)</span>
                  </div>
                </div>

                <div className="chart-shell">
                  <UnivariateTrendChart />
                </div>

                {/* Structured Annotation Card */}
                <div className="mt-3.5 p-3 bg-slate-50 dark:bg-navy-900/60 rounded-md border border-slate-200 dark:border-navy-700 text-xs">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <div>
                      <span className="text-[10px] font-bold uppercase text-slate-400 block mb-0.5">1. What Happened</span>
                      <p className="text-slate-700 dark:text-slate-300 font-medium m-0">
                        Week 41 demand spiked to 2,410.00 EA (z=3.61); Week 67 hit 2,050.00 EA, breaching the 2,000.00 EA cap.
                      </p>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase text-slate-400 block mb-0.5">2. How Significant</span>
                      <p className="text-slate-700 dark:text-slate-300 font-medium m-0">
                        Week 41 is 87.70% above baseline ($189.55K value); overall trend slope is +30.82 EA/wk (R²=0.84).
                      </p>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase text-slate-400 block mb-0.5">3. Why It Matters</span>
                      <p className="text-slate-700 dark:text-slate-300 font-medium m-0">
                        Static lot sizes and fixed 2,000 EA caps create replenishment deficits during surge periods.
                      </p>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase text-slate-400 block mb-0.5">4. What Next</span>
                      <p className="text-slate-700 dark:text-slate-300 font-medium m-0">
                        Recalibrate lot sizing parameters and incorporate linear trend slope in Multivariate Forecast.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Explainability Panel */}
              <div className="card">
                <Insight label="Analytical Synthesis">
                  Demand for {selectedMaterial.id} has expanded at <span className="metric">+30.82 EA/week</span> (+26.17% above historical baseline) with moderate volatility (CV <span className="metric">24.30%</span>). While baseline consumption is steady at $100.99K/week, peak spikes have tested the 2,000.00 EA plant policy limit ($157.30K/wk capacity threshold).
                </Insight>

                <WhyDisclosure
                  summary="Analytical Breakdown: Finding → Meaning → Implication → Action"
                  drivers={[
                    'Finding: Sustained OLS trend (+30.82 EA/wk, +2.40% of baseline/wk) pushes current consumption to 1,620.00 EA/wk ($127.41K/wk value)',
                    'Finding: Week 41 statistical anomaly reached 2,410.00 EA (z=3.61, $189.55K value), exceeding the 2,000.00 EA line cap by 20.50%',
                    'Finding: Demand CV of 24.30% generates ±$24.54K/wk of weekly throughput volatility',
                  ]}
                  meaning={[
                    'What it means: The current demand regime is materially higher than the historical 104-week average baseline (1,284.00 EA/wk)',
                    'What it means: The material is experiencing genuine customer volume expansion rather than random noise',
                    'What it means: Plant 1 assembly line capacity constraints are becoming active bottlenecks during peak surge periods',
                  ]}
                  action={[
                    'Business Implication: Static lot sizing based on historical averages will systematically under-replenish future demand',
                    'Recommended Action: Adapt forecasting baseline in Multivariate Forecast to incorporate trend drift and seasonal cycles',
                    'Recommended Action: Revisit the 2,000.00 EA policy cap with Plant 1 operations before Q4 surge cycles',
                  ]}
                />
              </div>
            </div>
          )}

          {selectedVarId === 'unit_cost' && (
            <div className="card">
              <div className="card__head mb-3">
                <div>
                  <h2 className="card__title text-base font-bold text-slate-900 dark:text-slate-100 m-0">Unit Purchase Price Trajectory ($78.65/EA baseline)</h2>
                  <p className="card__sub text-xs text-slate-500 dark:text-slate-400 mt-0.5">Contract master baseline with spot surcharge anomalies across purchase tranches</p>
                </div>
              </div>
              <div className="chart-shell"><UnitCostTrendChart /></div>
              <div className="grid-3 mt-3.5">
                <KpiTile label="Baseline Contract Cost" value="$78.65 / EA" sub="Master Service Agreement fixed pricing" />
                <KpiTile label="Price Volatility (CV)" value="5.34%" sub="±$4.20 spread across purchase tranches" />
                <KpiTile label="Annual Procurement Spend" value="$5.25M" sub="Based on 66,768 EA/yr baseline volume" />
              </div>
            </div>
          )}

          {selectedVarId === 'lead_time' && (
            <div className="card">
              <div className="card__head mb-3">
                <div>
                  <h2 className="card__title text-base font-bold text-slate-900 dark:text-slate-100 m-0">Supplier Replenishment Lead Time (60 Days Baseline)</h2>
                  <p className="card__sub text-xs text-slate-500 dark:text-slate-400 mt-0.5">Transit duration history with port congestion outliers exceeding high-risk threshold (70d)</p>
                </div>
              </div>
              <div className="chart-shell"><LeadTimeTrendChart /></div>
              <div className="grid-3 mt-3.5">
                <KpiTile label="Nominal Lead Time" value="60.00 Days" sub="Supplier contract SLA: 60 calendar days" />
                <KpiTile label="Lead Time Volatility (σ)" value="±14.20 Days" sub="CV 23.67% · Heavy right-skewed delivery tail" />
                <KpiTile label="Pipeline Capital Exposure" value="$865.61K" sub="8.57 weeks of demand (11,006 EA) in transit" />
              </div>
            </div>
          )}

          {selectedVarId === 'on_hand_stock' && (
            <div className="card">
              <div className="card__head mb-3">
                <div>
                  <h2 className="card__title text-base font-bold text-slate-900 dark:text-slate-100 m-0">On-Hand Stock Level vs Reorder Point (11,500.00 EA)</h2>
                  <p className="card__sub text-xs text-slate-500 dark:text-slate-400 mt-0.5">Physical warehouse position tracking with safety buffer depletion events</p>
                </div>
              </div>
              <div className="chart-shell"><OnHandStockTrendChart /></div>
              <div className="grid-3 mt-3.5">
                <KpiTile label="Current On-Hand Stock" value="13,000.00 EA" sub="$1.02M total warehouse working capital" />
                <KpiTile label="Days of Supply" value="70.87 Days" sub="10.9 days safety buffer above 60-day lead time" />
                <KpiTile label="Inventory Turnover" value="5.15x / yr" sub="Turning within Class A target bandwidth" />
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: BIVARIATE RELATIONSHIP EXPLORER */}
      {tab === 'bi' && (
        <div>
          {/* PRE-SELECTED RELATIONSHIPS SECTION */}
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Pre-Selected Relationships
              </span>
              <span className="text-xs text-slate-400">
                Click a relationship card to inspect cross-variable correlation
              </span>
            </div>
            <div className="grid-3">
              {BIVARIATE_RELATIONSHIPS.map((r) => {
                const isSelected = selectedRelId === r.id;
                return (
                  <div
                    key={r.id}
                    onClick={() => setSelectedRelId(r.id)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setSelectedRelId(r.id);
                      }
                    }}
                    className={`card p-3.5 mb-0 cursor-pointer transition-all ${
                      isSelected 
                        ? 'border-cyan-500 bg-cyan-50/20 dark:bg-cyan-950/20 shadow-sm ring-1 ring-cyan-500' 
                        : 'border-slate-200 dark:border-navy-700/80 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-1.5">
                      <span className={`text-xs font-bold ${isSelected ? 'text-cyan-600 dark:text-cyan-400' : 'text-slate-900 dark:text-slate-100'}`}>
                        {r.varA} vs {r.varB}
                      </span>
                      <Badge tone={isSelected ? 'accent' : 'neutral'}>{r.tag}</Badge>
                    </div>
                    <div className="text-[10px] font-mono text-slate-400 mb-1.5">
                      {r.type}
                    </div>
                    <p className="text-xs text-slate-500 leading-snug m-0">
                      {r.meaning}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* BIVARIATE CONTENT */}
          {selectedRelId === 'lt_vs_stockout' && (
            <div>
              <div className="grid-4 mb-4">
                <KpiTile
                  label="Pearson Correlation (r)"
                  value="0.74"
                  delta="t = 6.24 · p < 0.0001 (Significant)"
                  deltaTone="up"
                  sub="Strong positive linear association across 142 SKUs"
                />
                <KpiTile
                  label="Coefficient of Determination (R²)"
                  value="0.548"
                  sub="54.80% of stockout variance explained by lead time"
                />
                <KpiTile
                  label="Spearman Rank Correlation (ρ)"
                  value="0.71"
                  sub="Monotonic rank agreement · Non-linear tail effect"
                />
                <KpiTile
                  label="OLS Regression Equation"
                  value="y = 0.218x - 1.78"
                  sub="SE(β₁) = 0.035 · 95% CI [0.149, 0.287] · RMSE 1.94%"
                />
              </div>

              <div className="two-col">
                <div className="card">
                  <div className="card__head mb-3">
                    <div>
                      <h2 className="card__title text-base font-bold text-slate-900 dark:text-slate-100 m-0">Supplier Lead Time vs Stockout Frequency</h2>
                      <p className="card__sub text-xs text-slate-500 dark:text-slate-400 mt-0.5">142 Class A materials ($34.28M value), trailing 12 months</p>
                    </div>
                    <Badge tone="risk">Critical Risk Zone: &gt;45 Days</Badge>
                  </div>
                  <div className="chart-shell">
                    <BivariateScatterChart />
                  </div>
                </div>

                <div className="card">
                  <h2 className="card__title text-base font-bold text-slate-900 dark:text-slate-100 mb-3">Relationship Intelligence</h2>
                  <Insight label="Correlation vs Causation Standard">
                    Statistical analysis establishes a <span className="metric">strong positive empirical association (r = 0.74, R² = 0.548)</span> between supplier lead time and stockout frequency across 142 Class A materials. While this empirical relationship is highly significant, correlation does not prove direct isolated causality — delivery transit variance (σ_LT), right-skewed shipping tails, and single-sourcing are key contributing operational drivers.
                  </Insight>

                  <WhyDisclosure
                    summary="Why lead time variability correlates with stockout frequency"
                    drivers={[
                      'Lead times >45 days exhibit 3.20× higher delivery variance than suppliers with <20-day transit',
                      'Static safety stock models fail to account for right-skewed supplier delivery tails',
                      '28 Class A materials ($11.85M illustrative exposure) currently single-sourced without regional buffer stocking',
                    ]}
                    meaning={[
                      'Stockouts originate primarily in transit variance rather than internal consumption spikes',
                      'Buffer sizing must scale with lead-time standard deviation (σ_LT) rather than static averages',
                      'Operational effort concentrated on these 28 materials addresses the primary source of historical stockout events',
                    ]}
                    action={[
                      'Incorporate lead-time variance into safety buffer calculations',
                      'Qualify secondary localized suppliers for SKUs with >45-day lead times',
                      'Negotiate vendor-managed inventory (VMI) buffer terms for top-tier Class A overseas parts',
                    ]}
                  />
                </div>
              </div>
            </div>
          )}

          {selectedRelId === 'order_qty_vs_cost' && (
            <div className="two-col">
              <div className="card">
                <div className="card__head mb-3">
                  <div>
                    <h2 className="card__title text-base font-bold text-slate-900 dark:text-slate-100 m-0">Order Quantity vs Unit Purchase Cost</h2>
                    <p className="card__sub text-xs text-slate-500 dark:text-slate-400 mt-0.5">Scale discounts vs holding cost trade-off across catalog order batches</p>
                  </div>
                  <Badge tone="accent">r = -0.68 · Scale Economics</Badge>
                </div>
                <div className="chart-shell"><OrderQtyVsCostScatterChart /></div>
              </div>

              <div className="card">
                <h2 className="card__title text-base font-bold text-slate-900 dark:text-slate-100 mb-3">Batch Sizing Summary</h2>
                <Insight label="Scale Elasticity">
                  Unit purchase cost exhibits an inverse relationship with batch size (r = <span className="metric">-0.68</span>). Beyond 1,200 EA, marginal unit price savings plateau while inventory carrying costs scale linearly.
                </Insight>
                <WhyDisclosure
                  summary="Why batch size recalibration is necessary"
                  drivers={[
                    'Suppliers offer tiered pricing discounts up to 1,200 EA batch thresholds',
                    'Current batch policies over-order low-volume items and under-order high-volume Class A items',
                    'Holding costs scale at 6.00% carrying rate on average inventory value',
                  ]}
                  meaning={[
                    'Optimal lot sizing balances supplier volume discounts against working capital carrying costs',
                    'Recalibration delivers immediate working capital release without sacrificing discounts',
                  ]}
                  action={[
                    'Review mathematically optimal batch sizes for Class A SKUs',
                    'Harmonize purchase orders with supplier minimum order quantity (MOQ) constraints',
                  ]}
                />
              </div>
            </div>
          )}

          {selectedRelId === 'demand_vs_ontime' && (
            <div className="two-col">
              <div className="card">
                <div className="card__head mb-3">
                  <div>
                    <h2 className="card__title text-base font-bold text-slate-900 dark:text-slate-100 m-0">Demand Volatility (CV) vs Supplier On-Time Rate</h2>
                    <p className="card__sub text-xs text-slate-500 dark:text-slate-400 mt-0.5">Fulfillment strain: High-volatility SKUs exhibit lower supplier on-time delivery</p>
                  </div>
                  <Badge tone="watch">r = -0.61 · Fulfillment Stress</Badge>
                </div>
                <div className="chart-shell"><DemandVsOnTimeScatterChart /></div>
              </div>

              <div className="card">
                <h2 className="card__title text-base font-bold text-slate-900 dark:text-slate-100 mb-3">Volatility Impact Summary</h2>
                <Insight label="Bullwhip Stress">
                  Demand volatility is negatively associated with supplier delivery punctuality (r = <span className="metric">-0.61</span>). Erratic order patterns amplify supplier schedule disruption.
                </Insight>
                <WhyDisclosure
                  summary="Why demand volatility triggers supplier delivery failure"
                  drivers={[
                    'Erratic purchase orders exceed supplier planned safety capacity buffers',
                    'Suppliers prioritize steady-demand clients during raw material allocations',
                    'Lack of long-term forecast sharing prevents upstream capacity planning',
                  ]}
                  meaning={[
                    'Internal order volatility is strongly associated with degraded external vendor fulfillment reliability',
                    'Stabilizing replenishment cadence supports vendor on-time recovery to >95.00%',
                  ]}
                  action={[
                    'Share rolling 12-week multivariate demand forecasts with tier-1 component suppliers',
                    'Dampen order volatility using smoothed replenishment schedules',
                  ]}
                />
              </div>
            </div>
          )}
        </div>
      )}
    </motion.section>
  );
}
