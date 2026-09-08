import React, { useState } from 'react';
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

// ============================================================================
// AUXILIARY CHARTS FOR OTHER PRE-SELECTED VARIABLES & RELATIONSHIPS
// ============================================================================

function UnitCostTrendChart() {
  const W = 900, H = 260, ML = 60, MR = 24, MT = 24, MB = 32;
  const data = [76.0, 76.0, 76.0, 77.5, 77.5, 77.5, 78.0, 78.0, 78.65, 78.65, 78.65, 78.65, 78.65, 78.65, 78.65, 78.65, 78.65, 78.65, 78.65, 78.65, 92.0, 78.65, 78.65, 78.65, 79.5, 79.5, 78.65, 78.65, 78.65, 78.65];
  const yMax = 100, yMin = 60, baseline = 78.65;
  const x = (i) => ML + (i / (data.length - 1)) * (W - ML - MR);
  const y = (v) => MT + (1 - (v - yMin) / (yMax - yMin)) * (H - MT - MB);
  const linePath = data.map((v, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');

  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
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
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
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
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
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
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
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
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
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

// ============================================================================
// MAIN COMPONENT
// ============================================================================
export default function Descriptive() {
  const { persona, selectedMaterial } = usePlatform();
  const [tab, setTab] = useState('uni');
  const [selectedVarId, setSelectedVarId] = useState('weekly_consumption');
  const [selectedRelId, setSelectedRelId] = useState('lt_vs_stockout');

  // Subtitle personalized by lens
  const subtitleText = {
    ds: 'Statistical evidence, stationarity tests, and distributional diagnostics on the raw demand signal before downstream model fitting.',
    analyst: 'Trend velocity, operational volatility, and outlier investigations to baseline SKU consumption behavior before classification.',
    exec: 'Executive business signals, revenue throughput exposure, and capacity risk across core catalog materials.',
  }[persona] || 'Trend, seasonality and relationship analysis on the raw signal — run before any classification or lot-sizing.';

  return (
    <section className="view">
      {/* Header ViewHead: Action button removed per user specification */}
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

      {/* ================================================================== */}
      {/* TAB 1: UNIVARIATE ANALYSIS                                         */}
      {/* ================================================================== */}
      {tab === 'uni' && (
        <div>
          {/* Material Context Bar */}
          <div className="card__head" style={{ marginBottom: 12 }}>
            <span style={{ fontWeight: 600 }}>
              {selectedMaterial.id} · {selectedMaterial.name} — {selectedMaterial.plant}
            </span>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <Badge tone={selectedMaterial.abcClass === 'A' ? 'accent' : 'neutral'}>
                Class {selectedMaterial.abcClass} Material
              </Badge>
              <span className="badge badge-neutral">104 weeks historical signal</span>
            </div>
          </div>

          {/* PRE-SELECTED VARIABLES SECTION (Card-based Selection Model) */}
          <div style={{ marginBottom: 18 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--muted)' }}>
                Pre-Selected Variables
              </span>
              <span style={{ fontSize: 11, color: 'var(--muted-2)' }}>
                Click a variable card to inspect its analytical profile
              </span>
            </div>
            <div className="grid-4">
              {UNIVARIATE_VARIABLES.map((v) => {
                const isSelected = selectedVarId === v.id;
                return (
                  <div
                    key={v.id}
                    className="card"
                    onClick={() => setSelectedVarId(v.id)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setSelectedVarId(v.id);
                      }
                    }}
                    style={{
                      cursor: 'pointer',
                      marginBottom: 0,
                      borderColor: isSelected ? 'var(--accent)' : 'var(--line)',
                      background: isSelected ? 'linear-gradient(180deg, #FBFDFF, #F6FAFD)' : 'var(--surface)',
                      boxShadow: isSelected ? '0 0 0 1px var(--accent), var(--shadow-card)' : 'none',
                      padding: '14px 16px',
                      transition: 'border-color 0.15s, box-shadow 0.15s',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                      <span style={{ fontSize: 12.5, fontWeight: 700, color: isSelected ? 'var(--accent)' : 'var(--text)' }}>
                        {v.name}
                      </span>
                      <Badge tone={isSelected ? 'accent' : 'neutral'}>{v.tag}</Badge>
                    </div>
                    <div style={{ fontSize: 10.5, fontFamily: 'var(--font-mono)', color: 'var(--muted-2)', marginBottom: 6 }}>
                      {v.type}
                    </div>
                    <p style={{ fontSize: 11.5, color: 'var(--muted)', margin: 0, lineHeight: 1.35 }}>
                      {v.desc}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ============================================================== */}
          {/* UNIVARIATE ANALYSIS CONTENT FOR SELECTED VARIABLE              */}
          {/* ============================================================== */}
          {selectedVarId === 'weekly_consumption' && (
            <div>
              {/* 1. PRIMARY PERSONA KPIs */}
              {persona === 'ds' && (
                <div className="grid-4">
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
                </div>
              )}

              {persona === 'analyst' && (
                <div className="grid-4">
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
                </div>
              )}

              {persona === 'exec' && (
                <div className="grid-4">
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
                </div>
              )}

              {/* 2. MAIN VISUALIZATION CARD WITH ANNOTATIONS */}
              <div className="card">
                <div className="card__head">
                  <div>
                    <h2 className="card__title">
                      {persona === 'ds'
                        ? '104-Week Demand Series Decomposition & Anomaly Identification'
                        : persona === 'analyst'
                        ? 'Weekly Consumption Velocity with Flagged Operational Breaches'
                        : 'Consumption Demand Trajectory & Plant Operating Envelope'}
                    </h2>
                    <p className="card__sub">
                      {persona === 'ds'
                        ? 'Raw time-series exhibiting OLS linear drift (+30.82 EA/wk, +2.40%/wk of baseline) with distinct statistical anomaly (>3σ) and policy constraint breach'
                        : persona === 'analyst'
                        ? 'Two distinct operational outliers surfaced: statistical demand shock vs plant policy capacity breach'
                        : 'Strong expansion trajectory with capacity ceiling alert at Plant 1 assembly line ($157.30K/wk threshold)'}
                    </p>
                  </div>
                  <div className="chart-legend" style={{ marginTop: 0 }}>
                    <span><span className="legend-dot" style={{ background: 'var(--accent)' }} />● Actual Weekly Consumption</span>
                    <span><span className="legend-dot" style={{ background: 'var(--risk)', transform: 'rotate(45deg)' }} />◆ Statistical outlier (&gt;3σ, z=3.61)</span>
                    <span><span className="legend-dot" style={{ background: 'var(--watch)' }} />■ Policy cap breach (&gt;2,000.00 EA)</span>
                  </div>
                </div>

                <div className="chart-shell">
                  <UnivariateTrendChart />
                </div>

                {/* Structured Annotation Card (WHAT / HOW SIGNIFICANT / WHY / WHAT NEXT) */}
                <div style={{ marginTop: 14, padding: '12px 14px', background: 'var(--bg)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--line)' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
                    <div>
                      <span style={{ fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', color: 'var(--muted-2)' }}>1. What Happened</span>
                      <p style={{ margin: '3px 0 0', fontSize: 12, color: 'var(--text)', fontWeight: 500 }}>
                        Week 41 demand spiked to 2,410.00 EA (z=3.61); Week 67 hit 2,050.00 EA, breaching the 2,000.00 EA plant policy cap.
                      </p>
                    </div>
                    <div>
                      <span style={{ fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', color: 'var(--muted-2)' }}>2. How Significant</span>
                      <p style={{ margin: '3px 0 0', fontSize: 12, color: 'var(--text)', fontWeight: 500 }}>
                        Week 41 is 87.70% above baseline ($189.55K value); overall trend slope is +30.82 EA/wk (+2.40% of baseline/wk, R²=0.84).
                      </p>
                    </div>
                    <div>
                      <span style={{ fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', color: 'var(--muted-2)' }}>3. Why It Matters</span>
                      <p style={{ margin: '3px 0 0', fontSize: 12, color: 'var(--text)', fontWeight: 500 }}>
                        Static lot sizes and fixed 2,000.00 EA caps create replenishment deficits and line starvation risks during surge periods.
                      </p>
                    </div>
                    <div>
                      <span style={{ fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', color: 'var(--muted-2)' }}>4. What Next</span>
                      <p style={{ margin: '3px 0 0', fontSize: 12, color: 'var(--text)', fontWeight: 500 }}>
                        Recalibrate lot sizing parameters and incorporate linear trend slope in Multivariate Forecast.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. BUSINESS CONTEXT / BUSINESS IMPACT SECTION WITH PERSONA INTERPRETATIONS */}
              <div className="card">
                <div className="card__head">
                  <div>
                    <h2 className="card__title">Business Impact & Metric Interpretations</h2>
                    <p className="card__sub">
                      {persona === 'ds'
                        ? 'Statistical and model-architecture interpretations for demand scale, dispersion, and stationarity'
                        : persona === 'analyst'
                        ? 'Operational interpretations, throughput exposure, and capacity risk drivers for weekly consumption'
                        : 'Executive financial impact, working capital sensitivity, and strategic capacity decisions'}
                    </p>
                  </div>
                  <Badge tone="accent">{persona === 'ds' ? 'Data Science Lens' : persona === 'analyst' ? 'Analyst Lens' : 'Executive Lens'}</Badge>
                </div>

                <div className="grid-2" style={{ marginBottom: 0 }}>
                  {/* Metric 1 */}
                  <div className="card" style={{ marginBottom: 0, padding: 14, background: 'var(--bg)', border: '1px solid var(--line)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)' }}>Demand Value / Week</span>
                      <span className="num" style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)' }}>$100.99K / wk</span>
                    </div>
                    <div style={{ fontSize: 12, lineHeight: 1.5, color: 'var(--muted)' }}>
                      <p style={{ margin: '0 0 6px' }}>
                        <strong style={{ color: 'var(--text)' }}>What it means: </strong>
                        {persona === 'ds'
                          ? 'Represents the scale parameter of the signal process in monetary units ($100.99K/wk baseline: 1,284 EA × $78.65/EA unit cost).'
                          : persona === 'analyst'
                          ? 'Monetary value of physical material consumed each week on Plant 1 production lines (1,284 EA/wk average baseline).'
                          : 'Current demand represents approximately $100.99K of weekly material throughput ($5.25M annualized expenditure at 52 weeks).'}
                      </p>
                      <p style={{ margin: 0 }}>
                        <strong style={{ color: 'var(--text)' }}>Why it matters: </strong>
                        {persona === 'ds'
                          ? 'High monetary scale means small forecasting percentage errors (e.g., 5% MAPE) translate to large absolute dollar deviations ($5.05K/wk).'
                          : persona === 'analyst'
                          ? 'Sustained volume expansion (+26.17% vs baseline) increases weekly replenishment capital commitments from $100.99K to $127.41K/wk.'
                          : 'Persistent demand growth increases replenishment requirements and the value of inventory needed to support target service levels.'}
                      </p>
                    </div>
                  </div>

                  {/* Metric 2 */}
                  <div className="card" style={{ marginBottom: 0, padding: 14, background: 'var(--bg)', border: '1px solid var(--line)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)' }}>Demand Volatility Exposure</span>
                      <span className="num" style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)' }}>±$24.54K / wk (CV 24.30%)</span>
                    </div>
                    <div style={{ fontSize: 12, lineHeight: 1.5, color: 'var(--muted)' }}>
                      <p style={{ margin: '0 0 6px' }}>
                        <strong style={{ color: 'var(--text)' }}>What it means: </strong>
                        {persona === 'ds'
                          ? 'Demand exhibits moderate relative dispersion (CV = 24.30%, σ = 312.00 EA) around the non-stationary linear trend.'
                          : persona === 'analyst'
                          ? 'Weekly consumption fluctuates by ±312.00 EA around the mean, creating weekly demand value swings of up to ±$24.54K.'
                          : 'Monetary exposure to demand swings that must be absorbed by physical warehouse safety stock capital.'}
                      </p>
                      <p style={{ margin: 0 }}>
                        <strong style={{ color: 'var(--text)' }}>Why it matters: </strong>
                        {persona === 'ds'
                          ? 'Dispersion widens confidence intervals in downstream regression models; requires robust loss functions (Huber/Ridge) or variance-stabilizing transforms.'
                          : persona === 'analyst'
                          ? 'Fluctuations increase short-term replenishment jitter; safety stock must be dynamically scaled to prevent line starvation.'
                          : 'Unmitigated volatility ties up additional working capital in contingency buffers; demand smoothing mitigates holding cost inflation.'}
                      </p>
                    </div>
                  </div>

                  {/* Metric 3 */}
                  <div className="card" style={{ marginBottom: 0, padding: 14, background: 'var(--bg)', border: '1px solid var(--line)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)' }}>Plant Capacity Pressure</span>
                      <span className="num" style={{ fontSize: 14, fontWeight: 700, color: 'var(--watch)' }}>81.00% Current · 120.50% Peak</span>
                    </div>
                    <div style={{ fontSize: 12, lineHeight: 1.5, color: 'var(--muted)' }}>
                      <p style={{ margin: '0 0 6px' }}>
                        <strong style={{ color: 'var(--text)' }}>What it means: </strong>
                        {persona === 'ds'
                          ? 'Current velocity (1,620 EA/wk) operates at 81.00% of the 2,000 EA policy cap; Week 41 breached capacity at 120.50% (z=3.61).'
                          : persona === 'analyst'
                          ? 'Production consumption is consuming 81.00% of the 2,000 EA/wk line feeding cap, leaving only 19.00% headroom.'
                          : 'Assembly line velocity is reaching 81.00% of designed capacity, with past peak spikes exceeding maximum plant throughput.'}
                      </p>
                      <p style={{ margin: 0 }}>
                        <strong style={{ color: 'var(--text)' }}>Why it matters: </strong>
                        {persona === 'ds'
                          ? 'Truncation at policy caps creates right-censored data if physical lines throttle order surges, biasing linear estimators downward.'
                          : persona === 'analyst'
                          ? 'If the +30.82 EA/wk growth persists for another 12 weeks, regular demand will hit the 2,000 EA cap, creating an internal bottleneck.'
                          : 'Unaddressed capacity limits will result in unfulfilled customer orders and delivery backlog as market demand expands.'}
                      </p>
                    </div>
                  </div>

                  {/* Metric 4 */}
                  <div className="card" style={{ marginBottom: 0, padding: 14, background: 'var(--bg)', border: '1px solid var(--line)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)' }}>
                        {persona === 'ds' ? 'Signal Stationarity & OLS Trend' : persona === 'analyst' ? 'Warehouse Buffer Coverage' : 'On-Hand Inventory Value'}
                      </span>
                      <span className="num" style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)' }}>
                        {persona === 'ds' ? 'β₁ = +30.82 EA/wk (p < 0.001)' : persona === 'analyst' ? '70.9 Days Supply (13,000 EA)' : '$1.02M (70.9 Days Supply)'}
                      </span>
                    </div>
                    <div style={{ fontSize: 12, lineHeight: 1.5, color: 'var(--muted)' }}>
                      <p style={{ margin: '0 0 6px' }}>
                        <strong style={{ color: 'var(--text)' }}>What it means: </strong>
                        {persona === 'ds'
                          ? 'Strong autocorrelation (ACF₁ = 0.68) and significant positive slope confirm mean-reverting stationarity is rejected (d=1 required).'
                          : persona === 'analyst'
                          ? 'On-hand stock of 13,000 EA covers 70.9 days of supply at average consumption (183.43 EA/day), but current velocity (231.43 EA/day) reduces coverage to 56.2 days.'
                          : 'Total capital invested in warehouse stock is $1.02M (13,000 EA at $78.65/EA), providing 70.9 days of supply against 60-day supplier lead time.'}
                      </p>
                      <p style={{ margin: 0 }}>
                        <strong style={{ color: 'var(--text)' }}>Why it matters: </strong>
                        {persona === 'ds'
                          ? 'Standard static time-series models require differencing or lag feature engineering to prevent structural forecast lag.'
                          : persona === 'analyst'
                          ? 'Ramping velocity drains the 60-day replenishment buffer 14.7 days faster than planned; reorder points must be updated in MRP.'
                          : 'Buffer is currently healthy relative to 60-day lead time, but requires EOQ recalibration to prevent stockouts as demand expands.'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* 4. DETAILED DIAGNOSTICS BY PERSONA */}
              {persona === 'ds' && (
                <div className="grid-3">
                  <div className="card" style={{ marginBottom: 0, padding: 14 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>
                      Distribution Diagnostics
                    </span>
                    <div style={{ fontSize: 12.5, lineHeight: 1.6 }}>
                      <div>• <strong>Skewness:</strong> +1.18 (Right-skewed positive tail)</div>
                      <div>• <strong>Kurtosis:</strong> 4.22 (Leptokurtic, heavy tails)</div>
                      <div>• <strong>Spread:</strong> 910.00 – 2,410.00 EA (1,500.00 EA)</div>
                      <div>• <strong>Completeness:</strong> 104/104 wks valid (0.00% missing)</div>
                    </div>
                  </div>
                  <div className="card" style={{ marginBottom: 0, padding: 14 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>
                      Time-Series & Stationarity
                    </span>
                    <div style={{ fontSize: 12.5, lineHeight: 1.6 }}>
                      <div>• <strong>Autocorrelation:</strong> ACF(1) = 0.68, ACF(4) = 0.42</div>
                      <div>• <strong>Ljung-Box:</strong> Q(12) = 38.4 (p = 0.0001)</div>
                      <div>• <strong>Trend Variance:</strong> 84.20% of total variation</div>
                      <div>• <strong>Seasonality:</strong> 11.60% (Quarterly 13-wk cycle)</div>
                    </div>
                  </div>
                  <div className="card" style={{ marginBottom: 0, padding: 14 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>
                      Model Architecture Implications
                    </span>
                    <div style={{ fontSize: 12.5, lineHeight: 1.6 }}>
                      <div>• <strong>Candidate:</strong> Lag-1/7/30 Ridge regression</div>
                      <div>• <strong>Variance:</strong> Box-Cox / Log transform advised</div>
                      <div>• <strong>Outlier Treatment:</strong> Winsorize z &gt; 3.5 spike</div>
                      <div>• <strong>Forecasting Fit:</strong> High R² expected (&gt;0.85)</div>
                    </div>
                  </div>
                </div>
              )}

              {persona === 'analyst' && (
                <div className="grid-3">
                  <div className="card" style={{ marginBottom: 0, padding: 14 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>
                      Operational Behaviour
                    </span>
                    <div style={{ fontSize: 12.5, lineHeight: 1.6 }}>
                      <div>• <strong>Classification:</strong> High-Growth Active SKU</div>
                      <div>• <strong>Trailing 12-Wk Ramp:</strong> +14.80% volume increase</div>
                      <div>• <strong>Data Quality:</strong> 100.00% complete records</div>
                      <div>• <strong>Cyclicality:</strong> Mild Q3/Q4 demand surge</div>
                    </div>
                  </div>
                  <div className="card" style={{ marginBottom: 0, padding: 14 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>
                      Outlier Breakdown
                    </span>
                    <div style={{ fontSize: 12.5, lineHeight: 1.6 }}>
                      <div>• <strong>Wk 41 Spike:</strong> 2,410 EA ($189.55K value)</div>
                      <div>• <strong>Wk 67 Breach:</strong> 2,050 EA ($161.23K value)</div>
                      <div>• <strong>Control Band:</strong> 102/104 wks inside ±2σ</div>
                      <div>• <strong>Buffer Drain:</strong> Velocity cuts buffer by 14.7 days</div>
                    </div>
                  </div>
                  <div className="card" style={{ marginBottom: 0, padding: 14 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>
                      Investigation Targets
                    </span>
                    <div style={{ fontSize: 12.5, lineHeight: 1.6 }}>
                      <div>• <strong>Plant 1 Line:</strong> Audit 2,000 EA/wk cap</div>
                      <div>• <strong>Customer Orders:</strong> Confirm Wk 41 recurrence</div>
                      <div>• <strong>Safety Buffer:</strong> Check reorder point coverage</div>
                      <div>• <strong>Action Priority:</strong> HIGH — Rebalance EOQ</div>
                    </div>
                  </div>
                </div>
              )}

              {persona === 'exec' && (
                <div className="grid-3">
                  <div className="card" style={{ marginBottom: 0, padding: 14 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>
                      Business Signal & Growth
                    </span>
                    <div style={{ fontSize: 12.5, lineHeight: 1.6 }}>
                      <div>• <strong>Expansion Trajectory:</strong> +26.17% vs historical mean</div>
                      <div>• <strong>Strategic Role:</strong> Class A backbone for Plant 1</div>
                      <div>• <strong>Annual Throughput:</strong> $5.25M annual volume</div>
                      <div>• <strong>Market Traction:</strong> Expanding client demand</div>
                    </div>
                  </div>
                  <div className="card" style={{ marginBottom: 0, padding: 14 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>
                      Working Capital & Exposure
                    </span>
                    <div style={{ fontSize: 12.5, lineHeight: 1.6 }}>
                      <div>• <strong>Weekly Capital:</strong> $100.99K/wk capital flow</div>
                      <div>• <strong>Buffer Requirement:</strong> ±$24.54K/wk volatility</div>
                      <div>• <strong>Peak Demand:</strong> $189.55K in Wk 41 peak</div>
                      <div>• <strong>Cap Bottleneck:</strong> $157.30K/wk capacity limit</div>
                    </div>
                  </div>
                  <div className="card" style={{ marginBottom: 0, padding: 14 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>
                      Executive Decision Priority
                    </span>
                    <div style={{ fontSize: 12.5, lineHeight: 1.6 }}>
                      <div>• <strong>Executive Attention:</strong> HIGH PRIORITY</div>
                      <div>• <strong>Procurement:</strong> Lock 15% supplier capacity</div>
                      <div>• <strong>Operations:</strong> Elevate Plant 1 line throughput</div>
                      <div>• <strong>Next Action:</strong> Calibrate EOQ lot sizing</div>
                    </div>
                  </div>
                </div>
              )}

              {/* 5. INTERPRETATION & EXPLAINABILITY PANEL (FINDING / MEANING / IMPLICATION / ACTION) */}
              <div className="card" style={{ marginTop: 16 }}>
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

          {/* Fallback for other pre-selected variables */}
          {selectedVarId === 'unit_cost' && (
            <div className="card">
              <div className="card__head">
                <div>
                  <h2 className="card__title">Unit Purchase Price Trajectory ($78.65/EA baseline)</h2>
                  <p className="card__sub">Contract master baseline with spot surcharge anomalies across purchase tranches</p>
                </div>
                <div className="chart-legend" style={{ marginTop: 0 }}>
                  <span><span className="legend-dot" style={{ background: '#0EA5E9' }} />● Effective Unit Price</span>
                  <span><span className="legend-dot" style={{ background: '#C0362C', transform: 'rotate(45deg)' }} />◆ Spot PO Surcharge ($92.00)</span>
                  <span><span className="legend-dot" style={{ background: '#0C7EBE' }} />-- Contract Baseline ($78.65)</span>
                </div>
              </div>
              <div className="chart-shell"><UnitCostTrendChart /></div>
              <div className="grid-3" style={{ marginTop: 14 }}>
                <KpiTile label="Baseline Contract Cost" value="$78.65 / EA" sub="Master Service Agreement fixed pricing" />
                <KpiTile label="Price Volatility (CV)" value="5.34%" sub="±$4.20 spread across purchase tranches" />
                <KpiTile label="Annual Procurement Spend" value="$5.25M" sub="Based on 66,768 EA/yr baseline volume" />
              </div>
            </div>
          )}

          {selectedVarId === 'lead_time' && (
            <div className="card">
              <div className="card__head">
                <div>
                  <h2 className="card__title">Supplier Replenishment Lead Time (60 Days Baseline)</h2>
                  <p className="card__sub">Transit duration history with port congestion outliers exceeding high-risk threshold (70d)</p>
                </div>
                <div className="chart-legend" style={{ marginTop: 0 }}>
                  <span><span className="legend-dot" style={{ background: '#0EA5E9' }} />● Recorded Lead Time (Days)</span>
                  <span><span className="legend-dot" style={{ background: '#C0362C', transform: 'rotate(45deg)' }} />◆ Port Delay Spike (88d)</span>
                  <span><span className="legend-dot" style={{ background: '#B7791F' }} />■ Customs Latency (75d)</span>
                </div>
              </div>
              <div className="chart-shell"><LeadTimeTrendChart /></div>
              <div className="grid-3" style={{ marginTop: 14 }}>
                <KpiTile label="Nominal Lead Time" value="60.00 Days" sub="Supplier contract SLA: 60 calendar days" />
                <KpiTile label="Lead Time Volatility (σ)" value="±14.20 Days" sub="CV 23.67% · Heavy right-skewed delivery tail" />
                <KpiTile label="Pipeline Capital Exposure" value="$865.61K" sub="8.57 weeks of demand (11,006 EA) in transit" />
              </div>
            </div>
          )}

          {selectedVarId === 'on_hand_stock' && (
            <div className="card">
              <div className="card__head">
                <div>
                  <h2 className="card__title">On-Hand Stock Level vs Reorder Point (11,500.00 EA)</h2>
                  <p className="card__sub">Physical warehouse position tracking with safety buffer depletion events</p>
                </div>
                <div className="chart-legend" style={{ marginTop: 0 }}>
                  <span><span className="legend-dot" style={{ background: '#0EA5E9' }} />● On-Hand Inventory (EA)</span>
                  <span><span className="legend-dot" style={{ background: '#C0362C', transform: 'rotate(45deg)' }} />◆ Buffer Depletion Dip (7,200 EA)</span>
                  <span><span className="legend-dot" style={{ background: '#B7791F' }} />-- Reorder Point (11,500 EA)</span>
                </div>
              </div>
              <div className="chart-shell"><OnHandStockTrendChart /></div>
              <div className="grid-3" style={{ marginTop: 14 }}>
                <KpiTile label="Current On-Hand Stock" value="13,000.00 EA" sub="$1.02M total warehouse working capital" />
                <KpiTile label="Days of Supply" value="70.87 Days" sub="10.9 days safety buffer above 60-day lead time" />
                <KpiTile label="Inventory Turnover" value="5.15x / yr" sub="Turning within Class A target bandwidth" />
              </div>
            </div>
          )}
        </div>
      )}

      {/* ================================================================== */}
      {/* TAB 2: BIVARIATE RELATIONSHIP EXPLORER                             */}
      {/* ================================================================== */}
      {tab === 'bi' && (
        <div>
          {/* PRE-SELECTED RELATIONSHIPS SECTION (Card-based Selection Model) */}
          <div style={{ marginBottom: 18 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--muted)' }}>
                Pre-Selected Relationships
              </span>
              <span style={{ fontSize: 11, color: 'var(--muted-2)' }}>
                Click a relationship card to inspect cross-variable correlation & risk concentration
              </span>
            </div>
            <div className="grid-3">
              {BIVARIATE_RELATIONSHIPS.map((r) => {
                const isSelected = selectedRelId === r.id;
                return (
                  <div
                    key={r.id}
                    className="card"
                    onClick={() => setSelectedRelId(r.id)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setSelectedRelId(r.id);
                      }
                    }}
                    style={{
                      cursor: 'pointer',
                      marginBottom: 0,
                      borderColor: isSelected ? 'var(--accent)' : 'var(--line)',
                      background: isSelected ? 'linear-gradient(180deg, #FBFDFF, #F6FAFD)' : 'var(--surface)',
                      boxShadow: isSelected ? '0 0 0 1px var(--accent), var(--shadow-card)' : 'none',
                      padding: '14px 16px',
                      transition: 'border-color 0.15s, box-shadow 0.15s',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                      <span style={{ fontSize: 12.5, fontWeight: 700, color: isSelected ? 'var(--accent)' : 'var(--text)' }}>
                        {r.varA} vs {r.varB}
                      </span>
                      <Badge tone={isSelected ? 'accent' : 'neutral'}>{r.tag}</Badge>
                    </div>
                    <div style={{ fontSize: 10.5, fontFamily: 'var(--font-mono)', color: 'var(--muted-2)', marginBottom: 6 }}>
                      {r.type}
                    </div>
                    <p style={{ fontSize: 11.5, color: 'var(--muted)', margin: 0, lineHeight: 1.35 }}>
                      {r.meaning}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ============================================================== */}
          {/* BIVARIATE ANALYSIS CONTENT FOR SELECTED RELATIONSHIP           */}
          {/* ============================================================== */}
          {selectedRelId === 'lt_vs_stockout' && (
            <div>
              {/* 1. PRIMARY BIVARIATE KPIs BY PERSONA */}
              {persona === 'ds' && (
                <div className="grid-4" style={{ marginBottom: 16 }}>
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
              )}

              {persona === 'analyst' && (
                <div className="grid-4" style={{ marginBottom: 16 }}>
                  <KpiTile
                    label="Relationship Strength"
                    value="Strong Positive (r=0.74)"
                    delta="Primary stockout indicator"
                    deltaTone="down"
                    sub="Direct correlation between transit delay & stockouts"
                  />
                  <KpiTile
                    label="High-Risk Population"
                    value="28 Critical SKUs"
                    sub="19.70% of Class A catalog in >45d red zone"
                  />
                  <KpiTile
                    label="Stockout Multiplier"
                    value="3.20x Higher Rate"
                    sub="9.80% stockout rate (>45d) vs 3.06% (<30d)"
                  />
                  <KpiTile
                    label="Explained Variation"
                    value="54.80% of Failures"
                    sub="Lead time variability accounts for majority of stockouts"
                  />
                </div>
              )}

              {persona === 'exec' && (
                <div className="grid-4" style={{ marginBottom: 16 }}>
                  <KpiTile
                    label="Strategic Supplier Risk"
                    value="HIGH VULNERABILITY"
                    delta="28 Class A SKUs exposed"
                    deltaTone="down"
                    sub="Illustrative $11.85M inventory value exposure in >45d cohort"
                  />
                  <KpiTile
                    label="Service Level Gap"
                    value="-7.40 percentage points"
                    delta="91.20% vs 98.60% Target"
                    deltaTone="down"
                    sub="Overseas transit directly penalizes assembly lines"
                  />
                  <KpiTile
                    label="Working Capital in Transit"
                    value="$3.80M Buffer Capital"
                    sub="Tied up in safety stock to absorb supplier variance"
                  />
                  <KpiTile
                    label="Executive Decision Priority"
                    value="HIGH — DUAL SOURCING"
                    sub="Nearshoring / regional buffer mitigates transit delay"
                  />
                </div>
              )}

              {/* 2. MAIN BIVARIATE SCATTER VISUALIZATION & SUMMARY */}
              <div className="two-col">
                <div className="card">
                  <div className="card__head">
                    <div>
                      <h2 className="card__title">Supplier Lead Time vs Stockout Frequency</h2>
                      <p className="card__sub">142 Class A materials ($34.28M value), trailing 12 months</p>
                    </div>
                    <Badge tone="risk">Critical Risk Zone: &gt;45 Days</Badge>
                  </div>
                  <div className="chart-shell">
                    <BivariateScatterChart />
                  </div>
                  <div style={{ marginTop: 12, padding: '10px 12px', background: 'var(--bg)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--line)', fontSize: 11.5 }}>
                    <strong style={{ color: 'var(--risk)' }}>Key Finding:</strong> Materials with lead time &gt;45 days exhibit a 3.20× higher stockout rate (9.80% vs 3.06%) and 3.20× higher delivery variance than local suppliers.
                  </div>
                </div>

                <div className="card">
                  <h2 className="card__title">Relationship Intelligence</h2>
                  <Insight label="Correlation vs Causation Standard">
                    Statistical analysis establishes a <span className="metric">strong positive empirical association (r = 0.74, R² = 0.548)</span> between supplier lead time and stockout frequency across 142 Class A materials. While this empirical relationship is highly significant, correlation does not prove direct isolated causality — delivery transit variance (σ_LT), right-skewed shipping tails, and single-sourcing are key contributing operational drivers.
                  </Insight>

                  {/* Persona-specific Relationship Breakdown */}
                  {persona === 'ds' && (
                    <div style={{ marginTop: 12, fontSize: 12.5, lineHeight: 1.5 }}>
                      <div style={{ padding: '8px 10px', background: 'var(--bg)', borderRadius: 'var(--radius-sm)', marginBottom: 8 }}>
                        <strong>Statistical Diagnostics:</strong>
                        <div style={{ marginTop: 4, color: 'var(--muted)' }}>
                          • Breusch-Pagan heteroskedasticity test p = 0.041 (variance expands beyond 45d)<br />
                          • 3 high-leverage outliers identified in overseas component categories (Cook&apos;s d &gt; 4/N)<br />
                          • Piecewise regression spline at LT=45d improves explanatory fit to R² = 0.63
                        </div>
                      </div>
                    </div>
                  )}

                  {persona === 'analyst' && (
                    <div style={{ marginTop: 12, fontSize: 12.5, lineHeight: 1.5 }}>
                      <div style={{ padding: '8px 10px', background: 'var(--bg)', borderRadius: 'var(--radius-sm)', marginBottom: 8 }}>
                        <strong>Cohort Risk Segmentation:</strong>
                        <div style={{ marginTop: 4, color: 'var(--muted)' }}>
                          • <strong>Red Zone (&gt;45d):</strong> 28 SKUs · 9.80% stockout rate · $11.85M illustrative value exposure<br />
                          • <strong>Watch Zone (30–45d):</strong> 44 SKUs · 4.90% stockout rate · $12.40M illustrative value exposure<br />
                          • <strong>Safe Zone (&lt;30d):</strong> 70 SKUs · 3.06% stockout rate · $10.03M illustrative value exposure
                        </div>
                      </div>
                    </div>
                  )}

                  {persona === 'exec' && (
                    <div style={{ marginTop: 12, fontSize: 12.5, lineHeight: 1.5 }}>
                      <div style={{ padding: '8px 10px', background: 'var(--bg)', borderRadius: 'var(--radius-sm)', marginBottom: 8 }}>
                        <strong>Executive Strategic Impact:</strong>
                        <div style={{ marginTop: 4, color: 'var(--muted)' }}>
                          • 64.20% of observed enterprise stockout events originate from the 28 Red Zone SKUs<br />
                          • <strong>Potential Working-Capital Opportunity:</strong> Regional buffer optimization on these SKUs identifies up to $1.65M in potential opportunity (subject to scenario validation)<br />
                          • High leverage: Addressing the 28 SKUs directly stabilizes Plant 1 and Plant 3 assembly lines
                        </div>
                      </div>
                    </div>
                  )}

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

              {/* 3. BUSINESS IMPACT & METRIC INTERPRETATIONS (BIVARIATE) */}
              <div className="card" style={{ marginTop: 16 }}>
                <div className="card__head">
                  <div>
                    <h2 className="card__title">Bivariate Business Impact & Risk Interpretations</h2>
                    <p className="card__sub">
                      {persona === 'ds'
                        ? 'Inference rigor, coefficient stability, and non-linear risk zone diagnostics for lead time vs stockout'
                        : persona === 'analyst'
                        ? 'Operational exposure, risk concentration cohorts, and supplier investigation targets'
                        : 'Strategic supplier vulnerability, financial value exposure, and dual-sourcing governance'}
                    </p>
                  </div>
                  <Badge tone="accent">{persona === 'ds' ? 'Data Science Lens' : persona === 'analyst' ? 'Analyst Lens' : 'Executive Lens'}</Badge>
                </div>

                <div className="grid-2" style={{ marginBottom: 0 }}>
                  {/* Bivariate Metric 1 */}
                  <div className="card" style={{ marginBottom: 0, padding: 14, background: 'var(--bg)', border: '1px solid var(--line)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)' }}>At-Risk Population & Concentration</span>
                      <span className="num" style={{ fontSize: 14, fontWeight: 700, color: 'var(--risk)' }}>28 SKUs (19.70% of Catalog)</span>
                    </div>
                    <div style={{ fontSize: 12, lineHeight: 1.5, color: 'var(--muted)' }}>
                      <p style={{ margin: '0 0 6px' }}>
                        <strong style={{ color: 'var(--text)' }}>What it means: </strong>
                        {persona === 'ds'
                          ? '28 of 142 materials fall beyond the 45-day knot where delivery variance expands exponentially (19.70% concentration).'
                          : persona === 'analyst'
                          ? '28 Class A materials are exposed to high supplier transit latency and elevated stockout frequency.'
                          : '19.70% of analyzed materials account for 64.20% of observed enterprise stockout events.'}
                      </p>
                      <p style={{ margin: 0 }}>
                        <strong style={{ color: 'var(--text)' }}>Why it matters: </strong>
                        {persona === 'ds'
                          ? 'Risk is heavily concentrated rather than uniformly distributed, requiring segmented piecewise model calibration.'
                          : persona === 'analyst'
                          ? 'Concentration allows targeted operational intervention on 28 vendor relationships rather than a catalog-wide overhaul.'
                          : 'Prioritizing intervention on this specific cohort targets the primary source of assembly line disruptions.'}
                      </p>
                    </div>
                  </div>

                  {/* Bivariate Metric 2 */}
                  <div className="card" style={{ marginBottom: 0, padding: 14, background: 'var(--bg)', border: '1px solid var(--line)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)' }}>Inventory Value Exposure (Illustrative)</span>
                      <span className="num" style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)' }}>$11.85M (34.57% of Class A)</span>
                    </div>
                    <div style={{ fontSize: 12, lineHeight: 1.5, color: 'var(--muted)' }}>
                      <p style={{ margin: '0 0 6px' }}>
                        <strong style={{ color: 'var(--text)' }}>What it means: </strong>
                        {persona === 'ds'
                          ? 'Illustrative valuation weight of observations residing in the heteroskedastic high-variance domain (>45 days).'
                          : persona === 'analyst'
                          ? 'Illustrative inventory value exposure estimate associated with the 28 materials operating with >45-day lead times ($423.21K average value/SKU across $34.28M Class A baseline).'
                          : 'Illustrative inventory value exposure estimate ($11.85M) tied to supplier disruption and transit risk across the high-risk cohort.'}
                      </p>
                      <p style={{ margin: 0 }}>
                        <strong style={{ color: 'var(--text)' }}>Why it matters: </strong>
                        {persona === 'ds'
                          ? 'High value weighting in the upper quadrant means unmodeled tail variance carries severe monetary loss potential.'
                          : persona === 'analyst'
                          ? 'Stockouts in this high-value cohort directly starve downstream production lines at Plant 1 and Plant 3.'
                          : 'Concentrated capital exposure creates a clear business case for strategic dual-sourcing and regional supplier buffering.'}
                      </p>
                    </div>
                  </div>

                  {/* Bivariate Metric 3 */}
                  <div className="card" style={{ marginBottom: 0, padding: 14, background: 'var(--bg)', border: '1px solid var(--line)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)' }}>Service Level Performance Gap</span>
                      <span className="num" style={{ fontSize: 14, fontWeight: 700, color: 'var(--risk)' }}>-7.40 percentage points</span>
                    </div>
                    <div style={{ fontSize: 12, lineHeight: 1.5, color: 'var(--muted)' }}>
                      <p style={{ margin: '0 0 6px' }}>
                        <strong style={{ color: 'var(--text)' }}>What it means: </strong>
                        {persona === 'ds'
                          ? 'The conditional probability of fulfillment P(Fill | LT > 45d) is 91.20%, compared to 98.60% target SLA (-7.40 percentage points deficit).'
                          : persona === 'analyst'
                          ? 'The affected long-lead cohort operates 7.40 percentage points below the required enterprise service-level target (91.20% vs 98.60%).'
                          : 'Overseas transit delays correlate with measurable service degradation and production scheduling interruptions (-7.40 percentage points gap).'}
                      </p>
                      <p style={{ margin: 0 }}>
                        <strong style={{ color: 'var(--text)' }}>Why it matters: </strong>
                        {persona === 'ds'
                          ? 'Proves that standard Gaussian lead-time assumptions underestimate actual empirical failure rates in long-lead modules.'
                          : persona === 'analyst'
                          ? 'Service gap is concentrated in single-sourced components, creating frequent unplanned assembly line downtime.'
                          : 'Service failures directly threaten customer delivery commitments and quarterly revenue recognition.'}
                      </p>
                    </div>
                  </div>

                  {/* Bivariate Metric 4 */}
                  <div className="card" style={{ marginBottom: 0, padding: 14, background: 'var(--bg)', border: '1px solid var(--line)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)' }}>
                        {persona === 'ds' ? 'Inference & Association Diagnostic' : persona === 'analyst' ? 'Single-Sourcing Vulnerability' : 'Strategic Governance Mandate'}
                      </span>
                      <span className="num" style={{ fontSize: 14, fontWeight: 700, color: 'var(--watch)' }}>
                        {persona === 'ds' ? 'r = 0.74 (Associated, Not Causal)' : persona === 'analyst' ? '22 of 28 SKUs (78.60% Single-Sourced)' : 'HIGH SOURCING VULNERABILITY'}
                      </span>
                    </div>
                    <div style={{ fontSize: 12, lineHeight: 1.5, color: 'var(--muted)' }}>
                      <p style={{ margin: '0 0 6px' }}>
                        <strong style={{ color: 'var(--text)' }}>What it means: </strong>
                        {persona === 'ds'
                          ? 'Strong empirical association (r = 0.74, R² = 0.548) indicates lead time is an indicator of risk, though transit variance (σ_LT) is the operational driver.'
                          : persona === 'analyst'
                          ? '78.60% of the high-risk cohort relies exclusively on single-vendor international supply contracts with low supplier redundancy.'
                          : '78.60% single-sourcing concentration creates high operational vulnerability, requiring executive approval for dual-sourcing qualification.'}
                      </p>
                      <p style={{ margin: 0 }}>
                        <strong style={{ color: 'var(--text)' }}>Why it matters: </strong>
                        {persona === 'ds'
                          ? 'Avoids misleading causal claims; models must incorporate both transit mean and transit standard deviation (σ_LT).'
                          : persona === 'analyst'
                          ? 'Single-sourcing creates operational single-points-of-failure with no fallback during shipping disruptions.'
                          : 'Authorizing dual-sourcing terms targets service reliability while identifying up to $1.65M in potential working-capital opportunity (subject to scenario validation).'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {selectedRelId === 'order_qty_vs_cost' && (
            <div className="two-col">
              <div className="card">
                <div className="card__head">
                  <div>
                    <h2 className="card__title">Order Quantity vs Unit Purchase Cost</h2>
                    <p className="card__sub">Scale discounts vs holding cost trade-off across catalog order batches</p>
                  </div>
                  <Badge tone="accent">r = -0.68 · Scale Economics</Badge>
                </div>
                <div className="chart-shell"><OrderQtyVsCostScatterChart /></div>
                <div style={{ marginTop: 12, padding: '10px 12px', background: 'var(--bg)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--line)', fontSize: 11.5 }}>
                  <strong style={{ color: 'var(--accent)' }}>Scale Insight:</strong> Purchasing batches &ge;1,200 EA unlock an average 8.50% unit price discount, balancing ordering economy against annual carrying costs.
                </div>
              </div>

              <div className="card">
                <h2 className="card__title">Batch Sizing Summary</h2>
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
                <div className="card__head">
                  <div>
                    <h2 className="card__title">Demand Volatility (CV) vs Supplier On-Time Rate</h2>
                    <p className="card__sub">Fulfillment strain: High-volatility SKUs exhibit lower supplier on-time delivery</p>
                  </div>
                  <Badge tone="watch">r = -0.61 · Fulfillment Stress</Badge>
                </div>
                <div className="chart-shell"><DemandVsOnTimeScatterChart /></div>
                <div style={{ marginTop: 12, padding: '10px 12px', background: 'var(--bg)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--line)', fontSize: 11.5 }}>
                  <strong style={{ color: 'var(--watch)' }}>Bullwhip Alert:</strong> SKUs with demand CV &gt; 25% show a 12.40 percentage point lower supplier on-time delivery rate (83.80% vs 96.20%), increasing stockout exposure.
                </div>
              </div>

              <div className="card">
                <h2 className="card__title">Volatility Impact Summary</h2>
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
    </section>
  );
}


