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
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame(() => {
    if (!meshRef.current) return;
    meshRef.current.position.copy(position);
    if (nextPosition) {
      const dir = new THREE.Vector3().subVectors(nextPosition, position).normalize();
      if (dir.length() > 0.001) {
        const q = new THREE.Quaternion();
        q.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
        meshRef.current.quaternion.copy(q);
      }
    }
  });

  return (
    <group>
      <mesh ref={meshRef} position={position}>
        <coneGeometry args={[1.8, 5, 4]} />
        <meshStandardMaterial color="#F59E0B" emissive="#F59E0B" emissiveIntensity={0.6} flatShading />
      </mesh>

      {telemetryPt && (
        <Html
          position={[position.x, position.y + 3, position.z]}
          center
          style={{ pointerEvents: 'none' }}
        >
          <div style={{
            background: '#0B0F19D0',
            border: '1px solid #F59E0B50',
            borderRadius: '4px',
            padding: '4px 8px',
            whiteSpace: 'nowrap',
            fontSize: '10px',
            fontFamily: 'monospace',
            color: '#E5E7EB',
            display: 'flex',
            flexDirection: 'column',
            gap: '1px',
            minWidth: '120px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
              <span style={{ color: '#9CA3AF', fontSize: '8px' }}>ALT</span>
              <span style={{ color: '#10B981', fontWeight: 700 }}>{telemetryPt.altitude.toFixed(0)}m</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
              <span style={{ color: '#9CA3AF', fontSize: '8px' }}>TAS</span>
              <span style={{ color: '#06B6D4', fontWeight: 700 }}>{(telemetryPt.speed * 3.6).toFixed(0)} km/h</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
              <span style={{ color: '#9CA3AF', fontSize: '8px' }}>PSR</span>
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
