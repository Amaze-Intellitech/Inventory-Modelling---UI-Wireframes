import { DECISION_ROWS } from './mockData';

// Illustrative sourcing data for the "compare options" view: which other plants could lend stock and
// which vendors could supply it, with days, freight and price effects. All values are mock data.

// The $1.82M in the "Authorize expedited PO, MAT-4120" decision is the cost of the line stopping for the
// days between stock running out and a normal order arriving (60-day lead time - 14 days of cover = 46 days).
const STOPPAGE_DAYS_AT_STAKE = 46;
const STOPPAGE_VALUE = 1_820_000;
export const STOPPAGE_COST_PER_DAY = Math.round(STOPPAGE_VALUE / STOPPAGE_DAYS_AT_STAKE);
const CARRYING_RATE = 0.22; // per year
const HOLDING_DAYS = 30;

export const SOURCING_DATA = {
  'MAT-4120': {
    donors: [
      { plant: 'Plant 1 — Assembly', onHand: 3750, dailyUse: 30, leadDays: 45, transferDays: 3, freightPerUnit: 0.85 },
      { plant: 'Plant 2 — Engine Hub', onHand: 2600, dailyUse: 25, leadDays: 45, transferDays: 5, freightPerUnit: 1.1 },
    ],
    vendors: {
      expedite: { vendor: 'SiliconFoundry International', days: 12, priceDeltaPct: 8, freightPerUnit: 1.5, maxUnits: 2000, note: 'Allocation caps an expedited order at 2,000 EA' },
      alternate: { vendor: 'NovaSemi Components', days: 25, priceDeltaPct: -3, freightPerUnit: 0.9, qualified: false, qualificationCost: 18000, note: 'Needs quality qualification before the first order' },
    },
  },
};

export const hasSourcingData = (materialId) => Boolean(SOURCING_DATA[materialId]);

const surplus = (d) => Math.max(d.onHand - d.dailyUse * d.leadDays, 0);

