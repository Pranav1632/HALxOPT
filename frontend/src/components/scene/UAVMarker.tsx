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
  const meshRef = useRef<THREE.Group>(null);
  const labelRef = useRef<THREE.Group>(null);

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.position.copy(position);
      if (nextPosition) {
        const dir = new THREE.Vector3().subVectors(nextPosition, position).normalize();
        if (dir.length() > 0.001) {
          const q = new THREE.Quaternion();
          q.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
          meshRef.current.quaternion.copy(q);
        }
      }
    }
    if (labelRef.current) {
      labelRef.current.position.copy(position);
    }
  });

  return (
    <>
      <group ref={meshRef}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <coneGeometry args={[2.0, 6.0, 4]} />
          <meshStandardMaterial color="#F59E0B" emissive="#F59E0B" emissiveIntensity={0.7} flatShading />
        </mesh>
      </group>

      <group ref={labelRef}>
        {telemetryPt && (
          <Html
            position={[0, 6, 0]}
            center
            style={{ pointerEvents: 'none', userSelect: 'none' }}
          >
            <div style={{
              background: 'rgba(11, 15, 25, 0.92)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              border: '1px solid rgba(245, 158, 11, 0.6)',
              borderRadius: '6px',
              padding: '6px 12px',
              whiteSpace: 'nowrap',
              fontSize: '10px',
              fontFamily: 'monospace',
              color: '#E5E7EB',
              display: 'flex',
              flexDirection: 'column',
              gap: '3px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.6)',
              minWidth: '135px',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
                <span style={{ color: '#9CA3AF', fontSize: '9px', fontWeight: 600 }}>TACTICAL UAV</span>
                <span style={{ color: '#F59E0B', fontWeight: 700, fontSize: '9px', background: 'rgba(245,158,11,0.15)', padding: '1px 5px', borderRadius: '3px' }}>
                  {telemetryPt.phase.toUpperCase()}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
                <span style={{ color: '#9CA3AF', fontSize: '9px' }}>ALT</span>
                <span style={{ color: '#10B981', fontWeight: 700 }}>{telemetryPt.altitude.toFixed(0)} m</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
                <span style={{ color: '#9CA3AF', fontSize: '9px' }}>SPEED</span>
                <span style={{ color: '#06B6D4', fontWeight 700 }}>{(telemetryPt.speed * 3.6).toFixed(0)} km/h</span>
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
    </>
  );
}
