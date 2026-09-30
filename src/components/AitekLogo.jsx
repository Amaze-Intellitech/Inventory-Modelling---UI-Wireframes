import React from 'react';
import { useTheme } from '@/lib/theme';
import logoLight from './Photos/aitek-logo-light.png';
import logoDark from './Photos/aitek-logo-dark.png';

/**
 * Theme-aware AITEK Brand Logo component.
 * - In light theme (or when variant="light"): renders high-res logo with dark text.
 * - In dark theme (or when variant="dark"): renders high-res logo with white text.
 */
export default function AitekLogo({
  variant = 'auto',
  className = 'h-9 w-auto object-contain',
  alt = 'AITEK Logo',
  ...props
}) {
  const { theme } = useTheme();

  let src = logoLight;
  if (variant === 'dark') {
    src = logoDark;
  } else if (variant === 'light') {
    src = logoLight;
  } else {
    src = theme === 'dark' ? logoDark : logoLight;
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      {...props}
    />
  );
}
