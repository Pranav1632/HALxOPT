'use client';

import React from 'react';
import { OptimalSpecs } from '../../types/telemetry';

function HalLogo() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="1.5" strokeLinejoin="round">
      <polygon points="12 2 21.39 7 21.39 17 12 22 2.61 17 2.61 7" />
      <polygon points="12 6 17.5 9 17.5 15 12 18 6.5 15 6.5 9" opacity="0.4" />
    </svg>
  );
}

interface DashboardHeaderProps {
  specs: OptimalSpecs | null;
}

export default function DashboardHeader({ specs }: DashboardHeaderProps) {
  return (
    <header
      className="h-11 flex-shrink-0 flex items-center justify-between px-4 border-b border-slate-700/40"
      style={{
        background: 'linear-gradient(135deg, rgba(13,17,23,0.92) 0%, rgba(15,23,42,0.88) 100%)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        boxShadow: 'inset 0 -1px 0 rgba(16,185,129,0.12), 0 1px 0 rgba(0,0,0,0.6)',
      }}
    >
      <div className="flex items-center gap-3">
        <HalLogo />
        <span className="text-[11px] font-extrabold tracking-[0.22em] uppercase text-emerald-400 glow-emerald">AeroOptima</span>
        <span className="hidden sm:block text-[9px] text-slate-500 font-mono border-l border-slate-700 pl-3 ml-1">HAL × IIT Indore | PS-1 Hybrid-Electric UAV</span>
      </div>
      <div className="flex items-center gap-4 text-[10px] font-mono text-slate-400">
        {specs && (
          <>
            <span>ENDURANCE: <b className="text-emerald-400 glow-emerald font-mono">{specs.endurance_hours.toFixed(2)}h</b></span>
            <span>ENGINE: <b className="text-cyan-300">{specs.engine_kw.toFixed(1)}kW</b></span>
            <span>BATT: <b className="text-amber-300">{specs.battery_kwh.toFixed(1)}kWh</b></span>
            <span>MOTOR: <b className="text-purple-300">{specs.motor_model}</b></span>
            <span className="flex items-center gap-1.5 ml-2 border border-emerald-700/40 rounded-full px-2 py-0.5 bg-emerald-950/40">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_6px_rgba(16,185,129,0.8)]" />
              <span className="text-[9px] font-bold text-emerald-400 tracking-widest">SYS ONLINE</span>
            </span>
          </>
        )}
      </div>
    </header>
  );
}
