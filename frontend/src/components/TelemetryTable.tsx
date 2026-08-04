'use client';
import React, { useMemo, useState } from 'react';
import { TelemetryPoint } from '../types/telemetry';

interface TelemetryTableProps {
  telemetry: TelemetryPoint[];
  currentIndex: number;
  onIndexChange: (index: number) => void;
}

const PHASE_COLORS: Record<string, string> = {
  takeoff:   'text-red-400',
  climb:     'text-amber-400',
  cruise:    'text-cyan-400',
  loiter:    'text-violet-400',
  descent:   'text-teal-400',
  landing:   'text-emerald-400',
  completed: 'text-slate-500',
};

const PHASE_PILL_BG: Record<string, string> = {
  takeoff:   'bg-red-900/20 border-red-800/30',
  climb:     'bg-amber-900/20 border-amber-800/30',
  cruise:    'bg-cyan-900/20 border-cyan-800/30',
  loiter:    'bg-violet-900/20 border-violet-800/30',
  descent:   'bg-teal-900/20 border-teal-800/30',
  landing:   'bg-emerald-900/20 border-emerald-800/30',
  completed: 'bg-slate-800/20 border-slate-700/30',
};

function downsampleIndices(total: number, maxRows: number): number[] {
  if (total <= maxRows) return Array.from({ length: total }, (_, i) => i);
  const step = (total - 1) / (maxRows - 1);
  const indices: number[] = [];
  for (let i = 0; i < maxRows; i++) {
    indices.push(Math.round(i * step));
  }
  return indices;
}

function fuelColor(fuel: number, maxFuel: number): string {
  const frac = 1 - Math.max(0, Math.min(1, fuel / maxFuel));
  const r = Math.round(16 + frac * (239 - 16));
  const g = Math.round(185 + frac * (68 - 185));
  const b = Math.round(129 + frac * (68 - 129));
  return `rgb(${r},${g},${b})`;
}

