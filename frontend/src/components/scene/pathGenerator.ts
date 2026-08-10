import * as THREE from 'three';
import { TelemetryPoint } from '../../types/telemetry';

export function generateFlightPath(telemetry: TelemetryPoint[]): THREE.Vector3[] {
  if (telemetry.length === 0) return [];

  const points: THREE.Vector3[] = [];
  let cumDist = 0;
  const ALT_SCALE = 0.003;
  const DIST_SCALE = 0.001;

  let loiterStartIdx = -1;
  let loiterEndIdx = -1;
  for (let i = 0; i < telemetry.length; i++) {
    if (telemetry[i].phase === 'loiter') {
      if (loiterStartIdx < 0) loiterStartIdx = i;
      loiterEndIdx = i;
    }
  }

  let descentStartIdx = -1;
  let landingEndIdx = -1;
  for (let i = 0; i < telemetry.length; i++) {
    if ((telemetry[i].phase === 'descent' || telemetry[i].phase === 'landing')) {
      if (descentStartIdx < 0) descentStartIdx = i;
      landingEndIdx = i;
    }
  }
  const returnDuration = descentStartIdx >= 0 && landingEndIdx >= 0
    ? Math.max(1, telemetry[landingEndIdx].time - telemetry[descentStartIdx].time)
    : 1;

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

  const NUM_ORBITS = 3;
  const ORBIT_RADIUS_Z = 6;
  const ORBIT_RADIUS_X = 10;
  const FORWARD_DRIFT = 8;
  const RETURN_LANE_Z = ORBIT_RADIUS_Z;

  let returnStartX = 0;
  let returnStartZ = 0;
  let returnStartTime = 0;

  for (let i = 0; i < telemetry.length; i++) {
    const pt = telemetry[i];
    const dt = i > 0 ? pt.time - telemetry[i - 1].time : 0;
    const horizSpeed = pt.speed * Math.cos(Math.asin(Math.max(-1, Math.min(1, (pt.climb_rate || 0) / Math.max(pt.speed, 1)))));
    cumDist += horizSpeed * dt;

    const y = pt.altitude * ALT_SCALE;

    if (pt.phase === 'loiter' && loiterStartIdx >= 0) {
      const loiterElapsed = pt.time - loiterStartTime;
      const t = loiterElapsed / loiterDuration;
      const theta = 2 * Math.PI * NUM_ORBITS * t;
      const drift = FORWARD_DRIFT * t;
      const x = loiterCenterX + drift + Math.cos(theta) * ORBIT_RADIUS_X;
      const z = Math.sin(theta) * ORBIT_RADIUS_Z;
      points.push(new THREE.Vector3(x, y, z));

    } else if ((pt.phase === 'descent' || pt.phase === 'landing') && loiterStartIdx >= 0) {
      if (pt.phase === 'descent' && (i === 0 || telemetry[i - 1].phase !== 'descent')) {
        const lastPt = points[points.length - 1];
        returnStartX = lastPt ? lastPt.x : 0;
        returnStartZ = lastPt ? lastPt.z : 0;
        returnStartTime = pt.time;
      }

      const returnElapsed = pt.time - returnStartTime;
      const tReturn = Math.min(1, returnElapsed / returnDuration);
      const ease = (1 - Math.cos(tReturn * Math.PI)) / 2;

      const x = returnStartX * (1 - ease);

      const zEase = Math.min(1, tReturn / 0.15);
      const zSweep = (1 - Math.cos(zEase * Math.PI)) / 2;
      const z = returnStartZ + (RETURN_LANE_Z - returnStartZ) * zSweep;

      points.push(new THREE.Vector3(x, y, z));

    } else {
      const x = cumDist * DIST_SCALE;
      points.push(new THREE.Vector3(x, y, 0));
    }
  }

  return points;
}

export function generatePathColors(telemetry: TelemetryPoint[]): THREE.Color[] {
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
