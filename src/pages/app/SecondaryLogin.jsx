import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { motion, useReducedMotion } from 'framer-motion';
import {
  Eye,
  EyeOff,
  Layers,
  ArrowRight,
  ShieldCheck,
  Mail,
  Lock,
  KeyRound,
} from 'lucide-react';
import { toast } from 'sonner';
import aitekLogo from '../../components/aitek_logo_bg_removed-removebg-preview.png';

const secondaryLoginSchema = z.object({
  wsEmail: z.string().min(1, 'Workspace email is required').email('Enter a valid workspace email'),
  wsPass: z.string().min(1, 'Workspace password is required'),
});

export default function SecondaryLogin() {
  const navigate = useNavigate();
  const [showPw, setShowPw] = useState(false);
  const shouldReduceMotion = useReducedMotion();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(secondaryLoginSchema),
    defaultValues: {
      wsEmail: 'alex.vance@enterprisecorp.com',
      wsPass: '••••••••••••',
    },
  });

  const onSubmit = () => {
    navigate('/material-selection');
  };

  const handleSsoClick = () => {
    toast.info('Connecting to enterprise Identity Provider (SSO)...');
  };

  const handleForgotPassword = (e) => {
    e.preventDefault();
    toast.info('Password recovery instructions sent to workspace administrator.');
  };

  return (
    <div
      className="h-screen max-h-screen w-full flex flex-col justify-between relative overflow-hidden bg-[#F6F9FD] select-none"
      style={{
        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
    >
      {/* ========================================================================= */}
      {/* BACKGROUND DECORATIVE ELEMENTS                                            */}
      {/* ========================================================================= */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        {/* Soft Radial Glows */}
        <div
          className="absolute -top-[20%] -left-[10%] w-[55vw] h-[55vw] rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(2, 132, 199, 0.05) 0%, rgba(224, 242, 254, 0.02) 60%, transparent 80%)',
            filter: 'blur(40px)',
          }}
        />
        <div
          className="absolute -bottom-[20%] -right-[10%] w-[50vw] h-[50vw] rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(56, 189, 248, 0.06) 0%, rgba(240, 249, 255, 0.02) 60%, transparent 80%)',
            filter: 'blur(50px)',
          }}
        />

        {/* Ambient Subtle Curved Wave Paths */}
        <svg
          className="absolute top-0 left-0 w-full h-full opacity-30"
          viewBox="0 0 1664 936"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="none"
        >
          <path
            d="M-100 280C200 180 380 440 680 340C980 240 1200 480 1780 360"
            stroke="#BAE6FD"
            strokeWidth="1.5"
            strokeDasharray="6 6"
            strokeOpacity="0.6"
          />
          <path
            d="M-60 620C320 540 560 760 920 660C1280 560 1480 820 1800 700"
            stroke="#E0F2FE"
            strokeWidth="2"
            strokeOpacity="0.8"
          />
          <path
            d="M200 900C500 750 850 880 1200 790C1450 720 1600 860 1750 820"
            stroke="#BAE6FD"
            strokeWidth="1.2"
            strokeOpacity="0.5"
          />
        </svg>
      </div>

      {/* ========================================================================= */}
      {/* 1. HEADER (Compact enterprise white bar)                                  */}
      {/* ========================================================================= */}
      <header className="h-16 sm:h-[68px] bg-white border-b border-[#E2E8F0] px-6 sm:px-10 md:px-14 lg:px-18 xl:px-20 flex items-center z-20 relative shrink-0">
        {/* Left: AITEK Brand */}
        <div className="flex items-center gap-3">
          <img
            src={aitekLogo}
            alt="AITEK Logo"
            className="h-[48px] sm:h-[52px] w-auto object-contain"
          />
          <div className="flex flex-col justify-center">
            <span className="text-[22px] sm:text-[25px] font-extrabold text-[#0B1727] tracking-tight leading-none">
              AITEK
            </span>
            <span className="text-[11px] sm:text-[12px] font-medium text-[#0284C7] leading-tight mt-0.5 tracking-tight">
              Enterprise Inventory Intelligence
            </span>
          </div>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 2. MAIN CENTERED LOGIN SECTION (Zero-Scroll Budget)                       */}
      {/* ========================================================================= */}
      <main className="flex-1 flex flex-col items-center justify-center w-full max-w-[620px] xl:max-w-[650px] mx-auto px-4 py-2 relative z-10 my-auto">
        
        {/* Top Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-0.5 rounded-full bg-[#EFF6FF] border border-[#BAE6FD] text-[#0284C7] shadow-2xs mb-1.5">
          <Layers size={13} className="text-[#0284C7]" />
          <span className="text-[12px] font-semibold text-[#0284C7]">
            Inventory Modelling Workspace
          </span>
          <span className="text-[#93C5FD] font-light">|</span>
          <span className="text-[12px] font-medium text-[#0369A1]">
            Scope: All Plants
          </span>
        </div>

        {/* Main Heading */}
        <h1 className="text-2xl sm:text-[30px] lg:text-[33px] font-extrabold text-[#0B1727] tracking-tight leading-tight text-center mb-4">
          Confirm workspace access
        </h1>

        {/* Central White Login Card */}
        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.98, y: 6 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="w-full bg-white rounded-2xl border border-[#E2E8F0] shadow-[0_8px_30px_rgba(15,23,42,0.05)] p-6 sm:p-7"
        >
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
            
            {/* Workspace Email Field */}
            <div>
              <label
                htmlFor="wsEmail"
                className="block text-[13px] font-semibold text-[#0F172A] mb-1"
              >
                Workspace Email
              </label>
              <div className="relative">
                <Mail
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8] pointer-events-none"
                />
                <input
                  id="wsEmail"
                  type="email"
                  placeholder="alex.vance@enterprisecorp.com"
                  {...register('wsEmail')}
                  className={`w-full h-[44px] pl-10 pr-3.5 rounded-lg border bg-white text-[14px] text-[#0F172A] placeholder:text-[#94A3B8] outline-none transition-all focus:border-[#0284C7] focus:ring-2 focus:ring-[#E0F2FE] ${
                    errors.wsEmail ? 'border-red-500 focus:ring-red-100' : 'border-[#CBD5E1]'
                  }`}
                />
              </div>
              {errors.wsEmail && (
                <p className="text-[11.5px] text-red-600 mt-0.5 font-medium">{errors.wsEmail.message}</p>
              )}
            </div>

            {/* Workspace Password Field */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label
                  htmlFor="wsPass"
                  className="text-[13px] font-semibold text-[#0F172A]"
                >
                  Workspace Password
                </label>
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-[12.5px] font-medium text-[#0284C7] hover:text-[#0369A1] hover:underline cursor-pointer bg-transparent border-0 p-0"
                >
                  Forgot workspace password?
                </button>
              </div>
              <div className="relative">
                <Lock
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8] pointer-events-none"
                />
                <input
                  id="wsPass"
                  type={showPw ? 'text' : 'password'}
                  placeholder="Enter your workspace password"
                  {...register('wsPass')}
                  className={`w-full h-[44px] pl-10 pr-10 rounded-lg border bg-white text-[14px] text-[#0F172A] placeholder:text-[#94A3B8] outline-none transition-all focus:border-[#0284C7] focus:ring-2 focus:ring-[#E0F2FE] ${
                    errors.wsPass ? 'border-red-500 focus:ring-red-100' : 'border-[#CBD5E1]'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#475569] p-1 transition-colors cursor-pointer"
                  aria-label={showPw ? 'Hide password' : 'Show password'}
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.wsPass && (
                <p className="text-[11.5px] text-red-600 mt-0.5 font-medium">{errors.wsPass.message}</p>
              )}
            </div>

            {/* Primary Sign-In Button */}
            <button
              type="submit"
              className="w-full h-[46px] sm:h-[48px] rounded-lg bg-[#0284C7] hover:bg-[#0369A1] text-white font-semibold text-[15px] sm:text-[16px] flex items-center justify-center gap-2 shadow-sm hover:shadow transition-all cursor-pointer mt-3.5"
            >
              <span>Sign In to Workspace</span>
              <ArrowRight size={18} />
            </button>

            {/* OR Divider */}
            <div className="relative my-2.5 flex items-center justify-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#E2E8F0]" />
              </div>
              <div className="relative bg-white px-3 text-[11px] font-bold tracking-widest text-[#94A3B8]">
                OR
              </div>
            </div>

            {/* SSO Button */}
            <button
              type="button"
              onClick={handleSsoClick}
              className="w-full h-[44px] sm:h-[46px] rounded-lg border border-[#0284C7] bg-white hover:bg-[#F8FAFC] text-[#0284C7] font-semibold text-[14px] sm:text-[15px] flex items-center justify-between px-4 transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-2">
                <KeyRound size={16} className="text-[#0284C7]" />
                <span>Use Single Sign-On (SSO)</span>
              </div>
              <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
            </button>

            {/* Security Assurance Message */}
            <div className="rounded-xl bg-[#ECFDF5] border border-[#A7F3D0] p-2.5 sm:p-3 mt-3 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#D1FAE5] text-[#059669] flex items-center justify-center shrink-0">
                <ShieldCheck size={18} className="text-[#059669]" />
              </div>
              <div>
                <div className="text-[12.5px] font-bold text-[#065F46] leading-tight">
                  Multi-factor workspace authentication enabled
                </div>
                <div className="text-[11px] text-[#047857] leading-tight mt-0.5">
                  Your workspace is protected with enterprise-grade security.
                </div>
              </div>
            </div>

          </form>
        </motion.div>
      </main>

      {/* ========================================================================= */}
      {/* 3. FOOTER                                                                 */}
      {/* ========================================================================= */}
      <footer className="border-t border-[#E2E8F0] py-2.5 px-6 sm:px-10 md:px-14 lg:px-18 xl:px-20 flex flex-col sm:flex-row justify-between items-center gap-2 text-[12.5px] text-[#64748B] z-20 relative bg-white/70 backdrop-blur-xs shrink-0">
        {/* Left Footer: Copyright and branding */}
        <div className="flex items-center gap-2">
          <span>© 2026 AITEK. All rights reserved.</span>
          <span className="text-[#CBD5E1] font-light">|</span>
          <span>Enterprise Inventory Intelligence</span>
        </div>

        {/* Right Footer: Navigation links */}
        <div className="flex items-center gap-3 sm:gap-4 flex-wrap justify-center">
          <button
            type="button"
            onClick={() => toast.info('AITEK Enterprise Privacy Policy')}
            className="text-[#0284C7] hover:underline font-medium cursor-pointer bg-transparent border-0 p-0"
          >
            Privacy Policy
          </button>
          <span className="text-[#CBD5E1] font-light">|</span>
          <button
            type="button"
            onClick={() => toast.info('AITEK Platform Terms of Service')}
            className="text-[#0284C7] hover:underline font-medium cursor-pointer bg-transparent border-0 p-0"
          >
            Terms of Service
          </button>
          <span className="text-[#CBD5E1] font-light">|</span>
          <button
            type="button"
            onClick={() => toast.info('Contact AITEK Enterprise Support: support@aitek.ai')}
            className="text-[#0284C7] hover:underline font-medium cursor-pointer bg-transparent border-0 p-0"
          >
            Support
          </button>
        </div>
      </footer>
    </div>
  );
}
