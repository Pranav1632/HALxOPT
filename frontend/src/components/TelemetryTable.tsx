'use client';

import React, { useMemo } from 'react';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */
interface TelemetryPoint {
  time: number;
  altitude: number;
  speed: number;
  power_required: number;
  power_delivered: number;
  power_motor: number;
  power_engine: number;
  soc: number;
  fuel: number;
  weight: number;
  phase: string;
  deficit: number;
  u: number;
  p_aero: number;
  p_climb: number;
  climb_rate: number;
}

interface TelemetryTableProps {
  telemetry: TelemetryPoint[];
  currentIndex: number;
  onIndexChange: (index: number) => void;
}

/* ------------------------------------------------------------------ */
/*  Phase color map (strict industrial palette)                        */
/* ------------------------------------------------------------------ */
const PHASE_COLORS: Record<string, string> = {
  takeoff:   'text-red-400',
  climb:     'text-amber-400',
  cruise:    'text-cyan-400',
  loiter:    'text-violet-400',
  descent:   'text-teal-400',
  landing:   'text-emerald-400',
  completed: 'text-slate-500',
};

/* ------------------------------------------------------------------ */
/*  Downsampled indices for display performance                        */
/* ------------------------------------------------------------------ */
function downsampleIndices(total: number, maxRows: number): number[] {
  if (total <= maxRows) return Array.from({ length: total }, (_, i) => i);
  const step = (total - 1) / (maxRows - 1);
  const indices: number[] = [];
  for (let i = 0; i < maxRows; i++) {
    indices.push(Math.round(i * step));
  }
  return indices;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */
export default function TelemetryTable({ telemetry, currentIndex, onIndexChange }: TelemetryTableProps) {
  const displayIndices = useMemo(() => downsampleIndices(telemetry.length, 120), [telemetry.length]);

  if (!telemetry || telemetry.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center text-slate-500 text-xs font-mono">
        NO DATA
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 grid grid-cols-[60px_58px_58px_58px_52px_58px_58px_52px_62px_70px] gap-0 text-[9px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-700/60 bg-[#0D1117] px-1 py-1.5">
        <span className="text-center">Time</span>
        <span className="text-right">P_aero</span>
        <span className="text-right">P_climb</span>
        <span className="text-right">P_req</span>
        <span className="text-center">PSR</span>
        <span className="text-right">Motor</span>
        <span className="text-right">Engine</span>
        <span className="text-right">SoC</span>
        <span className="text-right">Fuel</span>
        <span className="text-center">Phase</span>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {displayIndices.map((idx) => {
          const pt = telemetry[idx];
          if (!pt) return null;

          const isActive = idx === currentIndex;
          const timeMin = (pt.time / 60).toFixed(1);
          const phaseColor = PHASE_COLORS[pt.phase] || 'text-slate-400';

          return (
            <div
              key={idx}
              onClick={() => onIndexChange(idx)}
              className={`grid grid-cols-[60px_58px_58px_58px_52px_58px_58px_52px_62px_70px] gap-0 text-[10px] font-mono px-1 py-[3px] cursor-pointer border-b border-slate-800/30 transition-colors duration-75
                ${isActive
                  ? 'bg-amber-500/10 text-amber-200 border-l-2 border-l-amber-500'
                  : 'text-slate-300 hover:bg-slate-800/40 border-l-2 border-l-transparent'
                }`}
            >
              <span className="text-center text-slate-400">{timeMin}m</span>
              <span className="text-right">{pt.p_aero.toFixed(1)}</span>
              <span className={`text-right ${pt.p_climb > 0.1 ? 'text-amber-300' : pt.p_climb < -0.1 ? 'text-teal-400' : ''}`}>
                {pt.p_climb.toFixed(1)}
              </span>
              <span className="text-right font-semibold">{pt.power_required.toFixed(1)}</span>
              <span className={`text-center ${pt.u > 0.4 ? 'text-amber-400' : pt.u > 0.1 ? 'text-cyan-400' : 'text-emerald-400'}`}>
                {(pt.u * 100).toFixed(0)}%
              </span>
              <span className="text-right text-amber-300">{pt.power_motor.toFixed(1)}</span>
              <span className="text-right text-cyan-300">{pt.power_engine.toFixed(1)}</span>
              <span className={`text-right ${pt.soc < 0.2 ? 'text-red-400' : pt.soc > 0.7 ? 'text-emerald-400' : 'text-yellow-300'}`}>
                {(pt.soc * 100).toFixed(0)}%
              </span>
              <span className={`text-right ${pt.fuel < 30 ? 'text-red-400' : ''}`}>{pt.fuel.toFixed(1)}</span>
              <span className={`text-center capitalize ${phaseColor}`}>{pt.phase}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
