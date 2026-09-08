import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ViewHead, KpiTile, WhyDisclosure, Badge, Insight } from '../../components/CommonUI';
import { EoqCurveChart } from '../../components/Charts';
import { usePlatform } from '../../context/PlatformContext';
import { EOQ_INPUTS, FORECAST_INPUTS } from '../../data/mockData';

const ORDERING_COST = 230.0; // S = $230.00/order (fixed EDI-automated replenishment cost)
const HOLDING_RATE = 0.06;   // i = 6.00% annual carrying rate

// Context tags and metadata aligned with canonical catalog
const MATERIAL_METADATA = {
  'MAT-1082': {
    supplier: 'HydraTech Dynamics GmbH (Sole Source)',
    leadTimeDays: 60,
    contextTag: 'Class A · High Value · Sole Source Supply',
  },
  'MAT-4120': {
    supplier: 'SiliconFoundry International (Allocated Supply)',
    leadTimeDays: 60,
    contextTag: 'Class A · High Volatility · Allocated Latency',
  },
  'MAT-2041': {
    supplier: 'Apex Energy Storage Ltd (Dual Sourced)',
    leadTimeDays: 30,
    contextTag: 'Class A · High Velocity · Dual Sourced Feed',
  },
  'MAT-5501': {
    supplier: 'BondTech Polymer Solutions (Multi-Vendor)',
    leadTimeDays: 21,
    contextTag: 'Class C · Consumable · Shelf-Life Sensitive',
  },
};

