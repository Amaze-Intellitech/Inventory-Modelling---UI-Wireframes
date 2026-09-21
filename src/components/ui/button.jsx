import * as React from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';

// Variants follow the AITEK Style Guide v1.2 button set: Primary/CTA (solid brand blue, hovers to Deep),
// Deep/Nav CTA, Outline, Ghost, Destructive (quiet tint until hovered).
const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-sm text-[13px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-primary-solid text-white hover:bg-[var(--primary-hover)] border border-primary-solid hover:border-[var(--primary-hover)]',
        primary: 'bg-primary-solid text-white hover:bg-[var(--primary-hover)] border border-primary-solid hover:border-[var(--primary-hover)]',
        accent: 'bg-primary-solid text-white hover:bg-[var(--primary-hover)] border border-primary-solid hover:border-[var(--primary-hover)]',
        deep: 'bg-deep text-white hover:bg-primary-solid border border-transparent',
        outline: 'border border-border-strong bg-surface text-ink hover:border-primary hover:text-primary',
        secondary: 'bg-muted-fill text-ink hover:bg-border border border-border',
        ghost: 'text-ink hover:bg-muted-fill border-transparent',
        destructive: 'bg-error-bg text-error-tx border border-transparent hover:bg-error hover:text-white',
        link: 'text-primary underline underline-offset-4 hover:text-ink p-0 h-auto',
      },
      size: {
        default: 'h-9 px-3.5 py-2 gap-1.5',
        sm: 'h-7 px-2.5 py-1 text-xs gap-1',
        lg: 'h-10 px-5 py-2.5 text-sm gap-2',
        icon: 'h-8 w-8 p-0',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

const Button = React.forwardRef(({ className, variant, size, asChild = false, ...props }, ref) => {
  return (
    <button
      className={cn(buttonVariants({ variant, size, className }))}
      ref={ref}
      {...props}
    />
  );
});
Button.displayName = 'Button';

export { Button, buttonVariants };
