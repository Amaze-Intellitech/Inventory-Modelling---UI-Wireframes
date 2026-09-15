import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { motion, useReducedMotion } from 'framer-motion';
import {
  Eye,
  EyeOff,
  ShieldCheck,
  ArrowRight,
  Lock,
  Mail,
  X,
  Globe,
  ChevronDown,
  HelpCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import aitekLogo from '../../components/aitek_logo_bg_removed-removebg-preview.png';

const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Enter a valid business email'),
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional(),
});

export default function PrimaryLogin() {
  const navigate = useNavigate();
  const [showPw, setShowPw] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [pwFocused, setPwFocused] = useState(false);
  const shouldReduceMotion = useReducedMotion();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: 'alex.vance@enterprisecorp.com',
      password: '••••••••••••',
      rememberMe: true,
    },
  });

  const rememberMeValue = watch('rememberMe');
  const emailValue = watch('email');

  const onSubmit = () => {
    navigate('/solutions');
  };

  const emailRegister = register('email');
  const pwRegister = register('password');

  return (
    <div
      style={{
        display: 'flex',
        height: '100vh',
        maxHeight: '100vh',
        width: '100vw',
        overflow: 'hidden',
        backgroundColor: '#06111F',
        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
      className="h-screen w-screen overflow-hidden flex flex-col lg:flex-row select-none"
    >
      {/* ========================================================================= */}
      {/* LEFT PANEL: 64% Dark Enterprise Showcase (Two-Column Hero)                */}
      {/* ========================================================================= */}
      <div
        style={{
          flex: '0 0 64%',
          width: '64%',
          height: '100vh',
          maxHeight: '100vh',
          overflow: 'hidden',
          backgroundColor: '#06111F',
          backgroundImage:
            'radial-gradient(circle at 10% 15%, rgba(2, 132, 199, 0.16) 0%, transparent 45%), radial-gradient(circle at 86% 52%, rgba(66, 184, 238, 0.12) 0%, transparent 50%), radial-gradient(circle at 30% 92%, rgba(3, 105, 161, 0.14) 0%, transparent 55%)',
          color: '#FFFFFF',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '32px 40px 22px 48px',
          position: 'relative',
          boxSizing: 'border-box',
          borderRight: '1px solid #132238',
        }}
        className="w-full lg:w-[64%] h-full flex flex-col justify-between relative overflow-hidden"
      >
        {/* Subtle Atmospheric Dot Grid Background without waves */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            opacity: 0.12,
            zIndex: 1,
          }}
          aria-hidden="true"
        >
          <svg width="100%" height="100%" style={{ width: '100%', height: '100%', display: 'block' }}>
            <defs>
              <pattern id="dot-grid-matrix-lock" width="32" height="32" patternUnits="userSpaceOnUse">
                <circle cx="2" cy="2" r="1" fill="#42B8EE" fillOpacity="0.4" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#dot-grid-matrix-lock)" />
          </svg>
        </div>

        {/* --- Top Brand Bar --- */}
        <div
          style={{
            position: 'relative',
            zIndex: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <img
              src={aitekLogo}
              alt="AITEK Logo"
              style={{
                height: '44px',
                width: 'auto',
                maxHeight: '44px',
                objectFit: 'contain',
                flexShrink: 0,
                display: 'block',
              }}
            />
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span
                style={{
                  fontSize: '19px',
                  fontWeight: 800,
                  letterSpacing: '-0.02em',
                  color: '#FFFFFF',
                  lineHeight: 1.1,
                }}
              >
                AITEK
              </span>
              <span
                style={{
                  fontSize: '10.5px',
                  fontWeight: 600,
                  letterSpacing: '0.06em',
                  color: '#42B8EE',
                  textTransform: 'uppercase',
                  marginTop: '2px',
                }}
              >
                Enterprise Inventory Intelligence
              </span>
            </div>
          </div>
        </div>

        {/* --- Hero Content (Clean & Spacious Presentation) --- */}
        <div
          style={{
            position: 'relative',
            zIndex: 10,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            maxWidth: '620px',
            margin: 'auto 0',
          }}
        >
          <motion.div
            initial={shouldReduceMotion ? false : { opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
          >
            <h1
              style={{
                fontSize: 'clamp(32px, 3.4vw, 46px)',
                fontWeight: 800,
                letterSpacing: '-0.025em',
                color: '#FFFFFF',
                lineHeight: 1.16,
                margin: '0 0 16px 0',
              }}
            >
              <span style={{ display: 'block' }}>Turn enterprise</span>
              <span style={{ display: 'block' }}>inventory data into</span>
              <span
                style={{
                  display: 'block',
                  color: '#42B8EE',
                  textShadow: '0 0 28px rgba(66, 184, 238, 0.4)',
                }}
              >
                intelligent decisions.
              </span>
            </h1>
            <p
              style={{
                fontSize: '14.5px',
                color: '#8FA3C0',
                lineHeight: 1.55,
                margin: 0,
                maxWidth: '500px',
              }}
            >
              Inventory · Working capital · Decision intelligence
            </p>
          </motion.div>
        </div>

        {/* --- Left Panel Footer --- */}
        <div
          style={{
            position: 'relative',
            zIndex: 10,
            fontSize: '11.5px',
            color: '#6E84A6',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <ShieldCheck size={15} style={{ color: '#42B8EE', flexShrink: 0 }} />
          <span>© 2026 AITEK · Secure Enterprise Access</span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* RIGHT PANEL: 36% Clean Enterprise Login Experience                        */}
      {/* ========================================================================= */}
      <div
        style={{
          flex: '0 0 36%',
          width: '36%',
          height: '100vh',
          maxHeight: '100vh',
          overflow: 'hidden',
          backgroundColor: '#F8FAFC',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '20px 32px 16px 32px',
          boxSizing: 'border-box',
          position: 'relative',
        }}
        className="w-full lg:w-[36%] h-full flex flex-col justify-between overflow-hidden"
      >
        {/* Top-Right Utility Bar: Language & Help */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: '12px',
            fontSize: '12px',
            color: '#475569',
            width: '100%',
          }}
        >
          <button
            type="button"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              padding: '4px 8px',
              borderRadius: '6px',
              border: 'none',
              backgroundColor: 'transparent',
              cursor: 'pointer',
              fontWeight: 500,
              color: '#334155',
            }}
            aria-label="Select language"
          >
            <Globe style={{ width: '13.5px', height: '13.5px', color: '#64748B' }} />
            <span>English</span>
            <ChevronDown style={{ width: '11px', height: '11px', color: '#94A3B8' }} />
          </button>

          <a
            href="#!"
            onClick={(e) => e.preventDefault()}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              padding: '4px 8px',
              borderRadius: '6px',
              fontWeight: 500,
              color: '#334155',
              textDecoration: 'none',
            }}
          >
            <HelpCircle style={{ width: '13.5px', height: '13.5px', color: '#64748B' }} />
            <span>Need help?</span>
          </a>
        </div>

        {/* Center: Login Card */}
        <div
          style={{
            margin: 'auto 0',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
          }}
        >
          <motion.div
            initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.98, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            style={{
              width: '100%',
              maxWidth: '425px',
              backgroundColor: '#FFFFFF',
              borderRadius: '12px',
              border: '1px solid #E2E8F0',
              boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.06), 0 4px 10px -4px rgba(15, 23, 42, 0.03)',
              padding: '22px 26px',
              boxSizing: 'border-box',
            }}
          >
            {/* Small AITEK Branding at top of card */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
              <img
                src={aitekLogo}
                alt="AITEK Logo"
                style={{
                  height: '24px',
                  width: 'auto',
                  maxHeight: '24px',
                  objectFit: 'contain',
                  display: 'block',
                }}
              />
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '13px', fontWeight: 800, color: '#0F172A', lineHeight: 1 }}>
                  AITEK
                </span>
                <span style={{ fontSize: '9px', fontWeight: 600, color: '#64748B', letterSpacing: '0.04em' }}>
                  Enterprise Platform
                </span>
              </div>
            </div>

            {/* Headings */}
            <div style={{ marginBottom: '12px' }}>
              <span
                style={{
                  display: 'inline-block',
                  fontSize: '10px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  color: '#0284C7',
                  backgroundColor: '#E0F2FE',
                  padding: '2px 7px',
                  borderRadius: '4px',
                  marginBottom: '4px',
                }}
              >
                Welcome back
              </span>
              <h2
                style={{
                  fontSize: '20px',
                  fontWeight: 800,
                  color: '#0F172A',
                  letterSpacing: '-0.02em',
                  margin: '2px 0 3px 0',
                }}
              >
                Sign in to AITEK
              </h2>
              <p style={{ fontSize: '12px', color: '#64748B', margin: 0, lineHeight: 1.35 }}>
                Access your Enterprise Inventory Intelligence platform
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '11px' }}>
              {/* Email Field */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label
                  htmlFor="loginEmail"
                  style={{ fontSize: '12px', fontWeight: 600, color: '#1E293B', display: 'block' }}
                >
                  Email address
                </label>
                <div style={{ position: 'relative' }}>
                  <Mail
                    style={{
                      position: 'absolute',
                      left: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      width: '15px',
                      height: '15px',
                      color: errors.email ? '#EF4444' : emailFocused ? '#0284C7' : '#94A3B8',
                      transition: 'color 0.15s ease',
                      pointerEvents: 'none',
                    }}
                  />
                  <input
                    id="loginEmail"
                    type="email"
                    placeholder="name@company.com"
                    {...emailRegister}
                    onFocus={() => setEmailFocused(true)}
                    onBlur={(e) => {
                      setEmailFocused(false);
                      emailRegister.onBlur(e);
                    }}
                    style={{
                      width: '100%',
                      paddingLeft: '36px',
                      paddingRight: '34px',
                      height: '40px',
                      fontSize: '13px',
                      borderRadius: '8px',
                      border: errors.email ? '1.5px solid #EF4444' : emailFocused ? '1.5px solid #0284C7' : '1px solid #CBD5E1',
                      boxShadow: errors.email
                        ? '0 0 0 3px rgba(239, 68, 68, 0.12)'
                        : emailFocused
                        ? '0 0 0 3px rgba(2, 132, 199, 0.12)'
                        : 'none',
                      backgroundColor: '#FFFFFF',
                      color: '#0F172A',
                      outline: 'none',
                      transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
                      boxSizing: 'border-box',
                    }}
                  />
                  {emailValue && (
                    <button
                      type="button"
                      onClick={() => setValue('email', '', { shouldValidate: true })}
                      style={{
                        position: 'absolute',
                        right: '10px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: '#94A3B8',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                      aria-label="Clear email"
                    >
                      <X style={{ width: '13px', height: '13px' }} />
                    </button>
                  )}
                </div>
                {errors.email && (
                  <p style={{ fontSize: '11px', color: '#DC2626', margin: '2px 0 0 0', fontWeight: 500 }}>
                    {errors.email.message}
                  </p>
                )}
              </div>

              {/* Password Field */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <label
                    htmlFor="loginPass"
                    style={{ fontSize: '12px', fontWeight: 600, color: '#1E293B' }}
                  >
                    Password
                  </label>
                  <a
                    href="#!"
                    onClick={(e) => e.preventDefault()}
                    style={{ fontSize: '11.5px', fontWeight: 500, color: '#0284C7', textDecoration: 'none' }}
                  >
                    Forgot password?
                  </a>
                </div>
                <div style={{ position: 'relative' }}>
                  <Lock
                    style={{
                      position: 'absolute',
                      left: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      width: '15px',
                      height: '15px',
                      color: errors.password ? '#EF4444' : pwFocused ? '#0284C7' : '#94A3B8',
                      transition: 'color 0.15s ease',
                      pointerEvents: 'none',
                    }}
                  />
                  <input
                    id="loginPass"
                    type={showPw ? 'text' : 'password'}
                    placeholder="Enter your password"
                    {...pwRegister}
                    onFocus={() => setPwFocused(true)}
                    onBlur={(e) => {
                      setPwFocused(false);
                      pwRegister.onBlur(e);
                    }}
                    style={{
                      width: '100%',
                      paddingLeft: '36px',
                      paddingRight: '36px',
                      height: '40px',
                      fontSize: '13px',
                      borderRadius: '8px',
                      border: errors.password ? '1.5px solid #EF4444' : pwFocused ? '1.5px solid #0284C7' : '1px solid #CBD5E1',
                      boxShadow: errors.password
                        ? '0 0 0 3px rgba(239, 68, 68, 0.12)'
                        : pwFocused
                        ? '0 0 0 3px rgba(2, 132, 199, 0.12)'
                        : 'none',
                      backgroundColor: '#FFFFFF',
                      color: '#0F172A',
                      outline: 'none',
                      transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
                      boxSizing: 'border-box',
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw((v) => !v)}
                    style={{
                      position: 'absolute',
                      right: '10px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: '#94A3B8',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                    aria-label={showPw ? 'Hide password' : 'Show password'}
                  >
                    {showPw ? <EyeOff style={{ width: '15px', height: '15px' }} /> : <Eye style={{ width: '15px', height: '15px' }} />}
                  </button>
                </div>
                {errors.password && (
                  <p style={{ fontSize: '11px', color: '#DC2626', margin: '2px 0 0 0', fontWeight: 500 }}>
                    {errors.password.message}
                  </p>
                )}
              </div>

              {/* Remember Me Checkbox */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', paddingTop: '2px' }}>
                <button
                  type="button"
                  role="checkbox"
                  id="rememberMe"
                  aria-checked={Boolean(rememberMeValue)}
                  onClick={() => setValue('rememberMe', !rememberMeValue, { shouldDirty: true })}
                  style={{
                    width: '17px',
                    height: '17px',
                    minWidth: '17px',
                    minHeight: '17px',
                    borderRadius: '4px',
                    border: rememberMeValue ? '1.5px solid #0284C7' : '1.5px solid #CBD5E1',
                    backgroundColor: rememberMeValue ? '#0284C7' : '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    marginTop: '1px',
                    padding: 0,
                    outline: 'none',
                    transition: 'all 0.15s ease',
                    boxShadow: rememberMeValue ? '0 1px 3px rgba(2, 132, 199, 0.25)' : 'none',
                  }}
                >
                  {rememberMeValue && (
                    <svg
                      width="11"
                      height="11"
                      viewBox="0 0 12 12"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      style={{ display: 'block' }}
                    >
                      <path
                        d="M2.5 6.2L4.7 8.5L9.5 3.5"
                        stroke="#FFFFFF"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </button>
                <label
                  htmlFor="rememberMe"
                  onClick={() => setValue('rememberMe', !rememberMeValue, { shouldDirty: true })}
                  style={{ cursor: 'pointer', userSelect: 'none', lineHeight: 1.3 }}
                >
                  <span style={{ fontSize: '12px', fontWeight: 600, color: '#1E293B', display: 'block' }}>
                    Remember me
                  </span>
                  <span style={{ fontSize: '11px', color: '#64748B', display: 'block', marginTop: '1px' }}>
                    Keep me signed in on this device
                  </span>
                </label>
              </div>

              {/* Primary Sign In Button */}
              <Button
                type="submit"
                variant="accent"
                style={{
                  width: '100%',
                  height: '40px',
                  borderRadius: '8px',
                  backgroundColor: '#0284C7',
                  color: '#FFFFFF',
                  fontWeight: 600,
                  fontSize: '13.5px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  marginTop: '3px',
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: '0 2px 6px rgba(2, 132, 199, 0.25)',
                  transition: 'background-color 0.15s ease, box-shadow 0.15s ease',
                }}
              >
                <span>Sign In</span>
                <ArrowRight style={{ width: '15px', height: '15px' }} />
              </Button>
            </form>

            {/* Divider */}
            <div style={{ position: 'relative', margin: '13px 0' }}>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center' }}>
                <div style={{ width: '100%', borderTop: '1px solid #E2E8F0' }} />
              </div>
              <div
                style={{
                  position: 'relative',
                  display: 'flex',
                  justifyContent: 'center',
                  fontSize: '10px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  fontWeight: 700,
                  color: '#94A3B8',
                }}
              >
                <span style={{ backgroundColor: '#FFFFFF', padding: '0 10px' }}>OR CONTINUE WITH</span>
              </div>
            </div>

            {/* Enterprise SSO Buttons */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              {/* Microsoft SSO */}
              <button
                type="button"
                onClick={onSubmit}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  height: '38px',
                  padding: '0 10px',
                  border: '1px solid #CBD5E1',
                  backgroundColor: '#FFFFFF',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: '#334155',
                  cursor: 'pointer',
                  transition: 'background-color 0.15s ease, border-color 0.15s ease',
                }}
              >
                <svg width="14" height="14" viewBox="0 0 21 21" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="1" y="1" width="9" height="9" fill="#F25022" />
                  <rect x="11" y="1" width="9" height="9" fill="#7FBA00" />
                  <rect x="1" y="11" width="9" height="9" fill="#00A4EF" />
                  <rect x="11" y="11" width="9" height="9" fill="#FFB900" />
                </svg>
                <span>Microsoft</span>
              </button>

              {/* Google SSO */}
              <button
                type="button"
                onClick={onSubmit}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  height: '38px',
                  padding: '0 10px',
                  border: '1px solid #CBD5E1',
                  backgroundColor: '#FFFFFF',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: '#334155',
                  cursor: 'pointer',
                  transition: 'background-color 0.15s ease, border-color 0.15s ease',
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    fill="#EA4335"
                  />
                </svg>
                <span>Google</span>
              </button>
            </div>

            {/* Need access note */}
            <div
              style={{
                marginTop: '13px',
                paddingTop: '9px',
                borderTop: '1px solid #F1F5F9',
                textAlign: 'center',
                fontSize: '11px',
                color: '#64748B',
              }}
            >
              Need access?{' '}
              <a
                href="#!"
                onClick={(e) => e.preventDefault()}
                style={{ fontWeight: 600, color: '#0284C7', textDecoration: 'none' }}
              >
                Contact your administrator.
              </a>
            </div>
          </motion.div>
        </div>

        {/* --- Right Panel Bottom Centered Links --- */}
        <div
          style={{
            textAlign: 'center',
            fontSize: '11px',
            color: '#94A3B8',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            paddingBottom: '2px',
          }}
        >
          <a
            href="#!"
            onClick={(e) => e.preventDefault()}
            style={{ color: '#94A3B8', textDecoration: 'none' }}
          >
            Privacy Policy
          </a>
          <span style={{ color: '#CBD5E1' }}>|</span>
          <a
            href="#!"
            onClick={(e) => e.preventDefault()}
            style={{ color: '#94A3B8', textDecoration: 'none' }}
          >
            Terms of Service
          </a>
          <span style={{ color: '#CBD5E1' }}>|</span>
          <a
            href="#!"
            onClick={(e) => e.preventDefault()}
            style={{ color: '#94A3B8', textDecoration: 'none' }}
          >
            Security
          </a>
        </div>
      </div>
    </div>
  );
}
