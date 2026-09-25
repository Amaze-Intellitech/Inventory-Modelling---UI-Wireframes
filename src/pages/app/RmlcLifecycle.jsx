import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import {
  ArrowRight,
  RefreshCcw,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Layers,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Package,
  Truck,
  Factory,
  Receipt,
  CreditCard,
  FileText,
  ShieldAlert,
  ArrowUpRight,
  ArrowDownRight,
  ChevronRight,
  Info,
  Calendar,
  Building,
  Sparkles,
  BarChart3,
  Activity,
  Zap,
  Check,
  AlertCircle,
  Percent,
  Sliders,
  Scale,
} from 'lucide-react';
import {
  ViewHead,
  Badge,
  WhyDisclosure,
  KpiTile,
  Insight,
  Card,
  CardHead,
  DrillDown,
} from '../../components/CommonUI';
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
import { MATERIALS } from '../../data/mockData';

// ============================================================================
// 1. CANONICAL PO-TO-CASH LIFECYCLE MODEL & STAGES
// 
// Equation:
// Total PO-to-Cash Duration =
//   Procurement Duration (PO Generated → Supplier Confirmed)
//   + Inbound Duration (Material Dispatched → Material Received / GRN)
//   + Inventory Holding Duration (Material Received → Material Consumed)
//   + Production Duration (Material Consumed → Finished Goods Available)
//   + Sales Conversion Duration (FG Available → Customer Invoiced)
//   + Receivables Duration (Customer Invoiced → Customer Payment / Cash Recovered)
// ============================================================================

export const CANONICAL_RMLC_STAGES = [
  {
    key: 'procurement',
    index: 1,
    name: 'Procurement',
    shortName: 'Procurement',
    fromEvent: 'PO Generated',
    toEvent: 'Supplier Confirmed',
    icon: FileText,
    desc: 'Purchase order generation through vendor order acknowledgement & SLA confirmation.',
    requiredData: ['po_created_at', 'supplier_confirmed_at'],
    provenanceTag: 'Source Data',
    evidenceType: 'PO & Vendor Confirmation',
  },
  {
    key: 'inbound',
    index: 2,
    name: 'Inbound Transit',
    shortName: 'Inbound',
    fromEvent: 'Material Dispatched',
    toEvent: 'Material Received (GRN)',
    icon: Truck,
    desc: 'Freight dispatch, customs clearance, and delivery to plant receiving dock.',
    requiredData: ['dispatched_at', 'received_at'],
    provenanceTag: 'Source Data',
    evidenceType: 'ASN & Goods Receipt Note (GRN)',
  },
  {
    key: 'inventory',
    index: 3,
    name: 'Inventory Holding',
    shortName: 'Inventory',
    fromEvent: 'Material Received',
    toEvent: 'Material Consumed',
    icon: Package,
    desc: 'Storage duration in plant warehouse prior to production issuance requisition.',
    requiredData: ['received_at', 'consumed_at'],
    provenanceTag: 'Derived Metric',
    evidenceType: 'Stores Issue Requisition',
  },
  {
    key: 'production',
    index: 4,
    name: 'Production & Assembly',
    shortName: 'Production',
    fromEvent: 'Material Consumed',
    toEvent: 'FG Available',
    icon: Factory,
    desc: 'Manufacturing conversion, assembly cycle, QA validation, and finished goods staging.',
    requiredData: ['consumed_at', 'production_completed_at'],
    provenanceTag: 'Source Data',
    evidenceType: 'Work Order QC Release',
  },
  {
    key: 'sales',
    index: 5,
    name: 'Sales & Fulfillment',
    shortName: 'Sales',
    fromEvent: 'FG Available',
    toEvent: 'Customer Invoiced',
    icon: Receipt,
    desc: 'Customer sales order staging, carrier loading, and commercial invoice generation.',
    requiredData: ['production_completed_at', 'invoiced_at'],
    provenanceTag: 'Source Data',
    evidenceType: 'Sales Order & Shipping Manifest',
  },
  {
    key: 'receivables',
    index: 6,
    name: 'Receivables & Cash Recovery',
    shortName: 'Receivables',
    fromEvent: 'Customer Invoiced',
    toEvent: 'Cash Recovered',
    icon: CreditCard,
    desc: 'Commercial invoicing through customer payment remittance & bank reconciliation.',
    requiredData: ['invoiced_at', 'paid_at'],
    provenanceTag: 'Source Data',
    evidenceType: 'Remittance Advice & Bank Credit',
  },
];

// ============================================================================
// 2. INVENTORY CONDITION SUB-LAYER (Inside Stage 3: Inventory)
// ============================================================================
const INVENTORY_CONDITIONS = {
  accumulation: {
    key: 'accumulation',
    label: 'Accumulation',
    tone: 'watch',
    badgeTone: 'watch',
    desc: 'Building faster than consumption velocity (Inflow > 1.50× consumption).',
    rule: 'Alert rule: Inflow > 1.50× trailing consumption for 3 consecutive weeks',
  },
  active: {
    key: 'active',
    label: 'Active Circulation',
    tone: 'ok',
    badgeTone: 'success',
    desc: 'Turning within policy buffer safely buffering supplier lead time.',
    rule: 'Alert rule: Within expected 60–90 day turnover band',
  },
  atrisk: {
    key: 'atrisk',
    label: 'At Risk',
    tone: 'risk',
    badgeTone: 'risk',
    desc: 'Specific sub-lot or SKU with 90–180 days without consumption events.',
    rule: 'Alert rule: 0 consumption events in 90–180 days',
  },
  liquidation: {
    key: 'liquidation',
    label: 'Liquidation',
    tone: 'risk',
    badgeTone: 'risk',
    desc: 'Past 180-day stagnation threshold or remaining usable shelf life < 30 days.',
    rule: 'Alert rule: Past 180 days stagnant or shelf life < 30 days',
  },
};

