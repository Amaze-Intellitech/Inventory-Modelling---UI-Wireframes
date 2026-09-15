import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreditCard, Database, Archive, FileText } from 'lucide-react';
import { Badge, Stepper } from '../../components/CommonUI';
import { CONNECTORS_STATIC, SQL_TABLE_OPTIONS } from '../../data/mockData';
import aitekLogo from '../../components/aitek_logo_bg_removed-removebg-preview.png';

const ICONS = { erp1: CreditCard, wh: Archive, file: FileText };

function SimpleConnectorCard({ conn }) {
  const [connected, setConnected] = useState(false);
  const Icon = ICONS[conn.id];
  return (
    <div className="connector-card">
      <div className="connector-card__top">
        <div className="connector-card__icon"><Icon size={16} /></div>
        <Badge tone={connected ? 'success' : 'neutral'}>{connected ? 'Connected' : 'Not connected'}</Badge>
      </div>
      <h3>{conn.label}</h3>
      <p>{conn.desc}</p>
      <button className="btn btn-sm connector-card__connect" onClick={() => setConnected((v) => !v)}>
        {connected ? 'Disconnect' : conn.cta}
      </button>
    </div>
  );
}

function SqlConnectorCard() {
  const [formOpen, setFormOpen] = useState(false);
  const [connected, setConnected] = useState(false);
  const [engine, setEngine] = useState('PostgreSQL');
  const [host, setHost] = useState('');
  const [port, setPort] = useState('');
  const [dbName, setDbName] = useState('');
  const [user, setUser] = useState('');
  const [pass, setPass] = useState('');
  const [error, setError] = useState('');
  const [connStr, setConnStr] = useState('');

  function testConnect() {
    if (!host.trim() || !dbName.trim()) {
      setError('Host and database name are required.');
      return;
    }
    const scheme = engine === 'PostgreSQL' ? 'postgresql' : engine === 'MySQL' ? 'mysql' : 'sqlserver';
    setConnStr(`${scheme}://${host}:${port || '5432'}/${dbName}`);
    setConnected(true);
    setFormOpen(false);
    setError('');
  }

  function disconnect() {
    setConnected(false);
    setFormOpen(false);
  }

  return (
    <div className="connector-card">
      <div className="connector-card__top">
        <div className="connector-card__icon"><Database size={16} /></div>
        <Badge tone={connected ? 'success' : 'neutral'}>{connected ? 'Connected' : 'Not connected'}</Badge>
      </div>
      <h3>SQL Database</h3>
      <p>PostgreSQL, MySQL, SQL Server — direct connection string</p>

      {!connected && !formOpen && (
        <button className="btn btn-sm connector-card__connect" onClick={() => setFormOpen(true)}>Connect Database</button>
      )}

      {formOpen && (
        <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--line)' }}>
          <div className="field-group" style={{ marginBottom: 10 }}>
            <label className="field-label">Database Engine</label>
            <select className="field-input" value={engine} onChange={(e) => setEngine(e.target.value)}>
              <option>PostgreSQL</option><option>MySQL</option><option>SQL Server</option>
            </select>
          </div>
          <div className="field-group" style={{ marginBottom: 10, display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 10 }}>
            <div><label className="field-label">Host</label><input className="field-input" value={host} onChange={(e) => setHost(e.target.value)} placeholder="db.company.internal" /></div>
            <div><label className="field-label">Port</label><input className="field-input" value={port} onChange={(e) => setPort(e.target.value)} placeholder="5432" /></div>
          </div>
          <div className="field-group" style={{ marginBottom: 10 }}>
            <label className="field-label">Database Name</label>
            <input className="field-input" value={dbName} onChange={(e) => setDbName(e.target.value)} placeholder="inventory_prod" />
          </div>
          <div className="field-group" style={{ marginBottom: 10, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div><label className="field-label">Username</label><input className="field-input" value={user} onChange={(e) => setUser(e.target.value)} placeholder="svc_inventory_ro" /></div>
            <div><label className="field-label">Password</label><input className="field-input" type="password" value={pass} onChange={(e) => setPass(e.target.value)} placeholder="••••••••" /></div>
          </div>
          {error && <div style={{ marginBottom: 10, color: 'var(--risk)', fontSize: 12 }}>{error}</div>}
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-accent btn-sm" style={{ flex: 1, justifyContent: 'center' }} onClick={testConnect}>Test &amp; Connect</button>
            <button className="btn btn-ghost btn-sm" onClick={() => setFormOpen(false)}>Cancel</button>
          </div>
        </div>
      )}

      {connected && (
        <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--line)' }}>
          <p className="footnote" style={{ margin: '0 0 10px' }}>{connStr}</p>
          <p style={{ fontSize: 12.5, fontWeight: 600, margin: '0 0 10px' }}>Map source tables</p>
          {[
            ['Inventory Master Table', SQL_TABLE_OPTIONS.inventory],
            ['Transactions / Movements Table', SQL_TABLE_OPTIONS.transactions],
            ['Bill of Materials Table', SQL_TABLE_OPTIONS.bom],
          ].map(([label, options]) => (
            <div className="field-group" style={{ marginBottom: 10 }} key={label}>
              <label className="field-label">{label}</label>
              <select className="field-input">{options.map((o) => <option key={o}>{o}</option>)}</select>
            </div>
          ))}
          <button className="btn btn-sm" style={{ width: '100%', justifyContent: 'center' }} onClick={disconnect}>Disconnect</button>
        </div>
      )}
    </div>
  );
}

export default function DataSourceConnections() {
  const navigate = useNavigate();
  return (
    <div className="onb-shell" style={{ maxWidth: 920 }}>
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
        <button className="btn btn-ghost btn-sm" onClick={() => navigate('/material-selection')}>Back</button>
      </div>

      <Stepper steps={['Material Selection', 'Data Sources']} current={2} />

      <div className="onb-card">
        <h1>Connect your data sources</h1>
        <p className="sub">Connect an ERP, a SQL database, a data warehouse, or upload a file directly — connect as many as apply.</p>

        <div className="connector-grid">
          <SimpleConnectorCard conn={CONNECTORS_STATIC[0]} />
          <SqlConnectorCard />
          <SimpleConnectorCard conn={CONNECTORS_STATIC[1]} />
          <SimpleConnectorCard conn={CONNECTORS_STATIC[2]} />
        </div>

        <p className="footnote">
          Don't see your system? Any source reachable by a standard connector or API can be added here —
          this step is a placeholder for that configuration, not a live connection in this storyboard.
        </p>

        <div style={{ marginTop: 18 }}>
          <button className="btn btn-primary" onClick={() => navigate('/app')}>Launch Inventory Intelligence Platform</button>
        </div>
      </div>
    </div>
  );
}
