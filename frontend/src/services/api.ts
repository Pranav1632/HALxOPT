import { OptimalSpecs, TelemetryPoint, SimulationParams } from '../types/telemetry';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

export interface OptimizationResponseData {
  optimal_specs: OptimalSpecs;
  telemetry: TelemetryPoint[];
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
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: 'Optimization request failed.' }));
    throw new Error(errorData.detail || 'Optimization failed.');
  }

  return response.json();
}
