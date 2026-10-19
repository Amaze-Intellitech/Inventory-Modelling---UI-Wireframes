// Mock/illustrative data for the storyboard prototype.
// In the connected build, each of these is replaced by a call through
// frontend/src/Api/api.js into the corresponding backend engine
// (abc_analysis.py, eoq.py, optimization.py, etc.)

export const ROLE_CONTEXT = {
  'Head of Supply Chain': { dept: 'Supply Chain Planning', scope: 'All Plants (4)', persona: 'head' },
  'Inventory / Materials Manager': { dept: 'Inventory Control', scope: 'Plant 1 — Assembly', persona: 'inventory' },
  'Production / Materials Planner': { dept: 'Production Planning', scope: 'Plant 1 — Assembly', persona: 'planner' },
  'Procurement / Sourcing Manager': { dept: 'Procurement & Sourcing', scope: 'All Plants (4)', persona: 'procurement' },
};

export const DEFAULT_ROLE = 'Head of Supply Chain';

export const PLANT_SCOPES = [
  'All Plants (4)',
  'Plant 1 — Assembly',
  'Plant 2 — Engine Hub',
  'Plant 3 — Microelectronics',
  'Plant 4 — Fastener Depot',
];

export const MATERIALS = [
  { id: 'MAT-1082', name: 'Hydraulic Pump 250BAR', category: 'Components', plant: 'Plant 1', qty: 930, uom: 'EA', unitCost: 600.0, value: 558000.0, abcClass: 'A' },
  { id: 'MAT-4120', name: 'Microcontroller MCU-64', category: 'Components', plant: 'Plant 3', qty: 920.00, uom: 'EA', unitCost: 78.65, value: 72358.00, abcClass: 'A' },
  { id: 'MAT-2041', name: 'Lithium Cell 21700', category: 'Raw Materials', plant: 'Plant 2', qty: 142000, uom: 'EA', unitCost: 5.14, value: 729880.0, abcClass: 'A' },
  { id: 'MAT-5501', name: 'High-Temp Sealant Paste', category: 'Consumables', plant: 'Plant 1', qty: 1400, uom: 'KG', unitCost: 41.14, value: 57600.0, abcClass: 'C' },
];

export const CONNECTORS_STATIC = [
  { id: 'erp1', label: 'ERP System', desc: 'SAP S/4HANA, Oracle NetSuite, Microsoft Dynamics or another ERP', cta: 'Connect ERP' },
  { id: 'wh', label: 'Data Warehouse', desc: 'Snowflake, BigQuery, Redshift or another warehouse', cta: 'Connect Warehouse' },
  { id: 'file', label: 'File Upload', desc: 'CSV or Excel extract, for a one-time or manual load', cta: 'Upload File' },
];

export const SQL_TABLE_OPTIONS = {
  inventory: ['inventory_master', 'sku_ledger', 'stock_position_v2'],
  transactions: ['stock_movements', 'gr_gi_history', 'transaction_log'],
  bom: ['bom_structure', 'material_bom', 'bom_master'],
};

export const RAW_MATERIAL_ROWS = [
  { id: 'MAT-1082', name: 'Hydraulic Pump', qtyPerUnit: 1.0, p1: 770, p2: 900, p3: 930, coverage: 'risk' },
  { id: 'MAT-3390', name: 'Steel Housing', qtyPerUnit: 1.0, p1: 1800, p2: 1800, p3: 1800, coverage: 'watch' },
  { id: 'MAT-1177', name: 'Seal Kit', qtyPerUnit: 2.0, p1: 3600, p2: 3600, p3: 3600, coverage: 'ok' },
  { id: 'MAT-2041', name: 'Lithium Cell 21700', qtyPerUnit: 0.5, p1: 900, p2: 900, p3: 900, coverage: 'ok' },
  { id: 'MAT-4120', name: 'Microcontroller MCU-64', qtyPerUnit: 1.0, p1: 1800, p2: 1800, p3: 1800, coverage: 'risk' },
];

export const RMLC_STAGES = [
  { key: 'accumulation', label: 'Accumulation', value: 4.10, count: 86, desc: 'Building faster than consumption', rule: 'Alert rule: inflow > 1.5× trailing consumption for 3 consecutive weeks', tone: 'watch' },
  { key: 'active', label: 'Active Circulation', value: 34.60, count: 1140, desc: 'Turning within policy', rule: 'Alert rule: none — within expected turnover band', tone: 'ok' },
  { key: 'atrisk', label: 'At Risk', value: 1.94, count: 76, desc: '90–180 days without consumption', rule: 'Alert rule: 0 consumption events in 90 days', tone: 'risk' },
  { key: 'liquidation', label: 'Liquidation', value: 2.10, count: 118, desc: 'Past 180-day threshold', rule: 'Alert rule: 0 consumption events in 180 days', tone: 'risk' },
];

