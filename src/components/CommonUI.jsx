import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/ui/accordion';
import { Badge as UiBadge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export function Badge({ tone = 'neutral', children, className }) {
  return (
    <UiBadge tone={tone} className={className}>
      {children}
    </UiBadge>
  );
}

export function Card({ children, style, className }) {
  return (
    <div
      className={cn('card shadow-subtle hover:shadow-card transition-shadow duration-150', className)}
      style={style}
    >
      {children}
    </div>
  );
}

export function CardHead({ title, sub, right, className }) {
  return (
    <div className={cn('card__head flex items-start justify-between gap-4 mb-3.5', className)}>
      <div>
        <h2 className="card__title text-[14.5px] font-bold text-ink m-0 mb-1">{title}</h2>
        {sub && <p className="card__sub text-[12.5px] text-muted m-0">{sub}</p>}
      </div>
      {right && <div className="shrink-0">{right}</div>}
    </div>
  );
}

export function KpiTile({ label, value, sub, delta, deltaTone, onClick, valueStyle, className }) {
  const isClickable = typeof onClick === 'function';
  const shouldReduceMotion = useReducedMotion();

  const handleKeyDown = (e) => {
    if (isClickable && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      onClick();
    }
  };

  const deltaColorClass =
    deltaTone === 'up'
      ? 'text-success'
      : deltaTone === 'down'
      ? 'text-risk'
      : 'text-muted';

  return (
    <motion.div
      className={cn(
        'kpi bg-surface border border-line rounded-sm p-3.5 sm:p-4 transition-all duration-150 relative overflow-hidden',
        isClickable && 'cursor-pointer hover:border-accent hover:shadow-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2',
        className
      )}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      tabIndex={isClickable ? 0 : undefined}
      role={isClickable ? 'button' : undefined}
      whileHover={isClickable && !shouldReduceMotion ? { y: -2 } : {}}
      whileTap={isClickable && !shouldReduceMotion ? { scale: 0.99 } : {}}
    >
      <span className="kpi__label text-[11.5px] text-muted block mb-1.5 font-medium tracking-wide">
        {label}
      </span>
      <span
        className="kpi__value text-[21px] font-bold text-ink block font-mono tabular-nums leading-tight tracking-tight"
        style={valueStyle}
      >
        {value}
      </span>
      {delta && (
        <span className={cn('kpi__delta text-[11.5px] mt-1.5 flex items-center gap-1 font-medium', deltaColorClass)}>
          {delta}
        </span>
      )}
      {sub && <span className="kpi__sub text-[11px] text-muted-2 mt-1 block leading-normal">{sub}</span>}
    </motion.div>
  );
}

export function Insight({ label, children, className }) {
  return (
    <div className={cn('insight rounded-md p-3.5 mb-3 border-l-[3px] border-l-accent border border-[#D7ECF8] bg-gradient-to-b from-[#FBFDFF] to-[#F6FAFD]', className)}>
      {label && <div className="insight__label text-[10.5px] font-bold text-[#0C7EBE] uppercase tracking-[0.05em] mb-1.5">{label}</div>}
      <div className="text-[13px] text-text leading-relaxed">{children}</div>
    </div>
  );
}

// Enterprise driver-breakdown Accordion disclosure
export function WhyDisclosure({ summary, drivers = [], meaning = [], action = [], defaultOpen = false, className }) {
  return (
    <div className={cn('why-accordion-wrap mt-2.5 pt-2.5 border-t border-dashed border-line', className)}>
      <Accordion
        type="single"
        collapsible
        defaultValue={defaultOpen ? 'item-1' : undefined}
        className="w-full"
      >
        <AccordionItem value="item-1" className="border-none">
          <AccordionTrigger className="text-[12.5px] font-semibold text-[#0C7EBE] hover:no-underline hover:text-accent py-1.5">
            {summary}
          </AccordionTrigger>
          <AccordionContent className="pt-2 pb-1">
            <div className="why__chain grid grid-cols-1 md:grid-cols-3 gap-3 p-3 bg-bg/70 rounded-sm border border-line mt-1">
              {drivers.length > 0 && (
                <div className="why__col">
                  <h4 className="text-[10.5px] font-bold uppercase tracking-[0.04em] text-muted-2 m-0 mb-1.5">
                    Drivers
                  </h4>
                  <ul className="m-0 pl-4 text-[12.5px] text-text space-y-1 list-disc">
                    {drivers.map((d, i) => (
                      <li key={i} className="leading-snug">{d}</li>
                    ))}
                  </ul>
                </div>
              )}
              {meaning.length > 0 && (
                <div className="why__col">
                  <h4 className="text-[10.5px] font-bold uppercase tracking-[0.04em] text-muted-2 m-0 mb-1.5">
                    What it means
                  </h4>
                  <ul className="m-0 pl-4 text-[12.5px] text-text space-y-1 list-disc">
                    {meaning.map((d, i) => (
                      <li key={i} className="leading-snug">{d}</li>
                    ))}
                  </ul>
                </div>
              )}
              {action.length > 0 && (
                <div className="why__col">
                  <h4 className="text-[10.5px] font-bold uppercase tracking-[0.04em] text-muted-2 m-0 mb-1.5">
                    Suggested action
                  </h4>
                  <ul className="m-0 pl-4 text-[12.5px] text-text space-y-1 list-disc">
                    {action.map((d, i) => (
                      <li key={i} className="leading-snug">{d}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}

export function SectionTitle({ children, className }) {
  return (
    <div className={cn('section-title text-xs font-bold uppercase tracking-[0.04em] text-muted mt-6 mb-3', className)}>
      {children}
    </div>
  );
}

export function Stepper({ steps, current, className }) {
  return (
    <div className={cn('stepper flex items-center mb-7 w-full', className)}>
      {steps.map((label, i) => {
        const stepNum = i + 1;
        const isDone = stepNum < current;
        const isCurrent = stepNum === current;
        return (
          <React.Fragment key={label}>
            <div className={cn('stepper__item flex items-center gap-2 flex-1', isDone && 'done', isCurrent && 'current')}>
              <span
                className={cn(
                  'stepper__num w-6 h-6 rounded-full flex items-center justify-center text-[11.5px] font-bold shrink-0 transition-colors',
                  isDone && 'bg-success text-white',
                  isCurrent && 'bg-ink text-white shadow-sm ring-2 ring-accent/30',
                  !isDone && !isCurrent && 'bg-line text-muted'
                )}
              >
                {isDone ? '✓' : stepNum}
              </span>
              <span
                className={cn(
                  'stepper__label text-xs font-semibold whitespace-nowrap',
                  isCurrent ? 'text-ink font-bold' : isDone ? 'text-text' : 'text-muted'
                )}
              >
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className="stepper__line flex-1 h-[2px] bg-line mx-2.5 relative overflow-hidden">
                <div
                  className="h-full bg-success transition-all duration-300"
                  style={{ width: isDone ? '100%' : '0%' }}
                />
              </div>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

export function Chip({ active, onClick, children, className }) {
  return (
    <button
      type="button"
      className={cn(
        'chip border border-line-strong bg-surface rounded-full px-3.5 py-1.5 text-[12.5px] font-medium text-text cursor-pointer transition-all duration-150 hover:border-accent hover:text-[#0C7EBE] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2',
        active && 'bg-ink text-white border-ink hover:bg-navy-700 hover:text-white shadow-sm',
        className
      )}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

export function ViewHead({ title, subtitle, actions, className }) {
  return (
    <div className={cn('view-head flex items-start justify-between gap-6 mb-5', className)}>
      <div className="max-w-3xl">
        <h1 className="text-[21px] font-bold text-ink m-0 mb-1.5 tracking-tight">{title}</h1>
        {typeof subtitle === 'string' ? (
          <p className="text-[13.5px] text-muted m-0 leading-normal">{subtitle}</p>
        ) : (
          subtitle
        )}
      </div>
      {actions && <div className="view-actions flex gap-2 shrink-0">{actions}</div>}
    </div>
  );
}
