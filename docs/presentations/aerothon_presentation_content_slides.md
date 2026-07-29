# AEROTHON 2026 — HAL × IIT Indore
## AeroOptima: AI-Driven Hybrid-Electric UAV Propulsion Optimizer

**Team Name:** [Enter Team Name]
**Participants:** [Member 1], [Member 2], [Member 3], [Member 4]

---

## Page 1 — PROBLEM UNDERSTANDING & MOTIVATION

### Subtopic: The Hybrid Energy Trade-Off in Military UAVs

- Pure fuel UAVs: long range but high thermal IR signature, inefficient at takeoff & climb peaks
- Pure electric UAVs: silent & low-IR but energy density too low for military-class endurance
- A **1000 kg MTOW UAV** with **200 kg payload** leaves no margin — every gram of propulsion must be optimally sized
- Hybrid-electric (turboshaft + motor + battery) unlocks the full design space — smaller engine, smarter power split
- **Core problem:** sizing engine (kW) + battery (kWh) simultaneously is a nonlinear, >10⁶ point search space — impossible to solve manually
- **Our solution:** Genetic Algorithm (outer loop) + full physics simulation (inner loop) finds the global optimum automatically

$$P_{required} = P_{aero} + P_{climb} = \tfrac{1}{2}\rho V^3 S C_D + m g V_z$$

> 📸 **[INSERT IMAGE — right/centre: side-by-side weight pie charts: pure-fuel UAV vs hybrid UAV showing the fuel vs battery + motor trade-off]**

---

## Page 2 — LITERATURE REVIEW / EXISTING APPROACHES

### Subtopic: Prior Art, Standards & the Gap We Fill

- **Zhang et al. (2021)** — Phase-aware heuristic power management for hybrid aircraft (IEEE Trans. Electrification) — basis of our PSR control policy
- **DEAP (Fortin & De Rainville, 2012)** — Standard Python genetic algorithm framework used in our outer sizing loop
- **NATO STANAG 4671** — Military UAS airworthiness: single-fault redundancy, reserve energy thresholds
- **MIL-HDBK-516C** — Failure of any single propulsion element must not cause loss of aircraft
- **EMRAX 228 Datasheet (2024)** — Validated mass (12.3 kg), power (55 kW cont.), efficiency (96%) used directly
- **Gap:** No existing open tool simultaneously optimises *sizing* (outer) AND *power management* (inner) for 1000 kg-class military UAVs

| Platform | MTOW | Architecture |
|---|---|---|
| MQ-9 Reaper | 4,760 kg | Pure turboprop |
| Pipistrel Taurus G4 | 550 kg | Series hybrid |
| **AeroOptima (Ours)** | **1,000 kg** | **Parallel hybrid** |

---

## Page 3 — PROPOSED METHODOLOGY & TECHNICAL APPROACH

### Subtopic: Nested GA + Physics Simulation Architecture

- **Outer loop:** DEAP Genetic Algorithm sizes two variables — engine power (30–120 kW) and battery capacity (5–50 kWh)
- **Inner loop:** Each GA candidate runs a full 6-phase mission in a custom Gymnasium environment (Takeoff → Climb → Cruise → Loiter → Descent → Landing)
- **Fitness function:** Maximize total endurance (hours); 60% penalty for incomplete missions; 0 if MTOW exceeded
- **PSR Policy (Zhang et al.):** Motor 65% at takeoff → 50% climb → 12% cruise → 0% loiter → 0% descent
- **Physics:** ISA atmosphere $\rho(h)$, Oswald drag polar, partial-load SFC curves, C-rate battery limits — all active every 10-second time step
- GA converges in 10–12 of 15 generations; population of 40 individuals

$$C_D = C_{D0} + \frac{C_L^2}{\pi \cdot AR \cdot e} \qquad \dot{m}_{fuel} = SFC_{eff}(load) \cdot P_{engine} \cdot \Delta t$$

> 📸 **[INSERT IMAGE — right: simple 2-box nested loop diagram: outer box "DEAP GA" → inner box "Gymnasium Simulation" with arrow labelled "evaluate fitness"]**

---

## Page 4 — DATA SOURCES & PREPROCESSING

### Subtopic: Validated Off-the-Shelf Component Database

*(Left column — bullets | Right box — image)*

**LEFT TEXT:**
- All specs loaded from JSON files — zero hardcoded values in simulation
- **Motor:** EMRAX 228 MV — 12.3 kg, 55 kW cont., 109 kW peak, 96% efficiency
- **Engine:** Scalable turboshaft — 35 kg @ 67.5 kW ref.; SFC 0.38 kg/kWh at ≥80% load; up to +40% SFC penalty at <50% throttle
- **Battery:** Panasonic 21700 NCA cells — 250 Wh/kg, 3C cont. / 5C peak, SoC window 10–95%
- **Airframe:** 350 kg structure, 14 m² wing, 15 m span → AR = 16.07 (high-endurance optimised)
- **Atmosphere:** ISA standard — $\rho(h) = \rho_0(1 - 2.256\times10^{-5}h)^{4.256}$

