'use client';

import React, { useState, useEffect } from 'react';
import { Cpu, Battery, Zap, Shield, Compass, Hourglass, BarChart3, AlertCircle } from 'lucide-react';
import TelemetryChart from './TelemetryChart';

interface OptimalSpecs {
  engine_kw: number;
  battery_kwh: number;
  motor_kw: number;
  endurance_hours: number;
  empty_weight_kg: number;
  fuel_weight_kg: number;
  total_weight_kg: number;
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
  const [targetSpeed, setTargetSpeed] = useState<number>(45); // m/s
  const [targetAltitude, setTargetAltitude] = useState<number>(2000); // meters
  const [payloadWeight, setPayloadWeight] = useState<number>(200); // kg

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
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          target_speed: targetSpeed,
          target_altitude: targetAltitude,
          payload_weight: payloadWeight,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to optimize architecture.');
      }

      const data = await response.json();
      setSpecs(data.optimal_specs);
      setTelemetry(data.telemetry);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Connecting to backend optimizer failed.');
    } finally {
      setLoading(false);
    }
  };

  // Run initial optimization on mount
  useEffect(() => {
    handleOptimize();
  }, []);

  // Compute components weight details (constants loaded from JSON but replicated for breakdown UI display)
  const computeWeightBreakdown = () => {
    if (!specs) return null;
    const airframe = 350; // baseline
    const engineW = specs.engine_kw * 0.6;
    const motorW = specs.motor_kw * 0.85;
    const batteryW = (specs.battery_kwh * 1000) / 240;
    
    return [
      { name: 'Baseline Airframe', weight: airframe, pct: (airframe / 1000) * 100, color: 'bg-slate-700' },
      { name: 'Payload', weight: payloadWeight, pct: (payloadWeight / 1000) * 100, color: 'bg-indigo-600' },
      { name: 'Turboshaft Engine', weight: engineW, pct: (engineW / 1000) * 100, color: 'bg-blue-500' },
      { name: 'Electric Motor', weight: motorW, pct: (motorW / 1000) * 100, color: 'bg-emerald-500' },
      { name: 'Battery Pack', weight: batteryW, pct: (batteryW / 1000) * 100, color: 'bg-yellow-500' },
      { name: 'Fuel Capacity', weight: specs.fuel_weight_kg, pct: (specs.fuel_weight_kg / 1000) * 100, color: 'bg-orange-500' },
    ];
  };

  const breakdown = computeWeightBreakdown();

  return (
    <div className="flex-1 flex flex-col lg:flex-row bg-[#020617] text-slate-100 min-h-screen">
      
      {/* 1. Sidebar - Mission Controls */}
      <aside className="w-full lg:w-96 bg-[#030712] border-b lg:border-b-0 lg:border-r border-slate-800 p-6 flex flex-col gap-6 select-none shrink-0">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Compass className="w-6 h-6 text-emerald-500 animate-pulse" />
            <h1 className="text-xl font-bold bg-gradient-to-r from-slate-50 to-slate-300 bg-clip-text text-transparent">
              AeroOptima
            </h1>
            <span className="text-[10px] bg-slate-800 text-emerald-400 font-semibold px-2 py-0.5 rounded border border-slate-700">UAV SIM v1.0</span>
          </div>
          <p className="text-xs text-slate-400">
            Hybrid-Electric Propulsion Optimization System for 1000 kg Fixed-Wing UAVs.
          </p>
        </div>

        <hr className="border-slate-800" />

        {/* Input Parameters Form */}
        <div className="flex flex-col gap-6">
          <h2 className="text-sm font-semibold text-slate-300 tracking-wider uppercase">Mission Parameters</h2>

          {/* Slider 1: Target Cruise Speed */}
          <div className="flex flex-col gap-2">
            <div className="flex justify-between text-xs">
              <label className="text-slate-400 font-medium">Target Cruise Speed</label>
              <span className="text-emerald-400 font-mono font-bold">
                {targetSpeed} m/s <span className="text-[10px] text-slate-500">({(targetSpeed * 1.94384).toFixed(0)} kts)</span>
              </span>
            </div>
            <input
              type="range"
              min="35"
              max="70"
              value={targetSpeed}
              onChange={(e) => setTargetSpeed(parseInt(e.target.value))}
              disabled={loading}
              className="h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500 disabled:opacity-50"
            />
            <span className="text-[10px] text-slate-500 flex justify-between">
              <span>35 m/s</span>
              <span>70 m/s</span>
            </span>
          </div>

          {/* Slider 2: Target Cruise Altitude */}
          <div className="flex flex-col gap-2">
            <div className="flex justify-between text-xs">
              <label className="text-slate-400 font-medium">Target Altitude</label>
              <span className="text-emerald-400 font-mono font-bold">
                {targetAltitude} m <span className="text-[10px] text-slate-500">({(targetAltitude * 3.28084).toFixed(0)} ft)</span>
              </span>
            </div>
            <input
              type="range"
              min="500"
              max="4000"
              step="100"
              value={targetAltitude}
              onChange={(e) => setTargetAltitude(parseInt(e.target.value))}
              disabled={loading}
              className="h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500 disabled:opacity-50"
            />
            <span className="text-[10px] text-slate-500 flex justify-between">
              <span>500 m</span>
              <span>4000 m</span>
            </span>
          </div>

          {/* Slider 3: Payload Weight */}
          <div className="flex flex-col gap-2">
            <div className="flex justify-between text-xs">
              <label className="text-slate-400 font-medium">Mission Payload</label>
              <span className="text-emerald-400 font-mono font-bold">{payloadWeight} kg</span>
            </div>
            <input
              type="range"
              min="100"
              max="350"
              step="5"
              value={payloadWeight}
              onChange={(e) => setPayloadWeight(parseInt(e.target.value))}
              disabled={loading}
              className="h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500 disabled:opacity-50"
            />
            <span className="text-[10px] text-slate-500 flex justify-between">
              <span>100 kg</span>
              <span>350 kg</span>
            </span>
          </div>

          {/* Run Button */}
          <button
            onClick={handleOptimize}
            disabled={loading}
            className="w-full bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-slate-900 font-bold py-3 px-4 rounded-xl shadow-lg shadow-emerald-950/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
                <span>GA Optimizing...</span>
              </>
            ) : (
              <>
                <Zap className="w-5 h-5 fill-slate-900 stroke-slate-900" />
                <span>Optimize Architecture</span>
              </>
            )}
          </button>
        </div>

        {error && (
          <div className="bg-red-950/40 border border-red-800 text-red-300 rounded-xl p-3 flex gap-2 items-start text-xs mt-auto animate-fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-500 mt-0.5" />
            <div>
              <p className="font-semibold">Backend Error</p>
              <p className="text-[11px] text-red-400/90 leading-relaxed mt-0.5">{error}</p>
            </div>
          </div>
        )}

        <div className="text-[10px] text-slate-500 mt-auto leading-relaxed border-t border-slate-800 pt-4">
          Genetic Algorithm runs 15 generations over a population of 40 size-combinations in the FastAPI backend, utilizing a coupled physics simulation environment.
        </div>
      </aside>

      {/* 2. Main Content - Metrics & Graphs */}
      <main className="flex-1 p-6 flex flex-col gap-6 overflow-y-auto">
        
        {/* Metric Cards Grid */}
        <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          
          {/* Card 1: Max Endurance */}
          <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-5 hover:border-slate-700/80 transition-all flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Max Endurance</p>
              <h3 className="text-2xl font-bold text-slate-50 font-mono mt-1">
                {loading ? '---' : specs ? `${specs.endurance_hours.toFixed(2)} hrs` : 'N/A'}
              </h3>
              <p className="text-[10px] text-emerald-400 mt-1 flex items-center gap-1">
                <Shield className="w-3 h-3" /> Fully Sized Mission
              </p>
            </div>
            <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <Hourglass className="w-6 h-6" />
            </div>
          </div>

          {/* Card 2: Turboshaft size */}
          <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-5 hover:border-slate-700/80 transition-all flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Sized Turboshaft</p>
              <h3 className="text-2xl font-bold text-slate-50 font-mono mt-1">
                {loading ? '---' : specs ? `${specs.engine_kw.toFixed(1)} kW` : 'N/A'}
              </h3>
              <p className="text-[10px] text-slate-500 mt-1">
                Weight: {specs ? `${(specs.engine_kw * 0.6).toFixed(1)} kg` : 'N/A'}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400">
              <Cpu className="w-6 h-6" />
            </div>
          </div>

          {/* Card 3: Battery Capacity */}
          <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-5 hover:border-slate-700/80 transition-all flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Sized Battery</p>
              <h3 className="text-2xl font-bold text-slate-50 font-mono mt-1">
                {loading ? '---' : specs ? `${specs.battery_kwh.toFixed(1)} kWh` : 'N/A'}
              </h3>
              <p className="text-[10px] text-slate-500 mt-1">
                Weight: {specs ? `${((specs.battery_kwh * 1000) / 240).toFixed(1)} kg` : 'N/A'}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-yellow-400">
              <Battery className="w-6 h-6" />
            </div>
          </div>

          {/* Card 4: Electric Motor Size */}
          <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-5 hover:border-slate-700/80 transition-all flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Sized Motor</p>
              <h3 className="text-2xl font-bold text-slate-50 font-mono mt-1">
                {loading ? '---' : specs ? `${specs.motor_kw.toFixed(1)} kW` : 'N/A'}
              </h3>
              <p className="text-[10px] text-slate-500 mt-1">
                Weight: {specs ? `${(specs.motor_kw * 0.85).toFixed(1)} kg` : 'N/A'}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400">
              <Zap className="w-6 h-6" />
            </div>
          </div>

        </section>

        {/* Graph Section */}
        <section className="w-full">
          {loading ? (
            <div className="h-[450px] w-full flex flex-col items-center justify-center bg-slate-950 border border-slate-800 rounded-xl text-slate-400">
              <div className="w-12 h-12 border-4 border-slate-700 border-t-emerald-500 rounded-full animate-spin mb-4"></div>
              <p className="font-semibold text-slate-200">Executing Genetic Sizing Search...</p>
              <p className="text-xs text-slate-400 mt-1">Sizing engines & simulating flight trajectories</p>
            </div>
          ) : (
            <TelemetryChart telemetry={telemetry} />
          )}
        </section>

        {/* Weight Breakdown & Architecture details */}
        {specs && !loading && (
          <section className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            
            {/* Weight Budget Stacked Bar */}
            <div className="xl:col-span-2 bg-slate-950 border border-slate-800 rounded-xl p-6 flex flex-col gap-4">
              <div>
                <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-emerald-500" /> Maximum Takeoff Weight (MTOW) Breakdown
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">UAV mass budget schedule limited to 1000.0 kg.</p>
              </div>

              {/* Progress stack */}
              <div className="h-6 w-full flex rounded-lg overflow-hidden bg-slate-800">
                {breakdown?.map((bar, i) => (
                  <div
                    key={i}
                    style={{ width: `${bar.pct}%` }}
                    className={`${bar.color} h-full transition-all duration-500 hover:brightness-110 relative group cursor-help`}
                    title={`${bar.name}: ${bar.weight.toFixed(1)} kg (${bar.pct.toFixed(1)}%)`}
                  />
                ))}
              </div>

              {/* Legend grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs mt-2">
                {breakdown?.map((bar, i) => (
                  <div key={i} className="flex items-center gap-2 bg-slate-900/60 border border-slate-800/40 rounded-lg p-2.5">
                    <span className={`w-3 h-3 rounded shrink-0 ${bar.color}`}></span>
                    <div className="overflow-hidden">
                      <p className="text-[10px] text-slate-400 font-medium truncate">{bar.name}</p>
                      <p className="font-semibold text-slate-200 font-mono mt-0.5">
                        {bar.weight.toFixed(1)} kg <span className="text-[10px] text-slate-500 font-normal">({bar.pct.toFixed(0)}%)</span>
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Sizing Architecture Metrics Table */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-6 flex flex-col gap-4">
              <h3 className="text-base font-semibold text-slate-100">UAV Architecture Constants</h3>
              <div className="flex-1 flex flex-col justify-between gap-3 text-xs">
                
                <div className="flex justify-between border-b border-slate-800 pb-2">
                  <span className="text-slate-400">Total Structural Weight (Empty)</span>
                  <span className="font-semibold text-slate-200 font-mono">{specs.empty_weight_kg.toFixed(1)} kg</span>
                </div>

                <div className="flex justify-between border-b border-slate-800 pb-2">
                  <span className="text-slate-400">Payload Weight</span>
                  <span className="font-semibold text-slate-200 font-mono">{payloadWeight.toFixed(1)} kg</span>
                </div>

                <div className="flex justify-between border-b border-slate-800 pb-2">
                  <span className="text-slate-400">Calculated Fuel Capacity</span>
                  <span className="font-semibold text-slate-200 font-mono text-orange-400">{specs.fuel_weight_kg.toFixed(1)} kg</span>
                </div>

                <div className="flex justify-between border-b border-slate-800 pb-2">
                  <span className="text-slate-400">Degree of Hybridization (Cruise)</span>
                  <span className="font-semibold text-slate-200 font-mono">50 / 50 Static Split</span>
                </div>

                <div className="flex justify-between border-b border-slate-800 pb-2">
                  <span className="text-slate-400">Aerodynamic Lift limit</span>
                  <span className="font-semibold text-emerald-400 font-mono">Cl ≤ 1.5 Stall Bound</span>
                </div>

                <div className="flex justify-between pt-1">
                  <span className="text-slate-400 font-medium">Target MTOW Constrained</span>
                  <span className="font-bold text-slate-100 font-mono">1000.0 kg</span>
                </div>

              </div>
            </div>

          </section>
        )}

      </main>
    </div>
  );
}
