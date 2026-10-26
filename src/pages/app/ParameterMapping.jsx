import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, CalendarRange, GripVertical, Lock, Plus, Search, X } from 'lucide-react';
import OnboardingShell from '../../components/layout/OnboardingShell';
import { Badge, AlertBar } from '../../components/CommonUI';
import { Button } from '@/components/ui/button';
import { usePlatform } from '../../context/PlatformContext';
import {
  DEPENDENT_VARIABLE,
  INDEPENDENT_VARIABLES,
  SOURCE_OPTIONS,
  RANGE_YEARS,
  requiredConnectors,
  effectiveRange,
  formatRange,
  isRangeValid,
} from '../../data/parameterCatalog';

// Screen C, as a two-section wizard.
//   1. Choose variables: base_stock is the fixed dependent variable; the user drags the independents that apply
//      into the model (or adds them with the + button).
//   2. Data source details: a source and a data range for every variable in the model.
// Nothing is connected yet: the next step connects only the sources these choices need.
//
// Date range: the design bible declares one ingestion range per material (§6.3 step 4, Screen C). That range is the
// default here. Because history often differs by source (some go back to 2010, others only to 2020), each variable
// can also override it.

const SECTIONS = ['Choose variables', 'Data source details'];
const DRAG_TYPE = 'text/plain';

export default function ParameterMapping() {
  const navigate = useNavigate();
  const { selectedMaterial, parameterSelection, setParameterSelection } = usePlatform();
  const { rows, fromYear, toYear } = parameterSelection;
  const [section, setSection] = useState(1);

  const update = (id, patch) =>
    setParameterSelection({ ...parameterSelection, rows: { ...rows, [id]: { ...rows[id], ...patch } } });
  const setMany = (ids, on) => {
    const next = { ...rows };
    ids.forEach((id) => { next[id] = { ...next[id], on }; });
    setParameterSelection({ ...parameterSelection, rows: next });
  };

  const chosen = INDEPENDENT_VARIABLES.filter((v) => rows[v.id].on);

  return (
    <OnboardingShell current={2}>
      <div className="onb-card">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1>{section === 1 ? 'Choose your variables' : 'Where does each variable come from?'}</h1>
            <p className="sub">
              {section === 1 ? (
                <>The model predicts <strong className="mono">{DEPENDENT_VARIABLE.id}</strong> for <strong>{selectedMaterial.id} · {selectedMaterial.name}</strong>. Drag the drivers that apply to your operation into the model.</>
              ) : (
                <>Give a source and a data range for each variable in the model for <strong>{selectedMaterial.id} · {selectedMaterial.name}</strong>.</>
              )}
            </p>
          </div>
          <ol className="wiz" aria-label="Parameter mapping sections">
            {SECTIONS.map((label, i) => (
              <li key={label} className={`wiz__step ${section === i + 1 ? 'wiz__step--current' : ''} ${section > i + 1 ? 'wiz__step--done' : ''}`} aria-current={section === i + 1 ? 'step' : undefined}>
                <span className="wiz__num">{i + 1}</span>{label}
              </li>
            ))}
          </ol>
        </div>

        {section === 1 ? (
          <ChooseVariables rows={rows} chosen={chosen} setMany={setMany} onBack={() => navigate('/material-selection')} onNext={() => setSection(2)} />
        ) : (
          <SourceDetails
            rows={rows}
            chosen={chosen}
            fromYear={fromYear}
            toYear={toYear}
            parameterSelection={parameterSelection}
            update={update}
            setDefaultRange={(patch) => setParameterSelection({ ...parameterSelection, ...patch })}
            onBack={() => setSection(1)}
            onConfirm={() => navigate('/data-sources')}
          />
        )}
      </div>
    </OnboardingShell>
  );
}

