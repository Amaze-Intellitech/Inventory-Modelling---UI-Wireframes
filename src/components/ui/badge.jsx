import * as React from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-[5px] leading-tight transition-colors whitespace-nowrap',
  {
    variants: {
      tone: {
        neutral: 'bg-bg text-muted border border-line',
        accent: 'bg-accent-dim text-[#0C7EBE] border border-[#BFE6F8]',
        success: 'bg-success-bg text-success border border-[#C6EFDE]',
        watch: 'bg-watch-bg text-watch border border-[#F2DEBA]',
        risk: 'bg-risk-bg text-risk border border-[#F8C8C4]',
        navy: 'bg-navy-800 text-white border border-navy-700',
      },
    },
    defaultVariants: {
      tone: 'neutral',
    },
  }
);

function Badge({ className, tone, children, ...props }) {
  return (
    <span className={cn(badgeVariants({ tone }), className)} {...props}>
      {children}
    </span>
  );
}

export { Badge, badgeVariants };
