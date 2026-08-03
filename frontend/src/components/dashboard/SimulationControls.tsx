'use client';

import React from 'react';

interface SimulationControlsProps {
  targetSpeedKmh: number;
  setTargetSpeedKmh: (val: number) => void;
  targetAltitude: number;
  setTargetAltitude: (val: number) => void;
  payloadWeight: number;
  setPayloadWeight: (val: number) => void;
  initialFuelFraction: number;
  setInitialFuelFraction: (val: number) => void;
  enableLoiter: boolean;
  setEnableLoiter: (val: boolean) => void;
  loading: boolean;
  loadProgress: number;
  handleOptimize: () => void;
}

export default function SimulationControls({
  targetSpeedKmh, setTargetSpeedKmh,
  targetAltitude, setTargetAltitude,
  payloadWeight, setPayloadWeight,
  initialFuelFraction, setInitialFuelFraction,
  enableLoiter, setEnableLoiter,
  loading, loadProgress, handleOptimize
}: SimulationControlsProps) {
  return (
    <div className="bg-[#0D1117] border border-slate-800/60 rounded-lg m-2 p-3 panel-enter" style={{ animationDelay: '0ms' }}>
      <h2 className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.15em] mb-3 flex items-center gap-1.5">
        <span>⚡</span> Simulation Constraints
      </h2>

      <div className="mb-3">
        <div className="flex justify-between text-[10px] mb-1">
          <span className="text-slate-400">Cruise Speed</span>
          <span className="font-mono text-emerald-400 font-bold bg-emerald-950/40 px-1.5 rounded">{targetSpeedKmh} km/h</span>
        </div>
        <input type="range" min="150" max="350" step="5" value={targetSpeedKmh}
          onChange={(e) => setTargetSpeedKmh(parseInt(e.target.value))} disabled={loading}
          className="w-full h-1 bg-slate-800 rounded appearance-none cursor-pointer accent-emerald-500 disabled:opacity-40" />
      </div>

      <div className="mb-3">
        <div className="flex justify-between text-[10px] mb-1">
          <span className="text-slate-400">Target Altitude</span>
          <span className="font-mono text-emerald-400 font-bold bg-emerald-950/40 px-1.5 rounded">{targetAltitude}m</span>
        </div>
        <input type="range" min="3000" max="10000" step="250" value={targetAltitude}
          onChange={(e) => setTargetAltitude(parseInt(e.target.value))} disabled={loading}
          className="w-full h-1 bg-slate-800 rounded appearance-none cursor-pointer accent-emerald-500 disabled:opacity-40" />
      </div>

      <div className="mb-3">
        <div className="flex justify-between text-[10px] mb-1">
          <span className="text-slate-400">Payload Mass</span>
          <span className="font-mono text-emerald-400 font-bold bg-emerald-950/40 px-1.5 rounded">{payloadWeight} kg</span>
        </div>
        <input type="range" min="100" max="300" step="5" value={payloadWeight}
          onChange={(e) => setPayloadWeight(parseInt(e.target.value))} disabled={loading}
          className="w-full h-1 bg-slate-800 rounded appearance-none cursor-pointer accent-emerald-500 disabled:opacity-40" />
      </div>

      <div className="mb-3">
        <div className="flex justify-between text-[10px] mb-1">
          <span className="text-slate-400">Initial Fuel Load</span>
          <span className="font-mono text-orange-400 font-bold bg-orange-950/30 px-1.5 rounded">{Math.round(initialFuelFraction * 100)}%</span>
        </div>
        <input type="range" min="0.1" max="1.0" step="0.05" value={initialFuelFraction}
          onChange={(e) => setInitialFuelFraction(parseFloat(e.target.value))} disabled={loading}
          className="w-full h-1 bg-slate-800 rounded appearance-none cursor-pointer accent-orange-500 disabled:opacity-40" />
      </div>

      <div className="flex items-center gap-2 mb-4">
        <input type="checkbox" id="loiterToggle" checked={enableLoiter}
          onChange={(e) => setEnableLoiter(e.target.checked)} disabled={loading}
          className="w-3.5 h-3.5 rounded accent-emerald-500 cursor-pointer disabled:opacity-40" />
        <label htmlFor="loiterToggle" className="text-[10px] text-slate-400 cursor-pointer">Enable Loiter Phase (Orbit)</label>
      </div>

      <div className="relative">
        <button
          onClick={handleOptimize}
          disabled={loading}
          className="w-full py-2.5 text-[11px] font-bold uppercase tracking-[0.18em] rounded border transition-all overflow-hidden relative
            bg-emerald-600/20 border-emerald-600/40 text-emerald-300
            hover:bg-emerald-600/30 hover:border-emerald-500/60
            hover:shadow-[0_0_20px_rgba(16,185,129,0.35)]
            disabled:opacity-40 disabled:pointer-events-none
            flex items-center justify-center gap-2 group"
        >
          <span
            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
            style={{
              background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.12) 50%, transparent 100%)',
              backgroundSize: '200% 100%',
              animation: 'shimmer 1.4s linear infinite',
            }}
          />
          {loading
            ? (<><div className="w-3.5 h-3.5 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />OPTIMIZING...</>)
            : <>▶ EXECUTE GA OPTIMIZER</>
          }
        </button>
        {loading && (
          <div className="mt-1 h-0.5 w-full bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-600 to-cyan-500 rounded-full transition-all duration-500"
              style={{ width: `${loadProgress}%` }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
