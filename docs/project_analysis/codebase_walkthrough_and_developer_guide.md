# 💻 Codebase Walkthrough, Quickstart & Team FAQ Guide

> **Project:** AeroOptima — Tactical Hybrid-Electric UAV Optimization Platform (HAL × IIT Indore)  
> **Location:** `docs/project_analysis/codebase_walkthrough_and_developer_guide.md`  
> **Purpose:** A practical, line-by-line codebase walkthrough, local setup guide, and FAQ to help any team member run, modify, and extend the project code independently.

---

## 🚀 1. How to Run the Project Locally (Quickstart)

### Prerequisites
- **Python 3.10+** (with `pip`)
- **Node.js 18+** (with `npm`)

---

### Step 1: Run the FastAPI Backend Server
Open a terminal in the root directory `d:\project\HAL`:

```bash
# Navigate to backend folder
cd backend

# (Optional) Create a virtual environment
python -m venv venv
# On Windows:
venv\Scripts\activate

# Install backend dependencies
pip install -r requirements.txt

# Start the FastAPI server
python main.py
```

- **Backend Status URL:** `http://127.0.0.1:8000/api/health`
- **Interactive API Documentation (Swagger UI):** `http://127.0.0.1:8000/docs`

---

### Step 2: Run the Next.js Frontend Dashboard
Open a **second terminal** in `d:\project\HAL`:

```bash
# Navigate to frontend folder
cd frontend

# Install frontend dependencies
npm install

# Start the Next.js development server
npm run dev
```

- **Dashboard UI URL:** `http://localhost:3000`

---

## 📂 2. Codebase Directory Map

```
d:/project/HAL/
├── backend/                        # Python Backend Engine
│   ├── environment.py              # Gymnasium Simulation Environment & Physics Engine (588 lines)
│   ├── optimizer.py                # DEAP Genetic Algorithm Outer Loop (257 lines)
│   ├── main.py                     # FastAPI Endpoints & Pydantic Validation (208 lines)
│   ├── test_env.py                 # Smoke test script for physical simulation
│   └── requirements.txt            # Python dependencies (fastapi, deap, gymnasium, numpy)
│
├── data/                           # JSON Physical Constants & Hardware Datasheets
│   ├── aerodynamics.json           # Wing area, wingspan, drag polar CD0, Oswald e
│   ├── battery_specs.json          # Energy density (250 Wh/kg), C-rate limits, SoC bounds
│   ├── motor_specs.json            # EMRAX 228 motor specs (12.3 kg, 55 kW cont, 96% eff)
│   └── turboshaft_specs.json       # Turboshaft engine baseline specs & scaling factors
│
├── frontend/                       # Next.js 16 Web Dashboard
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx            # Entry point rendering <Dashboard />
│   │   │   ├── layout.tsx          # Global HTML layout & metadata
│   │   │   └── globals.css         # Tailwind & custom scrollbar styles
│   │   ├── components/
│   │   │   ├── Dashboard.tsx       # Main 3-panel UI layout, state & slider controls
│   │   │   ├── FlightScene.tsx     # Three.js 3D WebGL flight scene & visualizer
│   │   │   ├── TelemetryChart.tsx  # Plotly.js time-series charts (Power, Fuel, SoC)
│   │   │   └── TelemetryTable.tsx  # Status Matrix table for step-by-step telemetry
│
└── docs/                           # Complete Documentation Ecosystem (25+ files)
    ├── doc2_glossary/              # Domain, Component, Mission Phase & Constraint Glossaries
    ├── aerospace_physics/          # Physics reports, thermal analysis & formula sheets
    ├── rl_ml_strategy/             # RL integration roadmap, pitch innovations & audits
    └── project_analysis/           # Architecture guides, validation reports & component specs
```

---

## 🔬 3. Key Backend Files Explained (Line-by-Line Guide)

### 3.1 `backend/environment.py` — The Physics Engine
This is the core simulation environment where aircraft physics lives. It implements a custom **Gymnasium Environment** (`UAVHybridEnv`).

