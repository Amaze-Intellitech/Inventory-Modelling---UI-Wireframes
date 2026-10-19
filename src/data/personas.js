// The four primary personas from the Inventory Modelling blueprint. Every persona is an internal role:
// one shared data foundation, only insight ordering, actions and level of detail change by persona.
// `key` is what PlatformContext stores; `tab` is the persona-switch label and `short` its narrow-screen form.
export const PERSONAS = [
  { key: 'head', label: 'Head of Supply Chain', tab: 'Head of Supply Chain', short: 'HSC', sub: 'Balances inventory investment, production continuity, supply reliability and cost across the network.' },
  { key: 'inventory', label: 'Inventory / Materials Manager', tab: 'Inventory Manager', short: 'INV', sub: 'Owns inventory health: the right materials, quantities and locations, in usable condition.' },
  { key: 'planner', label: 'Production / Materials Planner', tab: 'Production Planner', short: 'PLN', sub: 'Owns production continuity: materials available when production orders need them.' },
  { key: 'procurement', label: 'Procurement / Sourcing Manager', tab: 'Sourcing Manager', short: 'PRO', sub: 'Owns supply execution: the right quantity, from qualified suppliers, at the right cost and delivery risk.' },
];

export const PERSONA_KEYS = PERSONAS.map((p) => p.key);
export const DEFAULT_PERSONA = 'head';

export const personaLabel = (key) => PERSONAS.find((p) => p.key === key)?.label ?? key;
