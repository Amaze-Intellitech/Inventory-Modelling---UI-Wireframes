import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function SecondaryLogin() {
  const navigate = useNavigate();
  const [showPw, setShowPw] = useState(false);

  return (
    <div className="onb-shell" style={{ maxWidth: 460, paddingTop: 80 }}>
      <div className="onb-shell__topbar">
        <div className="login-split__brand" style={{ color: 'var(--ink)' }}>
          <div className="rail__brand-mark" style={{ background: 'var(--ink)' }}>AT</div>
          <div className="rail__brand-text">
            <span className="rail__brand-name" style={{ color: 'var(--ink)' }}>AITEK</span>
            <span className="rail__brand-sub" style={{ color: 'var(--muted)' }}>Inventory Modelling</span>
          </div>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={() => navigate('/solutions')}>Change solution</button>
      </div>

      <div className="onb-card">
        <h1>Confirm access to Inventory Modelling</h1>
        <p className="sub">This workspace runs on a separate credential from your primary AITEK sign-in.</p>

        <div className="field-group">
          <label className="field-label" htmlFor="wsEmail">Workspace Email</label>
          <input className="field-input" id="wsEmail" type="email" placeholder="name@company.com" />
        </div>

        <div className="field-group">
          <label className="field-label" htmlFor="wsPass">Workspace Password</label>
          <div className="field-input-wrap">
            <input
              className="field-input"
              id="wsPass"
              type={showPw ? 'text' : 'password'}
              placeholder="Enter your password"
              style={{ paddingRight: 38 }}
            />
            <button type="button" className="field-toggle" onClick={() => setShowPw((v) => !v)}>
              {showPw ? 'Hide' : 'Show'}
            </button>
          </div>
        </div>

        <button type="button" className="btn btn-primary btn-block" onClick={() => navigate('/material-selection')}>
          Sign In to Workspace
        </button>
      </div>
    </div>
  );
}
