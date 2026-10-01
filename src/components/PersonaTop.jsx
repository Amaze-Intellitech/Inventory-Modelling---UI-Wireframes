import React from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Insight, KpiTile } from './CommonUI';
import { DEFAULT_PERSONA } from '../data/personas';

// Persona-specific opening of a stage page: one headline insight plus a short KPI row.
// `config` maps persona key -> { label, headline, kpis: [KpiTile props] }. The rest of the page stays shared evidence.
export default function PersonaTop({ persona, config }) {
  const shouldReduceMotion = useReducedMotion();
  const lens = config[persona] || config[DEFAULT_PERSONA];

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={persona}
        initial={shouldReduceMotion ? false : { opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        exit={shouldReduceMotion ? undefined : { opacity: 0 }}
        transition={{ duration: 0.18 }}
        className="mb-4"
      >
        <Insight label={lens.label} defaultOpen>
          {lens.headline}
        </Insight>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mt-3.5">
          {lens.kpis.map((tile) => (
            <KpiTile key={tile.label} {...tile} />
          ))}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
