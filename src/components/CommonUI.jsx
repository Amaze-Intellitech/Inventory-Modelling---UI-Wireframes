import React, { useLayoutEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/ui/accordion';
import { Badge as UiBadge, StatusShape } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ChevronDown, Info, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Badge({ tone = 'neutral', shape, children, className }) {
  return (
    <UiBadge tone={tone} shape={shape} className={className}>
      {children}
    </UiBadge>
  );
}

// Alert — left-edge accent instead of a filled banner; the heading repeats the status shape.
const ALERT_SHAPE = { success: 'circle', warning: 'triangle', error: 'diamond', info: 'square' };

export function AlertBar({ tone = 'info', title, children, className }) {
  return (
    <div className={cn('alert', `alert--${tone}`, className)} role={tone === 'error' ? 'alert' : 'status'}>
      <div>
        {title && (
          <p className="alert__title">
            <StatusShape shape={ALERT_SHAPE[tone]} />
            {title}
          </p>
        )}
        {children && <p className="alert__body">{children}</p>}
      </div>
    </div>
  );
}

export function Card({ children, style, className }) {
  return (
    <div
      className={cn('card transition-shadow duration-150 hover:shadow-hover', className)}
      style={style}
    >
      {children}
    </div>
  );
}

// Description behind an ⓘ button, so headings stay on one line and the content below starts higher.
export function InfoTip({ label = 'More information', children, className }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={label}
          className={cn(
            'inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-subtle transition-colors hover:bg-muted-fill hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary data-[state=open]:text-primary',
            className
          )}
        >
          <Info size={15} aria-hidden="true" />
        </button>
      </PopoverTrigger>
      <PopoverContent>{children}</PopoverContent>
    </Popover>
  );
}

