// Mock/illustrative data for the storyboard prototype.
// In the connected build, each of these is replaced by a call through
// frontend/src/Api/api.js into the corresponding backend engine
// (abc_analysis.py, eoq.py, optimization.py, etc.)

export const ROLE_CONTEXT = {
  'VP, Supply Chain Operations': { dept: 'Global Supply Chain', scope: 'All Plants (4)', persona: 'exec' },
  'Plant Operations Manager': { dept: 'Plant Operations', scope: 'Plant 1 — Assembly', persona: 'analyst' },
  'Procurement Lead': { dept: 'Procurement & Sourcing', scope: 'All Plants (4)', persona: 'analyst' },
  'Inventory Analyst': { dept: 'Supply Chain Analytics', scope: 'All Plants (4)', persona: 'ds' },
};

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


