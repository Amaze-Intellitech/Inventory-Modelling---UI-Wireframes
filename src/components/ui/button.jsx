import * as React from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-sm text-[13px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-ink text-white hover:bg-navy-700 border border-ink shadow-sm',
        primary: 'bg-ink text-white hover:bg-navy-700 border border-ink shadow-sm',
        accent: 'bg-accent text-white hover:bg-[#0C90CE] border border-accent shadow-sm',
        outline: 'border border-line-strong bg-surface text-text hover:border-muted-2 hover:bg-bg',
        secondary: 'bg-bg text-text hover:bg-line border border-line',
        ghost: 'text-text hover:bg-bg border-transparent',
        destructive: 'bg-risk text-white hover:bg-[#A82B22] border border-risk shadow-sm',
        link: 'text-accent underline-offset-4 hover:underline p-0 h-auto',
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
