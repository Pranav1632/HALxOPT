'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import dynamic_import from 'next/dynamic';
import TelemetryTable from './TelemetryTable';
import TelemetryChart from './TelemetryChart';

import { OptimalSpecs, TelemetryPoint, fmtTime } from '../types/telemetry';
import { fetchOptimizationResults } from '../services/api';

import DashboardHeader from './dashboard/DashboardHeader';
import SimulationControls from './dashboard/SimulationControls';
import CurrentStateWidget from './dashboard/CurrentStateWidget';
import RLStatusPanel from './dashboard/RLStatusPanel';
import MissionProfileTimeline from './dashboard/MissionProfileTimeline';
import WeightBudgetWidget from './dashboard/WeightBudgetWidget';
import SystemConstantsWidget from './dashboard/SystemConstantsWidget';
import ShapAuditModal from './dashboard/ShapAuditModal';

const FlightScene = dynamic_import(() => import('./FlightScene'), { ssr: false });

export default function Dashboard() {
  const [targetSpeedKmh, setTargetSpeedKmh] = useState<number>(250);
  const [targetAltitude, setTargetAltitude] = useState<number>(5000);
  const [payloadWeight, setPayloadWeight] = useState<number>(200);

  // Flight envelope coupling: mirror backend Pydantic model_validator (Alt > 8000m → payload ≤ 200 kg)
  const handleTargetAltitudeChange = (val: number) => {
    setTargetAltitude(val);
    if (val > 8000 && payloadWeight > 200) {
      setPayloadWeight(200);
    }
  };
  const [enableLoiter, setEnableLoiter] = useState<boolean>(true);
  const [silentLoiterMode, setSilentLoiterMode] = useState<boolean>(true);
  const [showMatrix, setShowMatrix] = useState<boolean>(true);
  const [initialFuelFraction, setInitialFuelFraction] = useState<number>(1.0);
  const [headwindKmh, setHeadwindKmh] = useState<number>(0);
  const [ambientTempC, setAmbientTempC] = useState<number>(15);
  const [turbulenceLevel, setTurbulenceLevel] = useState<number>(0);
  const [policyMode, setPolicyMode] = useState<string>('heuristic');

  const [isShapModalOpen, setIsShapModalOpen] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [specs, setSpecs] = useState<OptimalSpecs | null>(null);
  const [telemetry, setTelemetry] = useState<TelemetryPoint[]>([]);
  const [envMetadata, setEnvMetadata] = useState<Record<string, any>>({});
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'3d' | 'charts'>('3d');
  const [genCount, setGenCount] = useState<number>(1);
  const [loadProgress, setLoadProgress] = useState<number>(0);
  const genTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const currentPoint = useMemo(() => {
    if (telemetry.length === 0) return null;
    return telemetry[Math.min(currentIndex, telemetry.length - 1)];
  }, [telemetry, currentIndex]);

  useEffect(() => {
    if (!isPlaying || telemetry.length === 0) return;
    const interval = setInterval(() => {
      setCurrentIndex(prev => {
        if (prev >= telemetry.length - 1) { setIsPlaying(false); return prev; }
        return prev + 1;
      });
    }, 30);
    return () => clearInterval(interval);
  }, [isPlaying, telemetry.length]);

  useEffect(() => {
    if (loading) {
      setGenCount(1);
      setLoadProgress(0);
      genTimerRef.current = setInterval(() => {
        setGenCount(prev => (prev < 15 ? prev + 1 : 15));
        setLoadProgress(prev => Math.min(prev + 6.5, 98));
      }, 500);
    } else {
      if (genTimerRef.current) clearInterval(genTimerRef.current);
      setLoadProgress(100);
    }
    return () => {
      if (genTimerRef.current) clearInterval(genTimerRef.current);
    };
  }, [loading]);

  const handleOptimize = useCallback(async () => {
    setLoading(true);
    setError(null);
    setCurrentIndex(0);
    setIsPlaying(false);
    try {
      const data = await fetchOptimizationResults({
        targetSpeedKmh,
        targetAltitude,
        payloadWeight,
        enableLoiter,
        silentLoiterMode,
        initialFuelFraction,
        headwindKmh,
        ambientTempC,
        turbulenceLevel,
        policyMode,
      });
      setSpecs(data.optimal_specs);
      setTelemetry(data.telemetry || []);
      if (data.env_metadata) setEnvMetadata(data.env_metadata);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Backend connection failed.');
    } finally {
      setLoading(false);
    }
  }, [targetSpeedKmh, targetAltitude, payloadWeight, enableLoiter, silentLoiterMode, initialFuelFraction, headwindKmh, ambientTempC, turbulenceLevel, policyMode]);

  // Initial load to populate telemetry, 3D flight path, header specs & matrix
  useEffect(() => {
    handleOptimize();
  }, []);

  const phaseDurations = useMemo(() => {
    if (!telemetry.length) return null;
    const phases: Record<string, { start: number; end: number }> = {};
    for (const pt of telemetry) {
      if (!phases[pt.phase]) phases[pt.phase] = { start: pt.time, end: pt.time };
      phases[pt.phase].end = pt.time;
    }
    return phases;
  }, [telemetry]);

  const totalMissionTime = useMemo(() => {
    if (!phaseDurations) return 1;
    return Object.values(phaseDurations).reduce((acc, t) => acc + (t.end - t.start), 0) || 1;
  }, [phaseDurations]);

  const weightBreakdown = useMemo(() => {
    if (!specs) return null;
    const airframeMass = specs.airframe_weight_kg || 350;
    return [
      { name: 'Airframe', weight: airframeMass, color: '#4B5563' },
      { name: 'Payload', weight: payloadWeight, color: '#6366F1' },
      { name: 'Turboshaft', weight: specs.engine_weight_kg, color: '#3B82F6' },
      { name: 'EMRAX Motor', weight: specs.motor_weight_kg, color: '#10B981' },
      { name: 'Battery', weight: specs.battery_weight_kg, color: '#F59E0B' },
      { name: 'Fuel (Jet-A1)', weight: specs.fuel_weight_kg, color: '#EF4444' },
    ];
  }, [specs, payloadWeight]);

  const totalWeight = useMemo(() => weightBreakdown?.reduce((s, b) => s + b.weight, 0) || 1000, [weightBreakdown]);

  return (
    <div className="h-screen w-screen bg-[#0B0F19] text-slate-200 flex flex-col overflow-hidden select-none">
      <DashboardHeader specs={specs} onOpenShapModal={() => setIsShapModalOpen(true)} />
      <ShapAuditModal isOpen={isShapModalOpen} onClose={() => setIsShapModalOpen(false)} />

      <div className="flex-1 flex overflow-hidden">
        <aside className="w-[284px] flex-shrink-0 border-r border-slate-800/60 bg-[#0D1117] flex flex-col overflow-y-auto custom-scrollbar">
          <SimulationControls
            targetSpeedKmh={targetSpeedKmh} setTargetSpeedKmh={setTargetSpeedKmh}
            targetAltitude={targetAltitude} setTargetAltitude={handleTargetAltitudeChange}
            payloadWeight={payloadWeight} setPayloadWeight={setPayloadWeight}
            initialFuelFraction={initialFuelFraction} setInitialFuelFraction={setInitialFuelFraction}
            enableLoiter={enableLoiter} setEnableLoiter={setEnableLoiter}
            silentLoiterMode={silentLoiterMode} setSilentLoiterMode={setSilentLoiterMode}
            headwindKmh={headwindKmh} setHeadwindKmh={setHeadwindKmh}
            ambientTempC={ambientTempC} setAmbientTempC={setAmbientTempC}
            turbulenceLevel={turbulenceLevel} setTurbulenceLevel={setTurbulenceLevel}
            policyMode={policyMode} setPolicyMode={setPolicyMode}
            loading={loading} loadProgress={loadProgress} handleOptimize={handleOptimize}
          />

          {currentPoint && !loading && (
            <CurrentStateWidget currentPoint={currentPoint} />
          )}

          {/* Neural RL Policy Monitor — always shown when telemetry exists */}
          {telemetry.length > 0 && !loading && (
            <RLStatusPanel
              telemetry={telemetry}
              currentIndex={currentIndex}
              policyMode={policyMode}
              envMetadata={envMetadata}
            />
          )}

          {phaseDurations && !loading && (
            <MissionProfileTimeline phaseDurations={phaseDurations} totalMissionTime={totalMissionTime} />
          )}

          {weightBreakdown && specs && !loading && (
            <WeightBudgetWidget specs={specs} weightBreakdown={weightBreakdown} totalWeight={totalWeight} />
          )}

          {specs && !loading && (
            <SystemConstantsWidget specs={specs} envMetadata={envMetadata} />
          )}

          {error && (
            <div className="m-2">
              <div className="bg-red-950/40 border border-red-800/40 text-red-300 rounded-lg p-2.5 text-[10px]">
                <span className="font-bold">ERR:</span> {error}
              </div>
            </div>
          )}
        </aside>

        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="h-9 flex-shrink-0 flex items-end border-b border-slate-800/60 bg-[#0D1117] px-2 gap-1">
            {(['3d', 'charts'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 pb-1.5 pt-1 text-[10px] font-bold uppercase tracking-wider transition-all relative border-b-2 ${activeTab === tab
                    ? 'border-b-emerald-500 text-emerald-400'
                    : 'border-b-transparent text-slate-500 hover:text-slate-300'
                  }`}
              >
                {tab === '3d' ? '3D Flight Profile' : 'Telemetry Charts'}
              </button>
            ))}
            <button
              onClick={() => setShowMatrix(!showMatrix)}
              className="px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded border border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 transition-colors ml-2 mb-1.5"
            >
              {showMatrix ? 'Collapse Matrix' : 'Expand Matrix'}
            </button>
            <div className="flex-1" />
            {currentPoint && (
              <span className="text-[10px] font-mono text-slate-500 mb-1.5">
                T+{fmtTime(currentPoint.time)} | {currentPoint.altitude.toFixed(0)}m ALT | {currentPoint.phase.toUpperCase()}
              </span>
            )}
          </div>

          <div className="flex-1 flex overflow-hidden">
            <div className="flex-1 flex flex-col overflow-hidden">
              {loading ? (
                <div className="flex-1 flex flex-col items-center justify-center bg-[#0B0F19] gap-4">
                  <div className="relative w-20 h-20">
                    <div className="absolute inset-0 rounded-full border-4 border-slate-800" />
                    <div className="absolute inset-0 rounded-full border-4 border-t-emerald-500 border-r-transparent border-b-transparent border-l-transparent animate-spin" />
                    <div className="absolute inset-2 rounded-full border-2 border-t-transparent border-r-cyan-500/50 border-b-transparent border-l-transparent animate-spin" style={{ animationDuration: '1.5s', animationDirection: 'reverse' }} />
                  </div>
                  <div className="text-center">
                    <p className="font-extrabold text-base text-slate-100 tracking-[0.3em] uppercase">Genetic Algorithm Executing</p>
                    <p className="text-[11px] font-mono text-emerald-400 mt-1 tracking-widest">
                      GEN {String(genCount).padStart(2, '0')} / 15
                    </p>
                    <p className="text-[10px] text-slate-500 mt-1 font-mono">Sizing propulsion architecture | 40 pop × 15 gen</p>
                  </div>
                  <div className="w-64 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-600 to-cyan-400 rounded-full transition-all duration-500"
                      style={{ width: `${loadProgress}%` }}
                    />
                  </div>
                </div>
              ) : activeTab === '3d' ? (
                <>
                  <div className="flex-1 relative">
                    <FlightScene telemetry={telemetry} currentIndex={currentIndex} />
                    <div
                      className="absolute bottom-3 left-3 flex gap-3 text-[9px] font-mono px-3 py-1.5 rounded-full border border-slate-700/50"
                      style={{
                        background: 'rgba(11,15,25,0.72)',
                        backdropFilter: 'blur(10px)',
                        WebkitBackdropFilter: 'blur(10px)',
                        boxShadow: '0 2px 16px rgba(0,0,0,0.5)',
                      }}
                    >
                      <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-500" />BATTERY</span>
                      <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-cyan-500" />HYBRID</span>
                      <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500" />ENGINE</span>
                      <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-slate-500" />IDLE</span>
                    </div>
                  </div>

                  <div className="h-12 flex-shrink-0 flex items-center gap-3 px-4 border-t border-slate-800/60 bg-[#0D1117]">
                    <button
                      onClick={() => setIsPlaying(!isPlaying)}
                      className="w-8 h-8 flex items-center justify-center text-sm border border-slate-700 rounded-full text-slate-300
                        hover:bg-emerald-900/30 hover:border-emerald-600/60 hover:shadow-[0_0_12px_rgba(16,185,129,0.3)] transition-all"
                    >
                      {isPlaying ? '⏸' : '▶'}
                    </button>
                    <div className="flex-1 relative">
                      <input
                        type="range"
                        min="0"
                        max={Math.max(0, telemetry.length - 1)}
                        step="1"
                        value={currentIndex}
                        onChange={(e) => { setCurrentIndex(parseInt(e.target.value)); setIsPlaying(false); }}
                        className="w-full appearance-none cursor-pointer"
                        style={{
                          height: '4px',
                          background: telemetry.length > 0
                            ? `linear-gradient(to right, #10b981 ${(currentIndex / Math.max(1, telemetry.length - 1)) * 100}%, #22d3ee ${(currentIndex / Math.max(1, telemetry.length - 1)) * 100}%, #1e293b 100%)`
                            : '#1e293b',
                          borderRadius: '9999px',
                        }}
                      />
                    </div>
                    <span className="text-[10px] font-mono text-slate-400 w-20 text-right">
                      {telemetry.length > 0 ? `${currentIndex + 1}/${telemetry.length}` : '0/0'}
                    </span>
                  </div>
                </>
              ) : (
                <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
                  <TelemetryChart telemetry={telemetry} />
                </div>
              )}
            </div>

            {showMatrix && (
              <div className="w-[620px] flex-shrink-0 border-l border-slate-800/60 bg-[#0D1117] flex flex-col overflow-hidden">
                <TelemetryTable
                  telemetry={telemetry}
                  currentIndex={currentIndex}
                  onIndexChange={(i) => { setCurrentIndex(i); setIsPlaying(false); }}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
