import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ViewHead, KpiTile, WhyDisclosure } from '../../components/CommonUI';

export default function Optimization() {
  const navigate = useNavigate();
  return (
    <section className="view">
      <ViewHead
        title="Optimization Plan"
        subtitle={<p>Recommended order plan under stated budget, capacity and service-level constraints — with the supplier split behind each number.</p>}
        actions={<button type="button" className="btn btn-primary" onClick={() => navigate('/app/decisions')}>Send to Decision Intelligence</button>}
      />

      <div className="card">
        <h2 className="card__title" style={{ marginBottom: 12 }}>Constraints in effect</h2>
        <div className="grid-4" style={{ marginBottom: 0 }}>
          <KpiTile label="Procurement Budget" value="$10.00M" sub="78.40% utilized under this plan" />
          <KpiTile label="Storage Capacity" value="500,000.00 units" sub="61.20% utilized · physical warehouse capacity, all plants" />
          <KpiTile label="Service Level Target" value="95.00%" sub="Plan projects 98.40%" />
          <KpiTile label="Max Supplier Utilization" value="100.00%" sub="No single-supplier cap breached" />
        </div>
      </div>

      <div className="grid-4">
        <KpiTile label="Total Cash Recoverable" value="$3.65M" valueStyle={{ color: 'var(--accent)' }} sub="Across 142 Class A materials" />
        <KpiTile label="Stockout Revenue Averted" value="$1.82M" valueStyle={{ color: 'var(--success)' }} />
        <KpiTile label="Annual Holding Savings" value="$142,800.00" />
        <KpiTile label="Projected Service Level" value="98.40%" valueStyle={{ color: 'var(--success)' }} />
      </div>

      <div className="card">
        <div className="card__head"><div><h2 className="card__title">Per-material order plan</h2><p className="card__sub">Desired stock level and supplier allocation for each recommended action</p></div></div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Material</th>
                <th className="num text-right">Current Stock</th>
                <th className="num text-right">Desired Stock Level</th>
                <th className="num text-right">Recommended Order Qty</th>
                <th>Supplier Allocation</th>
                <th>Confidence</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="font-semibold">MAT-1082 · Hydraulic Pump</td>
                <td className="num text-right">930.00 EA ($558,000.00)</td>
                <td className="num text-right">480.00 EA ($288,000.00)</td>
                <td className="num text-right">320.00 EA ($192,000.00)</td>
                <td>Vendor A 70.00% · Vendor B 30.00%</td>
                <td className="num">96.10%</td>
              </tr>
              <tr>
                <td className="font-semibold">MAT-4120 · Microcontroller MCU-64</td>
                <td className="num text-right">6,140.00 EA ($482,800.00)</td>
                <td className="num text-right">9,200.00 EA ($723,580.00)</td>
                <td className="num text-right">4,500.00 EA ($353,925.00)</td>
                <td>Vendor C 100.00%</td>
                <td className="num">94.80%</td>
              </tr>
              <tr>
                <td className="font-semibold">MAT-2041 · Lithium Cell 21700</td>
                <td className="num text-right">142,000.00 EA ($729,880.00)</td>
                <td className="num text-right">128,000.00 EA ($657,920.00)</td>
                <td className="num text-right">0.00 EA ($0.00)</td>
                <td>—</td>
                <td className="num">97.30%</td>
              </tr>
            </tbody>
          </table>
        </div>
        <WhyDisclosure
          summary="Why MAT-4120's order quantity is this large"
          drivers={[
            '60-day supplier lead time against an estimated 14-day stockout horizon',
            'Demand ramp +22.00% not yet incorporated in legacy standing replenishment orders',
            'Recommended order of 4,500.00 EA ($353,925.00 value) lifts stock to 9,200.00 EA ($723,580.00 value) buffer target',
          ]}
          meaning={[
            'Single-supplier concentration risk on Vendor C (100.00% allocation)',
            'Failure to place 4,500.00 EA order triggers line stoppage inside 14 days ($1.82M revenue exposure)',
          ]}
          action={[
            'Authorize 4,500.00 EA PO immediately in Decision Intelligence',
            'Qualify a secondary supplier in next quarterly sourcing cycle to mitigate 100.00% single-vendor reliance',
          ]}
        />
      </div>
    </section>
  );
}
