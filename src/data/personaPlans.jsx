import React from 'react';
import { DECISION_ROWS, RMLC_STAGES } from './mockData';
import { RMLC_CYCLE_MATERIALS, RMLC_LEGS } from '../components/RmlcLegs';

// Content for the "Understand & Plan" section on Overview: for each plant persona, what is happening,
// what happens if nothing changes vs if they act, and what to do next. Figures are derived from the
// inventory rows the page already shows wherever possible; the few added assumptions (the 30-day and
// 7-day horizons, the 15% demand case, the ageing shift of stock) are illustrative and labelled as such.

const M = ({ children }) => <span className="metric">{children}</span>;

const HORIZON_DAYS = 30;
const SLIP_DAYS = 7;
const DEMAND_UPLIFT = 0.15;
const WEEKS = 12;

const short = (r) => `${r.id} ${r.name.split(' ')[0]}`;
const days = (v) => `${Math.round(v)} d`;
const pct = (v) => `${Math.round(v)}%`;
const mill = (v) => `$${v.toFixed(2)}M`;
const kilo = (v) => `$${Math.round(v / 1000).toLocaleString()}K`;
const fix = (n, d = 0) => Number(n).toLocaleString(undefined, { maximumFractionDigits: d });
const decision = (id) => DECISION_ROWS.find((d) => d.id === id);

// ---- Plant Supervisor: which materials could stop a line ----
function supervisorPlan(rows) {
  const sorted = [...rows].sort((a, b) => a.daysOfSupply - b.daysOfSupply).slice(0, 5);
  const first = sorted[0];
  const exposed = rows.filter((r) => r.daysOfSupply < r.leadTimeDays);
  const gap = Math.max(Math.round(first.leadTimeDays - first.daysOfSupply), 0);
  const d1 = decision('d1');

  return {
    title: 'Which materials could stop a line',
    insight: (
      <>
        <M>{exposed.length} of the {rows.length} listed materials</M> cover fewer days of production than their supplier takes to
        replenish. <M>{first.id}</M> has <M>{fix(first.daysOfSupply, 1)} days</M> of cover against a {first.leadTimeDays}-day
        lead time, so it runs out about <M>{gap} days</M> before a normal order could arrive. It feeds {first.downstreamLines}.
      </>
    ),
    chart: {
      kind: 'bars',
      label: 'Days of cover today and in 30 days, against replenishment lead time',
      unit: 'days of cover',
      fmt: days,
      markerLabel: 'Replenishment lead time',
      projectedLabel: { nothing: 'In 30 days, no new stock', act: 'In 30 days, with an expedited receipt' },
      tableColumns: ['Material', 'Today', 'In 30 days, no action', 'In 30 days, act', 'Lead time'],
      rows: sorted.map((r) => {
        const later = Math.max(r.daysOfSupply - HORIZON_DAYS, 0);
        return { label: short(r), now: r.daysOfSupply, nothing: later, act: r.daysOfSupply < r.leadTimeDays ? later + 25 : later, marker: r.leadTimeDays };
      }),
    },
    outcome: {
      nothing: {
        tone: 'risk',
        headline: `${first.id} runs out in about ${Math.round(first.daysOfSupply)} days`,
        detail: `Lines fed by it stop until stock arrives, roughly ${gap} days later. ${exposed.length > 1 ? `${exposed.length - 1} more listed material${exposed.length > 2 ? 's' : ''} sit below their lead time too.` : 'It is the only listed material in this position.'}`,
      },
      act: {
        tone: 'ok',
        headline: 'The stoppage is avoided if an expedited receipt lands in time',
        detail: `Only an expedited order can arrive before the stock runs out; a normal order takes ${first.leadTimeDays} days. Illustrative: the expedited receipt adds about 25 days of cover.`,
      },
    },
    actions: [
      { title: `Authorize the expedited PO for ${first.id}`, owner: 'Procurement Officer', due: 'Within 3 days', effect: d1?.impact ?? 'Line stoppage avoided', handoff: 'procurement', compare: first.id },
      { title: `Check other plants for spare ${first.name.split(' ')[0]} stock`, owner: 'Warehouse Manager', due: 'This week', effect: 'Bridges part of the gap without a purchase', handoff: 'warehouse' },
      { title: `Run lines that do not use ${first.id} first`, owner: 'Materials Planner', due: 'Within 2 days', effect: 'Buys a few days while the order arrives', handoff: 'planner' },
    ],
  };
}

