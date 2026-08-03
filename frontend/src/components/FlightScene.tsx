'use client';

import React, { useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { Line, OrthographicCamera, Grid, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

import { TelemetryPoint } from '../types/telemetry';
import { generateFlightPath, generatePathColors } from './scene/pathGenerator';
import TerrainGrid from './scene/TerrainGrid';
import TacticalBackground from './scene/TacticalBackground';
import PhaseMarkers from './scene/PhaseMarkers';
import AltitudeIndicator from './scene/AltitudeIndicator';
import UAVMarker from './scene/UAVMarker';
import AxisLabels from './scene/AxisLabels';

interface FlightSceneProps {
  telemetry: TelemetryPoint[];
  currentIndex: number;
}

function SceneContent({ telemetry, currentIndex }: FlightSceneProps) {
  const flightPath = useMemo(() => generateFlightPath(telemetry), [telemetry]);
  const pathColors = useMemo(() => generatePathColors(telemetry), [telemetry]);

  const currentPos = useMemo(() => {
    if (flightPath.length === 0) return new THREE.Vector3(0, 0, 0);
    const idx = Math.min(currentIndex, flightPath.length - 1);
    return flightPath[idx];
  }, [flightPath, currentIndex]);

  const nextPos = useMemo(() => {
    if (flightPath.length === 0) return null;
    const idx = Math.min(currentIndex + 1, flightPath.length - 1);
    return flightPath[idx];
  }, [flightPath, currentIndex]);

  const currentTelemetry = useMemo(() => {
    if (telemetry.length === 0) return null;
    return telemetry[Math.min(currentIndex, telemetry.length - 1)];
  }, [telemetry, currentIndex]);

  const trailPath = useMemo(() => {
    return flightPath.slice(0, Math.min(currentIndex + 1, flightPath.length));
  }, [flightPath, currentIndex]);

  const trailColors = useMemo(() => {
    return pathColors.slice(0, Math.min(currentIndex + 1, pathColors.length));
  }, [pathColors, currentIndex]);

  const futurePath = useMemo(() => {
    return flightPath.slice(Math.min(currentIndex, flightPath.length - 1));
  }, [flightPath, currentIndex]);

  if (flightPath.length === 0) return null;

  return (
    <>
      <OrthographicCamera makeDefault position={[120, 45, 130]} zoom={6.0} near={0.1} far={8000} />

      <OrbitControls
        target={[currentPos.x, currentPos.y * 0.4, currentPos.z]}
        enableDamping
        dampingFactor={0.08}
        enablePan
        panSpeed={0.6}
        enableZoom
        zoomSpeed={0.8}
        minZoom={0.8}
        maxZoom={20}
        minPolarAngle={Math.PI / 18}
        maxPolarAngle={Math.PI / 2.15}
        enableRotate
        rotateSpeed={0.45}
      />

      <ambientLight intensity={0.55} />
      <hemisphereLight color="#1E293B" groundColor="#0F172A" intensity={0.7} />
      <directionalLight position={[50, 100, 50]} intensity={1.5} color="#F3F4F6" />

      <TacticalBackground currentX={currentPos.x} />
      <TerrainGrid />

      <Grid
        args={[500, 500]}
        cellSize={5}
        cellThickness={0.3}
        cellColor="#1F2937"
        sectionSize={25}
        sectionThickness={0.6}
        sectionColor="#374151"
        fadeDistance={350}
        position={[currentPos.x, 0, 0]}
      />

      <AxisLabels />

      {futurePath.length >= 2 && (
        <Line points={futurePath} color="#374151" lineWidth={1.5} />
      )}

      {trailPath.length >= 2 && (
        <Line
          points={trailPath}
          vertexColors={trailColors.map(c => [c.r, c.g, c.b] as [number, number, number])}
          lineWidth={2.5}
        />
      )}

      <PhaseMarkers telemetry={telemetry} flightPath={flightPath} />
      <AltitudeIndicator position={currentPos} />
      <UAVMarker position={currentPos} nextPosition={nextPos} telemetryPt={currentTelemetry} />
    </>
  );
}

export default function FlightScene({ telemetry, currentIndex }: FlightSceneProps) {
  if (!telemetry || telemetry.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-[#0B0F19] text-slate-500 text-xs font-mono">
        AWAITING TELEMETRY DATA...
      </div>
    );
  }

  return (
    <Canvas
      gl={{ antialias: true, alpha: false }}
      style={{ background: '#0B0F19' }}
      dpr={[1, 1.5]}
    >
      <SceneContent telemetry={telemetry} currentIndex={currentIndex} />
    </Canvas>
  );
}