**RIGHT IMAGE BOX:**
> 📸 **[INSERT IMAGE — MTOW weight budget stacked bar: Airframe 350 kg (grey) | Payload 200 kg (indigo) | Engine ~35 kg (blue) | Motor 12.3 kg (emerald) | Battery (amber) | Fuel (red)]**

---

## Page 5 — MODEL ARCHITECTURE / IMPLEMENTATION PLAN

### Subtopic: Full-Stack Deployable AI Platform

- **Frontend:** Next.js 16 + TypeScript dashboard with live mission controls and scrubber playback
- **3D Visualiser:** Three.js + React-Three-Fiber — real-time UAV flight path, racetrack loiter orbit, PSR colour-coded trail (amber=battery, cyan=hybrid, green=engine)
- **2D Charts:** Plotly.js — power split area chart, SoC + fuel depletion, altitude + speed profile
- **Backend:** FastAPI (Python 3.11) serving `POST /api/optimize` — runs GA + full simulation, returns telemetry JSON
- **GA:** DEAP — cxBlend(α=0.5), mutGaussian, selTournament(k=3); Pop=40, Gen=15
- **Simulation:** Custom Gymnasium `UAVHybridEnv` — observation [alt, speed, SoC, fuel, P_req]; reward +500 on mission complete

**Data flow:** `React UI → FastAPI → DEAP GA → Gymnasium → Physics → Telemetry JSON → Dashboard`

> 📸 **[INSERT IMAGE — system architecture diagram: 5 nodes connected by arrows: "React Frontend" → "FastAPI" → "DEAP GA" → "Gymnasium Env" → "ISA + Oswald Physics". Dark glassmorphism card style]**

---

## Page 6 — EXPECTED OUTCOMES & EVALUATION METRICS

### Subtopic: GA-Discovered Optimal Design & Military Compliance

- Engine: **67.5 kW** | Battery: **20 kWh (80 kg)** | Fuel: **322.7 kg** | MTOW: **1000 kg ✅**
- **Endurance: ~19.7 hours** — discovered by the GA, not pre-set; maximised within hard MTOW constraint
- **Cruise:** 250 km/h at 5000 m | Fuel reserve at landing: 26.9 min engine-only ✅
- **STANAG 4671 — Engine failure:** Battery-only loiter supplies 55 kW vs 28.9 kW required → **+26.1 kW margin ✅**
- **MIL-HDBK-516C — Motor failure:** Engine-only cruise supplies 60 kW vs 55.8 kW required → **+4.2 kW margin ✅**
- **Simulation quality:** 0 power deficits | 0 stall events ($C_L < 1.6$ throughout) | GA converges by Gen 10–12

> 📸 **[INSERT IMAGE — telemetry power split chart screenshot: blue turboshaft area + emerald motor area + red dashed P_req line over 20 hours with phase labels]**

---

## Page 7 — TEAM COMPOSITION & CONTRIBUTIONS

### Subtopic: Roles & Responsibilities

| Member | Role | Key Contribution |
|---|---|---|
| [Member 1] | ML / Optimisation Lead | DEAP GA design, fitness function, chromosome encoding |
| [Member 2] | Aerospace Physics & Backend | Gymnasium env, ISA model, PSR policy, FastAPI |
| [Member 3] | Frontend & 3D Visualisation | Three.js flight scene, Plotly charts, Next.js dashboard |
| [Member 4] | Systems Integration & Validation | STANAG 4671 checks, redundancy analysis, documentation |

**Stack:** Python · FastAPI · DEAP · Gymnasium · Next.js 16 · Three.js · Plotly.js · TypeScript

> 📸 **[INSERT IMAGE — team photo OR a simple 4-node team structure diagram with roles]**

---

## Page 8 — APPENDIX & REFERENCES

### Subtopic: Key Equations & References

**Core equations:**

| Symbol | Formula | Meaning |
|---|---|---|
| $C_D$ | $C_{D0} + C_L^2/(\pi AR e)$ | Oswald drag polar |
| $P_{shaft}$ | $(P_{aero}+P_{climb})/\eta_{prop}$ | Total shaft power |
| $\dot{m}_{fuel}$ | $SFC_{eff}\cdot P_{eng}\cdot\Delta t$ | Fuel burn rate |
| $\Delta SoC$ | $P_{mot}\cdot\Delta t/(\eta_{mot}\cdot E_{batt})$ | Battery drain |

**References:**
1. Zhang et al. (2021) — IEEE Trans. Transportation Electrification
2. Fortin & De Rainville (2012) — DEAP, JMLR 13:2171–2175
3. NATO STANAG 4671 (2009) — UAS Airworthiness Requirements
4. MIL-HDBK-516C (2014) — Airworthiness Certification Criteria
5. EMRAX d.o.o. (2024) — EMRAX 228 Motor Datasheet
6. ICAO Doc 7488 (2019) — Standard Atmosphere Manual
7. Raymer (2018) — Aircraft Design: A Conceptual Approach, AIAA

---

*© 2026 AeroOptima Team — AEROTHON 2026, HAL × IIT Indore*
