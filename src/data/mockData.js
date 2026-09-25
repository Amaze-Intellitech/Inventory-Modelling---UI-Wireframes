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
  'MAT-1082': {
    targetVariable: 'Physical On-Hand Stock (EA)',
    targetField: 'stock',
    leadTimeDays: 60,
    demandCV: 0.12,
    trendPerWeek: 0.002,
    intercept: 42.50,
    modelR2: 0.912,
    adjustedR2: 0.908,
    inSampleRMSE: 14.20,
    inSampleMAE: 11.50,
    validationAccuracy: 0.9909,
    wape: 0.0091,
    validationMAE: 9.12,
    validationRMSE: 9.74,
    validationMSE: 94.88,
    forecastBias: 0.88,
    residualStdDev: 10.38,
    normalizedRMSE: 0.0097,
    autocorrelationLag1: 0.08,
    durbinWatson: 1.84,
    heteroscedasticityPValue: 0.34,
    skewness: 0.12,
    kurtosis: 2.94,
    driftScore: 0.03,
    previousStockForecast: 980.0,
    drivers: [
      { name: 'Lagged Physical Stock (t-1)', category: 'Historical State', share: 40, beta: 0.88, direction: 'up', vif: 3.1, note: 'Autoregressive stock level persistence' },
      { name: 'Finished-Goods Demand Pull (HEX-200 / IL-450)', category: 'Commercial & Demand', share: 32, beta: -0.54, direction: 'down', vif: 2.8, note: 'Master assembly line consumption drain' },
      { name: 'Supplier Transit & Lead-Time Latency', category: 'Supplier Logistics', share: 16, beta: -0.22, direction: 'down', vif: 2.1, note: 'Transit lead-time exposure delay' },
      { name: 'Inbound Replenishment Batch Receipts', category: 'Procurement Policy', share: 8, beta: 0.36, direction: 'up', vif: 1.9, note: 'Scheduled purchase lot replenishment' },
      { name: 'Raw Material Spot / Catalog Price Index', category: 'Commercial Terms', share: 4, beta: -0.08, direction: 'flat', vif: 1.4, note: 'Price elasticity on reorder frequency' },
    ],
    backtestHistory: [
      { week: 'Wk -8', actual: 1020.0, predicted: 1010.0, error: 10.0 },
      { week: 'Wk -7', actual: 985.0, predicted: 995.0, error: -10.0 },
      { week: 'Wk -6', actual: 1140.0, predicted: 1125.0, error: 15.0 },
      { week: 'Wk -5', actual: 1050.0, predicted: 1062.0, error: -12.0 },
      { week: 'Wk -4', actual: 990.0, predicted: 980.0, error: 10.0 },
      { week: 'Wk -3', actual: 945.0, predicted: 952.0, error: -7.0 },
      { week: 'Wk -2', actual: 960.0, predicted: 955.0, error: 5.0 },
      { week: 'Wk -1', actual: 930.0, predicted: 934.0, error: -4.0 },
    ],
    outliers: {
      maxPositive: { week: 'Wk -6', actual: 1140.0, predicted: 1125.0, error: 15.0, reason: 'Early partial vendor drop before scheduled window' },
      maxNegative: { week: 'Wk -5', actual: 1050.0, predicted: 1062.0, error: -12.0, reason: 'Downstream line surge on HEX-200 fabrication' },
    },
  },
  'MAT-4120': {
    targetVariable: 'Physical On-Hand Stock (EA)',
    targetField: 'stock',
    leadTimeDays: 60,
    demandCV: 0.28,
    trendPerWeek: 0.012,
    intercept: 85.00,
    modelR2: 0.785,
    adjustedR2: 0.776,
    inSampleRMSE: 38.50,
    inSampleMAE: 32.10,
    validationAccuracy: 0.9736,
    wape: 0.0264,
    validationMAE: 30.62,
    validationRMSE: 31.42,
    validationMSE: 987.22,
    forecastBias: -0.62,
    residualStdDev: 33.56,
    normalizedRMSE: 0.0271,
    autocorrelationLag1: -0.12,
    durbinWatson: 2.18,
    heteroscedasticityPValue: 0.28,
    skewness: -0.08,
    kurtosis: 2.82,
    driftScore: 0.14,
    previousStockForecast: 1050.0,
    drivers: [
      { name: 'Lagged Physical Stock (t-1)', category: 'Historical State', share: 36, beta: 0.72, direction: 'up', vif: 3.8, note: 'Historical microcontroller inventory baseline' },
      { name: 'Global Semiconductor Lead-Time Latency', category: 'Supplier Allocation', share: 34, beta: -0.58, direction: 'down', vif: 3.4, note: 'Wafer foundry delivery delays' },
      { name: 'ECU-400 Automotive Assembly Rate', category: 'Commercial & Demand', share: 20, beta: -0.42, direction: 'down', vif: 2.6, note: 'High velocity controller line pull' },
      { name: 'Inbound Batch Replenishment Receipts', category: 'Procurement Policy', share: 10, beta: 0.30, direction: 'up', vif: 1.8, note: 'Expedited lot arrivals' },
    ],
    backtestHistory: [
      { week: 'Wk -8', actual: 1250.0, predicted: 1220.0, error: 30.0 },
      { week: 'Wk -7', actual: 1100.0, predicted: 1135.0, error: -35.0 },
      { week: 'Wk -6', actual: 1480.0, predicted: 1440.0, error: 40.0 },
      { week: 'Wk -5', actual: 1320.0, predicted: 1360.0, error: -40.0 },
      { week: 'Wk -4', actual: 1180.0, predicted: 1160.0, error: 20.0 },
      { week: 'Wk -3', actual: 1050.0, predicted: 1075.0, error: -25.0 },
      { week: 'Wk -2', actual: 990.0, predicted: 960.0, error: 30.0 },
      { week: 'Wk -1', actual: 920.0, predicted: 945.0, error: -25.0 },
    ],
    outliers: {
      maxPositive: { week: 'Wk -6', actual: 1480.0, predicted: 1440.0, error: 40.0, reason: 'Spot buy arrival of emergency allocation batch' },
      maxNegative: { week: 'Wk -5', actual: 1320.0, predicted: 1360.0, error: -40.0, reason: 'ECU-400 production overtime shift consumption' },
    },
  },
  'MAT-2041': {
    targetVariable: 'Physical On-Hand Stock (EA)',
    targetField: 'stock',
    leadTimeDays: 30,
    demandCV: 0.10,
    trendPerWeek: 0.001,
    intercept: 1200.00,
    modelR2: 0.938,
    adjustedR2: 0.935,
    inSampleRMSE: 950.00,
    inSampleMAE: 840.00,
    validationAccuracy: 0.9949,
    wape: 0.0051,
    validationMAE: 812.50,
    validationRMSE: 852.90,
    validationMSE: 727436.41,
    forecastBias: 12.50,
    residualStdDev: 910.45,
    normalizedRMSE: 0.0053,
    autocorrelationLag1: 0.04,
    durbinWatson: 1.92,
    heteroscedasticityPValue: 0.41,
    skewness: 0.06,
    kurtosis: 3.02,
    driftScore: 0.02,
    previousStockForecast: 155000.0,
    drivers: [
      { name: 'Lagged Physical Stock (t-1)', category: 'Historical State', share: 45, beta: 0.92, direction: 'up', vif: 3.2, note: 'High continuous cell throughput baseline' },
      { name: 'Battery Pack Line Consumption (BP-800)', category: 'Commercial & Demand', share: 35, beta: -0.62, direction: 'down', vif: 2.9, note: 'Continuous module fabrication demand' },
      { name: 'Dual-Sourced Vendor Delivery Schedules', category: 'Supplier Logistics', share: 15, beta: 0.45, direction: 'up', vif: 2.2, note: 'Scheduled split-shipment receipts' },
      { name: 'Commodity Lithium Index Factor', category: 'External & Macro', share: 5, beta: -0.05, direction: 'flat', vif: 1.2, note: 'Long-term contract pricing factor' },
    ],
    backtestHistory: [
      { week: 'Wk -8', actual: 165000.0, predicted: 164200.0, error: 800.0 },
      { week: 'Wk -7', actual: 158000.0, predicted: 158900.0, error: -900.0 },
      { week: 'Wk -6', actual: 182000.0, predicted: 180800.0, error: 1200.0 },
      { week: 'Wk -5', actual: 171000.0, predicted: 172200.0, error: -1200.0 },
      { week: 'Wk -4', actual: 162000.0, predicted: 161300.0, error: 700.0 },
      { week: 'Wk -3', actual: 154000.0, predicted: 154600.0, error: -600.0 },
      { week: 'Wk -2', actual: 148000.0, predicted: 147400.0, error: 600.0 },
      { week: 'Wk -1', actual: 142000.0, predicted: 142500.0, error: -500.0 },
    ],
    outliers: {
      maxPositive: { week: 'Wk -6', actual: 182000.0, predicted: 180800.0, error: 1200.0, reason: 'Early container unloading at Plant 2 dock' },
      maxNegative: { week: 'Wk -5', actual: 171000.0, predicted: 172200.0, error: -1200.0, reason: 'BP-800 line acceleration for export order' },
    },
  },
  'MAT-5501': {
    targetVariable: 'Physical On-Hand Stock (KG)',
    targetField: 'stock',
    leadTimeDays: 21,
    demandCV: 0.15,
    trendPerWeek: 0.000,
    intercept: 65.00,
    modelR2: 0.874,
    adjustedR2: 0.868,
    inSampleRMSE: 19.40,
    inSampleMAE: 16.80,
    validationAccuracy: 0.9897,
    wape: 0.0103,
    validationMAE: 15.50,
    validationRMSE: 16.05,
    validationMSE: 257.60,
    forecastBias: -0.75,
    residualStdDev: 17.15,
    normalizedRMSE: 0.0108,
    autocorrelationLag1: -0.06,
    durbinWatson: 2.08,
    heteroscedasticityPValue: 0.38,
    skewness: -0.04,
    kurtosis: 2.88,
    driftScore: 0.05,
    previousStockForecast: 1460.0,
    drivers: [
      { name: 'Lagged Physical Stock (t-1)', category: 'Historical State', share: 42, beta: 0.84, direction: 'up', vif: 3.0, note: 'Consumable inventory persistence' },
      { name: 'Flange Sealing & Gasket Assembly Pull', category: 'Commercial & Demand', share: 30, beta: -0.48, direction: 'down', vif: 2.7, note: 'Steady line consumable consumption' },
      { name: 'Shelf-Life Expiry & Turn Cadence', category: 'Perishability Risk', share: 18, beta: -0.28, direction: 'down', vif: 2.4, note: 'Batch expiration liquidation factor' },
      { name: 'Multi-Vendor Inbound Replenishment', category: 'Procurement Policy', share: 10, beta: 0.32, direction: 'up', vif: 1.8, note: 'Local chemical distributor replenishment' },
    ],
    backtestHistory: [
      { week: 'Wk -8', actual: 1580.0, predicted: 1565.0, error: 15.0 },
      { week: 'Wk -7', actual: 1520.0, predicted: 1538.0, error: -18.0 },
      { week: 'Wk -6', actual: 1650.0, predicted: 1630.0, error: 20.0 },
      { week: 'Wk -5', actual: 1590.0, predicted: 1612.0, error: -22.0 },
      { week: 'Wk -4', actual: 1510.0, predicted: 1498.0, error: 12.0 },
      { week: 'Wk -3', actual: 1460.0, predicted: 1475.0, error: -15.0 },
      { week: 'Wk -2', actual: 1420.0, predicted: 1408.0, error: 12.0 },
      { week: 'Wk -1', actual: 1400.0, predicted: 1410.0, error: -10.0 },
    ],
    outliers: {
      maxPositive: { week: 'Wk -6', actual: 1650.0, predicted: 1630.0, error: 20.0, reason: 'Buffer delivery from secondary local distributor' },
      maxNegative: { week: 'Wk -5', actual: 1590.0, predicted: 1612.0, error: -22.0, reason: 'Flange resealing campaign consumable purge' },
    },
  },
};