// ---- Warehouse Manager: physical stock that is ageing or in excess ----
const AGEING = {
  // value in $M today, in 90 days if nothing is done, and after clearing it (illustrative shift of stock between stages)
  accumulation: { nothing: -0.7, act: -0.7 },
  active: { nothing: 0, act: 0.7 },
  atrisk: { nothing: 0.1, act: -1.04 },
  liquidation: { nothing: 0.6, act: -1.2 },
};

function warehousePlan() {
  const rows = RMLC_STAGES.map((s) => ({
    label: s.label,
    now: s.value,
    nothing: s.value + AGEING[s.key].nothing,
    act: s.value + AGEING[s.key].act,
  }));
  const byKey = Object.fromEntries(RMLC_STAGES.map((s, i) => [s.key, rows[i]]));
  const stuck = byKey.atrisk.now + byKey.liquidation.now;
  const stuckSkus = RMLC_STAGES.filter((s) => s.key === 'atrisk' || s.key === 'liquidation').reduce((n, s) => n + s.count, 0);
  const released = rows.reduce((n, r) => n + r.now, 0) - rows.reduce((n, r) => n + r.act, 0);
  const d4 = decision('d4');

  return {
    title: 'How much stock is ageing, and what clearing it releases',
    insight: (
      <>
        <M>{mill(stuck)}</M> of stock across <M>{stuckSkus} SKUs</M> has gone 90 days or more without being used, and{' '}
        <M>{mill(byKey.accumulation.now)}</M> more is building faster than it is consumed. Without action, about{' '}
        <M>{mill(AGEING.liquidation.nothing)}</M> more crosses the 180-day line within 90 days.
      </>
    ),
    chart: {
      kind: 'bars',
      label: 'Stock value by lifecycle stage, today and in 90 days',
      unit: '$M',
      fmt: mill,
      projectedLabel: { nothing: 'In 90 days, no action', act: 'In 90 days, after clearing' },
      tableColumns: ['Stage', 'Today', 'In 90 days, no action', 'In 90 days, act'],
      rows,
    },
    outcome: {
      nothing: {
        tone: 'risk',
        headline: `Stock past 180 days grows from ${mill(byKey.liquidation.now)} to ${mill(byKey.liquidation.nothing)}`,
        detail: 'It becomes harder to sell or return the longer it sits, and storage cost keeps running. Illustrative: assumes the current ageing pace.',
      },
      act: {
        tone: 'ok',
        headline: `About ${mill(released)} is released`,
        detail: `Stock past 180 days falls to ${mill(byKey.liquidation.act)} and at-risk stock to ${mill(byKey.atrisk.act)}, by returning, transferring or selling it.`,
      },
    },
    actions: [
      { title: 'Transfer MAT-5501 to Plant 2 before it expires', owner: 'Warehouse Manager', due: 'Before expiry', effect: d4?.impact ?? 'Salvage value recovered', handoff: 'planner' },
      { title: `Return or sell the ${mill(byKey.liquidation.now)} of stock past 180 days`, owner: 'Warehouse Manager', due: 'Within 30 days', effect: `${mill(byKey.liquidation.now - byKey.liquidation.act)} released`, handoff: 'finance' },
      { title: `Cycle-count the ${RMLC_STAGES.find((s) => s.key === 'atrisk').count} at-risk SKUs`, owner: 'Warehouse Manager', due: 'Within 2 weeks', effect: 'Confirms the stock is really there before any sale' },
    ],
  };
}

