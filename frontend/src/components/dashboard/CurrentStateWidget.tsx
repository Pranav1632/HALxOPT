'use client';

import React from 'react';
import { TelemetryPoint, PHASE_BADGE, PHASE_GLOW, fmtTime } from '../../types/telemetry';

interface CurrentStateWidgetProps {
  currentPoint: TelemetryPoint;
}

export default function CurrentStateWidget({ currentPoint }: CurrentStateWidgetProps) {
  return (
    <div className="bg-[#0D1117] border border-slate-800/60 rounded-lg m-2 p-3 panel-enter" style={{ animationDelay: '50ms' }}>
      <h2 className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.15em] mb-2 flex items-center gap-1.5">
        <span>📡</span> Current State — T+{fmtTime(currentPoint.time)}
      </h2>
      <div className={`inline-block text-[9px] font-bold uppercase px-2 py-0.5 rounded border mb-3 ${PHASE_BADGE[currentPoint.phase] || PHASE_BADGE.completed} ${PHASE_GLOW[currentPoint.phase] || ''}`}>
        {currentPoint.phase}
      </div>
      <div className="grid grid-cols-2 gap-1.5 text-[10px]">
        {[
          { label: 'ALT', value: `${currentPoint.altitude.toFixed(0)}m`, cls: '' },
          { label: 'TAS', value: `${(currentPoint.speed * 3.6).toFixed(0)} km/h`, cls: '' },
          { label: 'P_REQ', value: `${currentPoint.power_required.toFixed(1)} kW`, cls: '' },
          { label: 'ELEC%', value: `${(currentPoint.u * 100).toFixed(0)}%`, cls: currentPoint.u > 0.4 ? 'text-amber-400' : currentPoint.u > 0.05 ? 'text-cyan-400' : 'text-slate-500' },
          { label: 'MOTOR', value: `${currentPoint.power_motor.toFixed(1)} kW`, cls: 'text-amber-300' },
          { label: 'ENGINE', value: `${currentPoint.power_engine.toFixed(1)} kW`, cls: 'text-cyan-300' },
          { label: 'SOC', value: `${(currentPoint.soc * 100).toFixed(1)}%`, cls: currentPoint.soc < 0.2 ? 'text-red-400' : 'text-yellow-300' },
          { label: 'FUEL', value: `${currentPoint.fuel.toFixed(1)} kg`, cls: currentPoint.fuel < 30 ? 'text-red-400' : 'text-slate-100' },
        ].map(({ label, value, cls }) => (
          <div key={label} className="bg-slate-900/60 rounded-md p-1.5 border border-slate-800/40">
            <span className="text-slate-500 text-[8px] block leading-none mb-0.5">{label}</span>
            <p className={`font-mono font-bold text-[10px] leading-none ${cls}`}>{value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
