# AEROTHON 2026 — HAL × IIT Indore
## Hybrid-Electric Propulsion Sizing & Sizing Optimization for 1000 kg Fixed-Wing UAV

This document contains the slide-by-slide content for your final presentation. Use this to populate your PowerPoint/Slides template. 

---

### Slide 1: Title & Team Details
* **Slide Title:** Conceptual Design & Optimization of a Hybrid-Electric Propulsion System for a 1000 kg Fixed-Wing UAV
* **Subtitle:** AEROTHON 2026 — Team Submission
* **Collaborative Partners:** Hindustan Aeronautics Limited (HAL) & Indian Institute of Technology Indore (IITI)
* **Team Details:**
  * **Team Name:** *[Enter Team Name]*
  * **Participants:** *[Member 1, Member 2, Member 3, Member 4]*
* **Visual Layout:**
  * Clean dark background matching the console style.
  * **[PLACEHOLDER: Main App UI Screenshot]** -> Insert a screenshot of the AeroOptima dashboard with the 3D orbit active.

---

### Slide 2: Problem Understanding & Motivation
* **Subtopic:** The Sizing Challenge for Medium-Altitude Long-Endurance (MALE) UAVs
* **Challenge Context:**
  * Design a hybrid-electric architecture for a **1,000 kg Maximum Take-Off Weight (MTOW)** fixed-wing UAV.
  * Must support a mission profile spanning altitudes of **3 km to 10 km** and speeds around **250 km/h**.
* **The Core Problem:**
  * Conventional turboshafts are sized for peak takeoff power, leading to excess weight and fuel-inefficient cruise phases.
  * Pure electric configurations suffer from battery weight penalties (low energy density of Li-ion).
* **The Motivation:**
  * Parallel hybrid-electric propulsion allows the **electric motor to handle takeoff/climb peak torque**, allowing the **gas turbine (turboshaft) to be down-sized** and run at its optimal specific fuel consumption (SFC) during cruise.
* **Core Physics Constraint Formula:**
  $$W_{MTOW} = W_{airframe} + W_{payload} + W_{engine} + W_{motor} + W_{battery} + W_{fuel} \le 1000\text{ kg}$$
* **Visual Layout:**
  * Split-column layout. Left: bullet points. Right: **[PLACEHOLDER: UAV Weight Budget Stacked Bar Chart]** -> Export the MTOW budget bar chart from the Left Sidebar of the app.

---

### Slide 3: Literature Review & Existing Approaches
* **Subtopic:** Energy Management and Parallel Hybrid Sizing Heuristics
* **Existing Approaches:**
  * *Rule-Based Heuristic Control (Zhang et al. Strategy):* Establishes power split margins based on flight phase. Electric motor provides peak power during takeoff; turboshaft handles cruise.
  * *Reinforcement Learning (RL - Gymnasium):* Provides adaptive power splits by tracking states but lacks physical weight constraints during training.
* **Limitations of Standalone Methods:**
  * Genetic Algorithms (GA) size components but ignore transient telemetry constraints.
  * RL models fail to ensure that the candidate motor and battery fit within the 1000 kg weight envelope on startup.
* **Our Contribution (Hybrid GA + Heuristic Framework):**
  * Integrated **DEAP Genetic Algorithm** for outer-loop sizing (sizing turboshaft power and battery capacity).
  * Integrated **Gymnasium-style physical environment** for inner-loop simulation, utilizing a rule-based power-split heuristic to calculate real-world endurance.
* **Visual Layout:**
  * Flow diagram or block diagram representing the two loops.
  * **[PLACEHOLDER: System Diagram Image]** -> Draw a block diagram showing:
    `[GA Optimizer (Sizes kW & kWh)] -> [UAV Environment (Calculates flight profile)] -> [Endurance (Fitness Score) back to GA]`.

---

### Slide 4: Proposed Methodology & Technical Approach
* **Subtopic:** Parallel Hybrid Propulsion Architecture
* **Sizing Methodology:**
  * **Outer Loop (Genetic Sizing):** Generates candidate pairs of $[P_{engine}, E_{battery}]$.
  * **Inner Loop (Flight Telemetry Simulation):** Simulates the 6-phase mission profile at 60s intervals.