// Every option is scored the same way: units delivered, when they arrive, the extra cost, and how many
// days the line would still be stopped. Total = extra cost + carrying cost + expected stoppage cost.
export function buildSourcingComparison(row) {
  const data = SOURCING_DATA[row.id];
  if (!data) return null;

  const cover = row.daysOfSupply;
  const need = Math.round(row.dailyConsumption * Math.max(row.leadTimeDays - cover, 0));
  const unitCost = row.unitCost;
  const donors = data.donors.map((d) => ({ ...d, available: Math.min(Math.round(surplus(d)), need) })).filter((d) => d.available > 0);
  const { expedite, alternate } = data.vendors;

  const carrying = (units) => units * unitCost * CARRYING_RATE * (HOLDING_DAYS / 365);
  const score = (opt) => {
    const delivered = Math.min(opt.delivered, need);
    const lateDays = opt.arrives == null ? row.leadTimeDays - cover : Math.max(opt.arrives - cover, 0);
    const shortDays = (need - delivered) / row.dailyConsumption;
    const stopDays = Math.min(opt.arrives == null ? lateDays : lateDays + shortDays, row.leadTimeDays - cover);
    const stoppage = stopDays * STOPPAGE_COST_PER_DAY;
    const extra = opt.extra;
    return {
      ...opt,
      delivered,
      stopDays,
      extra,
      total: extra + carrying(delivered) + stoppage,
      feasible: opt.arrives != null && stopDays < 0.5,
    };
  };

  const options = [];
  options.push(score({ key: 'nothing', label: 'Do nothing', detail: 'Wait for the normal order', arrives: null, delivered: 0, extra: 0, risk: 'High', watch: `Line stops in about ${Math.round(cover)} days` }));

  if (donors[0]) {
    const d = donors[0];
    options.push(score({
      key: 'transfer1', label: `Transfer from ${d.plant.split(' — ')[0]}`, detail: `${d.available.toLocaleString()} EA, ${d.transferDays} days by road`,
      arrives: d.transferDays, delivered: d.available, extra: d.available * d.freightPerUnit,
      risk: d.available >= need ? 'Low' : 'Medium', watch: d.available >= need ? 'Donor plant stays above its own lead time' : `Covers ${Math.round((d.available / need) * 100)}% of the need`,
    }));
  }
  if (donors[0] && donors[1]) {
    const [a, b] = donors;
    const fromB = Math.min(b.available, need - a.available);
    options.push(score({
      key: 'transfer2', label: `Transfer from ${a.plant.split(' — ')[0]} and ${b.plant.split(' — ')[0]}`,
      detail: `${a.available.toLocaleString()} + ${fromB.toLocaleString()} EA, arrives in ${b.transferDays} days`,
      arrives: Math.max(a.transferDays, b.transferDays), delivered: a.available + fromB, extra: a.available * a.freightPerUnit + fromB * b.freightPerUnit,
      risk: a.available + fromB >= need ? 'Low' : 'Medium', watch: 'Two shipments to coordinate; both donors stay above their lead time',
    }));
  }

  const expUnits = Math.min(expedite.maxUnits, need);
  const expPremium = unitCost * (expedite.priceDeltaPct / 100) + expedite.freightPerUnit;
  options.push(score({
    key: 'expedite', label: 'Expedite with current vendor', detail: `${expedite.vendor}, ${expUnits.toLocaleString()} EA in ${expedite.days} days`,
    arrives: expedite.days, delivered: expUnits, extra: expUnits * expPremium,
    risk: expUnits >= need ? 'Low' : 'Medium', watch: expedite.note,
  }));

  const altPrice = unitCost * (alternate.priceDeltaPct / 100) + alternate.freightPerUnit;
  options.push(score({
    key: 'alternate', label: 'Switch to an alternate vendor', detail: `${alternate.vendor}, ${need.toLocaleString()} EA in ${alternate.days} days`,
    arrives: alternate.days, delivered: need, extra: need * altPrice + (alternate.qualified ? 0 : alternate.qualificationCost),
    risk: 'Medium', watch: alternate.note,
  }));

  if (donors[0] && donors[0].available < need) {
    const d = donors[0];
    const tail = need - d.available;
    options.push(score({
      key: 'split', label: `Transfer from ${d.plant.split(' — ')[0]}, expedite the rest`, detail: `${d.available.toLocaleString()} EA transferred, ${tail.toLocaleString()} EA expedited`,
      arrives: Math.max(d.transferDays, expedite.days), delivered: need, extra: d.available * d.freightPerUnit + tail * expPremium,
      risk: 'Low', watch: 'Two actions to coordinate',
    }));
  }

  const feasible = options.filter((o) => o.feasible);
  const nothing = options[0];
  const best = [...feasible].sort((a, b) => a.total - b.total)[0] ?? null;

  return {
    materialId: row.id,
    plant: row.plant.split(' — ')[0],
    cover,
    leadTimeDays: row.leadTimeDays,
    need,
    uom: row.uom,
    options,
    recommended: best?.key ?? null,
    reason: best
      ? `Lowest total cost of the options that deliver the full ${need.toLocaleString()} ${row.uom} before cover runs out in ${Math.round(cover)} days. Doing nothing risks about ${formatMoney(nothing.total)} of lost production.`
      : 'No option delivers the full need before cover runs out; expedite everything available and escalate.',
  };
}

export function formatMoney(v) {
  const abs = Math.abs(v);
  const sign = v < 0 ? '-' : '';
  if (abs >= 1_000_000) return `${sign}$${(abs / 1_000_000).toFixed(2)}M`;
  return `${sign}$${Math.round(abs).toLocaleString()}`;
}

// Kept so the demo ties back to the decision queue's own figure.
export const SOURCING_DECISION = DECISION_ROWS.find((d) => d.id === 'd1');
