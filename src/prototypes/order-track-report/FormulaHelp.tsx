import React, { useCallback, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

type FormulaHelpProps = {
  label: string;
  formula: string;
  variant?: 'report' | 'analysis';
};

type TooltipPosition = { left: number; top: number; above: boolean };

const EDGE_GAP = 8;
const TOOLTIP_GAP = 8;

export default function FormulaHelp({ label, formula, variant = 'report' }: FormulaHelpProps) {
  const anchorRef = useRef<HTMLSpanElement>(null);
  const tooltipRef = useRef<HTMLSpanElement>(null);
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<TooltipPosition>({ left: 0, top: 0, above: false });
  const tooltipId = useId();

  const updatePosition = useCallback(() => {
    const anchor = anchorRef.current;
    if (!anchor) return;
    const anchorRect = anchor.getBoundingClientRect();
    const tooltipRect = tooltipRef.current?.getBoundingClientRect();
    const tooltipWidth = tooltipRect?.width || 280;
    const tooltipHeight = tooltipRect?.height || 64;
    const left = Math.max(
      EDGE_GAP,
      Math.min(
        anchorRect.left + anchorRect.width / 2 - tooltipWidth / 2,
        window.innerWidth - tooltipWidth - EDGE_GAP,
      ),
    );
    const canPlaceAbove = anchorRect.top - tooltipHeight - TOOLTIP_GAP >= EDGE_GAP;
    const top = canPlaceAbove
      ? anchorRect.top - tooltipHeight - TOOLTIP_GAP
      : anchorRect.bottom + TOOLTIP_GAP;
    setPosition({ left, top, above: canPlaceAbove });
  }, []);

  useLayoutEffect(() => {
    if (!open) return undefined;
    updatePosition();
    const handleViewportChange = () => updatePosition();
    window.addEventListener('resize', handleViewportChange);
    window.addEventListener('scroll', handleViewportChange, true);
    return () => {
      window.removeEventListener('resize', handleViewportChange);
      window.removeEventListener('scroll', handleViewportChange, true);
    };
  }, [open, updatePosition]);

  const helpClass = variant === 'analysis' ? 'static-analysis-formula-help' : 'static-report-formula-help';
  const tooltipClass = variant === 'analysis' ? 'static-analysis-formula-tooltip' : 'static-report-formula-tooltip';
  return <>
    <span
      ref={anchorRef}
      className={helpClass}
      tabIndex={0}
      aria-label={`${label}计算公式`}
      aria-describedby={open ? tooltipId : undefined}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
    >?
    </span>
    {open && createPortal(
      <span
        ref={tooltipRef}
        id={tooltipId}
        className={`${tooltipClass} formula-tooltip-portal${position.above ? ' is-above' : ''}`}
        role="tooltip"
        style={{ left: position.left, top: position.top }}
      >
        {formula}
      </span>,
      document.body,
    )}
  </>;
}
