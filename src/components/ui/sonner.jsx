import { Toaster as Sonner } from 'sonner';

const Toaster = ({ ...props }) => {
  return (
    <Sonner
      theme="light"
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            'group toast group-[.toaster]:bg-surface group-[.toaster]:text-ink group-[.toaster]:border-border group-[.toaster]:shadow-elevated group-[.toaster]:rounded-md group-[.toaster]:p-4 text-xs font-medium',
          description: 'group-[.toast]:text-body-c text-xs',
          actionButton:
            'group-[.toast]:bg-ink group-[.toast]:text-white text-xs font-semibold px-3 py-1.5 rounded-sm',
          cancelButton:
            'group-[.toast]:bg-bg group-[.toast]:text-ink text-xs font-semibold px-3 py-1.5 rounded-sm',
          success: 'group-[.toast]:border-[var(--success)]',
          error: 'group-[.toast]:border-[var(--error)]',
          info: 'group-[.toast]:border-[var(--border)]',
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
