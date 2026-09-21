import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { Sparkles, ArrowRight, PackageCheck, Box } from 'lucide-react';
import { Badge, Stepper } from '../../components/CommonUI';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { MATERIALS } from '../../data/mockData';
import { usePlatform } from '../../context/PlatformContext';
import aitekLogo from '../../components/aitek_logo_bg_removed-removebg-preview.png';

export default function MaterialSelection() {
  const navigate = useNavigate();
  const { selectedMaterialId, setSelectedMaterialId, selectedMaterial } = usePlatform();
  const shouldReduceMotion = useReducedMotion();

  const isRecommended = selectedMaterialId === 'MAT-1082';

  return (
    <div
      className="h-screen max-h-screen w-full flex flex-col justify-between relative overflow-hidden bg-bg select-none"
      style={{
        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
    >
      {/* Background Decorative Ambient Blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div
          className="absolute -top-[20%] -left-[10%] w-[55vw] h-[55vw] rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(91, 147, 255, 0.05) 0%, rgba(224, 242, 254, 0.02) 60%, transparent 80%)',
            filter: 'blur(40px)',
          }}
        />
        <div
          className="absolute -bottom-[20%] -right-[10%] w-[50vw] h-[50vw] rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(91, 147, 255, 0.06) 0%, rgba(240, 249, 255, 0.02) 60%, transparent 80%)',
            filter: 'blur(50px)',
          }}
        />
      </div>

      {/* 1. Top Bar */}
      <header className="h-14 sm:h-16 bg-surface border-b border-border z-20 relative shrink-0">
        <div className="page-wrap h-full flex items-center gap-3">
          <img
            src={aitekLogo}
            alt="AITEK Logo"
            className="h-[42px] sm:h-[46px] w-auto object-contain"
          />
          <div className="flex flex-col justify-center">
            <span className="text-[20px] sm:text-[22px] font-extrabold text-ink tracking-tight leading-none">
              AITEK
            </span>
            <span className="text-xs sm:text-xs font-medium text-primary leading-tight mt-0.5">
              Inventory Modelling
            </span>
          </div>
        </div>
      </header>

      {/* 2. Main Content (Zero Scroll Budget) */}
      <main className="flex-1 flex flex-col items-center justify-center page-wrap py-2 sm:py-3 my-auto relative z-10 overflow-hidden">
        
        {/* Stepper */}
        <div className="w-full max-w-xl mb-3 sm:mb-3.5 shrink-0">
          <Stepper steps={['Material', 'Parameters', 'Data sources', 'Ingestion']} current={1} className="mb-0" />
        </div>

        {/* Card */}
        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="w-full max-w-3xl bg-surface border border-border rounded-xl p-5 sm:p-6 shadow-[0_8px_30px_rgba(15,23,42,0.05)] shrink-0"
        >
          <div className="mb-3">
            <h1 className="text-lg sm:text-xl font-bold text-ink tracking-tight mb-0.5">
              Select focus material
            </h1>
            <p className="text-[12.5px] sm:text-[13px] text-subtle leading-snug">
              Choose a specific SKU for deep-dive calibration, or proceed with the system-recommended focus part.
            </p>
          </div>

          {/* Recommendation Banner */}
          <motion.div
            className={`rounded-lg p-2.5 sm:p-3 mb-3 border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
              isRecommended
                ? 'border-border bg-gradient-to-r from-info-bg to-info-bg shadow-2xs'
                : 'border-border bg-bg'
            }`}
            whileHover={shouldReduceMotion ? {} : { scale: 1.002 }}
          >
            <div className="flex items-start gap-2.5">
              <div className="w-7 h-7 rounded-full bg-info-bg text-info-tx flex items-center justify-center shrink-0 mt-0.5 border border-border">
                <Sparkles size={14} />
              </div>
              <div>
                <div className="text-xs font-bold text-info-tx uppercase tracking-[0.05em]">
                  System recommended focus
                </div>
                <div className="font-bold text-[13px] text-ink">
                  MAT-1082 · Hydraulic Pump 250BAR (Plant 1)
                </div>
              </div>
            </div>
            <Button
              type="button"
              variant={isRecommended ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setSelectedMaterialId('MAT-1082')}
              className="shrink-0 text-xs h-7 px-3 font-semibold"
            >
              {isRecommended ? (
                <span className="flex items-center gap-1">
                  <PackageCheck size={13} /> Selected
                </span>
              ) : (
                'Use recommended'
              )}
            </Button>
          </motion.div>

          {/* Select Dropdown */}
          <div className="mb-3">
            <div className="flex justify-between items-center mb-1">
              <label
                className="text-[12px] font-semibold text-ink"
                htmlFor="material-select-trigger"
              >
                Focus Material Selection
              </label>
              <Badge tone={selectedMaterial.abcClass === 'A' ? 'accent' : 'neutral'} className="text-xs py-0">
                Class {selectedMaterial.abcClass} Material
              </Badge>
            </div>

            <Select value={selectedMaterialId} onValueChange={(val) => setSelectedMaterialId(val)}>
              <SelectTrigger id="material-select-trigger" className="w-full h-9 bg-surface text-[13px]">
                <SelectValue>
                  <div className="flex items-center gap-2 text-left">
                    <Box size={14} className="text-primary shrink-0" />
                    <span className="font-bold text-ink">{selectedMaterial.id}</span>
                    <span className="text-subtle">·</span>
                    <span className="text-ink font-medium">{selectedMaterial.name}</span>
                    <span className="text-subtle text-xs">({selectedMaterial.plant})</span>
                  </div>
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {MATERIALS.map((m) => (
                  <SelectItem key={m.id} value={m.id} className="py-2">
                    <div className="flex items-center justify-between w-full gap-4 pr-2 text-[12.5px]">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-ink">{m.id}</span>
                        <span className="text-subtle">·</span>
                        <span className="text-ink font-medium">{m.name}</span>
                        <span className="text-subtle text-xs">({m.plant} — {m.category})</span>
                      </div>
                      <Badge tone={m.abcClass === 'A' ? 'accent' : 'neutral'} className="text-xs shrink-0 py-0">
                        Class {m.abcClass}
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Material group / type and ABC tier (design bible Screen B) */}
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mb-1 text-[12.5px]">
            <span className="text-subtle">Material group: <strong className="text-ink">{selectedMaterial.category}</strong></span>
            <span className="text-subtle">Material type: <strong className="text-ink">Raw material</strong></span>
            <span className="flex items-center gap-1.5 text-subtle">
              Suggested by ABC tier:
              {['A', 'B', 'C'].map((t) => (
                <span
                  key={t}
                  className="inline-flex items-center justify-center w-6 h-6 rounded-sm text-xs font-bold"
                  style={{
                    background: `var(--ord-${t.toLowerCase()})`,
                    color: `var(--ord-${t.toLowerCase()}t)`,
                    outline: selectedMaterial.abcClass === t ? '2px solid var(--ink)' : 'none',
                    outlineOffset: 2,
                    opacity: selectedMaterial.abcClass === t ? 1 : 0.55,
                  }}
                  aria-label={`Tier ${t}${selectedMaterial.abcClass === t ? ' (this material)' : ''}`}
                >
                  {t}
                </span>
              ))}
            </span>
          </div>

          {/* Action Row */}
          <div className="flex justify-end pt-3">
            <Button
              type="button"
              variant="primary"
              className="h-10 px-6 gap-2 text-[13.5px] bg-primary-solid hover:bg-info-tx text-white font-semibold shadow-sm"
              onClick={() => navigate('/parameter-mapping')}
            >
              <span>Continue to Parameters</span>
              <ArrowRight size={15} />
            </Button>
          </div>
        </motion.div>
      </main>

      {/* 3. Footer */}
      <footer className="border-t border-border py-2 px-6 sm:px-10 lg:px-16 flex flex-col sm:flex-row justify-between items-center gap-2 text-[12px] text-subtle z-20 relative bg-[color-mix(in_srgb,var(--surface)_70%,transparent)] backdrop-blur-xs shrink-0">
        <div className="flex items-center gap-2">
          <span>© 2026 AITEK. All rights reserved.</span>
          <span className="text-subtle font-light">|</span>
          <span>Enterprise Inventory Intelligence</span>
        </div>

        <div className="flex items-center gap-3 sm:gap-4 flex-wrap justify-center text-[12px]">
          <span className="text-primary">Privacy Policy</span>
          <span className="text-subtle font-light">|</span>
          <span className="text-primary">Terms of Service</span>
          <span className="text-subtle font-light">|</span>
          <span className="text-primary">Support</span>
        </div>
      </footer>
    </div>
  );
}
