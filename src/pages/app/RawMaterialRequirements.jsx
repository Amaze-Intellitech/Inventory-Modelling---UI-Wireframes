import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ViewHead, KpiTile, WhyDisclosure, Badge, Insight } from '../../components/CommonUI';
import { usePlatform } from '../../context/PlatformContext';
import ModelValidation, { MultivariateHeadline } from '../../components/ModelValidation';
import { EOQ_INPUTS, FORECAST_INPUTS } from '../../data/mockData';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from '@/components/ui/table';

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
    <div className="relative w-full overflow-hidden" style={{ minHeight: 440 }}>
      {/* Real-Time Interactive Day Inspector Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 bg-[color-mix(in_srgb,var(--bg)_90%,transparent)] border border-border rounded-lg px-3.5 py-2 mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <Badge tone="accent" className="font-bold">
            {hoveredPoint ? 'Inspecting Day' : 'Next-Day Baseline'}
          </Badge>
          <span className="text-xs font-bold text-ink font-mono">
            Day {activePoint.day} · {activePoint.dayOfWeek}, {activePoint.date}, 2026 (Week {activePoint.weekNum})
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-3.5 text-xs text-body-c font-mono">
          <div>
            <span className="text-subtle mr-1 font-sans">Daily Forecast:</span>
            <strong className="text-primary font-semibold">{activePoint.dailyMean.toFixed(2)} {uom}/day</strong>
          </div>
          <div>
            <span className="text-subtle mr-1 font-sans">Planning Envelope (Z=1.65):</span>
            <span className="font-semibold text-ink ">{activePoint.lowerBand.toFixed(2)} – {activePoint.upperBand.toFixed(2)} {uom}/d</span>
          </div>
          <div>
            <span className="text-subtle mr-1 font-sans">Cumulative Total:</span>
            <strong className="text-ink ">{activePoint.cumulativeDemand.toFixed(1)} {uom}</strong>
          </div>
        </div>
      </div>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        className="w-full block cursor-crosshair rounded-lg overflow-hidden border border-[color-mix(in_srgb,var(--border)_80%,transparent)] shadow-inner"
        style={{ height: 380 }}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHoveredPoint(null)}
      >
        <defs>
          <linearGradient id="forecastAreaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.22" />
            <stop offset="100%" stopColor="var(--primary)" stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Shaded background zones */}
        {/* 1. Historical Actual Demand Zone */}
        <rect
          x={ML}
          y={MT}
          width={x(0) - ML}
          height={H - MT - MB}
          fill="var(--bg)"
          opacity={0.8}
        />
        <text
          x={ML + 10}
          y={MT + 16}
          fontSize={12}
          fill="var(--subtle)"
          fontWeight={700}
          letterSpacing="0.05em"
         
        >
          HISTORICAL OBSERVED DEMAND (56 DAYS)
        </text>

        {/* 2. Forecast Horizon Zone */}
        <rect
          x={x(0)}
          y={MT}
          width={W - MR - x(0)}
          height={H - MT - MB}
          fill="var(--info-bg)"
          opacity={0.45}
        />
        <text
          x={x(0) + 12}
          y={MT + 16}
          fontSize={12}
          fill="var(--info-tx)"
          fontWeight={700}
          letterSpacing="0.05em"
         
        >
          MULTIVARIATE FORECAST HORIZON (84 DAYS · WEEKS 1–12)
        </text>

        {/* Y-axis gridlines and labels */}
        {[0, 0.25, 0.5, 0.75, 1].map((f) => {
          const v = yMax * f;
          return (
            <g key={f}>
              <line x1={ML} x2={W - MR} y1={y(v)} y2={y(v)} stroke="var(--muted-fill)" />
              <text x={8} y={y(v) + 4} fontSize={12} fill="var(--subtle)">
                {v.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
              </text>
            </g>
          );
        })}

        {/* X-axis tick lines and labels */}
        {xTicks.map((tick) => (
          <g key={tick.day}>
            <line x1={x(tick.day)} x2={x(tick.day)} y1={H - MB} y2={H - MB + 5} stroke="var(--border-strong)" />
            <text
              x={x(tick.day)}
              y={H - MB + 16}
              fontSize={12}
              fill={tick.day === 0 ? 'var(--primary)' : tick.day > 0 ? 'var(--ink)' : 'var(--subtle)'}
              textAnchor="middle"
             
              fontWeight={tick.day === 0 || tick.day === 1 || tick.day === 84 ? 700 : 500}
            >
              {tick.label}
            </text>
            <text
              x={x(tick.day)}
              y={H - MB + 28}
              fontSize={12}
              fill="var(--subtle)"
              textAnchor="middle"
             
            >
              {tick.sub}
            </text>
          </g>
        ))}

        {/* Shaded 95% Planning Envelope (Z = 1.65) */}
        <path d={bandPath} fill="var(--border)" fillOpacity={0.45} stroke="var(--primary)" strokeWidth={1} strokeDasharray="4 3" />

        {/* Area under forecast line */}
        <path d={forecastAreaPath} fill="url(#forecastAreaGrad)" />

        {/* Forecast Start Marker (Day 0 Boundary) */}
        <line x1={x(0)} x2={x(0)} y1={MT} y2={H - MB} stroke="var(--primary)" strokeWidth={2} />
        <rect x={x(0) - 46} y={MT - 22} width={92} height={20} rx={4} fill="var(--primary)" />
        <text x={x(0)} y={MT - 8} fontSize={12} fill="#ffffff" fontWeight={700} textAnchor="middle">
          Forecast Start
        </text>

        {/* Replenishment lead-time arrival marker */}
        {leadTimeDays <= horizonDays && (
          <g>
            <line x1={xLeadTime} x2={xLeadTime} y1={MT} y2={H - MB} stroke="var(--warning)" strokeWidth={1.5} strokeDasharray="4 3" />
            <rect x={xLeadTime - 56} y={MT + 4} width={112} height={18} rx={3} fill="#FEF3C7" stroke="var(--warning)" strokeWidth={1} />
            <text x={xLeadTime} y={MT + 16} fontSize={12} fill="#92400E" fontWeight={700} textAnchor="middle">
              ▲ Lead Time (+{leadTimeDays}d)
            </text>
          </g>
        )}

        {/* Week 12 Endpoint Marker */}
        <line x1={x(84)} x2={x(84)} y1={MT} y2={H - MB} stroke="var(--info-tx)" strokeWidth={1.5} strokeDasharray="3 3" />
        <rect x={x(84) - 42} y={MT - 22} width={84} height={20} rx={4} fill="var(--info-bg)" stroke="var(--primary)" strokeWidth={1} />
        <text x={x(84)} y={MT - 8} fontSize={12} fill="var(--info-tx)" fontWeight={700} textAnchor="middle">
          Wk 12 End
        </text>

        {/* Historical daily consumption path */}
        <path d={histPath} fill="none" stroke="var(--subtle)" strokeWidth={1.75} />
        {/* Sample points for historical curve */}
        {histDailyPoints.filter((_, idx) => idx % 7 === 0).map((p, i) => (
          <circle key={`hp-${i}`} cx={x(p.day)} cy={y(p.val)} r={2} fill="var(--subtle)" />
        ))}

        {/* 84-Day Daily Forecast Trajectory Line (Solid & Bold) */}
        <path d={forecastPath} fill="none" stroke="var(--primary)" strokeWidth={3} />

        {/* Render each of the 84 daily forecast points */}
        {dailyForecastSeries.map((p) => {
          const isMilestone = p.day === 1 || p.day % 7 === 0 || p.day === leadTimeDays || p.day === 84;
          return (
            <circle
              key={`dp-${p.day}`}
              cx={x(p.day)}
              cy={y(p.dailyMean)}
              r={isMilestone ? 3.5 : 1.75}
              fill="var(--primary)"
              stroke="#ffffff"
              strokeWidth={isMilestone ? 1.5 : 0.75}
            />
          );
        })}

        {/* Day 0 anchor circle */}
        <circle cx={x(0)} cy={y(baseDailyDemand)} r={4} fill="var(--primary)" stroke="#fff" strokeWidth={2} />

        {/* Hover crosshair & active forecast point markers */}
        {hoveredPoint && (
          <g>
            <line
              x1={x(hoveredPoint.day)}
              x2={x(hoveredPoint.day)}
              y1={MT}
              y2={H - MB}
              stroke="var(--primary)"
              strokeWidth={1.5}
              strokeDasharray="2 2"
            />
            <circle
              cx={x(hoveredPoint.day)}
              cy={y(hoveredPoint.upperBand)}
              r={3.5}
              fill="var(--primary)"
              stroke="#fff"
              strokeWidth={1.5}
            />
            <circle
              cx={x(hoveredPoint.day)}
              cy={y(hoveredPoint.lowerBand)}
              r={3.5}
              fill="var(--primary)"
              stroke="#fff"
              strokeWidth={1.5}
            />
            <circle
              cx={x(hoveredPoint.day)}
              cy={y(hoveredPoint.dailyMean)}
              r={5.5}
              fill="var(--primary)"
              stroke="#fff"
              strokeWidth={2}
            />
          </g>
        )}

        {/* Axes base lines */}
        <line x1={ML} x2={W - MR} y1={H - MB} y2={H - MB} stroke="var(--border-strong)" />
        <line x1={ML} x2={ML} y1={MT} y2={H - MB} stroke="var(--border-strong)" />

        {/* Chart axis captions */}
        <text x={(ML + W - MR) / 2} y={H - 4} fontSize={12} fill="var(--subtle)" textAnchor="middle">
          Timeline: 56-Day Historical Observed Consumption vs 84-Day Forward Daily Forecast Horizon · Calendar Dates
        </text>
        <text x={12} y={MT - 10} fontSize={12} fill="var(--subtle)" textAnchor="start">
          Daily Demand ({uom}/day)
        </text>
      </svg>

      {/* Floating Hover Card */}
      {hoveredPoint && (
        <div
          className="absolute z-20 min-w-[240px] rounded-lg border border-primary bg-[color-mix(in_srgb,var(--surface)_95%,transparent)] p-3 text-xs shadow-xl backdrop-blur-sm pointer-events-none"
          style={{
            top: 55,
            left: hoveredPoint.day > 42 ? 85 : 'auto',
            right: hoveredPoint.day > 42 ? 'auto' : 25,
          }}
        >
          <div className="flex items-center justify-between border-b border-border pb-1.5 mb-2">
            <span className="font-bold text-ink font-mono">
              Day {hoveredPoint.day} · {hoveredPoint.date}, 2026
            </span>
            <span className="text-primary font-semibold font-mono">Week {hoveredPoint.weekNum}</span>
          </div>
          <div className="text-primary font-bold text-sm mb-1 font-mono">
            Daily Forecast: {hoveredPoint.dailyMean.toFixed(2)} {uom}/day
          </div>
          <div className="text-body-c text-xs font-mono">
            Planning Envelope (Z=1.65): <strong>{hoveredPoint.lowerBand.toFixed(2)} – {hoveredPoint.upperBand.toFixed(2)}</strong> {uom}/d
          </div>
          <div className="text-subtle text-xs mt-1 font-mono">
            Cumulative to Date: <strong>{hoveredPoint.cumulativeDemand.toFixed(1)} {uom}</strong>
          </div>
        </div>
      )}
    </div>
  );
}

