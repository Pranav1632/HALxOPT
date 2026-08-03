'use client';
import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { TelemetryPoint } from '../../types/telemetry';

export default function UAVMarker({ position, nextPosition, telemetryPt }: {
  position: THREE.Vector3;
  nextPosition: THREE.Vector3 | null;
  telemetryPt: TelemetryPoint | null;
}) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame(() => {
    if (!groupRef.current) return;
    groupRef.current.position.copy(position);
    if (nextPosition) {
      const dir = new THREE.Vector3().subVectors(nextPosition, position).normalize();
      if (dir.length() > 0.001) {
        const q = new THREE.Quaternion();
        q.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
        groupRef.current.quaternion.copy(q);
      }
    }
  });

  return (
    <group ref={groupRef}>
      <mesh>
        <coneGeometry args={[1.8, 5, 4]} />
        <meshStandardMaterial color="#F59E0B" emissive="#F59E0B" emissiveIntensity={0.6} flatShading />
      </mesh>

      {telemetryPt && (
        <Html
          position={[0, 4, 0]}
          center
          style={{ pointerEvents: 'none' }}
        >
          <div style={{
            background: 'rgba(11, 15, 25, 0.88)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            border: '1px solid rgba(245, 158, 11, 0.5)',
            borderRadius: '6px',
            padding: '5px 10px',
            whiteSpace: 'nowrap',
            fontSize: '10px',
            fontFamily: 'monospace',
            color: '#E5E7EB',
            display: 'flex',
            flexDirection: 'column',
            gap: '2px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
              <span style={{ color: '#9CA3AF', fontSize: '9px', fontWeight: 600 }}>TACTICAL UAV</span>
              <span style={{ color: '#F59E0B', fontWeight: 700, fontSize: '9px' }}>{telemetryPt.phase.toUpperCase()}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
              <span style={{ color: '#9CA3AF', fontSize: '9px' }}>ALT</span>
              <span style={{ color: '#10B981', fontWeight: 700 }}>{telemetryPt.altitude.toFixed(0)} m</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
              <span style={{ color: '#9CA3AF', fontSize: '9px' }}>SPEED</span>
              <span style={{ color: '#06B6D4', fontWeight: 700 }}>{(telemetryPt.speed * 3.6).toFixed(0)} km/h</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
              <span style={{ color: '#9CA3AF', fontSize: '9px' }}>PSR (SPLIT)</span>
              <span style={{ color: telemetryPt.u > 0.3 ? '#F59E0B' : '#10B981', fontWeight: 700 }}>
                {(telemetryPt.u * 100).toFixed(0)}%
              </span>
            </div>
          </div>
        </Html>
      )}
    </group>
  );
}
