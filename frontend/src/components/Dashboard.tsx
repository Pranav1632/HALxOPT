'use client';

import React, { useState, useEffect } from 'react';
import {
  Cpu, Battery, Zap, Shield, Compass, Hourglass, BarChart3,
  AlertCircle, Flame, Gauge, Weight, Plane,
} from 'lucide-react';
import TelemetryChart from './TelemetryChart';

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
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

export default function Dashboard() {
  const [targetSpeedKmh, setTargetSpeedKmh] = useState<number>(250);
  const [targetAltitude, setTargetAltitude] = useState<number>(5000);
  const [payloadWeight, setPayloadWeight] = useState<number>(200);

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [specs, setSpecs] = useState<OptimalSpecs | null>(null);
  const [telemetry, setTelemetry] = useState<TelemetryPoint[]>([]);

  const handleOptimize = async () => {
    setLoading(true);
    setError(null);
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
  };

  useEffect(() => { handleOptimize(); }, []);

  // Weight breakdown from real component specs
  const computeWeightBreakdown = () => {
    if (!specs) return null;
    return [
      { name: 'Airframe Structure', weight: 350, color: 'bg-slate-600' },
      { name: 'Mission Payload', weight: payloadWeight, color: 'bg-indigo-500' },
      { name: 'Turboshaft Engine', weight: specs.engine_weight_kg, color: 'bg-blue-500' },
      { name: 'EMRAX Motor', weight: specs.motor_weight_kg, color: 'bg-emerald-500' },
      { name: 'Battery Pack', weight: specs.battery_weight_kg, color: 'bg-yellow-500' },
      { name: 'Jet-A1 Fuel', weight: specs.fuel_weight_kg, color: 'bg-orange-500' },
    ];
  };
  const breakdown = computeWeightBreakdown();

  // Phase durations from telemetry
  const computePhaseDurations = () => {
    if (!telemetry || telemetry.length === 0) return null;
    const phases: Record<string, { start: number; end: number }> = {};
    for (const pt of telemetry) {
      if (!phases[pt.phase]) phases[pt.phase] = { start: pt.time, end: pt.time };
      phases[pt.phase].end = pt.time;
    }
    return phases;
  };
  const phaseDurations = computePhaseDurations();

  const phaseColors: Record<string, string> = {
    takeoff: 'text-red-400',
    climb: 'text-orange-400',
    cruise: 'text-blue-400',
    loiter: 'text-purple-400',
    descent: 'text-teal-400',
    landing: 'text-emerald-400',
    completed: 'text-slate-400',
  };

  return (
    <div className="flex-1 flex flex-col lg:flex-row bg-[#020617] text-slate-100 min-h-screen">
      {/* ─── SIDEBAR ─── */}
      <aside className="w-full lg:w-[420px] bg-[#030712] border-b lg:border-b-0 lg:border-r border-slate-800 p-6 flex flex-col gap-5 select-none shrink-0">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <Compass className="w-6 h-6 text-emerald-500" />
            <h1 className="text-xl font-bold bg-gradient-to-r from-slate-50 to-slate-300 bg-clip-text text-transparent">
              AeroOptima
            </h1>
            <span className="text-[10px] bg-slate-800 text-emerald-400 font-semibold px-2 py-0.5 rounded border border-slate-700">
              HAL × IIT Indore
            </span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Hybrid-Electric Propulsion Optimization for a 1000 kg Fixed-Wing UAV.
            Turboshaft + EMRAX 228 motor with Genetic Algorithm sizing.
          </p>
        </div>

        <hr className="border-slate-800" />

        <h2 className="text-xs font-bold text-slate-300 tracking-widest uppercase">Mission Parameters</h2>

        {/* Slider: Cruise Speed (km/h) */}
        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between text-xs">
            <label className="text-slate-400 font-medium">Cruise Speed</label>
            <span className="text-emerald-400 font-mono font-bold">
              {targetSpeedKmh} km/h
              <span className="text-[10px] text-slate-500 ml-1">({(targetSpeedKmh * 0.539957).toFixed(0)} kts)</span>
            </span>
          </div>
          <input type="range" min="150" max="350" step="5" value={targetSpeedKmh}
            onChange={(e) => setTargetSpeedKmh(parseInt(e.target.value))} disabled={loading}
            className="h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500 disabled:opacity-50" />
          <span className="text-[10px] text-slate-500 flex justify-between"><span>150 km/h</span><span>350 km/h</span></span>
        </div>

        {/* Slider: Cruise Altitude */}
        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between text-xs">
            <label className="text-slate-400 font-medium">Cruise Altitude</label>
            <span className="text-emerald-400 font-mono font-bold">
              {targetAltitude} m
              <span className="text-[10px] text-slate-500 ml-1">({(targetAltitude * 3.28084).toFixed(0)} ft)</span>
            </span>
          </div>
          <input type="range" min="1000" max="8000" step="250" value={targetAltitude}
            onChange={(e) => setTargetAltitude(parseInt(e.target.value))} disabled={loading}
            className="h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500 disabled:opacity-50" />
          <span className="text-[10px] text-slate-500 flex justify-between"><span>1000 m</span><span>8000 m</span></span>
        </div>

        {/* Slider: Payload */}
        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between text-xs">
            <label className="text-slate-400 font-medium">Mission Payload</label>
            <span className="text-emerald-400 font-mono font-bold">{payloadWeight} kg</span>
          </div>
          <input type="range" min="100" max="300" step="5" value={payloadWeight}
            onChange={(e) => setPayloadWeight(parseInt(e.target.value))} disabled={loading}
            className="h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500 disabled:opacity-50" />
          <span className="text-[10px] text-slate-500 flex justify-between"><span>100 kg</span><span>300 kg</span></span>
        </div>

        {/* Optimize Button */}
        <button onClick={handleOptimize} disabled={loading}
          className="w-full bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-slate-900 font-bold py-3 px-4 rounded-xl shadow-lg shadow-emerald-950/30 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none">
          {loading ? (
            <><div className="w-5 h-5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" /><span>GA Optimizing...</span></>
          ) : (
            <><Zap className="w-5 h-5 fill-slate-900 stroke-slate-900" /><span>Optimize Architecture</span></>
          )}
        </button>

        {/* Mission Phase Timeline */}
        {phaseDurations && !loading && (
          <div className="bg-slate-900/60 border border-slate-800/50 rounded-xl p-4 flex flex-col gap-2">
            <h3 className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Plane className="w-3.5 h-3.5 text-emerald-500" /> Mission Phase Timeline
            </h3>
            {Object.entries(phaseDurations).filter(([p]) => p !== 'completed').map(([phase, t]) => {
              const durMin = (t.end - t.start) / 60;
              return (
                <div key={phase} className="flex justify-between text-[11px]">
                  <span className={`capitalize font-medium ${phaseColors[phase] || 'text-slate-400'}`}>{phase}</span>
                  <span className="text-slate-300 font-mono">{durMin.toFixed(1)} min</span>
                </div>
              );
            })}
          </div>
        )}

        {error && (
          <div className="bg-red-950/40 border border-red-800 text-red-300 rounded-xl p-3 flex gap-2 items-start text-xs animate-fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-500 mt-0.5" />
            <div><p className="font-semibold">Backend Error</p><p className="text-[11px] text-red-400/90 mt-0.5">{error}</p></div>
          </div>
        )}

        <div className="text-[10px] text-slate-500 mt-auto leading-relaxed border-t border-slate-800 pt-3">
          DEAP Genetic Algorithm optimizes engine size (kW) &amp; battery capacity (kWh) across 15 generations.
          Heuristic power management per Zhang et al.: motor for climb peaks, engine at optimal SFC for cruise.
        </div>
      </aside>

      {/* ─── MAIN CONTENT ─── */}
      <main className="flex-1 p-6 flex flex-col gap-6 overflow-y-auto">

        {/* Metric Cards */}
        <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {/* Endurance */}
          <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-5 hover:border-slate-700/80 transition-all flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Max Endurance</p>
              <h3 className="text-2xl font-bold text-slate-50 font-mono mt-1">
                {loading ? '---' : specs ? `${specs.endurance_hours.toFixed(2)} hrs` : 'N/A'}
              </h3>
              <p className="text-[10px] text-emerald-400 mt-1 flex items-center gap-1">
                <Shield className="w-3 h-3" /> Full Mission Profile
              </p>
            </div>
            <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <Hourglass className="w-6 h-6" />
            </div>
          </div>

          {/* Turboshaft */}
          <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-5 hover:border-slate-700/80 transition-all flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Turboshaft Engine</p>
              <h3 className="text-2xl font-bold text-slate-50 font-mono mt-1">
                {loading ? '---' : specs ? `${specs.engine_kw.toFixed(1)} kW` : 'N/A'}
              </h3>
              <p className="text-[10px] text-slate-500 mt-1">
                {specs ? `${specs.engine_weight_kg.toFixed(1)} kg | SFC: 0.38 kg/kWh` : ''}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400">
              <Flame className="w-6 h-6" />
            </div>
          </div>

          {/* Battery */}
          <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-5 hover:border-slate-700/80 transition-all flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Battery Pack</p>
              <h3 className="text-2xl font-bold text-slate-50 font-mono mt-1">
                {loading ? '---' : specs ? `${specs.battery_kwh.toFixed(1)} kWh` : 'N/A'}
              </h3>
              <p className="text-[10px] text-slate-500 mt-1">
                {specs ? `${specs.battery_weight_kg.toFixed(1)} kg | 250 Wh/kg NCA` : ''}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-yellow-400">
              <Battery className="w-6 h-6" />
            </div>
          </div>

          {/* Motor */}
          <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-5 hover:border-slate-700/80 transition-all flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Electric Motor</p>
              <h3 className="text-2xl font-bold text-slate-50 font-mono mt-1">
                {loading ? '---' : specs ? `${specs.motor_kw.toFixed(0)} kW` : 'N/A'}
              </h3>
              <p className="text-[10px] text-slate-500 mt-1">
                {specs ? `${specs.motor_model} | ${specs.motor_weight_kg} kg` : ''}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400">
              <Zap className="w-6 h-6" />
            </div>
          </div>
        </section>

        {/* Telemetry Chart */}
        <section className="w-full">
          {loading ? (
            <div className="h-[450px] w-full flex flex-col items-center justify-center bg-slate-950 border border-slate-800 rounded-xl text-slate-400">
              <div className="w-12 h-12 border-4 border-slate-700 border-t-emerald-500 rounded-full animate-spin mb-4" />
              <p className="font-semibold text-slate-200">Running Genetic Algorithm...</p>
              <p className="text-xs text-slate-400 mt-1">Sizing propulsion &amp; simulating full mission profile</p>
            </div>
          ) : (
            <TelemetryChart telemetry={telemetry} />
          )}
        </section>

        {/* Weight Breakdown + Architecture Constants */}
        {specs && !loading && (
          <section className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Weight Budget */}
            <div className="xl:col-span-2 bg-slate-950 border border-slate-800 rounded-xl p-6 flex flex-col gap-4">
              <div>
                <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-emerald-500" /> MTOW Budget Breakdown
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Constrained to {specs.total_weight_kg} kg maximum takeoff weight.</p>
              </div>
              <div className="h-7 w-full flex rounded-lg overflow-hidden bg-slate-800">
                {breakdown?.map((bar, i) => (
                  <div key={i} style={{ width: `${(bar.weight / 1000) * 100}%` }}
                    className={`${bar.color} h-full transition-all duration-500 hover:brightness-125 cursor-help`}
                    title={`${bar.name}: ${bar.weight.toFixed(1)} kg (${((bar.weight / 1000) * 100).toFixed(1)}%)`} />
                ))}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs mt-1">
                {breakdown?.map((bar, i) => (
                  <div key={i} className="flex items-center gap-2 bg-slate-900/60 border border-slate-800/40 rounded-lg p-2.5">
                    <span className={`w-3 h-3 rounded shrink-0 ${bar.color}`} />
                    <div className="overflow-hidden">
                      <p className="text-[10px] text-slate-400 font-medium truncate">{bar.name}</p>
                      <p className="font-semibold text-slate-200 font-mono mt-0.5">
                        {bar.weight.toFixed(1)} kg
                        <span className="text-[10px] text-slate-500 font-normal ml-1">
                          ({((bar.weight / 1000) * 100).toFixed(0)}%)
                        </span>
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Architecture Constants */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-6 flex flex-col gap-3">
              <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2">
                <Gauge className="w-5 h-5 text-emerald-500" /> Architecture Specs
              </h3>
              <div className="flex-1 flex flex-col justify-between gap-2.5 text-xs">
                <div className="flex justify-between border-b border-slate-800 pb-2">
                  <span className="text-slate-400">Empty Weight (no payload)</span>
                  <span className="font-semibold text-slate-200 font-mono">{specs.empty_weight_kg.toFixed(1)} kg</span>
                </div>
                <div className="flex justify-between border-b border-slate-800 pb-2">
                  <span className="text-slate-400">Payload Weight</span>
                  <span className="font-semibold text-slate-200 font-mono">{payloadWeight} kg</span>
                </div>
                <div className="flex justify-between border-b border-slate-800 pb-2">
                  <span className="text-slate-400">Fuel Capacity (Jet-A1)</span>
                  <span className="font-semibold text-orange-400 font-mono">{specs.fuel_weight_kg.toFixed(1)} kg</span>
                </div>
                <div className="flex justify-between border-b border-slate-800 pb-2">
                  <span className="text-slate-400">Power Strategy</span>
                  <span className="font-semibold text-slate-200 font-mono text-right">Zhang et al. Heuristic</span>
                </div>
                <div className="flex justify-between border-b border-slate-800 pb-2">
                  <span className="text-slate-400">Drag Polar</span>
                  <span className="font-semibold text-slate-200 font-mono">Oswald (AR=16.07)</span>
                </div>
                <div className="flex justify-between border-b border-slate-800 pb-2">
                  <span className="text-slate-400">Battery C-rate Limit</span>
                  <span className="font-semibold text-yellow-400 font-mono">3C cont / 5C peak</span>
                </div>
                <div className="flex justify-between pt-1">
                  <span className="text-slate-400 font-medium">MTOW Constraint</span>
                  <span className="font-bold text-emerald-400 font-mono">1000.0 kg</span>
                </div>
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