* **Aerodynamic Model Formulas:**
  * Lift coefficient ($C_L$) required to maintain altitude:
    $$C_L = \frac{2 W g}{\rho V^2 S}$$
  * Drag coefficient ($C_D$) using Oswald efficiency:
    $$C_D = C_{D0} + \frac{C_L^2}{\pi A R e}$$
  * Power required for flight ($P_{req}$):
    $$P_{req} = \left( \frac{1}{2} \rho V^3 S C_D + W g \cdot v_y \right) \cdot \frac{1}{\eta_{prop}}$$
    *(Where $v_y$ is climb rate, $\rho$ is altitude-dependent air density, and $\eta_{prop}$ is propeller efficiency).*
* **Visual Layout:**
  * Slide should highlight the aerodynamic equations in a clean box.
  * **[PLACEHOLDER: 3D Flight Profile Orbit Path Video]** -> Insert a 10-second screen-recording clip of the UAV orbiting in the 3D racetrack path with waypoint markers.

---

### Slide 5: Data Sources & Preprocessing
* **Subtopic:** Curated Aerospace Data Sheets & Atmospheric Models
* **Constants Loaded Dynamically (No Hardcoding):**
  * **Electric Motor Specifications:** Sourced from the **EMRAX 208 MV** datasheet. Fixed mass of $9.4\text{ kg}$, continuous power $38\text{ kW}$, peak power $68\text{ kW}$.
  * **Turboshaft Scaling Specs:** Reference power $60\text{ kW}$, reference weight $30\text{ kg}$ (linear power-to-weight scaling). Specific Fuel Consumption (SFC) = $0.38\text{ kg/kWh}$.
  * **Battery Specifications:** Energy density of $250\text{ Wh/kg}$ with continuous discharge limits of $3C$ and peak limits of $5C$.
* **Atmospheric Preprocessing (ISA Model):**
  * Air density $\rho$ is recalculated dynamically at every altitude step using the lapse rate:
    $$T(h) = T_0 - L \cdot h$$
    $$\rho(h) = \rho_0 \left(1 - \frac{L \cdot h}{T_0}\right)^{\frac{g}{R \cdot L} - 1}$$
* **Visual Layout:**
  * Two-column table. Left: Component (Motor, Engine, Battery). Right: Source specs loaded from the `/data` folder.

---

### Slide 6: Model Architecture & Implementation Plan
* **Subtopic:** Core Tech Stack & Processing Flow
* **Framework Stack:**
  * **Backend:** FastAPI (Python), DEAP (Genetic Algorithm), Pydantic (data parsing).
  * **Frontend:** Next.js (React), Tailwind CSS, Three.js via React Three Fiber (interactive WebGL flight path), Plotly.js (telemetry graphing).
* **The Optimization Loop Sequence:**
  1. User inputs constraints (Speed, Altitude, Payload, Fuel Fraction, Loiter Toggle).
  2. DEAP initializes $40$ individuals over $15$ generations.
  3. Fitness evaluated as:
     $$\text{Fitness} = \text{Endurance (Hours)} \times \text{Safety Penalties}$$
  4. Real-time telemetry is generated, streamed to frontend, and mapped to the 3D canvas.
* **Visual Layout:**
  * **[PLACEHOLDER: Telemetry Graphs Screenshot]** -> Insert a screenshot of the "Telemetry Charts" tab showing the SOC drainage, Fuel consumption, and Power Split curves over time.

---

### Slide 7: Expected Outcomes & Evaluation Metrics
* **Subtopic:** Verification and Performance Outcomes
* **Performance Metrics:**
  * **Endurance:** Optimized flight time in hours.
  * **Mass Efficiency:** Percentage of MTOW allocated to fuel vs battery weight.
  * **Climb Power Buffer:** Difference between available hybrid power and climb demand.
* **Optimization Outcomes Table (Example Case: 250 km/h, 5000m, 200kg):**
  * **Optimal Engine Size:** $\sim 64.4\text{ kW}$
  * **Optimal Battery Size:** $\sim 13.7\text{ kWh}$
  * **Initial Fuel Load:** $\sim 367.6\text{ kg}$
  * **Total Endurance Achieved:** $\sim 21.17\text{ hours}$
