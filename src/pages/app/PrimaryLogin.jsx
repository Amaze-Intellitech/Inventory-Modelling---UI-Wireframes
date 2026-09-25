import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { ShieldCheck, Globe, ChevronDown, HelpCircle } from 'lucide-react';
import SsoSignIn from '../../components/SsoSignIn';
import ThemeToggle from '../../components/ThemeToggle';
import aitekLogo from '../../components/aitek_logo_bg_removed-removebg-preview.png';

export default function PrimaryLogin() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div
      style={{
        display: 'flex',
        height: '100vh',
        maxHeight: '100vh',
        width: '100vw',
        overflow: 'hidden',
        backgroundColor: 'var(--rail-bg)',
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
          backgroundColor: 'var(--rail-bg)',
          backgroundImage:
            'radial-gradient(circle at 10% 15%, rgba(91, 147, 255, 0.16) 0%, transparent 45%), radial-gradient(circle at 86% 52%, rgba(91, 147, 255, 0.12) 0%, transparent 50%), radial-gradient(circle at 30% 92%, rgba(21, 93, 252, 0.14) 0%, transparent 55%)',
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
                <circle cx="2" cy="2" r="1" fill="var(--primary-on-deep)" fillOpacity="0.4" />
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
                  fontSize: '12px',
                  fontWeight: 600,
                  letterSpacing: '0.06em',
                  color: 'var(--primary-on-deep)',
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
                  color: 'var(--primary-on-deep)',
                  textShadow: '0 0 28px rgba(91, 147, 255, 0.4)',
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
            fontSize: '12px',
            color: '#6E84A6',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <ShieldCheck size={15} style={{ color: 'var(--primary-on-deep)', flexShrink: 0 }} />
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
          backgroundColor: 'var(--bg)',
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
            color: 'var(--body-c)',
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
              color: 'var(--body-c)',
            }}
            aria-label="Select language"
          >
            <Globe style={{ width: '13.5px', height: '13.5px', color: 'var(--subtle)' }} />
            <span>English</span>
            <ChevronDown style={{ width: '11px', height: '11px', color: 'var(--subtle)' }} />
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
              color: 'var(--body-c)',
              textDecoration: 'none',
            }}
          >
            <HelpCircle style={{ width: '13.5px', height: '13.5px', color: 'var(--subtle)' }} />
            <span>Need help?</span>
          </a>

          <ThemeToggle />
        </div>

        {/* Center: single sign-on card (no password field; identity comes from the organisation's provider) */}
        <div style={{ margin: 'auto 0', display: 'flex', justifyContent: 'center', width: '100%' }}>
          <SsoSignIn />
        </div>

        <div
          style={{
            textAlign: 'center',
            fontSize: '12px',
            color: 'var(--subtle)',
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
            style={{ color: 'var(--subtle)', textDecoration: 'none' }}
          >
            Privacy Policy
          </a>
          <span style={{ color: 'var(--border-strong)' }}>|</span>
          <a
            href="#!"
            onClick={(e) => e.preventDefault()}
            style={{ color: 'var(--subtle)', textDecoration: 'none' }}
          >
            Terms of Service
          </a>
          <span style={{ color: 'var(--border-strong)' }}>|</span>
          <a
            href="#!"
            onClick={(e) => e.preventDefault()}
            style={{ color: 'var(--subtle)', textDecoration: 'none' }}
          >
            Security
          </a>
        </div>
      </div>
    </div>
  );
}
