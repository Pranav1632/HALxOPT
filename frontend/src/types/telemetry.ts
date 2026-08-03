export interface OptimalSpecs {
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

export interface TelemetryPoint {
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

export interface SimulationParams {
  targetSpeedKmh: number;
  targetAltitude: number;
  payloadWeight: number;
  enableLoiter: boolean;
  initialFuelFraction: number;
}

export const PHASE_BADGE: Record<string, string> = {
  takeoff: 'bg-red-900/60 text-red-300 border-red-700/40',
  climb: 'bg-amber-900/60 text-amber-300 border-amber-700/40',
  cruise: 'bg-cyan-900/60 text-cyan-300 border-cyan-700/40',
  loiter: 'bg-violet-900/60 text-violet-300 border-violet-700/40',
  descent: 'bg-teal-900/60 text-teal-300 border-teal-700/40',
  landing: 'bg-emerald-900/60 text-emerald-300 border-emerald-700/40',
  completed: 'bg-slate-800/60 text-slate-400 border-slate-700/40',
};

export const PHASE_GLOW: Record<string, string> = {
  takeoff: 'shadow-[0_0_8px_rgba(248,113,113,0.4)]',
  climb: 'shadow-[0_0_8px_rgba(251,191,36,0.4)]',
  cruise: 'shadow-[0_0_8px_rgba(34,211,238,0.4)]',
  loiter: 'shadow-[0_0_8px_rgba(167,139,250,0.4)]',
  descent: 'shadow-[0_0_8px_rgba(45,212,191,0.4)]',
  landing: 'shadow-[0_0_8px_rgba(52,211,153,0.4)]',
  completed: '',
};

export function fmtTime(sec: number): string {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m ${s}s`;
}
