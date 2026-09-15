import React from 'react';
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
import aitekLogo from '../../components/aitek_logo_bg_removed-removebg-preview.png';

export default function SolutionSelection() {
  const navigate = useNavigate();
  const { resetSession } = usePlatform();
  const shouldReduceMotion = useReducedMotion();

  function handleSignOut() {
    resetSession();
    navigate('/');
  }

  const handleCardKeyDown = (e, card) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (card.active) {
        navigate('/workspace-login');
      } else if (card.status === 'Coming soon') {
        toast.info(`${card.title} is currently in preview and scheduled for upcoming release.`);
      } else {
        toast.info(`Requesting access for ${card.title}. An administrator will review your permission.`);
      }
    }
  };

  const handleCardClick = (card) => {
    if (card.active) {
      navigate('/workspace-login');
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
      iconBg: 'bg-[#E0F2FE]',
      iconBorder: 'border-[#BAE6FD]',
      iconColor: 'text-[#0284C7]',
      status: 'Active License',
      statusTone: 'success',
      active: true,
      description: 'Optimize inventory decisions across materials, demand, supply and working capital.',
      tags: 'Inventory Health · ABC · EOQ · RMLC · Optimization',
      decorativeShape: (
        <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-[#0284C7]">
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
      iconBg: 'bg-[#F1F5F9]',
      iconBorder: 'border-[#E2E8F0]',
      iconColor: 'text-[#64748B]',
      status: 'Coming soon',
      statusTone: 'neutral',
      active: false,
      description: 'Supplier performance, cost-center spend and sourcing risk across the vendor base.',
      tags: 'Supplier Scorecards · Spend Analysis · Sourcing Risk',
      decorativeShape: (
        <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-[#64748B]">
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
      iconBg: 'bg-[#F3E8FF]',
      iconBorder: 'border-[#DDD6FE]',
      iconColor: 'text-[#7C3AED]',
      status: null,
      active: false,
      description: 'AI-driven demand forecasting, seasonality analysis, and promotional lift modelling.',
      tags: 'Demand Sensing · Forecasting · Seasonality · Consensus Planning',
      decorativeShape: (
        <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-[#7C3AED]">
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
      iconBg: 'bg-[#FFEDD5]',
      iconBorder: 'border-[#FED7AA]',
      iconColor: 'text-[#EA580C]',
      status: null,
      active: false,
      description: 'End-to-end network flow optimization, multi-node lead time smoothing, and logistics routing.',
      tags: 'Network Design · Flow Optimization · Lead Time Buffers · Route Efficiency',
      decorativeShape: (
        <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-[#EA580C]">
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
      iconBg: 'bg-[#CCFBF1]',
      iconBorder: 'border-[#99F6E4]',
      iconColor: 'text-[#0D9488]',
      status: null,
      active: false,
      description: 'Free cash flow unlocking, cash-to-cash cycle acceleration, and tied-up capital reduction.',
      tags: 'Cash Conversion Cycle · Holding Cost Reduction · Capital Allocation · DSI',
      decorativeShape: (
        <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-[#0D9488]">
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
      iconBg: 'bg-[#D1FAE5]',
      iconBorder: 'border-[#A7F3D0]',
      iconColor: 'text-[#059669]',
      status: null,
      active: false,
      description: 'Scope 3 emissions tracking, carbon footprint per SKU, waste reduction, and circular supply chains.',
      tags: 'Scope 3 Emissions · Carbon Accounting · Waste Minimization · ESG Audits',
      decorativeShape: (
        <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-[#059669]">
          <path d="M30 90C30 90 35 40 85 30C85 30 85 75 45 85C35 87.5 30 90 30 90Z" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" />
          <path d="M30 90C45 70 60 55 85 30" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <circle cx="60" cy="60" r="46" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 6" />
        </svg>
      ),
    },
  ];

  return (
    <div className="min-h-screen w-full bg-[#F8FAFC] flex flex-col text-[#101828] font-sans antialiased select-none">
      {/* ========================================================================= */}
      {/* 1. Full-width white 88px header                                           */}
      {/* ========================================================================= */}
      <header className="w-full bg-white border-b border-[#E2E8F0] h-[88px] sticky top-0 z-50 flex items-center shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
        <div className="w-full max-w-[1360px] mx-auto px-6 sm:px-8 lg:px-12 flex justify-between items-center">
          {/* Brand Left */}
          <div className="flex items-center gap-3.5">
            <img
              src={aitekLogo}
              alt="AITEK Logo"
              className="h-10 w-auto object-contain shrink-0"
            />
            <div className="flex flex-col justify-center">
              <span className="text-[17px] font-bold text-[#0B1220] tracking-tight leading-tight">AITEK</span>
              <span className="text-[12px] font-medium text-[#64748B] tracking-normal leading-tight mt-0.5">
                Enterprise Inventory Intelligence
              </span>
            </div>
          </div>

          {/* User Profile & Sign Out Right */}
          <div className="flex items-center gap-5 sm:gap-6">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-[#0B1220] text-white flex items-center justify-center font-bold text-xs shadow-sm ring-2 ring-[#F1F5F9]">
                AV
              </div>
              <div className="hidden sm:flex flex-col text-left">
                <span className="text-[13px] font-semibold text-[#0B1220] leading-tight">Alex Vance</span>
                <span className="text-[11.5px] text-[#64748B] leading-tight mt-0.5">Enterprise Corp</span>
              </div>
            </div>

            <div className="h-6 w-[1px] bg-[#E2E8F0]" />

            <Button
              variant="ghost"
              size="sm"
              onClick={handleSignOut}
              className="gap-1.5 text-[#64748B] hover:text-[#DC2626] hover:bg-[#FEE2E2]/50 transition-colors text-xs font-semibold px-2.5 py-1.5 rounded-md"
              aria-label="Sign out"
            >
              <LogOut size={14} />
              <span className="font-medium">Sign out</span>
            </Button>
          </div>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 2. Main Content Canvas                                                    */}
      {/* ========================================================================= */}
      <main className="flex-1 w-full max-w-[1360px] mx-auto px-6 sm:px-8 lg:px-12 py-10 sm:py-12 flex flex-col justify-between">
        <div>
          {/* Header Eyebrow & Title */}
          <div className="mb-8">
            <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#0284C7] mb-2">
              WORKSPACE SELECTION
            </div>
            <h1 className="text-2xl sm:text-[32px] font-bold text-[#0B1220] tracking-tight mb-2.5">
              Choose your solution
            </h1>
            <p className="text-[14px] sm:text-[14.5px] text-[#5B6B82] max-w-2xl leading-relaxed">
              Select the intelligence workspace you want to enter to access models, analytics, and operational workflows.
            </p>
          </div>

          {/* 3×2 Solution Card Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                  className={`relative rounded-xl p-6 sm:p-7 flex flex-col justify-between transition-all duration-200 overflow-hidden text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0284C7] ${
                    isActive
                      ? 'bg-white border-2 border-[#0284C7] shadow-[0_4px_20px_rgba(2,132,199,0.08)] ring-4 ring-[#0284C7]/5 hover:shadow-[0_8px_26px_rgba(2,132,199,0.14)] cursor-pointer group'
                      : card.status === 'Coming soon'
                      ? 'bg-white border border-[#E2E8F0] shadow-subtle opacity-85 hover:opacity-100 hover:border-[#CBD5E1] cursor-pointer group'
                      : 'bg-white border border-[#E2E8F0] shadow-subtle hover:border-[#CBD5E1] hover:shadow-card cursor-pointer group'
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
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11.5px] font-semibold bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0]">
                          <CheckCircle2 size={12} className="text-[#059669]" />
                          <span>Active License</span>
                        </span>
                      )}

                      {card.status === 'Coming soon' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11.5px] font-semibold bg-[#F1F5F9] text-[#64748B] border border-[#E2E8F0]">
                          <Lock size={12} />
                          <span>Coming soon</span>
                        </span>
                      )}

                      {!card.status && (
                        <div className="w-8 h-8 rounded-full border border-[#E2E8F0] bg-[#F8FAFC] group-hover:bg-[#0284C7] group-hover:border-[#0284C7] text-[#64748B] group-hover:text-white flex items-center justify-center transition-all duration-200">
                          <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
                        </div>
                      )}
                    </div>

                    {/* Card Title & Arrow (for Active License) */}
                    <div className="flex items-center justify-between mb-2">
                      <h2
                        className={`text-[16.5px] font-bold tracking-tight transition-colors ${
                          isActive ? 'text-[#0B1220] group-hover:text-[#0284C7]' : 'text-[#0B1220]'
                        }`}
                      >
                        {card.title}
                      </h2>
                      {isActive && (
                        <div className="w-7 h-7 rounded-full bg-[#E0F2FE] text-[#0284C7] flex items-center justify-center group-hover:bg-[#0284C7] group-hover:text-white transition-colors duration-200">
                          <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
                        </div>
                      )}
                    </div>

                    {/* Card Description */}
                    <p className="text-[13px] text-[#5B6B82] leading-relaxed mb-6">
                      {card.description}
                    </p>
                  </div>

                  {/* Card Bottom: Capability Tags */}
                  <div className="border-t border-[#F1F5F9] pt-3.5 relative z-10">
                    <div className="text-[11.5px] font-medium text-[#8896A8] tracking-tight leading-normal">
                      {card.tags}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* ========================================================================= */}
          {/* 3. Wide "Need help choosing?" Support Panel                               */}
          {/* ========================================================================= */}
          <div className="mt-10 bg-white border border-[#E2E8F0] rounded-xl p-6 sm:p-7 shadow-subtle flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-start sm:items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-[#E0F2FE] border border-[#BAE6FD] text-[#0284C7] flex items-center justify-center shrink-0 shadow-2xs">
                <HelpCircle size={22} />
              </div>
              <div>
                <h3 className="text-[15.5px] font-bold text-[#0B1220] tracking-tight">
                  Need help choosing?
                </h3>
                <p className="text-[13.5px] text-[#5B6B82] mt-0.5 leading-normal">
                  Our enterprise solution advisors can help configure the ideal intelligence mix for your operational footprint.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0 w-full sm:w-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={() => toast.info('An enterprise solutions advisor has been requested. We will reach out shortly.')}
                className="w-full sm:w-auto border-[#CBD5E1] text-[#0B1220] hover:bg-[#F8FAFC] font-semibold text-xs h-9 px-4 rounded-md"
              >
                Contact Support
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => toast.info('Opening Enterprise Architecture & Capability Matrix documentation...')}
                className="w-full sm:w-auto bg-[#0B1220] hover:bg-[#1E293B] text-white font-semibold text-xs h-9 px-4 gap-1.5 rounded-md"
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
        <footer className="mt-14 pt-8 pb-4 border-t border-[#E2E8F0] flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-[#64748B]">
          <div className="flex items-center gap-2">
            <span>© 2026 AITEK Inc. Enterprise Inventory Intelligence Platform. All rights reserved.</span>
          </div>

          <div className="flex items-center gap-5 sm:gap-6 flex-wrap justify-center">
            <button
              type="button"
              onClick={() => toast.info('AITEK Enterprise Privacy Policy')}
              className="hover:text-[#0B1220] transition-colors"
            >
              Privacy Policy
            </button>
            <button
              type="button"
              onClick={() => toast.info('AITEK Platform Terms of Service')}
              className="hover:text-[#0B1220] transition-colors"
            >
              Terms of Service
            </button>
            <button
              type="button"
              onClick={() => toast.info('Security: SOC2 Type II Certified, HIPAA & GDPR Compliant')}
              className="hover:text-[#0B1220] transition-colors"
            >
              Security & Compliance
            </button>
            <div className="flex items-center gap-1.5 text-[#059669] font-medium">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span>System Operational</span>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}

