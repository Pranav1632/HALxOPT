'use client';

import React from 'react';
import { TelemetryPoint, PHASE_BADGE, PHASE_GLOW } from '../../types/telemetry';

interface CurrentStateWidgetProps {
  currentPoint: TelemetryPoint;
}

export default function CurrentStateWidget({ currentPoint }: CurrentStateWidgetProps) {
  const currentPkt = currentPoint;
  const deratingFactor = Math.max(15, Math.round((1.0 - (currentPkt.altitude / 10000.0) * 0.4) * 100));
  const isDescent = currentPkt.phase === 'descent' || (currentPkt.climb_rate < 0);
  const regenKw = isDescent ? Math.min(8.25, Math.abs(currentPkt.climb_rate) * 1.5).toFixed(2) : '0.00';

  return (
    <div className="bg-[#0D1117] border border-slate-800/60 rounded-lg m-2 p-3 panel-enter" style={{ animationDelay: '50ms' }}>
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.15em] flex items-center gap-1.5">
          <span>📡</span> Live Telemetry & Physics State
        </h2>
        <span
          className={`text-[9px] font-bold px-2 py-0.5 rounded border uppercase transition-all ${PHASE_BADGE[currentPkt.phase] || 'bg-slate-800 text-slate-300'} ${PHASE_GLOW[currentPkt.phase] || ''}`}
        >
          {currentPkt.phase}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 text-[10px] mb-2">
        <div className="bg-slate-900/60 p-1.5 rounded border border-slate-800/40">
          <div className="text-slate-500 text-[8px] uppercase tracking-wider">Airspeed & Alt</div>
          <div className="font-mono text-emerald-400 font-bold">{(currentPkt.speed * 3.6).toFixed(0)} km/h</div>
          <div className="font-mono text-slate-400 text-[9px]">{currentPkt.altitude.toFixed(0)}m ASL</div>
        </div>

        <div className="bg-slate-900/60 p-1.5 rounded border border-slate-800/40">
          <div className="text-slate-500 text-[8px] uppercase tracking-wider">Power Req & Deliv</div>
          <div className="font-mono text-cyan-400 font-bold">{currentPkt.power_required.toFixed(1)} kW</div>
          <div className="font-mono text-slate-400 text-[9px]">{currentPkt.power_delivered.toFixed(1)} kW deliv</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 text-[10px] mb-2">
        <div className="bg-slate-900/60 p-1.5 rounded border border-slate-800/40">
          <div className="text-slate-500 text-[8px] uppercase tracking-wider">State of Charge (SoC)</div>
          <div className="font-mono text-amber-400 font-bold">{(currentPkt.soc * 100).toFixed(1)}%</div>
          <div className="font-mono text-slate-400 text-[9px]">{currentPkt.fuel.toFixed(1)} kg fuel</div>
        </div>

        <div className="bg-slate-900/60 p-1.5 rounded border border-slate-800/40">
          <div className="text-slate-500 text-[8px] uppercase tracking-wider">Engine Alt Derating</div>
          <div className="font-mono text-indigo-400 font-bold">{deratingFactor}% Avail</div>
          <div className="font-mono text-slate-400 text-[9px]">Gagg-Ferrar Model</div>
        </div>
      </div>

      {/* Physics Metrics */}
      <div className="space-y-1 text-[9px] pt-1.5 border-t border-slate-800/50">
        <div className="flex justify-between">
          <span className="text-slate-500">Rate of Climb (v_y)</span>
          <span className="font-mono text-slate-300">{currentPkt.climb_rate ? currentPkt.climb_rate.toFixed(1) : (currentPkt.altitude > 200 ? '0.0' : '3.0')} m/s</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500">Regenerative Power Recovery</span>
          <span className="font-mono text-emerald-400">{regenKw} kW</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500">Power Deficit Accumulator</span>
          <span className={`font-mono ${currentPkt.deficit > 0 ? 'text-red-400 font-bold animate-pulse' : 'text-slate-400'}`}>
            {currentPkt.deficit.toFixed(1)} kW
          </span>
        </div>
      </div>
    </div>
  );
}
