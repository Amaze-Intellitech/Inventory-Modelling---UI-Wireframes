import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ViewHead, KpiTile, SectionTitle, Insight, WhyDisclosure } from '../../components/CommonUI';
import { usePlatform } from '../../context/PlatformContext';

export default function Overview() {
  const navigate = useNavigate();
  const { persona } = usePlatform();

  const subtitle = {
    exec: "What your working capital, service risk and inventory position mean for this quarter's numbers — and the three decisions worth your attention today.",
    analyst: 'Inventory health across all plants, with the specific SKUs, drivers and next investigations behind each number.',
    ds: 'Model-backed view of the inventory estate: classification stability, requirement calculations and data quality underlying every figure below.',
  }[persona];

  return (
    <section className="view">
      <ViewHead
        title="Enterprise Inventory Intelligence"
        subtitle={<p>{subtitle}</p>}
        actions={<button type="button" className="btn" onClick={() => navigate('/app/descriptive')}>Descriptive Intelligence</button>}
      />

      <div className="grid-4">
        <KpiTile
          label="Total Inventory Value"
          value="$42.85M"
          delta="↑ 3.10% vs last snapshot"
          deltaTone="up"
          sub="1,420 active materials · 4 plants"
          onClick={() => navigate('/app/abc')}
        />
        <KpiTile
          label="Working Capital in Excess Stock"
          value="$8.20M"
          delta="$3.65M recoverable via calibration"
          deltaTone="down"
          sub={persona === 'analyst' ? 'Concentrated in 142 Class A SKUs' : 'Roughly 19.00% of total inventory value'}
          onClick={() => navigate('/app/eoq')}
        />
        <KpiTile
          label="Service Level"
          value="97.40%"
          delta="-0.60 pts vs 98.00% target"
          deltaTone="down"
          sub={persona === 'analyst' ? 'Plant 3 is the primary drag (94.50%)' : undefined}
          onClick={() => navigate('/app/descriptive')}
        />
        <KpiTile
          label="Inventory Turnover"
          value="4.80x"
          sub="Range across plants: 3.80x – 5.40x"
        />
        <KpiTile
          label="Stockout Risk Exposure"
          value="42 SKUs"
          delta="$1.82M revenue at risk inside lead time"
          deltaTone="down"
          onClick={() => navigate('/app/decisions')}
        />
        <KpiTile
          label="Liquidation / Overstock Exposure"
          value="$2.10M"
          delta="118 SKUs past 180-day threshold"
          deltaTone="down"
          onClick={() => navigate('/app/rmlc')}
        />
        <KpiTile
          label="Total Quantity On Hand"
          value="18.40M units"
          sub="$42.85M total value across raw materials, WIP, FG, spares"
          onClick={() => navigate('/app/data-foundation')}
        />
        <KpiTile
          label="Raw Material Coverage"
          value="72.00%"
          sub="4 of 6 tracked raw materials fully covered this horizon"
          onClick={() => navigate('/app/raw-materials')}
        />
      </div>

      <SectionTitle>Signals requiring attention</SectionTitle>

      <Insight label="Stockout risk · 14-day horizon">
        Material <span className="metric">MAT-4120</span> (automotive microcontroller, Plant 3) crosses its reorder point
        in an estimated <span className="metric">14 days</span> against a <span className="metric">60-day</span> supplier
        lead time. Estimated revenue exposure <span className="metric">$1.82M</span> across 6,140.00 EA ($482,800.00 value) on-hand.
      </Insight>
      <WhyDisclosure
        summary="Why is this flagged"
        drivers={['Demand ramp +22.00% vs 90-day average', 'Supplier lead time extended 45→60 days', 'Safety stock sized on pre-ramp demand']}
        meaning={['Reorder point triggers before replacement stock can land', '~9 days of uncovered demand at current velocity']}
        action={['Authorize expedited PO (air freight)', 'Recalibrate safety stock off updated demand rate']}
      />
      <div style={{ margin: '12px 0 20px' }}>
        <button type="button" className="btn btn-sm" onClick={() => navigate('/app/decisions')}>Open in Decision Intelligence</button>
      </div>

      <Insight label="Working capital · lot sizing">
        Material <span className="metric">MAT-1082</span> (hydraulic pump, Plant 1) is purchased in batches of{' '}
        <span className="metric">600.00 EA</span> ($360,000.00 value) against a calibrated EOQ of <span className="metric">320.00 EA</span> ($192,000.00 value), holding an
        estimated <span className="metric">$63,000.00</span> of avoidable working capital.
      </Insight>
      <WhyDisclosure
        summary="Why is this working capital trapped"
        drivers={['Historic batch size fixed at 600.00 EA based on manual annual PO agreements', 'Current automated EDI ordering cadence supports 320.00 EA orders at $230.00/order', 'Holding cost 12.00%/yr ($36.00/unit/yr) on $600.00 unit cost']}
        meaning={['$63,000.00 in surplus cycle stock sits idle between replenishment cycles', 'Batch size reduction to 320.00 EA frees cash with zero stockout risk']}
        action={['Calibrate EOQ to 320.00 EA in EoqCalibration', 'Redirect released working capital into strategic Class A safety buffers']}
      />
      <div style={{ margin: '12px 0 20px' }}>
        <button type="button" className="btn btn-sm" onClick={() => navigate('/app/eoq')}>Review EOQ calibration</button>
      </div>

      <SectionTitle>Recommended investigations</SectionTitle>
      <div className="grid-3">
        <div className="card">
          <p className="card__sub" style={{ marginBottom: 8 }}>Where is capital concentrated?</p>
          <p style={{ fontSize: 13, margin: '0 0 10px' }}>142 Class A materials (10.00% of the catalog) hold an estimated 80.00% ($34.28M) of total inventory value.</p>
          <button type="button" className="btn btn-sm" onClick={() => navigate('/app/abc')}>Open ABC breakdown</button>
        </div>
        <div className="card">
          <p className="card__sub" style={{ marginBottom: 8 }}>What if holding cost rises 15.00%?</p>
          <p style={{ fontSize: 13, margin: '0 0 10px' }}>Re-run lot sizing under a higher capital rate before it happens, not after.</p>
          <button type="button" className="btn btn-sm" onClick={() => navigate('/app/what-if')}>Run scenario</button>
        </div>
        <div className="card">
          <p className="card__sub" style={{ marginBottom: 8 }}>What's approaching liquidation?</p>
          <p style={{ fontSize: 13, margin: '0 0 10px' }}>118 materials ($2.10M value) have passed 180 days without consumption.</p>
          <button type="button" className="btn btn-sm" onClick={() => navigate('/app/rmlc')}>Open RMLC lifecycle</button>
        </div>
      </div>
    </section>
  );
}
