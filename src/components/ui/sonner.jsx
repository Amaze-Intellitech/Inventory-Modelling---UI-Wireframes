import { Toaster as Sonner } from 'sonner';

const Toaster = ({ ...props }) => {
  return (
    <Sonner
      theme="light"
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            'group toast group-[.toaster]:bg-surface group-[.toaster]:text-text group-[.toaster]:border-line group-[.toaster]:shadow-elevated group-[.toaster]:rounded-md group-[.toaster]:p-4 text-xs font-medium',
          description: 'group-[.toast]:text-muted text-xs',
          actionButton:
            'group-[.toast]:bg-ink group-[.toast]:text-white text-xs font-semibold px-3 py-1.5 rounded-sm',
          cancelButton:
            'group-[.toast]:bg-bg group-[.toast]:text-text text-xs font-semibold px-3 py-1.5 rounded-sm',
          success: 'group-[.toast]:border-[#C6EFDE]',
          error: 'group-[.toast]:border-[#F8C8C4]',
          info: 'group-[.toast]:border-[#BFE6F8]',
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