// ---- Materials Planner: cover against the production plan and demand swings ----
function plannerPlan(rows) {
  const focus = rows.find((r) => r.id === 'MAT-1082') ?? rows[0];
  const weekly = focus.dailyConsumption * 7;
  const receiptWeek = Math.floor(focus.leadTimeDays / 7);
  const receipt = focus.currentBatchQty;
  const weeks = Array.from({ length: WEEKS + 1 }, (_, i) => (i === 0 ? 'Now' : `W${i}`));

  const run = (uplift, withOrder) => {
    let stock = focus.qty;
    return weeks.map((_, w) => {
      if (w > 0) stock = Math.max(stock - weekly * (1 + uplift), 0);
      if (withOrder && w === receiptWeek) stock += receipt;
      return Math.round(stock);
    });
  };
  const plan = run(0, false);
  const high = run(DEMAND_UPLIFT, false);
  const planAct = run(0, true);
  const highAct = run(DEMAND_UPLIFT, true);
  const firstBelow = (s) => s.findIndex((v) => v < focus.safetyStock);
  const firstZero = (s) => s.findIndex((v) => v === 0);
  const wPlan = firstBelow(plan);
  const wHigh = firstBelow(high);
  const zero = firstZero(high);
  const minAct = Math.min(...planAct, ...highAct);
  const dipAct = firstBelow(highAct);

  const table = {
    columns: ['Week', 'Plan demand', `Demand +${DEMAND_UPLIFT * 100}%`, 'Plan + order now', `+${DEMAND_UPLIFT * 100}% + order now`],
    rows: weeks.map((w, i) => [w, fix(plan[i]), fix(high[i]), fix(planAct[i]), fix(highAct[i])]),
  };

  return {
    title: `Cover against the production plan, ${focus.id}`,
    insight: (
      <>
        At plan demand, <M>{focus.id}</M> drops below its safety stock in week <M>{wPlan < 0 ? `${WEEKS}+` : wPlan}</M>. If demand runs{' '}
        <M>{DEMAND_UPLIFT * 100}% high</M> it does so in week <M>{wHigh < 0 ? `${WEEKS}+` : wHigh}</M>, before an order placed today (
        {focus.leadTimeDays}-day lead time) could arrive in week {receiptWeek}.
      </>
    ),
    chart: {
      kind: 'runway',
      label: `${focus.id} stock over ${WEEKS} weeks`,
      unit: focus.uom,
      weeks,
      threshold: { label: `Safety stock (${fix(focus.safetyStock)} ${focus.uom})`, value: focus.safetyStock },
      table,
      series: {
        nothing: [
          { label: 'Plan demand', color: 'var(--s1)', values: plan },
          { label: `Demand +${DEMAND_UPLIFT * 100}%`, color: 'var(--s2)', values: high, dash: true },
        ],
        act: [
          { label: 'Plan demand, order now', color: 'var(--s1)', values: planAct },
          { label: `Demand +${DEMAND_UPLIFT * 100}%, order now`, color: 'var(--s2)', values: highAct, dash: true },
        ],
      },
    },
    outcome: {
      nothing: {
        tone: 'risk',
        headline: zero >= 0 ? `Stock-out in week ${zero} if demand runs ${DEMAND_UPLIFT * 100}% high` : `Below safety stock in week ${wHigh} if demand runs ${DEMAND_UPLIFT * 100}% high`,
        detail: `Nothing is on order yet. Illustrative: a flat weekly draw of ${fix(weekly)} ${focus.uom} at plan, ${fix(weekly * (1 + DEMAND_UPLIFT))} ${focus.uom} in the high case.`,
      },
      act: {
        tone: minAct >= focus.safetyStock ? 'ok' : 'watch',
        headline: minAct >= focus.safetyStock
          ? `Stays above safety stock through week ${WEEKS} in both cases`
          : `Still dips below safety stock in week ${dipAct}`,
        detail: `Ordering the ${fix(receipt)} ${focus.uom} batch now lands it in week ${receiptWeek}, after the ${focus.leadTimeDays}-day lead time.`,
      },
    },
    actions: [
      { title: `Place the full ${fix(receipt)} ${focus.uom} batch order now`, owner: 'Procurement Officer', due: 'Today', effect: `Cover holds through week ${WEEKS} in both cases`, handoff: 'procurement' },
      { title: 'Confirm the production plan for the next 10 weeks', owner: 'Materials Planner', due: 'This week', effect: `Narrows the ${DEMAND_UPLIFT * 100}% demand uncertainty`, handoff: 'supervisor' },
      { title: `Review the BOM usage rate for ${focus.id}`, owner: 'Materials Planner', due: 'Within 2 weeks', effect: 'Fixes the "Risk" BOM coverage flag' },
    ],
  };
}

