# AeroOptima: End-to-End Project Masterplan
## AEROTHON 2026 — Team HAL × IIT Indore
### Conceptual Design & Sizing Optimization for 1,000 kg Hybrid-Electric MALE UAV

---

## 1. Executive Summary & Vision

**AeroOptima** is an AI-driven conceptual design and flight optimization platform developed for the **AEROTHON 2026 (HAL × IITI)** competition. It solves the non-linear propulsion sizing challenge for Medium-Altitude Long-Endurance (MALE) Unmanned Aerial Vehicles (UAVs) under strict weight limits ($1,000\text{ kg}$ Maximum Take-Off Weight / MTOW).

By combining a **DEAP Genetic Algorithm (outer sizing loop)** with a custom **Gymnasium physics simulation environment (inner flight loop)**, AeroOptima automatically discovers the globally optimal engine size, battery pack capacity, and fuel fraction while providing real-time 3D flight telemetry via a Next.js / Three.js web console.

```
                         END-TO-END SYSTEM ARCHITECTURE
                         
 ┌────────────────────────┐      POST /api/optimize      ┌────────────────────────┐
 │ Next.js 16 Dashboard   ├─────────────────────────────►│ FastAPI 3.11 Backend   │
 │ • 3D Racetrack Orbit   │                              │ • Pydantic Schema Check│
 │ • Plotly Telemetry     │◄─────────────────────────────┤ • JSON Data Loaders    │
 └────────────────────────┘      JSON Telemetry Stream   └───────────┬────────────┘
                                                                     │
 ┌────────────────────────┐       Fitness (Endurance)    ┌───────────▼────────────┐
 │ UAV Physics Simulator  ├─────────────────────────────►│ DEAP Genetic Algorithm │
 │ (`environment.py`)     │                              │ (`optimizer.py`)       │
 │ • ISA Density Lapse    │◄─────────────────────────────┤ • Sizes Engine (kW)    │
 │ • Oswald Drag Polar    │    Candidate Pair [kW, kWh]  │ • Sizes Battery (kWh)  │
 └────────────────────────┘                              └────────────────────────┘
```

---

## 2. Multi-Tier System Requirements

### 2.1 Mission Specifications (1,000 kg Class UAV)
* **Maximum Take-Off Weight (MTOW):** $1,000\text{ kg}$ (Hard constraint)
* **Payload Capacity:** $200\text{ kg}$ (Multi-sensor EO/IR gimbal + Synthetic Aperture Radar)
* **Structural Airframe Mass:** $350\text{ kg}$ (Carbon-composite construction, 35% empty weight fraction)
* **Target Operational Speed:** $250\text{ km/h}$ (69.4 m/s True Airspeed)
* **Target Flight Ceiling:** $3,000\text{ m}$ to $10,000\text{ m}$ ASL (Leh-Ladakh operational envelope)

### 2.2 Core Tech Stack
* **Backend:** Python 3.11, FastAPI, DEAP, Gymnasium, NumPy, SciPy, Pydantic.
* **Frontend:** Next.js 16, React 19, TypeScript, Tailwind CSS, Three.js / React Three Fiber, Plotly.js.

---

## 3. High-Level Project Phase Breakdown

```
Phase 1: Foundation Physics ──► Phase 2: GA Sizing Loop ──► Phase 3: Interactive Web UI
                                                                         │
Phase 5: RL Disturbance Ctrl ◄── Phase 4: High-Altitude Derating ◄───────┘
```

1. **Phase 1: Foundation Physics & Gymnasium Environment (`environment.py`)**
   * ISA atmospheric lapse model, Oswald drag polar, partial-load SFC curves, dynamic weight integration.
2. **Phase 2: Outer-Loop Genetic Sizing Engine (`optimizer.py`)**
   * DEAP population setup, tournament selection, blend crossover, mutation, and endurance maximization fitness.
3. **Phase 3: Real-Time Web Dashboard & 3D Orbit Visualizer (`frontend/`)**
   * Next.js console, Three.js 3D UAV racetrack visualizer, Plotly telemetry charts, status matrix.
4. **Phase 4: High-Altitude Environmental Fidelity (`docs/project_analysis/`)**
   * Density altitude power lapse (Gagg-Ferrar model), low-temperature battery capacity derating, headwind vectors.
5. **Phase 5: Intelligent Control & RL Integration (`train_rl.py`)**
   * CPU-based parallel PPO/SAC training for adaptive energy management and wind shear rejection.
