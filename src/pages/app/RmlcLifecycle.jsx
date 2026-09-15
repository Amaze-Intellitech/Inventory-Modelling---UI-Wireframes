import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, RefreshCcw, AlertTriangle, CheckCircle2, Clock, Layers } from 'lucide-react';
import { ViewHead, Badge, WhyDisclosure, KpiTile, Insight } from '../../components/CommonUI';
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
import { RMLC_STAGES, EOQ_INPUTS, FORECAST_INPUTS } from '../../data/mockData';

const TONE_BADGE = { watch: 'watch', ok: 'success', risk: 'risk' };
const TONE_BORDER = { watch: '#B7791F', ok: '#0F9D6C', risk: '#C0362C' };

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
    dsLens: 'Classification: Active Circulation. Deterministic rule-based classification derived from stable physical consumption (13.15 EA/day) and verified inventory coverage (70.8 days of supply), which sits within the configured 60–90 day policy target. Zero stagnation flags detected across trailing consumption records. Probabilistic transition modeling is not applied in this view.',
    analystLens: 'Replenishment status: Healthy turnover. On-hand stock (930 EA / $558,000.00) is turning at 5.16 turns/year. Supplier lead time of 60 days is adequately protected without surplus accumulation. Recommended action: Keep standing EDI replenishment orders synchronized with downstream MPS schedules.',
    execLens: 'Working Capital Assessment: $558,000.00 in active operating inventory representing 4.07% of enterprise physical stock ($13.71M). Zero capital is trapped in stagnant or at-risk aging bands. Annual carrying-cost estimate is $33,480.00/yr (using a 6.00% annual planning rate) to support $2.88M in annual production throughput.',
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
    dsLens: 'Classification: Active Circulation (Lean Depletion). Rule-based classification based on rapid turnover (26.09 turns/yr) and active daily consumption (65.75 EA/day). Current coverage is 14.0 days versus a 60-day supplier lead time, creating a 46-day replenishment exposure gap under the assumption of sustained consumption velocity. Stochastic stockout modeling is not applied.',
    analystLens: 'Replenishment status: Expedited procurement required. Stock is not aging; it is turning rapidly (26.09 turns/year) relative to the 60-day supplier lead time from SiliconFoundry International. Action: Expedite open PO of 3,000 EA immediately and coordinate with Plant 3 production scheduler.',
    execLens: 'Working Capital & Revenue Protection: On-hand carrying value is $72,358.00 (0.53% of catalog), presenting $0.00 in obsolescence exposure. However, stockout exposure threatens $1.82M in finished controller module deliveries across 19 vehicle lines.',
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
    dsLens: 'Classification: At Risk (Lot-level Stagnation). Rule-based classification triggered by inactivity threshold: Lot L-2241 has recorded 0 consumption events in 95 days, crossing the 90-day policy alert rule. Material-level aggregate consumption remains active (1,150.68 EA/day across 8 lines), confirming that risk is isolated to the stagnant sub-lot rather than general catalog obsolescence.',
    analystLens: 'Operational diagnosis: Sub-batch stagnation. Total stock at Plant 2 is 142,000 EA (123.4 days of supply). While bulk stock moves, Lot L-2241 (18,500 EA / $95,090.00) was isolated following cell-matching specification updates. Action: Initiate inter-plant stock transfer of 18,500 EA to Plant 1 assembly within the 85-day prevention window.',
    execLens: 'Working Capital & Risk Exposure: Total on-hand carrying value is $729,880.00. $95,090.00 (13.03%) is concentrated in an aging sub-lot at risk of potential write-down. Executing the inter-plant transfer creates an opportunity to preserve up to $95,090.00 in working capital by matching stock to active Plant 1 demand before degradation.',
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
    dsLens: 'Classification: Liquidation (Shelf-Life Threshold Breach). Classification is rule-based under the policy rule: remaining shelf life < 30 days and stagnation duration = 165 days. Based on deterministic rate comparison, Plant 2 consumption (78.00 KG/day) could absorb the 1,400 KG batch in approximately 18 operating days, within the 28-day remaining shelf-life window. Probabilistic hazard modeling is not applied.',
    analystLens: 'Operational diagnosis: Liquidation triage. 1,400 KG ($57,600.00) of sealant paste has been idle at Plant 1 for 165 days following a joint design update. Estimated usable shelf life is approximately 28 days. Action: Issue inter-plant shipping request to transfer 1,400 KG to Plant 2 Engine Hub, which consumes ~78 KG/day and is estimated to absorb the lot in ~18 operating days, subject to transfer lead times and quality verification.',
    execLens: 'Working Capital Recovery: $57,600.00 total on-hand carrying value sits in liquidation stage with an estimated 28-day expiration horizon. Inter-plant transfer represents the primary mitigation to potentially recover up to $57,600.00 in exposed inventory value and mitigate potential chemical disposal costs, subject to operational feasibility.',
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
  const { persona, selectedMaterial } = usePlatform();
  const shouldReduceMotion = useReducedMotion();

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
    dsLens: `Rule-based lifecycle classification derived from point-process velocity (${dailyDemand.toFixed(2)} ${uom}/day) and Days of Supply (DOS = ${daysOfSupply.toFixed(1)}d).`,
    analystLens: `Replenishment governance: ${daysOfSupply.toFixed(1)} days of supply on-hand with annual turnover rate of ${annualTurns.toFixed(2)} turns/yr.`,
    execLens: `Working Capital Assessment: $${onHandValue.toLocaleString(undefined, { minimumFractionDigits: 2 })} on-hand inventory value.`,
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

  return (
    <section className="view max-w-7xl mx-auto">
      <ViewHead
        title="Raw Material Lifecycle Intelligence"
        subtitle={
          <p className="text-muted leading-relaxed">
            Tracks materials across Accumulation, Active Circulation, At Risk, and Liquidation stages — evaluating transition triggers, value exposure, and prescribed operational interventions for <strong>{selectedMaterial.id}</strong>.
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

      {/* Selected Material Header Card */}
      <div className="card bg-surface border border-line rounded-md p-5 shadow-subtle mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-line">
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
            <p className="text-xs text-muted m-0">
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
                ? 'var(--watch)'
                : 'var(--risk)',
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
          valueStyle={{ color: profile.atRiskValue > 0 ? 'var(--risk)' : 'var(--success)' }}
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
          valueStyle={{ color: profile.earlyInterventionNeeded ? 'var(--accent)' : 'var(--ink)' }}
          delta={profile.interventionUrgency}
          deltaTone={profile.earlyInterventionNeeded ? 'down' : 'flat'}
          sub={profile.prescribedAction}
        />
      </div>

      {/* 4-Stage Visual Progression Grid */}
      <div className="card bg-surface border border-line rounded-md p-5 shadow-subtle mb-6">
        <div className="card__head flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-4">
          <div>
            <h2 className="card__title text-sm font-bold text-ink">Selected Material Lifecycle Position: {selectedMaterial.id}</h2>
            <p className="card__sub text-xs text-muted">
              Enterprise Lifecycle Model: <strong>Accumulation → Active Circulation → At Risk → Liquidation</strong>
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
                    ? 'border-accent bg-accent-dim/30 shadow-subtle'
                    : 'border-line bg-bg'
                }`}
              >
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[11px] font-bold text-muted uppercase tracking-wider">
                    Stage {idx + 1}
                  </span>
                  {isSelectedStage ? (
                    <Badge tone="accent">● Focus SKU</Badge>
                  ) : (
                    <Badge tone={TONE_BADGE[s.tone]}>{s.label}</Badge>
                  )}
                </div>
                <div className="text-sm font-bold text-ink mb-1">{s.label}</div>
                <p className="text-xs text-muted m-0 mb-3 leading-relaxed">{s.desc}</p>
                <div className="text-[11px] text-muted-2 pt-2 border-t border-line">
                  {s.rule}
                </div>
              </div>
            );
          })}
        </div>

        <div className={`p-3.5 rounded-md border text-xs leading-relaxed ${
          profile.lifecycleTone === 'ok' ? 'bg-success-bg border-[#C6EFDE]' : profile.lifecycleTone === 'watch' ? 'bg-watch-bg border-[#F2DEBA]' : 'bg-risk-bg border-[#F8C8C4]'
        }`}>
          <div className="font-bold text-ink mb-1">
            Trigger Rule Classification for {selectedMaterial.id}: <span className="font-normal">{profile.triggerRule}</span>
          </div>
          <div className="text-text mb-1">
            <strong>Observed Evidence:</strong> {profile.triggerEvidence}
          </div>
          <div className="text-text">
            <strong>Next-State Transition &amp; Intervention:</strong> {profile.nextStateRisk} {profile.prescribedAction}
          </div>
        </div>
      </div>

      {/* Lifecycle Evidence Table */}
      <div className="card bg-surface border border-line rounded-md p-5 shadow-subtle mb-6">
        <div className="card__head flex items-center justify-between mb-4">
          <div>
            <h2 className="card__title text-sm font-bold text-ink">Lifecycle Evidence &amp; Drivers ({selectedMaterial.id})</h2>
            <p className="card__sub text-xs text-muted">
              Empirical evidence distinguishing source data, derived metrics, lifecycle rules, and planning assumptions.
            </p>
          </div>
          <Badge tone="neutral">Evidence Base</Badge>
        </div>

        <div className="rounded-sm border border-line overflow-hidden mb-3">
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
                  <TableCell className="text-muted text-xs">{row.benchmark}</TableCell>
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
        <div className="card bg-surface border border-line rounded-md p-5 shadow-subtle">
          <Badge tone={profile.lifecycleBadgeTone} className="mb-2">Transition Trajectory</Badge>
          <h2 className="card__title text-sm font-bold text-ink mb-1">What Happens Next? (Transition Risk)</h2>
          <p className="card__sub text-xs text-muted mb-4">Expected trajectory if operating conditions and replenishment policies persist</p>

          <div className="space-y-3 text-xs">
            <div className="p-3 bg-bg rounded border border-line">
              <div className="font-bold uppercase tracking-wider text-[10.5px] text-muted mb-1">1. Current State &amp; Driver</div>
              <div className="text-ink"><strong>{profile.lifecycleStateLabel}:</strong> {profile.triggerEvidence}</div>
            </div>
            <div className="p-3 bg-bg rounded border border-line">
              <div className="font-bold uppercase tracking-wider text-[10.5px] text-muted mb-1">2. Potential Transition Risk</div>
              <div className="text-ink">{profile.nextStateRisk}</div>
            </div>
            <div className="p-3 bg-bg rounded border border-line">
              <div className="font-bold uppercase tracking-wider text-[10.5px] text-muted mb-1">3. Prescribed Operational Intervention</div>
              <div className="text-ink font-semibold">{profile.prescribedAction}</div>
            </div>
          </div>
        </div>

        {/* Capital Valuation Table */}
        <div className="card bg-surface border border-line rounded-md p-5 shadow-subtle">
          <Badge tone={profile.atRiskValue > 0 ? 'risk' : 'accent'} className="mb-2">Capital Exposure</Badge>
          <h2 className="card__title text-sm font-bold text-ink mb-1">Inventory Exposure &amp; Capital Valuation</h2>
          <p className="card__sub text-xs text-muted mb-4">Grounded financial valuation of {selectedMaterial.id}'s on-hand inventory position</p>

          <div className="rounded-sm border border-line overflow-hidden mb-3">
            <Table>
              <TableBody>
                <TableRow>
                  <TableCell className="text-xs text-muted">Total Physical On-Hand Carrying Value</TableCell>
                  <TableCell className="text-right font-mono font-bold text-ink">{formatCurrency(onHandValue)}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="text-xs text-muted">Active / Circulating Operating Capital</TableCell>
                  <TableCell className="text-right font-mono text-success">{formatCurrency(onHandValue - profile.atRiskValue)}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="text-xs text-muted">Potential Value at Risk</TableCell>
                  <TableCell className="text-right font-mono font-bold" style={{ color: profile.atRiskValue > 0 ? 'var(--risk)' : 'var(--text)' }}>
                    {formatCurrency(profile.atRiskValue)}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="text-xs text-muted">Potentially Recoverable Value Opportunity</TableCell>
                  <TableCell className="text-right font-mono text-accent font-semibold">{formatCurrency(profile.recoverableOpportunity)}</TableCell>
                </TableRow>
                <TableRow className="bg-bg font-bold">
                  <TableCell className="text-ink">Annual Carrying-Cost Estimate (6.00%/yr)</TableCell>
                  <TableCell className="text-right font-mono text-muted">{formatCurrency(annualHoldingCost)}/yr</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      {/* Persona Lens */}
      <motion.div
        key={persona}
        initial={shouldReduceMotion ? false : { opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="mb-6"
      >
        {persona === 'ds' && (
          <Insight label="Data Scientist Lens · Lifecycle Classification Mechanics & Analytical Signals">
            {profile.dsLens}
          </Insight>
        )}
        {persona === 'analyst' && (
          <Insight label="Supply Chain Analyst Lens · Procurement Interventions & Inventory Governance">
            {profile.analystLens}
          </Insight>
        )}
        {persona === 'exec' && (
          <Insight label="C-Suite Executive Lens · Working Capital Exposure & Obsolescence Risk Governance">
            {profile.execLens}
          </Insight>
        )}
      </motion.div>

      {/* Why Disclosure */}
      <div className="card bg-surface border border-line rounded-md p-5 shadow-subtle mb-6">
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
      <div className="card bg-surface border border-line rounded-md p-5 shadow-subtle mb-6">
        <div className="card__head flex items-center justify-between mb-4">
          <div>
            <h2 className="card__title text-sm font-bold text-ink">Portfolio Lifecycle Intervention Queue</h2>
            <p className="card__sub text-xs text-muted">Multi-plant materials requiring lifecycle triage, alert triggers, and prescribed actions</p>
          </div>
          <Badge tone="risk">$2.10M Liquidation Exposure</Badge>
        </div>

        <div className="rounded-sm border border-line overflow-hidden mb-4">
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
                    className={isSelected ? 'bg-accent-dim/40 border-l-2 border-l-accent' : ''}
                  >
                    <TableCell>
                      <div className="flex items-center gap-1.5 font-bold text-ink">
                        <span>{item.id} · {item.name}</span>
                        {isSelected && <Badge tone="accent" className="text-[10px]">Selected</Badge>}
                      </div>
                    </TableCell>
                    <TableCell>{item.plant}</TableCell>
                    <TableCell><Badge tone="neutral">Class {item.abcClass}</Badge></TableCell>
                    <TableCell><Badge tone={TONE_BADGE[item.stateTone]}>{item.state}</Badge></TableCell>
                    <TableCell className="text-xs text-muted">{item.rule}</TableCell>
                    <TableCell className={`text-right font-mono font-bold ${
                      item.daysStagnant > 90 ? 'text-risk' : item.daysStagnant > 0 ? 'text-watch' : 'text-success'
                    }`}>
                      {item.daysStagnant}
                    </TableCell>
                    <TableCell className="text-right font-mono">{item.qtyDisplay}</TableCell>
                    <TableCell className="text-right font-mono font-bold text-ink">{item.valueDisplay}</TableCell>
                    <TableCell className={`text-xs ${isSelected ? 'font-semibold text-ink' : 'text-muted'}`}>{item.action}</TableCell>
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
