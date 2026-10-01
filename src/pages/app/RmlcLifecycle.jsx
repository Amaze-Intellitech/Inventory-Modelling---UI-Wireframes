import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, RefreshCcw, AlertTriangle, CheckCircle2, Clock, Layers } from 'lucide-react';
import { ViewHead, Badge, WhyDisclosure, KpiTile } from '../../components/CommonUI';
import PersonaTop from '../../components/PersonaTop';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { usePlatform } from '../../context/PlatformContext';
import RmlcLegs from '../../components/RmlcLegs';
import { RMLC_STAGES, RMLC_STAGES_BY_PLANT, EOQ_INPUTS, FORECAST_INPUTS } from '../../data/mockData';

const TONE_BADGE = { watch: 'watch', ok: 'success', risk: 'risk' };
const TONE_BORDER = { watch: 'var(--warning)', ok: 'var(--success)', risk: 'var(--error)' };

const MATERIAL_LIFECYCLE_PROFILES = {
  'MAT-1082': {
    supplier: 'HydraTech Dynamics GmbH (Sole Source)',
    leadTimeDays: 60,
    contextTag: 'Class A · High Value · Sole Source Supply',
    lifecycleState: 'active',
    lifecycleStateLabel: 'Active Circulation',
    lifecycleTone: 'ok',
    lifecycleBadgeTone: 'success',
    stageIndex: 1,
    triggerRule: 'Within expected turnover band (Inflow ≈ Consumption velocity; DOS 70.8d < 90d policy threshold)',
    triggerEvidence: 'Trailing consumption is stable at 13.15 EA/day (92.31 EA/wk) across 14 finished product lines. On-hand stock of 930 EA provides 70.8 days of supply, safely buffering the 60-day supplier lead time without surplus stagnation.',
    daysStagnant: 0,
    stagnantLot: null,
    agingClassification: '0–30 Days (Active Dynamic Cycle Stock)',
    shelfLifeStatus: 'Non-Perishable / Chemically Stable Mechanical Assembly',
    atRiskValue: 0.0,
    recoverableOpportunity: 0.0,
    exposureType: 'Zero Immediate Liquidation Exposure (Active Operating Capital)',
    downstreamDependency: '14 Downstream Finished Lines (HEX-200, IL-450, HC-80, MD-120)',
    nextStateRisk: 'Low immediate obsolescence risk. Potential progression toward Accumulation if downstream heavy equipment build rates drop >30.00% without corresponding purchase order adjustments.',
    preventionWindow: 'Standard Weekly Review Cadence',
    interventionUrgency: 'Normal Cadence',
    prescribedAction: 'Maintain balanced replenishment cadence aligned with calibrated EOQ lot size (248 EA every ~19 days).',
    earlyInterventionNeeded: false,
    evidenceTable: [
      { dimension: 'Daily Consumption Velocity', observed: '13.15 EA/day (92.31 EA/wk)', benchmark: '10.0–16.0 EA/day operating band', signal: 'Steady-state consumption (CV 0.12)', tag: 'Derived Metric' },
      { dimension: 'Days of Supply (DOS)', observed: '70.8 Days (930 EA on-hand)', benchmark: 'Policy Target: 60–90 Days', signal: 'Safely buffers 60-day supplier lead time', tag: 'Derived Metric' },
      { dimension: 'Inflow vs Consumption Ratio', observed: '1.02× trailing ratio', benchmark: 'Alert trigger: > 1.50× for 3 consecutive weeks', signal: 'Replenishment inflow balanced with production', tag: 'Derived Metric' },
      { dimension: 'Days Since Last Consumption', observed: '2 Days', benchmark: 'Alert trigger: > 90 Days without event', signal: 'Continuous weekly production withdrawals', tag: 'Source Data' },
      { dimension: 'Shelf Life & Degradation', observed: 'Stable / Non-Perishable', benchmark: 'Alert trigger: < 30 Days shelf life', signal: 'Precision hydraulic component with zero chemical shelf life', tag: 'Source Data' },
      { dimension: 'Downstream Production Fan-Out', observed: '14 Active Finished Goods', benchmark: 'Single-line vulnerability if = 1', signal: 'Broad downstream demand across multiple lines', tag: 'Source Data' },
    ],
    supervisorLens: 'Line-stoppage check: MAT-1082 has 70.8 days of cover against its 60-day lead time — comfortably ahead of the 14 downstream lines it feeds. No action needed to protect production.',
    warehouseLens: 'Healthy turnover. On-hand stock (930 EA / $558,000.00) is turning at 5.16 turns/year with zero stagnant lots — keep it in the standard weekly cycle-count rotation; no transfer or liquidation action required.',
    plannerLens: '930 EA (70.8 days) sits inside the 60–90 day policy band tied to the current plan. If downstream heavy-equipment build rates drop more than 30.00% without a matching PO adjustment, this material could drift toward Accumulation.',
    procurementLens: 'Standing EDI orders with HydraTech Dynamics GmbH (248 EA every ~19 days) are matched to consumption — no expedite or PO change needed while coverage holds above the 60-day lead time.',
    financeLens: 'Working Capital Assessment: $558,000.00 in active operating inventory representing 4.07% of enterprise physical stock ($13.71M). Zero capital is trapped in stagnant or at-risk aging bands. Annual carrying-cost estimate is $33,480.00/yr (using a 6.00% annual planning rate) to support $2.88M in annual production throughput.',
    whySummary: 'Why MAT-1082 is categorized in Active Circulation with zero lifecycle risk',
    whyDrivers: [
      'Physical annual demand of 4,800 EA/yr drives a consistent daily velocity of 13.15 EA/day across 14 finished equipment lines.',
      'On-hand stock of 930 EA provides 70.8 days of supply, matching the 60-day supplier lead-time buffer policy.',
      'Zero stagnation events recorded; latest consumption withdrawal occurred within the trailing 48 hours.',
      'Mechanical component design with non-perishable shelf-life attributes and low demand volatility (CV 0.12).',
    ],
    whyMeaning: [
      'Inventory turns at 5.16 turns/yr with healthy cash-conversion velocity and zero observed obsolescence exposure.',
      'No elevated risk of progression toward At Risk or Liquidation under current production schedules.',
      'Working capital of $558,000.00 is actively circulating into finished good sales rather than aging in storage.',
    ],
    whyAction: [
      'Execute EOQ-calibrated replenishment (248 EA lot size every ~19 days) to prevent surplus accumulation.',
      'Monitor weekly downstream schedule changes on HEX-200 and IL-450 assembly lines.',
      'Proceed to Multivariate Forecast to verify 12-week forward consumption trajectory.',
    ],
  },
  'MAT-4120': {
    supplier: 'SiliconFoundry International (Allocated Supply)',
    leadTimeDays: 60,
    contextTag: 'Class A · High Volatility · Allocated Latency',
    lifecycleState: 'active',
    lifecycleStateLabel: 'Active Circulation (Depletion Alert)',
    lifecycleTone: 'ok',
    lifecycleBadgeTone: 'success',
    stageIndex: 1,
    triggerRule: 'Active turnover with high velocity (DOS 14.0d < 60d lead time; Rapid depletion)',
    triggerEvidence: 'High consumption velocity of 65.75 EA/day (461.54 EA/wk) across 19 controller modules. On-hand stock of 920 EA provides only 14.0 days of supply, critically below the 60-day supplier replenishment lead time.',
    daysStagnant: 0,
    stagnantLot: null,
    agingClassification: '0–15 Days (Rapid Depletion / Critical Lean)',
    shelfLifeStatus: 'Non-Perishable (Moisture-Barrier Sealed ICs)',
    atRiskValue: 0.0,
    recoverableOpportunity: 0.0,
    exposureType: 'Zero Aging Exposure · Stockout Exposure Primary',
    downstreamDependency: '19 Downstream Controller SKUs (ECU-400, GW-80, TM-12)',
    nextStateRisk: 'Zero observed obsolescence or stagnation exposure. Operational exposure is an inventory coverage gap: current on-hand stock covers ~14.0 days against a 60-day supplier replenishment lead time, creating a 46-day replenishment coverage gap if consumption continues at the current rate.',
    preventionWindow: '14-Day Stockout Prevention Window',
    interventionUrgency: 'Immediate Expedited PO Required',
    prescribedAction: 'Authorize emergency expedited purchase order for 3,000 EA to buffer manufacturing requirements before 60-day supplier delivery.',
    earlyInterventionNeeded: true,
    evidenceTable: [
      { dimension: 'Daily Consumption Velocity', observed: '65.75 EA/day (461.54 EA/wk)', benchmark: '50.0–80.0 EA/day operating band', signal: 'High velocity consumption (CV 0.28)', tag: 'Derived Metric' },
      { dimension: 'Days of Supply (DOS)', observed: '14.0 Days (920 EA on-hand)', benchmark: 'Reorder Point: 3,945 EA (60d buffer)', signal: 'CRITICAL LEAN: 46 days below lead-time requirement', tag: 'Derived Metric' },
      { dimension: 'Inflow vs Consumption Ratio', observed: '0.45× trailing ratio', benchmark: 'Alert trigger: > 1.50× (Accumulation)', signal: 'Inflow severely lagging consumption velocity', tag: 'Derived Metric' },
      { dimension: 'Days Since Last Consumption', observed: '1 Day', benchmark: 'Alert trigger: > 90 Days without event', signal: 'High-frequency daily assembly withdrawals', tag: 'Source Data' },
      { dimension: 'Shelf Life & Degradation', observed: 'Stable (JEDEC MSL-3 rated)', benchmark: 'Alert trigger: < 30 Days shelf life', signal: 'Standard semiconductor shelf life > 24 months', tag: 'Source Data' },
      { dimension: 'Downstream Production Fan-Out', observed: '19 Active Controller Lines', benchmark: 'Single-line vulnerability if = 1', signal: 'Line-stoppage exposure across 19 finished lines', tag: 'Source Data' },
    ],
    supervisorLens: 'MAT-4120 has only 14.0 days of cover against a 60-day lead time from SiliconFoundry — a 46-day gap. It feeds 19 downstream controller SKUs; this is the most urgent lifecycle flag on the page.',
    warehouseLens: "Stock isn't aging — it's moving too fast to keep up. No physical stagnation to manage here; this is a procurement timing issue, not a warehouse one.",
    plannerLens: "Consumption is running at 65.75 EA/day, turning stock 26.09 turns/yr — this isn't an ageing problem, it's a plan/replenishment mismatch. Confirm the Plant 3 build schedule before committing to the expedite quantity.",
    procurementLens: "Expedite the open PO of 3,000 EA now — the 60-day allocated-supply lead time can't absorb the current 14-day gap. Coordinate delivery directly with the Plant 3 scheduler.",
    financeLens: 'Working Capital & Revenue Protection: On-hand carrying value is $72,358.00 (0.53% of catalog), presenting $0.00 in obsolescence exposure. However, stockout exposure threatens $1.82M in finished controller module deliveries across 19 vehicle lines.',
    whySummary: 'Why MAT-4120 is in Active Circulation but requires urgent stockout intervention',
    whyDrivers: [
      'High consumption velocity of 65.75 EA/day (24,000 EA/yr across 19 controller lines).',
      'On-hand physical stock is only 920 EA ($72,358.00 carrying value), providing 14.0 days of supply.',
      'Supplier lead time is 60 days, creating a 46-day unbuffered gap before regular replenishment arrives.',
      'Zero stagnant inventory; active dynamic stock is rapidly circulating.',
    ],
    whyMeaning: [
      'Material exhibits zero observed obsolescence or liquidation exposure.',
      'Lifecycle risk is inverted: operational starvation risk rather than aging risk.',
      'Without replenishment intervention or schedule adjustment, on-hand coverage is projected to deplete within approximately 14 days at current consumption rates.',
    ],
    whyAction: [
      'Authorize expedited replenishment PO for 3,000 EA ($235,950.00 spend).',
      'Track semiconductor wafer allocation status with SiliconFoundry International.',
      'Transition to Multivariate Forecast to review lead-time uncertainty and confidence bounds.',
    ],
  },
  'MAT-2041': {
    supplier: 'Apex Energy Storage Ltd (Dual Sourced)',
    leadTimeDays: 30,
    contextTag: 'Class A · High Velocity · Dual Sourced Feed',
    lifecycleState: 'atrisk',
    lifecycleStateLabel: 'At Risk (Sub-Batch Stagnation)',
    lifecycleTone: 'risk',
    lifecycleBadgeTone: 'risk',
    stageIndex: 2,
    triggerRule: 'Lot L-2241 has 0 consumption events in 95 days (threshold: 90–180 days)',
    triggerEvidence: 'Plant 2 holds 142,000 EA ($729,880.00) total stock (123.4 days total supply). Specific sub-lot L-2241 (18,500 EA, $95,090.00 holding value) has been stagnant for 95 days due to line reconfiguration, breaching the 90-day stagnation alert threshold.',
    daysStagnant: 95,
    stagnantLot: 'Lot L-2241',
    agingClassification: '90–180 Days (Aging Sub-Lot L-2241)',
    shelfLifeStatus: 'Electrochemical Degradation Risk (Capacity fade if idle > 180d)',
    atRiskValue: 95090.0,
    recoverableOpportunity: 95090.0,
    exposureType: 'Sub-Lot Stagnation Exposure ($95,090.00 of $729,880.00 total on-hand)',
    downstreamDependency: '8 Battery Pack Lines (BP-800, PM-200, ESS-50)',
    nextStateRisk: 'At risk of progressing toward Liquidation stage if Lot L-2241 remains inactive past the 180-day threshold (~85 days remaining in the pre-liquidation window). Material-level demand remains active; the lifecycle risk is concentrated in the stagnant lot.',
    preventionWindow: '85-Day Prevention Window (Pre-Liquidation)',
    interventionUrgency: 'Pre-Liquidation Redirection Required',
    prescribedAction: 'Redirect Lot L-2241 (18,500 EA / $95,090.00) to Plant 1 assembly demand to consume stock before 180-day degradation threshold.',
    earlyInterventionNeeded: true,
    evidenceTable: [
      { dimension: 'Aggregate Consumption Velocity', observed: '1,150.68 EA/day (8,076.92 EA/wk)', benchmark: '1,000–1,300 EA/day across 8 lines', signal: 'Healthy aggregate demand at enterprise level', tag: 'Derived Metric' },
      { dimension: 'Total Days of Supply (DOS)', observed: '123.4 Days (142,000 EA total)', benchmark: 'Policy Target: 45–60 Days', signal: 'Elevated total stock above 60-day benchmark', tag: 'Derived Metric' },
      { dimension: 'Sub-Lot Stagnation Age', observed: '95 Days Stagnant (Lot L-2241)', benchmark: 'Alert trigger: > 90 Days without event', signal: 'BREACH: Sub-lot L-2241 idle for 95 days', tag: 'Source Data' },
      { dimension: 'Stagnant Batch Quantity', observed: '18,500 EA (13.03% of plant stock)', benchmark: 'Zero stagnant sub-batches', signal: 'Isolated sub-lot divergence at Plant 2', tag: 'Source Data' },
      { dimension: 'Shelf Life & Degradation', observed: 'Electrochemical capacity degradation risk', benchmark: 'Cycle testing recommended after 180d idle', signal: 'Cell voltage fade risk if uncycled', tag: 'Source Data' },
      { dimension: 'Downstream Line Availability', observed: 'Plant 1 assembly line has open demand', benchmark: 'Inter-plant transfer feasibility', signal: 'Plant 1 battery module build can absorb 18,500 EA', tag: 'Derived Metric' },
    ],
    supervisorLens: 'Bulk supply for MAT-2041 is healthy — 142,000 EA covers 123.4 days across all 8 battery-pack lines. Only one isolated sub-lot (L-2241, 18,500 EA) is stagnant; it does not threaten production, but should be cleared before it ages further.',
    warehouseLens: 'Operational diagnosis: Sub-batch stagnation. Total stock at Plant 2 is 142,000 EA (123.4 days of supply). While bulk stock moves, Lot L-2241 (18,500 EA / $95,090.00) was isolated following cell-matching specification updates. Action: Initiate inter-plant stock transfer of 18,500 EA to Plant 1 assembly within the 85-day prevention window.',
    plannerLens: 'Lot L-2241 went stagnant after a cell-matching specification change bypassed it during a line reconfiguration — a plan/spec change, not a demand drop. Confirm future spec changes route existing lots back into consumption instead of stranding them.',
    procurementLens: 'No new PO is needed against MAT-2041 while Lot L-2241 (18,500 EA) is pending transfer into Plant 1 assembly — redirecting existing stock covers that demand instead.',
    financeLens: 'Working Capital & Risk Exposure: Total on-hand carrying value is $729,880.00. $95,090.00 (13.03%) is concentrated in an aging sub-lot at risk of potential write-down. Executing the inter-plant transfer creates an opportunity to preserve up to $95,090.00 in working capital by matching stock to active Plant 1 demand before degradation.',
    whySummary: 'Why MAT-2041 is classified At Risk and how $95,090.00 can be safeguarded',
    whyDrivers: [
      'Plant 2 total inventory of 142,000 EA ($729,880.00) represents 123.4 days of supply against annual demand of 420,000 EA/yr.',
      'Sub-lot L-2241 (18,500 EA / $95,090.00) has recorded 0 consumption events in 95 days, triggering the At Risk threshold (90–180 days).',
      'Line reconfiguration at Plant 2 bypassed this specific lot while standard FIFO tracking was interrupted.',
      'Lithium cell chemistry faces capacity degradation if left idle without cycling for > 180 days.',
    ],
    whyMeaning: [
      'Total material is not obsolete, but Lot L-2241 is at risk of progressing toward liquidation within ~85 days.',
      'Failure to intervene exposes $95,090.00 in working capital to potential disposal or discounted salvage.',
      'Plant 1 has active powertrain assembly requirements that can absorb this batch without new procurement.',
    ],
    whyAction: [
      'Authorize inter-plant transfer of Lot L-2241 (18,500 EA) from Plant 2 to Plant 1.',
      'Throttle upcoming replenishment POs at Plant 2 by 18,500 EA to normalize overall days of supply toward 60 days.',
      'Verify cell voltage and internal resistance specs prior to loading into Plant 1 assembly line.',
    ],
  },
  'MAT-5501': {
    supplier: 'BondTech Polymer Solutions (Multi-Vendor)',
    leadTimeDays: 21,
    contextTag: 'Class C · Consumable · Shelf-Life Sensitive',
    lifecycleState: 'liquidation',
    lifecycleStateLabel: 'Liquidation (Shelf-Life Expiry)',
    lifecycleTone: 'risk',
    lifecycleBadgeTone: 'risk',
    stageIndex: 3,
    triggerRule: 'Remaining usable shelf life < 30 days (165 days stagnant; threshold: >150d / <30d shelf life)',
    triggerEvidence: 'Plant 1 holds 1,400 KG ($57,600.00) of polymer sealant that has sat stagnant for 165 days with zero consumption events. Remaining usable chemical shelf life is under 30 days before irreversible polymer curing.',
    daysStagnant: 165,
    stagnantLot: 'Batch SP-5501',
    agingClassification: '150+ Days (Expiring Chemical Lot)',
    shelfLifeStatus: 'Critical: Chemical polymer curing; expires in < 30 days',
    atRiskValue: 57600.0,
    recoverableOpportunity: 57600.0,
    exposureType: 'Immediate Expiration Exposure ($57,600.00 full on-hand value)',
    downstreamDependency: '6 Assembly Lines (Heavy Equipment Flanges, Gasket Sealing)',
    nextStateRisk: 'Substantial valuation exposure ($57,600.00 carrying value) if the material reaches its 30-day expiration boundary without consumption or transfer, alongside potential disposal costs.',
    preventionWindow: 'Immediate 28-Day Recovery Window',
    interventionUrgency: 'Immediate Emergency Transfer Required',
    prescribedAction: 'Execute inter-plant transfer of 1,400 KG to Plant 2 to consume against active sealing lines and potentially preserve up to $57,600.00 in inventory value.',
    earlyInterventionNeeded: true,
    evidenceTable: [
      { dimension: 'Plant 1 Consumption Velocity', observed: '0.00 KG/day (Past 165 Days)', benchmark: '16.44 KG/day annual catalog average', signal: 'CRITICAL STAGNATION: 0 consumption events in 165 days', tag: 'Source Data' },
      { dimension: 'Days of Supply (DOS)', observed: '85.2 Days (Catalog rate) / Infinite (Local rate)', benchmark: 'Policy Target: 30–45 Days', signal: 'Surplus batch at Plant 1 following engineering change', tag: 'Derived Metric' },
      { dimension: 'Stagnation Duration', observed: '165 Days Stagnant', benchmark: 'Alert trigger: > 150 Days for chemical consumables', signal: 'BREACH: Past 150-day liquidation threshold', tag: 'Source Data' },
      { dimension: 'Remaining Usable Shelf Life', observed: '28 Days Remaining', benchmark: 'Alert trigger: < 30 Days before expiration', signal: 'CRITICAL EXPIRY: Curing reaction begins at 180 days', tag: 'Source Data' },
      { dimension: 'Plant 2 Consumption Velocity', observed: '78.00 KG/day (Heavy engine assembly)', benchmark: 'Can absorb 1,400 KG in ~18 days', signal: 'RECOVERY PATH: High-throughput consumption available', tag: 'Derived Metric' },
      { dimension: 'Salvage Recovery Opportunity', observed: 'Up to $57,600.00 potential recovery', benchmark: 'Zero salvage if discarded post-expiry', signal: 'Capital preservation opportunity if transferred within 7 days', tag: 'Derived Metric' },
    ],
    supervisorLens: "This is an isolated Plant 1 batch, not a line-stoppage risk — Plant 1's active sealant supply is unaffected. The only urgency is clearing this specific lot before it expires.",
    warehouseLens: 'Operational diagnosis: Liquidation triage. 1,400 KG ($57,600.00) of sealant paste has been idle at Plant 1 for 165 days following a joint design update. Estimated usable shelf life is approximately 28 days. Action: Issue inter-plant shipping request to transfer 1,400 KG to Plant 2 Engine Hub, which consumes ~78 KG/day and is estimated to absorb the lot in ~18 operating days, subject to transfer lead times and quality verification.',
    plannerLens: 'This batch went idle after a joint design update cut local Plant 1 consumption to zero — a design/plan change, not a demand swing. Flag future design changes so affected lots get redirected before they age out.',
    procurementLens: "Don't place a new sealant order for Plant 1 while this transfer is pending — Plant 2's ~78 KG/day consumption should absorb the 1,400 KG lot within the shelf-life window.",
    financeLens: 'Working Capital Recovery: $57,600.00 total on-hand carrying value sits in liquidation stage with an estimated 28-day expiration horizon. Inter-plant transfer represents the primary mitigation to potentially recover up to $57,600.00 in exposed inventory value and mitigate potential chemical disposal costs, subject to operational feasibility.',
    whySummary: 'Why MAT-5501 is in Liquidation and how $57,600.00 salvage value can be targeted',
    whyDrivers: [
      'Plant 1 inventory of 1,400 KG ($57,600.00 carrying value at $41.14/KG) has sat idle for 165 days.',
      'Engineering revision on Plant 1 equipment reduced local sealant consumption to zero.',
      'Chemical polymer shelf life expires in 28 days, triggering the Liquidation threshold (< 30 days remaining).',
      'Without intervention, the 1,400 KG batch faces potential disposal and write-off costs.',
    ],
    whyMeaning: [
      'Material has crossed the enterprise liquidation boundary at Plant 1 under current policy.',
      'A potential recovery opportunity of up to $57,600.00 exists if stock is consumed before the 28-day expiration.',
      'Plant 2 Engine Hub currently operates sealing lines that consume ~78 KG/day.',
    ],
    whyAction: [
      'Execute inter-plant transfer of 1,400 KG from Plant 1 to Plant 2 within 5 business days.',
      'Plant 2 production team will queue Batch SP-5501 for consumption over the next ~18 operating days.',
      'Update ERP Material Master to block future bulk procurement of MAT-5501 at Plant 1.',
    ],
  },
};

