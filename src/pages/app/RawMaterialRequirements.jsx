import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ViewHead, KpiTile, WhyDisclosure, Badge } from '../../components/CommonUI';
import PersonaTop from '../../components/PersonaTop';
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
  inspector,
  marker,
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
          {(inspector ? inspector(activePoint) : [
            { label: 'Daily Forecast', value: `${activePoint.dailyMean.toFixed(2)} ${uom}/day`, strong: 'text-primary' },
            { label: 'Planning Envelope (Z=1.65)', value: `${activePoint.lowerBand.toFixed(2)} – ${activePoint.upperBand.toFixed(2)} ${uom}/d` },
            { label: 'Cumulative Total', value: `${activePoint.cumulativeDemand.toFixed(1)} ${uom}`, strong: 'text-ink' },
          ]).map((f) => (
            <div key={f.label}>
              <span className="text-subtle mr-1 font-sans">{f.label}:</span>
              <strong className={`${f.strong || 'text-ink'} font-semibold`}>{f.value}</strong>
            </div>
          ))}
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

        {/* Persona decision marker (stock-out day, safety-stock breach, reorder point, order-by day) */}
        {marker && marker.day >= 1 && marker.day <= horizonDays && (
          <g>
            <line x1={x(marker.day)} x2={x(marker.day)} y1={MT} y2={H - MB} stroke="var(--error)" strokeWidth={1.5} strokeDasharray="2 3" />
            <rect x={Math.min(Math.max(x(marker.day) - marker.label.length * 3.9, ML), W - MR - marker.label.length * 7.8)} y={MT + 28} width={marker.label.length * 7.8} height={18} rx={3} fill="var(--error-bg)" stroke="var(--error)" strokeWidth={1} />
            <text x={Math.min(Math.max(x(marker.day), ML + marker.label.length * 3.9), W - MR - marker.label.length * 3.9)} y={MT + 41} fontSize={12} fill="var(--error)" fontWeight={700} textAnchor="middle">
              {marker.label}
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

  // The 5-tile physical/replenishment grid is a fact set every operational persona cares about;
  // only the framing (title, badge, closing note) changes per persona.
  const renderOperationalGrid = ({ title, sub, badgeText, badgeTone, noteBody }) => (
    <div className="card mb-4">
      <div className="card__head">
        <div>
          <h2 className="card__title">{title}</h2>
          <p className="card__sub">{sub}</p>
        </div>
        <Badge tone={badgeTone}>{badgeText}</Badge>
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
        {noteBody}
      </div>
    </div>
  );

  const downstreamShort = meta.downstream.split('(')[0].trim();
  const supplierShort = meta.supplier.split('(')[0].trim();

  const PERSONA_LENS = {
    supervisor: {
      headerSubtitle: <p>Forward demand outlook and reorder status for <strong>{selectedMaterial.id} ({name})</strong>, focused on whether downstream lines stay protected through the 12-week horizon.</p>,
      graphStrip: [
        { heading: '1. Coverage Today', body: `${formatNum(daysOfSupply, 1)} days of supply against a ${leadTimeDays}-day lead time — ${daysOfSupply < leadTimeDays ? 'below the buffer downstream lines need' : 'holding the buffer downstream lines need'}.` },
        { heading: '2. Downstream Lines Fed', body: meta.downstream },
        { heading: '3. Reorder Status', body: belowReorderPoint ? `Already ${formatNum(ropGap, 1)} ${uom} below the reorder trigger.` : `${formatNum(ropBuffer, 1)} ${uom} above the reorder trigger.` },
        { heading: '4. 12-Week Trend', body: `Demand moves from ${formatNum(day1Forecast, 2)} to ${formatNum(day84Forecast, 2)} ${uom}/day — ${trendPerWeek >= 0.003 ? 'rising' : trendPerWeek <= -0.003 ? 'easing' : 'steady'}.` },
      ],
      scopeNoteLabel: 'Line-Continuity Note:',
      scopeNoteBody: `This view tracks whether on-hand stock and the forward forecast keep ${downstreamShort} running through the ${leadTimeDays}-day supplier lead time.`,
      kpis: [
        { label: '1. Coverage vs Lead Time', value: `${formatNum(daysOfSupply, 1)} Days`, valueStyle: { color: belowReorderPoint ? 'var(--error)' : 'var(--success)' }, delta: daysOfSupply < leadTimeDays ? `LEAN: ${formatNum(leadTimeDays - daysOfSupply, 1)}d below lead time` : `Covered: +${formatNum(daysOfSupply - leadTimeDays, 1)}d beyond lead time`, deltaTone: daysOfSupply < leadTimeDays ? 'down' : 'up', sub: `Supplier lead time is ${leadTimeDays} days` },
        { label: '2. Downstream Lines Fed', value: downstreamShort, delta: 'Stops here if this material runs out', deltaTone: 'flat', sub: meta.downstream },
        { label: '3. Reorder Status', value: belowReorderPoint ? 'Trigger Active' : 'Protected', valueStyle: { color: belowReorderPoint ? 'var(--error)' : 'var(--success)' }, delta: belowReorderPoint ? `Gap: -${formatNum(ropGap, 1)} ${uom}` : `Buffer: +${formatNum(ropBuffer, 1)} ${uom}`, deltaTone: belowReorderPoint ? 'down' : 'up', sub: `ROP at ${formatNum(reorderPoint, 1)} ${uom}` },
        { label: '4. 12-Week Trend', value: `${formatNum(day1Forecast, 2)} → ${formatNum(day84Forecast, 2)} ${uom}/d`, delta: `${trendPerWeek >= 0 ? '+' : ''}${formatNum(trendMagnitudePct, 2)}%/wk`, deltaTone: trendPerWeek >= 0.003 ? 'up' : trendPerWeek <= -0.003 ? 'down' : 'flat', sub: 'Day 1 to Day 84 daily rate' },
      ],
      deepDive: { title: 'Line-Continuity Stock Check', sub: `Physical position behind ${downstreamShort} for ${selectedMaterial.id}.`, badgeText: belowReorderPoint ? 'Reorder Trigger Active' : 'Lines Protected', badgeTone: belowReorderPoint ? 'risk' : 'success', noteBody: belowReorderPoint ? `Current on-hand stock of ${formatNum(onHandQty, 0)} ${uom} sits ${formatNum(ropGap, 1)} ${uom} below the reorder point — ${meta.downstream} has no buffer until the next receipt.` : `Current on-hand stock of ${formatNum(onHandQty, 0)} ${uom} keeps ${formatNum(ropBuffer, 1)} ${uom} of buffer above the reorder point, protecting ${meta.downstream}.` },
      insightLabel: 'Plant Supervisor Lens · Will This Material Still Be There When the Line Needs It',
      insightBody: `${selectedMaterial.id}'s forecast reaches ${formatNum(day84Forecast, 2)} ${uom}/day by week 12. ${belowReorderPoint ? `Stock is already below the reorder trigger — ${meta.downstream} is exposed until the next receipt lands.` : `On-hand stock protects ${meta.downstream} through the full 12-week horizon.`}`,
      whyHeading: `Why ${selectedMaterial.id} will${belowReorderPoint ? ' not' : ''} keep ${downstreamShort} running`,
      whySummary: 'Line-continuity drivers behind the forecast and reorder position',
      whyDrivers: [
        `Forecast demand moves from ${formatNum(day1Forecast, 2)} to ${formatNum(day84Forecast, 2)} ${uom}/day across the 12-week horizon.`,
        `Supplier lead time is ${leadTimeDays} days (${leadTimeWeeks.toFixed(1)} wks) from ${supplierShort}.`,
        `${selectedMaterial.id} feeds ${meta.downstream}.`,
      ],
      whyMeaning: [belowReorderPoint ? `On-hand stock of ${formatNum(onHandQty, 0)} ${uom} sits ${formatNum(ropGap, 1)} ${uom} below the reorder point — downstream lines have no buffer until the next receipt.` : `On-hand stock of ${formatNum(onHandQty, 0)} ${uom} sits ${formatNum(ropBuffer, 1)} ${uom} above the reorder point — downstream lines stay covered.`],
      whyAction: belowReorderPoint
        ? [`Escalate replenishment for ${selectedMaterial.id} — downstream lines have no protective buffer.`, `Confirm which specific lines are exposed and how long they can run on remaining stock.`, `Proceed to Optimization Plan to size the replenishment order.`]
        : [`Maintain standard monitoring — no immediate line-stoppage risk from ${selectedMaterial.id}.`, `Recheck this position after any change to the ${downstreamShort} build schedule.`],
      handoffBody: `Confirm downstream schedules for ${downstreamShort} can absorb the 12-week forecast before it's stress-tested in What-If.`,
    },
    warehouse: {
      headerSubtitle: <p>Physical stock this forecast implies holding for <strong>{selectedMaterial.id} ({name})</strong> — safety-stock buffer, on-hand footprint, and what's driving each.</p>,
      graphStrip: [
        { heading: '1. Safety-Stock Sizing', body: `${formatNum(safetyStock, 1)} ${uom} (${formatCurrency(safetyStockValue)}) held purely as a buffer against demand and lead-time variability.` },
        { heading: '2. On-Hand vs Forecast', body: `${formatNum(onHandQty, 0)} ${uom} on-hand against ${formatNum(cumulativeHorizonDemand, 0)} ${uom} forecast to move over 12 weeks.` },
        { heading: '3. Storage Footprint', body: `${formatNum(daysOfSupply, 1)} days of supply currently on the shelf.` },
        { heading: '4. Replenishment Rhythm', body: belowReorderPoint ? 'Expect a receipt soon — stock is below the reorder point.' : 'No receipt imminent — stock is above the reorder point.' },
      ],
      scopeNoteLabel: 'Storage Note:',
      scopeNoteBody: 'Safety stock and on-hand figures here are the floor to keep on the shelf regardless of the reorder decision made in Optimization.',
      kpis: [
        { label: '1. On-Hand Inventory', value: `${formatNum(onHandQty, 0)} ${uom}`, delta: formatCurrency(onHandValue), deltaTone: 'flat', sub: `${formatNum(daysOfSupply, 1)} days of supply` },
        { label: '2. Safety-Stock Buffer', value: `${formatNum(safetyStock, 1)} ${uom}`, delta: formatCurrency(safetyStockValue), deltaTone: 'flat', sub: `Z=1.65 · CV ${(demandCV * 100).toFixed(1)}%` },
        { label: '3. Lead-Time Demand', value: `${formatNum(leadTimeDemand, 1)} ${uom}`, delta: `${leadTimeDays} days of consumption`, deltaTone: 'flat', sub: 'Floor stock needed before next receipt' },
        { label: '4. 12-Week Volume to Shelve', value: `${formatNum(cumulativeHorizonDemand, 0)} ${uom}`, delta: `${formatNum(avgDailyForecast, 2)} ${uom}/day avg`, deltaTone: 'flat', sub: 'Total forecast volume moving through storage' },
      ],
      deepDive: { title: 'Physical Stock & Buffer Breakdown', sub: `Storage footprint and safety-stock sizing for ${selectedMaterial.id}.`, badgeText: belowReorderPoint ? 'Replenishment Due' : 'Stable Footprint', badgeTone: belowReorderPoint ? 'risk' : 'success', noteBody: belowReorderPoint ? `On-hand stock of ${formatNum(onHandQty, 0)} ${uom} (${formatNum(daysOfSupply, 1)} days of supply) is ${formatNum(ropGap, 1)} ${uom} below the reorder point — expect a receipt to land soon.` : `On-hand stock of ${formatNum(onHandQty, 0)} ${uom} (${formatNum(daysOfSupply, 1)} days of supply) sits ${formatNum(ropBuffer, 1)} ${uom} above the reorder point — no incoming receipt expected imminently.` },
      insightLabel: 'Warehouse Manager Lens · How Much Stock This Forecast Implies Holding',
      insightBody: `Meeting the 12-week forecast of ${formatNum(cumulativeHorizonDemand, 0)} ${uom} means carrying ${formatNum(safetyStock, 1)} ${uom} (${formatCurrency(safetyStockValue)}) of safety buffer on top of lead-time stock — the floor to keep on the shelf regardless of the reorder decision.`,
      whyHeading: `Why ${selectedMaterial.id} needs ${formatNum(safetyStock, 1)} ${uom} of safety stock on the shelf`,
      whySummary: 'Physical buffer sizing and storage implications',
      whyDrivers: [
        `Demand variability (CV = ${(demandCV * 100).toFixed(1)}%) combined with a ${leadTimeDays}-day lead time sets the safety-stock size.`,
        `Current on-hand stock is ${formatNum(onHandQty, 0)} ${uom} (${formatCurrency(onHandValue)}), providing ${formatNum(daysOfSupply, 1)} days of supply.`,
      ],
      whyMeaning: [`Safety stock of ${formatNum(safetyStock, 1)} ${uom} (${formatCurrency(safetyStockValue)}) is the floor that should stay on the shelf even as cycle stock is drawn down.`],
      whyAction: [`Keep ${formatNum(safetyStock, 1)} ${uom} of ${selectedMaterial.id} reserved as untouchable buffer stock.`, `Flag any pick that would drop on-hand below the safety-stock floor.`],
      handoffBody: `Check that current shelf allocation for ${selectedMaterial.id} can hold the ${formatNum(safetyStock, 1)} ${uom} safety-stock floor before lot sizes change in Optimization.`,
    },
    planner: {
      headerSubtitle: <p>Demand trend and reorder position for <strong>{selectedMaterial.id} ({name})</strong>, to check against the confirmed production plan.</p>,
      graphStrip: [
        { heading: '1. Baseline Daily Demand', body: `${formatNum(baseDailyDemand, 2)} ${uom}/day (${formatNum(avgWeekly, 1)} ${uom}/wk).` },
        { heading: '2. Trend Slope', body: `${trendPerDay > 0 ? '+' : ''}${formatNum(trendMagnitudeDailyPct, 4)}%/day (${trendPerWeek > 0 ? '+' : ''}${formatNum(trendMagnitudePct, 2)}%/wk) — check this against the confirmed build schedule.` },
        { heading: '3. Reorder Point vs Plan', body: belowReorderPoint ? `On-hand is ${formatNum(ropGap, 1)} ${uom} below the reorder point.` : `On-hand is ${formatNum(ropBuffer, 1)} ${uom} above the reorder point.` },
        { heading: '4. Demand Volatility (CV)', body: `${(demandCV * 100).toFixed(1)}% — ${demandCV <= 0.15 ? 'stable' : 'elevated, worth a closer plan check'}.` },
      ],
      scopeNoteLabel: 'Plan-Alignment Note:',
      scopeNoteBody: `Trend and reorder figures here should be checked against the confirmed production plan for ${downstreamShort}, not treated as a fixed forecast.`,
      kpis: [
        { label: '1. Baseline Daily Demand', value: `${formatNum(baseDailyDemand, 2)} ${uom}/d`, delta: `${formatNum(avgWeekly, 1)} ${uom}/wk`, deltaTone: 'flat', sub: 'Anchor rate for the 12-week horizon' },
        { label: '2. Trend Slope', value: `${trendPerWeek > 0 ? '+' : ''}${formatNum(trendMagnitudePct, 2)}%/wk`, deltaTone: trendPerWeek >= 0.003 ? 'up' : trendPerWeek <= -0.003 ? 'down' : 'flat', delta: `Day 1: ${formatNum(day1Forecast, 2)} · Day 84: ${formatNum(day84Forecast, 2)} ${uom}/d`, sub: 'Check against confirmed build schedule' },
        { label: '3. Reorder Point vs On-Hand', value: `${formatNum(reorderPoint, 1)} ${uom}`, delta: belowReorderPoint ? `On-hand is ${formatNum(ropGap, 1)} ${uom} below` : `${formatNum(ropBuffer, 1)} ${uom} of buffer`, deltaTone: belowReorderPoint ? 'down' : 'up', sub: `${formatNum(leadTimeDemand, 1)} ${uom} LT demand + ${formatNum(safetyStock, 1)} ${uom} SS` },
        { label: '4. Review Cadence', value: `Class ${abcClass}`, delta: demandCV <= 0.15 ? 'Stable demand' : 'Elevated volatility', deltaTone: demandCV <= 0.15 ? 'up' : 'down', sub: `CV ${(demandCV * 100).toFixed(1)}%` },
      ],
      deepDive: { title: 'Demand & Replenishment Alignment', sub: `Baseline demand, trend and reorder position for ${selectedMaterial.id} against the production plan.`, badgeText: belowReorderPoint ? 'Plan Check Needed' : 'Plan Aligned', badgeTone: belowReorderPoint ? 'risk' : 'success', noteBody: belowReorderPoint ? `Reorder point (${formatNum(reorderPoint, 1)} ${uom}) is ahead of on-hand stock by ${formatNum(ropGap, 1)} ${uom} — confirm this against the confirmed production plan before the order is placed.` : `On-hand stock covers the reorder point with ${formatNum(ropBuffer, 1)} ${uom} to spare — check this still lines up with the confirmed production plan.` },
      insightLabel: 'Materials Planner Lens · Cover Against the Plan',
      insightBody: `At a modeled trend of ${trendPerWeek > 0 ? '+' : ''}${formatNum(trendMagnitudePct, 2)}%/wk, demand moves from ${formatNum(day1Forecast, 2)} to ${formatNum(day84Forecast, 2)} ${uom}/day over 12 weeks. Reorder point is ${formatNum(reorderPoint, 1)} ${uom} (${formatNum(leadTimeDemand, 1)} ${uom} lead-time demand + ${formatNum(safetyStock, 1)} ${uom} safety stock) — check this against the confirmed production plan before locking the order.`,
      whyHeading: `Why ${selectedMaterial.id}'s reorder position needs a plan check`,
      whySummary: 'Trend, demand stability, and reorder drivers relative to the plan',
      whyDrivers: [
        `Modeled trend of ${trendPerWeek > 0 ? '+' : ''}${formatNum(trendMagnitudePct, 2)}%/wk projects 12-week cumulative demand of ${formatNum(cumulativeHorizonDemand, 0)} ${uom}.`,
        `Demand CV of ${(demandCV * 100).toFixed(1)}% sets how much planning buffer this material needs beyond the trend line.`,
      ],
      whyMeaning: [belowReorderPoint ? `On-hand stock is ${formatNum(ropGap, 1)} ${uom} below the reorder point — confirm against the plan before this becomes a line-continuity issue.` : `On-hand stock covers the reorder point with ${formatNum(ropBuffer, 1)} ${uom} to spare under the current plan.`],
      whyAction: [`Check this trend and reorder position against the confirmed ${downstreamShort} build schedule.`, `Stress-test demand swings for ${selectedMaterial.id} in What-If before the plan is finalized.`],
      handoffBody: `Confirm the trend and reorder point for ${selectedMaterial.id} against the production plan before stress-testing it in What-If.`,
    },
    procurement: {
      headerSubtitle: <p>When and how much to order for <strong>{selectedMaterial.id} ({name})</strong>, given lead time and the forward forecast.</p>,
      graphStrip: [
        { heading: '1. Lead-Time Demand', body: `${formatNum(leadTimeDemand, 1)} ${uom} required to cover the ${leadTimeDays}-day lead time from ${supplierShort}.` },
        { heading: '2. Reorder Point', body: `${formatNum(reorderPoint, 1)} ${uom} trigger (${formatNum(leadTimeDemand, 1)} ${uom} lead-time demand + ${formatNum(safetyStock, 1)} ${uom} safety stock).` },
        { heading: '3. Supplier', body: meta.supplier },
        { heading: '4. Gap or Buffer', body: belowReorderPoint ? `${formatNum(ropGap, 1)} ${uom} (${formatCurrency(ropGap * unitCost)}) below the reorder point — order now.` : `${formatNum(ropBuffer, 1)} ${uom} (${formatCurrency(ropBuffer * unitCost)}) above the reorder point — no order needed yet.` },
      ],
      scopeNoteLabel: 'Execution Note:',
      scopeNoteBody: `Order timing and sizing here should be reconciled with ${supplierShort}'s MOQ and packaging increments before it's committed.`,
      kpis: [
        { label: '1. Reorder Point vs On-Hand', value: `${formatNum(reorderPoint, 1)} ${uom}`, valueStyle: { color: belowReorderPoint ? 'var(--error)' : 'var(--success)' }, delta: belowReorderPoint ? `Gap: -${formatNum(ropGap, 1)} ${uom}` : `Buffer: +${formatNum(ropBuffer, 1)} ${uom}`, deltaTone: belowReorderPoint ? 'down' : 'up', sub: `On-hand is ${formatNum(onHandQty, 0)} ${uom}` },
        { label: '2. Lead Time', value: `${leadTimeDays} Days`, delta: `${leadTimeWeeks.toFixed(1)} wks`, deltaTone: 'flat', sub: supplierShort },
        { label: '3. Order Decision', value: belowReorderPoint ? 'Order Now' : 'Hold', valueStyle: { color: belowReorderPoint ? 'var(--error)' : 'var(--success)' }, delta: belowReorderPoint ? formatCurrency(ropGap * unitCost) : formatCurrency(ropBuffer * unitCost), deltaTone: belowReorderPoint ? 'down' : 'up', sub: belowReorderPoint ? 'Gap value at risk' : 'Buffer value held' },
        { label: '4. 12-Week Demand to Plan Against', value: `${formatNum(cumulativeHorizonDemand, 0)} ${uom}`, delta: formatCurrency(cumulativeHorizonValue), deltaTone: 'flat', sub: `${formatNum(avgDailyForecast, 2)} ${uom}/day avg` },
      ],
      deepDive: { title: 'Reorder Position & Supply Execution', sub: `When and how much to order for ${selectedMaterial.id} from ${supplierShort}.`, badgeText: belowReorderPoint ? 'Order Now' : 'No Order Needed Yet', badgeTone: belowReorderPoint ? 'risk' : 'success', noteBody: belowReorderPoint ? `Place the order now — on-hand stock is ${formatNum(ropGap, 1)} ${uom} (${formatCurrency(ropGap * unitCost)}) below the reorder point against the ${leadTimeDays}-day lead time from ${meta.supplier}.` : `No order needed yet — on-hand stock is ${formatNum(ropBuffer, 1)} ${uom} (${formatCurrency(ropBuffer * unitCost)}) above the reorder point.` },
      insightLabel: 'Procurement Officer Lens · When and How Much to Order',
      insightBody: belowReorderPoint ? `On-hand is ${formatNum(ropGap, 1)} ${uom} below the reorder point — place the order now against the ${leadTimeDays}-day lead time from ${supplierShort}.` : `Stock is ${formatNum(ropBuffer, 1)} ${uom} above the reorder point — no order needed yet.`,
      whyHeading: `Why ${selectedMaterial.id} ${belowReorderPoint ? 'needs an order now' : "doesn't need an order yet"}`,
      whySummary: 'Reorder timing and sizing drivers',
      whyDrivers: [
        `Lead-time demand of ${formatNum(leadTimeDemand, 1)} ${uom} plus safety stock of ${formatNum(safetyStock, 1)} ${uom} sets the reorder point at ${formatNum(reorderPoint, 1)} ${uom}.`,
        `Supplier lead time is ${leadTimeDays} days from ${meta.supplier}.`,
      ],
      whyMeaning: [belowReorderPoint ? `On-hand stock of ${formatNum(onHandQty, 0)} ${uom} is ${formatNum(ropGap, 1)} ${uom} short of the reorder point.` : `On-hand stock of ${formatNum(onHandQty, 0)} ${uom} is ${formatNum(ropBuffer, 1)} ${uom} above the reorder point.`],
      whyAction: belowReorderPoint
        ? [`Place the replenishment order for ${selectedMaterial.id} now.`, `Confirm the order quantity against MOQ and packaging increments with ${supplierShort}.`]
        : [`No order action needed yet for ${selectedMaterial.id}.`, `Recheck once on-hand stock approaches the reorder point.`],
      handoffBody: `Confirm order timing and quantity for ${selectedMaterial.id} against supplier constraints before sizing the lot in Optimization.`,
    },
    finance: {
      headerSubtitle: <p>Executive demand outlook, working-capital valuation, supplier lead-time vulnerability, and continuity governance for <strong>{selectedMaterial.id} ({name})</strong>.</p>,
      graphStrip: [
        { heading: '1. Annual Spend Baseline', body: `Annual consumption run-rate: ${formatCurrency(annualConsumptionValue)}/yr (${formatNum(demand, 0)} ${uom}/yr).` },
        { heading: '2. 12-Week Horizon Spend', body: `Estimated 84-day demand value from daily series: ${formatCurrency(cumulativeHorizonValue)} (${formatNum(cumulativeHorizonDemand, 0)} ${uom}).` },
        { heading: '3. Working Capital Sunk', body: `On-hand inventory holds ${formatCurrency(onHandValue)} in active working capital.` },
        { heading: '4. Supply Vulnerability', body: `${leadTimeDays}-day supplier replenishment window from ${supplierShort}.` },
      ],
      scopeNoteLabel: 'Executive Scope Note:',
      scopeNoteBody: `Displayed history: 56 days · Forecast horizon: 84 days (12 wks) · Sourcing replenishment window: ${leadTimeDays} days. The shaded envelope illustrates projected demand variability across the planning cycle.`,
      kpis: [
        { label: '1. Annual Consumption Run-Rate', value: formatCurrency(annualConsumptionValue), delta: `${formatNum(demand, 0)} ${uom}/yr`, deltaTone: 'flat', sub: `Unit cost: ${formatCurrency(unitCost)}/${uom} · Class ${abcClass}` },
        { label: '2. Physical Inventory Capital', value: formatCurrency(onHandValue), delta: `${formatNum(onHandQty, 0)} ${uom} on-hand`, deltaTone: 'flat', sub: `Turning at ${formatNum(annualTurns, 2)} turns/yr` },
        { label: '3. 12-Week Horizon Spend', value: formatCurrency(cumulativeHorizonValue), delta: `${formatNum(cumulativeHorizonDemand, 0)} ${uom} total`, deltaTone: trendPerWeek >= 0.003 ? 'up' : trendPerWeek <= -0.003 ? 'down' : 'flat', sub: `Avg: ${formatNum(avgDailyForecast, 2)} ${uom}/day` },
        { label: '4. Safety-Buffer Capital', value: formatCurrency(safetyStockValue), delta: `${formatNum(safetyStock, 1)} ${uom} planning buffer`, deltaTone: 'flat', sub: 'Capital held against demand/lead-time variability' },
      ],
      insightLabel: 'Finance Controller Lens · Cash Committed Against This Forecast',
      insightBody: `On-hand inventory carries ${formatCurrency(onHandValue)} in working capital, with ${formatCurrency(safetyStockValue)} held purely as a demand/lead-time buffer. Meeting the 12-week forecast implies ${formatCurrency(cumulativeHorizonValue)} of consumption value moving through the material, turning at ${formatNum(annualTurns, 2)}×/yr.`,
      whyHeading: `Executive Rationale: Working Capital & Supply Continuity Assessment for ${selectedMaterial.id}`,
      whySummary: 'Strategic demand outlook, working-capital valuation, and executive governance priorities',
      whyDrivers: [
        `Annual consumption run-rate is ${formatCurrency(annualConsumptionValue)}/yr across ${downstreamShort}.`,
        `Physical on-hand inventory carries ${formatCurrency(onHandValue)} in operating working capital at ${plant}.`,
        `Protective safety stock buffer represents ${formatCurrency(safetyStockValue)} (${formatNum(safetyStock, 1)} ${uom}) to protect against demand and supply volatility.`,
        `Supplier replenishment lead time is ${leadTimeDays} days with ${supplierShort}.`,
      ],
      whyMeaning: [
        `Current inventory covers ${formatNum(daysOfSupply, 1)} days of supply against the ${leadTimeDays}-day supplier lead time.`,
        belowReorderPoint
          ? `Replenishment exposure of ${formatCurrency(ropGap * unitCost)} exists, creating operational vulnerability if replenishment is delayed.`
          : 'Operating stock safely buffers supplier lead time, indicating no immediate replenishment trigger under current operating assumptions.',
      ],
      whyAction: belowReorderPoint
        ? [`Authorize expedited replenishment purchase order in Inventory Agent to protect downstream assembly schedules.`, `Review supplier performance and capacity constraints in Optimization Plan.`, `Verify working-capital availability for upcoming replenishment cycles.`]
        : [`Maintain active turnover monitoring across Class ${abcClass} catalog materials.`, `Review multi-echelon working capital allocation in Optimization Plan.`, `Evaluate quarterly vendor scorecard for ${supplierShort}.`],
      handoffBody: 'Use forecast, scenario, and optimization intelligence to govern working capital and protect supply continuity in Inventory Agent.',
    },
  };
  // The four forecast tiles above the chart: same 84-day series, read in each persona's own terms.
  const ltIdx = Math.min(forecastHorizonDays, Math.max(1, Math.round(leadTimeDays))) - 1;
  const ltPoint = dailyForecastSeries[ltIdx];
  const peakDaily = Math.max(...dailyForecastSeries.map((d) => d.dailyMean));
  const trendTone = trendPerWeek >= 0.003 ? 'up' : trendPerWeek <= -0.003 ? 'down' : 'flat';
  const forecastTilesByPersona = {
    supervisor: [
      { label: '1. Next-Day Line Draw', value: `${formatNum(day1Forecast, 2)} ${uom}/day`, delta: 'Day 1 · Sep 9, 2026', deltaTone: 'flat', sub: 'What the lines consume tomorrow' },
      { label: '2. Peak Daily Draw', value: `${formatNum(peakDaily, 2)} ${uom}/day`, delta: `Within the next 84 days`, deltaTone: trendTone, sub: 'Highest daily consumption the lines will ask for' },
      { label: `3. Consumed Before Resupply`, value: `${formatNum(ltPoint.cumulativeDemand, 0)} ${uom}`, valueStyle: { color: ltPoint.cumulativeDemand > onHandQty ? 'var(--error)' : 'var(--success)' }, delta: ltPoint.cumulativeDemand > onHandQty ? `${formatNum(ltPoint.cumulativeDemand - onHandQty, 0)} ${uom} more than on-hand` : `On-hand covers it by ${formatNum(onHandQty - ltPoint.cumulativeDemand, 0)} ${uom}`, deltaTone: ltPoint.cumulativeDemand > onHandQty ? 'down' : 'up', sub: `Forecast demand over the ${leadTimeDays}-day lead time` },
      { label: '4. Week 12 Draw Rate', value: `${formatNum(day84Forecast, 2)} ${uom}/day`, delta: `${formatNum(week12ProjectedMean, 1)} ${uom}/wk equivalent`, deltaTone: trendPerWeek >= 0 ? 'up' : 'down', sub: 'Day 84 · Dec 1, 2026' },
    ],
    warehouse: [
      { label: '1. Average Daily Outflow', value: `${formatNum(avgDailyForecast, 2)} ${uom}/day`, delta: `${formatNum(avgDailyForecast * 7, 1)} ${uom}/wk`, deltaTone: 'flat', sub: 'Mean issues from stores across the 84 days' },
      { label: '2. Week 12 Weekly Outflow', value: `${formatNum(week12ProjectedMean, 1)} ${uom}/wk`, delta: `${trendPerWeek >= 0 ? '+' : ''}${formatNum(trendMagnitudePct, 2)}%/wk trend`, deltaTone: trendTone, sub: 'How much leaves the shelves in the final week' },
      { label: '3. 12-Week Volume Out', value: `${formatNum(cumulativeHorizonDemand, 0)} ${uom}`, delta: `${formatNum(cumulativeHorizonDemand / Math.max(onHandQty, 1), 2)}× current on-hand`, deltaTone: 'flat', sub: 'Total forecast issues over 12 weeks' },
      { label: '4. On-Hand After 12 Weeks if Nothing Arrives', value: `${formatNum(Math.max(onHandQty - cumulativeHorizonDemand, 0), 0)} ${uom}`, valueStyle: { color: onHandQty < cumulativeHorizonDemand ? 'var(--error)' : 'var(--ink)' }, delta: onHandQty < cumulativeHorizonDemand ? 'Runs out inside the horizon' : 'Still on shelf', deltaTone: onHandQty < cumulativeHorizonDemand ? 'down' : 'up', sub: 'Space this material still occupies at the end' },
    ],
    planner: [
      { label: '1. Next-Day Forecast', value: `${formatNum(day1Forecast, 2)} ${uom}/day`, delta: 'Day 1 · Sep 9, 2026', deltaTone: 'up', sub: `Day 1 actual forecast rate (+${formatNum(trendMagnitudeDailyPct, 4)}%/d)` },
      { label: '2. Average Daily Forecast', value: `${formatNum(avgDailyForecast, 2)} ${uom}/day`, delta: 'Arithmetic mean of all 84 points', deltaTone: 'flat', sub: 'Mean daily demand across the forecast horizon' },
      { label: '3. Week 12 Endpoint', value: `${formatNum(day84Forecast, 2)} ${uom}/day`, delta: `${formatNum(week12ProjectedMean, 1)} ${uom}/wk equivalent`, deltaTone: trendPerWeek >= 0 ? 'up' : 'down', sub: 'Day 84 forecast rate at Dec 1, 2026 (Week 12)' },
      { label: '4. 12-Week Forecast Total', value: `${formatNum(cumulativeHorizonDemand, 0)} ${uom}`, valueStyle: { color: 'var(--accent, var(--primary))' }, delta: `${formatNum(cumulativeHorizonDemand / avgWeekly, 1)} weeks of baseline demand`, deltaTone: 'up', sub: 'Exact cumulative demand summed across all 84 days' },
    ],
    procurement: [
      { label: `1. Demand Inside the ${leadTimeDays}-Day Lead Time`, value: `${formatNum(ltPoint.cumulativeDemand, 0)} ${uom}`, delta: formatCurrency(ltPoint.cumulativeDemand * unitCost), deltaTone: 'flat', sub: 'Forecast consumption before an order placed today arrives' },
      { label: '2. Upper Bound at Lead-Time End', value: `${formatNum(ltPoint.upperBand, 2)} ${uom}/day`, delta: `Z = 1.65 envelope`, deltaTone: 'flat', sub: `Daily rate could reach this by day ${leadTimeDays}` },
      { label: '3. Next-Day Forecast', value: `${formatNum(day1Forecast, 2)} ${uom}/day`, delta: 'Day 1 · Sep 9, 2026', deltaTone: 'flat', sub: 'Current run-rate to order against' },
      { label: '4. 12-Week Order Volume', value: `${formatNum(cumulativeHorizonDemand, 0)} ${uom}`, delta: `${formatNum(Math.max(cumulativeHorizonDemand - onHandQty, 0), 0)} ${uom} beyond on-hand`, deltaTone: cumulativeHorizonDemand > onHandQty ? 'down' : 'up', sub: 'Total to source across the horizon' },
    ],
    finance: [
      { label: '1. Spend Rate Today', value: `${formatCurrency(day1Forecast * unitCost)}/day`, delta: 'Day 1 · Sep 9, 2026', deltaTone: 'flat', sub: `At ${formatCurrency(unitCost)}/${uom}` },
      { label: '2. Average Daily Spend', value: `${formatCurrency(avgDailyForecast * unitCost)}/day`, delta: 'Mean of all 84 days', deltaTone: 'flat', sub: 'Consumption value moving through stock' },
      { label: '3. Week 12 Weekly Spend', value: formatCurrency(week12ProjectedMean * unitCost, 0), delta: `${trendPerWeek >= 0 ? '+' : ''}${formatNum(trendMagnitudePct, 2)}%/wk trend`, deltaTone: trendTone, sub: 'Final-week consumption value' },
      { label: '4. Spend Upside at Week 12', value: formatCurrency(dailyForecastSeries[forecastHorizonDays - 1].upperBand * 7 * unitCost, 0), delta: 'Upper planning envelope (Z = 1.65)', deltaTone: 'flat', sub: 'Worst-case weekly spend if demand runs high' },
    ],
  };
  const forecastTiles = forecastTilesByPersona[persona] || forecastTilesByPersona.planner;
  // Daily forecast chart and schedule: same 84-day series, with each persona's decision point marked and read in its own units.
  const crossDay = (threshold) => dailyForecastSeries.find((d) => d.cumulativeDemand >= threshold)?.day ?? null;
  const stockoutDay = crossDay(onHandQty);
  const safetyDay = crossDay(onHandQty - safetyStock);
  const ropDay = crossDay(onHandQty - reorderPoint);
  const orderByDay = stockoutDay ? stockoutDay - leadTimeDays : null;
  const left = (p) => onHandQty - p.cumulativeDemand;
  const cur0 = (v) => formatCurrency(v, 0);
  const CHART_COPY = {
    supervisor: { title: 'Daily Line Draw — Next 84 Days', sub: `Forecast daily consumption for ${selectedMaterial.id} against on-hand stock; the marker shows when cover runs out if no order arrives.`, marker: stockoutDay ? { day: stockoutDay, label: `✕ Cover runs out · Day ${stockoutDay}` } : null },
    warehouse: { title: 'Daily Outflow & Shelf Stock — Next 84 Days', sub: `Forecast issues from stores for ${selectedMaterial.id}; the marker shows when stock falls below the safety-stock floor.`, marker: belowReorderPoint && safetyDay === null ? null : safetyDay ? { day: safetyDay, label: `▼ Below safety stock · Day ${safetyDay}` } : null },
    planner: { title: 'Daily Demand vs Plan — Next 84 Days', sub: `Day-by-day multivariate demand for ${selectedMaterial.id}; the marker shows when on-hand stock reaches the reorder point.`, marker: belowReorderPoint ? { day: 1, label: '● Already below reorder point' } : ropDay ? { day: ropDay, label: `▼ Reorder point · Day ${ropDay}` } : null },
    procurement: { title: 'Daily Demand & Order-By Date — Next 84 Days', sub: `Forecast demand for ${selectedMaterial.id}; the marker is the latest day to place an order and still beat the ${leadTimeDays}-day lead time.`, marker: stockoutDay ? (orderByDay >= 1 ? { day: orderByDay, label: `✎ Order by · Day ${orderByDay}` } : { day: 1, label: '✎ Order now' }) : null },
    finance: { title: 'Daily Spend Outlook — Next 84 Days', sub: `Forecast consumption value for ${selectedMaterial.id} at ${formatCurrency(unitCost)}/${uom}; the shaded envelope is the high/low spend range.`, marker: null },
  };
  const chartCopy = CHART_COPY[persona] || CHART_COPY.planner;
  const INSPECTORS = {
    supervisor: (p) => [
      { label: 'Daily Draw', value: `${p.dailyMean.toFixed(2)} ${uom}/day`, strong: 'text-primary' },
      { label: 'Drawn So Far', value: `${p.cumulativeDemand.toFixed(1)} ${uom}` },
      { label: 'Stock Left (no resupply)', value: left(p) >= 0 ? `${left(p).toFixed(1)} ${uom}` : `Short by ${Math.abs(left(p)).toFixed(1)} ${uom}`, strong: left(p) >= 0 ? 'text-success' : 'text-error' },
    ],
    warehouse: (p) => [
      { label: 'Daily Outflow', value: `${p.dailyMean.toFixed(2)} ${uom}/day`, strong: 'text-primary' },
      { label: 'Shelf Stock Left', value: `${Math.max(left(p), 0).toFixed(1)} ${uom}` },
      { label: 'vs Safety Stock', value: `${left(p) - safetyStock >= 0 ? '+' : '−'}${Math.abs(left(p) - safetyStock).toFixed(1)} ${uom}`, strong: left(p) - safetyStock >= 0 ? 'text-success' : 'text-error' },
    ],
    planner: (p) => [
      { label: 'Daily Forecast', value: `${p.dailyMean.toFixed(2)} ${uom}/day`, strong: 'text-primary' },
      { label: 'Planning Envelope (Z=1.65)', value: `${p.lowerBand.toFixed(2)} – ${p.upperBand.toFixed(2)} ${uom}/d` },
      { label: 'On-Hand vs Reorder Point', value: `${left(p) - reorderPoint >= 0 ? '+' : '−'}${Math.abs(left(p) - reorderPoint).toFixed(1)} ${uom}`, strong: left(p) - reorderPoint >= 0 ? 'text-success' : 'text-error' },
    ],
    procurement: (p) => [
      { label: 'Daily Forecast', value: `${p.dailyMean.toFixed(2)} ${uom}/day`, strong: 'text-primary' },
      { label: 'Cumulative Demand', value: `${p.cumulativeDemand.toFixed(1)} ${uom}` },
      { label: 'Still to Source', value: `${Math.max(p.cumulativeDemand - onHandQty, 0).toFixed(1)} ${uom}`, strong: p.cumulativeDemand > onHandQty ? 'text-error' : 'text-success' },
    ],
    finance: (p) => [
      { label: 'Daily Spend', value: `${formatCurrency(p.dailyMean * unitCost)}/day`, strong: 'text-primary' },
      { label: 'Spend Range (Z=1.65)', value: `${cur0(p.lowerBand * unitCost)} – ${cur0(p.upperBand * unitCost)}/d` },
      { label: 'Cumulative Spend', value: cur0(p.cumulativeDemand * unitCost) },
    ],
  };
  const stockStatus = (p) => (left(p) >= 0 ? 'Covered' : 'Short');
  const SCHEDULE_COLS = {
    supervisor: [
      { head: `Daily Draw (${uom}/d)`, cell: (p) => formatNum(p.dailyMean, 2), foot: `Avg: ${formatNum(avgDailyForecast, 2)}`, strong: true },
      { head: `Drawn So Far (${uom})`, cell: (p) => formatNum(p.cumulativeDemand, 1), foot: `${formatNum(cumulativeHorizonDemand, 1)} ${uom}` },
      { head: `Stock Left, No Resupply (${uom})`, cell: (p) => formatNum(Math.max(left(p), 0), 1), foot: '' },
      { head: 'Cover', cell: stockStatus, foot: stockoutDay ? `Runs out Day ${stockoutDay}` : 'Covered', tone: (p) => (left(p) >= 0 ? 'text-success' : 'text-error') },
    ],
    warehouse: [
      { head: `Daily Outflow (${uom}/d)`, cell: (p) => formatNum(p.dailyMean, 2), foot: `Avg: ${formatNum(avgDailyForecast, 2)}`, strong: true },
      { head: `Outflow So Far (${uom})`, cell: (p) => formatNum(p.cumulativeDemand, 1), foot: `${formatNum(cumulativeHorizonDemand, 1)} ${uom}` },
      { head: `Shelf Stock Left (${uom})`, cell: (p) => formatNum(Math.max(left(p), 0), 1), foot: '' },
      { head: `vs Safety Stock (${uom})`, cell: (p) => `${left(p) - safetyStock >= 0 ? '+' : '−'}${formatNum(Math.abs(left(p) - safetyStock), 1)}`, foot: safetyDay ? `Below floor Day ${safetyDay}` : 'Above floor', tone: (p) => (left(p) - safetyStock >= 0 ? 'text-success' : 'text-error') },
    ],
    planner: [
      { head: `Daily Forecast (${uom}/d)`, cell: (p) => formatNum(p.dailyMean, 2), foot: `Avg: ${formatNum(avgDailyForecast, 2)}`, strong: true },
      { head: `Envelope Lower (${uom}/d)`, cell: (p) => formatNum(p.lowerBand, 2), foot: '', muted: true },
      { head: `Envelope Upper (${uom}/d)`, cell: (p) => formatNum(p.upperBand, 2), foot: '', muted: true },
      { head: `On-Hand vs ROP (${uom})`, cell: (p) => `${left(p) - reorderPoint >= 0 ? '+' : '−'}${formatNum(Math.abs(left(p) - reorderPoint), 1)}`, foot: belowReorderPoint ? 'Below ROP now' : ropDay ? `ROP Day ${ropDay}` : 'Above ROP', tone: (p) => (left(p) - reorderPoint >= 0 ? 'text-success' : 'text-error') },
    ],
    procurement: [
      { head: `Daily Forecast (${uom}/d)`, cell: (p) => formatNum(p.dailyMean, 2), foot: `Avg: ${formatNum(avgDailyForecast, 2)}`, strong: true },
      { head: `Cumulative Demand (${uom})`, cell: (p) => formatNum(p.cumulativeDemand, 1), foot: `${formatNum(cumulativeHorizonDemand, 1)} ${uom}` },
      { head: `Still to Source (${uom})`, cell: (p) => formatNum(Math.max(p.cumulativeDemand - onHandQty, 0), 1), foot: `${formatNum(Math.max(cumulativeHorizonDemand - onHandQty, 0), 1)} ${uom}`, tone: (p) => (p.cumulativeDemand > onHandQty ? 'text-error' : 'text-body-c') },
      { head: 'Order Window', cell: (p) => (orderByDay === null ? 'Not needed' : p.day < orderByDay ? 'Open' : p.day === orderByDay ? 'Order by today' : 'Late'), foot: orderByDay === null ? 'No order in horizon' : orderByDay >= 1 ? `Order by Day ${orderByDay}` : 'Order now', tone: (p) => (orderByDay !== null && p.day > orderByDay ? 'text-error' : 'text-body-c') },
    ],
    finance: [
      { head: 'Daily Spend ($/d)', cell: (p) => formatNum(p.dailyMean * unitCost, 2), foot: `Avg: ${formatNum(avgDailyForecast * unitCost, 2)}`, strong: true },
      { head: 'Spend Low ($/d)', cell: (p) => formatNum(p.lowerBand * unitCost, 2), foot: '', muted: true },
      { head: 'Spend High ($/d)', cell: (p) => formatNum(p.upperBand * unitCost, 2), foot: '', muted: true },
      { head: 'Cumulative Spend ($)', cell: (p) => formatNum(p.cumulativeDemand * unitCost, 0), foot: formatCurrency(cumulativeHorizonValue, 0), strong: true },
    ],
  };
  const scheduleCols = SCHEDULE_COLS[persona] || SCHEDULE_COLS.planner;
  const lens = PERSONA_LENS[persona] || PERSONA_LENS.supervisor;
  const personaTop = { [persona]: { label: lens.insightLabel, headline: lens.insightBody, kpis: lens.kpis } };

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
        subtitle={lens.headerSubtitle}
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

      <PersonaTop persona={persona} config={personaTop} />

      <MultivariateHeadline material={`${selectedMaterial.id} · ${name}`} persona={persona} />

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
      <AnimatePresence mode="wait">
        <motion.div
          key={persona}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="grid-4"
          style={{ marginBottom: 14 }}
        >
          {forecastTiles.map((tile) => (
            <KpiTile key={tile.label} {...tile} />
          ))}
        </motion.div>
      </AnimatePresence>

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
                {chartCopy.title}
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
              {chartCopy.sub}
            </p>
          </div>
          <div className="chart-legend mt-0 gap-3.5 flex-wrap shrink-0 text-xs">
            <span><span className="legend-dot" style={{ background: 'var(--subtle)' }} />Historical Actual Demand (56 Days)</span>
            <span><span className="legend-dot" style={{ background: 'var(--primary)', height: 4, width: 14, borderRadius: 2 }} />Daily Forecast Trajectory (84 Days)</span>
            <span><span className="legend-dot" style={{ background: 'var(--border)', border: '1px dashed var(--primary)' }} />Planning Envelope (Z=1.65)</span>
            <span><span className="legend-dot" style={{ background: 'var(--warning)' }} />▲ Supplier Lead-Time Arrival (+{leadTimeDays}d)</span>
            {chartCopy.marker && <span><span className="legend-dot" style={{ background: 'var(--error)' }} />{chartCopy.marker.label.split(' ·')[0]}</span>}
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
            inspector={INSPECTORS[persona]}
            marker={chartCopy.marker}
          />
        </div>

        {/* Persona-Specific Graph Trajectory Interpretation Strip */}
        <AnimatePresence mode="wait">
          <motion.div
            key={persona}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="grid-4 mt-3.5 pt-3 border-t border-border text-xs"
          >
            {lens.graphStrip.map((item) => (
              <div key={item.heading}>
                <div className="text-xs font-bold uppercase text-subtle mb-1">{item.heading}</div>
                <div className="text-ink ">{item.body}</div>
              </div>
            ))}
          </motion.div>
        </AnimatePresence>

        <div className="mt-3 pt-2.5 border-t border-border flex flex-wrap justify-between items-start gap-2">
          <span className="text-xs text-subtle flex-1 min-w-0">
            <strong>{lens.scopeNoteLabel}</strong> {lens.scopeNoteBody}
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
                    {scheduleCols.map((c) => (
                      <TableHead key={c.head} className="text-right whitespace-nowrap">{c.head}</TableHead>
                    ))}
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
                      {scheduleCols.map((c) => (
                        <TableCell
                          key={c.head}
                          className={`text-right font-mono text-xs ${c.tone ? c.tone(p) : c.muted ? 'text-subtle' : c.strong ? 'font-semibold text-ink' : 'text-body-c'} ${p.day % 7 === 0 || p.day === 84 ? 'font-bold' : ''}`}
                        >
                          {c.cell(p)}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
                <TableFooter>
                  <TableRow className="bg-[color-mix(in_srgb,var(--muted-fill)_80%,transparent)] border-t-2 border-border-strong font-semibold text-xs">
                    <TableCell colSpan={4}>84-Day Totals (Verification)</TableCell>
                    {scheduleCols.map((c) => (
                      <TableCell key={c.head} className="text-right text-primary font-mono">{c.foot}</TableCell>
                    ))}
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
      {/* ==================================================================== */}
      {/* F. PERSONA-SPECIFIC DEEP-DIVE                                        */}
      {/* ==================================================================== */}
      {persona === 'finance' ? (
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
      ) : (
        renderOperationalGrid(lens.deepDive)
      )}

      <ModelValidation modelR2={modelR2} rmse={rmse} avgWeekly={avgWeekly} persona={persona} />

      {/* ==================================================================== */}
      {/* G. PERSONA-SPECIFIC STRATEGIC INTELLIGENCE LENSES                    */}
      {/* ==================================================================== */}
      {/* ==================================================================== */}
      {/* H. PERSONA-SPECIFIC WHY DISCLOSURE                                   */}
      {/* ==================================================================== */}
      <div className="card mb-4">
        <h2 className="card__title mb-3">{lens.whyHeading}</h2>
        <WhyDisclosure
          defaultOpen
          summary={lens.whySummary}
          drivers={lens.whyDrivers}
          meaning={lens.whyMeaning}
          action={lens.whyAction}
        />
      </div>

      {/* ==================================================================== */}
      {/* I. PERSONA-AWARE DOWNSTREAM WORKFLOW & HANDOFF                       */}
      {/* ==================================================================== */}
      <div className="card">
        <div className="card__head mb-3">
          <div>
            <h2 className="card__title">Analytical Workflow & Downstream Handoff</h2>
            <p className="card__sub">
              {lens.handoffBody}
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