* **Visual Layout:**
  * Highlight the performance table on the left.
  * **[PLACEHOLDER: UI Telemetry Matrix Table Screenshot]** -> Insert a screenshot of the "Propulsion Status Matrix" highlighting the step-by-step telemetry rows.

---

### Slide 8: Future Prospects of Machine Learning & AI Integration
* **Subtopic:** Advancing from Rule-Based Sizing to Adaptive Intelligent Flight Control
* **1. Deep Reinforcement Learning for Real-Time Energy Management (EMS):**
  * Transition from static heuristic rules (Zhang et al.) to a **Deep Q-Network (DQN) or Soft Actor-Critic (SAC)** neural network agent.
  * The RL agent would dynamically adjust the Power Split Ratio ($u$) on every frame by sensing live atmospheric changes (e.g. wind shear, turbulence) and temperature-related battery degradation to maximize range.
* **2. Neural Network Surrogate Models for Sizing Optimization:**
  * Sizing loops require running 10,000+ simulation steps which takes seconds.
  * We can train a **Multi-Layer Perceptron (MLP)** surrogate model on offline CFD (Computational Fluid Dynamics) wing data and engine dynamometer charts.
  * This surrogate model would predict endurance instantly ($< 1\text{ ms}$), speeding up GA optimizations by a factor of 1000.
* **3. Predictive Maintenance & Prognostics (PHM):**
  * Integrate **LSTMs or GRU Recurrent Networks** to track battery capacity fade and gas-path degradation in the turboshaft.
  * Predicts the **Remaining Useful Life (RUL)** of components during long-endurance missions.
* **Visual Layout:**
  * Diagram showing: `[Sensors: Wind/Temp/SoC] -> [RL Actor Network] -> [Dynamic Power Split Action]`.

---

### Slide 9: Team Composition & Contributions
* **Subtopic:** Distribution of Engineering & Software Workloads
* **Sizing/Aerodynamic Modeling:**
  * *Participant 1:* Designed aerodynamic flight dynamics environment (`environment.py`) & atmospheric ISA calculations.
* **Optimization Engine:**
  * *Participant 2:* Implemented DEAP genetic algorithm, boundary clipping, and penalty functions (`optimizer.py`).
* **Backend API & Data Architecture:**
  * *Participant 3:* Constructed FastAPI endpoints, CORS, data loaders, and schema validation (`main.py`).
* **Frontend & Visualization:**
  * *Participant 4:* Programmed Next.js UI console, Three.js visualizer (`FlightScene.tsx`), and Plotly chart trackers.

---

### Slide 10: Appendix & References
* **Subtopic:** Core Mathematical Models & Data Citations
* **A. APPENDIX: GOVERNING PHYSICS EQUATIONS**
  1. **Total Power Required ($P_{req}$):**
     $$P_{req} = \left(\frac{1}{2}\rho V^3 S C_D\right) + (m g v_z)$$
  2. **Fuel Consumption Rate ($\dot{m}_{fuel}$):**
     $$\dot{m}_{fuel} = P_{engine} \times SFC$$
  3. **Battery State of Charge ($SoC$) Dynamics:**
     $$SoC_{t+\Delta t} = SoC_t - \left(\frac{(P_{motor} / \eta_{motor}) \times \Delta t}{E_{max}}\right)$$
* **B. REFERENCES & DATA SOURCES**
  * *Zhang, C., et al. (2022).* "A comprehensive review of electrochemical hybrid power supply systems and intelligent energy managements for unmanned air vehicles." *Energy and AI*.
  * *Haan, J., et al. (2021).* "Are commuter air taxis coming to your city?" *Transportation Research Part C*.
  * *EMRAX Technical Specifications (208 & 228 MV).*
  * *BatteryArchive.org & NASA Prognostics Data Repository.*
  * *UIUC Airfoil Database & NASA OpenVSP.*
* **Live Application URL:** Running locally at `http://localhost:3000`
* **Visual Layout:**
  * Place a large QR code or link to your code repository.
  * **[PLACEHOLDER: Full Dashboard View Screenshot]** -> Insert a high-resolution, full-screen capture of the dashboard console showing the collapsible matrix expanded, the 3D terrain grid visible, and the flight path trails active.

---

*© 2026 AeroOptima Team — AEROTHON 2026, HAL × IIT Indore*