const PORTFOLIO_INTERVENTION_QUEUE = [
  {
    id: 'MAT-5501',
    name: 'High-Temp Sealant Paste',
    plant: 'Plant 1',
    abcClass: 'C',
    state: 'Liquidation',
    stateTone: 'risk',
    rule: 'Remaining shelf life < 30 days (165d stagnant)',
    daysStagnant: 165,
    qtyDisplay: '1,400.00 KG',
    valueDisplay: '$57,600.00',
    exposureType: 'Imminent Expiry',
    action: 'Transfer to Plant 2 for immediate consumption',
  },
  {
    id: 'MAT-2041',
    name: 'Lithium Cell 21700 (Lot L-2241)',
    plant: 'Plant 2',
    abcClass: 'A',
    state: 'At Risk',
    stateTone: 'risk',
    rule: '0 consumption events in 90–180 days (95d stagnant)',
    daysStagnant: 95,
    qtyDisplay: '18,500.00 EA',
    valueDisplay: '$95,090.00',
    exposureType: 'Sub-Lot Stagnation',
    action: 'Redirect batch to Plant 1 assembly demand',
  },
  {
    id: 'MAT-1082',
    name: 'Hydraulic Pump 250BAR',
    plant: 'Plant 1',
    abcClass: 'A',
    state: 'Active Circulation',
    stateTone: 'ok',
    rule: 'Within turnover policy (70.8d supply < 90d benchmark)',
    daysStagnant: 0,
    qtyDisplay: '930.00 EA',
    valueDisplay: '$558,000.00',
    exposureType: 'Active Stock',
    action: 'Maintain calibrated EOQ replenishment cadence',
  },
  {
    id: 'MAT-4120',
    name: 'Microcontroller MCU-64',
    plant: 'Plant 3',
    abcClass: 'A',
    state: 'Active (Lean)',
    stateTone: 'ok',
    rule: 'On-hand < Reorder Point (14.0d supply < 60d lead time)',
    daysStagnant: 0,
    qtyDisplay: '920.00 EA',
    valueDisplay: '$72,358.00',
    exposureType: 'Stockout Starvation',
    action: 'Authorize expedited purchase order for 3,000 EA',
  },
];