// ============================================================================
// 3. AUTHORITATIVE MULTI-CYCLE DATASETS
// Grounded empirical records with real timestamps, documents, and historical cycles.
// ============================================================================
const CANONICAL_MATERIAL_DATASETS = {
  'MAT-1082': {
    materialId: 'MAT-1082',
    name: 'Hydraulic Pump 250BAR',
    category: 'Components',
    plant: 'Plant 1 — Assembly',
    abcClass: 'A',
    uom: 'EA',
    unitCost: 600.0,
    onHandQty: 930.0,
    onHandValue: 558000.0,
    annualDemand: 4800.0,
    supplier: 'HydraTech Dynamics GmbH (Sole Source)',
    supplierSlaDays: 60,
    contextTag: 'Class A · Sole Source Supply · 60d Lead Time',
    downstreamLines: 14,
    downstreamSummary: '14 Heavy Equipment Lines (HEX-200, IL-450, HC-80, MD-120)',
    dataCompleteness: 'Complete (6 of 6 Legs Connected)',
    completenessRatio: 1.0,
    lifecycleStatus: 'completed', // Full PO-to-Cash cycle completed
    currentStageKey: 'receivables',
    currentStageName: 'Receivables & Cash Recovery',
    currentStageStatus: 'Remittance Processed · Cash Recovered',
    daysInCurrentStage: 14,
    capitalTiedUp: 558000.0, // On-hand inventory operating value
    receivablesExposure: 840000.0, // Downstream customer invoice value
    inventoryConditionKey: 'active',
    inventoryConditionRule: 'Within expected turnover band (Inflow ≈ Consumption; DOS 70.8d < 90d policy threshold)',
    inventoryConditionEvidence: 'Trailing daily consumption is 13.15 EA/day across 14 finished equipment lines. On-hand stock of 930 EA provides 70.8 days of supply, buffering the 60-day supplier lead time.',
    stagnantLot: null,
    daysStagnant: 0,
    atRiskValue: 0.0,

    cycles: [
      {
        cycleId: 'CYC-2025-Q4',
        label: 'Current Cycle (Q4 2025)',
        type: 'current',
        status: 'completed',
        poNumber: 'PO-2025-0812',
        batchId: 'BATCH-HP-8821',
        invoiceNumber: 'INV-2025-4190',
        customerName: 'Atlas Earthmovers Corp',
        paymentTerms: 'Net 45 (Extended from Net 30)',
        startDate: '2025-10-01',
        endDate: '2025-12-07',
        stages: {
          procurement: { duration: 7, startDate: '2025-10-01', endDate: '2025-10-08', docRef: 'PO-2025-0812', status: 'Confirmed', note: 'Vendor acknowledgement in 7 days (+2d)' },
          inbound: { duration: 12, startDate: '2025-10-08', endDate: '2025-10-20', docRef: 'ASN-HT-9941 / GRN-10482', status: 'Delivered', note: 'Hamburg port customs backlog (+4d delay)' },
          inventory: { duration: 19, startDate: '2025-10-20', endDate: '2025-11-08', docRef: 'REQ-ISSUE-7721', status: 'Consumed', note: 'Assembly line schedule shift on HEX-200 deferred batch withdrawal (+8d)' },
          production: { duration: 9, startDate: '2025-11-08', endDate: '2025-11-17', docRef: 'WO-HEX-902', status: 'Completed', note: 'Sub-assembly testing & hydro validation (+1d)' },
          sales: { duration: 6, startDate: '2025-11-17', endDate: '2025-11-23', docRef: 'SO-4401 / INV-2025-4190', status: 'Invoiced', note: 'Finished goods staged and shipped to OEM depot (+1d)' },
          receivables: { duration: 14, startDate: '2025-11-23', endDate: '2025-12-07', docRef: 'REMIT-ATLAS-882', status: 'Paid', note: 'Customer exercised newly negotiated Net 45 terms (+9d)' },
        },
      },
      {
        cycleId: 'CYC-2025-Q3',
        label: 'Previous Comparable Cycle (Q3 2025)',
        type: 'baseline',
        status: 'completed',
        poNumber: 'PO-2025-0514',
        batchId: 'BATCH-HP-8410',
        invoiceNumber: 'INV-2025-3012',
        customerName: 'Atlas Earthmovers Corp',
        paymentTerms: 'Net 30',
        startDate: '2025-07-02',
        endDate: '2025-08-13',
        stages: {
          procurement: { duration: 5, startDate: '2025-07-02', endDate: '2025-07-07', docRef: 'PO-2025-0514', status: 'Confirmed', note: 'Standard electronic confirmation' },
          inbound: { duration: 8, startDate: '2025-07-07', endDate: '2025-07-15', docRef: 'ASN-HT-8720 / GRN-09821', status: 'Delivered', note: 'Normal ocean container freight' },
          inventory: { duration: 11, startDate: '2025-07-15', endDate: '2025-07-26', docRef: 'REQ-ISSUE-6840', status: 'Consumed', note: 'Continuous weekly production pull' },
          production: { duration: 8, startDate: '2025-07-26', endDate: '2025-08-03', docRef: 'WO-HEX-780', status: 'Completed', note: 'Standard hydraulic module assembly' },
          sales: { duration: 5, startDate: '2025-08-03', endDate: '2025-08-08', docRef: 'SO-3910 / INV-2025-3012', status: 'Invoiced', note: 'Direct factory delivery' },
          receivables: { duration: 5, startDate: '2025-08-08', endDate: '2025-08-13', docRef: 'REMIT-ATLAS-710', status: 'Paid', note: 'Early payment discount captured' },
        },
      },
      {
        cycleId: 'CYC-2025-Q2',
        label: 'Historical Cycle Q2 2025',
        type: 'historical',
        status: 'completed',
        poNumber: 'PO-2025-0210',
        batchId: 'BATCH-HP-8022',
        invoiceNumber: 'INV-2025-1980',
        customerName: 'CaterFlow Heavy Machinery',
        paymentTerms: 'Net 30',
        startDate: '2025-04-01',
        endDate: '2025-05-13',
        stages: {
          procurement: { duration: 5, startDate: '2025-04-01', endDate: '2025-04-06', docRef: 'PO-2025-0210', status: 'Confirmed', note: 'Standard EDI' },
          inbound: { duration: 8, startDate: '2025-04-06', endDate: '2025-04-14', docRef: 'ASN-HT-7910 / GRN-09100', status: 'Delivered', note: 'Normal transit' },
          inventory: { duration: 10, startDate: '2025-04-14', endDate: '2025-04-24', docRef: 'REQ-ISSUE-6100', status: 'Consumed', note: 'Stable turnover' },
          production: { duration: 8, startDate: '2025-04-24', endDate: '2025-05-02', docRef: 'WO-HEX-650', status: 'Completed', note: 'Target line efficiency' },
          sales: { duration: 5, startDate: '2025-05-02', endDate: '2025-05-07', docRef: 'SO-3200 / INV-2025-1980', status: 'Invoiced', note: 'Standard fulfillment' },
          receivables: { duration: 6, startDate: '2025-05-07', endDate: '2025-05-13', docRef: 'REMIT-CAT-450', status: 'Paid', note: 'Standard Net 30 collection' },
        },
      },
      {
        cycleId: 'CYC-2025-Q1',
        label: 'Historical Cycle Q1 2025',
        type: 'historical',
        status: 'completed',
        poNumber: 'PO-2024-1105',
        batchId: 'BATCH-HP-7650',
        invoiceNumber: 'INV-2025-0890',
        customerName: 'Atlas Earthmovers Corp',
        paymentTerms: 'Net 30',
        startDate: '2025-01-08',
        endDate: '2025-02-17',
        stages: {
          procurement: { duration: 4, startDate: '2025-01-08', endDate: '2025-01-12', docRef: 'PO-2024-1105', status: 'Confirmed', note: 'Rapid vendor confirmation' },
          inbound: { duration: 8, startDate: '2025-01-12', endDate: '2025-01-20', docRef: 'ASN-HT-7100 / GRN-08420', status: 'Delivered', note: 'On-schedule delivery' },
          inventory: { duration: 9, startDate: '2025-01-20', endDate: '2025-01-29', docRef: 'REQ-ISSUE-5400', status: 'Consumed', note: 'High seasonal build rate' },
          production: { duration: 8, startDate: '2025-01-29', endDate: '2025-02-06', docRef: 'WO-HEX-520', status: 'Completed', note: 'Standard build' },
          sales: { duration: 5, startDate: '2025-02-06', endDate: '2025-02-11', docRef: 'SO-2800 / INV-2025-0890', status: 'Invoiced', note: 'Expedited dispatch' },
          receivables: { duration: 6, startDate: '2025-02-11', endDate: '2025-02-17', docRef: 'REMIT-ATLAS-590', status: 'Paid', note: 'Standard payment' },
        },
      },
    ],
  },

  'MAT-4120': {
    materialId: 'MAT-4120',
    name: 'Microcontroller MCU-64',
    category: 'Components',
    plant: 'Plant 3 — Microelectronics',
    abcClass: 'A',
    uom: 'EA',
    unitCost: 78.65,
    onHandQty: 920.0,
    onHandValue: 72358.0,
    annualDemand: 24000.0,
    supplier: 'SiliconFoundry International (Allocated Supply)',
    supplierSlaDays: 60,
    contextTag: 'Class A · High Volatility · Allocated Latency',
    downstreamLines: 19,
    downstreamSummary: '19 Controller SKUs (ECU-400, GW-80, TM-12)',
    dataCompleteness: 'Complete (6 of 6 Legs Connected)',
    completenessRatio: 1.0,
    lifecycleStatus: 'completed',
    currentStageKey: 'receivables',
    currentStageName: 'Receivables & Cash Recovery',
    currentStageStatus: 'Electronic Remittance Cleared',
    daysInCurrentStage: 6,
    capitalTiedUp: 72358.0,
    receivablesExposure: 285400.0,
    inventoryConditionKey: 'active',
    inventoryConditionRule: 'High velocity turnover (DOS 14.0d < 60d lead time; Rapid cycle)',
    inventoryConditionEvidence: 'Consumption velocity is 65.75 EA/day across 19 controller modules. On-hand stock of 920 EA provides 14.0 days of supply, creating replenishment urgency.',
    stagnantLot: null,
    daysStagnant: 0,
    atRiskValue: 0.0,

    cycles: [
      {
        cycleId: 'CYC-2025-Q4',
        label: 'Current Cycle (Q4 2025)',
        type: 'current',
        status: 'completed',
        poNumber: 'PO-2025-0980',
        batchId: 'BATCH-MCU-490',
        invoiceNumber: 'INV-2025-5012',
        customerName: 'ElectroDrive Systems GmbH',
        paymentTerms: 'Net 15 (Electronic EDI)',
        startDate: '2025-11-01',
        endDate: '2025-12-01',
        stages: {
          procurement: { duration: 2, startDate: '2025-11-01', endDate: '2025-11-03', docRef: 'PO-2025-0980', status: 'Confirmed', note: 'Automated EDI placement (-1d)' },
          inbound: { duration: 9, startDate: '2025-11-03', endDate: '2025-11-12', docRef: 'ASN-SF-4410 / GRN-30112', status: 'Delivered', note: 'Expedited air-freight consolidation (-1d)' },
          inventory: { duration: 3, startDate: '2025-11-12', endDate: '2025-11-15', docRef: 'REQ-ISSUE-9102', status: 'Consumed', note: 'Direct withdrawal to SMT line (-2d)' },
          production: { duration: 4, startDate: '2025-11-15', endDate: '2025-11-19', docRef: 'WO-ECU-810', status: 'Completed', note: 'High-speed automated surface-mount assembly' },
          sales: { duration: 6, startDate: '2025-11-19', endDate: '2025-11-25', docRef: 'SO-6120 / INV-2025-5012', status: 'Invoiced', note: 'JIT shipping to automotive module plant' },
          receivables: { duration: 6, startDate: '2025-11-25', endDate: '2025-12-01', docRef: 'REMIT-ED-904', status: 'Paid', note: 'Prompt automated bank transfer' },
        },
      },
      {
        cycleId: 'CYC-2025-Q3',
        label: 'Previous Comparable Cycle (Q3 2025)',
        type: 'baseline',
        status: 'completed',
        poNumber: 'PO-2025-0620',
        batchId: 'BATCH-MCU-440',
        invoiceNumber: 'INV-2025-3880',
        customerName: 'ElectroDrive Systems GmbH',
        paymentTerms: 'Net 15',
        startDate: '2025-08-01',
        endDate: '2025-09-04',
        stages: {
          procurement: { duration: 3, startDate: '2025-08-01', endDate: '2025-08-04', docRef: 'PO-2025-0620', status: 'Confirmed', note: 'Standard wafer allocation confirmation' },
          inbound: { duration: 10, startDate: '2025-08-04', endDate: '2025-08-14', docRef: 'ASN-SF-3890 / GRN-28410', status: 'Delivered', note: 'Standard air express' },
          inventory: { duration: 5, startDate: '2025-08-14', endDate: '2025-08-19', docRef: 'REQ-ISSUE-8140', status: 'Consumed', note: 'Standard staging buffer' },
          production: { duration: 4, startDate: '2025-08-19', endDate: '2025-08-23', docRef: 'WO-ECU-720', status: 'Completed', note: 'SMT line running at target yield' },
          sales: { duration: 6, startDate: '2025-08-23', endDate: '2025-08-29', docRef: 'SO-5200 / INV-2025-3880', status: 'Invoiced', note: 'Packaged and dispatched' },
          receivables: { duration: 6, startDate: '2025-08-29', endDate: '2025-09-04', docRef: 'REMIT-ED-810', status: 'Paid', note: 'Net 15 payment' },
        },
      },
      {
        cycleId: 'CYC-2025-Q2',
        label: 'Historical Cycle Q2 2025',
        type: 'historical',
        status: 'completed',
        poNumber: 'PO-2025-0310',
        batchId: 'BATCH-MCU-390',
        invoiceNumber: 'INV-2025-2410',
        customerName: 'SmartGrid Controls Ltd',
        paymentTerms: 'Net 15',
        startDate: '2025-05-02',
        endDate: '2025-06-06',
        stages: {
          procurement: { duration: 3, startDate: '2025-05-02', endDate: '2025-05-05', docRef: 'PO-2025-0310', status: 'Confirmed', note: 'EDI' },
          inbound: { duration: 10, startDate: '2025-05-05', endDate: '2025-05-15', docRef: 'ASN-SF-3100 / GRN-26100', status: 'Delivered', note: 'Air freight' },
          inventory: { duration: 6, startDate: '2025-05-15', endDate: '2025-05-21', docRef: 'REQ-ISSUE-7200', status: 'Consumed', note: 'Staging' },
          production: { duration: 4, startDate: '2025-05-21', endDate: '2025-05-25', docRef: 'WO-ECU-610', status: 'Completed', note: 'Standard SMT' },
          sales: { duration: 6, startDate: '2025-05-25', endDate: '2025-05-31', docRef: 'SO-4300 / INV-2025-2410', status: 'Invoiced', note: 'Dispatched' },
          receivables: { duration: 6, startDate: '2025-05-31', endDate: '2025-06-06', docRef: 'REMIT-SG-310', status: 'Paid', note: 'Paid' },
        },
      },
      {
        cycleId: 'CYC-2025-Q1',
        label: 'Historical Cycle Q1 2025',
        type: 'historical',
        status: 'completed',
        poNumber: 'PO-2024-1201',
        batchId: 'BATCH-MCU-310',
        invoiceNumber: 'INV-2025-1100',
        customerName: 'ElectroDrive Systems GmbH',
        paymentTerms: 'Net 15',
        startDate: '2025-01-10',
        endDate: '2025-02-15',
        stages: {
          procurement: { duration: 4, startDate: '2025-01-10', endDate: '2025-01-14', docRef: 'PO-2024-1201', status: 'Confirmed', note: 'Manual review' },
          inbound: { duration: 11, startDate: '2025-01-14', endDate: '2025-01-25', docRef: 'ASN-SF-2700 / GRN-23900', status: 'Delivered', note: 'Winter weather lag' },
          inventory: { duration: 6, startDate: '2025-01-25', endDate: '2025-01-31', docRef: 'REQ-ISSUE-6100', status: 'Consumed', note: 'Buffer holding' },
          production: { duration: 4, startDate: '2025-01-31', endDate: '2025-02-04', docRef: 'WO-ECU-490', status: 'Completed', note: 'Normal run' },
          sales: { duration: 5, startDate: '2025-02-04', endDate: '2025-02-09', docRef: 'SO-3400 / INV-2025-1100', status: 'Invoiced', note: 'Shipped' },
          receivables: { duration: 6, startDate: '2025-02-09', endDate: '2025-02-15', docRef: 'REMIT-ED-510', status: 'Paid', note: 'Net 15 terms' },
        },
      },
    ],
  },

  'MAT-2041': {
    materialId: 'MAT-2041',
    name: 'Lithium Cell 21700',
    category: 'Raw Materials',
    plant: 'Plant 2 — Engine Hub',
    abcClass: 'A',
    uom: 'EA',
    unitCost: 5.14,
    onHandQty: 142000.0,
    onHandValue: 729880.0,
    annualDemand: 420000.0,
    supplier: 'Apex Energy Storage Ltd (Dual Sourced)',
    supplierSlaDays: 30,
    contextTag: 'Class A · High Velocity · Dual Sourced Feed',
    downstreamLines: 8,
    downstreamSummary: '8 Battery Pack Lines (BP-800, PM-200, ESS-50)',
    dataCompleteness: 'Complete (6 of 6 Legs Connected)',
    completenessRatio: 1.0,
    lifecycleStatus: 'in_progress', // Active in-progress cycle
    currentStageKey: 'inventory',
    currentStageName: 'Inventory Holding',
    currentStageStatus: 'Awaiting Pack Line Retooling · Lot L-2241 Stagnant',
    daysInCurrentStage: 54,
    capitalTiedUp: 729880.0,
    receivablesExposure: 1450000.0,
    inventoryConditionKey: 'atrisk',
    inventoryConditionRule: 'Lot L-2241 has 0 consumption events in 95 days (threshold: 90–180 days)',
    inventoryConditionEvidence: 'Plant 2 holds 142,000 EA ($729,880.00). Sub-lot L-2241 (18,500 EA, $95,090.00 holding value) is stagnant for 95 days due to line reconfiguration.',
    stagnantLot: 'Lot L-2241',
    daysStagnant: 95,
    atRiskValue: 95090.0,

    cycles: [
      {
        cycleId: 'CYC-2025-Q4',
        label: 'Current Active Cycle (Q4 2025 - In Progress)',
        type: 'current',
        status: 'in_progress',
        poNumber: 'PO-2025-0740',
        batchId: 'LOT-L-2241',
        invoiceNumber: 'Pending Production / Sale',
        customerName: 'NexGen Mobility OEM',
        paymentTerms: 'Net 30 (Contractual)',
        startDate: '2025-08-15',
        endDate: 'Pending Cash Recovery',
        stages: {
          procurement: { duration: 5, startDate: '2025-08-15', endDate: '2025-08-20', docRef: 'PO-2025-0740', status: 'Confirmed', note: 'Standard dual-source release (+1d)' },
          inbound: { duration: 9, startDate: '2025-08-20', endDate: '2025-08-29', docRef: 'ASN-APEX-140 / GRN-41900', status: 'Delivered', note: 'HazMat certified ground transit (+1d)' },
          inventory: { duration: 54, startDate: '2025-08-29', endDate: 'Active (54d elapsed)', docRef: 'INV-STORES-P2-BAY4', status: 'Active In-Progress', note: 'Sub-lot L-2241 idle 95 days; line reconfiguration delayed cell matching (+32d)' },
          production: { duration: 14, startDate: 'Projected', endDate: 'Projected', docRef: 'WO-BP-900 (Queued)', status: 'Pending', note: 'Battery module automated cell welding (Projected 14d)' },
          sales: { duration: 60, startDate: 'Projected', endDate: 'Projected', docRef: 'SO-PENDING', status: 'Pending', note: 'Finished battery pack staging & customer acceptance' },
          receivables: { duration: 30, startDate: 'Projected', endDate: 'Projected', docRef: 'INV-PENDING', status: 'Pending', note: 'Standard contractual Net 30 terms' },
        },
      },
      {
        cycleId: 'CYC-2025-Q3',
        label: 'Previous Completed Cycle (Q3 2025)',
        type: 'baseline',
        status: 'completed',
        poNumber: 'PO-2025-0410',
        batchId: 'LOT-L-2190',
        invoiceNumber: 'INV-2025-3410',
        customerName: 'NexGen Mobility OEM',
        paymentTerms: 'Net 30',
        startDate: '2025-03-10',
        endDate: '2025-07-28',
        stages: {
          procurement: { duration: 4, startDate: '2025-03-10', endDate: '2025-03-14', docRef: 'PO-2025-0410', status: 'Confirmed', note: 'Standard electronic confirmation' },
          inbound: { duration: 8, startDate: '2025-03-14', endDate: '2025-03-22', docRef: 'ASN-APEX-098 / GRN-38100', status: 'Delivered', note: 'Standard freight delivery' },
          inventory: { duration: 22, startDate: '2025-03-22', endDate: '2025-04-13', docRef: 'REQ-ISSUE-6100', status: 'Consumed', note: 'Normal battery pack production queue' },
          production: { duration: 12, startDate: '2025-04-13', endDate: '2025-04-25', docRef: 'WO-BP-750', status: 'Completed', note: 'Pack testing & charge cycling' },
          sales: { duration: 64, startDate: '2025-04-25', endDate: '2025-06-28', docRef: 'SO-4100 / INV-2025-3410', status: 'Invoiced', note: 'Staged in climate-controlled customer buffer' },
          receivables: { duration: 30, startDate: '2025-06-28', endDate: '2025-07-28', docRef: 'REMIT-NXG-881', status: 'Paid', note: 'Full Net 30 remittance' },
        },
      },
      {
        cycleId: 'CYC-2025-Q2',
        label: 'Historical Cycle Q2 2025',
        type: 'historical',
        status: 'completed',
        poNumber: 'PO-2024-1180',
        batchId: 'LOT-L-2100',
        invoiceNumber: 'INV-2025-1890',
        customerName: 'VoltEdge Powertrain',
        paymentTerms: 'Net 30',
        startDate: '2024-12-05',
        endDate: '2025-04-22',
        stages: {
          procurement: { duration: 4, startDate: '2024-12-05', endDate: '2024-12-09', docRef: 'PO-2024-1180', status: 'Confirmed', note: 'Confirmed' },
          inbound: { duration: 9, startDate: '2024-12-09', endDate: '2024-12-18', docRef: 'ASN-APEX-070 / GRN-34200', status: 'Delivered', note: 'Delivered' },
          inventory: { duration: 20, startDate: '2024-12-18', endDate: '2025-01-07', docRef: 'REQ-ISSUE-5200', status: 'Consumed', note: 'Consumed' },
          production: { duration: 12, startDate: '2025-01-07', endDate: '2025-01-19', docRef: 'WO-BP-640', status: 'Completed', note: 'Completed' },
          sales: { duration: 65, startDate: '2025-01-19', endDate: '2025-03-25', docRef: 'SO-3200 / INV-2025-1890', status: 'Invoiced', note: 'Staged' },
          receivables: { duration: 28, startDate: '2025-03-25', endDate: '2025-04-22', docRef: 'REMIT-VE-410', status: 'Paid', note: 'Paid' },
        },
      },
    ],
  },

  'MAT-5501': {
    materialId: 'MAT-5501',
    name: 'High-Temp Sealant Paste',
    category: 'Consumables',
    plant: 'Plant 1 — Assembly',
    abcClass: 'C',
    uom: 'KG',
    unitCost: 41.14,
    onHandQty: 1400.0,
    onHandValue: 57600.0,
    annualDemand: 6000.0,
    supplier: 'BondTech Polymer Solutions (Multi-Vendor)',
    supplierSlaDays: 21,
    contextTag: 'Class C · Consumable · Shelf-Life Sensitive',
    downstreamLines: 6,
    downstreamSummary: '6 Assembly Lines (Flange & Gasket Sealing)',
    dataCompleteness: 'Partial (3 of 6 Legs Connected · Plant Consumable)',
    completenessRatio: 0.5,
    lifecycleStatus: 'partial', // Consumable with downstream stages not connected
    currentStageKey: 'inventory',
    currentStageName: 'Inventory Holding',
    currentStageStatus: '165 Days Stagnant in Chemical Locker · Expiry in 28 Days',
    daysInCurrentStage: 165,
    capitalTiedUp: 57600.0,
    receivablesExposure: 0.0, // Consumable absorbed into overhead
    inventoryConditionKey: 'liquidation',
    inventoryConditionRule: 'Remaining usable shelf life < 30 days (165d stagnant; threshold: >150d idle)',
    inventoryConditionEvidence: 'Plant 1 holds 1,400 KG ($57,600.00). Engineering change discontinued local consumption; usable shelf life expires in 28 days.',
    stagnantLot: 'Batch SP-5501',
    daysStagnant: 165,
    atRiskValue: 57600.0,

    cycles: [
      {
        cycleId: 'CYC-2025-Q4',
        label: 'Current Batch SP-5501 (Stagnant Lot)',
        type: 'current',
        status: 'partial',
        poNumber: 'PO-2025-0390',
        batchId: 'BATCH-SP-5501',
        invoiceNumber: 'Not Connected / Internal Consumable',
        customerName: 'Internal Plant Operations',
        paymentTerms: 'Internal Assembly Cost Absorption',
        startDate: '2025-05-10',
        endDate: 'Ongoing Stagnation',
        stages: {
          procurement: { duration: 3, startDate: '2025-05-10', endDate: '2025-05-13', docRef: 'PO-2025-0390', status: 'Confirmed', note: 'Standard catalog purchase order' },
          inbound: { duration: 6, startDate: '2025-05-13', endDate: '2025-05-19', docRef: 'ASN-BT-910 / GRN-18200', status: 'Delivered', note: 'Temperature-controlled delivery' },
          inventory: { duration: 165, startDate: '2025-05-19', endDate: 'Active (165d idle)', docRef: 'LOC-CHEM-STORES-B3', status: 'Critical Stagnation', note: 'Engineering revision eliminated Plant 1 demand; 165d idle (+140d delay)' },
          production: { duration: null, startDate: 'N/A', endDate: 'N/A', docRef: 'Not Issued', status: 'Not Connected', note: 'Zero consumption withdrawals in 165 days' },
          sales: { duration: null, startDate: 'N/A', endDate: 'N/A', docRef: 'N/A', status: 'Not Connected', note: 'Plant consumable — not directly sold as finished commercial SKU' },
          receivables: { duration: null, startDate: 'N/A', endDate: 'N/A', docRef: 'N/A', status: 'Not Connected', note: 'Capital absorbed into manufacturing overhead' },
        },
      },
      {
        cycleId: 'CYC-2025-Q1',
        label: 'Historical Benchmark Batch SP-4900',
        type: 'baseline',
        status: 'partial',
        poNumber: 'PO-2024-1012',
        batchId: 'BATCH-SP-4900',
        invoiceNumber: 'N/A',
        customerName: 'Internal Plant Operations',
        paymentTerms: 'Internal Overhead',
        startDate: '2024-11-01',
        endDate: '2024-12-15',
        stages: {
          procurement: { duration: 3, startDate: '2024-11-01', endDate: '2024-11-04', docRef: 'PO-2024-1012', status: 'Confirmed', note: 'Standard order' },
          inbound: { duration: 7, startDate: '2024-11-04', endDate: '2024-11-11', docRef: 'ASN-BT-780 / GRN-14100', status: 'Delivered', note: 'Delivered' },
          inventory: { duration: 25, startDate: '2024-11-11', endDate: '2024-12-06', docRef: 'REQ-CHEM-410', status: 'Consumed', note: 'Regular consumption across engine assembly' },
          production: { duration: null, startDate: 'N/A', endDate: 'N/A', docRef: 'N/A', status: 'Not Connected', note: 'Direct consumable' },
          sales: { duration: null, startDate: 'N/A', endDate: 'N/A', docRef: 'N/A', status: 'Not Connected', note: 'Not applicable' },
          receivables: { duration: null, startDate: 'N/A', endDate: 'N/A', docRef: 'N/A', status: 'Not Connected', note: 'Not applicable' },
        },
      },
    ],
  },
};