// ---- Section 1: available variables on the left, the model on the right ----
function ChooseVariables({ rows, chosen, setMany, onBack, onNext }) {
  const [query, setQuery] = useState('');
  const [over, setOver] = useState(null); // 'left' | 'right' while something is dragged over that column

  const q = query.trim().toLowerCase().replace(/\s+/g, '_');
  const available = INDEPENDENT_VARIABLES.filter((v) => !rows[v.id].on && (!q || v.id.includes(q)));

  const dropProps = (side) => ({
    onDragOver: (e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; if (over !== side) setOver(side); },
    onDragLeave: (e) => { if (!e.currentTarget.contains(e.relatedTarget)) setOver(null); },
    onDrop: (e) => {
      e.preventDefault();
      setOver(null);
      const id = e.dataTransfer.getData(DRAG_TYPE);
      if (id && rows[id] && id !== DEPENDENT_VARIABLE.id) setMany([id], side === 'right');
    },
  });

  return (
    <>
      <div className="vars">
        <section className={`vars__panel ${over === 'left' ? 'vars__panel--over' : ''}`} aria-label="Available variables" {...dropProps('left')}>
          <h2 className="vars__title">Available variables</h2>

          <h3 className="vars__label">Dependent</h3>
          <LockedVariable note="Fixed · always in the model" />

          <div className="vars__label-row">
            <h3 className="vars__label">Independent <span>{available.length}</span></h3>
            <button type="button" className="params__range-link" disabled={available.length === 0} onClick={() => setMany(available.map((v) => v.id), true)}>
              Add all{q ? ' shown' : ''}
            </button>
          </div>
          <label className="vars__search">
            <Search size={14} aria-hidden="true" />
            <input type="search" placeholder="Search variables" aria-label="Search independent variables" value={query} onChange={(e) => setQuery(e.target.value)} />
          </label>
          <ul className="vars__list">
            {available.map((v) => (
              <VariableItem key={v.id} id={v.id} action="add" onAction={() => setMany([v.id], true)} />
            ))}
            {available.length === 0 && (
              <li className="vars__empty">{q ? 'No variable matches your search.' : 'Every independent variable is in the model.'}</li>
            )}
          </ul>
        </section>

        <section className={`vars__panel vars__panel--model ${over === 'right' ? 'vars__panel--over' : ''}`} aria-label="Model variables" {...dropProps('right')}>
          <h2 className="vars__title">Model variables</h2>

          <h3 className="vars__label">Dependent</h3>
          <LockedVariable note="Predicted by the model" />

          <div className="vars__label-row">
            <h3 className="vars__label">Independent <span>{chosen.length}</span></h3>
            {chosen.length > 0 && (
              <button type="button" className="params__range-link" onClick={() => setMany(chosen.map((v) => v.id), false)}>Clear</button>
            )}
          </div>
          <ul className="vars__list vars__list--drop">
            {chosen.map((v) => (
              <VariableItem key={v.id} id={v.id} action="remove" onAction={() => setMany([v.id], false)} />
            ))}
            {chosen.length === 0 && (
              <li className="vars__dropzone">Drag independent variables here, or use + on the left.</li>
            )}
          </ul>
        </section>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 pt-5">
        <Button variant="outline" onClick={onBack} className="gap-1.5">
          <ArrowLeft size={14} aria-hidden="true" /> Back
        </Button>
        <div className="flex flex-wrap items-center gap-3">
          <Badge tone="accent">{chosen.length} of {INDEPENDENT_VARIABLES.length} independent selected</Badge>
          <Button onClick={onNext} disabled={chosen.length === 0} className="gap-1.5">
            Next: data source details <ArrowRight size={14} aria-hidden="true" />
          </Button>
        </div>
      </div>
    </>
  );
}

function LockedVariable({ note }) {
  return (
    <div className="vars__item vars__item--locked">
      <Lock size={13} aria-hidden="true" />
      <span className="vars__name mono">{DEPENDENT_VARIABLE.id}</span>
      <span className="vars__note">{note}</span>
    </div>
  );
}

function VariableItem({ id, action, onAction }) {
  const add = action === 'add';
  return (
    <li
      className="vars__item"
      draggable
      onDragStart={(e) => { e.dataTransfer.setData(DRAG_TYPE, id); e.dataTransfer.effectAllowed = 'move'; }}
    >
      <GripVertical size={14} className="vars__grip" aria-hidden="true" />
      <span className="vars__name mono">{id}</span>
      <button type="button" className="vars__btn" onClick={onAction} aria-label={add ? `Add ${id} to the model` : `Remove ${id} from the model`}>
        {add ? <Plus size={14} aria-hidden="true" /> : <X size={14} aria-hidden="true" />}
      </button>
    </li>
  );
}