export default function RmlcLifecycle() {
  const navigate = useNavigate();
  const { persona, scope, selectedMaterial } = usePlatform();

  const materialId = selectedMaterial?.id || 'MAT-1082';
  const eoqInput = EOQ_INPUTS[materialId] || { demand: 4800.0, currentBatchQty: 600.0 };
  const forecastInput = FORECAST_INPUTS[materialId] || { leadTimeDays: 60, demandCV: 0.12 };

  const demand = eoqInput.demand;
  const unitCost = selectedMaterial?.unitCost ?? 600.0;
  const onHandQty = selectedMaterial?.qty ?? 930.0;
  const onHandValue = selectedMaterial?.value ?? (onHandQty * unitCost);
  const uom = selectedMaterial?.uom || 'EA';
  const abcClass = selectedMaterial?.abcClass || 'A';
  const plant = selectedMaterial?.plant || 'Plant 1';
  const category = selectedMaterial?.category || 'Components';
  const name = selectedMaterial?.name || 'Raw Material';

  const dailyDemand = demand / 365;
  const weeklyDemand = demand / 52;
  const daysOfSupply = dailyDemand > 0 ? onHandQty / dailyDemand : 0;
  const annualTurns = onHandQty > 0 ? demand / onHandQty : 0;
  const annualHoldingCost = onHandValue * 0.06;

  const profile = MATERIAL_LIFECYCLE_PROFILES[materialId] || {
    supplier: 'Standard Catalog Vendor',
    leadTimeDays: forecastInput.leadTimeDays || 30,
    contextTag: `Class ${abcClass} Raw Material`,
    lifecycleState: daysOfSupply > 180 ? 'liquidation' : daysOfSupply > 90 ? 'atrisk' : 'active',
    lifecycleStateLabel: daysOfSupply > 180 ? 'Liquidation' : daysOfSupply > 90 ? 'At Risk' : 'Active Circulation',
    lifecycleTone: daysOfSupply > 90 ? 'risk' : 'ok',
    lifecycleBadgeTone: daysOfSupply > 90 ? 'risk' : 'success',
    stageIndex: daysOfSupply > 180 ? 3 : daysOfSupply > 90 ? 2 : 1,
    triggerRule: daysOfSupply > 90 ? `Days of supply (${daysOfSupply.toFixed(1)}d) exceeds 90-day threshold` : 'Within expected turnover band',
    triggerEvidence: `Daily consumption velocity is ${dailyDemand.toFixed(2)} ${uom}/day. On-hand stock of ${onHandQty.toLocaleString()} ${uom} provides ${daysOfSupply.toFixed(1)} days of supply.`,
    daysStagnant: 0,
    stagnantLot: null,
    agingClassification: 'Active Stock',
    shelfLifeStatus: 'Standard Catalog Specification',
    atRiskValue: daysOfSupply > 90 ? onHandValue : 0.0,
    recoverableOpportunity: daysOfSupply > 90 ? onHandValue : 0.0,
    exposureType: daysOfSupply > 90 ? 'Elevated Inventory Exposure' : 'Active Operating Capital',
    downstreamDependency: 'Standard Assembly Lines',
    nextStateRisk: 'Monitor weekly consumption velocity and maintain lead-time buffer.',
    preventionWindow: 'Standard Operational Review',
    interventionUrgency: 'Normal Cadence',
    prescribedAction: 'Maintain balanced replenishment cadence and verify demand signals.',
    earlyInterventionNeeded: daysOfSupply > 90,
    evidenceTable: [
      { dimension: 'Daily Consumption Velocity', observed: `${dailyDemand.toFixed(2)} ${uom}/day`, benchmark: 'Baseline catalog demand', signal: 'Standard consumption', tag: 'Derived Metric' },
      { dimension: 'Days of Supply (DOS)', observed: `${daysOfSupply.toFixed(1)} Days`, benchmark: 'Policy Target: 60–90 Days', signal: 'Catalog turnover rate', tag: 'Derived Metric' },
      { dimension: 'On-Hand Inventory Value', observed: `$${onHandValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, benchmark: 'Carrying stock', signal: 'Active physical value', tag: 'Source Data' },
    ],
    supervisorLens: `Coverage is ${daysOfSupply.toFixed(1)} days against a ${forecastInput.leadTimeDays || 30}-day lead time — ${daysOfSupply > (forecastInput.leadTimeDays || 30) ? 'production has a buffer' : 'this is tight enough to watch closely'}.`,
    warehouseLens: `On-hand stock of ${onHandQty.toLocaleString()} ${uom} is turning at ${annualTurns.toFixed(2)} turns/yr with no flagged stagnant lots.`,
    plannerLens: `Demand of ${dailyDemand.toFixed(2)} ${uom}/day gives ${daysOfSupply.toFixed(1)} days of cover — check this against the confirmed production plan.`,
    procurementLens: `Replenishment governance: ${daysOfSupply.toFixed(1)} days of supply on-hand with annual turnover rate of ${annualTurns.toFixed(2)} turns/yr.`,
    financeLens: `Working Capital Assessment: $${onHandValue.toLocaleString(undefined, { minimumFractionDigits: 2 })} on-hand inventory value.`,
    whySummary: `Why ${materialId} is evaluated at ${daysOfSupply.toFixed(1)} days of supply`,
    whyDrivers: [
      `Annual demand of ${demand.toLocaleString()} ${uom}/yr with daily velocity of ${dailyDemand.toFixed(2)} ${uom}/day.`,
      `Physical on-hand inventory of ${onHandQty.toLocaleString()} ${uom} ($${onHandValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}).`,
    ],
    whyMeaning: [
      `Inventory provides ${daysOfSupply.toFixed(1)} days of supply relative to supplier lead time.`,
    ],
    whyAction: [
      `Maintain balanced replenishment parameters and review demand in Multivariate Forecast.`,
    ],
  };

  const formatNum = (val, decimals = 2) =>
    val.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  const formatCurrency = (val, decimals = 2) =>
    `$${val.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`;


  const lt = profile.leadTimeDays;
  const atRiskPct = onHandValue > 0 ? (profile.atRiskValue / onHandValue) * 100 : 0;
  const personaTop = {
    supervisor: {
      label: 'Plant Supervisor Lens · Line-Stoppage Relevance',
      headline: profile.supervisorLens,
      kpis: [
        { label: 'Lifecycle state', value: profile.lifecycleStateLabel.split('(')[0].trim(), valueStyle: { color: profile.lifecycleTone === 'ok' ? 'var(--success)' : profile.lifecycleTone === 'watch' ? 'var(--warning)' : 'var(--error)' }, sub: profile.triggerRule },
        { label: 'Cover vs lead time', value: `${formatNum(daysOfSupply, 1)} days`, delta: daysOfSupply < lt ? `${formatNum(lt - daysOfSupply, 1)}d below ${lt}d lead time` : `+${formatNum(daysOfSupply - lt, 1)}d beyond lead time`, deltaTone: daysOfSupply < lt ? 'down' : 'up', sub: 'Days of supply on hand' },
        { label: 'Downstream dependency', value: profile.downstreamDependency, sub: `Supplier: ${profile.supplier}` },
        { label: 'Intervention window', value: profile.preventionWindow.split('(')[0].trim(), delta: profile.interventionUrgency, deltaTone: profile.earlyInterventionNeeded ? 'down' : 'flat', sub: profile.prescribedAction },
      ],
    },
    warehouse: {
      label: 'Warehouse Manager Lens · Physical Stock & Transfer Execution',
      headline: profile.warehouseLens,
      kpis: [
        { label: 'Ageing class', value: profile.agingClassification, sub: profile.shelfLifeStatus },
        { label: 'Stagnant days', value: profile.daysStagnant > 0 ? `${formatNum(profile.daysStagnant, 0)} days` : 'None flagged', deltaTone: profile.daysStagnant > 0 ? 'down' : 'up', delta: profile.stagnantLot ? `Lot ${profile.stagnantLot}` : undefined, sub: 'No movement against consumption' },
        { label: 'On-hand stock', value: `${formatNum(onHandQty, 0)} ${uom}`, sub: `Turning ${formatNum(annualTurns, 2)}×/yr` },
        { label: 'Intervention window', value: profile.preventionWindow.split('(')[0].trim(), delta: profile.interventionUrgency, deltaTone: profile.earlyInterventionNeeded ? 'down' : 'flat', sub: profile.prescribedAction },
      ],
    },
    planner: {
      label: 'Materials Planner Lens · Plan & Replenishment Alignment',
      headline: profile.plannerLens,
      kpis: [
        { label: 'Stage in cycle', value: `${profile.stageIndex + 1} of 4`, sub: profile.lifecycleStateLabel },
        { label: 'Next-state risk', value: profile.earlyInterventionNeeded ? 'Act early' : 'Monitor', deltaTone: profile.earlyInterventionNeeded ? 'down' : 'flat', delta: profile.interventionUrgency, sub: profile.nextStateRisk },
        { label: 'Days of supply', value: `${formatNum(daysOfSupply, 1)} days`, sub: `${formatNum(dailyDemand, 2)} ${uom}/day · ${formatNum(weeklyDemand, 1)} ${uom}/wk` },
        { label: 'Trigger rule', value: profile.lifecycleStateLabel.split('(')[0].trim(), sub: profile.triggerRule },
      ],
    },
    procurement: {
      label: 'Procurement Officer Lens · Sourcing & PO Cadence',
      headline: profile.procurementLens,
      kpis: [
        { label: 'Days beyond 90d buffer', value: daysOfSupply > 90 ? `${formatNum(daysOfSupply - 90, 1)} days` : 'None', deltaTone: daysOfSupply > 90 ? 'down' : 'up', delta: daysOfSupply > 90 ? 'Hold further POs' : 'Replenish as planned', sub: 'Against 60–90d turnover buffer' },
        { label: 'Supplier lead time', value: `${lt} days`, sub: profile.supplier },
        { label: 'Annual turns', value: `${formatNum(annualTurns, 2)}×`, sub: `${formatNum(dailyDemand, 2)} ${uom}/day consumption` },
        { label: 'Prescribed action', value: profile.interventionUrgency, sub: profile.prescribedAction },
      ],
    },
    finance: {
      label: 'Finance Controller Lens · Working Capital Exposure & Obsolescence Risk Governance',
      headline: profile.financeLens,
      kpis: [
        { label: 'On-hand value', value: formatCurrency(onHandValue), sub: `${formatNum(onHandQty, 0)} ${uom} at ${formatCurrency(unitCost)}/${uom}` },
        { label: 'Value at risk', value: formatCurrency(profile.atRiskValue), valueStyle: { color: profile.atRiskValue > 0 ? 'var(--error)' : 'var(--success)' }, delta: profile.atRiskValue > 0 ? `${formatNum(atRiskPct, 1)}% of on-hand` : 'Active Operating Capital', deltaTone: profile.atRiskValue > 0 ? 'down' : 'up', sub: profile.exposureType },
        { label: 'Recoverable opportunity', value: formatCurrency(profile.recoverableOpportunity), valueStyle: { color: 'var(--success)' }, sub: 'If the intervention is taken in time' },
        { label: 'Annual carrying cost', value: formatCurrency(annualHoldingCost), sub: 'At 6.00%/yr planning rate' },
      ],
    },
  };

  // What each lifecycle stage means to the persona reading it (stage order matches RMLC_STAGES).
  const STAGE_MEANING = {
    supervisor: ['Line is covered; no stoppage risk, but stock is building.', 'Normal supply to the line.', 'Not consumed for 90+ days: check the line still uses it (design change, retired product).', 'Feeds no line: confirm no upcoming build needs it before disposal.'],
    warehouse: ['Receipts outpace issues: stock and space are building up.', 'Normal bin turnover.', 'Ageing stock: plan a transfer or return before it goes stale.', 'Past 180 days: schedule disposal, transfer or sale.'],
    planner: ['Inflow is above 1.5× consumption: the plan is over-ordering, so pull back open POs.', 'Plan and consumption are aligned.', 'Consumption has stopped: update demand in the plan.', 'Remove from the replenishment plan.'],
    procurement: ['Defer new POs and renegotiate the delivery schedule.', 'Release POs per plan.', 'Cancel or reschedule open POs; ask the supplier about returns.', 'Return to vendor, claim or sell back.'],
    finance: ['Cash is building up in stock.', 'Capital is turning within policy.', 'Capital at risk of becoming dead stock.', 'Candidate for write-down or provision.'],
  };
  const stageMeaning = STAGE_MEANING[persona] || STAGE_MEANING.supervisor;
  // Stage figures follow the persona's plant scope: one plant for the plant-floor roles, all four for procurement and finance.
  const allPlants = scope.startsWith('All Plants');
  const plantsInScope = allPlants ? RMLC_STAGES_BY_PLANT : RMLC_STAGES_BY_PLANT.filter((pl) => scope.startsWith(pl.plant));
  const scopedStage = (key) => ({
    value: plantsInScope.reduce((a, pl) => a + pl.stages[key].value, 0),
    count: plantsInScope.reduce((a, pl) => a + pl.stages[key].count, 0),
  });
  const materialPlant = selectedMaterial?.plant;
  const materialOutOfScope = !allPlants && materialPlant && !scope.startsWith(materialPlant);
  const stageStat = (st) => {
    const { value, count } = scopedStage(st.key);
    return persona === 'finance' ? `$${value.toFixed(2)}M tied up · ${count} materials` : `${count} materials in this stage`;
  };
  const NEXT_STEP = {
    supervisor: { label: 'Line Impact & Next Step', body: `${profile.nextStateRisk}` },
    warehouse: { label: 'Stock Handling & Next Step', body: `${profile.agingClassification} · ${profile.shelfLifeStatus}. ${profile.prescribedAction}` },
    planner: { label: 'Plan Adjustment & Next Step', body: `${profile.nextStateRisk} ${profile.interventionUrgency}.` },
    procurement: { label: 'PO Action & Next Step', body: profile.prescribedAction },
    finance: { label: 'Capital Exposure & Next Step', body: `${profile.exposureType}: ${profile.atRiskValue > 0 ? formatCurrency(profile.atRiskValue) : '$0.00'} at risk, ${formatCurrency(profile.recoverableOpportunity)} recoverable. ${profile.prescribedAction}` },
  };
  const nextStep = NEXT_STEP[persona] || NEXT_STEP.supervisor;

  return (
    <section className="view max-w-7xl mx-auto">
      <ViewHead
        title="RMLC Analysis · Raw Material Life Cycle"
        subtitle={
          <p className="text-body-c leading-relaxed">
            How long a raw-material purchase takes to become cash, and which leg of the cycle causes the delay. Below it, the stock-lifecycle stages (Accumulation to Liquidation) for <strong>{selectedMaterial.id}</strong>.
          </p>
        }
        actions={
          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate('/app/raw-materials')}
            className="gap-1.5"
          >
            <span>Continue to Forecast for {selectedMaterial.id}</span>
            <ArrowRight size={13} />
          </Button>
        }
      />

      <PersonaTop persona={persona} config={personaTop} />

      <RmlcLegs selectedId={selectedMaterial.id} persona={persona} />

      <div className="section-title">Stock lifecycle stages</div>

      {/* Selected Material Header Card */}
      <div className="card bg-surface border border-border rounded-md p-5 shadow-subtle mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-border">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-base font-bold text-ink m-0">
                {selectedMaterial.id} · {name}
              </h2>
              <Badge tone={abcClass === 'A' ? 'accent' : 'neutral'}>
                {profile.contextTag}
              </Badge>
              <Badge tone={profile.lifecycleBadgeTone}>
                ● {profile.lifecycleStateLabel}
              </Badge>
            </div>
            <p className="text-xs text-body-c m-0">
              {plant} · Category: <strong>{category}</strong> · Supplier: <strong>{profile.supplier}</strong> · Lead Time: <strong>{profile.leadTimeDays} days</strong> · Downstream: <strong>{profile.downstreamDependency}</strong>
            </p>
          </div>
          <Badge tone={abcClass === 'A' ? 'accent' : 'neutral'}>
            Class {abcClass} Material
          </Badge>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          <KpiTile
            label="Annual Demand & Velocity"
            value={`${formatNum(demand, 0)} ${uom}/yr`}
            sub={`${formatNum(dailyDemand, 2)} ${uom}/day (${formatNum(weeklyDemand, 1)} ${uom}/wk) · ${formatCurrency(demand * unitCost)}/yr`}
          />
          <KpiTile
            label="Physical On-Hand Stock"
            value={`${formatNum(onHandQty, 0)} ${uom}`}
            sub={`${formatCurrency(onHandValue)} carrying value (${profile.leadTimeDays}d supplier LT)`}
          />
          <KpiTile
            label="Days of Supply (DOS)"
            value={`${formatNum(daysOfSupply, 1)} Days`}
            sub={`Turning at ${formatNum(annualTurns, 2)} turns/yr · Standard cost ${formatCurrency(unitCost)}/${uom}`}
          />
          <KpiTile
            label="Carrying Cost & Holding Rate"
            value={formatCurrency(annualHoldingCost)}
            sub="Assumed planning rate of 6.00%/yr annual carrying cost"
          />
        </div>
      </div>

      {/* Selected Material Lifecycle KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mb-6">
        <KpiTile
          label="Current Lifecycle State"
          value={profile.lifecycleStateLabel.split('(')[0].trim()}
          valueStyle={{
            color:
              profile.lifecycleTone === 'ok'
                ? 'var(--success)'
                : profile.lifecycleTone === 'watch'
                ? 'var(--warning)'
                : 'var(--error)',
          }}
          delta={`Stage ${profile.stageIndex + 1} of 4 · ${profile.agingClassification}`}
          deltaTone={profile.lifecycleTone === 'ok' ? 'up' : 'down'}
          sub={profile.triggerRule}
        />
        <KpiTile
          label="Days of Supply & Velocity Band"
          value={`${formatNum(daysOfSupply, 1)} Days`}
          delta={
            daysOfSupply < profile.leadTimeDays
              ? `LEAN: ${formatNum(profile.leadTimeDays - daysOfSupply, 1)}d below lead time`
              : daysOfSupply <= 90
              ? 'HEALTHY: Within 60–90d turnover buffer'
              : `SURPLUS: ${formatNum(daysOfSupply - 90, 1)}d above policy buffer`
          }
          deltaTone={daysOfSupply < profile.leadTimeDays ? 'down' : daysOfSupply <= 90 ? 'up' : 'down'}
          sub={`Physical velocity: ${formatNum(dailyDemand, 2)} ${uom}/day (${formatNum(annualTurns, 2)} turns/yr)`}
        />
        <KpiTile
          label="Inventory Value Exposure"
          value={profile.atRiskValue > 0 ? formatCurrency(profile.atRiskValue) : '$0.00'}
          valueStyle={{ color: profile.atRiskValue > 0 ? 'var(--error)' : 'var(--success)' }}
          delta={
            profile.atRiskValue > 0
              ? `${formatNum((profile.atRiskValue / onHandValue) * 100, 1)}% of on-hand at risk`
              : 'Active Operating Capital'
          }
          deltaTone={profile.atRiskValue > 0 ? 'down' : 'up'}
          sub={profile.exposureType}
        />
        <KpiTile
          label="Lifecycle Intervention Window"
          value={profile.preventionWindow.split('(')[0].trim()}
          valueStyle={{ color: profile.earlyInterventionNeeded ? 'var(--primary)' : 'var(--ink)' }}
          delta={profile.interventionUrgency}
          deltaTone={profile.earlyInterventionNeeded ? 'down' : 'flat'}
          sub={profile.prescribedAction}
        />
      </div>

      {/* 4-Stage Visual Progression Grid */}
      <div className="card bg-surface border border-border rounded-md p-5 shadow-subtle mb-6">
        <div className="card__head flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-4">
          <div>
            <h2 className="card__title text-sm font-bold text-ink">Selected Material Lifecycle Position: {selectedMaterial.id}</h2>
            <p className="card__sub text-xs text-body-c">
              Enterprise Lifecycle Model: <strong>Accumulation → Active Circulation → At Risk → Liquidation</strong>
            </p>
            <p className="text-xs text-body-c mt-1 mb-0">
              Stage counts and values for <strong>{scope}</strong>
              {materialOutOfScope && <> · {selectedMaterial.id} is held at {materialPlant}, outside this scope</>}
            </p>
          </div>
          <Badge tone={profile.lifecycleBadgeTone}>
            Current Position: {profile.lifecycleStateLabel}
          </Badge>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mb-4">
          {RMLC_STAGES.map((s, idx) => {
            const isSelectedStage = profile.stageIndex === idx;
            return (
              <div
                key={s.key}
                className={`p-4 rounded-md border transition-all ${
                  isSelectedStage
                    ? 'border-primary bg-info-bg/30 shadow-subtle'
                    : 'border-border bg-bg'
                }`}
              >
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-bold text-body-c uppercase tracking-wider">
                    Stage {idx + 1}
                  </span>
                  {isSelectedStage ? (
                    <Badge tone="accent">● Focus SKU</Badge>
                  ) : (
                    <Badge tone={TONE_BADGE[s.tone]}>{s.label}</Badge>
                  )}
                </div>
                <div className="text-sm font-bold text-ink mb-1">{s.label}</div>
                <p className="text-xs text-body-c m-0 mb-3 leading-relaxed">{stageMeaning[idx]}</p>
                <div className="text-xs text-subtle pt-2 border-t border-border">
                  <div className="font-semibold text-body-c mb-0.5">{stageStat(s)}</div>
                  {allPlants && (
                    <div className="font-mono mb-1">
                      {RMLC_STAGES_BY_PLANT.map((pl) => (
                        <span key={pl.plant} className={`mr-2 ${pl.plant === materialPlant ? 'text-primary font-bold' : ''}`}>
                          P{pl.plant.slice(-1)} {persona === 'finance' ? `$${pl.stages[s.key].value.toFixed(2)}M` : pl.stages[s.key].count}
                        </span>
                      ))}
                    </div>
                  )}
                  {s.rule}
                </div>
              </div>
            );
          })}
        </div>

        {allPlants && (
          <div className="rounded-sm border border-border overflow-hidden mb-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Plant</TableHead>
                  {RMLC_STAGES.map((st) => (
                    <TableHead key={st.key} className="text-right">{st.label}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {RMLC_STAGES_BY_PLANT.map((pl) => (
                  <TableRow key={pl.plant} className={pl.plant === materialPlant ? 'bg-info-bg/30' : undefined}>
                    <TableCell className="font-bold text-ink">
                      {pl.name}{pl.plant === materialPlant && <span className="ml-2 text-primary text-xs">● {selectedMaterial.id}</span>}
                    </TableCell>
                    {RMLC_STAGES.map((st) => (
                      <TableCell key={st.key} className="text-right font-mono text-xs">
                        {persona === 'finance'
                          ? `$${pl.stages[st.key].value.toFixed(2)}M`
                          : `${pl.stages[st.key].count} materials`}
                        {persona === 'finance' ? <span className="text-subtle"> · {pl.stages[st.key].count}</span> : <span className="text-subtle"> · ${pl.stages[st.key].value.toFixed(2)}M</span>}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        <div className={`p-3.5 rounded-md border text-xs leading-relaxed ${
          profile.lifecycleTone === 'ok' ? 'bg-success-bg border-success' : profile.lifecycleTone === 'watch' ? 'bg-warning-bg border-warning' : 'bg-error-bg border-error'
        }`}>
          <div className="font-bold text-ink mb-1">
            Trigger Rule Classification for {selectedMaterial.id}: <span className="font-normal">{profile.triggerRule}</span>
          </div>
          <div className="text-ink mb-1">
            <strong>Observed Evidence:</strong> {profile.triggerEvidence}
          </div>
          <div className="text-ink">
            <strong>{nextStep.label}:</strong> {nextStep.body}
          </div>
        </div>
      </div>

      {/* Lifecycle Evidence Table */}
      <div className="card bg-surface border border-border rounded-md p-5 shadow-subtle mb-6">
        <div className="card__head flex items-center justify-between mb-4">
          <div>
            <h2 className="card__title text-sm font-bold text-ink">Lifecycle Evidence &amp; Drivers ({selectedMaterial.id})</h2>
            <p className="card__sub text-xs text-body-c">
              Empirical evidence distinguishing source data, derived metrics, lifecycle rules, and planning assumptions.
            </p>
          </div>
          <Badge tone="neutral">Evidence Base</Badge>
        </div>

        <div className="rounded-sm border border-border overflow-hidden mb-3">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Analytical Dimension</TableHead>
                <TableHead>Observed Signal / Value</TableHead>
                <TableHead>Policy Benchmark &amp; Threshold</TableHead>
                <TableHead>Lifecycle Signal &amp; Evaluation</TableHead>
                <TableHead className="text-right">Provenance Basis</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {profile.evidenceTable.map((row, idx) => (
                <TableRow key={idx}>
                  <TableCell className="font-bold text-ink">{row.dimension}</TableCell>
                  <TableCell className="font-mono font-medium">{row.observed}</TableCell>
                  <TableCell className="text-body-c text-xs">{row.benchmark}</TableCell>
                  <TableCell className="text-xs">{row.signal}</TableCell>
                  <TableCell className="text-right">
                    <Badge tone={row.tag === 'Source Data' ? 'neutral' : row.tag === 'Derived Metric' ? 'accent' : 'watch'}>
                      {row.tag}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Exposure & Transition Risk Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
        {/* Transition Risk */}
        <div className="card bg-surface border border-border rounded-md p-5 shadow-subtle">
          <Badge tone={profile.lifecycleBadgeTone} className="mb-2">Transition Trajectory</Badge>
          <h2 className="card__title text-sm font-bold text-ink mb-1">What Happens Next? (Transition Risk)</h2>
          <p className="card__sub text-xs text-body-c mb-4">Expected trajectory if operating conditions and replenishment policies persist</p>

          <div className="space-y-3 text-xs">
            <div className="p-3 bg-bg rounded border border-border">
              <div className="font-bold uppercase tracking-wider text-xs text-body-c mb-1">1. Current State &amp; Driver</div>
              <div className="text-ink"><strong>{profile.lifecycleStateLabel}:</strong> {profile.triggerEvidence}</div>
            </div>
            <div className="p-3 bg-bg rounded border border-border">
              <div className="font-bold uppercase tracking-wider text-xs text-body-c mb-1">2. Potential Transition Risk</div>
              <div className="text-ink">{profile.nextStateRisk}</div>
            </div>
            <div className="p-3 bg-bg rounded border border-border">
              <div className="font-bold uppercase tracking-wider text-xs text-body-c mb-1">3. Prescribed Operational Intervention</div>
              <div className="text-ink font-semibold">{profile.prescribedAction}</div>
            </div>
          </div>
        </div>

        {/* Capital Valuation Table */}
        <div className="card bg-surface border border-border rounded-md p-5 shadow-subtle">
          <Badge tone={profile.atRiskValue > 0 ? 'risk' : 'accent'} className="mb-2">Capital Exposure</Badge>
          <h2 className="card__title text-sm font-bold text-ink mb-1">Inventory Exposure &amp; Capital Valuation</h2>
          <p className="card__sub text-xs text-body-c mb-4">Grounded financial valuation of {selectedMaterial.id}'s on-hand inventory position</p>

          <div className="rounded-sm border border-border overflow-hidden mb-3">
            <Table>
              <TableBody>
                <TableRow>
                  <TableCell className="text-xs text-body-c">Total Physical On-Hand Carrying Value</TableCell>
                  <TableCell className="text-right font-mono font-bold text-ink">{formatCurrency(onHandValue)}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="text-xs text-body-c">Active / Circulating Operating Capital</TableCell>
                  <TableCell className="text-right font-mono text-success">{formatCurrency(onHandValue - profile.atRiskValue)}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="text-xs text-body-c">Potential Value at Risk</TableCell>
                  <TableCell className="text-right font-mono font-bold" style={{ color: profile.atRiskValue > 0 ? 'var(--error)' : 'var(--ink)' }}>
                    {formatCurrency(profile.atRiskValue)}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="text-xs text-body-c">Potentially Recoverable Value Opportunity</TableCell>
                  <TableCell className="text-right font-mono text-primary font-semibold">{formatCurrency(profile.recoverableOpportunity)}</TableCell>
                </TableRow>
                <TableRow className="bg-bg font-bold">
                  <TableCell className="text-ink">Annual Carrying-Cost Estimate (6.00%/yr)</TableCell>
                  <TableCell className="text-right font-mono text-body-c">{formatCurrency(annualHoldingCost)}/yr</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      {/* Why Disclosure */}
      <div className="card bg-surface border border-border rounded-md p-5 shadow-subtle mb-6">
        <h2 className="card__title text-sm font-bold text-ink mb-1">
          Why {selectedMaterial.id} ({name}) is in {profile.lifecycleStateLabel}
        </h2>
        <WhyDisclosure
          defaultOpen
          summary={profile.whySummary}
          drivers={profile.whyDrivers}
          meaning={profile.whyMeaning}
          action={profile.whyAction}
        />
      </div>

      {/* Enterprise Intervention Queue Table */}
      <div className="card bg-surface border border-border rounded-md p-5 shadow-subtle mb-6">
        <div className="card__head flex items-center justify-between mb-4">
          <div>
            <h2 className="card__title text-sm font-bold text-ink">Portfolio Lifecycle Intervention Queue</h2>
            <p className="card__sub text-xs text-body-c">Multi-plant materials requiring lifecycle triage, alert triggers, and prescribed actions</p>
          </div>
          <Badge tone="risk">$2.10M Liquidation Exposure</Badge>
        </div>

        <div className="rounded-sm border border-border overflow-hidden mb-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Material</TableHead>
                <TableHead>Plant</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Lifecycle State</TableHead>
                <TableHead>Triggered Alert Rule</TableHead>
                <TableHead className="text-right font-mono">Days Stagnant</TableHead>
                <TableHead className="text-right font-mono">Quantity</TableHead>
                <TableHead className="text-right font-mono">Holding Value</TableHead>
                <TableHead>Prescribed Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {PORTFOLIO_INTERVENTION_QUEUE.map((item) => {
                const isSelected = item.id === selectedMaterial.id;
                return (
                  <TableRow
                    key={item.id}
                    className={isSelected ? 'bg-info-bg/40 border-l-2 border-l-accent' : ''}
                  >
                    <TableCell>
                      <div className="flex items-center gap-1.5 font-bold text-ink">
                        <span>{item.id} · {item.name}</span>
                        {isSelected && <Badge tone="accent" className="text-xs">Selected</Badge>}
                      </div>
                    </TableCell>
                    <TableCell>{item.plant}</TableCell>
                    <TableCell><Badge tone="neutral">Class {item.abcClass}</Badge></TableCell>
                    <TableCell><Badge tone={TONE_BADGE[item.stateTone]}>{item.state}</Badge></TableCell>
                    <TableCell className="text-xs text-body-c">{item.rule}</TableCell>
                    <TableCell className={`text-right font-mono font-bold ${
                      item.daysStagnant > 90 ? 'text-error-tx' : item.daysStagnant > 0 ? 'text-warning-tx' : 'text-success'
                    }`}>
                      {item.daysStagnant}
                    </TableCell>
                    <TableCell className="text-right font-mono">{item.qtyDisplay}</TableCell>
                    <TableCell className="text-right font-mono font-bold text-ink">{item.valueDisplay}</TableCell>
                    <TableCell className={`text-xs ${isSelected ? 'font-semibold text-ink' : 'text-body-c'}`}>{item.action}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>
    </section>
  );
}