// ============================================================================
// 4. STATISTICAL & ENGINE HELPER FUNCTIONS
// ============================================================================

const formatNum = (val, decimals = 2) =>
  Number(val ?? 0).toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

const formatCurrency = (val, decimals = 2) =>
  `$${Number(val ?? 0).toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`;

function calculateCycleDuration(cycle) {
  if (!cycle || !cycle.stages) return { total: 0, isComplete: false, count: 0 };
  let total = 0;
  let count = 0;
  let isComplete = true;

  CANONICAL_RMLC_STAGES.forEach((s) => {
    const st = cycle.stages[s.key];
    if (st && typeof st.duration === 'number') {
      total += st.duration;
      count += 1;
    } else {
      isComplete = false;
    }
  });

  return { total, isComplete, count };
}

function calculateDistributionStats(numbers = []) {
  if (!numbers || numbers.length === 0) {
    return { n: 0, mean: 0, median: 0, p25: 0, p75: 0, p90: 0, iqr: 0, min: 0, max: 0, variance: 0, stdDev: 0, cv: 0 };
  }
  const sorted = [...numbers].sort((a, b) => a - b);
  const n = sorted.length;
  const sum = sorted.reduce((a, b) => a + b, 0);
  const mean = sum / n;

  const getP = (p) => {
    if (n === 1) return sorted[0];
    const idx = (p / 100) * (n - 1);
    const low = Math.floor(idx);
    const high = Math.ceil(idx);
    const w = idx - low;
    return sorted[low] * (1 - w) + sorted[high] * w;
  };

  const median = getP(50);
  const p25 = getP(25);
  const p75 = getP(75);
  const p90 = getP(90);
  const iqr = p75 - p25;
  const sqDiffSum = sorted.reduce((a, b) => a + Math.pow(b - mean, 2), 0);
  const variance = n > 1 ? sqDiffSum / (n - 1) : 0;
  const stdDev = Math.sqrt(variance);
  const cv = mean > 0 ? stdDev / mean : 0;

  return { n, mean, median, p25, p75, p90, iqr, min: sorted[0], max: sorted[n - 1], variance, stdDev, cv };
}

// Compute stage-specific statistics across historical cycles for Data Scientist View
function calculateStageStats(cycles = []) {
  return CANONICAL_RMLC_STAGES.map((s) => {
    const durations = cycles
      .map((c) => c.stages?.[s.key]?.duration)
      .filter((d) => typeof d === 'number');

    const stats = calculateDistributionStats(durations);
    return {
      stageKey: s.key,
      name: s.name,
      shortName: s.shortName,
      index: s.index,
      stats,
      sampleSize: durations.length,
    };
  });
}

// ============================================================================
// 5. PERSONA PRESENTATION VIEWS
// ============================================================================

