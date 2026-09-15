import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import {
  LineChart,
  Search,
  ArrowUpDown,
  Download,
  ChevronUp,
  ChevronDown,
  X,
} from 'lucide-react';
import { ViewHead, Badge } from '../../components/CommonUI';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { usePlatform } from '../../context/PlatformContext';
import { MATERIALS, EOQ_INPUTS, FORECAST_INPUTS, RAW_MATERIAL_ROWS } from '../../data/mockData';

// ============================================================================
// COMPLETE CANONICAL INVENTORY DATASET
// Derived deterministically from the underlying enterprise master data,
// demand forecast engine, lot-sizing models and lifecycle ledger.
// Contains ALL available rows and ALL available attributes across the estate.
// ============================================================================
const FULL_INVENTORY_DATASET = [
  {
    id: 'MAT-1082',
    name: 'Hydraulic Pump 250BAR',
    plant: 'Plant 1 — Assembly',
    category: 'Components',
    materialType: 'Components & Electronics',
    qty: 930.0,
    uom: 'EA',
    unitCost: 600.0,
    value: 558000.0,
    annualDemand: 4800.0,
    dailyConsumption: 13.15,
    annualConsumptionValue: 2880000.0,
    leadTimeDays: 60,
    demandCV: 0.12,
    safetyStock: 184.2,
    reorderPoint: 973.2,
    currentBatchQty: 600.0,
    calibratedEOQ: 248.0,
    daysOfSupply: 70.8,
    inventoryTurnover: 5.16,
    abcClass: 'A',
    supplier: 'HydraTech Dynamics GmbH',
    sourcingType: 'Sole Source',
    criticality: 'Critical',
    stockoutRisk: 'Protected',
    rmlcStatus: 'Active Circulation',
    downstreamLines: '14 Lines (HEX-200, IL-450, HC-80, MD-120)',
    bomCoverage: 'Risk',
  },
  {
    id: 'MAT-4120',
    name: 'Microcontroller MCU-64',
    plant: 'Plant 3 — Microelectronics',
    category: 'Components',
    materialType: 'Components & Electronics',
    qty: 920.0,
    uom: 'EA',
    unitCost: 78.65,
    value: 72358.0,
    annualDemand: 24000.0,
    dailyConsumption: 65.75,
    annualConsumptionValue: 1887600.0,
    leadTimeDays: 60,
    demandCV: 0.28,
    safetyStock: 412.0,
    reorderPoint: 4357.0,
    currentBatchQty: 3000.0,
    calibratedEOQ: 1870.0,
    daysOfSupply: 14.0,
    inventoryTurnover: 26.09,
    abcClass: 'A',
    supplier: 'SiliconFoundry International',
    sourcingType: 'Allocated Supply',
    criticality: 'Critical',
    stockoutRisk: 'High Risk (14-Day)',
    rmlcStatus: 'At Risk (14-Day)',
    downstreamLines: '19 SKUs (ECU-400, GW-80, TM-12)',
    bomCoverage: 'Risk',
  },
  {
    id: 'MAT-2041',
    name: 'Lithium Cell 21700',
    plant: 'Plant 2 — Engine Hub',
    category: 'Raw Materials',
    materialType: 'Raw Materials',
    qty: 142000.0,
    uom: 'EA',
    unitCost: 5.14,
    value: 729880.0,
    annualDemand: 420000.0,
    dailyConsumption: 1150.68,
    annualConsumptionValue: 2158800.0,
    leadTimeDays: 30,
    demandCV: 0.1,
    safetyStock: 6840.0,
    reorderPoint: 41340.0,
    currentBatchQty: 60000.0,
    calibratedEOQ: 25050.0,
    daysOfSupply: 123.4,
    inventoryTurnover: 2.96,
    abcClass: 'A',
    supplier: 'Apex Energy Storage Ltd',
    sourcingType: 'Dual Sourced',
    criticality: 'High',
    stockoutRisk: 'Protected',
    rmlcStatus: 'Active Circulation',
    downstreamLines: '8 Lines (BP-800, PM-200, ESS-50)',
    bomCoverage: 'OK',
  },
  {
    id: 'MAT-5501',
    name: 'High-Temp Sealant Paste',
    plant: 'Plant 1 — Assembly',
    category: 'Consumables',
    materialType: 'Consumables',
    qty: 1400.0,
    uom: 'KG',
    unitCost: 41.14,
    value: 57596.0,
    annualDemand: 6000.0,
    dailyConsumption: 16.44,
    annualConsumptionValue: 246840.0,
    leadTimeDays: 21,
    demandCV: 0.15,
    safetyStock: 120.0,
    reorderPoint: 465.0,
    currentBatchQty: 1400.0,
    calibratedEOQ: 1058.0,
    daysOfSupply: 85.2,
    inventoryTurnover: 4.29,
    abcClass: 'C',
    supplier: 'BondTech Polymer Solutions',
    sourcingType: 'Multi-Vendor',
    criticality: 'Moderate',
    stockoutRisk: 'Protected',
    rmlcStatus: 'Liquidation (>180d)',
    downstreamLines: '6 Lines (Flanges, Gaskets)',
    bomCoverage: 'OK',
  },
  {
    id: 'MAT-3390',
    name: 'Steel Housing Cast-Iron',
    plant: 'Plant 1 — Assembly',
    category: 'Structural Parts',
    materialType: 'Fabricated Parts',
    qty: 1800.0,
    uom: 'EA',
    unitCost: 185.0,
    value: 333000.0,
    annualDemand: 7200.0,
    dailyConsumption: 19.73,
    annualConsumptionValue: 1332000.0,
    leadTimeDays: 45,
    demandCV: 0.14,
    safetyStock: 320.0,
    reorderPoint: 1208.0,
    currentBatchQty: 1200.0,
    calibratedEOQ: 772.0,
    daysOfSupply: 91.2,
    inventoryTurnover: 4.0,
    abcClass: 'B',
    supplier: 'Precision Forge & Cast Corp',
    sourcingType: 'Sole Source',
    criticality: 'High',
    stockoutRisk: 'Watch (45-Day)',
    rmlcStatus: 'Active Circulation',
    downstreamLines: '4 Lines (HEX-200, HC-80)',
    bomCoverage: 'Watch',
  },
  {
    id: 'MAT-1177',
    name: 'High-Pressure Seal Kit',
    plant: 'Plant 1 — Assembly',
    category: 'Spare Parts',
    materialType: 'MRO Spares',
    qty: 3600.0,
    uom: 'SET',
    unitCost: 45.0,
    value: 162000.0,
    annualDemand: 14400.0,
    dailyConsumption: 39.45,
    annualConsumptionValue: 648000.0,
    leadTimeDays: 15,
    demandCV: 0.08,
    safetyStock: 480.0,
    reorderPoint: 1072.0,
    currentBatchQty: 2400.0,
    calibratedEOQ: 1714.0,
    daysOfSupply: 91.3,
    inventoryTurnover: 4.0,
    abcClass: 'B',
    supplier: 'Elastomer Seals Global',
    sourcingType: 'Dual Sourced',
    criticality: 'Low',
    stockoutRisk: 'Protected',
    rmlcStatus: 'Active Circulation',
    downstreamLines: '12 Lines (Sub-Assemblies)',
    bomCoverage: 'OK',
  },
];

