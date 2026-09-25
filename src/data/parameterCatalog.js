// Candidate dependent and independent variables for Inventory Modelling.
// The customer keeps the ones that apply and declares a source and table for each.

export const SOURCE_OPTIONS = [
  'SAP',
  'Oracle',
  'DCS',
  'PCS',
  'LIMS',
  'Supplier feed',
  'Custom software',
  'External feed',
  'Excel upload',
];

export const SOURCE_TABLE_OPTIONS = {
  SAP: [
    'MBEW',
    'MARA',
    'MARC',
    'MARD',
    'MSEG',
    'VBAK',
    'VBAP',
    'EKKO',
    'EKPO',
    'ZPRICE',
  ],
  Oracle: [
    'INVENTORY_ITEMS',
    'ITEM_COSTS',
    'TRANSACTION_HISTORY',
    'PURCHASE_ORDERS',
    'SALES_ORDERS',
    'QUALITY_MASTER',
    'SUPPLIER_MASTER',
  ],
  DCS: [
    'PROCESS_TELEMETRY',
    'PRODUCTION_LOGS',
    'YIELD_METRICS',
    'LINE_SPEED',
    'SCRAP_RECORDS',
  ],
  PCS: [
    'EQUIPMENT_STATUS',
    'DOWNTIME_LOGS',
    'BATCH_EXECUTION',
    'CHANGEOVER_EVENTS',
    'MAINTENANCE_EVENTS',
  ],
  LIMS: [
    'QUALITY_INSPECTION',
    'BATCH_RELEASE',
    'NON_CONFORMANCE',
    'ASSAY_RESULTS',
    'REJECTION_LOG',
  ],
  'Supplier feed': [
    'SUPPLIER_PORTAL_EDI',
    'LEAD_TIME_FEED',
    'CAPACITY_FORECAST',
    'DISCOUNT_TIERS',
    'ASN_DISPATCH',
  ],
  'Custom software': [
    'CUSTOM_FORECAST_BIAS',
    'PROMOTIONS_CALENDAR',
    'CHANNEL_ALLOCATION',
    'INTERNAL_REPORTS',
  ],
  'External feed': [
    'COMMODITY_INDICES',
    'FX_RATES',
    'MARKET_BENCHMARKS',
    'WEATHER_FEED',
    'PORT_CONGESTION_DATA',
    'INFLATION_METRICS',
  ],
  'Excel upload': [
    'MANUAL_SCHEDULE_EXTRACT.xlsx',
    'SHIFT_PATTERNS.xlsx',
    'ANNUAL_TARGETS.xlsx',
    'ONE_TIME_ADJUSTMENTS.csv',
  ],
};

// ---- Available Dependent Variables ----
export const DEPENDENT_VARIABLES = [
  {
    id: 'stock',
    label: 'Stock',
    category: 'Dependent variable',
    source: 'SAP',
    table: 'MBEW',
    required: true,
    isDependent: true,
    note: 'Primary target metric for inventory analysis & simulation',
  },
];

