# 🗺️ System Architecture & Data Flow Guide (Team Member Edition)

> **Project:** AeroOptima — Tactical Hybrid-Electric UAV Optimization Platform (HAL × IIT Indore)  
> **Location:** `docs/project_analysis/system_architecture_and_dataflow_guide.md`  
> **Purpose:** A complete, self-contained visual guide explaining how the whole project works under the hood so any team member can understand the system architecture, data flow, and core design logic independently.

---

## 💡 1. The Big Picture: What Are We Building?

### Plain-English Explanation
Imagine you are an aerospace engineer at **Hindustan Aeronautics Limited (HAL)** designing a 1,000 kg long-endurance tactical drone for mountain surveillance in Leh-Ladakh.

You have a big choice:
1. If you use **only a gas engine**: It has great range, but it's noisy (cannot do silent stealth overwatch) and struggles to deliver quick bursts of climbing power in thin mountain air.
2. If you use **only an electric motor with batteries**: It's quiet, but heavy batteries run out of charge in under 1 hour.

**Our Solution — AeroOptima:**  
We built a **Hybrid-Electric UAV** that combines BOTH a gas turboshaft engine AND an electric motor.  
- **AeroOptima's Software** does two things:
  1. **Outer Loop (Hardware Sizing):** Automatically finds the *perfect combination* of engine size (kW) and battery size (kWh) using AI (Genetic Algorithms).
  2. **Inner Loop (Flight Simulation):** Simulates every second of a 20-hour mission, dynamically switching power between the engine and motor to maximize flight time while staying safe!

---

## 🏗️ 2. High-Level System Architecture

The project consists of three main layers working together:

```
                    AEROOPTIMA HIGH-LEVEL SYSTEM ARCHITECTURE
                    
 ┌────────────────────────────────────────────────────────────────────────┐
 │ 1. FRONTEND DASHBOARD (Next.js 16 + TailwindCSS + Three.js 3D + Plotly)│
 │   • Interactive control sliders (Speed, Altitude, Payload)             │
 │   • Real-Time 3D flight trajectory visualizer (Color-coded PSR trails)│
 │   • Telemetry charts (Power split kW, Fuel/SoC drain, Altitude/Speed)  │
 └───────────────────────────────────┬────────────────────────────────────┘
                                     │ HTTP POST /api/optimize
                                     ▼
 ┌────────────────────────────────────────────────────────────────────────┐
 │ 2. FASTAPI BACKEND SERVER (`backend/main.py`)                          │
 │   • Pydantic V2 Input Validation & Coupled Flight Envelope Rules       │
 │   • Triggers Outer Loop DEAP Genetic Algorithm                         │
 │   • Runs fine-grained re-simulation for high-resolution telemetry      │
 └──────────┬──────────────────────────────────────────────────▲──────────┘
            │ Runs Sizing                                      │ Simulation
            ▼                                                  │ Results
 ┌──────────────────────────────────────┐     ┌────────────────┴──────────┐
 │ 3A. OUTER LOOP: GA OPTIMIZER         │     │ 3B. INNER LOOP: GYMNASIUM │
 │ (`backend/optimizer.py`)             ├────►│ PHYSICS ENVIRONMENT       │
 │ • Population = 40, Generations = 15  │     │ (`backend/environment.py`)│
 │ • Searches Engine kW & Battery kWh   │     │ • ISA Troposphere Model   │
 │ • Evaluates MTOW ≤ 1000 kg Mass Lock │     │ • Oswald Drag Polar       │
 └──────────────────────────────────────┘     │ • 6-Phase Flight Telemetry│
                                              └───────────────────────────┘
```

---

## 🔄 3. End-to-End Data Flow (Step-by-Step Execution)

When a user opens the dashboard and clicks **"▶ EXECUTE GA OPTIMIZER"**, here is the exact sequence of events:

```
 STEP 1: UI Input Selection
 User adjusts sliders: Target Speed (250 km/h), Altitude (5000m), Payload (200 kg)
                           │
                           ▼
 STEP 2: HTTP POST Request
 Frontend sends JSON payload to `http://127.0.0.1:8000/api/optimize`
                           │
                           ▼
 STEP 3: Backend Pydantic Validation (`backend/main.py`)
 Validates coupled constraints (e.g. at Alt > 8000m, Payload is capped at ≤ 200 kg)
                           │
                           ▼
 STEP 4: Outer-Loop GA Execution (`backend/optimizer.py`)
 DEAP Genetic Algorithm initializes 40 random [Engine kW, Battery kWh] candidates
                           │
                           ▼
 STEP 5: Inner-Loop Flight Simulation (`backend/environment.py`)
 For each candidate, `UAVHybridEnv` runs a full 6-phase mission profile:
   Takeoff (0-200m) ──► Climb (200-5000m) ──► Cruise (5000m) ──► Loiter ──► Descent ──► Landing
 Calculates aerodynamic drag, lift, SFC load penalties, and battery C-rate every 60s
                           │
                           ▼
 STEP 6: Convergence & Best Sizing Selection
 GA completes 15 generations, selecting the individual with the longest endurance (Hours)
                           │
                           ▼
 STEP 7: Re-Simulation & Telemetry Gathering
 Backend re-runs the winning [Engine, Battery] design to capture clean step-by-step logs
                           │
                           ▼
 STEP 8: JSON Response to Frontend
 Backend sends optimal specs (Engine kW, Battery kWh, Mass breakdown) + Telemetry array
                           │
                           ▼
 STEP 9: Dashboard 3D & Chart Rendering
 Next.js renders the 3D aircraft flight path, status matrix table, and Plotly performance graphs!
```

---

## 📊 4. The 6 Mission Phases Explained Simply

Every flight in AeroOptima follows a continuous 6-phase trajectory:

| Phase ID | Name | What the Aircraft Is Doing | Engine / Motor Split (PSR) |
| :--- | :--- | :--- | :--- |
| **Phase 1** | `takeoff` | Accelerating on runway & lifting to 200m | **65% Motor + 35% Engine** (Peak Torque Boost) |
| **Phase 2** | `climb` | Climbing against gravity to 5,000m | **50% Motor + 50% Engine** (Sustained Climb) |
| **Phase 3** | `cruise` | Flying level at 250 km/h over long distances | **12% Motor + 88% Engine** (Optimal SFC Fuel Economy) |
| **Phase 4** | `loiter` | Holding racetrack orbit over reconnaissance target | **0% Motor + 100% Engine** (Mode A: Max Endurance) OR **100% Motor** (Mode B: Silent Stealth) |
| **Phase 5** | `descent` | Gliding down from 5,000m to 200m | **0% Power Needed** (Glide idle; potential energy recovery) |
| **Phase 6** | `landing` | Final glideslope approach to touchdown (5m) | **0% Power Needed** (Touchdown; mission complete +500 reward) |

---

## ⚖️ 5. Mass Budget & Weight Balance Rules

To prevent physically impossible aircraft designs, AeroOptima enforces strict mass balancing:

$$\text{MTOW (1,000 kg)} = W_{\text{airframe}} + W_{\text{payload}} + W_{\text{engine}} + W_{\text{motor}} + W_{\text{battery}} + W_{\text{fuel}}$$

```
                       1,000 kg MTOW MASS DISTRIBUTION
                       
 ┌──────────────────────────────────────────────────────────────────────────┐
 │ Airframe Structure (Carbon Composite): 350.0 kg (35.0%)                  │
 ├──────────────────────────────────────┬───────────────────────────────────┤
 │ Payload (Radar + EO/IR Camera):     │ Turboshaft Engine:                │
 │ 200.0 kg (20.0%)                    │ ~35.0 kg (3.5%)                   │
 ├───────────────────┬──────────────────┴──┬────────────────────────────────┤
 │ EMRAX Motor:      │ Battery Pack:       │ Jet A-1 Fuel Budget:           │
 │ 12.3 kg (1.23%)   │ 80.0 kg (8.0%)      │ ~322.7 kg (32.27%)             │
 └───────────────────┴─────────────────────┴────────────────────────────────┘
```

- If you increase **Battery Size (kWh)** $\rightarrow$ Battery gets heavier $\rightarrow$ Less room for **Fuel** $\rightarrow$ Cruise range drops!
- If you increase **Engine Size (kW)** $\rightarrow$ Engine gets heavier $\rightarrow$ Less room for **Fuel** $\rightarrow$ Endurance drops!
- The Genetic Algorithm's job is to find the **sweet spot** where engine weight, battery weight, and fuel mass achieve maximum flight hours!

---

> [!TIP]
> **Next Step for Team Members:** Read the companion guide [`codebase_walkthrough_and_developer_guide.md`](file:///d:/project/HAL/docs/project_analysis/codebase_walkthrough_and_developer_guide.md) to understand line-by-line how the Python backend and Next.js frontend code works!
