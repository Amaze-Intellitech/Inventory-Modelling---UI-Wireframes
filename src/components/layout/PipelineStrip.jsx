import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';

// The canonical analytical pipeline stages, in fixed order without numbering.
export const PIPELINE_STAGES = [
  { to: '/app/descriptive', label: 'Descriptive' },
  { to: '/app/abc', label: 'ABC' },
  { to: '/app/eoq', label: 'EOQ' },
  { to: '/app/rmlc', label: 'RMLC' },
  { to: '/app/raw-materials', label: 'Multivariate' },
  { to: '/app/optimization', label: 'Optimization' },
  { to: '/app/what-if', label: 'What-if' },
  { to: '/app/decisions', label: 'Agent', ai: true },
];

// Active paths including legacy/alias routes
const ALL_STAGE_PATHS = [
  ...PIPELINE_STAGES.map((s) => s.to),
  '/app/univariate',
  '/app/bivariate',
];

export default function PipelineStrip() {
  return null;
}