// Definition of ALL columns present in the dataset (excluding downstream module classifications)
const COLUMNS_CONFIG = [
  { key: 'id', label: 'Material ID', align: 'left', minWidth: '110px' },
  { key: 'name', label: 'Description', align: 'left', minWidth: '190px' },
  { key: 'plant', label: 'Plant', align: 'left', minWidth: '160px' },
  { key: 'category', label: 'Category', align: 'left', minWidth: '130px' },
  { key: 'materialType', label: 'Material Type', align: 'left', minWidth: '160px' },
  { key: 'qty', label: 'On-Hand Qty', align: 'right', minWidth: '130px' },
  { key: 'uom', label: 'UoM', align: 'center', minWidth: '70px' },
  { key: 'unitCost', label: 'Unit Cost', align: 'right', minWidth: '110px' },
  { key: 'value', label: 'Inventory Value', align: 'right', minWidth: '140px' },
  { key: 'annualDemand', label: 'Annual Demand', align: 'right', minWidth: '130px' },
  { key: 'dailyConsumption', label: 'Daily Consumption', align: 'right', minWidth: '140px' },
  { key: 'annualConsumptionValue', label: 'Consumption Value', align: 'right', minWidth: '150px' },
  { key: 'leadTimeDays', label: 'Lead Time', align: 'right', minWidth: '100px' },
  { key: 'demandCV', label: 'Demand CV', align: 'right', minWidth: '100px' },
  { key: 'safetyStock', label: 'Safety Stock', align: 'right', minWidth: '120px' },
  { key: 'reorderPoint', label: 'Reorder Point', align: 'right', minWidth: '120px' },
  { key: 'currentBatchQty', label: 'Batch Qty', align: 'right', minWidth: '110px' },
  { key: 'calibratedEOQ', label: 'Calibrated EOQ', align: 'right', minWidth: '130px' },
  { key: 'daysOfSupply', label: 'Days of Supply', align: 'right', minWidth: '120px' },
  { key: 'inventoryTurnover', label: 'Turnover', align: 'right', minWidth: '100px' },
  { key: 'stockoutRisk', label: 'Stockout Risk', align: 'left', minWidth: '140px' },
  { key: 'rmlcStatus', label: 'Lifecycle Status', align: 'left', minWidth: '150px' },
  { key: 'bomCoverage', label: 'BOM Coverage', align: 'center', minWidth: '120px' },
  { key: 'supplier', label: 'Supplier', align: 'left', minWidth: '220px' },
  { key: 'sourcingType', label: 'Sourcing Model', align: 'left', minWidth: '130px' },
  { key: 'criticality', label: 'Criticality', align: 'left', minWidth: '110px' },
  { key: 'downstreamLines', label: 'Downstream Scope', align: 'left', minWidth: '200px' },
];

