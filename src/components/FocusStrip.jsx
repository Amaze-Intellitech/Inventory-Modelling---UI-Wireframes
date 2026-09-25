import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import { Badge } from './CommonUI';
import SourcingDialog from './SourcingDialog';
import { usePlatform } from '../context/PlatformContext';
import { buildFocusItems } from '../data/focusItems';

// The few things worth attention today for the active persona, most valuable first. At most three,
// and nothing at all when no decision is waiting.
export default function FocusStrip({ rows }) {
  const navigate = useNavigate();
  const { persona, resolvedFocus, resolveFocus } = usePlatform();
  const [open, setOpen] = useState(null);
  const items = useMemo(() => buildFocusItems(persona, rows, resolvedFocus), [persona, rows, resolvedFocus]);
  const openRow = open ? rows.find((r) => r.id === open.materialId) : null;

  return (
    <>
      {items.length > 0 && (
      <section className="focus-strip" aria-label="Suggested focus today">
        <div className="focus-strip__head">
          <Sparkles size={12} aria-hidden="true" />
          <span>AI · Focus today</span>
        </div>
        <ul>
          {items.map((item) => (
            <li key={item.id}>
              <Badge tone={item.severity === 'risk' ? 'risk' : 'watch'}>{item.severity === 'risk' ? 'Act now' : 'Watch'}</Badge>
              <div className="focus-strip__body">
                <strong className="text-ink">{item.title}</strong>
                <span className="focus-strip__meta">{item.valueText}. {item.detail}</span>
              </div>
              <div className="focus-strip__actions">
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() => (item.kind === 'sourcing' ? setOpen(item) : navigate(item.to))}
                >
                  {item.cta}
                </button>
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => resolveFocus(item.id, 'snoozed')}>
                  Snooze
                </button>
              </div>
            </li>
          ))}
        </ul>
      </section>
      )}
      <SourcingDialog open={Boolean(open)} onOpenChange={(v) => !v && setOpen(null)} row={openRow} focusId={open?.id} />
    </>
  );
}