Key Methods:
- **`__init__()` (Lines 42–146):** Loads constants from `/data/*.json`, calculates component weights ($W_{\text{engine}}, W_{\text{motor}}, W_{\text{battery}}$), computes initial fuel capacity, and sets up Gym Observation and Action spaces.
- **`_atmosphere(altitude_m)` (Lines 168–177):** ISA Troposphere model computing air density $\rho(h)$ at any given altitude.
- **`_stall_speed(weight, rho)` (Lines 182–185):** Calculates minimum un-stalled flying speed $V_{\text{stall}} = \sqrt{\frac{2 W g}{\rho S C_{L,\max}}}$.
- **`_compute_power_required()` (Lines 206–234):** Calculates total mechanical shaft power required ($P_{\text{req}} = \frac{P_{\text{aero}} + P_{\text{climb}}}{\eta_{\text{prop}}}$) using Oswald drag polar.
- **`_effective_sfc(engine_power_kw)` (Lines 238–255):** Applies partial-load fuel penalties when engine operates below 80% throttle.
- **`_heuristic_psr(phase, soc, fuel_ratio)` (Lines 260–307):** Rule-based power management policy determining Power Split Ratio (PSR) for each flight phase.
- **`step(action)` (Lines 375–587):** Advances the simulation by `dt` seconds, updates battery SoC, burns fuel, increments altitude, handles phase transitions, and returns state observation.

---

### 3.2 `backend/optimizer.py` — The Genetic Algorithm
This file optimizes the propulsion system sizing using the **DEAP Genetic Algorithm** framework.

Key Functions:
- **`load_bounds()` (Lines 31–41):** Loads minimum and maximum sizing bounds for engine (30–120 kW) and battery (5–50 kWh).
- **`evaluate_individual()` (Lines 43–98):** Runs a full simulation in `UAVHybridEnv` for a candidate `[engine_kw, battery_kwh]` pair and returns total endurance hours as the fitness score.
- **`optimize_propulsion()` (Lines 100–241):** Sets up DEAP toolbox, initializes a population of 40 individuals, runs crossover (`cxBlend`) and mutation (`mutGaussian`) over 15 generations, and returns the winning individual.

---

### 3.3 `backend/main.py` — FastAPI REST API
This file connects the Python backend to the Next.js frontend web UI.

Key Endpoints:
- **`POST /api/optimize` (Lines 125–200):** Receives target speed, altitude, payload, and loiter options from the UI. Runs DEAP GA optimization, re-simulates the best UAV design with 60s step intervals, and returns JSON payload with optimal specs and flight telemetry.
- **`@model_validator validate_flight_envelope` (Lines 87–102):** Pydantic model validator enforcing coupled flight envelope rules (e.g. altitude > 8000m caps payload at 200 kg).

---

## ❓ 4. Frequently Asked Questions (Team FAQ)

### Q1: Why do we use a Parallel Hybrid layout instead of Pure Electric?
**Answer:** Pure electric aircraft carrying 200 kg payload run out of battery in ~40 minutes because current batteries have low energy density ($250\text{ Wh/kg}$). Jet A-1 fuel has **$12,000\text{ Wh/kg}$** (48× higher!). A parallel hybrid layout lets us use a lightweight gas engine for long-distance cruise (20+ hours range) while using a compact electric motor for takeoff torque boost and 40 minutes of silent stealth loiter!

### Q2: What is the Power Split Ratio (PSR)?
**Answer:** PSR is a single number between $0.0$ and $1.0$ that controls who drives the propeller:
- **$\text{PSR} = 0.0$:** 100% Turboshaft Engine (0% Motor) $\rightarrow$ Used during cruise for best fuel economy.
- **$\text{PSR} = 0.5$:** 50% Engine + 50% Motor $\rightarrow$ Used during climb for sustained climb power.
- **$\text{PSR} = 1.0$:** 0% Engine + 100% Motor $\rightarrow$ Used during Silent Stealth Loiter (ICE shut down).

### Q3: How do I change the default target cruise speed or altitude in the backend?
**Answer:** Open `backend/environment.py`. In `__init__()`, default values are set in function parameters:
```python
target_speed_kmh: float = 250.0,
target_altitude: float = 5000.0,
```
Or simply adjust the sliders on the frontend dashboard — the UI sends these values dynamically to `/api/optimize`!

### Q4: Can I run a quick test without starting the Next.js frontend?
**Answer:** Yes! Run `python backend/test_env.py`. It runs a smoke test of `UAVHybridEnv` directly in your terminal, printing out the mass budget, initial observation vector, flight time, and phase timeline summary!

### Q5: How do I add a new physical constant or hardware specification?
**Answer:** Do not hardcode constants in Python! Edit the corresponding JSON file in `data/` (e.g., `data/aerodynamics.json` or `data/battery_specs.json`). `UAVHybridEnv` automatically loads all JSON files into Python attributes on startup via `_load_constants()`.

---

> [!TIP]
> **Happy Coding!** You now have all the knowledge needed to run, test, and develop AeroOptima independently. If you encounter any bugs, check the terminal logs or review `docs/project_analysis/full_realism_validation_report.md`.