// ---- Procurement Officer: reorder position, supplier delay and sourcing risk ----
function procurementPlan(rows) {
  const position = (r, extra, slip) => ((r.qty + extra - slip * r.dailyConsumption) / r.reorderPoint) * 100;
  const sorted = [...rows].sort((a, b) => a.qty / a.reorderPoint - b.qty / b.reorderPoint).slice(0, 5);
  const first = sorted[0];
  const below = rows.filter((r) => r.qty < r.reorderPoint);
  const nowPct = (first.qty / first.reorderPoint) * 100;
  const slipPct = position(first, 0, SLIP_DAYS);
  const actPct = position(first, first.calibratedEOQ, SLIP_DAYS);
  const d1 = decision('d1');
  const d2 = decision('d2');

  return {
    title: 'Reorder position and supplier risk',
    insight: (
      <>
        <M>{below.length} of the {rows.length} listed materials</M> are already below their reorder point (
        <M>{below.map((r) => r.id).join(' and ')}</M>). <M>{first.id}</M> holds <M>{pct(nowPct)}</M> of its reorder point and comes
        from {first.supplier} on {first.sourcingType.toLowerCase()} terms, so a delay there has no fallback.
      </>
    ),
    chart: {
      kind: 'bars',
      label: 'Stock as a percentage of reorder point, today and after a 7-day supplier delay',
      unit: '% of reorder point',
      fmt: pct,
      markerLabel: 'Reorder point (100%)',
      projectedLabel: { nothing: 'After a 7-day supplier delay', act: 'Inventory position with an order placed now' },
      tableColumns: ['Material', 'Today', 'After a 7-day delay', 'With an order placed now', 'Reorder point'],
      rows: sorted.map((r) => ({
        label: short(r),
        now: (r.qty / r.reorderPoint) * 100,
        nothing: Math.max(position(r, 0, SLIP_DAYS), 0),
        act: Math.max(position(r, r.calibratedEOQ, SLIP_DAYS), 0),
        marker: 100,
      })),
    },
    outcome: {
      nothing: {
        tone: 'risk',
        headline: `A ${SLIP_DAYS}-day delay pushes ${first.id} from ${pct(nowPct)} to ${pct(Math.max(slipPct, 0))} of its reorder point`,
        detail: `${below.length} listed material${below.length === 1 ? ' is' : 's are'} below the line already. Illustrative: the delay is applied to the current daily consumption.`,
      },
      act: {
        tone: actPct >= 100 ? 'ok' : 'watch',
        headline: `Ordering ${fix(first.calibratedEOQ)} ${first.uom} lifts ${first.id} to ${pct(actPct)}`,
        detail: actPct >= 100
          ? 'That clears the reorder point even with the delay.'
          : 'That is still short of the reorder point, so ask for expedited delivery as well.',
      },
    },
    actions: [
      { title: d1?.title ?? `Authorize an expedited PO for ${first.id}`, owner: 'Procurement Officer', due: 'Within 3 days', effect: d1?.impact ?? 'Stock-out avoided', handoff: 'finance', compare: first.id },
      { title: d2?.title ?? 'Recalibrate lot sizes for Class A materials', owner: 'Procurement Officer', due: 'This month', effect: d2?.impact ?? 'Working capital released', handoff: 'finance' },
      { title: 'Qualify a second source for sole and allocated materials', owner: 'Procurement Officer', due: 'This quarter', effect: 'Removes the single-supplier exposure' },
    ],
  };
}

