'use client';
import React, { useMemo } from 'react';
import * as THREE from 'three';

export default function TerrainGrid() {
  const geom = useMemo(() => {
    const width = 6000;
    const height = 240;
    const wSegments = 120;
    const hSegments = 20;
    const g = new THREE.PlaneGeometry(width, height, wSegments, hSegments);

    const pos = g.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);

      const zVal = Math.sin(x * 0.01) * Math.cos(y * 0.02) * 6 +
                   Math.sin(x * 0.003) * 12 +
                   Math.cos(y * 0.04) * 3;
      pos.setZ(i, zVal);
    }
    g.computeVertexNormals();
    return g;
  }, []);

  return (
    <mesh geometry={geom} rotation={[-Math.PI / 2, 0, 0]} position={[2500, -6, 0]}>
      <meshBasicMaterial color="#1E293B" wireframe transparent opacity={0.16} />
    </mesh>
  );
}
