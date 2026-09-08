import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import aitekLogo from '../../components/aitek_logo_bg_removed-removebg-preview.png';

export default function PrimaryLogin() {
  const navigate = useNavigate();
  const [showPw, setShowPw] = useState(false);

  return (
    <div className="login-split">
      <div className="login-split__hero">
        <div>
          <div className="login-split__brand">
            <img
              src={aitekLogo}
              alt="AITEK Logo"
              style={{ height: 46, width: 'auto', objectFit: 'contain' }}
            />
            <div className="rail__brand-text">
              <span className="rail__brand-name">AITEK</span>
              <span className="rail__brand-sub">Enterprise Intelligence</span>
            </div>
          </div>
        </div>
        <div>
          <h1>Turn enterprise inventory data into intelligent decisions.</h1>
          <p>Inventory · Working capital · Decision intelligence</p>
          <div className="login-split__stage">
            <span className="dot on" /><span>Enterprise data</span>
            <span style={{ flex: 1, height: 1, background: '#2A3A56' }} />
            <span className="dot" /><span>Intelligence</span>
            <span style={{ flex: 1, height: 1, background: '#2A3A56' }} />
            <span className="dot" /><span>Decisions</span>
          </div>
        </div>
        <div className="login-split__footer">© 2026 AITEK · Secure Enterprise Access</div>
      </div>

      <div className="login-split__right">
        <div className="login-form-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <img
              src={aitekLogo}
              alt="AITEK Logo"
              style={{ height: 36, width: 'auto', objectFit: 'contain' }}
            />
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, letterSpacing: '0.04em', color: 'var(--ink)' }}>AITEK</div>
              <div style={{ fontSize: 11.5, color: 'var(--muted)' }}>Enterprise Intelligence</div>
            </div>
          </div>
          <h2>Welcome back</h2>
          <p className="sub">Sign in to continue to the Enterprise Intelligence Platform</p>

          <div className="field-group">
            <label className="field-label" htmlFor="loginEmail">Email</label>
            <input className="field-input" id="loginEmail" type="email" placeholder="name@company.com" />
          </div>

          <div className="field-group">
            <label className="field-label" htmlFor="loginPass">Password</label>
            <div className="field-input-wrap">
              <input
                className="field-input"
                id="loginPass"
                type={showPw ? 'text' : 'password'}
                placeholder="Enter your password"
                style={{ paddingRight: 38 }}
              />
              <button type="button" className="field-toggle" onClick={() => setShowPw((v) => !v)}>
                {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          <div className="field-row-between">
            <label className="field-checkbox"><input type="checkbox" /> Remember me</label>
            <a href="#!" onClick={(e) => e.preventDefault()} style={{ fontSize: 12.5 }}>Forgot password?</a>
          </div>

          <button type="button" className="btn btn-primary btn-block" onClick={() => navigate('/solutions')}>
            Sign In
          </button>
          <div className="login-foot-note"><span>v2.4</span><span>Need access? Contact your admin</span></div>
        </div>
      </div>
    </div>
  );
}