// ---- Finance Controller: where cash is stuck in the cycle ----
const CYCLE_SHIFT = { fg: { nothing: 9, act: -31 }, cust: { nothing: 0, act: -5 } };
const EXCESS_TOTAL = '$4.2M';

function financePlan(rows) {
  const mat = RMLC_CYCLE_MATERIALS.find((m) => m.id === 'MAT-2041') ?? RMLC_CYCLE_MATERIALS[0];
  const full = rows.find((r) => r.id === mat.id);
  const legs = RMLC_LEGS.map((l, i) => {
    const shift = CYCLE_SHIFT[l.key] ?? { nothing: 0, act: 0 };
    return { label: l.short, key: l.key, now: mat.days[i], nothing: mat.days[i] + shift.nothing, act: mat.days[i] + shift.act };
  });
  const total = (k) => legs.reduce((n, l) => n + l[k], 0);
  const perDay = full ? full.annualConsumptionValue / 365 : 0;
  const fg = legs.find((l) => l.key === 'fg');
  const freed = (total('now') - total('act')) * perDay;
  const locked = (total('nothing') - total('now')) * perDay;

  return {
    title: `Where cash is stuck, ${mat.id}`,
    insight: (
      <>
        Cash is tied up for <M>{total('now')} days</M> between paying the supplier and being paid by the customer for {mat.id}, and{' '}
        <M>{fg.now} of them</M> are finished goods sitting unsold. Fixing that one leg is worth about <M>{kilo(freed)}</M> here; the{' '}
        <M>{EXCESS_TOTAL}</M> of excess stock across the portfolio is the larger prize.
      </>
    ),
    chart: {
      kind: 'bars',
      label: `Days in each leg of the cash cycle, ${mat.id}`,
      unit: 'days',
      fmt: days,
      projectedLabel: { nothing: 'Next quarter, no action', act: 'Next quarter, after acting' },
      tableColumns: ['Leg', 'Today', 'Next quarter, no action', 'Next quarter, act'],
      rows: legs,
    },
    outcome: {
      nothing: {
        tone: 'risk',
        headline: `The cycle stretches to ${total('nothing')} days`,
        detail: `About ${kilo(locked)} more cash is locked in ${mat.id}. Illustrative: unsold finished goods keep building at the current pace.`,
      },
      act: {
        tone: 'ok',
        headline: `The cycle shortens to ${total('act')} days, freeing about ${kilo(freed)}`,
        detail: 'Illustrative: finished goods wait 35 days instead of 66, and customer payment terms come down by 5 days.',
      },
    },
    actions: [
      { title: `Clear the ${EXCESS_TOTAL} of excess stock through the three transfer options`, owner: 'Warehouse Manager', due: 'This quarter', effect: `${EXCESS_TOTAL} released`, handoff: 'warehouse' },
      { title: `Cut ${mat.id} finished-goods wait from ${fg.now} to ${fg.now + CYCLE_SHIFT.fg.act} days`, owner: 'Materials Planner', due: 'This quarter', effect: `${kilo(-CYCLE_SHIFT.fg.act * perDay)} freed`, handoff: 'planner' },
      { title: 'Negotiate shorter customer payment terms', owner: 'Finance Controller', due: 'Next quarter', effect: `${kilo(-CYCLE_SHIFT.cust.act * perDay)} freed` },
    ],
  };
}

export function buildPlan(persona, rows) {
  switch (persona) {
    case 'warehouse': return warehousePlan();
    case 'planner': return plannerPlan(rows);
    case 'procurement': return procurementPlan(rows);
    case 'finance': return financePlan(rows);
    default: return supervisorPlan(rows);
  }
}
