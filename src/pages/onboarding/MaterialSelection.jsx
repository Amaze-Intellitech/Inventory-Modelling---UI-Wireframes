import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge, Stepper } from '../../components/CommonUI';
import { MATERIALS } from '../../data/mockData';
import { usePlatform } from '../../context/PlatformContext';
import aitekLogo from '../../components/aitek_logo_bg_removed-removebg-preview.png';

export default function MaterialSelection() {
  const navigate = useNavigate();
  const { selectedMaterialId, setSelectedMaterialId, selectedMaterial } = usePlatform();

  return (
    <div className="onb-shell" style={{ maxWidth: 1040 }}>
      <div className="onb-shell__topbar">
        <div className="login-split__brand" style={{ color: 'var(--ink)' }}>
          <img
            src={aitekLogo}
            alt="AITEK Logo"
            style={{ height: 38, width: 'auto', objectFit: 'contain' }}
          />
          <div className="rail__brand-text">
            <span className="rail__brand-name" style={{ color: 'var(--ink)' }}>AITEK</span>
            <span className="rail__brand-sub" style={{ color: 'var(--muted)' }}>Inventory Modelling</span>
          </div>
        </div>
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => navigate('/workspace-login')}>Back</button>
      </div>

      <Stepper steps={['Material Selection', 'Data Sources']} current={1} />

      <div className="onb-card">
        <h1>Select focus material</h1>
        <p className="sub">Choose a specific SKU for deep-dive calibration, or proceed with the system-recommended focus part.</p>

        <div className="recommend-banner">
          <div style={{ flex: 1 }}>
            <div className="recommend-banner__tag">System recommended focus</div>
            <div style={{ fontWeight: 600, fontSize: 13.5 }}>MAT-1082 · Hydraulic Pump 250BAR (Plant 1)</div>
            <div style={{ fontSize: 12, color: 'var(--muted)' }}>
              High-value Class A material · 930.00 EA on-hand ($558,000.00 value) · $63,000.00 recovery opportunity identified
            </div>
          </div>
          <button type="button" className="btn btn-sm" onClick={() => setSelectedMaterialId('MAT-1082')}>Use recommended</button>
        </div>

        <div className="field-group" style={{ marginBottom: 16 }}>
          <label className="field-label" htmlFor="material-select">Focus Material</label>
          <div className="card__head" style={{ marginBottom: 0 }}>
            <select
              id="material-select"
              className="btn btn-sm"
              style={{ fontWeight: 600 }}
              value={selectedMaterialId}
              onChange={(e) => setSelectedMaterialId(e.target.value)}
            >
              {MATERIALS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.id} · {m.name} — {m.plant}
                </option>
              ))}
            </select>
            <Badge tone={selectedMaterial.abcClass === 'A' ? 'accent' : 'neutral'}>
              Class {selectedMaterial.abcClass} Material
            </Badge>
          </div>
        </div>

        <div className="card" style={{ marginTop: 16, marginBottom: 20 }}>
          <div className="card__head" style={{ marginBottom: 12 }}>
            <div>
              <h2 className="card__title">{selectedMaterial.id} · {selectedMaterial.name}</h2>
              <p className="card__sub">{selectedMaterial.category} · {selectedMaterial.plant}</p>
            </div>
            <Badge tone={selectedMaterial.abcClass === 'A' ? 'accent' : 'neutral'}>
              Class {selectedMaterial.abcClass}
            </Badge>
          </div>
          <div className="grid-3" style={{ marginBottom: 0 }}>
            <div>
              <span className="kpi__label">On-Hand Quantity</span>
              <span className="num" style={{ fontSize: 16, fontWeight: 600, color: 'var(--ink)' }}>
                {selectedMaterial.qty.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {selectedMaterial.uom}
              </span>
              <span className="kpi__sub">Physical inventory</span>
            </div>
            <div>
              <span className="kpi__label">Unit Cost</span>
              <span className="num" style={{ fontSize: 16, fontWeight: 600, color: 'var(--ink)' }}>
                ${selectedMaterial.unitCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className="kpi__sub">Standard cost / {selectedMaterial.uom}</span>
            </div>
            <div>
              <span className="kpi__label">Total Inventory Value</span>
              <span className="num" style={{ fontSize: 16, fontWeight: 600, color: 'var(--ink)' }}>
                ${selectedMaterial.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className="kpi__sub">Carrying value</span>
            </div>
          </div>
        </div>

        <div style={{ marginTop: 18 }}>
          <button type="button" className="btn btn-primary" onClick={() => navigate('/data-sources')}>
            Continue to Data Sources
          </button>
        </div>
      </div>
    </div>
  );
}
