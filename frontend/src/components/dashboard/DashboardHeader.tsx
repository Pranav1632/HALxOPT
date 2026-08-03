'use client';

import React from 'react';
import { OptimalSpecs } from '../../types/telemetry';

interface DashboardHeaderProps {
  specs: OptimalSpecs | null;
  onOpenShapModal?: () => void;
}

export default function DashboardHeader({ specs, onOpenShapModal }: DashboardHeaderProps) {
  return (
    <header className="h-10 flex-shrink-0 border-b border-slate-800/80 bg-[#0D1117] flex items-center justify-between px-3">
      <div className="flex items-center gap-2">
        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
        <h1 className="font-extrabold text-xs tracking-wider uppercase bg-gradient-to-r from-emerald-400 via-cyan-400 to-indigo-400 bg-clip-text text-transparent">
          AeroOptima — Tactical Hybrid UAV Sizing Console
        </h1>
        <span className="text-[9px] font-mono text-slate-500 bg-slate-800/60 px-1.5 py-0.5 rounded border border-slate-700/40">
          HAL × IIT Indore (Phase 5 Complete Engine)
        </span>
        {onOpenShapModal && (
          <button
            onClick={onOpenShapModal}
            className="px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider rounded border border-cyan-800/60 text-cyan-400 bg-cyan-950/30 hover:bg-cyan-900/50 hover:border-cyan-500/60 transition-all flex items-center gap-1 ml-2"
          >
            📊 SHAP XAI AUDIT
          </button>
        )}
      </div>
      {specs && (
        <div className="flex items-center gap-3 text-[10px] font-mono">
          <span className="text-slate-400" title="Turboshaft Engine Rated Power">
            Engine: <span className="text-emerald-400 font-bold">{specs.engine_kw.toFixed(1)} kW</span>
          </span>
          <span className="text-slate-600">|</span>
          <span className="text-slate-400" title="Battery Pack Energy Capacity">
            Battery: <span className="text-amber-400 font-bold">{specs.battery_kwh.toFixed(1)} kWh</span>
          </span>
          <span className="text-slate-600">|</span>
          <span className="text-slate-400" title="Total Sustained Mission Endurance">
            Endurance: <span className="text-cyan-400 font-bold">{specs.endurance_hours.toFixed(2)} hrs</span>
          </span>
          <span className="text-slate-600">|</span>
          <span className="text-slate-400" title="Maximum Takeoff Weight (MTOW)">
            Max Takeoff Weight (MTOW): <span className="text-indigo-400 font-bold">{specs.total_weight_kg.toFixed(0)} kg</span>
          </span>
        </div>
      )}
    </header>
  );
}
