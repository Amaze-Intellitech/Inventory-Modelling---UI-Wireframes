import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ViewHead, KpiTile, WhyDisclosure, Badge } from '../../components/CommonUI';
import { EoqCurveChart } from '../../components/Charts';
import { usePlatform } from '../../context/PlatformContext';
import { EOQ_INPUTS } from '../../data/mockData';

const ORDERING_COST = 230.0; // S = $230.00/order (constant across all materials)
const HOLDING_RATE = 0.06;   // 6.00% annual carrying rate

export default function EoqCalibration() {
  const navigate = useNavigate();
  const { persona, selectedMaterial } = usePlatform();

  const materialInputs = EOQ_INPUTS[selectedMaterial?.id] || { demand: 4800, currentBatchQty: 600 };
  const demand = materialInputs.demand;
  const currentBatchQty = materialInputs.currentBatchQty;
  const unitCost = selectedMaterial?.unitCost ?? 600.0;
  const uom = selectedMaterial?.uom || 'EA';
  const abcClass = selectedMaterial?.abcClass || 'A';

  // Canonical formula calculations
  const holdingCostPerUnit = HOLDING_RATE * unitCost; // H = 0.06 * unitCost
  const qStar = Math.sqrt((2 * demand * ORDERING_COST) / holdingCostPerUnit); // Q* = √(2DS/H)

  // Current Policy metrics (at Qcurrent)
  const currentOrderFreq = demand / currentBatchQty;
  const currentOrderCost = (demand / currentBatchQty) * ORDERING_COST;
  const currentHoldCost = (currentBatchQty / 2) * holdingCostPerUnit;
  const currentTotalCost = currentOrderCost + currentHoldCost;
  const currentBatchValue = currentBatchQty * unitCost;

  // Recommended EOQ metrics (at Q*)
  const recOrderFreq = demand / qStar;
  const recOrderCost = (demand / qStar) * ORDERING_COST;
  const recHoldCost = (qStar / 2) * holdingCostPerUnit;
  const recTotalCost = recOrderCost + recHoldCost;
  const recBatchValue = qStar * unitCost;

  // Policy Delta & KPI metrics
  const netAnnualSavings = currentTotalCost - recTotalCost;
  const netSavingsPercent = (netAnnualSavings / currentTotalCost) * 100;
  const workingCapitalReleased = ((currentBatchQty / 2) - (qStar / 2)) * unitCost;
  const desiredStockQty = 1.5 * qStar;
  const desiredStockValue = desiredStockQty * unitCost;

  const formatNum = (val) =>
    val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const formatCurrency = (val) =>
    `$${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <section className="view">
      <ViewHead
        title="EOQ Calibration"
        subtitle={<p>Balances ordering cost against holding cost to find the batch size that minimizes total policy cost for the selected material.</p>}
        actions={<button type="button" className="btn btn-primary" onClick={() => navigate('/app/rmlc')}>Analyze RMLC Lifecycle</button>}
      />

      <div className="card__head" style={{ marginBottom: 14 }}>
        <span style={{ fontWeight: 600 }}>
          {selectedMaterial.id} · {selectedMaterial.name} — {selectedMaterial.plant}
        </span>
        <Badge tone={abcClass === 'A' ? 'accent' : 'neutral'}>
          Class {abcClass} material
        </Badge>
      </div>

      <div className="grid-2">
        <div className="card">
          <Badge>Current policy</Badge>
          <h2 className="card__title" style={{ marginTop: 8 }}>
            Batch size: {formatNum(currentBatchQty)} {uom} ({formatCurrency(currentBatchValue)} value)
          </h2>
          <table style={{ marginTop: 10 }}>
            <tbody>
              <tr><td>Order frequency</td><td className="num text-right">{formatNum(currentOrderFreq)} orders/yr</td></tr>
              <tr><td>Annual ordering cost</td><td className="num text-right">{formatCurrency(currentOrderCost)}</td></tr>
              <tr><td>Annual holding cost</td><td className="num text-right" style={{ color: 'var(--risk)' }}>{formatCurrency(currentHoldCost)}</td></tr>
              <tr><td className="font-semibold">Total policy cost</td><td className="num text-right font-semibold" style={{ color: 'var(--risk)' }}>{formatCurrency(currentTotalCost)}</td></tr>
            </tbody>
          </table>
        </div>
        <div className="card" style={{ borderColor: '#BFE6F8', background: '#FBFEFF' }}>
          <Badge tone="accent">Recommended EOQ</Badge>
          <h2 className="card__title" style={{ marginTop: 8 }}>
            Batch size: {formatNum(qStar)} {uom} ({formatCurrency(recBatchValue)} value)
          </h2>
          <table style={{ marginTop: 10 }}>
            <tbody>
              <tr><td>Order frequency</td><td className="num text-right">{formatNum(recOrderFreq)} orders/yr</td></tr>
              <tr><td>Annual ordering cost</td><td className="num text-right">{formatCurrency(recOrderCost)}</td></tr>
              <tr><td>Annual holding cost</td><td className="num text-right" style={{ color: 'var(--success)' }}>{formatCurrency(recHoldCost)}</td></tr>
              <tr><td className="font-semibold">Total policy cost</td><td className="num text-right font-semibold" style={{ color: 'var(--success)' }}>{formatCurrency(recTotalCost)}</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid-3">
        <KpiTile
          label="Net Annual Savings"
          value={formatCurrency(netAnnualSavings)}
          valueStyle={{ color: 'var(--success)' }}
          sub={`${formatNum(netSavingsPercent)}% lower policy cost`}
        />
        <KpiTile
          label="Working Capital Released"
          value={formatCurrency(workingCapitalReleased)}
          valueStyle={{ color: 'var(--accent)' }}
          sub="One-time, on first cycle transition"
        />
        <KpiTile
          label="Desired Stock Level"
          value={`${formatNum(desiredStockQty)} ${uom}`}
          sub={`${formatCurrency(desiredStockValue)} value · Cycle stock + safety stock at 95.00% service target`}
        />
      </div>

      <div className="card">
        <div className="card__head"><div><h2 className="card__title">Total cost curve</h2><p className="card__sub">Ordering cost falls, holding cost rises — EOQ sits at the minimum of their sum</p></div></div>
        <div className="chart-shell">
          <EoqCurveChart
            demand={demand}
            orderingCost={ORDERING_COST}
            holdingCostPerUnit={holdingCostPerUnit}
            uom={uom}
          />
        </div>
        {persona === 'ds' && (
          <p className="footnote">
            Q* = √(2·D·S / H) — D = {formatNum(demand)} {uom}/yr, S = {formatCurrency(ORDERING_COST)}/order, H = {formatCurrency(holdingCostPerUnit)}/{uom}/yr
          </p>
        )}
      </div>

      <div className="card">
        <h2 className="card__title">Why EOQ shifted from {formatNum(currentBatchQty)} to {formatNum(qStar)} {uom}</h2>
        <WhyDisclosure
          defaultOpen
          summary="Driver breakdown"
          drivers={[
            `Annual demand re-based to ${formatNum(demand)} ${uom} (${formatCurrency(demand * unitCost)} annual value for ${selectedMaterial.id})`,
            `Ordering cost ${formatCurrency(ORDERING_COST)}/order (EDI-automated replenishment)`,
            `Holding cost ${formatCurrency(holdingCostPerUnit)}/${uom}/yr (6.00% carrying rate on ${formatCurrency(unitCost)} unit cost)`,
          ]}
          meaning={[
            `Ordering frequency shifts from ${formatNum(currentOrderFreq)} to ${formatNum(recOrderFreq)} orders per year`,
            `Average cycle stock falls from ${formatNum(currentBatchQty / 2)} ${uom} (${formatCurrency((currentBatchQty / 2) * unitCost)}) to ${formatNum(qStar / 2)} ${uom} (${formatCurrency((qStar / 2) * unitCost)})`,
          ]}
          action={[
            `Confirm EDI can absorb the calibrated order frequency of ${formatNum(recOrderFreq)} orders/yr`,
            `Update ERP replenishment lot sizing for ${selectedMaterial.id} to ${formatNum(qStar)} ${uom}`,
          ]}
        />
        <div style={{ marginTop: 12 }}>
          <button type="button" className="btn btn-sm" onClick={() => navigate('/app/what-if')}>Stress-test in What-If</button>{' '}
          <button type="button" className="btn btn-sm" onClick={() => navigate('/app/optimization')}>View Optimization Plan</button>
        </div>
      </div>
    </section>
  );
}