// ---- Available Independent Variables ----
export const PARAMETER_CATALOG = [
  {
    category: 'Commercial & demand',
    items: [
      { id: 'price', label: 'Price', source: 'SAP', table: 'ZPRICE', on: false },
      { id: 'seasonality', label: 'Seasonality', source: 'External feed', table: 'MARKET_BENCHMARKS', on: false },
      { id: 'fg-demand', label: 'Finished-goods demand', source: 'SAP', table: 'VBAK', on: false },
      { id: 'substitution', label: 'Material substitution', source: 'SAP', table: 'MARA', on: false },
      { id: 'promotions', label: 'Promotions and campaigns', source: 'Custom software', table: 'PROMOTIONS_CALENDAR', on: false },
      { id: 'backlog', label: 'Customer order backlog', source: 'SAP', table: 'VBAP', on: false },
      { id: 'contract-vol', label: 'Contract volumes', source: 'SAP', table: 'EKKO', on: false },
      { id: 'forecast-bias', label: 'Forecast bias', source: 'Custom software', table: 'CUSTOM_FORECAST_BIAS', on: false },
      { id: 'returns', label: 'Return rate', source: 'SAP', table: 'MSEG', on: false },
      { id: 'channel-mix', label: 'Channel mix', source: 'Excel upload', table: 'MANUAL_SCHEDULE_EXTRACT.xlsx', on: false },
    ],
  },
  {
    category: 'Production & internal operations',
    items: [
      { id: 'production', label: 'Production volume (per unit)', source: 'DCS', table: 'PRODUCTION_LOGS', on: false },
      { id: 'wip', label: 'Work in progress (WIP)', source: 'SAP', table: 'MSEG', on: false },
      { id: 'quality', label: 'Quality of finished good', source: 'LIMS', table: 'QUALITY_INSPECTION', on: false },
      { id: 'storage-cap', label: 'Storage capacity', source: 'SAP', table: 'MARD', on: false },
      { id: 'storage-occ', label: 'Storage occupancy (%)', source: 'SAP', table: 'MARD', on: false },
      { id: 'storage-tank', label: 'Storage tank capacity', source: 'SAP', table: 'MARD', on: false, note: 'Not applicable to this site' },
      { id: 'downtime', label: 'Planned downtime', source: 'PCS', table: 'DOWNTIME_LOGS', on: false },
      { id: 'yield', label: 'Yield rate', source: 'DCS', table: 'YIELD_METRICS', on: false },
      { id: 'batch', label: 'Batch size', source: 'PCS', table: 'BATCH_EXECUTION', on: false },
      { id: 'changeover', label: 'Changeover time', source: 'PCS', table: 'CHANGEOVER_EVENTS', on: false },
      { id: 'shifts', label: 'Shift pattern', source: 'Excel upload', table: 'SHIFT_PATTERNS.xlsx', on: false },
      { id: 'scrap', label: 'Scrap rate', source: 'DCS', table: 'SCRAP_RECORDS', on: false },
    ],
  },
  {
    category: 'Supplier',
    items: [
      { id: 'supplier', label: 'Supplier (identity and terms)', source: 'Supplier feed', table: 'SUPPLIER_PORTAL_EDI', on: false },
      { id: 'lead-time', label: 'Supplier lead time', source: 'Supplier feed', table: 'LEAD_TIME_FEED', on: false },
      { id: 'capacity', label: 'Supplier capacity', source: 'Supplier feed', table: 'CAPACITY_FORECAST', on: false },
      { id: 'discount', label: 'Supplier discount', source: 'Supplier feed', table: 'DISCOUNT_TIERS', on: false },
      { id: 'otd', label: 'On-time delivery rate', source: 'SAP', table: 'EKPO', on: false },
      { id: 'moq', label: 'Minimum order quantity', source: 'SAP', table: 'MARC', on: false },
      { id: 'pay-terms', label: 'Payment terms', source: 'SAP', table: 'EKKO', on: false },
      { id: 'transit', label: 'Transit mode', source: 'Supplier feed', table: 'ASN_DISPATCH', on: false },
      { id: 'rejects', label: 'Quality rejection rate', source: 'LIMS', table: 'REJECTION_LOG', on: false },
      { id: 'single-src', label: 'Single-source flag', source: 'SAP', table: 'MARC', on: false },
    ],
  },
  {
    category: 'External & macro',
    items: [
      { id: 'fx', label: 'Foreign exchange (e.g. INR/USD)', source: 'External feed', table: 'FX_RATES', on: false },
      { id: 'market', label: 'External market conditions', source: 'External feed', table: 'MARKET_BENCHMARKS', on: false },
      { id: 'regulatory', label: 'Regulatory factors', source: 'External feed', table: 'MARKET_BENCHMARKS', on: false },
      { id: 'geo', label: 'Geopolitical factors', source: 'External feed', table: 'MARKET_BENCHMARKS', on: false },
      { id: 'commodity', label: 'Commodity index', source: 'External feed', table: 'COMMODITY_INDICES', on: false },
      { id: 'fuel', label: 'Fuel price', source: 'External feed', table: 'COMMODITY_INDICES', on: false },
      { id: 'weather', label: 'Weather', source: 'External feed', table: 'WEATHER_FEED', on: false },
      { id: 'port', label: 'Port congestion', source: 'External feed', table: 'PORT_CONGESTION_DATA', on: false },
      { id: 'tariff', label: 'Tariffs and duties', source: 'External feed', table: 'MARKET_BENCHMARKS', on: false },
      { id: 'inflation', label: 'Inflation', source: 'External feed', table: 'INFLATION_METRICS', on: false },
    ],
  },
];