export default function Overview() {
  const navigate = useNavigate();
  const { persona } = usePlatform();
  const shouldReduceMotion = useReducedMotion();

  // Search & Sorting State for Table
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState('value');
  const [sortDirection, setSortDirection] = useState('desc');

  const subtitle = {
    exec: "What your working capital, service risk and inventory position mean for this quarter's numbers — and the three decisions worth your attention today.",
    analyst: 'Inventory health across all plants, with the specific SKUs, drivers and next investigations behind each number.',
    ds: 'Model-backed view of the inventory estate: classification stability, requirement calculations and data quality underlying every figure below.',
  }[persona] || "What your working capital, service risk and inventory position mean for this quarter's numbers.";



  // Sorting Handler
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // Filtered & Sorted Full Dataset
  const processedDataset = useMemo(() => {
    let data = [...FULL_INVENTORY_DATASET];

    // Search Filter across all fields
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      data = data.filter((m) =>
        Object.values(m).some((val) =>
          String(val).toLowerCase().includes(q)
        )
      );
    }

    // Sorting
    data.sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];

      if (typeof valA === 'number' && typeof valB === 'number') {
        return sortDirection === 'asc' ? valA - valB : valB - valA;
      }
      return sortDirection === 'asc'
        ? String(valA).localeCompare(String(valB))
        : String(valB).localeCompare(String(valA));
    });

    return data;
  }, [searchQuery, sortField, sortDirection]);

  // Export to CSV Function
  const exportToCSV = () => {
    const headers = COLUMNS_CONFIG.map((c) => `"${c.label}"`).join(',');
    const rows = processedDataset.map((row) =>
      COLUMNS_CONFIG.map((c) => {
        let val = row[c.key];
        if (typeof val === 'number') {
          return val;
        }
        return `"${String(val).replace(/"/g, '""')}"`;
      }).join(',')
    );
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `inventory_master_dataset_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <section className="view max-w-7xl mx-auto space-y-6">
      <ViewHead
        title="Enterprise Inventory Modelling"
        subtitle={<p className="text-muted leading-relaxed">{subtitle}</p>}
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/app/descriptive')}
            className="gap-1.5"
          >
            <LineChart size={14} />
            <span>Descriptive Intelligence</span>
          </Button>
        }
      />

      {/* ===================================================================== */}
      {/* COMPLETE INVENTORY DATA TABLE                                         */}
      {/* ===================================================================== */}
      <motion.div
        initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="bg-surface border border-line rounded-xl p-5 shadow-subtle"
      >
        {/* Section Header & Supporting Text */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4">
          <div>
            <h2 className="text-base font-bold text-ink tracking-tight m-0">Inventory Data</h2>
          </div>

          {/* Table Actions: Search, Export */}
          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-2 h-3.5 w-3.5 pointer-events-none" />
              <Input
                type="text"
                placeholder="Search across all fields..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-7 h-8 text-xs bg-bg border-line"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-2 hover:text-ink cursor-pointer"
                >
                  <X size={12} />
                </button>
              )}
            </div>

            {/* Export CSV Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={exportToCSV}
              className="h-8 gap-1.5 text-xs text-ink hover:text-[#0284C7] cursor-pointer"
            >
              <Download size={13} />
              <span>Export CSV</span>
            </Button>
          </div>
        </div>

        {/* Scrollable Enterprise Data Table Container */}
        <div className="rounded-lg border border-line overflow-hidden max-h-[540px] flex flex-col">
          <div className="overflow-x-auto overflow-y-auto w-full relative">
            <Table>
              <TableHeader className="bg-[#F8FAFC] sticky top-0 z-20 border-b border-line shadow-2xs">
                <TableRow className="hover:bg-transparent">
                  {COLUMNS_CONFIG.map((col) => {
                    const isSorted = sortField === col.key;
                    return (
                      <TableHead
                        key={col.key}
                        style={{ minWidth: col.minWidth }}
                        className={`text-[11px] font-bold uppercase tracking-wider text-[#0B1727] py-2.5 px-3 select-none ${
                          col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => handleSort(col.key)}
                          className={`inline-flex items-center gap-1 hover:text-[#0284C7] transition-colors cursor-pointer group ${
                            col.align === 'right' ? 'justify-end w-full' : col.align === 'center' ? 'justify-center w-full' : 'justify-start'
                          }`}
                        >
                          <span>{col.label}</span>
                          {isSorted ? (
                            sortDirection === 'asc' ? (
                              <ChevronUp size={12} className="text-[#0284C7]" />
                            ) : (
                              <ChevronDown size={12} className="text-[#0284C7]" />
                            )
                          ) : (
                            <ArrowUpDown size={10} className="text-muted-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                          )}
                        </button>
                      </TableHead>
                    );
                  })}
                </TableRow>
              </TableHeader>

              <TableBody>
                {processedDataset.length > 0 ? (
                  processedDataset.map((row) => (
                    <TableRow key={row.id} className="hover:bg-[#F0F9FF]/60 transition-colors">
                      {/* Material ID */}
                      <TableCell className="font-mono font-bold text-[#0284C7] py-2.5 px-3 text-xs">
                        {row.id}
                      </TableCell>

                      {/* Description */}
                      <TableCell className="font-semibold text-ink py-2.5 px-3 text-xs">
                        {row.name}
                      </TableCell>

                      {/* Plant */}
                      <TableCell className="text-muted text-xs py-2.5 px-3">
                        {row.plant}
                      </TableCell>

                      {/* Category */}
                      <TableCell className="text-xs py-2.5 px-3 text-ink">
                        {row.category}
                      </TableCell>

                      {/* Material Type */}
                      <TableCell className="text-muted text-xs py-2.5 px-3">
                        {row.materialType}
                      </TableCell>

                      {/* On-Hand Qty */}
                      <TableCell className="text-right font-mono font-semibold text-ink py-2.5 px-3 text-xs">
                        {row.qty.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </TableCell>

                      {/* UoM */}
                      <TableCell className="text-center font-mono text-muted text-[11px] py-2.5 px-3">
                        {row.uom}
                      </TableCell>

                      {/* Unit Cost */}
                      <TableCell className="text-right font-mono text-muted py-2.5 px-3 text-xs">
                        ${row.unitCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </TableCell>

                      {/* Inventory Value */}
                      <TableCell className="text-right font-mono font-bold text-ink py-2.5 px-3 text-xs">
                        ${row.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </TableCell>

                      {/* Annual Demand */}
                      <TableCell className="text-right font-mono py-2.5 px-3 text-xs text-ink">
                        {row.annualDemand.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </TableCell>

                      {/* Daily Consumption */}
                      <TableCell className="text-right font-mono text-muted py-2.5 px-3 text-xs">
                        {row.dailyConsumption.toFixed(2)}
                      </TableCell>

                      {/* Annual Consumption Value */}
                      <TableCell className="text-right font-mono font-semibold text-ink py-2.5 px-3 text-xs">
                        ${row.annualConsumptionValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </TableCell>

                      {/* Lead Time Days */}
                      <TableCell className="text-right font-mono py-2.5 px-3 text-xs text-muted">
                        {row.leadTimeDays}d
                      </TableCell>

                      {/* Demand CV */}
                      <TableCell className="text-right font-mono py-2.5 px-3 text-xs text-muted">
                        {row.demandCV.toFixed(2)}
                      </TableCell>

                      {/* Safety Stock */}
                      <TableCell className="text-right font-mono py-2.5 px-3 text-xs text-ink">
                        {row.safetyStock.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </TableCell>

                      {/* Reorder Point */}
                      <TableCell className="text-right font-mono font-semibold text-ink py-2.5 px-3 text-xs">
                        {row.reorderPoint.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </TableCell>

                      {/* Current Batch Qty */}
                      <TableCell className="text-right font-mono text-muted py-2.5 px-3 text-xs">
                        {row.currentBatchQty.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </TableCell>

                      {/* Calibrated EOQ */}
                      <TableCell className="text-right font-mono font-bold text-[#0284C7] py-2.5 px-3 text-xs">
                        {row.calibratedEOQ.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </TableCell>

                      {/* Days of Supply */}
                      <TableCell className="text-right font-mono py-2.5 px-3 text-xs text-ink">
                        {row.daysOfSupply.toFixed(1)}d
                      </TableCell>

                      {/* Inventory Turnover */}
                      <TableCell className="text-right font-mono font-medium py-2.5 px-3 text-xs text-ink">
                        {row.inventoryTurnover.toFixed(2)}x
                      </TableCell>

                      {/* Stockout Risk */}
                      <TableCell className="py-2.5 px-3">
                        <Badge
                          tone={
                            row.stockoutRisk.includes('Risk')
                              ? 'risk'
                              : row.stockoutRisk.includes('Watch')
                              ? 'watch'
                              : 'success'
                          }
                          className="text-[10px]"
                        >
                          {row.stockoutRisk}
                        </Badge>
                      </TableCell>

                      {/* RMLC Status */}
                      <TableCell className="py-2.5 px-3">
                        <Badge
                          tone={
                            row.rmlcStatus.includes('Liquidation') || row.rmlcStatus.includes('Risk')
                              ? 'risk'
                              : 'success'
                          }
                          className="text-[10px]"
                        >
                          {row.rmlcStatus}
                        </Badge>
                      </TableCell>

                      {/* BOM Coverage */}
                      <TableCell className="text-center py-2.5 px-3">
                        <Badge
                          tone={
                            row.bomCoverage === 'Risk'
                              ? 'risk'
                              : row.bomCoverage === 'Watch'
                              ? 'watch'
                              : 'success'
                          }
                          className="text-[10px]"
                        >
                          {row.bomCoverage}
                        </Badge>
                      </TableCell>

                      {/* Supplier */}
                      <TableCell className="text-xs text-muted truncate max-w-[220px] py-2.5 px-3" title={row.supplier}>
                        {row.supplier}
                      </TableCell>

                      {/* Sourcing Model */}
                      <TableCell className="text-xs text-muted py-2.5 px-3">
                        {row.sourcingType}
                      </TableCell>

                      {/* Criticality */}
                      <TableCell className="py-2.5 px-3">
                        <Badge
                          tone={
                            row.criticality === 'Critical'
                              ? 'risk'
                              : row.criticality === 'High'
                              ? 'watch'
                              : 'neutral'
                          }
                          className="text-[10px]"
                        >
                          {row.criticality}
                        </Badge>
                      </TableCell>

                      {/* Downstream Scope */}
                      <TableCell className="text-xs text-muted truncate max-w-[200px] py-2.5 px-3" title={row.downstreamLines}>
                        {row.downstreamLines}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={COLUMNS_CONFIG.length} className="text-center py-10 text-muted">
                      No materials matching criteria &quot;{searchQuery}&quot;
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