export function CardHead({ title, sub, right, className }) {
  return (
    <div className={cn('card__head flex items-start justify-between gap-4 mb-3.5', className)}>
      <div className="flex items-center gap-1.5 min-w-0">
        <h2 className="card__title text-base font-semibold text-ink m-0 font-sans">{title}</h2>
        {sub && <InfoTip label={`About ${typeof title === 'string' ? title : 'this section'}`}>{sub}</InfoTip>}
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
      ? 'text-success-tx'
      : deltaTone === 'down'
      ? 'text-error-tx'
      : 'text-subtle';

  return (
    <motion.div
      className={cn(
        'kpi bg-surface border border-border rounded-md p-3.5 sm:p-4 transition-all duration-150 relative overflow-hidden shadow-subtle',
        isClickable && 'cursor-pointer hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface',
        className
      )}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      tabIndex={isClickable ? 0 : undefined}
      role={isClickable ? 'button' : undefined}
      whileHover={isClickable && !shouldReduceMotion ? { y: -2 } : {}}
      whileTap={isClickable && !shouldReduceMotion ? { scale: 0.99 } : {}}
    >
      <span className="kpi__label text-xs text-subtle block mb-1.5 font-medium tracking-wide">
        {label}
      </span>
      <span
        className="kpi__value text-2xl font-semibold text-ink block font-sans tabular-nums leading-tight tracking-tight"
        style={valueStyle}
      >
        {value}
      </span>
      {delta && (
        <span className={cn('kpi__delta text-xs mt-1.5 flex items-center gap-1 font-medium', deltaColorClass)}>
          {delta}
        </span>
      )}
      {sub && <span className="kpi__sub text-xs text-subtle mt-1 block leading-normal">{sub}</span>}
    </motion.div>
  );
}

// AI insight — the one treatment reserved for AI-generated commentary. Violet always pairs with the word "AI".
// Collapsed by default: the body is clamped to two lines and a "Show more" toggle appears only when the text
// actually overflows, so short insights display in full. Pass `defaultOpen` for a result the page is built around.
export function Insight({ label, children, className, defaultOpen = false }) {
  const mentionsAi = typeof label === 'string' && /(AI|Agent)/.test(label);
  const [open, setOpen] = useState(defaultOpen);
  const [overflows, setOverflows] = useState(false);
  const bodyRef = useRef(null);

  // Does the text need more than two lines? Compare its natural height with two line-heights.
  useLayoutEffect(() => {
    const el = bodyRef.current;
    if (!el) return undefined;
    let live = true;
    const measure = () => {
      if (!live) return;
      const lineHeight = parseFloat(getComputedStyle(el).lineHeight) || 20;
      setOverflows(el.scrollHeight > lineHeight * 2 + 1);
    };
    measure();
    // web fonts load lazily and can change how the text wraps without changing the element's size
    const fonts = document.fonts;
    fonts?.addEventListener?.('loadingdone', measure);
    fonts?.ready?.then(measure);
    const ro = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(measure);
    ro?.observe(el);
    return () => {
      live = false;
      fonts?.removeEventListener?.('loadingdone', measure);
      ro?.disconnect();
    };
  }, [children]);

  const canToggle = overflows;

  return (
    <div className={cn('insight rounded-md px-3.5 py-2.5 mb-3 border border-border border-l-[3px] border-l-ai bg-ai-bg', className)}>
      <div className="insight__label text-xs font-semibold text-ai-tx uppercase tracking-[0.08em] mb-1 flex items-center gap-1.5">
        <Sparkles size={12} aria-hidden="true" />
        <span className="min-w-0 truncate">{mentionsAi ? label : label ? `AI insight · ${label}` : 'AI insight'}</span>
        {canToggle && (
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            className="ml-auto inline-flex shrink-0 items-center gap-1 rounded-sm px-1.5 py-0.5 text-xs font-semibold normal-case tracking-normal text-ai-tx hover:bg-surface/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            {open ? 'Show less' : 'Show more'}
            <ChevronDown size={13} aria-hidden="true" className={cn('transition-transform', open && 'rotate-180')} />
          </button>
        )}
      </div>
      <div ref={bodyRef} className={cn('text-[13px] text-ink leading-relaxed', !open && 'line-clamp-2')}>
        {children}
      </div>
    </div>
  );
}

// Enterprise driver-breakdown Accordion disclosure
export function WhyDisclosure({ summary, drivers = [], meaning = [], action = [], defaultOpen = false, className }) {
  return (
    <div className={cn('why-accordion-wrap mt-2.5 pt-2.5 border-t border-dashed border-border', className)}>
      <Accordion
        type="single"
        collapsible
        defaultValue={defaultOpen ? 'item-1' : undefined}
        className="w-full"
      >
        <AccordionItem value="item-1" className="border-none">
          <AccordionTrigger className="text-[13px] font-semibold text-ai-tx hover:no-underline hover:text-ink py-1.5">
            {summary}
          </AccordionTrigger>
          <AccordionContent className="pt-2 pb-1">
            <div className="why__chain grid grid-cols-1 md:grid-cols-3 gap-3 p-3 bg-bg/70 rounded-sm border border-border mt-1">
              {drivers.length > 0 && (
                <div className="why__col">
                  <h4 className="text-xs font-semibold uppercase tracking-[0.08em] text-subtle m-0 mb-1.5">
                    Drivers
                  </h4>
                  <ul className="m-0 pl-4 text-[13px] text-ink space-y-1 list-disc">
                    {drivers.map((d, i) => (
                      <li key={i} className="leading-snug">{d}</li>
                    ))}
                  </ul>
                </div>
              )}
              {meaning.length > 0 && (
                <div className="why__col">
                  <h4 className="text-xs font-semibold uppercase tracking-[0.08em] text-subtle m-0 mb-1.5">
                    What it means
                  </h4>
                  <ul className="m-0 pl-4 text-[13px] text-ink space-y-1 list-disc">
                    {meaning.map((d, i) => (
                      <li key={i} className="leading-snug">{d}</li>
                    ))}
                  </ul>
                </div>
              )}
              {action.length > 0 && (
                <div className="why__col">
                  <h4 className="text-xs font-semibold uppercase tracking-[0.08em] text-subtle m-0 mb-1.5">
                    Suggested action
                  </h4>
                  <ul className="m-0 pl-4 text-[13px] text-ink space-y-1 list-disc">
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

// Technical detail (coefficients, p-values, diagnostics …) — collapsed by default so the business answer leads
// (design bible §3.5).
export function DrillDown({ title = 'Drill into detail', hint, children, defaultOpen = false, className }) {
  const open = defaultOpen;
  return (
    <div className={cn('drilldown mt-3 rounded-md border border-border bg-surface', className)}>
      <Accordion key={open ? 'open' : 'closed'} type="single" collapsible defaultValue={open ? 'detail' : undefined} className="w-full">
        <AccordionItem value="detail" className="border-none">
          <AccordionTrigger className="px-4 py-2.5 text-[13px] font-semibold text-ink hover:no-underline">
            <span className="flex items-center gap-2">
              {title}
              {hint && <span className="text-xs font-normal text-subtle">{hint}</span>}
            </span>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">{children}</AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}

export function SectionTitle({ children, className }) {
  return (
    <div className={cn('section-title text-xs font-semibold uppercase tracking-[0.14em] text-subtle mt-6 mb-3', className)}>
      {children}
    </div>
  );
}

// `onStepClick(stepNumber)` makes the steps already completed clickable, so the user can go back to change them.
export function Stepper({ steps, current, className, onStepClick }) {
  return (
    <div className={cn('stepper flex items-center mb-7 w-full', className)}>
      {steps.map((label, i) => {
        const stepNum = i + 1;
        const isDone = stepNum < current;
        const isCurrent = stepNum === current;
        return (
          <React.Fragment key={label}>
            <div
              className={cn('stepper__item flex items-center gap-2 flex-1', isDone && 'done', isCurrent && 'current')}
              {...(isDone && onStepClick
                ? { role: 'button', tabIndex: 0, 'aria-label': `Go back to ${label}`, onClick: () => onStepClick(stepNum),
                    onKeyDown: (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onStepClick(stepNum); } } }
                : {})}
            >
              <span
                className={cn(
                  'stepper__num w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-colors',
                  isDone && 'bg-success border border-success text-white',
                  isCurrent && 'bg-primary-solid border border-primary text-white shadow-sm',
                  !isDone && !isCurrent && 'bg-muted-fill border border-border-strong text-subtle'
                )}
              >
                {isDone ? '✓' : stepNum}
              </span>
              <span
                className={cn(
                  'stepper__label text-xs font-semibold whitespace-nowrap',
                  isCurrent ? 'text-ink font-bold' : isDone ? 'text-ink' : 'text-subtle'
                )}
              >
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className="stepper__line flex-1 h-[2px] bg-border mx-2.5 relative overflow-hidden">
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
        'chip border border-border-strong bg-surface rounded-full px-3.5 py-1.5 text-[13px] font-medium text-ink cursor-pointer transition-all duration-150 hover:border-primary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface',
        active && 'bg-deep text-white border-deep hover:bg-primary-solid hover:border-primary hover:text-white shadow-sm',
        className
      )}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

// Title + actions on one row. The description sits behind an ⓘ next to the title (a string or any JSX).
export function ViewHead({ title, subtitle, actions, className }) {
  return (
    <div className={cn('view-head flex items-center justify-between gap-6 mb-3', className)}>
      <div className="flex min-w-0 items-center gap-1.5">
        <h1 className="font-display text-2xl font-bold text-ink m-0 tracking-[-0.025em] leading-[1.15]">{title}</h1>
        {subtitle && (
          <InfoTip label={`About ${typeof title === 'string' ? title : 'this page'}`} className="mt-0.5">
            {subtitle}
          </InfoTip>
        )}
      </div>
      {actions && <div className="view-actions flex gap-2 shrink-0">{actions}</div>}
    </div>
  );
}
