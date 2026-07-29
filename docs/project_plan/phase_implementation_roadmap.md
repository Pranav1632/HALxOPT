# Phase-by-Phase Technical Implementation & Milestone Roadmap
## AEROTHON 2026 — Team HAL × IIT Indore

---

## 1. Milestone Roadmap Matrix

```
┌────────────────────────────────────────────────────────────────────────┐
│                        MILESTONE ROADMAP MATRIX                        │
├─────────┬────────────────────────────┬─────────────────────────────────┤
│ Phase   │ Title / Deliverable        │ Core Validation Metric          │
├─────────┼────────────────────────────┼─────────────────────────────────┤
│ Phase 1 │ Foundation Flight Physics  │ ISA density lapse & drag polar  │
│ Phase 2 │ GA Optimization Engine     │ Max endurance @ MTOW ≤ 1000 kg  │
│ Phase 3 │ Web Console & 3D WebGL     │ Live 3D orbit telemetry streaming│
│ Phase 4 │ Environmental Derating     │ High-altitude altitude/temp drop│
│ Phase 5 │ RL Disturbance Controller  │ SubprocVecEnv CPU PPO training  │
└─────────┴────────────────────────────┴─────────────────────────────────┘
```

---

## 2. Detailed Technical Deliverables by Phase

### Phase 1: Foundation Flight Physics Engine (`environment.py`)
* **Deliverables:** Custom Gymnasium class `UAVHybridEnv(gym.Env)` simulating 6 mission phases (Takeoff, Climb, Cruise, Loiter, Descent, Landing).
* **Equations Implemented:**
  * Troposphere air density: $\rho(h) = \rho_0 (1 - 2.256\times 10^{-5} h)^{4.256}$
  * Oswald drag polar: $C_D = C_{D0} + C_L^2 / (\pi A R e)$
  * Propeller shaft power: $P_{\text{shaft}} = (P_{\text{aero}} + P_{\text{climb}}) / \eta_{\text{prop}}$
  * Partial-load SFC penalty: $+15\%$ penalty at $50-80\%$ load; up to $+40\%$ penalty below $50\%$ load.

---

### Phase 2: Outer-Loop Genetic Sizing Engine (`optimizer.py`)
* **Deliverables:** DEAP framework configuration sizing two continuous design variables:
  $$\text{Individual } I = [P_{\text{engine, kW}}, E_{\text{battery, kWh}}]$$
* **Search Space:** $P_{\text{engine}} \in [30.0, 120.0]\text{ kW}$, $E_{\text{battery}} \in [5.0, 50.0]\text{ kWh}$.
* **Fitness Evaluation:** Runs 6-phase mission profile; returns flight time in hours with a 60% penalty for uncompleted profiles or 0 for MTOW violation.

---

### Phase 3: Interactive Web Console & 3D WebGL Visualization (`frontend/`)
* **Deliverables:** Next.js 16 + React 19 + Three.js flight console.
* **Key Components:**
  * `FlightScene.tsx`: Interactive WebGL 3D racetrack orbit visualizer with color-coded power split trails (cyan = hybrid, amber = electric, green = engine).
  * `TelemetryChart.tsx`: Plotly.js charts tracking live SoC depletion, fuel mass burn, and power draw.
  * `Dashboard.tsx`: Controls for cruise speed, altitude, payload mass, fuel fraction, and silent loiter toggles.

---

### Phase 4: High-Altitude Environmental Fidelity (`docs/project_analysis/`)
* **Deliverables:** Altitude power lapse (Gagg-Ferrar model), low-temp battery resistance spikes ($R_{\text{int}}$), zero-wind headwind correction models.
* **Equations:**
  $$\text{Engine Altitude Power Ratio: } \frac{P_{\text{alt}}}{P_{\text{SL}}} = \sigma - \frac{1 - \sigma}{7.55}$$

---

### Phase 5: Intelligent RL & CPU Parallel Training Roadmap (`train_rl.py`)
* **Deliverables:** Multiprocessed CPU training script using `stable-baselines3` PPO algorithm (`SubprocVecEnv` across 4-8 CPU cores).
* **Validation:** Verification that RL policy executes PSR decisions in $< 0.1\text{ ms}$ during live flight.
