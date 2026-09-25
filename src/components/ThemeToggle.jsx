import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/lib/theme';
import { cn } from '@/lib/utils';

// Light/dark switch. Shown in every header so the theme can be changed from any screen.
export default function ThemeToggle({ className }) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';
  return (
    <button
      type="button"
      className={cn('theme-toggle', className)}
      onClick={toggleTheme}
      aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      title={isDark ? 'Light theme' : 'Dark theme'}
    >
      {isDark ? <Sun size={15} /> : <Moon size={15} />}
    </button>
  );
}