export default function RawMaterialRequirements() {
  const navigate = useNavigate();
  const { legacyPersona: persona, selectedMaterial } = usePlatform();
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
  const baseDailyDemand = avgWeekly / 7; // Exact daily baseline consistent with linear weekly model
  const trendPerDay = trendPerWeek / 7;  // Linear daily slope

  // Generate explicit deterministic 84-day daily forecast series (Days 1 to 84)
  const baseAnchorDate = new Date(2026, 8, 8); // Sep 8, 2026
  const dailyForecastSeries = [];
  let sumDailyDemand = 0;

  for (let t = 1; t <= forecastHorizonDays; t++) {
    const dayDate = new Date(baseAnchorDate);
    dayDate.setDate(baseAnchorDate.getDate() + t);
    const dateStr = dayDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const weekNum = Math.ceil(t / 7);
    const dayOfWeek = dayDate.toLocaleDateString('en-US', { weekday: 'short' });

    const dailyMean = baseDailyDemand * (1 + trendPerWeek * (t / 7));
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
  const week12ProjectedMean = day84Forecast * 7;
  const trendMagnitudePct = trendPerWeek * 100;
  const trendMagnitudeDailyPct = trendPerDay * 100;

  // Number & currency formatting helpers
  const formatNum = (val, decimals = 2) =>
    val.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  const formatCurrency = (val, decimals = 2) =>
    `$${val.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`;

  return (
    <motion.section 
      className="view" 
      style={{ minWidth: 0, overflowX: 'hidden', boxSizing: 'border-box' }}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* ==================================================================== */}
      {/* A. SHARED PAGE HEADER WITH CANONICAL RM PROPAGATION                 */}
      {/* ==================================================================== */}
      <ViewHead
        title="Multivariate Analysis · Forecast"
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
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => navigate('/app/optimization')}
            >
              Continue to Optimization
            </button>
          </div>
        }
      />

      <MultivariateHeadline material={`${selectedMaterial.id} · ${name}`} />

      {/* ==================================================================== */}
      {/* B. SHARED SELECTED RAW MATERIAL CONTEXT BLOCK                       */}
      {/* ==================================================================== */}
      <div className="card mb-4">
        <div className="card__head" style={{ marginBottom: 14 }}>
          <div>
            <div className="flex flex-wrap items-center gap-2.5 mb-1">
              <h2 className="card__title text-base m-0 text-ink font-bold">
                {selectedMaterial.id} · {name}
              </h2>
              <Badge tone={abcClass === 'A' ? 'accent' : 'neutral'}>
                {meta.contextTag}
              </Badge>
              <Badge tone={belowReorderPoint ? 'risk' : 'success'}>
                {belowReorderPoint ? '● Below Planning Reorder Point (Replenishment Trigger)' : '● Covered (Above Planning Reorder Point)'}
              </Badge>
            </div>
            <p className="card__sub text-xs text-subtle ">
              {plant} · Category: <strong className="text-body-c ">{category}</strong> · Supplier: <strong className="text-body-c ">{meta.supplier}</strong> · Lead Time: <strong className="text-body-c ">{leadTimeDays} days ({leadTimeWeeks.toFixed(1)} wks)</strong> · Downstream Dependency: <strong className="text-body-c ">{meta.downstream}</strong>
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
            valueStyle={{ color: belowReorderPoint ? 'var(--error)' : 'var(--success)' }}
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
          valueStyle={{ color: 'var(--accent, var(--primary))' }}
          delta={`SUM(all 84 daily points) · ${formatCurrency(cumulativeHorizonValue)}`}
          deltaTone="up"
          sub={`Exact cumulative demand summed across all 84 future days`}
        />
      </div>

      {/* ==================================================================== */}
      {/* D. DEDICATED VISIBLE DAILY FORECAST GRAPH SECTION (NEXT 84 DAYS)     */}
      {/* ==================================================================== */}
      <div
        className="card mb-4 border-2 border-[color-mix(in_srgb,var(--primary)_60%,transparent)] shadow-lg"
        style={{ padding: '18px 20px' }}
      >
        <div className="card__head flex-wrap gap-3 border-b border-border pb-3 mb-3.5">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2.5 mb-1">
              <h2 className="card__title text-lg font-bold text-ink m-0">
                Daily Forecast — Next 84 Days
              </h2>
              <Badge tone="accent">84-Day Time Series</Badge>
              <button
                id="daily-schedule-toggle"
                type="button"
                aria-expanded={showDailySchedule}
                aria-controls="daily-schedule-table"
                onClick={() => setShowDailySchedule((prev) => !prev)}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full border border-primary transition-all ${
                  showDailySchedule ? 'bg-primary-solid text-white' : 'bg-transparent text-primary hover:bg-info-bg '
                }`}
              >
                {showDailySchedule ? 'Hide Day-by-Day Resolution' : 'View Day-by-Day Resolution'}
                <span className={`text-xs transform transition-transform ${showDailySchedule ? 'rotate-180' : 'rotate-0'}`}>▼</span>
              </button>
            </div>
            <p className="card__sub text-xs text-subtle m-0">
              Day-by-day multivariate demand forecast for the selected raw material
            </p>
          </div>
          <div className="chart-legend mt-0 gap-3.5 flex-wrap shrink-0 text-xs">
            <span><span className="legend-dot" style={{ background: 'var(--subtle)' }} />Historical Actual Demand (56 Days)</span>
            <span><span className="legend-dot" style={{ background: 'var(--primary)', height: 4, width: 14, borderRadius: 2 }} />Daily Forecast Trajectory (84 Days)</span>
            <span><span className="legend-dot" style={{ background: 'var(--border)', border: '1px dashed var(--primary)' }} />Planning Envelope (Z=1.65)</span>
            <span><span className="legend-dot" style={{ background: 'var(--warning)' }} />▲ Supplier Lead-Time Arrival (+{leadTimeDays}d)</span>
          </div>
        </div>

        {/* Dedicated Graph Container */}
        <div className="w-full relative">
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
        <AnimatePresence mode="wait">
          {persona === 'ds' && (
            <motion.div
              key="ds-strip"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="grid-4 mt-3.5 pt-3 border-t border-border text-xs"
            >
              <div>
                <div className="text-xs font-bold uppercase text-subtle mb-1">
                  1. Daily Series Resolution
                </div>
                <div className="text-ink font-mono">
                  84 discrete daily forecast points across 12-week horizon ($t = 1 \dots 84$), anchored to <strong>{formatNum(baseDailyDemand, 2)} {uom}/d</strong> baseline.
                </div>
              </div>
              <div>
                <div className="text-xs font-bold uppercase text-subtle mb-1">
                  2. Linear Daily Slope (β_d)
                </div>
                <div className="text-ink font-mono">
                  Daily slope is <strong>{trendPerDay > 0 ? '+' : ''}{formatNum(trendMagnitudeDailyPct, 4)}%/day</strong>. Day 1: {formatNum(day1Forecast, 2)} {uom}/d; Day 84: {formatNum(day84Forecast, 2)} {uom}/d ({formatNum(week12ProjectedMean, 1)} {uom}/wk).
                </div>
              </div>
              <div>
                <div className="text-xs font-bold uppercase text-subtle mb-1">
                  3. Daily Band Expansion (Z·σ_d·√h)
                </div>
                <div className="text-ink font-mono">
                  Z = 1.65 planning factor expands: ±{formatNum(dailyForecastSeries[0].bandHalfWidth, 2)} {uom}/d at Day 1 to ±{formatNum(dailyForecastSeries[83].bandHalfWidth, 2)} {uom}/d at Day 84.
                </div>
              </div>
              <div>
                <div className="text-xs font-bold uppercase text-subtle mb-1">
                  4. Lead-Time Window
                </div>
                <div className="text-ink font-mono">
                  Supplier replenishment latency sits at <strong>Day +{leadTimeDays} (+{leadTimeWeeks.toFixed(1)} wks)</strong>, covering {formatNum(leadTimeDemand, 1)} {uom} base demand.
                </div>
              </div>
            </motion.div>
          )}

          {persona === 'analyst' && (
            <motion.div
              key="analyst-strip"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="grid-4 mt-3.5 pt-3 border-t border-border text-xs"
            >
              <div>
                <div className="text-xs font-bold uppercase text-subtle mb-1">
                  1. Daily Consumption Trajectory
                </div>
                <div className="text-ink ">
                  Day 1 starts at <strong>{formatNum(day1Forecast, 2)} {uom}/day</strong>, trending to <strong>{formatNum(day84Forecast, 2)} {uom}/day</strong> at Day 84 ({trendPerWeek >= 0.003 ? 'ramping demand' : trendPerWeek <= -0.003 ? 'declining demand' : 'steady pace'}).
                </div>
              </div>
              <div>
                <div className="text-xs font-bold uppercase text-subtle mb-1">
                  2. 84-Day Horizon Total
                </div>
                <div className="text-ink ">
                  Sum of all 84 daily forecasts: <strong>{formatNum(cumulativeHorizonDemand, 0)} {uom}</strong> (averaging {formatNum(avgDailyForecast, 2)} {uom}/day).
                </div>
              </div>
              <div>
                <div className="text-xs font-bold uppercase text-subtle mb-1">
                  3. Lead-Time Arrival Marker
                </div>
                <div className="text-ink ">
                  Order placed today arrives at <strong>Day +{leadTimeDays} (+{leadTimeWeeks.toFixed(1)} wks)</strong> from {meta.supplier.split('(')[0].trim()}.
                </div>
              </div>
              <div>
                <div className="text-xs font-bold uppercase text-subtle mb-1">
                  4. Replenishment Status
                </div>
                <div className="text-ink ">
                  {belowReorderPoint ? `On-hand stock is ${formatNum(ropGap, 1)} ${uom} below Planning ROP.` : `On-hand stock maintains a +${formatNum(ropBuffer, 1)} ${uom} protective buffer.`}
                </div>
              </div>
            </motion.div>
          )}

          {persona === 'exec' && (
            <motion.div
              key="exec-strip"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="grid-4 mt-3.5 pt-3 border-t border-border text-xs"
            >
              <div>
                <div className="text-xs font-bold uppercase text-subtle mb-1">
                  1. Annual Spend Baseline
                </div>
                <div className="text-ink ">
                  Annual consumption run-rate: <strong>{formatCurrency(annualConsumptionValue)}/yr</strong> ({formatNum(demand, 0)} {uom}/yr).
                </div>
              </div>
              <div>
                <div className="text-xs font-bold uppercase text-subtle mb-1">
                  2. 12-Week Horizon Spend
                </div>
                <div className="text-ink ">
                  Estimated 84-day demand value from daily series: <strong>{formatCurrency(cumulativeHorizonValue)}</strong> ({formatNum(cumulativeHorizonDemand, 0)} {uom}).
                </div>
              </div>
              <div>
                <div className="text-xs font-bold uppercase text-subtle mb-1">
                  3. Working Capital Sunk
                </div>
                <div className="text-ink ">
                  On-hand inventory holds <strong>{formatCurrency(onHandValue)}</strong> in active working capital.
                </div>
              </div>
              <div>
                <div className="text-xs font-bold uppercase text-subtle mb-1">
                  4. Supply Vulnerability
                </div>
                <div className="text-ink ">
                  {leadTimeDays}-day supplier replenishment window from <strong>{meta.supplier.split('(')[0].trim()}</strong>.
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-3 pt-2.5 border-t border-border flex flex-wrap justify-between items-start gap-2">
          <span className="text-xs text-subtle flex-1 min-w-0">
            {persona === 'ds' ? (
              <>
                <strong>Analytical Scope Note:</strong> Model training: 104 weeks · Displayed history: 56 daily points (8 wks) · Forecast horizon: 84 discrete daily points (12 wks). The shaded envelope represents a planning buffer derived from a one-sided 95% service-level factor (Z = 1.65) and daily demand variance (CV = {(demandCV * 100).toFixed(1)}%) expanding over time (σ_d · √(t/7)), rather than a conventional two-sided 95% statistical confidence interval.
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
          <span className="text-xs text-primary font-semibold shrink-0">
            Hover over chart to inspect any of the 84 individual calendar days
          </span>
        </div>

        {/* ================================================================ */}
        {/* 84-DAY DAILY FORECAST INSPECTION TABLE — EXPAND/COLLAPSE         */}
        {/* ================================================================ */}
        {showDailySchedule && (
          <motion.div
            id="daily-schedule-table"
            role="region"
            aria-label="84-Day Daily Forecast Schedule"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 pt-3.5 border-t-2 border-primary"
          >
            <div className="flex flex-wrap items-center gap-2.5 mb-2.5">
              <span className="text-sm font-bold text-ink ">84-Day Forecast Schedule · Days 1 – 84</span>
              <span className="text-xs text-subtle ">Source: <code className="font-mono text-xs bg-muted-fill px-1 py-0.5 rounded">dailyForecastSeries</code> · {dailyForecastSeries.length} daily points · Sep 9 – Dec 1, 2026</span>
              <span className="ml-auto text-xs text-primary font-mono font-semibold">
                Day 1 = {formatNum(day1Forecast, 2)} {uom}/d · Avg = {formatNum(avgDailyForecast, 2)} {uom}/d · Day 84 = {formatNum(day84Forecast, 2)} {uom}/d · Total = {formatNum(cumulativeHorizonDemand, 0)} {uom}
              </span>
            </div>
            
            <div className="max-h-[340px] overflow-y-auto overflow-x-auto border border-border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="whitespace-nowrap">Day #</TableHead>
                    <TableHead className="whitespace-nowrap">Day of Week</TableHead>
                    <TableHead className="whitespace-nowrap">Calendar Date</TableHead>
                    <TableHead className="whitespace-nowrap">Week #</TableHead>
                    <TableHead className="text-right whitespace-nowrap">Daily Forecast ({uom}/d)</TableHead>
                    <TableHead className="text-right whitespace-nowrap">Envelope Lower ({uom}/d)</TableHead>
                    <TableHead className="text-right whitespace-nowrap">Envelope Upper ({uom}/d)</TableHead>
                    <TableHead className="text-right whitespace-nowrap">Cumulative Total ({uom})</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dailyForecastSeries.map((p) => (
                    <TableRow
                      key={p.day}
                      className={
                        p.day === 1
                          ? 'bg-[color-mix(in_srgb,var(--primary)_10%,transparent)]'
                          : p.day === leadTimeDays
                          ? 'bg-warning-bg '
                          : p.day === 84
                          ? 'bg-[color-mix(in_srgb,var(--primary)_10%,transparent)]'
                          : p.day % 7 === 0
                          ? 'bg-[color-mix(in_srgb,var(--subtle)_5%,transparent)]'
                          : undefined
                      }
                    >
                      <TableCell className="font-semibold whitespace-nowrap font-mono">
                        Day {p.day}
                        {p.day === 1 && <span className="ml-1.5 text-xs text-primary font-bold font-sans">◀ Next-Day</span>}
                        {p.day === leadTimeDays && p.day !== 1 && p.day !== 84 && <span className="ml-1.5 text-xs text-warning-tx font-bold font-sans">▲ Order Arrival</span>}
                        {p.day === 84 && <span className="ml-1.5 text-xs text-primary font-bold font-sans">◀ Wk 12 End</span>}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-subtle text-xs">{p.dayOfWeek}</TableCell>
                      <TableCell className="whitespace-nowrap text-xs font-mono">{p.date}, 2026</TableCell>
                      <TableCell className="whitespace-nowrap text-xs font-mono">Wk {p.weekNum}</TableCell>
                      <TableCell className={`text-right font-mono font-semibold text-xs ${p.day === 1 ? 'text-primary ' : p.day === 84 ? 'text-primary ' : 'text-ink '}`}>
                        {formatNum(p.dailyMean, 2)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-subtle text-xs">
                        {formatNum(p.lowerBand, 2)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-subtle text-xs">
                        {formatNum(p.upperBand, 2)}
                      </TableCell>
                      <TableCell className={`text-right font-mono text-xs ${p.day % 7 === 0 || p.day === 84 ? 'font-bold text-ink ' : 'text-body-c '}`}>
                        {formatNum(p.cumulativeDemand, 1)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                <TableFooter>
                  <TableRow className="bg-[color-mix(in_srgb,var(--muted-fill)_80%,transparent)] border-t-2 border-border-strong font-semibold text-xs">
                    <TableCell colSpan={4}>84-Day Totals (Verification)</TableCell>
                    <TableCell className="text-right text-primary font-mono">
                      Avg: {formatNum(avgDailyForecast, 2)}
                    </TableCell>
                    <TableCell />
                    <TableCell />
                    <TableCell className="text-right text-primary font-mono">
                      {formatNum(cumulativeHorizonDemand, 1)} {uom}
                    </TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            </div>
            <p className="text-xs text-subtle mt-2">
              Planning Envelope (Z = 1.65): Lower = max(0, d(t) − Z·σ_d·√(t/7)) · Upper = d(t) + Z·σ_d·√(t/7). All 84 daily values reconcile with the 4 primary KPIs above.
            </p>
          </motion.div>
        )}
      </div>

      {/* ==================================================================== */}
      {/* E. PERSONA-SPECIFIC SUMMARY KPIS & DIAGNOSTIC INTELLIGENCE          */}
      {/* ==================================================================== */}
      <AnimatePresence mode="wait">
        {persona === 'ds' && (
          <motion.div
            key="ds-kpi"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid-3 mb-3.5"
          >
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
              valueStyle={{ color: Math.abs(trendPerWeek) >= 0.003 ? 'var(--primary)' : 'var(--ink)' }}
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
              valueStyle={{ color: modelR2 >= 0.90 ? 'var(--success)' : modelR2 >= 0.80 ? 'var(--primary)' : 'var(--warning)' }}
              delta={`${(modelR2 * 100).toFixed(1)}% variance explained`}
              deltaTone={modelR2 >= 0.85 ? 'up' : 'flat'}
              sub="In-sample fit diagnostic across 104 trailing weeks (not out-of-sample accuracy)"
            />
            <KpiTile
              label="5. Residual Error (RMSE) [Model Diagnostic]"
              value={`${formatNum(rmse, 2)} ${uom}/wk`}
              valueStyle={{ color: rmseRatio <= 0.12 ? 'var(--success)' : 'var(--warning)' }}
              delta={`${formatNum(rmseRatio * 100, 1)}% of weekly mean`}
              deltaTone={rmseRatio <= 0.12 ? 'up' : 'down'}
              sub={`Model residual error magnitude relative to ${formatNum(avgWeekly, 1)} ${uom}/wk baseline`}
            />
            <KpiTile
              label="6. Demand Dispersion (CV) [Derived Metric]"
              value={`CV ${(demandCV * 100).toFixed(1)}%`}
              valueStyle={{ color: demandCV <= 0.15 ? 'var(--success)' : 'var(--warning)' }}
              delta={`Std Dev: ±${formatNum(sigmaDaily, 2)} ${uom}/d (±${formatNum(sigmaWeekly, 1)}/wk)`}
              deltaTone={demandCV <= 0.15 ? 'up' : 'down'}
              sub={`Historical coefficient of variation driving Z=1.65 planning band expansion`}
            />
          </motion.div>
        )}

        {persona === 'analyst' && (
          <motion.div
            key="analyst-kpi"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid-3 mb-3.5"
          >
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
              valueStyle={{ color: belowReorderPoint ? 'var(--error)' : 'var(--success)' }}
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
              valueStyle={{ color: belowReorderPoint ? 'var(--error)' : 'var(--success)' }}
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
          </motion.div>
        )}

        {persona === 'exec' && (
          <motion.div
            key="exec-kpi"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid-3 mb-3.5"
          >
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
              valueStyle={{ color: belowReorderPoint ? 'var(--error)' : 'var(--success)' }}
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
              valueStyle={{ color: belowReorderPoint ? 'var(--error)' : 'var(--success)' }}
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
          </motion.div>
        )}
      </AnimatePresence>

      {/* ==================================================================== */}
      {/* F. PERSONA-SPECIFIC DEEP-DIVE TABLES & DIAGNOSTICS                   */}
      {/* ==================================================================== */}
      {persona === 'ds' && (
        <div className="flex flex-col gap-3.5 mb-4">
          <div className="card">
            <div className="card__head mb-2.5">
              <div>
                <Badge tone={Math.abs(trendPerWeek) >= 0.003 ? 'accent' : 'neutral'}>Trajectory Intelligence</Badge>
                <h2 className="card__title mt-2">
                  Forecast Trajectory & Demand Movement
                </h2>
                <p className="card__sub">
                  Modeled demand progression across the 12-week forward planning horizon
                </p>
              </div>
            </div>

            <div className="border border-border rounded-lg overflow-hidden">
              <Table>
                <TableBody>
                  <TableRow>
                    <TableCell className="text-body-c ">Baseline Daily Demand (d_0)</TableCell>
                    <TableCell className="text-right font-mono font-semibold text-ink ">{formatNum(baseDailyDemand, 2)} {uom}/day</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="text-body-c ">Baseline Weekly Demand (W_0)</TableCell>
                    <TableCell className="text-right font-mono text-ink ">{formatNum(avgWeekly, 1)} {uom}/wk</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="text-body-c ">Estimated Linear Daily Slope (β_d)</TableCell>
                    <TableCell className="text-right font-mono font-semibold text-primary ">
                      {trendPerDay > 0 ? '+' : ''}{formatNum(trendMagnitudeDailyPct, 4)}%/day ({trendPerWeek > 0 ? '+' : ''}{formatNum(trendMagnitudePct, 2)}%/wk)
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="text-body-c ">Trend Classification</TableCell>
                    <TableCell className="text-right font-medium text-ink ">
                      {trendPerWeek >= 0.003
                        ? 'Ramping Demand Signal'
                        : trendPerWeek <= -0.003
                        ? 'Declining Demand Signal'
                        : 'Steady-State Consumption'}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="text-body-c ">Next-Day Expected Demand (Day 1)</TableCell>
                    <TableCell className="text-right font-mono font-semibold text-ink ">{formatNum(day1Forecast, 2)} {uom}/day</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="text-body-c ">Mid-Horizon Expected Demand (Day 42 / Wk 6)</TableCell>
                    <TableCell className="text-right font-mono text-ink ">{formatNum(dailyForecastSeries[41].dailyMean, 2)} {uom}/day ({formatNum(dailyForecastSeries[41].dailyMean * 7, 1)} {uom}/wk)</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="text-body-c ">Horizon Endpoint Demand (Day 84 / Wk 12)</TableCell>
                    <TableCell className="text-right font-mono font-semibold text-ink ">{formatNum(day84Forecast, 2)} {uom}/day ({formatNum(week12ProjectedMean, 1)} {uom}/wk)</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="text-body-c ">Average Daily Forecast across 84 Days</TableCell>
                    <TableCell className="text-right font-mono font-semibold text-primary ">{formatNum(avgDailyForecast, 2)} {uom}/day</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="text-body-c ">Cumulative 84-Day Forecast Sum</TableCell>
                    <TableCell className="text-right font-mono font-bold text-ink ">{formatNum(cumulativeHorizonDemand, 1)} {uom} ({formatCurrency(cumulativeHorizonValue)})</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>

            <p className="text-xs text-subtle mt-2.5">
              <strong>Trend Modeling Note:</strong> Trend is evaluated as a pure linear daily slope (trendPerDay = {trendPerDay >= 0 ? '+' : ''}{formatNum(trendPerDay, 5)}/day, trendPerWeek = {trendPerWeek >= 0 ? '+' : ''}{formatNum(trendPerWeek, 4)}/wk), representing an estimated average linear slope across historical observations rather than an exponential or compounding process. Day 84 rate ({formatNum(day84Forecast, 2)} {uom}/d × 7 = {formatNum(week12ProjectedMean, 1)} {uom}/wk) exactly reconciles with the Week-12 endpoint.
            </p>
          </div>

          <div className="card">
            <div className="card__head mb-2.5">
              <div>
                <Badge tone="accent">Model Diagnostics</Badge>
                <h2 className="card__title mt-2">
                  Forecast Reliability & Diagnostic Fit
                </h2>
                <p className="card__sub">
                  Specification parameters and goodness-of-fit metrics from historical model training
                </p>
              </div>
            </div>

            <div className="border border-border rounded-lg overflow-hidden">
              <Table>
                <TableBody>
                  <TableRow>
                    <TableCell className="text-body-c ">Model Architecture</TableCell>
                    <TableCell className="text-right font-mono font-semibold text-ink ">Ridge Regression (alpha = 1.0)</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="text-body-c ">Autoregressive Feature Set</TableCell>
                    <TableCell className="text-right font-mono text-ink ">Lag-1, Lag-7, Lag-30 Demand History</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="text-body-c ">Feature Normalization</TableCell>
                    <TableCell className="text-right font-mono text-ink ">Standard Normal Variate (SNV)</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="text-body-c ">Training History Window</TableCell>
                    <TableCell className="text-right font-mono text-ink ">104 Weeks (2 Years Trailing)</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="text-body-c ">Model Fit (R²)</TableCell>
                    <TableCell className="text-right font-mono font-semibold text-success-tx ">
                      {formatNum(modelR2, 2)} ({(modelR2 * 100).toFixed(1)}% variance explained)
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="text-body-c ">Model Residual Error (RMSE)</TableCell>
                    <TableCell className="text-right font-mono font-semibold text-ink ">
                      {formatNum(rmse, 2)} {uom}/wk ({(rmseRatio * 100).toFixed(1)}% of mean)
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="text-body-c ">Historical Demand CV</TableCell>
                    <TableCell className="text-right font-mono text-ink ">{(demandCV * 100).toFixed(1)}% (Std Dev: ±{formatNum(sigmaWeekly, 1)} {uom}/wk)</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="text-body-c ">Demand Standard Deviation (σ)</TableCell>
                    <TableCell className="text-right font-mono font-semibold text-ink ">Daily σ_d = ±{formatNum(sigmaDaily, 2)} {uom}/day</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>

            <p className="text-xs text-subtle mt-2.5">
              <strong>Technical Definitions & Methodology:</strong> R² = {formatNum(modelR2, 2)} is an in-sample model fit diagnostic measuring historical variance explained across the 104-week training window (not future forecast accuracy). RMSE = {formatNum(rmse, 2)} {uom}/wk measures in-sample residual error magnitude. CV = {(demandCV * 100).toFixed(1)}% measures demand variability relative to average demand. Standard deviation (σ_d = ±{formatNum(sigmaDaily, 2)} {uom}/day) is the demand variability measure used in planning calculations.
            </p>
          </div>
        </div>
      )}

      {persona === 'analyst' && (
        <div className="card mb-4">
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

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 mb-3.5">
            <div className="p-3 bg-bg rounded-md border border-border ">
              <div className="text-xs font-bold uppercase text-subtle mb-1">1. Current Inventory</div>
              <div className="text-base font-bold text-ink font-mono mb-0.5">{formatNum(onHandQty, 0)} {uom}</div>
              <div className="text-xs text-body-c font-mono">{formatCurrency(onHandValue)}</div>
              <div className="text-xs text-subtle mt-1 font-mono">{formatNum(daysOfSupply, 1)} days supply</div>
            </div>

            <div className="p-3 bg-bg rounded-md border border-border ">
              <div className="text-xs font-bold uppercase text-subtle mb-1">2. Baseline Consumption</div>
              <div className="text-base font-bold text-ink font-mono mb-0.5">{formatNum(avgDaily, 2)} {uom}/d</div>
              <div className="text-xs text-body-c font-mono">{formatNum(avgWeekly, 1)} {uom}/wk</div>
              <div className="text-xs text-subtle mt-1 font-mono">CV = {(demandCV * 100).toFixed(1)}%</div>
            </div>

            <div className="p-3 bg-bg rounded-md border border-border ">
              <div className="text-xs font-bold uppercase text-subtle mb-1">3. Lead-Time Demand</div>
              <div className="text-base font-bold text-ink font-mono mb-0.5">{formatNum(leadTimeDemand, 1)} {uom}</div>
              <div className="text-xs text-body-c ">{leadTimeDays}d lead time</div>
              <div className="text-xs text-subtle mt-1 font-mono">{formatNum(avgDaily, 2)}/d × {leadTimeDays}d</div>
            </div>

            <div className="p-3 bg-bg rounded-md border border-border ">
              <div className="text-xs font-bold uppercase text-subtle mb-1">4. Safety Stock</div>
              <div className="text-base font-bold text-primary font-mono mb-0.5">{formatNum(safetyStock, 1)} {uom}</div>
              <div className="text-xs text-body-c font-mono">{formatCurrency(safetyStockValue)}</div>
              <div className="text-xs text-subtle mt-1 font-mono">Z=1.65 · σ_d · √L</div>
            </div>

            <div className={`p-3 rounded-md border ${belowReorderPoint ? 'bg-[color-mix(in_srgb,var(--error-bg)_70%,transparent)] border-error ' : 'bg-[color-mix(in_srgb,var(--success-bg)_70%,transparent)] border-success '}`}>
              <div className={`text-xs font-bold uppercase mb-1 ${belowReorderPoint ? 'text-error-tx' : 'text-success-tx'}`}>5. Reorder Point (ROP)</div>
              <div className={`text-base font-bold font-mono mb-0.5 ${belowReorderPoint ? 'text-error-tx ' : 'text-success-tx '}`}>{formatNum(reorderPoint, 1)} {uom}</div>
              <div className="text-xs font-semibold text-ink font-mono">
                {belowReorderPoint ? `Gap: -${formatNum(ropGap, 1)} ${uom}` : `Buffer: +${formatNum(ropBuffer, 1)} ${uom}`}
              </div>
              <div className="text-xs text-subtle mt-1">Lead Demand + SS</div>
            </div>
          </div>

          <div className={`p-3.5 rounded-md text-xs leading-relaxed border ${belowReorderPoint ? 'bg-[color-mix(in_srgb,var(--error-bg)_80%,transparent)] border-error ' : 'bg-[color-mix(in_srgb,var(--success-bg)_80%,transparent)] border-success '}`}>
            <strong className="text-ink ">
              {belowReorderPoint ? 'Planning Replenishment Trigger: ' : 'Coverage Evaluation: '}
            </strong>
            <span className="text-body-c ">
              {belowReorderPoint
                ? `Current on-hand stock of ${formatNum(onHandQty, 0)} ${uom} (${formatNum(daysOfSupply, 1)} days of supply) sits ${formatNum(ropGap, 1)} ${uom} (${formatCurrency(ropGap * unitCost)}) below the Planning Reorder Point (${formatNum(reorderPoint, 1)} ${uom}) relative to the ${leadTimeDays}-day supplier lead time.`
                : `Current on-hand stock of ${formatNum(onHandQty, 0)} ${uom} (${formatNum(daysOfSupply, 1)} days of supply) buffers the ${leadTimeDays}-day supplier lead time, exceeding Planning Reorder Point (${formatNum(reorderPoint, 1)} ${uom}) by +${formatNum(ropBuffer, 1)} ${uom} (+${formatCurrency(ropBuffer * unitCost)}).`}
            </span>
          </div>
        </div>
      )}

      {persona === 'exec' && (
        <div className="flex flex-col gap-3.5 mb-4">
          <div className="card">
            <div className="card__head mb-2.5">
              <div>
                <Badge tone="accent">Financial Valuation</Badge>
                <h2 className="card__title mt-2">
                  Working Capital & Inventory Valuation
                </h2>
                <p className="card__sub">
                  Capital allocation and carrying cost structure for {selectedMaterial.id}
                </p>
              </div>
            </div>

            <div className="border border-border rounded-lg overflow-hidden">
              <Table>
                <TableBody>
                  <TableRow>
                    <TableCell className="text-body-c ">Annual Catalog Consumption Value</TableCell>
                    <TableCell className="text-right font-mono font-semibold text-ink ">{formatCurrency(annualConsumptionValue)}/yr</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="text-body-c ">Current Physical Carrying Capital</TableCell>
                    <TableCell className="text-right font-mono font-semibold text-ink ">{formatCurrency(onHandValue)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="text-body-c ">Capital Allocated to Planning Safety Stock</TableCell>
                    <TableCell className="text-right font-mono text-ink ">{formatCurrency(safetyStockValue)} ({formatNum(safetyStock, 1)} {uom})</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="text-body-c ">Expected Lead-Time Consumption Value</TableCell>
                    <TableCell className="text-right font-mono text-ink ">{formatCurrency(leadTimeDemandValue)} ({formatNum(leadTimeDemand, 1)} {uom})</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="text-body-c ">Estimated 84-Day Demand Value from Forecast</TableCell>
                    <TableCell className="text-right font-mono font-semibold text-primary ">{formatCurrency(cumulativeHorizonValue)} ({formatNum(cumulativeHorizonDemand, 0)} {uom})</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="text-body-c ">Annual Inventory Turn Velocity</TableCell>
                    <TableCell className="text-right font-mono font-semibold text-ink ">{formatNum(annualTurns, 2)} turns/yr</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      )}

      <ModelValidation modelR2={modelR2} rmse={rmse} avgWeekly={avgWeekly} />

      {/* ==================================================================== */}
      {/* G. PERSONA-SPECIFIC STRATEGIC INTELLIGENCE LENSES                    */}
      {/* ==================================================================== */}
      <div className="mb-4">
        {persona === 'ds' && (
          <Insight label="Data Scientist Lens · Model Specification, Generalization & Diagnostics">
            The multivariate demand trajectory for <span className="metric">{selectedMaterial.id}</span> is generated by an autoregressive Ridge regression model (<span className="metric">alpha = 1.0</span>) fitted over a <span className="metric">104-week</span> training window with Standard Normal Variate (SNV) normalization. The model incorporates lag-1, lag-7, and lag-30 feature vectors. Model explanatory fit achieves <span className="metric">R² = {formatNum(modelR2, 2)}</span> with in-sample residual <span className="metric">RMSE = {formatNum(rmse, 2)} {uom}/wk</span> ({(rmseRatio * 100).toFixed(2)}% of weekly mean). R² is an in-sample fit diagnostic measuring historical variance explained by the fitted model, and is not a guaranteed out-of-sample forecast accuracy measure. The 95% service planning envelope expands with forecast horizon via <span className="metric">± Z · d_0 · CV · sqrt(t/7)</span> (Z = 1.65).
          </Insight>
        )}

        {persona === 'analyst' && (
          <Insight label="Plant Operations Lens · Replenishment Execution & Scenario Governance">
            For <span className="metric">{selectedMaterial.id}</span> ({name}), baseline demand velocity is <span className="metric">{formatNum(baseDailyDemand, 2)} {uom}/day</span> ({formatNum(avgWeekly, 1)} {uom}/wk) with a modeled trend of <span className="metric">{trendPerDay > 0 ? '+' : ''}{formatNum(trendMagnitudeDailyPct, 4)}%/day</span> ({trendPerWeek > 0 ? '+' : ''}{formatNum(trendMagnitudePct, 2)}%/wk), generating a cumulative 84-day horizon demand of <span className="metric">{formatNum(cumulativeHorizonDemand, 0)} {uom}</span> (averaging {formatNum(avgDailyForecast, 2)} {uom}/day). Planning Reorder Point is <span className="metric">{formatNum(reorderPoint, 1)} {uom}</span> ({formatNum(leadTimeDemand, 1)} {uom} lead-time demand + {formatNum(safetyStock, 1)} {uom} planning safety stock). Current physical stock of <span className="metric">{formatNum(onHandQty, 0)} {uom}</span> provides <span className="metric">{formatNum(daysOfSupply, 1)} days</span> of supply. {belowReorderPoint ? `Inventory is currently below the Planning Reorder Point (${formatNum(reorderPoint, 1)} ${uom}) with an exposure gap of ${formatNum(ropGap, 1)} ${uom}. Recommended action: Evaluate replenishment against the planning reorder point and coverage gap; final order quantity should be determined using EOQ/MOQ, open purchase orders, supplier constraints, and downstream demand in Optimization.` : `Inventory remains above the Planning Reorder Point (${formatNum(reorderPoint, 1)} ${uom}) by a buffer of +${formatNum(ropBuffer, 1)} ${uom}, indicating no immediate replenishment trigger under current assumptions.`} Recommended action: Test sensitivity to lead-time extensions (+15d) and demand surges (+20%) in What-If Simulation.
          </Insight>
        )}

        {persona === 'exec' && (
          <Insight label="Finance Lens · Working Capital Velocity & Revenue Protection">
            Forward demand intelligence for <span className="metric">{selectedMaterial.id}</span> indicates an annual consumption run-rate of <span className="metric">{formatCurrency(annualConsumptionValue)}/yr</span> ({formatNum(demand, 0)} {uom}/yr at {formatCurrency(unitCost)}/{uom}). Forward 84-day (12-week) cumulative demand outlook totals <span className="metric">{formatCurrency(cumulativeHorizonValue)}</span> ({formatNum(cumulativeHorizonDemand, 0)} {uom}) across the daily time series. Physical on-hand inventory carries <span className="metric">{formatCurrency(onHandValue)}</span> in working capital. Sizing the 95% service planning buffer at <span className="metric">{formatNum(safetyStock, 1)} {uom}</span> allocates <span className="metric">{formatCurrency(safetyStockValue)}</span> in protective cycle capital to buffer supplier lead times ({leadTimeDays} days). {belowReorderPoint ? `Stock position presents replenishment exposure across ${meta.downstream}, warranting purchase authorization in Inventory Agent to avert potential operational interruption.` : `Current inventory is above the planning reorder point, indicating no immediate replenishment trigger under current operating assumptions, supporting standard inventory turnover.`}
          </Insight>
        )}
      </div>

      {/* ==================================================================== */}
      {/* H. PERSONA-SPECIFIC WHY DISCLOSURE                                   */}
      {/* ==================================================================== */}
      <div className="card mb-4">
        <h2 className="card__title mb-3">
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
              `Estimated trend of ${trendPerDay > 0 ? '+' : ''}${formatNum(trendMagnitudeDailyPct, 4)}%/day (${trendPerWeek > 0 ? '+' : ''}{formatNum(trendMagnitudePct, 2)}%/wk) projects 84-day (12-week) cumulative consumption at ${formatNum(cumulativeHorizonDemand, 0)} ${uom} across daily series.`,
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
                    `Authorize expedited replenishment purchase order in Inventory Agent to protect downstream assembly schedules.`,
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
      {/* I. PERSONA-AWARE DOWNSTREAM WORKFLOW & HANDOFF                       */}
      {/* ==================================================================== */}
      <div className="card">
        <div className="card__head mb-3">
          <div>
            <h2 className="card__title">Analytical Workflow & Downstream Handoff</h2>
            <p className="card__sub">
              {persona === 'ds'
                ? 'Use multivariate forecast outputs, trend slopes, and uncertainty assumptions as scenario inputs in What-If and Optimization.'
                : persona === 'analyst'
                ? 'Stress-test demand surges and lead-time delays in What-If before committing replenishment orders in Optimization.'
                : 'Use forecast, scenario, and optimization intelligence to govern working capital and protect supply continuity in Inventory Agent.'}
            </p>
          </div>
          <Badge tone="accent">Forward Handoff Package</Badge>
        </div>

        <div className="border border-border rounded-lg overflow-hidden mb-3.5">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Canonical Parameter</TableHead>
                <TableHead>Selected RM Baseline</TableHead>
                <TableHead>Analytical Role in What-If</TableHead>
                <TableHead>Downstream Role in Optimization</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-semibold text-ink ">Selected Material</TableCell>
                <TableCell className="font-mono text-xs">{selectedMaterial.id} · {name}</TableCell>
                <TableCell className="text-xs text-body-c ">Maintains single source of truth context</TableCell>
                <TableCell className="text-xs text-body-c ">Input SKU for multi-echelon planning</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-semibold text-ink ">Daily Forecast Series</TableCell>
                <TableCell className="font-mono text-xs">84 explicit daily points ({formatNum(day1Forecast, 2)} {uom}/d to {formatNum(day84Forecast, 2)} {uom}/d; Total = {formatNum(cumulativeHorizonDemand, 0)} {uom})</TableCell>
                <TableCell className="text-xs text-body-c ">Time-series baseline for demand surge and latency stress-testing</TableCell>
                <TableCell className="text-xs text-body-c ">Deterministic daily demand input for replenishment lot sizing</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-semibold text-ink ">Linear Daily Slope</TableCell>
                <TableCell className="font-mono text-xs">{trendPerDay > 0 ? '+' : ''}{formatNum(trendMagnitudeDailyPct, 4)}%/day ({trendPerWeek > 0 ? '+' : ''}{formatNum(trendMagnitudePct, 2)}%/wk)</TableCell>
                <TableCell className="text-xs text-body-c ">Trajectory parameter for multi-period simulation</TableCell>
                <TableCell className="text-xs text-body-c ">Demand drift constraint across forward horizon</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-semibold text-ink ">Supplier Lead Time</TableCell>
                <TableCell className="font-mono text-xs">{leadTimeDays} Days ({meta.supplier.split('(')[0].trim()})</TableCell>
                <TableCell className="text-xs text-body-c ">Base lever for supplier disruption simulations (+15d)</TableCell>
                <TableCell className="text-xs text-body-c ">Lead-time constraint in purchase scheduling</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-semibold text-ink ">Planning Safety Stock</TableCell>
                <TableCell className="font-mono text-xs">{formatNum(safetyStock, 1)} {uom} (Z = 1.65)</TableCell>
                <TableCell className="text-xs text-body-c ">Buffer response recomputed dynamically</TableCell>
                <TableCell className="text-xs text-body-c ">Minimum safety stock floor constraint</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-semibold text-ink ">Reorder Status</TableCell>
                <TableCell className="font-mono text-xs">{belowReorderPoint ? `Exposure Gap (-${formatNum(ropGap, 1)} ${uom})` : `Covered (+${formatNum(ropBuffer, 1)} ${uom})`}</TableCell>
                <TableCell className="text-xs text-body-c ">Evaluates stockout exposure and service impact</TableCell>
                <TableCell className="text-xs text-body-c ">Input for constrained replenishment scheduling</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
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
            Review EOQ Analysis
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
    </motion.section>
  );
}
