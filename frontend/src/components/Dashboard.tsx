'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import dynamic_import from 'next/dynamic';
import TelemetryTable from './TelemetryTable';
import TelemetryChart from './TelemetryChart';

/* ---- Lazy-load Three.js (no SSR) ---- */
const FlightScene = dynamic_import(() => import('./FlightScene'), { ssr: false });

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */
interface OptimalSpecs {
  engine_kw: number;
  battery_kwh: number;
  motor_kw: number;
  endurance_hours: number;
  empty_weight_kg: number;
  fuel_weight_kg: number;
  total_weight_kg: number;
  motor_model: string;
  engine_weight_kg: number;
  motor_weight_kg: number;
  battery_weight_kg: number;
}

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

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

/* ------------------------------------------------------------------ */
/*  Utility: Format time from seconds                                  */
/* ------------------------------------------------------------------ */
function fmtTime(sec: number): string {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m ${s}s`;
}

/* ------------------------------------------------------------------ */
/*  Phase badge colors                                                 */
/* ------------------------------------------------------------------ */
const PHASE_BADGE: Record<string, string> = {
  takeoff:   'bg-red-900/60 text-red-300 border-red-700/40',
  climb:     'bg-amber-900/60 text-amber-300 border-amber-700/40',
  cruise:    'bg-cyan-900/60 text-cyan-300 border-cyan-700/40',
  loiter:    'bg-violet-900/60 text-violet-300 border-violet-700/40',
  descent:   'bg-teal-900/60 text-teal-300 border-teal-700/40',
  landing:   'bg-emerald-900/60 text-emerald-300 border-emerald-700/40',
  completed: 'bg-slate-800/60 text-slate-400 border-slate-700/40',
};

/* ------------------------------------------------------------------ */
/*  Main Dashboard Component                                           */
/* ------------------------------------------------------------------ */
export default function Dashboard() {
  /* ---- State ---- */
  const [targetSpeedKmh, setTargetSpeedKmh] = useState<number>(250);
  const [targetAltitude, setTargetAltitude] = useState<number>(5000);
  const [payloadWeight, setPayloadWeight] = useState<number>(200);

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [specs, setSpecs] = useState<OptimalSpecs | null>(null);
  const [telemetry, setTelemetry] = useState<TelemetryPoint[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'3d' | 'charts'>('3d');

  /* ---- Current telemetry point ---- */
  const currentPoint = useMemo(() => {
    if (telemetry.length === 0) return null;
    return telemetry[Math.min(currentIndex, telemetry.length - 1)];
  }, [telemetry, currentIndex]);

  /* ---- Playback animation ---- */
  useEffect(() => {
    if (!isPlaying || telemetry.length === 0) return;
    const interval = setInterval(() => {
      setCurrentIndex(prev => {
        if (prev >= telemetry.length - 1) {
          setIsPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, 30);
    return () => clearInterval(interval);
  }, [isPlaying, telemetry.length]);

  /* ---- API Call ---- */
  const handleOptimize = useCallback(async () => {
    setLoading(true);
    setError(null);
    setCurrentIndex(0);
    setIsPlaying(false);
    try {
      const response = await fetch(`${API_URL}/api/optimize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target_speed_kmh: targetSpeedKmh,
          target_altitude: targetAltitude,
          payload_weight: payloadWeight,
        }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Optimization failed.');
      }
      const data = await response.json();
      setSpecs(data.optimal_specs);
      setTelemetry(data.telemetry);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Backend connection failed.');
    } finally {
      setLoading(false);
    }
  }, [targetSpeedKmh, targetAltitude, payloadWeight]);

  useEffect(() => { handleOptimize(); }, []);

  /* ---- Phase durations ---- */
  const phaseDurations = useMemo(() => {
    if (!telemetry.length) return null;
    const phases: Record<string, { start: number; end: number }> = {};
    for (const pt of telemetry) {
      if (!phases[pt.phase]) phases[pt.phase] = { start: pt.time, end: pt.time };
      phases[pt.phase].end = pt.time;
    }
    return phases;
  }, [telemetry]);

  /* ---- MTOW breakdown ---- */
  const weightBreakdown = useMemo(() => {
    if (!specs) return null;
    return [
      { name: 'Airframe', weight: 350, color: '#4B5563' },
      { name: 'Payload', weight: payloadWeight, color: '#6366F1' },
      { name: 'Turboshaft', weight: specs.engine_weight_kg, color: '#3B82F6' },
      { name: 'EMRAX Motor', weight: specs.motor_weight_kg, color: '#10B981' },
      { name: 'Battery', weight: specs.battery_weight_kg, color: '#F59E0B' },
      { name: 'Fuel (Jet-A1)', weight: specs.fuel_weight_kg, color: '#EF4444' },
    ];
  }, [specs, payloadWeight]);

  /* ================================================================ */
  /*  RENDER                                                           */
  /* ================================================================ */
  return (
    <div className="h-screen w-screen bg-[#0B0F19] text-slate-200 flex flex-col overflow-hidden select-none">

      {/* ──────────────── TOP BAR ──────────────── */}
      <header className="h-10 flex-shrink-0 flex items-center justify-between px-4 border-b border-slate-800/60 bg-[#0D1117]">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-bold tracking-[0.2em] uppercase text-slate-300">
            AeroOptima
          </span>
          <span className="text-[9px] text-slate-500 font-mono">
            HAL × IIT Indore | PS-1 Hybrid-Electric UAV
          </span>
        </div>
        <div className="flex items-center gap-4 text-[10px] font-mono text-slate-400">
          {specs && (
            <>
              <span>ENDURANCE: <b className="text-emerald-400">{specs.endurance_hours.toFixed(2)}h</b></span>
              <span>ENGINE: <b className="text-cyan-300">{specs.engine_kw.toFixed(1)}kW</b></span>
              <span>BATT: <b className="text-amber-300">{specs.battery_kwh.toFixed(1)}kWh</b></span>
              <span>MOTOR: <b className="text-purple-300">{specs.motor_model}</b></span>
            </>
          )}
        </div>
      </header>

      {/* ──────────────── MAIN 3-PANEL GRID ──────────────── */}
      <div className="flex-1 flex overflow-hidden">

        {/* ═══════ PANEL A: Controls & Status (Left) ═══════ */}
        <aside className="w-[280px] flex-shrink-0 border-r border-slate-800/60 bg-[#0D1117] flex flex-col overflow-y-auto">

          {/* Section: Mission Parameters */}
          <div className="p-3 border-b border-slate-800/40">
            <h2 className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.15em] mb-2">
              Simulation Constraints
            </h2>

            {/* Cruise Speed */}
            <div className="mb-2.5">
              <div className="flex justify-between text-[10px] mb-0.5">
                <span className="text-slate-400">Cruise Speed</span>
                <span className="font-mono text-emerald-400 font-bold">{targetSpeedKmh} km/h</span>
              </div>
              <input type="range" min="150" max="350" step="5" value={targetSpeedKmh}
                onChange={(e) => setTargetSpeedKmh(parseInt(e.target.value))} disabled={loading}
                className="w-full h-1 bg-slate-800 rounded appearance-none cursor-pointer accent-emerald-500 disabled:opacity-40" />
            </div>

            {/* Altitude */}
            <div className="mb-2.5">
              <div className="flex justify-between text-[10px] mb-0.5">
                <span className="text-slate-400">Target Altitude</span>
                <span className="font-mono text-emerald-400 font-bold">{targetAltitude}m</span>
              </div>
              <input type="range" min="3000" max="10000" step="250" value={targetAltitude}
                onChange={(e) => setTargetAltitude(parseInt(e.target.value))} disabled={loading}
                className="w-full h-1 bg-slate-800 rounded appearance-none cursor-pointer accent-emerald-500 disabled:opacity-40" />
            </div>

            {/* Payload */}
            <div className="mb-3">
              <div className="flex justify-between text-[10px] mb-0.5">
                <span className="text-slate-400">Payload Mass</span>
                <span className="font-mono text-emerald-400 font-bold">{payloadWeight} kg</span>
              </div>
              <input type="range" min="100" max="300" step="5" value={payloadWeight}
                onChange={(e) => setPayloadWeight(parseInt(e.target.value))} disabled={loading}
                className="w-full h-1 bg-slate-800 rounded appearance-none cursor-pointer accent-emerald-500 disabled:opacity-40" />
            </div>

            {/* Execute Button */}
            <button onClick={handleOptimize} disabled={loading}
              className="w-full py-2 text-[11px] font-bold uppercase tracking-[0.15em] rounded border transition-all
                bg-emerald-600/20 border-emerald-600/40 text-emerald-300 hover:bg-emerald-600/30 hover:border-emerald-500/60
                disabled:opacity-40 disabled:pointer-events-none flex items-center justify-center gap-2">
              {loading ? (
                <><div className="w-3.5 h-3.5 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />OPTIMIZING...</>
              ) : (
                <>▶ EXECUTE GA OPTIMIZER</>
              )}
            </button>
          </div>

          {/* Section: Current State */}
          {currentPoint && !loading && (
            <div className="p-3 border-b border-slate-800/40">
              <h2 className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.15em] mb-2">
                Current State — T+{fmtTime(currentPoint.time)}
              </h2>
              <div className={`inline-block text-[9px] font-bold uppercase px-2 py-0.5 rounded border mb-2 ${PHASE_BADGE[currentPoint.phase] || PHASE_BADGE.completed}`}>
                {currentPoint.phase}
              </div>

              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-[10px]">
                <div>
                  <span className="text-slate-500 text-[9px]">ALT</span>
                  <p className="font-mono font-bold text-slate-100">{currentPoint.altitude.toFixed(0)}m</p>
                </div>
                <div>
                  <span className="text-slate-500 text-[9px]">TAS</span>
                  <p className="font-mono font-bold text-slate-100">{(currentPoint.speed * 3.6).toFixed(0)} km/h</p>
                </div>
                <div>
                  <span className="text-slate-500 text-[9px]">P_REQ</span>
                  <p className="font-mono font-bold text-slate-100">{currentPoint.power_required.toFixed(1)} kW</p>
                </div>
                <div>
                  <span className="text-slate-500 text-[9px]">PSR</span>
                  <p className={`font-mono font-bold ${currentPoint.u > 0.4 ? 'text-amber-400' : currentPoint.u > 0.1 ? 'text-cyan-400' : 'text-emerald-400'}`}>
                    {(currentPoint.u * 100).toFixed(0)}%
                  </p>
                </div>
                <div>
                  <span className="text-slate-500 text-[9px]">MOTOR</span>
                  <p className="font-mono font-bold text-amber-300">{currentPoint.power_motor.toFixed(1)} kW</p>
                </div>
                <div>
                  <span className="text-slate-500 text-[9px]">ENGINE</span>
                  <p className="font-mono font-bold text-cyan-300">{currentPoint.power_engine.toFixed(1)} kW</p>
                </div>
                <div>
                  <span className="text-slate-500 text-[9px]">SOC</span>
                  <p className={`font-mono font-bold ${currentPoint.soc < 0.2 ? 'text-red-400' : 'text-yellow-300'}`}>
                    {(currentPoint.soc * 100).toFixed(1)}%
                  </p>
                </div>
                <div>
                  <span className="text-slate-500 text-[9px]">FUEL</span>
                  <p className={`font-mono font-bold ${currentPoint.fuel < 30 ? 'text-red-400' : 'text-slate-100'}`}>
                    {currentPoint.fuel.toFixed(1)} kg
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Section: Phase Timeline */}
          {phaseDurations && !loading && (
            <div className="p-3 border-b border-slate-800/40">
              <h2 className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.15em] mb-2">
                Mission Profile
              </h2>
              {Object.entries(phaseDurations).filter(([p]) => p !== 'completed').map(([phase, t]) => {
                const durMin = (t.end - t.start) / 60;
                return (
                  <div key={phase} className="flex justify-between text-[10px] py-0.5">
                    <span className={`capitalize font-medium ${PHASE_BADGE[phase]?.includes('text-') ? PHASE_BADGE[phase].split(' ').find(c => c.startsWith('text-')) : 'text-slate-400'}`}>
                      {phase}
                    </span>
                    <span className="text-slate-300 font-mono">{durMin.toFixed(1)} min</span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Section: Weight Budget */}
          {weightBreakdown && !loading && (
            <div className="p-3 border-b border-slate-800/40">
              <h2 className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.15em] mb-2">
                MTOW Budget — {specs?.total_weight_kg} kg
              </h2>
              {/* Stacked bar */}
              <div className="h-3 w-full flex rounded overflow-hidden mb-2">
                {weightBreakdown.map((bar, i) => (
                  <div key={i} style={{ width: `${(bar.weight / 1000) * 100}%`, backgroundColor: bar.color }}
                    className="h-full transition-all duration-300" title={`${bar.name}: ${bar.weight.toFixed(1)} kg`} />
                ))}
              </div>
              {weightBreakdown.map((bar, i) => (
                <div key={i} className="flex justify-between text-[10px] py-0.5">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-sm flex-shrink-0" style={{ backgroundColor: bar.color }} />
                    <span className="text-slate-400">{bar.name}</span>
                  </span>
                  <span className="font-mono text-slate-200">{bar.weight.toFixed(1)} kg</span>
                </div>
              ))}
            </div>
          )}

          {/* Section: Architecture */}
          {specs && !loading && (
            <div className="p-3 text-[10px]">
              <h2 className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.15em] mb-2">
                System Constants
              </h2>
              <div className="space-y-1">
                <div className="flex justify-between"><span className="text-slate-500">Drag Polar</span><span className="font-mono text-slate-300">Oswald AR=16.07</span></div>
                <div className="flex justify-between"><span className="text-slate-500">SFC</span><span className="font-mono text-slate-300">0.38 kg/kWh</span></div>
                <div className="flex justify-between"><span className="text-slate-500">C-Rate Limit</span><span className="font-mono text-yellow-400">3C/5C</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Motor η</span><span className="font-mono text-slate-300">96%</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Strategy</span><span className="font-mono text-emerald-400">Zhang et al.</span></div>
              </div>
            </div>
          )}

          {error && (
            <div className="p-3">
              <div className="bg-red-950/40 border border-red-800/40 text-red-300 rounded p-2 text-[10px]">
                <span className="font-bold">ERR:</span> {error}
              </div>
            </div>
          )}
        </aside>

        {/* ═══════ PANEL B + C: Main Content (Right) ═══════ */}
        <div className="flex-1 flex flex-col overflow-hidden">

          {/* Tab Switcher */}
          <div className="h-8 flex-shrink-0 flex items-center border-b border-slate-800/60 bg-[#0D1117] px-2 gap-1">
            <button onClick={() => setActiveTab('3d')}
              className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded transition-colors
                ${activeTab === '3d' ? 'bg-slate-800 text-emerald-400' : 'text-slate-500 hover:text-slate-300'}`}>
              3D Flight Profile
            </button>
            <button onClick={() => setActiveTab('charts')}
              className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded transition-colors
                ${activeTab === 'charts' ? 'bg-slate-800 text-emerald-400' : 'text-slate-500 hover:text-slate-300'}`}>
              Telemetry Charts
            </button>
            <div className="flex-1" />
            {currentPoint && (
              <span className="text-[10px] font-mono text-slate-500">
                T+{fmtTime(currentPoint.time)} | {currentPoint.altitude.toFixed(0)}m ALT | {currentPoint.phase.toUpperCase()}
              </span>
            )}
          </div>

          {/* Content Area: 3D Scene or Charts + Data Table */}
          <div className="flex-1 flex overflow-hidden">

            {/* Left: 3D Canvas or Charts */}
            <div className="flex-1 flex flex-col overflow-hidden">

              {loading ? (
                <div className="flex-1 flex flex-col items-center justify-center bg-[#0B0F19] text-slate-400">
                  <div className="w-14 h-14 border-4 border-slate-700 border-t-emerald-500 rounded-full animate-spin mb-4" />
                  <p className="font-bold text-xs text-slate-200 tracking-wider">GENETIC ALGORITHM EXECUTING</p>
                  <p className="text-[10px] text-slate-500 mt-1 font-mono">Sizing propulsion architecture | 40 pop × 15 gen</p>
                </div>
              ) : activeTab === '3d' ? (
                <>
                  {/* 3D Scene */}
                  <div className="flex-1 relative">
                    <FlightScene telemetry={telemetry} currentIndex={currentIndex} />
                    {/* Legend overlay */}
                    <div className="absolute bottom-2 left-2 flex gap-3 text-[9px] font-mono bg-[#0B0F19]/80 px-2 py-1 rounded border border-slate-800/40">
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500" />BATTERY</span>
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-cyan-500" />HYBRID</span>
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" />ENGINE</span>
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-slate-500" />IDLE</span>
                    </div>
                  </div>

                  {/* Timeline Scrubber */}
                  <div className="h-10 flex-shrink-0 flex items-center gap-3 px-3 border-t border-slate-800/60 bg-[#0D1117]">
                    <button onClick={() => setIsPlaying(!isPlaying)}
                      className="w-7 h-7 flex items-center justify-center text-xs border border-slate-700 rounded text-slate-300 hover:bg-slate-800 transition-colors">
                      {isPlaying ? '⏸' : '▶'}
                    </button>
                    <input type="range" min="0" max={Math.max(0, telemetry.length - 1)} step="1" value={currentIndex}
                      onChange={(e) => { setCurrentIndex(parseInt(e.target.value)); setIsPlaying(false); }}
                      className="flex-1 h-1 bg-slate-800 rounded appearance-none cursor-pointer accent-emerald-500" />
                    <span className="text-[10px] font-mono text-slate-400 w-20 text-right">
                      {telemetry.length > 0 ? `${currentIndex + 1}/${telemetry.length}` : '0/0'}
                    </span>
                  </div>
                </>
              ) : (
                /* Charts Tab */
                <div className="flex-1 overflow-y-auto p-2">
                  <TelemetryChart telemetry={telemetry} />
                </div>
              )}
            </div>

            {/* Right: Dense Telemetry Matrix */}
            <div className="w-[620px] flex-shrink-0 border-l border-slate-800/60 bg-[#0D1117] flex flex-col overflow-hidden">
              <div className="h-7 flex-shrink-0 flex items-center px-2 border-b border-slate-800/40">
                <h3 className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.15em]">
                  Propulsion Status Matrix — kW
                </h3>
              </div>
              <TelemetryTable telemetry={telemetry} currentIndex={currentIndex} onIndexChange={(i) => { setCurrentIndex(i); setIsPlaying(false); }} />
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
