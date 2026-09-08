import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Layers, Grid2x2 } from 'lucide-react';
import { usePlatform } from '../../context/PlatformContext';

export default function SolutionSelection() {
  const navigate = useNavigate();
  const { resetSession } = usePlatform();

  function handleSignOut() {
    resetSession();
    navigate('/');
  }

  return (
    <div className="solutions-page">
      <div className="solutions-topbar">
        <div className="login-split__brand" style={{ color: 'var(--ink)' }}>
          <div className="rail__brand-mark" style={{ background: 'var(--ink)' }}>AT</div>
          <div className="rail__brand-text">
            <span className="rail__brand-name" style={{ color: 'var(--ink)' }}>AITEK</span>
            <span className="rail__brand-sub" style={{ color: 'var(--muted)' }}>Enterprise Intelligence</span>
          </div>
        </div>
        <button type="button" className="btn btn-ghost btn-sm" onClick={handleSignOut}>Sign out</button>
      </div>

      <div className="solutions-head">
        <h1>Choose your solution</h1>
        <p>Select the intelligence workspace you want to enter.</p>
      </div>

      <div className="solution-grid">
        <div className="solution-card" onClick={() => navigate('/workspace-login')}>
          <div className="solution-card__icon"><Layers size={19} /></div>
          <h2>Inventory Modelling</h2>
          <p>Optimize inventory decisions across materials, demand, supply and working capital.</p>
          <div className="solution-card__cap">Inventory Health · ABC · EOQ · RMLC · Optimization</div>
        </div>

        <div className="solution-card solution-card--disabled" aria-disabled="true">
          <div className="solution-card__icon" style={{ background: 'var(--bg)', color: 'var(--muted-2)' }}>
            <Grid2x2 size={19} />
          </div>
          <h2>Procurement Intelligence <span className="badge badge-neutral" style={{ marginLeft: 6 }}>Coming soon</span></h2>
          <p>Supplier performance, cost-center spend and sourcing risk across the vendor base.</p>
          <div className="solution-card__cap">Supplier Scorecards · Spend Analysis · Sourcing Risk</div>
        </div>
      </div>
    </div>
  );
}
