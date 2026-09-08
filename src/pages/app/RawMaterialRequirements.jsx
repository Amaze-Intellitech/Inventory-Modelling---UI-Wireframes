import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ViewHead, KpiTile, WhyDisclosure, Badge, Insight } from '../../components/CommonUI';
import { usePlatform } from '../../context/PlatformContext';
import { EOQ_INPUTS, FORECAST_INPUTS } from '../../data/mockData';

// Planning service-factor for one-sided 95.00% target coverage under standard normal assumption
const Z = 1.65;

// Contextual metadata aligned with enterprise material master
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

// ============================================================================
// INLINE DAILY FORECAST CHART COMPONENT (84-DAY TIME-SERIES VISUALIZATION)
// ============================================================================
function DailyForecastChart({
  dailyForecastSeries,
  baseDailyDemand,
  trendPerWeek,
  demandCV,
  leadTimeDays,
  uom = 'EA',
}) {
  const [hoveredPoint, setHoveredPoint] = React.useState(null);

  const historyDays = 56; // 8 weeks trailing daily history
  const horizonDays = 84; // 12 weeks = 84 individual daily forecast points

  const W = 1000, H = 380, ML = 72, MR = 35, MT = 40, MB = 55;

  // 1. Generate historical daily consumption points (-56 to -1)
  const histDailyPoints = React.useMemo(() => {
    const pts = [];
    for (let d = -historyDays; d < 0; d++) {
      const trendFactor = 1 + trendPerWeek * (d / 7);
      const wave = 1 + 0.12 * Math.sin(d * 0.72) + 0.05 * Math.cos(d * 1.3);
      const val = Math.max(0, baseDailyDemand * trendFactor * wave);
      pts.push({ day: d, val });
    }
    return pts;
  }, [baseDailyDemand, trendPerWeek]);

  // 2. Compute y-axis domain
  const allVals = [
    baseDailyDemand,
    ...histDailyPoints.map((p) => p.val),
    ...dailyForecastSeries.map((p) => p.upperBand),
    ...dailyForecastSeries.map((p) => p.dailyMean),
  ];
  const maxVal = Math.max(...allVals, 1);
  const rawMax = maxVal * 1.15;
  const magnitude = Math.pow(10, Math.floor(Math.log10(rawMax || 1)));
  const step = magnitude >= 10 ? magnitude / 2 : magnitude || 1;
  const yMax = Math.ceil(rawMax / step) * step;

  // Coordinate mappers (Total range: -56 to +84 = 140 days)
  const totalDays = historyDays + horizonDays;
  const x = (d) => ML + ((d + historyDays) / totalDays) * (W - ML - MR);
  const y = (v) => MT + (1 - Math.max(0, v) / yMax) * (H - MT - MB);

  // Historical path connecting seamlessly to Day 0 (baseDailyDemand)
  const histPath = [
    `M ${x(histDailyPoints[0].day).toFixed(1)},${y(histDailyPoints[0].val).toFixed(1)}`,
    ...histDailyPoints.slice(1).map((p) => `L ${x(p.day).toFixed(1)},${y(p.val).toFixed(1)}`),
    `L ${x(0).toFixed(1)},${y(baseDailyDemand).toFixed(1)}`,
  ].join(' ');

  // Daily forecast trajectory path connecting Day 0 to all 84 daily points
  const forecastPath = [
    `M ${x(0).toFixed(1)},${y(baseDailyDemand).toFixed(1)}`,
    ...dailyForecastSeries.map((p) => `L ${x(p.day).toFixed(1)},${y(p.dailyMean).toFixed(1)}`),
  ].join(' ');

  // Area polygon under forecast line
  const forecastAreaPath = [
    `M ${x(0).toFixed(1)},${y(baseDailyDemand).toFixed(1)}`,
    ...dailyForecastSeries.map((p) => `L ${x(p.day).toFixed(1)},${y(p.dailyMean).toFixed(1)}`),
    `L ${x(84).toFixed(1)},${(H - MB).toFixed(1)}`,
    `L ${x(0).toFixed(1)},${(H - MB).toFixed(1)}`,
    'Z',
  ].join(' ');

  // Planning factor band polygon (Z = 1.65, expands with sqrt(t/7))
  const bandPath = [
    `M ${x(0).toFixed(1)},${y(baseDailyDemand).toFixed(1)}`,
    ...dailyForecastSeries.map((p) => `L ${x(p.day).toFixed(1)},${y(p.upperBand).toFixed(1)}`),
    ...dailyForecastSeries.slice().reverse().map((p) => `L ${x(p.day).toFixed(1)},${y(p.lowerBand).toFixed(1)}`),
    'Z',
  ].join(' ');

  // Replenishment lead time position
  const xLeadTime = x(Math.min(leadTimeDays, horizonDays));

  // Milestone X-axis ticks (history, forecast start, key weekly intervals)
  const xTicks = [
    { day: -56, label: 'Day -56', sub: 'Jul 15', zone: 'hist' },
    { day: -28, label: 'Day -28', sub: 'Aug 12', zone: 'hist' },
    { day: 0, label: 'Day 0', sub: 'Sep 8', zone: 'start' },
    { day: 1, label: 'Day 1', sub: 'Sep 9', zone: 'fc' },
    { day: 14, label: 'Day 14', sub: 'Sep 22', zone: 'fc' },
    { day: 28, label: 'Day 28', sub: 'Oct 6', zone: 'fc' },
    { day: 42, label: 'Day 42', sub: 'Oct 20', zone: 'fc' },
    { day: 56, label: 'Day 56', sub: 'Nov 3', zone: 'fc' },
    { day: 70, label: 'Day 70', sub: 'Nov 17', zone: 'fc' },
    { day: 84, label: 'Day 84', sub: 'Dec 1', zone: 'fc' },
  ];

  const activePoint = hoveredPoint || dailyForecastSeries[0];

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const mouseSvgX = ((e.clientX - rect.left) / rect.width) * W;
    if (mouseSvgX >= x(0) && mouseSvgX <= x(horizonDays)) {
      const approxDay = Math.round(((mouseSvgX - ML) / (W - ML - MR)) * totalDays - historyDays);
      const clampedDay = Math.max(1, Math.min(horizonDays, approxDay));
      setHoveredPoint(dailyForecastSeries[clampedDay - 1]);
    } else {
      setHoveredPoint(null);
    }
  };

  return (
    <div style={{ position: 'relative', width: '100%', minHeight: 440, maxWidth: '100%', overflow: 'hidden' }}>
      {/* Real-Time Interactive Day Inspector Bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'var(--bg, #F8FAFC)',
          border: '1px solid var(--line, #E2E8F0)',
          borderRadius: 6,
          padding: '8px 14px',
          marginBottom: 10,
          flexWrap: 'wrap',
          gap: 10,
          minWidth: 0,
          overflow: 'hidden',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, flexShrink: 1 }}>
          <span className="badge badge-accent" style={{ fontWeight: 700 }}>
            {hoveredPoint ? 'Inspecting Day' : 'Next-Day Baseline'}
          </span>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)' }}>
            Day {activePoint.day} · {activePoint.dayOfWeek}, {activePoint.date}, 2026 (Week {activePoint.weekNum})
          </span>
        </div>
        <div style={{ display: 'flex', gap: 14, alignItems: 'center', fontSize: 12, flexWrap: 'wrap', minWidth: 0, flexShrink: 1 }}>
          <div>
            <span style={{ color: 'var(--muted)', marginRight: 4 }}>Daily Forecast:</span>
            <strong style={{ color: '#0284C7', fontSize: 13 }}>{activePoint.dailyMean.toFixed(2)} {uom}/day</strong>
          </div>
          <div>
            <span style={{ color: 'var(--muted)', marginRight: 4 }}>Planning Envelope (Z=1.65):</span>
            <span style={{ color: 'var(--text)', fontWeight: 600 }}>{activePoint.lowerBand.toFixed(2)} – {activePoint.upperBand.toFixed(2)} {uom}/d</span>
          </div>
          <div>
            <span style={{ color: 'var(--muted)', marginRight: 4 }}>Cumulative Total:</span>
            <strong style={{ color: 'var(--ink)' }}>{activePoint.cumulativeDemand.toFixed(1)} {uom}</strong>
          </div>
        </div>
      </div>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        style={{ width: '100%', height: 380, display: 'block', cursor: 'crosshair' }}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHoveredPoint(null)}
      >
        <defs>
          <linearGradient id="forecastAreaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0284C7" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#0284C7" stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Shaded background zones */}
        {/* 1. Historical Actual Demand Zone */}
        <rect
          x={ML}
          y={MT}
          width={x(0) - ML}
          height={H - MT - MB}
          fill="#F8FAFC"
          opacity={0.8}
        />
        <text
          x={ML + 10}
          y={MT + 16}
          fontSize={10}
          fill="#64748B"
          fontWeight={700}
          letterSpacing="0.05em"
          fontFamily="IBM Plex Mono"
        >
          HISTORICAL OBSERVED DEMAND (56 DAYS)
        </text>

        {/* 2. Forecast Horizon Zone */}
        <rect
          x={x(0)}
          y={MT}
          width={W - MR - x(0)}
          height={H - MT - MB}
          fill="#F0F9FF"
          opacity={0.4}
        />
        <text
          x={x(0) + 12}
          y={MT + 16}
          fontSize={10}
          fill="#0369A1"
          fontWeight={700}
          letterSpacing="0.05em"
          fontFamily="IBM Plex Mono"
        >
          MULTIVARIATE FORECAST HORIZON (84 DAYS · WEEKS 1–12)
        </text>

        {/* Y-axis gridlines and labels */}
        {[0, 0.25, 0.5, 0.75, 1].map((f) => {
          const v = yMax * f;
          return (
            <g key={f}>
              <line x1={ML} x2={W - MR} y1={y(v)} y2={y(v)} stroke="#EEF2F7" />
              <text x={8} y={y(v) + 4} fontSize={10} fill="#8896A8" fontFamily="IBM Plex Mono">
                {v.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
              </text>
            </g>
          );
        })}

        {/* X-axis tick lines and labels */}
        {xTicks.map((tick) => (
          <g key={tick.day}>
            <line x1={x(tick.day)} x2={x(tick.day)} y1={H - MB} y2={H - MB + 5} stroke="#CBD5E1" />
            <text
              x={x(tick.day)}
              y={H - MB + 16}
              fontSize={9.5}
              fill={tick.day === 0 ? '#0284C7' : tick.day > 0 ? '#1E293B' : '#64748B'}
              textAnchor="middle"
              fontFamily="IBM Plex Mono"
              fontWeight={tick.day === 0 || tick.day === 1 || tick.day === 84 ? 700 : 500}
            >
              {tick.label}
            </text>
            <text
              x={x(tick.day)}
              y={H - MB + 28}
              fontSize={8.5}
              fill="#94A3B8"
              textAnchor="middle"
              fontFamily="IBM Plex Mono"
            >
              {tick.sub}
            </text>
          </g>
        ))}

        {/* Shaded 95% Planning Envelope (Z = 1.65) */}
        <path d={bandPath} fill="#BAE6FD" fillOpacity={0.45} stroke="#38BDF8" strokeWidth={1} strokeDasharray="4 3" />

        {/* Area under forecast line */}
        <path d={forecastAreaPath} fill="url(#forecastAreaGrad)" />

        {/* Forecast Start Marker (Day 0 Boundary) */}
        <line x1={x(0)} x2={x(0)} y1={MT} y2={H - MB} stroke="#0284C7" strokeWidth={2} />
        <rect x={x(0) - 46} y={MT - 22} width={92} height={20} rx={4} fill="#0284C7" />
        <text x={x(0)} y={MT - 8} fontSize={9.5} fill="#ffffff" fontWeight={700} fontFamily="IBM Plex Mono" textAnchor="middle">
          Forecast Start
        </text>

        {/* Replenishment lead-time arrival marker */}
        {leadTimeDays <= horizonDays && (
          <g>
            <line x1={xLeadTime} x2={xLeadTime} y1={MT} y2={H - MB} stroke="#B7791F" strokeWidth={1.5} strokeDasharray="4 3" />
            <rect x={xLeadTime - 56} y={MT + 4} width={112} height={18} rx={3} fill="#FEF3C7" stroke="#F59E0B" strokeWidth={1} />
            <text x={xLeadTime} y={MT + 16} fontSize={9} fill="#92400E" fontFamily="IBM Plex Mono" fontWeight={700} textAnchor="middle">
              ▲ Lead Time (+{leadTimeDays}d)
            </text>
          </g>
        )}

        {/* Week 12 Endpoint Marker */}
        <line x1={x(84)} x2={x(84)} y1={MT} y2={H - MB} stroke="#0369A1" strokeWidth={1.5} strokeDasharray="3 3" />
        <rect x={x(84) - 42} y={MT - 22} width={84} height={20} rx={4} fill="#E0F2FE" stroke="#38BDF8" strokeWidth={1} />
        <text x={x(84)} y={MT - 8} fontSize={9.5} fill="#0369A1" fontWeight={700} fontFamily="IBM Plex Mono" textAnchor="middle">
          Wk 12 End
        </text>

        {/* Historical daily consumption path */}
        <path d={histPath} fill="none" stroke="#94A3B8" strokeWidth={1.75} />
        {/* Sample points for historical curve */}
        {histDailyPoints.filter((_, idx) => idx % 7 === 0).map((p, i) => (
          <circle key={`hp-${i}`} cx={x(p.day)} cy={y(p.val)} r={2} fill="#94A3B8" />
        ))}

        {/* 84-Day Daily Forecast Trajectory Line (Solid & Bold) */}
        <path d={forecastPath} fill="none" stroke="#0284C7" strokeWidth={3} />

        {/* Render each of the 84 daily forecast points */}
        {dailyForecastSeries.map((p) => {
          const isMilestone = p.day === 1 || p.day % 7 === 0 || p.day === leadTimeDays || p.day === 84;
          return (
            <circle
              key={`dp-${p.day}`}
              cx={x(p.day)}
              cy={y(p.dailyMean)}
              r={isMilestone ? 3.5 : 1.75}
              fill="#0284C7"
              stroke="#ffffff"
              strokeWidth={isMilestone ? 1.5 : 0.75}
            />
          );
        })}

        {/* Day 0 anchor circle */}
        <circle cx={x(0)} cy={y(baseDailyDemand)} r={4} fill="#0284C7" stroke="#fff" strokeWidth={2} />

        {/* Hover crosshair & active forecast point markers */}
        {hoveredPoint && (
          <g>
            <line
              x1={x(hoveredPoint.day)}
              x2={x(hoveredPoint.day)}
              y1={MT}
              y2={H - MB}
              stroke="#0284C7"
              strokeWidth={1.5}
              strokeDasharray="2 2"
            />
            <circle
              cx={x(hoveredPoint.day)}
              cy={y(hoveredPoint.upperBand)}
              r={3.5}
              fill="#38BDF8"
              stroke="#fff"
              strokeWidth={1.5}
            />
            <circle
              cx={x(hoveredPoint.day)}
              cy={y(hoveredPoint.lowerBand)}
              r={3.5}
              fill="#38BDF8"
              stroke="#fff"
              strokeWidth={1.5}
            />
            <circle
              cx={x(hoveredPoint.day)}
              cy={y(hoveredPoint.dailyMean)}
              r={5.5}
              fill="#0284C7"
              stroke="#fff"
              strokeWidth={2}
            />
          </g>
        )}

        {/* Axes base lines */}
        <line x1={ML} x2={W - MR} y1={H - MB} y2={H - MB} stroke="#CBD5E1" />
        <line x1={ML} x2={ML} y1={MT} y2={H - MB} stroke="#CBD5E1" />

        {/* Chart axis captions */}
        <text x={(ML + W - MR) / 2} y={H - 4} fontSize={10.5} fill="#5B6B82" textAnchor="middle">
          Timeline: 56-Day Historical Observed Consumption vs 84-Day Forward Daily Forecast Horizon · Calendar Dates
        </text>
        <text x={12} y={MT - 10} fontSize={10} fill="#5B6B82" textAnchor="start" fontFamily="IBM Plex Mono">
          Daily Demand ({uom}/day)
        </text>
      </svg>

      {/* Floating Hover Card */}
      {hoveredPoint && (
        <div
          style={{
            position: 'absolute',
            top: 55,
            left: hoveredPoint.day > 42 ? 85 : 'auto',
            right: hoveredPoint.day > 42 ? 'auto' : 25,
            background: 'rgba(255, 255, 255, 0.98)',
            backdropFilter: 'blur(6px)',
            border: '1.5px solid #0284C7',
            borderRadius: 8,
            padding: '10px 14px',
            fontSize: 12,
            boxShadow: '0 8px 24px rgba(2, 132, 199, 0.16)',
            pointerEvents: 'none',
            zIndex: 20,
            minWidth: 240,
          }}
        >
          <div style={{ fontWeight: 700, color: 'var(--ink)', marginBottom: 4, display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #E2E8F0', paddingBottom: 4 }}>
            <span>Day {hoveredPoint.day} · {hoveredPoint.date}, 2026</span>
            <span style={{ color: '#0284C7', fontWeight: 600 }}>Week {hoveredPoint.weekNum}</span>
          </div>
          <div style={{ color: '#0284C7', fontWeight: 700, fontSize: 13, marginBottom: 2 }}>
            Daily Forecast: {hoveredPoint.dailyMean.toFixed(2)} {uom}/day
          </div>
          <div style={{ color: 'var(--text)', fontSize: 11.5, marginTop: 2 }}>
            Planning Envelope (Z=1.65): <strong>{hoveredPoint.lowerBand.toFixed(2)} – {hoveredPoint.upperBand.toFixed(2)}</strong> {uom}/d
          </div>
          <div style={{ color: 'var(--muted)', fontSize: 11, marginTop: 2 }}>
            Cumulative to Date: <strong>{hoveredPoint.cumulativeDemand.toFixed(1)} {uom}</strong>
          </div>
        </div>
      )}
    </div>
  );
}

export default function RawMaterialRequirements() {
  const navigate = useNavigate();
  const { persona, selectedMaterial } = usePlatform();
  const [showDailySchedule, setShowDailySchedule] = React.useState(false);

  // 1. Resolve canonical selected material (Single Source of Truth)
  const materialId = selectedMaterial?.id || 'MAT-1082';
  const eoqInput = EOQ_INPUTS[materialId] || { demand: 4800.0, currentBatchQty: 600.0 };
  const forecastInput = FORECAST_INPUTS[materialId] || {
    leadTimeDays: 60,
    demandCV: 0.12,
    trendPerWeek: 0.002,
    modelR2: 0.91,
    rmseRatio: 0.09,
  };
  const meta = MATERIAL_METADATA[materialId] || {
    supplier: 'Standard Catalog Vendor',
    contextTag: `Class ${selectedMaterial?.abcClass || 'A'} Raw Material`,
    downstream: 'Standard Production Lines',
    strategicPriority: 'Standard Inventory Governance',
  };

  // 2. Physical & financial base parameters from canonical selected material
  const demand = eoqInput.demand;
  const unitCost = selectedMaterial?.unitCost ?? 600.0;
  const onHandQty = selectedMaterial?.qty ?? 930.0;
  const onHandValue = selectedMaterial?.value ?? (onHandQty * unitCost);
  const uom = selectedMaterial?.uom || 'EA';
  const abcClass = selectedMaterial?.abcClass || 'A';
  const plant = selectedMaterial?.plant || 'Plant 1';
  const category = selectedMaterial?.category || 'Components';
  const name = selectedMaterial?.name || 'Raw Material';

  const { leadTimeDays, demandCV, trendPerWeek, modelR2, rmseRatio } = forecastInput;

  // 3. Validated inventory derivations (from baseline catalog demand)
  const avgDaily = demand / 365;
  const avgWeekly = demand / 52;
  const daysOfSupply = avgDaily > 0 ? onHandQty / avgDaily : 0;
  const annualTurns = onHandQty > 0 ? demand / onHandQty : 0;
  const annualConsumptionValue = demand * unitCost;
  const sigmaDaily = avgDaily * demandCV;
  const sigmaWeekly = avgWeekly * demandCV;
  const safetyStock = Z * sigmaDaily * Math.sqrt(leadTimeDays);
  const safetyStockValue = safetyStock * unitCost;
  const leadTimeDemand = avgDaily * leadTimeDays;
  const leadTimeDemandValue = leadTimeDemand * unitCost;
  const reorderPoint = leadTimeDemand + safetyStock;
  const reorderPointValue = reorderPoint * unitCost;
  const belowReorderPoint = onHandQty < reorderPoint;
  const ropGap = reorderPoint - onHandQty;
  const ropBuffer = onHandQty - reorderPoint;
  const leadTimeWeeks = leadTimeDays / 7;

  // 4. Forecast error & trajectory derivations (from multivariate model)
  const rmse = rmseRatio * avgWeekly;
  const forecastHorizonDays = 84; // Complete 12-week horizon = 84 individual daily forecast points
  const forecastHorizonWeeks = 12;
  const baseDailyDemand = avgWeekly / 7; // Exact daily baseline consistent with linear weekly model
  const trendPerDay = trendPerWeek / 7;  // Linear daily slope

  // Generate explicit deterministic 84-day daily forecast series (Days 1 to 84)
  // Day t in [1, 84] corresponds to week fraction t / 7
  // Anchor dates: Day 0 = Sep 8, 2026 (Today); Day 1 = Sep 9, 2026; Day 84 = Dec 1, 2026
  const baseAnchorDate = new Date(2026, 8, 8); // Sep 8, 2026
  const dailyForecastSeries = [];
  let sumDailyDemand = 0;

  for (let t = 1; t <= forecastHorizonDays; t++) {
    const dayDate = new Date(baseAnchorDate);
    dayDate.setDate(baseAnchorDate.getDate() + t);
    const dateStr = dayDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const weekNum = Math.ceil(t / 7);
    const dayOfWeek = dayDate.toLocaleDateString('en-US', { weekday: 'short' });

    // Linear daily trajectory: d(t) = baseDailyDemand * (1 + trendPerWeek * (t / 7))
    // Exactly reconciles with Week-12 endpoint: d(84) * 7 = avgWeekly * (1 + trendPerWeek * 12)
    const dailyMean = baseDailyDemand * (1 + trendPerWeek * (t / 7));

    // Planning service-factor envelope: Z * baseDailyDemand * demandCV * sqrt(t / 7)
    // One-sided 95% service factor (Z = 1.65), expanding with square root of time
    const bandHalfWidth = Z * baseDailyDemand * demandCV * Math.sqrt(t / 7);
    const upperBand = dailyMean + bandHalfWidth;
    const lowerBand = Math.max(0, dailyMean - bandHalfWidth);

    sumDailyDemand += dailyMean;

    dailyForecastSeries.push({
      day: t,
      date: dateStr,
      dayOfWeek,
      weekNum,
      dailyMean,
      bandHalfWidth,
      upperBand,
      lowerBand,
      cumulativeDemand: sumDailyDemand,
    });
  }

  // Exact cumulative 12-week horizon demand calculated by summing all 84 daily forecast values
  const cumulativeHorizonDemand = sumDailyDemand;
  const cumulativeHorizonValue = cumulativeHorizonDemand * unitCost;
  const avgDailyForecast = cumulativeHorizonDemand / forecastHorizonDays;
  const day1Forecast = dailyForecastSeries[0].dailyMean;
  const day84Forecast = dailyForecastSeries[forecastHorizonDays - 1].dailyMean;
  const week12ForecastDaily = day84Forecast;
  // Reconciled Week-12 weekly projection matching Day 84 rate
  const week12ProjectedMean = day84Forecast * 7;
  const trendMagnitudePct = trendPerWeek * 100;
  const trendMagnitudeDailyPct = trendPerDay * 100;

  // Key weekly milestone totals summed from the daily series (for Analyst & operational planning)
  const week1Sum = dailyForecastSeries.slice(0, 7).reduce((acc, p) => acc + p.dailyMean, 0);
  const week4Sum = dailyForecastSeries.slice(21, 28).reduce((acc, p) => acc + p.dailyMean, 0);
  const week8Sum = dailyForecastSeries.slice(49, 56).reduce((acc, p) => acc + p.dailyMean, 0);
  const week12Sum = dailyForecastSeries.slice(77, 84).reduce((acc, p) => acc + p.dailyMean, 0);

  // Number & currency formatting helpers
  const formatNum = (val, decimals = 2) =>
    val.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  const formatCurrency = (val, decimals = 2) =>
    `$${val.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`;

  return (
    <section className="view" style={{ minWidth: 0, overflowX: 'hidden', boxSizing: 'border-box' }}>
      {/* ==================================================================== */}
      {/* A. SHARED PAGE HEADER WITH CANONICAL RM PROPAGATION                 */}
      {/* ==================================================================== */}
      <ViewHead
        title="Multivariate Forecast Intelligence"
        subtitle={
          persona === 'ds' ? (
            <p>
              Autoregressive Ridge regression modeling, in-sample fit diagnostics (R² / RMSE), feature normalization, and service-planning buffer derivation for <strong>{selectedMaterial.id} ({name})</strong>.
            </p>
          ) : persona === 'analyst' ? (
            <p>
              Forward demand trajectory, Planning Reorder Point evaluation, lead-time exposure, and replenishment trigger intelligence for <strong>{selectedMaterial.id} ({name})</strong>.
            </p>
          ) : (
            <p>
              Executive demand outlook, working-capital valuation, supplier lead-time vulnerability, and continuity governance for <strong>{selectedMaterial.id} ({name})</strong>.
            </p>
          )
        }
        actions={
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => navigate('/app/what-if')}
            >
              Proceed to What-If Simulation
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => navigate('/app/optimization')}
            >
              View Optimization Plan
            </button>
          </div>
        }
      />

      {/* ==================================================================== */}
      {/* B. SHARED SELECTED RAW MATERIAL CONTEXT BLOCK                       */}
      {/* ==================================================================== */}
      <div className="card">
        <div className="card__head" style={{ marginBottom: 14 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4, flexWrap: 'wrap' }}>
              <h2 className="card__title" style={{ fontSize: 16, margin: 0 }}>
                {selectedMaterial.id} · {name}
              </h2>
              <Badge tone={abcClass === 'A' ? 'accent' : 'neutral'}>
                {meta.contextTag}
              </Badge>
              <Badge tone={belowReorderPoint ? 'risk' : 'success'}>
                {belowReorderPoint ? '● Below Planning Reorder Point (Replenishment Trigger)' : '● Covered (Above Planning Reorder Point)'}
              </Badge>
            </div>
            <p className="card__sub">
              {plant} · Category: <strong>{category}</strong> · Supplier: <strong>{meta.supplier}</strong> · Lead Time: <strong>{leadTimeDays} days ({leadTimeWeeks.toFixed(1)} wks)</strong> · Downstream Dependency: <strong>{meta.downstream}</strong>
            </p>
          </div>
          <Badge tone={abcClass === 'A' ? 'accent' : 'neutral'}>
            Class {abcClass} Material
          </Badge>
        </div>

        <div className="grid-4" style={{ marginBottom: 0 }}>
          <KpiTile
            label="Annual Catalog Demand (D)"
            value={`${formatNum(demand, 0)} ${uom}/yr`}
            sub={`${formatNum(avgDaily, 2)} ${uom}/day (${formatNum(avgWeekly, 1)} ${uom}/wk) · ${formatCurrency(annualConsumptionValue)}/yr`}
          />
          <KpiTile
            label="Physical On-Hand Inventory"
            value={`${formatNum(onHandQty, 0)} ${uom}`}
            sub={`${formatCurrency(onHandValue)} carrying value at ${formatCurrency(unitCost)}/${uom}`}
          />
          <KpiTile
            label="Days of Supply (DOS)"
            value={`${formatNum(daysOfSupply, 1)} Days`}
            valueStyle={{ color: belowReorderPoint ? 'var(--risk)' : 'var(--success)' }}
            delta={
              daysOfSupply < leadTimeDays
                ? `LEAN: ${formatNum(leadTimeDays - daysOfSupply, 1)}d below lead time`
                : `Covered: +${formatNum(daysOfSupply - leadTimeDays, 1)}d beyond lead time`
            }
            deltaTone={daysOfSupply < leadTimeDays ? 'down' : 'up'}
            sub={`Supplier lead time is ${leadTimeDays} days`}
          />
          <KpiTile
            label="Planning Reorder Point (ROP)"
            value={`${formatNum(reorderPoint, 1)} ${uom}`}
            delta={
              belowReorderPoint
                ? `Exposure Gap: -${formatNum(ropGap, 1)} ${uom}`
                : `Buffer: +${formatNum(ropBuffer, 1)} ${uom}`
            }
            deltaTone={belowReorderPoint ? 'down' : 'up'}
            sub={`${formatNum(leadTimeDemand, 1)} ${uom} LT demand + ${formatNum(safetyStock, 1)} ${uom} planning safety stock`}
          />
        </div>
      </div>

      {/* ==================================================================== */}
      {/* C. 84-DAY MULTIVARIATE FORECAST PRIMARY KPIS                        */}
      {/* ==================================================================== */}
      <div className="grid-4" style={{ marginBottom: 14 }}>
        <KpiTile
          label="1. Next-Day Forecast"
          value={`${formatNum(day1Forecast, 2)} ${uom}/day`}
          delta="Day 1 · Sep 9, 2026"
          deltaTone="up"
          sub={`Day 1 actual forecast rate (+${formatNum(trendMagnitudeDailyPct, 4)}%/d)`}
        />
        <KpiTile
          label="2. Average Daily Forecast"
          value={`${formatNum(avgDailyForecast, 2)} ${uom}/day`}
          delta="Arithmetic mean of all 84 points"
          deltaTone="flat"
          sub={`Mean daily demand across full 84-day forecast horizon`}
        />
        <KpiTile
          label="3. Week 12 Endpoint"
          value={`${formatNum(day84Forecast, 2)} ${uom}/day`}
          delta={`${formatNum(week12ProjectedMean, 1)} ${uom}/wk equivalent`}
          deltaTone={trendPerWeek >= 0 ? 'up' : 'down'}
          sub={`Day 84 forecast rate at Dec 1, 2026 (Week 12)`}
        />
        <KpiTile
          label="4. 12-Week Forecast Total"
          value={`${formatNum(cumulativeHorizonDemand, 0)} ${uom}`}
          valueStyle={{ color: 'var(--accent, #0284C7)' }}
          delta={`SUM(all 84 daily points) · ${formatCurrency(cumulativeHorizonValue)}`}
          deltaTone="up"
          sub={`Exact cumulative demand summed across all 84 future days`}
        />
      </div>

      {/* ==================================================================== */}
      {/* D. DEDICATED VISIBLE DAILY FORECAST GRAPH SECTION (NEXT 84 DAYS)     */}
      {/* ==================================================================== */}
      <div
        className="card"
        style={{
          border: '2px solid var(--accent, #0284C7)',
          boxShadow: '0 6px 28px rgba(2, 132, 199, 0.12)',
          marginBottom: 16,
          padding: '18px 20px',
        }}
      >
        <div className="card__head" style={{ borderBottom: '1px solid var(--line)', paddingBottom: 12, marginBottom: 14, flexWrap: 'wrap', gap: 12 }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 4 }}>
              <h2 className="card__title" style={{ fontSize: 20, fontWeight: 700, margin: 0, color: 'var(--ink)' }}>
                Daily Forecast — Next 84 Days
              </h2>
              <Badge tone="accent">84-Day Time Series</Badge>
              <button
                id="daily-schedule-toggle"
                type="button"
                aria-expanded={showDailySchedule}
                aria-controls="daily-schedule-table"
                onClick={() => setShowDailySchedule((prev) => !prev)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '3px 10px',
                  fontSize: 11.5,
                  fontWeight: 600,
                  color: showDailySchedule ? '#fff' : '#0284C7',
                  background: showDailySchedule ? '#0284C7' : 'transparent',
                  border: '1.5px solid #0284C7',
                  borderRadius: 20,
                  cursor: 'pointer',
                  transition: 'background 0.15s, color 0.15s',
                  lineHeight: 1.4,
                  userSelect: 'none',
                }}
              >
                {showDailySchedule ? 'Hide Day-by-Day Resolution' : 'View Day-by-Day Resolution'}
                <span aria-hidden="true" style={{ fontSize: 10, display: 'inline-block', transform: showDailySchedule ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.15s' }}>▼</span>
              </button>
            </div>
            <p className="card__sub" style={{ fontSize: 13.5, margin: 0, color: 'var(--text-muted, #64748B)' }}>
              Day-by-day multivariate demand forecast for the selected raw material
            </p>
          </div>
          <div className="chart-legend" style={{ marginTop: 0, gap: 14, flexWrap: 'wrap', flexShrink: 0 }}>
            <span><span className="legend-dot" style={{ background: '#94A3B8' }} />Historical Actual Demand (56 Days)</span>
            <span><span className="legend-dot" style={{ background: '#0284C7', height: 4, width: 14, borderRadius: 2 }} />Daily Forecast Trajectory (84 Days)</span>
            <span><span className="legend-dot" style={{ background: '#BAE6FD', border: '1px dashed #38BDF8' }} />Planning Envelope (Z=1.65)</span>
            <span><span className="legend-dot" style={{ background: '#B7791F' }} />▲ Supplier Lead-Time Arrival (+{leadTimeDays}d)</span>
          </div>
        </div>

        {/* Dedicated Graph Container - unobstructed, prominent hero */}
        <div style={{ width: '100%', position: 'relative' }}>
          <DailyForecastChart
            dailyForecastSeries={dailyForecastSeries}
            baseDailyDemand={baseDailyDemand}
            trendPerWeek={trendPerWeek}
            demandCV={demandCV}
            leadTimeDays={leadTimeDays}
            uom={uom}
          />
        </div>

        {/* Persona-Specific Graph Trajectory Interpretation Strip */}
        {persona === 'ds' && (
          <div className="grid-4" style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid var(--line)' }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 2 }}>
                1. Daily Series Resolution
              </div>
              <div style={{ fontSize: 12.5, color: 'var(--ink)' }}>
                84 discrete daily forecast points across 12-week horizon ($t = 1 \dots 84$), anchored to <strong>{formatNum(baseDailyDemand, 2)} {uom}/d</strong> baseline.
              </div>
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 2 }}>
                2. Linear Daily Slope (β_d)
              </div>
              <div style={{ fontSize: 12.5, color: 'var(--ink)' }}>
                Daily slope is <strong>{trendPerDay > 0 ? '+' : ''}{formatNum(trendMagnitudeDailyPct, 4)}%/day</strong>. Day 1: {formatNum(day1Forecast, 2)} {uom}/d; Day 84: {formatNum(day84Forecast, 2)} {uom}/d ({formatNum(week12ProjectedMean, 1)} {uom}/wk).
              </div>
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 2 }}>
                3. Daily Band Expansion (Z·σ_d·√h)
              </div>
              <div style={{ fontSize: 12.5, color: 'var(--ink)' }}>
                Z = 1.65 planning factor expands: ±{formatNum(dailyForecastSeries[0].bandHalfWidth, 2)} {uom}/d at Day 1 to ±{formatNum(dailyForecastSeries[83].bandHalfWidth, 2)} {uom}/d at Day 84.
              </div>
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 2 }}>
                4. Lead-Time Window
              </div>
              <div style={{ fontSize: 12.5, color: 'var(--ink)' }}>
                Supplier replenishment latency sits at <strong>Day +{leadTimeDays} (+{leadTimeWeeks.toFixed(1)} wks)</strong>, covering {formatNum(leadTimeDemand, 1)} {uom} base demand.
              </div>
            </div>
          </div>
        )}

        {persona === 'analyst' && (
          <div className="grid-4" style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid var(--line)' }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 2 }}>
                1. Daily Consumption Trajectory
              </div>
              <div style={{ fontSize: 12.5, color: 'var(--ink)' }}>
                Day 1 starts at <strong>{formatNum(day1Forecast, 2)} {uom}/day</strong>, trending to <strong>{formatNum(day84Forecast, 2)} {uom}/day</strong> at Day 84 ({trendPerWeek >= 0.003 ? 'ramping demand' : trendPerWeek <= -0.003 ? 'declining demand' : 'steady pace'}).
              </div>
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 2 }}>
                2. 84-Day Horizon Total
              </div>
              <div style={{ fontSize: 12.5, color: 'var(--ink)' }}>
                Sum of all 84 daily forecasts: <strong>{formatNum(cumulativeHorizonDemand, 0)} {uom}</strong> (averaging {formatNum(avgDailyForecast, 2)} {uom}/day).
              </div>
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 2 }}>
                3. Lead-Time Arrival Marker
              </div>
              <div style={{ fontSize: 12.5, color: 'var(--ink)' }}>
                Order placed today arrives at <strong>Day +{leadTimeDays} (+{leadTimeWeeks.toFixed(1)} wks)</strong> from {meta.supplier.split('(')[0].trim()}.
              </div>
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 2 }}>
                4. Replenishment Status
              </div>
              <div style={{ fontSize: 12.5, color: 'var(--ink)' }}>
                {belowReorderPoint ? `On-hand stock is ${formatNum(ropGap, 1)} ${uom} below Planning ROP.` : `On-hand stock maintains a +${formatNum(ropBuffer, 1)} ${uom} protective buffer.`}
              </div>
            </div>
          </div>
        )}

        {persona === 'exec' && (
          <div className="grid-4" style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid var(--line)' }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 2 }}>
                1. Annual Spend Baseline
              </div>
              <div style={{ fontSize: 12.5, color: 'var(--ink)' }}>
                Annual consumption run-rate: <strong>{formatCurrency(annualConsumptionValue)}/yr</strong> ({formatNum(demand, 0)} {uom}/yr).
              </div>
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 2 }}>
                2. 12-Week Horizon Spend
              </div>
              <div style={{ fontSize: 12.5, color: 'var(--ink)' }}>
                Estimated 84-day demand value from daily series: <strong>{formatCurrency(cumulativeHorizonValue)}</strong> ({formatNum(cumulativeHorizonDemand, 0)} {uom}).
              </div>
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 2 }}>
                3. Working Capital Sunk
              </div>
              <div style={{ fontSize: 12.5, color: 'var(--ink)' }}>
                On-hand inventory holds <strong>{formatCurrency(onHandValue)}</strong> in active working capital.
              </div>
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 2 }}>
                4. Supply Vulnerability
              </div>
              <div style={{ fontSize: 12.5, color: 'var(--ink)' }}>
                {leadTimeDays}-day supplier replenishment window from <strong>{meta.supplier.split('(')[0].trim()}</strong>.
              </div>
            </div>
          </div>
        )}

        <div style={{ marginTop: 12, paddingTop: 10, borderTop: '1px solid var(--line)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
          <span style={{ fontSize: 12, color: 'var(--muted)', minWidth: 0, flex: '1 1 auto' }}>
            {persona === 'ds' ? (
              <>
                <strong>Analytical Scope Note:</strong> Model training: 104 weeks · Displayed history: 56 daily points (8 wks) · Forecast horizon: 84 discrete daily points (12 wks). The shaded envelope represents a planning buffer derived from a one-sided 95% service-level factor (Z = 1.65) and daily demand variance (CV = {(demandCV * 100).toFixed(1)}%) expanding over time (sigma_d * sqrt(t/7)), rather than a conventional two-sided 95% statistical confidence interval.
              </>
            ) : persona === 'analyst' ? (
              <>
                <strong>Operational Scope Note:</strong> Displayed history: 56 days (8 wks) · Forecast horizon: 84 daily forecast points (12 wks) · Supplier replenishment lead time: {leadTimeDays} days. The shaded band illustrates the protective planning buffer across the forward daily horizon.
              </>
            ) : (
              <>
                <strong>Executive Scope Note:</strong> Displayed history: 56 days · Forecast horizon: 84 days (12 wks) · Sourcing replenishment window: {leadTimeDays} days. The shaded envelope illustrates projected demand variability across the planning cycle.
              </>
            )}
          </span>
          <span style={{ fontSize: 11.5, color: '#0284C7', fontWeight: 600, flexShrink: 0 }}>
            Hover over chart to inspect any of the 84 individual calendar days
          </span>
        </div>

        {/* ================================================================ */}
        {/* 84-DAY DAILY FORECAST INSPECTION TABLE — EXPAND/COLLAPSE         */}
        {/* ================================================================ */}
        {showDailySchedule && (
          <div
            id="daily-schedule-table"
            role="region"
            aria-label="84-Day Daily Forecast Schedule"
            style={{
              marginTop: 16,
              paddingTop: 14,
              borderTop: '2px solid var(--accent, #0284C7)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, flexWrap: 'wrap', minWidth: 0 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)' }}>84-Day Forecast Schedule · Days 1 – 84</span>
              <span style={{ fontSize: 11.5, color: 'var(--muted)' }}>Source: <code style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 10.5 }}>dailyForecastSeries</code> · {dailyForecastSeries.length} daily points · Sep 9 – Dec 1, 2026</span>
              <span style={{ marginLeft: 'auto', fontSize: 11, color: '#0284C7', fontWeight: 600, flexWrap: 'wrap', minWidth: 0 }}>
                Day 1 = {formatNum(day1Forecast, 2)} {uom}/d · Avg = {formatNum(avgDailyForecast, 2)} {uom}/d · Day 84 = {formatNum(day84Forecast, 2)} {uom}/d · Total = {formatNum(cumulativeHorizonDemand, 0)} {uom}
              </span>
            </div>
            <div className="table-wrap" style={{ maxHeight: 340, overflowY: 'auto', overflowX: 'auto' }}>
              <table style={{ minWidth: 780 }}>
                <thead>
                  <tr>
                    <th style={{ whiteSpace: 'nowrap' }}>Day #</th>
                    <th style={{ whiteSpace: 'nowrap' }}>Day of Week</th>
                    <th style={{ whiteSpace: 'nowrap' }}>Calendar Date</th>
                    <th style={{ whiteSpace: 'nowrap' }}>Week #</th>
                    <th className="text-right" style={{ whiteSpace: 'nowrap' }}>Daily Forecast ({uom}/d)</th>
                    <th className="text-right" style={{ whiteSpace: 'nowrap' }}>Envelope Lower ({uom}/d)</th>
                    <th className="text-right" style={{ whiteSpace: 'nowrap' }}>Envelope Upper ({uom}/d)</th>
                    <th className="text-right" style={{ whiteSpace: 'nowrap' }}>Cumulative Total ({uom})</th>
                  </tr>
                </thead>
                <tbody>
                  {dailyForecastSeries.map((p) => (
                    <tr
                      key={p.day}
                      style={{
                        background:
                          p.day === 1
                            ? 'rgba(2,132,199,0.06)'
                            : p.day === leadTimeDays
                            ? '#FFFBEB'
                            : p.day === 84
                            ? 'rgba(3,105,161,0.06)'
                            : p.day % 7 === 0
                            ? 'rgba(0,0,0,0.02)'
                            : 'transparent',
                      }}
                    >
                      <td className="font-semibold" style={{ whiteSpace: 'nowrap' }}>
                        Day {p.day}
                        {p.day === 1 && <span style={{ marginLeft: 5, fontSize: 10, color: '#0284C7', fontWeight: 700 }}>◀ Next-Day</span>}
                        {p.day === leadTimeDays && p.day !== 1 && p.day !== 84 && <span style={{ marginLeft: 5, fontSize: 10, color: '#B7791F', fontWeight: 700 }}>▲ Order Arrival</span>}
                        {p.day === 84 && <span style={{ marginLeft: 5, fontSize: 10, color: '#0369A1', fontWeight: 700 }}>◀ Wk 12 End</span>}
                      </td>
                      <td style={{ whiteSpace: 'nowrap', color: 'var(--muted)', fontSize: 12 }}>{p.dayOfWeek}</td>
                      <td style={{ whiteSpace: 'nowrap' }}>{p.date}, 2026</td>
                      <td style={{ whiteSpace: 'nowrap' }}>Wk {p.weekNum}</td>
                      <td className="num text-right font-semibold" style={{ color: p.day === 1 ? '#0284C7' : p.day === 84 ? '#0369A1' : 'var(--ink)' }}>
                        {formatNum(p.dailyMean, 2)}
                      </td>
                      <td className="num text-right" style={{ color: 'var(--muted)', fontSize: 11.5 }}>
                        {formatNum(p.lowerBand, 2)}
                      </td>
                      <td className="num text-right" style={{ color: 'var(--muted)', fontSize: 11.5 }}>
                        {formatNum(p.upperBand, 2)}
                      </td>
                      <td className="num text-right" style={{ fontWeight: p.day % 7 === 0 || p.day === 84 ? 700 : 400 }}>
                        {formatNum(p.cumulativeDemand, 1)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr style={{ background: 'var(--bg)', borderTop: '2px solid var(--line)' }}>
                    <td colSpan={4} className="font-semibold" style={{ paddingTop: 8, fontSize: 12 }}>84-Day Totals (Verification)</td>
                    <td className="num text-right font-semibold" style={{ color: '#0284C7', fontSize: 12, paddingTop: 8 }}>
                      Avg: {formatNum(avgDailyForecast, 2)}
                    </td>
                    <td className="text-right" style={{ paddingTop: 8 }} />
                    <td className="text-right" style={{ paddingTop: 8 }} />
                    <td className="num text-right font-semibold" style={{ color: '#0284C7', fontSize: 12, paddingTop: 8 }}>
                      {formatNum(cumulativeHorizonDemand, 1)} {uom}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
            <p className="footnote" style={{ marginTop: 8 }}>
              Planning Envelope (Z = 1.65): Lower = max(0, d(t) − Z·σ_d·√(t/7)) · Upper = d(t) + Z·σ_d·√(t/7). All 84 daily values reconcile with the 4 primary KPIs above.
            </p>
          </div>
        )}
      </div>

      {/* ==================================================================== */}
      {/* D. PERSONA-SPECIFIC SUMMARY KPIS & DIAGNOSTIC INTELLIGENCE          */}
      {/* ==================================================================== */}
      {persona === 'ds' && (
        <div className="grid-3" style={{ marginBottom: 14 }}>
          <KpiTile
            label="1. Baseline Demand (d_0 · W_0) [Observed / Derived]"
            value={`${formatNum(baseDailyDemand, 2)} ${uom}/d`}
            delta={`${formatNum(avgWeekly, 1)} ${uom}/wk baseline`}
            deltaTone="flat"
            sub={`104-week training baseline from catalog demand (${formatNum(demand, 0)} ${uom}/yr)`}
          />
          <KpiTile
            label="2. Modeled Slope (β_d · β_w) [Model Output]"
            value={`${trendPerDay > 0 ? '+' : ''}${formatNum(trendMagnitudeDailyPct, 4)}%/day`}
            valueStyle={{ color: Math.abs(trendPerWeek) >= 0.003 ? 'var(--accent)' : 'var(--text)' }}
            delta={`${trendPerWeek > 0 ? '+' : ''}${formatNum(trendMagnitudePct, 2)}%/wk slope`}
            deltaTone={trendPerWeek >= 0.003 ? 'up' : trendPerWeek <= -0.003 ? 'down' : 'flat'}
            sub={`Linear daily slope: trendPerDay = ${trendPerDay >= 0 ? '+' : ''}${formatNum(trendPerDay, 5)} across 84-day horizon`}
          />
          <KpiTile
            label="3. 12-Week Forecast Total (84 Days) [Time Series]"
            value={`${formatNum(cumulativeHorizonDemand, 1)} ${uom}`}
            delta={`Next-Day: ${formatNum(day1Forecast, 2)} ${uom}/d · Wk 12: ${formatNum(week12ForecastDaily, 2)} ${uom}/d`}
            deltaTone={trendPerWeek > 0 ? 'up' : 'flat'}
            sub={`Sum of 84 daily points · Avg daily: ${formatNum(avgDailyForecast, 2)} ${uom}/d (${formatNum(week12ProjectedMean, 1)} ${uom}/wk endpoint)`}
          />
          <KpiTile
            label="4. Model Fit (R²) [In-Sample Diagnostic]"
            value={`R² = ${formatNum(modelR2, 2)}`}
            valueStyle={{ color: modelR2 >= 0.90 ? 'var(--success)' : modelR2 >= 0.80 ? 'var(--accent)' : 'var(--watch)' }}
            delta={`${(modelR2 * 100).toFixed(1)}% variance explained`}
            deltaTone={modelR2 >= 0.85 ? 'up' : 'flat'}
            sub="In-sample fit diagnostic across 104 trailing weeks (not out-of-sample accuracy)"
          />
          <KpiTile
            label="5. Residual Error (RMSE) [Model Diagnostic]"
            value={`${formatNum(rmse, 2)} ${uom}/wk`}
            valueStyle={{ color: rmseRatio <= 0.12 ? 'var(--success)' : 'var(--watch)' }}
            delta={`${formatNum(rmseRatio * 100, 1)}% of weekly mean`}
            deltaTone={rmseRatio <= 0.12 ? 'up' : 'down'}
            sub={`Model residual error magnitude relative to ${formatNum(avgWeekly, 1)} ${uom}/wk baseline`}
          />
          <KpiTile
            label="6. Demand Dispersion (CV) [Derived Metric]"
            value={`CV ${(demandCV * 100).toFixed(1)}%`}
            valueStyle={{ color: demandCV <= 0.15 ? 'var(--success)' : 'var(--watch)' }}
            delta={`Std Dev: ±${formatNum(sigmaDaily, 2)} ${uom}/d (±${formatNum(sigmaWeekly, 1)}/wk)`}
            deltaTone={demandCV <= 0.15 ? 'up' : 'down'}
            sub={`Historical coefficient of variation driving Z=1.65 planning band expansion`}
          />
        </div>
      )}

      {persona === 'analyst' && (
        <div className="grid-3" style={{ marginBottom: 14 }}>
          <KpiTile
            label="1. Baseline Daily Demand [Operational Run-Rate]"
            value={`${formatNum(baseDailyDemand, 2)} ${uom}/day`}
            delta={`${formatNum(avgWeekly, 1)} ${uom}/wk`}
            deltaTone="flat"
            sub={`Baseline production withdrawal rate across ${meta.downstream.split('(')[0].trim()}`}
          />
          <KpiTile
            label="2. 84-Day Forecast Total [Daily Time Series]"
            value={`${formatNum(cumulativeHorizonDemand, 0)} ${uom}`}
            valueStyle={{ color: 'var(--ink)' }}
            delta={`Next-Day: ${formatNum(day1Forecast, 2)} ${uom}/d · Avg: ${formatNum(avgDailyForecast, 2)} ${uom}/d`}
            deltaTone={trendPerWeek >= 0.003 ? 'up' : trendPerWeek <= -0.003 ? 'down' : 'flat'}
            sub={`Sum of 84 daily points · Day 84: ${formatNum(day84Forecast, 2)} ${uom}/d (${trendPerWeek > 0 ? '+' : ''}${formatNum(trendMagnitudePct, 2)}%/wk)`}
          />
          <KpiTile
            label="3. On-Hand Coverage (Days of Supply)"
            value={`${formatNum(daysOfSupply, 1)} Days`}
            valueStyle={{ color: belowReorderPoint ? 'var(--risk)' : 'var(--success)' }}
            delta={
              daysOfSupply < leadTimeDays
                ? `LEAN: ${formatNum(leadTimeDays - daysOfSupply, 1)}d below lead time`
                : `Covered: +${formatNum(daysOfSupply - leadTimeDays, 1)}d buffer`
            }
            deltaTone={daysOfSupply < leadTimeDays ? 'down' : 'up'}
            sub={`Supplier lead time from ${meta.supplier.split('(')[0].trim()} is ${leadTimeDays} days`}
          />
          <KpiTile
            label="4. Expected Lead-Time Demand"
            value={`${formatNum(leadTimeDemand, 1)} ${uom}`}
            delta={`${leadTimeDays} days of consumption`}
            deltaTone="flat"
            sub={`Required baseline volume to support operations during ${leadTimeDays}-day replenishment cycle`}
          />
          <KpiTile
            label="5. Planning Reorder Point (ROP)"
            value={`${formatNum(reorderPoint, 1)} ${uom}`}
            delta={`Includes ${formatNum(safetyStock, 1)} ${uom} safety stock`}
            deltaTone="flat"
            sub={`Trigger threshold: ${formatNum(leadTimeDemand, 1)} ${uom} LT demand + ${formatNum(safetyStock, 1)} ${uom} safety buffer`}
          />
          <KpiTile
            label="6. Replenishment Action Status"
            value={belowReorderPoint ? 'Replenishment Trigger Active' : 'Coverage Protected'}
            valueStyle={{ color: belowReorderPoint ? 'var(--risk)' : 'var(--success)' }}
            delta={
              belowReorderPoint
                ? `Coverage Gap: -${formatNum(ropGap, 1)} ${uom}`
                : `Protective Buffer: +${formatNum(ropBuffer, 1)} ${uom}`
            }
            deltaTone={belowReorderPoint ? 'down' : 'up'}
            sub={
              belowReorderPoint
                ? `On-hand stock (${formatNum(onHandQty, 0)} ${uom}) is below Planning ROP (${formatNum(reorderPoint, 1)} ${uom})`
                : `On-hand stock (${formatNum(onHandQty, 0)} ${uom}) exceeds Planning ROP (${formatNum(reorderPoint, 1)} ${uom})`
            }
          />
        </div>
      )}

      {persona === 'exec' && (
        <div className="grid-3" style={{ marginBottom: 14 }}>
          <KpiTile
            label="1. Annual Consumption Run-Rate [Spend]"
            value={formatCurrency(annualConsumptionValue)}
            delta={`${formatNum(demand, 0)} ${uom}/yr`}
            deltaTone="flat"
            sub={`Physical unit cost: ${formatCurrency(unitCost)}/${uom} · Class ${abcClass} Material`}
          />
          <KpiTile
            label="2. Physical Inventory Carrying Capital"
            value={formatCurrency(onHandValue)}
            delta={`${formatNum(onHandQty, 0)} ${uom} on-hand`}
            deltaTone="flat"
            sub={`Currently turning at ${formatNum(annualTurns, 2)} turns/year`}
          />
          <KpiTile
            label="3. 12-Week Horizon Spend (84 Days) [Demand Outlook]"
            value={formatCurrency(cumulativeHorizonValue)}
            valueStyle={{ color: 'var(--ink)' }}
            delta={`${formatNum(cumulativeHorizonDemand, 0)} ${uom} total across 84 days`}
            deltaTone={trendPerWeek >= 0.003 ? 'up' : trendPerWeek <= -0.003 ? 'down' : 'flat'}
            sub={`Next-Day: ${formatNum(day1Forecast, 2)} ${uom}/d · Avg: ${formatNum(avgDailyForecast, 2)} ${uom}/d (${trendPerWeek >= 0.003 ? 'Expansion' : trendPerWeek <= -0.003 ? 'Contraction' : 'Stable'})`}
          />
          <KpiTile
            label="4. Inventory Coverage Duration"
            value={`${formatNum(daysOfSupply, 1)} Days`}
            valueStyle={{ color: belowReorderPoint ? 'var(--risk)' : 'var(--success)' }}
            delta={
              daysOfSupply < leadTimeDays
                ? `Exposure: ${formatNum(leadTimeDays - daysOfSupply, 1)}d below lead time`
                : `Protected: +${formatNum(daysOfSupply - leadTimeDays, 1)}d beyond lead time`
            }
            deltaTone={daysOfSupply < leadTimeDays ? 'down' : 'up'}
            sub={`Supplier replenishment lead time: ${leadTimeDays} days`}
          />
          <KpiTile
            label="5. Protective Safety Buffer Capital"
            value={formatCurrency(safetyStockValue)}
            delta={`${formatNum(safetyStock, 1)} ${uom} planning buffer`}
            deltaTone="flat"
            sub="Working capital allocated to protect against demand and lead-time variability"
          />
          <KpiTile
            label="6. Executive Supply Signal"
            value={belowReorderPoint ? 'Replenishment Action Indicated' : 'Supply Continuity Stable'}
            valueStyle={{ color: belowReorderPoint ? 'var(--risk)' : 'var(--success)' }}
            delta={
              belowReorderPoint
                ? `Exposure: -${formatCurrency(ropGap * unitCost)} gap`
                : `Buffer: +${formatCurrency(ropBuffer * unitCost)} above ROP`
            }
            deltaTone={belowReorderPoint ? 'down' : 'up'}
            sub={
              belowReorderPoint
                ? `Supply exposure identified across ${meta.downstream.split('(')[0].trim()}`
                : `Operating inventory provides adequate buffer across ${meta.downstream.split('(')[0].trim()}`
            }
          />
        </div>
      )}

      {/* ==================================================================== */}
      {/* E. DATA SCIENTIST ONLY: MODEL DIAGNOSTICS & STATISTICAL UNCERTAINTY  */}
      {/* ==================================================================== */}
      {persona === 'ds' && (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, minWidth: 0 }}>
            {/* Forecast Trajectory & Demand Movement */}
            <div className="card" style={{ minWidth: 0 }}>
              <div className="card__head" style={{ marginBottom: 10 }}>
                <div>
                  <Badge tone={Math.abs(trendPerWeek) >= 0.003 ? 'accent' : 'neutral'}>Trajectory Intelligence</Badge>
                  <h2 className="card__title" style={{ marginTop: 8 }}>
                    Forecast Trajectory & Demand Movement
                  </h2>
                  <p className="card__sub">
                    Modeled demand progression across the 12-week forward planning horizon
                  </p>
                </div>
              </div>

              <div className="table-wrap">
                <table>
                  <tbody>
                    <tr>
                      <td>Baseline Daily Demand (d_0)</td>
                      <td className="num text-right font-semibold">{formatNum(baseDailyDemand, 2)} {uom}/day</td>
                    </tr>
                    <tr>
                      <td>Baseline Weekly Demand (W_0)</td>
                      <td className="num text-right">{formatNum(avgWeekly, 1)} {uom}/wk</td>
                    </tr>
                    <tr>
                      <td>Estimated Linear Daily Slope (beta_d)</td>
                      <td className="num text-right font-semibold">
                        {trendPerDay > 0 ? '+' : ''}{formatNum(trendMagnitudeDailyPct, 4)}%/day ({trendPerWeek > 0 ? '+' : ''}{formatNum(trendMagnitudePct, 2)}%/wk)
                      </td>
                    </tr>
                    <tr>
                      <td>Trend Classification</td>
                      <td className="num text-right">
                        {trendPerWeek >= 0.003
                          ? 'Ramping Demand Signal'
                          : trendPerWeek <= -0.003
                          ? 'Declining Demand Signal'
                          : 'Steady-State Consumption'}
                      </td>
                    </tr>
                    <tr>
                      <td>Next-Day Expected Demand (Day 1)</td>
                      <td className="num text-right font-semibold">{formatNum(day1Forecast, 2)} {uom}/day</td>
                    </tr>
                    <tr>
                      <td>Mid-Horizon Expected Demand (Day 42 / Wk 6)</td>
                      <td className="num text-right">{formatNum(dailyForecastSeries[41].dailyMean, 2)} {uom}/day ({formatNum(dailyForecastSeries[41].dailyMean * 7, 1)} {uom}/wk)</td>
                    </tr>
                    <tr>
                      <td>Horizon Endpoint Demand (Day 84 / Wk 12)</td>
                      <td className="num text-right font-semibold">{formatNum(day84Forecast, 2)} {uom}/day ({formatNum(week12ProjectedMean, 1)} {uom}/wk)</td>
                    </tr>
                    <tr>
                      <td>Average Daily Forecast across 84 Days</td>
                      <td className="num text-right font-semibold">{formatNum(avgDailyForecast, 2)} {uom}/day</td>
                    </tr>
                    <tr>
                      <td>Cumulative 84-Day Forecast Sum</td>
                      <td className="num text-right font-semibold">{formatNum(cumulativeHorizonDemand, 1)} {uom} ({formatCurrency(cumulativeHorizonValue)})</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <p className="footnote" style={{ marginTop: 10 }}>
                <strong>Trend Modeling Note:</strong> Trend is evaluated as a pure linear daily slope (trendPerDay = {trendPerDay >= 0 ? '+' : ''}{formatNum(trendPerDay, 5)}/day, trendPerWeek = {trendPerWeek >= 0 ? '+' : ''}{formatNum(trendPerWeek, 4)}/wk), representing an estimated average linear slope across historical observations rather than an exponential or compounding process. Day 84 rate ({formatNum(day84Forecast, 2)} {uom}/d × 7 = {formatNum(week12ProjectedMean, 1)} {uom}/wk) exactly reconciles with the Week-12 endpoint.
              </p>
            </div>

            {/* Forecast Reliability & Model Diagnostics */}
            <div className="card" style={{ minWidth: 0 }}>
              <div className="card__head" style={{ marginBottom: 10 }}>
                <div>
                  <Badge tone="accent">Model Diagnostics</Badge>
                  <h2 className="card__title" style={{ marginTop: 8 }}>
                    Forecast Reliability & Diagnostic Fit
                  </h2>
                  <p className="card__sub">
                    Specification parameters and goodness-of-fit metrics from historical model training
                  </p>
                </div>
              </div>

              <div className="table-wrap">
                <table>
                  <tbody>
                    <tr>
                      <td>Model Architecture</td>
                      <td className="num text-right font-semibold">Ridge Regression (alpha = 1.0)</td>
                    </tr>
                    <tr>
                      <td>Autoregressive Feature Set</td>
                      <td className="num text-right">Lag-1, Lag-7, Lag-30 Demand History</td>
                    </tr>
                    <tr>
                      <td>Feature Normalization</td>
                      <td className="num text-right">Standard Normal Variate (SNV)</td>
                    </tr>
                    <tr>
                      <td>Training History Window</td>
                      <td className="num text-right">104 Weeks (2 Years Trailing)</td>
                    </tr>
                    <tr>
                      <td>Model Fit (R²)</td>
                      <td className="num text-right font-semibold" style={{ color: modelR2 >= 0.90 ? 'var(--success)' : 'var(--accent)' }}>
                        {formatNum(modelR2, 2)} ({(modelR2 * 100).toFixed(1)}% variance explained)
                      </td>
                    </tr>
                    <tr>
                      <td>Model Residual Error (RMSE)</td>
                      <td className="num text-right font-semibold">
                        {formatNum(rmse, 2)} {uom}/wk ({(rmseRatio * 100).toFixed(1)}% of mean)
                      </td>
                    </tr>
                    <tr>
                      <td>Historical Demand CV</td>
                      <td className="num text-right">{(demandCV * 100).toFixed(1)}% (Std Dev: ±{formatNum(sigmaWeekly, 1)} {uom}/wk)</td>
                    </tr>
                    <tr>
                      <td>Demand Standard Deviation (σ)</td>
                      <td className="num text-right font-semibold">Daily σ_d = ±{formatNum(sigmaDaily, 2)} {uom}/day</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <p className="footnote" style={{ marginTop: 10 }}>
                <strong>Technical Definitions & Methodology:</strong> R² = {formatNum(modelR2, 2)} is an in-sample model fit diagnostic measuring historical variance explained across the 104-week training window (not future forecast accuracy). RMSE = {formatNum(rmse, 2)} {uom}/wk measures in-sample residual error magnitude. CV = {(demandCV * 100).toFixed(1)}% measures demand variability relative to average demand. Standard deviation (σ_d = ±{formatNum(sigmaDaily, 2)} {uom}/day) is the demand variability measure used in planning calculations.
              </p>
            </div>
          </div>

          {/* Full Statistical Uncertainty Analysis Table */}
          <div className="card">
            <div className="card__head">
              <div>
                <h2 className="card__title">Forecast Uncertainty & Risk Exposure Analysis</h2>
                <p className="card__sub">
                  Evaluates how demand volatility, supplier lead time, and model residual error contribute to planning uncertainty
                </p>
              </div>
              <Badge tone="neutral">Uncertainty Dimensions</Badge>
            </div>

            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Uncertainty Driver</th>
                    <th>Observed Metric</th>
                    <th>Planning Interpretation</th>
                    <th>Inventory Buffer Implication</th>
                    <th className="text-right">Provenance</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ fontWeight: 600 }}>Demand Volatility (CV)</td>
                    <td className="num font-semibold">{(demandCV * 100).toFixed(1)}% CV</td>
                    <td>
                      Demand variability relative to average demand (CV = σ / μ). {demandCV <= 0.15 ? 'Low volatility indicates stable, predictable consumption velocity.' : 'Elevated demand dispersion increases variation in weekly requirements.'}
                    </td>
                    <td>Establishes relative variance scaling factor across forward horizon</td>
                    <td className="text-right"><span className="badge badge-accent">Derived Metric</span></td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 600 }}>Demand Standard Deviation (σ)</td>
                    <td className="num font-semibold">±{formatNum(sigmaDaily, 2)} {uom}/day</td>
                    <td>
                      Demand variability measure used in planning calculations (daily σ_d = avgDaily × CV; weekly σ_w = ±{formatNum(sigmaWeekly, 1)} {uom}/wk).
                    </td>
                    <td>Direct dispersion input into safety stock formula: SS = Z × σ_d × √L</td>
                    <td className="text-right"><span className="badge badge-accent">Derived Metric</span></td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 600 }}>Supplier Lead Time (L)</td>
                    <td className="num font-semibold">{leadTimeDays} Days ({leadTimeWeeks.toFixed(1)} wks)</td>
                    <td>
                      Supplier replenishment duration from {meta.supplier.split('(')[0].trim()} used in planning; longer lead time extends exposure window before order arrival.
                    </td>
                    <td>Lead-time demand requires {formatNum(leadTimeDemand, 1)} {uom} base coverage; scales safety buffer by √L</td>
                    <td className="text-right"><span className="badge badge-neutral">Source Data</span></td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 600 }}>Planning Service Factor (Z)</td>
                    <td className="num font-semibold">Z = 1.65 (95% target)</td>
                    <td>
                      One-sided 95% service-level planning factor under standard normal distribution assumption; not a two-sided confidence interval.
                    </td>
                    <td>Sets planning safety buffer to {formatNum(safetyStock, 1)} {uom} ({formatCurrency(safetyStockValue)})</td>
                    <td className="text-right"><span className="badge badge-watch">Planning Assumption</span></td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 600 }}>Model Residual Error (RMSE)</td>
                    <td className="num font-semibold">{formatNum(rmse, 2)} {uom}/wk</td>
                    <td>
                      In-sample root mean squared error representing model residual error magnitude relative to fitted baseline (not future forecast error).
                    </td>
                    <td>Reflects {(rmseRatio * 100).toFixed(1)}% residual dispersion relative to weekly mean</td>
                    <td className="text-right"><span className="badge badge-accent">Model Diagnostic</span></td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 600 }}>Modeled Linear Trend (β)</td>
                    <td className="num font-semibold">{trendPerDay > 0 ? '+' : ''}{formatNum(trendMagnitudeDailyPct, 4)}%/day ({trendPerWeek > 0 ? '+' : ''}{formatNum(trendMagnitudePct, 2)}%/wk)</td>
                    <td>
                      Linear daily demand slope (β_d = {trendPerDay >= 0 ? '+' : ''}{formatNum(trendPerDay, 5)}/day, β_w = {trendPerWeek >= 0 ? '+' : ''}{formatNum(trendPerWeek, 4)}/wk); represents estimated average linear slope across historical observations, not compounding growth.
                    </td>
                    <td>Projects 84-day daily trajectory reaching Day 84 ({formatNum(day84Forecast, 2)} {uom}/d · {formatNum(week12ProjectedMean, 1)} {uom}/wk at W12) without recalculating base ROP</td>
                    <td className="text-right"><span className="badge badge-accent">Model Trajectory</span></td>
                  </tr>
                </tbody>
              </table>
            </div>

            <p className="footnote" style={{ marginTop: 10 }}>
              <strong>Analytical Principle:</strong> Higher demand variability widens planning uncertainty and requires larger safety stock buffers to maintain target service factors. Forecast uncertainty should always be evaluated alongside supplier delivery performance, lead times, and available days of supply.
            </p>
          </div>
        </>
      )}

      {/* ==================================================================== */}
      {/* F. ANALYST ONLY: OPERATIONAL REPLENISHMENT CHAIN & ACTION CENTER     */}
      {/* ==================================================================== */}
      {persona === 'analyst' && (
        <>
          <div className="card">
            <div className="card__head">
              <div>
                <h2 className="card__title">Operational Replenishment & Inventory Coverage Chain</h2>
                <p className="card__sub">
                  Translates baseline demand consumption and supplier lead time into planning replenishment requirements, contextualized by the forward forecast trajectory for <strong>{selectedMaterial.id}</strong>.
                </p>
              </div>
              <Badge tone={belowReorderPoint ? 'risk' : 'success'}>
                {belowReorderPoint ? 'Replenishment Trigger Active' : 'Inventory Position Stable'}
              </Badge>
            </div>

            {/* 5-Step Operational Analytical Chain */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 14 }}>
              {/* Step 1 */}
              <div style={{ padding: '12px 14px', background: 'var(--bg)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--line)' }}>
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 4 }}>
                  1. Current Inventory
                </div>
                <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink)', marginBottom: 2 }}>
                  {formatNum(onHandQty, 0)} {uom}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text)' }}>
                  {formatCurrency(onHandValue)}
                </div>
                <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>
                  {formatNum(daysOfSupply, 1)} days of supply
                </div>
              </div>

              {/* Step 2 */}
              <div style={{ padding: '12px 14px', background: 'var(--bg)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--line)' }}>
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 4 }}>
                  2. Baseline Consumption
                </div>
                <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink)', marginBottom: 2 }}>
                  {formatNum(avgDaily, 2)} {uom}/day
                </div>
                <div style={{ fontSize: 12, color: 'var(--text)' }}>
                  {formatNum(avgWeekly, 1)} {uom}/wk
                </div>
                <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>
                  CV = {(demandCV * 100).toFixed(1)}% volatility
                </div>
              </div>

              {/* Step 3 */}
              <div style={{ padding: '12px 14px', background: 'var(--bg)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--line)' }}>
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 4 }}>
                  3. Lead-Time Demand
                </div>
                <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink)', marginBottom: 2 }}>
                  {formatNum(leadTimeDemand, 1)} {uom}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text)' }}>
                  Across {leadTimeDays}d lead time
                </div>
                <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>
                  {formatNum(avgDaily, 2)} {uom}/d × {leadTimeDays}d
                </div>
              </div>

              {/* Step 4 */}
              <div style={{ padding: '12px 14px', background: 'var(--bg)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--line)' }}>
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 4 }}>
                  4. Planning Safety Stock
                </div>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#0C7EBE', marginBottom: 2 }}>
                  {formatNum(safetyStock, 1)} {uom}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text)' }}>
                  {formatCurrency(safetyStockValue)} value
                </div>
                <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>
                  Z=1.65 × σ_d × √LeadTime
                </div>
              </div>

              {/* Step 5 */}
              <div style={{ padding: '12px 14px', background: belowReorderPoint ? 'var(--risk-bg)' : 'var(--success-bg)', borderRadius: 'var(--radius-sm)', border: `1px solid ${belowReorderPoint ? 'var(--risk)' : 'var(--success)'}` }}>
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: belowReorderPoint ? 'var(--risk)' : 'var(--success)', marginBottom: 4 }}>
                  5. Planning Reorder Point
                </div>
                <div style={{ fontSize: 16, fontWeight: 700, color: belowReorderPoint ? 'var(--risk)' : 'var(--success)', marginBottom: 2 }}>
                  {formatNum(reorderPoint, 1)} {uom}
                </div>
                <div style={{ fontSize: 12, color: 'var(--ink)', fontWeight: 600 }}>
                  {belowReorderPoint ? `Exposure Gap: -${formatNum(ropGap, 1)} ${uom}` : `Buffer: +${formatNum(ropBuffer, 1)} ${uom}`}
                </div>
                <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>
                  Lead Demand + Safety Stock
                </div>
              </div>
            </div>

            {/* Detailed Operational Banner */}
            <div
              style={{
                padding: '12px 16px',
                background: belowReorderPoint ? 'var(--risk-bg)' : 'var(--success-bg)',
                borderRadius: 'var(--radius-sm)',
                border: `1px solid ${belowReorderPoint ? 'var(--risk)' : 'var(--success)'}`,
                fontSize: 12.5,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                <strong style={{ color: 'var(--ink)', fontSize: 13 }}>
                  {belowReorderPoint ? 'Planning Replenishment Trigger:' : 'Coverage Evaluation:'}
                </strong>
                <span style={{ color: 'var(--text)' }}>
                  {belowReorderPoint
                    ? `Current on-hand stock of ${formatNum(onHandQty, 0)} ${uom} (${formatNum(daysOfSupply, 1)} days of supply) sits ${formatNum(ropGap, 1)} ${uom} (${formatCurrency(ropGap * unitCost)}) below the Planning Reorder Point (${formatNum(reorderPoint, 1)} ${uom}) relative to the ${leadTimeDays}-day supplier lead time.`
                    : `Current on-hand stock of ${formatNum(onHandQty, 0)} ${uom} (${formatNum(daysOfSupply, 1)} days of supply) buffers the ${leadTimeDays}-day supplier lead time, exceeding Planning Reorder Point (${formatNum(reorderPoint, 1)} ${uom}) by +${formatNum(ropBuffer, 1)} ${uom} (+${formatCurrency(ropBuffer * unitCost)}).`}
                </span>
              </div>
              <div style={{ color: 'var(--text)' }}>
                <strong>Operational Implication:</strong> {belowReorderPoint
                  ? `Being below the Planning Reorder Point indicates a replenishment trigger during the ${leadTimeDays}-day lead-time window. Evaluate replenishment to close the planning coverage gap; final purchase order quantity should be determined in EOQ and Optimization considering lot sizing, supplier MOQs, open supply, and downstream scheduling constraints.`
                  : `Current inventory is above the Planning Reorder Point, indicating no immediate replenishment trigger under current operating assumptions. Continue monitoring baseline consumption velocity and forward forecast signals.`}
              </div>
            </div>
          </div>

          {/* Operational Forecast & Statistical Parameters Card */}
          <div className="card">
            <div className="card__head">
              <div>
                <h2 className="card__title">Operational Forecast & Statistical Planning Parameters</h2>
                <p className="card__sub">
                  Core statistical metrics translated into operational supply chain meaning and replenishment implications for <strong>{selectedMaterial.id}</strong>.
                </p>
              </div>
              <Badge tone="accent">Operational Intelligence</Badge>
            </div>

            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Planning Metric</th>
                    <th>Current Value</th>
                    <th>What It Means (Operational Meaning)</th>
                    <th>Operational Implication</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="font-semibold">Model Explanatory Fit (R²)</td>
                    <td className="num font-semibold">R² = {formatNum(modelR2, 2)}</td>
                    <td>
                      Higher R² indicates better in-sample fit across historical demand, but does <strong>not</strong> guarantee future forecast accuracy.
                    </td>
                    <td>
                      Supports baseline demand trajectory; unexpected demand shifts and supplier disruptions still require active operational monitoring.
                    </td>
                  </tr>
                  <tr>
                    <td className="font-semibold">Model Residual Error (RMSE)</td>
                    <td className="num font-semibold">{formatNum(rmse, 2)} {uom}/wk</td>
                    <td>
                      Average historical model residual error magnitude ({(rmseRatio * 100).toFixed(1)}% of weekly baseline); not future forecast error.
                    </td>
                    <td>
                      Higher RMSE indicates larger historical model residuals; forecast should be interpreted with more caution and protected by safety stock.
                    </td>
                  </tr>
                  <tr>
                    <td className="font-semibold">Demand Volatility (CV)</td>
                    <td className="num font-semibold">CV = {(demandCV * 100).toFixed(1)}%</td>
                    <td>
                      Demand variability relative to average consumption rate ({demandCV <= 0.15 ? 'stable demand flow' : 'elevated demand dispersion'}).
                    </td>
                    <td>
                      Higher CV means demand is more variable, creating greater planning uncertainty and driving higher protective buffer requirements.
                    </td>
                  </tr>
                  <tr>
                    <td className="font-semibold">Daily Standard Deviation (σ_d)</td>
                    <td className="num font-semibold">±{formatNum(sigmaDaily, 2)} {uom}/day</td>
                    <td>
                      Daily demand dispersion around baseline consumption (±{formatNum(sigmaWeekly, 1)} {uom}/wk).
                    </td>
                    <td>
                      Statistical measure used in planning calculations; directly sizes the safety-stock component required to buffer lead-time variation.
                    </td>
                  </tr>
                  <tr>
                    <td className="font-semibold">Planning Service Factor (Z)</td>
                    <td className="num font-semibold">Z = 1.65 (95% service target)</td>
                    <td>
                      One-sided planning factor used to size the safety-stock component; not a two-sided confidence interval.
                    </td>
                    <td>
                      Sets planning safety stock at {formatNum(safetyStock, 1)} {uom} ({formatCurrency(safetyStockValue)}) to buffer demand variations before replenishment arrives.
                    </td>
                  </tr>
                  <tr>
                    <td className="font-semibold">Supplier Lead Time (L)</td>
                    <td className="num font-semibold">{leadTimeDays} Days ({leadTimeWeeks.toFixed(1)} wks)</td>
                    <td>
                      Supplier replenishment duration from {meta.supplier.split('(')[0].trim()} used in planning calculations.
                    </td>
                    <td>
                      Longer lead time creates greater demand exposure ({formatNum(leadTimeDemand, 1)} {uom}) before replenishment arrives, requiring earlier replenishment triggers.
                    </td>
                  </tr>
                  <tr>
                    <td className="font-semibold">Demand Trend Direction (β)</td>
                    <td className="num font-semibold">{trendPerWeek > 0 ? '+' : ''}{formatNum(trendMagnitudePct, 2)}%/wk</td>
                    <td>
                      Estimated linear weekly slope of demand; not compounding growth.
                    </td>
                    <td>
                      {trendPerWeek >= 0.003
                        ? 'Positive trend indicates expected demand direction is increasing; evaluate higher forward replenishment requirements in Optimization.'
                        : trendPerWeek <= -0.003
                        ? 'Negative trend indicates expected demand direction is declining; avoid over-ordering to prevent excess inventory buildup.'
                        : 'Steady trend indicates stable demand flow; maintain standard replenishment review cadence.'}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <p className="footnote" style={{ marginTop: 10 }}>
              <strong>Analyst Guidance:</strong> Statistical metrics establish baseline planning parameters, but operational execution requires balancing supplier lot sizes, minimum order quantities (MOQs), open orders, and downstream production schedules in Optimization Plan.
            </p>
          </div>

          {/* Operational Action Center Card */}
          <div className="card">
            <div className="card__head">
              <div>
                <h2 className="card__title">Operational Action Center & Scenario Roadmap</h2>
                <p className="card__sub">
                  Recommended supply chain analyst actions and scenario priorities for {selectedMaterial.id}
                </p>
              </div>
              <Badge tone="neutral">Operational Guidance</Badge>
            </div>

            <div className="grid-3" style={{ marginBottom: 0 }}>
              <div style={{ padding: '12px 14px', background: 'var(--bg)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--line)' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink)', marginBottom: 4 }}>
                  1. Replenishment Action
                </div>
                <p style={{ fontSize: 12, color: 'var(--muted)', margin: 0 }}>
                  {belowReorderPoint
                    ? `Review open purchase orders from ${meta.supplier.split('(')[0].trim()} and evaluate replenishment to address the planning coverage gap in Optimization Plan; final order quantity should consider EOQ lot sizing, supplier MOQs, open supply, and downstream demand.`
                    : `Current stock of ${formatNum(onHandQty, 0)} ${uom} is healthy. Maintain standard review cadence; no immediate PO required.`}
                </p>
              </div>
              <div style={{ padding: '12px 14px', background: 'var(--bg)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--line)' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink)', marginBottom: 4 }}>
                  2. Lead-Time Vulnerability
                </div>
                <p style={{ fontSize: 12, color: 'var(--muted)', margin: 0 }}>
                  Supplier lead time is {leadTimeDays} days. Higher demand variability (CV {(demandCV * 100).toFixed(1)}%) requires holding {formatNum(safetyStock, 1)} {uom} in safety stock.
                </p>
              </div>
              <div style={{ padding: '12px 14px', background: 'var(--bg)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--line)' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink)', marginBottom: 4 }}>
                  3. What-If Stress Testing
                </div>
                <p style={{ fontSize: 12, color: 'var(--muted)', margin: 0 }}>
                  Transition to What-If Simulation to stress-test how a +20% demand surge or +15d supplier latency affects stockout exposure.
                </p>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ==================================================================== */}
      {/* G. C-SUITE ONLY: FINANCIAL IMPACT & SUPPLY CONTINUITY MATRIX         */}
      {/* ==================================================================== */}
      {persona === 'exec' && (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, minWidth: 0 }}>
            {/* Working Capital Valuation Card */}
            <div className="card" style={{ minWidth: 0 }}>
              <div className="card__head" style={{ marginBottom: 10 }}>
                <div>
                  <Badge tone="accent">Financial Valuation</Badge>
                  <h2 className="card__title" style={{ marginTop: 8 }}>
                    Working Capital & Inventory Valuation
                  </h2>
                  <p className="card__sub">
                    Capital allocation and carrying cost structure for {selectedMaterial.id}
                  </p>
                </div>
              </div>

              <div className="table-wrap">
                <table>
                  <tbody>
                    <tr>
                      <td>Annual Catalog Consumption Value</td>
                      <td className="num text-right font-semibold">{formatCurrency(annualConsumptionValue)}/yr</td>
                    </tr>
                    <tr>
                      <td>Current Physical Carrying Capital</td>
                      <td className="num text-right font-semibold">{formatCurrency(onHandValue)}</td>
                    </tr>
                    <tr>
                      <td>Capital Allocated to Planning Safety Stock</td>
                      <td className="num text-right">{formatCurrency(safetyStockValue)} ({formatNum(safetyStock, 1)} {uom})</td>
                    </tr>
                    <tr>
                      <td>Expected Lead-Time Consumption Value</td>
                      <td className="num text-right">{formatCurrency(leadTimeDemandValue)} ({formatNum(leadTimeDemand, 1)} {uom})</td>
                    </tr>
                    <tr>
                      <td>Estimated 84-Day (12-Week) Demand Value from Daily Forecast Trajectory</td>
                      <td className="num text-right font-semibold">{formatCurrency(cumulativeHorizonValue)} ({formatNum(cumulativeHorizonDemand, 0)} {uom})</td>
                    </tr>
                    <tr>
                      <td>Annual Inventory Turn Velocity</td>
                      <td className="num text-right font-semibold">{formatNum(annualTurns, 2)} turns/yr</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Supply Continuity & Product Protection Card */}
            <div className="card" style={{ minWidth: 0 }}>
              <div className="card__head" style={{ marginBottom: 10 }}>
                <div>
                  <Badge tone={belowReorderPoint ? 'risk' : 'success'}>Supply Continuity</Badge>
                  <h2 className="card__title" style={{ marginTop: 8 }}>
                    Supply Continuity & Product Line Protection
                  </h2>
                  <p className="card__sub">
                    Operational exposure across finished production lines at {plant}
                  </p>
                </div>
              </div>

              <div className="table-wrap">
                <table>
                  <tbody>
                    <tr>
                      <td>Strategic Governance Priority</td>
                      <td className="num text-right font-semibold">{meta.strategicPriority}</td>
                    </tr>
                    <tr>
                      <td>Downstream Finished Goods Exposure</td>
                      <td className="num text-right">{meta.downstream}</td>
                    </tr>
                    <tr>
                      <td>Primary Sourcing Dependency</td>
                      <td className="num text-right">{meta.supplier}</td>
                    </tr>
                    <tr>
                      <td>Replenishment Lead Time Duration</td>
                      <td className="num text-right font-semibold">{leadTimeDays} Days ({leadTimeWeeks.toFixed(1)} wks)</td>
                    </tr>
                    <tr>
                      <td>Current Inventory Coverage Window</td>
                      <td className="num text-right font-semibold" style={{ color: belowReorderPoint ? 'var(--risk)' : 'var(--success)' }}>
                        {formatNum(daysOfSupply, 1)} Days of Supply
                      </td>
                    </tr>
                    <tr>
                      <td>Executive Action Status</td>
                      <td className="num text-right font-semibold" style={{ color: belowReorderPoint ? 'var(--risk)' : 'var(--success)' }}>
                        {belowReorderPoint ? 'Replenishment Action Required' : 'Standard Operating Cadence'}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Executive Summary Decision Banner */}
          <div
            style={{
              padding: '14px 18px',
              background: belowReorderPoint ? 'var(--risk-bg)' : 'var(--success-bg)',
              borderRadius: 'var(--radius-sm)',
              border: `1px solid ${belowReorderPoint ? 'var(--risk)' : 'var(--success)'}`,
              fontSize: 13,
              marginBottom: 14,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
              <strong style={{ color: 'var(--ink)', fontSize: 13.5 }}>
                {belowReorderPoint ? 'Executive Risk Trigger:' : 'Executive Supply Status:'}
              </strong>
              <span style={{ color: 'var(--text)' }}>
                {belowReorderPoint
                  ? `On-hand stock (${formatNum(onHandQty, 0)} ${uom} / ${formatCurrency(onHandValue)}) covers ${formatNum(daysOfSupply, 1)} days of supply against a ${leadTimeDays}-day supplier lead time from ${meta.supplier.split('(')[0].trim()}. Replenishment exposure gap is ${formatNum(ropGap, 1)} ${uom} (${formatCurrency(ropGap * unitCost)}).`
                  : `On-hand stock (${formatNum(onHandQty, 0)} ${uom} / ${formatCurrency(onHandValue)}) covers ${formatNum(daysOfSupply, 1)} days of supply, safely buffering the ${leadTimeDays}-day supplier lead time from ${meta.supplier.split('(')[0].trim()} with a +${formatNum(ropBuffer, 1)} ${uom} (+${formatCurrency(ropBuffer * unitCost)}) buffer.`}
              </span>
            </div>
            <div style={{ color: 'var(--text)' }}>
              <strong>Strategic Recommendation:</strong> {belowReorderPoint
                ? `Authorize replenishment in Decision Intelligence and review multi-echelon order schedules in Optimization Plan to avert line stoppage across ${meta.downstream.split('(')[0].trim()}.`
                : `Current stock position indicates no immediate replenishment trigger under current operating assumptions. Maintain standard inventory turnover cadence.`}
            </div>
          </div>
        </>
      )}

      {/* ==================================================================== */}
      {/* H. PERSONA-SPECIFIC STRATEGIC INTELLIGENCE LENSES                    */}
      {/* ==================================================================== */}
      {persona === 'ds' && (
        <Insight label="Data Scientist Lens · Model Specification, Generalization & Diagnostics">
          The multivariate demand trajectory for <span className="metric">{selectedMaterial.id}</span> is generated by an autoregressive Ridge regression model (<span className="metric">alpha = 1.0</span>) fitted over a <span className="metric">104-week</span> training window with Standard Normal Variate (SNV) normalization. The model incorporates lag-1, lag-7, and lag-30 feature vectors. Model explanatory fit achieves <span className="metric">R² = {formatNum(modelR2, 2)}</span> with in-sample residual <span className="metric">RMSE = {formatNum(rmse, 2)} {uom}/wk</span> ({(rmseRatio * 100).toFixed(2)}% of weekly mean). R² is an in-sample fit diagnostic measuring historical variance explained by the fitted model, and is not a guaranteed out-of-sample forecast accuracy measure. The 95% service planning envelope expands with forecast horizon via <span className="metric">± Z · d_0 · CV · sqrt(t/7)</span> (Z = 1.65).
        </Insight>
      )}

      {persona === 'analyst' && (
        <Insight label="Supply Chain Analyst Lens · Replenishment Execution & Scenario Governance">
          For <span className="metric">{selectedMaterial.id}</span> ({name}), baseline demand velocity is <span className="metric">{formatNum(baseDailyDemand, 2)} {uom}/day</span> ({formatNum(avgWeekly, 1)} {uom}/wk) with a modeled trend of <span className="metric">{trendPerDay > 0 ? '+' : ''}{formatNum(trendMagnitudeDailyPct, 4)}%/day</span> ({trendPerWeek > 0 ? '+' : ''}{formatNum(trendMagnitudePct, 2)}%/wk), generating a cumulative 84-day horizon demand of <span className="metric">{formatNum(cumulativeHorizonDemand, 0)} {uom}</span> (averaging {formatNum(avgDailyForecast, 2)} {uom}/day). Planning Reorder Point is <span className="metric">{formatNum(reorderPoint, 1)} {uom}</span> ({formatNum(leadTimeDemand, 1)} {uom} lead-time demand + {formatNum(safetyStock, 1)} {uom} planning safety stock). Current physical stock of <span className="metric">{formatNum(onHandQty, 0)} {uom}</span> provides <span className="metric">{formatNum(daysOfSupply, 1)} days</span> of supply. {belowReorderPoint ? `Inventory is currently below the Planning Reorder Point (${formatNum(reorderPoint, 1)} ${uom}) with an exposure gap of ${formatNum(ropGap, 1)} ${uom}. Recommended action: Evaluate replenishment against the planning reorder point and coverage gap; final order quantity should be determined using EOQ/MOQ, open purchase orders, supplier constraints, and downstream demand in Optimization.` : `Inventory remains above the Planning Reorder Point (${formatNum(reorderPoint, 1)} ${uom}) by a buffer of +${formatNum(ropBuffer, 1)} ${uom}, indicating no immediate replenishment trigger under current assumptions.`} Recommended action: Test sensitivity to lead-time extensions (+15d) and demand surges (+20%) in What-If Simulation.
        </Insight>
      )}

      {persona === 'exec' && (
        <Insight label="C-Suite Executive Lens · Working Capital Velocity & Revenue Protection">
          Forward demand intelligence for <span className="metric">{selectedMaterial.id}</span> indicates an annual consumption run-rate of <span className="metric">{formatCurrency(annualConsumptionValue)}/yr</span> ({formatNum(demand, 0)} {uom}/yr at {formatCurrency(unitCost)}/{uom}). Forward 84-day (12-week) cumulative demand outlook totals <span className="metric">{formatCurrency(cumulativeHorizonValue)}</span> ({formatNum(cumulativeHorizonDemand, 0)} {uom}) across the daily time series. Physical on-hand inventory carries <span className="metric">{formatCurrency(onHandValue)}</span> in working capital. Sizing the 95% service planning buffer at <span className="metric">{formatNum(safetyStock, 1)} {uom}</span> allocates <span className="metric">{formatCurrency(safetyStockValue)}</span> in protective cycle capital to buffer supplier lead times ({leadTimeDays} days). {belowReorderPoint ? `Stock position presents replenishment exposure across ${meta.downstream}, warranting purchase authorization in Decision Intelligence to avert potential operational interruption.` : `Current inventory is above the planning reorder point, indicating no immediate replenishment trigger under current operating assumptions, supporting standard inventory turnover.`}
        </Insight>
      )}

      {/* ==================================================================== */}
      {/* I. PERSONA-SPECIFIC WHY DISCLOSURE                                   */}
      {/* ==================================================================== */}
      <div className="card">
        <h2 className="card__title">
          {persona === 'ds'
            ? `Model Behavior & Statistical Driver Breakdown for ${selectedMaterial.id}`
            : persona === 'analyst'
            ? `Why ${selectedMaterial.id} ${belowReorderPoint ? `triggers an operational replenishment gap of ${formatNum(ropGap, 1)} ${uom}` : `maintains a protective buffer of ${formatNum(ropBuffer, 1)} ${uom} above ROP`}`
            : `Executive Rationale: Working Capital & Supply Continuity Assessment for ${selectedMaterial.id}`}
        </h2>

        {persona === 'ds' && (
          <WhyDisclosure
            defaultOpen
            summary="Autoregressive feature structure, residual behavior, and uncertainty formulation"
            drivers={[
              `Baseline consumption velocity across 104-week training window is ${formatNum(avgWeekly, 1)} ${uom}/wk (${formatNum(avgDaily, 2)} ${uom}/day).`,
              `Ridge regression (alpha = 1.0) over lag-1, lag-7, and lag-30 features with SNV normalization fits a linear weekly slope beta = ${trendPerWeek >= 0 ? '+' : ''}${formatNum(trendPerWeek, 4)}.`,
              `Model fit achieves R² = ${formatNum(modelR2, 2)} in-sample with residual error RMSE = ${formatNum(rmse, 2)} ${uom}/wk (${(rmseRatio * 100).toFixed(1)}% of weekly mean).`,
              `Planning band expands via Z = 1.65 standard normal service factor and demand CV = ${(demandCV * 100).toFixed(1)}% expanding over time (sigma * sqrt(h)).`,
            ]}
            meaning={[
              `Planning Reorder Point is formulated as ROP = LT Demand (${formatNum(leadTimeDemand, 1)} ${uom}) + Planning Safety Stock (${formatNum(safetyStock, 1)} ${uom}) = ${formatNum(reorderPoint, 1)} ${uom}.`,
              belowReorderPoint
                ? `Physical stock of ${formatNum(onHandQty, 0)} ${uom} sits ${formatNum(ropGap, 1)} ${uom} below the ROP boundary relative to the ${leadTimeDays}-day lead time.`
                : `Physical stock of ${formatNum(onHandQty, 0)} ${uom} exceeds the ROP boundary by +${formatNum(ropBuffer, 1)} ${uom}.`,
              `R² indicates in-sample explanatory power and should not be confused with out-of-sample forecast accuracy.`,
            ]}
            action={[
              `Pass daily forecast series (84 days, cumulative ${formatNum(cumulativeHorizonDemand, 0)} ${uom}, avg ${formatNum(avgDailyForecast, 2)} ${uom}/day) and variance parameters to What-If simulation engine.`,
              `Evaluate sensitivity to higher regularization penalties or extended lag horizons if residual autocorrelation appears in production telemetry.`,
              `Proceed to Optimization Plan to evaluate constrained multi-echelon order schedules.`,
            ]}
          />
        )}

        {persona === 'analyst' && (
          <WhyDisclosure
            defaultOpen
            summary="Operational replenishment drivers, coverage duration, and recommended next steps"
            drivers={[
              `Physical consumption velocity is ${formatNum(avgDaily, 2)} ${uom}/day (${formatNum(avgWeekly, 1)} ${uom}/wk) across catalog baseline.`,
              `Estimated trend of ${trendPerDay > 0 ? '+' : ''}${formatNum(trendMagnitudeDailyPct, 4)}%/day (${trendPerWeek > 0 ? '+' : ''}${formatNum(trendMagnitudePct, 2)}%/wk) projects 84-day (12-week) cumulative consumption at ${formatNum(cumulativeHorizonDemand, 0)} ${uom} across daily series.`,
              `Supplier lead time is ${leadTimeDays} days (${leadTimeWeeks.toFixed(1)} wks), generating ${formatNum(leadTimeDemand, 1)} ${uom} lead-time demand.`,
              `Planning safety stock is sized at ${formatNum(safetyStock, 1)} ${uom} (${formatCurrency(safetyStockValue)}) using a Z = 1.65 service factor and demand CV of ${(demandCV * 100).toFixed(1)}%.`,
            ]}
            meaning={[
              `Planning Reorder Point is ${formatNum(reorderPoint, 1)} ${uom} (${formatNum(leadTimeDemand, 1)} ${uom} LT demand + ${formatNum(safetyStock, 1)} ${uom} safety stock).`,
              belowReorderPoint
                ? `Current on-hand stock of ${formatNum(onHandQty, 0)} ${uom} (${formatCurrency(onHandValue)}) provides ${formatNum(daysOfSupply, 1)} days of supply — falling below the ${leadTimeDays}-day lead time by ${formatNum(ropGap, 1)} ${uom} (${formatCurrency(ropGap * unitCost)}).`
                : `Current on-hand stock of ${formatNum(onHandQty, 0)} ${uom} (${formatCurrency(onHandValue)}) provides ${formatNum(daysOfSupply, 1)} days of supply — buffering the ${leadTimeDays}-day lead time by +${formatNum(ropBuffer, 1)} ${uom}.`,
            ]}
            action={
              belowReorderPoint
                ? [
                    `Evaluate replenishment against the planning coverage gap of ${formatNum(ropGap, 1)} ${uom} (${formatCurrency(ropGap * unitCost)}); final order size should consider EOQ lot sizing, supplier MOQs, open supply, and downstream demand.`,
                    `Transition to What-If Simulation to stress-test demand volatility (+20%) and lead-time extensions (+15d).`,
                    `Proceed to Optimization Plan to solve constrained lot sizing and delivery schedules.`,
                  ]
                : [
                    `Maintain standard replenishment review cadence for ${selectedMaterial.id}; no immediate purchase order trigger under current operating assumptions.`,
                    `Stress-test supply resilience and lead-time latency scenarios in What-If Simulation.`,
                    `Review multi-echelon order schedules and holding cost trade-offs in Optimization Plan.`,
                  ]
            }
          />
        )}

        {persona === 'exec' && (
          <WhyDisclosure
            defaultOpen
            summary="Strategic demand outlook, working-capital valuation, and executive governance priorities"
            drivers={[
              `Annual consumption run-rate is ${formatCurrency(annualConsumptionValue)}/yr across ${meta.downstream.split('(')[0].trim()}.`,
              `Physical on-hand inventory carries ${formatCurrency(onHandValue)} in operating working capital at ${plant}.`,
              `Protective safety stock buffer represents ${formatCurrency(safetyStockValue)} (${formatNum(safetyStock, 1)} ${uom}) to protect against demand and supply volatility.`,
              `Supplier replenishment lead time is ${leadTimeDays} days with ${meta.supplier.split('(')[0].trim()}.`,
            ]}
            meaning={[
              `Current inventory covers ${formatNum(daysOfSupply, 1)} days of supply against the ${leadTimeDays}-day supplier lead time.`,
              belowReorderPoint
                ? `Replenishment exposure of ${formatCurrency(ropGap * unitCost)} exists, creating operational vulnerability if replenishment is delayed.`
                : `Operating stock safely buffers supplier lead time, indicating no immediate replenishment trigger under current operating assumptions.`,
            ]}
            action={
              belowReorderPoint
                ? [
                    `Authorize expedited replenishment purchase order in Decision Intelligence to protect downstream assembly schedules.`,
                    `Review supplier performance and capacity constraints in Optimization Plan.`,
                    `Verify working-capital availability for upcoming replenishment cycles.`,
                  ]
                : [
                    `Maintain active turnover monitoring across Class ${abcClass} catalog materials.`,
                    `Review multi-echelon working capital allocation in Optimization Plan.`,
                    `Evaluate quarterly vendor scorecard for ${meta.supplier.split('(')[0].trim()}.`,
                  ]
            }
          />
        )}
      </div>

      {/* ==================================================================== */}
      {/* J. PERSONA-AWARE DOWNSTREAM WORKFLOW & HANDOFF                       */}
      {/* ==================================================================== */}
      <div className="card">
        <div className="card__head">
          <div>
            <h2 className="card__title">Analytical Workflow & Downstream Handoff</h2>
            <p className="card__sub">
              {persona === 'ds'
                ? 'Use multivariate forecast outputs, trend slopes, and uncertainty assumptions as scenario inputs in What-If and Optimization.'
                : persona === 'analyst'
                ? 'Stress-test demand surges and lead-time delays in What-If before committing replenishment orders in Optimization.'
                : 'Use forecast, scenario, and optimization intelligence to govern working capital and protect supply continuity in Decision Intelligence.'}
            </p>
          </div>
          <Badge tone="accent">Forward Handoff Package</Badge>
        </div>

        <div className="table-wrap" style={{ marginBottom: 14 }}>
          <table>
            <thead>
              <tr>
                <th>Canonical Parameter</th>
                <th>Selected RM Baseline</th>
                <th>Analytical Role in What-If</th>
                <th>Downstream Role in Optimization</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="font-semibold">Selected Material</td>
                <td>{selectedMaterial.id} · {name}</td>
                <td>Maintains single source of truth context</td>
                <td>Input SKU for multi-echelon planning</td>
              </tr>
              <tr>
                <td className="font-semibold">Daily Forecast Series</td>
                <td>84 explicit daily points ({formatNum(day1Forecast, 2)} {uom}/d at Day 1 to {formatNum(day84Forecast, 2)} {uom}/d at Day 84; 84-day total = {formatNum(cumulativeHorizonDemand, 0)} {uom})</td>
                <td>Time-series baseline for demand surge and latency stress-testing</td>
                <td>Deterministic daily demand input for replenishment lot sizing</td>
              </tr>
              <tr>
                <td className="font-semibold">Linear Daily Slope</td>
                <td>{trendPerDay > 0 ? '+' : ''}{formatNum(trendMagnitudeDailyPct, 4)}%/day ({trendPerWeek > 0 ? '+' : ''}{formatNum(trendMagnitudePct, 2)}%/wk)</td>
                <td>Trajectory parameter for multi-period simulation</td>
                <td>Demand drift constraint across forward horizon</td>
              </tr>
              <tr>
                <td className="font-semibold">Supplier Lead Time</td>
                <td>{leadTimeDays} Days ({meta.supplier.split('(')[0].trim()})</td>
                <td>Base lever for supplier disruption simulations (+15d)</td>
                <td>Lead-time constraint in purchase scheduling</td>
              </tr>
              <tr>
                <td className="font-semibold">Planning Safety Stock</td>
                <td>{formatNum(safetyStock, 1)} {uom} (Z = 1.65)</td>
                <td>Buffer response recomputed dynamically</td>
                <td>Minimum safety stock floor constraint</td>
              </tr>
              <tr>
                <td className="font-semibold">Reorder Status</td>
                <td>{belowReorderPoint ? `Exposure Gap (-${formatNum(ropGap, 1)} ${uom})` : `Covered (+${formatNum(ropBuffer, 1)} ${uom})`}</td>
                <td>Evaluates stockout exposure and service impact</td>
                <td>Input for constrained replenishment scheduling</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => navigate('/app/what-if')}
          >
            Stress-test {selectedMaterial.id} in What-If Simulation
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => navigate('/app/optimization')}
          >
            View Optimization Plan
          </button>
          <button
            type="button"
            className="btn btn-sm"
            onClick={() => navigate('/app/eoq')}
          >
            Review EOQ Calibration
          </button>
          <button
            type="button"
            className="btn btn-sm"
            onClick={() => navigate('/app/rmlc')}
          >
            Check RMLC Lifecycle
          </button>
        </div>
      </div>
    </section>
  );
}
