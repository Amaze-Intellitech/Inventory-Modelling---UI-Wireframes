// Model variables for the Multivariate model (design bible §5.3 / §6.3).
// base_stock is the one dependent variable and is always in the model; every other variable is an independent
// (candidate driver) that the customer drags into the model and then declares a source for.
// Each variable carries the source it most often comes from, as a starting suggestion.

export const SOURCE_OPTIONS = ['SAP', 'Oracle', 'DCS', 'PCS', 'LIMS', 'Supplier feed', 'Custom software', 'External feed', 'Excel upload'];

export const DEPENDENT_VARIABLE = { id: 'base_stock', source: 'SAP' };

// [id, suggested source], in the order the model team listed them.
const INDEPENDENT = [
  ['date', 'SAP'], ['weekend_flag', 'External feed'], ['holiday_flag', 'External feed'], ['season', 'External feed'],
  ['demand', 'SAP'], ['sales_qty', 'SAP'], ['price', 'SAP'], ['sales_value', 'SAP'],
  ['inbound_qty', 'SAP'], ['outbound_qty', 'SAP'], ['closing_stock', 'SAP'], ['safety_stock', 'SAP'],
  ['reorder_point', 'SAP'], ['max_stock_level', 'SAP'], ['min_stock_level', 'SAP'],
  ['production_capacity', 'DCS'], ['production_qty', 'DCS'], ['lead_time_days', 'SAP'],
  ['supplier_lead_time', 'Supplier feed'], ['supplier_capacity', 'Supplier feed'], ['supplier_reliability', 'Supplier feed'],
  ['product_id', 'SAP'], ['material_code', 'SAP'], ['material_group', 'SAP'], ['material_type', 'SAP'],
  ['product_category', 'SAP'], ['product_subcategory', 'SAP'], ['uom', 'SAP'], ['product_type', 'SAP'],
  ['shelf_life_days', 'SAP'], ['expiry_flag', 'SAP'], ['batch_required_flag', 'SAP'], ['serial_required_flag', 'SAP'],
  ['substitute_available_flag', 'SAP'], ['is_substitute_for_other', 'SAP'], ['quality_grade', 'LIMS'], ['quality_score', 'LIMS'],
  ['location_id', 'SAP'], ['warehouse_id', 'SAP'], ['plant_id', 'SAP'], ['distribution_channel', 'SAP'],
  ['region', 'SAP'], ['inventory_channel', 'SAP'], ['stock_in_transit', 'SAP'], ['inventory_value', 'SAP'],
  ['inventory_carrying_cost', 'SAP'], ['inventory_overage_ratio', 'Custom software'],
  ['machine_availability', 'PCS'], ['plant_availability', 'PCS'], ['planned_shutdown_flag', 'PCS'], ['maintenance_flag', 'PCS'],
  ['consumption_qty', 'SAP'], ['bill_of_material_qty', 'SAP'], ['yield_rate', 'DCS'],
  ['supplier_id', 'Supplier feed'], ['supplier_discount', 'Supplier feed'], ['supplier_price', 'Supplier feed'],
  ['price_forecast', 'Custom software'], ['discount', 'SAP'], ['promotion_flag', 'Custom software'], ['promotion_type', 'Custom software'],
  ['marketing_spend', 'Custom software'], ['advertisement_spend', 'Custom software'], ['branding_spend', 'Custom software'],
  ['sales_team_count', 'Custom software'], ['sales_activity_score', 'Custom software'],
  ['storage_capacity_rm', 'SAP'], ['storage_capacity_fg', 'SAP'], ['warehouse_capacity_utilization', 'SAP'],
  ['transport_constraint_flag', 'Supplier feed'], ['logistics_delay_days', 'Supplier feed'], ['freight_cost', 'Supplier feed'],
  ['inbound_delay', 'SAP'], ['outbound_delay', 'SAP'], ['substitution_demand', 'SAP'], ['cross_product_effect', 'Custom software'],
  ['competitor_price', 'External feed'], ['competitor_promotion_flag', 'External feed'], ['competitor_stock_flag', 'External feed'],
  ['weather_index', 'External feed'], ['festival_flag', 'External feed'], ['event_flag', 'External feed'],
  ['gdp_growth', 'External feed'], ['inflation_rate', 'External feed'], ['interest_rate', 'External feed'],
  ['consumer_confidence_index', 'External feed'], ['disposable_income', 'External feed'], ['unemployment_rate', 'External feed'],
  ['industrial_growth_rate', 'External feed'], ['purchase_frequency', 'SAP'], ['demographics_index', 'Excel upload'],
  ['wip', 'SAP'], ['storage_days', 'SAP'], ['receivable_days', 'SAP'], ['payable_days', 'SAP'],
];

export const INDEPENDENT_VARIABLES = INDEPENDENT.map(([id, source]) => ({ id, source }));

// A typical working model, used to seed a returning user's setup in the prototype.
const RETURNING_PRESET = [
  'date', 'season', 'holiday_flag', 'demand', 'sales_qty', 'price', 'inbound_qty', 'outbound_qty', 'closing_stock',
  'safety_stock', 'reorder_point', 'production_qty', 'yield_rate', 'machine_availability', 'supplier_lead_time',
  'supplier_reliability', 'quality_score', 'stock_in_transit', 'promotion_flag', 'competitor_price', 'inflation_rate', 'wip',
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

/** A first-time selection: only the dependent variable is in the model; each variable keeps its suggested source. */
export function defaultParameterSelection() {
  const rows = { [DEPENDENT_VARIABLE.id]: { on: true, source: DEPENDENT_VARIABLE.source } };
  INDEPENDENT_VARIABLES.forEach((v) => { rows[v.id] = { on: false, source: v.source }; });
  return { rows, fromYear: DEFAULT_FROM_YEAR, toYear: DEFAULT_TO };
}

/** A returning user's selection: the dependent plus a typical set of independents. */
export function returningParameterSelection() {
  const selection = defaultParameterSelection();
  RETURNING_PRESET.forEach((id) => { selection.rows[id] = { ...selection.rows[id], on: true }; });
  return selection;
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
