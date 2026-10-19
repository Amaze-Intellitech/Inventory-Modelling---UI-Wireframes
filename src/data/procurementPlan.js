// Illustrative procurement optimization for this planning cycle: requirements by destination plant (net of stock,
// open POs and reservations), the eligible supply sources, and the plan the optimizer chose under the constraint
// model. All values are mock data; days are counted from today.

export const REQUIREMENTS = [
  { id: 'R1', material: 'MAT-4120', name: 'Microcontroller MCU-64', destination: 'Plant 3', qty: 3800, uom: 'EA', needByDays: 14, critical: true, ordersAtRisk: 9, baselineUnit: 79.2 },
  { id: 'R2', material: 'MAT-4120', name: 'Microcontroller MCU-64', destination: 'Plant 1', qty: 600, uom: 'EA', needByDays: 32, critical: false, ordersAtRisk: 2, baselineUnit: 79.2 },
  { id: 'R3', material: 'MAT-1082', name: 'Hydraulic Pump 250BAR', destination: 'Plant 1', qty: 400, uom: 'EA', needByDays: 43, critical: true, ordersAtRisk: 3, baselineUnit: 604 },
  { id: 'R4', material: 'MAT-2041', name: 'Lithium Cell 21700', destination: 'Plant 2', qty: 60000, uom: 'EA', needByDays: 32, critical: false, ordersAtRisk: 0, baselineUnit: 5.2 },
];

// The chosen allocation. `unitLanded` = price + freight + duties; `capacityUse` is the share of that source's
// available capacity this plan consumes.
export const ALLOCATIONS = [
  { req: 'R1', source: 'Plant 1 stock transfer', type: 'transfer', qty: 1200, arrivesDays: 3, unitLanded: 79.5, capacityUse: 0.8, otd: 0.99, rejectRate: 0 },
  { req: 'R1', source: 'Plant 2 stock transfer', type: 'transfer', qty: 600, arrivesDays: 5, unitLanded: 79.75, capacityUse: 0.6, otd: 0.98, rejectRate: 0 },
  { req: 'R1', source: 'SiliconFoundry International (expedited)', type: 'supplier', qty: 2000, arrivesDays: 12, unitLanded: 86.4, capacityUse: 1, otd: 0.82, rejectRate: 0.004, singleSource: true },
  { req: 'R3', source: 'HydraTech Dynamics GmbH (expedited)', type: 'supplier', qty: 400, arrivesDays: 35, unitLanded: 676, capacityUse: 0.67, otd: 0.88, rejectRate: 0.002, singleSource: true },
  { req: 'R4', source: 'Apex Energy Storage Ltd', type: 'supplier', qty: 40000, arrivesDays: 30, unitLanded: 5.21, capacityUse: 1, otd: 0.95, rejectRate: 0.006 },
  { req: 'R4', source: 'Voltcell Manufacturing', type: 'supplier', qty: 20000, arrivesDays: 25, unitLanded: 5.29, capacityUse: 0.67, otd: 0.91, rejectRate: 0.009 },
];

// Constraints that shaped the plan (`binding` = the plan sits exactly at the limit).
export const CONSTRAINTS = [
  { group: 'Quantity', rule: 'SiliconFoundry allocation cap: 2,000 EA this cycle', binding: true },
  { group: 'Quantity', rule: 'Apex Energy capacity: 40,000 EA per month', binding: true },
  { group: 'Inventory', rule: 'Donor plants keep cover above their own lead time (Plant 1 floor 2,550 EA)', binding: true },
  { group: 'Quantity', rule: 'HydraTech MOQ 200 EA, multiples of 200', binding: false },
  { group: 'Timing', rule: 'Arrival on or before each requirement date', binding: false },
  { group: 'Supplier eligibility', rule: 'Only qualified supplier-material pairs', binding: true },
];

export const REJECTED = [
  { option: 'NovaSemi Components for MAT-4120', why: 'Not yet qualified (6-week qualification); would save $4.90/EA', rule: 'Supplier eligibility' },
  { option: 'Air-freight above SiliconFoundry allocation', why: 'Exceeds the contract allocation limit', rule: 'Commercial terms' },
  { option: 'Voltcell for the full 60,000 EA of MAT-2041', why: 'Capacity is 30,000 EA this month', rule: 'Quantity' },
];

// The smallest relaxation that would cover what the plan leaves open.
export const RELAXATION = 'Raise the SiliconFoundry allocation by 600 EA, or fast-track NovaSemi qualification, to cover the Plant 1 requirement for MAT-4120.';

export function summarizePlan() {
  const lines = REQUIREMENTS.map((r) => {
    const allocs = ALLOCATIONS.filter((a) => a.req === r.id);
    const covered = allocs.reduce((acc, a) => acc + a.qty, 0);
    const late = allocs.filter((a) => a.arrivesDays > r.needByDays);
    const cost = allocs.reduce((acc, a) => acc + a.qty * a.unitLanded, 0);
    return { ...r, allocs, covered, uncovered: Math.max(r.qty - covered, 0), late, cost, baseline: covered * r.baselineUnit };
  });
  const totalCost = lines.reduce((acc, l) => acc + l.cost, 0);
  const baselineCost = lines.reduce((acc, l) => acc + l.baseline, 0);
  const requiredValue = lines.reduce((acc, l) => acc + l.qty * l.baselineUnit, 0);
  const coveredValue = lines.reduce((acc, l) => acc + l.covered * l.baselineUnit, 0);
  const open = lines.filter((l) => l.uncovered > 0);
  const bySupplier = {};
  ALLOCATIONS.forEach((a) => {
    bySupplier[a.source] = (bySupplier[a.source] || 0) + a.qty * a.unitLanded;
  });
  const topShare = Math.max(...Object.values(bySupplier)) / totalCost;
  const singleSourceValue = ALLOCATIONS.filter((a) => a.singleSource).reduce((acc, a) => acc + a.qty * a.unitLanded, 0);
  return {
    lines,
    totalCost,
    baselineCost,
    coveredPct: requiredValue > 0 ? coveredValue / requiredValue : 0,
    open,
    uncoveredCritical: open.filter((l) => l.critical),
    ordersAtRisk: open.reduce((acc, l) => acc + l.ordersAtRisk, 0),
    topShare,
    singleSourceShare: singleSourceValue / totalCost,
    lateCount: lines.reduce((acc, l) => acc + l.late.length, 0),
  };
}
