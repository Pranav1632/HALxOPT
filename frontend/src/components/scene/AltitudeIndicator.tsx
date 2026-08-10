'use client';
import React, { useMemo } from 'react';
import { Line } from '@react-three/drei';
import * as THREE from 'three';

export default function AltitudeIndicator({ position }: { position: THREE.Vector3 }) {
  const points = useMemo(() => {
    return [position, new THREE.Vector3(position.x, 0, position.z)];
  }, [position.x, position.y, position.z]);

  return (
    <Line points={points} color="#F59E0B" lineWidth={1} dashed dashSize={0.8} gapSize={0.5} />
  );
}
