import { OptimalSpecs, TelemetryPoint, SimulationParams } from '../types/telemetry';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

export interface OptimizationResponseData {
  optimal_specs: OptimalSpecs;
  telemetry: TelemetryPoint[];
  env_metadata?: Record<string, any>;
}

export async function fetchOptimizationResults(params: SimulationParams): Promise<OptimizationResponseData> {
  const response = await fetch(`${API_URL}/api/optimize`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      target_speed_kmh: params.targetSpeedKmh,
      target_altitude: params.targetAltitude,
      payload_weight: params.payloadWeight,
      enable_loiter: params.enableLoiter,
      initial_fuel_fraction: params.initialFuelFraction,
      headwind_kmh: params.headwindKmh ?? 0.0,
      ambient_temp_c: params.ambientTempC ?? 15.0,
      turbulence_level: params.turbulenceLevel ?? 0.0,
      policy_mode: params.policyMode ?? 'heuristic',
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: 'Optimization request failed.' }));
    throw new Error(errorData.detail || 'Optimization failed.');
  }

  return response.json();
}
