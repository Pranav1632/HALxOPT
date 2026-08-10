'use client';
import React, { useMemo } from 'react';

export default function TacticalBackground({ currentX }: { currentX: number }) {
  const starPositions = useMemo(() => {
    const pts: number[] = [];
    const count = 500;
    for (let i = 0; i < count; i++) {
      const x = -500 + Math.random() * 8000;
      const y = 18 + Math.random() * 80;
      const z = -150 + Math.random() * 300;
      pts.push(x, y, z);
    }
    return new Float32Array(pts);
  }, []);

  return (
    <group>
      <points>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[starPositions, 3]}
            count={starPositions.length / 3}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          color="#4B5563"
          size={1.3}
          sizeAttenuation={true}
          transparent
          opacity={0.5}
        />
      </points>

      <mesh position={[currentX, 0, 0]}>
        <sphereGeometry args={[250, 20, 14, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshBasicMaterial color="#1E293B" wireframe transparent opacity={0.03} />
      </mesh>
    </group>
  );
}