// ---- Which connector provides each source system (Data sources step) ----
export const CONNECTOR_LABELS = {
  erp: 'ERP System',
  sql: 'SQL Database',
  warehouse: 'Data Warehouse',
  file: 'File Upload',
  rest: 'REST API & Webhooks',
  streaming: 'Streaming & Kafka',
  storage: 'Cloud Storage',
};

export const SOURCE_TO_CONNECTOR = {
  SAP: 'erp',
  Oracle: 'erp',
  DCS: 'streaming',
  PCS: 'streaming',
  LIMS: 'sql',
  'Custom software': 'sql',
  'Supplier feed': 'rest',
  'External feed': 'rest',
  'Excel upload': 'file',
};

export const DEFAULT_FROM_YEAR = '2016';
export const DEFAULT_TO = 'today';

export const RANGE_YEARS = Array.from({ length: 16 }, (_, i) => String(2010 + i));

/** The range helper preserved for global workflow compatibility. */
export function effectiveRange(row = {}, selection = {}) {
  return { from: row.from || selection.fromYear || DEFAULT_FROM_YEAR, to: row.to || selection.toYear || DEFAULT_TO };
}

export function formatRange({ from, to }) {
  return `${from} – ${to === 'today' ? 'today' : to}`;
}

export function isRangeValid({ from, to }) {
  return to === 'today' || Number(from) <= Number(to);
}

/** Flattened list of all variables (dependent + independent) */
export function getAllAvailableColumns() {
  const dep = DEPENDENT_VARIABLES.map((v) => ({ ...v, isDependent: true, groupCategory: 'Dependent variables' }));
  const ind = PARAMETER_CATALOG.flatMap((g) =>
    g.items.map((p) => ({ ...p, isDependent: false, groupCategory: g.category }))
  );
  return [...dep, ...ind];
}

/** The catalogue defaults: Stock is required & selected; candidate drivers are available on the left. */
export function defaultParameterSelection() {
  const rows = {
    stock: {
      on: true,
      source: 'SAP',
      table: 'MBEW',
      required: true,
    },
  };
  PARAMETER_CATALOG.forEach((g) =>
    g.items.forEach((p) => {
      rows[p.id] = {
        on: false,
        source: p.source || 'SAP',
        table: p.table || (SOURCE_TABLE_OPTIONS[p.source || 'SAP'] ? SOURCE_TABLE_OPTIONS[p.source || 'SAP'][0] : 'MBEW'),
      };
    })
  );
  return { rows, fromYear: DEFAULT_FROM_YEAR, toYear: DEFAULT_TO };
}

/**
 * The connectors the selected parameters need, with how many parameters depend on each.
 */
export function requiredConnectors(rows = {}) {
  const counts = {};
  Object.values(rows).forEach((r) => {
    if (r && r.on && r.source) {
      const id = SOURCE_TO_CONNECTOR[r.source];
      if (id) counts[id] = (counts[id] || 0) + 1;
    }
  });
  return Object.entries(counts)
    .map(([id, count]) => ({ id, label: CONNECTOR_LABELS[id] || id, count }))
    .sort((a, b) => b.count - a.count);
}
