import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, CalendarRange } from 'lucide-react';
import OnboardingShell from '../../components/layout/OnboardingShell';
import { Badge, AlertBar } from '../../components/CommonUI';
import { Button } from '@/components/ui/button';
import { usePlatform } from '../../context/PlatformContext';
import {
  PARAMETER_CATALOG,
  SOURCE_OPTIONS,
  RANGE_YEARS,
  requiredConnectors,
  effectiveRange,
  formatRange,
  isRangeValid,
} from '../../data/parameterCatalog';

// Screen C: pick which candidate parameters apply, declare a source for each, and bound the ingestion window.
// Nothing is connected yet: the next step connects only the sources these choices need.
//
// Date range: the design bible declares one ingestion range per material (§6.3 step 4, Screen C). That range is the
// default here. Because history often differs by source (some go back to 2010, others only to 2020), each parameter
// can also override it.

export default function ParameterMapping() {
  const navigate = useNavigate();
  const { selectedMaterial, parameterSelection, setParameterSelection } = usePlatform();
  const { rows, fromYear, toYear } = parameterSelection;
  const [openRange, setOpenRange] = useState(null); // id of the parameter whose range is being edited

  const total = PARAMETER_CATALOG.reduce((n, g) => n + g.items.length, 0);
  const selected = useMemo(() => Object.values(rows).filter((r) => r.on).length, [rows]);
  const missingSource = useMemo(
    () => PARAMETER_CATALOG.flatMap((g) => g.items).filter((p) => rows[p.id].on && !rows[p.id].source),
    [rows]
  );

  const needed = useMemo(() => requiredConnectors(rows), [rows]);

  const update = (id, patch) =>
    setParameterSelection({ ...parameterSelection, rows: { ...rows, [id]: { ...rows[id], ...patch } } });
  const setDefaultRange = (patch) => setParameterSelection({ ...parameterSelection, ...patch });

  const allItems = useMemo(() => PARAMETER_CATALOG.flatMap((g) => g.items), []);
  const customRanges = allItems.filter((p) => rows[p.id].on && (rows[p.id].from || rows[p.id].to));
  const badRanges = allItems.filter((p) => rows[p.id].on && !isRangeValid(effectiveRange(rows[p.id], parameterSelection)));
  const defaultValid = isRangeValid({ from: fromYear, to: toYear });

  return (
    <OnboardingShell current={2}>
      <div className="onb-card">
        <h1>Choose your parameters</h1>
        <p className="sub">
          These are the drivers the model can use for <strong>{selectedMaterial.id} · {selectedMaterial.name}</strong>. Keep the ones that
          apply to your operation and say where each comes from.
        </p>

        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <Badge tone="accent">{selected} of {total} selected</Badge>
          <div className="flex flex-wrap items-center gap-2 text-[13px] font-semibold text-ink" role="group" aria-label="Default data range">
            Default data range
            <select
              className="field-input"
              style={{ width: 'auto', padding: '6px 10px' }}
              aria-label="Default range from"
              value={fromYear}
              onChange={(e) => setDefaultRange({ fromYear: e.target.value })}
            >
              {RANGE_YEARS.filter((y) => toYear === 'today' || Number(y) <= Number(toYear)).map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
            <span className="font-normal text-subtle">to</span>
            <select
              className="field-input"
              style={{ width: 'auto', padding: '6px 10px' }}
              aria-label="Default range to"
              value={toYear}
              onChange={(e) => setDefaultRange({ toYear: e.target.value })}
            >
              <option value="today">Today</option>
              {RANGE_YEARS.filter((y) => Number(y) >= Number(fromYear)).map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        </div>

        <p className="text-xs text-subtle" style={{ margin: '-6px 0 14px' }}>
          Applies to every parameter unless you change it below. {customRanges.length > 0 ? `${customRanges.length === 1 ? '1 parameter uses its own range.' : `${customRanges.length} parameters use their own range.`}` : 'Some sources hold less history than others; set a range on a parameter to match.'}
        </p>

        {(badRanges.length > 0 || !defaultValid) && (
          <AlertBar tone="error" title="A data range ends before it starts">
            Fix the range for {badRanges.slice(0, 3).map((p) => p.label).join(', ') || 'the default range'}{badRanges.length > 3 ? ' and others' : ''}.
          </AlertBar>
        )}

        {missingSource.length > 0 && (
          <AlertBar tone="warning" title={`${missingSource.length} selected ${missingSource.length === 1 ? 'parameter has' : 'parameters have'} no source`}>
            Choose a source for {missingSource.slice(0, 3).map((p) => p.label).join(', ')}{missingSource.length > 3 ? ' and others' : ''}, or untick them.
          </AlertBar>
        )}

        <div className="params">
          {PARAMETER_CATALOG.map((group) => (
            <section key={group.category} className="params__group" aria-label={group.category}>
              <h2 className="params__title">
                {group.category}
                <span>{group.items.filter((p) => rows[p.id].on).length} / {group.items.length}</span>
              </h2>
              <div className="params__head" aria-hidden="true">
                <span>Parameter</span>
                <span>Source</span>
                <span>Data range</span>
              </div>
              {group.items.map((p) => {
                const r = rows[p.id];
                const eff = effectiveRange(r, parameterSelection);
                const custom = Boolean(r.from || r.to);
                const valid = isRangeValid(eff);
                return (
                  <div key={p.id} className="params__row">
                    <label className="params__label">
                      <input type="checkbox" checked={r.on} onChange={(e) => update(p.id, { on: e.target.checked })} style={{ accentColor: 'var(--primary)' }} />
                      <span>
                        {p.label}
                        {!r.on && p.note && <span className="params__note">{p.note}</span>}
                      </span>
                    </label>
                    <select
                      className="field-input params__source"
                      aria-label={`Source for ${p.label}`}
                      value={r.source}
                      disabled={!r.on}
                      onChange={(e) => update(p.id, { source: e.target.value })}
                    >
                      <option value="">{r.on ? 'Choose source…' : 'n/a'}</option>
                      {SOURCE_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>

                    {r.on && (
                      <div className={`params__range ${openRange === p.id ? 'params__range--open' : ''}`}>
                        {openRange === p.id ? (
                          <div className="params__range-edit">
                            <span>From</span>
                            <select
                              className="field-input params__range-select"
                              aria-label={`Range from for ${p.label}`}
                              value={eff.from}
                              onChange={(e) => update(p.id, { from: e.target.value })}
                            >
                              {RANGE_YEARS.filter((y) => eff.to === 'today' || Number(y) <= Number(eff.to)).map((y) => <option key={y} value={y}>{y}</option>)}
                            </select>
                            <span>to</span>
                            <select
                              className="field-input params__range-select"
                              aria-label={`Range to for ${p.label}`}
                              value={eff.to}
                              onChange={(e) => update(p.id, { to: e.target.value })}
                            >
                              <option value="today">Today</option>
                              {RANGE_YEARS.filter((y) => Number(y) >= Number(eff.from)).map((y) => <option key={y} value={y}>{y}</option>)}
                            </select>
                            {custom && (
                              <button type="button" className="params__range-link" onClick={() => update(p.id, { from: undefined, to: undefined })}>
                                Use default
                              </button>
                            )}
                            <button type="button" className="params__range-link" onClick={() => setOpenRange(null)}>Done</button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            className={`params__range-btn ${custom ? 'params__range-btn--custom' : ''} ${valid ? '' : 'params__range-btn--bad'}`}
                            aria-label={`Change data range for ${p.label}, currently ${formatRange(eff)}`}
                            onClick={() => setOpenRange(p.id)}
                          >
                            <CalendarRange size={13} aria-hidden="true" />
                            {formatRange(eff)}{custom ? ' · custom' : ''}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </section>
          ))}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-5">
          <Button variant="outline" onClick={() => navigate('/material-selection')} className="gap-1.5">
            <ArrowLeft size={14} aria-hidden="true" /> Back
          </Button>
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-[13px] text-subtle" data-testid="needed-sources">
              {needed.length === 0
                ? 'No sources needed yet.'
                : `Next you connect: ${needed.map((n) => n.label).join(', ')}.`}
            </span>
            <Button onClick={() => navigate('/data-sources')} disabled={missingSource.length > 0 || badRanges.length > 0 || !defaultValid} className="gap-1.5">
              Continue to data sources <ArrowRight size={14} aria-hidden="true" />
            </Button>
          </div>
        </div>
      </div>
    </OnboardingShell>
  );
}
