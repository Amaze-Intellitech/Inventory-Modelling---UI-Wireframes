import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ViewHead, WhyDisclosure, Badge, KpiTile, Insight } from '../../components/CommonUI';
import { ParetoChart } from '../../components/Charts';
import { usePlatform } from '../../context/PlatformContext';

// ============================================================================
// CANONICAL MATERIAL INTELLIGENCE & DOWNSTREAM PRODUCT DEMAND BREAKDOWNS
// Each material has its own coherent, mathematically traceable downstream
// product relationships where:
//   Product Demand × BOM Qty = Derived Raw-Material Consumption
//   Sum of Derived Demands = Material Aggregate Annual Demand (100.00%)
//   Annual Consumption Value = Annual Raw-Material Consumption × Unit Cost
// ============================================================================
const MATERIAL_INTELLIGENCE = {
  'MAT-1082': {
    id: 'MAT-1082',
    name: 'Hydraulic Pump 250BAR',
    category: 'Components',
    plant: 'Plant 1 — Assembly',
    uom: 'EA',
    unitCost: 600.0,
    annualDemand: 4800.0,
    annualConsumptionValue: 2880000.0, // 4,800 EA × $600.00 = $2.88M
    onHandQty: 930.0,
    onHandValue: 558000.0, // 930 EA × $600.00 = $558,000.00 (4.07% of $13.71M physical stock)
    abcClass: 'A',
    contextTag: 'Class A + High Downstream Dependency + Single-Source Lead Time',
    demandCV: 0.12,
    leadTimeDays: 60,
    supplier: 'HydraTech Dynamics GmbH (Sole Source)',
    criticality: 'Critical (Line-stoppage risk; custom hydraulic interface with zero rapid substitutes)',
    downstreamProductsCount: 14,
    downstreamSummary: 'Top 4 tracked lines + 10 additional products (14 total)',
    downstreamProducts: [
      {
        product: 'Heavy Excavator HEX-200',
        type: 'Tier-1 Finished Good',
        bomQty: 1.0,
        productDemand: 1488,
        derivedConsumption: 1488.0,
        sharePct: 31.0,
        derivedValue: 892800.0,
      },
      {
        product: 'Industrial Loader IL-450',
        type: 'Tier-1 Finished Good',
        bomQty: 1.0,
        productDemand: 1152,
        derivedConsumption: 1152.0,
        sharePct: 24.0,
        derivedValue: 691200.0,
      },
      {
        product: 'Hydraulic Crane HC-80',
        type: 'Tier-1 Finished Good',
        bomQty: 1.0,
        productDemand: 816,
        derivedConsumption: 816.0,
        sharePct: 17.0,
        derivedValue: 489600.0,
      },
      {
        product: 'Mining Dumper MD-120',
        type: 'Specialized Finished Good',
        bomQty: 1.0,
        productDemand: 528,
        derivedConsumption: 528.0,
        sharePct: 11.0,
        derivedValue: 316800.0,
      },
      {
        product: '10 Other Assembly SKUs (Combined)',
        type: 'Secondary Finished Lines (10 SKUs)',
        bomQty: 1.0,
        productDemand: 816,
        derivedConsumption: 816.0,
        sharePct: 17.0,
        derivedValue: 489600.0,
      },
    ],
  },
  'MAT-2041': {
    id: 'MAT-2041',
    name: 'Lithium Cell 21700',
    category: 'Raw Materials',
    plant: 'Plant 2 — Engine Hub',
    uom: 'EA',
    unitCost: 5.14,
    annualDemand: 420000.0,
    annualConsumptionValue: 2158800.0, // 420,000 EA × $5.14 = $2.16M
    onHandQty: 142000.0,
    onHandValue: 729880.0, // 142,000 EA × $5.14 = $729,880.00 (5.32% of $13.71M physical stock)
    abcClass: 'A',
    contextTag: 'Class A + High Volume Velocity + Multi-Pack Dependency',
    demandCV: 0.10,
    leadTimeDays: 30,
    supplier: 'Apex Energy Storage Ltd (Dual Sourced)',
    criticality: 'High (Core electrochemical feed for battery packs; strict cell-matching specs)',
    downstreamProductsCount: 8,
    downstreamSummary: 'Top 3 tracked lines + 5 additional products (8 total)',
    downstreamProducts: [
      {
        product: 'High-Capacity Battery Pack BP-800',
        type: 'Tier-1 Powertrain Pack',
        bomQty: 200.0,
        productDemand: 882,
        derivedConsumption: 176400.0,
        sharePct: 42.0,
        derivedValue: 906696.0,
      },
      {
        product: 'Standard Power Module PM-200',
        type: 'Intermediate Sub-Assembly',
        bomQty: 100.0,
        productDemand: 1176,
        derivedConsumption: 117600.0,
        sharePct: 28.0,
        derivedValue: 604464.0,
      },
      {
        product: 'Grid Storage Module ESS-50',
        type: 'Commercial Energy Storage',
        bomQty: 500.0,
        productDemand: 151.2,
        derivedConsumption: 75600.0,
        sharePct: 18.0,
        derivedValue: 388584.0,
      },
      {
        product: '5 Other Sub-Assembly Packs (Combined)',
        type: 'Auxiliary Battery Assemblies (5 SKUs)',
        bomQty: 50.0,
        productDemand: 1008,
        derivedConsumption: 50400.0,
        sharePct: 12.0,
        derivedValue: 259056.0,
      },
    ],
  },
  'MAT-4120': {
    id: 'MAT-4120',
    name: 'Microcontroller MCU-64',
    category: 'Components',
    plant: 'Plant 3 — Microelectronics',
    uom: 'EA',
    unitCost: 78.65,
    annualDemand: 24000.0,
    annualConsumptionValue: 1887600.0, // 24,000 EA × $78.65 = $1.89M
    onHandQty: 920.0,
    onHandValue: 72358.0, // 920 EA × $78.65 = $72,358.00 (0.53% of $13.71M physical stock)
    abcClass: 'A',
    contextTag: 'Class A + Elevated Volatility + Long Supply Latency',
    demandCV: 0.28,
    leadTimeDays: 60,
    supplier: 'SiliconFoundry International (Allocated Supply)',
    criticality: 'Critical (Main embedded processor; semiconductor wafer lead-time risk)',
    downstreamProductsCount: 19,
    downstreamSummary: 'Top 3 tracked lines + 16 additional products (19 total)',
    downstreamProducts: [
      {
        product: 'Engine Control Unit ECU-400',
        type: 'Core Vehicle Computer',
        bomQty: 1.0,
        productDemand: 9120,
        derivedConsumption: 9120.0,
        sharePct: 38.0,
        derivedValue: 717288.0,
      },
      {
        product: 'Sensor Gateway Hub GW-80',
        type: 'Telematics Module',
        bomQty: 1.0,
        productDemand: 6000,
        derivedConsumption: 6000.0,
        sharePct: 25.0,
        derivedValue: 471900.0,
      },
      {
        product: 'Telematics Control Unit TM-12',
        type: 'IoT Connectivity Box',
        bomQty: 1.0,
        productDemand: 4560,
        derivedConsumption: 4560.0,
        sharePct: 19.0,
        derivedValue: 358644.0,
      },
      {
        product: '16 Other Controller Modules (Combined)',
        type: 'Subsystem Controllers (16 SKUs)',
        bomQty: 1.0,
        productDemand: 4320,
        derivedConsumption: 4320.0,
        sharePct: 18.0,
        derivedValue: 339768.0,
      },
    ],
  },
  'MAT-5501': {
    id: 'MAT-5501',
    name: 'High-Temp Sealant Paste',
    category: 'Consumables',
    plant: 'Plant 1 — Assembly',
    uom: 'KG',
    unitCost: 41.14,
    annualDemand: 6000.0,
    annualConsumptionValue: 246840.0, // 6,000 KG × $41.14 = $246.84K
    onHandQty: 1400.0,
    onHandValue: 57596.0, // 1,400 KG × $41.14 = $57,596.00 (0.42% of $13.71M physical stock)
    abcClass: 'C',
    contextTag: 'Class C + Low Economic Exposure + High Shelf-Life Sensitivity',
    demandCV: 0.15,
    leadTimeDays: 21,
    supplier: 'BondTech Polymer Solutions (Multi-Vendor)',
    criticality: 'Moderate (Standard assembly consumable; multiple equivalent approved formulations)',
    downstreamProductsCount: 6,
    downstreamSummary: '3 primary tracked lines covering 6 assembly lines (6 total)',
    downstreamProducts: [
      {
        product: 'Heavy Equipment Line 1 (HEX/IL)',
        type: 'Joint Flange Sealing',
        bomQty: 1.0,
        productDemand: 2640,
        derivedConsumption: 2640.0,
        sharePct: 44.0,
        derivedValue: 108609.6,
      },
      {
        product: 'Crane & Dumper Line (HC/MD)',
        type: 'Housing Gasket Sealing',
        bomQty: 1.0,
        productDemand: 1920,
        derivedConsumption: 1920.0,
        sharePct: 32.0,
        derivedValue: 78988.8,
      },
      {
        product: 'Auxiliary Component Fabrication',
        type: 'Sub-Assembly Sealing (4 lines)',
        bomQty: 1.0,
        productDemand: 1440,
        derivedConsumption: 1440.0,
        sharePct: 24.0,
        derivedValue: 59241.6,
      },
    ],
  },
};