// ---- Section 2: a source and a data range for every variable in the model ----
function SourceDetails({ rows, chosen, fromYear, toYear, parameterSelection, update, setDefaultRange, onBack, onConfirm }) {
  const [openRange, setOpenRange] = useState(null); // id of the variable whose range is being edited

  const inModel = useMemo(() => [DEPENDENT_VARIABLE, ...chosen], [chosen]);
  const missingSource = inModel.filter((v) => !rows[v.id].source);
  const customRanges = inModel.filter((v) => rows[v.id].from || rows[v.id].to);
  const badRanges = inModel.filter((v) => !isRangeValid(effectiveRange(rows[v.id], parameterSelection)));
  const defaultValid = isRangeValid({ from: fromYear, to: toYear });
  const needed = useMemo(() => requiredConnectors(rows), [rows]);

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <Badge tone="accent">{inModel.length} variables in the model</Badge>
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
        Applies to every variable unless you change it below. {customRanges.length > 0 ? `${customRanges.length === 1 ? '1 variable uses its own range.' : `${customRanges.length} variables use their own range.`}` : 'Some sources hold less history than others; set a range on a variable to match.'}
      </p>

      {(badRanges.length > 0 || !defaultValid) && (
        <AlertBar tone="error" title="A data range ends before it starts">
          Fix the range for {badRanges.slice(0, 3).map((v) => v.id).join(', ') || 'the default range'}{badRanges.length > 3 ? ' and others' : ''}.
        </AlertBar>
      )}

      {missingSource.length > 0 && (
        <AlertBar tone="warning" title={`${missingSource.length} ${missingSource.length === 1 ? 'variable has' : 'variables have'} no source`}>
          Choose a source for {missingSource.slice(0, 3).map((v) => v.id).join(', ')}{missingSource.length > 3 ? ' and others' : ''}.
        </AlertBar>
      )}

      <section className="params__group params__group--single" aria-label="Variables in the model">
        <div className="params__head" aria-hidden="true">
          <span>Variable</span>
          <span>Source</span>
          <span>Data range</span>
        </div>
        {inModel.map((v) => (
          <SourceRow
            key={v.id}
            id={v.id}
            dependent={v.id === DEPENDENT_VARIABLE.id}
            row={rows[v.id]}
            selection={parameterSelection}
            open={openRange === v.id}
            setOpen={(open) => setOpenRange(open ? v.id : null)}
            update={(patch) => update(v.id, patch)}
          />
        ))}
      </section>

      <div className="flex flex-wrap items-center justify-between gap-3 pt-5">
        <Button variant="outline" onClick={onBack} className="gap-1.5">
          <ArrowLeft size={14} aria-hidden="true" /> Back to variables
        </Button>
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-[13px] text-subtle" data-testid="needed-sources">
            {needed.length === 0
              ? 'No sources needed yet.'
              : `Next you connect: ${needed.map((n) => n.label).join(', ')}.`}
          </span>
          <Button onClick={onConfirm} disabled={missingSource.length > 0 || badRanges.length > 0 || !defaultValid} className="gap-1.5">
            Confirm and connect data sources <ArrowRight size={14} aria-hidden="true" />
          </Button>
        </div>
      </div>
    </>
  );
}

function SourceRow({ id, dependent, row, selection, open, setOpen, update }) {
  const eff = effectiveRange(row, selection);
  const custom = Boolean(row.from || row.to);
  const valid = isRangeValid(eff);
  return (
    <div className="params__row">
      <span className="params__label">
        <span className="mono">{id}</span>
        {dependent && <Badge tone="accent">Dependent</Badge>}
      </span>
      <select
        className="field-input params__source"
        aria-label={`Source for ${id}`}
        value={row.source}
        onChange={(e) => update({ source: e.target.value })}
      >
        <option value="">Choose source…</option>
        {SOURCE_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
      </select>

      <div className={`params__range ${open ? 'params__range--open' : ''}`}>
        {open ? (
          <div className="params__range-edit">
            <span>From</span>
            <select
              className="field-input params__range-select"
              aria-label={`Range from for ${id}`}
              value={eff.from}
              onChange={(e) => update({ from: e.target.value })}
            >
              {RANGE_YEARS.filter((y) => eff.to === 'today' || Number(y) <= Number(eff.to)).map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
            <span>to</span>
            <select
              className="field-input params__range-select"
              aria-label={`Range to for ${id}`}
              value={eff.to}
              onChange={(e) => update({ to: e.target.value })}
            >
              <option value="today">Today</option>
              {RANGE_YEARS.filter((y) => Number(y) >= Number(eff.from)).map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
            {custom && (
              <button type="button" className="params__range-link" onClick={() => update({ from: undefined, to: undefined })}>
                Use default
              </button>
            )}
            <button type="button" className="params__range-link" onClick={() => setOpen(false)}>Done</button>
          </div>
        ) : (
          <button
            type="button"
            className={`params__range-btn ${custom ? 'params__range-btn--custom' : ''} ${valid ? '' : 'params__range-btn--bad'}`}
            aria-label={`Change data range for ${id}, currently ${formatRange(eff)}`}
            onClick={() => setOpen(true)}
          >
            <CalendarRange size={13} aria-hidden="true" />
            {formatRange(eff)}{custom ? ' · custom' : ''}
          </button>
        )}
      </div>
    </div>
  );
}
