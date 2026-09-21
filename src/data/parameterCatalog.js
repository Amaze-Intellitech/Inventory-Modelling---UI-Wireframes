// Candidate independent variables for the Multivariate model (design bible §5.3 / §6.3).
// The named seed parameters come from the SME session; the customer keeps the ones that apply and declares a source for each.
// `on: false` = not selected by default (e.g. a site with only open warehouses has no storage tanks).

export const SOURCE_OPTIONS = ['SAP', 'Oracle', 'DCS', 'PCS', 'LIMS', 'Supplier feed', 'Custom software', 'External feed', 'Excel upload'];

export const PARAMETER_CATALOG = [
  {
    category: 'Commercial & demand',
    items: [
      { id: 'price', label: 'Price', source: 'SAP', on: true },
      { id: 'seasonality', label: 'Seasonality', source: 'External feed', on: true },
      { id: 'fg-demand', label: 'Finished-goods demand', source: 'SAP', on: true },
      { id: 'substitution', label: 'Material substitution', source: 'SAP', on: true },
      { id: 'promotions', label: 'Promotions and campaigns', source: 'Custom software', on: false },
      { id: 'backlog', label: 'Customer order backlog', source: 'SAP', on: true },
      { id: 'contract-vol', label: 'Contract volumes', source: 'SAP', on: true },
      { id: 'forecast-bias', label: 'Forecast bias', source: 'Custom software', on: false },
      { id: 'returns', label: 'Return rate', source: 'SAP', on: false },
      { id: 'channel-mix', label: 'Channel mix', source: 'Excel upload', on: false },
    ],
  },
  {
    category: 'Production & internal operations',
    items: [
      { id: 'production', label: 'Production volume (per unit)', source: 'DCS', on: true },
      { id: 'wip', label: 'Work in progress (WIP)', source: 'SAP', on: true },
      { id: 'quality', label: 'Quality of finished good', source: 'LIMS', on: true },
      { id: 'storage-cap', label: 'Storage capacity', source: 'SAP', on: true },
      { id: 'storage-occ', label: 'Storage occupancy (%)', source: 'SAP', on: true },
      { id: 'storage-tank', label: 'Storage tank capacity', source: '', on: false, note: 'Not applicable to this site' },
      { id: 'downtime', label: 'Planned downtime', source: 'PCS', on: true },
      { id: 'yield', label: 'Yield rate', source: 'DCS', on: true },
      { id: 'batch', label: 'Batch size', source: 'PCS', on: true },
      { id: 'changeover', label: 'Changeover time', source: 'PCS', on: false },
      { id: 'shifts', label: 'Shift pattern', source: 'Excel upload', on: false },
      { id: 'scrap', label: 'Scrap rate', source: 'DCS', on: true },
    ],
  },
  {
    category: 'Supplier',
    items: [
      { id: 'supplier', label: 'Supplier (identity and terms)', source: 'Supplier feed', on: true },
      { id: 'lead-time', label: 'Supplier lead time', source: 'Supplier feed', on: true },
      { id: 'capacity', label: 'Supplier capacity', source: 'Supplier feed', on: true },
      { id: 'discount', label: 'Supplier discount', source: 'Supplier feed', on: true },
      { id: 'otd', label: 'On-time delivery rate', source: 'SAP', on: true },
      { id: 'moq', label: 'Minimum order quantity', source: 'SAP', on: true },
      { id: 'pay-terms', label: 'Payment terms', source: 'SAP', on: false },
      { id: 'transit', label: 'Transit mode', source: 'Supplier feed', on: false },
      { id: 'rejects', label: 'Quality rejection rate', source: 'LIMS', on: false },
      { id: 'single-src', label: 'Single-source flag', source: 'SAP', on: true },
    ],
  },
  {
    category: 'External & macro',
    items: [
      { id: 'fx', label: 'Foreign exchange (e.g. INR/USD)', source: 'External feed', on: true },
      { id: 'market', label: 'External market conditions', source: 'External feed', on: true },
      { id: 'regulatory', label: 'Regulatory factors', source: 'External feed', on: false },
      { id: 'geo', label: 'Geopolitical factors', source: 'External feed', on: false },
      { id: 'commodity', label: 'Commodity index', source: 'External feed', on: true },
      { id: 'fuel', label: 'Fuel price', source: 'External feed', on: false },
      { id: 'weather', label: 'Weather', source: 'External feed', on: false },
      { id: 'port', label: 'Port congestion', source: 'External feed', on: false },
      { id: 'tariff', label: 'Tariffs and duties', source: 'External feed', on: false },
      { id: 'inflation', label: 'Inflation', source: 'External feed', on: false },
    ],
  },
];

// ---- Which connector provides each source system (Data sources step) ----
// Connector ids match the cards on the Data sources screen.
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

// Years a customer's history can start in (design bible §6.3: "some have data back to 2010, others only 2016 or 2020").
export const RANGE_YEARS = Array.from({ length: 16 }, (_, i) => String(2010 + i));

/** The range that applies to one parameter: its own override if it has one, else the material-level default. */
export function effectiveRange(row, selection) {
  return { from: row.from || selection.fromYear, to: row.to || selection.toYear || DEFAULT_TO };
}

export function formatRange({ from, to }) {
  return `${from} – ${to === 'today' ? 'today' : to}`;
}

export function isRangeValid({ from, to }) {
  return to === 'today' || Number(from) <= Number(to);
}

/** The catalogue defaults as a selection: which parameters are on, and the source declared for each. */
export function defaultParameterSelection() {
  const rows = {};
  PARAMETER_CATALOG.forEach((g) => g.items.forEach((p) => { rows[p.id] = { on: p.on, source: p.source }; }));
  return { rows, fromYear: DEFAULT_FROM_YEAR, toYear: DEFAULT_TO };
}

/**
 * The connectors the selected parameters need, with how many parameters depend on each,
 * for example [{ id: 'erp', label: 'ERP System', count: 14 }, …]. Largest first.
 */
export function requiredConnectors(rows) {
  const counts = {};
  Object.values(rows).forEach((r) => {
    const id = r.on && r.source ? SOURCE_TO_CONNECTOR[r.source] : null;
    if (id) counts[id] = (counts[id] || 0) + 1;
  });
  return Object.entries(counts)
    .map(([id, count]) => ({ id, label: CONNECTOR_LABELS[id], count }))
    .sort((a, b) => b.count - a.count);
}
