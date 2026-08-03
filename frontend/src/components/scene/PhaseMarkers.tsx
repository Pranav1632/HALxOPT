'use client';
import React, { useMemo } from 'react';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { TelemetryPoint } from '../../types/telemetry';

export default function PhaseMarkers({ telemetry, flightPath }: { telemetry: TelemetryPoint[]; flightPath: THREE.Vector3[] }) {
  const markers = useMemo(() => {
    if (telemetry.length === 0 || flightPath.length === 0) return [];
    const result: { phase: string; position: THREE.Vector3; altitude: number }[] = [];
    let prevPhase = '';
    for (let i = 0; i < telemetry.length; i++) {
      if (telemetry[i].phase !== prevPhase && telemetry[i].phase !== 'completed') {
        result.push({
          phase: telemetry[i].phase,
          position: flightPath[i] || new THREE.Vector3(),
          altitude: telemetry[i].altitude,
        });
        prevPhase = telemetry[i].phase;
      }
    }
    return result;
  }, [telemetry, flightPath]);

  const phaseColors: Record<string, string> = {
    takeoff: '#EF4444', climb: '#F59E0B', cruise: '#06B6D4',
    loiter: '#8B5CF6', descent: '#14B8A6', landing: '#10B981',
  };

  return (
    <>
      {markers.map((m, i) => (
        <group key={i} position={m.position}>
          <mesh>
            <sphereGeometry args={[0.5, 8, 8]} />
            <meshStandardMaterial
              color={phaseColors[m.phase] || '#9CA3AF'}
              emissive={phaseColors[m.phase] || '#9CA3AF'}
              emissiveIntensity={0.5}
            />
          </mesh>
          <Html
            position={[0, 2.0, 0]}
            center
            style={{ pointerEvents: 'none' }}
          >
            <div style={{
              background: '#0D1117E0',
              border: `1px solid ${phaseColors[m.phase] || '#374151'}`,
              borderRadius: '3px',
              padding: '2px 6px',
              whiteSpace: 'nowrap',
              fontSize: '9px',
              fontFamily: 'monospace',
              fontWeight: 700,
              color: phaseColors[m.phase] || '#9CA3AF',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}>
              {m.phase} · {m.altitude.toFixed(0)}m
            </div>
          </Html>
        </group>
      ))}
    </>
  );
}
