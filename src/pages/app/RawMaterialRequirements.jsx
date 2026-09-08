import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ViewHead, KpiTile, WhyDisclosure, Badge } from '../../components/CommonUI';
import { ForecastChart } from '../../components/Charts';
import { usePlatform } from '../../context/PlatformContext';
import { EOQ_INPUTS, FORECAST_INPUTS } from '../../data/mockData';

const Z = 1.65; // Service factor for 95.00% target

export default function RawMaterialRequirements() {
  const navigate = useNavigate();
  const { persona, selectedMaterial } = usePlatform();

  const materialId = selectedMaterial?.id || 'MAT-1082';
  const eoqInput = EOQ_INPUTS[materialId] || { demand: 4800, currentBatchQty: 600 };
  const forecastInput = FORECAST_INPUTS[materialId] || {
    leadTimeDays: 60,
    demandCV: 0.12,
    trendPerWeek: 0.002,
    modelR2: 0.91,
    rmseRatio: 0.09,
  };

  const demand = eoqInput.demand;
  const unitCost = selectedMaterial?.unitCost ?? 600.0;
  const onHandQty = selectedMaterial?.qty ?? 930.0;
  const uom = selectedMaterial?.uom || 'EA';
  const abcClass = selectedMaterial?.abcClass || 'A';

  const { leadTimeDays, demandCV, trendPerWeek, modelR2, rmseRatio } = forecastInput;

  // Canonical formula calculations
  const avgDaily = demand / 365;
  const avgWeekly = demand / 52;
  const daysOfSupply = onHandQty / avgDaily;
  const sigma_d = avgDaily * demandCV;
  const safetyStock = Z * sigma_d * Math.sqrt(leadTimeDays);
  const leadTimeDemand = avgDaily * leadTimeDays;
  const reorderPoint = leadTimeDemand + safetyStock;
  const belowReorderPoint = onHandQty < reorderPoint;

  const rmse = rmseRatio * avgWeekly;

  const formatNum = (val) =>
    val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const formatCurrency = (val) =>
    `$${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <section className="view">
      <ViewHead
        title="Multivariate Forecast"
        subtitle={<p>Forecasts {selectedMaterial.id}'s future consumption requirement using historical demand velocity, statistical trend, and lead-time exposure.</p>}
        actions={<button type="button" className="btn btn-primary" onClick={() => navigate('/app/optimization')}>View Optimization Plan</button>}
      />

      <div className="card__head" style={{ marginBottom: 14 }}>
        <span style={{ fontWeight: 600 }}>
          {selectedMaterial.id} · {selectedMaterial.name} — {selectedMaterial.plant}
        </span>
        <Badge tone={abcClass === 'A' ? 'accent' : 'neutral'}>
          Class {abcClass} material
        </Badge>
      </div>

      <div className="grid-3">
        <KpiTile
          label="Days of Supply & Reorder Status"
          value={`${formatNum(daysOfSupply)} Days`}
          valueStyle={{ color: belowReorderPoint ? 'var(--risk)' : 'var(--success)' }}
          delta={belowReorderPoint ? `BELOW REORDER POINT (${formatNum(reorderPoint)} ${uom})` : `ABOVE REORDER POINT (${formatNum(reorderPoint)} ${uom})`}
          deltaTone={belowReorderPoint ? 'down' : 'up'}
          sub={
            belowReorderPoint
              ? `Stockout risk inside ${formatNum(leadTimeDays)}d lead time · On-hand ${formatNum(onHandQty)} ${uom} < Reorder Point ${formatNum(reorderPoint)} ${uom}`
              : `Sufficient buffer across ${formatNum(leadTimeDays)}d lead time · On-hand ${formatNum(onHandQty)} ${uom} ≥ Reorder Point ${formatNum(reorderPoint)} ${uom}`
          }
        />
        <KpiTile
          label="Demand Trajectory (Statistical Trend)"
          value={`${trendPerWeek > 0 ? '+' : ''}${formatNum(trendPerWeek * 100)}%/wk`}
          valueStyle={{ color: Math.abs(trendPerWeek) >= 0.003 ? 'var(--accent)' : 'var(--text)' }}
          delta={
            trendPerWeek >= 0.003
              ? 'Ramping demand'
              : trendPerWeek <= -0.003
              ? 'Declining demand'
              : 'Stable steady-state'
          }
          deltaTone={
            trendPerWeek >= 0.003
              ? 'up'
              : trendPerWeek <= -0.003
              ? 'down'
              : 'flat'
          }
          sub={
            Math.abs(trendPerWeek) >= 0.003
              ? `${trendPerWeek > 0 ? 'Expansion' : 'Contraction'} of ${formatNum(Math.abs(trendPerWeek) * 100)}%/wk compounding demand over the 12-week forecast horizon`
              : `Stable consumption velocity (|trend| < 0.30%/wk) with consistent baseline demand of ${formatNum(avgWeekly)} ${uom}/wk`
          }
        />
        <KpiTile
          label="Forecast Reliability (Model Fit & Uncertainty)"
          value={`R² = ${formatNum(modelR2)}`}
          valueStyle={{ color: modelR2 >= 0.90 ? 'var(--success)' : modelR2 >= 0.80 ? 'var(--accent)' : 'var(--watch)' }}
          delta={`CV ${(demandCV * 100).toFixed(1)}% · RMSE ${formatNum(rmse)} ${uom}/wk`}
          deltaTone={modelR2 >= 0.85 ? 'up' : 'flat'}
          sub={
            modelR2 < 0.85
              ? `Higher demand variance (CV ${(demandCV * 100).toFixed(1)}%) widens the 95% confidence interval on the chart, requiring ${formatNum(safetyStock)} ${uom} safety stock`
              : `High explanatory power (R² ${formatNum(modelR2)}) produces a tight confidence band on the chart, holding safety stock to ${formatNum(safetyStock)} ${uom}`
          }
        />
      </div>

      <div className="card">
        <div className="card__head">
          <div>
            <h2 className="card__title">16-Week Historical Demand vs 12-Week Multivariate Forecast</h2>
            <p className="card__sub">
              Lag-1/7/30 Ridge regression with 95.00% confidence band (Z = 1.65) and supplier replenishment lead-time marker
            </p>
          </div>
          <div className="chart-legend" style={{ marginTop: 0 }}>
            <span><span className="legend-dot" style={{ background: '#0EA5E9' }} />● Historical Actuals</span>
            <span><span className="legend-dot" style={{ background: '#0C7EBE' }} />-- Projected Mean</span>
            <span><span className="legend-dot" style={{ background: '#BFE6F8' }} />■ 95% Confidence Band</span>
            <span><span className="legend-dot" style={{ background: '#B7791F' }} />▲ Replenishment Horizon ({leadTimeDays}d)</span>
          </div>
        </div>
        <div className="chart-shell">
          <ForecastChart
            weeklyMean={avgWeekly}
            trendPerWeek={trendPerWeek}
            cv={demandCV}
            leadTimeDays={leadTimeDays}
            uom={uom}
          />
        </div>
        {persona === 'ds' && (
          <p className="footnote">
            Model: Ridge regression (α=1.0) over lag-1, lag-7, and lag-30 features with Standard Normal Variate (SNV) input normalization · R² = {formatNum(modelR2)} · RMSE = {formatNum(rmse)} {uom}/wk ({(rmseRatio * 100).toFixed(2)}% of mean) · Training window: 104 weeks
          </p>
        )}
      </div>

      <div className="card">
        <h2 className="card__title">
          Why {selectedMaterial.id} {belowReorderPoint ? `is ${formatNum(reorderPoint - onHandQty)} ${uom} below reorder point` : `is ${formatNum(onHandQty - reorderPoint)} ${uom} above reorder point`}
        </h2>
        <WhyDisclosure
          defaultOpen
          summary="Forecast drivers, inventory risk exposure, and replenishment recommendation"
          drivers={[
            `Average consumption velocity is ${formatNum(avgDaily)} ${uom}/day (${formatNum(avgWeekly)} ${uom}/wk across trailing 104 weeks)`,
            `Supplier lead time is ${formatNum(leadTimeDays)} days (${(leadTimeDays / 7).toFixed(1)} weeks), requiring ${formatNum(leadTimeDemand)} ${uom} expected lead-time demand`,
            `Safety stock sized at ${formatNum(safetyStock)} ${uom} for 95.00% service level target (Z = 1.65, CV = ${(demandCV * 100).toFixed(1)}%)`,
          ]}
          meaning={[
            `Calibrated reorder point is ${formatNum(reorderPoint)} ${uom} (${formatNum(leadTimeDemand)} ${uom} lead-time demand + ${formatNum(safetyStock)} ${uom} safety stock)`,
            belowReorderPoint
              ? `Current on-hand stock of ${formatNum(onHandQty)} ${uom} (${formatCurrency(onHandQty * unitCost)}) provides ${formatNum(daysOfSupply)} days of supply — falling below the ${formatNum(leadTimeDays)}-day replenishment horizon by ${formatNum(reorderPoint - onHandQty)} ${uom}`
              : `Current on-hand stock of ${formatNum(onHandQty)} ${uom} (${formatCurrency(onHandQty * unitCost)}) provides ${formatNum(daysOfSupply)} days of supply — safely buffering the ${formatNum(leadTimeDays)}-day replenishment lead time`,
          ]}
          action={
            belowReorderPoint
              ? [
                  `Place an expedited replenishment purchase order for at least ${formatNum(reorderPoint - onHandQty)} ${uom} (${formatCurrency((reorderPoint - onHandQty) * unitCost)}) to prevent stockout before supplier delivery`,
                  `Proceed to Optimization Plan to evaluate batch sizing and multi-echelon order schedules`,
                ]
              : [
                  `No immediate purchase order required for ${selectedMaterial.id} in the current replenishment cycle`,
                  `Continue monitoring weekly consumption signals and review safety buffer thresholds in Optimization Plan`,
                ]
          }
        />
        <div style={{ marginTop: 12 }}>
          <button type="button" className="btn btn-sm" onClick={() => navigate('/app/eoq')}>View EOQ Calibration</button>{' '}
          <button type="button" className="btn btn-sm" onClick={() => navigate('/app/optimization')}>Proceed to Optimization Plan</button>
        </div>
      </div>
    </section>
  );
}
