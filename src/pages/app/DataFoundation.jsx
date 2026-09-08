import React from 'react';
import { ViewHead, KpiTile, Badge, WhyDisclosure } from '../../components/CommonUI';
import { MATERIALS } from '../../data/mockData';

const SOURCES = [
  { name: 'SAP S/4HANA', domain: 'Inventory ledger, cost', records: '3.80M', cadence: 'Every 4.00h', status: 'ok' },
  { name: 'Manhattan WMS', domain: 'Warehouse movement', records: '1.60M', cadence: 'Every 1.00h', status: 'ok' },
  { name: 'Coupa', domain: 'Procurement, PO, supplier', records: '640.00K', cadence: 'Nightly', status: 'ok' },
  { name: 'Quality Mgmt System', domain: 'Inspection, shelf-life', records: '160.00K', cadence: 'Nightly', status: 'watch' },
];

export default function DataFoundation() {
  return (
    <section className="view">
      <ViewHead title="Data Foundation" subtitle={<p>What the platform is reading from, at what scale, and how it's organized — before any analysis runs on top of it.</p>} />

      <div className="grid-4">
        <KpiTile label="Transactional Records Ingested" value="6.20M" sub="Movements, receipts & consumption, trailing 24 months" />
        <KpiTile label="Active Master Records" value="1,420" sub="Materials in active management scope" />
        <KpiTile label="Source Systems Connected" value="4" sub="ERP · WMS · Procurement · Quality" />
        <KpiTile label="Data Quality Score" value="99.80%" sub="Schema & completeness validation, last snapshot" />
      </div>

      <div className="two-col">
        <div className="card">
          <div className="card__head"><div><h2 className="card__title">Connected sources</h2><p className="card__sub">Each source syncs on its own cadence into a single reconciled snapshot</p></div></div>
          <table>
            <thead><tr><th>Source</th><th>Domain</th><th className="num text-right">Records</th><th>Cadence</th><th>Status</th></tr></thead>
            <tbody>
              {SOURCES.map((s) => (
                <tr key={s.name}>
                  <td className="font-semibold">{s.name}</td><td>{s.domain}</td>
                  <td className="num text-right">{s.records}</td><td>{s.cadence}</td>
                  <td><Badge tone={s.status === 'ok' ? 'success' : 'watch'}>{s.status === 'ok' ? 'Synchronized' : '2.00h delayed'}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="footnote">Snapshot v2.40 · frozen at data-read time so every screen in this session reflects the same instant, not a live-moving feed.</p>
        </div>

        <div className="card">
          <h2 className="card__title">Taxonomy in scope</h2>
          <p className="card__sub" style={{ marginBottom: 10 }}>How every material is classified before any analytics run</p>
          <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', margin: '12px 0 4px' }}>Material taxonomy</p>
          <ul className="taxo-list">
            <li>Raw Materials <span>480 SKUs</span></li>
            <li>Components &amp; Electronics <span>320 SKUs</span></li>
            <li>Finished Goods <span>240 SKUs</span></li>
            <li>Spare Parts &amp; MRO <span>260 SKUs</span></li>
            <li>Consumables <span>120 SKUs</span></li>
          </ul>
          <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', margin: '14px 0 4px' }}>Organization &amp; cost-center taxonomy</p>
          <ul className="taxo-list">
            <li>Enterprise <span>1 org</span></li>
            <li>Region <span>3 regions</span></li>
            <li>Plant <span>4 plants</span></li>
            <li>Cost center <span>22 centers</span></li>
          </ul>
        </div>
      </div>

      <div className="card">
        <div className="card__head">
          <div><h2 className="card__title">Material ledger</h2><p className="card__sub">Inventory shown in both cost and quantity — the unit of measure always travels with the number</p></div>
          <input className="btn btn-sm" style={{ cursor: 'text', fontWeight: 400 }} placeholder="Search material, plant or supplier…" readOnly />
        </div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Material</th><th>Category</th><th>Plant</th><th className="num text-right">On-Hand Qty</th><th className="num text-right">Unit Cost</th><th className="num text-right">Inventory Value</th><th>Class</th></tr></thead>
            <tbody>
              {MATERIALS.map((m) => (
                <tr key={m.id}>
                  <td className="font-semibold">{m.id} · {m.name}</td><td>{m.category}</td><td>{m.plant}</td>
                  <td className="num text-right">{m.qty.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {m.uom}</td>
                  <td className="num text-right">${m.unitCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  <td className="num text-right">${m.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  <td><Badge tone={m.abcClass === 'A' ? 'accent' : 'neutral'}>Class {m.abcClass}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <WhyDisclosure
          summary="Why data foundation quality score is 99.80% (Driver breakdown)"
          drivers={[
            'Automated cross-system reconciliation across ERP (SAP S/4HANA), WMS (Manhattan), Procurement (Coupa)',
            'Validation checks 100.00% of unit-of-measure conversions and unit cost fields against master catalog',
            'Quality Management System has a 2.00h ingestion latency on 160.00K inspection records',
          ]}
          meaning={[
            'Inventory counts and cost valuations are reconciled to frozen ledger snapshot v2.40',
            'Minor latency in QMS does not alter Class A material availability or cost baselines',
          ]}
          action={[
            'Maintain scheduled batch sync for QMS inspection lot release',
            'Proceed with downstream lot-sizing and RMLC analytics off verified snapshot',
          ]}
        />
      </div>
    </section>
  );
}
