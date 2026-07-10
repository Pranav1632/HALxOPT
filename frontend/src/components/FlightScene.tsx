'use client';

import React, { useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Line, OrthographicCamera, Grid, Html, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */
interface TelemetryPoint {
  time: number;
  altitude: number;
  speed: number;
  phase: string;
  u: number;
  climb_rate: number;
}

interface FlightSceneProps {
  telemetry: TelemetryPoint[];
  currentIndex: number;
}

/* ------------------------------------------------------------------ */
/*  Generate 3D Flight Path from Telemetry                             */
/*  X = cumulative horizontal distance (scaled)                        */
/*  Y = altitude (scaled)                                              */
/*  Z = lateral offset (racetrack during loiter)                       */
/* ------------------------------------------------------------------ */
function generateFlightPath(telemetry: TelemetryPoint[]): THREE.Vector3[] {
  if (telemetry.length === 0) return [];

  const points: THREE.Vector3[] = [];
  let cumDist = 0;
  const ALT_SCALE = 0.015;
  const DIST_SCALE = 0.0008;

  // Pre-scan: find loiter window
  let loiterStartIdx = -1;
  let loiterEndIdx = -1;
  for (let i = 0; i < telemetry.length; i++) {
    if (telemetry[i].phase === 'loiter') {
      if (loiterStartIdx < 0) loiterStartIdx = i;
      loiterEndIdx = i;
    }
  }

  // Compute loiter center X by accumulating distance to loiter start
  let loiterCenterX = 0;
  let loiterStartTime = 0;
  let loiterDuration = 1;
  if (loiterStartIdx >= 0) {
    let d = 0;
    for (let j = 1; j <= loiterStartIdx; j++) {
      const dt = telemetry[j].time - telemetry[j - 1].time;
      const spd = telemetry[j].speed;
      const cr = telemetry[j].climb_rate || 0;
      d += spd * Math.cos(Math.asin(Math.max(-1, Math.min(1, cr / Math.max(spd, 1))))) * dt;
    }
    loiterCenterX = d * DIST_SCALE;
    loiterStartTime = telemetry[loiterStartIdx].time;
    loiterDuration = Math.max(1, telemetry[loiterEndIdx].time - loiterStartTime);
  }

  // Racetrack parameters: exactly 3 orbits, drifting forward
  const NUM_ORBITS = 3;
  const ORBIT_RADIUS_Z = 12;
  const ORBIT_RADIUS_X = 20;
  const FORWARD_DRIFT = 15; // total forward distance across all orbits

  // Descent tracking
  let descentStartZ = 0;
  let descentStartX = 0;
  let descentCount = 0;

  for (let i = 0; i < telemetry.length; i++) {
    const pt = telemetry[i];
    const dt = i > 0 ? pt.time - telemetry[i - 1].time : 0;
    const horizSpeed = pt.speed * Math.cos(Math.asin(Math.max(-1, Math.min(1, (pt.climb_rate || 0) / Math.max(pt.speed, 1)))));
    cumDist += horizSpeed * dt;

    const y = pt.altitude * ALT_SCALE;

    if (pt.phase === 'loiter' && loiterStartIdx >= 0) {
      // Forward-drifting racetrack: exactly NUM_ORBITS orbits
      const loiterElapsed = pt.time - loiterStartTime;
      const t = loiterElapsed / loiterDuration; // 0..1 over loiter phase
      const theta = 2 * Math.PI * NUM_ORBITS * t;
      const drift = FORWARD_DRIFT * t; // gradual forward progress
      const x = loiterCenterX + drift + Math.cos(theta) * ORBIT_RADIUS_X;
      const z = Math.sin(theta) * ORBIT_RADIUS_Z;
      points.push(new THREE.Vector3(x, y, z));
    } else if ((pt.phase === 'descent' || pt.phase === 'landing') && loiterStartIdx >= 0) {
      // Exit orbit: decay Z toward 0 over descent, continue forward
      descentCount++;
      if (descentCount === 1 && points.length > 0) {
        descentStartZ = points[points.length - 1].z;
        descentStartX = points[points.length - 1].x;
      }
      const decay = Math.max(0, 1 - descentCount * 0.03); // smooth decay
      const x = descentStartX + cumDist * DIST_SCALE * 0.02 * descentCount;
      const z = descentStartZ * decay;
      points.push(new THREE.Vector3(x, y, Math.abs(z) < 0.3 ? 0 : z));
    } else {
      // Straight line: takeoff, climb, cruise
      const x = cumDist * DIST_SCALE;
      points.push(new THREE.Vector3(x, y, 0));
    }
  }

  return points;
}

/* ------------------------------------------------------------------ */
/*  Color-code segments by PSR (power source indicator)                */
/* ------------------------------------------------------------------ */
function generatePathColors(telemetry: TelemetryPoint[]): THREE.Color[] {
  const COLOR_BATTERY = new THREE.Color(0xF59E0B);
  const COLOR_HYBRID  = new THREE.Color(0x06B6D4);
  const COLOR_ENGINE  = new THREE.Color(0x10B981);
  const COLOR_IDLE    = new THREE.Color(0x4B5563);

  return telemetry.map((pt) => {
    if (pt.phase === 'descent' || pt.phase === 'landing') return COLOR_IDLE;
    if (pt.u > 0.4) return COLOR_BATTERY;
    if (pt.u > 0.15) return COLOR_HYBRID;
    return COLOR_ENGINE;
  });
}

/* ------------------------------------------------------------------ */
/*  Phase transition markers (waypoints)                               */
/* ------------------------------------------------------------------ */
function PhaseMarkers({ telemetry, flightPath }: { telemetry: TelemetryPoint[]; flightPath: THREE.Vector3[] }) {
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
          {/* Small sphere at waypoint */}
          <mesh>
            <sphereGeometry args={[0.8, 8, 8]} />
            <meshStandardMaterial
              color={phaseColors[m.phase] || '#9CA3AF'}
              emissive={phaseColors[m.phase] || '#9CA3AF'}
              emissiveIntensity={0.5}
            />
          </mesh>
          {/* Phase label */}
          <Html
            position={[0, 3.5, 0]}
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

/* ------------------------------------------------------------------ */
/*  UAV Marker with HUD label                                          */
/* ------------------------------------------------------------------ */
function UAVMarker({ position, nextPosition, telemetryPt }: {
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

      {/* HUD Label floating above UAV */}
      {telemetryPt && (
        <Html
          position={[position.x, position.y + 6, position.z]}
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

/* ------------------------------------------------------------------ */
/*  Altitude Reference Line (dashed drop to ground)                    */
/* ------------------------------------------------------------------ */
function AltitudeIndicator({ position }: { position: THREE.Vector3 }) {
  const points = useMemo(() => {
    return [position, new THREE.Vector3(position.x, 0, position.z)];
  }, [position.x, position.y, position.z]);

  return (
    <Line points={points} color="#F59E0B" lineWidth={1} dashed dashSize={0.8} gapSize={0.5} />
  );
}

/* ------------------------------------------------------------------ */
/*  Axis Labels (distance & altitude)                                  */
/* ------------------------------------------------------------------ */
function AxisLabels() {
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

/* ------------------------------------------------------------------ */
/*  Tactical Space Dome & Starfield Background                         */
/* ------------------------------------------------------------------ */
function TacticalBackground({ currentX }: { currentX: number }) {
  const starPositions = useMemo(() => {
    const pts: number[] = [];
    const count = 400;
    // Distribute points in a shell centered around the active UAV flight corridor
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      const r = 250 + Math.random() * 150;
      
      const x = currentX + r * Math.sin(phi) * Math.cos(theta);
      const y = Math.max(5, r * Math.sin(phi) * Math.sin(theta));
      const z = r * Math.cos(phi);
      pts.push(x, y, z);
    }
    return new Float32Array(pts);
  }, [currentX]);

  return (
    <group>
      {/* High-density radar tracking background dots */}
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
          color="#374151"
          size={1.5}
          sizeAttenuation={true}
          transparent
          opacity={0.4}
        />
      </points>

      {/* Subtle coordinate dome overlay */}
      <mesh position={[currentX, 0, 0]}>
        <sphereGeometry args={[280, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshBasicMaterial color="#1F2937" wireframe transparent opacity={0.02} />
      </mesh>
    </group>
  );
}

/* ------------------------------------------------------------------ */
/*  Main 3D Scene (inner Canvas content)                               */
/* ------------------------------------------------------------------ */
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

  // Trail and future paths
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
      <OrthographicCamera makeDefault position={[100, 100, 100]} zoom={3.0} near={0.1} far={3000} />

      {/* Orbit controls — gentle tilt/pan, open vertical rotation range */}
      <OrbitControls
        target={[currentPos.x, currentPos.y * 0.4, currentPos.z]}
        enableDamping
        dampingFactor={0.08}
        enablePan
        panSpeed={0.6}
        enableZoom
        zoomSpeed={0.8}
        minZoom={1.2}
        maxZoom={12}
        minPolarAngle={Math.PI / 18}   /* 10° — allows viewing from almost side-on profile */
        maxPolarAngle={Math.PI / 2.15} /* 83° — prevents rotating below the ground plane */
        enableRotate
        rotateSpeed={0.45}
      />

      {/* Lighting */}
      <ambientLight intensity={0.35} />
      <directionalLight position={[50, 100, 50]} intensity={0.8} color="#E5E7EB" />

      {/* Stars and space dome background centered around current position */}
      <TacticalBackground currentX={currentPos.x} />

      {/* Ground Grid */}
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

      {/* Future path — dim */}
      {futurePath.length >= 2 && (
        <Line points={futurePath} color="#374151" lineWidth={1.5} />
      )}

      {/* Flown trail — color-coded by PSR */}
      {trailPath.length >= 2 && (
        <Line
          points={trailPath}
          vertexColors={trailColors.map(c => [c.r, c.g, c.b] as [number, number, number])}
          lineWidth={2.5}
        />
      )}

      {/* Phase transition waypoint markers */}
      <PhaseMarkers telemetry={telemetry} flightPath={flightPath} />

      {/* Altitude indicator dashed line */}
      <AltitudeIndicator position={currentPos} />

      {/* UAV marker with live HUD */}
      <UAVMarker position={currentPos} nextPosition={nextPos} telemetryPt={currentTelemetry} />
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Exported Component                                                 */
/* ------------------------------------------------------------------ */
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