// The same four stages split by plant. Each stage sums back to the all-plant totals in RMLC_STAGES above.
export const RMLC_STAGES_BY_PLANT = [
  { plant: 'Plant 1', name: 'Plant 1 — Assembly', stages: { accumulation: { value: 1.20, count: 26 }, active: { value: 10.40, count: 340 }, atrisk: { value: 0.52, count: 20 }, liquidation: { value: 0.55, count: 30 } } },
  { plant: 'Plant 2', name: 'Plant 2 — Engine Hub', stages: { accumulation: { value: 1.55, count: 32 }, active: { value: 11.30, count: 380 }, atrisk: { value: 0.68, count: 26 }, liquidation: { value: 0.80, count: 42 } } },
  { plant: 'Plant 3', name: 'Plant 3 — Microelectronics', stages: { accumulation: { value: 0.85, count: 18 }, active: { value: 8.10, count: 270 }, atrisk: { value: 0.44, count: 18 }, liquidation: { value: 0.45, count: 26 } } },
  { plant: 'Plant 4', name: 'Plant 4 — Fastener Depot', stages: { accumulation: { value: 0.50, count: 10 }, active: { value: 4.80, count: 150 }, atrisk: { value: 0.30, count: 12 }, liquidation: { value: 0.30, count: 20 } } },
];

// Expiry and SLOB detail per plant (values in $M, cumulative by horizon: d60 includes d30). Expired stock is kept
// separate from slow-moving (At Risk) and potentially obsolete (Liquidation) stock in RMLC_STAGES_BY_PLANT.
export const EXPIRY_BY_PLANT = {
  'Plant 1': { expired: { value: 0.06, lots: 3 }, d30: 0.06, d60: 0.12, d90: 0.21, expiringBeforeUse: 5, pullableLots: 3, openPoOnSlob: 0.22, cancellablePo: 0.15 },
  'Plant 2': { expired: { value: 0.08, lots: 3 }, d30: 0.07, d60: 0.16, d90: 0.30, expiringBeforeUse: 6, pullableLots: 2, openPoOnSlob: 0.31, cancellablePo: 0.2 },
  'Plant 3': { expired: { value: 0.04, lots: 2 }, d30: 0.03, d60: 0.08, d90: 0.15, expiringBeforeUse: 3, pullableLots: 2, openPoOnSlob: 0.18, cancellablePo: 0.11 },
  'Plant 4': { expired: { value: 0.03, lots: 1 }, d30: 0.02, d60: 0.06, d90: 0.11, expiringBeforeUse: 2, pullableLots: 1, openPoOnSlob: 0.09, cancellablePo: 0.06 },
};