// Enterprise Baseline Metrics
const ENTERPRISE_TOTAL_CONSUMPTION_VALUE = 43860000.0; // $43.86M total annual raw-material consumption value
const ENTERPRISE_CLASS_A_CONSUMPTION_VALUE = 34280000.0; // $34.28M (78.30%)
const ENTERPRISE_PHYSICAL_ON_HAND_VALUE = 13710000.0; // $13.71M total physical on-hand inventory value

export default function AbcClassification() {
  const navigate = useNavigate();
  const { persona, selectedMaterial } = usePlatform();

  // Retrieve coherent canonical data for selected material
  const matKey = selectedMaterial?.id || 'MAT-1082';
  const mat = MATERIAL_INTELLIGENCE[matKey] || MATERIAL_INTELLIGENCE['MAT-1082'];

  const formatNum = (val, decimals = 2) =>
    val.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  const formatCurrency = (val, decimals = 2) =>
    `$${val.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`;

  // Calculated enterprise proportions for the selected material
  const enterpriseValueShare = (mat.annualConsumptionValue / ENTERPRISE_TOTAL_CONSUMPTION_VALUE) * 100;
  const physicalStockShare = (mat.onHandValue / ENTERPRISE_PHYSICAL_ON_HAND_VALUE) * 100;

  // Total derived demand validation across downstream products
  const totalDerivedDemand = mat.downstreamProducts.reduce((sum, p) => sum + p.derivedConsumption, 0);
  const totalDerivedValue = mat.downstreamProducts.reduce((sum, p) => sum + p.derivedValue, 0);
  const totalSharePct = mat.downstreamProducts.reduce((sum, p) => sum + p.sharePct, 0);

  return (
    <section className="view">
      <ViewHead
        title="ABC Classification"
        subtitle={
          <p>
            Raw materials segmented by <strong>Annual Consumption Value</strong> (Annual Demand × Unit Cost) across the $43.86M enterprise raw-material portfolio, augmented with downstream product dependency and operational risk context.
          </p>
        }
        actions={
          <button type="button" className="btn btn-primary" onClick={() => navigate('/app/eoq')}>
            Open EOQ for {mat.id}
          </button>
        }
      />

      {/* ==================================================================== */}
      {/* 1. ENTERPRISE ABC PORTFOLIO SEGMENTATION LAYER                      */}
      {/* ==================================================================== */}
      <div className="grid-3">
        <div className="card" style={{ borderTop: '3px solid var(--accent)' }}>
          <Badge tone="accent">Class A · High Governance</Badge>
          <div className="kpi__value" style={{ fontSize: 26, margin: '10px 0 2px' }}>$34.28M</div>
          <p className="card__sub">78.30% of annual consumption value · 142 SKUs (10.00% of catalog)</p>
          <p style={{ fontSize: 12.5, marginTop: 10 }}>
            Weekly review cadence · Cycle-counting accuracy target 99.00% · Target service level 98.00–99.00% · High-governance replenishment control.
          </p>
        </div>
        <div className="card">
          <Badge>Class B · Periodic Control</Badge>
          <div className="kpi__value" style={{ fontSize: 26, margin: '10px 0 2px' }}>$6.71M</div>
          <p className="card__sub">15.30% of annual consumption value · 298 SKUs (21.00% of catalog)</p>
          <p style={{ fontSize: 12.5, marginTop: 10 }}>
            Monthly review cadence · Cycle-counting accuracy target 95.00% · Target service level 95.00% · Standard batch replenishment policy.
          </p>
        </div>
        <div className="card">
          <Badge>Class C · Automated / Two-Bin</Badge>
          <div className="kpi__value" style={{ fontSize: 26, margin: '10px 0 2px' }}>$2.87M</div>
          <p className="card__sub">6.40% of annual consumption value · 980 SKUs (69.00% of catalog)</p>
          <p style={{ fontSize: 12.5, marginTop: 10 }}>
            Quarterly or visual two-bin review · Minimal administrative oversight · Target service level 90.00–95.00% · Bulk order processing.
          </p>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 2. CUMULATIVE VALUE CONTRIBUTION PARETO VISUALIZATION               */}
      {/* ==================================================================== */}
      <div className="card">
        <div className="card__head">
          <div>
            <h2 className="card__title">Cumulative Annual Consumption Value Contribution (Pareto)</h2>
            <p className="card__sub">
              Empirical distribution: Class A boundary at 78.30% ($34.28M), Class B at 93.60% ($40.99M), and Class C tail at 100.00% ($43.86M).
            </p>
          </div>
          {persona === 'ds' && (
            <span className="badge badge-neutral">Gini Index 0.81 · Empirical Cutoffs (Log-Value)</span>
          )}
          {persona === 'analyst' && (
            <span className="badge badge-accent">142 Class A SKUs in Priority Queue</span>
          )}
          {persona === 'exec' && (
            <span className="badge badge-neutral">78.30% Value Concentrated in 10.00% of SKUs</span>
          )}
        </div>
        <div className="chart-shell">
          <ParetoChart />
        </div>

        {/* Persona-specific methodological & operational context */}
        {persona === 'ds' && (
          <Insight label="Data Scientist Lens · Methodological & Distribution Intelligence">
            The catalog exhibits a steep Pareto concentration (Gini coefficient <span className="metric">0.81</span>), where 10.00% of materials drive 78.30% of annual consumption value. Supplementary analytical clustering (e.g. k-means on log-consumption) and multi-dimensional risk overlays (demand CV, lead-time latency, downstream product fan-out) enrich the operational profile without distorting the primary economic ranking basis: <span className="metric">Annual Consumption Value = Annual Demand × Unit Cost</span>.
          </Insight>
        )}
        {persona === 'analyst' && (
          <Insight label="Supply Chain Analyst Lens · Control Policy & Review Priority">
            The top 142 Class A materials ($34.28M annual consumption value) require strict weekly inventory surveillance and tightest lot-size governance. Review cadences and cycle-count accuracy targets scale by segment: <span className="metric">Class A (99.00% accuracy, weekly)</span> → <span className="metric">Class B (95.00% accuracy, monthly)</span> → <span className="metric">Class C (90.00% accuracy, quarterly)</span>. High-consumption Class A items transition directly into algorithmic EOQ calibration.
          </Insight>
        )}
        {persona === 'exec' && (
          <Insight label="C-Suite Executive Lens · Economic Concentration & Risk Governance">
            78.30% of annual raw-material consumption value is concentrated in 10.00% of SKUs (142 materials out of 1,420 catalog SKUs totaling <span className="metric">$34.28M</span>). This high economic concentration justifies dedicated executive supplier governance, disciplined review cadences, and prioritized working-capital control to protect enterprise manufacturing throughput across all plants.
          </Insight>
        )}
      </div>

      {/* ==================================================================== */}
      {/* 3. SELECTED RAW MATERIAL CONTEXTUAL INTELLIGENCE LAYER               */}
      {/* ==================================================================== */}
      <div className="card">
        <div className="card__head" style={{ marginBottom: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <h2 className="card__title" style={{ fontSize: 16, margin: 0 }}>
                {mat.id} · {mat.name}
              </h2>
              <Badge tone={mat.abcClass === 'A' ? 'accent' : 'neutral'}>
                {mat.contextTag}
              </Badge>
            </div>
            <p className="card__sub">
              {mat.plant} · Category: <strong>{mat.category}</strong> · Single Raw Material Inventory Object supporting <strong>{mat.downstreamProductsCount} Downstream Products</strong> ({mat.downstreamSummary})
            </p>
          </div>
        </div>

        {/* Selected material primary metrics & context */}
        <div className="grid-4" style={{ marginBottom: 18 }}>
          <KpiTile
            label="Annual Consumption Value"
            value={formatCurrency(mat.annualConsumptionValue)}
            sub={`${formatNum(mat.annualDemand, 0)} ${mat.uom}/yr × ${formatCurrency(mat.unitCost)} · ${formatNum(enterpriseValueShare)}% of enterprise consumption`}
          />
          <KpiTile
            label="Physical On-Hand Inventory"
            value={formatCurrency(mat.onHandValue)}
            sub={`${formatNum(mat.onHandQty, 0)} ${mat.uom} on-hand · ${formatNum(physicalStockShare)}% of enterprise physical stock ($13.71M)`}
          />
          <KpiTile
            label="Downstream Product Dependency"
            value={`${mat.downstreamProductsCount} Products`}
            sub={`${mat.downstreamSummary} · 100.00% demand reconciliation`}
          />
          <KpiTile
            label="Demand Behavior & Latency"
            value={`CV ${formatNum(mat.demandCV)} · ${mat.leadTimeDays}d LT`}
            sub={`${mat.demandCV <= 0.15 ? 'Stable consumption' : 'Elevated volatility'} · ${mat.supplier.split('(')[0].trim()}`}
          />
        </div>

        {/* Downstream Product Demand Breakdown Table */}
        <div style={{ marginBottom: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
            <h3 style={{ fontSize: 13.5, fontWeight: 700, margin: 0 }}>
              Downstream Product Demand Drivers ({mat.downstreamSummary} Consuming {mat.id})
            </h3>
            <span style={{ fontSize: 11.5, color: 'var(--muted)' }}>
              Core Relationship: Product Demand × BOM Usage Rate = Derived Raw-Material Demand
            </span>
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Downstream Product / Assembly</th>
                  <th>Product Category / Line</th>
                  <th className="num text-right">BOM Usage (Qty/{mat.uom})</th>
                  <th className="num text-right">Product Annual Plan</th>
                  <th className="num text-right">Derived RM Demand ({mat.uom}/yr)</th>
                  <th className="num text-right">Share of RM Demand</th>
                  <th className="num text-right">Derived Annual Consumption Value</th>
                </tr>
              </thead>
              <tbody>
                {mat.downstreamProducts.map((p, idx) => (
                  <tr key={idx}>
                    <td style={{ fontWeight: 600 }}>{p.product}</td>
                    <td><span className="badge badge-neutral">{p.type}</span></td>
                    <td className="num text-right">{formatNum(p.bomQty, p.bomQty < 1 ? 2 : 1)} {mat.uom}</td>
                    <td className="num text-right">{formatNum(p.productDemand, p.productDemand % 1 === 0 ? 0 : 1)} units/yr</td>
                    <td className="num text-right" style={{ fontWeight: 600 }}>{formatNum(p.derivedConsumption, 0)} {mat.uom}</td>
                    <td className="num text-right">
                      <span className="badge badge-accent" style={{ fontVariantNumeric: 'tabular-nums' }}>
                        {formatNum(p.sharePct)}%
                      </span>
                    </td>
                    <td className="num text-right font-semibold">{formatCurrency(p.derivedValue)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ background: 'var(--bg)', fontWeight: 700, borderTop: '2px solid var(--line-strong)' }}>
                  <td colSpan={4}>Aggregate Reconciled Demand Across All {mat.downstreamProductsCount} Downstream Products</td>
                  <td className="num text-right" style={{ color: 'var(--accent)' }}>
                    {formatNum(totalDerivedDemand, 0)} {mat.uom}/yr
                  </td>
                  <td className="num text-right">
                    <span className="badge badge-neutral">{formatNum(totalSharePct)}%</span>
                  </td>
                  <td className="num text-right" style={{ color: 'var(--ink)' }}>
                    {formatCurrency(totalDerivedValue)}/yr
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Operational Context & Boundary Note */}
        <div style={{ marginTop: 14, padding: '12px 14px', background: 'var(--bg)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--line)', fontSize: 12.5, color: 'var(--muted)' }}>
          <strong style={{ color: 'var(--text)' }}>Architectural Boundary & Downstream Driver Model:</strong> Downstream finished goods are <em>demand drivers</em> whose production schedules generate aggregate raw-material demand ({formatNum(mat.annualDemand, 0)} {mat.uom}/yr). {mat.id} is the <em>inventory and procurement object</em> classified into ABC Class {mat.abcClass}. This page determines <strong>Control Priority and Governance Cadence</strong>; optimal batch lot sizes are calculated on the <strong>EOQ Calibration</strong> page.
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 4. DRIVER BREAKDOWN & EXPLAINABILITY (WHY DISCLOSURE)                */}
      {/* ==================================================================== */}
      <div className="card">
        <h2 className="card__title">
          Why {mat.id} ({mat.name}) Anchors ABC Class {mat.abcClass} Governance
        </h2>
        <WhyDisclosure
          defaultOpen
          summary="Driver breakdown & Multi-Dimensional Segmentation Rationale"
          drivers={[
            `Annual consumption value of ${formatCurrency(mat.annualConsumptionValue)} (${formatNum(mat.annualDemand, 0)} ${mat.uom}/yr × ${formatCurrency(mat.unitCost)}) places ${mat.id} in Class ${mat.abcClass}, representing ${formatNum(enterpriseValueShare)}% of total enterprise raw-material consumption value ($43.86M).`,
            `Physical on-hand inventory value of ${formatCurrency(mat.onHandValue)} (${formatNum(mat.onHandQty, 0)} ${mat.uom}) represents ${formatNum(physicalStockShare)}% of total enterprise physical inventory ($13.71M).`,
            `Downstream product dependency: ${mat.id} feeds ${mat.downstreamProductsCount} finished products/assemblies (${mat.downstreamSummary}); all derived product requirements reconcile to 100.00% of aggregate material demand, linking raw-material availability directly to multi-product delivery continuity.`,
            `Operational risk dimensions: ${mat.leadTimeDays}-day supplier lead time from ${mat.supplier} combined with demand CV of ${formatNum(mat.demandCV)} and ${mat.criticality.toLowerCase()}.`,
          ]}
          meaning={[
            persona === 'ds'
              ? 'Pareto consumption value establishes the mathematical ABC tier; product fan-out and demand variability represent supplementary risk dimensions that elevate replenishment sensitivity.'
              : persona === 'analyst'
              ? `A stockout on ${mat.id} cascades across ${mat.downstreamProductsCount} downstream production lines simultaneously, magnifying line-stoppage costs beyond the component unit purchase price.`
              : `Material ${mat.id} accounts for ${formatCurrency(mat.annualConsumptionValue)} of annual raw-material consumption value (${mat.abcClass === 'A' ? 'within the $34.28M Class A portfolio' : 'within the enterprise raw-material portfolio'}), directly feeding key downstream product lines where supplier latency and availability require executive governance.`,
            'Downstream product demand streams act as derived demand drivers—they explain aggregate consumption volume while the raw material remains the single inventory/procurement object.',
          ]}
          action={[
            `Queue ${mat.id} into EOQ Calibration to determine total-cost minimizing batch quantities and order frequencies.`,
            mat.abcClass === 'A'
              ? 'Enforce weekly replenishment reviews, 99.00% cycle-count verification, and maintain a 98.00–99.00% target service-level buffer.'
              : 'Maintain standard periodic review policy with automated two-bin replenishment triggers.',
            'Synchronize raw-material procurement lead times with downstream Master Production Schedules (MPS) across dependent finished product lines.',
          ]}
        />
      </div>
    </section>
  );
}


