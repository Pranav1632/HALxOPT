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
  headwindKmh: number;
  setHeadwindKmh: (val: number) => void;
  ambientTempC: number;
  setAmbientTempC: (val: number) => void;
  policyMode: string;
  setPolicyMode: (val: string) => void;
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
  headwindKmh, setHeadwindKmh,
  ambientTempC, setAmbientTempC,
  policyMode, setPolicyMode,
  loading, loadProgress, handleOptimize
}: SimulationControlsProps) {
  return (
    <div className="bg-[#0D1117] border border-slate-800/60 rounded-lg m-2 p-3 panel-enter" style={{ animationDelay: '0ms' }}>
      <h2 className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.15em] mb-3 flex items-center gap-1.5">
        <span>⚡</span> Simulation & Environment Controls
      </h2>

      {/* Policy Mode Selector */}
      <div className="mb-3">
        <label className="text-[10px] text-slate-400 block mb-1">Control Strategy</label>
        <div className="grid grid-cols-2 gap-1 bg-slate-900/60 p-1 rounded border border-slate-800/60">
          <button
            type="button"
            onClick={() => setPolicyMode('heuristic')}
            disabled={loading}
            className={`py-1 text-[9px] font-bold rounded transition-all ${policyMode === 'heuristic' ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/50' : 'text-slate-500 hover:text-slate-300'}`}
          >
            Zhang et al. Heuristic
          </button>
          <button
            type="button"
            onClick={() => setPolicyMode('rl')}
            disabled={loading}
            className={`py-1 text-[9px] font-bold rounded transition-all ${policyMode === 'rl' ? 'bg-cyan-600/30 text-cyan-300 border border-cyan-500/50' : 'text-slate-500 hover:text-slate-300'}`}
          >
            SAC/PPO Neural RL
          </button>
        </div>
      </div>

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

      {/* Environmental Controls */}
      <div className="mb-3 pt-2 border-t border-slate-800/50">
        <div className="flex justify-between text-[10px] mb-1">
          <span className="text-slate-400">Headwind Velocity</span>
          <span className="font-mono text-cyan-400 font-bold bg-cyan-950/40 px-1.5 rounded">{headwindKmh} km/h</span>
        </div>
        <input type="range" min="0" max="60" step="2" value={headwindKmh}
          onChange={(e) => setHeadwindKmh(parseInt(e.target.value))} disabled={loading}
          className="w-full h-1 bg-slate-800 rounded appearance-none cursor-pointer accent-cyan-500 disabled:opacity-40" />
      </div>

      <div className="mb-3">
        <div className="flex justify-between text-[10px] mb-1">
          <span className="text-slate-400">Sea-Level Temperature</span>
          <span className="font-mono text-amber-400 font-bold bg-amber-950/40 px-1.5 rounded">{ambientTempC} °C</span>
        </div>
        <input type="range" min="-30" max="40" step="2" value={ambientTempC}
          onChange={(e) => setAmbientTempC(parseInt(e.target.value))} disabled={loading}
          className="w-full h-1 bg-slate-800 rounded appearance-none cursor-pointer accent-amber-500 disabled:opacity-40" />
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