// Multivariate diagnostics: records that look unusual across several factors together. `impact` is the business
// exposure in $ (shortage or excess), which sets the ranking; `score` is the statistical anomaly score (on-demand detail only).
// `kinds` decide which persona sees the record: balance/movement (inventory), production/shortage (planner),
// leadtime/ordersize/supplier (procurement); the Head of Supply Chain sees all of them.
export const ANOMALIES = [
  { id: 'A-01', record: 'MAT-4120 · Plant 3', what: 'Cover fell to 14 days against a 60-day lead time while demand kept rising', factors: ['Demand +1.2%/wk', 'Allocated supply', '60-day lead time'], peer: 'Peers in Class A hold 70+ days', exposure: 'shortage', impact: 1.82, priority: 'High', kinds: ['production', 'shortage', 'supplier'], score: 0.91, expected: '62 days of cover', observed: '14 days of cover', freshness: '2 hours ago' },
  { id: 'A-02', record: 'MAT-3390 · Plant 1', what: 'Two Plant 1 warehouses hold diverging balances; total stock 34% over optimal', factors: ['Duplicate replenishment', 'No cross-warehouse visibility'], peer: 'Other plants hold one balance', exposure: 'excess', impact: 1.12, priority: 'High', kinds: ['balance'], score: 0.84, expected: '1,340 EA', observed: '1,800 EA', freshness: '2 hours ago' },
  { id: 'A-03', record: 'MAT-1082 · HydraTech Dynamics', what: 'Lead time averaged 66 days over the last 6 receipts against a 60-day contract', factors: ['Sole source', 'Late tail widening'], peer: 'Other component suppliers: +1 day', exposure: 'shortage', impact: 0.62, priority: 'Medium', kinds: ['leadtime', 'supplier', 'shortage'], score: 0.77, expected: '60 days', observed: '66 days', freshness: '1 day ago' },
  { id: 'A-04', record: 'MAT-1177 · Seal Kit PO', what: 'Last purchase order was 3× the usual order size', factors: ['Manual PO override', 'No demand change'], peer: 'Typical PO 1,200 EA', exposure: 'excess', impact: 0.21, priority: 'Medium', kinds: ['ordersize', 'balance'], score: 0.81, expected: '1,200 EA', observed: '3,600 EA', freshness: '6 hours ago' },
  { id: 'A-05', record: 'MAT-2041 · Lot L-2241, Plant 2', what: 'One lot stopped moving while the material overall consumes normally', factors: ['Cell-matching spec change', 'Lot bypassed in picking'], peer: 'Other lots turn every 21 days', exposure: 'excess', impact: 0.1, priority: 'Medium', kinds: ['movement', 'production'], score: 0.69, expected: 'Issued within 21 days', observed: '64 days idle', freshness: '2 hours ago' },
  { id: 'A-06', record: 'SiliconFoundry International', what: '3 of the last 5 deliveries arrived as split shipments', factors: ['Allocation', 'Partial confirmations'], peer: 'Other suppliers: 1 in 20', exposure: 'shortage', impact: 0.4, priority: 'Medium', kinds: ['supplier', 'leadtime'], score: 0.72, expected: 'Full shipments', observed: '3 of 5 split', freshness: '1 day ago' },
  { id: 'A-07', record: 'MAT-5501 · Plant 1', what: 'Consumption dropped to zero after a design change but replenishment continued', factors: ['Design change', 'Standing reorder'], peer: 'Plant 2 still consumes it', exposure: 'excess', impact: 0.06, priority: 'Low', kinds: ['movement', 'production', 'ordersize'], score: 0.88, expected: '16 KG/day', observed: '0 KG/day', freshness: '2 hours ago' },
  { id: 'A-08', record: 'MAT-8812 · Fastener, Plant 4', what: 'Weekly issues spiked to 3.9σ above normal', factors: ['One-off maintenance kit'], peer: 'Within plant norms after one week', exposure: 'none', impact: 0.004, priority: 'Low', kinds: ['movement'], score: 0.95, expected: '2,100 EA/wk', observed: '5,900 EA/wk', freshness: '2 hours ago', unusualOnly: true },
];

export const DECISION_ROWS = [
  { id: 'd1', tag: 'Act now', tone: 'risk', title: 'Authorize expedited PO — MAT-4120', meta: 'Stockout in 14 days · Plant 3 · Confidence 94.80%', impact: '+$1.82M protected' },
  { id: 'd2', tag: 'Optimize', tone: 'accent', title: 'Recalibrate lot size — 46 Class A materials', meta: 'EOQ recalibration · Confidence 94.80%', impact: '+$3.65M released' },
  { id: 'd3', tag: 'Monitor', tone: 'watch', title: 'Track Plant 3 service level recovery', meta: 'Currently 94.50% vs 98.00% target', impact: 'Risk mitigation' },
  { id: 'd4', tag: 'Prevent', tone: 'neutral', title: 'Transfer MAT-5501 to Plant 2 before expiry', meta: '165 days stagnant · RMLC liquidation stage', impact: '+$57,600.00 salvage' },
];

export const EOQ_INPUTS = {
  'MAT-1082': { demand: 4800.0, currentBatchQty: 600.0 },
  'MAT-4120': { demand: 24000.0, currentBatchQty: 3000.0 },
  'MAT-2041': { demand: 420000.0, currentBatchQty: 60000.0 },
  'MAT-5501': { demand: 6000.0, currentBatchQty: 1400.0 },
};

export const FORECAST_INPUTS = {
  'MAT-1082': { leadTimeDays: 60, demandCV: 0.12, trendPerWeek: 0.002, modelR2: 0.91, rmseRatio: 0.09 },
  'MAT-4120': { leadTimeDays: 60, demandCV: 0.28, trendPerWeek: 0.012, modelR2: 0.78, rmseRatio: 0.22 },
  'MAT-2041': { leadTimeDays: 30, demandCV: 0.10, trendPerWeek: 0.001, modelR2: 0.93, rmseRatio: 0.08 },
  'MAT-5501': { leadTimeDays: 21, demandCV: 0.15, trendPerWeek: 0.000, modelR2: 0.87, rmseRatio: 0.12 },
};


