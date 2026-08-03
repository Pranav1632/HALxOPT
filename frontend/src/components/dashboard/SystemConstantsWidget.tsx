'use client';

import React from 'react';
import { OptimalSpecs } from '../../types/telemetry';

interface SystemConstantsWidgetProps {
  specs: OptimalSpecs;
  envMetadata?: Record<string, any>;
}

export default function SystemConstantsWidget({ specs, envMetadata }: SystemConstantsWidgetProps) {
  const aspect_ratio = specs.aspect_ratio || 16.07;
  const sfc = specs.sfc_base || 0.38;
  const motor_eff = specs.motor_efficiency_pct || 96.0;
  const policy = envMetadata?.policy_mode === 'rl' ? 'SAC/PPO Neural RL' : 'Zhang et al. Heuristic';
  const headwind = envMetadata?.headwind_kmh || 0;
  const temp_c = envMetadata?.ambient_temp_c ?? 15;

  return (
    <div className="bg-[#0D1117] border border-slate-800/60 rounded-lg m-2 p-3 panel-enter" style={{ animationDelay: '200ms' }}>
      <h2 className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.15em] mb-2 flex items-center gap-1.5">
        <span>🔬</span> Dynamic System Constants
      </h2>
      <div className="space-y-1 text-[10px]">
        <div className="flex justify-between"><span className="text-slate-500">Drag Polar</span><span className="font-mono text-slate-300">Oswald AR={aspect_ratio}</span></div>
        <div className="flex justify-between"><span className="text-slate-500">Base SFC</span><span className="font-mono text-slate-300">{sfc} kg/kWh</span></div>
        <div className="flex justify-between"><span className="text-slate-500">Motor Peak η</span><span className="font-mono text-slate-300">{motor_eff}%</span></div>
        <div className="flex justify-between"><span className="text-slate-500">Headwind</span><span className="font-mono text-cyan-400">{headwind} km/h</span></div>
        <div className="flex justify-between"><span className="text-slate-500">Sea-Level T0</span><span className="font-mono text-amber-400">{temp_c} °C</span></div>
        <div className="flex justify-between"><span className="text-slate-500">Control Strategy</span><span className="font-mono text-emerald-400">{policy}</span></div>
      </div>
    </div>
  );
}
