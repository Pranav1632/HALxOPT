# AeroOptima — Hybrid-Electric UAV Propulsion Optimization Platform
### IIT Indore × HAL Hackathon (Problem Statement PS-1)

AeroOptima is an AI-driven sizing and simulation platform designed to optimize the hybrid-electric propulsion architecture for a **1000 kg tactical fixed-wing UAV**. The platform couples a genetic algorithm (outer optimization loop) with a high-fidelity flight physics environment (inner loop) to size the engine power (kW) and battery capacity (kWh) for maximum mission endurance.

---

## 🏗️ Project Architecture

The workspace is organized into three main directory layers:

```
HAL/ (Root)
├── README.md                  # This file (Project Overview & Setup)
├── data/                      # UAV Component Specification Database
│   ├── aerodynamics.json      # Lift, drag, wingspan, and atmospheric constants
│   ├── battery_specs.json     # Li-Ion density, C-rate, and SoC limits
│   ├── motor_specs.json       # EMRAX motor ratings and weight
│   └── turboshaft_specs.json  # Reference turboshaft ratings and SFC curves
├── backend/                   # Python FastAPI & Physics Simulator
│   ├── environment.py         # Custom Gymnasium flight environment
│   ├── optimizer.py           # Genetic Algorithm sizing loop (DEAP)
│   └── main.py                # REST API and flight re-simulator
└── frontend/                  # Next.js 16 Web Dashboard
    └── src/
        ├── components/
        │   ├── FlightScene.tsx     # 3D Three.js tactical flight visualizer
        │   ├── TelemetryChart.tsx  # Plotly.js unified telemetry charts
        │   ├── TelemetryTable.tsx  # Scrollable propulsion status matrix
        │   └── Dashboard.tsx       # State management & parameter controls
        └── app/
            └── page.tsx            # Main page entrypoint
```

---

## ⚡ Setup & Running the Project

To run the full-stack application, open two separate terminal sessions:

### 1. Start the Backend (FastAPI)
Run the Python application using the pre-configured virtual environment:
```powershell
# In terminal 1 (root directory):
.\backend\.venv\Scripts\python .\backend\main.py
```
*The API will start running locally at **`http://127.0.0.1:8000`**.*

### 2. Start the Frontend (Next.js)
Install node modules (if not already installed) and start the Next.js development server:
```powershell
# In terminal 2 (navigate to frontend):
cd frontend
npm run dev
```
*The dashboard will be active in your browser at **`http://localhost:3000`**.*

---

## ⚙️Sizing & Optimization Framework

1. **Outer Optimization Loop (DEAP Genetic Algorithm):** Sizes two continuous parameters:
   * **Engine shaft rating:** $30\text{ kW} \le P_{engine} \le 120\text{ kW}$
   * **Battery pack capacity:** $5\text{ kWh} \le E_{batt} \le 50\text{ kWh}$
2. **Inner Simulation Loop (Gymnasium Environment):** Simulates a full 6-phase mission profile (Takeoff, Climb, Cruise, Loiter, Descent, Landing) using standard ISA atmosphere and Oswald aerodynamic drag models.
3. **Power-Split Strategy:** Governed by an intelligent heuristic rule (Zhang et al.) prioritizing the motor for high-torque phases (takeoff/climb) and the engine at optimal load factors during cruise.

---

## 🔒 Military Airworthiness Compliance (STANAG 4671)
* **Single Engine Safety:** If the battery pack fails, the UAV can maintain cruise flight indefinitely using the turboshaft engine alone ($60\text{ kW}$ available vs $55.8\text{ kW}$ cruise requirement).
* **Silent/Emergency Loiter:** If the turboshaft engine fails, the electric motor can run on battery power to sustain flight for **~34 minutes**, enabling emergency return-to-base (RTB).
* **Reserve Energy:** Sized to land with a combined energy reserve of at least **30 minutes** (VFR equivalent).
