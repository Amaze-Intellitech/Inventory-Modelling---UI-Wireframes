import React, { useMemo } from 'react';
import { ArrowRight, Check } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from './CommonUI';
import { usePlatform } from '../context/PlatformContext';
import { buildSourcingComparison, formatMoney } from '../data/sourcingOptions';
import { personaLabel } from '../data/personas';
import { cn } from '@/lib/utils';

// Which column each persona should read first. Same table for everyone; the emphasis moves.
const EMPHASIS = {
  supervisor: ['arrives', 'risk'],
  planner: ['arrives'],
  procurement: ['extra'],
  warehouse: ['option'],
  finance: ['total'],
};

const RISK_TONE = { Low: 'success', Medium: 'watch', High: 'risk' };

// Side-by-side comparison of ways to close a shortfall: move stock in from another plant, or buy it.
// It only proposes; approving records the decision for this session and nothing is executed.
export default function SourcingDialog({ open, onOpenChange, row, focusId }) {
  const { persona, setPersona, resolveFocus } = usePlatform();
  const comparison = useMemo(() => (row ? buildSourcingComparison(row) : null), [row]);
  if (!comparison) return null;

  const emph = EMPHASIS[persona] ?? [];
  const cell = (key) => cn(emph.includes(key) && 'sourcing__emph');
  const best = comparison.options.find((o) => o.key === comparison.recommended);
  const nextPersona = persona === 'procurement' ? 'warehouse' : 'procurement';

  const approve = () => {
    if (best) {
      resolveFocus(focusId ?? `F-SRC-${comparison.materialId}`, 'approved');
      toast.success(`Proposal approved: ${best.label} for ${comparison.materialId}`);
    }
    onOpenChange(false);
  };

  const handOff = () => {
    setPersona(nextPersona);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[880px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex flex-wrap items-center gap-2">
            Close the gap on {comparison.materialId} at {comparison.plant}
            <Badge tone="ai" shape={false}>Proposal · pending review</Badge>
          </DialogTitle>
          <DialogDescription>
            {Math.round(comparison.cover)} days of cover against a {comparison.leadTimeDays}-day lead time leaves about{' '}
            {comparison.need.toLocaleString()} {comparison.uom} to bring in. Compare moving stock from another plant with buying it.
          </DialogDescription>
        </DialogHeader>

        <div className="table-wrap sourcing" role="region" aria-label="Sourcing options" tabIndex={0}>
          <table>
            <thead>
              <tr>
                <th className={cell('option')}>Option</th>
                <th className={cn('num', cell('arrives'))}>Arrives</th>
                <th className={cn('num', cell('extra'))}>Extra cost</th>
                <th className={cell('risk')}>Stock-out risk</th>
                <th>Watch out for</th>
                <th className={cn('num', cell('total'))}>Total cost</th>
              </tr>
            </thead>
            <tbody>
              {comparison.options.map((o) => (
                <tr key={o.key} className={cn(o.key === comparison.recommended && 'sourcing__best')}>
                  <td className={cell('option')}>
                    <strong className="text-ink">{o.label}</strong>
                    {o.key === comparison.recommended && <Badge tone="success" className="ml-2">Recommended</Badge>}
                    <span className="sourcing__sub">{o.detail}</span>
                  </td>
                  <td className={cn('num', cell('arrives'))}>{o.arrives == null ? 'n/a' : `${o.arrives} d`}</td>
                  <td className={cn('num', cell('extra'))}>{o.extra ? formatMoney(o.extra) : 'none'}</td>
                  <td className={cell('risk')}><Badge tone={RISK_TONE[o.risk]}>{o.risk}</Badge></td>
                  <td className="sourcing__watch">{o.watch}</td>
                  <td className={cn('num', cell('total'))}><strong>{formatMoney(o.total)}</strong></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="text-[13px] text-body-c leading-relaxed m-0" role="status">
          <strong className="text-ink">Why this one:</strong> {comparison.reason}
        </p>
        <p className="footnote m-0">
          Total cost = extra cost (freight, price change, qualification) + carrying cost + expected lost production. Plant and vendor
          terms are illustrative values.
        </p>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" onClick={handOff} className="gap-1.5">
              Hand off to {personaLabel(nextPersona)} <ArrowRight size={14} aria-hidden="true" />
            </Button>
            {best && (
              <Button onClick={approve} className="gap-1.5">
                <Check size={14} aria-hidden="true" /> Approve {best.label.toLowerCase()}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
