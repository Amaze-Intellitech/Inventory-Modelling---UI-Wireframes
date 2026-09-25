import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import {
  Layers,
  ShoppingBag,
  TrendingUp,
  Network,
  CircleDollarSign,
  Leaf,
  Lock,
  ArrowRight,
  LogOut,
  CheckCircle2,
  HelpCircle,
  ArrowUpRight,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { usePlatform } from '../../context/PlatformContext';
import AccessCheckDialog from '../../components/AccessCheckDialog';
import AitekLogo from '../../components/AitekLogo';

export default function SolutionSelection() {
  const navigate = useNavigate();
  const { resetSession, onboarded, setOnboarded, resetSetup, seedReturningSetup } = usePlatform();
  const shouldReduceMotion = useReducedMotion();
  const [accessOpen, setAccessOpen] = useState(false); // the access-check modal

  function handleSignOut() {
    resetSession();
    navigate('/');
  }

  const handleCardKeyDown = (e, card) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (card.active) {
        setAccessOpen(true);
      } else if (card.status === 'Coming soon') {
        toast.info(`${card.title} is currently in preview and scheduled for upcoming release.`);
      } else {
        toast.info(`Requesting access for ${card.title}. An administrator will review your permission.`);
      }
    }
  };

  const handleCardClick = (card) => {
    if (card.active) {
      setAccessOpen(true);
    } else if (card.status === 'Coming soon') {
      toast.info(`${card.title} is currently under development. Contact your AITEK account team for early access.`);
    } else {
      toast.info(`${card.title} requires an enterprise module license. Contact support to activate.`);
    }
  };

  const solutions = [
    {
      id: 'inventory-modelling',
      title: 'Inventory Modelling',
      icon: Layers,
      iconBg: 'bg-info-bg',
      iconBorder: 'border-border',
      iconColor: 'text-info-tx',
      status: 'Active License',
      statusTone: 'success',
      active: true,
      description: 'Optimize inventory decisions across materials, demand, supply and working capital.',
      tags: 'Inventory Health · ABC · EOQ · RMLC · Optimization',
      decorativeShape: (
        <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-primary">
          <path d="M60 10L110 38V82L60 110L10 82V38L60 10Z" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M60 10V110" stroke="currentColor" strokeWidth="2" strokeDasharray="4 4" />
          <path d="M10 38L110 82" stroke="currentColor" strokeWidth="1.5" />
          <path d="M10 82L110 38" stroke="currentColor" strokeWidth="1.5" />
          <circle cx="60" cy="60" r="16" fill="currentColor" fillOpacity="0.15" />
        </svg>
      ),
    },
    {
      id: 'procurement-intelligence',
      title: 'Procurement Intelligence',
      icon: ShoppingBag,
      iconBg: 'bg-info-bg',
      iconBorder: 'border-border',
      iconColor: 'text-info-tx',
      status: 'Coming soon',
      statusTone: 'neutral',
      active: false,
      description: 'Supplier performance, cost-center spend and sourcing risk across the vendor base.',
      tags: 'Supplier Scorecards · Spend Analysis · Sourcing Risk',
      decorativeShape: (
        <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-subtle">
          <rect x="20" y="20" width="80" height="80" rx="16" stroke="currentColor" strokeWidth="2" strokeDasharray="5 5" />
          <circle cx="40" cy="40" r="10" stroke="currentColor" strokeWidth="2" />
          <circle cx="80" cy="40" r="10" stroke="currentColor" strokeWidth="2" />
          <circle cx="40" cy="80" r="10" stroke="currentColor" strokeWidth="2" />
          <circle cx="80" cy="80" r="10" stroke="currentColor" strokeWidth="2" />
          <path d="M40 50V70M80 50V70M50 40H70M50 80H70" stroke="currentColor" strokeWidth="2" />
        </svg>
      ),
    },
    {
      id: 'demand-intelligence',
      title: 'Demand Intelligence',
      icon: TrendingUp,
      iconBg: 'bg-info-bg',
      iconBorder: 'border-border',
      iconColor: 'text-info-tx',
      status: null,
      active: false,
      description: 'AI-driven demand forecasting, seasonality analysis, and promotional lift modelling.',
      tags: 'Demand Sensing · Forecasting · Seasonality · Consensus Planning',
      decorativeShape: (
        <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-info-tx">
          <path d="M15 95C35 90 45 45 65 55C85 65 95 25 110 15" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
          <path d="M15 95C35 90 45 45 65 55C85 65 95 25 110 15V105H15V95Z" fill="currentColor" fillOpacity="0.08" />
          <circle cx="65" cy="55" r="5" fill="currentColor" />
          <circle cx="110" cy="15" r="5" fill="currentColor" />
        </svg>
      ),
    },
    {
      id: 'supply-chain-optimization',
      title: 'Supply Chain Optimization',
      icon: Network,
      iconBg: 'bg-info-bg',
      iconBorder: 'border-border',
      iconColor: 'text-info-tx',
      status: null,
      active: false,
      description: 'End-to-end network flow optimization, multi-node lead time smoothing, and logistics routing.',
      tags: 'Network Design · Flow Optimization · Lead Time Buffers · Route Efficiency',
      decorativeShape: (
        <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-info-tx">
          <circle cx="30" cy="60" r="14" stroke="currentColor" strokeWidth="2.5" />
          <circle cx="90" cy="30" r="14" stroke="currentColor" strokeWidth="2.5" />
          <circle cx="90" cy="90" r="14" stroke="currentColor" strokeWidth="2.5" />
          <path d="M43 53L77 37M43 67L77 83" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
          <circle cx="60" cy="60" r="4" fill="currentColor" />
        </svg>
      ),
    },
    {
      id: 'working-capital-intelligence',
      title: 'Working Capital Intelligence',
      icon: CircleDollarSign,
      iconBg: 'bg-info-bg',
      iconBorder: 'border-border',
      iconColor: 'text-info-tx',
      status: null,
      active: false,
      description: 'Free cash flow unlocking, cash-to-cash cycle acceleration, and tied-up capital reduction.',
      tags: 'Cash Conversion Cycle · Holding Cost Reduction · Capital Allocation · DSI',
      decorativeShape: (
        <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-info-tx">
          <circle cx="60" cy="60" r="45" stroke="currentColor" strokeWidth="2.5" strokeDasharray="8 6" />
          <circle cx="60" cy="60" r="28" stroke="currentColor" strokeWidth="2" />
          <path d="M60 42V78M50 50C50 45 70 45 70 55C70 65 50 65 50 72C50 78 70 78 70 72" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      ),
    },
    {
      id: 'sustainability-intelligence',
      title: 'Sustainability Intelligence',
      icon: Leaf,
      iconBg: 'bg-info-bg',
      iconBorder: 'border-border',
      iconColor: 'text-info-tx',
      status: null,
      active: false,
      description: 'Scope 3 emissions tracking, carbon footprint per SKU, waste reduction, and circular supply chains.',
      tags: 'Scope 3 Emissions · Carbon Accounting · Waste Minimization · ESG Audits',
      decorativeShape: (
        <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-info-tx">
          <path d="M30 90C30 90 35 40 85 30C85 30 85 75 45 85C35 87.5 30 90 30 90Z" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" />
          <path d="M30 90C45 70 60 55 85 30" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <circle cx="60" cy="60" r="46" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 6" />
        </svg>
      ),
    },
  ];

  return (
    <div className="min-h-screen w-full bg-bg flex flex-col text-ink font-sans antialiased select-none">
      {/* ========================================================================= */}
      {/* 1. Full-width white header                                                */}
      {/* ========================================================================= */}
      <header className="w-full bg-surface border-b border-border h-16 sm:h-20 sticky top-0 z-50 flex items-center shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
        <div className="page-wrap flex justify-between items-center">
          {/* Brand Left */}
          <div className="flex items-center gap-3">
            <AitekLogo
              className="h-8 sm:h-10 w-auto object-contain shrink-0"
            />
            <div className="flex flex-col justify-center">
              <span className="font-heading text-base sm:text-[17px] font-extrabold text-ink tracking-tight leading-tight">AITEK</span>
              <span className="text-[11px] sm:text-[12px] font-medium text-subtle tracking-normal leading-tight mt-0.5 hidden xs:inline">
                Enterprise Inventory Intelligence
              </span>
            </div>
          </div>

          {/* User Profile & Sign Out Right */}
          <div className="flex items-center gap-3 sm:gap-6">
            <div className="flex items-center gap-2.5 sm:gap-3">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-deep text-white flex items-center justify-center font-bold text-xs shadow-sm ring-2 ring-border shrink-0">
                AV
              </div>
              <div className="hidden sm:flex flex-col text-left">
                <span className="text-[13px] font-semibold text-ink leading-tight">Alex Vance</span>
                <span className="text-xs text-subtle leading-tight mt-0.5">Enterprise Corp</span>
              </div>
            </div>

            <div className="h-5 sm:h-6 w-[1px] bg-border" />

            <Button
              variant="ghost"
              size="sm"
              onClick={handleSignOut}
              className="gap-1 sm:gap-1.5 text-subtle hover:text-error-tx hover:bg-error-bg transition-colors text-xs font-semibold px-2 sm:px-2.5 py-1.5 rounded-md"
              aria-label="Sign out"
              title="Sign out"
            >
              <LogOut size={14} />
              <span className="font-medium hidden sm:inline">Sign out</span>
            </Button>
          </div>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 2. Main Content Canvas                                                    */}
      {/* ========================================================================= */}
      <main className="flex-1 page-wrap py-6 sm:py-10 lg:py-12 flex flex-col justify-between">
        <div>
          {/* Header Eyebrow & Title */}
          <div className="mb-6 sm:mb-8">
            <div className="text-xs font-bold uppercase tracking-[0.14em] text-primary mb-1.5 sm:mb-2">
              WORKSPACE SELECTION
            </div>
            <h1 className="font-heading text-xl sm:text-[30px] lg:text-[32px] font-bold text-ink tracking-tight mb-2">
              Choose your solution
            </h1>
            <p className="text-[13px] sm:text-[14.5px] text-subtle max-w-2xl leading-relaxed">
              Select the intelligence workspace you want to enter to access models, analytics, and operational workflows.
            </p>
          </div>

          {/* 3×2 Solution Card Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {solutions.map((card) => {
              const IconComponent = card.icon;
              const isActive = card.active;

              return (
                <motion.div
                  key={card.id}
                  onClick={() => handleCardClick(card)}
                  onKeyDown={(e) => handleCardKeyDown(e, card)}
                  tabIndex={0}
                  role="button"
                  aria-label={`Select ${card.title} workspace`}
                  whileHover={shouldReduceMotion ? {} : { y: isActive ? -3 : -1.5 }}
                  whileTap={shouldReduceMotion ? {} : { scale: 0.99 }}
                  className={`relative rounded-xl p-6 sm:p-7 flex flex-col justify-between transition-all duration-200 overflow-hidden text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                    isActive
                      ? 'bg-surface border-2 border-primary shadow-[0_4px_20px_rgba(91, 147, 255,0.08)] ring-4 ring-[color-mix(in_srgb,var(--primary)_5%,transparent)] hover:shadow-[0_8px_26px_rgba(91, 147, 255,0.14)] cursor-pointer group'
                      : card.status === 'Coming soon'
                      ? 'bg-surface border border-border shadow-subtle opacity-85 hover:opacity-100 hover:border-border-strong cursor-pointer group'
                      : 'bg-surface border border-border shadow-subtle hover:border-border-strong hover:shadow-card cursor-pointer group'
                  }`}
                >
                  {/* Subtle Bottom-Right Decorative Watermark Shape */}
                  <div className="absolute -bottom-6 -right-6 pointer-events-none opacity-[0.06] group-hover:opacity-[0.11] transition-opacity duration-300">
                    {card.decorativeShape}
                  </div>

                  {/* Card Content Top */}
                  <div>
                    {/* Top Row: Icon Container & Status Badge / Arrow */}
                    <div className="flex justify-between items-start mb-5">
                      <div
                        className={`w-11 h-11 rounded-xl ${card.iconBg} ${card.iconColor} border ${card.iconBorder} flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform duration-200`}
                      >
                        <IconComponent size={21} />
                      </div>

                      {/* Status Badges */}
                      {card.status === 'Active License' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-success-bg text-success-tx border border-success">
                          <CheckCircle2 size={12} className="text-success-tx" />
                          <span>Active License</span>
                        </span>
                      )}

                      {card.status === 'Coming soon' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-muted-fill text-subtle border border-border">
                          <Lock size={12} />
                          <span>Coming soon</span>
                        </span>
                      )}

                      {!card.status && (
                        <div className="w-8 h-8 rounded-full border border-border bg-bg group-hover:bg-primary-solid group-hover:border-primary text-subtle group-hover:text-white flex items-center justify-center transition-all duration-200">
                          <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
                        </div>
                      )}
                    </div>

                    {/* Card Title & Arrow (for Active License) */}
                    <div className="flex items-center justify-between mb-2">
                      <h2
                        className={`font-heading text-[16.5px] font-bold tracking-tight transition-colors ${
                          isActive ? 'text-ink group-hover:text-primary' : 'text-ink'
                        }`}
                      >
                        {card.title}
                      </h2>
                      {isActive && (
                        <div className="w-7 h-7 rounded-full bg-info-bg text-primary flex items-center justify-center group-hover:bg-primary-solid group-hover:text-white transition-colors duration-200">
                          <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
                        </div>
                      )}
                    </div>

                    {/* Card Description */}
                    <p className="text-[13px] text-subtle leading-relaxed mb-6">
                      {card.description}
                    </p>
                  </div>

                  {/* Card Bottom: Capability Tags */}
                  <div className="border-t border-border pt-3.5 relative z-10">
                    <div className="text-xs font-medium text-subtle tracking-tight leading-normal">
                      {card.tags}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          <AccessCheckDialog open={accessOpen} onOpenChange={setAccessOpen} />

          {/* Prototype control: lets a reviewer see both entry paths (not part of the product UI) */}
          <div className="mt-8 flex flex-wrap items-center gap-3 text-xs text-subtle border border-dashed border-border-strong rounded-md px-4 py-2.5">
            <span className="font-semibold text-ink">Prototype control</span>
            <span>
              Viewing as a <strong className="text-ink">{onboarded ? 'returning user (data already loaded, opens the dashboard directly)' : 'first-time user (one-time data setup first)'}</strong>.
            </span>
            <button
              type="button"
              className="underline text-primary hover:text-ink font-semibold"
              onClick={() => {
                // first-time: nothing chosen or connected yet; returning: a complete setup already exists
                if (onboarded) resetSetup();
                else seedReturningSetup();
                setOnboarded(!onboarded);
                toast.info(onboarded ? 'Now viewing as a first-time user.' : 'Now viewing as a returning user.');
              }}
            >
              Switch to {onboarded ? 'first-time' : 'returning'} user
            </button>
          </div>

          {/* ========================================================================= */}
          {/* 3. Wide "Need help choosing?" Support Panel                               */}
          {/* ========================================================================= */}
          <div className="mt-10 bg-surface border border-border rounded-xl p-6 sm:p-7 shadow-subtle flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-start sm:items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-info-bg border border-border text-primary flex items-center justify-center shrink-0 shadow-2xs">
                <HelpCircle size={22} />
              </div>
              <div>
                <h3 className="text-[15.5px] font-bold text-ink tracking-tight">
                  Need help choosing?
                </h3>
                <p className="text-[13.5px] text-subtle mt-0.5 leading-normal">
                  Our enterprise solution advisors can help configure the ideal intelligence mix for your operational footprint.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0 w-full sm:w-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={() => toast.info('An enterprise solutions advisor has been requested. We will reach out shortly.')}
                className="w-full sm:w-auto border-border-strong text-ink hover:bg-bg font-semibold text-xs h-9 px-4 rounded-md"
              >
                Contact Support
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => toast.info('Opening Enterprise Architecture & Capability Matrix documentation...')}
                className="w-full sm:w-auto bg-deep hover:bg-primary-solid text-white font-semibold text-xs h-9 px-4 gap-1.5 rounded-md"
              >
                <span>Solution Guide</span>
                <ArrowUpRight size={13} />
              </Button>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 4. Enterprise Footer                                                      */}
        {/* ========================================================================= */}
        <footer className="mt-14 pt-8 pb-4 border-t border-border flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-subtle">
          <div className="flex items-center gap-2">
            <span>© 2026 AITEK Inc. Enterprise Inventory Intelligence Platform. All rights reserved.</span>
          </div>

          <div className="flex items-center gap-5 sm:gap-6 flex-wrap justify-center">
            <button
              type="button"
              onClick={() => toast.info('AITEK Enterprise Privacy Policy')}
              className="hover:text-ink transition-colors"
            >
              Privacy Policy
            </button>
            <button
              type="button"
              onClick={() => toast.info('AITEK Platform Terms of Service')}
              className="hover:text-ink transition-colors"
            >
              Terms of Service
            </button>
            <button
              type="button"
              onClick={() => toast.info('Security: SOC2 Type II Certified, HIPAA & GDPR Compliant')}
              className="hover:text-ink transition-colors"
            >
              Security & Compliance
            </button>
            <div className="flex items-center gap-1.5 text-success-tx font-medium">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-success" />
              </span>
              <span>System Operational</span>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}