export default function EoqCalibration() {
  const navigate = useNavigate();
  const { persona, selectedMaterial } = usePlatform();

  // Canonical material resolution
  const materialId = selectedMaterial?.id || 'MAT-1082';
  const materialInputs = EOQ_INPUTS[materialId] || { demand: 4800.0, currentBatchQty: 600.0 };
  const forecastInputs = FORECAST_INPUTS[materialId] || { leadTimeDays: 60, demandCV: 0.12 };
  const meta = MATERIAL_METADATA[materialId] || {
    supplier: 'Standard Supplier',
    leadTimeDays: forecastInputs.leadTimeDays || 30,
    contextTag: `Class ${selectedMaterial?.abcClass || 'A'} Raw Material`,
  };

  // Primary physical & financial parameters
  const demand = materialInputs.demand; // Physical Annual Demand (D) in UOM/yr
  const currentBatchQty = materialInputs.currentBatchQty; // Current ERP lot size (Q_curr) in UOM
  const unitCost = selectedMaterial?.unitCost ?? 600.0; // Standard unit cost in $/UOM
  const onHandQty = selectedMaterial?.qty ?? 930.0; // Physical on-hand stock in UOM
  const onHandValue = selectedMaterial?.value ?? (onHandQty * unitCost); // Physical on-hand value in $
  const uom = selectedMaterial?.uom || 'EA';
  const abcClass = selectedMaterial?.abcClass || 'A';
  const plant = selectedMaterial?.plant || 'Plant 1';
  const category = selectedMaterial?.category || 'Components';
  const name = selectedMaterial?.name || 'Raw Material';
  const leadTimeDays = forecastInputs.leadTimeDays || meta.leadTimeDays || 30;
  const annualConsumptionValue = demand * unitCost; // Annual Consumption Value ($/yr)

  // ============================================================================
  // VALIDATED EOQ MATHEMATICS & RECONCILIATION
  // ============================================================================
  // Annual holding cost per unit per year: H = i * unitCost
  const holdingCostPerUnit = HOLDING_RATE * unitCost;
  // Optimal Economic Order Quantity: Q* = √(2DS/H)
  const qStar = Math.sqrt((2 * demand * ORDERING_COST) / holdingCostPerUnit);

  // Current Policy metrics (at Q_curr)
  const currentOrderFreq = demand / currentBatchQty; // orders/yr
  const currentOrderCost = currentOrderFreq * ORDERING_COST; // (D / Q_curr) * S
  const currentHoldCost = (currentBatchQty / 2) * holdingCostPerUnit; // (Q_curr / 2) * H
  const currentTotalCost = currentOrderCost + currentHoldCost; // Total Relevant Cost
  const currentBatchValue = currentBatchQty * unitCost; // Spend per batch
  const currentCycleStockQty = currentBatchQty / 2; // Average cycle stock in UOM
  const currentCycleStockValue = currentCycleStockQty * unitCost; // Average cycle stock value in $
  const currentDaysOfSupply = (currentBatchQty / demand) * 365; // Days of supply per batch
  const currentOrderIntervalDays = 365 / currentOrderFreq; // Average days between orders

  // Recommended EOQ Policy metrics (at Q*)
  const recOrderFreq = demand / qStar; // orders/yr
  const recOrderCost = recOrderFreq * ORDERING_COST; // (D / Q*) * S
  const recHoldCost = (qStar / 2) * holdingCostPerUnit; // (Q* / 2) * H
  const recTotalCost = recOrderCost + recHoldCost; // Total Relevant Cost (at Q*, recOrderCost === recHoldCost)
  const recBatchValue = qStar * unitCost; // Spend per batch
  const recCycleStockQty = qStar / 2; // Average cycle stock in UOM
  const recCycleStockValue = recCycleStockQty * unitCost; // Average cycle stock value in $
  const recDaysOfSupply = (qStar / demand) * 365; // Days of supply per batch
  const recOrderIntervalDays = 365 / recOrderFreq; // Average days between orders

  // Policy Deltas & Variances
  const batchQtyDelta = qStar - currentBatchQty;
  const batchQtyDeltaPct = (batchQtyDelta / currentBatchQty) * 100;
  const netAnnualSavings = currentTotalCost - recTotalCost;
  const netSavingsPercent = currentTotalCost > 0 ? (netAnnualSavings / currentTotalCost) * 100 : 0;
  const workingCapitalReleased = (currentCycleStockQty - recCycleStockQty) * unitCost;
  const holdingCostDelta = currentHoldCost - recHoldCost;
  const orderCostDelta = recOrderCost - currentOrderCost;

  // Planning Buffer Assumption (1.0x cycle peak + 0.5x safety buffer = 1.5x Q*)
  const desiredStockQty = 1.5 * qStar;
  const desiredStockValue = desiredStockQty * unitCost;

  // Formatting utilities
  const formatNum = (val, decimals = 2) =>
    val.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  const formatCurrency = (val, decimals = 2) =>
    `$${val.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`;

  return (
    <section className="view">
      {/* ==================================================================== */}
      {/* 1. VIEW HEADER WITH DYNAMIC CANONICAL RM HANDOFF                     */}
      {/* ==================================================================== */}
      <ViewHead
        title="EOQ Calibration"
        subtitle={
          <p>
            Balances fixed replenishment ordering cost ({formatCurrency(ORDERING_COST)}/order) against annual carrying cost ({formatNum(HOLDING_RATE * 100)}%/yr) to determine the total-cost-minimizing batch size for <strong>{selectedMaterial.id}</strong>.
          </p>
        }
        actions={
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => navigate('/app/rmlc')}
          >
            Continue to RMLC for {selectedMaterial.id}
          </button>
        }
      />

      {/* ==================================================================== */}
      {/* 2. CANONICAL SELECTED RAW MATERIAL CONTEXT & PARAMETER BASELINE      */}
      {/* ==================================================================== */}
      <div className="card">
        <div className="card__head" style={{ marginBottom: 14 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <h2 className="card__title" style={{ fontSize: 16, margin: 0 }}>
                {selectedMaterial.id} · {name}
              </h2>
              <Badge tone={abcClass === 'A' ? 'accent' : 'neutral'}>
                {meta.contextTag}
              </Badge>
            </div>
            <p className="card__sub">
              Selected Raw Material · {plant} · Category: <strong>{category}</strong> · Supplier: <strong>{meta.supplier}</strong> · Lead Time: <strong>{leadTimeDays} days</strong>
            </p>
          </div>
          <Badge tone={abcClass === 'A' ? 'accent' : 'neutral'}>
            Class {abcClass} Material
          </Badge>
        </div>

        <div className="grid-4" style={{ marginBottom: 0 }}>
          <KpiTile
            label="Physical Annual Demand (D)"
            value={`${formatNum(demand, 0)} ${uom}/yr`}
            sub={`${formatCurrency(annualConsumptionValue)} annual consumption value`}
          />
          <KpiTile
            label="Unit Standard Cost & Holding Rate"
            value={formatCurrency(unitCost)}
            sub={`H = ${formatCurrency(holdingCostPerUnit)}/${uom}/yr (${formatNum(HOLDING_RATE * 100)}% annual carrying rate)`}
          />
          <KpiTile
            label="Fixed Ordering Cost (S)"
            value={formatCurrency(ORDERING_COST)}
            sub="EDI-automated replenishment transaction cost / order"
          />
          <KpiTile
            label="Physical On-Hand Inventory"
            value={`${formatNum(onHandQty, 0)} ${uom}`}
            sub={`${formatCurrency(onHandValue)} carrying value (${leadTimeDays}d supplier LT)`}
          />
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 3. CORE ECONOMIC IMPACT & POLICY DECISION KPI TILES                  */}
      {/* ==================================================================== */}
      <div className="grid-4">
        <KpiTile
          label="Net Annual Policy Savings"
          value={formatCurrency(netAnnualSavings)}
          valueStyle={{ color: 'var(--success)' }}
          delta={`${formatNum(netSavingsPercent)}% lower policy cost`}
          deltaTone="up"
          sub="Minimizes trade-off between ordering & holding costs"
        />
        <KpiTile
          label="Estimated Average Cycle-Stock Capital Release"
          value={formatCurrency(workingCapitalReleased)}
          valueStyle={{ color: 'var(--accent)' }}
          delta={`${formatNum(currentCycleStockQty - recCycleStockQty, 0)} ${uom} cycle stock`}
          deltaTone="up"
          sub="Estimated working-capital opportunity from average cycle-stock reduction"
        />
        <KpiTile
          label="Calibrated Batch Size Shift"
          value={`${formatNum(qStar)} ${uom}`}
          delta={`${batchQtyDelta >= 0 ? '+' : ''}${formatNum(batchQtyDeltaPct)}% vs current batch`}
          deltaTone={batchQtyDelta <= 0 ? 'down' : 'up'}
          sub={`Shift from ${formatNum(currentBatchQty, 0)} ${uom} ERP baseline lot size`}
        />
        <KpiTile
          label="Replenishment Frequency Cadence"
          value={`${formatNum(recOrderFreq)} orders/yr`}
          delta={`Every ~${formatNum(recOrderIntervalDays, 0)} days`}
          deltaTone="flat"
          sub={`vs current ${formatNum(currentOrderFreq)} orders/yr (every ~${formatNum(currentOrderIntervalDays, 0)} days)`}
        />
      </div>

      {/* ==================================================================== */}
      {/* 4. CURRENT ERP POLICY VS RECOMMENDED EOQ (DECISION COMPARISON)       */}
      {/* ==================================================================== */}
      <div className="grid-2">
        {/* Current ERP Policy Card */}
        <div className="card">
          <div className="card__head" style={{ marginBottom: 10 }}>
            <div>
              <Badge tone="neutral">Current ERP Policy</Badge>
              <h2 className="card__title" style={{ marginTop: 8 }}>
                Batch Size: {formatNum(currentBatchQty)} {uom}
              </h2>
              <p className="card__sub">
                Spend per order: {formatCurrency(currentBatchValue)} · {formatNum(currentDaysOfSupply, 1)} days of supply per batch
              </p>
            </div>
          </div>
          <div className="table-wrap">
            <table>
              <tbody>
                <tr>
                  <td>Replenishment Order Frequency</td>
                  <td className="num text-right font-semibold">{formatNum(currentOrderFreq)} orders/yr</td>
                </tr>
                <tr>
                  <td>Replenishment Interval (Cadence)</td>
                  <td className="num text-right">Every ~{formatNum(currentOrderIntervalDays, 0)} days</td>
                </tr>
                <tr>
                  <td>Average Cycle Inventory (Q/2)</td>
                  <td className="num text-right">{formatNum(currentCycleStockQty)} {uom} ({formatCurrency(currentCycleStockValue)})</td>
                </tr>
                <tr>
                  <td>Annual Ordering Cost (D/Q × S)</td>
                  <td className="num text-right">{formatCurrency(currentOrderCost)}</td>
                </tr>
                <tr>
                  <td>Annual Holding Cost (Q/2 × H)</td>
                  <td className="num text-right" style={{ color: 'var(--risk)' }}>
                    {formatCurrency(currentHoldCost)}
                  </td>
                </tr>
                <tr style={{ borderTop: '2px solid var(--line-strong)', fontWeight: 700 }}>
                  <td>Total Relevant Annual Cost</td>
                  <td className="num text-right font-semibold" style={{ color: 'var(--risk)' }}>
                    {formatCurrency(currentTotalCost)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="footnote" style={{ marginTop: 10 }}>
            Current policy over-indexes on holding inventory ({formatCurrency(currentHoldCost)}/yr holding vs {formatCurrency(currentOrderCost)}/yr ordering), tying up excess capital in cycle stock.
          </p>
        </div>

        {/* Recommended EOQ Policy Card */}
        <div className="card" style={{ borderColor: '#BFE6F8', background: '#FBFEFF' }}>
          <div className="card__head" style={{ marginBottom: 10 }}>
            <div>
              <Badge tone="accent">Calibrated Optimal EOQ</Badge>
              <h2 className="card__title" style={{ marginTop: 8 }}>
                Batch Size: {formatNum(qStar)} {uom}
              </h2>
              <p className="card__sub">
                Spend per order: {formatCurrency(recBatchValue)} · {formatNum(recDaysOfSupply, 1)} days of supply per batch
              </p>
            </div>
          </div>
          <div className="table-wrap">
            <table>
              <tbody>
                <tr>
                  <td>Replenishment Order Frequency</td>
                  <td className="num text-right font-semibold">{formatNum(recOrderFreq)} orders/yr</td>
                </tr>
                <tr>
                  <td>Replenishment Interval (Cadence)</td>
                  <td className="num text-right">Every ~{formatNum(recOrderIntervalDays, 0)} days</td>
                </tr>
                <tr>
                  <td>Average Cycle Inventory (Q/2)</td>
                  <td className="num text-right">{formatNum(recCycleStockQty)} {uom} ({formatCurrency(recCycleStockValue)})</td>
                </tr>
                <tr>
                  <td>Annual Ordering Cost (D/Q × S)</td>
                  <td className="num text-right">{formatCurrency(recOrderCost)}</td>
                </tr>
                <tr>
                  <td>Annual Holding Cost (Q/2 × H)</td>
                  <td className="num text-right" style={{ color: 'var(--success)' }}>
                    {formatCurrency(recHoldCost)}
                  </td>
                </tr>
                <tr style={{ borderTop: '2px solid var(--line-strong)', fontWeight: 700 }}>
                  <td>Total Relevant Annual Cost</td>
                  <td className="num text-right font-semibold" style={{ color: 'var(--success)' }}>
                    {formatCurrency(recTotalCost)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="footnote" style={{ marginTop: 10 }}>
            EOQ reaches exact equilibrium where Annual Ordering Cost ({formatCurrency(recOrderCost)}) equals Annual Holding Cost ({formatCurrency(recHoldCost)}), minimizing total relevant cost.
          </p>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 5. EOQ TOTAL COST CURVE & EQUILIBRIUM VISUALIZATION                  */}
      {/* ==================================================================== */}
      <div className="card">
        <div className="card__head">
          <div>
            <h2 className="card__title">EOQ Total Cost Parabola & Cost Equilibrium Curve</h2>
            <p className="card__sub">
              Fixed ordering cost decays hyperbolically (S·D/Q), holding cost rises linearly (H·Q/2) — EOQ (Q*) sits at the exact convex minimum where marginal ordering cost equals marginal holding cost.
            </p>
          </div>
          <span className="badge badge-accent">
            Q* = {formatNum(qStar)} {uom} · Min Cost {formatCurrency(recTotalCost)}/yr
          </span>
        </div>
        <div className="chart-shell">
          <EoqCurveChart
            demand={demand}
            orderingCost={ORDERING_COST}
            holdingCostPerUnit={holdingCostPerUnit}
            uom={uom}
          />
        </div>
        <p className="footnote">
          Canonical Formula: Q* = √(2·D·S / H) = √((2 × {formatNum(demand)} × ${ORDERING_COST.toFixed(2)}) / ${formatNum(holdingCostPerUnit, 4)}) = {formatNum(qStar)} {uom}. At Q*, Annual Ordering Cost ({formatCurrency(recOrderCost)}) equals Annual Holding Cost ({formatCurrency(recHoldCost)}).
        </p>
      </div>

      {/* ==================================================================== */}
      {/* 6. OPERATIONAL CONSTRAINTS & IMPLEMENTATION REALITY                  */}
      {/* ==================================================================== */}
      <div className="card">
        <div className="card__head">
          <div>
            <h2 className="card__title">Operational Constraints & Procurement Execution Context</h2>
            <p className="card__sub">
              The modeled EOQ economics should be evaluated alongside service-level, safety-stock, lead-time, supplier, MOQ, and packaging constraints before implementation.
            </p>
          </div>
          <span className="badge badge-neutral">Execution Baseline</span>
        </div>

        <div className="grid-3" style={{ marginBottom: 12 }}>
          <div style={{ padding: '12px 14px', background: 'var(--bg)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--line)' }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, margin: '0 0 4px', color: 'var(--ink)' }}>
              1. Minimum Order Quantity & Pack Sizes
            </h3>
            <p style={{ fontSize: 12, color: 'var(--muted)', margin: 0 }}>
              EOQ ({formatNum(qStar)} {uom}) establishes the unconstrained economic lot size. In procurement execution, Q* may be rounded up to supplier master carton or pallet layer increments without significantly degrading cost efficiency.
            </p>
          </div>
          <div style={{ padding: '12px 14px', background: 'var(--bg)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--line)' }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, margin: '0 0 4px', color: 'var(--ink)' }}>
              2. Supplier Lead Time & EDI Throughput
            </h3>
            <p style={{ fontSize: 12, color: 'var(--muted)', margin: 0 }}>
              Ordering frequency increases from {formatNum(currentOrderFreq)} to {formatNum(recOrderFreq)} orders/yr (every ~{formatNum(recOrderIntervalDays, 0)} days). EDI automation can reduce transaction effort and support higher replenishment cadence, subject to supplier and operational capability.
            </p>
          </div>
          <div style={{ padding: '12px 14px', background: 'var(--bg)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--line)' }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, margin: '0 0 4px', color: 'var(--ink)' }}>
              3. Planning Buffer Assumption (1.5 × Q*)
            </h3>
            <p style={{ fontSize: 12, color: 'var(--muted)', margin: 0 }}>
              Desired Stock Level of <strong>{formatNum(desiredStockQty)} {uom}</strong> ({formatCurrency(desiredStockValue)} carrying value) represents an application-defined planning buffer assumption (1.5 × Q*), distinct from classical EOQ, statistically calculated safety stock, reorder-point calculations, or service-level optimization.
            </p>
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 7. PERSONA-SPECIFIC STRATEGIC INTELLIGENCE LENSES                    */}
      {/* ==================================================================== */}
      {persona === 'ds' && (
        <Insight label="Data Scientist Lens · Mathematical Formulation & Sensitivity Intelligence">
          The calibrated lot size <span className="metric">{formatNum(qStar)} {uom}</span> minimizes the convex total-cost objective function <span className="metric">TC(Q) = (D/Q)·S + (Q/2)·H</span>, achieving exact first-order optimality where <span className="metric">∂TC/∂Q = -DS/Q² + H/2 = 0</span>. Parameter sensitivity demonstrates square-root elasticity: <span className="metric">∂ ln Q* / ∂ ln D = 0.50</span>, meaning a 20.00% surge in annual demand expands the optimal lot size by only 9.54%. Due to total cost curve convexity, operating at 1.5× Q* incurs an asymmetry penalty of only +8.33% over minimum cost, whereas operating at 0.5× Q* incurs a +25.00% cost inflation.
        </Insight>
      )}

      {persona === 'analyst' && (
        <Insight label="Supply Chain Analyst Lens · Lot-Sizing Governance & Replenishment Execution">
          Current ERP lot sizing of <span className="metric">{formatNum(currentBatchQty)} {uom}</span> incurs <span className="metric">{formatCurrency(currentHoldCost)}/yr</span> in annual holding costs by holding <span className="metric">{formatNum(currentDaysOfSupply, 1)} days</span> of supply per replenishment. Calibrating lot sizing to <span className="metric">{formatNum(qStar)} {uom}</span> rightsizes replenishment to <span className="metric">{formatNum(recDaysOfSupply, 1)} days</span> of supply, capturing <span className="metric">{formatCurrency(netAnnualSavings)}/yr</span> in net savings ({formatNum(netSavingsPercent)}% reduction). Recommended action: Evaluate the modeled <span className="metric">{formatNum(qStar)} {uom}</span> lot size alongside safety-stock buffers, supplier packaging increments, and {leadTimeDays}-day lead time before updating ERP MRP parameters.
        </Insight>
      )}

      {persona === 'exec' && (
        <Insight label="C-Suite Executive Lens · Working Capital Velocity & Risk-Balanced Governance">
          For <span className="metric">{selectedMaterial.id}</span>, this modeled EOQ policy reduces relevant annual ordering and carrying cost by <span className="metric">{formatCurrency(netAnnualSavings)}/yr</span> ({formatNum(netSavingsPercent)}% policy cost reduction) and releases an estimated <span className="metric">{formatCurrency(workingCapitalReleased)}</span> in average cycle-stock capital, subject to service-level, safety-stock, lead-time, supplier, MOQ, and packaging constraints. Consider institutionalizing periodic EOQ recalibration for Class A materials across plants, subject to operational and service constraints.
        </Insight>
      )}

      {/* ==================================================================== */}
      {/* 8. DRIVER BREAKDOWN & EXPLAINABILITY (WHY DISCLOSURE)                */}
      {/* ==================================================================== */}
      <div className="card">
        <h2 className="card__title">
          Why EOQ Shifted from {formatNum(currentBatchQty)} to {formatNum(qStar)} {uom} for {selectedMaterial.id}
        </h2>
        <WhyDisclosure
          defaultOpen
          summary="Driver Breakdown & Analytical Trade-Off Rationalization"
          drivers={[
            `Physical annual demand of ${formatNum(demand)} ${uom}/yr (${formatCurrency(annualConsumptionValue)} annual consumption value at unit cost of ${formatCurrency(unitCost)}) for ${selectedMaterial.id}.`,
            `Fixed ordering cost of ${formatCurrency(ORDERING_COST)}/order supported by EDI-automated transaction processing.`,
            `Holding cost rate of ${formatNum(HOLDING_RATE * 100)}%/yr, generating annual carrying cost H = ${formatCurrency(holdingCostPerUnit)}/${uom}/yr.`,
            `Current ERP batch policy of ${formatNum(currentBatchQty)} ${uom} created severe cost asymmetry (${formatCurrency(currentHoldCost)}/yr holding cost vs ${formatCurrency(currentOrderCost)}/yr ordering cost).`,
          ]}
          meaning={[
            `Replenishment cadence shifts from ${formatNum(currentOrderFreq)} to ${formatNum(recOrderFreq)} orders/yr (ordering every ~${formatNum(recOrderIntervalDays, 0)} days instead of ~${formatNum(currentOrderIntervalDays, 0)} days).`,
            `Average cycle stock drops from ${formatNum(currentCycleStockQty)} ${uom} (${formatCurrency(currentCycleStockValue)}) to ${formatNum(recCycleStockQty)} ${uom} (${formatCurrency(recCycleStockValue)}), unlocking an estimated ${formatCurrency(workingCapitalReleased)} working-capital opportunity.`,
            `Total relevant annual policy cost is minimized from ${formatCurrency(currentTotalCost)} to ${formatCurrency(recTotalCost)}/yr, capturing ${formatCurrency(netAnnualSavings)}/yr (${formatNum(netSavingsPercent)}%) in net savings.`,
          ]}
          action={[
            `Update ERP Material Master replenishment lot sizing for ${selectedMaterial.id} to ${formatNum(qStar)} ${uom}, reconciling with supplier packaging increments and lead-time constraints.`,
            `Verify supplier ${meta.supplier} and EDI throughput can support the calibrated order cadence of ${formatNum(recOrderFreq)} orders/yr.`,
            `Transition to RMLC Lifecycle to inspect material shelf-life staging and prevent inventory accumulation.`,
          ]}
        />
        <div style={{ marginTop: 14, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn btn-sm"
            onClick={() => navigate('/app/what-if')}
          >
            Stress-test {selectedMaterial.id} in What-If
          </button>
          <button
            type="button"
            className="btn btn-sm"
            onClick={() => navigate('/app/optimization')}
          >
            View Optimization Plan
          </button>
          <button
            type="button"
            className="btn btn-sm"
            onClick={() => navigate('/app/abc')}
          >
            Return to ABC Classification
          </button>
        </div>
      </div>
    </section>
  );
}


