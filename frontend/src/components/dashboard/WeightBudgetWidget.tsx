'use client';

import React from 'react';
import { OptimalSpecs } from '../../types/telemetry';

interface WeightBudgetWidgetProps {
  specs: OptimalSpecs;
  weightBreakdown: Array<{ name: string; weight: number; color: string }>;
  totalWeight: number;
}

export default function WeightBudgetWidget({ specs, weightBreakdown, totalWeight }: WeightBudgetWidgetProps) {
  return (
    <div className="bg-[#0D1117] border border-slate-800/60 rounded-lg m-2 p-3 panel-enter" style={{ animationDelay: '150ms' }}>
      <h2 className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.15em] mb-2 flex items-center gap-1.5">
        <span>⚖️</span> MTOW Budget — {specs.total_weight_kg} kg
      </h2>
      <div className="h-4 w-full flex rounded-full overflow-hidden mb-2.5 shimmer-bar">
        {weightBreakdown.map((bar, i) => (
          <div
            key={i}
            style={{ width: `${(bar.weight / totalWeight) * 100}%`, backgroundColor: bar.color }}
            title={`${bar.name}: ${bar.weight.toFixed(1)} kg`}
          />
        ))}
      </div>
      {weightBreakdown.map((bar, i) => (
        <div key={i} className="flex justify-between text-[10px] py-0.5">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-sm flex-shrink-0" style={{ backgroundColor: bar.color }} />
            <span className="text-slate-400">{bar.name}</span>
          </span>
          <span className="font-mono text-slate-200">{bar.weight.toFixed(1)} kg</span>
        </div>
      ))}
    </div>
  );
}
