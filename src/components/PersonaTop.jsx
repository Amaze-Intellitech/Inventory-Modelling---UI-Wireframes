import React from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, ShieldCheck } from 'lucide-react';
import { Insight, KpiTile } from './CommonUI';
import { DEFAULT_PERSONA } from '../data/personas';

// Persona-specific opening of a stage page (the blueprint's P0 layer): one headline insight, a short KPI row,
// and optionally the next step with its owner. The rest of the page stays shared evidence (P1) and drill-down (P2).
// `config` maps persona key -> { label, headline, kpis: [KpiTile props], next?: { action, owner, due } }.
// `safeguard` is the screen's trust rule from the blueprint, shown as a short note under the KPIs.
export default function PersonaTop({ persona, config, safeguard }) {
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
        {lens.next && (
          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-md border border-border bg-surface px-3.5 py-2.5 text-[13px]">
            <span className="inline-flex items-center gap-1.5 font-semibold text-ink">
              <ArrowRight size={13} aria-hidden="true" className="text-primary" />
              Next: {lens.next.action}
            </span>
            {lens.next.owner && <span className="text-subtle">Owner: <span className="text-body-c">{lens.next.owner}</span></span>}
            {lens.next.due && <span className="text-subtle">Due: <span className="text-body-c">{lens.next.due}</span></span>}
          </div>
        )}
        {safeguard && (
          <p className="mt-2 flex items-start gap-1.5 text-xs text-subtle leading-normal">
            <ShieldCheck size={13} aria-hidden="true" className="mt-px shrink-0" />
            <span>{safeguard}</span>
          </p>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