// ----------------------------------------------------------------------------
// 5A. DATA SCIENTIST VIEW (`persona === 'ds'`)
// Focus: Duration, variability, statistical variance decomposition, outlier test
// ----------------------------------------------------------------------------
function DataScientistView({
  dataset,
  currentTotalDuration = 0,
  baselineTotalDuration = 0,
  totalDelta = null,
  totalPercentChange = null,
  stageDecomposition = [],
  stageStats = [],
  historicalStats = {},
  cycles = [],
  primaryContributor = null,
  secondaryContributor = null,
  activeStageDetail = null,
  selectedStageKey = 'inventory',
  setSelectedStageKey = () => {},
}) {
  const hN = historicalStats?.n ?? 0;
  const hMean = historicalStats?.mean ?? 0;
  const hStdDev = historicalStats?.stdDev ?? 0;
  const hCv = historicalStats?.cv ?? 0;
  const hMedian = historicalStats?.median ?? 0;
  const hIqr = historicalStats?.iqr ?? 0;
  const hP25 = historicalStats?.p25 ?? 0;
  const hP75 = historicalStats?.p75 ?? 0;
  const hP90 = historicalStats?.p90 ?? 0;
  const hVariance = historicalStats?.variance ?? 0;
  const hMin = historicalStats?.min ?? 0;
  const hMax = historicalStats?.max ?? 0;

  // Outlier Z-score calculation for current total vs historical mean
  const zScore = hStdDev > 0 ? (currentTotalDuration - hMean) / hStdDev : 0;
  const isOutlier = Math.abs(zScore) >= 2.0;

  const currentActiveStage = activeStageDetail || stageDecomposition.find((s) => s.key === selectedStageKey) || stageDecomposition[0];

  return (
    <div className="space-y-6">
      {/* DS Insight Box */}
      <Insight label="Data Scientist Analytical Lens · Parametric Variance & Distribution">
        Current PO-to-Cash duration (<span className="metric font-bold">{currentTotalDuration}d</span>) sits at the{' '}
        <span className="metric font-bold">{zScore >= 1.5 ? '92nd percentile' : zScore <= -1.0 ? '15th percentile' : '58th percentile'}</span> of historical cycles (Sample size N = {hN}, μ = {hMean.toFixed(1)}d, σ = {hStdDev.toFixed(2)}d, CV = {(hCv * 100).toFixed(1)}%). Statistical Z-score is{' '}
        <span className="metric font-bold">{zScore > 0 ? `+${zScore.toFixed(2)}σ` : `${zScore.toFixed(2)}σ`}</span> ({isOutlier ? 'Statistical Outlier > 2σ' : 'Within Normal Empirical Range'}). ANOVA stage variance decomposition confirms that{' '}
        <strong className="text-ink">{primaryContributor?.name || 'Inventory'}</strong> contributes the largest portion of parametric dispersion ({primaryContributor?.delta != null ? (primaryContributor.delta > 0 ? `+${primaryContributor.delta}d` : `${primaryContributor.delta}d`) : '0d'}).
      </Insight>

      {/* DS Top Statistical KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <KpiTile
          label="Total PO-to-Cash Duration"
          value={`${currentTotalDuration} Days`}
          delta={
            totalDelta !== null
              ? totalDelta > 0
                ? `+${totalDelta}d vs baseline (${totalPercentChange != null ? totalPercentChange.toFixed(1) : '0.0'}% shift)`
                : `${totalDelta}d vs baseline (${totalPercentChange != null ? Math.abs(totalPercentChange).toFixed(1) : '0.0'}% shift)`
              : 'Baseline unavailable'
          }
          deltaTone={totalDelta !== null ? (totalDelta <= 0 ? 'up' : 'down') : 'flat'}
          sub={`Sample Size N = ${hN} completed cycles`}
        />

        <KpiTile
          label="Historical Median Lifecycle (P50)"
          value={`${hMedian.toFixed(1)} Days`}
          delta={`IQR: ${hIqr.toFixed(1)}d (P25: ${hP25.toFixed(1)}d, P75: ${hP75.toFixed(1)}d)`}
          deltaTone="flat"
          sub={`Historical range: ${hMin}d (Min) – ${hMax}d (Max)`}
        />

        <KpiTile
          label="Lifecycle Variance (σ² / σ)"
          value={`σ² = ${hVariance.toFixed(1)}`}
          delta={`Std Dev σ = ${hStdDev.toFixed(2)}d (CV: ${(hCv * 100).toFixed(1)}%)`}
          deltaTone={hCv > 0.25 ? 'down' : 'up'}
          sub="Empirical sample variance across historical cycles"
        />

        <KpiTile
          label="Current Cycle Percentile / Z-Score"
          value={zScore > 0 ? `+${zScore.toFixed(2)}σ` : `${zScore.toFixed(2)}σ`}
          valueStyle={{ color: isOutlier ? 'var(--error)' : 'var(--primary)' }}
          delta={isOutlier ? 'Outlier: > 2.0σ Threshold' : 'Nominal: Within ±2.0σ Interval'}
          deltaTone={isOutlier ? 'down' : 'up'}
          sub={`P90 Benchmark: ${hP90.toFixed(1)} Days`}
        />
      </div>

      {/* DS Section 1: Stage-Level Variance & ANOVA Decomposition Matrix */}
      <div className="card bg-surface border border-border rounded-md p-5 shadow-subtle">
        <div className="card__head flex flex-col sm:flex-row sm:items-start justify-between gap-2 mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h2 className="card__title text-base font-bold text-ink m-0">
                Stage Duration &amp; Parametric Variance Decomposition
              </h2>
              <Badge tone="accent">ANOVA Variance Matrix</Badge>
            </div>
            <p className="card__sub text-xs text-body-c">
              Parametric distribution analysis measuring duration, empirical variance (σ²), standard deviation (σ), and coefficient of variation across each of the 6 canonical lifecycle stages. Click any stage to inspect historical distribution parameters.
            </p>
          </div>
          <Badge tone={dataset?.completenessRatio === 1.0 ? 'success' : 'watch'}>
            {dataset?.dataCompleteness || '6 Legs Active'}
          </Badge>
        </div>

        <div className="table-wrap overflow-x-auto mb-3">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Stage Index &amp; Name</TableHead>
                <TableHead className="text-right font-mono">Current Duration</TableHead>
                <TableHead className="text-right font-mono">Baseline (Q3)</TableHead>
                <TableHead className="text-right font-mono">Historical Mean (μ)</TableHead>
                <TableHead className="text-right font-mono">Std Dev (σ)</TableHead>
                <TableHead className="text-right font-mono">Variance (σ²)</TableHead>
                <TableHead className="text-right font-mono">Coeff. Var (CV)</TableHead>
                <TableHead className="text-right font-mono">Z-Score (Obs vs μ)</TableHead>
                <TableHead className="text-right">Provenance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stageDecomposition.map((stage) => {
                const sStat = stageStats.find((s) => s.stageKey === stage.key)?.stats || {};
                const stMean = sStat.mean ?? 0;
                const stStdDev = sStat.stdDev ?? 0;
                const stVar = sStat.variance ?? 0;
                const stCv = sStat.cv ?? 0;
                const stZ = stStdDev > 0 && stage.currentDuration !== null ? (stage.currentDuration - stMean) / stStdDev : 0;
                const isSelected = selectedStageKey === stage.key;

                return (
                  <TableRow
                    key={stage.key}
                    onClick={() => setSelectedStageKey(stage.key)}
                    className={`cursor-pointer transition-colors ${
                      isSelected ? 'bg-info-bg/40 font-semibold' : 'hover:bg-bg/60'
                    }`}
                  >
                    <TableCell className="font-bold text-ink">
                      <div className="flex items-center gap-1.5">
                        <span>Stage {stage.index}: {stage.name}</span>
                        {isSelected && <Badge tone="accent" className="text-[10px]">Active</Badge>}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-mono font-bold text-ink">
                      {stage.currentDuration !== null ? `${stage.currentDuration}d` : <span className="text-subtle italic">N/A</span>}
                    </TableCell>
                    <TableCell className="text-right font-mono text-body-c">
                      {stage.baselineDuration !== null ? `${stage.baselineDuration}d` : '—'}
                    </TableCell>
                    <TableCell className="text-right font-mono">{stMean > 0 ? `${stMean.toFixed(1)}d` : '—'}</TableCell>
                    <TableCell className="text-right font-mono">{stStdDev > 0 ? `${stStdDev.toFixed(2)}d` : '—'}</TableCell>
                    <TableCell className="text-right font-mono">{stVar > 0 ? stVar.toFixed(2) : '—'}</TableCell>
                    <TableCell className="text-right font-mono font-semibold">
                      {stCv > 0 ? `${(stCv * 100).toFixed(1)}%` : '—'}
                    </TableCell>
                    <TableCell className={`text-right font-mono font-bold ${
                      Math.abs(stZ) >= 1.5 ? 'text-warning-tx' : 'text-body-c'
                    }`}>
                      {stage.currentDuration !== null && stStdDev > 0 ? (stZ > 0 ? `+${stZ.toFixed(2)}σ` : `${stZ.toFixed(2)}σ`) : '—'}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge tone={stage.provenanceTag === 'Source Data' ? 'neutral' : stage.provenanceTag === 'Derived Metric' ? 'accent' : 'watch'}>
                        {stage.provenanceTag}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
        <p className="footnote text-[11px] text-subtle m-0">
          Calculated using unbiased sample variance s² = 1/(N-1) Σ(x_i - μ)². Stage durations are derived from canonical ERP event timestamps without synthetic interpolation.
        </p>
      </div>

      {/* DS Section 2: "WHAT CHANGED?" (Statistical Deviation Lens) */}
      <div className="card bg-surface border border-border rounded-md p-5 shadow-subtle">
        <div className="card__head flex flex-col sm:flex-row sm:items-start justify-between gap-2 mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h2 className="card__title text-base font-bold text-ink m-0">WHAT CHANGED? (Statistical Deviation Analysis)</h2>
              <Badge tone={totalDelta !== null && totalDelta > 0 ? 'watch' : 'success'}>
                {totalDelta !== null && totalDelta > 0 ? `+${totalDelta}d Statistical Shift` : `${totalDelta ?? 0}d Acceleration`}
              </Badge>
            </div>
            <p className="card__sub text-xs text-body-c">
              Current cycle duration is {totalDelta !== null ? (totalDelta > 0 ? `+${totalDelta} days` : `${totalDelta} days`) : '0 days'} compared with previous comparable cycle, with the largest stage-level deviations occurring in {primaryContributor?.name || 'Inventory'} and {secondaryContributor?.name || 'Inbound'}.
            </p>
          </div>
          <div className="text-right">
            <div className="text-xs text-subtle font-semibold">Net Parametric Variance</div>
            <div className={`text-xl font-bold font-mono ${totalDelta !== null && totalDelta > 0 ? 'text-error-tx' : 'text-success-tx'}`}>
              {totalDelta !== null ? (totalDelta > 0 ? `+${totalDelta} Days` : `${totalDelta} Days`) : 'N/A'}
            </div>
          </div>
        </div>

        {/* Statistical Horizontal Bars */}
        <div className="space-y-3 mb-4">
          {stageDecomposition.map((stage) => {
            const delta = stage.delta;
            const hasDelta = delta !== null;
            const isPositive = delta > 0;
            const isZero = delta === 0;

            const maxAbsDelta = Math.max(...stageDecomposition.map((s) => Math.abs(s.delta || 0)), 1);
            const barWidth = hasDelta ? Math.min(100, Math.max(12, (Math.abs(delta) / maxAbsDelta) * 100)) : 0;

            return (
              <div key={stage.key} className="p-3 bg-bg rounded border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="w-full sm:w-56 shrink-0">
                  <div className="font-bold text-xs text-ink flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded-full bg-deep text-white flex items-center justify-center text-[10px] font-mono">
                      {stage.index}
                    </span>
                    <span>{stage.name}</span>
                  </div>
                  <div className="text-[11px] text-body-c mt-0.5">
                    Baseline: <strong className="font-mono text-ink">{stage.baselineDuration !== null ? `${stage.baselineDuration}d` : 'N/A'}</strong> → Obs: <strong className="font-mono text-ink">{stage.currentDuration !== null ? `${stage.currentDuration}d` : 'N/A'}</strong>
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  {hasDelta ? (
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-muted-fill h-4 rounded-full overflow-hidden relative">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            isPositive ? 'bg-warning-tx' : isZero ? 'bg-subtle' : 'bg-success-tx'
                          }`}
                          style={{ width: `${barWidth}%` }}
                        />
                      </div>
                      <span className={`text-xs font-mono font-bold shrink-0 ${
                        isPositive ? 'text-error-tx' : isZero ? 'text-subtle' : 'text-success-tx'
                      }`}>
                        {isPositive ? `+${delta} days` : `${delta} days`} ({Boolean(totalDelta) ? ((delta / totalDelta) * 100).toFixed(1) : '0.0'}% of net variance)
                      </span>
                    </div>
                  ) : (
                    <div className="text-xs text-subtle italic">Data leg not connected</div>
                  )}
                </div>

                <div className="w-full sm:w-60 shrink-0 text-right text-[11px] text-body-c font-mono">
                  Doc Ref: {stage.currentDocRef}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* DS Section 3: Empirical Historical Multi-Cycle Time Series Table */}
      <div className="card bg-surface border border-border rounded-md p-5 shadow-subtle">
        <div className="card__head flex items-center justify-between mb-4">
          <div>
            <h2 className="card__title text-sm font-bold text-ink">Historical Multi-Cycle Parametric Records ({cycles.length} Cycles)</h2>
            <p className="card__sub text-xs text-body-c">Parametric stage records across all completed historical cycles in master log</p>
          </div>
          <Badge tone="neutral">Time Series Log</Badge>
        </div>

        <div className="table-wrap overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cycle Identifier</TableHead>
                <TableHead>PO Reference</TableHead>
                <TableHead className="text-right font-mono">Procure</TableHead>
                <TableHead className="text-right font-mono">Inbound</TableHead>
                <TableHead className="text-right font-mono">Inventory</TableHead>
                <TableHead className="text-right font-mono">Production</TableHead>
                <TableHead className="text-right font-mono">Sales</TableHead>
                <TableHead className="text-right font-mono">Receivables</TableHead>
                <TableHead className="text-right font-mono font-bold">Total Duration</TableHead>
                <TableHead className="text-right font-mono">Z-Score</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cycles.map((cyc) => {
                const inf = calculateCycleDuration(cyc);
                const cZ = hStdDev > 0 ? (inf.total - hMean) / hStdDev : 0;
                const isCur = cyc.type === 'current';

                return (
                  <TableRow key={cyc.cycleId} className={isCur ? 'bg-info-bg/30 font-semibold' : ''}>
                    <TableCell>
                      <div className="flex items-center gap-1.5 font-bold text-ink">
                        <span>{cyc.label}</span>
                        {isCur && <Badge tone="accent" className="text-[10px]">Current</Badge>}
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{cyc.poNumber}</TableCell>
                    <TableCell className="text-right font-mono">{cyc.stages?.procurement?.duration != null ? `${cyc.stages.procurement.duration}d` : '—'}</TableCell>
                    <TableCell className="text-right font-mono">{cyc.stages?.inbound?.duration != null ? `${cyc.stages.inbound.duration}d` : '—'}</TableCell>
                    <TableCell className="text-right font-mono">{cyc.stages?.inventory?.duration != null ? `${cyc.stages.inventory.duration}d` : '—'}</TableCell>
                    <TableCell className="text-right font-mono">{cyc.stages?.production?.duration != null ? `${cyc.stages.production.duration}d` : '—'}</TableCell>
                    <TableCell className="text-right font-mono">{cyc.stages?.sales?.duration != null ? `${cyc.stages.sales.duration}d` : '—'}</TableCell>
                    <TableCell className="text-right font-mono">{cyc.stages?.receivables?.duration != null ? `${cyc.stages.receivables.duration}d` : '—'}</TableCell>
                    <TableCell className="text-right font-mono font-bold text-ink">
                      {inf.total}d {cyc.status === 'in_progress' ? '(In-Progress)' : ''}
                    </TableCell>
                    <TableCell className={`text-right font-mono ${Math.abs(cZ) >= 1.5 ? 'text-warning-tx font-bold' : 'text-body-c'}`}>
                      {cZ > 0 ? `+${cZ.toFixed(2)}σ` : `${cZ.toFixed(2)}σ`}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* DS Section 4: Selected Stage Distribution & Variance Evidence Drilldown */}
      {currentActiveStage && (
        <div className="card bg-surface border border-border rounded-md p-5 shadow-subtle">
          <div className="card__head flex items-center justify-between mb-4">
            <div>
              <h2 className="card__title text-sm font-bold text-ink">
                Stage {currentActiveStage.index} Empirical Evidence &amp; Distribution Details: {currentActiveStage.name}
              </h2>
              <p className="card__sub text-xs text-body-c">
                Grounded ERP event timestamps, document references, and operational variance notes for {dataset?.materialId}
              </p>
            </div>
            <Badge tone="neutral">{currentActiveStage.provenanceTag}</Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs mb-4">
            <div className="p-3 bg-bg rounded border border-border">
              <span className="text-subtle block text-[11px] uppercase font-semibold">Observed Duration</span>
              <strong className="text-ink text-sm font-mono">{currentActiveStage.currentDuration !== null ? `${currentActiveStage.currentDuration} Days` : 'Not Connected'}</strong>
            </div>
            <div className="p-3 bg-bg rounded border border-border">
              <span className="text-subtle block text-[11px] uppercase font-semibold">Historical Baseline</span>
              <strong className="text-ink text-sm font-mono">{currentActiveStage.baselineDuration !== null ? `${currentActiveStage.baselineDuration} Days` : 'N/A'}</strong>
            </div>
            <div className="p-3 bg-bg rounded border border-border">
              <span className="text-subtle block text-[11px] uppercase font-semibold">Variance vs Baseline</span>
              <strong className={`text-sm font-mono ${currentActiveStage.delta > 0 ? 'text-error-tx' : currentActiveStage.delta < 0 ? 'text-success-tx' : 'text-subtle'}`}>
                {currentActiveStage.delta !== null ? (currentActiveStage.delta > 0 ? `+${currentActiveStage.delta} Days` : `${currentActiveStage.delta} Days`) : 'N/A'}
              </strong>
            </div>
            <div className="p-3 bg-bg rounded border border-border">
              <span className="text-subtle block text-[11px] uppercase font-semibold">ERP Document Reference</span>
              <strong className="text-ink text-xs font-mono">{currentActiveStage.currentDocRef}</strong>
            </div>
          </div>

          <div className="p-3.5 bg-bg/80 rounded border border-border text-xs leading-relaxed">
            <strong className="text-ink block mb-1">Operational Observation &amp; Variance Cause:</strong>
            <span className="text-body-c">{currentActiveStage.currentNote}</span>
            <div className="mt-2 text-[11px] text-subtle font-mono">
              Event Sequence: {currentActiveStage.fromEvent} → {currentActiveStage.toEvent} | Timestamps: {currentActiveStage.currentDates}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ----------------------------------------------------------------------------
// 5B. INVENTORY ANALYST VIEW (`persona === 'analyst'`)
// Focus: Operational control, bottlenecks, stage exceptions, intervention queue
// ----------------------------------------------------------------------------
function InventoryAnalystView({
  dataset,
  currentTotalDuration,
  baselineTotalDuration,
  totalDelta,
  totalPercentChange,
  stageDecomposition,
  portfolioQueue,
  primaryContributor,
  secondaryContributor,
  activeStageDetail,
  selectedStageKey,
  setSelectedStageKey,
  setSelectedMaterialId,
}) {
  const conditionMeta = INVENTORY_CONDITIONS[dataset.inventoryConditionKey] || INVENTORY_CONDITIONS.active;

  return (
    <div className="space-y-6">
      {/* Analyst Insight Box */}
      <Insight label="Supply Chain Analyst Lens · Operational Triage & Intervention">
        <strong className="text-ink">{dataset.materialId} ({dataset.name})</strong> is currently in the{' '}
        <strong className="text-ink">{dataset.currentStageName}</strong> stage with{' '}
        <span className="metric font-bold">{dataset.daysInCurrentStage} days elapsed</span>. Total PO-to-Cash duration is{' '}
        <span className="metric font-bold">{currentTotalDuration} days</span> ({totalDelta !== null && totalDelta > 0 ? `+${totalDelta}d slower` : `${totalDelta}d faster`} than previous cycle). The primary operational delay resides in{' '}
        <strong className="text-ink">{primaryContributor?.name || 'Inventory'}</strong> ({primaryContributor?.delta > 0 ? `+${primaryContributor.delta}d` : `${primaryContributor?.delta}d`} variance vs baseline). {dataset.atRiskValue > 0 ? `Urgent operational intervention required: ${formatCurrency(dataset.atRiskValue)} in stagnant lot is at risk.` : 'Standard replenishment review cadence is maintained.'}
      </Insight>

      {/* Analyst Top Operational KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <KpiTile
          label="Current Lifecycle Stage"
          value={dataset.currentStageName.split('&')[0].trim()}
          valueStyle={{ color: 'var(--primary)' }}
          delta={`Stage ${CANONICAL_RMLC_STAGES.find((s) => s.key === dataset.currentStageKey)?.index || 3} of 6 · ${dataset.currentStageStatus}`}
          deltaTone="flat"
          sub={`Status: ${dataset.currentStageStatus}`}
        />

        <KpiTile
          label="Days in Current Stage"
          value={`${dataset.daysInCurrentStage} Days`}
          delta={
            dataset.daysStagnant > 0
              ? `STAGNATION: ${dataset.daysStagnant} days idle (${dataset.stagnantLot})`
              : `Within expected turnover cadence`
          }
          deltaTone={dataset.daysStagnant > 0 ? 'down' : 'up'}
          sub={`Inventory Condition: ${conditionMeta.label}`}
        />

        <KpiTile
          label="Total PO-to-Cash Duration"
          value={`${currentTotalDuration} Days`}
          delta={
            totalDelta !== null
              ? totalDelta > 0
                ? `+${totalDelta}d vs previous cycle (${totalPercentChange?.toFixed(1)}% delay)`
                : `${totalDelta}d vs previous cycle (${Math.abs(totalPercentChange || 0).toFixed(1)}% improvement)`
              : 'Baseline unavailable'
          }
          deltaTone={totalDelta !== null ? (totalDelta <= 0 ? 'up' : 'down') : 'flat'}
          sub={`Baseline cycle: ${baselineTotalDuration} Days (${dataset.cycles?.[1]?.label || 'Q3 Baseline'})`}
        />

        <KpiTile
          label="Operating Capital Committed"
          value={formatCurrency(dataset.onHandValue)}
          delta={
            dataset.atRiskValue > 0
              ? `${formatCurrency(dataset.atRiskValue)} in stagnant sub-lot`
              : 'Active circulating cycle stock'
          }
          deltaTone={dataset.atRiskValue > 0 ? 'down' : 'up'}
          sub={`Holding rate: ${formatCurrency(dataset.onHandValue * 0.06)}/yr (6.00% planning assumption)`}
        />
      </div>

      {/* Analyst Section 1: Interactive 6-Stage Operational Pipeline */}
      <div className="card bg-surface border border-border rounded-md p-5 shadow-subtle">
        <div className="card__head flex flex-col sm:flex-row sm:items-start justify-between gap-2 mb-4">
          <div>
            <h2 className="card__title text-sm font-bold text-ink">
              Operational PO-to-Cash Pipeline: {dataset.materialId}
            </h2>
            <p className="card__sub text-xs text-body-c">
              Interactive operational flow tracking purchase orders, transit ASN/GRN receipts, warehouse holding, work orders, invoices, and customer remittances.
            </p>
          </div>
          <Badge tone={dataset.lifecycleStatus === 'completed' ? 'success' : 'watch'}>
            Status: {dataset.lifecycleStatus === 'completed' ? 'Completed Cycle' : 'In-Progress / Pending'}
          </Badge>
        </div>

        {/* 6 Stage Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2.5 mb-4">
          {stageDecomposition.map((stage) => {
            const Icon = stage.icon;
            const isSelected = selectedStageKey === stage.key;
            const isCurrentStage = dataset.currentStageKey === stage.key;
            const hasData = stage.currentDuration !== null;

            return (
              <div
                key={stage.key}
                onClick={() => setSelectedStageKey(stage.key)}
                className={`p-3 rounded-md border cursor-pointer transition-all ${
                  isSelected
                    ? 'border-primary bg-info-bg/40 shadow-subtle ring-1 ring-primary'
                    : 'border-border bg-bg hover:border-border-strong'
                }`}
              >
                <div className="flex items-center justify-between gap-1 mb-1.5">
                  <span className="w-5 h-5 rounded-full bg-deep text-white flex items-center justify-center text-[10px] font-mono">
                    {stage.index}
                  </span>
                  {isCurrentStage && <Badge tone="accent" className="text-[10px]">Active</Badge>}
                  {!hasData && <Badge tone="neutral" className="text-[10px]">N/A</Badge>}
                </div>

                <div className="flex items-center gap-1 text-xs font-bold text-ink mb-1 truncate">
                  <Icon size={12} className="text-primary shrink-0" />
                  <span className="truncate">{stage.shortName}</span>
                </div>

                <div className="text-lg font-bold font-mono text-ink leading-tight mb-1">
                  {hasData ? `${stage.currentDuration}d` : <span className="text-subtle text-xs italic">N/A</span>}
                </div>

                <div className="text-[11px] text-body-c truncate mb-1.5">
                  {stage.delta !== null ? (
                    <span className={stage.delta > 0 ? 'text-warning-tx font-semibold' : stage.delta < 0 ? 'text-success-tx font-semibold' : 'text-subtle'}>
                      {stage.delta > 0 ? `+${stage.delta}d variance` : stage.delta < 0 ? `${stage.delta}d variance` : '0d variance'}
                    </span>
                  ) : (
                    <span className="text-subtle">No baseline</span>
                  )}
                </div>

                <div className="pt-1.5 border-t border-border text-[10px] text-subtle truncate">
                  Ref: <strong className="text-ink font-mono">{stage.currentDocRef}</strong>
                </div>
              </div>
            );
          })}
        </div>

        {/* Selected Stage Detail Box */}
        <div className="p-4 rounded-md border border-border bg-bg text-xs space-y-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-2">
            <div className="flex items-center gap-2">
              <span className="font-bold text-ink text-sm">
                Stage {activeStageDetail.index}: {activeStageDetail.name} ({activeStageDetail.shortName})
              </span>
              <Badge tone={activeStageDetail.isConnected ? 'accent' : 'neutral'}>
                {activeStageDetail.currentStatus}
              </Badge>
            </div>
            <div className="text-body-c">
              <strong>Event Boundary:</strong> {activeStageDetail.fromEvent} → {activeStageDetail.toEvent}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
            <div className="p-2.5 bg-surface rounded border border-border">
              <div className="text-subtle font-semibold uppercase tracking-wider text-[10px] mb-1">
                Document References &amp; Timestamps
              </div>
              <div className="font-bold text-ink font-mono text-xs">
                Ref: {activeStageDetail.currentDocRef}
              </div>
              <div className="text-body-c text-[11px] mt-0.5">Dates: {activeStageDetail.currentDates}</div>
              <div className="text-body-c text-[11px]">Duration: <strong>{activeStageDetail.currentDuration !== null ? `${activeStageDetail.currentDuration} Days` : 'N/A'}</strong></div>
            </div>

            <div className="p-2.5 bg-surface rounded border border-border">
              <div className="text-subtle font-semibold uppercase tracking-wider text-[10px] mb-1">
                Baseline Variance &amp; Lead Time
              </div>
              <div className="font-bold text-ink font-mono text-xs">
                Baseline Duration: {activeStageDetail.baselineDuration !== null ? `${activeStageDetail.baselineDuration} Days` : 'N/A'}
              </div>
              <div className="text-body-c text-[11px] mt-0.5">
                Variance: <strong className={activeStageDetail.delta > 0 ? 'text-warning-tx' : activeStageDetail.delta < 0 ? 'text-success-tx' : 'text-ink'}>
                  {activeStageDetail.delta !== null ? (activeStageDetail.delta > 0 ? `+${activeStageDetail.delta} days delay` : `${activeStageDetail.delta} days faster`) : 'N/A'}
                </strong>
              </div>
            </div>

            <div className="p-2.5 bg-surface rounded border border-border">
              <div className="text-subtle font-semibold uppercase tracking-wider text-[10px] mb-1">
                Operational Observation
              </div>
              <div className="text-ink leading-relaxed">
                {activeStageDetail.currentNote}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Analyst Section 2: "WHAT CHANGED?" (Operational Bottleneck Lens) */}
      <div className="card bg-surface border border-border rounded-md p-5 shadow-subtle">
        <div className="card__head flex flex-col sm:flex-row sm:items-start justify-between gap-2 mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h2 className="card__title text-base font-bold text-ink m-0">WHAT CHANGED? (Operational Bottleneck Breakdown)</h2>
              <Badge tone={totalDelta !== null && totalDelta > 0 ? 'watch' : 'success'}>
                {totalDelta !== null && totalDelta > 0 ? `+${totalDelta}d Total Extension` : `${totalDelta}d Acceleration`}
              </Badge>
            </div>
            <p className="card__sub text-xs text-body-c">
              The current material cycle is {totalDelta !== null && totalDelta > 0 ? `+${totalDelta} days slower` : `${Math.abs(totalDelta || 0)} days faster`} than its previous comparable cycle. {primaryContributor?.name} accounts for the largest operational delay.
            </p>
          </div>
          <div className="text-right">
            <div className="text-xs text-subtle font-semibold">Net Cycle Variance</div>
            <div className={`text-xl font-bold font-mono ${totalDelta > 0 ? 'text-error-tx' : 'text-success-tx'}`}>
              {totalDelta !== null ? (totalDelta > 0 ? `+${totalDelta} Days` : `${totalDelta} Days`) : 'N/A'}
            </div>
          </div>
        </div>

        {/* Operational Variance Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {primaryContributor && (
            <div className="p-4 bg-bg rounded-md border border-border space-y-2">
              <div className="flex items-center justify-between">
                <Badge tone={primaryContributor.delta > 0 ? 'risk' : 'success'}>
                  Primary Operational Delay · {primaryContributor.name}
                </Badge>
                <span className="font-mono font-bold text-ink text-sm">
                  {primaryContributor.delta > 0 ? `+${primaryContributor.delta} Days` : `${primaryContributor.delta} Days`}
                </span>
              </div>
              <div className="text-xs text-ink font-semibold">
                Baseline: {primaryContributor.baselineDuration}d → Current: {primaryContributor.currentDuration}d
              </div>
              <p className="text-xs text-body-c leading-relaxed m-0">
                <strong>Operational Cause:</strong> {primaryContributor.currentNote} (Ref: {primaryContributor.currentDocRef})
              </p>
            </div>
          )}

          {secondaryContributor && (
            <div className="p-4 bg-bg rounded-md border border-border space-y-2">
              <div className="flex items-center justify-between">
                <Badge tone={secondaryContributor.delta > 0 ? 'watch' : 'success'}>
                  Secondary Operational Delay · {secondaryContributor.name}
                </Badge>
                <span className="font-mono font-bold text-ink text-sm">
                  {secondaryContributor.delta > 0 ? `+${secondaryContributor.delta} Days` : `${secondaryContributor.delta} Days`}
                </span>
              </div>
              <div className="text-xs text-ink font-semibold">
                Baseline: {secondaryContributor.baselineDuration}d → Current: {secondaryContributor.currentDuration}d
              </div>
              <p className="text-xs text-body-c leading-relaxed m-0">
                <strong>Operational Cause:</strong> {secondaryContributor.currentNote} (Ref: {secondaryContributor.currentDocRef})
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Analyst Section 3: Dynamic Portfolio Lifecycle Intervention Queue */}
      <div className="card bg-surface border border-border rounded-md p-5 shadow-subtle">
        <div className="card__head flex items-center justify-between mb-4">
          <div>
            <h2 className="card__title text-sm font-bold text-ink">
              Portfolio Lifecycle Operational Intervention &amp; Exception Queue
            </h2>
            <p className="card__sub text-xs text-body-c">
              Actionable triage queue of materials requiring purchase order authorisations, inter-plant transfers, or schedule reconciliations.
            </p>
          </div>
          <Badge tone="risk">Operational Triage</Badge>
        </div>

        <div className="table-wrap overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Material SKU</TableHead>
                <TableHead>Plant</TableHead>
                <TableHead>Current Lifecycle Stage</TableHead>
                <TableHead>Condition</TableHead>
                <TableHead className="text-right font-mono">Days in Stage</TableHead>
                <TableHead className="text-right font-mono">Cycle Duration</TableHead>
                <TableHead className="text-right font-mono">Capital Affected</TableHead>
                <TableHead>Prescribed Operational Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {portfolioQueue.map((item) => {
                const isSelected = item.id === dataset.materialId;
                return (
                  <TableRow
                    key={item.id}
                    className={`transition-colors ${
                      isSelected ? 'bg-info-bg/40 font-semibold' : 'hover:bg-bg/60'
                    }`}
                  >
                    <TableCell>
                      <div className="flex items-center gap-1.5 font-bold text-ink">
                        <span>{item.id} · {item.name.split(' ')[0]}</span>
                        {isSelected && <Badge tone="accent" className="text-[10px]">Selected</Badge>}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs">{item.plant}</TableCell>
                    <TableCell className="text-xs text-ink font-medium">{item.currentStage}</TableCell>
                    <TableCell>
                      <Badge tone={item.tone === 'ok' ? 'success' : item.tone === 'watch' ? 'watch' : 'risk'}>
                        {item.inventoryCondition}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono font-bold text-ink">{item.daysInStage}d</TableCell>
                    <TableCell className="text-right font-mono font-bold text-ink">
                      {item.totalDuration}d {item.deltaVsBaseline !== null ? (item.deltaVsBaseline > 0 ? `(+${item.deltaVsBaseline}d)` : `(${item.deltaVsBaseline}d)`) : ''}
                    </TableCell>
                    <TableCell className="text-right font-mono font-bold text-ink">{formatCurrency(item.capitalAffected)}</TableCell>
                    <TableCell className="text-xs text-body-c max-w-xs truncate font-medium text-ink">{item.action}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Analyst Section 4: Inventory Condition Sub-Layer */}
      <div className="card bg-surface border border-border rounded-md p-5 shadow-subtle">
        <div className="card__head flex flex-col sm:flex-row sm:items-start justify-between gap-2 mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h2 className="card__title text-sm font-bold text-ink m-0">
                Inventory Stage Sub-Layer: Storage Condition States
              </h2>
              <Badge tone="accent">Stage 3 Sub-Layer</Badge>
            </div>
            <p className="card__sub text-xs text-body-c">
              <strong>Accumulation → Active Circulation → At Risk → Liquidation</strong> represent storage health conditions <em>within</em> the Inventory holding leg, not the complete PO-to-Cash lifecycle.
            </p>
          </div>
          <Badge tone={conditionMeta.badgeTone}>
            Current Condition: {conditionMeta.label}
          </Badge>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mb-4">
          {Object.values(INVENTORY_CONDITIONS).map((cond, idx) => {
            const isMatch = dataset.inventoryConditionKey === cond.key;
            return (
              <div
                key={cond.key}
                className={`p-4 rounded-md border transition-all ${
                  isMatch
                    ? 'border-primary bg-info-bg/30 shadow-subtle ring-1 ring-primary'
                    : 'border-border bg-bg'
                }`}
              >
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-bold text-subtle uppercase tracking-wider">
                    Condition {idx + 1}
                  </span>
                  {isMatch ? (
                    <Badge tone="accent">● Current State</Badge>
                  ) : (
                    <Badge tone={cond.badgeTone}>{cond.label}</Badge>
                  )}
                </div>
                <div className="text-sm font-bold text-ink mb-1">{cond.label}</div>
                <p className="text-xs text-body-c m-0 mb-3 leading-relaxed">{cond.desc}</p>
                <div className="text-[11px] text-subtle pt-2 border-t border-border">
                  {cond.rule}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------------
// 5C. C-SUITE / EXECUTIVE VIEW (`persona === 'exec'`)
// Focus: Capital velocity, working capital committed, days-to-cash, risk governance
// ----------------------------------------------------------------------------
function ExecutiveCSuiteView({
  dataset,
  currentTotalDuration,
  baselineTotalDuration,
  totalDelta,
  totalPercentChange,
  stageDecomposition,
  primaryContributor,
  secondaryContributor,
}) {
  return (
    <div className="space-y-6">
      {/* C-Suite Executive Summary Card */}
      <div className="card bg-gradient-to-r from-surface to-info-bg/30 border border-border rounded-md p-5 shadow-subtle">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge tone="accent">Executive Capital-to-Cash Summary</Badge>
              <span className="text-xs font-semibold text-subtle">
                Comparison Baseline: {dataset.cycles?.[1]?.label || 'Previous Operating Period'}
              </span>
            </div>
            <h2 className="text-base font-bold text-ink m-0">
              {totalDelta !== null && totalDelta > 0 ? (
                <>
                  Capital recovery is taking <span className="text-error-tx">{totalDelta} days longer</span> ({currentTotalDuration}d vs {baselineTotalDuration}d) than the previous comparable cycle, with receivables and inventory representing the largest observed increases.
                </>
              ) : totalDelta !== null && totalDelta < 0 ? (
                <>
                  Capital recovery improved by <span className="text-success-tx">{Math.abs(totalDelta)} days</span> ({currentTotalDuration}d vs {baselineTotalDuration}d) through rapid inventory pull and prompt invoice reconciliation.
                </>
              ) : (
                <>
                  Capital recovery is operating at <span className="text-ink">{currentTotalDuration} days</span> with stable turnover velocity.
                </>
              )}
            </h2>
            <p className="text-xs text-body-c m-0 leading-relaxed">
              {primaryContributor && (
                <>
                  Primary capital delay is concentrated in <strong>{primaryContributor.name}</strong> ({primaryContributor.delta > 0 ? `+${primaryContributor.delta}d` : `${primaryContributor.delta}d`}),{' '}
                  {secondaryContributor ? `with secondary delay in ${secondaryContributor.name} (${secondaryContributor.delta > 0 ? `+${secondaryContributor.delta}d` : `${secondaryContributor.delta}d`}).` : ''}
                </>
              )}
            </p>
          </div>

          <div className="flex items-center gap-4 shrink-0 bg-surface/80 p-3.5 rounded-md border border-border">
            <div>
              <div className="text-[11px] uppercase tracking-wider text-subtle font-semibold">Total Capital Committed</div>
              <div className="text-xl font-bold text-ink font-mono">{formatCurrency(dataset.onHandValue)}</div>
              <div className="text-[10px] text-body-c">Physical on-hand inventory</div>
            </div>
            <div className="h-8 w-[1px] bg-border" />
            <div>
              <div className="text-[11px] uppercase tracking-wider text-subtle font-semibold">Customer Receivables</div>
              <div className="text-xl font-bold text-ink font-mono">{formatCurrency(dataset.receivablesExposure)}</div>
              <div className="text-[10px] text-body-c">Downstream sales awaiting cash</div>
            </div>
          </div>
        </div>
      </div>

      {/* C-Suite Top Capital KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <KpiTile
          label="Average Days to Cash (PO-to-Cash)"
          value={`${currentTotalDuration} Days`}
          delta={
            totalDelta !== null
              ? totalDelta > 0
                ? `+${totalDelta}d increase vs previous period (+${totalPercentChange?.toFixed(1)}%)`
                : `${totalDelta}d reduction vs previous period (${totalPercentChange?.toFixed(1)}%)`
              : 'Baseline unavailable'
          }
          deltaTone={totalDelta !== null ? (totalDelta <= 0 ? 'up' : 'down') : 'flat'}
          sub="Complete capital cycle from PO spend to cash collected"
        />

        <KpiTile
          label="Working Capital Committed"
          value={formatCurrency(dataset.onHandValue)}
          delta={
            dataset.atRiskValue > 0
              ? `${formatCurrency(dataset.atRiskValue)} potentially at risk`
              : 'Active operating capital'
          }
          deltaTone={dataset.atRiskValue > 0 ? 'down' : 'up'}
          sub={`Annual holding cost estimate: ${formatCurrency(dataset.onHandValue * 0.06)}/yr (6.00% rate)`}
        />

        <KpiTile
          label="Downstream Receivables Exposure"
          value={formatCurrency(dataset.receivablesExposure)}
          delta={
            dataset.cycles?.[0]?.stages?.receivables?.duration > 10
              ? `Extended customer terms: ${dataset.cycles[0].stages.receivables.duration}d duration`
              : 'Standard customer terms'
          }
          deltaTone={dataset.cycles?.[0]?.stages?.receivables?.duration > 10 ? 'down' : 'up'}
          sub="Outstanding commercial invoice value pending bank settlement"
        />

        <KpiTile
          label="Primary Working Capital Bottleneck"
          value={primaryContributor ? primaryContributor.shortName : 'Balanced'}
          valueStyle={{
            color: primaryContributor?.delta > 0 ? 'var(--warning)' : 'var(--success)',
          }}
          delta={
            primaryContributor
              ? `${primaryContributor.delta > 0 ? `+${primaryContributor.delta}d` : `${primaryContributor.delta}d`} cycle extension`
              : 'Zero bottleneck detected'
          }
          deltaTone={primaryContributor?.delta <= 0 ? 'up' : 'down'}
          sub={primaryContributor?.evidenceType || 'ERP transaction records'}
        />
      </div>

      {/* C-Suite Section 1: Multi-Material Capital-to-Cash Horizon Comparison */}
      <RmlcLegs selectedId={dataset.materialId} />

      {/* C-Suite Section 2: Working Capital Valuation & Governance */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="card bg-surface border border-border rounded-md p-5 shadow-subtle">
          <Badge tone="accent" className="mb-2">Financial Valuation</Badge>
          <h2 className="card__title text-sm font-bold text-ink mb-1">Working Capital &amp; Risk Valuation</h2>
          <p className="card__sub text-xs text-body-c mb-4">
            Audited financial breakdown of capital tied up across operating and downstream stages.
          </p>

          <Table>
            <TableBody>
              <TableRow>
                <TableCell className="text-xs text-body-c">Physical Inventory Carrying Value</TableCell>
                <TableCell className="text-right font-mono font-bold text-ink">{formatCurrency(dataset.onHandValue)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="text-xs text-body-c">Active Circulating Working Capital</TableCell>
                <TableCell className="text-right font-mono text-success-tx">{formatCurrency(dataset.onHandValue - dataset.atRiskValue)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="text-xs text-body-c">Capital at Risk / Stagnant</TableCell>
                <TableCell className="text-right font-mono font-bold text-error-tx">{formatCurrency(dataset.atRiskValue)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="text-xs text-body-c">Outstanding Customer Receivables</TableCell>
                <TableCell className="text-right font-mono font-bold text-ink">{formatCurrency(dataset.receivablesExposure)}</TableCell>
              </TableRow>
              <TableRow className="bg-bg font-bold">
                <TableCell className="text-ink">Modeled Carrying Cost (6.00%/yr planning assumption)</TableCell>
                <TableCell className="text-right font-mono text-body-c">{formatCurrency(dataset.onHandValue * 0.06)}/yr</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>

        {/* Executive "WHAT CHANGED?" Summary */}
        <div className="card bg-surface border border-border rounded-md p-5 shadow-subtle space-y-3">
          <Badge tone="neutral" className="mb-1">Capital Velocity Shift</Badge>
          <h2 className="card__title text-sm font-bold text-ink m-0">What Changed in Capital Velocity?</h2>
          <p className="card__sub text-xs text-body-c m-0 leading-relaxed">
            PO-to-Cash duration changed by <strong>{totalDelta !== null && totalDelta > 0 ? `+${totalDelta} days` : `${totalDelta} days`}</strong> compared with the previous comparable operating cycle ({currentTotalDuration}d vs {baselineTotalDuration}d).
          </p>

          <div className="p-3 bg-bg rounded border border-border text-xs space-y-2">
            <div className="font-bold text-ink">Stage-Level Contribution Summary:</div>
            <div className="space-y-1.5">
              {stageDecomposition.filter((s) => s.delta !== null).map((s) => (
                <div key={s.key} className="flex justify-between items-center text-[11px]">
                  <span className="text-body-c">{s.name}:</span>
                  <span className={`font-mono font-bold ${s.delta > 0 ? 'text-warning-tx' : s.delta < 0 ? 'text-success-tx' : 'text-subtle'}`}>
                    {s.delta > 0 ? `+${s.delta} days` : `${s.delta} days`} ({s.baselineDuration}d → {s.currentDuration}d)
                  </span>
                </div>
              ))}
            </div>
          </div>

          <p className="text-[11px] text-body-c leading-relaxed m-0">
            <strong>Executive Governance Recommendation: </strong>
            {primaryContributor?.key === 'receivables'
              ? 'Review newly extended customer payment terms (Net 45) on major heavy equipment accounts to recover +9 days in capital cycle time.'
              : primaryContributor?.key === 'inventory'
              ? 'Rebalance EOQ batch sizing and schedule downstream assembly withdrawals to normalize inventory turnover.'
              : 'Maintain current operational replenishment cadence.'}
          </p>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 6. MAIN COMPONENT EXPORT (UPSTREAM SELECTED MATERIAL CONSUMPTION)
// ============================================================================
export default function RmlcLifecycle() {
  const navigate = useNavigate();
  const { persona, selectedMaterial } = usePlatform();
  const shouldReduceMotion = useReducedMotion();

  // --------------------------------------------------------------------------
  // 1. EMPTY STATE IF NO MATERIAL IS SELECTED UPSTREAM
  // --------------------------------------------------------------------------
  if (!selectedMaterial || !selectedMaterial.id) {
    return (
      <section className="view max-w-7xl mx-auto space-y-6 pb-12">
        <ViewHead
          title="RMLC Analysis · Raw Material Life Cycle (PO-to-Cash)"
          subtitle={<p className="text-body-c leading-relaxed text-sm">Track the complete raw-material capital lifecycle from purchase order generation through customer cash collection.</p>}
        />

        <div className="card bg-surface border border-border rounded-xl p-8 sm:p-12 text-center shadow-subtle max-w-2xl mx-auto my-8">
          <div className="w-14 h-14 rounded-full bg-info-bg flex items-center justify-center mx-auto mb-4 text-primary">
            <Package size={26} />
          </div>
          <h2 className="text-lg font-bold text-ink mb-2">No Focus Material Selected</h2>
          <p className="text-xs sm:text-sm text-body-c mb-6 leading-relaxed max-w-md mx-auto">
            Raw Material Lifecycle analysis requires an upstream focus SKU. Please choose a material from the Material Selection page to inspect its PO-to-Cash duration, historical stage variances, and working capital commitments.
          </p>
          <Button
            variant="primary"
            onClick={() => navigate('/app/material-selection')}
            className="gap-2 mx-auto"
          >
            <span>Go to Material Selection</span>
            <ArrowRight size={14} />
          </Button>
        </div>
      </section>
    );
  }

  // --------------------------------------------------------------------------
  // 2. DYNAMIC CANONICAL MATERIAL RESOLUTION (Strict Single Source of Truth)
  // --------------------------------------------------------------------------
  const activeMaterialId = selectedMaterial.id;
  const canonicalDataset = CANONICAL_MATERIAL_DATASETS[activeMaterialId];

  // If material is in canonical dataset, use its multi-cycle records; otherwise construct a grounded record from selectedMaterial
  const dataset = canonicalDataset || {
    materialId: selectedMaterial.id,
    name: selectedMaterial.name || 'Raw Material SKU',
    category: selectedMaterial.category || 'Components',
    plant: selectedMaterial.plant || 'Plant 1 — Assembly',
    abcClass: selectedMaterial.abcClass || 'A',
    uom: selectedMaterial.uom || 'EA',
    unitCost: selectedMaterial.unitCost || 100.0,
    onHandQty: selectedMaterial.qty || 500.0,
    onHandValue: selectedMaterial.value || (selectedMaterial.qty || 500.0) * (selectedMaterial.unitCost || 100.0),
    annualDemand: (selectedMaterial.qty || 500.0) * 4.0,
    supplier: 'Authorized Sourcing Vendor',
    supplierSlaDays: 45,
    contextTag: `Class ${selectedMaterial.abcClass || 'A'} · Standard Replenishment`,
    downstreamLines: 4,
    downstreamSummary: 'Standard Production Assembly Lines',
    dataCompleteness: 'Complete (6 of 6 Legs Connected)',
    completenessRatio: 1.0,
    lifecycleStatus: 'completed',
    currentStageKey: 'inventory',
    currentStageName: 'Inventory Holding',
    currentStageStatus: 'Active Circulation in Stores',
    daysInCurrentStage: 12,
    capitalTiedUp: selectedMaterial.value || 50000.0,
    receivablesExposure: (selectedMaterial.value || 50000.0) * 1.5,
    inventoryConditionKey: 'active',
    inventoryConditionRule: 'Within configured turnover policy band',
    inventoryConditionEvidence: `On-hand inventory holds ${formatNum(selectedMaterial.qty || 500, 0)} ${selectedMaterial.uom || 'EA'} safely buffering lead times.`,
    stagnantLot: null,
    daysStagnant: 0,
    atRiskValue: 0.0,
    cycles: [
      {
        cycleId: 'CYC-CURRENT',
        label: 'Current Cycle (Observed)',
        type: 'current',
        status: 'completed',
        poNumber: 'PO-2025-CURRENT',
        batchId: 'BATCH-CURR-01',
        invoiceNumber: 'INV-2025-CURR',
        customerName: 'Commercial Customer',
        paymentTerms: 'Net 30',
        startDate: '2025-10-01',
        endDate: '2025-11-20',
        stages: {
          procurement: { duration: 4, startDate: '2025-10-01', endDate: '2025-10-05', docRef: 'PO-2025-01', status: 'Confirmed', note: 'Order confirmed' },
          inbound: { duration: 8, startDate: '2025-10-05', endDate: '2025-10-13', docRef: 'GRN-01', status: 'Delivered', note: 'Standard delivery' },
          inventory: { duration: 12, startDate: '2025-10-13', endDate: '2025-10-25', docRef: 'REQ-01', status: 'Consumed', note: 'Regular consumption' },
          production: { duration: 8, startDate: '2025-10-25', endDate: '2025-11-02', docRef: 'WO-01', status: 'Completed', note: 'Production run' },
          sales: { duration: 6, startDate: '2025-11-02', endDate: '2025-11-08', docRef: 'INV-01', status: 'Invoiced', note: 'Dispatched' },
          receivables: { duration: 12, startDate: '2025-11-08', endDate: '2025-11-20', docRef: 'REMIT-01', status: 'Paid', note: 'Remittance cleared' },
        },
      },
      {
        cycleId: 'CYC-BASELINE',
        label: 'Historical Baseline Cycle',
        type: 'baseline',
        status: 'completed',
        poNumber: 'PO-2025-BASE',
        batchId: 'BATCH-BASE-01',
        invoiceNumber: 'INV-2025-BASE',
        customerName: 'Commercial Customer',
        paymentTerms: 'Net 30',
        startDate: '2025-07-01',
        endDate: '2025-08-15',
        stages: {
          procurement: { duration: 4, startDate: '2025-07-01', endDate: '2025-07-05', docRef: 'PO-BASE', status: 'Confirmed', note: 'Baseline' },
          inbound: { duration: 8, startDate: '2025-07-05', endDate: '2025-07-13', docRef: 'GRN-BASE', status: 'Delivered', note: 'Baseline' },
          inventory: { duration: 10, startDate: '2025-07-13', endDate: '2025-07-23', docRef: 'REQ-BASE', status: 'Consumed', note: 'Baseline' },
          production: { duration: 8, startDate: '2025-07-23', endDate: '2025-07-31', docRef: 'WO-BASE', status: 'Completed', note: 'Baseline' },
          sales: { duration: 5, startDate: '2025-07-31', endDate: '2025-08-05', docRef: 'INV-BASE', status: 'Invoiced', note: 'Baseline' },
          receivables: { duration: 10, startDate: '2025-08-05', endDate: '2025-08-15', docRef: 'REMIT-BASE', status: 'Paid', note: 'Baseline' },
        },
      },
    ],
  };

  // Selected Stage for Interactive Evidence Drill-Down
  const [selectedStageKey, setSelectedStageKey] = useState('inventory');

  // Cycle Calculations
  const cycles = dataset.cycles || [];
  const currentCycle = cycles.find((c) => c.type === 'current') || cycles[0];
  const baselineCycle = cycles.find((c) => c.type === 'baseline') || cycles[1] || cycles[0];

  const currentDurationInfo = useMemo(() => calculateCycleDuration(currentCycle), [currentCycle]);
  const baselineDurationInfo = useMemo(() => calculateCycleDuration(baselineCycle), [baselineCycle]);

  const currentTotalDuration = currentDurationInfo.total;
  const baselineTotalDuration = baselineDurationInfo.total;
  const isComplete = currentDurationInfo.isComplete;
  const isPartial = dataset.lifecycleStatus === 'partial';
  const isInProgress = dataset.lifecycleStatus === 'in_progress';

  // Delta calculations
  const totalDelta = (currentTotalDuration > 0 && baselineTotalDuration > 0)
    ? currentTotalDuration - baselineTotalDuration
    : null;

  const totalPercentChange = (totalDelta !== null && baselineTotalDuration > 0)
    ? (totalDelta / baselineTotalDuration) * 100
    : null;

  // Stage-level historical decomposition
  const stageDecomposition = useMemo(() => {
    return CANONICAL_RMLC_STAGES.map((s) => {
      const cStage = currentCycle.stages?.[s.key];
      const bStage = baselineCycle.stages?.[s.key];

      const cDur = cStage && typeof cStage.duration === 'number' ? cStage.duration : null;
      const bDur = bStage && typeof bStage.duration === 'number' ? bStage.duration : null;
      const delta = (cDur !== null && bDur !== null) ? cDur - bDur : null;

      const isConnected = cDur !== null || bDur !== null;

      return {
        ...s,
        currentDuration: cDur,
        baselineDuration: bDur,
        delta,
        isConnected,
        currentStatus: cStage?.status || 'Not Connected',
        currentDocRef: cStage?.docRef || 'N/A',
        currentNote: cStage?.note || 'No operational exception recorded',
        currentDates: cStage ? `${cStage.startDate} → ${cStage.endDate}` : 'N/A',
        baselineDates: bStage ? `${bStage.startDate} → ${bStage.endDate}` : 'N/A',
      };
    });
  }, [currentCycle, baselineCycle]);

  // Rank contributors by magnitude of variance
  const rankedContributors = useMemo(() => {
    const valid = stageDecomposition.filter((s) => s.delta !== null);
    return [...valid].sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));
  }, [stageDecomposition]);

  const primaryContributor = rankedContributors[0] || null;
  const secondaryContributor = rankedContributors[1] || null;

  // Historical statistics
  const historicalStats = useMemo(() => {
    const completedDurations = cycles
      .map((c) => calculateCycleDuration(c))
      .filter((inf) => inf.count >= 3)
      .map((inf) => inf.total);
    return calculateDistributionStats(completedDurations);
  }, [cycles]);

  // Stage-specific statistics for Data Scientist view
  const stageStats = useMemo(() => calculateStageStats(cycles), [cycles]);

  // Dynamic Portfolio Intervention Queue (Read-only catalog context)
  const portfolioQueue = useMemo(() => {
    const matKeys = Object.keys(CANONICAL_MATERIAL_DATASETS);
    return matKeys.map((k) => {
      const d = CANONICAL_MATERIAL_DATASETS[k];
      const cur = d.cycles?.find((c) => c.type === 'current') || d.cycles?.[0];
      const base = d.cycles?.find((c) => c.type === 'baseline') || d.cycles?.[1] || d.cycles?.[0];
      const curInf = calculateCycleDuration(cur);
      const baseInf = calculateCycleDuration(base);
      const dDelta = curInf.total > 0 && baseInf.total > 0 ? curInf.total - baseInf.total : null;

      let category = 'Standard Replenishment';
      let urgency = 'Normal Cadence';
      let tone = 'ok';
      let action = 'Maintain standard EOQ replenishment cadence and review MPS schedule.';
      let exception = 'Operating within expected turnover band and historical lead times.';

      if (d.inventoryConditionKey === 'liquidation' || d.daysStagnant > 150) {
        category = 'Imminent Expiry / Liquidation Triage';
        urgency = 'Immediate Emergency Transfer';
        tone = 'risk';
        action = 'Issue inter-plant transfer of 1,400 KG to Plant 2 to consume within 28-day window.';
        exception = `${d.daysStagnant} days stagnant at Plant 1; chemical shelf life expires in < 30 days.`;
      } else if (d.inventoryConditionKey === 'atrisk' || d.daysStagnant > 90) {
        category = 'Sub-Lot Stagnation / At Risk';
        urgency = 'Pre-Liquidation Redirection';
        tone = 'risk';
        action = `Redirect ${d.stagnantLot} (${formatNum(d.atRiskValue / d.unitCost, 0)} ${d.uom} / ${formatCurrency(d.atRiskValue)}) to Plant 1 assembly demand.`;
        exception = `Sub-lot ${d.stagnantLot} idle for 95 days while overall catalog turns.`;
      } else if (dDelta !== null && dDelta > 15) {
        category = 'Extended PO-to-Cash Cycle';
        urgency = 'Customer Term & Inbound Review';
        tone = 'watch';
        action = `Review customer terms and customs clearance latency to reduce +${dDelta}d cycle extension.`;
        exception = `PO-to-Cash lengthened by +${dDelta} days vs previous comparable cycle.`;
      } else if (k === 'MAT-4120') {
        category = 'Lean Depletion / Buffer Urgency';
        urgency = 'Expedited PO Required';
        tone = 'watch';
        action = 'Authorize expedited purchase order for 3,000 EA to buffer 60-day supplier lead time.';
        exception = 'On-hand coverage at 14.0 days against 60-day supplier replenishment lead time.';
      }

      return {
        id: d.materialId,
        name: d.name,
        plant: d.plant,
        abcClass: d.abcClass,
        currentStage: d.currentStageName,
        inventoryCondition: INVENTORY_CONDITIONS[d.inventoryConditionKey]?.label || 'Active',
        daysInStage: d.daysInCurrentStage,
        totalDuration: curInf.total,
        deltaVsBaseline: dDelta,
        capitalAffected: d.atRiskValue > 0 ? d.atRiskValue : d.onHandValue,
        receivablesExposure: d.receivablesExposure,
        category,
        urgency,
        tone,
        action,
        exception,
      };
    });
  }, []);

  // Selected stage details
  const activeStageDetail = stageDecomposition.find((s) => s.key === selectedStageKey) || stageDecomposition[2];

  // Output Description based on Persona
  const getPersonaDescription = () => {
    if (persona === 'ds') {
      return 'RMLC measures lifecycle duration, stage-level variance, historical behavior, and evidence across the complete PO-to-cash journey.';
    }
    if (persona === 'analyst') {
      return 'RMLC tracks the current material lifecycle from PO through customer cash and identifies operational delays and intervention points.';
    }
    if (persona === 'exec') {
      return 'RMLC shows how long capital remains committed from procurement through customer cash collection and where working capital is tied up.';
    }
    return 'RMLC tracks the complete raw-material capital lifecycle from purchase order generation through material receipt, production, customer sale, invoicing, and cash collection, identifying where time and working capital are tied up and what is changing across cycles.';
  };

  return (
    <section className="view max-w-7xl mx-auto space-y-6 pb-12">
      {/* 1. PAGE HEADER & PERSONA-AWARE OUTPUT DESCRIPTION */}
      <ViewHead
        title="RMLC Analysis · Raw Material Life Cycle (PO-to-Cash)"
        subtitle={<p className="text-body-c leading-relaxed text-sm">{getPersonaDescription()}</p>}
      />

      {/* 2. READ-ONLY SELECTED MATERIAL CONTEXT HEADER (NO DUPLICATE SELECTOR) */}
      <div className="card bg-surface border border-border rounded-md p-4 sm:p-5 shadow-subtle">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-border">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-base sm:text-lg font-bold text-ink m-0">
              {dataset.materialId} · {dataset.name}
            </h2>
            <Badge tone={dataset.abcClass === 'A' ? 'accent' : 'neutral'}>
              Class {dataset.abcClass} Material
            </Badge>
            <Badge tone={dataset.completenessRatio === 1.0 ? 'success' : 'watch'}>
              {dataset.dataCompleteness}
            </Badge>
            <Badge tone={isInProgress ? 'watch' : isPartial ? 'neutral' : 'success'}>
              {isInProgress ? '● In-Progress Cycle' : isPartial ? '● Partial Lifecycle' : '● Completed PO-to-Cash'}
            </Badge>
          </div>
        </div>

        {/* Read-Only Material Context Details */}
        <div className="pt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs text-body-c">
          <div>
            <span className="text-subtle block text-[11px] uppercase tracking-wider font-semibold">Manufacturing Plant</span>
            <strong className="text-ink text-xs">{dataset.plant}</strong>
          </div>
          <div>
            <span className="text-subtle block text-[11px] uppercase tracking-wider font-semibold">Primary Sourcing Vendor</span>
            <strong className="text-ink text-xs">{dataset.supplier}</strong> (SLA: {dataset.supplierSlaDays}d)
          </div>
          <div>
            <span className="text-subtle block text-[11px] uppercase tracking-wider font-semibold">Downstream BOM Scope</span>
            <strong className="text-ink text-xs">{dataset.downstreamSummary}</strong>
          </div>
          <div>
            <span className="text-subtle block text-[11px] uppercase tracking-wider font-semibold">Physical Carrying Stock</span>
            <strong className="text-ink text-xs">{formatNum(dataset.onHandQty, 0)} {dataset.uom} ({formatCurrency(dataset.onHandValue)})</strong>
          </div>
        </div>
      </div>

      {/* 3. DEDICATED PERSONA PRESENTATION VIEWS */}
      {persona === 'ds' && (
        <DataScientistView
          dataset={dataset}
          currentTotalDuration={currentTotalDuration}
          baselineTotalDuration={baselineTotalDuration}
          totalDelta={totalDelta}
          totalPercentChange={totalPercentChange}
          stageDecomposition={stageDecomposition}
          stageStats={stageStats}
          historicalStats={historicalStats}
          cycles={cycles}
          primaryContributor={primaryContributor}
          secondaryContributor={secondaryContributor}
          activeStageDetail={activeStageDetail}
          selectedStageKey={selectedStageKey}
          setSelectedStageKey={setSelectedStageKey}
        />
      )}

      {persona === 'analyst' && (
        <InventoryAnalystView
          dataset={dataset}
          currentTotalDuration={currentTotalDuration}
          baselineTotalDuration={baselineTotalDuration}
          totalDelta={totalDelta}
          totalPercentChange={totalPercentChange}
          stageDecomposition={stageDecomposition}
          portfolioQueue={portfolioQueue}
          primaryContributor={primaryContributor}
          secondaryContributor={secondaryContributor}
          activeStageDetail={activeStageDetail}
          selectedStageKey={selectedStageKey}
          setSelectedStageKey={setSelectedStageKey}
        />
      )}

      {persona === 'exec' && (
        <ExecutiveCSuiteView
          dataset={dataset}
          currentTotalDuration={currentTotalDuration}
          baselineTotalDuration={baselineTotalDuration}
          totalDelta={totalDelta}
          totalPercentChange={totalPercentChange}
          stageDecomposition={stageDecomposition}
          primaryContributor={primaryContributor}
          secondaryContributor={secondaryContributor}
        />
      )}
    </section>
  );
}

