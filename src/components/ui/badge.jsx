import * as React from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 text-xs font-semibold px-2 py-0.5 rounded-full leading-normal transition-colors whitespace-nowrap',
  {
    variants: {
      tone: {
        neutral: 'bg-neutral-bg text-body-c border border-border',
        accent: 'bg-info-bg text-info-tx border border-transparent',
        success: 'bg-success-bg text-success-tx border border-transparent',
        watch: 'bg-warning-bg text-warning-tx border border-transparent',
        risk: 'bg-error-bg text-error-tx border border-transparent',
        ai: 'bg-ai-bg text-ai-tx border border-transparent',
        navy: 'bg-deep text-white border border-transparent',
      },
    },
    defaultVariants: {
      tone: 'neutral',
    },
  }
);

// Status is never colour alone: each tone carries a shape (circle / triangle / diamond / square).
const TONE_SHAPE = {
  success: 'circle',
  watch: 'triangle',
  risk: 'diamond',
  accent: 'square',
};

function StatusShape({ shape }) {
  return <span aria-hidden="true" className={`status-shape status-shape--${shape}`} />;
}

function Badge({ className, tone, shape, children, ...props }) {
  const resolvedShape = shape === false ? null : shape || TONE_SHAPE[tone];
  return (
    <span className={cn(badgeVariants({ tone }), className)} {...props}>
      {resolvedShape && <StatusShape shape={resolvedShape} />}
      {children}
    </span>
  );
}

export { Badge, StatusShape, badgeVariants };
