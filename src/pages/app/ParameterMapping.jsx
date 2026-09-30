import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Search,
  X,
  GripVertical,
  Plus,
  Trash2,
  Check,
  AlertCircle,
  Layers,
  Database,
  Lock,
  Sparkles,
  Filter,
} from 'lucide-react';
import { toast } from 'sonner';
import OnboardingShell from '../../components/layout/OnboardingShell';
import { Badge, AlertBar } from '../../components/CommonUI';
import { Button } from '@/components/ui/button';
import { usePlatform } from '../../context/PlatformContext';
import { cn } from '@/lib/utils';
import {
  DEPENDENT_VARIABLES,
  PARAMETER_CATALOG,
  SOURCE_OPTIONS,
  SOURCE_TABLE_OPTIONS,
  getAllAvailableColumns,
  requiredConnectors,
} from '../../data/parameterCatalog';

export default function ParameterMapping() {
  const navigate = useNavigate();
  const { selectedMaterial, parameterSelection, setParameterSelection } = usePlatform();
  const { rows } = parameterSelection;

  const [searchQuery, setSearchQuery] = useState('');
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [validationTriggered, setValidationTriggered] = useState(false);

  // All catalog items
  const allColumns = useMemo(() => getAllAvailableColumns(), []);

  // Update a single parameter's mapping properties
  const updateRow = (id, patch) => {
    const currentRow = rows[id] || { on: false, source: '', table: '' };
    setParameterSelection({
      ...parameterSelection,
      rows: {
        ...rows,
        [id]: {
          ...currentRow,
          ...patch,
        },
      },
    });
  };

  // Add/select a column to the mapped list
  const handleSelectColumn = (id) => {
    const item = allColumns.find((c) => c.id === id);
    if (!item) return;

    const defaultSource = item.source || 'SAP';
    const defaultTable =
      item.table || (SOURCE_TABLE_OPTIONS[defaultSource] ? SOURCE_TABLE_OPTIONS[defaultSource][0] : '');

    const currentRow = rows[id];
    updateRow(id, {
      on: true,
      source: currentRow?.source || defaultSource,
      table: currentRow?.table || defaultTable,
    });
  };

  // Remove a column from the mapped list (returns to available)
  const handleRemoveColumn = (id) => {
    // Stock is required and cannot be removed
    if (id === 'stock') return;
    updateRow(id, { on: false });
  };

  // Handle source system change (updates cascading tables)
  const handleSourceChange = (id, newSource) => {
    const availableTables = SOURCE_TABLE_OPTIONS[newSource] || [];
    const currentTable = rows[id]?.table;
    const isTableValid = availableTables.includes(currentTable);

    updateRow(id, {
      source: newSource,
      table: isTableValid ? currentTable : (availableTables[0] || ''),
    });
  };

  // Handle table change
  const handleTableChange = (id, newTable) => {
    updateRow(id, { table: newTable });
  };

  // Drag and Drop handlers
  const handleDragStart = (e, item) => {
    e.dataTransfer.setData('text/plain', item.id);
    e.dataTransfer.effectAllowed = 'copy';
  };

  // Filtered available items for the left panel
  const q = searchQuery.trim().toLowerCase();

  const filteredDependent = useMemo(() => {
    return DEPENDENT_VARIABLES.filter(
      (v) => !q || v.label.toLowerCase().includes(q) || v.id.toLowerCase().includes(q)
    );
  }, [q]);

  const filteredIndependentGroups = useMemo(() => {
    return PARAMETER_CATALOG.map((group) => {
      const matchedItems = group.items.filter(
        (p) =>
          !q ||
          p.label.toLowerCase().includes(q) ||
          p.id.toLowerCase().includes(q) ||
          group.category.toLowerCase().includes(q)
      );
      return {
        ...group,
        items: matchedItems,
      };
    });
  }, [q]);

  // Selected items on the right side
  const selectedItems = useMemo(() => {
    return allColumns.filter((item) => {
      const r = rows[item.id];
      // Stock is always required
      if (item.id === 'stock') return true;
      return r && r.on;
    });
  }, [allColumns, rows]);

  // Validation status
  const incompleteItems = useMemo(() => {
    return selectedItems.filter((item) => {
      const r = rows[item.id];
      return !r || !r.source || !r.table;
    });
  }, [selectedItems, rows]);

  // Connectors needed for the selected sources
  const neededConnectors = useMemo(() => requiredConnectors(rows), [rows]);

  // Continue action
  const handleContinue = () => {
    setValidationTriggered(true);

    if (incompleteItems.length > 0) {
      toast.error(
        `Please select a Source System and Table for: ${incompleteItems
          .slice(0, 2)
          .map((i) => i.label)
          .join(', ')}${incompleteItems.length > 2 ? ` and ${incompleteItems.length - 2} others` : ''}.`
      );
      // Scroll to first invalid card
      const firstInvalid = incompleteItems[0];
      if (firstInvalid) {
        const el = document.getElementById(`mapping-card-${firstInvalid.id}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
      return;
    }

    // All mappings are valid
    navigate('/data-sources');
  };

  const totalAvailableCount = allColumns.length;
  const totalSelectedCount = selectedItems.length;

  return (
    <OnboardingShell current={2}>
      <div className="onb-card !p-6 sm:!p-8">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 pb-5 border-b border-border">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-ink">
              Column Mapping
            </h1>
            <p className="sub !text-sm text-body-c !mt-1 !mb-0">
              Select the columns required for your analysis on{' '}
              <strong className="text-ink font-semibold">
                {selectedMaterial.id} · {selectedMaterial.name}
              </strong>{' '}
              and map each column to its source and table.
            </p>
          </div>
          <div className="flex items-center gap-2.5 shrink-0">
            <Badge tone="accent" className="text-xs font-semibold py-1 px-3">
              {totalSelectedCount} of {totalAvailableCount} columns selected
            </Badge>
            {validationTriggered && incompleteItems.length > 0 && (
              <Badge tone="warning" className="text-xs font-semibold py-1 px-3">
                {incompleteItems.length} incomplete
              </Badge>
            )}
          </div>
        </div>

        {/* Incomplete Mapping Banner (if validation failed) */}
        {validationTriggered && incompleteItems.length > 0 && (
          <AlertBar
            tone="warning"
            title="Incomplete column mappings detected"
            className="mb-6"
          >
            Please choose a valid Source System and Table for{' '}
            <strong>{incompleteItems.map((i) => i.label).join(', ')}</strong> before proceeding to data sources.
          </AlertBar>
        )}

        {/* TWO-SIDE WORKSPACE */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* ============================================================ */}
          {/* LEFT SIDE: AVAILABLE COLUMNS */}
          {/* ============================================================ */}
          <div className="lg:col-span-5 flex flex-col bg-surface border border-border rounded-lg shadow-sm overflow-hidden">
            {/* Left Header */}
            <div className="p-4 border-b border-border bg-deep/30 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold uppercase tracking-wider text-ink font-display flex items-center gap-2">
                    Available Columns
                  </h2>
                  <p className="text-xs text-subtle mt-0.5">
                    Drag or click columns to add to your model
                  </p>
                </div>
                <Badge tone="neutral" className="text-xs font-mono">
                  {totalAvailableCount} Total
                </Badge>
              </div>

              {/* Search Field */}
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-subtle pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search columns..."
                  className="w-full bg-bg border border-border-strong rounded-md pl-8 pr-8 py-2 text-xs text-ink placeholder:text-subtle focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                  aria-label="Search available columns"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-subtle hover:text-ink p-0.5 rounded"
                    aria-label="Clear search"
                  >
                    <X size={13} />
                  </button>
                )}
              </div>
            </div>

            {/* Left Content List */}
            <div className="p-4 space-y-6 max-h-[620px] overflow-y-auto">
              {/* SECTION 1: DEPENDENT VARIABLES */}
              {filteredDependent.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between pb-1 border-b border-border/70">
                    <span className="text-[11px] font-bold uppercase tracking-widest text-primary font-mono">
                      Dependent Variables
                    </span>
                    <span className="text-[10px] uppercase font-semibold text-subtle">
                      Target Variable
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    {filteredDependent.map((item) => {
                      const isSelected = rows[item.id]?.on ?? true;
                      return (
                        <div
                          key={item.id}
                          draggable={!isSelected}
                          onDragStart={(e) => handleDragStart(e, item)}
                          onClick={() => !isSelected && handleSelectColumn(item.id)}
                          className={cn(
                            'group flex items-center justify-between p-3 rounded-md border text-xs transition-all select-none',
                            isSelected
                              ? 'bg-muted-fill/30 border-border opacity-75 cursor-default'
                              : 'bg-surface border-border hover:border-primary hover:bg-bg/80 hover:shadow-subtle cursor-grab active:cursor-grabbing'
                          )}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <GripVertical
                              size={14}
                              className={isSelected ? 'text-subtle/40' : 'text-subtle group-hover:text-primary'}
                            />
                            <div className="min-w-0">
                              <span className="font-bold text-ink block truncate">{item.label}</span>
                              <span className="text-[11px] text-subtle block truncate">{item.note}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <Badge tone="accent" className="text-[10px] py-0.5 px-1.5 uppercase font-semibold">
                              Required
                            </Badge>
                            {isSelected ? (
                              <span className="text-[11px] font-medium text-success flex items-center gap-0.5 ml-1">
                                <Check size={12} /> Mapped
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSelectColumn(item.id);
                                }}
                                className="p-1 rounded text-subtle hover:text-primary hover:bg-primary/10 transition-colors"
                                title={`Add ${item.label}`}
                              >
                                <Plus size={14} />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* SECTION 2: INDEPENDENT VARIABLES */}
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-1 border-b border-border/70">
                  <span className="text-[11px] font-bold uppercase tracking-widest text-subtle font-mono">
                    Independent Variables
                  </span>
                  <span className="text-[10px] uppercase font-semibold text-subtle">
                    Candidate Drivers
                  </span>
                </div>

                {filteredIndependentGroups.map((group) => {
                  if (group.items.length === 0) return null;
                  return (
                    <div key={group.category} className="space-y-1.5">
                      <div className="text-[11px] font-semibold text-ink/75 flex items-center justify-between px-0.5 pt-1">
                        <span>{group.category}</span>
                        <span className="text-[10px] text-subtle font-mono">{group.items.length}</span>
                      </div>
                      <div className="space-y-1.5">
                        {group.items.map((item) => {
                          const isSelected = rows[item.id]?.on;
                          return (
                            <div
                              key={item.id}
                              draggable={!isSelected}
                              onDragStart={(e) => handleDragStart(e, item)}
                              onClick={() => !isSelected && handleSelectColumn(item.id)}
                              className={cn(
                                'group flex items-center justify-between p-2.5 rounded-md border text-xs transition-all select-none',
                                isSelected
                                  ? 'bg-muted-fill/30 border-border opacity-60 cursor-default'
                                  : 'bg-surface border-border hover:border-primary hover:bg-bg/80 hover:shadow-subtle cursor-grab active:cursor-grabbing'
                              )}
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <GripVertical
                                  size={14}
                                  className={isSelected ? 'text-subtle/40' : 'text-subtle group-hover:text-primary'}
                                />
                                <div className="min-w-0">
                                  <span className="font-semibold text-ink block truncate">{item.label}</span>
                                  {item.note && (
                                    <span className="text-[10px] text-subtle block truncate">{item.note}</span>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0">
                                {isSelected ? (
                                  <span className="text-[11px] font-medium text-success flex items-center gap-0.5">
                                    <Check size={12} /> Mapped
                                  </span>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleSelectColumn(item.id);
                                    }}
                                    className="p-1 rounded text-subtle hover:text-primary hover:bg-primary/10 transition-colors"
                                    title={`Add ${item.label}`}
                                  >
                                    <Plus size={14} />
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}

                {filteredIndependentGroups.every((g) => g.items.length === 0) && (
                  <div className="text-center py-8 text-subtle text-xs">
                    No variables found matching "{searchQuery}"
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ============================================================ */}
          {/* RIGHT SIDE: SELECTED / MAPPED COLUMNS */}
          {/* ============================================================ */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              e.dataTransfer.dropEffect = 'copy';
              setIsDraggingOver(true);
            }}
            onDragEnter={(e) => {
              e.preventDefault();
              setIsDraggingOver(true);
            }}
            onDragLeave={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget)) {
                setIsDraggingOver(false);
              }
            }}
            onDrop={(e) => {
              e.preventDefault();
              setIsDraggingOver(false);
              const id = e.dataTransfer.getData('text/plain');
              if (id) {
                handleSelectColumn(id);
              }
            }}
            className={cn(
              'lg:col-span-7 flex flex-col bg-surface border rounded-lg shadow-sm overflow-hidden transition-all',
              isDraggingOver
                ? 'border-primary ring-2 ring-primary/40 bg-primary/5 border-dashed'
                : 'border-border'
            )}
          >
            {/* Right Header */}
            <div className="p-4 border-b border-border bg-deep/30 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold uppercase tracking-wider text-ink font-display flex items-center gap-2">
                  Selected Columns
                </h2>
                <p className="text-xs text-subtle mt-0.5">
                  Configure Source System and Table for each selected column
                </p>
              </div>
              <Badge tone="accent" className="text-xs font-semibold font-mono">
                {selectedItems.length} Mapped
              </Badge>
            </div>

            {/* Right Content / Drop Zone */}
            <div className="p-4 space-y-2.5 max-h-[620px] overflow-y-auto">
              {/* Header labels for single-line mapping table */}
              {selectedItems.length > 0 && (
                <div className="hidden sm:flex items-center gap-3 px-3.5 pb-1 text-[10px] font-bold uppercase tracking-wider text-subtle font-mono">
                  <div className="min-w-[150px] sm:w-44 shrink-0">Column / Variable</div>
                  <div className="flex-1 min-w-[120px]">Source System</div>
                  <div className="flex-1 min-w-[120px]">Table</div>
                  <div className="shrink-0 w-20 text-right">Action</div>
                </div>
              )}

              {selectedItems.map((item) => {
                const row = rows[item.id] || {};
                const isStock = item.id === 'stock';
                const availableTables = SOURCE_TABLE_OPTIONS[row.source] || [];
                const isSourceMissing = validationTriggered && !row.source;
                const isTableMissing = validationTriggered && !row.table;
                const hasError = isSourceMissing || isTableMissing;

                return (
                  <div
                    key={item.id}
                    id={`mapping-card-${item.id}`}
                    className={cn(
                      'p-2.5 sm:px-3.5 rounded-lg border bg-bg/60 transition-all flex flex-col sm:flex-row sm:items-center gap-2.5 sm:gap-3',
                      hasError
                        ? 'border-error ring-1 ring-error/40 bg-error-bg/10'
                        : 'border-border hover:border-border-strong hover:bg-bg/80 shadow-sm'
                    )}
                  >
                    {/* 1. Column Name + Badge */}
                    <div className="flex items-center gap-2 min-w-[150px] sm:w-44 shrink-0">
                      <span className="font-bold text-ink text-xs sm:text-sm tracking-tight truncate" title={item.label}>
                        {item.label}
                      </span>
                      {isStock ? (
                        <Badge tone="accent" className="text-[9px] py-0 px-1.5 uppercase font-semibold shrink-0">
                          Req
                        </Badge>
                      ) : (
                        <Badge tone="neutral" className="text-[9px] py-0 px-1.5 uppercase shrink-0">
                          {item.groupCategory?.split('&')[0]?.trim() || item.category || 'Driver'}
                        </Badge>
                      )}
                    </div>

                    {/* 2. Source System Dropdown */}
                    <div className="flex-1 min-w-[120px]">
                      <select
                        className={cn(
                          'field-input text-xs py-1.5 px-2.5 rounded-md transition-colors w-full h-8',
                          isSourceMissing && 'border-error focus:ring-error focus:border-error'
                        )}
                        aria-label={`Source System for ${item.label}`}
                        value={row.source || ''}
                        onChange={(e) => handleSourceChange(item.id, e.target.value)}
                      >
                        <option value="">Select Source ▼</option>
                        {SOURCE_OPTIONS.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* 3. Table Dropdown */}
                    <div className="flex-1 min-w-[120px]">
                      <select
                        className={cn(
                          'field-input text-xs py-1.5 px-2.5 rounded-md transition-colors w-full h-8',
                          isTableMissing && 'border-error focus:ring-error focus:border-error'
                        )}
                        aria-label={`Table for ${item.label}`}
                        value={row.table || ''}
                        disabled={!row.source}
                        onChange={(e) => handleTableChange(item.id, e.target.value)}
                      >
                        <option value="">
                          {row.source ? 'Select Table ▼' : 'Select Source first'}
                        </option>
                        {availableTables.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* 4. Action (Remove / Mandatory) */}
                    <div className="shrink-0 w-20 flex justify-end items-center">
                      {isStock ? (
                        <span className="text-[11px] text-subtle font-medium flex items-center gap-1">
                          <Lock size={11} /> Mandatory
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleRemoveColumn(item.id)}
                          className="text-xs text-subtle hover:text-error flex items-center gap-1 font-medium transition-colors py-1 px-2 rounded hover:bg-error-bg"
                          title={`Remove ${item.label} from mapping`}
                        >
                          <Trash2 size={12} />
                          <span>Remove</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Drag Prompt / Helper */}
              {selectedItems.length <= 1 && (
                <div className="border border-dashed border-border rounded-lg p-6 text-center bg-bg/20 space-y-2">
                  <Layers size={24} className="mx-auto text-subtle opacity-70" />
                  <p className="text-xs font-semibold text-ink">Drag additional columns here</p>
                  <p className="text-[11px] text-subtle max-w-sm mx-auto">
                    Pick candidate drivers like Price, Quality, Seasonality, or Lead Time from the Available Columns panel on the left to include them in your model.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer Navigation Bar */}
        <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-6 border-t border-border mt-6">
          <Button
            variant="outline"
            onClick={() => navigate('/material-selection')}
            className="gap-1.5 justify-center sm:justify-start"
          >
            <ArrowLeft size={14} aria-hidden="true" /> Back
          </Button>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
            <span className="text-[12.5px] sm:text-[13px] text-subtle text-center sm:text-left" data-testid="needed-sources">
              {neededConnectors.length === 0
                ? 'No sources needed yet.'
                : `Next you connect: ${neededConnectors.map((n) => n.label).join(', ')}.`}
            </span>

            <Button onClick={handleContinue} className="gap-1.5 justify-center">
              Continue to data sources <ArrowRight size={14} aria-hidden="true" />
            </Button>
          </div>
        </div>
      </div>
    </OnboardingShell>
  );
}