export default function TelemetryTable({ telemetry, currentIndex, onIndexChange }: TelemetryTableProps) {
  const [copied, setCopied] = useState<boolean>(false);
  const displayIndices = useMemo(() => downsampleIndices(telemetry.length, 120), [telemetry.length]);

  const maxFuel = useMemo(() => {
    if (!telemetry.length) return 1;
    return Math.max(...telemetry.map(pt => pt.fuel));
  }, [telemetry]);

  const closestDisplayIndex = useMemo(() => {
    if (displayIndices.length === 0) return 0;
    let closest = displayIndices[0];
    let minDiff = Math.abs(closest - currentIndex);
    for (let i = 1; i < displayIndices.length; i++) {
      const diff = Math.abs(displayIndices[i] - currentIndex);
      if (diff < minDiff) { minDiff = diff; closest = displayIndices[i]; }
    }
    return closest;
  }, [displayIndices, currentIndex]);

  const handleCopyMatrix = () => {
    if (!telemetry || telemetry.length === 0) return;

    // Header matches UI table column layout 1:1
    const headers = [
      'Time(s)',
      'P_aero(kW)',
      'P_climb(kW)',
      'P_req(kW)',
      'PSR(%)',
      'Motor(kW)',
      'Engine(kW)',
      'SoC(%)',
      'Fuel(kg)',
      'Phase',
    ];

    const rows = telemetry.map(pt => [
      pt.time.toFixed(0),
      pt.p_aero.toFixed(1),
      pt.p_climb.toFixed(1),
      pt.power_required.toFixed(1),
      (pt.u * 100).toFixed(0) + '%',
      pt.power_motor.toFixed(1),
      pt.power_engine.toFixed(1),
      (pt.soc * 100).toFixed(1) + '%',
      pt.fuel.toFixed(1),
      pt.phase,
    ].join('\t'));

    const csvContent = [headers.join('\t'), ...rows].join('\n');
    navigator.clipboard.writeText(csvContent).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }).catch(err => {
      console.error('Copy failed:', err);
    });
  };

  if (!telemetry || telemetry.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center text-slate-500 text-xs font-mono">
        NO DATA
      </div>
    );
  }

  const formatTime = (sec: number) => {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = Math.floor(sec % 60);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const GRID = 'grid-cols-[60px_58px_58px_58px_52px_58px_58px_52px_62px_70px]';

  return (
    <div className="w-full h-full flex flex-col overflow-hidden select-text">
      {/* Matrix Header Action Bar */}
      <div className="h-7 flex-shrink-0 flex items-center justify-between px-2 bg-[#0D1117] border-b border-slate-800/40">
        <h3 className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.15em]">Propulsion Status Matrix — kW</h3>
        <button
          onClick={handleCopyMatrix}
          className="px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider rounded border border-slate-700/60 text-emerald-400 bg-emerald-950/30 hover:bg-emerald-900/50 hover:border-emerald-500/60 transition-all flex items-center gap-1"
        >
          {copied ? '✓ COPIED ALL MATRIX DATA!' : '📋 COPY MATRIX'}
        </button>
      </div>

      {/* Header with Full Form Tooltips */}
      <div className={`flex-shrink-0 grid ${GRID} gap-0 text-[9px] font-bold text-slate-400 uppercase tracking-wider bg-[#0D1117] px-1 py-1.5 border-t-2 border-t-emerald-500/60 border-b border-slate-700/60`}>
        <span className="text-center" title="Mission Elapsed Time">Time</span>
        <span className="text-right cursor-help" title="Aerodynamic Drag Power (P_aero)">P_aero</span>
        <span className="text-right cursor-help" title="Rate-of-Climb Power (P_climb)">P_climb</span>
        <span className="text-right cursor-help" title="Total Power Required (P_req)">P_req</span>
        <span className="text-center cursor-help" title="Power Split Ratio (PSR)">PSR</span>
        <span className="text-right cursor-help" title="Electric Motor Delivered Power">Motor</span>
        <span className="text-right cursor-help" title="Turboshaft Engine Shaft Power">Engine</span>
        <span className="text-right cursor-help" title="Battery State of Charge (SoC)">SoC</span>
        <span className="text-right cursor-help" title="Remaining Jet A-1 Fuel Mass">Fuel</span>
        <span className="text-center" title="Current Flight Phase">Phase</span>
      </div>
      {/* Unit sub-row */}
      <div className={`flex-shrink-0 grid ${GRID} gap-0 text-[8px] text-slate-600 bg-[#0D1117] px-1 py-0.5 border-b border-slate-800/50`}>
        <span className="text-center">–</span>
        <span className="text-right">kW</span>
        <span className="text-right">kW</span>
        <span className="text-right">kW</span>
        <span className="text-center">%</span>
        <span className="text-right">kW</span>
        <span className="text-right">kW</span>
        <span className="text-right">%</span>
        <span className="text-right">kg</span>
        <span className="text-center">–</span>
      </div>

      {/* Data rows */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {displayIndices.map((idx) => {
          const pt = telemetry[idx];
          if (!pt) return null;
          const isActive = idx === closestDisplayIndex;
          const socPct = pt.soc * 100;
          const fc = fuelColor(pt.fuel, maxFuel);

          return (
            <div
              key={idx}
              onClick={() => onIndexChange(idx)}
              className={`grid ${GRID} gap-0 text-[10px] font-mono px-1 py-[3px] cursor-pointer border-b border-slate-800/30 transition-colors duration-75 select-text
                odd:bg-slate-900/20
                ${isActive
                  ? 'bg-emerald-950/20 border-l-2 border-l-emerald-500 text-emerald-100'
                  : 'text-slate-300 hover:bg-slate-800/40 border-l-2 border-l-transparent'
                }`}
            >
              <span className="text-center text-slate-400">{formatTime(pt.time)}</span>
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

              {/* SoC with inline bar */}
              <span className="text-right relative">
                <span
                  className="absolute inset-0 rounded-sm opacity-20"
                  style={{
                    background: `linear-gradient(to right, ${pt.soc < 0.2 ? '#ef4444' : pt.soc > 0.7 ? '#10b981' : '#eab308'} ${socPct}%, transparent ${socPct}%)`,
                  }}
                />
                <span className={`relative z-10 ${pt.soc < 0.2 ? 'text-red-400' : pt.soc > 0.7 ? 'text-emerald-400' : 'text-yellow-300'}`}>
                  {socPct.toFixed(0)}%
                </span>
              </span>

              {/* Fuel: green → red interpolation */}
              <span className="text-right" style={{ color: fc }}>
                {pt.fuel.toFixed(1)}
              </span>

              {/* Phase pill */}
              <span className={`text-center capitalize px-1 py-0.5 rounded border text-[8px] font-bold ${PHASE_COLORS[pt.phase]} ${PHASE_PILL_BG[pt.phase]}`}>
                {pt.phase}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
