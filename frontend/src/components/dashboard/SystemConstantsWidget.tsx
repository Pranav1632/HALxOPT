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
  const policy = envMetadata?.policy_mode === 'rl' ? 'SAC/PPO Neural RL' : 'Baseline Heuristic';
  const headwind = envMetadata?.headwind_kmh || 0;
  const temp_c = envMetadata?.ambient_temp_c ?? 15;
  const turbulence = envMetadata?.turbulence_level ?? 0;
  const wingspan = envMetadata?.wingspan_m;
  const wingArea = envMetadata?.wing_area_m2;

  return (
    <div className="bg-[#0D1117] border border-slate-800/60 rounded-lg m-2 p-3 panel-enter" style={{ animationDelay: '200ms' }}>
      <h2 className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.15em] mb-2 flex items-center gap-1.5">
        <span>🔬</span> Dynamic System Constants
      </h2>
      <div className="space-y-1 text-[10px]">
        <div className="flex justify-between"><span className="text-slate-500">Aspect Ratio (AR)</span><span className="font-mono text-slate-300">{aspect_ratio}</span></div>
        <div className="flex justify-between"><span className="text-slate-500">Specific Fuel Consumption (SFC)</span><span className="font-mono text-slate-300">{sfc} kg/kWh</span></div>
        <div className="flex justify-between"><span className="text-slate-500">Motor Efficiency (η)</span><span className="font-mono text-slate-300">{motor_eff}%</span></div>
        {wingspan && <div className="flex justify-between"><span className="text-slate-500">Wingspan (b)</span><span className="font-mono text-slate-300">{wingspan} m</span></div>}
        {wingArea && <div className="flex justify-between"><span className="text-slate-500">Wing Area (S)</span><span className="font-mono text-slate-300">{wingArea} m²</span></div>}
        <div className="pt-1 border-t border-slate-800/40 mt-1">
          <div className="flex justify-between"><span className="text-slate-500">Headwind Velocity</span><span className="font-mono text-cyan-400">{headwind} km/h</span></div>
          <div className="flex justify-between"><span className="text-slate-500">Sea-Level Temp (T₀)</span><span className="font-mono text-amber-400">{temp_c} °C</span></div>
          <div className="flex justify-between"><span className="text-slate-500">Turbulence Intensity</span><span className={`font-mono ${turbulence > 0.1 ? 'text-rose-400' : 'text-slate-400'}`}>{(turbulence * 100).toFixed(0)}%</span></div>
        </div>
        <div className="flex justify-between pt-0.5"><span className="text-slate-500">Control Strategy</span><span className="font-mono text-emerald-400">{policy}</span></div>
      </div>
    </div>
  );
}
