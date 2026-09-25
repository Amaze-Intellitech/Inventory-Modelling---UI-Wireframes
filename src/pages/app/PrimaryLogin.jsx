import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { ShieldCheck, Globe, ChevronDown, HelpCircle, Sparkles } from 'lucide-react';
import SsoSignIn from '../../components/SsoSignIn';
import AitekLogo from '../../components/AitekLogo';

export default function PrimaryLogin() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-[var(--rail-bg)] overflow-y-auto lg:overflow-hidden select-none">
      {/* ========================================================================= */}
      {/* LEFT PANEL: Responsive Enterprise Showcase                                */}
      {/* ========================================================================= */}
      <div
        className="w-full lg:w-[60%] xl:w-[64%] flex flex-col justify-between relative overflow-hidden bg-[var(--rail-bg)] text-white p-6 sm:p-8 lg:p-12 shrink-0 border-b lg:border-b-0 lg:border-r border-[#132238]"
        style={{
          backgroundImage:
            'radial-gradient(circle at 10% 15%, rgba(91, 147, 255, 0.16) 0%, transparent 45%), radial-gradient(circle at 86% 52%, rgba(91, 147, 255, 0.12) 0%, transparent 50%), radial-gradient(circle at 30% 92%, rgba(21, 93, 252, 0.14) 0%, transparent 55%)',
        }}
      >
        {/* Subtle Atmospheric Dot Grid Background */}
        <div
          className="absolute inset-0 pointer-events-none opacity-10 z-0"
          aria-hidden="true"
        >
          <svg width="100%" height="100%" className="w-full h-full block">
            <defs>
              <pattern id="dot-grid-matrix-lock" width="32" height="32" patternUnits="userSpaceOnUse">
                <circle cx="2" cy="2" r="1" fill="var(--primary-on-deep)" fillOpacity="0.4" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#dot-grid-matrix-lock)" />
          </svg>
        </div>

        {/* --- Top Brand Bar --- */}
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AitekLogo
              variant="dark"
              className="h-9 sm:h-11 w-auto object-contain shrink-0 block"
            />
            <div className="flex flex-col">
              <span className="font-heading text-lg sm:text-xl font-extrabold tracking-tight text-white leading-tight">
                AITEK
              </span>
              <span className="text-[11px] sm:text-xs font-semibold tracking-wider text-primary uppercase mt-0.5">
                Enterprise Inventory Intelligence
              </span>
            </div>
          </div>

          <div className="hidden sm:inline-flex lg:hidden items-center gap-1.5 text-xs text-[#8FA3C0] bg-white/5 border border-white/10 px-3 py-1 rounded-full">
            <ShieldCheck size={14} className="text-primary" />
            <span>Enterprise Security</span>
          </div>
        </div>

        {/* --- Hero Content --- */}
        <div className="relative z-10 flex flex-col justify-center max-w-2xl my-6 sm:my-8 lg:my-auto">
          <motion.div
            initial={shouldReduceMotion ? false : { opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
          >
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-white/10 text-primary border border-white/10 mb-3 sm:mb-4">
              <Sparkles size={12} />
              <span>Next-Gen Inventory Analytics</span>
            </div>

            <h1 className="font-heading text-2xl sm:text-4xl lg:text-[44px] font-extrabold tracking-tight text-white leading-[1.15] mb-3 sm:mb-4">
              <span>Turn enterprise </span>
              <span className="block sm:inline">inventory data into </span>
              <span className="text-primary block sm:inline drop-shadow-[0_0_24px_rgba(91,147,255,0.4)]">
                intelligent decisions.
              </span>
            </h1>
            <p className="text-sm sm:text-base text-[#8FA3C0] leading-relaxed max-w-lg">
              Inventory · Working capital · Decision intelligence
            </p>
          </motion.div>
        </div>

        {/* --- Left Panel Footer --- */}
        <div className="relative z-10 text-xs text-[#6E84A6] flex items-center gap-2 pt-2 sm:pt-0">
          <ShieldCheck size={15} className="text-primary shrink-0" />
          <span>© 2026 AITEK · Secure Enterprise Access</span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* RIGHT PANEL: SSO Experience                                               */}
      {/* ========================================================================= */}
      <div className="w-full lg:w-[40%] xl:w-[36%] flex flex-col justify-between bg-[var(--bg)] p-5 sm:p-8 lg:p-10 min-h-[520px] lg:min-h-screen relative overflow-y-auto">
        {/* Top-Right Utility Bar: Language & Help */}
        <div className="flex items-center justify-end gap-3 text-xs text-body-c w-full mb-4 sm:mb-0">
          <button
            type="button"
            className="flex items-center gap-1.5 py-1 px-2 rounded-md hover:bg-surface border border-transparent hover:border-border text-body-c transition-colors cursor-pointer"
            aria-label="Select language"
          >
            <Globe className="w-3.5 h-3.5 text-subtle" />
            <span>English</span>
            <ChevronDown className="w-3 h-3 text-subtle" />
          </button>

          <a
            href="#!"
            onClick={(e) => e.preventDefault()}
            className="flex items-center gap-1.5 py-1 px-2 rounded-md hover:bg-surface border border-transparent hover:border-border text-body-c transition-colors no-underline"
          >
            <HelpCircle className="w-3.5 h-3.5 text-subtle" />
            <span>Need help?</span>
          </a>
        </div>

        {/* Center: SSO Card */}
        <div className="my-auto py-4 flex justify-center w-full">
          <SsoSignIn />
        </div>

        {/* Footer Legal Links */}
        <div className="text-center text-xs text-subtle flex items-center justify-center gap-3 pt-4 border-t border-border/40 sm:border-transparent">
          <a
            href="#!"
            onClick={(e) => e.preventDefault()}
            className="text-subtle hover:text-ink transition-colors no-underline"
          >
            Privacy Policy
          </a>
          <span className="text-border-strong">|</span>
          <a
            href="#!"
            onClick={(e) => e.preventDefault()}
            className="text-subtle hover:text-ink transition-colors no-underline"
          >
            Terms of Service
          </a>
          <span className="text-border-strong">|</span>
          <a
            href="#!"
            onClick={(e) => e.preventDefault()}
            className="text-subtle hover:text-ink transition-colors no-underline"
          >
            Security
          </a>
        </div>
      </div>
    </div>
  );
}
