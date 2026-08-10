'use client';
import React from 'react';
import { Html } from '@react-three/drei';

export default function AxisLabels() {
  return (
    <group>
      <mesh position={[20, 0, 0]}>
        <boxGeometry args={[0.3, 0.3, 0.3]} />
        <meshStandardMaterial color="#EF4444" emissive="#EF4444" emissiveIntensity={0.4} />
      </mesh>
      <Html position={[24, 0, 0]} center style={{ pointerEvents: 'none' }}>
        <span style={{ fontSize: '9px', fontFamily: 'monospace', color: '#EF4444', fontWeight: 700 }}>
          DIST →
        </span>
      </Html>

      <mesh position={[0, 20, 0]}>
        <boxGeometry args={[0.3, 0.3, 0.3]} />
        <meshStandardMaterial color="#10B981" emissive="#10B981" emissiveIntensity={0.4} />
      </mesh>
      <Html position={[0, 23, 0]} center style={{ pointerEvents: 'none' }}>
        <span style={{ fontSize: '9px', fontFamily: 'monospace', color: '#10B981', fontWeight: 700 }}>
          ALT ↑
        </span>
      </Html>
    </group>
  );
}
